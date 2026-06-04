import json
from datetime import datetime
from zoneinfo import ZoneInfo

with open("data/prezzi-cereali.json", "r", encoding="utf-8") as f:
    data = json.load(f)

data["updatedAt"] = datetime.now(
    ZoneInfo("Europe/Rome")
).isoformat()

with open("data/prezzi-cereali.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Prezzi aggiornati")
