import os
from PIL import Image, ImageDraw, ImageFont

# Canvas dimensions (16:9 1920x1080)
W, H = 1920, 1080

# Colors
ORANGE = (243, 111, 33)   # #F36F21
MARRON = (61, 12, 2)      # #3D0C02
WHITE = (255, 255, 255)
LIGHT_BG = (250, 250, 250)
DARK_TEXT = (31, 41, 55)

# Try loading system font, fallback to default
try:
    font_title = ImageFont.truetype("arialbd.ttf", 52)
    font_head = ImageFont.truetype("arialbd.ttf", 36)
    font_body = ImageFont.truetype("arial.ttf", 28)
    font_bold = ImageFont.truetype("arialbd.ttf", 28)
except:
    font_title = font_head = font_body = font_bold = ImageFont.load_default()

# ----------------------------------------------------
# SLIDE 1: COUVERTURE
# ----------------------------------------------------
img1 = Image.new("RGB", (W, H), ORANGE)
draw1 = ImageDraw.Draw(img1)

# Top Right White Circle for BP Logo
draw1.ellipse([900, -200, 2000, 900], fill=WHITE)

# Bottom Right White Circle for EMSI Logo
draw1.ellipse([1200, 450, 2050, 1300], fill=WHITE)

# Insert BP Logo
if os.path.exists("frontend/public/logo_BP.png"):
    bp_logo = Image.open("frontend/public/logo_BP.png").convert("RGBA")
    bp_logo = bp_logo.resize((650, 360))
    img1.paste(bp_logo, (1150, 180), bp_logo)

# Insert EMSI Logo
if os.path.exists("scratch/emsi_logo.png"):
    emsi_logo = Image.open("scratch/emsi_logo.png").convert("RGBA")
    emsi_logo = emsi_logo.resize((550, 200))
    img1.paste(emsi_logo, (1350, 680), emsi_logo)

# Left Side Text
draw1.text((100, 180), "PFA : Plateforme web", fill=WHITE, font=font_title)
draw1.text((100, 250), "de Data Lineage & Supervision Bancaire", fill=WHITE, font=font_title)

draw1.text((100, 450), "Réalisé et présenté par :", fill=MARRON, font=font_head)
draw1.text((100, 510), "Mlle. Meriam Erragragui", fill=WHITE, font=font_bold)
draw1.text((100, 560), "Mr. Omar Tazi", fill=WHITE, font=font_bold)

draw1.text((100, 680), "Encadrée par :", fill=MARRON, font=font_head)
draw1.text((100, 730), "Pr. Chaimae Taoussi", fill=WHITE, font=font_bold)

draw1.text((100, 880), "Entreprise : Banque Populaire (Banque Chaabi)", fill=MARRON, font=font_body)
draw1.text((100, 930), "Année Universitaire 2024/2025", fill=WHITE, font=font_body)

img1.save("scratch/slide1_couverture.png")

# ----------------------------------------------------
# SLIDE 2: SOMMAIRE
# ----------------------------------------------------
img2 = Image.new("RGB", (W, H), WHITE)
draw2 = ImageDraw.Draw(img2)

# Title: Sommaire
draw2.text((820, 80), "Som", fill=MARRON, font=font_title)
draw2.text((930, 80), "maire", fill=ORANGE, font=font_title)

# 6 Cards Grid
cards = [
    ("1. Introduction", ORANGE, 150, 280),
    ("2. Cadre du projet", MARRON, 710, 280),
    ("3. Conception", (224, 92, 14), 1270, 280),
    ("4. Technologies utilisées", (139, 58, 43), 150, 630),
    ("5. Implémentation", (217, 83, 30), 710, 630),
    ("6. Conclusion", ORANGE, 1270, 630)
]

for title, color, x, y in cards:
    draw2.rounded_rectangle([x, y, x + 500, y + 260], radius=25, fill=color)
    draw2.text((x + 60, y + 100), title, fill=WHITE, font=font_head)

img2.save("scratch/slide2_sommaire.png")

# ----------------------------------------------------
# SLIDE 3: INTRODUCTION
# ----------------------------------------------------
img3 = Image.new("RGB", (W, H), WHITE)
draw3 = ImageDraw.Draw(img3)

# Left Side Banner
draw3.rectangle([0, 0, 500, H], fill=ORANGE)
draw3.text((60, 450), "Intro", fill=MARRON, font=font_title)
draw3.text((180, 450), "duction", fill=WHITE, font=font_title)

# Right Content
draw3.text((580, 120), "➢ Contexte", fill=MARRON, font=font_head)
draw3.text((620, 190), "▪ Besoins croissants d'outils numériques pour la gouvernance des données bancaires.", fill=DARK_TEXT, font=font_body)
draw3.text((620, 240), "▪ Traçabilité et complexité des flux entre clients, agences, comptes et transactions.", fill=DARK_TEXT, font=font_body)
draw3.text((620, 290), "▪ Volonté de digitaliser l'analyse d'impact et la détection PII.", fill=DARK_TEXT, font=font_body)

draw3.text((580, 420), "➢ Problématique", fill=ORANGE, font=font_head)
draw3.text((620, 490), "Comment concevoir une plateforme simple, intelligente et évolutive qui aide la Banque Populaire à :", fill=DARK_TEXT, font=font_bold)
draw3.text((620, 560), "▪ Cartographier automatiquement les 6 tables bancaires et leur Column Lineage.", fill=DARK_TEXT, font=font_body)
draw3.text((620, 610), "▪ Identifier la classification PII et les Data Owners par colonne.", fill=DARK_TEXT, font=font_body)
draw3.text((620, 660), "▪ Interroger le catalogue en langage naturel via un Assistant IA Vocal (RAG + Speech).", fill=DARK_TEXT, font=font_body)

img3.save("scratch/slide3_introduction.png")

# ----------------------------------------------------
# SLIDE 4: CADRE DU PROJET
# ----------------------------------------------------
img4 = Image.new("RGB", (W, H), WHITE)
draw4 = ImageDraw.Draw(img4)

# Left Card
draw4.rounded_rectangle([100, 180, 700, 880], radius=35, fill=ORANGE)
draw4.text((180, 480), "Cadre ", fill=MARRON, font=font_title)
draw4.text((340, 480), "du projet", fill=WHITE, font=font_title)

# Right Details
draw4.text((800, 180), "Projet réalisé dans le cadre d'un stage / PFA de fin d'année", fill=MARRON, font=font_head)
draw4.text((800, 280), "▪ Thème : ", fill=ORANGE, font=font_bold)
draw4.text((950, 280), "Plateforme Intelligente de Data Lineage Bancaire", fill=DARK_TEXT, font=font_body)

draw4.text((800, 380), "▪ Entreprise d'accueil : ", fill=ORANGE, font=font_bold)
draw4.text((1150, 380), "Banque Populaire (Banque Chaabi)", fill=DARK_TEXT, font=font_body)

draw4.text((800, 480), "▪ Durée : ", fill=ORANGE, font=font_bold)
draw4.text((950, 480), "2 mois", fill=DARK_TEXT, font=font_body)

draw4.text((800, 580), "▪ Encadrement : ", fill=ORANGE, font=font_bold)
draw4.text((1050, 580), "École EMSI (Pr. Chaimae Taoussi)", fill=DARK_TEXT, font=font_body)

img4.save("scratch/slide4_cadre.png")

print("SLIDE IMAGES GENERATED SUCCESSFULLY!")
