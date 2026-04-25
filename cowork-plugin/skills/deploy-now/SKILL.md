---
name: deploy-now
description: Trigger a production deploy. Trigger when operator says "push the changes live", "deploy", "ship it". Requires CI green; if red, surfaces the error and offers to wait or fix.
---

# deploy-now

Deploy to production.

## What it does
1. Verifies CI is green on `main`.
2. If staged drafts exist, runs `POST /api/admin/publish-all-drafts` first.
3. Triggers deploy via `gh workflow run deploy.yml`.
4. Watches the run; reports completion / failure.
5. On success, runs Gate 0 reachability against production.

## ⚠ No paid action
Free unless the deploy triggers a paid resource (rare). If it would, skill halts and surfaces the cost.
