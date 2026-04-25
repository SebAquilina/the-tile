#!/usr/bin/env bash
# Gate 5c — admin auth gate behaves end-to-end on the live deployment.
# Catches the the-tile v1 build-time-inlining bug: rotated creds in the
# CF dashboard but the live deployment still rejects them because the
# middleware bundled the old values at build time.
#
# Usage:
#   export ADMIN_USER=... ADMIN_PASSWORD=...
#   ./tests/gate-5-admin-auth.sh
#
# The script exits 1 if any check fails.

set -e

if [ -z "${ADMIN_USER:-}" ] || [ -z "${ADMIN_PASSWORD:-}" ]; then
  echo "Skipping live-auth checks — ADMIN_USER / ADMIN_PASSWORD not set."
  echo "(That is acceptable in CI; run locally to validate live deployment.)"
  exit 0
fi

URLS=(
  "https://www.the-tile.com/admin"
  "https://the-tile-web.pages.dev/admin"
)

FAIL=0
for url in "${URLS[@]}"; do
  # 1. No auth → 401
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" != "401" ]; then
    echo "FAIL $url no-auth got $status, expected 401"
    FAIL=$((FAIL + 1))
  else
    echo "PASS $url no-auth → 401"
  fi

  # 2. Wrong creds → 401
  status=$(curl -s -o /dev/null -w "%{http_code}" -u "wrong:wrong" "$url")
  if [ "$status" != "401" ]; then
    echo "FAIL $url wrong-creds got $status, expected 401"
    FAIL=$((FAIL + 1))
  else
    echo "PASS $url wrong-creds → 401"
  fi

  # 3. Correct creds → 200
  status=$(curl -s -o /dev/null -w "%{http_code}" -u "${ADMIN_USER}:${ADMIN_PASSWORD}" "$url")
  if [ "$status" != "200" ]; then
    echo "FAIL $url correct-creds got $status, expected 200"
    echo "      (likely BUILD_TIME inlining: middleware has stale creds; redeploy needed)"
    FAIL=$((FAIL + 1))
  else
    echo "PASS $url correct-creds → 200"
  fi
done

if [ "$FAIL" -gt 0 ]; then
  echo "$FAIL admin-auth checks failed."
  exit 1
fi
echo "PASS — admin auth working end-to-end on every live URL."
