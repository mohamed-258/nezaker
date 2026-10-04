import os
import json
import re
import time
from google import genai
from google.genai import types
import database

try:
    from dotenv import load_dotenv
    # Load .env from nezaker directory and root directory
    _cur_dir = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(_cur_dir, ".env"))
    load_dotenv(os.path.join(os.path.dirname(_cur_dir), ".env"))
    load_dotenv()
except Exception:
    pass

DEFAULT_API_KEY = "AQ.Ab8RN6LMsgXMGcgWAtKKrBDo7mxlgNoWLA3pEJ3p2wNVahRAxQ"

MODEL_PREFERENCES = [
    "gemini-3.6-flash",     # Highest stability, ultra fast, 0 errors
    "gemma-4-26b-a4b-it",   # Open Gemma 4 architecture, verified working
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3-flash-preview"
]

def get_api_key():
    # 1. Check environment variables (.env or system env)
    env_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()
        
    # 2. Check saved settings in SQLite database
    try:
        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT value FROM settings WHERE key='gemini_api_key'")
        row = cur.fetchone()
        conn.close()
        if row and row['value'] and row['value'].strip():
            return row['value'].strip()
    except Exception:
        pass
    return DEFAULT_API_KEY

def get_groq_api_key():
    env_key = os.environ.get("GROQ_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()
    try:
        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT value FROM settings WHERE key='groq_api_key'")
        row = cur.fetchone()
        conn.close()
        if row and row['value'] and row['value'].strip():
            return row['value'].strip()
    except Exception:
        pass
    return ""

def get_ai_provider():
    try:
        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT value FROM settings WHERE key='ai_provider'")
        row = cur.fetchone()
        conn.close()
        if row and row['value']:
            return row['value'].strip().lower()
    except Exception:
        pass
    return "gemini"

def get_model_chain():
    """Builds a dynamic ordered list of models to try, prioritizing settings preferences."""
    models = []
    try:
        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT key, value FROM settings WHERE key IN ('primary_model', 'fallback_model')")
        s = dict(cur.fetchall())
        conn.close()
        primary = s.get('primary_model', '').strip()
        fallback = s.get('fallback_model', '').strip()
        # If user explicitly configured a primary model that is not a known-overloaded lite model, prioritize it
        if primary and 'lite' not in primary.lower() and primary not in models:
            models.append(primary)
        if fallback and 'lite' not in fallback.lower() and fallback not in models:
            models.append(fallback)
    except Exception:
        pass

    for m in MODEL_PREFERENCES:
        if m not in models:
            models.append(m)
    return models

def get_gemini_client():
    key = get_api_key()
    return genai.Client(
        api_key=key,
        http_options=types.HttpOptions(
            retry_options=types.HttpRetryOptions(attempts=1)
        )
    )

BILINGUAL_MEDICAL_EXPLANATION_GUIDELINES = """
CRITICAL RULE - STRICT BILINGUAL MEDICAL STYLE (أسلوب المذاكرة الطبية - مكس إنجليزي مع عربي):
- In all medical explanations (الشرح والتعليل الطبي):
  1. ⚠️ NEVER translate or Arabize medical/anatomical terms under any circumstances!
     - Bones: Do NOT write "عظمة الراس", "عظمة الجبهة", "عظام الجمجمة", "عظمة الصدع". You MUST write: Skull bones, Occipital bone, Frontal bone, Temporal bone, Parietal bone, Sphenoid bone, Mandible, Cranium, Calvaria.
     - Muscles: Do NOT write "عضلة الصدرية", "العضلة الماضغة", "عضلة الرقبة". You MUST write: Sternocleidomastoid, Masseter, Orbicularis Oculi, Trapezius, Buccinator, Temporalis, Platysma.
     - Nerves: Do NOT write "العصب الوجهي" or "العصب الثلاثي" in Arabic alone. You MUST write: Facial nerve (CN VII), Trigeminal nerve (CN V), Mandibular nerve (V3), Spinal accessory nerve (CN XI).
     - Vessels: Middle meningeal artery, Internal carotid artery, Internal jugular vein.
     - Symptoms & Diseases: Bell's Palsy, Ptosis, Diplopia, Epidural hematoma, Paresthesia, Horner's syndrome.
  2. The explanation style MUST be Egyptian/Arab medical student register: natural, crystal-clear Arabic explaining causality and reasoning, seamlessly embedding proper Medical English terms for all structures, clinical entities, and actions.
     (مثال توضيحي: "الخيار A صحيح لأن الـ Sternocleidomastoid muscle بتعمل contralateral rotation of the head، وبتتغذى حركياً بواسطة الـ Spinal accessory nerve (CN XI). أما الخيار B فخطأ لأن الـ Occipital bone يرتكز عليه...")
"""

def clean_json_text(text: str) -> str:
    text = text.strip()
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        return match.group(1).strip()
    return text

def log_token_usage(model: str, prompt_tokens: int, candidates_tokens: int, total_tokens: int, operation: str = "general"):
    """Logs token consumption into SQLite api_token_usage table."""
    try:
        conn = database.get_connection()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO api_token_usage (model, prompt_tokens, candidates_tokens, total_tokens, operation, timestamp)
               VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))""",
            (model, prompt_tokens, candidates_tokens, total_tokens, operation)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[TOKEN_LOGGER] Error logging usage: {e}")

def generate_with_groq(prompt: str, system_instruction=None, json_mode=False, model="llama-3.3-70b-versatile", operation="general") -> str:
    from groq import Groq
    key = get_groq_api_key()
    if not key:
        raise RuntimeError("مفتاح Groq API غير محدد. يمكنك الحصول على مفتاح مجاني 100% بدون بطاقة بنكية من https://console.groq.com/keys وإدخاله في الإعدادات.")

    client = Groq(api_key=key)
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    kwargs = {
        "model": model,
        "messages": messages,
        "temperature": 0.3
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    completion = client.chat.completions.create(**kwargs)
    res_text = completion.choices[0].message.content or ""
    try:
        usage = completion.usage
        p_tokens = getattr(usage, "prompt_tokens", 0) or 0
        c_tokens = getattr(usage, "completion_tokens", 0) or 0
        t_tokens = getattr(usage, "total_tokens", 0) or (p_tokens + c_tokens)
        log_token_usage(f"groq/{model}", p_tokens, c_tokens, t_tokens, operation)
    except Exception:
        pass
    return res_text

def is_ollama_available(host="http://localhost:11434"):
    import requests
    try:
        r = requests.get(f"{host}/api/tags", timeout=1.5)
        return r.status_code == 200
    except Exception:
        return False

def generate_with_ollama(prompt: str, system_instruction=None, json_mode=False, model="llama3.2", host="http://localhost:11434", operation="general") -> str:
    import requests
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model,
        "messages": messages,
        "stream": False
    }
    if json_mode:
        payload["format"] = "json"

    r = requests.post(f"{host}/api/chat", json=payload, timeout=120)
    if r.status_code != 200:
        raise RuntimeError(f"Ollama server returned {r.status_code}: {r.text}")
    data = r.json()
    res_text = data.get("message", {}).get("content", "")
    try:
        p_tokens = data.get("prompt_eval_count", 0) or (len(str(messages)) // 4)
        c_tokens = data.get("eval_count", 0) or (len(res_text) // 4)
        t_tokens = p_tokens + c_tokens
        log_token_usage(f"ollama/{model}", p_tokens, c_tokens, t_tokens, operation)
    except Exception:
        pass
    return res_text

def resilient_generate(prompt: str, contents=None, json_mode=False, system_instruction=None, max_retries=1, operation: str = "general") -> str:
    provider = get_ai_provider()

    # 1. If provider is Groq (completely free external cloud engine)
    if provider == "groq":
        try:
            return generate_with_groq(prompt, system_instruction=system_instruction, json_mode=json_mode, operation=operation)
        except Exception as e:
            print(f"[AI_SERVICE] Groq failed ({e}). Falling back to Gemini...")
            # Fall through to Gemini below

    # 2. If provider is Ollama (local offline model)
    elif provider == "ollama":
        try:
            return generate_with_ollama(prompt, system_instruction=system_instruction, json_mode=json_mode, operation=operation)
        except Exception as e:
            print(f"[AI_SERVICE] Ollama failed ({e}). Falling back to Gemini...")
            # Fall through to Gemini below

    # 3. Google Gemini Engine with robust priority chain
    client = get_gemini_client()
    
    config_kwargs = {}
    if json_mode:
        config_kwargs["response_mime_type"] = "application/json"
    if system_instruction:
        config_kwargs["system_instruction"] = system_instruction

    config = types.GenerateContentConfig(**config_kwargs) if config_kwargs else None

    if contents is None:
        actual_contents = prompt
    elif isinstance(contents, list):
        actual_contents = contents + ([prompt] if prompt else [])
    else:
        actual_contents = [contents, prompt] if prompt else contents

    models_to_try = get_model_chain()
    last_err = None

    for model in models_to_try:
        try:
            response = client.models.generate_content(
                model=model,
                contents=actual_contents,
                config=config
            )
            if response and response.text:
                try:
                    meta = getattr(response, 'usage_metadata', None)
                    p_tokens = getattr(meta, 'prompt_token_count', 0) or 0
                    c_tokens = getattr(meta, 'candidates_token_count', 0) or 0
                    t_tokens = getattr(meta, 'total_token_count', 0) or (p_tokens + c_tokens)
                    if t_tokens == 0:
                        p_tokens = max(1, len(str(actual_contents)) // 4)
                        c_tokens = max(1, len(response.text) // 4)
                        t_tokens = p_tokens + c_tokens
                    log_token_usage(model, p_tokens, c_tokens, t_tokens, operation)
                except Exception as ex:
                    print(f"[GEMINI_SERVICE] Token tracking warning: {ex}")
                return response.text
        except Exception as e:
            err_str = str(e)
            last_err = e
            print(f"[GEMINI_SERVICE] Model '{model}' unavailable or overloaded ({err_str[:120]}). Falling back to next model...")
            continue

    # 4. If all Gemini models failed, try Groq as an emergency automatic safety net if a Groq key is present
    groq_key = get_groq_api_key()
    if groq_key and provider != "groq":
        try:
            print("[AI_SERVICE] Gemini models failed. Attempting Groq safety net...")
            return generate_with_groq(prompt, system_instruction=system_instruction, json_mode=json_mode, operation=operation)
        except Exception as groq_err:
            print(f"[AI_SERVICE] Groq safety net error: {groq_err}")

    # 5. If all failed, give a clear explanation
    err_msg = str(last_err) if last_err else "Unknown error"
    if "503" in err_msg or "high demand" in err_msg.lower():
        raise RuntimeError("خوادم الذكاء الاصطناعي تشهد ضغطاً مؤقتاً كبيراً (High Demand). يمكنك التبديل إلى مزود Groq المجاني السريع عبر الإعدادات ⚙️ أو إدخال مفتاح API جديد.")
    elif "429" in err_msg or "quota" in err_msg.lower():
        raise RuntimeError("تم استهلاك الحصة المجانية لمفتاح الـ API الحالي (Rate Limit / Quota Exceeded). يمكنك التبديل إلى مزود Groq المجاني أو إضافة مفتاح Google AI Studio جديد من نافذة الإعدادات ⚙️.")
    
    raise RuntimeError(f"تعذر توليد المحتوى: {err_msg}")

call_gemini = resilient_generate

def test_ai_connection():
    """Runs a quick live diagnostic check of the active AI provider and model."""
    start_time = time.time()
    try:
        reply = resilient_generate(
            prompt="Respond with exactly 'PONG' and nothing else.",
            system_instruction="You are a health check system. Reply only with PONG.",
            operation="health_check"
        )
        latency = round((time.time() - start_time) * 1000)
        provider = get_ai_provider()
        
        model_name = "Active Model"
        try:
            conn = database.get_connection()
            cur = conn.cursor()
            cur.execute("SELECT model FROM api_token_usage ORDER BY id DESC LIMIT 1")
            r = cur.fetchone()
            if r:
                model_name = r['model']
            conn.close()
        except Exception:
            pass

        return {
            "success": True,
            "provider": provider,
            "model": model_name,
            "latency_ms": latency,
            "reply": reply.strip(),
            "message": f"اتصال الذكاء الاصطناعي يعمل بنجاح! تم الرد بنموذج ({model_name}) خلال {latency} مللي ثانية."
        }
    except Exception as e:
        latency = round((time.time() - start_time) * 1000)
        return {
            "success": False,
            "latency_ms": latency,
            "error": str(e),
            "message": f"تعذر الاتصال بالذكاء الاصطناعي: {e}"
        }

def explain_lecture_exhaustive(lecture_title: str, lecture_text: str, language: str = "ar", lecture_id: int = None) -> dict:
    """
    Explains the medical lecture in a simple, clear, cohesive, and visual slide-by-slide manner.
    CRITICAL RULES:
    - NO line-by-line quoting followed by sub-bullets (strictly forbidden to quote each line and explain it underneath).
    - Explains what is written directly, smoothly, and simply without excessive verbosity or filler.
    - NEVER skip figures, diagrams, anatomical charts, histology plates, or pathways: thoroughly explain them!
    - Embeds slide image references and visual diagrams where helpful.
    - Preserves English medical terms embedded naturally into fluent Arabic explanations.
    """
    cleaned_lecture_text = lecture_text[:120000] if lecture_text else ""
    lec_img_instruction = ""
    if lecture_id:
        lec_img_instruction = (
            f"🖼️ عرض صور السلايدات الأصلية داخل الشرح:\n"
            f"عندما تشرح سلايد يحتوي على رسم توضيحي هام أو مخطط تشريحي، اعرض صورة السلايد في الشرح باستخدام الماركداون:\n"
            f"`![رسم توضيحي للشريحة X](/static/lecture_images/lec_{lecture_id}/slide_X.jpg)`\n"
            f"(استبدل X برقم السلايد الفعلي، مثل slide_3.jpg للشريحة 3).\n"
        )

    if language == "ar":
        system_prompt = (
            "أنت بروفيسور وطبيب استشاري ومعلم أكاديمي عبقري، مهمتك تقديم شرح طبي وافٍ، غني، متعمق وبصري لكل شريحة في المحاضرة.\n\n"
            "القواعد الصارمة لأسلوب الشرح المطلوب:\n"
            "1. 🚫 ممنوع منعاً باتاً كتابة السطر الأصلي ثم شرحه تحته (No line-by-line verbatim quoting):\n"
            "   - لا تقتبس السطر بالإنجليزية وتضع تحته ترجمة مكررة (هذا الأسلوب ممنوع تماماً).\n"
            "   - اشرح محتوى السلايد كوحدة علمية متكاملة بأسلوب تعليمي ثري ومترابط وممتع.\n"
            "2. 🔬 الشرح الوافي المتعمق وغير المختصر (Comprehensive, In-Depth & Detailed):\n"
            "   - ⚠️ ممنوع منعاً باتاً الاختصار المخل أو الاكتفاء برؤوس أقلام سطحية أو جملتين سريعتين!\n"
            "   - فكك كل مفهوم في السلايد واشرح الآلية (Mechanism of Action / Physiology / Pathophysiology): لماذا وكيف يحدث ذلك؟\n"
            "   - في علم التشريح (Anatomy): فصّل العلاقات المكانية (Relations: anterior, posterior, medial, lateral)، المسار (Course)، التغذية العصبية والدموية (Nerve & Blood supply)، والوظائف (Functions & Actions) بالتفصيل التام.\n"
            "   - في علم الأدوية وعلم الأمراض (Pharm & Patho): فصّل آليات العمل، دواعي الاستعمال، الأعراض الجانبية، والتغيرات النسيجية بدقة.\n"
            "   - اجعل الشرح غنياً ومشبعاً ومفصلاً بحيث يفهم الطالب كل جزئية في السلايد بنسبة 100% دون أن يشعر بنقص أي معلومة.\n"
            "3. 💡 اللمسة السريرية وفخاخ الامتحانات (Clinical Pearls & Board Traps):\n"
            "   - في كل شريحة تحتوي على مفهوم سريري أو تشريحي هام، خصص فقرة: `💡 **الربط السريري وفخاخ الامتحانات (Clinical Pearl):**`.\n"
            "   - وضّح: ما هي الإصابة أو المرض الناتج عن خلل هذا التركيب (Lesion, Syndrome, Clinical Sign)؟ وكيف يأتي هذا المفهوم في أسئلة امتحانات الـ MCQs والـ USMLE؟\n"
            "4. 🖼️ شرح الصور والرسومات بدقة تامة وعدم تخطيها (Thoroughly Explain Figures & Diagrams):\n"
            "   - ⚠️ ممنوع منعاً باتاً تخطي أي صورة، رسمة تشريحية، قطاع مجهري، أو مخطط في السلايدات!\n"
            "   - إذا كان السلايد يحتوي على رسم توضيحي أو صورة، خصص له فقرة واضحة: `🖼️ **شرح الرسم التوضيحي (Figure & Visual Guide):**`.\n"
            "   - فصّل كل سهم، وكل علامة، وكل تركيب مشار إليه في الرسم وكيف يقرأه الطالب خطوة بخطوة.\n"
            "5. 🌐 عرض وتضمين صور السلايدات الأصلية والمخططات (Slide Images & Flowcharts):\n"
            "   - اعرض صورة السلايد باستخدام الماركداون: `![رسم الشريحة X](/static/lecture_images/lec_{lecture_id}/slide_X.jpg)` للشريحة التي تحتوي رسماً أو مخططاً.\n"
            "   - ارسم مخططات انسيابية للآليات المعقدة بكود mermaid عند الحاجة.\n"
            "6. 📊 الجداول المنظمة للمقارنات (Structured Comparison Tables):\n"
            "   - عند وجود مقارنة أو تصنيف، نظمها في جدول ماركداون وافٍ وشامل لكافة الفروقات لترسيخ الحفظ.\n"
            "7. 🩺 لغة المذاكرة الطبية الطبيعية (Bilingual Medical):\n"
            "   - الشرح باللغة العربية العلمية السلسة والواضحة (أسلوب طالب الطب المتفوق)، مع الحفاظ التام على جميع المصطلحات الطبية والتشريحية والأعصاب والأوعية والأدوية باللغة الإنجليزية كما هي دون تعريبها."
        )

        prompt = f"""
