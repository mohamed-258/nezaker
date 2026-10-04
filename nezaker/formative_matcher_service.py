import os
import re
import hashlib
import sqlite3
import difflib
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_COLOR_INDEX
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "formative_uploads")
EXPORTS_DIR = os.path.join(BASE_DIR, "formative_exports")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(EXPORTS_DIR, exist_ok=True)

def compute_file_hash(filepath: str) -> str:
    """Computes SHA-256 hash of a file for instant cache deduplication."""
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()

def derive_clean_source_label(filename: str) -> str:
    """Derives a clean, readable source label from a filename."""
    name, _ = os.path.splitext(filename)
    # Remove common tags
    cleaned = re.sub(r'[\(\[\{].*?[\)\]\}]', '', name)
    cleaned = re.sub(r'[\-_]+', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned if cleaned else name

def normalize_text(text: str) -> str:
    """Normalizes question stem for accurate, zero-cost deterministic matching."""
    if not text:
        return ""
    # Remove leading question numbers e.g. "1.", "1 -", "Q1:", "(1)"
    cleaned = re.sub(r'^\s*(?:Q\s*\.?\s*)?\(?\d+[\.\)\-:]\s*', '', text, flags=re.IGNORECASE)
    # Remove common punctuation and symbols
    cleaned = re.sub(r'[\?\.\,\:\;\(\)\[\]\"\'\-_/\\*]', ' ', cleaned)
    # Collapse multiple whitespaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip().lower()
    return cleaned

def is_yellow_highlight(run) -> bool:
    """Checks if a python-docx run is highlighted with yellow color."""
    try:
        hl = run.font.highlight_color
        if hl is not None:
            if hl == WD_COLOR_INDEX.YELLOW or str(hl).lower().find('yellow') != -1 or hl == 7:
                return True
        rPr = run._r.rPr
        if rPr is not None:
            highlight = rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}highlight')
            if highlight is not None:
                val = highlight.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
                if val and val.lower() == 'yellow':
                    return True
    except Exception:
        pass
    return False

# ----------------- PARSER: MASTER FILE (CNS Mid MCQs with Formatives & Previous Exams) -----------------

