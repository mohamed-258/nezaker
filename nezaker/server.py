import os
import shutil
import time
import io
import json
import re
import math
import tempfile
import hashlib
from datetime import datetime, date, timedelta
from flask import Flask, request, jsonify, render_template, send_from_directory, send_file
from flask_cors import CORS
import database
import pdf_service
import gemini_service
import scheduler_service
import docx_service
import pdf_ocr_service
import ai_question_matcher
import formative_matcher_service
import book_auditor_service
import book_snippet_generator
try:
    import genanki
except ImportError:
    genanki = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")
PDF_DIR = os.path.join(BASE_DIR, "lecture_pdfs")
os.makedirs(PDF_DIR, exist_ok=True)

app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC_DIR)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True
CORS(app)

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route("/")
def index():
    return render_template("index.html", cache_bust=int(time.time()))

@app.route("/anatomy-demo")
def anatomy_demo():
    return render_template("anatomy_demo.html")

# ----------------- BLOCKS API -----------------
@app.route("/api/blocks", methods=["GET"])
def list_blocks():
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM blocks ORDER BY id ASC")
    raw_blocks = [dict(r) for r in cur.fetchall()]
    
    cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
    active_row = cur.fetchone()
    active_id = int(active_row['value']) if active_row else 1

    blocks = []
    for b in raw_blocks:
        b_id = b['id']
        cur.execute("SELECT COUNT(*) FROM lectures WHERE block_id=?", (b_id,))
        lectures_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM lectures WHERE block_id=? AND is_studied=1", (b_id,))
        studied_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM questions WHERE block_id=?", (b_id,))
        questions_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM flashcards WHERE block_id=?", (b_id,))
        flashcards_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM audio_notes WHERE block_id=?", (b_id,))
        audio_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM study_tasks WHERE block_id=?", (b_id,))
        tasks_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM study_tasks WHERE block_id=? AND is_completed=1", (b_id,))
        completed_tasks = cur.fetchone()[0]

        days_left = None
        if b.get('exam_date'):
            try:
                exam_d = datetime.fromisoformat(b['exam_date']).date()
                days_left = (exam_d - date.today()).days
            except Exception:
                pass

        progress_percent = round((studied_count / lectures_count) * 100, 1) if lectures_count > 0 else 0

        b['lectures_count'] = lectures_count
        b['studied_count'] = studied_count
        b['questions_count'] = questions_count
        b['flashcards_count'] = flashcards_count
        b['audio_count'] = audio_count
        b['tasks_count'] = tasks_count
        b['completed_tasks_count'] = completed_tasks
        b['days_left'] = days_left
        b['progress_percent'] = progress_percent
        b['is_active'] = (b_id == active_id)
        blocks.append(b)

    conn.close()
    return jsonify({"blocks": blocks, "active_block_id": active_id})

