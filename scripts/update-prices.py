import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

token = os.environ.get("APIFY_TOKEN")

if not token:
    raise RuntimeError("لم يتم العثور على APIFY_TOKEN")

url = (
    "https://api.apify.com/v2/acts/"
    "alfhar~carrefour-price-tracker-mena/"
    "run-sync-get-dataset-items?timeout=300"
)

payload = {
    "country": "EG",
    "categoryKeywords": ["rice", "milk", "oil", "coffee", "tea"],
    "language": "ar",
    "maxProducts": 100,
    "maxCategories": 20,
    "includeSubcategories": True
}

request = urllib.request.Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    },
    method="POST"
)

with urllib.request.urlopen(request, timeout=320) as response:
    products = json.loads(response.read().decode("utf-8"))

if not isinstance(products, list) or not products:
    raise RuntimeError("لم تصل منتجات من كارفور")

prices = []

for product in products:
    name = str(product.get("name") or "").strip()

    try:
        price = float(product["price"])
    except (KeyError, TypeError, ValueError):
        continue

    if not name:
        continue

    prices.append({
        "name": name,
        "price": price,
        "currency": product.get("currency", "EGP"),
        "source": "Carrefour",
        "updatedAt": product.get(
            "scrapedAt",
            datetime.now(timezone.utc).isoformat()
        )
    })

if not prices:
    raise RuntimeError("البيانات وصلت لكن لم أجد أسماء وأسعار صالحة")

Path("prices.json").write_text(
    json.dumps(prices, ensure_ascii=False, indent=2),
    encoding="utf-8"
)

print(f"تم حفظ أسعار {len(prices)} منتجًا")
