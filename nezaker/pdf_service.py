import os
import glob
import re
import pypdfium2
from docx import Document
import database

DEFAULT_LECTURES_DIR = r"C:\Users\shawk\Desktop\Neuroscience Book 25-26_Lectures\Neuroscience Book 25-26_Lectures"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, "static", "lecture_images")
os.makedirs(IMAGES_DIR, exist_ok=True)

def determine_subject(filename: str, lecture_num: int = 0) -> str:
    """Categorizes the medical lecture into its underlying specialty discipline."""
    lower = filename.lower()
    
    if 1 <= lecture_num <= 19 or "scalp" in lower or "muscles of the neck" in lower or "orbit" in lower or "meninges" in lower or "spinal cord" in lower or "brainstem" in lower or "cerebrum" in lower or "cerebellum" in lower or "visual pathway" in lower or "development" in lower:
        return "Anatomy & Embryology"
    elif 20 <= lecture_num <= 24 or "nervous tissue" in lower or "cortex" in lower or "histology" in lower:
        return "Histology"
    elif 25 <= lecture_num <= 46 or "synapses" in lower or "somatosensory" in lower or "pain" in lower or "reflex" in lower or "vestibular" in lower or "basal ganglia" in lower or "thalamus" in lower or "sleep" in lower or "hearing" in lower or "chemical senses" in lower:
        return "Physiology"
    elif 47 <= lecture_num <= 48 or "metabolism" in lower or "neurotransmitters" in lower or "biochemistry" in lower:
        return "Biochemistry"
    elif 49 <= lecture_num <= 50 or "tumors" in lower or "pathology" in lower or "infarct" in lower:
        return "Pathology"
    elif 51 <= lecture_num <= 55 or "meningitis" in lower or "encephalitis" in lower or "tetanus" in lower or "prions" in lower or "infections" in lower:
        return "Microbiology"
    elif 56 <= lecture_num <= 58 or "protozoa" in lower or "helminths" in lower or "parasit" in lower:
        return "Parasitology"
    elif 59 <= lecture_num <= 65 or "anti-depressants" in lower or "anaesthetics" in lower or "analgesics" in lower or "parkinsonism" in lower or "epilepsy" in lower or "sedative" in lower or "antipsychotic" in lower or "drugs" in lower:
        return "Pharmacology"
    
    if "anat" in lower or "embryo" in lower:
        return "Anatomy & Embryology"
    if "histo" in lower:
        return "Histology"
    if "physio" in lower:
        return "Physiology"
    if "biochem" in lower:
        return "Biochemistry"
    if "patho" in lower:
        return "Pathology"
    if "micro" in lower or "bacter" in lower or "virol" in lower:
        return "Microbiology"
    if "para" in lower:
        return "Parasitology"
    if "pharm" in lower or "drug" in lower:
        return "Pharmacology"

    return "General Medicine"

def extract_lecture_number(filename: str) -> int:
    match = re.match(r'^(\d+)', filename)
    if match:
        return int(match.group(1))
    match_inner = re.search(r'Lecture\s*\(?(\d+)\)?', filename, re.IGNORECASE)
    if match_inner:
        return int(match_inner.group(1))
    return 999

def clean_lecture_title(filename: str) -> str:
    name = os.path.splitext(filename)[0]
    name = re.sub(r'^\d+\s*[-_.]\s*', '', name)
    name = re.sub(r'^\s*Lecture\s*\(?\d+\)?\s*[-:_.]?\s*', '', name, flags=re.IGNORECASE)
    name = re.sub(r'^[\s\-_.:]+|[\s\-_.:]+$', '', name)
    return name

def get_pdf_page_count(pdf_path: str) -> int:
    try:
        pdf = pypdfium2.PdfDocument(pdf_path)
        count = len(pdf)
        pdf.close()
        return count
    except Exception:
        return 1

def extract_pdf_text(pdf_path: str, max_pages: int = 50) -> str:
    try:
        pdf = pypdfium2.PdfDocument(pdf_path)
        pages_text = []
        num_pages = min(len(pdf), max_pages)
        for i in range(num_pages):
            page = pdf[i]
            textpage = page.get_textpage()
            text = textpage.get_text_range()
            if text and text.strip():
                pages_text.append(f"--- [Page {i+1}] ---\n" + text.strip())
            textpage.close()
            page.close()
        pdf.close()
        return "\n\n".join(pages_text)
    except Exception as e:
        return f"Error extracting PDF text: {e}"