@app.route("/api/blocks", methods=["POST"])
def create_block():
    data = request.json or {}
    name = data.get("name", "كتاب / موديول جديد").strip()
    code = data.get("code", "").strip()
    description = data.get("description", "").strip()
    duration_weeks = int(data.get("duration_weeks", 4))
    study_days = int(data.get("study_days_per_week", 6))
    daily_hours = float(data.get("daily_hours", 4.0))
    start_date = data.get("start_date", date.today().isoformat())
    exam_date = data.get("exam_date", (date.today() + timedelta(days=duration_weeks*7)).isoformat())

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute('''
    INSERT INTO blocks (name, code, description, duration_weeks, study_days_per_week, daily_hours, start_date, exam_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (name, code, description, duration_weeks, study_days, daily_hours, start_date, exam_date))
    new_id = cur.lastrowid
    cur.execute("UPDATE settings SET value=? WHERE key='active_block_id'", (str(new_id),))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "id": new_id})

@app.route("/api/blocks/<int:block_id>/select", methods=["POST"])
def select_block(block_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE settings SET value=? WHERE key='active_block_id'", (str(block_id),))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "active_block_id": block_id})

@app.route("/api/blocks/<int:block_id>/delete", methods=["POST", "DELETE"])
def delete_block(block_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM blocks")
    if cur.fetchone()[0] <= 1:
        conn.close()
        return jsonify({"error": "لا يمكن حذف جلسة المقرر الوحيدة المتبقية"}), 400

    for tbl in ['lectures', 'questions', 'flashcards', 'study_tasks', 'audio_notes']:
        cur.execute(f"DELETE FROM {tbl} WHERE block_id=?", (block_id,))
    cur.execute("DELETE FROM blocks WHERE id=?", (block_id,))

    cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
    row = cur.fetchone()
    if row and int(row['value']) == block_id:
        cur.execute("SELECT id FROM blocks LIMIT 1")
        next_id = cur.fetchone()[0]
        cur.execute("UPDATE settings SET value=? WHERE key='active_block_id'", (str(next_id),))

    conn.commit()
    conn.close()
    return jsonify({"success": True})

# ----------------- LECTURES API -----------------
@app.route("/api/lectures", methods=["GET"])
def list_lectures():
    block_id = request.args.get("block_id")
    subject = request.args.get("subject")
    search = request.args.get("search")

    conn = database.get_connection()
    cur = conn.cursor()

    if not block_id:
        cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
        row = cur.fetchone()
        block_id = int(row['value']) if row else 1

    query = "SELECT * FROM lectures WHERE block_id = ?"
    params = [block_id]

    if subject and subject != "All":
        query += " AND subject = ?"
        params.append(subject)

    if search:
        query += " AND (title LIKE ? OR subject LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY lecture_number ASC, id ASC"
    cur.execute(query, params)
    lectures = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT DISTINCT subject FROM lectures WHERE block_id = ? ORDER BY subject ASC", (block_id,))
    subjects = [r['subject'] for r in cur.fetchall()]

    conn.close()
    return jsonify({"lectures": lectures, "subjects": subjects})

@app.route("/api/lectures/add", methods=["POST"])
def add_lecture():
    pdf_file = request.files.get("pdf_file") or request.files.get("file")

    if pdf_file and pdf_file.filename:
        filename = pdf_file.filename
        safe_name = re.sub(r'[^\w\-_\.]', '_', filename)
        base, ext = os.path.splitext(safe_name)
        ext_lower = ext.lower()

        if ext_lower not in ['.pdf', '.pptx', '.ppt', '.zip']:
            return jsonify({"error": "يرجى اختيار ملف PDF أو PowerPoint (.pptx/.ppt) أو أرشيف ZIP (.zip)"}), 400

        try:
            block_id = int(request.form.get("block_id", 1))
        except:
            block_id = 1

        rebalance_str = request.form.get("rebalance_schedule", "true")
        rebalance = str(rebalance_str).lower() in ["true", "1", "yes"]

        # If user uploaded a ZIP archive containing lectures
        if ext_lower == '.zip':
            saved_zip_path = os.path.join(PDF_DIR, safe_name)
            pdf_file.save(saved_zip_path)
            try:
                imported = pdf_service.extract_and_import_zip(saved_zip_path, block_id=block_id, rebalance=rebalance)
                if os.path.exists(saved_zip_path):
                    os.remove(saved_zip_path)
                return jsonify({
                    "success": True,
                    "is_zip": True,
                    "imported_count": len(imported),
                    "lectures": imported,
                    "message": f"تم استخراج واستيراد {len(imported)} محاضرة بنجاح من ملف الـ ZIP!"
                })
            except Exception as e:
                return jsonify({"error": f"تعذر استخراج ملف الـ ZIP: {e}"}), 500

        saved_path = os.path.join(PDF_DIR, safe_name)
        counter = 1
        while os.path.exists(saved_path):
            saved_path = os.path.join(PDF_DIR, f"{base}_{counter}{ext}")
            counter += 1
        pdf_file.save(saved_path)

        # Extract page / slide count
        actual_pages = pdf_service.get_lecture_file_page_count(saved_path)

        # Extract full text
        extracted_text = pdf_service.extract_lecture_file_text(saved_path)

        # Auto-derive defaults from filename
        extracted_num = pdf_service.extract_lecture_number(filename)
        cleaned_title = pdf_service.clean_lecture_title(filename)
        auto_subject = pdf_service.determine_subject(filename, extracted_num)

        form_data = request.form
        title = form_data.get("title", "").strip() or cleaned_title or os.path.splitext(filename)[0]
        subject = form_data.get("subject", "").strip() or auto_subject or "General Medicine"

        try:
            difficulty = int(form_data.get("difficulty", 2))
        except:
            difficulty = 2

        page_count = actual_pages if actual_pages > 0 else 10
        if form_data.get("page_count"):
            try:
                page_count = int(form_data.get("page_count"))
            except:
                pass

        notes = form_data.get("notes", "").strip()
        if notes:
            extracted_text = f"Notes:\n{notes}\n\n" + (extracted_text or "")

        conn = database.get_connection()
        cur = conn.cursor()

        req_num = form_data.get("lecture_number")
        if req_num:
            try:
                lecture_number = int(req_num)
            except:
                lecture_number = extracted_num
        elif extracted_num != 999:
            lecture_number = extracted_num
        else:
            cur.execute("SELECT MAX(lecture_number) FROM lectures WHERE block_id=?", (block_id,))
            max_num = cur.fetchone()[0]
            lecture_number = (max_num or 0) + 1

        cur.execute('''
        INSERT INTO lectures (block_id, lecture_number, title, subject, file_path, page_count, difficulty, extracted_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (block_id, lecture_number, title, subject, saved_path, page_count, difficulty, extracted_text))
        conn.commit()
        new_id = cur.lastrowid
        conn.close()

        # Render high-yield slide images for visual learning (if PDF)
        if ext_lower == '.pdf':
            try:
                pdf_service.extract_lecture_page_images(saved_path, new_id, max_pages=100)
            except Exception as e:
                print(f"Warning rendering slide images for lecture {new_id}: {e}")

        if rebalance:
            try:
                scheduler_service.generate_balanced_schedule(block_id)
            except Exception as e:
                print("Auto rebalance warning:", e)

        return jsonify({
            "success": True,
            "id": new_id,
            "title": title,
            "subject": subject,
            "page_count": page_count,
            "lecture_number": lecture_number,
            "file_type": ext_lower.replace('.', '')
        })

    # Fallback to JSON manual input if no file is provided
    data = request.json or request.form or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "يرجى تحديد ملف الـ PDF للمحاضرة أو كتابة عنوانها"}), 400

    block_id = int(data.get("block_id", 1))
    subject = data.get("subject", "General").strip() or "General"
    page_count = int(data.get("page_count", 10))
    difficulty = int(data.get("difficulty", 2))
    notes = data.get("notes", "").strip()
    rebalance = bool(data.get("rebalance_schedule", True))

    conn = database.get_connection()
    cur = conn.cursor()

    cur.execute("SELECT MAX(lecture_number) FROM lectures WHERE block_id=?", (block_id,))
    max_num = cur.fetchone()[0]
    lecture_number = (max_num or 0) + 1
    if data.get("lecture_number"):
        try:
            lecture_number = int(data.get("lecture_number"))
        except:
            pass

    cur.execute('''
    INSERT INTO lectures (block_id, lecture_number, title, subject, page_count, difficulty, extracted_text)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (block_id, lecture_number, title, subject, page_count, difficulty, notes))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()

    if rebalance:
        try:
            scheduler_service.generate_balanced_schedule(block_id)
        except Exception as e:
            print("Auto rebalance warning:", e)

    return jsonify({
        "success": True,
        "id": new_id,
        "title": title,
        "subject": subject,
        "page_count": page_count,
        "lecture_number": lecture_number
    })

@app.route("/api/lectures/import_zip", methods=["POST"])
def import_zip_route():
    zip_file = request.files.get("zip_file") or request.files.get("file")
    if not zip_file or not zip_file.filename:
        return jsonify({"error": "يرجى اختيار ملف ZIP صالح (.zip)"}), 400

    filename = zip_file.filename
    if not filename.lower().endswith(".zip"):
        return jsonify({"error": "الملف المختار ليس بصيغة ZIP (.zip)"}), 400

    try:
        block_id = int(request.form.get("block_id", 1))
    except:
        block_id = 1

    rebalance_str = request.form.get("rebalance_schedule", "true")
    rebalance = str(rebalance_str).lower() in ["true", "1", "yes"]

    safe_name = re.sub(r'[^\w\-_\.]', '_', filename)
    saved_zip = os.path.join(PDF_DIR, safe_name)
    zip_file.save(saved_zip)

    try:
        imported = pdf_service.extract_and_import_zip(saved_zip, block_id=block_id, rebalance=rebalance)
        if os.path.exists(saved_zip):
            os.remove(saved_zip)
        return jsonify({
            "success": True,
            "imported_count": len(imported),
            "lectures": imported,
            "message": f"تم استخراج واستيراد {len(imported)} محاضرة بنجاح من ملف الـ ZIP!"
        })
    except Exception as e:
        return jsonify({"error": f"تعذر استيراد الأرشيف: {e}"}), 500

@app.route("/api/lectures/import_folder", methods=["POST"])
def import_folder_route():
    data = request.json or {}
    folder_path = (data.get("folder_path") or "").strip()
    if not folder_path:
        return jsonify({"error": "يرجى تحديد مسار المجلد على جهازك"}), 400

    if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
        return jsonify({"error": f"المجلد غير موجود: {folder_path}"}), 404

    try:
        block_id = int(data.get("block_id", 1))
    except:
        block_id = 1

    rebalance = bool(data.get("rebalance_schedule", True))

    try:
        imported = pdf_service.scan_and_import_lectures_folder(folder_path, block_id=block_id, rebalance=rebalance, copy_files=True)
        return jsonify({
            "success": True,
            "folder_path": folder_path,
            "imported_count": len(imported),
            "lectures": imported,
            "message": f"تم استيراد {len(imported)} محاضرة من المجلد بنجاح!"
        })
    except Exception as e:
        return jsonify({"error": f"خطأ أثناء فحص واستيراد المجلد: {e}"}), 500

@app.route("/api/lectures/batch_upload", methods=["POST"])
def batch_upload_lectures():
    files = request.files.getlist("files") or request.files.getlist("file")
    if not files:
        return jsonify({"error": "لم يتم اختيار أي ملفات"}), 400

    try:
        block_id = int(request.form.get("block_id", 1))
    except:
        block_id = 1

    rebalance_str = request.form.get("rebalance_schedule", "true")
    rebalance = str(rebalance_str).lower() in ["true", "1", "yes"]

    imported = []
    for f in files:
        if not f or not f.filename:
            continue
        ext = os.path.splitext(f.filename)[1].lower()
        if ext not in ['.pdf', '.pptx', '.ppt']:
            continue

        safe_name = re.sub(r'[^\w\-_\.]', '_', f.filename)
        base, fext = os.path.splitext(safe_name)
        dest_path = os.path.join(PDF_DIR, safe_name)
        c = 1
        while os.path.exists(dest_path):
            dest_path = os.path.join(PDF_DIR, f"{base}_{c}{fext}")
            c += 1
        f.save(dest_path)

        lec_num = pdf_service.extract_lecture_number(f.filename)
        title = pdf_service.clean_lecture_title(f.filename) or base
        subject = pdf_service.determine_subject(f.filename, lec_num)
        page_count = pdf_service.get_lecture_file_page_count(dest_path)
        extracted_text = pdf_service.extract_lecture_file_text(dest_path)

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
                pdf_service.extract_lecture_page_images(dest_path, new_id, max_pages=100)
            except Exception:
                pass

        imported.append({
            "id": new_id,
            "title": title,
            "subject": subject,
            "lecture_number": lec_num,
            "page_count": page_count,
            "filename": f.filename
        })

    if rebalance and imported:
        try:
            scheduler_service.generate_balanced_schedule(block_id)
        except Exception as e:
            print("Auto rebalance warning:", e)

    return jsonify({
        "success": True,
        "imported_count": len(imported),
        "lectures": imported,
        "message": f"تم رفع ومعالجة {len(imported)} محاضرة بنجاح!"
    })

@app.route("/api/lecture/<int:lec_id>", methods=["GET"])
def get_lecture(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Not found"}), 404
    
    cur.execute("SELECT COUNT(*) FROM questions WHERE lecture_id=?", (lec_id,))
    q_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM flashcards WHERE lecture_id=?", (lec_id,))
    f_count = cur.fetchone()[0]

    # Check Word doc
    word_path = docx_service.get_word_file_path(lec['id'], lec['lecture_number'], lec['title'])
    has_word = os.path.exists(word_path)
    has_pdf = bool(lec['file_path'] and os.path.exists(lec['file_path']))

    lec_dict = dict(lec)
    lec_dict["question_count"] = q_count
    lec_dict["flashcard_count"] = f_count
    lec_dict["has_word_file"] = has_word
    lec_dict["word_path"] = word_path if has_word else ""
    lec_dict["has_pdf_file"] = has_pdf

    conn.close()
    return jsonify({"lecture": lec_dict})

@app.route("/api/lecture/<int:lec_id>/open_pdf", methods=["POST"])
def open_lecture_pdf(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT file_path FROM lectures WHERE id=?", (lec_id,))
    row = cur.fetchone()
    conn.close()
    if not row or not row['file_path']:
        return jsonify({"error": "ملف الـ PDF غير محدد لهذه المحاضرة"}), 404
    file_path = row['file_path']
    if not os.path.exists(file_path):
        return jsonify({"error": f"ملف الـ PDF غير موجود بالمسار: {file_path}"}), 404
    try:
        os.startfile(file_path)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": f"تعذر فتح الملف: {str(e)}"}), 500

@app.route("/api/lecture/<int:lec_id>/pdf", methods=["GET"])
def serve_lecture_pdf(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT file_path, title FROM lectures WHERE id=?", (lec_id,))
    row = cur.fetchone()
    conn.close()
    if not row or not row['file_path']:
        return jsonify({"error": "PDF not found"}), 404
    file_path = row['file_path']
    if not os.path.exists(file_path):
        return jsonify({"error": "PDF file not found on disk"}), 404
    return send_file(file_path, mimetype='application/pdf')

@app.route("/api/lecture/<int:lec_id>/schedule", methods=["GET"])
@app.route("/api/lectures/<int:lec_id>/schedule", methods=["GET"])
def get_lecture_schedule(lec_id):
    res = scheduler_service.get_lecture_schedule_timeline(lec_id)
    if "error" in res:
        return jsonify(res), 404
    return jsonify(res)

@app.route("/api/lecture/<int:lec_id>/images", methods=["GET"])
def get_lecture_images(lec_id):
    """Returns rendered diagrams and slide pages for visual learning."""
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT file_path FROM lectures WHERE id=?", (lec_id,))
    row = cur.fetchone()
    conn.close()
    if not row or not row['file_path']:
        return jsonify({"images": []})
    
    images = pdf_service.extract_lecture_page_images(row['file_path'], lec_id)
    return jsonify({"images": images})

def get_lecture_full_text(lec_row, conn=None) -> str:
    """
    Retrieves the complete extracted text of the lecture.
    If not already in the database, extracts it directly from the PDF file and caches it.
    """
    try:
        if lec_row and 'extracted_text' in lec_row.keys() and lec_row['extracted_text']:
            txt = lec_row['extracted_text'].strip()
            if len(txt) > 50:
                return txt
    except Exception:
        pass

    file_path = ""
    try:
        file_path = lec_row['file_path'] if ('file_path' in lec_row.keys() and lec_row['file_path']) else ""
    except Exception:
        pass

    if file_path and os.path.exists(file_path):
        import pdf_service
        extracted = pdf_service.extract_pdf_text(file_path)
        if extracted and len(extracted.strip()) > 50:
            if conn:
                try:
                    cur = conn.cursor()
                    cur.execute("UPDATE lectures SET extracted_text=? WHERE id=?", (extracted, lec_row['id']))
                    conn.commit()
                except Exception:
                    pass
            return extracted.strip()

    title = lec_row['title'] if (lec_row and 'title' in lec_row.keys()) else "Medical Lecture"
    subject = lec_row.get('subject', 'Medicine') if hasattr(lec_row, 'get') else 'Medicine'
    return f"Lecture: {title}, Subject: {subject}"

@app.route("/api/lecture/<int:lec_id>/explain_exhaustive", methods=["POST"])
def explain_lecture_exhaustive_route(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found"}), 404

    target_lang = (request.json.get("language") if request.json else "ar") or "ar"
    force = bool(request.json.get("force", False)) if request.json else False

    extracted_text = get_lecture_full_text(lec, conn)

    try:
        # Check if already cached
        if not force:
            if target_lang == "ar" and lec['summary_arabic'] and len(lec['summary_arabic'].strip()) > 100:
                conn.close()
                return jsonify({"success": True, "explanation": lec['summary_arabic'], "language": "ar", "cached": True})
            elif target_lang == "en" and lec['summary_english'] and len(lec['summary_english'].strip()) > 100:
                conn.close()
                return jsonify({"success": True, "explanation": lec['summary_english'], "language": "en", "cached": True})

        # Ensure slide images are extracted for visual reference in the explanation
        if lec['file_path'] and os.path.exists(lec['file_path']):
            try:
                pdf_service.extract_lecture_page_images(lec['file_path'], lec_id)
            except Exception as ex:
                print(f"[EXPLAIN] Warning pre-rendering slide images: {ex}")

        # Generate direct native explanation for the requested language
        exp_res = gemini_service.explain_lecture_exhaustive(lec['title'], extracted_text, language=target_lang, lecture_id=lec_id)
        result_text = exp_res.get("explanation", "")

        if target_lang == "ar":
            cur.execute("UPDATE lectures SET summary_arabic=? WHERE id=?", (result_text, lec_id))
            conn.commit()
        else:
            cur.execute("UPDATE lectures SET summary_english=? WHERE id=?", (result_text, lec_id))
            conn.commit()

        conn.close()
        return jsonify({"success": True, "explanation": result_text, "language": target_lang, "cached": False})
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/api/ai/re_explain", methods=["POST"])
def re_explain_selection_route():
    selected_text = request.json.get("selected_text", "")
    lecture_title = request.json.get("lecture_title", "Medical Lecture")
    if not selected_text:
        return jsonify({"error": "No text selected"}), 400
    try:
        re_exp = gemini_service.re_explain_selection(selected_text, lecture_title)
        return jsonify({"success": True, "explanation": re_exp})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- LECTURE COMPARISONS & SMART TABLES -----------------
@app.route("/api/lecture/<int:lec_id>/comparisons", methods=["GET", "POST"])
def lecture_comparisons_route(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found"}), 404

    force = False
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        force = bool(data.get("force", False))

    if not force and lec['comparisons_json']:
        try:
            cached_data = json.loads(lec['comparisons_json'])
            conn.close()
            return jsonify({"success": True, "data": cached_data, "cached": True})
        except Exception:
            pass

    # Extract text if needed
    extracted_text = lec['extracted_text']
    if not extracted_text and lec['file_path'] and os.path.exists(lec['file_path']):
        extracted_text = pdf_service.extract_pdf_text(lec['file_path'])
        cur.execute("UPDATE lectures SET extracted_text=? WHERE id=?", (extracted_text, lec_id))
        conn.commit()

    if not extracted_text:
        extracted_text = f"Lecture: {lec['title']}, Subject: {lec['subject']}"

    try:
        comps_data = gemini_service.extract_lecture_comparisons(lec['title'], extracted_text)
        json_str = json.dumps(comps_data, ensure_ascii=False)
        cur.execute("UPDATE lectures SET comparisons_json=? WHERE id=?", (json_str, lec_id))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "data": comps_data, "cached": False})
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/api/lecture/<int:lec_id>/comparisons/print_view", methods=["GET"])
def lecture_comparisons_print_view(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return "المحاضرة غير موجودة", 404

    data = None
    if lec['comparisons_json']:
        try:
            data = json.loads(lec['comparisons_json'])
        except Exception:
            data = None

    if not data:
        extracted_text = lec['extracted_text']
        if not extracted_text and lec['file_path'] and os.path.exists(lec['file_path']):
            extracted_text = pdf_service.extract_pdf_text(lec['file_path'])
            cur.execute("UPDATE lectures SET extracted_text=? WHERE id=?", (extracted_text, lec_id))
            conn.commit()
        data = gemini_service.extract_lecture_comparisons(lec['title'], extracted_text or lec['title'])
        cur.execute("UPDATE lectures SET comparisons_json=? WHERE id=?", (json.dumps(data, ensure_ascii=False), lec_id))
        conn.commit()

    conn.close()
    return render_template("comparisons_print.html", lec=dict(lec), data=data)

@app.route("/api/lecture/<int:lec_id>/explanation/print_view", methods=["GET"])
def lecture_explanation_print_view(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return "المحاضرة غير موجودة", 404

    target_lang = request.args.get("lang", "ar")
    explanation = lec['summary_arabic'] if target_lang == "ar" else lec['summary_english']
    if not explanation:
        explanation = lec['summary_arabic'] or lec['summary_english'] or ""

    conn.close()
    return render_template("explanation_print.html", lec=dict(lec), explanation=explanation, lang=target_lang)

# ----------------- LECTURE NUMBERS, CONSTANTS & BIOMETRICS -----------------
@app.route("/api/lecture/<int:lec_id>/numbers", methods=["GET", "POST"])
def lecture_numbers_route(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found"}), 404

    force = False
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        force = bool(data.get("force", False))

    if not force and 'numbers_json' in lec.keys() and lec['numbers_json']:
        try:
            cached_data = json.loads(lec['numbers_json'])
            conn.close()
            return jsonify({"success": True, "data": cached_data, "cached": True})
        except Exception:
            pass

    extracted_text = get_lecture_full_text(lec, conn)
    has_file = bool(lec['file_path'] and os.path.exists(lec['file_path'])) if ('file_path' in lec.keys() and lec['file_path']) else False

    # If lecture is an imported placeholder with no PDF file and very little text
    if not has_file and len(extracted_text.strip()) < 80:
        conn.close()
        return jsonify({
            "success": True,
            "data": {
                "lecture_title": lec['title'],
                "total_numbers_found": 0,
                "categories": [],
                "summary_arabic": "",
                "no_pdf": True
            },
            "cached": False
        })

    try:
        numbers_data = gemini_service.extract_lecture_numbers(lec['title'], extracted_text)
        json_str = json.dumps(numbers_data, ensure_ascii=False)
        cur.execute("UPDATE lectures SET numbers_json=? WHERE id=?", (json_str, lec_id))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "data": numbers_data, "cached": False})
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/api/lecture/<int:lec_id>/upload_pdf", methods=["POST"])
def upload_lecture_pdf(lec_id):
    file = request.files.get("file") or request.files.get("pdf")
    if not file or not file.filename:
        return jsonify({"error": "لم يتم اختيار أي ملف"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.pptx', '.ppt']:
        return jsonify({"error": "نوع الملف غير مدعوم، يرجى رفع PDF أو PowerPoint"}), 400

    os.makedirs(PDF_DIR, exist_ok=True)
    safe_name = re.sub(r'[^\w\-_\.]', '_', file.filename)
    dest_path = os.path.join(PDF_DIR, f"lec_{lec_id}_{safe_name}")
    file.save(dest_path)

    import pdf_service
    page_count = pdf_service.get_lecture_file_page_count(dest_path)
    extracted_text = pdf_service.extract_lecture_file_text(dest_path)

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE lectures SET file_path=?, page_count=?, extracted_text=? WHERE id=?",
        (dest_path, page_count, extracted_text, lec_id)
    )
    conn.commit()
    conn.close()

    try:
        pdf_service.extract_images_from_pdf(dest_path, lec_id)
    except Exception as e:
        print(f"[PDF_IMAGES] Warning extracting images for lecture {lec_id}: {e}")

    return jsonify({
        "success": True,
        "message": "تم رفع وتجهيز ملف المحاضرة بنجاح!",
        "file_path": dest_path,
        "page_count": page_count
    })

@app.route("/api/lecture/<int:lec_id>/numbers/export_pdf", methods=["GET"])
def export_lecture_numbers_pdf(lec_id):
    import numbers_pdf_service
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found"}), 404

    numbers_data = None
    if 'numbers_json' in lec.keys() and lec['numbers_json']:
        try:
            numbers_data = json.loads(lec['numbers_json'])
        except Exception:
            pass

    if not numbers_data:
        extracted_text = get_lecture_full_text(lec, conn)
        numbers_data = gemini_service.extract_lecture_numbers(lec['title'], extracted_text)
        cur.execute("UPDATE lectures SET numbers_json=? WHERE id=?", (json.dumps(numbers_data, ensure_ascii=False), lec_id))
        conn.commit()

    try:
        pdf_path = numbers_pdf_service.build_numbers_pdf(
            lecture_id=lec_id,
            lecture_title=lec['title'],
            subject=lec['subject'],
            numbers_data=numbers_data
        )
        cur.execute("UPDATE lectures SET numbers_pdf_path=? WHERE id=?", (pdf_path, lec_id))
        conn.commit()
        conn.close()

        safe_title = re.sub(r'[\\/*?:"<>|]', '', lec['title']).strip()[:40]
        download_name = f"أرقام_وثوابت_{safe_title}.pdf"
        return send_file(pdf_path, as_attachment=True, download_name=download_name, mimetype='application/pdf')
    except Exception as e:
        conn.close()
        return jsonify({"error": f"فشل توليد ملف الـ PDF: {str(e)}"}), 500

@app.route("/api/lecture/<int:lec_id>/numbers/create_flashcards", methods=["POST"])
def create_numbers_flashcards(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found"}), 404

    req_data = request.get_json(silent=True) or {}
    items_to_create = req_data.get("items", [])

    # If no items explicitly sent, load from numbers_json
    if not items_to_create and 'numbers_json' in lec.keys() and lec['numbers_json']:
        try:
            nd = json.loads(lec['numbers_json'])
            for cat in nd.get("categories", []):
                items_to_create.extend(cat.get("items", []))
        except Exception:
            pass

    if not items_to_create:
        conn.close()
        return jsonify({"error": "No numbers available to convert to flashcards"}), 400

    created_count = 0
    today_str = date.today().isoformat()
    subdeck_name = "ثوابت وأرقام طبية (Numbers & Constants)"

    for itm in items_to_create:
        front = itm.get("flashcard_front", "").strip()
        back = itm.get("flashcard_back", "").strip()
        val = itm.get("value", "").strip()
        concept = itm.get("concept", "").strip()

        if not front:
            front = f"🔢 [ثابت طبي] ما هو {concept}؟"
        if not back:
            back = f"{val} — {itm.get('context', '')}"

        # Avoid exact duplicate in this lecture
        cur.execute("SELECT id FROM flashcards WHERE lecture_id=? AND front=?", (lec_id, front))
        if cur.fetchone():
            continue

        cur.execute('''
        INSERT INTO flashcards (
            block_id, lecture_id, front, back, subdeck, interval_days, repetitions, ease_factor, due_date
        ) VALUES (?, ?, ?, ?, ?, 1, 0, 2.5, ?)
        ''', (
            lec['block_id'], lec_id, front, back, subdeck_name, today_str
        ))
        created_count += 1

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "created_count": created_count,
        "total_items": len(items_to_create),
        "subdeck": subdeck_name
    })

# ----------------- MASSIVE QUESTION GENERATION & DOCX -----------------
@app.route("/api/lecture/<int:lec_id>/generate_massive_questions", methods=["POST"])
def generate_massive_questions_route(lec_id):
    data = request.json or {}
    q_type = data.get("type", "all") # 'mcq', 'case', 'all'
    custom_batch_name = (data.get("batch_name") or "").strip()
    difficulty_style = data.get("difficulty_style", "simple")

    if q_type == "case":
        case_count = int(data.get("case_count") or data.get("count") or 10)
        mcq_count = 0
    elif q_type in ("mcq", "normal"):
        mcq_count = int(data.get("mcq_count") or data.get("count") or 25)
        case_count = 0
    else:
        mcq_count = int(data.get("mcq_count", 30))
        case_count = int(data.get("case_count", 10))

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found"}), 404

    # Determine next batch number
    cur.execute("SELECT MAX(batch_number) FROM questions WHERE lecture_id=?", (lec_id,))
    max_b = cur.fetchone()[0]
    next_batch = (max_b or 0) + 1

    # Format batch title
    if custom_batch_name:
        batch_title = custom_batch_name
    elif q_type == "case":
        batch_title = f"حالات سريرية (Clinical Cases - {case_count} حالة)"
    elif q_type in ("mcq", "normal"):
        batch_title = f"أسئلة عادية (MCQs Bank - {mcq_count} سؤال)"
    else:
        batch_title = f"أسئلة وحالات سريرية مكثفة ({mcq_count} MCQ + {case_count} Case)"

    # Summarize existing questions to avoid duplicates
    cur.execute("SELECT question_text FROM questions WHERE lecture_id=? ORDER BY id DESC LIMIT 40", (lec_id,))
    past_questions = [r[0] for r in cur.fetchall()]
    existing_summary = "\n".join(past_questions[:25])

    # Fetch existing flashcards so questions never repeat the same concepts
    cur.execute("SELECT front, back FROM flashcards WHERE lecture_id=? ORDER BY id DESC LIMIT 60", (lec_id,))
    fc_rows = cur.fetchall()
    flashcards_summary = "\n".join([f"- {r['front']} → {r['back']}" for r in fc_rows]) if fc_rows else ""

    extracted_text = lec['extracted_text']
    if not extracted_text and lec['file_path'] and os.path.exists(lec['file_path']):
        extracted_text = pdf_service.extract_pdf_text(lec['file_path'])
        cur.execute("UPDATE lectures SET extracted_text=? WHERE id=?", (extracted_text, lec_id))
        conn.commit()

    if not extracted_text:
        extracted_text = f"Lecture: {lec['title']}, Subject: {lec['subject']}"

    try:
        gen_result = gemini_service.generate_massive_questions(
            lecture_title=lec['title'],
            lecture_text=extracted_text,
            mcq_count=mcq_count,
            case_count=case_count,
            existing_questions_summary=existing_summary,
            q_type=q_type,
            flashcards_summary=flashcards_summary,
            difficulty_style=difficulty_style
        )
        questions = gen_result.get("questions", [])
        novelty = gen_result.get("novelty_status", "novel")

        saved = 0
        saved_q_dicts = []
        for q in questions:
            # Enforce question type integrity
            if q_type == "case":
                final_type = "case"
                scenario = q.get("case_scenario", "")
            elif q_type in ("mcq", "normal"):
                final_type = "mcq"
                scenario = ""
            else:
                is_c = (q.get("question_type") == "case") or (bool(q.get("case_scenario")) and len(str(q.get("case_scenario")).strip()) > 5)
                final_type = "case" if is_c else "mcq"
                scenario = q.get("case_scenario", "") if is_c else ""

            cur.execute('''
            INSERT INTO questions (
                block_id, lecture_id, question_type, case_scenario, question_text,
                option_a, option_b, option_c, option_d, correct_option,
                explanation, explanation_arabic, difficulty, batch_number, batch_name, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ai_generated')
            ''', (
                lec['block_id'], lec_id, final_type,
                scenario, q.get("question_text", ""),
                q.get("option_a", ""), q.get("option_b", ""), q.get("option_c", ""), q.get("option_d", ""),
                q.get("correct_option", "A"), q.get("explanation", ""),
                q.get("explanation_arabic", ""), q.get("difficulty", "medium"),
                next_batch, batch_title
            ))
            q_id = cur.lastrowid
            q['id'] = q_id
            q['batch_number'] = next_batch
            q['batch_name'] = batch_title
            q['question_type'] = final_type
            q['case_scenario'] = scenario
            saved += 1
            saved_q_dicts.append(q)

        conn.commit()
        conn.close()

        # Append to Word file
        word_file_path = docx_service.append_questions_to_word(
            lecture_id=lec_id,
            lecture_number=lec['lecture_number'],
            lecture_title=lec['title'],
            questions=saved_q_dicts,
            batch_name=f"باتش {next_batch}: {batch_title}"
        )

        return jsonify({
            "success": True,
            "questions_generated": saved,
            "batch_number": next_batch,
            "batch_name": batch_title,
            "question_type": q_type,
            "novelty_status": novelty,
            "word_file_path": word_file_path
        })
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/api/lecture/<int:lec_id>/open_word", methods=["POST"])
def open_lecture_word(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    conn.close()
    if not lec:
        return jsonify({"error": "Lecture not found"}), 404

    try:
        file_path = docx_service.rebuild_lecture_word_document(lec_id)
        success = docx_service.open_word_document(file_path)
        return jsonify({"success": success, "file_path": file_path})
    except Exception as e:
        return jsonify({"error": f"تعذر فتح ملف الوورد (قد يكون مفتوحاً في برنامج Word): {str(e)}"}), 500

@app.route("/api/lecture/<int:lec_id>/export_word", methods=["POST"])
def export_lecture_word(lec_id):
    """Exports or opens Word document with selective batches."""
    data = request.json or {}
    selected_batches = data.get("selected_batches") # list of batch numbers, e.g. [1, 2]
    action = data.get("action", "open") # 'open' or 'download'
    include_explanation = data.get("include_explanation", True)
    if isinstance(include_explanation, str):
        include_explanation = (include_explanation.lower() in ("true", "1", "yes"))

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    conn.close()
    if not lec:
        return jsonify({"error": "المحاضرة غير موجودة"}), 404

    batches_list = None
    if selected_batches and isinstance(selected_batches, list) and len(selected_batches) > 0:
        batches_list = [int(b) for b in selected_batches]

    try:
        if action == "download":
            t_stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            temp_filename = f"{docx_service.sanitize_filename(lec['title'])}_Batches_{t_stamp}.docx"
            temp_path = os.path.join(docx_service.WORD_BANKS_DIR, temp_filename)
            docx_service.rebuild_lecture_word_document(lec_id, selected_batches=batches_list, output_path=temp_path, include_explanation=include_explanation)
            return send_file(temp_path, as_attachment=True, download_name=temp_filename)
        else:
            # Action == 'open'
            if batches_list is not None:
                t_stamp = datetime.now().strftime("%H%M%S")
                custom_filename = f"{docx_service.sanitize_filename(lec['title'])}_Selected_{t_stamp}.docx"
                file_path = os.path.join(docx_service.WORD_BANKS_DIR, custom_filename)
                docx_service.rebuild_lecture_word_document(lec_id, selected_batches=batches_list, output_path=file_path, include_explanation=include_explanation)
            else:
                file_path = docx_service.rebuild_lecture_word_document(lec_id, include_explanation=include_explanation)

            success = docx_service.open_word_document(file_path)
            return jsonify({"success": success, "file_path": file_path})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/lecture/<int:lec_id>/batches", methods=["GET"])
def get_lecture_batches(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT batch_number, batch_name, COUNT(*) as count, source 
        FROM questions 
        WHERE lecture_id=? AND batch_number IS NOT NULL
        GROUP BY batch_number 
        ORDER BY batch_number ASC
    """, (lec_id,))
    rows = cur.fetchall()

    batch_details = []
    simple_batches = []
    for r in rows:
        b_num = r['batch_number']
        b_name = r['batch_name'] or f"باتش {b_num}"
        simple_batches.append(b_num)
        batch_details.append({
            "batch_number": b_num,
            "batch_name": b_name,
            "display_title": f"باتش {b_num}: {b_name} ({r['count']} سؤال)" if b_name != f"باتش {b_num}" else f"باتش {b_num} ({r['count']} سؤال)",
            "count": r['count'],
            "source": r['source']
        })

    cur.execute("SELECT COUNT(*) FROM questions WHERE lecture_id=? AND source='past_paper'", (lec_id,))
    past_paper_count = cur.fetchone()[0]

    cur.execute("""
        SELECT 
            COUNT(CASE WHEN question_type != 'case' AND (case_scenario IS NULL OR LENGTH(TRIM(case_scenario)) <= 5) THEN 1 END) as mcq_count,
            COUNT(CASE WHEN question_type = 'case' OR LENGTH(TRIM(case_scenario)) > 5 THEN 1 END) as case_count
        FROM questions WHERE lecture_id=?
    """, (lec_id,))
    cnt_row = cur.fetchone()
    mcq_count = cnt_row[0] if cnt_row else 0
    case_count = cnt_row[1] if cnt_row else 0

    cur.execute("SELECT COUNT(*) FROM questions WHERE lecture_id=?", (lec_id,))
    total = cur.fetchone()[0]
    conn.close()

    return jsonify({
        "batches": simple_batches,
        "batch_details": batch_details,
        "past_paper_count": past_paper_count,
        "mcq_count": mcq_count,
        "case_count": case_count,
        "total": total
    })

@app.route("/api/pdfs", methods=["GET"])
def list_available_pdfs():
    """Lists available lecture PDFs and uploaded PDFs for quick selection."""
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, lecture_number, title, subject, file_path, page_count FROM lectures WHERE file_path != '' AND file_path IS NOT NULL ORDER BY lecture_number ASC")
    lectures_with_pdf = [dict(r) for r in cur.fetchall() if r['file_path'] and os.path.exists(r['file_path'])]
    conn.close()

    uploaded_files = []
    if os.path.exists(PDF_DIR):
        for f in os.listdir(PDF_DIR):
            if f.lower().endswith('.pdf'):
                full_p = os.path.join(PDF_DIR, f)
                uploaded_files.append({
                    "filename": f,
                    "file_path": full_p,
                    "size_kb": round(os.path.getsize(full_p) / 1024)
                })

    combined_pdfs = []
    for l in lectures_with_pdf:
        combined_pdfs.append({
            "path": l['file_path'],
            "display_name": f"#{l['lecture_number']} - {l['title']} ({l['subject']})",
            "category": "lecture",
            "lecture_id": l['id']
        })
    for u in uploaded_files:
        combined_pdfs.append({
            "path": u['file_path'],
            "display_name": u['filename'],
            "category": "uploaded",
            "lecture_id": None
        })

    return jsonify({
        "pdfs": combined_pdfs,
        "lecture_pdfs": lectures_with_pdf,
        "uploaded_pdfs": uploaded_files
    })

@app.route("/api/questions/generate_from_pdf", methods=["POST"])
def generate_questions_from_pdf():
    """Extracts/generates questions from an uploaded or selected PDF and attaches them to a specific lecture."""
    pdf_file = request.files.get("pdf_file") or request.files.get("file")
    
    form_data = request.form if request.form else (request.json or {})
    existing_pdf_path = form_data.get("pdf_path")
    
    lecture_id = form_data.get("lecture_id")
    if not lecture_id:
        return jsonify({"error": "يرجى تحديد المحاضرة المراد إلحاق الأسئلة بها"}), 400
    try:
        lecture_id = int(lecture_id)
    except:
        return jsonify({"error": "معرف المحاضرة غير صالح"}), 400

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lecture_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "المحاضرة المحددة غير موجودة"}), 404

    # Determine file path to extract from
    saved_path = None
    filename = ""
    if pdf_file and pdf_file.filename:
        filename = pdf_file.filename
        safe_name = re.sub(r'[^\w\-_\.]', '_', filename)
        base, ext = os.path.splitext(safe_name)
        if ext.lower() != '.pdf':
            conn.close()
            return jsonify({"error": "يرجى اختيار ملف بصيغة PDF فقط (.pdf)"}), 400
        
        saved_path = os.path.join(PDF_DIR, safe_name)
        counter = 1
        while os.path.exists(saved_path):
            saved_path = os.path.join(PDF_DIR, f"{base}_{counter}{ext}")
            counter += 1
        pdf_file.save(saved_path)
    elif existing_pdf_path and os.path.exists(existing_pdf_path):
        saved_path = existing_pdf_path
        filename = os.path.basename(existing_pdf_path)
    elif lec['file_path'] and os.path.exists(lec['file_path']):
        saved_path = lec['file_path']
        filename = os.path.basename(lec['file_path'])
    else:
        conn.close()
        return jsonify({"error": "يرجى رفع ملف PDF أو تحديد ملف موجود للمراجعة"}), 400

    # Extract text from this PDF
    pdf_text = pdf_service.extract_pdf_text(saved_path, max_pages=100)
    if not pdf_text or len(pdf_text.strip()) < 40:
        conn.close()
        return jsonify({"error": "تعذر استخراج نص مقروء من ملف الـ PDF المحدد"}), 400

    # Custom Quiz / Batch Name
    quiz_name = form_data.get("quiz_name", "").strip()
    if not quiz_name:
        clean_name = pdf_service.clean_lecture_title(filename)
        quiz_name = f"كويز {clean_name}" if clean_name else "كويز مراجعة PDF"

    mcq_count = max(5, min(int(form_data.get("mcq_count", 20)), 50))
    case_count = max(0, min(int(form_data.get("case_count", 5)), 20))

    # Determine next batch number for this lecture
    cur.execute("SELECT MAX(batch_number) FROM questions WHERE lecture_id=?", (lecture_id,))
    max_b = cur.fetchone()[0]
    next_batch = (max_b or 0) + 1

    # Summarize existing questions to avoid duplicates
    cur.execute("SELECT question_text FROM questions WHERE lecture_id=? ORDER BY id DESC LIMIT 30", (lecture_id,))
    existing_summary = "\n".join([r[0] for r in cur.fetchall()[:20]])

    try:
        gen_result = gemini_service.generate_massive_questions(
            lecture_title=f"{lec['title']} - {quiz_name}",
            lecture_text=pdf_text[:120000],
            mcq_count=mcq_count,
            case_count=case_count,
            existing_questions_summary=existing_summary
        )
        questions = gen_result.get("questions", [])
        novelty = gen_result.get("novelty_status", "novel")

        saved_q_dicts = []
        for q in questions:
            cur.execute('''
            INSERT INTO questions (
                block_id, lecture_id, question_type, case_scenario, question_text,
                option_a, option_b, option_c, option_d, correct_option,
                explanation, explanation_arabic, difficulty, batch_number, batch_name, source, source_file
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pdf_custom_quiz', ?)
            ''', (
                lec['block_id'], lecture_id, q.get("question_type", "mcq"),
                q.get("case_scenario", ""), q.get("question_text", ""),
                q.get("option_a", ""), q.get("option_b", ""), q.get("option_c", ""), q.get("option_d", ""),
                q.get("correct_option", "A"), q.get("explanation", ""),
                q.get("explanation_arabic", ""), q.get("difficulty", "medium"),
                next_batch, quiz_name, filename
            ))
            q['id'] = cur.lastrowid
            q['batch_number'] = next_batch
            q['batch_name'] = quiz_name
            saved_q_dicts.append(q)

        conn.commit()

        # Append to lecture's official Word document
        word_file_path = ""
        try:
            word_file_path = docx_service.append_questions_to_word(
                lecture_id=lecture_id,
                lecture_number=lec['lecture_number'],
                lecture_title=lec['title'],
                questions=saved_q_dicts,
                batch_name=f"{quiz_name} (باتش {next_batch})"
            )
        except Exception as e:
            print("Word append warning:", e)

        conn.close()

        return jsonify({
            "success": True,
            "lecture_id": lecture_id,
            "lecture_title": lec['title'],
            "batch_number": next_batch,
            "quiz_name": quiz_name,
            "questions_generated": len(saved_q_dicts),
            "questions": saved_q_dicts,
            "novelty_status": novelty,
            "word_file_path": word_file_path
        })
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/api/lecture/<int:lec_id>/reset", methods=["POST"])
def reset_lecture_content(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found"}), 404

    # Count items to be deleted
    cur.execute("SELECT COUNT(*) FROM questions WHERE lecture_id=?", (lec_id,))
    q_count = cur.fetchone()[0]
    cur.execute("DELETE FROM questions WHERE lecture_id=?", (lec_id,))

    cur.execute("SELECT COUNT(*) FROM flashcards WHERE lecture_id=?", (lec_id,))
    f_count = cur.fetchone()[0]
    cur.execute("DELETE FROM flashcards WHERE lecture_id=?", (lec_id,))

    # Reset study tasks completed status or targets for this lecture
    cur.execute("UPDATE study_tasks SET target_questions=0, target_cards=0, is_completed=0 WHERE lecture_id=?", (lec_id,))

    conn.commit()
    conn.close()

    # Remove or reset existing Word file for this lecture so next batch starts as Batch 1 in a fresh file
    try:
        word_path = docx_service.get_word_file_path(lec_id, lec['lecture_number'], lec['title'])
        if os.path.exists(word_path):
            os.remove(word_path)
    except Exception as e:
        print(f"Notice: could not delete word file: {e}")

    return jsonify({
        "success": True,
        "lecture_id": lec_id,
        "lecture_title": lec['title'],
        "deleted_questions": q_count,
        "deleted_flashcards": f_count,
        "message": f"تم بنجاح تصفير المحاضرة (حذف {q_count} سؤال و {f_count} بطاقة استذكار)"
    })

@app.route("/api/lecture/<int:lec_id>/delete", methods=["POST", "DELETE"])
@app.route("/api/lectures/<int:lec_id>/delete", methods=["POST", "DELETE"])
def delete_lecture_route(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "المحاضرة غير موجودة"}), 404

    block_id = lec['block_id']
    lec_num = lec['lecture_number']
    title = lec['title']
    file_path = lec['file_path'] or ""
    word_file_path = lec['word_file_path'] or ""

    # Delete related records
    cur.execute("DELETE FROM questions WHERE lecture_id=?", (lec_id,))
    cur.execute("DELETE FROM flashcards WHERE lecture_id=?", (lec_id,))
    cur.execute("DELETE FROM study_tasks WHERE lecture_id=?", (lec_id,))
    cur.execute("DELETE FROM audio_notes WHERE lecture_id=?", (lec_id,))
    cur.execute("DELETE FROM exam_extracted_questions WHERE lecture_id=?", (lec_id,))
    cur.execute("DELETE FROM lecture_smart_reviews WHERE lecture_id=?", (lec_id,))
    cur.execute("DELETE FROM lectures WHERE id=?", (lec_id,))
    conn.commit()

    # Check if other lectures reference the same file_path
    if file_path:
        cur.execute("SELECT COUNT(*) FROM lectures WHERE file_path=?", (file_path,))
        other_count = cur.fetchone()[0]
        if other_count == 0 and os.path.exists(file_path):
            try:
                if os.path.abspath(PDF_DIR) in os.path.abspath(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Notice: could not delete lecture file from disk: {e}")

    conn.close()

    # Remove lecture slide images
    try:
        lec_img_dir = os.path.join(pdf_service.IMAGES_DIR, f"lec_{lec_id}")
        if os.path.exists(lec_img_dir):
            shutil.rmtree(lec_img_dir, ignore_errors=True)
    except Exception as e:
        print(f"Notice: could not delete lecture images: {e}")

    # Remove lecture Word file
    try:
        word_path = docx_service.get_word_file_path(lec_id, lec_num, title)
        if os.path.exists(word_path):
            os.remove(word_path)
        if word_file_path and os.path.exists(word_file_path):
            os.remove(word_file_path)
    except Exception as e:
        print(f"Notice: could not delete lecture Word doc: {e}")

    # Rebalance schedule if possible
    try:
        if block_id:
            scheduler_service.generate_balanced_schedule(block_id)
    except Exception as e:
        print("Auto rebalance warning on lecture delete:", e)

    return jsonify({
        "success": True,
        "message": f"تم حذف محاضرة '{title}' وجميع أسئلتها وبطاقاتها بنجاح.",
        "deleted_id": lec_id,
        "deleted_title": title
    })

@app.route("/api/lecture/<int:lec_id>/replace_pdf", methods=["POST"])
@app.route("/api/lectures/<int:lec_id>/replace_pdf", methods=["POST"])
def replace_lecture_pdf_route(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "المحاضرة غير موجودة"}), 404

    pdf_file = request.files.get("pdf_file") or request.files.get("file")
    if not pdf_file or not pdf_file.filename:
        conn.close()
        return jsonify({"error": "يرجى اختيار ملف PDF أو PowerPoint جديد"}), 400

    filename = pdf_file.filename
    safe_name = re.sub(r'[^\w\-_\.]', '_', filename)
    base, ext = os.path.splitext(safe_name)
    ext_lower = ext.lower()

    if ext_lower not in ['.pdf', '.pptx', '.ppt']:
        conn.close()
        return jsonify({"error": "يرجى اختيار ملف PDF أو PowerPoint (.pptx/.ppt)"}), 400

    block_id = lec['block_id']
    old_file_path = lec['file_path'] or ""
    old_title = lec['title']
    lec_num = lec['lecture_number']

    # Form parameters
    reset_questions = request.form.get("reset_questions", "false").lower() in ["true", "1", "yes"]
    reset_explanation = request.form.get("reset_explanation", "true").lower() in ["true", "1", "yes"]
    update_title = request.form.get("update_title", "false").lower() in ["true", "1", "yes"]
    rebalance = request.form.get("rebalance_schedule", "true").lower() in ["true", "1", "yes"]

    # Save new file
    saved_path = os.path.join(PDF_DIR, safe_name)
    counter = 1
    while os.path.exists(saved_path):
        saved_path = os.path.join(PDF_DIR, f"{base}_{counter}{ext}")
        counter += 1
    pdf_file.save(saved_path)

    # Extract new page / slide count
    actual_pages = pdf_service.get_lecture_file_page_count(saved_path)

    # Extract new text
    extracted_text = pdf_service.extract_lecture_file_text(saved_path)

    # Optional new title
    new_title = old_title
    if update_title:
        cleaned = pdf_service.clean_lecture_title(filename)
        if cleaned:
            new_title = cleaned

    # Update database
    if reset_explanation:
        cur.execute('''
            UPDATE lectures
            SET file_path=?, page_count=?, extracted_text=?, summary_arabic='', summary_english='', comparisons_json='', title=?
            WHERE id=?
        ''', (saved_path, actual_pages, extracted_text, new_title, lec_id))
        cur.execute("DELETE FROM lecture_smart_reviews WHERE lecture_id=?", (lec_id,))
    else:
        cur.execute('''
            UPDATE lectures
            SET file_path=?, page_count=?, extracted_text=?, title=?
            WHERE id=?
        ''', (saved_path, actual_pages, extracted_text, new_title, lec_id))

    if reset_questions:
        cur.execute("DELETE FROM questions WHERE lecture_id=?", (lec_id,))
        cur.execute("DELETE FROM flashcards WHERE lecture_id=?", (lec_id,))
        cur.execute("UPDATE study_tasks SET target_questions=0, target_cards=0, is_completed=0 WHERE lecture_id=?", (lec_id,))
        try:
            word_path = docx_service.get_word_file_path(lec_id, lec_num, old_title)
            if os.path.exists(word_path):
                os.remove(word_path)
        except Exception as e:
            print(f"Notice: could not delete word file: {e}")

    conn.commit()

    # Check if old file was in PDF_DIR and not used by other lectures
    if old_file_path and old_file_path != saved_path:
        cur.execute("SELECT COUNT(*) FROM lectures WHERE file_path=?", (old_file_path,))
        other_cnt = cur.fetchone()[0]
        if other_cnt == 0 and os.path.exists(old_file_path):
            try:
                if os.path.abspath(PDF_DIR) in os.path.abspath(old_file_path):
                    os.remove(old_file_path)
            except Exception as e:
                print(f"Notice: could not remove old lecture file: {e}")

    conn.close()

    # Re-render slide images
    try:
        lec_img_dir = os.path.join(pdf_service.IMAGES_DIR, f"lec_{lec_id}")
        if os.path.exists(lec_img_dir):
            shutil.rmtree(lec_img_dir, ignore_errors=True)
        if ext_lower == '.pdf':
            pdf_service.extract_lecture_page_images(saved_path, lec_id, max_pages=8)
    except Exception as e:
        print(f"Warning updating slide images for lecture {lec_id}: {e}")

    # Rebalance schedule
    if rebalance:
        try:
            scheduler_service.generate_balanced_schedule(block_id)
        except Exception as e:
            print("Auto rebalance warning on PDF replace:", e)

    return jsonify({
        "success": True,
        "id": lec_id,
        "title": new_title,
        "page_count": actual_pages,
        "file_path": saved_path,
        "file_name": os.path.basename(saved_path),
        "message": f"تم تبديل ملف المحاضرة بنجاح إلى '{os.path.basename(saved_path)}' ({actual_pages} صفحة/شريحة)."
    })

# ----------------- EXAM SOURCES & AI FILTERING -----------------
@app.route("/api/exam_sources", methods=["GET"])
def get_exam_sources():
    sources = pdf_ocr_service.get_available_sources()
    total_cached = sum(s.get("cached_pages", 0) for s in sources)
    return jsonify({
        "success": True,
        "sources": sources,
        "total_sources": len(sources),
        "total_cached_pages": total_cached
    })

@app.route("/api/exam_sources/upload", methods=["POST"])
def upload_exam_source():
    # Support both single file and multiple files
    uploaded_files = []
    files_to_process = []

    if 'files' in request.files:
        files_to_process = request.files.getlist('files')
    elif 'file' in request.files:
        files_to_process = [request.files['file']]

    if not files_to_process or all(not f.filename for f in files_to_process):
        return jsonify({"error": "لم يتم اختيار أي ملف PDF"}), 400

    upload_dir = pdf_ocr_service.UPLOAD_EXAMS_DIR
    os.makedirs(upload_dir, exist_ok=True)

    for file in files_to_process:
        if not file or not file.filename:
            continue
        if not file.filename.lower().endswith(".pdf"):
            continue

        safe_filename = os.path.basename(file.filename)
        save_path = os.path.join(upload_dir, safe_filename)
        file.save(save_path)

        # Index PDF immediately
        try:
            pdf_ocr_service.ensure_file_indexed(safe_filename, save_path)
        except Exception as e:
            print(f"[EXAM_UPLOAD] Indexing error for {safe_filename}: {e}")

        uploaded_files.append({
            "filename": safe_filename,
            "file_path": save_path
        })

    if not uploaded_files:
        return jsonify({"error": "يرجى اختيار ملفات بصيغة PDF فقط (.pdf)"}), 400

    return jsonify({
        "success": True,
        "uploaded": uploaded_files,
        "filename": uploaded_files[0]["filename"] if uploaded_files else ""
    })

@app.route("/api/exam_sources/delete", methods=["POST"])
def delete_exam_source_route():
    data = request.json or {}
    filename = data.get("filename")
    if not filename:
        return jsonify({"error": "اسم الملف مطلوب"}), 400
    pdf_ocr_service.delete_exam_source(filename)
    return jsonify({"success": True, "filename": filename})

@app.route("/api/exam_sources/clear_all", methods=["POST"])
def clear_all_exam_sources_route():
    pdf_ocr_service.clear_all_sources()
    return jsonify({"success": True})

@app.route("/api/exam_sources/index", methods=["POST"])
def index_exam_source():
    data = request.json or {}
    filename = data.get("filename")
    start_page = int(data.get("start_page", 1))
    end_page = data.get("end_page")
    if end_page:
        end_page = int(end_page)
    try:
        res = pdf_ocr_service.index_pdf_file(filename, start_page=start_page, end_page=end_page)
        return jsonify({"success": True, "result": res})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/exam_questions/match", methods=["POST"])
def match_exam_questions_api():
    data = request.json or {}
    lecture_ids = data.get("lecture_ids", [])
    if not lecture_ids:
        # Fallback to single lecture_id if passed
        single_id = data.get("lecture_id")
        if single_id:
            lecture_ids = [int(single_id)]
    
    lecture_ids = [int(x) for x in lecture_ids if str(x).isdigit()]
    if not lecture_ids:
        return jsonify({"error": "يرجى تحديد محاضرة واحدة على الأقل"}), 400

    source_files = data.get("source_files", None)
    max_questions = int(data.get("max_questions", 50))
    force_reextract = bool(data.get("force_reextract", False))

    try:
        res = ai_question_matcher.match_exam_questions(lecture_ids, source_files, max_questions, force_reextract=force_reextract)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/exam_sources/<path:filename>/cached_questions", methods=["GET"])
def get_file_cached_questions(filename):
    """Returns all questions pre-extracted and cached from a specific exam file."""
    safe_filename = os.path.basename(filename)
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM exam_extracted_questions WHERE source_filename=? ORDER BY source_page ASC, id ASC",
        (safe_filename,)
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify({
        "success": True,
        "filename": safe_filename,
        "count": len(rows),
        "questions": rows
    })

@app.route("/api/exam_questions/save_to_bank", methods=["POST"])
def save_exam_questions_to_bank():
    data = request.json or {}
    questions = data.get("questions", [])
    block_id = int(data.get("block_id", 1))
    batch_name = data.get("batch_name", "")
    target_lecture_id = data.get("target_lecture_id")

    if target_lecture_id:
        try:
            target_lecture_id = int(target_lecture_id)
            for q in questions:
                q["lecture_id"] = target_lecture_id
        except Exception:
            pass

    if not questions:
        return jsonify({"error": "لا توجد أسئلة لحفظها"}), 400

    saved_count = ai_question_matcher.save_matched_questions_to_bank(questions, block_id, batch_name)
    return jsonify({"success": True, "saved_count": saved_count})

@app.route("/api/exam_questions/export_word", methods=["POST"])
def export_exam_questions_word():
    data = request.json or {}
    questions = data.get("questions", [])
    title = data.get("title", "أسئلة امتحانات سابقة مفلترة بالذكاء الاصطناعي")
    include_explanation = data.get("include_explanation", True)
    if isinstance(include_explanation, str):
        include_explanation = (include_explanation.lower() in ("true", "1", "yes"))
    if not questions:
        return jsonify({"error": "لا توجد أسئلة للتصدير"}), 400

    try:
        file_path = docx_service.export_filtered_exam_questions_docx(questions, title, include_explanation=include_explanation)
        docx_service.open_word_document(file_path)
        return jsonify({"success": True, "file_path": file_path, "filename": os.path.basename(file_path)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- QUESTIONS & QUIZ ENGINE -----------------
@app.route("/api/questions", methods=["GET"])
def get_questions():
    block_id = request.args.get("block_id")
    lecture_id = request.args.get("lecture_id")
    batch_num = request.args.get("batch_number")
    source = request.args.get("source") # 'past_paper', 'ai_generated'
    mode = request.args.get("mode") # 'all', 'cases', 'bookmarked', 'random_quiz'
    default_limit = 200 if (batch_num and batch_num != "all") else 50
    limit = int(request.args.get("limit", default_limit))

    conn = database.get_connection()
    cur = conn.cursor()

    if not block_id:
        cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
        row = cur.fetchone()
        block_id = int(row['value']) if row else 1

    query = "SELECT q.*, l.title as lecture_title FROM questions q LEFT JOIN lectures l ON q.lecture_id = l.id WHERE q.block_id=?"
    params = [block_id]

    if lecture_id:
        query += " AND q.lecture_id=?"
        params.append(lecture_id)

    if batch_num and batch_num != "all":
        query += " AND q.batch_number=?"
        params.append(int(batch_num))

    if source:
        query += " AND q.source=?"
        params.append(source)

    if mode == "cases":
        query += " AND (q.question_type='case' OR LENGTH(TRIM(q.case_scenario)) > 5)"
    elif mode in ("normal", "mcq"):
        query += " AND (q.question_type != 'case' AND (q.case_scenario IS NULL OR LENGTH(TRIM(q.case_scenario)) <= 5))"
    elif mode == "bookmarked":
        query += " AND q.is_bookmarked=1"

    if mode == "random_quiz":
        query += " ORDER BY RANDOM()"
    else:
        query += " ORDER BY q.id ASC"

    query += f" LIMIT {limit}"
    cur.execute(query, params)
    questions = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify({"questions": questions})

@app.route("/api/questions/add", methods=["POST"])
def add_custom_question():
    """Allows manual creation of a custom MCQ or Clinical Case question."""
    data = request.json or {}
    lecture_id = data.get("lecture_id")
    if not lecture_id:
        return jsonify({"error": "يرجى تحديد المحاضرة"}), 400

    q_type = data.get("question_type", "mcq")
    case_scenario = (data.get("case_scenario") or "").strip()
    question_text = (data.get("question_text") or "").strip()
    option_a = (data.get("option_a") or "").strip()
    option_b = (data.get("option_b") or "").strip()
    option_c = (data.get("option_c") or "").strip()
    option_d = (data.get("option_d") or "").strip()
    correct_option = (data.get("correct_option") or "A").strip().upper()
    explanation = (data.get("explanation") or "").strip()
    explanation_arabic = (data.get("explanation_arabic") or explanation).strip()
    difficulty = data.get("difficulty", "medium")

    if not question_text or not option_a or not option_b:
        return jsonify({"error": "يرجى إدخال نص السؤال والخيارات الأساسية"}), 400

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lecture_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "المحاضرة غير موجودة"}), 404

    is_case = (q_type == "case") or (len(case_scenario) > 5)
    final_type = "case" if is_case else "mcq"

    batch_name = (data.get("batch_name") or "").strip()
    batch_number = data.get("batch_number")

    if not batch_name:
        batch_name = "إضافة يدوية"

    if batch_number is not None:
        try:
            batch_number = int(batch_number)
        except Exception:
            batch_number = None

    if batch_number is None:
        # Check if this batch_name already exists for this lecture
        cur.execute("SELECT batch_number FROM questions WHERE lecture_id=? AND batch_name=? LIMIT 1", (lecture_id, batch_name))
        existing_b = cur.fetchone()
        if existing_b and existing_b[0]:
            batch_number = existing_b[0]
        else:
            cur.execute("SELECT COALESCE(MAX(batch_number), 0) FROM questions WHERE lecture_id=?", (lecture_id,))
            batch_number = (cur.fetchone()[0] or 0) + 1

    cur.execute('''
    INSERT INTO questions (
        block_id, lecture_id, question_type, case_scenario, question_text,
        option_a, option_b, option_c, option_d, correct_option,
        explanation, explanation_arabic, difficulty, batch_number, batch_name, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
    ''', (
        lec['block_id'], lecture_id, final_type,
        case_scenario if is_case else "", question_text,
        option_a, option_b, option_c, option_d,
        correct_option, explanation, explanation_arabic, difficulty,
        batch_number, batch_name
    ))
    new_id = cur.lastrowid
    conn.commit()
    conn.close()

    # Automatically rebuild / sync the lecture's Word file
    try:
        docx_service.rebuild_lecture_word_document(lecture_id)
    except Exception as we:
        print(f"Warning rebuilding docx on add_custom_question: {we}")

    return jsonify({
        "success": True, 
        "question_id": new_id, 
        "question_type": final_type,
        "batch_number": batch_number,
        "batch_name": batch_name
    })

@app.route("/api/questions/<int:q_id>/edit", methods=["POST"])
def edit_question(q_id):
    data = request.json or {}
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM questions WHERE id=?", (q_id,))
    existing = cur.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "السؤال غير موجود"}), 404

    lecture_id = existing["lecture_id"]
    question_text = (data.get("question_text") if "question_text" in data else existing["question_text"]).strip()
    case_scenario = (data.get("case_scenario") if "case_scenario" in data else existing["case_scenario"]) or ""
    option_a = (data.get("option_a") if "option_a" in data else existing["option_a"]).strip()
    option_b = (data.get("option_b") if "option_b" in data else existing["option_b"]).strip()
    option_c = (data.get("option_c") if "option_c" in data else existing["option_c"]).strip()
    option_d = (data.get("option_d") if "option_d" in data else existing["option_d"]).strip()
    correct_option = str(data.get("correct_option") if "correct_option" in data else existing["correct_option"]).strip().upper()[:1]
    explanation = (data.get("explanation") if "explanation" in data else existing["explanation"]) or ""
    explanation_arabic = (data.get("explanation_arabic") if "explanation_arabic" in data else existing["explanation_arabic"]) or explanation
    difficulty = data.get("difficulty") if "difficulty" in data else existing["difficulty"]
    q_type = data.get("question_type") if "question_type" in data else existing["question_type"]

    is_case = (q_type == "case") or (len(case_scenario.strip()) > 5)
    final_type = "case" if is_case else "mcq"

    cur.execute("""
        UPDATE questions SET
            question_type=?, case_scenario=?, question_text=?,
            option_a=?, option_b=?, option_c=?, option_d=?,
            correct_option=?, explanation=?, explanation_arabic=?, difficulty=?
        WHERE id=?
    """, (
        final_type, case_scenario if is_case else "", question_text,
        option_a, option_b, option_c, option_d,
        correct_option, explanation, explanation_arabic, difficulty,
        q_id
    ))
    conn.commit()
    conn.close()

    # Rebuild lecture Word document immediately to keep it 100% in sync
    if lecture_id:
        try:
            docx_service.rebuild_lecture_word_document(lecture_id)
        except Exception as we:
            print(f"Docx rebuild error on question edit: {we}")

    return jsonify({"success": True, "question_id": q_id, "lecture_id": lecture_id})

@app.route("/api/questions/<int:q_id>/simplify", methods=["POST"])
def simplify_question_route(q_id):
    """Refines an existing question with AI to make it simpler, direct, and straightforward."""
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM questions WHERE id=?", (q_id,))
    existing = cur.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "السؤال غير موجود"}), 404
    
    q_dict = dict(existing)
    lecture_id = q_dict.get("lecture_id")
    context = ""
    if lecture_id:
        cur.execute("SELECT title, subject FROM lectures WHERE id=?", (lecture_id,))
        lec_row = cur.fetchone()
        if lec_row:
            context = f"المحاضرة: {lec_row['title']} ({lec_row['subject']})"

    instruction = (
        "أعد صياغة هذا السؤال ليكون بسيطاً ومباشراً جداً ومفهوماً بسهولة (مستوى امتحانات كليات الطب المباشرة). "
        "احذف أي لف ودوران أو تعقيد في رأس السؤال، واجعل السيناريو مختصراً جداً بدون تفاصيل معملية مشتتة، "
        "واجعل الخيارات الأربعة واضحة وحاسمة بدون لف ودوران، والشرح ممتعاً وموجزاً."
    )

    try:
        new_q = gemini_service.refine_question_with_ai(q_dict, instruction, context)
        final_type = new_q.get("question_type", q_dict.get("question_type", "mcq"))
        scenario = new_q.get("case_scenario", "") if final_type == "case" else ""
        cur.execute("""
            UPDATE questions SET
                question_type=?, case_scenario=?, question_text=?,
                option_a=?, option_b=?, option_c=?, option_d=?,
                correct_option=?, explanation=?, explanation_arabic=?, difficulty='easy'
            WHERE id=?
        """, (
            final_type,
            scenario,
            new_q.get("question_text", q_dict["question_text"]),
            new_q.get("option_a", q_dict["option_a"]),
            new_q.get("option_b", q_dict["option_b"]),
            new_q.get("option_c", q_dict["option_c"]),
            new_q.get("option_d", q_dict["option_d"]),
            str(new_q.get("correct_option", q_dict["correct_option"])).strip().upper()[:1],
            new_q.get("explanation", q_dict.get("explanation", "")),
            new_q.get("explanation", q_dict.get("explanation", "")),
            q_id
        ))
        conn.commit()

        cur.execute("SELECT * FROM questions WHERE id=?", (q_id,))
        updated_row = dict(cur.fetchone())
        conn.close()

        # Rebuild lecture Word doc in background
        if lecture_id:
            try:
                docx_service.rebuild_lecture_word_document(lecture_id)
            except Exception:
                pass

        return jsonify({"success": True, "question": updated_row, "message": "تم تبسيط السؤال بنجاح! ✨"})
    except Exception as e:
        conn.close()
        return jsonify({"error": f"تعذر تبسيط السؤال: {str(e)}"}), 500

@app.route("/api/questions/<int:q_id>", methods=["DELETE"])
def delete_question(q_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT lecture_id FROM questions WHERE id=?", (q_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "السؤال غير موجود"}), 404

    lecture_id = row["lecture_id"]
    cur.execute("DELETE FROM questions WHERE id=?", (q_id,))
    conn.commit()
    conn.close()

    if lecture_id:
        try:
            docx_service.rebuild_lecture_word_document(lecture_id)
        except Exception as we:
            print(f"Docx rebuild error on question delete: {we}")

    return jsonify({"success": True, "deleted_id": q_id, "lecture_id": lecture_id})

@app.route("/api/question/<int:q_id>/answer", methods=["POST"])
def submit_question_answer(q_id):
    selected_option = (request.json.get("option") or "").strip().upper()
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM questions WHERE id=?", (q_id,))
    q = cur.fetchone()
    if not q:
        conn.close()
        return jsonify({"error": "Question not found"}), 404

    is_correct = (selected_option == q['correct_option'].strip().upper())
    now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    cur.execute('''
    UPDATE questions
    SET times_attempted = times_attempted + 1,
        times_correct = times_correct + ?,
        last_answer_correct = ?,
        last_answered_at = ?,
        user_selected_option = ?
    WHERE id = ?
    ''', (1 if is_correct else 0, 1 if is_correct else 0, now_str, selected_option, q_id))
    conn.commit()
    conn.close()

    return jsonify({
        "is_correct": is_correct,
        "selected_option": selected_option,
        "correct_option": q['correct_option'],
        "explanation": q['explanation'],
        "explanation_arabic": q['explanation_arabic'],
        "lecture_evidence": q['lecture_evidence'] if 'lecture_evidence' in q.keys() else ""
    })

@app.route("/api/question/<int:q_id>/reset_answer", methods=["POST"])
def reset_single_question_answer(q_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE questions
        SET user_selected_option = '',
            last_answer_correct = NULL,
            last_answered_at = '',
            times_attempted = 0,
            times_correct = 0
        WHERE id = ?
    """, (q_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "question_id": q_id})

@app.route("/api/lecture/<int:lec_id>/reset_answers", methods=["POST"])
def reset_lecture_batch_answers(lec_id):
    data = request.json or {}
    batch_number = data.get("batch_number")
    conn = database.get_connection()
    cur = conn.cursor()
    if batch_number is not None and str(batch_number).lower() != "all":
        cur.execute("""
            UPDATE questions
            SET user_selected_option = '',
                last_answer_correct = NULL,
                last_answered_at = '',
                times_attempted = 0,
                times_correct = 0
            WHERE lecture_id = ? AND batch_number = ?
        """, (lec_id, int(batch_number)))
    else:
        cur.execute("""
            UPDATE questions
            SET user_selected_option = '',
                last_answer_correct = NULL,
                last_answered_at = '',
                times_attempted = 0,
                times_correct = 0
            WHERE lecture_id = ?
        """, (lec_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "lecture_id": lec_id, "batch_number": batch_number})

@app.route("/api/question/<int:q_id>/bookmark", methods=["POST"])
def toggle_question_bookmark(q_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE questions SET is_bookmarked = 1 - is_bookmarked WHERE id=?", (q_id,))
    conn.commit()
    cur.execute("SELECT is_bookmarked FROM questions WHERE id=?", (q_id,))
    val = cur.fetchone()[0]
    conn.close()
    return jsonify({"is_bookmarked": val})

@app.route("/api/lecture/<int:lec_id>/flashcards_summary", methods=["GET"])
def lecture_flashcards_summary_route(lec_id):
    """Returns the count of existing flashcards for this lecture."""
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM flashcards WHERE lecture_id=?", (lec_id,))
    cnt = cur.fetchone()[0]
    conn.close()
    return jsonify({"total_cards": cnt})

@app.route("/api/lecture/<int:lec_id>/flashcards", methods=["DELETE"])
def delete_lecture_flashcards_route(lec_id):
    """Deletes all flashcards for this specific lecture."""
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM flashcards WHERE lecture_id=?", (lec_id,))
    cnt = cur.fetchone()[0]
    cur.execute("DELETE FROM flashcards WHERE lecture_id=?", (lec_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "deleted_count": cnt})

# ----------------- FLASHCARDS & SRS -----------------
@app.route("/api/lecture/<int:lec_id>/generate_exhaustive_flashcards", methods=["POST"])
def generate_exhaustive_flashcards_route(lec_id):
    req_data = request.json or {}
    raw_count = req_data.get("count", 25)
    mode = req_data.get("mode", "replace")  # 'replace' (default) or 'append'
    try:
        count = max(5, min(int(raw_count), 75))
    except:
        count = 25

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found"}), 404

    # If replace mode: wipe previous cards for this lecture
    if mode == "replace":
        cur.execute("DELETE FROM flashcards WHERE lecture_id=?", (lec_id,))
        conn.commit()

    extracted_text = lec['extracted_text']
    if not extracted_text and lec['file_path'] and os.path.exists(lec['file_path']):
        extracted_text = pdf_service.extract_pdf_text(lec['file_path'])
        cur.execute("UPDATE lectures SET extracted_text=? WHERE id=?", (extracted_text, lec_id))
        conn.commit()

    if not extracted_text:
        extracted_text = f"Lecture: {lec['title']}, Subject: {lec['subject']}"

    # Fetch existing questions so flashcards avoid repeating what questions test
    cur.execute("SELECT question_text FROM questions WHERE lecture_id=? ORDER BY id DESC LIMIT 50", (lec_id,))
    q_rows = cur.fetchall()
    existing_questions_summary = "\n".join([f"- {r['question_text']}" for r in q_rows]) if q_rows else ""

    # Fetch existing flashcards (if in append mode, or remaining) to prevent any duplication
    cur.execute("SELECT front, back FROM flashcards WHERE lecture_id=? ORDER BY id DESC LIMIT 60", (lec_id,))
    fc_rows = cur.fetchall()
    existing_flashcards_summary = "\n".join([f"- {r['front']} → {r['back']}" for r in fc_rows]) if fc_rows else ""

    try:
        cards = gemini_service.generate_exhaustive_flashcards(
            lec['title'], extracted_text, count=count,
            existing_questions_summary=existing_questions_summary,
            existing_flashcards_summary=existing_flashcards_summary
        )
        saved = 0
        for c in cards:
            cur.execute('''
            INSERT INTO flashcards (block_id, lecture_id, front, back, subdeck, due_date)
            VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                lec['block_id'], lec_id, c.get("front", ""), c.get("back", ""),
                "", date.today().isoformat()
            ))
            saved += 1
        conn.commit()
        conn.close()
        return jsonify({"success": True, "cards_generated": saved, "cards": cards, "mode": mode})
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/api/flashcards/add", methods=["POST"])
def add_custom_flashcard():
    """Allows user to manually create custom active-recall flashcards."""
    data = request.json or {}
    front = data.get("front", "").strip()
    back = data.get("back", "").strip()
    if not front or not back:
        return jsonify({"error": "يرجى كتابة السؤال (وجه البطاقة) والإجابة (خلفية البطاقة)"}), 400

    lecture_id = data.get("lecture_id")
    try:
        lecture_id = int(lecture_id) if lecture_id else None
    except:
        lecture_id = None

    block_id = data.get("block_id")
    try:
        block_id = int(block_id) if block_id else 1
    except:
        block_id = 1

    subdeck = data.get("subdeck", "").strip()

    conn = database.get_connection()
    cur = conn.cursor()

    if lecture_id:
        cur.execute("SELECT subject, block_id FROM lectures WHERE id=?", (lecture_id,))
        lec = cur.fetchone()
        if lec:
            if not subdeck:
                subdeck = lec['subject']
            if not data.get("block_id"):
                block_id = lec['block_id']

    if not subdeck:
        subdeck = "بطاقة مخصصة"

    cur.execute('''
    INSERT INTO flashcards (block_id, lecture_id, front, back, subdeck, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', (block_id, lecture_id, front, back, subdeck, date.today().isoformat()))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()

    return jsonify({
        "success": True,
        "id": new_id,
        "front": front,
        "back": back,
        "subdeck": subdeck,
        "lecture_id": lecture_id
    })

@app.route("/api/flashcards", methods=["GET"])
def get_flashcards():
    block_id = request.args.get("block_id")
    lecture_id = request.args.get("lecture_id")
    subject = request.args.get("subject")
    only_due = request.args.get("only_due") == "true"

    conn = database.get_connection()
    cur = conn.cursor()

    if not block_id:
        cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
        row = cur.fetchone()
        block_id = int(row['value']) if row else 1

    only_mistakes = request.args.get("only_mistakes") == "true"

    query = """
    SELECT f.*, l.title as lecture_title, l.subject as lecture_subject, l.lecture_number 
    FROM flashcards f 
    LEFT JOIN lectures l ON f.lecture_id = l.id 
    WHERE f.block_id=?
    """
    params = [block_id]

    if subject and subject != "all":
        query += " AND l.subject=?"
        params.append(subject)

    if lecture_id and lecture_id != "all":
        query += " AND f.lecture_id=?"
        params.append(lecture_id)

    if only_due:
        now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        query += " AND (f.due_date <= ? OR f.due_date = '' OR f.due_date IS NULL)"
        params.append(now_str)

    if only_mistakes:
        query += " AND (f.repetitions = 0 OR f.interval_days <= 1 OR f.interval_minutes <= 10)"

    query += " ORDER BY f.due_date ASC, f.id ASC"
    cur.execute(query, params)
    cards = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify({"flashcards": cards, "total_count": len(cards)})

@app.route("/api/flashcards/tree", methods=["GET"])
def get_flashcards_tree():
    """Returns flashcards grouped hierarchically by Subject -> Lectures with counts."""
    block_id = request.args.get("block_id")
    conn = database.get_connection()
    cur = conn.cursor()

    if not block_id:
        cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
        row = cur.fetchone()
        block_id = int(row['value']) if row else 1

    now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    # Lectures with flashcards
    cur.execute("""
        SELECT l.id, l.title, l.subject, l.lecture_number,
               COUNT(f.id) as total_cards,
               SUM(CASE WHEN (f.due_date <= ? OR f.due_date = '' OR f.due_date IS NULL) THEN 1 ELSE 0 END) as due_cards
        FROM lectures l
        INNER JOIN flashcards f ON f.lecture_id = l.id
        WHERE l.block_id = ?
        GROUP BY l.id, l.title, l.subject, l.lecture_number
        ORDER BY l.subject ASC, l.lecture_number ASC, l.id ASC
    """, (now_str, block_id))
    rows = [dict(r) for r in cur.fetchall()]

    # Unassigned cards
    cur.execute("""
        SELECT COUNT(f.id) as total_cards,
               SUM(CASE WHEN (f.due_date <= ? OR f.due_date = '' OR f.due_date IS NULL) THEN 1 ELSE 0 END) as due_cards
        FROM flashcards f
        WHERE f.block_id = ? AND (f.lecture_id IS NULL OR f.lecture_id = 0)
    """, (now_str, block_id))
    unassigned = dict(cur.fetchone())

    subjects_dict = {}
    for r in rows:
        subj = r['subject'] or 'General'
        if subj not in subjects_dict:
            subjects_dict[subj] = {
                "name": subj,
                "total_cards": 0,
                "due_cards": 0,
                "lectures": []
            }
        t_cards = r['total_cards'] or 0
        d_cards = r['due_cards'] or 0
        subjects_dict[subj]["total_cards"] += t_cards
        subjects_dict[subj]["due_cards"] += d_cards
        subjects_dict[subj]["lectures"].append({
            "id": r['id'],
            "title": r['title'],
            "lecture_number": r['lecture_number'],
            "total_cards": t_cards,
            "due_cards": d_cards
        })

    if unassigned and unassigned.get('total_cards', 0) > 0:
        subjects_dict['بطاقات مخصصة عامة'] = {
            "name": 'بطاقات مخصصة عامة',
            "total_cards": unassigned['total_cards'],
            "due_cards": unassigned.get('due_cards') or 0,
            "lectures": [
                {
                    "id": 0,
                    "title": "بطاقات عامة",
                    "lecture_number": 0,
                    "total_cards": unassigned['total_cards'],
                    "due_cards": unassigned.get('due_cards') or 0
                }
            ]
        }

    conn.close()
    return jsonify({"subjects": list(subjects_dict.values())})

@app.route("/api/flashcard/<int:card_id>", methods=["PUT", "POST"])
def update_flashcard(card_id):
    """Updates an existing flashcard front, back, subdeck."""
    data = request.json or {}
    front = data.get("front", "").strip()
    back = data.get("back", "").strip()
    subdeck = data.get("subdeck", "").strip()
    lecture_id = data.get("lecture_id")

    if not front or not back:
        return jsonify({"error": "يرجى كتابة السؤال والإجابة"}), 400

    conn = database.get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM flashcards WHERE id=?", (card_id,))
    card = cur.fetchone()
    if not card:
        conn.close()
        return jsonify({"error": "البطاقة غير موجودة"}), 404

    update_fields = ["front = ?", "back = ?"]
    params = [front, back]

    if subdeck:
        update_fields.append("subdeck = ?")
        params.append(subdeck)

    if lecture_id is not None:
        try:
            update_fields.append("lecture_id = ?")
            params.append(int(lecture_id) if lecture_id else None)
        except:
            pass

    params.append(card_id)
    cur.execute(f"UPDATE flashcards SET {', '.join(update_fields)} WHERE id=?", params)
    conn.commit()

    cur.execute("""
        SELECT f.*, l.title as lecture_title, l.subject as lecture_subject 
        FROM flashcards f LEFT JOIN lectures l ON f.lecture_id = l.id 
        WHERE f.id=?
    """, (card_id,))
    updated_card = dict(cur.fetchone())
    conn.close()

    return jsonify({"success": True, "flashcard": updated_card})

@app.route("/api/flashcard/<int:card_id>", methods=["DELETE"])
def delete_single_flashcard(card_id):
    """Deletes an individual flashcard."""
    conn = database.get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM flashcards WHERE id=?", (card_id,))
    card = cur.fetchone()
    if not card:
        conn.close()
        return jsonify({"error": "البطاقة غير موجودة"}), 404

    cur.execute("DELETE FROM flashcards WHERE id=?", (card_id,))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "deleted_id": card_id})


ANKI_MODEL_ID = 1607392319
ANKI_MODEL = None

def get_anki_model():
    global ANKI_MODEL
    if ANKI_MODEL is not None:
        return ANKI_MODEL
    if not genanki:
        return None

    ANKI_MODEL = genanki.Model(
        ANKI_MODEL_ID,
        'نذاكر - نموذج البطاقات الطبية',
        fields=[
            {'name': 'Front'},
            {'name': 'Back'},
            {'name': 'Subdeck'},
            {'name': 'Lecture'},
        ],
        templates=[
            {
                'name': 'بطاقة استذكار نذاكر',
                'qfmt': '''
                <div class="nezaker-card">
                    <div class="deck-tag">{{Lecture}} {{#Subdeck}}• {{Subdeck}}{{/Subdeck}}</div>
                    <div class="front-content">{{Front}}</div>
                </div>
                ''',
                'afmt': '''
                <div class="nezaker-card">
                    <div class="deck-tag">{{Lecture}} {{#Subdeck}}• {{Subdeck}}{{/Subdeck}}</div>
                    <div class="front-content">{{Front}}</div>
                    <hr id="answer">
                    <div class="back-content">{{Back}}</div>
                </div>
                ''',
            },
        ],
        css='''
        .card {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: right;
            direction: rtl;
            background-color: #0f172a;
            color: #f8fafc;
            padding: 16px;
        }
        .nezaker-card {
            max-width: 650px;
            margin: 0 auto;
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .deck-tag {
            font-size: 12px;
            font-weight: 700;
            color: #0d9488;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
        }
        .front-content {
            font-size: 20px;
            font-weight: 700;
            line-height: 1.6;
            color: #ffffff;
            margin-bottom: 8px;
        }
        hr#answer {
            border: 0;
            height: 1px;
            background: #334155;
            margin: 20px 0;
        }
        .back-content {
            font-size: 17px;
            line-height: 1.7;
            color: #cbd5e1;
        }
        '''
    )
    return ANKI_MODEL

def make_deck_id(name: str) -> int:
    h = hashlib.sha256(name.encode('utf-8')).hexdigest()
    return int(h[:8], 16)

@app.route("/api/flashcards/export/<fmt>", methods=["GET"])
def export_flashcards(fmt):
    fmt = fmt.lower().strip()
    if fmt not in ["json", "apkg"]:
        return jsonify({"error": "صيغة التصدير غير مدعومة. الصيغ المتاحة هي: json, apkg"}), 400

    block_id = request.args.get("block_id")
    lecture_id = request.args.get("lecture_id")

    conn = database.get_connection()
    cur = conn.cursor()

    if not block_id:
        cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
        row = cur.fetchone()
        block_id = int(row['value']) if row else 1

    cur.execute("SELECT * FROM blocks WHERE id=?", (block_id,))
    block = cur.fetchone()
    block_name = block['name'] if block else f"Module_{block_id}"

    lecture_title = None
    if lecture_id and lecture_id != "all":
        cur.execute("SELECT title FROM lectures WHERE id=?", (lecture_id,))
        lec_row = cur.fetchone()
        if lec_row:
            lecture_title = lec_row['title']

    query = "SELECT f.*, l.title as lecture_title, l.subject FROM flashcards f LEFT JOIN lectures l ON f.lecture_id = l.id WHERE f.block_id=?"
    params = [block_id]

    if lecture_id and lecture_id != "all":
        query += " AND f.lecture_id=?"
        params.append(lecture_id)

    query += " ORDER BY f.lecture_id ASC, f.id ASC"
    cur.execute(query, params)
    cards = [dict(r) for r in cur.fetchall()]
    conn.close()

    if not cards:
        return jsonify({"error": "لا توجد بطاقات محفوظة لتصديرها"}), 404

    # File base name
    if lecture_title:
        clean_title = re.sub(r'[^\w\-_\. ]', '_', lecture_title).strip()
        filename_base = f"نذاكر_{clean_title}"
    else:
        clean_block = re.sub(r'[^\w\-_\. ]', '_', block_name).strip()
        filename_base = f"نذاكر_{clean_block}_كل_البطاقات"

    if fmt == "json":
        export_payload = {
            "platform": "Nezaker - Medical AI Platform",
            "block_id": block_id,
            "block_name": block_name,
            "lecture_title": lecture_title,
            "total_cards": len(cards),
            "exported_at": datetime.now().isoformat(),
            "flashcards": cards
        }
        json_bytes = json.dumps(export_payload, ensure_ascii=False, indent=2).encode('utf-8')
        bio = io.BytesIO(json_bytes)
        bio.seek(0)
        return send_file(
            bio,
            mimetype="application/json; charset=utf-8",
            as_attachment=True,
            download_name=f"{filename_base}.json"
        )

    elif fmt == "apkg":
        if not genanki:
            return jsonify({"error": "مكتبة genanki غير متوفرة على الخادم"}), 500

        model = get_anki_model()
        deck_title = f"نذاكر::{block_name}"
        if lecture_title:
            deck_title += f"::{lecture_title}"

        deck = genanki.Deck(make_deck_id(deck_title), deck_title)

        for c in cards:
            c_lec = c.get('lecture_title') or block_name
            c_subdeck = c.get('subdeck') or 'عام'
            tags = ['Nezaker', re.sub(r'\s+', '_', str(c_lec))]
            if c.get('subject'):
                tags.append(re.sub(r'\s+', '_', str(c['subject'])))

            # Clean newlines to <br> for HTML in Anki
            front_html = (c.get('front') or '').replace('\n', '<br>')
            back_html = (c.get('back') or '').replace('\n', '<br>')

            note = genanki.Note(
                model=model,
                fields=[front_html, back_html, str(c_subdeck), str(c_lec)],
                tags=tags
            )
            deck.add_note(note)

        pkg = genanki.Package(deck)
        temp_fd, temp_path = tempfile.mkstemp(suffix=".apkg")
        os.close(temp_fd)
        try:
            pkg.write_to_file(temp_path)
            with open(temp_path, 'rb') as f:
                apkg_bytes = f.read()
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except:
                    pass

        bio = io.BytesIO(apkg_bytes)
        bio.seek(0)
        return send_file(
            bio,
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name=f"{filename_base}.apkg"
        )

@app.route("/api/flashcard/<int:card_id>/review", methods=["POST"])
@app.route("/api/flashcard/<int:card_id>/review_srs", methods=["POST"])
def review_flashcard(card_id):
    data = request.json or {}
    preset = data.get("preset") # '10m', '1d', '3d', '7d'
    quality = data.get("quality")
    if quality is not None:
        try:
            quality = int(quality)
        except:
            quality = 3

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM flashcards WHERE id=?", (card_id,))
    card = cur.fetchone()
    if not card:
        conn.close()
        return jsonify({"error": "Card not found"}), 404

    reps = card['repetitions'] or 0
    now = datetime.now()

    # Minute-level and day-level scheduling
    if preset == '10m' or quality == 1:
        next_due = now + timedelta(minutes=10)
        interval_days = 0
        interval_minutes = 10
        reps = 0
    elif preset == '1d' or quality == 2:
        next_due = now + timedelta(days=1)
        interval_days = 1
        interval_minutes = 1440
        reps = max(1, reps + 1)
    elif preset == '3d' or quality == 3:
        next_due = now + timedelta(days=3)
        interval_days = 3
        interval_minutes = 3 * 1440
        reps = reps + 1
    elif preset == '7d' or quality == 4 or quality == 5:
        next_due = now + timedelta(days=7)
        interval_days = 7
        interval_minutes = 7 * 1440
        reps = reps + 1
    else:
        next_due = now + timedelta(days=1)
        interval_days = 1
        interval_minutes = 1440

    due_iso = next_due.strftime("%Y-%m-%dT%H:%M:%S")
    reviewed_iso = now.strftime("%Y-%m-%dT%H:%M:%S")

    cur.execute('''
    UPDATE flashcards
    SET interval_days = ?, interval_minutes = ?, repetitions = ?, due_date = ?, last_reviewed = ?
    WHERE id = ?
    ''', (interval_days, interval_minutes, reps, due_iso, reviewed_iso, card_id))
    conn.commit()
    conn.close()
    return jsonify({
        "success": True,
        "next_interval_days": interval_days,
        "next_interval_minutes": interval_minutes,
        "next_due": due_iso
    })

# ----------------- REDO & REVIEW HUB (مركز الإعادة وبنك الأخطاء) -----------------
@app.route("/api/redo/summary", methods=["GET"])
def get_redo_summary():
    block_id = request.args.get("block_id")
    conn = database.get_connection()
    cur = conn.cursor()

    if not block_id:
        cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
        row = cur.fetchone()
        block_id = int(row['value']) if row else 1

    # Mistakes count
    cur.execute('''
    SELECT COUNT(*) FROM questions
    WHERE block_id = ? AND (last_answer_correct = 0 OR (times_attempted > times_correct AND (last_answer_correct IS NULL OR last_answer_correct = 0)))
    ''', (block_id,))
    mistakes_count = cur.fetchone()[0]

    # Due flashcards count
    now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    cur.execute('''
    SELECT COUNT(*) FROM flashcards
    WHERE block_id = ? AND (due_date <= ? OR due_date = '' OR due_date IS NULL)
    ''', (block_id, now_str))
    due_flashcards_count = cur.fetchone()[0]

    # Check next upcoming flashcard in future
    cur.execute('''
    SELECT due_date FROM flashcards
    WHERE block_id = ? AND due_date > ? AND due_date != '' AND due_date IS NOT NULL
    ORDER BY due_date ASC LIMIT 1
    ''', (block_id, now_str))
    next_row = cur.fetchone()
    next_due_seconds = None
    next_due_text = None

    if next_row and next_row['due_date']:
        try:
            raw_due = next_row['due_date'].replace(' ', 'T')
            if 'T' in raw_due:
                parts = raw_due.split('T')
                dt = datetime.fromisoformat(raw_due)
            else:
                dt = datetime.strptime(raw_due, "%Y-%m-%d")
            diff = (dt - datetime.now()).total_seconds()
            if diff > 0:
                next_due_seconds = int(diff)
                next_due_text = dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception as e:
            pass

    conn.close()
    return jsonify({
        "mistakes_count": mistakes_count,
        "due_flashcards_count": due_flashcards_count,
        "total_due_count": mistakes_count + due_flashcards_count,
        "next_due_seconds": next_due_seconds,
        "next_due_text": next_due_text,
        "now": now_str
    })

@app.route("/api/redo/mistakes", methods=["GET"])
def get_redo_mistakes():
    block_id = request.args.get("block_id")
    lecture_id = request.args.get("lecture_id")
    conn = database.get_connection()
    cur = conn.cursor()

    if not block_id:
        cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
        row = cur.fetchone()
        block_id = int(row['value']) if row else 1

    query = '''
    SELECT q.*, l.title as lecture_title, l.subject as lecture_subject, l.lecture_number
    FROM questions q
    JOIN lectures l ON q.lecture_id = l.id
    WHERE q.block_id = ? AND (q.last_answer_correct = 0 OR (q.times_attempted > q.times_correct AND (q.last_answer_correct IS NULL OR q.last_answer_correct = 0)))
    '''
    params = [block_id]

    if lecture_id:
        query += " AND q.lecture_id = ?"
        params.append(lecture_id)

    query += " ORDER BY l.subject ASC, l.lecture_number ASC, q.id ASC"
    cur.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    # Group by lecture
    lectures_map = {}
    for q in rows:
        lid = q['lecture_id']
        if lid not in lectures_map:
            lectures_map[lid] = {
                "lecture_id": lid,
                "lecture_title": q['lecture_title'],
                "lecture_subject": q['lecture_subject'],
                "lecture_number": q['lecture_number'],
                "mistakes_count": 0,
                "questions": []
            }
        lectures_map[lid]["mistakes_count"] += 1
        lectures_map[lid]["questions"].append(q)

    lectures_list = list(lectures_map.values())
    return jsonify({
        "total_mistakes": len(rows),
        "lectures": lectures_list,
        "all_questions": rows
    })

@app.route("/api/redo/flashcards", methods=["GET"])
def get_redo_due_flashcards():
    block_id = request.args.get("block_id")
    lecture_id = request.args.get("lecture_id")
    now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    conn = database.get_connection()
    cur = conn.cursor()

    if not block_id:
        cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
        row = cur.fetchone()
        block_id = int(row['value']) if row else 1

    query = '''
    SELECT f.*, l.title as lecture_title, l.subject as lecture_subject, l.lecture_number
    FROM flashcards f
    LEFT JOIN lectures l ON f.lecture_id = l.id
    WHERE f.block_id = ? AND (f.due_date <= ? OR f.due_date = '' OR f.due_date IS NULL)
    '''
    params = [block_id, now_str]

    if lecture_id and lecture_id != "all":
        query += " AND f.lecture_id = ?"
        params.append(lecture_id)

    query += " ORDER BY f.due_date ASC, f.id ASC"
    cur.execute(query, params)
    cards = [dict(r) for r in cur.fetchall()]

    # Also check next upcoming card (respecting lecture_id if selected)
    next_query = '''
    SELECT f.*, l.title as lecture_title
    FROM flashcards f
    LEFT JOIN lectures l ON f.lecture_id = l.id
    WHERE f.block_id = ? AND f.due_date > ? AND f.due_date != '' AND f.due_date IS NOT NULL
    '''
    next_params = [block_id, now_str]
    if lecture_id and lecture_id != "all":
        next_query += " AND f.lecture_id = ?"
        next_params.append(lecture_id)

    next_query += " ORDER BY f.due_date ASC LIMIT 1"
    cur.execute(next_query, next_params)
    next_row = cur.fetchone()
    next_card = dict(next_row) if next_row else None
    next_due_seconds = None

    if next_card and next_card.get('due_date'):
        try:
            raw_due = next_card['due_date'].replace(' ', 'T')
            dt = datetime.fromisoformat(raw_due) if 'T' in raw_due else datetime.strptime(raw_due, "%Y-%m-%d")
            diff = (dt - datetime.now()).total_seconds()
            if diff > 0:
                next_due_seconds = int(diff)
        except Exception:
            pass

    # Group all due flashcards by lecture to populate the dropdown
    cur.execute('''
    SELECT l.id as lecture_id, l.title as lecture_title, l.subject as lecture_subject, l.lecture_number, COUNT(f.id) as due_count
    FROM flashcards f
    JOIN lectures l ON f.lecture_id = l.id
    WHERE f.block_id = ? AND (f.due_date <= ? OR f.due_date = '' OR f.due_date IS NULL)
    GROUP BY l.id
    ORDER BY l.subject ASC, l.lecture_number ASC
    ''', (block_id, now_str))
    due_lectures = [dict(r) for r in cur.fetchall()]

    conn.close()
    return jsonify({
        "flashcards": cards,
        "total_count": len(cards),
        "lectures": due_lectures,
        "next_card": next_card,
        "next_due_seconds": next_due_seconds,
        "now": now_str
    })

@app.route("/api/redo/question/<int:q_id>/resolve", methods=["POST"])
def resolve_question_mistake(q_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE questions SET last_answer_correct = 1 WHERE id = ?", (q_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "question_id": q_id})

# ----------------- SMART LECTURE REVIEW & TARGETED WEAKNESS HUB -----------------
@app.route("/api/lecture/<int:lec_id>/smart_review/diagnostics", methods=["GET"])
def get_lecture_smart_review_diagnostics(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found"}), 404

    # 1. Mistakes in questions
    cur.execute('''
    SELECT * FROM questions
    WHERE lecture_id=? AND (last_answer_correct=0 OR (times_attempted > times_correct AND (last_answer_correct IS NULL OR last_answer_correct=0)))
    ORDER BY id ASC
    ''', (lec_id,))
    mistakes = [dict(r) for r in cur.fetchall()]

    # 2. Struggling flashcards
    cur.execute('''
    SELECT * FROM flashcards
    WHERE lecture_id=? AND (interval_days <= 1 OR repetitions = 0)
    ORDER BY id ASC
    ''', (lec_id,))
    struggle_cards = [dict(r) for r in cur.fetchall()]

    # 3. All questions count & flashcards count for this lecture
    cur.execute("SELECT COUNT(*) FROM questions WHERE lecture_id=?", (lec_id,))
    total_q_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM flashcards WHERE lecture_id=?", (lec_id,))
    total_fc_count = cur.fetchone()[0]

    # 4. Cached smart review if exists
    cur.execute("SELECT * FROM lecture_smart_reviews WHERE lecture_id=?", (lec_id,))
    cached = cur.fetchone()
    cached_data = None
    if cached:
        cached_data = {
            "weak_points": json.loads(cached['weak_points_json']) if cached['weak_points_json'] else [],
            "weakness_deep_dive_arabic": cached['analysis_ar'],
            "high_yield_summary_arabic": cached['summary_ar'],
            "exam_traps": json.loads(cached['traps_json']) if cached['traps_json'] else [],
            "created_at": cached['created_at']
        }

    conn.close()
    return jsonify({
        "success": True,
        "status": "success",
        "lecture": dict(lec),
        "mistakes": mistakes,
        "mistake_questions": mistakes,
        "mistakes_count": len(mistakes),
        "struggle_cards": struggle_cards,
        "struggling_flashcards_count": len(struggle_cards),
        "struggle_cards_count": len(struggle_cards),
        "total_questions": total_q_count,
        "total_flashcards": total_fc_count,
        "cached_analysis": cached_data,
        "cached_review": cached_data
    })

@app.route("/api/lecture/<int:lec_id>/smart_review/generate_analysis", methods=["POST"])
def generate_lecture_smart_review_analysis(lec_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found", "status": "error"}), 404

    cur.execute('''
    SELECT * FROM questions
    WHERE lecture_id=? AND (last_answer_correct=0 OR (times_attempted > times_correct AND (last_answer_correct IS NULL OR last_answer_correct=0)))
    ''', (lec_id,))
    mistakes = [dict(r) for r in cur.fetchall()]

    cur.execute('''
    SELECT * FROM flashcards
    WHERE lecture_id=? AND (interval_days <= 1 OR repetitions = 0)
    ''', (lec_id,))
    struggle_cards = [dict(r) for r in cur.fetchall()]

    extracted_text = get_lecture_full_text(lec, conn)

    try:
        analysis = gemini_service.generate_smart_lecture_weakness_review(lec['title'], extracted_text, mistakes, struggle_cards)
        
        weak_pts_json = json.dumps(analysis.get("identified_weak_points", []), ensure_ascii=False)
        traps_json = json.dumps(analysis.get("exam_traps_and_pitfalls", []), ensure_ascii=False)
        analysis_ar = analysis.get("weakness_deep_dive_arabic", "")
        summary_ar = analysis.get("high_yield_summary_arabic", "")

        cur.execute('''
        INSERT INTO lecture_smart_reviews (lecture_id, weak_points_json, analysis_ar, summary_ar, traps_json)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(lecture_id) DO UPDATE SET
            weak_points_json=excluded.weak_points_json,
            analysis_ar=excluded.analysis_ar,
            summary_ar=excluded.summary_ar,
            traps_json=excluded.traps_json,
            created_at=CURRENT_TIMESTAMP
        ''', (lec_id, weak_pts_json, analysis_ar, summary_ar, traps_json))
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "status": "success",
            "analysis": analysis,
            "weak_points": analysis.get("identified_weak_points", []),
            "analysis_ar": analysis_ar
        })
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e), "status": "error"}), 500

@app.route("/api/lecture/<int:lec_id>/smart_review/generate_drill_questions", methods=["POST"])
def generate_drill_questions_route(lec_id):
    data = request.json or {}
    count = int(data.get("count", 15))
    weak_concepts = data.get("weak_concepts", [])

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found", "status": "error"}), 404

    extracted_text = get_lecture_full_text(lec, conn)

    try:
        new_questions = gemini_service.generate_weakness_targeted_questions(lec['title'], extracted_text, weak_concepts, count=count)

        cur.execute("SELECT COALESCE(MAX(batch_number), 0) + 1 FROM questions WHERE lecture_id=?", (lec_id,))
        next_batch = cur.fetchone()[0]

        saved_count = 0
        for q in new_questions:
            cur.execute('''
            INSERT INTO questions (
                block_id, lecture_id, question_type, case_scenario,
                question_text, option_a, option_b, option_c, option_d,
                correct_option, explanation, explanation_arabic, difficulty,
                source, batch_number, batch_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ai_generated', ?, 'Smart Weakness Drill')
            ''', (
                lec['block_id'], lec_id, q.get('question_type', 'mcq'), q.get('case_scenario', ''),
                q.get('question_text', ''), q.get('option_a', ''), q.get('option_b', ''),
                q.get('option_c', ''), q.get('option_d', ''), q.get('correct_option', 'A'),
                q.get('explanation', ''), q.get('explanation_arabic', ''), q.get('difficulty', 'medium'),
                next_batch
            ))
            saved_count += 1

        conn.commit()

        # Append to Word file
        try:
            docx_service.append_questions_to_word(
                lecture_id=lec_id,
                lecture_number=lec['lecture_number'],
                lecture_title=lec['title'],
                questions=new_questions,
                batch_number=next_batch,
                batch_name="Smart Weakness Drill (أسئلة تثبيت نقاط الضعف)"
            )
        except Exception as we:
            print("Word append error:", we)

        conn.close()
        return jsonify({
            "success": True,
            "status": "success",
            "saved_count": saved_count,
            "batch_number": next_batch,
            "questions": new_questions
        })
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e), "status": "error"}), 500

@app.route("/api/lecture/<int:lec_id>/smart_review/generate_weakness_cards", methods=["POST"])
def generate_weakness_cards_route(lec_id):
    data = request.json or {}
    count = int(data.get("count", 15))
    weak_concepts = data.get("weak_concepts", [])

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found"}), 404

    try:
        new_cards = gemini_service.generate_weakness_targeted_flashcards(lec['title'], weak_concepts, count=count)
        now_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

        saved_count = 0
        for c in new_cards:
            cur.execute('''
            INSERT INTO flashcards (block_id, lecture_id, front, back, subdeck, due_date)
            VALUES (?, ?, ?, ?, ?, ?)
            ''', (lec['block_id'], lec_id, c.get('front', ''), c.get('back', ''), 'Weakness Retention 🎯', now_str))
            saved_count += 1

        conn.commit()
        conn.close()
        return jsonify({
            "success": True,
            "saved_count": saved_count,
            "cards": new_cards
        })
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/api/lecture/<int:lec_id>/smart_review/generate_mock_exam", methods=["POST"])
def generate_mock_exam_route(lec_id):
    data = request.json or {}
    mcq_count = int(data.get("mcq_count", 35))
    essay_count = int(data.get("essay_count", 10))
    weak_concepts = data.get("weak_concepts", [])

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lec_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "Lecture not found"}), 404

    # Fetch past mistakes
    cur.execute('''
    SELECT * FROM questions
    WHERE lecture_id=? AND (last_answer_correct=0 OR (times_attempted > times_correct AND (last_answer_correct IS NULL OR last_answer_correct=0)))
    LIMIT 15
    ''', (lec_id,))
    past_mistakes = [dict(r) for r in cur.fetchall()]
    extracted_text = get_lecture_full_text(lec, conn)
    conn.close()

    try:
        mock = gemini_service.generate_lecture_mock_exam(
            lec['title'], extracted_text, mcq_count=mcq_count, essay_count=essay_count, weak_concepts=weak_concepts
        )

        mcqs = mock.get("mcq_questions", [])
        
        # Prepend past mistakes so student definitely sees what they failed before
        for pm in past_mistakes:
            mcqs.insert(0, {
                "question_type": pm.get("question_type", "mcq"),
                "case_scenario": pm.get("case_scenario", ""),
                "question_text": "⭐ [سؤال أخطأت فيه سابقاً] " + pm.get("question_text", ""),
                "option_a": pm.get("option_a", ""),
                "option_b": pm.get("option_b", ""),
                "option_c": pm.get("option_c", ""),
                "option_d": pm.get("option_d", ""),
                "correct_option": pm.get("correct_option", "A"),
                "explanation_arabic": pm.get("explanation_arabic") or pm.get("explanation", "")
            })

        return jsonify({
            "success": True,
            "lecture_title": lec['title'],
            "mcq_questions": mcqs,
            "essay_questions": mock.get("essay_questions", []),
            "total_mcqs": len(mcqs),
            "total_essays": len(mock.get("essay_questions", []))
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/lecture/<int:lec_id>/smart_review/export_mock_word", methods=["POST"])
def export_mock_exam_word(lec_id):
    data = request.json or {}
    mcqs = data.get("mcq_questions", [])
    essays = data.get("essay_questions", [])
    title = data.get("title", "الامتحان الشامل والنهائي للمحاضرة")

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT title FROM lectures WHERE id=?", (lec_id,))
    row = cur.fetchone()
    lec_title = row['title'] if row else f"محاضرة {lec_id}"
    conn.close()

    try:
        file_path = docx_service.export_comprehensive_mock_exam_docx(
            title=title, mcq_questions=mcqs, essay_questions=essays, lecture_title=lec_title
        )
        docx_service.open_word_document(file_path)
        return jsonify({"success": True, "file_path": file_path, "filename": os.path.basename(file_path)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- CALENDAR & PLANNER V2 -----------------
@app.route("/api/calendar", methods=["GET"])
def get_calendar():
    block_id = request.args.get("block_id")
    conn = database.get_connection()
    cur = conn.cursor()

    if not block_id:
        cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
        row = cur.fetchone()
        block_id = int(row['value']) if row else 1

    cur.execute("SELECT id, name, code, start_date, duration_weeks FROM blocks WHERE id=?", (block_id,))
    block_row = cur.fetchone()
    block_info = dict(block_row) if block_row else {}

    cur.execute('''
    SELECT st.*, l.title as lecture_title, l.subject as lecture_subject
    FROM study_tasks st
    LEFT JOIN lectures l ON st.lecture_id = l.id
    WHERE st.block_id = ?
    ORDER BY st.plan_date ASC, st.id ASC
    ''', (block_id,))
    tasks = [dict(r) for r in cur.fetchall()]
    conn.close()

    cfg = scheduler_service.get_schedule_config(block_id)
    return jsonify({"tasks": tasks, "block": block_info, "schedule_config": cfg})

@app.route("/api/calendar/generate_v2", methods=["POST"])
def generate_calendar_v2():
    data = request.json or {}
    block_id = int(data.get("block_id", 1))
    duration_weeks = int(data.get("duration_weeks", 5))
    off_days_weekdays = data.get("off_days_weekdays", [4]) # e.g. [4] for Friday
    off_dates = data.get("off_dates", [])
    force_study_dates = data.get("force_study_dates", [])
    start_date = data.get("start_date", date.today().isoformat())

    res = scheduler_service.generate_balanced_schedule(
        block_id=block_id,
        start_date_str=start_date,
        duration_weeks=duration_weeks,
        off_days_weekdays=off_days_weekdays,
        off_dates=off_dates,
        force_study_dates=force_study_dates
    )
    return jsonify(res)

# ----------------- SMART SYLLABUS & SCHEDULE IMPORT -----------------
@app.route("/api/schedule/parse_schedule", methods=["POST"])
def parse_schedule_route():
    import syllabus_schedule_service
    file_path = None
    schedule_text = ""

    if 'file' in request.files:
        f = request.files['file']
        if f and f.filename:
            scratch_dir = os.path.join(BASE_DIR, "scratch_uploads")
            os.makedirs(scratch_dir, exist_ok=True)
            safe_name = f"schedule_{int(datetime.now().timestamp())}_{re.sub(r'[^a-zA-Z0-9_.-]', '_', f.filename)}"
            file_path = os.path.join(scratch_dir, safe_name)
            f.save(file_path)

    if request.is_json:
        data = request.get_json(silent=True) or {}
        schedule_text = data.get("schedule_text", "").strip()
    else:
        schedule_text = (request.form.get("schedule_text") or "").strip()

    if not file_path and not schedule_text:
        return jsonify({"error": "يرجى رفع ملف الجدول أو لصق نص الجدول"}), 400

    try:
        res = syllabus_schedule_service.parse_schedule_input(file_path=file_path, raw_text=schedule_text)
        return jsonify({"success": True, "data": res})
    except Exception as e:
        return jsonify({"error": f"فشل تحليل وقراءة الجدول: {str(e)}"}), 500

@app.route("/api/schedule/preset_minia_neu312", methods=["GET"])
def get_preset_minia_neu312():
    try:
        import minia_schedule_data
        import syllabus_schedule_service
        cleaned_lectures = syllabus_schedule_service.clean_and_split_syllabus_lectures(minia_schedule_data.minia_neu312_lectures)
        return jsonify({
            "success": True,
            "block_name_detected": "Neuroscience (NEU-312) - كلية الطب جامعة المنيا",
            "start_date": "2026-09-20",
            "duration_weeks": 7,
            "lectures": cleaned_lectures,
            "total_lectures_detected": len(cleaned_lectures)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/schedule/apply_custom_plan", methods=["POST"])
def apply_custom_plan_route():
    import syllabus_schedule_service
    data = request.json or {}
    block_id = int(data.get("block_id", 1))
    lectures_data = data.get("lectures", [])
    start_date = data.get("start_date") or date.today().isoformat()
    duration_weeks = int(data.get("duration_weeks", 5))
    end_date = data.get("end_date")
    off_days_weekdays = data.get("off_days_weekdays", [4])
    off_dates = data.get("off_dates", [])
    include_first_review = bool(data.get("include_first_review", True))
    include_second_review = bool(data.get("include_second_review", True))
    include_final_drill = bool(data.get("include_final_drill", True))
    replace_existing = bool(data.get("replace_existing_lectures", False))

    if not lectures_data:
        return jsonify({"error": "قائمة المحاضرات فارغة، يرجى استخراج المحاضرات أولاً"}), 400

    try:
        res = syllabus_schedule_service.apply_custom_syllabus_schedule(
            block_id=block_id,
            lectures_data=lectures_data,
            start_date_str=start_date,
            duration_weeks=duration_weeks,
            end_date_str=end_date,
            off_days_weekdays=off_days_weekdays,
            off_dates=off_dates,
            include_first_review=include_first_review,
            include_second_review=include_second_review,
            include_final_drill=include_final_drill,
            replace_existing_lectures=replace_existing
        )
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": f"فشل تطبيق واعتماد الجدول: {str(e)}"}), 500

@app.route("/api/schedule/rebalance_adaptive", methods=["POST"])
def rebalance_adaptive_route():
    import syllabus_schedule_service
    data = request.json or {}
    task_id = int(data.get("task_id", 0))
    block_id = int(data.get("block_id", 1))
    if not task_id:
        return jsonify({"error": "Task ID required"}), 400

    try:
        res = syllabus_schedule_service.adaptive_rebalance_after_task_completion(block_id, task_id)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": f"فشل إعادة توزيع الجدول: {str(e)}"}), 500

@app.route("/api/calendar/toggle_day_off", methods=["POST"])
def toggle_calendar_day_off():
    data = request.json or {}
    block_id = int(data.get("block_id", 1))
    date_str = data.get("date")
    make_off = bool(data.get("is_off", True))
    if not date_str:
        return jsonify({"error": "Date required"}), 400

    res = scheduler_service.toggle_day_off(block_id, date_str, make_off)
    return jsonify(res)

@app.route("/api/calendar/reschedule_task", methods=["POST"])
def reschedule_task():
    task_id = request.json.get("task_id")
    new_date = request.json.get("new_date")
    if not task_id or not new_date:
        return jsonify({"error": "Missing params"}), 400
    scheduler_service.update_task_date(task_id, new_date)
    return jsonify({"success": True})

@app.route("/api/todos", methods=["GET"])
def get_todos():
    block_id = request.args.get("block_id")
    if not block_id:
        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
        row = cur.fetchone()
        block_id = int(row['value']) if row else 1
        conn.close()
    else:
        block_id = int(block_id)

    tasks = scheduler_service.get_today_tasks(block_id)
    return jsonify({"today_tasks": tasks})

@app.route("/api/todos/<int:task_id>/toggle", methods=["POST"])
def toggle_todo(task_id):
    completed = request.json.get("is_completed", True)
    scheduler_service.toggle_task_status(task_id, completed)
    return jsonify({"success": True})

@app.route("/api/todos/custom", methods=["POST"])
def add_custom_todo():
    data = request.json or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title required"}), 400
    block_id = int(data.get("block_id", 1))
    target_date = data.get("plan_date", date.today().isoformat())
    description = data.get("description", "مهمة شخصية مضافة")

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute('''
    INSERT INTO study_tasks (block_id, plan_date, task_type, title, description)
    VALUES (?, ?, 'custom_task', ?, ?)
    ''', (block_id, target_date, f"📌 {title}", description))
    new_id = cur.lastrowid
    conn.commit()
    conn.close()
    return jsonify({"success": True, "id": new_id})

# ----------------- STUDY SESSIONS & HOME PAGE API -----------------
@app.route("/api/study_sessions", methods=["GET"])
def get_study_sessions():
    block_id = request.args.get("block_id")
    filter_mode = request.args.get("filter", "all") # all, today, upcoming, completed

    conn = database.get_connection()
    cur = conn.cursor()

    if not block_id:
        cur.execute("SELECT value FROM settings WHERE key='active_block_id'")
        row = cur.fetchone()
        block_id = int(row['value']) if row else 1
    else:
        try:
            block_id = int(block_id)
        except:
            block_id = 1

    # 1. Fetch block info
    cur.execute("SELECT * FROM blocks WHERE id=?", (block_id,))
    block_row = cur.fetchone()
    block_info = dict(block_row) if block_row else {}

    # 2. Fetch all study tasks/sessions with lecture metadata
    cur.execute('''
    SELECT st.*, 
           l.title as lecture_title, 
           l.subject as lecture_subject,
           l.page_count as lecture_pages,
           l.is_studied as lecture_is_studied
    FROM study_tasks st
    LEFT JOIN lectures l ON st.lecture_id = l.id
    WHERE st.block_id = ?
    ORDER BY st.plan_date ASC, st.id ASC
    ''', (block_id,))
    all_sessions = [dict(r) for r in cur.fetchall()]

    today_str = date.today().isoformat()

    # Metrics calculation
    total_sessions = len(all_sessions)
    completed_sessions = [s for s in all_sessions if s.get('is_completed')]
    today_sessions = [s for s in all_sessions if s.get('plan_date') == today_str or (s.get('plan_date', '') < today_str and not s.get('is_completed'))]
    upcoming_sessions = [s for s in all_sessions if s.get('plan_date', '') > today_str and not s.get('is_completed')]

    cur.execute("SELECT COUNT(*) FROM lectures WHERE block_id=?", (block_id,))
    total_lectures = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM lectures WHERE block_id=? AND is_studied=1", (block_id,))
    studied_lectures = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM questions WHERE block_id=?", (block_id,))
    total_questions = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM flashcards WHERE block_id=?", (block_id,))
    total_flashcards = cur.fetchone()[0]

    conn.close()

    metrics = {
        "total_sessions": total_sessions,
        "completed_count": len(completed_sessions),
        "pending_today_count": len([s for s in today_sessions if not s.get('is_completed')]),
        "upcoming_count": len(upcoming_sessions),
        "total_lectures": total_lectures,
        "studied_lectures": studied_lectures,
        "total_questions": total_questions,
        "total_flashcards": total_flashcards,
        "completion_rate": round((len(completed_sessions) / total_sessions * 100), 1) if total_sessions > 0 else 0
    }

    if filter_mode == "today":
        displayed = today_sessions
    elif filter_mode == "upcoming":
        displayed = upcoming_sessions
    elif filter_mode == "completed":
        displayed = completed_sessions
    else:
        displayed = all_sessions

    return jsonify({
        "success": True,
        "block": block_info,
        "metrics": metrics,
        "sessions": displayed,
        "all_sessions_count": total_sessions
    })

@app.route("/api/study_sessions/create", methods=["POST"])
def create_study_session():
    data = request.json or {}
    block_id = int(data.get("block_id", 1))
    lecture_id = data.get("lecture_id")
    if lecture_id:
        try:
            lecture_id = int(lecture_id)
        except:
            lecture_id = None

    plan_date = data.get("plan_date", date.today().isoformat())
    task_type = data.get("task_type", "first_study")
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    target_questions = int(data.get("target_questions", 0))
    target_cards = int(data.get("target_cards", 0))

    if not title and lecture_id:
        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT title FROM lectures WHERE id=?", (lecture_id,))
        lec_row = cur.fetchone()
        conn.close()
        lec_title = lec_row['title'] if lec_row else f"محاضرة {lecture_id}"
        if task_type == "first_study":
            title = f"مذاكرة أولى: {lec_title}"
        elif task_type == "spaced_review_quiz":
            title = f"كويز مراجعة: {lec_title}"
        elif task_type == "spaced_review_cards":
            title = f"مراجعة بطاقات: {lec_title}"
        elif task_type == "audio_review":
            title = f"تفريغ صوتي: {lec_title}"
        else:
            title = f"جلسة مذاكرة: {lec_title}"

    if not title:
        title = "جلسة مذاكرة جديدة"

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute('''
    INSERT INTO study_tasks (block_id, lecture_id, plan_date, task_type, title, description, target_questions, target_cards)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (block_id, lecture_id, plan_date, task_type, title, description, target_questions, target_cards))
    new_id = cur.lastrowid
    conn.commit()
    conn.close()
    return jsonify({"success": True, "id": new_id})

@app.route("/api/study_sessions/<int:task_id>/delete", methods=["POST", "DELETE"])
def delete_study_session(task_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM study_tasks WHERE id=?", (task_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/system/reset_all", methods=["POST"])
def reset_all_data():
    conn = database.get_connection()
    cur = conn.cursor()
    tables = [
        'questions', 'audio_notes', 'lectures', 'flashcards',
        'study_tasks', 'exam_extracted_questions', 'exam_pdf_cache',
        'lecture_smart_reviews'
    ]
    for tbl in tables:
        cur.execute(f"DELETE FROM {tbl}")
        try:
            cur.execute("DELETE FROM sqlite_sequence WHERE name=?", (tbl,))
        except Exception:
            pass
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "تم تصفير جميع المحاضرات والأسئلة والتفريغات والبطاقات بنجاح"})

# ----------------- PAST EXAM PAPERS FILTER V2 (PDF, DOCX, TEXT) -----------------
@app.route("/api/past_papers/match", methods=["POST"])
def match_past_papers():
    block_id = int(request.form.get("block_id", 1))
    text_content = request.form.get("content", "")

    # Check for file upload
    file = request.files.get("file")
    if file:
        upload_dir = os.path.join(BASE_DIR, "scratch_uploads")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        file.save(file_path)
        extracted = pdf_service.extract_document_text(file_path)
        text_content += "\n" + extracted

    if not text_content.strip():
        return jsonify({"error": "No text or file provided"}), 400

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, title, subject FROM lectures WHERE block_id=?", (block_id,))
    lectures = [dict(r) for r in cur.fetchall()]
    conn.close()

    try:
        matched_qs = gemini_service.match_past_questions_with_syllabus(text_content, lectures)
        return jsonify({"success": True, "matched_questions": matched_qs})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/past_papers/approve_and_save", methods=["POST"])
def approve_past_questions():
    questions = request.json.get("approved_questions", [])
    block_id = int(request.json.get("block_id", 1))

    conn = database.get_connection()
    cur = conn.cursor()

    saved_by_lecture = {}
    lecture_batch_map = {}

    for q in questions:
        lec_id = q.get("lecture_id")
        if not lec_id:
            continue

        src_file = (q.get("source_file") or q.get("source_filename") or "امتحانات سابقة").strip()
        current_batch_name = f"فلترة: {src_file}"

        batch_key = (lec_id, current_batch_name)
        if batch_key not in lecture_batch_map:
            cur.execute("SELECT COALESCE(MAX(batch_number), 0) FROM questions WHERE lecture_id=?", (lec_id,))
            max_b = cur.fetchone()[0] or 0
            lecture_batch_map[batch_key] = max_b + 1

        assigned_batch = lecture_batch_map[batch_key]

        cur.execute('''
        INSERT INTO questions (
            block_id, lecture_id, question_type, question_text,
            option_a, option_b, option_c, option_d, correct_option,
            explanation_arabic, source, source_file, batch_number, batch_name
        ) VALUES (?, ?, 'mcq', ?, ?, ?, ?, ?, ?, ?, 'past_paper', ?, ?, ?)
        ''', (
            block_id, lec_id, q.get("question_text", ""),
            q.get("option_a", ""), q.get("option_b", ""), q.get("option_c", ""), q.get("option_d", ""),
            str(q.get("correct_option", "A")).upper()[:1], q.get("explanation", ""),
            src_file, assigned_batch, current_batch_name
        ))

        if lec_id not in saved_by_lecture:
            saved_by_lecture[lec_id] = []
        saved_by_lecture[lec_id].append(q)

    conn.commit()
    conn.close()

    # Rebuild Word doc for each affected lecture
    for lec_id in saved_by_lecture.keys():
        try:
            docx_service.rebuild_lecture_word_document(lec_id)
        except Exception as we:
            print(f"Error updating docx for lecture {lec_id}: {we}")

    return jsonify({"success": True, "saved_count": len(questions)})

# ----------------- AUDIO TRANSCRIPTION & DOCTOR DELTA -----------------
@app.route("/api/audio/notes", methods=["GET"])
def get_audio_notes():
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM audio_notes ORDER BY id DESC")
    notes = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify({"notes": notes})

@app.route("/api/audio/stream/<filename>", methods=["GET"])
def stream_audio(filename):
    """Streams local audio files to the in-app player."""
    desktop_path = os.path.join(os.path.expanduser("~"), "Desktop", filename)
    if os.path.exists(desktop_path):
        return send_file(desktop_path)
    
    # Also check local uploads
    local_path = os.path.join(BASE_DIR, "static", "audio_uploads", filename)
    if os.path.exists(local_path):
        return send_file(local_path)

    return jsonify({"error": "Audio file not found"}), 404

@app.route("/api/audio/upload_and_transcribe", methods=["POST"])
def upload_and_transcribe_audio():
    """Handles audio file upload from the user, saves it, and transcribes it with timestamps."""
    file = request.files.get("file") or request.files.get("audio")
    if not file or not file.filename:
        return jsonify({"error": "No audio file provided"}), 400

    upload_dir = os.path.join(BASE_DIR, "static", "audio_uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    safe_filename = re.sub(r'[^\w\-_\.]', '_', file.filename)
    saved_path = os.path.join(upload_dir, safe_filename)
    file.save(saved_path)

    try:
        res = gemini_service.transcribe_with_timestamps(saved_path)
        content = res["transcript_with_timestamps"]

        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute('''
        INSERT INTO audio_notes (block_id, title, audio_filename, audio_path, transcript, timestamps_transcript)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (1, f"تسجيل: {file.filename}", safe_filename, saved_path, content, content))
        new_id = cur.lastrowid
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "id": new_id,
            "content": content,
            "audio_url": f"/api/audio/stream/{safe_filename}",
            "filename": file.filename
        })
    except Exception as e:
        return jsonify({"error": f"Transcription error: {str(e)}"}), 500


@app.route("/api/audio/transcribe_anas_timestamps", methods=["POST"])
def transcribe_anas_timestamps():
    anas_path = r"C:\Users\shawk\Desktop\anas.ogg"
    if not os.path.exists(anas_path):
        return jsonify({"error": "File anas.ogg not found"}), 404

    force = False
    if request.is_json:
        force = bool(request.json.get("force", False))

    # Check database cache first for instant loading
    conn = database.get_connection()
    cur = conn.cursor()
    if not force:
        cur.execute("SELECT * FROM audio_notes WHERE audio_filename='anas.ogg' AND LENGTH(timestamps_transcript) > 50 ORDER BY id DESC LIMIT 1")
        cached = cur.fetchone()
        if cached:
            cached_dict = dict(cached)
            conn.close()
            return jsonify({
                "success": True,
                "id": cached_dict["id"],
                "content": cached_dict["timestamps_transcript"],
                "audio_url": "/api/audio/stream/anas.ogg"
            })

    try:
        res = gemini_service.transcribe_with_timestamps(anas_path)
        content = res["transcript_with_timestamps"]
        content = gemini_service.sanitize_transcript_english_terms(content)

        cur.execute('''
        INSERT INTO audio_notes (block_id, title, audio_filename, audio_path, transcript, timestamps_transcript)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (1, "تفريغ ريكورد أنس (مع التايم كود)", "anas.ogg", anas_path, content, content))
        new_id = cur.lastrowid
        conn.commit()
        conn.close()

        return jsonify({"success": True, "id": new_id, "content": content, "audio_url": "/api/audio/stream/anas.ogg"})
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/api/audio/<int:audio_id>/sanitize_english", methods=["POST"])
def sanitize_audio_note_english(audio_id):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM audio_notes WHERE id=?", (audio_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Audio note not found"}), 404

    text = row['timestamps_transcript'] or row['transcript'] or ""
    if not text:
        conn.close()
        return jsonify({"error": "No transcript text to sanitize"}), 400

    try:
        sanitized = gemini_service.sanitize_transcript_english_terms(text)
        cur.execute("UPDATE audio_notes SET timestamps_transcript=?, transcript=? WHERE id=?", (sanitized, sanitized, audio_id))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "content": sanitized})
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/api/audio/sanitize_text", methods=["POST"])
def sanitize_audio_text_route():
    data = request.json or {}
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400
    try:
        sanitized = gemini_service.sanitize_transcript_english_terms(text)
        return jsonify({"success": True, "content": sanitized})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/audio/compare_doctor_delta", methods=["POST"])
def compare_doctor_delta_route():
    audio_id = request.json.get("audio_id")
    lecture_id = request.json.get("lecture_id")

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT transcript, timestamps_transcript FROM audio_notes WHERE id=?", (audio_id,))
    audio_row = cur.fetchone()
    
    cur.execute("SELECT title, extracted_text, file_path FROM lectures WHERE id=?", (lecture_id,))
    lec_row = cur.fetchone()

    if not audio_row or not lec_row:
        conn.close()
        return jsonify({"error": "Audio or lecture not found"}), 404

    slides_text = lec_row['extracted_text']
    if not slides_text and lec_row['file_path'] and os.path.exists(lec_row['file_path']):
        slides_text = pdf_service.extract_pdf_text(lec_row['file_path'])

    transcript = audio_row['timestamps_transcript'] or audio_row['transcript']

    try:
        delta_report = gemini_service.compare_audio_with_slides(transcript, slides_text or lec_row['title'])
        cur.execute("UPDATE audio_notes SET doctor_delta=? WHERE id=?", (delta_report, audio_id))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "doctor_delta": delta_report})
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/api/audio/generate_questions_from_excerpt", methods=["POST"])
def generate_questions_from_excerpt():
    """Generates high-yield MCQs and Clinical Cases specifically from a selected excerpt of audio transcript."""
    data = request.json or {}
    excerpt_text = (data.get("excerpt_text") or "").strip()
    lecture_id = data.get("lecture_id")
    count = int(data.get("count", 3))
    question_type = data.get("question_type", "both")

    if not excerpt_text or len(excerpt_text) < 10:
        return jsonify({"error": "يرجى تظليل نص كافٍ من التفريغ الصوتي لتوليد الأسئلة عليه"}), 400

    conn = database.get_connection()
    cur = conn.cursor()
    lec_title = ""
    if lecture_id:
        cur.execute("SELECT title, subject FROM lectures WHERE id=?", (lecture_id,))
        row = cur.fetchone()
        if row:
            lec_title = f"{row['title']} ({row['subject']})"
    conn.close()

    prompt = f"""
أنت بروفيسور وخبير طبي ومسؤول عن وضع أسئلة الامتحانات الجامعية والبورد الطبي.
المطلوب منك ابتكار وتوليد {count} سؤال طبي عالي الدقة مبني خصيصاً على الجزء المقتبس التالي من تفريغ الشرح الصوتي للمحاضرة:

سياق المحاضرة إن وجد: {lec_title}

النص المقتبس والمحدد من الشرح الصوتي:
\"\"\"{excerpt_text}\"\"\"

نوع الأسئلة المطلوب: {question_type} (mcq = أسئلة اختيار من متعدد مباشرة، case = حالات وسيناريوهات سريرية واقعية، both = مزيج متوازن بينهما).

قواعد صارمة جداً (أسلوب المذاكرة الطبية - مكس إنجليزي مع عربي):
1. ⚠️ ممنوع منعاً باتاً تعريب أو ترجمة المصطلحات الطبية والتشريحية إلى العربية:
   - العظام (Bones): لا تكتب "عظمة الراس" أو "عظمة الجبهة"، بل اكتب: Skull bones, Occipital bone, Frontal bone, Temporal bone, Parietal bone, Sphenoid bone, Mandible, Cranium, Calvaria.
   - العضلات (Muscles): لا تكتب "العضلة الماضغة" أو "عضلة الصدرية"، بل اكتب: Sternocleidomastoid, Masseter, Orbicularis Oculi, Trapezius, Buccinator, Temporalis.
   - الأعصاب (Nerves): لا تكتب "العصب الوجهي" مجرداً، بل اكتب: Facial nerve (CN VII), Trigeminal nerve (CN V), Mandibular nerve (V3).
   - الشرايين والأمراض: اكتبها بالإنجليزية الطبية حصراً.
2. الشرح والتعليل (explanation):
   - يجب أن يكون أسلوب الشرح مكس عربي سلس يربط المفاهيم، مع كتابة كافة المصطلحات الطبية والتشريحية حصرياً بالإنجليزية دون أي تعريب أو ترجمة.
   - يوضح سبب صحة الإجابة ولماذا باقي الخيارات خاطئة (مثال: "الخيار A صحيح لأن الـ Sternocleidomastoid muscle بتعمل contralateral rotation of the head وبتتغذى بالـ Spinal accessory nerve (CN XI)...").
3. لكل سؤال 4 خيارات (A, B, C, D) مع تحديد الإجابة الصحيحة بحرف واحد فقط (A أو B أو C أو D).
4. في حالة السؤال السريري (case)، ضع السيناريو السريري في حقل case_scenario ونص السؤال المطلوب في question_text.

أعد النتيجة بصيغة JSON فقط مصفوفة من العناصر (JSON array) كالتالي دون أي مقدمات:
[
  {{
    "question_type": "mcq",
    "case_scenario": "",
    "question_text": "نص السؤال بالإنجليزية أو العربية مع الحفاظ التام على المصطلحات بالإنجليزية",
    "option_a": "الخيار A",
    "option_b": "الخيار B",
    "option_c": "الخيار C",
    "option_d": "الخيار D",
    "correct_option": "A",
    "explanation": "شرح طبي مكس (عربي مع مصطلحات إنجليزية طبية حصرية دون تعريب للعظام أو العضلات)",
    "lecture_evidence": "موضع المعلومة في الشرح الصوتي",
    "difficulty": "medium"
  }}
]
"""
    try:
        response_text = gemini_service.call_gemini(prompt)
        clean_json = response_text.strip()
        if "```json" in clean_json:
            clean_json = clean_json.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_json:
            clean_json = clean_json.split("```")[1].split("```")[0].strip()

        questions = json.loads(clean_json)
        if not isinstance(questions, list):
            if isinstance(questions, dict) and "questions" in questions:
                questions = questions["questions"]
            else:
                questions = [questions]

        return jsonify({"success": True, "questions": questions, "count": len(questions)})
    except Exception as e:
        return jsonify({"error": f"فشل توليد الأسئلة من Gemini: {str(e)}"}), 500

