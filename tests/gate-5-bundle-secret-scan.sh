#!/usr/bin/env bash
# Gate 5b — no API keys / tokens leaked into the build output.
set -e

OUT="apps/web/.next"
if [ ! -d "$OUT" ]; then
  echo "Build output not found at $OUT. Run 'pnpm build' first."
  exit 1
fi

PATTERNS=(
  "AIza"            # Google API keys
  "sk_live_"        # Stripe live secret
  "rk_live_"        # Stripe live restricted
  "ghp_"            # GitHub OAuth tokens
  "github_pat_"     # GitHub fine-grained PAT
  "re_"             # Resend API keys (re_xxxxx)
  "Bearer ey"       # JWTs
  "ntn_"            # Notion tokens
  "xoxb-"           # Slack bot tokens
)

FAIL=0
for p in "${PATTERNS[@]}"; do
  if matches=$(grep -r -l "$p" "$OUT" 2>/dev/null); then
    echo "FAIL secret pattern '$p' found in:"
    echo "$matches"
    FAIL=$((FAIL + 1))
  fi
done

if [ "$FAIL" -gt 0 ]; then
  echo "$FAIL secret patterns found in build output. Investigate before deploy."
  exit 1
fi
echo "PASS — no secret patterns in build output."
