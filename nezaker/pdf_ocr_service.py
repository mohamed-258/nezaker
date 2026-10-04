import os
import re
import time
import sqlite3
import pypdfium2 as pdfium
import pytesseract
from PIL import Image
import database

# Directory for user-uploaded exam PDFs
UPLOAD_EXAMS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "user_uploaded_exams")
os.makedirs(UPLOAD_EXAMS_DIR, exist_ok=True)

# Configure Tesseract OCR binary path
TESSERACT_CANDIDATE_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    r"C:\Users\shawk\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
]

def init_tesseract():
    for p in TESSERACT_CANDIDATE_PATHS:
        if os.path.exists(p):
            pytesseract.pytesseract.tesseract_cmd = p
            return p
    return None

init_tesseract()

def clean_extracted_text(text: str) -> str:
    """Removes common scanner artifacts and watermarks."""
    if not text:
        return ""
    # Remove CamScanner watermarks
    text = re.sub(r'Scanned\s+by\s+CamScanner', '', text, flags=re.IGNORECASE)
    text = re.sub(r'CamScanner', '', text, flags=re.IGNORECASE)
    # Remove multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def get_available_sources(folder_path: str = None):
    """Scans only user-uploaded exam PDFs and returns file details and cache status."""
    conn = database.get_connection()
    cur = conn.cursor()

    target_dir = folder_path if (folder_path and os.path.exists(folder_path)) else UPLOAD_EXAMS_DIR
    if not os.path.exists(target_dir):
        os.makedirs(target_dir, exist_ok=True)

    files = []
    for fname in os.listdir(target_dir):
        if fname.lower().endswith(".pdf"):
            full_path = os.path.join(target_dir, fname)
            try:
                size_mb = round(os.path.getsize(full_path) / (1024 * 1024), 2)
            except Exception:
                size_mb = 0.0

            try:
                doc = pdfium.PdfDocument(full_path)
                total_pages = len(doc)
                doc.close()
            except Exception:
                total_pages = 0

            cur.execute("SELECT COUNT(*) FROM exam_pdf_cache WHERE filename=?", (fname,))
            cached_count = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM exam_extracted_questions WHERE source_filename=?", (fname,))
            extracted_count = cur.fetchone()[0]

            status = "not_indexed"
            if cached_count >= total_pages and total_pages > 0:
                status = "fully_indexed"
            elif cached_count > 0:
                status = "partially_indexed"

            files.append({
                "filename": fname,
                "file_path": full_path,
                "folder": target_dir,
                "size_mb": size_mb,
                "total_pages": total_pages,
                "cached_pages": cached_count,
                "extracted_questions_count": extracted_count,
                "status": status
            })

    conn.close()
    files.sort(key=lambda x: x["filename"].lower())
    return files

def delete_exam_source(filename: str) -> bool:
    """Deletes an uploaded exam PDF from disk and clears its cached pages and extracted questions."""
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(UPLOAD_EXAMS_DIR, safe_filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"[PDF_OCR] Error removing file {file_path}: {e}")

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM exam_pdf_cache WHERE filename=?", (safe_filename,))
    cur.execute("DELETE FROM exam_extracted_questions WHERE source_filename=?", (safe_filename,))
    conn.commit()
    conn.close()
    return True

def clear_all_sources() -> bool:
    """Removes all uploaded exam PDFs and clears the entire exam cache and extracted questions."""
    if os.path.exists(UPLOAD_EXAMS_DIR):
        for f in os.listdir(UPLOAD_EXAMS_DIR):
            if f.lower().endswith(".pdf"):
                try:
                    os.remove(os.path.join(UPLOAD_EXAMS_DIR, f))
                except Exception as e:
                    print(f"[PDF_OCR] Error deleting {f}: {e}")

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM exam_pdf_cache")
    cur.execute("DELETE FROM exam_extracted_questions")
    conn.commit()
    conn.close()
    return True

