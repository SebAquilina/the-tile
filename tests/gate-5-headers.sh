#!/usr/bin/env bash
# Gate 5 — required security headers on every public URL.
set -e

URLS=(
  "https://www.the-tile.com/"
  "https://www.the-tile.com/collections"
  "https://www.the-tile.com/about"
  "https://www.the-tile.com/api/health"
)

REQUIRED=(
  "strict-transport-security: max-age="
  "content-security-policy: "
  "referrer-policy: "
  "x-content-type-options: nosniff"
  "permissions-policy: "
  "x-frame-options: DENY"
)

FAIL=0
for url in "${URLS[@]}"; do
  headers=$(curl -sI "$url" | tr 'A-Z' 'a-z')
  for h in "${REQUIRED[@]}"; do
    needle=$(echo "$h" | tr 'A-Z' 'a-z')
    if ! echo "$headers" | grep -q "$needle"; then
      echo "FAIL $url missing header: $h"
      FAIL=$((FAIL + 1))
    fi
  done
done

if [ "$FAIL" -gt 0 ]; then
  echo "$FAIL header checks failed."
  exit 1
fi
echo "PASS — all headers present on all checked URLs."