المحاضرة الطبية المطلوب شرحها بالتفصيل الوافي:
العنوان: {lecture_title}

{lec_img_instruction}

نصوص ومحتوى السلايدات:
==================================================
{cleaned_lecture_text}
==================================================

المطلوب:
قدم شرحاً طبياً وافياً، مفصلاً، عميقاً وبصرياً يغطي محتوى المحاضرة شريحة بشريحة (Slide by Slide) دون أي اختصار مخل:
⚠️ تنبيهات حاسمة:
1. ⚠️ تجنب الاختصار السطحي! أعطِ كل شريحة حقها الكامل من الشرح العلمي المفصل: فسر الآليات، فصّل العلاقات التشريحية، واشرح خلفيات المعلومات العلمية.
2. لا تقتبس السطور حرفياً سطراً بسطر ثم تكررها! بل صغ شرحاً طبياً متكاملاً وثرياً ومترابطاً.
3. لا تتخطى أي صورة أو رسمة أو مخطط! اشرح محتوى الرسومات والمخططات بدقة وأبرز التراكيب والعلاقات الهامة فيها.
4. اعرض صورة السلايد عبر الماركداون: `![رسم الشريحة X](/static/lecture_images/lec_{lecture_id or 1}/slide_X.jpg)` عند كل شريحة تحتوي رسماً توضيحياً أو مخططاً.
5. أضف لمسات سريرية (Clinical Pearls) وفخاخ الامتحانات في كل موضع مناسب.

