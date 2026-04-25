---
name: rollback
description: Revert to the previous deployment. Trigger when operator says "rollback", "undo the last deploy", "the new version is broken — go back". Reverts via Cloudflare Pages API; previous build becomes the active deployment within seconds.
---

# rollback

Roll back to the previous deployment.

## What it does
1. Lists last 5 deployments from CF Pages API; identifies the previous successful one.
2. Surfaces: "About to roll back from <current-hash> to <previous-hash>. Confirm?"
3. On confirm: calls CF Pages "rollback" via wrangler / API.
4. Verifies new active deployment is the rollback target.
5. Reports done.

## ⚠ Destructive (but reversible)
Rollback itself is destructive in the sense that it changes what's live. Operator confirms once. Reversible — can always roll forward.

## ⚠ No paid action
Free.
