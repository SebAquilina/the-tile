---
name: analytics-summary
description: Print today's KPIs in chat — visitors, conversations, leads, agent cost, top pages, conversion funnel. Trigger when operator says "how did we do today", "show me the analytics", "what's the agent costing". Read-only.
---

# analytics-summary

Daily KPI summary.

## Inputs
- Time window (today / yesterday / this week / this month / custom). Default: today.

## What it does
1. Aggregates events from D1 + Plausible (when wired).
2. Surfaces: visitors, conversations, completion rate, leads created, agent cost (today / projected monthly), top pages, top sources, top exit pages, top out-of-scope agent queries.
3. Offers: "drill into <metric>", "open admin analytics for full view", "export CSV".

## ⚠ No paid action
Read-only.