def parse_master_lecture_bank(file_path: str, filename: str) -> dict:
    """
    Parses the Master File (File 1, e.g. 'CNS Mid MCQs (Answered)'):
    - Identifies lectures.
    - Identifies 'Formatives & Previous Exams' sections after each lecture.
    - Detects yellow highlighted correct answers.
    - Caches permanently into database so it never needs re-extraction.
    """
    file_hash = compute_file_hash(file_path)
    conn = database.get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, total_lectures, total_questions FROM formative_files WHERE file_hash=? AND file_type='lecture_bank'", (file_hash,))
    existing = cur.fetchone()
    if existing:
        file_id = existing["id"]
        cur.execute("SELECT * FROM formative_lectures WHERE file_id=?", (file_id,))
        lecs = [dict(r) for r in cur.fetchall()]
        conn.close()
        return {
            "status": "cached",
            "file_id": file_id,
            "filename": filename,
            "total_lectures": existing["total_lectures"],
            "total_questions": existing["total_questions"],
            "lectures": lecs
        }

    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        return parse_master_pdf(file_path, filename, file_hash, conn, cur)

    doc = Document(file_path)
    
    lectures_data = []
    current_lecture = {"name": "المحاضرة الأولى (General)", "questions": []}
    current_section = "regular"
    
    lec_pattern = re.compile(r'^(?:Lecture|Lec|محاضرة|المحاضرة)\s*[:\-\d\.]+\s*(.*)$', re.IGNORECASE)
    # Flexible pattern for Formatives & Previous Exams
    formative_marker = re.compile(
        r'(?:Formatives?\s*(?:&|and|\+)?\s*Previous\s*Exams?|Formatives?|Previous\s*Exams?|الفورماتيف|امتحانات\s*سابقة)',
        re.IGNORECASE
    )
    q_start_pattern = re.compile(r'^\s*(?:Q\s*\.?\s*)?\(?\d+[\.\)\-:]\s*(.+)$', re.IGNORECASE)
    opt_pattern = re.compile(r'^\s*([A-Da-d])[\.\)\-:]\s*(.+)$')

    current_q = None

    def finalize_current_q():
        nonlocal current_q
        if current_q and current_q.get("stem"):
            current_lecture["questions"].append(current_q)
            current_q = None

    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue

        # 1. Lecture Title Detection
        lec_match = lec_pattern.match(text)
        is_heading = p.style and p.style.name and ('Heading 1' in p.style.name or 'Title' in p.style.name)
        if lec_match or (is_heading and len(text) < 100 and not formative_marker.search(text) and not q_start_pattern.match(text)):
            finalize_current_q()
            if current_lecture["questions"]:
                lectures_data.append(current_lecture)
            title = text
            if lec_match and lec_match.group(1).strip():
                title = text.strip()
            current_lecture = {"name": title, "questions": []}
            current_section = "regular"
            continue

        # 2. Formatives & Previous Exams Section Header
        if formative_marker.search(text) and len(text) < 100:
            finalize_current_q()
            current_section = "formative"
            continue

        # 3. Option (A, B, C, D)
        opt_match = opt_pattern.match(text)
        if opt_match and current_q:
            opt_letter = opt_match.group(1).upper()
            opt_content = opt_match.group(2).strip()
            has_yellow = any(is_yellow_highlight(r) for r in p.runs)
            current_q["options"][opt_letter] = opt_content
            if has_yellow:
                current_q["correct_option"] = opt_letter
                current_q["is_yellow_highlighted"] = 1
            continue

        # 4. Question Detection
        q_match = q_start_pattern.match(text)
        if q_match or (len(text) > 15 and ('?' in text or text.endswith(':'))):
            finalize_current_q()
            stem = q_match.group(1).strip() if q_match else text
            has_yellow = any(is_yellow_highlight(r) for r in p.runs)
            current_q = {
                "stem": stem,
                "type": current_section,
                "options": {},
                "correct_option": "",
                "is_yellow_highlighted": 1 if has_yellow else 0
            }
            continue

        # Continuation
        if current_q and not current_q["options"]:
            current_q["stem"] += " " + text
        elif current_q and current_q["options"]:
            last_opt = list(current_q["options"].keys())[-1]
            current_q["options"][last_opt] += " " + text
            if any(is_yellow_highlight(r) for r in p.runs):
                current_q["correct_option"] = last_opt
                current_q["is_yellow_highlighted"] = 1

    finalize_current_q()
    if current_lecture["questions"]:
        lectures_data.append(current_lecture)

    if not lectures_data and current_lecture["questions"]:
        lectures_data.append(current_lecture)

    # Insert into Database
    clean_label = derive_clean_source_label(filename)
    cur.execute("""
        INSERT INTO formative_files (file_type, filename, file_path, file_hash, source_label, extraction_method, total_lectures, total_questions)
        VALUES ('lecture_bank', ?, ?, ?, ?, 'docx', ?, ?)
    """, (filename, file_path, file_hash, clean_label, len(lectures_data), sum(len(l["questions"]) for l in lectures_data)))
    file_id = cur.lastrowid

    total_all_q = 0
    lecture_records = []
    for lec in lectures_data:
        lec_name = lec["name"]
        q_list = lec["questions"]
        formative_count = sum(1 for q in q_list if q["type"] == "formative")
        cur.execute("""
            INSERT INTO formative_lectures (file_id, lecture_name, total_questions, formative_questions_count)
            VALUES (?, ?, ?, ?)
        """, (file_id, lec_name, len(q_list), formative_count))
        lec_id = cur.lastrowid
        lecture_records.append({
            "id": lec_id,
            "lecture_name": lec_name,
            "total_questions": len(q_list),
            "formative_questions_count": formative_count
        })

        for idx, q in enumerate(q_list, 1):
            total_all_q += 1
            cur.execute("""
                INSERT INTO formative_questions (
                    file_id, lecture_name, question_num, question_type, question_text,
                    option_a, option_b, option_c, option_d, correct_option, is_yellow_highlighted
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                file_id, lec_name, idx, q["type"], q["stem"],
                q["options"].get("A", ""), q["options"].get("B", ""),
                q["options"].get("C", ""), q["options"].get("D", ""),
                q["correct_option"], q["is_yellow_highlighted"]
            ))

    cur.execute("UPDATE formative_files SET total_questions=? WHERE id=?", (total_all_q, file_id))
    conn.commit()
    conn.close()

    return {
        "status": "parsed",
        "file_id": file_id,
        "filename": filename,
        "source_label": clean_label,
        "total_lectures": len(lecture_records),
        "total_questions": total_all_q,
        "lectures": lecture_records
    }

def parse_master_pdf(file_path: str, filename: str, file_hash: str, conn, cur) -> dict:
    """PDF fallback for master file with text extraction or OCR."""
    import pypdfium2 as pdfium
    doc = pdfium.PdfDocument(file_path)
    full_text = []
    for page in doc:
        text_page = page.get_textpage()
        full_text.append(text_page.get_text_range())
    combined_text = "\n".join(full_text)
    
    # Save as temp docx to use structured parser
    temp_docx = os.path.join(UPLOADS_DIR, f"temp_master_{file_hash[:12]}.docx")
    d = Document()
    for line in combined_text.splitlines():
        line_clean = line.strip()
        if line_clean:
            d.add_paragraph(line_clean)
    d.save(temp_docx)
    try:
        conn.close()
        res = parse_master_lecture_bank(temp_docx, filename)
        res["filename"] = filename
        return res
    finally:
        if os.path.exists(temp_docx):
            try:
                os.remove(temp_docx)
            except Exception:
                pass

# ----------------- PARSER: MULTI-SOURCE REFERENCE FILES (DR SLEEM, QUIZ 1-8, NEURO WEEK 1, ETC.) -----------------

def parse_reference_source_file(file_path: str, filename: str, custom_source_label: str = None) -> dict:
    """
    Parses any reference file (Word or PDF, with OCR support if scanned):
    - Determines clean source label (e.g. 'DR SLEEM', 'Quiz 1-8').
    - Detects internal sections/formatives (e.g. 'Formative 41', 'Week 1').
    - Extracts all questions & choices.
    - Caches permanently in SQLite database so it never needs re-extraction or re-OCR.
    """
    file_hash = compute_file_hash(file_path)
    conn = database.get_connection()
    cur = conn.cursor()

    source_label = custom_source_label.strip() if custom_source_label else derive_clean_source_label(filename)

    # Check cache
    cur.execute("SELECT id, source_label, total_questions, extraction_method FROM formative_files WHERE file_hash=? AND file_type='reference_source'", (file_hash,))
    existing = cur.fetchone()
    if existing:
        file_id = existing["id"]
        # Update source label if custom provided
        if custom_source_label:
            cur.execute("UPDATE formative_files SET source_label=? WHERE id=?", (source_label, file_id))
            cur.execute("UPDATE formative_weekly_index SET source_label=? WHERE file_id=?", (source_label, file_id))
            conn.commit()
        conn.close()
        return {
            "status": "cached",
            "file_id": file_id,
            "filename": filename,
            "source_label": source_label,
            "total_questions": existing["total_questions"],
            "extraction_method": existing["extraction_method"]
        }

    ext = os.path.splitext(filename)[1].lower()
    extraction_method = "docx" if ext == ".docx" else "text_pdf"

    questions = []
    
    if ext == ".docx":
        questions = extract_questions_from_docx(file_path, source_label, filename)
    else:
        # PDF handling (text vs OCR)
        questions, extraction_method = extract_questions_from_pdf(file_path, filename, source_label)

    # Insert file record
    cur.execute("""
        INSERT INTO formative_files (file_type, filename, file_path, file_hash, source_label, extraction_method, total_lectures, total_questions)
        VALUES ('reference_source', ?, ?, ?, ?, ?, 0, ?)
    """, (filename, file_path, file_hash, source_label, extraction_method, len(questions)))
    file_id = cur.lastrowid

    # Index into formative_weekly_index
    for q in questions:
        opts_str = " | ".join(f"{k}: {v}" for k, v in q["options"].items())
        cur.execute("""
            INSERT INTO formative_weekly_index (
                file_id, source_label, source_filename, week_name, formative_name, formative_number,
                question_stem_normalized, question_text, options_text, correct_option
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            file_id, source_label, filename, q.get("week_name", ""),
            q.get("formative_name", ""), q.get("formative_number", ""),
            q["stem_normalized"], q["stem"], opts_str, q.get("correct_option", "")
        ))

    conn.commit()
    conn.close()

    return {
        "status": "parsed",
        "file_id": file_id,
        "filename": filename,
        "source_label": source_label,
        "total_questions": len(questions),
        "extraction_method": extraction_method
    }

