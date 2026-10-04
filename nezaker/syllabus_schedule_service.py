import os
import re
import json
import math
from datetime import datetime, date, timedelta
import database
import gemini_service

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def is_vertical_lecture(title: str, subject: str = "") -> bool:
    """
    Checks if a lecture belongs to Vertical Integration or non-core clinical/humanities modules
    which should be excluded from the core medical block study schedule.
    """
    text = f"{title or ''} {subject or ''}".lower()
    
    # Direct keyword matches
    if any(k in text for k in [
        "vertical", "فيرتيكال", "فورتيكال", "طولي", "تكامل رأسي", "تكامل طولي",
        "ethics", "أخلاقيات", "professionalism", "احترافية", "مهنية",
        "communication skills", "مهارات اتصال", "مهارات التواصل",
        "patient safety", "سلامة المرضى", "quality in healthcare",
        "infection control", "مكافحة العدوى",
        "research methodology", "طرق البحث", "البحث العلمي", "medical biostatistics",
        "evidence based medicine", "evidence-based", "ebm",
        "behavioral science", "behavioral sciences", "علوم سلوكية",
        "first aid", "basic clinical skills"
    ]):
        return True

    # Regex for VI abbreviation, e.g. "VI 1", "VI-2", "V.I."
    if re.search(r'\b(vi|v\.i\.)\s*\d*\b', text):
        return True

    return False

def clean_and_split_syllabus_lectures(lectures_list: list) -> list:
    """
    Processes a list of syllabus lectures:
    1. EXCLUDES all Vertical Integration and non-core humanities modules.
    2. SPLITS any merged lectures (e.g. 'Anatomy 1,2', 'Physiology 3,4', 'Biochemistry 1 & 2')
       into distinct, individual lecture objects ('Anatomy 1', 'Anatomy 2').
    3. Re-sequences lecture_number sequentially (1, 2, 3...).
    """
    if not lectures_list:
        return []

    split_lectures = []
    for item in lectures_list:
        title = (item.get("title") or "").strip()
        subject = (item.get("subject") or "").strip()
        
        # 1. Skip Vertical lectures
        if is_vertical_lecture(title, subject) or item.get("is_vertical"):
            continue

        # 2. Check for merged lecture numbers (e.g. 'Anatomy 1,2', 'Physiology 3,4', 'Pathology 2,3', 'Histology 1-2')
        m = re.search(r'^(.*?)\s*(\d+(?:\s*(?:,|&|\band\b|-|\/)\s*\d+)+)(.*)$', title, re.IGNORECASE)
        if m:
            prefix = m.group(1).strip()
            num_str = m.group(2).strip()
            suffix = m.group(3).strip()
            suffix_str = f" {suffix}" if suffix else ""

            # Check if range with hyphen: '1-3'
            if '-' in num_str and ',' not in num_str and '&' not in num_str:
                parts = [int(x) for x in re.findall(r'\d+', num_str)]
                if len(parts) == 2 and 0 < parts[1] - parts[0] <= 5:
                    nums = list(range(parts[0], parts[1] + 1))
                else:
                    nums = parts
            else:
                nums = [int(x) for x in re.findall(r'\d+', num_str)]

            if 1 < len(nums) <= 6:
                orig_pages = int(item.get("estimated_pages") or 12)
                per_page = max(6, round(orig_pages / len(nums)))
                orig_ar = item.get("title_arabic") or ""

                for n in nums:
                    new_item = dict(item)
                    new_item["title"] = f"{prefix} {n}{suffix_str}".strip()
                    new_item["estimated_pages"] = per_page
                    if orig_ar:
                        base_ar = re.sub(r'\d+.*', '', orig_ar).strip()
                        new_item["title_arabic"] = f"{base_ar} {n}".strip()
                    split_lectures.append(new_item)
                continue

        # If not merged, keep as is
        split_lectures.append(dict(item))

    # 3. Re-assign sequential lecture_number
    for seq_idx, lec in enumerate(split_lectures, 1):
        lec["lecture_number"] = seq_idx

    return split_lectures

