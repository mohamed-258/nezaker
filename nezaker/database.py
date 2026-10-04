import sqlite3
import os
import json
from datetime import datetime, date, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "nezaker.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
    except Exception:
        pass
    return conn

def init_db():
    conn = get_connection()
    cur = conn.cursor()

    # Blocks table (e.g. CNS, CVS, etc.)
    cur.execute('''
    CREATE TABLE IF NOT EXISTS blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT DEFAULT '',
        description TEXT DEFAULT '',
        duration_weeks INTEGER DEFAULT 4,
        study_days_per_week INTEGER DEFAULT 6,
        daily_hours REAL DEFAULT 4.0,
        start_date TEXT DEFAULT '',
        exam_date TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
    )
    ''')

    # Lectures table
    cur.execute('''
    CREATE TABLE IF NOT EXISTS lectures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        block_id INTEGER,
        lecture_number INTEGER DEFAULT 0,
        title TEXT NOT NULL,
        subject TEXT DEFAULT 'General',
        file_path TEXT DEFAULT '',
        page_count INTEGER DEFAULT 0,
        difficulty INTEGER DEFAULT 2, -- 1: Easy, 2: Medium, 3: Hard
        extracted_text TEXT DEFAULT '',
        summary_arabic TEXT DEFAULT '',
        high_yield_notes TEXT DEFAULT '',
        clinical_pearls TEXT DEFAULT '',
        is_studied INTEGER DEFAULT 0,
        studied_at TEXT DEFAULT '',
        review_count INTEGER DEFAULT 0,
        FOREIGN KEY (block_id) REFERENCES blocks (id) ON DELETE CASCADE
    )
    ''')

    # Questions table (MCQs, Clinical Cases)
    cur.execute('''
    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        block_id INTEGER,
        lecture_id INTEGER,
        question_type TEXT DEFAULT 'mcq', -- mcq, case, clinical_vignette
        case_scenario TEXT DEFAULT '',
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
        explanation TEXT DEFAULT '',
        explanation_arabic TEXT DEFAULT '',
        difficulty TEXT DEFAULT 'medium',
        is_bookmarked INTEGER DEFAULT 0,
        times_attempted INTEGER DEFAULT 0,
        times_correct INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (block_id) REFERENCES blocks (id) ON DELETE CASCADE,
        FOREIGN KEY (lecture_id) REFERENCES lectures (id) ON DELETE SET NULL
    )
    ''')

    # Flashcards table (Spaced Repetition / SuperMemo SM-2 algorithm)
    cur.execute('''
    CREATE TABLE IF NOT EXISTS flashcards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        block_id INTEGER,
        lecture_id INTEGER,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        subdeck TEXT DEFAULT 'General',
        interval_days INTEGER DEFAULT 1,
        repetitions INTEGER DEFAULT 0,
        ease_factor REAL DEFAULT 2.5,
        due_date TEXT DEFAULT '',
        last_reviewed TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (block_id) REFERENCES blocks (id) ON DELETE CASCADE,
        FOREIGN KEY (lecture_id) REFERENCES lectures (id) ON DELETE SET NULL
    )
    ''')

    # Study Plan / Calendar tasks
    cur.execute('''
    CREATE TABLE IF NOT EXISTS study_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        block_id INTEGER,
        lecture_id INTEGER,
        plan_date TEXT NOT NULL,
        task_type TEXT NOT NULL, -- 'first_study', 'spaced_review_quiz', 'spaced_review_cards'
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        target_questions INTEGER DEFAULT 0,
        target_cards INTEGER DEFAULT 0,
        is_completed INTEGER DEFAULT 0,
        completed_at TEXT DEFAULT '',
        FOREIGN KEY (block_id) REFERENCES blocks (id) ON DELETE CASCADE,
        FOREIGN KEY (lecture_id) REFERENCES lectures (id) ON DELETE CASCADE
    )
    ''')

    # Audio Transcription notes
    cur.execute('''
    CREATE TABLE IF NOT EXISTS audio_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        block_id INTEGER,
        lecture_id INTEGER,
        title TEXT NOT NULL,
        audio_filename TEXT NOT NULL,
        audio_path TEXT NOT NULL,
        transcript TEXT DEFAULT '',
        ai_summary TEXT DEFAULT '',
        high_yield_extracted TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (block_id) REFERENCES blocks (id) ON DELETE CASCADE
    )
    ''')

    # Settings table
    cur.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    ''')

    # Exam PDF Cache & Extracted Questions Tables
    cur.execute('''
    CREATE TABLE IF NOT EXISTS exam_pdf_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_folder TEXT NOT NULL,
        filename TEXT NOT NULL,
        page_num INTEGER NOT NULL,
        text_content TEXT DEFAULT '',
        extraction_method TEXT DEFAULT 'text', -- 'text' or 'ocr'
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(filename, page_num)
    )
    ''')

    cur.execute('''
    CREATE TABLE IF NOT EXISTS exam_extracted_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_filename TEXT NOT NULL,
        source_page INTEGER DEFAULT 0,
        lecture_id INTEGER,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option TEXT DEFAULT '',
        explanation TEXT DEFAULT '',
        relevance_score REAL DEFAULT 1.0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lecture_id) REFERENCES lectures (id) ON DELETE SET NULL
    )
    ''')

    # Schema migrations for new advanced features
    def add_col(tbl, col, col_def):
        cols = [c[1] for c in cur.execute(f"PRAGMA table_info({tbl})").fetchall()]
        if col not in cols:
            cur.execute(f"ALTER TABLE {tbl} ADD COLUMN {col} {col_def}")

    add_col('questions', 'batch_number', 'INTEGER DEFAULT 1')
    add_col('questions', 'batch_name', "TEXT DEFAULT ''")
    add_col('questions', 'source_file', "TEXT DEFAULT ''")
    add_col('questions', 'source', "TEXT DEFAULT 'ai_generated'")
    add_col('questions', 'user_selected_option', "TEXT DEFAULT ''")
    add_col('questions', 'last_answer_correct', 'INTEGER DEFAULT NULL')
    add_col('questions', 'last_answered_at', "TEXT DEFAULT ''")
    add_col('questions', 'lecture_evidence', "TEXT DEFAULT ''")
    add_col('questions', 'rejection_reason', "TEXT DEFAULT ''")
    add_col('exam_extracted_questions', 'lecture_evidence', "TEXT DEFAULT ''")
    add_col('exam_extracted_questions', 'rejection_reason', "TEXT DEFAULT ''")
    add_col('exam_extracted_questions', 'status', "TEXT DEFAULT 'accepted'")
    add_col('exam_extracted_questions', 'lecture_title', "TEXT DEFAULT ''")
    add_col('flashcards', 'interval_minutes', 'INTEGER DEFAULT 0')
    add_col('lectures', 'summary_english', "TEXT DEFAULT ''")
    add_col('lectures', 'word_file_path', "TEXT DEFAULT ''")
    add_col('lectures', 'comparisons_json', "TEXT DEFAULT ''")
    add_col('lectures', 'numbers_json', "TEXT DEFAULT ''")
    add_col('lectures', 'numbers_pdf_path', "TEXT DEFAULT ''")
    add_col('audio_notes', 'timestamps_transcript', "TEXT DEFAULT ''")
    add_col('audio_notes', 'doctor_delta', "TEXT DEFAULT ''")

    # Ensure indexes for fast queries
    cur.execute("CREATE INDEX IF NOT EXISTS idx_questions_mistakes ON questions (lecture_id, times_attempted, times_correct, last_answer_correct)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards (block_id, due_date)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_exam_q_file ON exam_extracted_questions (source_filename)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_exam_q_lec ON exam_extracted_questions (lecture_id)")

    # Smart Lecture Review & Diagnostics Cache
    cur.execute('''
    CREATE TABLE IF NOT EXISTS lecture_smart_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lecture_id INTEGER NOT NULL UNIQUE,
        weak_points_json TEXT DEFAULT '',
        analysis_ar TEXT DEFAULT '',
        summary_ar TEXT DEFAULT '',
        traps_json TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lecture_id) REFERENCES lectures (id) ON DELETE CASCADE
    )
    ''')

    # API Token Usage Tracker Table
    cur.execute('''
    CREATE TABLE IF NOT EXISTS api_token_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        prompt_tokens INTEGER DEFAULT 0,
        candidates_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        operation TEXT DEFAULT 'general',
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    cur.execute("CREATE INDEX IF NOT EXISTS idx_api_tokens_ts ON api_token_usage (timestamp)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_api_tokens_model ON api_token_usage (model)")

    # Formative Questions Cross-Matcher Tables
    cur.execute('''
    CREATE TABLE IF NOT EXISTS formative_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_type TEXT NOT NULL, -- 'lecture_bank' or 'weekly_formatives'
        filename TEXT NOT NULL,
        file_path TEXT DEFAULT '',
        file_hash TEXT DEFAULT '',
        total_lectures INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    cur.execute('''
    CREATE TABLE IF NOT EXISTS formative_lectures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        lecture_name TEXT NOT NULL,
        total_questions INTEGER DEFAULT 0,
        formative_questions_count INTEGER DEFAULT 0,
        FOREIGN KEY (file_id) REFERENCES formative_files (id) ON DELETE CASCADE
    )
    ''')

    cur.execute('''
    CREATE TABLE IF NOT EXISTS formative_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        lecture_name TEXT NOT NULL,
        question_num INTEGER DEFAULT 0,
        question_type TEXT DEFAULT 'formative', -- 'regular' or 'formative'
        question_text TEXT NOT NULL,
        option_a TEXT DEFAULT '',
        option_b TEXT DEFAULT '',
        option_c TEXT DEFAULT '',
        option_d TEXT DEFAULT '',
        correct_option TEXT DEFAULT '', -- 'A', 'B', 'C', 'D'
        is_yellow_highlighted INTEGER DEFAULT 0,
        matched_formatives TEXT DEFAULT '', -- e.g. "Formative 39, 40, 41"
        matched_weeks TEXT DEFAULT '', -- e.g. "Week 1"
        match_status TEXT DEFAULT 'pending', -- 'matched', 'unmatched', 'pending'
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES formative_files (id) ON DELETE CASCADE
    )
    ''')

    cur.execute('''
    CREATE TABLE IF NOT EXISTS formative_weekly_index (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        week_name TEXT DEFAULT '', -- e.g. "Week 1"
        formative_name TEXT DEFAULT '', -- e.g. "Formative 38"
        formative_number TEXT DEFAULT '', -- e.g. "38"
        question_stem_normalized TEXT NOT NULL,
        question_text TEXT NOT NULL,
        options_text TEXT DEFAULT '',
        correct_option TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES formative_files (id) ON DELETE CASCADE
    )
    ''')

    cur.execute("CREATE INDEX IF NOT EXISTS idx_formative_q_file_lec ON formative_questions (file_id, lecture_name)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_formative_weekly_stem ON formative_weekly_index (file_id, question_stem_normalized)")

    # =========================================================================
    # SMART BOOK & REFERENCE AUDITOR TABLES (مدقق المراجع والكتب الذكي)
    # =========================================================================
    cur.execute('''
    CREATE TABLE IF NOT EXISTS reference_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        total_pages INTEGER DEFAULT 0,
        file_size INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    cur.execute('''
    CREATE TABLE IF NOT EXISTS book_page_index (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        page_number INTEGER NOT NULL,
        text_content TEXT DEFAULT '',
        FOREIGN KEY (book_id) REFERENCES reference_books (id) ON DELETE CASCADE
    )
    ''')
    cur.execute("CREATE INDEX IF NOT EXISTS idx_book_page_lookup ON book_page_index (book_id, page_number)")

    cur.execute('''
    CREATE TABLE IF NOT EXISTS book_verified_qa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_hash TEXT NOT NULL,
        answer_text TEXT DEFAULT '',
        explanation TEXT DEFAULT '',
        page_number INTEGER DEFAULT 0,
        snippet_image_path TEXT DEFAULT '',
        is_convinced INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES reference_books (id) ON DELETE CASCADE
    )
    ''')
    cur.execute("CREATE INDEX IF NOT EXISTS idx_book_qa_hash ON book_verified_qa (book_id, question_hash)")

    cur.execute('''
    CREATE TABLE IF NOT EXISTS book_audit_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        source_filename TEXT NOT NULL,
        source_file_path TEXT DEFAULT '',
        total_questions INTEGER DEFAULT 0,
        audited_questions INTEGER DEFAULT 0,
        status TEXT DEFAULT 'in_progress', -- 'in_progress', 'paused_waiting_user', 'completed'
        clean_word_path TEXT DEFAULT '',
        report_word_path TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES reference_books (id) ON DELETE CASCADE
    )
    ''')

    cur.execute('''
    CREATE TABLE IF NOT EXISTS book_audit_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        question_number INTEGER DEFAULT 0,
        question_text TEXT NOT NULL,
        options_json TEXT DEFAULT '[]',
        original_answer TEXT DEFAULT '',
        proposed_answer TEXT DEFAULT '',
        final_answer TEXT DEFAULT '',
        status TEXT DEFAULT 'pending', -- 'verified_correct', 'found_incorrect', 'not_found', 'consulting', 'confirmed_modified', 'confirmed_kept'
        explanation TEXT DEFAULT '',
        page_number INTEGER DEFAULT 0,
        snippet_image_path TEXT DEFAULT '',
        consultation_chat_json TEXT DEFAULT '[]',
        FOREIGN KEY (session_id) REFERENCES book_audit_sessions (id) ON DELETE CASCADE
    )
    ''')
    cur.execute("CREATE INDEX IF NOT EXISTS idx_audit_q_session ON book_audit_questions (session_id, question_number)")

    # Migrations for multi-source formative matcher
    add_col('formative_files', 'source_label', "TEXT DEFAULT ''")
    add_col('formative_files', 'extraction_method', "TEXT DEFAULT 'docx'")
    add_col('formative_files', 'is_active', 'INTEGER DEFAULT 1')
    add_col('formative_weekly_index', 'source_label', "TEXT DEFAULT ''")
    add_col('formative_weekly_index', 'source_filename', "TEXT DEFAULT ''")
    add_col('formative_questions', 'all_matched_sources', "TEXT DEFAULT ''")

    conn.commit()

    # Seed default settings if not exists
    default_settings = {
        "gemini_api_key": "AQ.Ab8RN6LMsgXMGcgWAtKKrBDo7mxlgNoWLA3pEJ3p2wNVahRAxQ",
        "primary_model": "gemini-3.6-flash",
        "fallback_model": "gemma-4-26b-a4b-it",
        "ai_provider": "gemini",
        "active_block_id": "1",
        "dark_mode": "1",
        "language": "ar"
    }
    for k, v in default_settings.items():
        cur.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))

    # Seed initial CNS block if no blocks exist
    cur.execute("SELECT COUNT(*) FROM blocks")
    if cur.fetchone()[0] == 0:
        cur.execute('''
        INSERT INTO blocks (name, code, description, duration_weeks, study_days_per_week, daily_hours, start_date, exam_date, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            "بلوك الجهاز العصبي (Central Nervous System - CNS)",
            "CNS-25",
            "دراسة شاملة لتشريح ووظائف وأمراض وأدوية الجهاز العصبي المركزي والحواس الخاصة",
            5,
            6,
            4.0,
            date.today().isoformat(),
            (date.today() + timedelta(days=35)).isoformat(),
            1
        ))

    conn.commit()
    conn.close()

def reset_all_user_data():
    """
    Completely resets all content data (lectures, questions, flashcards, tasks,
    audits, formatives, audio notes, exam caches) while preserving user API keys
    and application preferences.
    """
    conn = get_connection()
    cur = conn.cursor()

    # 1. Preserve critical settings
    cur.execute("SELECT key, value FROM settings WHERE key IN ('gemini_api_key', 'groq_api_key', 'ai_provider', 'primary_model', 'fallback_model', 'dark_mode', 'language')")
    preserved_settings = dict(cur.fetchall())

    # 2. Content tables to wipe
    tables = [
        "lectures", "questions", "flashcards", "study_tasks", "audio_notes",
        "exam_pdf_cache", "exam_extracted_questions", "lecture_smart_reviews",
        "api_token_usage", "formative_files", "formative_lectures",
        "formative_questions", "formative_weekly_index", "reference_books",
        "book_page_index", "book_verified_qa", "book_audit_sessions",
        "book_audit_questions", "blocks", "settings"
    ]

    for tbl in tables:
        try:
            cur.execute(f"DELETE FROM {tbl}")
        except Exception as e:
            print(f"Warning clearing {tbl}: {e}")

    # 3. Reset sqlite sequence (autoincrements)
    try:
        cur.execute("DELETE FROM sqlite_sequence")
    except Exception:
        pass

    # 4. Restore settings
    default_settings = {
        "gemini_api_key": preserved_settings.get("gemini_api_key", ""),
        "groq_api_key": preserved_settings.get("groq_api_key", ""),
        "ai_provider": preserved_settings.get("ai_provider", "gemini"),
        "primary_model": preserved_settings.get("primary_model", "gemini-3.6-flash"),
        "fallback_model": preserved_settings.get("fallback_model", "gemma-4-26b-a4b-it"),
        "active_block_id": "1",
        "dark_mode": preserved_settings.get("dark_mode", "1"),
        "language": preserved_settings.get("language", "ar")
    }
    for k, v in default_settings.items():
        cur.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, v))

    # 5. Create one clean fresh block
    start_str = date.today().isoformat()
    exam_str = (date.today() + timedelta(days=28)).isoformat()
    cur.execute('''
        INSERT INTO blocks (id, name, code, description, duration_weeks, study_days_per_week, daily_hours, start_date, exam_date, is_active)
        VALUES (1, 'البلوك الأول', 'BLOCK-1', 'البلوك الدراسي الجديد', 4, 6, 4.0, ?, ?, 1)
    ''', (start_str, exam_str))

    conn.commit()
    conn.close()
    return True

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DB_PATH)