def extract_lecture_page_images(pdf_path: str, lecture_id: int, max_pages: int = 100) -> list:
    """Renders high-yield medical slide pages/diagrams as web-friendly images."""
    if not pdf_path or not os.path.exists(pdf_path):
        return []
    if not str(pdf_path).lower().endswith(".pdf"):
        return []

    lec_dir = os.path.join(IMAGES_DIR, f"lec_{lecture_id}")
    os.makedirs(lec_dir, exist_ok=True)

    image_urls = []
    try:
        pdf = pypdfium2.PdfDocument(pdf_path)
        num_pages = min(len(pdf), max_pages)
        for i in range(num_pages):
            out_filename = f"slide_{i+1}.jpg"
            out_path = os.path.join(lec_dir, out_filename)
            rel_url = f"/static/lecture_images/lec_{lecture_id}/{out_filename}"

            if not os.path.exists(out_path):
                page = pdf[i]
                # Render at 1.5x resolution for clean text and anatomical clarity
                bitmap = page.render(scale=1.5)
                pil_image = bitmap.to_pil()
                pil_image.save(out_path, format="JPEG", quality=85)
                page.close()

            image_urls.append({
                "page": i + 1,
                "url": rel_url
            })
        pdf.close()
    except Exception as e:
        print(f"Error rendering PDF images for lecture {lecture_id}: {e}")

    return image_urls

def get_pptx_slide_count(pptx_path: str) -> int:
    try:
        from pptx import Presentation
        prs = Presentation(pptx_path)
        return len(prs.slides)
    except Exception as e:
        print(f"Error reading pptx slide count: {e}")
        return 1

def extract_pptx_text(pptx_path: str, max_slides: int = 250) -> str:
    try:
        from pptx import Presentation
        prs = Presentation(pptx_path)
        slides_text = []
        for i, slide in enumerate(prs.slides[:max_slides]):
            slide_parts = [f"--- [Slide {i+1}] ---"]
            title_text = ""
            if slide.shapes.title and slide.shapes.title.text:
                title_text = slide.shapes.title.text.strip()
                slide_parts.append(f"Title: {title_text}")
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        text = paragraph.text.strip()
                        if text and text != title_text:
                            slide_parts.append(text)
                elif shape.has_table:
                    for row in shape.table.rows:
                        row_txt = " | ".join(c.text.strip() for c in row.cells if c.text.strip())
                        if row_txt:
                            slide_parts.append(row_txt)
            if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                notes = slide.notes_slide.notes_text_frame.text.strip()
                if notes:
                    slide_parts.append(f"Speaker Notes: {notes}")
            slides_text.append("\n".join(slide_parts))
        return "\n\n".join(slides_text)
    except Exception as e:
        return f"Error extracting PPTX text: {e}"

def get_lecture_file_page_count(file_path: str) -> int:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return get_pdf_page_count(file_path)
    elif ext in ['.pptx', '.ppt']:
        return get_pptx_slide_count(file_path)
    return 10

def extract_lecture_file_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return extract_pdf_text(file_path)
    elif ext in ['.pptx', '.ppt']:
        return extract_pptx_text(file_path)
    elif ext in ['.docx', '.doc']:
        return extract_document_text(file_path)
    return ""

def extract_document_text(file_path: str) -> str:
    """Extracts raw text from PDF, DOCX, or TXT past exam files."""
    if not os.path.exists(file_path):
        return ""
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        return extract_pdf_text(file_path, max_pages=100)
    elif ext in [".pptx", ".ppt"]:
        return extract_pptx_text(file_path)
    elif ext in [".docx", ".doc"]:
        try:
            doc = Document(file_path)
            full_text = []
            for para in doc.paragraphs:
                if para.text.strip():
                    full_text.append(para.text.strip())
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                    if row_text:
                        full_text.append(row_text)
            return "\n\n".join(full_text)
        except Exception as e:
            return f"Error reading docx: {e}"
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

