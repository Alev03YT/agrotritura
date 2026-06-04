import json
from datetime import datetime
from zoneinfo import ZoneInfo

DATA_FILE = "data/prezzi-cereali.json"

# Versione pronta per Granaria Milano.
# Per ora mantiene i prezzi esistenti e aggiorna data/fonte.
# Nel prossimo step colleghiamo il PDF preciso del listino.

with open(DATA_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

data["updatedAt"] = datetime.now(
    ZoneInfo("Europe/Rome")
).isoformat()

data["sourceNote"] = "Fonte scelta: Granaria Milano - collegamento automatico PDF in preparazione"

for item in data["items"]:
    if item["name"] == "Grana verde":
        item["source"] = "Da collegare"
        item["notes"] = "Da trovare su fonte separata"
    else:
        item["source"] = "Granaria Milano"
        item["notes"] = "In attesa di lettura automatica listino PDF"

with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Fonte aggiornata a Granaria Milano")