def clean_xml_string(s: str) -> str:
    """Strips NULL bytes and non-printable control characters that crash python-docx."""
    if not s:
        return ""
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', s)

def extract_questions_from_text_lines(lines: list, source_label: str, filename: str) -> list:
    """
    Robust, universal extractor for questions and choices from raw text lines.
    Supports:
    - Quizzes: QUIZE 1, Quiz 2, كويز 1
    - Formatives: Formative 41, فورماتيف 2
    - Weeks: Week 1, الأسبوع 3
    - Questions: 1., 1), 1-, Q1:, (1)
    - Choices: a., A), A-, (a)
    """
    week_pattern = re.compile(r'(?:week|الأسبوع|الاسبوع)\s*[:\-]?\s*(\d+|[a-zA-Z]+)', re.IGNORECASE)
    formative_pattern = re.compile(r'(?:formative|فورماتيف|quize?|كويز)\s*[:\-]?\s*(\d+)', re.IGNORECASE)
    q_start_pattern = re.compile(r'^\s*(?:Q\s*\.?\s*)?\(?\d+[\.\)\-:]\s*(.+)$', re.IGNORECASE)
    opt_pattern = re.compile(r'^\s*([A-Da-d])[\.\)\-:]\s*(.+)$')

    questions = []
    current_q = None
    current_week = ""
    current_formative = ""
    current_formative_num = ""

    def finalize_q():
        nonlocal current_q
        if current_q and current_q.get("stem") and len(current_q.get("options", {})) >= 2:
            current_q["stem_normalized"] = normalize_text(current_q["stem"])
            questions.append(current_q)
            current_q = None

    for raw_line in lines:
        text = clean_xml_string(raw_line).strip()
        if not text:
            continue

        # Skip headers / answer keys / directions
        if text.lower().startswith("key answer") or text.lower().startswith("select the"):
            continue

        # Detect Week headers
        w_match = week_pattern.search(text)
        if w_match and len(text) < 40:
            finalize_q()
            current_week = f"Week {w_match.group(1)}"
            continue

        # Detect Formative / Quiz headers
        f_match = formative_pattern.search(text)
        if f_match and len(text) < 40:
            finalize_q()
            f_num = f_match.group(1)
            prefix = "Quiz" if "quiz" in text.lower() or "كويز" in text else "Formative"
            current_formative = f"{prefix} {f_num}"
            current_formative_num = str(f_num)
            continue

        # Detect Options (A, B, C, D)
        opt_match = opt_pattern.match(text)
        if opt_match and current_q:
            opt_letter = opt_match.group(1).upper()
            opt_content = opt_match.group(2).strip()
            current_q["options"][opt_letter] = opt_content
            continue

        # Detect Question stems
        q_match = q_start_pattern.match(text)
        if q_match:
            finalize_q()
            stem = q_match.group(1).strip()
            current_q = {
                "source_label": source_label,
                "week_name": current_week,
                "formative_name": current_formative,
                "formative_number": current_formative_num,
                "stem": stem,
                "options": {},
                "correct_option": ""
            }
            continue

        # Continuation lines
        if current_q and not current_q["options"]:
            current_q["stem"] += " " + text
        elif current_q and current_q["options"]:
            last_opt = list(current_q["options"].keys())[-1]
            current_q["options"][last_opt] += " " + text

    finalize_q()
    return questions

