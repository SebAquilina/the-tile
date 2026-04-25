#!/usr/bin/env bash
# Gate 0 — URL reachability matrix for the-tile.
# Every (domain × path × auth) combination returns its expected status.

set -e

# format: "URL EXPECTED_STATUS [BASIC_AUTH_USER:PASS]"
declare -a ROUTES=(
  "https://www.the-tile.com/ 200"
  "https://www.the-tile.com/collections 200"
  "https://www.the-tile.com/brands 200"
  "https://www.the-tile.com/about 200"
  "https://www.the-tile.com/contact 200"
  "https://www.the-tile.com/journal 200"
  "https://www.the-tile.com/reviews 200"
  "https://www.the-tile.com/showroom 200"
  "https://www.the-tile.com/save-list 200"
  "https://www.the-tile.com/privacy 200"
  "https://www.the-tile.com/terms 200"
  "https://www.the-tile.com/cookies 200"
  "https://www.the-tile.com/api/health 200"
  "https://www.the-tile.com/admin 401"
  # Production pages.dev mirror
  "https://the-tile-web.pages.dev/ 200"
  "https://the-tile-web.pages.dev/api/health 200"
  "https://the-tile-web.pages.dev/admin 401"
)

# Auth-positive checks read creds from env so they're never committed to the
# repo. Source secrets locally before running:
#   export ADMIN_USER=... ADMIN_PASSWORD=...
if [ -n "${ADMIN_USER:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  ROUTES+=(
    "https://www.the-tile.com/admin 200 ${ADMIN_USER}:${ADMIN_PASSWORD}"
    "https://the-tile-web.pages.dev/admin 200 ${ADMIN_USER}:${ADMIN_PASSWORD}"
  )
fi

FAIL=0
for entry in "${ROUTES[@]}"; do
  read -r url expected auth <<<"$entry"
  if [ -n "$auth" ]; then
    actual=$(curl -s -o /dev/null -w "%{http_code}" -u "$auth" "$url")
  else
    actual=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  fi
  if [ "$actual" = "$expected" ]; then
    echo "PASS $url -> $actual"
  else
    echo "FAIL $url -> got $actual, expected $expected"
    FAIL=$((FAIL + 1))
  fi
done

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "$FAIL routes failed — investigate before launch."
  exit 1
fi
