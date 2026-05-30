from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted, PageBreak
from reportlab.lib import colors
import os

BASE = r"C:\Users\Tamat\Downloads\InvoiceDoc2-main"
OUTPUT = os.path.join(BASE, "lab10_source_code.pdf")

FILES = [
    "database/sql/005_invoice_lab4_delta.sql",
    "server/src/services/receipts.service.js",
    "server/src/controllers/receipts.controller.js",
    "server/src/routes/receipts.routes.js",
    "server/src/services/receiptReports.service.js",
    "server/src/controllers/receiptReports.controller.js",
    "server/src/routes/receiptReports.routes.js",
    "client/src/api/receipts.api.js",
    "client/src/api/receiptReports.api.js",
    "client/src/pages/receipts/ReceiptList.jsx",
    "client/src/pages/receipts/InvoicePickerModal.jsx",
    "client/src/pages/receipts/ReceiptPage.jsx",
    "client/src/pages/reports/ReceiptReports.jsx",
]

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=15*mm,
    leftMargin=15*mm,
    topMargin=15*mm,
    bottomMargin=15*mm,
)

styles = getSampleStyleSheet()

header_style = ParagraphStyle(
    "FileHeader",
    fontName="Helvetica-Bold",
    fontSize=11,
    textColor=colors.HexColor("#1a1a2e"),
    spaceBefore=12,
    spaceAfter=4,
    borderPad=4,
    backColor=colors.HexColor("#e8e8f0"),
    borderWidth=1,
    borderColor=colors.HexColor("#aaaacc"),
    leading=16,
)

code_style = ParagraphStyle(
    "CodeBlock",
    fontName="Courier",
    fontSize=7,
    leading=9,
    spaceAfter=6,
    textColor=colors.black,
)

story = []

title_style = ParagraphStyle(
    "Title",
    fontName="Helvetica-Bold",
    fontSize=16,
    textColor=colors.HexColor("#1a1a2e"),
    alignment=1,
    spaceAfter=6,
)
subtitle_style = ParagraphStyle(
    "Subtitle",
    fontName="Helvetica",
    fontSize=10,
    textColor=colors.HexColor("#555555"),
    alignment=1,
    spaceAfter=20,
)

story.append(Paragraph("Lab 10 — Source Code", title_style))
story.append(Paragraph("InvoiceDoc2 Project", subtitle_style))
story.append(Spacer(1, 6*mm))

for rel_path in FILES:
    full_path = os.path.join(BASE, rel_path.replace("/", os.sep))
    story.append(Paragraph(rel_path, header_style))
    story.append(Spacer(1, 2*mm))
    try:
        with open(full_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        story.append(Preformatted(content, code_style))
    except FileNotFoundError:
        story.append(Paragraph(f"[File not found: {full_path}]", code_style))
    story.append(Spacer(1, 4*mm))

doc.build(story)
print(f"PDF saved to: {OUTPUT}")
