import json
import re
from io import BytesIO
from datetime import datetime
from zoneinfo import ZoneInfo
from urllib.parse import urljoin

import requests
import pdfplumber
from bs4 import BeautifulSoup

HOME_URL = "https://www.granariamilano.it/"
DATA_FILE = "data/prezzi-cereali.json"

TARGETS = {
    "Mais intero": [
        "alimentare",
        "granoturco/mais",
        "granturco/mais",
        "mais"
    ],

    "Orzo intero": [
        "orzo nazionale pesante",
        "orzo nazionale",
        "orzo"
    ],

    "Avena intera": [
        "avena nazionale",
        "avena"
    ],

    "Frumento intero": [
        "frumento nazionale uso zootecnico",
        "frumento zootecnico",
        "frumento foraggero",
        "frumento uso mangimistico",
        "frumento panificabile"
    ],

    "Grana verde": [
        "risone tondo",
        "risone"
    ]
}

def get_html(url):
    r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    r.raise_for_status()
    return r.text

def find_latest_listino_url():
    soup = BeautifulSoup(get_html(HOME_URL), "html.parser")

    for a in soup.find_all("a", href=True):
        text = a.get_text(" ", strip=True).lower()
        href = a["href"]

        if "listino" in text and re.search(r"20\d{2}[-/]\d{2}[-/]\d{2}", text):
            return urljoin(HOME_URL, href)

    raise RuntimeError("Link ultimo listino non trovato")

def find_pdf_url(listino_url):
    soup = BeautifulSoup(get_html(listino_url), "html.parser")

    for a in soup.find_all("a", href=True):
        text = a.get_text(" ", strip=True).lower()
        href = a["href"]

        if href.lower().endswith(".pdf") or "visualizza listino" in text:
            return urljoin(listino_url, href)

    raise RuntimeError("PDF listino non trovato")

def extract_pdf_text(pdf_url):
    r = requests.get(pdf_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    r.raise_for_status()

    text = ""
    with pdfplumber.open(BytesIO(r.content)) as pdf:
        for page in pdf.pages:
            text += "\n" + (page.extract_text() or "")

    return text

def parse_price_number(value):
    value = value.replace(".", "").replace(",", ".")
    try:
        number = float(value)
    except ValueError:
        return None

    if 50 <= number <= 1000:
        return number

    return None

def find_price(text, keywords):
    lines = text.splitlines()

    for keyword in keywords:
        for line in lines:
            if keyword.lower() in line.lower():

                nums = re.findall(r"\b\d{3,4}\b", line)

                prices = [
                    int(n.replace(".", ""))
                    for n in nums
                    if 100 <= int(n.replace(".", "")) <= 2000
                ]

                if len(prices) >= 2:
                    return round((prices[0] + prices[1]) / 2, 2)

    return None

with open(DATA_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

listino_url = find_latest_listino_url()
pdf_url = find_pdf_url(listino_url)
pdf_text = extract_pdf_text(pdf_url)
print(pdf_text[:5000])

data["updatedAt"] = datetime.now(ZoneInfo("Europe/Rome")).isoformat()
data["sourceNote"] = "Granaria Milano - ultimo listino pubblico"

for item in data["items"]:
    keywords = TARGETS.get(item["name"])

    if not keywords:
        item["source"] = "Da collegare"
        item["notes"] = "Non presente nel listino Granaria Milano"
        continue

    new_price = find_price(pdf_text, keywords)

    if new_price is not None:
        old_price = item.get("currentPrice", 0)
        item["previousPrice"] = old_price if old_price else new_price
        item["currentPrice"] = new_price
        item["source"] = "Granaria Milano"
        item["notes"] = "Prezzo medio da ultimo listino pubblico"
    else:
        item["source"] = "Non trovato"
        item["notes"] = "Voce non trovata automaticamente nel PDF"

with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Listino:", listino_url)
print("PDF:", pdf_url)
print("Aggiornamento completato")
