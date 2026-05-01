#!/usr/bin/env bash
# Per ref 32 — image provenance check + AVIF/WebP negotiation.
set -euo pipefail
BASE_URL="${BASE_URL:-https://the-tile-web.pages.dev}"
SEED="${SEED:-apps/web/data/seed/products.seed.json}"

[ -f "$SEED" ] || SEED="data/seed/products.seed.json"

# Check residual stock-Unsplash references (per ref 25 lessons-baked-in)
echo "[audit-images] scanning seed for residual Unsplash hot-links"
unsplash=$(grep -c 'unsplash.com' "$SEED" || true)
[ "$unsplash" = "0" ] && echo "  PASS — no unsplash refs" || echo "  WARN — $unsplash unsplash refs in seed"

# Sample 5 product images, check 200 + format
mapfile -t imgs < <(python3 -c "
import json
data = json.load(open('$SEED'))
for p in data['products'][:5]:
    for img in (p.get('images') or [])[:1]:
        print(img.get('src'))
")

fail=0
for img in "${imgs[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$img")
  ct=$(curl -sI -H 'Accept: image/avif,image/webp,image/jpeg' "$BASE_URL$img" | grep -i 'content-type' | tr -d '\r' | awk '{print $2}')
  echo "  $img -> $code $ct"
  if [ "$code" != "200" ]; then fail=1; fi
done
[ $fail -eq 0 ] && echo "[audit-images] OK" || exit 1
