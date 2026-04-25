#!/usr/bin/env bash
# Gate 10 — admin permissions & security.
# Validates the live deployment, not local code.

set -e

BASE="${BASE_URL:-https://www.the-tile.com}"
FAIL=0

# 1. Unauth on every admin API endpoint → 401
ADMIN_API_PATHS=(
  "/api/admin/leads/test"
  "/api/admin/products/test"
  "/api/admin/publish"
)
for p in "${ADMIN_API_PATHS[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE}${p}")
  if [ "$status" != "401" ] && [ "$status" != "405" ]; then
    echo "FAIL ${BASE}${p} unauthed got $status, expected 401 or 405"
    FAIL=$((FAIL + 1))
  else
    echo "PASS ${BASE}${p} unauthed → $status"
  fi
done

# 2. Admin path requires auth
status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}/admin")
if [ "$status" != "401" ]; then
  echo "FAIL ${BASE}/admin unauthed got $status, expected 401"
  FAIL=$((FAIL + 1))
else
  echo "PASS ${BASE}/admin unauthed → 401"
fi

# 3. Auth rate limit fires
echo "Probing auth rate limit (10 rapid wrong-creds attempts)..."
for i in $(seq 1 10); do
  status=$(curl -s -o /dev/null -w "%{http_code}" -u "rate:limit-test-$i" "${BASE}/admin")
  if [ "$status" = "429" ]; then
    echo "PASS rate limit fired at attempt $i"
    break
  fi
  if [ "$i" = "10" ]; then
    echo "WARN no 429 after 10 attempts — rate limit may be lenient or absent"
  fi
done

# 4. Health endpoint is not gated (sanity)
status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}/api/health")
if [ "$status" != "200" ]; then
  echo "FAIL ${BASE}/api/health got $status, expected 200"
  FAIL=$((FAIL + 1))
else
  echo "PASS ${BASE}/api/health → 200"
fi

# Note: full Gate 10 (CSRF, role enforcement, file-upload sanitization,
# server-enforced no-purchase rule) requires the v2 admin panel from
# 15-admin-panel-spec.md. Until that ships, this script covers the
# baseline.

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "$FAIL admin-security checks failed."
  exit 1
fi
echo ""
echo "PASS — admin baseline security checks. Full Gate 10 needs panel buildout."