def extract_questions_from_docx(file_path: str, source_label: str, filename: str) -> list:
    """Extracts questions and internal section markers from a docx file, preserving highlight."""
    doc = Document(file_path)
    lines_data = []
    
    current_week = ""
    current_formative = ""
    current_formative_num = ""

    week_pattern = re.compile(r'(?:week|الأسبوع|الاسبوع)\s*[:\-]?\s*(\d+|[a-zA-Z]+)', re.IGNORECASE)
    formative_pattern = re.compile(r'(?:formative|فورماتيف|quize?|كويز)\s*[:\-]?\s*(\d+)', re.IGNORECASE)
    q_start_pattern = re.compile(r'^\s*(?:Q\s*\.?\s*)?\(?\d+[\.\)\-:]\s*(.+)$', re.IGNORECASE)
    opt_pattern = re.compile(r'^\s*([A-Da-d])[\.\)\-:]\s*(.+)$')

    questions = []
    current_q = None

    def finalize_q():
        nonlocal current_q
        if current_q and current_q.get("stem") and len(current_q.get("options", {})) >= 2:
            current_q["stem_normalized"] = normalize_text(current_q["stem"])
            questions.append(current_q)
            current_q = None

    for p in doc.paragraphs:
        text = clean_xml_string(p.text).strip()
        if not text:
            continue

        if text.lower().startswith("key answer") or text.lower().startswith("select the"):
            continue

        w_match = week_pattern.search(text)
        if w_match and len(text) < 50:
            finalize_q()
            current_week = f"Week {w_match.group(1)}"
            continue

        f_match = formative_pattern.search(text)
        if f_match and len(text) < 50:
            finalize_q()
            f_num = f_match.group(1)
            prefix = "Quiz" if "quiz" in text.lower() or "كويز" in text else "Formative"
            current_formative = f"{prefix} {f_num}"
            current_formative_num = str(f_num)
            continue

        opt_match = opt_pattern.match(text)
        if opt_match and current_q:
            opt_letter = opt_match.group(1).upper()
            opt_content = opt_match.group(2).strip()
            current_q["options"][opt_letter] = opt_content
            if any(is_yellow_highlight(r) for r in p.runs):
                current_q["correct_option"] = opt_letter
            continue

        q_match = q_start_pattern.match(text)
        if q_match:
            finalize_q()
            stem = q_match.group(1).strip()
            current_q = {
                "source_label": source_label,
                "week_name": current_week,
                "formative_name": current_formative,
                "formative_number": current_formative_num,
                "stem": stem,
                "options": {},
                "correct_option": ""
            }
            continue

        if current_q and not current_q["options"]:
            current_q["stem"] += " " + text
        elif current_q and current_q["options"]:
            last_opt = list(current_q["options"].keys())[-1]
            current_q["options"][last_opt] += " " + text

    finalize_q()
    return questions

