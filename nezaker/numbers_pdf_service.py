import os
import re
from datetime import datetime
import arabic_reshaper
from bidi.algorithm import get_display

from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
NUMBERS_PDF_DIR = os.path.join(BASE_DIR, "static", "lecture_numbers_pdfs")
os.makedirs(NUMBERS_PDF_DIR, exist_ok=True)

# Register Unicode fonts with Arabic support
FONT_INITIALIZED = False

def init_fonts():
    global FONT_INITIALIZED
    if FONT_INITIALIZED:
        return
    
    font_paths = [
        ("ArabicArial", "C:/Windows/Fonts/arial.ttf"),
        ("ArabicArialBold", "C:/Windows/Fonts/arialbd.ttf"),
        ("ArabicTahoma", "C:/Windows/Fonts/tahoma.ttf"),
        ("ArabicTahomaBold", "C:/Windows/Fonts/tahomabd.ttf")
    ]
    
    for name, path in font_paths:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont(name, path))
            except Exception as e:
                pass
    FONT_INITIALIZED = True

def ar(text: str) -> str:
    """Reshapes Arabic text and applies BiDi algorithm for proper RTL rendering in PDF."""
    if not text:
        return ""
    try:
        # Check if text contains Arabic characters
        has_arabic = bool(re.search(r'[\u0600-\u06FF]', str(text)))
        if not has_arabic:
            return str(text)
        reshaped = arabic_reshaper.reshape(str(text))
        return get_display(reshaped)
    except Exception:
        return str(text)

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print 'Page X of Y' in footers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("ArabicArial", 9)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header line (on pages > 1)
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(40, 755, 572, 755)
            self.drawRightString(572, 760, ar("نُذاكر — كشاف الأرقام والثوابت الطبية"))
            self.drawString(40, 760, "Nezaker Medical Platform")
            
        # Footer
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(40, 45, 572, 45)
        
        # Page count
        page_str = ar(f"صفحة {self._pageNumber} من {page_count}")
        self.drawRightString(572, 32, page_str)
        self.drawString(40, 32, "Nezaker AI Medical Study System")
        self.restoreState()