التنسيق المطلوب:
# 🩺 شرح المحاضرة: {lecture_title}

## 📑 السلايد [رقم السلايد]: [عنوان أو فكرة السلايد]

### 🧠 الشرح الطبي التفصيلي والمفاهيم:
(اشرح هنا محتوى السلايد بالتفصيل العلمي الكافي والعميق. فكك الآليات والعلاقات والوظائف بأسلوب علمي سلس ووافٍ دون اختصار مخل، مع دمج المصطلحات الإنجليزية الطبية بشكل طبيعي).

(إذا كان هناك رسم أو صورة في السلايد، اعرض صورتها واشرحها بالتفصيل تحت عنوان: `🖼️ **شرح الرسم التوضيحي (Figure & Visual Guide):**` موضحاً كل تأشير وسهم وعلاقة مكانية).

(أضف اللمسة السريرية وفخ الامتحانات تحت: `💡 **الربط السريري وفخاخ الامتحانات (Clinical Pearl & Exam High-Yield):**`).

(إذا كانت هناك مقارنة أو تصنيف، نظمه في جدول ماركداون شامل ومنظم).

(استمر بنفس العمق والتفصيل الشافي لكل سلايد حتى تغطي كامل المحاضرة).
"""
    else:
        system_prompt = (
            "You are an elite Medical Professor who explains concepts thoroughly, in-depth, clearly, and visually.\n\n"
            "STRICT RULES:\n"
            "1. 🚫 NO LINE-BY-LINE VERBATIM QUOTING: Do NOT quote each line followed by sub-explanations. Synthesize and explain the slide content naturally, deeply, and cohesively.\n"
            "2. 🔬 THOROUGH & IN-DEPTH EXPLANATION: Avoid superficial summaries or ultra-brief bullet points. Explain the underlying mechanisms, anatomical relations, physiological steps, pharmacological actions, and pathophysiological pathways in rich, satisfying detail.\n"
            "3. 💡 CLINICAL CORRELATIONS & EXAM TRAPS: Highlight high-yield clinical pearls (lesions, signs, syndromes) and how board examiners (USMLE/Finals) test these concepts.\n"
            "4. 🖼️ NEVER SKIP DIAGRAMS / FIGURES: Explain any visual charts, histology images, or anatomical diagrams thoroughly under a dedicated section `🖼️ **Figure & Visual Guide:**`.\n"
            "5. 📊 STRUCTURED TABLES & FLOWCHARTS: Use clear Markdown tables for comparisons and Mermaid flowcharts for complex pathways where helpful.\n"
            "6. 🛑 STRICT BOUNDARY: Stay strictly anchored to the concepts covered in the provided lecture slides while explaining them deeply."
        )

        prompt = f"""
Lecture Title: {lecture_title}

{lec_img_instruction}

Full Lecture Text & Slides:
==================================================
{cleaned_lecture_text}
==================================================

Provide a thorough, comprehensive, in-depth, and visual slide-by-slide medical explanation of this lecture.
Do NOT quote line-by-line. Synthesize and explain slide concepts directly and deeply.
Do NOT provide brief or superficial summaries — explain the mechanisms, anatomical connections, and clinical relevance thoroughly.
DO NOT skip any images or diagrams: provide clear explanations for what the figures, labels, and arrows represent.
Embed slide images using `![Slide X](/static/lecture_images/lec_{lecture_id or 1}/slide_X.jpg)` where appropriate.
Add Clinical Pearls and exam high-yield notes for key concepts.
"""

    explanation = resilient_generate(prompt=prompt, system_instruction=system_prompt, operation="lecture_explanation")
    return {
        "explanation": explanation,
        "explanation_ar": explanation if language == "ar" else "",
        "explanation_en": explanation if language == "en" else ""
    }

def translate_or_convert_explanation(text: str, target_lang: str = "ar") -> str:
    """Translates medical explanation to Arabic while keeping standard English medical terms."""
    prompt = f"""
قم بترجمة هذا الشرح الطبي إلى لغة عربية علمية سلسة ومتقنة موجهة لطالب طب، مع الحفاظ على جميع المصطلحات الطبية والأسماء التشريحية والأدوية باللغة الإنجليزية بين قوسين:
---
{text[:20000]}
"""
    return resilient_generate(prompt=prompt)

def re_explain_selection(selected_text: str, lecture_title: str, instruction: str = "simplify") -> str:
    """Re-explains a highlighted portion of text in greater depth or with an intuitive analogy."""
    prompt = f"""
A medical student highlighted this specific excerpt from their lecture "{lecture_title}":
"{selected_text}"

Task:
Re-explain this exact concept thoroughly:
1. Explain the underlying mechanism in intuitive, crystal-clear terms.
2. Provide an intuitive clinical or everyday analogy to make it memorable.
3. Show how examiners test this specific concept in MCQ board questions.
Use bilingual presentation (English concept + Arabic intuitive explanation).
"""
    return resilient_generate(prompt=prompt)

def _generate_questions_single_call(lecture_title: str, lecture_text: str, mcq_count: int = 30, case_count: int = 10, existing_questions_summary: str = "", q_type: str = "all", flashcards_summary: str = "", difficulty_style: str = "simple") -> dict:
    avoid_clause = ""
    if existing_questions_summary:
        avoid_clause = f"""
ملاحظة لتجنب التكرار:
لقد تدرب الطالب مسبقاً على أسئلة حول هذه النقاط:
{existing_questions_summary[:2500]}
يرجى تغطية مفاهيم ونقاط أخرى أساسية من المحاضرة مع الحفاظ على البساطة والوضوح الشديد!
إذا تمت تغطية كامل المحاضرة بشكل كافٍ، حدد 'novelty_status' كـ 'approaching_limit'.
"""

    flashcards_clause = ""
    if flashcards_summary:
        flashcards_clause = f"""
ملاحظة بخصوص كروت الفلاش:
الطالب لديه كروت حفظ سريعة للحقائق التالية:
{flashcards_summary[:2500]}
ركز على صياغة أسئلة مباشرة تقيس الفهم والاستيعاب والتطبيق الطبي الواضح لهذه المفاهيم دون تعقيد أو لف ودوران.
"""

    if difficulty_style == "advanced":
        pedagogical_guidelines = """
أسلوب الصياغة المطلوب: متقدم وتحليلي (USMLE / Board Style)
- اختبار القدرة على التشخيص السريري الدقيق والربط الفسيولوجي المتقدم.
"""
    elif difficulty_style == "moderate":
        pedagogical_guidelines = """
أسلوب الصياغة المطلوب: متوازن وتطبيقي (Balanced Clinical Application)
- أسئلة تجمع بين الفهم المفاهيمي المباشر والتطبيق السريري المألوف.
"""
    else: # default: "simple" (مبسط ومباشر - امتحانات كلية الطب)
        pedagogical_guidelines = """
توجيهات حاسمة ومشددة — اجعل الأسئلة بسيطة ومباشرة جداً ومفهومة من أول قراءة (امتحانات كليات الطب):
1. البساطة والوضوح التام (Direct & Accessible):
   - ابتعد تماماً عن اللف والدوران، أو الألغاز المعقدة، أو الأسئلة ذات المراحل الاستنتاجية الثلاثية (3rd-order traps).
   - ركز مباشرة على صلب المحاضرة: التعريفات الرئيسية، الوظائف المحورية، النواقل الأساسية، الأسباب الأكثر شيوعاً (Most common causes)، العرض الإكلينيكي النموذجي (Key classic presentation)، وخط العلاج الأول (First-line).
2. صياغة رأس السؤال (Question Stem):
   - لأسئلة الـ MCQs: اجعل رأس السؤال قصيراً ومباشراً وواضحاً (جملة أو جملتان فقط).
   - للحالات السريرية (Clinical Cases): اجعل السيناريو مختصراً جداً ونموذجياً (2-3 أسطر تعرض الأعراض الكلاسيكية للمريض مباشرة) بدون إدراج قوائم تحاليل معملية طبيعية مشتتة أو تفاصيل لا داعي لها.
3. الخيارات الأربعة (A, B, C, D):
   - 4 خيارات واضحة، الإجابة الصحيحة قاطعة ومؤكدة في سلايدات المحاضرة، والخيارات الأخرى منطقية ولكنها مميزة بوضوح وبدون تلاعب لفظي خبيث.
4. الشرح والتعليل (Explanation):
   - أسلوب مكس طبي مبسط وممتع بالعربية مع كتابة المصطلحات الإنجليزية الطبية، يوضح سبب صحة الإجابة باختصار وسلاسة دون إطالة أكاديمية مرهقة.
"""

    if q_type == "case" or (case_count > 0 and mcq_count == 0):
        actual_case_count = case_count if case_count > 0 else 10
        system_prompt = (
            "You are an expert medical professor creating clear, concise, and accessible Clinical Vignette Cases for medical students. "
            "Your highest priority is CLARITY, SIMPLICITY, and HIGH-YIELD RELEVANCE. "
            "Formulate concise, realistic clinical scenarios (2-3 sentences presenting classic symptoms) without convoluted puzzles or bloat. "
            "Every question must have question_type='case'. "
            "Output ONLY a valid JSON object with 'novelty_status' and 'questions'."
        )
        prompt = f"""
