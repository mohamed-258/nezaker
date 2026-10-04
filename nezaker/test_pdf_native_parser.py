import sys
sys.path.insert(0, r'c:\Users\shawk\Desktop\نذاكر')
import fitz
import re

pdf_path = r'c:\Users\shawk\Desktop\CNS Mid MCQs (Answered).pdf'
doc = fitz.open(pdf_path)

# Regex patterns
q_start_pattern = re.compile(r'^\s*(\d+)[\.\-\)]\s*(.+)$')
opt_start_pattern = re.compile(r'^\s*([A-Ea-e])[\.\-\)]\s*(.+)$')
formative_marker = re.compile(
    r'(?:Formatives?\s*(?:&|and|\+)?\s*Previous\s*Exams?|Formatives?|Previous\s*Exams?|الفورماتيف|امتحانات\s*سابقة)',
    re.IGNORECASE
)

# Known list of lectures from Index (normalized for fuzzy/exact match)
known_lectures = [
    'Scalp, face and muscles of the head',
    'Muscles of the neck',
    'Nerves of head & neck I, II',
    'Blood supply & lymphatic drainage of the head & neck',
    'Contents of the orbit',
    'Anatomy of the ear',
    'Development of head and neck',
    'Brainstem',
    'Histological structure of Neuron, Synapse, Neuroglial Cells',
    'Central Nervous system',
    'Histological structure of cerebral and cerebellar cortex',
    'Cerebral Circulation and CSF Fluid',
    'Basic functions of synapses and neurotransmitters I',
    'Basic functions of synapses and neurotransmitters II',
    'Somatosensory function',
    'Pain I',
    'Pain II',
    'Stretch Reflex I & II',
    'Protozoa causing CNS diseases I',
    'Brain metabolism',
    'CNS Infection',
    'Antidepressant drugs',
    'Local Anesthetics'
]

def clean_text(t):
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', t).strip()

lectures_data = []
current_lecture = {"name": known_lectures[0], "questions": []}
current_section = "regular"

total_pages = len(doc)
start_page_idx = 3 # Page 4

for p_idx in range(start_page_idx, total_pages):
    page = doc[p_idx]
    
    # 1. Get all highlight annotation bounding boxes on this page
    hl_rects = []
    for a in page.annots():
        if a.type[1] == 'Highlight':
            # Check if yellow-ish: stroke [1, 1, 0]
            c = a.colors.get('stroke')
            if not c or (len(c) >= 3 and c[0] > 0.8 and c[1] > 0.8 and c[2] < 0.5):
                hl_rects.append(a.rect)

    # 2. Check for Lecture Header on this page
    blocks = page.get_text('blocks')
    for b in blocks:
        b_text = clean_text(b[4]).replace('\n', ' ')
        # Check banner at top (y0 between 40 and 95)
        if 40 <= b[1] <= 95 and not b_text.startswith(('1','2','3','4','5','6','7','8','9','0')):
            # Match against known lectures
            matched_lec = None
            for kl in known_lectures:
                if kl.lower() in b_text.lower() or b_text.lower() in kl.lower():
                    matched_lec = kl
                    break
            
            if matched_lec and matched_lec != current_lecture["name"]:
                if current_lecture["questions"]:
                    lectures_data.append(current_lecture)
                current_lecture = {"name": matched_lec, "questions": []}
                current_section = "regular"
                break

    # 3. Two-Column content extraction
    content_blocks = [b for b in blocks if b[1] >= 95 or (b[0] < 50 and b[1] >= 35)]
    left_blocks = [b for b in content_blocks if b[0] < 300]
    right_blocks = [b for b in content_blocks if b[0] >= 300]
    left_blocks.sort(key=lambda b: b[1])
    right_blocks.sort(key=lambda b: b[1])
    ordered_blocks = left_blocks + right_blocks

    current_q = None

    def finalize_q():
        nonlocal current_q
        if current_q and current_q.get("stem"):
            current_lecture["questions"].append(current_q)
            current_q = None

    for b in ordered_blocks:
        b_rect = fitz.Rect(b[:4])
        raw_text = clean_text(b[4])
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]

        for line in lines:
            # Check Formative section marker
            if formative_marker.search(line) and len(line) < 60:
                finalize_q()
                current_section = "formative"
                continue

            # Option match
            opt_m = opt_start_pattern.match(line)
            if opt_m and current_q:
                opt_letter = opt_m.group(1).upper()
                opt_text = opt_m.group(2).strip()
                # Check highlight
                is_hl = any(b_rect.intersects(hr) for hr in hl_rects)
                current_q["options"][opt_letter] = opt_text
                if is_hl and not current_q["correct_option"]:
                    current_q["correct_option"] = opt_letter
                    current_q["is_yellow_highlighted"] = 1
                continue

            # Question match
            q_m = q_start_pattern.match(line)
            if q_m or (len(line) > 15 and ('?' in line or line.endswith(':'))):
                finalize_q()
                stem = q_m.group(2).strip() if q_m else line
                current_q = {
                    "num": int(q_m.group(1)) if q_m else (len(current_lecture["questions"]) + 1),
                    "stem": stem,
                    "type": current_section,
                    "options": {},
                    "correct_option": "",
                    "is_yellow_highlighted": 0
                }
                continue

            # Continuation
            if current_q:
                if not current_q["options"]:
                    current_q["stem"] += " " + line
                else:
                    last_opt = list(current_q["options"].keys())[-1]
                    current_q["options"][last_opt] += " " + line

    finalize_q()

if current_lecture["questions"]:
    lectures_data.append(current_lecture)

print(f"\n==========================================")
print(f"PARSING SUMMARY:")
print(f"Total Lectures Extracted: {len(lectures_data)}")
total_questions = sum(len(l['questions']) for l in lectures_data)
total_formatives = sum(sum(1 for q in l['questions'] if q['type'] == 'formative') for l in lectures_data)
total_highlighted = sum(sum(1 for q in l['questions'] if q['is_yellow_highlighted'] == 1) for l in lectures_data)

print(f"Total Questions Extracted: {total_questions}")
print(f"Total Formative Questions: {total_formatives}")
print(f"Total Yellow Highlighted Answers: {total_highlighted}")
print(f"==========================================")

for idx, lec in enumerate(lectures_data, 1):
    f_count = sum(1 for q in lec['questions'] if q['type'] == 'formative')
    hl_count = sum(1 for q in lec['questions'] if q['is_yellow_highlighted'] == 1)
    print(f"{idx}. {lec['name']}: {len(lec['questions'])} Total | {f_count} Formatives | {hl_count} Highlighted")
