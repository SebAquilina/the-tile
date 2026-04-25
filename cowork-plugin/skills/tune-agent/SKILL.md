---
name: tune-agent
description: Edit the AI agent — persona, tone, system prompt, fallback behaviour, quick reply chips, languages. Trigger when operator says "make the agent warmer", "the agent should refuse pricing questions", "change what the agent does when it doesn't know", "rename the agent to X". Writes to draft `agent_settings`; live test playground confirms before publish.
---

# tune-agent

Edit agent settings.

## Inputs
- Free-text instruction.
- Optional: a sample dialog the operator wants the agent to handle correctly.

## What it does (post-v2-admin)
1. PATCH `/api/admin/agent` with the parsed change.
2. Test playground runs against the draft prompt.
3. KB does NOT regenerate (prompt is independent of KB).
4. Reports: token cost of the change, sample response.
5. Operator runs `deploy-now` to publish.

## ⚠ No paid action
Free. Token cost on the test playground is logged to BUILD_LOG.md.
