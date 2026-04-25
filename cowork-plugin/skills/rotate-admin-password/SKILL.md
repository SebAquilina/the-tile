---
name: rotate-admin-password
description: Change the admin Basic Auth credentials (ADMIN_USER / ADMIN_PASSWORD). Trigger when operator says "rotate the admin password", "change my admin login". Handles the BUILD_TIME-inlining gotcha — env var update + redeploy in one go.
---

# rotate-admin-password

Rotate admin credentials.

## Inputs
- New username (optional — defaults to keeping current).
- New password (optional — generates a strong one if absent).

## What it does
1. Generates a strong random password if not given (24 chars, mixed).
2. Updates `ADMIN_PASSWORD` (and optionally `ADMIN_USER`) in CF Pages env (Production + Preview).
3. Triggers a deploy via `gh workflow run deploy.yml`.
4. Waits for new deployment to go live.
5. Verifies new credentials with `gate-5-admin-auth.sh`.
6. Surfaces the new password to the operator (in a way that bypasses chat history — e.g. "I've put the new password in your clipboard; paste it into your password manager now.").

## ⚠ No paid action
Free. CI minutes are free under standard GitHub plan.

## ⚠ Why this is one skill
ADMIN_USER / ADMIN_PASSWORD are read by Edge middleware as BUILD_TIME-inlined values. Updating the env var without redeploying does NOTHING — the v1 build hit this bug. This skill handles both steps atomically so the credential is always live after the skill returns.
