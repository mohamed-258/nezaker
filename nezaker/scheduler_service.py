import os
import math
import json
from datetime import datetime, date, timedelta
import database

SUBJECT_PRIORITY = {
    "Anatomy & Embryology": 1,
    "Histology": 2,
    "Physiology": 3,
    "Biochemistry": 4,
    "Pathology": 5,
    "Microbiology": 6,
    "Parasitology": 7,
    "Pharmacology": 8,
    "General Medicine": 9
}

def generate_balanced_schedule(block_id: int, start_date_str: str = None, duration_weeks: int = None, off_days_weekdays: list = None, off_dates: list = None, force_study_dates: list = None):
    """
    Intelligent Medical Workload Balancing Algorithm:
    - Balances daily study by PAGE COUNT, not just lecture count.
    - Large lectures (>= 12 pages) get their own dedicated day.
    - Staggers reviews across days to completely prevent review dumping/spikes.
    - Each day has an exact estimated study time based on workload.
    """
    conn = database.get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM blocks WHERE id=?", (block_id,))
    block = cur.fetchone()
    if not block:
        conn.close()
        return {"error": "Block not found"}

    if not start_date_str:
        start_date_str = block['start_date'] or date.today().isoformat()
    if not duration_weeks:
        duration_weeks = block['duration_weeks'] or 5
    if off_days_weekdays is None:
        off_days_weekdays = [4] # Default: Friday off
    if off_dates is None:
        off_dates = []
    if force_study_dates is None:
        force_study_dates = []

    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()

    cur.execute("SELECT * FROM lectures WHERE block_id=?", (block_id,))
    lectures = cur.fetchall()
    if not lectures:
        conn.close()
        return {"error": "No lectures found in this block"}

    from syllabus_schedule_service import is_vertical_lecture
    valid_lectures = [dict(l) for l in lectures if not is_vertical_lecture(l['title'], l['subject'])]
    if not valid_lectures:
        conn.close()
        return {"error": "No non-vertical lectures found in this block"}

    # Sort lectures by medical hierarchy and lecture number
    sorted_lectures = sorted(
        valid_lectures,
        key=lambda l: (
            SUBJECT_PRIORITY.get(l['subject'], 99),
            l['lecture_number'] if l['lecture_number'] > 0 else 999
        )
    )

    # Calculate active study days
    total_calendar_days = duration_weeks * 7
    study_dates = []
    curr = start_date
    for _ in range(total_calendar_days):
        date_str = curr.isoformat()
        is_weekly_off = curr.weekday() in off_days_weekdays
        is_specific_off = date_str in off_dates
        is_forced_study = date_str in force_study_dates

        is_off = (is_weekly_off or is_specific_off) and not is_forced_study
        if not is_off:
            study_dates.append(curr)
        curr += timedelta(days=1)

    if not study_dates:
        conn.close()
        return {"error": "No study days available. Please reduce off-days or increase duration."}

    total_study_days = len(study_dates)
    # Dedicate last 3 days (or 1 if short) for comprehensive final revision before exam
    final_rev_days = 3 if total_study_days >= 15 else 1
    teaching_days_count = max(1, total_study_days - final_rev_days)
    teaching_dates = study_dates[:teaching_days_count]

    total_pages = sum(l['page_count'] or 8 for l in sorted_lectures)
    optimal_daily_pages = round(total_pages / teaching_days_count, 1)

    # 1. Distribute new study lectures: ~2 lectures per day (1 if heavy >= 14 pages, 3 if very short)
    daily_new_lecs = [[] for _ in range(teaching_days_count)]
    daily_page_totals = [0 for _ in range(teaching_days_count)]
    lec_idx = 0
    total_lecs = len(sorted_lectures)

    for day_i in range(teaching_days_count):
        rem_days = teaching_days_count - day_i
        rem_lecs = total_lecs - lec_idx
        target_count = min(3, max(1, round(rem_lecs / rem_days)))
        
        while lec_idx < total_lecs and len(daily_new_lecs[day_i]) < target_count:
            lec = sorted_lectures[lec_idx]
            p = lec['page_count'] or 8
            # If already has 1 lecture, stop if this is heavy or total pages >= 20
            if len(daily_new_lecs[day_i]) >= 1 and (p >= 14 or (daily_page_totals[day_i] + p) >= 22):
                break
            daily_new_lecs[day_i].append(lec)
            daily_page_totals[day_i] += p
            lec_idx += 1
            if p >= 15 and len(daily_new_lecs[day_i]) == 1 and rem_days > 1:
                break

    # If any remaining lectures, distribute to days with lowest page count & <= 2 lectures
    while lec_idx < total_lecs:
        best_day = min(range(teaching_days_count), key=lambda d: (len(daily_new_lecs[d]), daily_page_totals[d]))
        lec = sorted_lectures[lec_idx]
        daily_new_lecs[best_day].append(lec)
        daily_page_totals[best_day] += (lec['page_count'] or 8)
        lec_idx += 1

    # Clear old incomplete tasks
    cur.execute("DELETE FROM study_tasks WHERE block_id=? AND is_completed=0", (block_id,))

    # Day tasks plan: day_index -> list of task dicts
    day_tasks_plan = [[] for _ in range(total_study_days)]

    # 1. Create First Study Tasks (1 task per lecture, typically 2 per day)
    for day_i, lecs in enumerate(daily_new_lecs):
        for lec in lecs:
            p_count = lec['page_count'] or 8
            target_q = max(8, min(25, round(p_count * 1.5)))
            target_cards = max(10, min(30, round(p_count * 2.0)))
            day_tasks_plan[day_i].append({
                "lecture_id": lec['id'],
                "task_type": "first_study",
                "title": f"📖 دراسة أولى: {lec['title']}",
                "description": f"مادة {lec['subject']} ({p_count} صفحة) — إجمالي صفحات اليوم: {daily_page_totals[day_i]} صفحة.",
                "target_questions": target_q,
                "target_cards": target_cards
            })

    # 2. Schedule Review 1 (Spaced Active Quiz) - 3 to 4 days after first study
    rev1_placed = [0] * total_study_days
    for day_i, lecs in enumerate(daily_new_lecs):
        if not lecs:
            continue
        pref_day = min(day_i + 3, total_study_days - 1)
        candidates = [d for d in range(min(day_i + 2, total_study_days - 1), min(day_i + 6, total_study_days)) if rev1_placed[d] < 2 and len(day_tasks_plan[d]) < 6]
        if not candidates:
            candidates = [d for d in range(min(day_i + 2, total_study_days - 1), min(day_i + 7, total_study_days)) if len(day_tasks_plan[d]) < 7]
        if not candidates:
            candidates = list(range(min(day_i + 2, total_study_days - 1), min(day_i + 7, total_study_days)))
        
        best_d = min(candidates, key=lambda d: (len(day_tasks_plan[d]), abs(d - pref_day)))
        rev1_placed[best_d] += 1

        for lec in lecs:
            p = lec['page_count'] or 8
            calc_q = min(25, max(8, round(p * 1.2)))
            calc_c = min(30, max(10, round(p * 1.5)))
            day_tasks_plan[best_d].append({
                "lecture_id": lec['id'],
                "task_type": "spaced_review_quiz",
                "title": f"🔔 مراجعة المحاضرة (حل أسئلة وبطاقات): {lec['title']}",
                "description": f"مراجعة وتثبيت مفاهيم {lec['title']} ({lec['subject']}) بحل {calc_q} سؤال ومراجعة البطاقات.",
                "target_questions": calc_q,
                "target_cards": calc_c
            })

    # 4. Schedule Final Block Revision on the last consolidation days
    first_lec_id = sorted_lectures[0]['id'] if sorted_lectures else 1
    for rev_i in range(teaching_days_count, total_study_days):
        if len(day_tasks_plan[rev_i]) <= 1:
            day_tasks_plan[rev_i].append({
                "lecture_id": first_lec_id,
                "task_type": "final_block_revision",
                "title": f"🏆 مراجعة ختامية شاملة وتدريب امتحانات (اليوم {rev_i + 1})",
                "description": "حل امتحانات السنوات السابقة الشاملة ومراجعة تجميعات البلوك عبر قسم فلترة الامتحانات.",
                "target_questions": 50,
                "target_cards": 50
            })

    # Commit all tasks to database
    tasks_created = 0
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
            tasks_created += 1

    # Save schedule configuration in settings for persistence
    cfg = {
        "start_date": start_date_str,
        "duration_weeks": duration_weeks,
        "off_days_weekdays": off_days_weekdays,
        "off_dates": list(set(off_dates)),
        "force_study_dates": list(set(force_study_dates))
    }
    cur.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (f"block_{block_id}_schedule_config", json.dumps(cfg)))
    cur.execute("UPDATE blocks SET start_date=?, duration_weeks=? WHERE id=?", (start_date_str, duration_weeks, block_id))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "tasks_created": tasks_created,
        "total_lectures_scheduled": len(sorted_lectures),
        "available_study_days": len(study_dates),
        "duration_weeks": duration_weeks,
        "optimal_daily_pages": optimal_daily_pages,
        "schedule_config": cfg
    }