@app.route("/api/questions/generate_single", methods=["POST"])
def generate_single_question_route():
    """Generates a single high-yield MCQ or Case with immediate preview for interactive review and refinement."""
    data = request.json or {}
    lecture_id = data.get("lecture_id")
    excerpt_text = (data.get("excerpt_text") or "").strip()
    topic = (data.get("topic") or "").strip()
    q_type = data.get("question_type", "mcq")
    difficulty = data.get("difficulty", "medium")

    conn = database.get_connection()
    cur = conn.cursor()
    lec_title = ""
    lec_text = ""
    if lecture_id:
        cur.execute("SELECT title, subject, extracted_text FROM lectures WHERE id=?", (lecture_id,))
        row = cur.fetchone()
        if row:
            lec_title = f"{row['title']} ({row['subject']})"
            lec_text = row['extracted_text'][:2000] if row['extracted_text'] else ""
    conn.close()

    source_context = excerpt_text or topic or lec_text or lec_title or "General Clinical Medicine"
    prompt = f"""
أنت بروفيسور وممتحن طبي جامعي مسؤول عن بنوك الأسئلة الطبية.
المطلوب منك توليد وابتكار سؤال طبي واحد فقط عالي الجودة والدقة مبني على السياق التالي:
سياق المحاضرة: {lec_title}
المحتوى أو المقتبس أو الموضوع:
\"\"\"{source_context}\"\"\"

نوع السؤال: {q_type} (mcq = سؤال اختيار من متعدد مباشر، case = حالة وسيناريو سريري لشكوى مريض وفحوصاته).
مستوى الصعوبة: {difficulty}.

قواعد حاسمة للشرح والأسئلة (أسلوب المذاكرة الطبية - مكس إنجليزي مع عربي):
1. ⚠️ ممنوع منعاً باتاً تعريب أو ترجمة المصطلحات الطبية أو التشريحية إلى العربية:
   - العظام (Bones): لا تكتب "عظمة الراس" أو "عظمة الجبهة"، بل اكتب: Skull bones, Occipital bone, Frontal bone, Temporal bone, Parietal bone, Sphenoid bone, Mandible, Cranium, Calvaria.
   - العضلات (Muscles): لا تكتب "العضلة الماضغة" أو "عضلة الصدرية"، بل اكتب: Sternocleidomastoid, Masseter, Orbicularis Oculi, Trapezius, Buccinator, Temporalis.
   - الأعصاب (Nerves): لا تكتب "العصب الوجهي" مجرداً، بل اكتب: Facial nerve (CN VII), Trigeminal nerve (CN V), Mandibular nerve (V3).
   - الشرايين والأمراض: اكتبها بالإنجليزية الطبية حصراً.
2. الشرح والتعليل (explanation):
   - يجب أن يكون أسلوب الشرح مكس عربي سلس يربط المفاهيم، مع كتابة كافة المصطلحات الطبية والتشريحية حصرياً بالإنجليزية دون أي تعريب أو ترجمة.
   - يوضح سبب صحة الإجابة ولماذا باقي الخيارات خاطئة (مثال: "الخيار A صحيح لأن الـ Sternocleidomastoid muscle بتعمل contralateral rotation of the head وبتتغذى بالـ Spinal accessory nerve (CN XI). أما الخيار B فخطأ لأن الـ Occipital bone...").
3. 4 خيارات A, B, C, D، وتحديد الإجابة الصحيحة بحرف واحد.
4. إرجاع JSON كائن واحد كالتالي:
{{
  "question_type": "{q_type}",
  "case_scenario": "{'اكتب وصف الحالة السريرية هنا' if q_type == 'case' else ''}",
  "question_text": "نص السؤال المطلوب",
  "option_a": "الخيار A",
  "option_b": "الخيار B",
  "option_c": "الخيار C",
  "option_d": "الخيار D",
  "correct_option": "A",
  "explanation": "شرح طبي مكس (عربي مع مصطلحات إنجليزية طبية حصرية دون تعريب للعظام أو العضلات)",
  "lecture_evidence": "موضع المعلومة في المنهج",
  "difficulty": "{difficulty}"
}}
"""
    try:
        raw = gemini_service.resilient_generate(prompt, json_mode=True)
        cleaned = gemini_service.clean_json_text(raw)
        q_obj = json.loads(cleaned)
        if isinstance(q_obj, list) and len(q_obj) > 0:
            q_obj = q_obj[0]
        return jsonify({"success": True, "question": q_obj})
    except Exception as e:
        return jsonify({"error": f"فشل توليد السؤال: {str(e)}"}), 500