def extract_file_content_for_schedule(file_path: str):
    """
    Extracts text, table data, or multimodal bytes from an uploaded schedule file.
    Supports PDF, Excel (.xlsx, .xls), Word (.docx), text (.txt), and Images (.jpg, .png, .jpeg).
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    # 1. Images (JPG, PNG, WEBP)
    if ext in ('.jpg', '.jpeg', '.png', '.webp'):
        mime_map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp'
        }
        with open(file_path, 'rb') as f:
            b = f.read()
        return {
            "mode": "multimodal",
            "file_bytes": b,
            "mime_type": mime_map.get(ext, 'image/jpeg'),
            "text": ""
        }

    # 2. PDF Documents
    if ext == '.pdf':
        try:
            import fitz
            doc = fitz.open(file_path)
            extracted_pages = []
            for page_num in range(min(len(doc), 15)): # Schedules rarely exceed 15 pages
                extracted_pages.append(doc[page_num].get_text())
            full_text = "\n--- PAGE ---\n".join(extracted_pages).strip()
            
            # If text was very sparse (scanned PDF), read file bytes for multimodal vision
            if len(full_text) < 150:
                with open(file_path, 'rb') as f:
                    b = f.read()
                return {
                    "mode": "multimodal",
                    "file_bytes": b,
                    "mime_type": "application/pdf",
                    "text": full_text
                }
            return {
                "mode": "text",
                "file_bytes": None,
                "mime_type": "",
                "text": full_text
            }
        except Exception as e:
            print(f"[SYLLABUS_SERVICE] Error reading PDF: {e}")

    # 3. Excel Spreadsheets (.xlsx, .xls)
    if ext in ('.xlsx', '.xls'):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(file_path, data_only=True)
            text_lines = []
            for sheet_name in wb.sheetnames:
                sheet = wb[sheet_name]
                text_lines.append(f"=== Sheet: {sheet_name} ===")
                for row in sheet.iter_rows(values_only=True):
                    row_vals = [str(c).strip() for c in row if c is not None and str(c).strip()]
                    if row_vals:
                        text_lines.append(" | ".join(row_vals))
            return {
                "mode": "text",
                "file_bytes": None,
                "mime_type": "",
                "text": "\n".join(text_lines)
            }
        except Exception as e:
            print(f"[SYLLABUS_SERVICE] Error reading Excel: {e}")

    # 4. Word Documents (.docx)
    if ext == '.docx':
        try:
            import docx
            doc = docx.Document(file_path)
            text_lines = []
            for p in doc.paragraphs:
                if p.text.strip():
                    text_lines.append(p.text.strip())
            for t in doc.tables:
                for row in t.rows:
                    row_vals = [c.text.strip() for c in row.cells if c.text.strip()]
                    if row_vals:
                        text_lines.append(" | ".join(row_vals))
            return {
                "mode": "text",
                "file_bytes": None,
                "mime_type": "",
                "text": "\n".join(text_lines)
            }
        except Exception as e:
            print(f"[SYLLABUS_SERVICE] Error reading Word: {e}")

    # 5. Plain text or fallback
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return {
                "mode": "text",
                "file_bytes": None,
                "mime_type": "",
                "text": f.read()
            }
    except Exception as e:
        return {"mode": "text", "file_bytes": None, "mime_type": "", "text": ""}

def parse_schedule_input(file_path: str = None, raw_text: str = "") -> dict:
    """
    Parses an uploaded file or raw text input into structured lecture objects.
    """
    file_bytes = None
    mime_type = ""
    extracted_text = raw_text or ""

    if file_path and os.path.exists(file_path):
        parsed_file = extract_file_content_for_schedule(file_path)
        if parsed_file["mode"] == "multimodal":
            file_bytes = parsed_file["file_bytes"]
            mime_type = parsed_file["mime_type"]
        if parsed_file["text"]:
            extracted_text = (extracted_text + "\n" + parsed_file["text"]).strip()

    if not extracted_text and not file_bytes:
        return {"error": "No valid schedule content or file provided"}

    # Call Gemini to parse and structure the syllabus
    res = gemini_service.parse_syllabus_or_schedule(
        schedule_text=extracted_text,
        file_bytes=file_bytes,
        mime_type=mime_type
    )
    if isinstance(res, dict) and "lectures" in res and isinstance(res["lectures"], list):
        res["lectures"] = clean_and_split_syllabus_lectures(res["lectures"])
        res["total_lectures_detected"] = len(res["lectures"])
    return res

def apply_custom_syllabus_schedule(
    block_id: int,
    lectures_data: list,
    start_date_str: str = None,
    duration_weeks: int = 5,
    end_date_str: str = None,
    off_days_weekdays: list = None,
    off_dates: list = None,
    include_first_review: bool = True,
    include_second_review: bool = True,
    include_final_drill: bool = True,
    replace_existing_lectures: bool = False
) -> dict:
    """
    Applies the custom imported syllabus:
    1. Upserts/Inserts lectures in database for active block in sequential order.
    2. Calculates active study dates strictly respecting off_days_weekdays and off_dates.
    3. Multi-phase distribution:
       - Phase 1: First Study (دراسة أولى)
       - Phase 2: First Review (مراجعة أولى)
       - Phase 3: Second Review (مراجعة ثانية)
       - Phase 4: Final Consolidation & Mock Exams (مراجعة ختامية وتدريب امتحانات)
    """
    conn = database.get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM blocks WHERE id=?", (block_id,))
    block = cur.fetchone()
    if not block:
        conn.close()
        return {"error": "Block not found"}

    if not lectures_data:
        conn.close()
        return {"error": "No lectures provided to schedule"}

    # Exclude vertical lectures and split any merged lecture titles (e.g. Anatomy 1,2 -> Anatomy 1 & Anatomy 2)
    lectures_data = clean_and_split_syllabus_lectures(lectures_data)
    if not lectures_data:
        conn.close()
        return {"error": "No valid lectures remaining after excluding vertical lectures"}

    # Determine start date
    if not start_date_str:
        start_date_str = date.today().isoformat()
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()

    # Determine duration
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            diff_days = (end_date - start_date).days
            if diff_days > 0:
                duration_weeks = max(1, math.ceil(diff_days / 7))
        except Exception:
            pass

    if off_days_weekdays is None:
        off_days_weekdays = [4] # Default: Friday
    if off_dates is None:
        off_dates = []

    # Optional: replace existing lectures if requested
    if replace_existing_lectures:
        # Delete lectures that have no files or answers attached
        cur.execute("DELETE FROM study_tasks WHERE block_id=?", (block_id,))
        cur.execute("DELETE FROM lectures WHERE block_id=? AND (file_path IS NULL OR file_path='')", (block_id,))

    # 1. Upsert/Insert lectures
    inserted_lectures = []
    for idx, item in enumerate(lectures_data, 1):
        title = item.get("title", f"Lecture {idx}").strip()
        subject = item.get("subject", "General").strip()
        lec_num = int(item.get("lecture_number") or idx)
        pages = int(item.get("estimated_pages") or 12)
        diff = int(item.get("difficulty") or 2)

        # Check if lecture with this title already exists in block
        cur.execute("SELECT id, lecture_number, title, subject, page_count FROM lectures WHERE block_id=? AND title=?", (block_id, title))
        existing = cur.fetchone()
        if existing:
            lec_id = existing['id']
            # Update metadata if needed
            cur.execute("UPDATE lectures SET lecture_number=?, subject=?, page_count=? WHERE id=?", (lec_num, subject, pages, lec_id))
        else:
            cur.execute('''
            INSERT INTO lectures (block_id, lecture_number, title, subject, page_count, difficulty)
            VALUES (?, ?, ?, ?, ?, ?)
            ''', (block_id, lec_num, title, subject, pages, diff))
            lec_id = cur.lastrowid

        inserted_lectures.append({
            "id": lec_id,
            "lecture_number": lec_num,
            "title": title,
            "subject": subject,
            "page_count": pages,
            "difficulty": diff
        })

    # Sort lectures according to original syllabus sequence
    inserted_lectures.sort(key=lambda x: x["lecture_number"])

    # 2. Calculate Active Study Days
    total_calendar_days = duration_weeks * 7
    study_dates = []
    curr = start_date
    for _ in range(total_calendar_days):
        date_str = curr.isoformat()
        is_weekly_off = curr.weekday() in off_days_weekdays
        is_specific_off = date_str in off_dates

        if not (is_weekly_off or is_specific_off):
            study_dates.append(curr)
        curr += timedelta(days=1)

    if not study_dates:
        conn.close()
        return {"error": "No study days available. Please adjust your off-days or duration."}

    total_study_days = len(study_dates)

    # Reserve final consolidation days
    consolidation_days = 3 if total_study_days >= 18 else (2 if total_study_days >= 10 else 1)
    if not include_final_drill:
        consolidation_days = 0

    teaching_days_count = max(1, total_study_days - consolidation_days)
    teaching_dates = study_dates[:teaching_days_count]

    # 3. Phase 1: First Study (دراسة أولى)
    total_lecs = len(inserted_lectures)
    daily_first_study = [[] for _ in range(teaching_days_count)]
    lec_first_study_day = {} # lec_id -> day_index

    lec_idx = 0
    for day_i in range(teaching_days_count):
        rem_days = teaching_days_count - day_i
        rem_lecs = total_lecs - lec_idx
        target_count = min(3, max(1, round(rem_lecs / rem_days)))

        while lec_idx < total_lecs and len(daily_first_study[day_i]) < target_count:
            lec = inserted_lectures[lec_idx]
            daily_first_study[day_i].append(lec)
            lec_first_study_day[lec["id"]] = day_i
            lec_idx += 1

    # Place any remaining into least loaded days
    while lec_idx < total_lecs:
        best_d = min(range(teaching_days_count), key=lambda d: len(daily_first_study[d]))
        lec = inserted_lectures[lec_idx]
        daily_first_study[best_d].append(lec)
        lec_first_study_day[lec["id"]] = best_d
        lec_idx += 1

    # Plan container for all study days: day_index -> list of task dicts
    day_tasks_plan = [[] for _ in range(total_study_days)]

    # Add First Study tasks
    for day_i, lecs in enumerate(daily_first_study):
        for lec in lecs:
            p = lec['page_count'] or 12
            q_target = min(25, max(8, round(p * 1.3)))
            c_target = min(30, max(10, round(p * 1.5)))
            day_tasks_plan[day_i].append({
                "lecture_id": lec["id"],
                "task_type": "first_study",
                "title": f"📖 دراسة أولى: {lec['title']}",
                "description": f"مادة {lec['subject']} — استيعاب الشرح وتأسيس المفاهيم وحل أسئلة تأسيسية.",
                "target_questions": q_target,
                "target_cards": c_target
            })

    # 4. Phase 2: First Review (مراجعة أولى)
    # Target spacing: Exactly 1 study day after first study (بعديه بيوم)
    rev1_day_map = {} # lec_id -> rev1_day
    if include_first_review:
        for lec in inserted_lectures:
            fs_day = lec_first_study_day.get(lec["id"], 0)
            rev1_day = min(fs_day + 1, total_study_days - 1)
            rev1_day_map[lec["id"]] = rev1_day
            
            day_tasks_plan[rev1_day].append({
                "lecture_id": lec["id"],
                "task_type": "spaced_review_quiz",
                "title": f"🔔 مراجعة أولى (استرجاع نشط): {lec['title']}",
                "description": f"تثبيت مفاهيم {lec['title']} ({lec['subject']}) بعد يوم من المذاكرة الأولى، بحل بنك الأسئلة والبطاقات الذكية.",
                "target_questions": 15,
                "target_cards": 15
            })

    # 5. Phase 3: Second Review (مراجعة ثانية)
    # Target spacing: Exactly 4 study days after first review (والثانية بعديها بـ 4)
    all_rev2_days = []
    if include_second_review and total_study_days >= 6:
        for lec in inserted_lectures:
            fs_day = lec_first_study_day.get(lec["id"], 0)
            rev1_day = rev1_day_map.get(lec["id"], min(fs_day + 1, total_study_days - 1))
            rev2_day = min(rev1_day + 4, total_study_days - 1)
            all_rev2_days.append(rev2_day)
            
            day_tasks_plan[rev2_day].append({
                "lecture_id": lec["id"],
                "task_type": "spaced_review_cards",
                "title": f"🧠 مراجعة ثانية (إتقان وتثبيت طويل المدى): {lec['title']}",
                "description": f"مراجعة متقدمة وإتقان الثوابت والأرقام وحل أسئلة الحالات السريرية لـ {lec['title']} بعد 4 أيام من المراجعة الأولى.",
                "target_questions": 20,
                "target_cards": 20
            })

    # 6. Comprehensive Review (المراجعة الشاملة التراكمية)
    # Rule: Once the first second-review is completed (earliest rev2_day), 
    # add a "المراجعة الشاملة" task to EVERY subsequent study day until the end of the schedule!
    if all_rev2_days:
        first_completed_rev2_day = min(all_rev2_days)
        first_lec_id = inserted_lectures[0]['id'] if inserted_lectures else 1
        for day_i in range(first_completed_rev2_day + 1, total_study_days):
            day_tasks_plan[day_i].append({
                "lecture_id": first_lec_id,
                "task_type": "comprehensive_review",
                "title": "🔄 المراجعة الشاملة التراكمية",
                "description": "مراجعة تراكمية شاملة لكافة المحاضرات السابقة التي تمت مراجعتها الثانية، وتثبيت الحفظ وحل كروت الفلاش وبنك الأسئلة التراكمي.",
                "target_questions": 25,
                "target_cards": 30
            })

    # 7. Phase 4: Final Consolidation & Mock Exams
    if include_final_drill and consolidation_days > 0:
        first_lec_id = inserted_lectures[0]['id'] if inserted_lectures else 1
        for rev_i in range(teaching_days_count, total_study_days):
            day_num = rev_i - teaching_days_count + 1
            day_tasks_plan[rev_i].append({
                "lecture_id": first_lec_id,
                "task_type": "final_block_revision",
                "title": f"🏆 مراجعة ختامية شاملة وتدريب امتحانات (اليوم {day_num})",
                "description": "حل امتحانات السنوات السابقة الشاملة ومراجعة تجميعات البلوك ومحاكاة الامتحان النهائي.",
                "target_questions": 50,
                "target_cards": 40
            })

    # 8. Commit Tasks to Database
    # Remove incomplete non-custom tasks for this block
    cur.execute("DELETE FROM study_tasks WHERE block_id=? AND is_completed=0 AND task_type != 'custom_task'", (block_id,))

    tasks_count = 0
    for day_i, tasks_list in enumerate(day_tasks_plan):
        plan_date = study_dates[day_i].isoformat()
        for t in tasks_list:
            cur.execute('''
            INSERT INTO study_tasks (block_id, lecture_id, plan_date, task_type, title, description, target_questions, target_cards)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                block_id,
                t["lecture_id"],
                plan_date,
                t["task_type"],
                t["title"],
                t["description"],
                t["target_questions"],
                t["target_cards"]
            ))
            tasks_count += 1

    # Save schedule configuration in settings
    cfg = {
        "start_date": start_date_str,
        "duration_weeks": duration_weeks,
        "off_days_weekdays": off_days_weekdays,
        "off_dates": list(set(off_dates)),
        "force_study_dates": [],
        "include_first_review": include_first_review,
        "include_second_review": include_second_review,
        "include_final_drill": include_final_drill,
        "total_lectures": len(inserted_lectures)
    }
    cur.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (f"block_{block_id}_schedule_config", json.dumps(cfg)))
    
    exam_date_str = (start_date + timedelta(days=total_calendar_days)).isoformat()
    cur.execute("UPDATE blocks SET start_date=?, duration_weeks=?, exam_date=? WHERE id=?", (start_date_str, duration_weeks, exam_date_str, block_id))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "total_lectures": len(inserted_lectures),
        "total_tasks_created": tasks_count,
        "available_study_days": total_study_days,
        "duration_weeks": duration_weeks,
        "start_date": start_date_str,
        "exam_date": exam_date_str,
        "schedule_config": cfg
    }

def adaptive_rebalance_after_task_completion(block_id: int, task_id: int) -> dict:
    """
    Intelligently recalibrates and rebalances the remaining schedule upon completing a task:
    1. Marks the target task as completed.
    2. If it was a 'first_study' task, positions its Review 1 on the very next study day,
       and its Review 2 exactly 4 study days after Review 1.
    3. If it was a 'spaced_review_quiz' (Review 1), positions Review 2 on the 4th study day.
    4. Smooths out any overdue tasks forward starting tomorrow without day overloading.
    5. Keeps cumulative 'comprehensive_review' active.
    """
    conn = database.get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM study_tasks WHERE id=?", (task_id,))
    task_row = cur.fetchone()
    if not task_row:
        conn.close()
        return {"error": "المهمة غير موجودة"}

    task = dict(task_row)
    now_str = datetime.now().isoformat()
    cur.execute("UPDATE study_tasks SET is_completed=1, completed_at=? WHERE id=?", (now_str, task_id))
    conn.commit()

    # Also mark lecture as studied if task was first_study
    lec_id = task.get("lecture_id")
    if task["task_type"] == "first_study" and lec_id:
        cur.execute("UPDATE lectures SET is_studied=1 WHERE id=?", (lec_id,))
        conn.commit()

    # Read schedule config
    cur.execute("SELECT value FROM settings WHERE key=?", (f"block_{block_id}_schedule_config",))
    row = cur.fetchone()
    cfg = json.loads(row['value']) if (row and row['value']) else {}

    off_days_weekdays = cfg.get("off_days_weekdays", [4])
    off_dates = set(cfg.get("off_dates", []))
    duration_weeks = int(cfg.get("duration_weeks", 7))

    today_date = date.today()

    # Build active study days from today onwards
    study_dates_from_today = []
    curr = today_date
    for _ in range(duration_weeks * 7 + 35):
        d_str = curr.isoformat()
        if curr.weekday() not in off_days_weekdays and d_str not in off_dates:
            study_dates_from_today.append(curr)
        curr += timedelta(days=1)
        if len(study_dates_from_today) >= 70:
            break

    if not study_dates_from_today:
        study_dates_from_today = [today_date + timedelta(days=i) for i in range(1, 30)]

    rebalanced_count = 0
    next_action_info = ""

    # Next study day after today
    next_study_day = study_dates_from_today[1] if (study_dates_from_today[0] == today_date and len(study_dates_from_today) > 1) else study_dates_from_today[0]
    next_study_idx = study_dates_from_today.index(next_study_day)

    # 1. If completed task was first_study:
    if task["task_type"] == "first_study" and lec_id:
        rev1_date_str = next_study_day.isoformat()
        rev2_study_idx = min(next_study_idx + 4, len(study_dates_from_today) - 1)
        rev2_date_str = study_dates_from_today[rev2_study_idx].isoformat()

        # Update or schedule Review 1 (+1 day)
        cur.execute("SELECT id FROM study_tasks WHERE block_id=? AND lecture_id=? AND task_type='spaced_review_quiz' AND is_completed=0", (block_id, lec_id))
        r1 = cur.fetchone()
        if r1:
            cur.execute("UPDATE study_tasks SET plan_date=? WHERE id=?", (rev1_date_str, r1['id']))
            rebalanced_count += 1
        else:
            cur.execute('''
            INSERT INTO study_tasks (block_id, lecture_id, plan_date, task_type, title, description, target_questions, target_cards)
            VALUES (?, ?, ?, 'spaced_review_quiz', ?, ?, 15, 15)
            ''', (block_id, lec_id, rev1_date_str, f"🔔 مراجعة أولى (استرجاع نشط): {task['title'].replace('📖 دراسة أولى: ', '')}", "تثبيت مفاهيم المحاضرة وحل أسئلتها بعد يوم من دراستها."))
            rebalanced_count += 1

        # Update or schedule Review 2 (+4 days after rev1)
        cur.execute("SELECT id FROM study_tasks WHERE block_id=? AND lecture_id=? AND task_type='spaced_review_cards' AND is_completed=0", (block_id, lec_id))
        r2 = cur.fetchone()
        if r2:
            cur.execute("UPDATE study_tasks SET plan_date=? WHERE id=?", (rev2_date_str, r2['id']))
            rebalanced_count += 1
        else:
            cur.execute('''
            INSERT INTO study_tasks (block_id, lecture_id, plan_date, task_type, title, description, target_questions, target_cards)
            VALUES (?, ?, ?, 'spaced_review_cards', ?, ?, 20, 20)
            ''', (block_id, lec_id, rev2_date_str, f"🧠 مراجعة ثانية (إتقان طويل المدى): {task['title'].replace('📖 دراسة أولى: ', '')}", "مراجعة متقدمة وإتقان الثوابت والبطاقات بعد 4 أيام من المراجعة الأولى."))
            rebalanced_count += 1

        next_action_info = f"تمت جدولة مراجعتها الأولى في {rev1_date_str} (غداً) ومراجعتها الثانية في {rev2_date_str}."

    # 2. If completed task was Review 1:
    elif task["task_type"] == "spaced_review_quiz" and lec_id:
        rev2_study_idx = min(next_study_idx + 3, len(study_dates_from_today) - 1)
        rev2_date_str = study_dates_from_today[rev2_study_idx].isoformat()

        cur.execute("SELECT id FROM study_tasks WHERE block_id=? AND lecture_id=? AND task_type='spaced_review_cards' AND is_completed=0", (block_id, lec_id))
        r2 = cur.fetchone()
        if r2:
            cur.execute("UPDATE study_tasks SET plan_date=? WHERE id=?", (rev2_date_str, r2['id']))
            rebalanced_count += 1
        else:
            cur.execute('''
            INSERT INTO study_tasks (block_id, lecture_id, plan_date, task_type, title, description, target_questions, target_cards)
            VALUES (?, ?, ?, 'spaced_review_cards', ?, ?, 20, 20)
            ''', (block_id, lec_id, rev2_date_str, f"🧠 مراجعة ثانية (إتقان طويل المدى): {task['title'].replace('🔔 مراجعة أولى (استرجاع نشط): ', '')}", "مراجعة متقدمة وإتقان الثوابت والبطاقات بعد 4 أيام من المراجعة الأولى."))
            rebalanced_count += 1

        next_action_info = f"تمت جدولة المراجعة الثانية بعد 4 أيام في {rev2_date_str}."

    # 3. Smooth out any overdue uncompleted tasks (scheduled before today)
    today_iso = today_date.isoformat()
    cur.execute("SELECT id, plan_date, task_type FROM study_tasks WHERE block_id=? AND is_completed=0 AND plan_date < ? ORDER BY plan_date ASC", (block_id, today_iso))
    overdue_tasks = cur.fetchall()

    if overdue_tasks and len(study_dates_from_today) > 1:
        future_dates = study_dates_from_today[1:min(len(study_dates_from_today), 15)]
        for idx, ot in enumerate(overdue_tasks):
            target_date = future_dates[idx % len(future_dates)].isoformat()
            cur.execute("UPDATE study_tasks SET plan_date=? WHERE id=?", (target_date, ot['id']))
            rebalanced_count += 1

    conn.commit()
    conn.close()

    return {
        "success": True,
        "rebalanced_count": rebalanced_count,
        "message": f"تم تسجيل الإنجاز وإعادة موازنة الجدول بنجاح! {next_action_info} (تم تحديث {rebalanced_count} مهمة دراسية). 🚀"
    }