Generate EXACTLY {actual_case_count} Simple & Direct Clinical Vignette Cases for:
Lecture: {lecture_title}

{pedagogical_guidelines}

{avoid_clause}

{flashcards_clause}

{BILINGUAL_MEDICAL_EXPLANATION_GUIDELINES}

Lecture Content:
{lecture_text[:25000]}

Respond ONLY with a JSON object matching this exact schema:
{{
  "novelty_status": "novel", // "novel" or "approaching_limit"
  "questions": [
    {{
      "question_type": "case",
      "case_scenario": "Concise 2-3 sentence classic clinical vignette (e.g. A 48-year-old male presents with acute severe headache, fever, and neck stiffness. Physical exam reveals positive Kernig sign...)",
      "question_text": "Direct clinical question stem (e.g. Which of the following is the most likely diagnosis / initial diagnostic step?)",
      "option_a": "First clear option",
      "option_b": "Second clear option",
      "option_c": "Third clear option",
      "option_d": "Fourth clear option",
      "correct_option": "A",
      "difficulty": "easy", // easy or medium
      "explanation": "Clear, concise medical rationale explaining the correct answer",
      "explanation_arabic": "شرح طبي مكس مبسط وسلس يوضح الإجابة الصحيحة بدون تعقيد مع الحفاظ على المصطلحات الطبية الإنجليزية"
    }}
  ]
}}
"""
    elif q_type in ("mcq", "normal") or (mcq_count > 0 and case_count == 0):
        actual_mcq_count = mcq_count if mcq_count > 0 else 25
        system_prompt = (
            "You are an expert medical professor creating clear, direct, and accessible Multiple-Choice Questions (MCQs) for undergraduate medical exams. "
            "Your highest priority is CLARITY, SIMPLICITY, and testing CORE LECTURE KNOWLEDGE directly without confusing tricks or multi-step traps. "
            "Every question must have question_type='mcq' and case_scenario=''. "
            "Output ONLY a valid JSON object with 'novelty_status' and 'questions'."
        )
        prompt = f"""
Generate EXACTLY {actual_mcq_count} Simple & Direct Standard MCQs for:
Lecture: {lecture_title}

{pedagogical_guidelines}

{avoid_clause}

{flashcards_clause}

{BILINGUAL_MEDICAL_EXPLANATION_GUIDELINES}

Lecture Content:
{lecture_text[:25000]}

Respond ONLY with a JSON object matching this exact schema:
{{
  "novelty_status": "novel", // "novel" or "approaching_limit"
  "questions": [
    {{
      "question_type": "mcq",
      "case_scenario": "",
      "question_text": "Direct, clear question stem (e.g. Which of the following is the main energy substrate for the brain under resting conditions?)",
      "option_a": "First option",
      "option_b": "Second option",
      "option_c": "Third option",
      "option_d": "Fourth option",
      "correct_option": "A",
      "difficulty": "easy", // easy or medium
      "explanation": "Concise medical rationale explaining the correct answer",
      "explanation_arabic": "شرح طبي مكس مبسط وسلس يوضح سبب صحة الإجابة باختصار وسلاسة"
    }}
  ]
}}
"""
    else:
        system_prompt = (
            "You are an expert medical professor creating clear, direct, and accessible exam questions for medical students. "
            "Your highest priority is CLARITY, SIMPLICITY, and testing core lecture concepts directly without convoluted puzzles or traps. "
            "Include both direct MCQs and concise classic Clinical Cases. "
            "Output ONLY a valid JSON object with 'novelty_status' and 'questions'."
        )
        prompt = f"""
Generate {mcq_count} Direct Standard MCQs and {case_count} Concise Clinical Cases for:
Lecture: {lecture_title}

{pedagogical_guidelines}

{avoid_clause}

{flashcards_clause}

{BILINGUAL_MEDICAL_EXPLANATION_GUIDELINES}

Lecture Content:
{lecture_text[:20000]}

Respond ONLY with a JSON object matching this exact schema:
{{
  "novelty_status": "novel", // "novel" or "approaching_limit"
  "questions": [
    {{
      "question_type": "case" or "mcq",
      "case_scenario": "Concise 2-3 sentence classic scenario if case, or empty string if mcq",
      "question_text": "Direct, clear question stem",
      "option_a": "First option",
      "option_b": "Second option",
      "option_c": "Third option",
      "option_d": "Fourth option",
      "correct_option": "A",
      "difficulty": "easy",
      "explanation": "Concise medical rationale explaining the correct answer",
      "explanation_arabic": "شرح طبي مكس مبسط وسلس يوضح الإجابة الصحيحة بدون تعقيد"
    }}
  ]
}}
"""

    raw_json = resilient_generate(prompt=prompt, json_mode=True, system_instruction=system_prompt)
    try:
        cleaned = clean_json_text(raw_json)
        data = json.loads(cleaned)
        return data
    except Exception:
        # Fallback to empty array
        return {"novelty_status": "novel", "questions": []}

def generate_massive_questions(lecture_title: str, lecture_text: str, mcq_count: int = 30, case_count: int = 10, existing_questions_summary: str = "", q_type: str = "all", flashcards_summary: str = "", difficulty_style: str = "simple") -> dict:
    """
    Generates high-yield, student-friendly medical questions based strictly on lecture content.
    Automatically chunks large requests (> 15 questions) into responsive, high-reliability sub-batches
    so requests never timeout, overload the model, or produce truncated JSON.
    Default difficulty_style is 'simple' (direct, clear undergraduate exam questions).
    """
    total_requested = (case_count if q_type == "case" else (mcq_count if q_type in ("mcq", "normal") else (mcq_count + case_count)))
    if total_requested <= 15:
        return _generate_questions_single_call(
            lecture_title=lecture_title,
            lecture_text=lecture_text,
            mcq_count=mcq_count,
            case_count=case_count,
            existing_questions_summary=existing_questions_summary,
            q_type=q_type,
            flashcards_summary=flashcards_summary,
            difficulty_style=difficulty_style
        )

    # For larger requests, divide into manageable chunks (e.g. 10-12 questions each)
    all_questions = []
    current_existing = existing_questions_summary or ""
    overall_novelty = "novel"

    chunks = []
    if q_type == "case":
        rem = case_count if case_count > 0 else 10
        while rem > 0:
            take = min(rem, 10)
            chunks.append(("case", 0, take))
            rem -= take
    elif q_type in ("mcq", "normal"):
        rem = mcq_count if mcq_count > 0 else 25
        while rem > 0:
            take = min(rem, 12)
            chunks.append(("mcq", take, 0))
            rem -= take
    else:
        # Both mcq and case
        rem_cases = case_count if case_count > 0 else 10
        while rem_cases > 0:
            take = min(rem_cases, 10)
            chunks.append(("case", 0, take))
            rem_cases -= take
        rem_mcq = mcq_count if mcq_count > 0 else 30
        while rem_mcq > 0:
            take = min(rem_mcq, 12)
            chunks.append(("mcq", take, 0))
            rem_mcq -= take

    for chunk_type, c_mcq, c_case in chunks:
        try:
            res = _generate_questions_single_call(
                lecture_title=lecture_title,
                lecture_text=lecture_text,
                mcq_count=c_mcq,
                case_count=c_case,
                existing_questions_summary=current_existing,
                q_type=chunk_type,
                flashcards_summary=flashcards_summary,
                difficulty_style=difficulty_style
            )
            qs = res.get("questions", [])
            if qs:
                all_questions.extend(qs)
                if res.get("novelty_status") == "approaching_limit":
                    overall_novelty = "approaching_limit"
                new_stems = [q.get("question_text", "") for q in qs if q.get("question_text")]
                if new_stems:
                    current_existing = (current_existing + "\n" + "\n".join(new_stems))[-2500:]
        except Exception as e:
            print(f"[GEMINI_SERVICE] Sub-batch question generation warning: {e}")
            if all_questions:
                break
            else:
                raise

    return {
        "novelty_status": overall_novelty,
        "questions": all_questions
    }

def generate_exhaustive_flashcards(lecture_title: str, lecture_text: str, count: int = 25, existing_questions_summary: str = "", existing_flashcards_summary: str = "") -> list:
    """Generates an exhaustive deck of active-recall flashcards covering every topic and section of the lecture."""
    system_prompt = (
        "You are an expert medical professor and spaced-repetition (Anki) architect. "
        "Your SOLE purpose is rapid, pure active-recall MEMORIZATION of lecture facts for a medical student.\n"
        "STRICT CARD RULES:\n"
        "1. FRONT: Short, razor-sharp active recall trigger. MAXIMUM 12 WORDS. Never write paragraphs, vignettes, or multiple-choice questions on the front.\n"
        "2. BACK: Precise, crisp answer to memorize (1-2 clear sentences maximum).\n"
        "3. NO CATEGORIES / NO SUBDECKS: Do not tag cards with broad specialties like 'Physiology' or 'Biochemistry'. The card belongs solely to the lecture.\n"
        "4. STRICTLY AVOID QUESTIONS & PREVIOUS CARDS: Flashcards test raw facts/constants/definitions that MCQs do not test.\n"
        "Output ONLY a valid JSON array of objects with 'front' and 'back'."
    )

    questions_separation_clause = ""
    if existing_questions_summary:
        questions_separation_clause = f"""