def extract_questions_from_pdf(file_path: str, filename: str, source_label: str) -> tuple:
    """
    Extracts text from PDF directly without intermediate docx crashes,
    falling back to OCR if scanned.
    Returns (questions_list, extraction_method).
    """
    import pymupdf
    doc = pymupdf.open(file_path)
    full_lines = []
    total_chars = 0

    for page in doc:
        txt = page.get_text()
        total_chars += len(txt.strip())
        full_lines.extend(txt.splitlines())

    page_count = max(len(doc), 1)
    avg_chars_per_page = total_chars / page_count
    extraction_method = "text_pdf"

    # If average characters per page is below 60, it's likely scanned images -> trigger OCR!
    if avg_chars_per_page < 60:
        extraction_method = "ocr"
        try:
            import pytesseract
            from PIL import Image
            import io
            ocr_lines = []
            for page in doc:
                pix = page.get_pixmap(dpi=150)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                t = pytesseract.image_to_string(img, lang='eng+ara')
                ocr_lines.extend(t.splitlines())
            full_lines = ocr_lines
        except Exception as e:
            print(f"OCR failed for {filename}, using available text: {e}")

    questions = extract_questions_from_text_lines(full_lines, source_label, filename)
    return questions, extraction_method

# ----------------- MULTI-SOURCE MATCHING ENGINE -----------------

