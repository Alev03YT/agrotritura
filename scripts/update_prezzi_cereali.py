import json
import re
import requests
from datetime import datetime
from zoneinfo import ZoneInfo

URL = "https://agronotizie.imagelinenetwork.com/prezzi-mercati/quotazioni/"
DATA_FILE = "data/prezzi-cereali.json"

TARGETS = {
    "Mais intero": "Mais",
    "Orzo intero": "Orzo",
    "Avena intera": "Avena",
    "Frumento intero": "Frumento tenero",
}

def extract_price(html, source_name):
    pattern = rf"{re.escape(source_name)}\s+([0-9]+,[0-9]+)\s*€/t"
    match = re.search(pattern, html, re.IGNORECASE)
    if not match:
        return None
    return float(match.group(1).replace(",", "."))

with open(DATA_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

html = requests.get(URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=30).text

data["updatedAt"] = datetime.now(ZoneInfo("Europe/Rome")).isoformat()
data["sourceNote"] = "Aggiornamento automatico da AgroNotizie, fonte ISMEA Mercati"

for item in data["items"]:
    source_name = TARGETS.get(item["name"])

    if not source_name:
        item["source"] = "Da collegare"
        item["notes"] = "Non presente nella fonte automatica"
        continue

    new_price = extract_price(html, source_name)

    if new_price is not None:
        old_price = item.get("currentPrice", 0)
        item["previousPrice"] = old_price if old_price else new_price
        item["currentPrice"] = new_price
        item["source"] = "AgroNotizie / ISMEA"
        item["notes"] = f"Prezzo automatico: {source_name}"
    else:
        item["source"] = "Non trovato"
        item["notes"] = f"Prezzo non trovato per {source_name}"

with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Prezzi cereali aggiornati automaticamente")
