#!/usr/bin/env bash
# Per ref 30 — verify required security headers on key routes.
set -euo pipefail

BASE_URL="${BASE_URL:-https://the-tile-web.pages.dev}"
ROUTES=("/" "/collections" "/contact" "/about" "/admin")
REQUIRED=("strict-transport-security" "x-frame-options" "x-content-type-options" "referrer-policy" "content-security-policy" "permissions-policy")

fail=0
for route in "${ROUTES[@]}"; do
  echo "[audit-headers] $route"
  headers=$(curl -sI "$BASE_URL$route" | tr 'A-Z' 'a-z')
  for h in "${REQUIRED[@]}"; do
    if ! echo "$headers" | grep -q "^$h:"; then
      echo "  FAIL: missing header $h"
      fail=1
    fi
  done
done
[ $fail -eq 0 ] && echo "[audit-headers] OK" || exit 1