def get_schedule_config(block_id: int):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT value FROM settings WHERE key=?", (f"block_{block_id}_schedule_config",))
    cfg_row = cur.fetchone()

    cur.execute("SELECT * FROM blocks WHERE id=?", (block_id,))
    block_row = cur.fetchone()
    conn.close()

    if cfg_row and cfg_row['value']:
        try:
            return json.loads(cfg_row['value'])
        except Exception:
            pass

    return {
        "start_date": block_row['start_date'] if block_row else date.today().isoformat(),
        "duration_weeks": block_row['duration_weeks'] if block_row else 5,
        "off_days_weekdays": [4],
        "off_dates": [],
        "force_study_dates": []
    }

def toggle_day_off(block_id: int, date_str: str, make_off: bool):
    """
    Toggles a specific calendar date as an off-day or study-day.
    Re-balances and regenerates the schedule automatically.
    """
    cfg = get_schedule_config(block_id)
    start_date = cfg.get("start_date") or date.today().isoformat()
    duration_weeks = int(cfg.get("duration_weeks") or 5)
    off_weekdays = cfg.get("off_days_weekdays", [4])
    off_dates = set(cfg.get("off_dates", []))
    force_study_dates = set(cfg.get("force_study_dates", []))

    d_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    weekday = d_obj.weekday()

    if make_off:
        off_dates.add(date_str)
        if date_str in force_study_dates:
            force_study_dates.remove(date_str)
    else:
        if date_str in off_dates:
            off_dates.remove(date_str)
        if weekday in off_weekdays:
            force_study_dates.add(date_str)

    return generate_balanced_schedule(
        block_id=block_id,
        start_date_str=start_date,
        duration_weeks=duration_weeks,
        off_days_weekdays=off_weekdays,
        off_dates=list(off_dates),
        force_study_dates=list(force_study_dates)
    )

