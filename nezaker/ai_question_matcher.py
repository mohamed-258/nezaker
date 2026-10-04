import os
import json
import re
import sqlite3
import database
import gemini_service
import docx_service
import pdf_ocr_service

def gather_source_pages(source_files: list = None) -> list:
    """
    Gathers all pages from the requested source files (or all cached exam files).
    Ensures that unindexed files are indexed and cached first.
    """
    conn = database.get_connection()
    cur = conn.cursor()

    pages = []
    if source_files:
        clean_sfs = [os.path.basename(sf) for sf in source_files if sf]
        for sf in clean_sfs:
            try:
                pdf_ocr_service.ensure_file_indexed(sf)
            except Exception as e:
                print(f"[MATCHER] Ensure index warning for {sf}: {e}")

        sf_placeholders = ",".join("?" * len(clean_sfs))
        cur.execute(
            f"SELECT filename, page_num, text_content FROM exam_pdf_cache WHERE filename IN ({sf_placeholders}) ORDER BY filename ASC, page_num ASC",
            clean_sfs
        )
        pages = [dict(r) for r in cur.fetchall()]
    else:
        cur.execute(
            "SELECT filename, page_num, text_content FROM exam_pdf_cache ORDER BY filename ASC, page_num ASC"
        )
        pages = [dict(r) for r in cur.fetchall()]

    conn.close()

    valid_pages = [p for p in pages if p.get("text_content") and len(p["text_content"].strip()) >= 40]
    return valid_pages

def gather_lecture_curriculum_text(lecture_ids: list):
    """
    Fetches comprehensive syllabus information and extracted text for the selected lectures
    so Gemini has the exact factual basis to determine curriculum match and cite lecture evidence.
    """
    conn = database.get_connection()
    cur = conn.cursor()

    placeholders = ",".join("?" * len(lecture_ids))
    cur.execute(
        f"""SELECT id, title, subject, summary_arabic, high_yield_notes, clinical_pearls, extracted_text 
            FROM lectures WHERE id IN ({placeholders})""",
        lecture_ids
    )
    lectures = [dict(r) for r in cur.fetchall()]
    conn.close()

    curriculum_blocks = []
    for l in lectures:
        summary = (l.get("summary_arabic") or l.get("high_yield_notes") or "").strip()
        pearls = (l.get("clinical_pearls") or "").strip()
        extracted = (l.get("extracted_text") or "").strip()
        excerpt = extracted[:4000] if extracted else ""

        block = f"--- [TARGET LECTURE ID: {l['id']}] {l['title']} (Subject: {l.get('subject', 'General')}) ---\n"
        if summary:
            block += f"KEY SYLLABUS CONCEPTS:\n{summary}\n"
        if pearls:
            block += f"CLINICAL / IMPORTANT POINTS:\n{pearls}\n"
        if excerpt:
            block += f"LECTURE CONTENT / SLIDES EXCERPTS:\n{excerpt}\n"
        curriculum_blocks.append(block)

    return lectures, "\n\n".join(curriculum_blocks)

def is_question_bearing_page(text: str) -> bool:
    """Checks if a page contains readable text (not a blank page or empty cover)."""
    txt = (text or "").strip()
    if len(txt) < 30:
        return False
    txt_lower = txt.lower()
    if len(txt) < 120 and any(w in txt_lower for w in ["table of contents", "blank page", "this page intentionally left blank"]):
        return False
    return True

