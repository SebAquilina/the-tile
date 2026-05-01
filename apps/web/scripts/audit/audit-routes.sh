#!/usr/bin/env bash
# Per ref 33 — every product URL in the seed must resolve.
set -euo pipefail
BASE_URL="${BASE_URL:-https://the-tile-web.pages.dev}"
SEED="${SEED:-apps/web/data/seed/products.seed.json}"

[ -f "$SEED" ] || SEED="data/seed/products.seed.json"
[ -f "$SEED" ] || { echo "[audit-routes] seed not found"; exit 1; }

mapfile -t urls < <(python3 -c "
import json
data = json.load(open('$SEED'))
for p in data['products']:
    print(p.get('url'))
")

echo "[audit-routes] checking ${#urls[@]} product URLs"
fail=0
for url in "${urls[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$url")
  if [ "$code" != "200" ]; then
    echo "  FAIL: $url -> $code"
    fail=1
  fi
done
[ $fail -eq 0 ] && echo "[audit-routes] OK — all 200" || exit 1