def extract_single_page(doc, page_index: int, filename: str, folder_path: str) -> dict:
    """Extracts text from a page using direct text or Tesseract OCR fallback, and caches it."""
    conn = database.get_connection()
    cur = conn.cursor()
    
    # Check cache first
    cur.execute(
        "SELECT text_content, extraction_method FROM exam_pdf_cache WHERE filename=? AND page_num=?",
        (filename, page_index + 1)
    )
    row = cur.fetchone()
    if row:
        conn.close()
        return {
            "page_num": page_index + 1,
            "text": row["text_content"],
            "method": row["extraction_method"],
            "cached": True
        }
    
    page = doc[page_index]
    text = ""
    method = "text"
    
    try:
        # Try direct text extraction first
        textpage = page.get_textpage()
        direct_text = textpage.get_text_range()
        clean_text = clean_extracted_text(direct_text)
        
        # Check if direct text is meaningful (more than 50 chars of alphanumeric content)
        alpha_count = len(re.findall(r'[a-zA-Z0-9]', clean_text))
        if alpha_count >= 50:
            text = clean_text
            method = "text"
        else:
            # Need OCR
            init_tesseract()
            pix = page.render(scale=2.0)
            img = pix.to_pil()
            ocr_raw = pytesseract.image_to_string(img, lang="eng", config="--psm 6")
            text = clean_extracted_text(ocr_raw)
            method = "ocr"
    except Exception as e:
        print(f"[PDF_OCR] Error processing page {page_index+1} of {filename}: {e}")
        text = ""
        method = "error"
        
    # Save to database cache
    try:
        cur.execute('''
            INSERT OR REPLACE INTO exam_pdf_cache 
            (source_folder, filename, page_num, text_content, extraction_method)
            VALUES (?, ?, ?, ?, ?)
        ''', (folder_path, filename, page_index + 1, text, method))
        conn.commit()
    except Exception as e:
        print(f"[PDF_OCR] DB Cache error: {e}")
    finally:
        conn.close()
        
    return {
        "page_num": page_index + 1,
        "text": text,
        "method": method,
        "cached": False
    }

def index_pdf_file(filename: str, folder_path: str = UPLOAD_EXAMS_DIR, start_page: int = 1, end_page: int = None):
    """Indexes and OCRs a specific PDF file between page ranges."""
    full_path = os.path.join(folder_path, filename)
    if not os.path.exists(full_path):
        raise FileNotFoundError(f"File not found: {full_path}")
        
    doc = pdfium.PdfDocument(full_path)
    total_pages = len(doc)
    start_idx = max(0, start_page - 1)
    end_idx = min(total_pages, end_page) if end_page else total_pages
    
    results = []
    print(f"[PDF_OCR] Starting indexing for {filename} (pages {start_idx+1} to {end_idx})...")
    
    for i in range(start_idx, end_idx):
        res = extract_single_page(doc, i, filename, folder_path)
        results.append(res)
        
    return {
        "filename": filename,
        "indexed_count": len(results),
        "total_pages": total_pages
    }

def get_cached_pages(filename: str = None, folder_path: str = UPLOAD_EXAMS_DIR):
    """Retrieves all cached pages for a file or all files."""
    conn = database.get_connection()
    cur = conn.cursor()
    if filename:
        cur.execute(
            "SELECT filename, page_num, text_content, extraction_method FROM exam_pdf_cache WHERE filename=? ORDER BY page_num ASC",
            (filename,)
        )
    else:
        cur.execute(
            "SELECT filename, page_num, text_content, extraction_method FROM exam_pdf_cache ORDER BY filename ASC, page_num ASC"
        )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def ensure_file_indexed(filename: str, file_path: str = None):
    """Ensures a given PDF file is cached in exam_pdf_cache."""
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM exam_pdf_cache WHERE filename=?", (filename,))
    cached = cur.fetchone()[0]
    conn.close()

    if cached > 0:
        return cached

    # Find path if not given
    if not file_path or not os.path.exists(file_path):
        sources = get_available_sources()
        for s in sources:
            if s["filename"] == filename:
                file_path = s["file_path"]
                break

    if not file_path or not os.path.exists(file_path):
        return 0

    try:
        doc = pdfium.PdfDocument(file_path)
        folder = os.path.dirname(file_path)
        total = len(doc)
        for i in range(total):
            extract_single_page(doc, i, filename, folder)
        doc.close()
        return total
    except Exception as e:
        print(f"[PDF_OCR] Error ensuring index for {filename}: {e}")
        return 0