@app.route("/api/questions/refine_with_ai", methods=["POST"])
def refine_question_route():
    """Interactively refines an existing question based on student's prompt/instruction."""
    data = request.json or {}
    question = data.get("question") or {}
    instruction = (data.get("instruction") or "").strip()
    context = (data.get("context") or "").strip()

    if not instruction:
        return jsonify({"error": "يرجى كتابة تعليمات واضحة للـ AI حول كيفية تحسين السؤال"}), 400

    try:
        refined = gemini_service.refine_question_with_ai(question, instruction, context)
        return jsonify({"success": True, "question": refined})
    except Exception as e:
        return jsonify({"error": f"فشل تحسين السؤال: {str(e)}"}), 500

@app.route("/api/audio/save_transcript_questions", methods=["POST"])
def save_transcript_questions():
    """Saves approved transcript-generated questions with batch naming 'فويس: [اسم الملف]' and syncs Word doc."""
    data = request.json or {}
    lecture_id = data.get("lecture_id")
    audio_filename = (data.get("audio_filename") or "تسجيل صوتي").strip()
    questions = data.get("questions", [])

    if not lecture_id:
        return jsonify({"error": "يرجى اختيار المحاضرة التابعة للأسئلة"}), 400
    if not questions:
        return jsonify({"error": "لا توجد أسئلة لحفظها"}), 400

    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lectures WHERE id=?", (lecture_id,))
    lec = cur.fetchone()
    if not lec:
        conn.close()
        return jsonify({"error": "المحاضرة غير موجودة"}), 404

    custom_batch_name = (data.get("batch_name") or "").strip()
    if custom_batch_name:
        batch_title = custom_batch_name
    elif audio_filename and audio_filename not in ["تسجيل صوتي", "توليد ذكي تفاعلي", "توليد مخصص"]:
        batch_title = f"فويس: {audio_filename}"
    else:
        batch_title = "توليد ذكي تفاعلي"

    # Check if this batch_title already exists for this lecture
    cur.execute("SELECT batch_number FROM questions WHERE lecture_id=? AND batch_name=? LIMIT 1", (lecture_id, batch_title))
    existing_b = cur.fetchone()
    if existing_b and existing_b[0]:
        assigned_batch_num = existing_b[0]
    else:
        cur.execute("SELECT COALESCE(MAX(batch_number), 0) FROM questions WHERE lecture_id=?", (lecture_id,))
        assigned_batch_num = (cur.fetchone()[0] or 0) + 1

    saved_count = 0
    for q in questions:
        q_type = q.get("question_type", "mcq")
        scenario = (q.get("case_scenario") or "").strip()
        is_case = (q_type == "case") or (len(scenario) > 5)
        final_type = "case" if is_case else "mcq"
        correct_letter = str(q.get("correct_option") or "A").strip().upper()[:1]

        cur.execute('''
            INSERT INTO questions (
                block_id, lecture_id, question_type, case_scenario, question_text,
                option_a, option_b, option_c, option_d, correct_option,
                explanation, explanation_arabic, difficulty,
                batch_number, batch_name, source, source_file, lecture_evidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'audio_transcript', ?, ?)
        ''', (
            lec['block_id'], lecture_id, final_type,
            scenario if is_case else "",
            q.get("question_text", ""),
            q.get("option_a", ""),
            q.get("option_b", ""),
            q.get("option_c", ""),
            q.get("option_d", ""),
            correct_letter,
            q.get("explanation", ""),
            q.get("explanation_arabic") or q.get("explanation", ""),
            q.get("difficulty", "medium"),
            assigned_batch_num,
            batch_title,
            audio_filename,
            q.get("lecture_evidence", "")
        ))
        saved_count += 1

    conn.commit()
    conn.close()

    # Automatically rebuild / sync the lecture's Word file
    try:
        docx_service.rebuild_lecture_word_document(lecture_id)
    except Exception as we:
        print(f"Warning rebuilding docx: {we}")

    return jsonify({
        "success": True,
        "saved_count": saved_count,
        "batch_number": assigned_batch_num,
        "batch_name": batch_title,
        "lecture_id": lecture_id,
        "lecture_title": lec['title']
    })