def save_extracted_questions_to_cache(questions: list):
    """Permanently saves or updates extracted exam questions into exam_extracted_questions table."""
    conn = database.get_connection()
    cur = conn.cursor()
    for q in questions:
        try:
            sf = (q.get("source_file") or q.get("source_filename") or "").strip()
            qt = (q.get("question_text") or "").strip()
            if not qt:
                continue
            
            cur.execute(
                "SELECT id FROM exam_extracted_questions WHERE source_filename=? AND question_text=?",
                (sf, qt)
            )
            row = cur.fetchone()
            if row:
                cur.execute('''
                    UPDATE exam_extracted_questions
                    SET source_page=?, lecture_id=?, lecture_title=?, option_a=?, option_b=?, option_c=?, option_d=?,
                        correct_option=?, explanation=?, lecture_evidence=?, rejection_reason=?, status=?
                    WHERE id=?
                ''', (
                    q.get("source_page", 1),
                    q.get("lecture_id"),
                    q.get("lecture_title", ""),
                    q.get("option_a", ""),
                    q.get("option_b", ""),
                    q.get("option_c", ""),
                    q.get("option_d", ""),
                    str(q.get("correct_option", "A")).upper()[:1],
                    q.get("explanation", ""),
                    q.get("lecture_evidence", ""),
                    q.get("rejection_reason", ""),
                    q.get("status", "accepted"),
                    row["id"]
                ))
            else:
                cur.execute('''
                    INSERT INTO exam_extracted_questions (
                        source_filename, source_page, lecture_id, lecture_title, question_text,
                        option_a, option_b, option_c, option_d, correct_option, explanation,
                        lecture_evidence, rejection_reason, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    sf,
                    q.get("source_page", 1),
                    q.get("lecture_id"),
                    q.get("lecture_title", ""),
                    qt,
                    q.get("option_a", ""),
                    q.get("option_b", ""),
                    q.get("option_c", ""),
                    q.get("option_d", ""),
                    str(q.get("correct_option", "A")).upper()[:1],
                    q.get("explanation", ""),
                    q.get("lecture_evidence", ""),
                    q.get("rejection_reason", ""),
                    q.get("status", "accepted")
                ))
        except Exception as e:
            print(f"[CACHE] Error saving question to cache: {e}")
            
    conn.commit()
    conn.close()

def get_cached_extracted_questions(source_files: list = None) -> list:
    """Retrieves all cached extracted questions for given source files from database."""
    conn = database.get_connection()
    cur = conn.cursor()
    if source_files:
        clean_sfs = [os.path.basename(sf) for sf in source_files if sf]
        placeholders = ",".join("?" * len(clean_sfs))
        cur.execute(
            f"SELECT * FROM exam_extracted_questions WHERE source_filename IN ({placeholders}) ORDER BY source_filename ASC, source_page ASC, id ASC",
            clean_sfs
        )
    else:
        cur.execute(
            "SELECT * FROM exam_extracted_questions ORDER BY source_filename ASC, source_page ASC, id ASC"
        )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    for r in rows:
        r["source_file"] = r.get("source_filename")
        if not r.get("correct_option"):
            r["correct_option"] = "A"
    return rows

def align_cached_questions_with_lectures(cached_qs: list, lectures: list, curriculum_text: str) -> list:
    """
    Takes already extracted questions and quickly aligns/classifies them with target lectures.
    Uses cached matching if already present, or executes a lightweight batch prompt without re-reading PDFs.
    """
    from concurrent.futures import ThreadPoolExecutor

    target_lec_ids = set(l["id"] for l in lectures)
    target_lec_map = {l["id"]: l["title"] for l in lectures}

    # Questions that already have confirmed matching to one of the target lectures
    already_matched = [q for q in cached_qs if q.get("lecture_id") in target_lec_ids and q.get("status") == "accepted"]
    unmatched_pool = [q for q in cached_qs if q not in already_matched]

    if len(already_matched) > 0 and len(unmatched_pool) == 0:
        return already_matched

    # Classify the remaining cached questions against the target lectures in fast text batches
    BATCH_SIZE = 15
    q_batches = [unmatched_pool[i:i + BATCH_SIZE] for i in range(0, len(unmatched_pool), BATCH_SIZE)]

    system_instruction = (
        "You are an expert academic medical professor auditing pre-extracted exam questions.\n"
        "Evaluate whether each question belongs to the TARGET LECTURES syllabus:\n"
        "- If it belongs to one of the target lectures, set status='accepted', specify lecture_id, lecture_title, lecture_evidence, and bilingual explanation.\n"
        "- If it does NOT belong to the target lectures, set status='rejected' and specify rejection_reason.\n"
        "Return STRICT valid JSON only."
    )

    def process_q_batch(batch):
        items_text = ""
        for idx, q in enumerate(batch):
            items_text += f"\n[Q_INDEX: {idx}] Page: {q.get('source_page', 1)} | Stem: {q.get('question_text')}\n"
            items_text += f"A) {q.get('option_a')} | B) {q.get('option_b')} | C) {q.get('option_c')} | D) {q.get('option_d')}\n"

        prompt = f"""
TARGET LECTURES SYLLABUS:
{curriculum_text}

EXAM QUESTIONS TO CLASSIFY:
{items_text}

JSON FORMAT:
{{
  "evaluations": [
    {{
      "q_index": 0,
      "status": "accepted",
      "lecture_id": {lectures[0]['id']},
      "lecture_title": "{lectures[0]['title']}",
      "lecture_evidence": "سبب القبول والموضع في المحاضرة",
      "explanation": "تعليل طبي مكس بالعربي مع مصطلحات طبية إنجليزية",
      "rejection_reason": ""
    }}
  ]
}}
"""
        try:
            raw = gemini_service.resilient_generate(
                prompt=prompt,
                system_instruction=system_instruction,
                json_mode=True,
                operation="exam_filtering"
            )
            cleaned = gemini_service.clean_json_text(raw)
            evals = json.loads(cleaned).get("evaluations", [])
            eval_map = {e.get("q_index"): e for e in evals if "q_index" in e}
            
            for idx, q in enumerate(batch):
                ev = eval_map.get(idx)
                if ev:
                    st = str(ev.get("status", "rejected")).lower()
                    q["status"] = "accepted" if (st == "accepted" and ev.get("lecture_id") in target_lec_ids) else "rejected"
                    q["lecture_id"] = ev.get("lecture_id") if q["status"] == "accepted" else None
                    q["lecture_title"] = target_lec_map.get(q["lecture_id"], "") if q["status"] == "accepted" else ""
                    q["lecture_evidence"] = ev.get("lecture_evidence", "")
                    q["rejection_reason"] = ev.get("rejection_reason", "")
                    if ev.get("explanation"):
                        q["explanation"] = ev.get("explanation")
                else:
                    q["status"] = "rejected"
                    q["rejection_reason"] = "سؤال خارج المحاضرات المحددة"
            return batch
        except Exception as e:
            print(f"[MATCHER] Batch classification error: {e}")
            for q in batch:
                q["status"] = "rejected"
                q["rejection_reason"] = "سؤال خارج المحاضرات المحددة"
            return batch

    classified_results = []
    if q_batches:
        with ThreadPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(process_q_batch, q_batches))
            for r in results:
                classified_results.extend(r)
    else:
        classified_results = unmatched_pool

    all_evaluated = already_matched + classified_results
    # Update cache in database with the new classifications
    save_extracted_questions_to_cache(all_evaluated)
    return all_evaluated

def match_exam_questions(lecture_ids: list, source_files: list = None, max_questions: int = 50, force_reextract: bool = False):
    """
    Audits exam pages with Gemini:
    - Checks database cache first to reuse already extracted questions without re-scanning PDFs.
    - If not cached (or force_reextract=True), exhaustively extracts ALL questions across ALL exam pages
      and caches them permanently in SQLite.
    """
    from concurrent.futures import ThreadPoolExecutor

    clean_sfs = [os.path.basename(sf) for sf in source_files if sf] if source_files else []

    lectures, curriculum_text = gather_lecture_curriculum_text(lecture_ids)
    if not lectures:
        return {
            "success": False,
            "error": "لم يتم العثور على المحاضرات المحددة في قاعدة البيانات.",
            "questions": [],
            "rejected_questions": [],
            "all_questions": [],
            "stats": {"total_scanned": 0, "accepted": 0, "rejected": 0, "acceptance_rate": "0%"}
        }

    # 1. Check if questions for these files are ALREADY extracted and cached in database
    if not force_reextract and clean_sfs:
        cached_questions = get_cached_extracted_questions(clean_sfs)
        if cached_questions and len(cached_questions) >= 5:
            print(f"[AI_MATCHER] Using {len(cached_questions)} pre-extracted questions from database cache for {clean_sfs}!")
            aligned_questions = align_cached_questions_with_lectures(cached_questions, lectures, curriculum_text)
            
            matched_qs = [q for q in aligned_questions if q.get("status") == "accepted"]
            rejected_qs = [q for q in aligned_questions if q.get("status") == "rejected"]
            total_scanned = len(aligned_questions)
            accepted_count = len(matched_qs)
            rejected_count = len(rejected_qs)
            rate_str = f"{round((accepted_count / total_scanned * 100), 1)}%" if total_scanned > 0 else "0%"
            
            return {
                "success": True,
                "from_cache": True,
                "lectures": lectures,
                "stats": {
                    "total_scanned": total_scanned,
                    "accepted": accepted_count,
                    "rejected": rejected_count,
                    "acceptance_rate": rate_str
                },
                "all_questions": aligned_questions,
                "questions": matched_qs,
                "rejected_questions": rejected_qs
            }

    raw_pages = gather_source_pages(source_files)
    if not raw_pages:
        return {
            "success": False,
            "error": "لم يتم العثور على صفحات كافية في كاش الامتحانات للملفات المحددة. يرجى التأكد من رفع واستخراج الملفات أولاً.",
            "questions": [],
            "rejected_questions": [],
            "all_questions": [],
            "stats": {"total_scanned": 0, "accepted": 0, "rejected": 0, "acceptance_rate": "0%"}
        }

    # Filter out empty or blank pages, preserving every page with question content
    valid_pages = [p for p in raw_pages if is_question_bearing_page(p.get("text_content", ""))]
    if not valid_pages:
        valid_pages = raw_pages

    # Sort strictly by filename and page number so exam questions are read in natural order
    valid_pages.sort(key=lambda p: (str(p.get("filename", "")), int(p.get("page_num", 0))))

    # Scan 2 pages per batch for maximum extraction completeness and zero output token truncation
    BATCH_SIZE = 2
    page_batches = [valid_pages[i:i + BATCH_SIZE] for i in range(0, len(valid_pages), BATCH_SIZE)]

    system_instruction = (
        "You are an expert academic professor and medical exam auditor for 2nd-year medical students.\n"
        "Your task is to analyze raw exam pages and perform an EXHAUSTIVE extraction and curriculum alignment:\n"
        "1. Extract EVERY SINGLE question found in the provided exam pages (MCQs). Do not skip or summarize any question.\n"
        "2. For each question, decide whether it matches the TARGET LECTURES syllabus or is REJECTED:\n"
        "   - If ACCEPTED / MATCHED:\n"
        "     * Set status to 'accepted'.\n"
        "     * Specify 'lecture_id' and 'lecture_title' of the matching target lecture.\n"
        "     * Provide 'lecture_evidence' in Arabic: clearly explain where in the lecture, which concept/topic or slide it is based on, and why it matches our curriculum.\n"
        "     * Provide 'explanation' in bilingual style (Arabic reasoning embedding exact English medical terms without Arabizing bones, muscles, or nerves; e.g. explain why the correct option is right).\n"
        "   - If REJECTED:\n"
        "     * Set status to 'rejected'.\n"
        "     * Provide 'rejection_reason' in Arabic: specify clearly why it is rejected (e.g. belongs to another module like endocrine/renal, or topic not covered in the selected lectures).\n"
        "3. Ensure options A, B, C, D and correct_option (single uppercase letter 'A', 'B', 'C', or 'D') are captured accurately.\n"
        "Return STRICT valid JSON only."
    )

    def process_one_batch(batch_item):
        batch_idx, batch = batch_item
        pages_text_block = ""
        for p in batch:
            pages_text_block += f"\n=== [SOURCE FILE: {p['filename']} | PAGE: {p['page_num']}] ===\n{p['text_content']}\n"

        prompt = f"""
TARGET LECTURES SYLLABUS & CONTENT:
{curriculum_text}

EXAM PAGES TO AUDIT (Batch {batch_idx + 1}/{len(page_batches)}):
{pages_text_block}

TASK REQUIREMENTS:
1. Extract ALL multiple choice questions in these exam pages.
2. For every question, determine if it belongs to the target lectures or is rejected.
3. Return JSON in this exact structure:
{{
  "questions": [
    {{
      "status": "accepted",
      "lecture_id": {lectures[0]['id']},
      "lecture_title": "{lectures[0]['title']}",
      "question_text": "Question prompt text here",
      "option_a": "Option A text",
      "option_b": "Option B text",
      "option_c": "Option C text",
      "option_d": "Option D text",
      "correct_option": "B",
      "explanation": "شرح وتعليل طبي مكس (عربي مع مصطلحات طبية إنجليزية دون تعريب لأسماء العظام أو العضلات أو الأعصاب)",
      "lecture_evidence": "مذكور في المحاضرة تحت موضوع كذا وسلايد كذا حيث تم شرح مفهوم... وهو متوافق تماماً مع منهجنا المقرر",
      "rejection_reason": "",
      "source_file": "{batch[0]['filename']}",
      "source_page": {batch[0]['page_num']}
    }},
    {{
      "status": "rejected",
      "lecture_id": null,
      "lecture_title": "",
      "question_text": "Non-relevant question text here",
      "option_a": "Option A",
      "option_b": "Option B",
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_option": "A",
      "explanation": "",
      "lecture_evidence": "",
      "rejection_reason": "سؤال يخص الغدد الصماء أو الكلى أو موضوع خارج المحاضرات المحددة تماماً",
      "source_file": "{batch[0]['filename']}",
      "source_page": {batch[0]['page_num']}
    }}
  ]
}}
"""
        try:
            raw_response = gemini_service.resilient_generate(
                prompt=prompt,
                system_instruction=system_instruction,
                json_mode=True,
                operation="exam_filtering"
            )
            cleaned = gemini_service.clean_json_text(raw_response)
            parsed = json.loads(cleaned)
            batch_qs = parsed.get("questions", [])
            if not batch_qs and isinstance(parsed, list):
                batch_qs = parsed
            
            results = []
            for q in batch_qs:
                if not q.get("question_text"):
                    continue
                status = str(q.get("status", "accepted")).lower()
                if status not in ("accepted", "rejected"):
                    status = "accepted" if q.get("lecture_id") else "rejected"
                q["status"] = status
                
                co = str(q.get("correct_option", "A")).strip().upper()
                m = re.search(r'([A-D])', co)
                q["correct_option"] = m.group(1) if m else "A"
                results.append(q)
            return results
        except Exception as e:
            print(f"[AI_MATCHER] Error processing batch {batch_idx + 1}: {e}")
            return []

    all_extracted_questions = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        batch_results = list(executor.map(process_one_batch, enumerate(page_batches)))
        for b_res in batch_results:
            all_extracted_questions.extend(b_res)

    seen_keys = set()
    deduped_questions = []
    for q in all_extracted_questions:
        q_stem = re.sub(r'[\W_]+', '', q.get("question_text", "").strip().lower())
        opt_a = re.sub(r'[\W_]+', '', str(q.get("option_a", "")).strip().lower())
        opt_b = re.sub(r'[\W_]+', '', str(q.get("option_b", "")).strip().lower())
        dedup_key = f"{q_stem[:60]}_{opt_a[:20]}_{opt_b[:20]}"
        if len(q_stem) > 10 and dedup_key in seen_keys:
            continue
        if len(q_stem) > 10:
            seen_keys.add(dedup_key)
        deduped_questions.append(q)

    # Permanently cache all newly extracted questions into SQLite database
    if deduped_questions:
        try:
            save_extracted_questions_to_cache(deduped_questions)
            print(f"[AI_MATCHER] Successfully cached {len(deduped_questions)} extracted questions in database.")
        except Exception as ce:
            print(f"[AI_MATCHER] Warning caching questions: {ce}")

    matched_questions = [q for q in deduped_questions if q.get("status") == "accepted"]
    rejected_questions = [q for q in deduped_questions if q.get("status") == "rejected"]

    total_scanned = len(deduped_questions)
    accepted_count = len(matched_questions)
    rejected_count = len(rejected_questions)
    rate_str = f"{round((accepted_count / total_scanned * 100), 1)}%" if total_scanned > 0 else "0%"

    stats = {
        "total_scanned": total_scanned,
        "accepted": accepted_count,
        "rejected": rejected_count,
        "acceptance_rate": rate_str
    }

    return {
        "success": True,
        "lectures": lectures,
        "stats": stats,
        "all_questions": deduped_questions,
        "questions": matched_questions,
        "rejected_questions": rejected_questions
    }

def save_matched_questions_to_bank(questions: list, block_id: int = 1, batch_name: str = ""):
    """Saves matched questions into the main Nezaker questions bank and updates lecture Word doc."""
    conn = database.get_connection()
    cur = conn.cursor()
    
    saved_count = 0
    questions_by_lecture = {}
    lecture_batch_map = {} # (lec_id, batch_title) -> batch_number

    for q in questions:
        try:
            lec_id = q.get("lecture_id")
            if not lec_id:
                continue

            src_file = (q.get("source_file") or q.get("source_filename") or "").strip()
            if not src_file:
                src_file = "امتحان سابق"
            
            # Distinct batch naming requested by user: 'فلترة: [اسم الملف]'
            current_batch_name = batch_name.strip() if batch_name else f"فلترة: {src_file}"
            
            # Determine batch_number for this lecture and batch name
            batch_key = (lec_id, current_batch_name)
            if batch_key not in lecture_batch_map:
                cur.execute("SELECT batch_number FROM questions WHERE lecture_id=? AND batch_name=? LIMIT 1", (lec_id, current_batch_name))
                existing_b = cur.fetchone()
                if existing_b and existing_b[0]:
                    lecture_batch_map[batch_key] = existing_b[0]
                else:
                    cur.execute("SELECT COALESCE(MAX(batch_number), 0) FROM questions WHERE lecture_id=?", (lec_id,))
                    max_b = cur.fetchone()[0] or 0
                    lecture_batch_map[batch_key] = max_b + 1
            
            assigned_batch_num = lecture_batch_map[batch_key]

            cur.execute('''
                INSERT INTO questions (
                    block_id, lecture_id, question_type, question_text,
                    option_a, option_b, option_c, option_d,
                    correct_option, explanation, explanation_arabic, difficulty,
                    source, source_file, batch_number, batch_name, lecture_evidence, rejection_reason
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                block_id,
                lec_id,
                "mcq",
                q.get("question_text", ""),
                q.get("option_a", ""),
                q.get("option_b", ""),
                q.get("option_c", ""),
                q.get("option_d", ""),
                str(q.get("correct_option", "A")).upper()[:1],
                q.get("explanation", ""),
                q.get("explanation", ""),
                "medium",
                f"exam_pdf:{src_file}:p{q.get('source_page', 1)}",
                src_file,
                assigned_batch_num,
                current_batch_name,
                q.get("lecture_evidence", ""),
                q.get("rejection_reason", "")
            ))
            saved_count += 1

            cur.execute('''
                INSERT INTO exam_extracted_questions (
                    source_filename, source_page, lecture_id, question_text,
                    option_a, option_b, option_c, option_d,
                    correct_option, explanation, lecture_evidence, rejection_reason, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                src_file,
                q.get("source_page", 1),
                lec_id,
                q.get("question_text", ""),
                q.get("option_a", ""),
                q.get("option_b", ""),
                q.get("option_c", ""),
                q.get("option_d", ""),
                str(q.get("correct_option", "A")).upper()[:1],
                q.get("explanation", ""),
                q.get("lecture_evidence", ""),
                q.get("rejection_reason", ""),
                q.get("status", "accepted")
            ))

            if lec_id not in questions_by_lecture:
                questions_by_lecture[lec_id] = []
            questions_by_lecture[lec_id].append(q)

        except Exception as e:
            print(f"[AI_MATCHER] Error saving question to bank: {e}")
            
    conn.commit()
    conn.close()

    # Rebuild Word doc for each affected lecture
    for lid in questions_by_lecture.keys():
        try:
            docx_service.rebuild_lecture_word_document(lid)
        except Exception as we:
            print(f"[AI_MATCHER] Warning updating lecture docx for lecture {lid}: {we}")

    return saved_count