STRICT SEPARATION FROM EXAM QUESTIONS:
The student already has questions testing these concepts:
{existing_questions_summary[:3500]}
Do NOT formulate flashcards on these exact questions or scenarios! Flashcards must test raw recall facts, definitions, pathways, and numbers that are NOT covered above.
"""

    cards_separation_clause = ""
    if existing_flashcards_summary:
        cards_separation_clause = f"""
STRICT NON-REPETITION OF EXISTING FLASHCARDS:
The following flashcards ALREADY EXIST for this lecture:
{existing_flashcards_summary[:4000]}
You MUST NOT repeat ANY of these facts or triggers. Scan other sections, pages, tables, and details of the lecture text to create completely novel cards!
"""

    prompt = f"""
Generate EXACTLY {count} high-yield MEMORIZATION flashcards strictly for the lecture:
Lecture Title: {lecture_title}

CRITICAL RULES:
- Every card must test ONE specific fact for quick recall.
- FRONT: Short prompt (≤12 words). Direct fact trigger.
- BACK: Direct factual answer.
- DO NOT formulate Multiple Choice Questions.
- DO NOT create long clinical case scenarios.

Examples of GOOD flashcards:
  front: "Primary fuel utilized by the brain under normal fed conditions?"
  back: "Glucose (consumes ~120 g/day, about 20% of resting energy)"

  front: "Which cells in the brain store glycogen?"
  back: "Astrocytes (neurons have negligible glycogen storage)"

  front: "Enzyme converting glutamate to glutamine inside astrocytes?"
  back: "Glutamine synthetase (protects against excitotoxicity and ammonia toxicity)"

{questions_separation_clause}

{cards_separation_clause}

Lecture Content (Full Material):
{lecture_text[:120000]}

Return ONLY a JSON array:
[
  {{
    "front": "Short active-recall trigger (≤12 words)",
    "back": "Direct precise answer to memorize"
  }}
]
"""
    raw_json = resilient_generate(prompt=prompt, json_mode=True, system_instruction=system_prompt)
    try:
        cleaned = clean_json_text(raw_json)
        return json.loads(cleaned)
    except Exception:
        return []

def extract_lecture_comparisons(lecture_title: str, lecture_text: str) -> dict:
    """
    Scans the lecture exhaustively for all high-yield comparisons, differential diagnoses,
    contrasting anatomical pathways, physiological mechanisms, pathology variants, and drug classes.
    Builds clean, high-yield comparative tables with clinical pearls and exam traps.
    """
    system_prompt = (
        "You are an elite Medical Professor, USMLE Director, and Senior Medical Board Examiner. "
        "Your expertise is identifying contrasting concepts and structuring high-yield comparison tables "
        "that help medical students master differences, avoid exam traps, and recall clinical pearls. "
        "Output ONLY a valid JSON object matching the requested schema."
    )

    prompt = f"""
Comprehensive Lecture Content:
Title: {lecture_title}

Text & Slides:
{lecture_text[:35000]}

Task:
Analyze this medical lecture thoroughly and detect ALL major and minor comparisons, contrasting concepts, differential diagnoses, opposing mechanisms, anatomical differences, or pharmacological classes that a medical student must compare.

CRITICAL INSTRUCTION - STRICT MEDICAL TERMINOLOGY (NO ARABIZATION OF MEDICAL / ANATOMICAL TERMS):
- All muscle names, nerve names, arteries, veins, receptors, organs, and anatomical terms MUST REMAIN IN PROPER MEDICAL ENGLISH (Latin/English names).
- ⚠️ NEVER translate muscle names to Arabic under any circumstances! (e.g. NEVER write "العضلة الدائرية العينية", write "Orbicularis Oculi". NEVER write "العضلة الماضغة", write "Masseter". NEVER write "الجزء الحجاجي", write "Orbital portion". NEVER write "الجفني", write "Palpebral portion").
- "title_en" must be the definitive Medical English title (e.g. "Orbicularis Oculi: Orbital Portion vs Palpebral Portion").
- "title_ar" must also preserve the English muscle and anatomical names, without literal translation.
- Explanations, pearls, and summaries should use high-level bilingual medical style (Egyptian medical student register: Arabic explanation embedding proper English medical terminology).

Return ONLY a JSON object with this exact structure:
{{
  "has_comparisons": true,
  "lecture_title": "{lecture_title}",
  "overview": "مقدمة علمية موجزة (2-3 أسطر) بالعربية تشرح أهمية هذه المقارنات في فهم المحاضرة وتجاوز فخاخ الامتحانات.",
  "comparisons": [
    {{
      "id": 1,
      "title_en": "Orbicularis Oculi: Orbital Portion vs Palpebral Portion",
      "title_ar": "Orbicularis Oculi: Orbital Portion vs Palpebral Portion",
      "importance": "High-Yield", // High-Yield or Essential or Exam Classic
      "summary": "ملخص علمي دقيق بالعربية للمقارنة مع الحفاظ التام على الأسماء الطبية بالإنجليزية",
      "entities": ["Orbital Portion", "Palpebral Portion"],
      "table": [
        {{
          "aspect": "معيار المقارنة (Feature / Aspect e.g. Origin, Insertion, Action, Nerve Supply)",
          "values": ["قيمة المفهوم A", "قيمة المفهوم B"]
        }}
      ],
      "high_yield_pearl": "درة سريرية ذهبية (Clinical Pearl) باللغة العربية مع المصطلحات الإنجليزية للمساعدة في التشخيص الفارق السريع.",
      "mcq_trap": "فخ امتحاني (Exam Pitfall / MCQ Trap): كيف يصيغ أستاذ المادة أسئلة MCQs للإيقاع بالطالب بين هذين المفهومين.",
      "mnemonic": "وسيلة تذكر أو اختصار ذكي (Mnemonic) لتثبيت الفروقات بشكل قاطع."
    }}
  ]
}}
"""
    raw_json = resilient_generate(prompt=prompt, json_mode=True, system_instruction=system_prompt)
    try:
        cleaned = clean_json_text(raw_json)
        data = json.loads(cleaned)
        return data
    except Exception as e:
        print(f"Error parsing comparisons JSON: {e}")
        return {
            "has_comparisons": False,
            "lecture_title": lecture_title,
            "overview": "تعذر استخراج المقارنات بشكل آلي.",
            "comparisons": []
        }

def extract_lecture_numbers(lecture_title: str, lecture_text: str) -> dict:
    """
    Exhaustively scans the medical lecture for ALL numerical facts, measurements, ranges,
    laboratory cutoffs, pharmacological dosages, vertebral & anatomical levels, percentages,
    durations, and clinical scoring thresholds.
    Structures them by category and formats them for immediate review, PDF export, and flashcards.
    """
    system_prompt = (
        "You are an elite Medical Professor, Chief USMLE Examiner, and Clinical Expert in Medical Constants & Biometrics. "
        "Your expertise is extracting, organizing, and clarifying every single numerical constant, cutoff, dimension, "
        "vertebral level, dosage, percentage, and time frame in medical lectures. "
        "Output ONLY a valid JSON object matching the requested schema."
    )

    prompt = f"""
Comprehensive Lecture Content:
Title: {lecture_title}

Text & Slides:
{lecture_text[:50000]}

Task:
Extract EVERY SINGLE numerical fact, measurement, laboratory normal, critical cutoff, vertebral/anatomical level, pharmacological dosage/window, percentage/ratio, and duration mentioned in or relevant to this lecture.

CRITICAL RULES:
1. EXHAUSTIVE EXTRACTION: Do not leave out any numbers (e.g., measurements in cm/mm, angles in degrees, normal values, percentages, staging cutoffs, vertebral levels like C6, T4, L1-L2, time frames in hours/days/weeks).
2. ACCURACY & CONTEXT: Pair each number with its exact organ, structure, condition, or drug.
3. MEDICAL BILINGUAL STYLE: Keep English medical terms exact (Latin/English anatomical & pharmacological names). Provide Arabic explanations that embed the English medical terminology fluently.
4. FLASHCARD READINESS: For every item, formulate a crisp 'flashcard_front' (question prompt) and 'flashcard_back' (direct numerical answer with context) optimized for active-recall memorization.

Organize items into these clinical categories (only include categories that have items):
- "المستويات التشريحية والفقرية والأبعاد (Anatomical Levels & Dimensions)"
- "المعدلات الطبيعية والتحاليل المخبرية (Normal Values & Lab Ranges)"
- "النسب المئوية والإحصائيات الوبائية (Percentages & Epidemiology)"
- "الجرعات والأدوية والنوافذ العلاجية (Dosages & Pharm Kinetics)"
- "الأزمنة والفترات الحرجة (Time Windows & Durations)"
- "مقاييس التقييم والدرجات السريرية (Scores & Clinical Cutoffs)"
- "ثوابت وحقائق رقمية هامة (Other High-Yield Numerical Facts)"