def extract_and_import_zip(zip_path: str, block_id: int = 1, rebalance: bool = True, dest_dir: str = None) -> list:
    """Extracts a ZIP archive containing lectures (.pdf, .pptx) and adds them to the active block."""
    import zipfile
    import shutil
    import tempfile

    if not dest_dir:
        dest_dir = os.path.join(BASE_DIR, "lecture_pdfs")
    os.makedirs(dest_dir, exist_ok=True)

    imported = []
    temp_dir = tempfile.mkdtemp(prefix="nezaker_zip_")

    try:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(temp_dir)

        for root, dirs, files in os.walk(temp_dir):
            for file in sorted(files):
                ext = os.path.splitext(file)[1].lower()
                if ext in ['.pdf', '.pptx', '.ppt']:
                    full_src = os.path.join(root, file)
                    safe_name = re.sub(r'[^\w\-_\.]', '_', file)
                    base, fext = os.path.splitext(safe_name)
                    dest_path = os.path.join(dest_dir, safe_name)
                    c = 1
                    while os.path.exists(dest_path):
                        dest_path = os.path.join(dest_dir, f"{base}_{c}{fext}")
                        c += 1
                    shutil.copy2(full_src, dest_path)

                    lec_num = extract_lecture_number(file)
                    title = clean_lecture_title(file) or base
                    parent_dir = os.path.basename(root)
                    subject = determine_subject(file, lec_num)
                    if subject == "General Medicine" and parent_dir:
                        parent_subj = determine_subject(parent_dir, 0)
                        if parent_subj != "General Medicine":
                            subject = parent_subj

                    page_count = get_lecture_file_page_count(dest_path)
                    extracted_text = extract_lecture_file_text(dest_path)

                    conn = database.get_connection()
                    cur = conn.cursor()
                    if lec_num == 999:
                        cur.execute("SELECT MAX(lecture_number) FROM lectures WHERE block_id=?", (block_id,))
                        max_n = cur.fetchone()[0]
                        lec_num = (max_n or 0) + 1

                    cur.execute('''
                    INSERT INTO lectures (block_id, lecture_number, title, subject, file_path, page_count, difficulty, extracted_text)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (block_id, lec_num, title, subject, dest_path, page_count, 2, extracted_text))
                    new_id = cur.lastrowid
                    conn.commit()
                    conn.close()

                    if ext == '.pdf':
                        try:
                            extract_lecture_page_images(dest_path, new_id, max_pages=100)
                        except Exception:
                            pass

                    imported.append({
                        "id": new_id,
                        "title": title,
                        "subject": subject,
                        "lecture_number": lec_num,
                        "page_count": page_count,
                        "filename": file
                    })
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    if rebalance and imported:
        try:
            import scheduler_service
            scheduler_service.generate_balanced_schedule(block_id)
        except Exception as e:
            print(f"Rebalance warning: {e}")

    return imported

def scan_and_import_lectures_folder(folder_path: str = DEFAULT_LECTURES_DIR, block_id: int = 1, rebalance: bool = True, copy_files: bool = True) -> list:
    """Scans any specified local folder recursively for lecture PDFs and PPTXs and imports them."""
    if not os.path.exists(folder_path):
        return []

    dest_dir = os.path.join(BASE_DIR, "lecture_pdfs")
    os.makedirs(dest_dir, exist_ok=True)

    found_files = []
    for root, dirs, files in os.walk(folder_path):
        for f in sorted(files):
            ext = os.path.splitext(f)[1].lower()
            if ext in ['.pdf', '.pptx', '.ppt']:
                found_files.append((os.path.join(root, f), f, root))

    imported = []
    for full_src, file, root_dir in found_files:
        ext = os.path.splitext(file)[1].lower()

        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM lectures WHERE block_id=? AND (file_path=? OR title LIKE ?)", 
                    (block_id, full_src, f"%{clean_lecture_title(file)}%"))
        existing = cur.fetchone()
        if existing:
            conn.close()
            continue

        if copy_files:
            safe_name = re.sub(r'[^\w\-_\.]', '_', file)
            base, fext = os.path.splitext(safe_name)
            dest_path = os.path.join(dest_dir, safe_name)
            c = 1
            while os.path.exists(dest_path):
                dest_path = os.path.join(dest_dir, f"{base}_{c}{fext}")
                c += 1
            import shutil
            shutil.copy2(full_src, dest_path)
            stored_path = dest_path
        else:
            stored_path = full_src

        lec_num = extract_lecture_number(file)
        title = clean_lecture_title(file) or os.path.splitext(file)[0]
        subject = determine_subject(file, lec_num)

        parent_dir = os.path.basename(root_dir)
        if subject == "General Medicine" and parent_dir:
            p_subj = determine_subject(parent_dir, 0)
            if p_subj != "General Medicine":
                subject = p_subj

        page_count = get_lecture_file_page_count(stored_path)
        extracted_text = extract_lecture_file_text(stored_path)

        if lec_num == 999:
            cur.execute("SELECT MAX(lecture_number) FROM lectures WHERE block_id=?", (block_id,))
            max_n = cur.fetchone()[0]
            lec_num = (max_n or 0) + 1

        cur.execute('''
        INSERT INTO lectures (block_id, lecture_number, title, subject, file_path, page_count, difficulty, extracted_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (block_id, lec_num, title, subject, stored_path, page_count, 2, extracted_text))
        new_id = cur.lastrowid
        conn.commit()
        conn.close()

        if ext == '.pdf':
            try:
                extract_lecture_page_images(stored_path, new_id, max_pages=100)
            except Exception:
                pass

        imported.append({
            "id": new_id,
            "title": title,
            "subject": subject,
            "lecture_number": lec_num,
            "page_count": page_count,
            "file_path": stored_path
        })

    if rebalance and imported:
        try:
            import scheduler_service
            scheduler_service.generate_balanced_schedule(block_id)
        except Exception as e:
            print(f"Rebalance warning: {e}")

    return imported