def update_task_date(task_id: int, new_date: str):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE study_tasks SET plan_date=? WHERE id=?", (new_date, task_id))
    conn.commit()
    conn.close()
    return True

def get_today_tasks(block_id: int, target_date: str = None) -> list:
    if not target_date:
        target_date = date.today().isoformat()

    conn = database.get_connection()
    cur = conn.cursor()

    cur.execute('''
    SELECT st.*, l.title as lecture_title, l.subject as lecture_subject, l.page_count
    FROM study_tasks st
    LEFT JOIN lectures l ON st.lecture_id = l.id
    WHERE st.block_id = ? AND (st.plan_date = ? OR (st.plan_date < ? AND st.is_completed = 0))
    ORDER BY st.is_completed ASC, st.plan_date ASC, st.id ASC
    ''', (block_id, target_date, target_date))

    rows = cur.fetchall()
    tasks = [dict(r) for r in rows]
    conn.close()
    return tasks

def toggle_task_status(task_id: int, completed: bool):
    conn = database.get_connection()
    cur = conn.cursor()
    now_str = datetime.now().isoformat() if completed else ""
    cur.execute('''
    UPDATE study_tasks
    SET is_completed = ?, completed_at = ?
    WHERE id = ?
    ''', (1 if completed else 0, now_str, task_id))
    conn.commit()
    conn.close()
    return True

