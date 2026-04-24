# Runbook — Gemini outage

**When**: `/api/agent/chat` returns errors at a rate above 5% for 5 minutes, or Google AI Studio posts a service advisory.

## Immediate fallback

The agent route emits a polite-fallback SSE on upstream failure:

```
data: {"error":"busy"}
data: [DONE]
```

The client renders this as *"Our concierge is having a moment. Browse the collections, or drop us a note and we will come back to you personally."* and keeps the rest of the site fully usable.

## Check the cause

1. https://status.cloud.google.com/ — look for Gemini API incidents.
2. Cloudflare dashboard → Workers → agent-proxy → Logs. Filter `level=error`.
3. Sentry → issues tagged `agent-api`.

## Common causes

| Symptom | Likely cause | Fix |
|---|---|---|
| 401 from upstream | API key rotated/expired | Rotate `GEMINI_API_KEY` (see `secrets-rotation.md`) |
| 429 on every call | Quota exhausted | Check monthly spend in AI Studio; raise cap or switch model |
| 5xx with no pattern | Google-side incident | Wait; keep the fallback live |
| Timeouts on every call | Region outage | Re-check in 15 min; open support ticket after 30 |

## Verify recovery

```
curl -N -X POST https://the-tile.com/api/agent/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"show me marble"}],"sessionId":"runbook"}'
```

Should stream `data: {"delta":"…"}` frames within 2 seconds.

## Model degradation fallback

If Flash-Lite is failing but Flash is not, set `GEMINI_MODEL=gemini-flash-latest` in CF Pages env for the production environment and trigger a redeploy. Revert once upstream is healthy.