Return ONLY a JSON object matching this schema:
{{
  "lecture_title": "{lecture_title}",
  "total_numbers_found": 15,
  "summary_arabic": "ملخص شامل ومكثف بالعربية لأهم الأرقام والثوابت في هذه المحاضرة وفخاخ الامتحانات المرتبطة بها.",
  "categories": [
    {{
      "category_name": "اسم الفئة بالعربية والإنجليزية",
      "items": [
        {{
          "value": "الرقم أو المدى مع الوحدة (e.g. 25 cm, 3.5 - 5.0 mEq/L, T4-T5, 80%, 4.5 hours)",
          "concept": "اسم المفهوم أو التركيب بالإنجليزية (e.g. Length of Duodenum, Tracheal Bifurcation)",
          "unit_or_type": "نوع القيمة أو الوحدة (e.g. Length, Vertebral Level, Concentration, Time Window)",
          "context": "سياق الرقم وموقعه في المحاضرة بالعربية المطعمة بالمصطلحات الطبية",
          "clinical_significance": "الأهمية السريرية وامتحانات الـ MCQs (لماذا يسأل الممتحن عن هذا الرقم؟ وماذا يحدث إذا زاد أو نقص؟)",
          "flashcard_front": "سؤال كرت الفلاش السريع (e.g. ما هو طول الـ Duodenum بالسنتيمتر؟ / At what vertebral level does the trachea bifurcate?)",
          "flashcard_back": "إجابة كرت الفلاش الدقيقة مع التعليل المختصر (e.g. 25 cm (about 10 inches) / T4 - T5 at the Sternal Angle of Louis)"
        }}
      ]
    }}
  ]
}}
"""
    raw_json = resilient_generate(prompt=prompt, json_mode=True, system_instruction=system_prompt)
    try:
        cleaned = clean_json_text(raw_json)
        data = json.loads(cleaned)
        return data
    except Exception as e:
        print(f"[GEMINI_SERVICE] extract_lecture_numbers error: {e}")
        return {"lecture_title": lecture_title, "total_numbers_found": 0, "categories": [], "summary_arabic": ""}

def parse_syllabus_or_schedule(schedule_text: str = "", file_bytes: bytes = None, mime_type: str = "") -> dict:
    """
    Parses a syllabus, timetable, course schedule, or lecture list from text, PDF, or image.
    Extracts all lectures with accurate titles, subjects, original dates (if any), and sequential ordering.
    """
    system_prompt = (
        "You are an expert Academic Medical Registrar and Curriculum Coordinator. "
        "Your job is to parse university medical schedules, timetables, and syllabi from text, tables, images, or PDFs. "
        "Extract every single lecture accurately, identify its medical subject (Anatomy, Physiology, Biochemistry, Pathology, Pharmacology, etc.), "
        "assign correct sequential lecture numbers, and maintain the exact order from the schedule. "
        "Output ONLY a valid JSON object matching the requested schema."
    )

    prompt = """
Extract all lectures from the provided timetable / schedule / syllabus document or text.

STRICT INSTRUCTIONS:
1. 🚫 STRICTLY EXCLUDE ALL VERTICAL INTEGRATION (الفيرتيكال):
   - Exclude any lecture related to Vertical Integration (VI), Ethics, Professionalism, Communication Skills, Patient Safety, Research Methodology, or Behavioral Sciences.
   - Do NOT include Vertical lectures in the output list at all!
2. 🚫 NEVER COMBINE MULTIPLE LECTURES (No 'Anatomy 1,2' or 'Physio 1 & 2'):
   - Every single lecture MUST be a separate, independent entry in the list!
   - If a slot on the timetable says 'Anatomy 1,2' or 'Anatomy 1 & 2' or 'Anatomy 1-2', you MUST split it into TWO separate lecture objects:
     Object A: "Anatomy 1"
     Object B: "Anatomy 2"
   - Each separate lecture must have its own unique sequential lecture_number and clear title.
3. Maintain the EXACT chronological/syllabus order from the table.
4. Clean and standardize the lecture titles in proper Medical English and provide an Arabic descriptive title.
5. Categorize each lecture by its medical department/subject:
   (e.g., 'Anatomy & Embryology', 'Physiology', 'Histology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Microbiology', 'Parasitology', 'General Medicine').
6. If dates or days are written in the schedule, extract them in 'original_date_str' (e.g. 'Week 1 Day 2', '2026-10-05', etc.).
7. Estimate page count / weight (typically 10-15 pages per lecture unless specified).

Return ONLY a JSON object matching this schema:
{
  "block_name_detected": "Name of block/course if detected (e.g. CNS, CVS, Renal, etc.)",
  "total_lectures_detected": 15,
  "lectures": [
    {
      "lecture_number": 1,
      "title": "Clear English Lecture Title (e.g. Anatomy 1 or Internal Anatomy of the Brainstem)",
      "title_arabic": "عنوان المحاضرة بالعربية",
      "subject": "Medical Subject (e.g. Anatomy & Embryology)",
      "original_date_str": "Original date/day from schedule if present, else empty string",
      "estimated_pages": 12,
      "difficulty": 2
    }
  ]
}
"""
    if file_bytes and mime_type:
        from google.genai import types
        part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
        contents = [prompt, part]
        if schedule_text:
            contents.append(f"\nAdditional Context / Text:\n{schedule_text}")
        raw_json = resilient_generate(prompt=prompt, contents=contents, json_mode=True, system_instruction=system_prompt)
    else:
        full_prompt = f"{prompt}\n\nSchedule / Syllabus Content:\n{schedule_text[:40000]}"
        raw_json = resilient_generate(prompt=full_prompt, json_mode=True, system_instruction=system_prompt)

    try:
        cleaned = clean_json_text(raw_json)
        parsed = json.loads(cleaned)
        import syllabus_schedule_service
        if "lectures" in parsed and isinstance(parsed["lectures"], list):
            parsed["lectures"] = syllabus_schedule_service.clean_and_split_syllabus_lectures(parsed["lectures"])
            parsed["total_lectures_detected"] = len(parsed["lectures"])
        return parsed
    except Exception as e:
        print(f"[GEMINI_SERVICE] parse_syllabus_or_schedule error: {e}")
        return {"block_name_detected": "", "total_lectures_detected": 0, "lectures": []}

def sanitize_transcript_english_terms(transcript_text: str) -> str:
    """
    Detects any medical or English words/terms that were transcribed phonetically using Arabic letters
    (التعريب الصوتي أو الفرانكو بالعربي مثل: 'كورونيك جلوميرال نفريتس', 'اديما', 'موست كومن كوز', 'سيرفيكال ميتومز')
    and converts them into their proper, standard English medical terms (Latin script) while preserving
    exact [MM:SS] timestamps and natural Egyptian/Arabic conversational context.
    """
    if not transcript_text or len(transcript_text.strip()) < 10:
        return transcript_text

    system_prompt = (
        "You are an expert Medical Transcriptionist and Bilingual Medical Editor. "
        "Egyptian medical professors often speak in Arabic while pronouncing English medical terms. "
        "Audio transcribers mistakenly write these English words in Arabic letters (e.g. 'كورونيك جلوميرال نفريتس', 'اديما', 'موست كومن كوز'). "
        "Your task is to fix this by replacing all phonetically Arabized English words and medical phrases "
        "with their correct, professionally spelled English (Latin alphabet) medical terms. "
        "Do NOT change [MM:SS] timestamps. Do NOT translate actual Arabic speech into English. "
        "Only replace the phonetic English words with their true English spelling."
    )

    prompt = f"""
النص التالي هو تفريغ تسجيل صوتي لمحاضرة طبية ألقاها دكتور مصري:
فيه مشكلة شائعة: أن بعض المصطلحات والكلمات الإنجليزية كُتبت بالخطأ بحروف عربية صوتية (تعريب صوتي / فرانكو معرب).

أمثلة على التصحيحات المطلوبة:
- "كورونيك جلوميرال نفريتس" -> "Chronic Glomerulonephritis"
- "رابت جلوميرال نفريتس" -> "Rapidly Progressive Glomerulonephritis"
- "موست كومن كوز" -> "most common cause"
- "اديما" -> "Edema"
- "بروتين يوريا" -> "Proteinuria"
- "اوليجوريا" -> "Oliguria"
- "سيرفيكال ميتومز" -> "Cervical myotomes"
- "ميزوديرم" -> "Mesoderm"
- "الاندوديرم والاكتوديرم" -> "Endoderm & Ectoderm"
- "الفيشال بروسس" -> "Facial process"
- "الفرونتال بروسس" -> "Frontal process"
- "السيستم ترانسفيرسون" -> "Septum transversum"
- "الباثولوجي" -> "Pathology"
- "انفاركشن" -> "Infarction"
- "استروك" -> "Stroke"
- "ريسبتور" -> "Receptor"
- "نيرف" -> "Nerve"

المطلوب:
أعد كتابة التفريغ كاملاً مع:
1. الإبقاء على التوقيتات [MM:SS] كما هي بدقة في أماكنها.
2. الإبقاء على الكلام العربي العادي والشرح بالعامية المصرية كما هو دون ترجمته.
3. تحويل أي كلمة أو مصطلح طبي أو علمي أو إنجليزي كُتب بحروف عربية إلى الإنجليزية الأصلية بحروف لاتينية صحيحة إملائياً.

نص التفريغ المراد تصحيحه:
---
{transcript_text[:25000]}
---
"""
    return resilient_generate(prompt=prompt, system_instruction=system_prompt)

AUDIO_MODEL_PREFERENCES = [
    "gemini-flash-latest",
    "gemini-3.7-flash",
    "gemini-3-flash-preview",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite"
]

def transcribe_with_timestamps(audio_path: str) -> dict:
    """Transcribes audio with precise time markers [MM:SS] and strictly writes all medical/English terms in proper English script."""
    client = get_gemini_client()
    uploaded_file = client.files.upload(file=audio_path)

    # Wait for large audio files to become ACTIVE in Gemini Files API
    max_wait = 90
    waited = 0
    while getattr(uploaded_file, 'state', None) and uploaded_file.state.name == "PROCESSING" and waited < max_wait:
        time.sleep(2.0)
        waited += 2
        try:
            uploaded_file = client.files.get(name=uploaded_file.name)
        except Exception:
            break

    if getattr(uploaded_file, 'state', None) and uploaded_file.state.name == "FAILED":
        raise RuntimeError(f"Gemini file processing failed for {audio_path}")

    prompt = """
