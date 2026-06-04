import json
import re
import requests
import pdfplumber
from io import BytesIO
from bs4 import BeautifulSoup
from datetime import datetime
from zoneinfo import ZoneInfo
from urllib.parse import urljoin

LISTINI_URL = "https://www.pno.camcom.it/studi/prezzi/listini-prodotti-agricoli"
DATA_FILE = "data/prezzi-cereali.json"

TARGETS = {
    "Mais intero": ["mais", "granoturco"],
    "Orzo intero": ["orzo"],
    "Avena intera": ["avena"],
    "Frumento intero": ["frumento tenero", "frumento"],
    "Grana verde": ["grana verde", "granaverde"]
}

def parse_number(text):
    text = text.replace(".", "").replace(",", ".")
    try:
        value = float(text)
        if 50 <= value <= 1000:
            return value
    except:
        return None
    return None

def find_latest_pdf():
    html = requests.get(LISTINI_URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=30).text
    soup = BeautifulSoup(html, "html.parser")

    for a in soup.find_all("a", href=True):
        label = a.get_text(" ", strip=True).lower()
        href = a["href"]

        if "listino agricoli" in label and "no" in label and href.lower().endswith(".pdf"):
            return urljoin(LISTINI_URL, href), a.get_text(" ", strip=True)

    raise RuntimeError("Nessun PDF Novara trovato")

def extract_pdf_text(pdf_url):
    pdf_data = requests.get(pdf_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30).content

    text = ""
    with pdfplumber.open(BytesIO(pdf_data)) as pdf:
        for page in pdf.pages:
            text += "\n" + (page.extract_text() or "")

    return text

def find_price(text, keywords):
    lines = text.splitlines()

    for line in lines:
        clean = line.lower()

        if not any(k in clean for k in keywords):
            continue

        numbers = re.findall(r"\d{2,3},\d{2}|\d{2,3}", line)
        parsed = [parse_number(n) for n in numbers]
        parsed = [n for n in parsed if n is not None]

        if parsed:
            return parsed[-1]

    return None

with open(DATA_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

pdf_url, pdf_title = find_latest_pdf()
text = extract_pdf_text(pdf_url)

data["updatedAt"] = datetime.now(ZoneInfo("Europe/Rome")).isoformat()
data["sourceNote"] = f"Camera di Commercio Novara - {pdf_title}"

for item in data["items"]:
    keywords = TARGETS.get(item["name"])

    if not keywords:
        continue

    new_price = find_price(text, keywords)

    if new_price is not None:
        old_price = item.get("currentPrice", 0)
        item["previousPrice"] = old_price if old_price else new_price
        item["currentPrice"] = new_price
        item["source"] = "CCIAA Novara"
        item["notes"] = "Prezzo da ultimo listino agricolo Novara"
    else:
        item["source"] = "Non trovato"
        item["notes"] = "Prezzo non trovato nel PDF"

with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Listino usato:", pdf_title)
print("PDF:", pdf_url)
print("Prezzi aggiornati")
