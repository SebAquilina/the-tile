---
name: regenerate-kb
description: Force-rebuild the agent's knowledge base from current published catalog + content + FAQ. Trigger when operator adds/edits products or content and wants the agent to know about them immediately. Auto-fired by `add-product` and `edit-page`; manually invokable.
---

# regenerate-kb

Rebuild the agent's KB.

## What it does
1. POST `/api/admin/agent/regenerate-kb`.
2. Backend runs `apps/web/scripts/build-agent-context.ts` against current published state.
3. Writes new `docs/spec/the-tile/06-site-knowledge.md`.
4. Commits to repo (auto-PR).
5. Auto-merge fires if the diff is KB content only.
6. Cron-triggered redeploy picks it up within ~5 min.

## ⚠ No paid action
Free.
