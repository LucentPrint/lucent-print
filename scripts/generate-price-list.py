from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = [
    ROOT / "public/documents/Lucent_Print_Price_List.pdf",
    ROOT.parents[1] / "outputs/Lucent_Print_Full_Inventory_Price_List.pdf",
]

PRODUCTS = [
    ("Pumpkin Cupcake Clicker", "$10.99", "50"),
    ("Witch Cauldron Clicker", "$10.99", "50"),
    ("Skull Pumpkin Cauldron Clicker", "$10.99", "50"),
    ("Skull Ghost Bucket Clicker", "$10.99", "50"),
    ("Yellow Chomper Clicker", "$10.99", "50"),
    ("Halloween Donut Clicker Collection", "$19.99", "50"),
    ("Spiderweb Donut Gift Set", "$15.99", "50"),
    ("Halloween Keyboard Clicker", "$10.99", "50"),
    ("Pink Smiley Tumbler Clicker", "$10.99", "50"),
    ("Blue Puppy Carrier Clicker", "$10.99", "50"),
    ("White Puppy Carrier Clicker", "$10.99", "50"),
    ("Zombie Head Clicker", "$10.99", "50"),
    ("Inspirada Bulldogs Custom Shirt - front and back", "From $12.49", "50"),
    ("Bulldogs Bolt Custom Shirt - front", "From $9.99", "50"),
    ("Exotica Scissors Custom Shirt - front", "From $9.99", "50"),
    ("Tiger Baby Bro Custom Shirt - front", "From $9.99", "50"),
]

TUMBLERS = [
    ("Happy Halloween Tumbler", "$19.99"),
    ("Inspirada Bulldogs Halloween Tumbler", "$19.99"),
    ("Autumn Pumpkin Tumbler", "$19.99"),
    ("20 oz Skinny Tumbler", "$19.99"),
]


def build(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    title = ParagraphStyle("Title", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=24, leading=28, textColor=colors.HexColor("#ec4899"), alignment=TA_CENTER, spaceAfter=5)
    subtitle = ParagraphStyle("Subtitle", parent=styles["BodyText"], fontSize=10, leading=14, textColor=colors.HexColor("#52525b"), alignment=TA_CENTER, spaceAfter=15)
    heading = ParagraphStyle("Heading", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=15, leading=18, textColor=colors.HexColor("#111827"), spaceBefore=10, spaceAfter=7)
    body = ParagraphStyle("Body", parent=styles["BodyText"], fontSize=9, leading=13, textColor=colors.HexColor("#3f3f46"))

    doc = SimpleDocTemplate(str(path), pagesize=letter, rightMargin=0.55*inch, leftMargin=0.55*inch, topMargin=0.5*inch, bottomMargin=0.5*inch, title="Lucent Print Full Inventory Price List", author="Lucent Print")
    story = [Paragraph("LUCENT PRINT", title), Paragraph("FULL INVENTORY & PRICE LIST - SEPTEMBER 28, 2026", subtitle)]

    story += [Paragraph("3D Prints and Ready-Made Apparel", heading)]
    table = Table([["Item", "Price", "Stock"]] + [list(row) for row in PRODUCTS], colWidths=[5.55*inch, 0.8*inch, 0.6*inch], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (1, 1), (1, -1), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d4d4d8")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
        ("FONTSIZE", (0, 0), (-1, -1), 8.3),
        ("LEADING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
    ]))
    story += [table, Spacer(1, 8)]

    story += [Paragraph("Shirt Pricing", heading)]
    shirt_table = Table([
        ["Size", "One side", "Front + back"],
        ["Toddler 2T-5T", "$9.99", "$12.49"],
        ["Youth XS", "$9.99", "$12.49"],
        ["Youth S", "$11.49", "$13.99"],
        ["Youth M", "$12.99", "$15.49"],
        ["Youth L", "$14.49", "$16.99"],
        ["Youth XL", "$15.99", "$18.49"],
        ["Adult S-M", "$16.99", "$19.49"],
        ["Adult L-XL", "$19.99", "$22.49"],
        ["Adult 2XL", "$24.99", "$27.49"],
        ["Adult 3XL", "$26.99", "$29.49"],
    ], colWidths=[4.75*inch, 1.1*inch, 1.1*inch])
    shirt_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d4d4d8")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story += [shirt_table, Paragraph("Heat-transfer and sublimation shirt orders use these size-based rates. Hoodies and unlisted garment options are quoted separately.", body)]

    story += [Paragraph("Tumblers", heading)]
    tumbler_table = Table([["Design", "Price"]] + [list(row) for row in TUMBLERS], colWidths=[5.85*inch, 1.1*inch])
    tumbler_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f97316")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (1, 1), (1, -1), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d4d4d8")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fff7ed")]),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story += [tumbler_table, Spacer(1, 8)]

    story += [Paragraph("Other Drinkware and Design Services", heading)]
    extras = Table([
        ["Item", "Price"],
        ["20 oz Water Bottle", "$24.99"],
        ["16 oz Glass Can", "$19.99"],
        ["11 oz Coffee Mug", "$17.99"],
        ["Name, text, number, photo, logo or finished artwork", "Included"],
        ["Custom design from your idea", "$15.00"],
        ["Complex artwork, illustration, logo redraw or cleanup", "From $35"],
        ["Extra revisions after the first two", "$5 each"],
    ], colWidths=[5.85*inch, 1.1*inch])
    extras.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (1, 1), (1, -1), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d4d4d8")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("TOPPADDING", (0, 0), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
    ]))
    story += [extras, Spacer(1, 12), Paragraph("Free local pickup in Las Vegas. Shipping is calculated when you order. Prices subject to change; final garment, artwork and production details are confirmed before printing.", body), Paragraph("lu@lucentprintlic.com  |  lucent-print.vercel.app", subtitle)]
    doc.build(story)


for output in OUTPUTS:
    build(output)
    print(output)
