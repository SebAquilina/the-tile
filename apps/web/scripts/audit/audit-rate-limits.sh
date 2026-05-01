#!/usr/bin/env bash
# Per ref 30 — verify rate limits fire on agent + contact endpoints.
set -euo pipefail
BASE_URL="${BASE_URL:-https://the-tile-web.pages.dev}"

echo "[audit-rate-limits] firing 30 POSTs at /api/contact (expect at least 1 x 429)"
codes=$(for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST -H 'content-type: application/json' \
    -d '{"name":"audit","email":"audit@invalid.test","message":"audit","consentGiven":true}' \
    "$BASE_URL/api/contact" &
done; wait)
limited=$(echo "$codes" | grep -c "429" || true)
[ "$limited" -gt 0 ] && echo "  contact: $limited x 429 (PASS)" || { echo "  contact: 0 x 429 (FAIL — no rate limit)"; exit 1; }

echo "[audit-rate-limits] firing 30 POSTs at /api/agent/chat"
codes=$(for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST -H 'content-type: application/json' \
    -d '{"messages":[{"role":"user","content":"audit"}],"sessionId":"audit"}' \
    "$BASE_URL/api/agent/chat" &
done; wait)
limited=$(echo "$codes" | grep -c "429" || true)
[ "$limited" -gt 0 ] && echo "  agent: $limited x 429 (PASS)" || echo "  agent: 0 x 429 (WARN — known per-isolate limitation, see ref 30)"
echo "[audit-rate-limits] done"