def match_lecture_multi_sources(file_1_id: int, lecture_name: str, active_source_ids: list = None) -> list:
    """
    Matches the selected lecture's questions (under Formatives & Previous Exams)
    against ALL indexed reference source files.
    Identifies and aggregates all source origins:
    e.g. 'DR SLEEM | Formative 41 | Quiz 1-8'
    """
    conn = database.get_connection()
    cur = conn.cursor()

    # 1. Fetch questions for the lecture
    cur.execute("""
        SELECT * FROM formative_questions
        WHERE file_id=? AND lecture_name=? AND question_type='formative'
        ORDER BY question_num ASC
    """, (file_1_id, lecture_name))
    lecture_q = [dict(r) for r in cur.fetchall()]

    if not lecture_q:
        # Fallback to all questions if none tagged as formative
        cur.execute("""
            SELECT * FROM formative_questions
            WHERE file_id=? AND lecture_name=?
            ORDER BY question_num ASC
        """, (file_1_id, lecture_name))
        lecture_q = [dict(r) for r in cur.fetchall()]

    # 2. Fetch all reference sources from formative_weekly_index
    # Fetch indexed questions from reference sources
    if active_source_ids and len(active_source_ids) > 0:
        placeholders = ",".join("?" * len(active_source_ids))
        cur.execute(f"""
            SELECT id, file_id, source_label, source_filename, week_name, formative_name, formative_number,
                   question_stem_normalized, question_text, options_text
            FROM formative_weekly_index
            WHERE file_id IN ({placeholders})
        """, active_source_ids)
    else:
        cur.execute("""
            SELECT id, file_id, source_label, source_filename, week_name, formative_name, formative_number,
                   question_stem_normalized, question_text, options_text
            FROM formative_weekly_index
        """)
    reference_items = [dict(r) for r in cur.fetchall()]

    # Group reference items by file_id so EVERY source file is evaluated independently
    items_by_file = {}
    for item in reference_items:
        fid = item["file_id"]
        if fid not in items_by_file:
            items_by_file[fid] = []
        items_by_file[fid].append(item)

    matched_results = []

    for q in lecture_q:
        q_stem_norm = normalize_text(q["question_text"])
        q_words = set(w for w in q_stem_norm.split() if len(w) > 2)
        q_opts_str = f"{q.get('option_a','')} {q.get('option_b','')} {q.get('option_c','')} {q.get('option_d','')}".lower()

        matches = []

        # Check against every source file independently
        for fid, f_items in items_by_file.items():
            best_match = None
            best_score = 0.0

            for item in f_items:
                w_norm = item["question_stem_normalized"]
                
                # 1. Exact match
                if q_stem_norm == w_norm:
                    best_match = item
                    best_score = 1.0
                    break

                # 2. Prefix match (45 chars)
                if len(q_stem_norm) >= 40 and len(w_norm) >= 40 and q_stem_norm[:45] == w_norm[:45]:
                    if best_score < 0.95:
                        best_match = item
                        best_score = 0.95
                        continue

                # 3. Substring containment
                if (len(w_norm) >= 30 and w_norm in q_stem_norm) or (len(q_stem_norm) >= 30 and q_stem_norm in w_norm):
                    if best_score < 0.90:
                        best_match = item
                        best_score = 0.90
                        continue

                # 4. Token Overlap (Medical keywords + Options bonus)
                STOP_WORDS = {'the', 'and', 'with', 'for', 'from', 'what', 'which', 'following', 'that', 'this', 'are', 'was', 'were', 'year', 'years', 'old', 'patient'}
                w_words = set(w for w in w_norm.split() if len(w) > 2 and w not in STOP_WORDS)
                clean_q_words = set(w for w in q_words if w not in STOP_WORDS)

                if clean_q_words and w_words:
                    shared_words = clean_q_words.intersection(w_words)
                    overlap = len(shared_words) / max(len(clean_q_words.union(w_words)), 1)
                    
                    opt_bonus = 0.0
                    item_opts = (item.get("options_text") or "").lower()
                    common_opt_words = set()
                    if item_opts and q_opts_str:
                        opt_words_set = set(w for w in item_opts.split() if len(w) > 2 and w not in STOP_WORDS)
                        q_opt_words_set = set(w for w in q_opts_str.split() if len(w) > 2 and w not in STOP_WORDS)
                        common_opt_words = opt_words_set.intersection(q_opt_words_set)
                        if len(common_opt_words) >= 2:
                            opt_bonus = 0.25

                    effective_score = overlap + opt_bonus
                    is_match = (
                        overlap >= 0.50 or
                        (len(shared_words) >= 4 and overlap >= 0.35) or
                        (len(shared_words) >= 3 and len(common_opt_words) >= 2) or
                        effective_score >= 0.60
                    )
                    if is_match and effective_score > best_score:
                        best_match = item
                        best_score = effective_score
                    elif len(q_stem_norm) > 20 and len(w_norm) > 20:
                        ratio = difflib.SequenceMatcher(None, q_stem_norm[:120], w_norm[:120]).ratio()
                        if ratio >= 0.75 and ratio > best_score:
                            best_match = item
                            best_score = ratio

            if best_match:
                matches.append(best_match)

        if matches:
            found_sources = []
            found_formatives = []
            found_weeks = []

            for m in matches:
                # 1. Source label
                src = m.get("source_label") or derive_clean_source_label(m.get("source_filename") or "")
                if src and src not in found_sources:
                    found_sources.append(src)

                # 2. Formative number / name
                f_num = str(m.get("formative_number") or "").strip()
                if f_num:
                    clean_f = re.sub(r'[^\d]', '', f_num)
                    if clean_f and clean_f not in found_formatives:
                        found_formatives.append(clean_f)
                elif m.get("formative_name"):
                    fname = m["formative_name"].strip()
                    if fname not in found_formatives:
                        found_formatives.append(fname)

                # 3. Week
                w = m.get("week_name", "").strip()
                if w and w not in found_weeks:
                    found_weeks.append(w)

            # Consolidate labels
            consolidated_tags = []
            
            # Add sources
            for s in found_sources:
                if s not in consolidated_tags:
                    consolidated_tags.append(s)

            # If formatives found, format them: Formative 38, 39, 41
            if found_formatives:
                try:
                    found_formatives.sort(key=lambda x: int(re.sub(r'[^\d]', '', x) or 0))
                except Exception:
                    found_formatives.sort()
                f_str = f"Formative {', '.join(found_formatives)}"
                if f_str not in consolidated_tags:
                    consolidated_tags.append(f_str)

            if found_weeks:
                w_str = ", ".join(found_weeks)
                if w_str not in consolidated_tags:
                    consolidated_tags.append(w_str)

            all_sources_str = " | ".join(consolidated_tags) if consolidated_tags else "مصدر معتمد"
            status = "matched"
        else:
            all_sources_str = "غير مسجل بالمصادر المرفوعة"
            status = "unmatched"

        cur.execute("""
            UPDATE formative_questions
            SET all_matched_sources=?, matched_formatives=?, match_status=?
            WHERE id=?
        """, (all_sources_str, all_sources_str, status, q["id"]))

        q["all_matched_sources"] = all_sources_str
        q["matched_formatives"] = all_sources_str
        q["match_status"] = status
        matched_results.append(q)

    conn.commit()
    conn.close()
    return matched_results