أنت طبيب ومفرغ محاضرات طبية محترف ودقيق للغاية. مهمتك تفريغ هذا التسجيل الصوتي الطبي بأعلى درجات الدقة والاحترافية.

قواعد حاسمة وإلزامية (التفريغ الحرفي الصارم مع التنظيم الأكاديمي الممتاز):

1. ⚠️ التفريغ الحرفي التام دون أي تحريف أو تغيير أو تلخيص (Strict Verbatim Transcription):
   - اكتب كل كلمة قالها المحاضر نصاً وحرفاً كما نطق بها بالتمام والكمال، دون أي اختصار أو حذف أو استبدال أو إعادة صياغة.
   - احتفظ بأسلوب المحاضر، كلامه العامي والشرح المصري، تعبيراته، وقفشاته، وتوضيحاته الحرفية "زي ما هي بالظبط" دون تغيير.
   - ⚠️ ممنوع منعاً باتاً تلخيص الأفكار أو كتابة ملخص أو استبدال كلام الدكتور بصياغة من عندك؛ مهمتك نقل ما نطق به كلمة بكلمة.

2. التنظيم والتبويب المتناسق (الهيكل الأكاديمي المعتمد):
   - ابدأ بـ Header رئيسي:
     # [Subject / Module] - Lecture: [اسم المحاضرة والموضوع]
     **المحاضر:** د. [اسم المحاضر إن ذُكر في بداية أو سياق الريكورد]
   - قسّم التفريغ إلى عناوين رئيسية وفرعية واضحة تتبع تسلسل الشرح:
     ### [MM:SS] العنوان الرئيسي (English Term)
     #### 1. العنوان الفرعي...
   - ضع التوقيت الزمني الدقيق [MM:SS] قبل بداية كل فكرة أو فقرة جديدة ليتمكن الطالب من الضغط عليها والاستماع إليها فوراً.
   - عندما يركز الدكتور على نقطة ويقول "دي مهمة للامتحان" أو يذكر أرقاماً ونسباً هامة، أبرزها في صندوق تنبيه منسق:
     > ⚠️ **ملاحظة هامة للامتحان:** [النص الحرفي لما قاله الدكتور عن الامتحان والأرقام]
   - التعريفات الطبية توضع بتنسيق اقتباس:
     > "Exact definition in English..."

3. ⚠️ حظر التعريب الصوتي للكلمات الإنجليزية:
   - يُمنع منعاً باتاً كتابة الكلمات والمصطلحات الطبية بحروف عربية (ممنوع: "اديما", "موست كومن كوز", "سيرفيكال", "نفريتس").
   - كل مصطلح طبي، اسم تشريحي، اسم عضلة، عظمة، عصب، شريان، دواء، أو تعبير إنجليزي نطقه الدكتور يُكتب بحروف إنجليزية قياسية (Latin Alphabet) سليمة إملائياً ومميزة بـ **Bold** مثل:
     **Cerebral Circulation**, **CBF**, **Chronic Glomerulonephritis**, **Edema**, **Action potential**.
"""
    last_error = None
    for model in AUDIO_MODEL_PREFERENCES:
        try:
            res = client.models.generate_content(
                model=model,
                contents=[uploaded_file, prompt]
            )
            if res and res.text:
                raw_text = res.text.strip()
                try:
                    meta = getattr(res, 'usage_metadata', None)
                    p_tokens = getattr(meta, 'prompt_token_count', 0) or 0
                    c_tokens = getattr(meta, 'candidates_token_count', 0) or 0
                    t_tokens = getattr(meta, 'total_token_count', 0) or (p_tokens + c_tokens)
                    if t_tokens == 0:
                        p_tokens = 2500
                        c_tokens = max(1, len(raw_text) // 4)
                        t_tokens = p_tokens + c_tokens
                    log_token_usage(model, p_tokens, c_tokens, t_tokens, "audio_transcription")
                except Exception as ex:
                    print(f"[GEMINI_SERVICE] Audio token tracking warning: {ex}")
                # Basic sanity check to avoid corrupted / empty loops
                if len(raw_text) > 100:
                    return {
                        "transcript_with_timestamps": raw_text,
                        "audio_filename": os.path.basename(audio_path)
                    }
        except Exception as e:
            last_error = e
            time.sleep(1.5)
            continue
    raise RuntimeError(f"Audio timestamp transcription failed: {last_error}")

def compare_audio_with_slides(transcript_text: str, slides_text: str) -> str:
    """
    'Doctor Delta Extractor': Compares the doctor's spoken recording against the PDF lecture slides
    and isolates every single extra detail, clinical story, or exam tip that was NOT written in the slides!
    """
    prompt = f"""
قارن بدقة بين تفريغ ما قاله الدكتور في التسجيل الصوتي وبين النص المكتوب في شرائح المحاضرة (PDF Slides):

--- نص ما قاله الدكتور في الريكورد ---
{transcript_text[:12000]}

--- نص شرائح المحاضرة المكتوب في الـ PDF ---
{slides_text[:12000]}

المطلوب إعداد تقرير طبي مقارن ومنظم جداً (Doctor Delta Report) يتضمن:
1. ⭐ إضافات الدكتور الحصرية (معلومات طبية وشروحات ذكرها في التسجيل الصوتي ولم تكن مكتوبة إطلاقاً في السلايدات).
2. 🎯 تلميحات وأسئلة الامتحانات (أي سؤال أو فكرة قال الدكتور "دي بتيجي في الامتحان" أو ركز عليها أثناء كلامه).
3. 🩺 الحالات الإكلينيكية والقصص السريرية (أمثلة من خبرته ذكرها لتوضيح الفكرة).
4. ⚠️ اختلافات أو تصويبات (هل صوب الدكتور معلومة أو رقم كان خاطئاً في السلايدات؟).
"""
    return resilient_generate(prompt=prompt)

def match_past_questions_with_syllabus(questions_text: str, lectures_list: list) -> list:
    """
    Matches raw exam questions against the 67 neuroscience lectures, determining syllabus fit
    and mapping each question to its corresponding lecture.
    """
    prompt = f"""
Here is a collection of past examination questions:
---
{questions_text[:15000]}
---

Target Neuroscience Syllabus Lectures (ID and Title):
{json.dumps(lectures_list, ensure_ascii=False)}

Task:
Read every question, check if it fits within this neuroscience syllabus, and map it to the EXACT matching lecture ID.
Output ONLY a JSON array of matched questions:
[
  {{
    "lecture_id": 1, // integer ID from the target list
    "matched_lecture_title": "exact lecture title",
    "question_text": "Statement of question",
    "option_a": "Option A",
    "option_b": "Option B",
    "option_c": "Option C",
    "option_d": "Option D",
    "correct_option": "A",
    "explanation": "Explanation in Arabic and English"
  }}
]
"""
    raw_json = resilient_generate(prompt=prompt, json_mode=True)
    try:
        cleaned = clean_json_text(raw_json)
        return json.loads(cleaned)
    except Exception:
        return []

# ----------------- SMART LECTURE REVIEW & WEAKNESS DRILL SERVICE -----------------
def generate_smart_lecture_weakness_review(lecture_title: str, lecture_text: str, mistake_questions: list = None, struggle_cards: list = None) -> dict:
    """
    Analyzes the student's previous mistakes and failed flashcards for this specific lecture,
    extracts the core underlying weak concepts, and writes a comprehensive, highly targeted
    review module explaining the lecture with deep-dive focus on those exact weak spots.
    """
    mistakes_summary = ""
    if mistake_questions and len(mistake_questions) > 0:
        mistakes_summary = "PREVIOUS QUESTIONS FAILED BY THE STUDENT:\n"
        for i, q in enumerate(mistake_questions[:15], 1):
            mistakes_summary += f"{i}. Question: {q.get('question_text')}\n   Correct Option: {q.get('correct_option')} | Explanation: {q.get('explanation') or q.get('explanation_arabic')}\n"

    cards_summary = ""
    if struggle_cards and len(struggle_cards) > 0:
        cards_summary = "\nFLASHCARDS THE STUDENT STRUGGLED WITH / RATED 'AGAIN':\n"
        for i, c in enumerate(struggle_cards[:15], 1):
            cards_summary += f"{i}. Front: {c.get('front')} -> Back: {c.get('back')}\n"

    system_prompt = (
        "You are an elite Medical Professor and Cognitive Learning Expert. "
        "Your mission is to formulate a high-yield, personalized SMART REVIEW for this medical lecture, with targeted focus "
        "on the student's exact areas of confusion and past exam mistakes.\n\n"
        "STRICT MANDATE: You must anchor 100% of your explanations, summaries, and weak point reviews WITHIN the provided lecture text/slides. "
        "Do NOT introduce external modules, unmentioned clinical diseases, or outside textbook filler."
    )

    prompt = f"""
Lecture Title: {lecture_title}

{mistakes_summary}
{cards_summary}

Full Lecture Text / Slides (STRICT BOUNDARY - Explain only what is in these slides):
==================================================
{lecture_text[:100000] if lecture_text else ''}
==================================================

Task:
Analyze the student's learning profile strictly based on this lecture and return a JSON object with:
1. "identified_weak_points": Array of 3 to 6 specific medical concepts/mechanisms from the lecture where the student struggled, with brief root cause.
2. "weakness_deep_dive_arabic": Comprehensive, crystal-clear Arabic explanation specifically dissecting each weak point from the lecture slides, explaining WHY the mistake happens, and how to master it without confusion.
3. "high_yield_summary_arabic": Comprehensive, structured summary of the entire lecture slide-by-slide in clear, engaging Arabic with English medical terms.
4. "exam_traps_and_pitfalls": 3 to 5 common board exam traps for this lecture that examiners use to trick students.

