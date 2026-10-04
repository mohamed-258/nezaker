import os
import re
import time
import uuid
import pymupdf
import database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SNIPPETS_DIR = os.path.join(BASE_DIR, "static", "book_snippets")
BOOKS_DIR = os.path.join(BASE_DIR, "reference_books")
os.makedirs(SNIPPETS_DIR, exist_ok=True)
os.makedirs(BOOKS_DIR, exist_ok=True)

def index_book_pdf(book_id: int, pdf_path: str):
    """
    Extracts text from each page of the PDF and saves into book_page_index table.
    Returns total page count.
    """
    doc = pymupdf.open(pdf_path)
    total_pages = len(doc)
    conn = database.get_connection()
    cur = conn.cursor()

    # Clear any previous index for this book
    cur.execute("DELETE FROM book_page_index WHERE book_id=?", (book_id,))

    rows = []
    for page_idx in range(total_pages):
        page_num = page_idx + 1
        page = doc[page_idx]
        text = page.get_text("text")
        rows.append((book_id, page_num, text))

        if len(rows) >= 50:
            cur.executemany(
                "INSERT INTO book_page_index (book_id, page_number, text_content) VALUES (?, ?, ?)",
                rows
            )
            conn.commit()
            rows = []

    if rows:
        cur.executemany(
            "INSERT INTO book_page_index (book_id, page_number, text_content) VALUES (?, ?, ?)",
            rows
        )
        conn.commit()

    # Update total pages in reference_books
    cur.execute("UPDATE reference_books SET total_pages=? WHERE id=?", (total_pages, book_id))
    conn.commit()
    conn.close()
    doc.close()
    return total_pages

def search_relevant_pages(book_id: int, query_text: str, max_pages: int = 5) -> list:
    """
    Finds most relevant page numbers and snippets for a given question / query using keyword matching.
    """
    # Clean query into keywords
    words = re.findall(r'[a-zA-Z0-9_\u0600-\u06FF]{3,}', query_text)
    stop_words = {
        'what', 'which', 'where', 'when', 'who', 'how', 'with', 'from', 'this', 'that', 'these',
        'those', 'following', 'about', 'most', 'likely', 'correct', 'true', 'false', 'except',
        'patient', 'year', 'male', 'female', 'shows', 'present', 'presents', 'history', 'examination',
        'ماذا', 'ماهو', 'ماهي', 'اين', 'كيف', 'متى', 'لماذا', 'اي', 'التي', 'الذي', 'صحيح', 'خطأ'
    }
    keywords = [w.lower() for w in words if w.lower() not in stop_words]

    if not keywords:
        keywords = [w.lower() for w in words[:5]]

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT page_number, text_content FROM book_page_index WHERE book_id=?", (book_id,))
    all_pages = cur.fetchall()
    conn.close()

    if not all_pages:
        return []

    scored_pages = []
    for row in all_pages:
        page_num = row['page_number']
        text = (row['text_content'] or '').lower()
        if not text:
            continue

        score = 0
        for kw in keywords:
            if kw in text:
                score += text.count(kw)

        if score > 0:
            scored_pages.append((score, page_num, row['text_content']))

    # Sort descending by score
    scored_pages.sort(key=lambda x: x[0], reverse=True)
    return scored_pages[:max_pages]

def generate_highlighted_snippet(pdf_path: str, page_number: int, evidence_quote: str, book_id: int = 0) -> dict:
    """
    Opens page_number (1-indexed), finds evidence_quote or key sentences,
    applies yellow highlight annotation, crops the area with context, and exports a high-res PNG.
    Returns dict with image_url, local_path, and page_number.
    """
    if not os.path.exists(pdf_path):
        return {"error": "PDF file not found"}

    doc = pymupdf.open(pdf_path)
    total_pages = len(doc)
    if page_number < 1 or page_number > total_pages:
        page_number = min(max(1, page_number), total_pages)

    page = doc[page_number - 1]
    page_rect = page.rect

    matched_rects = []
    clean_quote = (evidence_quote or '').strip()

    # Try exact search first
    if clean_quote and len(clean_quote) > 4:
        # Search whole quote
        rects = page.search_for(clean_quote)
        if rects:
            matched_rects.extend(rects)
        else:
            # Split quote into sub-phrases of 4-6 words
            words = clean_quote.split()
            chunk_size = 5
            for i in range(0, len(words), chunk_size):
                sub = " ".join(words[i:i+chunk_size])
                if len(sub) > 8:
                    sub_rects = page.search_for(sub)
                    if sub_rects:
                        matched_rects.extend(sub_rects)

    # If still no rects, search for prominent nouns/phrases
    if not matched_rects and clean_quote:
        meaningful_words = [w for w in re.findall(r'[a-zA-Z0-9_\u0600-\u06FF]{4,}', clean_quote)]
        for w in meaningful_words[:6]:
            w_rects = page.search_for(w)
            if w_rects:
                matched_rects.extend(w_rects)

    # Highlight the matched rects
    if matched_rects:
        for r in matched_rects:
            try:
                annot = page.add_highlight_annot(r)
                # Vibrant yellow highlight
                annot.set_colors(stroke=(1.0, 0.9, 0.1))
                annot.update()
            except Exception:
                pass

        # Compute combined bounding box
        x0 = min(r.x0 for r in matched_rects)
        y0 = min(r.y0 for r in matched_rects)
        x1 = max(r.x1 for r in matched_rects)
        y1 = max(r.y1 for r in matched_rects)

        # Expand context vertically & horizontally
        pad_y_top = 70.0
        pad_y_bottom = 90.0
        pad_x = 25.0

        clip_rect = pymupdf.Rect(
            max(0, x0 - pad_x),
            max(0, y0 - pad_y_top),
            min(page_rect.width, x1 + pad_x),
            min(page_rect.height, y1 + pad_y_bottom)
        )
    else:
        # If nothing matched, crop the middle third of the page
        clip_rect = pymupdf.Rect(
            0,
            page_rect.height * 0.15,
            page_rect.width,
            page_rect.height * 0.70
        )

    # Render clip with 2.2x zoom for crisp medical readability
    zoom = 2.2
    mat = pymupdf.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, clip=clip_rect, alpha=False)

    filename = f"snippet_b{book_id}_p{page_number}_{int(time.time())}_{uuid.uuid4().hex[:6]}.png"
    local_path = os.path.join(SNIPPETS_DIR, filename)
    pix.save(local_path)

    doc.close()

    image_url = f"/static/book_snippets/{filename}"
    return {
        "status": "success",
        "image_url": image_url,
        "local_path": local_path,
        "filename": filename,
        "page_number": page_number
    }