# ----------------- WORD EXPORT ENGINE WITH MULTI-SOURCE TAGS & YELLOW HIGHLIGHT -----------------

def export_multi_source_docx(file_1_id: int, lecture_name: str) -> str:
    """
    Exports a clean, elegant Word document:
    - Lecture title header
    - Each question displays its consolidated source tag: [المصادر: DR SLEEM | Formative 41 | Quiz 1-8]
    - Yellow highlighted correct answers (<w:highlight w:val="yellow"/>)
    """
    conn = database.get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT * FROM formative_questions
        WHERE file_id=? AND lecture_name=? AND question_type='formative'
        ORDER BY question_num ASC
    """, (file_1_id, lecture_name))
    questions = [dict(r) for r in cur.fetchall()]

    if not questions:
        cur.execute("""
            SELECT * FROM formative_questions
            WHERE file_id=? AND lecture_name=?
            ORDER BY question_num ASC
        """, (file_1_id, lecture_name))
        questions = [dict(r) for r in cur.fetchall()]

    conn.close()

    doc = Document()

    for sec in doc.sections:
        sec.top_margin = Inches(0.8)
        sec.bottom_margin = Inches(0.8)
        sec.left_margin = Inches(0.8)
        sec.right_margin = Inches(0.8)

    # Document Header
    title = doc.add_heading(level=0)
    title_run = title.add_run(f"📋 أسئلة الفورماتيفز والامتحانات السابقة: {lecture_name}")
    title_run.font.color.rgb = RGBColor(13, 148, 136) # Dark Teal
    title_run.font.size = Pt(20)
    title_run.font.name = 'Calibri'

    meta_p = doc.add_paragraph()
    meta_run = meta_p.add_run(f"منصة نُذاكِر الذكية — توثيق وتتبع مصادر الأسئلة ({len(questions)} سؤال)")
    meta_run.font.color.rgb = RGBColor(100, 116, 139)
    meta_run.font.size = Pt(10.5)

    doc.add_paragraph("=" * 65)

    for idx, q in enumerate(questions, 1):
        qp = doc.add_paragraph()
        
        # Question Number & Text
        q_num_run = qp.add_run(f"Q{idx}. ")
        q_num_run.bold = True
        q_num_run.font.size = Pt(12)
        q_num_run.font.color.rgb = RGBColor(15, 23, 42)

        q_text_run = qp.add_run(q["question_text"] + "\n")
        q_text_run.font.size = Pt(11.5)
        q_text_run.font.color.rgb = RGBColor(30, 41, 59)

        # Source Tag Badge
        source_tag = q.get("all_matched_sources") or q.get("matched_formatives") or "مصدر —"
        badge_run = qp.add_run(f"🏷️  [المصادر: {source_tag}]\n")
        badge_run.bold = True
        badge_run.font.size = Pt(10)
        badge_run.font.color.rgb = RGBColor(99, 102, 241) # Indigo/Purple

        # Options
        correct_letter = (q.get("correct_option") or "").upper().strip()
        options = [
            ("A", q.get("option_a", "")),
            ("B", q.get("option_b", "")),
            ("C", q.get("option_c", "")),
            ("D", q.get("option_d", ""))
        ]

        for letter, text in options:
            if not text:
                continue
            opt_p = doc.add_paragraph()
            opt_p.paragraph_format.left_indent = Inches(0.25)
            
            is_correct = (letter == correct_letter) or (q.get("is_yellow_highlighted") and letter == correct_letter)
            
            opt_run = opt_p.add_run(f"({letter}) {text}")
            opt_run.font.size = Pt(11)

            if is_correct:
                opt_run.bold = True
                opt_run.font.highlight_color = WD_COLOR_INDEX.YELLOW
                check_run = opt_p.add_run("  ✓ (الإجابة الصحيحة)")
                check_run.font.size = Pt(9.5)
                check_run.font.color.rgb = RGBColor(22, 101, 52)

        doc.add_paragraph("-" * 45)

    safe_name = re.sub(r'[\\/*?:"<>|]', '', lecture_name).strip()[:45]
    out_filename = f"MultiSource_{safe_name}.docx"
    out_path = os.path.join(EXPORTS_DIR, out_filename)
    doc.save(out_path)
    return out_path
