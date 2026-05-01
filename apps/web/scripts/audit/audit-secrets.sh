#!/usr/bin/env bash
# Per ref 11 + ref 22 — fail if any LLM/CI secret leaks into the deployed JS bundle.
# Per ref 21 phantom-UI audit + ref 26 build-script pitfalls.
set -euo pipefail

BASE_URL="${BASE_URL:-https://the-tile-web.pages.dev}"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "[audit-secrets] target: $BASE_URL"

# Pull the home page
curl -s "$BASE_URL/" > "$TMPDIR/index.html"

# Find every static chunk it references
mapfile -t chunks < <(grep -oE '/_next/static/chunks/[a-zA-Z0-9._/-]+\.js' "$TMPDIR/index.html" | sort -u)
echo "[audit-secrets] found ${#chunks[@]} chunks"

# Download each
for chunk in "${chunks[@]}"; do
  curl -s "$BASE_URL$chunk" >> "$TMPDIR/bundle.js"
done

# Patterns: per ref 22 + ref 25 secret hygiene rule
PATTERNS=(
  "sk-ant-[A-Za-z0-9_-]{20,}"
  "sk-[A-Za-z0-9]{30,}"
  "AIza[A-Za-z0-9_-]{30,}"
  "ghp_[A-Za-z0-9]{30,}"
  "github_pat_[A-Za-z0-9_]{30,}"
  "cfut_[A-Za-z0-9_-]{30,}"
  "re_[A-Za-z0-9]{20,}"
  "ANTHROPIC_API_KEY"
  "GEMINI_API_KEY"
  "GITHUB_TOKEN"
  "RESEND_API_KEY"
  "ADMIN_PASSWORD"
)
fail=0
for p in "${PATTERNS[@]}"; do
  hits=$(grep -coE "$p" "$TMPDIR/bundle.js" || true)
  if [ "$hits" != "0" ] && [ -n "$hits" ]; then
    echo "[audit-secrets] FAIL: pattern '$p' matched $hits times"
    fail=1
  fi
done
if [ $fail -eq 0 ]; then
  echo "[audit-secrets] OK — 0 leaks"
  exit 0
fi
exit 1
