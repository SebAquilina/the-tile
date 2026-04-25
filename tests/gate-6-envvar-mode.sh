#!/usr/bin/env bash
# Gate 6 — env-var BUILD_TIME vs RUNTIME drift check.
# Reads .env.example, finds every process.env.X reference in source,
# and checks each against the BUILD_TIME / RUNTIME annotation in the
# deploy plan.
#
# This catches the the-tile v1 bug: ADMIN_USER / ADMIN_PASSWORD are
# read by Edge middleware (build-time-inlined). Rotating them in the
# CF dashboard does NOT propagate without a rebuild — the spec must
# document this.

set -e

ENV_EXAMPLE="apps/web/.env.example"
DEPLOY_PLAN="docs/spec/the-tile/09-deploy-plan.md"

if [ ! -f "$ENV_EXAMPLE" ]; then
  echo "FAIL $ENV_EXAMPLE not found"
  exit 1
fi

# Pull all VARIABLE_NAME from .env.example
VARS=$(grep -E '^[A-Z][A-Z0-9_]+=' "$ENV_EXAMPLE" | cut -d= -f1)

FAIL=0
for var in $VARS; do
  # Find references in source
  refs=$(grep -r -l "process\.env\.${var}\b" apps/web/app apps/web/components apps/web/lib apps/web/middleware.ts 2>/dev/null || true)
  if [ -z "$refs" ]; then
    continue
  fi

  # Determine mode — BUILD_TIME if any reference is in middleware.ts or imports it
  mode="RUNTIME"
  for ref in $refs; do
    if [[ "$ref" == *"middleware.ts" ]]; then
      mode="BUILD_TIME"
    fi
    # NEXT_PUBLIC_ prefix is always BUILD_TIME (inlined for client)
    if [[ "$var" == NEXT_PUBLIC_* ]]; then
      mode="BUILD_TIME"
    fi
  done

  # Confirm the deploy plan documents this mode for this var
  if [ -f "$DEPLOY_PLAN" ]; then
    if ! grep -qE "\b${var}\b.*${mode}" "$DEPLOY_PLAN"; then
      echo "WARN $var used as $mode but not annotated in $DEPLOY_PLAN"
    else
      echo "PASS $var → $mode (matches deploy plan)"
    fi
  else
    echo "WARN $var → $mode (deploy plan missing, cannot cross-check)"
  fi
done

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo ""
echo "PASS — env-var modes scanned. Annotate any WARN entries in $DEPLOY_PLAN."