# ----------------- SETTINGS & MISC -----------------
@app.route("/api/settings", methods=["GET"])
def get_settings():
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT key, value FROM settings")
    settings = {r['key']: r['value'] for r in cur.fetchall()}
    conn.close()
    return jsonify({"settings": settings})

@app.route("/api/settings", methods=["POST"])
def save_settings():
    data = request.json or {}
    conn = database.get_connection()
    cur = conn.cursor()
    for k, v in data.items():
        cur.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, str(v)))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/ai/test", methods=["GET", "POST"])
def test_ai_route():
    try:
        res = gemini_service.test_ai_connection()
        return jsonify(res)
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "message": f"حدث خطأ أثناء اختبار الاتصال: {e}"}), 500

@app.route("/api/ai/status", methods=["GET"])
def ai_status_route():
    try:
        ollama_on = gemini_service.is_ollama_available()
        provider = gemini_service.get_ai_provider()
        has_groq = bool(gemini_service.get_groq_api_key())
        return jsonify({
            "provider": provider,
            "ollama_available": ollama_on,
            "has_groq_key": has_groq,
            "recommended_models": {
                "gemini": ["gemini-3.6-flash", "gemma-4-26b-a4b-it", "gemini-3.8-flash"],
                "groq": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/settings/reset_data", methods=["POST"])
def reset_application_data_route():
    try:
        database.reset_all_user_data()
        
        # Clean storage folders safely
        import shutil
        dirs_to_clear = [
            os.path.join(BASE_DIR, 'lecture_pdfs'),
            os.path.join(BASE_DIR, 'static', 'lecture_images'),
            os.path.join(BASE_DIR, 'static', 'audio_uploads'),
            os.path.join(BASE_DIR, 'static', 'book_snippets'),
            os.path.join(BASE_DIR, 'formative_uploads'),
            os.path.join(BASE_DIR, 'formative_exports'),
            os.path.join(BASE_DIR, 'reference_books')
        ]
        for d in dirs_to_clear:
            if os.path.exists(d):
                for item in os.listdir(d):
                    item_path = os.path.join(d, item)
                    try:
                        if os.path.isdir(item_path):
                            shutil.rmtree(item_path)
                        else:
                            os.remove(item_path)
                    except Exception:
                        pass
            else:
                os.makedirs(d, exist_ok=True)
                
        return jsonify({"success": True, "message": "تم تصفير جميع بيانات التطبيق بنجاح."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ----------------- TOKEN & QUOTA MONITOR API -----------------
@app.route("/api/tokens/summary", methods=["GET"])
def get_token_usage_summary():
    from datetime import datetime, timezone, timedelta
    
    conn = database.get_connection()
    cur = conn.cursor()
    
    # 1. Today's stats
    cur.execute('''
        SELECT 
            COUNT(*) as request_count,
            COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
            COALESCE(SUM(candidates_tokens), 0) as candidates_tokens,
            COALESCE(SUM(total_tokens), 0) as total_tokens
        FROM api_token_usage
        WHERE date(timestamp) = date('now', 'localtime')
    ''')
    today_row = cur.fetchone()
    today_stats = {
        "requests_count": today_row["request_count"] or 0,
        "prompt_tokens": today_row["prompt_tokens"] or 0,
        "candidates_tokens": today_row["candidates_tokens"] or 0,
        "total_tokens": today_row["total_tokens"] or 0
    }
    
    # 2. All-time stats
    cur.execute('''
        SELECT 
            COUNT(*) as request_count,
            COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
            COALESCE(SUM(candidates_tokens), 0) as candidates_tokens,
            COALESCE(SUM(total_tokens), 0) as total_tokens
        FROM api_token_usage
    ''')
    all_time_row = cur.fetchone()
    all_time_stats = {
        "requests_count": all_time_row["request_count"] or 0,
        "prompt_tokens": all_time_row["prompt_tokens"] or 0,
        "candidates_tokens": all_time_row["candidates_tokens"] or 0,
        "total_tokens": all_time_row["total_tokens"] or 0
    }
    
    # 3. Usage by model
    cur.execute('''
        SELECT 
            model,
            COUNT(*) as requests,
            COALESCE(SUM(total_tokens), 0) as total_tokens,
            COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
            COALESCE(SUM(candidates_tokens), 0) as candidates_tokens
        FROM api_token_usage
        GROUP BY model
        ORDER BY total_tokens DESC
    ''')
    by_model = [dict(r) for r in cur.fetchall()]
    
    # 4. Usage by operation
    cur.execute('''
        SELECT 
            operation,
            COUNT(*) as requests,
            COALESCE(SUM(total_tokens), 0) as total_tokens
        FROM api_token_usage
        GROUP BY operation
        ORDER BY total_tokens DESC
    ''')
    by_operation = [dict(r) for r in cur.fetchall()]
    
    # 5. Recent 30 activity logs
    cur.execute('''
        SELECT id, model, prompt_tokens, candidates_tokens, total_tokens, operation, timestamp
        FROM api_token_usage
        ORDER BY id DESC
        LIMIT 30
    ''')
    recent_logs = [dict(r) for r in cur.fetchall()]
    conn.close()
    
    # 6. Quota limits and reset calculation
    # Gemini API free tier limits: 1500 RPD, 15 RPM, 1,000,000 TPM
    rpd_limit = 1500
    requests_today = today_stats["requests_count"]
    rpd_percent = min(100.0, round((requests_today / rpd_limit) * 100, 2)) if rpd_limit > 0 else 0
    
    # Daily quota resets at 00:00 UTC (03:00 AM Cairo local time)
    now_utc = datetime.now(timezone.utc)
    tomorrow_utc = (now_utc + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    seconds_until_reset = max(0, int((tomorrow_utc - now_utc).total_seconds()))
    hours = seconds_until_reset // 3600
    minutes = (seconds_until_reset % 3600) // 60
    seconds = seconds_until_reset % 60
    
    reset_info = {
        "seconds_until_reset": seconds_until_reset,
        "hours": hours,
        "minutes": minutes,
        "seconds": seconds,
        "countdown_text": f"{hours:02d}:{minutes:02d}:{seconds:02d}",
        "human_readable": f"باقي {hours} ساعة و {minutes} دقيقة",
        "reset_time_utc": "00:00 UTC",
        "reset_time_local": "03:00 ص (توقيت القاهرة)",
        "rpd_limit": rpd_limit,
        "rpd_used": requests_today,
        "rpd_remaining": max(0, rpd_limit - requests_today),
        "rpd_percent": rpd_percent,
        "rpm_limit": 15,
        "tpm_limit": 1000000
    }
    
# ----------------- MULTI-SOURCE FORMATIVES & QUESTION ORIGIN API -----------------
@app.route("/api/formatives/upload-master", methods=["POST"])
def formatives_upload_master():
    try:
        file = request.files.get("file")
        if not file or not file.filename:
            return jsonify({"success": False, "error": "يرجى اختيار الملف الأساسي للمحاضرات"}), 400

        fname = file.filename
        fpath = os.path.join(formative_matcher_service.UPLOADS_DIR, fname)
        file.save(fpath)
        res = formative_matcher_service.parse_master_lecture_bank(fpath, fname)
        return jsonify({
            "success": True, 
            "file": res,
            "file_id": res["file_id"],
            "filename": res["filename"],
            "total_lectures": res["total_lectures"],
            "total_questions": res["total_questions"],
            "status": res["status"],
            "lectures": res["lectures"]
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/formatives/upload-references", methods=["POST"])
def formatives_upload_references():
    try:
        uploaded_files = request.files.getlist("files")
        if not uploaded_files or len(uploaded_files) == 0 or not uploaded_files[0].filename:
            # Fallback for single file
            single_f = request.files.get("file")
            if single_f and single_f.filename:
                uploaded_files = [single_f]
            else:
                return jsonify({"success": False, "error": "يرجى اختيار ملفات المصادر المرجعية"}), 400

        results = []
        for f in uploaded_files:
            if not f or not f.filename:
                continue
            fname = f.filename
            fpath = os.path.join(formative_matcher_service.UPLOADS_DIR, fname)
            f.save(fpath)
            res = formative_matcher_service.parse_reference_source_file(fpath, fname)
            results.append(res)

        return jsonify({"success": True, "files": results, "uploaded_count": len(results)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/formatives/sources", methods=["GET"])
def list_formative_sources():
    try:
        conn = database.get_connection()
        cur = conn.cursor()
        
        # Get latest Master file
        cur.execute("SELECT * FROM formative_files WHERE file_type='lecture_bank' ORDER BY id DESC LIMIT 1")
        master_row = cur.fetchone()
        master_file = None
        if master_row:
            master_file = dict(master_row)
            cur.execute("""
                SELECT lecture_name, total_questions, formative_questions_count
                FROM formative_lectures
                WHERE file_id=?
                ORDER BY id ASC
            """, (master_file['id'],))
            master_file['lectures'] = [dict(r) for r in cur.fetchall()]

        # Get all Reference Sources
        cur.execute("SELECT * FROM formative_files WHERE file_type='reference_source' ORDER BY id DESC")
        sources = [dict(r) for r in cur.fetchall()]
        conn.close()

        return jsonify({
            "success": True,
            "master_file": master_file,
            "reference_sources": sources,
            "sources": sources
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/formatives/sources/<int:file_id>", methods=["PUT"])
def update_formative_source_label(file_id):
    try:
        data = request.json or {}
        new_label = (data.get("source_label") or "").strip()
        is_active = data.get("is_active", 1)

        if not new_label:
            return jsonify({"success": False, "error": "اسم المصدر لا يمكن أن يكون فارغاً"}), 400

        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE formative_files 
            SET source_label=?, is_active=?
            WHERE id=?
        """, (new_label, is_active, file_id))
        
        # Also update source_label in formative_weekly_index
        cur.execute("""
            UPDATE formative_weekly_index
            SET source_label=?
            WHERE file_id=?
        """, (new_label, file_id))

        conn.commit()
        conn.close()

        return jsonify({"success": True, "file_id": file_id, "source_label": new_label})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/formatives/sources/<int:file_id>", methods=["DELETE"])
def delete_formative_source(file_id):
    try:
        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM formative_weekly_index WHERE file_id=?", (file_id,))
        cur.execute("DELETE FROM formative_files WHERE id=?", (file_id,))
        conn.commit()
        conn.close()

        return jsonify({"success": True, "deleted_id": file_id})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/formatives/lectures", methods=["GET"])
def get_formative_lectures():
    try:
        file_id = request.args.get("file_id") or request.args.get("master_file_id")
        conn = database.get_connection()
        cur = conn.cursor()

        if not file_id:
            # Fallback to latest master file
            cur.execute("SELECT id FROM formative_files WHERE file_type='lecture_bank' ORDER BY id DESC LIMIT 1")
            row = cur.fetchone()
            if row:
                file_id = row["id"]
            else:
                conn.close()
                return jsonify({"success": True, "lectures": []})

        cur.execute("SELECT * FROM formative_lectures WHERE file_id=? ORDER BY id ASC", (file_id,))
        lectures = [dict(r) for r in cur.fetchall()]
        conn.close()

        return jsonify({"success": True, "lectures": lectures, "file_id": int(file_id)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/formatives/match", methods=["POST"])
def match_formatives():
    try:
        data = request.json or {}
        file_1_id = data.get("file_1_id") or data.get("master_file_id")
        lecture_name = data.get("lecture_name")
        active_source_ids = data.get("active_source_ids")

        if not file_1_id or not lecture_name:
            # Try to get latest master file id
            conn = database.get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM formative_files WHERE file_type='lecture_bank' ORDER BY id DESC LIMIT 1")
            m_row = cur.fetchone()
            conn.close()
            if m_row:
                file_1_id = m_row["id"]
            else:
                return jsonify({"success": False, "error": "يرجى رفع الملف الأساسي للمحاضرات أولاً"}), 400

        matched_questions = formative_matcher_service.match_lecture_multi_sources(
            int(file_1_id), lecture_name, active_source_ids
        )
        
        matched_count = sum(1 for q in matched_questions if q.get("match_status") == "matched")

        return jsonify({
            "success": True,
            "lecture_name": lecture_name,
            "total_questions": len(matched_questions),
            "matched_count": matched_count,
            "questions": matched_questions
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/formatives/export-docx", methods=["GET"])
def export_formatives_docx():
    try:
        file_1_id = request.args.get("file_1_id") or request.args.get("master_file_id")
        lecture_name = request.args.get("lecture_name")

        if not file_1_id or not lecture_name:
            conn = database.get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM formative_files WHERE file_type='lecture_bank' ORDER BY id DESC LIMIT 1")
            m_row = cur.fetchone()
            conn.close()
            if m_row:
                file_1_id = m_row["id"]
            else:
                return jsonify({"success": False, "error": "file_1_id واسم المحاضرة مطلوبان"}), 400

        out_path = formative_matcher_service.export_multi_source_docx(int(file_1_id), lecture_name)
        safe_name = re.sub(r'[\\/*?:"<>|]', '', lecture_name).strip()[:40]
        download_name = f"MultiSource_{safe_name}.docx"

        return send_file(out_path, as_attachment=True, download_name=download_name)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# =========================================================================
# SMART BOOK & REFERENCE AUDITOR API (مدقق المراجع والكتب الذكي)
# =========================================================================

@app.route("/api/book_auditor/books", methods=["GET"])
def list_reference_books():
    try:
        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM reference_books ORDER BY id DESC")
        books = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "books": books})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/book_auditor/upload_book", methods=["POST"])
def upload_reference_book():
    try:
        if "file" not in request.files:
            return jsonify({"status": "error", "message": "لم يتم اختيار أي ملف"}), 400
        
        f = request.files["file"]
        if not f.filename.lower().endswith(".pdf"):
            return jsonify({"status": "error", "message": "يرجى رفع كتاب بصيغة PDF فقط"}), 400

        custom_title = request.form.get("title", "").strip()
        filename = f.filename
        title = custom_title if custom_title else os.path.splitext(filename)[0]

        books_dir = os.path.join(BASE_DIR, "reference_books")
        os.makedirs(books_dir, exist_ok=True)
        safe_fname = f"{int(time.time())}_{re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)}"
        file_path = os.path.join(books_dir, safe_fname)
        f.save(file_path)

        file_size = os.path.getsize(file_path)

        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO reference_books (title, filename, file_path, file_size)
            VALUES (?, ?, ?, ?)
        """, (title, filename, file_path, file_size))
        book_id = cur.lastrowid
        conn.commit()
        conn.close()

        # Index pages in background or synchronous
        total_pages = book_snippet_generator.index_book_pdf(book_id, file_path)

        return jsonify({
            "status": "success",
            "message": f"تم رفع وفهرسة الكتاب بنجاح ({total_pages} صفحة)",
            "book": {
                "id": book_id,
                "title": title,
                "filename": filename,
                "total_pages": total_pages,
                "file_size": file_size
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/book_auditor/book/<int:book_id>", methods=["DELETE"])
def delete_reference_book(book_id):
    try:
        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT file_path FROM reference_books WHERE id=?", (book_id,))
        row = cur.fetchone()
        if row and row["file_path"] and os.path.exists(row["file_path"]):
            try:
                os.remove(row["file_path"])
            except Exception:
                pass

        cur.execute("DELETE FROM reference_books WHERE id=?", (book_id,))
        cur.execute("DELETE FROM book_page_index WHERE book_id=?", (book_id,))
        cur.execute("DELETE FROM book_verified_qa WHERE book_id=?", (book_id,))
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "message": "تم حذف الكتاب وفهرسه بنجاح"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/book_auditor/verify_instant", methods=["POST"])
def book_auditor_verify_instant():
    try:
        data = request.json or {}
        book_id = int(data.get("book_id", 0))
        question_text = (data.get("question_text") or "").strip()
        options_text = (data.get("options_text") or "").strip()
        proposed_answer = (data.get("proposed_answer") or "").strip()
        force_web_search = bool(data.get("force_web_search", False))

        if not book_id or not question_text:
            return jsonify({"status": "error", "message": "معرف الكتاب ونص السؤال مطلوبان"}), 400

        result = book_auditor_service.verify_single_question_against_book(
            book_id=book_id,
            question_text=question_text,
            options_text=options_text,
            proposed_answer=proposed_answer,
            force_web_search=force_web_search
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/book_auditor/save_convinced", methods=["POST"])
def book_auditor_save_convinced():
    try:
        data = request.json or {}
        book_id = int(data.get("book_id", 0))
        question_text = data.get("question_text", "")
        answer_text = data.get("answer_text", "")
        explanation = data.get("explanation", "")
        page_number = int(data.get("page_number", 0))
        snippet_image_path = data.get("snippet_image_path", "")

        book_auditor_service.save_verified_qa_cache(
            book_id=book_id,
            question_text=question_text,
            answer_text=answer_text,
            explanation=explanation,
            page_number=page_number,
            snippet_image_path=snippet_image_path
        )
        return jsonify({"status": "success", "message": "تم تسجيل الإجابة الموثقة بنجاح!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/book_auditor/batch_upload", methods=["POST"])
def book_auditor_batch_upload():
    try:
        if "file" not in request.files:
            return jsonify({"status": "error", "message": "لم يتم اختيار أي ملف"}), 400
        
        f = request.files["file"]
        book_id = int(request.form.get("book_id", 0))

        if not book_id:
            return jsonify({"status": "error", "message": "يرجى اختيار الكتاب المرجعي أولاً"}), 400

        if not f.filename.lower().endswith(".docx"):
            return jsonify({"status": "error", "message": "يرجى رفع ملف أسئلة بصيغة Word (.docx) فقط"}), 400

        upload_dir = os.path.join(BASE_DIR, "reference_books")
        os.makedirs(upload_dir, exist_ok=True)
        safe_fname = f"batch_{int(time.time())}_{re.sub(r'[^a-zA-Z0-9_.-]', '_', f.filename)}"
        file_path = os.path.join(upload_dir, safe_fname)
        f.save(file_path)

        # Parse questions
        questions = book_auditor_service.parse_docx_questions(file_path)
        if not questions:
            return jsonify({"status": "error", "message": "لم يتم العثور على أي أسئلة داخل ملف الـ Word المرفوع"}), 400

        session_id = book_auditor_service.create_audit_session(
            book_id=book_id,
            source_filename=f.filename,
            source_file_path=file_path,
            questions=questions
        )

        return jsonify({
            "status": "success",
            "session_id": session_id,
            "total_questions": len(questions),
            "preview": questions[:3]
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/book_auditor/batch_step/<int:session_id>", methods=["POST"])
def book_auditor_batch_step(session_id):
    try:
        result = book_auditor_service.process_next_audit_question(session_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/book_auditor/batch_consult/<int:session_id>", methods=["POST"])
def book_auditor_batch_consult(session_id):
    try:
        data = request.json or {}
        question_id = int(data.get("question_id", 0))
        user_action = data.get("user_action", "keep") # 'modify', 'keep', 'web_search'
        target_answer = data.get("target_answer", "")

        result = book_auditor_service.resolve_consultation_question(
            session_id=session_id,
            question_id=question_id,
            user_action=user_action,
            target_answer=target_answer
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/book_auditor/download/<filename>", methods=["GET"])
def book_auditor_download_file(filename):
    try:
        safe_name = os.path.basename(filename)
        file_dir = os.path.join(BASE_DIR, "reference_books")
        file_path = os.path.join(file_dir, safe_name)
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": "الملف المطلوب غير موجود"}), 404
        return send_file(file_path, as_attachment=True, download_name=safe_name)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def start_server(port=5500):
    database.init_db()
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)

if __name__ == "__main__":
    start_server()