Output ONLY a valid JSON object matching this schema:
{{
  "identified_weak_points": [
    {{
      "concept": "Name of concept",
      "issue": "Brief explanation of where confusion arose"
    }}
  ],
  "weakness_deep_dive_arabic": "Detailed Arabic explanation with markdown headings (###) focusing on the weak points...",
  "high_yield_summary_arabic": "Detailed Arabic lecture review...",
  "exam_traps_and_pitfalls": [
    "Trap 1: ...",
    "Trap 2: ..."
  ]
}}
"""
    raw_json = resilient_generate(prompt=prompt, system_instruction=system_prompt, json_mode=True)
    try:
        cleaned = clean_json_text(raw_json)
        return json.loads(cleaned)
    except Exception as e:
        return {
            "identified_weak_points": [{"concept": "مراجعة المحاضرة العامة", "issue": "تثبيت المفاهيم والمصطلحات"}],
            "weakness_deep_dive_arabic": "يرجى مراجعة النقاط الأساسية وأسئلة الامتحانات السابقة.",
            "high_yield_summary_arabic": "ملخص شامل للمحاضرة ومفاهيمها السريرية.",
            "exam_traps_and_pitfalls": ["انتبه للفروق بين المتلازمات السريرية المتشابهة."]
        }

def generate_weakness_targeted_questions(lecture_title: str, lecture_text: str, weak_concepts: list = None, count: int = 20) -> list:
    """
    Generates targeted MCQs and clinical cases specifically drilling into the identified weak spots.
    """
    weak_str = ""
    if weak_concepts:
        weak_str = "CORE CONCEPTS TO TARGET (STUDENT'S KNOWN WEAK SPOTS):\n" + "\n".join([f"- {c}" for c in weak_concepts[:8]])

    prompt = f"""
Generate EXACTLY {count} high-yield medical board questions (mix of Clinical Cases and direct MCQs) targeting:
Lecture: {lecture_title}

{weak_str}

Lecture Content Excerpt:
{lecture_text[:22000]}

Requirements:
- Emphasize and drill the concepts listed above.
- Formulate realistic clinical vignettes (question_type='case') and high-yield MCQs (question_type='mcq').
- Include detailed Arabic & English explanations.

Output ONLY a JSON array of questions:
[
  {{
    "question_type": "case", // or "mcq"
    "case_scenario": "Clinical vignette if case, or empty string",
    "question_text": "Question stem",
    "option_a": "A",
    "option_b": "B",
    "option_c": "C",
    "option_d": "D",
    "correct_option": "A",
    "difficulty": "medium",
    "explanation": "English explanation",
    "explanation_arabic": "شرح طبي تفصيلي بالعربية"
  }}
]
"""
    raw = resilient_generate(prompt=prompt, json_mode=True)
    try:
        cleaned = clean_json_text(raw)
        return json.loads(cleaned)
    except Exception:
        return []

def generate_weakness_targeted_flashcards(lecture_title: str, weak_concepts: list = None, count: int = 15) -> list:
    """
    Generates high-yield active-recall flashcards focused on cementing the student's weak spots.
    """
    weak_str = ""
    if weak_concepts:
        weak_str = "WEAK CONCEPTS TO CEMENT:\n" + "\n".join([f"- {c}" for c in weak_concepts[:8]])

    prompt = f"""
Generate EXACTLY {count} high-yield active-recall flashcards for:
Lecture: {lecture_title}

{weak_str}

Requirements:
- Front: Crisp, challenging question or clinical prompt forcing active retrieval.
- Back: Concise, bulleted high-yield answer with key mechanism or clinical takeaway.
- Subdeck: specific sub-topic name.

Output ONLY a JSON array:
[
  {{
    "front": "Question / Prompt",
    "back": "Answer & high-yield takeaway",
    "subdeck": "Targeted Retention"
  }}
]
"""
    raw = resilient_generate(prompt=prompt, json_mode=True)
    try:
        cleaned = clean_json_text(raw)
        return json.loads(cleaned)
    except Exception:
        return []

def generate_lecture_mock_exam(lecture_title: str, lecture_text: str, mcq_count: int = 100, essay_count: int = 10, weak_concepts: list = None) -> dict:
    """
    Generates a comprehensive final mock exam for the lecture:
    - Standard MCQs & Clinical Cases (e.g. up to 100 questions).
    - 10 Short-Answer / Essay Questions with model answers and scoring rubrics.
    """
    weak_str = ""
    if weak_concepts:
        weak_str = "Ensure heavy representation of these previously troublesome concepts:\n" + "\n".join([f"- {c}" for c in weak_concepts[:8]])

    # Because 100 MCQs + 10 Essays is very large for a single LLM request,
    # we generate in high-density batches: 35-50 high-impact MCQs/cases in this primary call
    # (or up to requested), plus the EXACT 10 Essay questions with model answers.
    actual_mcq_batch = min(mcq_count, 35)

    prompt = f"""
You are the Head of Medical Examinations. Create a Comprehensive Mastery Mock Exam for:
Lecture: {lecture_title}

{weak_str}

Lecture Material:
{lecture_text[:22000]}

Generate:
1. "mcq_questions": Exactly {actual_mcq_batch} comprehensive exam questions (mix of Clinical Cases and MCQs).
2. "essay_questions": Exactly {essay_count} Short-Answer / Clinical Essay Questions testing deep understanding, anatomical pathways, differentials, or management.
   Each essay question MUST include:
   - "question_number": int
   - "question_text": Detailed essay prompt in clear medical English with Arabic subtitle
   - "clinical_context": Brief context or clinical scenario
   - "ideal_model_answer": Comprehensive textbook model answer
   - "key_points_to_mention": Array of 3-5 mandatory points or keywords for full credit
   - "max_score": 1.0

Output ONLY a JSON object:
{{
  "mcq_questions": [
    {{
      "question_type": "case",
      "case_scenario": "Scenario...",
      "question_text": "Question...",
      "option_a": "A",
      "option_b": "B",
      "option_c": "C",
      "option_d": "D",
      "correct_option": "A",
      "explanation_arabic": "التعليل..."
    }}
  ],
  "essay_questions": [
    {{
      "question_number": 1,
      "question_text": "Describe the anatomical course of...",
      "clinical_context": "Clinical vignette context...",
      "ideal_model_answer": "Full textbook answer...",
      "key_points_to_mention": ["Point 1", "Point 2", "Point 3"],
      "max_score": 1.0
    }}
  ]
}}
"""
    raw = resilient_generate(prompt=prompt, json_mode=True)
    try:
        cleaned = clean_json_text(raw)
        return json.loads(cleaned)
    except Exception as e:
        return {"mcq_questions": [], "essay_questions": []}

def refine_question_with_ai(question: dict, instruction: str, context: str = "") -> dict:
    """
    Takes an existing question object and refines/improves/simplifies it based on student feedback/instruction.
    Maintains strict Medical English for medical terms and clear Arabic explanations.
    """
    prompt = f"""
أنت بروفيسور وممتحن طبي جامعي متخصص في صياغة أسئلة كليات الطب المباشرة والواضحة.
لديك السؤال الطبي التالي:
{json.dumps(question, ensure_ascii=False, indent=2)}

تعليمات وتوجيهات الطالب لتحسين وتعديل السؤال:
\"{instruction}\"

السياق الإضافي أو المحاضرة:
\"{context}\"

المطلوب:
أعد صياغة وتحسين السؤال بدقة بحسب توجيهات الطالب.
قاعدة التبسيط الذهبية: إذا كان التوجيه هو التبسيط أو إزالة التعقيد، احذف فوراً أي لف ودوران أو ألغاز مشتتة، واجعل رأس السؤال قصيراً ومباشراً وواضحاً ومفهوماً من أول قراءة، واجعل الخيارات الأربعة واضحة وحاسمة بدون خيارات خادعة، واجعل الشرح ممتعاً وموجزاً ومقنعاً.

{BILINGUAL_MEDICAL_EXPLANATION_GUIDELINES}

قواعد الإخراج:
1. المصطلحات الطبية والتشريحية (عظام، عضلات، أعصاب، شرايين، أمراض): تُكتب دائماً بالإنجليزية الطبية الدقيقة (مثل Skull bones, Occipital bone, Sternocleidomastoid, Facial nerve CN VII) وممنوع تعريبها نهائياً.
2. الشرح والتعليل (explanation): أسلوب مكس طبي مبسط وممتع (عربي مع مصطلحات إنجليزية طبية حصرية) يوضح سبب صحة الإجابة ولماذا باقي الخيارات تختلف دون إطالة مرهقة.
3. لكل سؤال 4 خيارات A, B, C, D، مع تحديد correct_option بحرف واحد (A, B, C, D).
4. أعد النتيجة ككائن JSON واحد فقط كالتالي:
{{
  "question_type": "{question.get('question_type', 'mcq')}",
  "case_scenario": "سيناريو سريري قصير ومباشر (أو نص فارغ إذا كان mcq)",
  "question_text": "سؤال واضح ومباشر جداً...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_option": "A",
  "explanation": "شرح طبي مكس مبسط وسلس ومباشر...",
  "difficulty": "easy"
}}
"""
    raw = resilient_generate(prompt=prompt, json_mode=True)
    try:
        cleaned = clean_json_text(raw)
        data = json.loads(cleaned)
        if isinstance(data, list) and len(data) > 0:
            data = data[0]
        return data
    except Exception as e:
        print(f"Error refining question: {e}")
        return question