# Compatibility alias
generate_block_schedule_v2 = generate_balanced_schedule

ARABIC_MONTHS = {
    1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل", 5: "مايو", 6: "يونيو",
    7: "يوليو", 8: "أغسطس", 9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
}
ARABIC_DAYS = {
    0: "الإثنين", 1: "الثلاثاء", 2: "الأربعاء", 3: "الخميس", 4: "الجمعة", 5: "السبت", 6: "الأحد"
}

def format_arabic_date_obj(d: date) -> str:
    day_name = ARABIC_DAYS.get(d.weekday(), "")
    month_name = ARABIC_MONTHS.get(d.month, "")
    return f"{day_name}، {d.day} {month_name} {d.year}"

def get_lecture_schedule_timeline(lecture_id: int) -> dict:
    conn = database.get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM lectures WHERE id=?", (lecture_id,))
    lec_row = cur.fetchone()
    if not lec_row:
        conn.close()
        return {"error": "Lecture not found"}
    lec = dict(lec_row)

    cur.execute("SELECT * FROM study_tasks WHERE lecture_id=? ORDER BY plan_date ASC, id ASC", (lecture_id,))
    tasks = [dict(r) for r in cur.fetchall()]
    conn.close()

    today = date.today()
    today_iso = today.isoformat()

    # Categorize tasks
    first_study_task = next((t for t in tasks if t['task_type'] == 'first_study'), None)
    rev1_task = next((t for t in tasks if t['task_type'] == 'spaced_review_quiz'), None)
    rev2_task = next((t for t in tasks if t['task_type'] == 'spaced_review_cards'), None)

    def parse_task_stage(task, default_title, default_type, target_workload, stage_num):
        if not task:
            return {
                "exists": False,
                "task_id": None,
                "task_type": default_type,
                "title": default_title,
                "date": "",
                "formatted_date": "غير مجدول بعد",
                "day_name": "",
                "is_completed": False,
                "completed_at": "",
                "status": "not_scheduled",
                "status_text": "غير مجدول",
                "status_badge": "tag-pending",
                "days_diff": None,
                "days_diff_text": "",
                "workload": target_workload
            }

        task_date_str = task['plan_date']
        try:
            task_d = datetime.strptime(task_date_str, "%Y-%m-%d").date()
            f_date = format_arabic_date_obj(task_d)
            d_name = ARABIC_DAYS.get(task_d.weekday(), "")
        except Exception:
            task_d = None
            f_date = task_date_str
            d_name = ""

        is_done = bool(task.get('is_completed', 0))
        if is_done:
            status = "completed"
            status_text = "تم الإنجاز بنجاح ✅"
            status_badge = "tag-completed"
        elif task_date_str == today_iso:
            status = "today"
            status_text = "مستحقة اليوم 📍"
            status_badge = "tag-today"
        elif task_d and task_d < today:
            status = "overdue"
            status_text = "متأخرة عن الموعد ⚠️"
            status_badge = "tag-overdue"
        else:
            status = "upcoming"
            status_text = "قادمة حسب الخطة ⏳"
            status_badge = "tag-upcoming"

        return {
            "exists": True,
            "task_id": task['id'],
            "task_type": task['task_type'],
            "title": task['title'],
            "date": task_date_str,
            "formatted_date": f_date,
            "day_name": d_name,
            "is_completed": is_done,
            "completed_at": task.get('completed_at', ''),
            "status": status,
            "status_text": status_text,
            "status_badge": status_badge,
            "target_questions": task.get('target_questions', 0),
            "target_cards": task.get('target_cards', 0),
            "workload": target_workload
        }

    p_count = lec.get('page_count') or 8
    first_study_info = parse_task_stage(
        first_study_task, 
        f"دراسة أولى: {lec['title']}", 
        "first_study", 
        f"{p_count} صفحة", 
        1
    )
    
    rev1_q = first_study_task.get('target_questions') if first_study_task else max(8, round(p_count * 1.2))
    rev1_info = parse_task_stage(
        rev1_task, 
        f"مراجعة أولى: {lec['title']}", 
        "spaced_review_quiz", 
        f"{rev1_q} سؤال وبطاقة", 
        2
    )

    rev2_info = parse_task_stage(
        rev2_task, 
        f"مراجعة ثانية: {lec['title']}", 
        "spaced_review_cards", 
        "20 بطاقة وحالة سريرية", 
        3
    )

    # Compute days differences from first study and rev1
    if first_study_info["exists"] and first_study_info["date"]:
        try:
            fs_d = datetime.strptime(first_study_info["date"], "%Y-%m-%d").date()
            if rev1_info["exists"] and rev1_info["date"]:
                r1_d = datetime.strptime(rev1_info["date"], "%Y-%m-%d").date()
                diff1 = (r1_d - fs_d).days
                rev1_info["days_diff"] = diff1
                rev1_info["days_diff_text"] = f"بعد {diff1} يوم من المذاكرة" if diff1 > 0 else "في نفس اليوم"
            if rev2_info["exists"] and rev2_info["date"]:
                r2_d = datetime.strptime(rev2_info["date"], "%Y-%m-%d").date()
                if rev1_info["exists"] and rev1_info["date"]:
                    diff2 = (r2_d - r1_d).days
                    rev2_info["days_diff"] = diff2
                    rev2_info["days_diff_text"] = f"بعد {diff2} أيام من المراجعة الأولى" if diff2 > 0 else "في نفس اليوم"
                else:
                    diff2 = (r2_d - fs_d).days
                    rev2_info["days_diff"] = diff2
                    rev2_info["days_diff_text"] = f"بعد {diff2} أيام من المذاكرة"
        except Exception:
            pass

    # Overall Mastery Progress (3 Stages: 1 Study + 2 Reviews)
    completed_stages = sum([
        1 if first_study_info["is_completed"] else 0,
        1 if rev1_info["is_completed"] else 0,
        1 if rev2_info["is_completed"] else 0
    ])

    mastery_percent = round((completed_stages / 3) * 100)
    if completed_stages == 3:
        mastery_badge = "🌟 متقنة ومراجعة بالكامل (100%)"
        mastery_class = "mastery-complete"
    elif completed_stages == 2:
        mastery_badge = "🔔 مراجعة أولى مكتملة (66%)"
        mastery_class = "mastery-mid"
    elif completed_stages == 1:
        mastery_badge = "📖 تمت المذاكرة الأولى فقط (33%)"
        mastery_class = "mastery-low"
    else:
        mastery_badge = "⏳ بانتظار المذاكرة (0%)"
        mastery_class = "mastery-zero"

    return {
        "success": True,
        "lecture": {
            "id": lec['id'],
            "title": lec['title'],
            "subject": lec['subject'],
            "page_count": p_count,
            "lecture_number": lec.get('lecture_number', 0),
            "is_studied": lec.get('is_studied', 0)
        },
        "timeline": {
            "first_study": first_study_info,
            "review_1": rev1_info,
            "review_2": rev2_info
        },
        "mastery": {
            "completed_stages": completed_stages,
            "total_stages": 3,
            "percent": mastery_percent,
            "badge": mastery_badge,
            "class": mastery_class
        }
    }