def build_numbers_pdf(lecture_id: int, lecture_title: str, subject: str, numbers_data: dict) -> str:
    """
    Builds an exquisite, high-yield PDF document containing all extracted numbers, constants,
    and ranges, organized cleanly by categories with clinical significance.
    Returns the absolute path to the generated PDF.
    """
    init_fonts()
    safe_title = re.sub(r'[\\/*?:"<>|]', '', lecture_title).strip()[:40]
    filename = f"lec_{lecture_id}_numbers_{safe_title}.pdf"
    output_path = os.path.join(NUMBERS_PDF_DIR, filename)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Normal'],
        fontName='ArabicArialBold',
        fontSize=20,
        leading=26,
        alignment=1, # Center
        textColor=colors.HexColor("#1e3a8a")
    )
    
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='ArabicArialBold',
        fontSize=13,
        leading=18,
        alignment=1,
        textColor=colors.HexColor("#0f766e")
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='ArabicArial',
        fontSize=10,
        leading=14,
        alignment=1,
        textColor=colors.HexColor("#475569")
    )

    cat_header_style = ParagraphStyle(
        'CatHeader',
        parent=styles['Normal'],
        fontName='ArabicArialBold',
        fontSize=13,
        leading=17,
        alignment=2, # Right
        textColor=colors.HexColor("#1e293b")
    )

    summary_box_style = ParagraphStyle(
        'SummaryBox',
        parent=styles['Normal'],
        fontName='ArabicArial',
        fontSize=10,
        leading=15,
        alignment=2, # Right
        textColor=colors.HexColor("#1e293b")
    )

    cell_value_style = ParagraphStyle(
        'CellValue',
        parent=styles['Normal'],
        fontName='ArabicArialBold',
        fontSize=12,
        leading=15,
        alignment=1, # Center
        textColor=colors.HexColor("#2563eb")
    )

    cell_concept_style = ParagraphStyle(
        'CellConcept',
        parent=styles['Normal'],
        fontName='ArabicArialBold',
        fontSize=10,
        leading=14,
        alignment=2, # Right
        textColor=colors.HexColor("#0f172a")
    )

    cell_detail_style = ParagraphStyle(
        'CellDetail',
        parent=styles['Normal'],
        fontName='ArabicArial',
        fontSize=9,
        leading=13,
        alignment=2, # Right
        textColor=colors.HexColor("#334155")
    )

    cell_th_style = ParagraphStyle(
        'CellHeader',
        parent=styles['Normal'],
        fontName='ArabicArialBold',
        fontSize=10,
        leading=14,
        alignment=1, # Center
        textColor=colors.HexColor("#ffffff")
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph(ar("نُـذاكِــر — بـنـك الأرقـام والـثـوابـت الـطـبـيـة"), title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(ar(f"كشاف الثوابت والأبعاد والمعدلات المخبرية: {lecture_title}"), subtitle_style))
    story.append(Spacer(1, 4))
    
    total_found = numbers_data.get("total_numbers_found", 0)
    current_date = datetime.now().strftime("%Y-%m-%d")
    story.append(Paragraph(ar(f"المادة: {subject}   |   إجمالي الثوابت المستخرجة: {total_found}   |   تاريخ الإصدار: {current_date}"), meta_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#3b82f6"), spaceAfter=12))

    # 2. Summary Overview Box
    summary_text = numbers_data.get("summary_arabic", "").strip()
    if summary_text:
        summary_table_data = [[
            Paragraph(f"<b>{ar('💡 نظرة عامة وفخاخ الامتحانات (Clinical Pearls):')}</b><br/>{ar(summary_text)}", summary_box_style)
        ]]
        summary_table = Table(summary_table_data, colWidths=[540])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#bfdbfe")),
            ('ROUNDEDCORNERS', [6, 6, 6, 6]),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 14))

    # 3. Categories and Tables
    categories = numbers_data.get("categories", [])
    if not categories:
        story.append(Paragraph(ar("لم يتم العثور على أرقام أو ثوابت عددية محددة في هذه المحاضرة."), meta_style))
    else:
        col_widths = [110, 160, 270] # Total = 540 pt (matches printable width)

        for cat_idx, cat in enumerate(categories):
            cat_name = cat.get("category_name", "ثوابت طبية")
            items = cat.get("items", [])
            if not items:
                continue

            # Category Banner
            cat_banner_data = [[
                Paragraph(f"📌 {ar(cat_name)} ({len(items)} {ar('قيم')})", cat_header_style)
            ]]
            cat_table = Table(cat_banner_data, colWidths=[540])
            cat_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ]))
            
            cat_flowables = [Spacer(1, 10), cat_table, Spacer(1, 6)]

            # Table Header
            table_rows = [
                [
                    Paragraph(ar("الرقم / القيمة (Value)"), cell_th_style),
                    Paragraph(ar("المفهوم والتركيب (Concept)"), cell_th_style),
                    Paragraph(ar("السياق والأهمية السريرية والامتحانية"), cell_th_style)
                ]
            ]

            # Table Data Rows
            for item_idx, itm in enumerate(items):
                val_text = itm.get("value", "")
                concept_text = itm.get("concept", "")
                unit_text = itm.get("unit_or_type", "")
                ctx_text = itm.get("context", "")
                sig_text = itm.get("clinical_significance", "")

                concept_cell = f"<b>{ar(concept_text)}</b>"
                if unit_text:
                    concept_cell += f"<br/><font color='#64748b' size='8'>[{ar(unit_text)}]</font>"

                detail_cell = ""
                if ctx_text:
                    detail_cell += f"<b>{ar('السياق:')}</b> {ar(ctx_text)}"
                if sig_text:
                    if detail_cell:
                        detail_cell += "<br/>"
                    detail_cell += f"<font color='#b91c1c'><b>{ar('⚡ الأهمية والامتحانات:')}</b></font> {ar(sig_text)}"

                table_rows.append([
                    Paragraph(f"<b>{val_text}</b>", cell_value_style),
                    Paragraph(concept_cell, cell_concept_style),
                    Paragraph(detail_cell, cell_detail_style)
                ])

            t = Table(table_rows, colWidths=col_widths, repeatRows=1)
            t_style = [
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e3a8a")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('LEFTPADDING', (0,0), (-1,-1), 6),
                ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ]

            # Alternating row colors
            for r_i in range(1, len(table_rows)):
                bg = colors.HexColor("#ffffff") if r_i % 2 == 1 else colors.HexColor("#f8fafc")
                t_style.append(('BACKGROUND', (0, r_i), (-1, r_i), bg))

            t.setStyle(TableStyle(t_style))
            cat_flowables.append(t)
            cat_flowables.append(Spacer(1, 10))

            story.append(KeepTogether(cat_flowables))

    doc.build(story, canvasmaker=NumberedCanvas)
    return output_path
