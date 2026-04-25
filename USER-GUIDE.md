# The Tile — user guide

Plain-language guide for whoever owns or operates **the-tile.com**. Read this once; come back to specific sections as needed.

> ⚠ **No purchase, plan upgrade, paid sign-up, or money movement happens on your behalf without your explicit per-action "yes" in chat. Every paid item — domain renewal, paid SaaS tier, broadcast emails over free quota — is a separate confirmation. If anything tries to spend money silently, type "halt".**

---

## What the site is

A storefront for a Maltese artisan tile workshop. Agent-first: every visitor lands on a chat concierge that asks *"what kind of tile are you looking for?"* and guides them. Behind the chat, a full visual catalog with collections, brands, journal, reviews, contact, showroom info.

**Live URL:** https://www.the-tile.com

---

## What you have

| Asset | Where |
|---|---|
| Live site | https://www.the-tile.com |
| Admin panel | https://www.the-tile.com/admin |
| Source code | https://github.com/SebAquilina/the-tile |
| Hosting dashboard | Cloudflare Pages, account `cfd32b6623c3b1adce7345cdff737d14` |
| Database | Cloudflare D1 (`the-tile-prod`, `the-tile-staging`) |
| Email sender | Resend (free tier — 100/day) |
| Error tracking | Sentry (free tier — 5k errors/mo) |
| Cowork plugin | `cowork-plugin/` in the repo (skeleton today; full when v2 admin lands) |

**Recurring cost today:** ~$3–5/month, dominated by domain renewal amortised + Gemini API for the agent. Everything else is free tier.

---

## How to make changes

You have two ways: the admin panel, or Cowork.

### Via admin panel (https://www.the-tile.com/admin)

What's working today: dashboard placeholder, leads inbox, products list+editor, reviews inbox.

What's not yet built (per `15-admin-panel-spec.md`): conversations log, marketing tools, content editor, theme customizer, agent settings UI, analytics dashboard, full settings. These land via the next Claude Code build session.

Until they do, theme / content / agent edits go through Cowork (or a developer).

### Via Cowork (conversational)

Open Cowork, install the plugin (`/install-plugin cowork-plugin`), and say what you want:

| Say | What happens |
|---|---|
| *"Add this product from products.xlsx"* | New tile in draft, agent KB regenerates |
| *"Change the home hero subhead to X"* | Edits the page in draft |
| *"Make the agent warmer"* | Edits the system prompt in draft |
| *"Rotate the admin password"* | New password + redeploy in one step (closes the BUILD_TIME bug) |
| *"Send a broadcast about the new collection"* | Drafts the email — paid-action confirm if recipients exceed Resend free tier |
| *"Roll back the last deploy"* | Reverts to previous deployment |
| *"What did we do today?"* | KPI summary |

Every change goes through a draft. Nothing on the live site moves until you say *"deploy"* (or click Publish in admin).

---

## What's costly to know

| Resource | Free tier | When it costs |
|---|---|---|
| Cloudflare Pages | unlimited | never for this site |
| Cloudflare D1 | 5M reads/day, 100k writes/day, 5GB | not at our scale |
| Cloudflare Workers (agent proxy) | 100k req/day | $5/mo if exceeded |
| Resend (email) | 100/day, 3000/mo | $20/mo for Pro |
| Sentry (errors) | 5k/mo | $26/mo+ |
| Gemini API (agent) | none — pay per token | $1–3/mo at small scale |
| Domain | already paid | annual renewal |

**Every upgrade is gated by per-action confirmation.** None happens silently. Cowork tells you *"this will cost $X — confirm?"* and waits.

---

## What to do if something breaks

| Situation | What to type |
|---|---|
| Cowork is stuck | *"summarise where you're stuck"* |
| Something looks wrong on the live site | *"rollback the last deploy"* |
| The admin won't let you in | *"rotate the admin password"* (it'll redeploy too) |
| Cowork is about to spend money you didn't approve | *"halt"* |
| You want to bail on a change | *"discard the draft"* |
| You want to know what the agent has been doing | *"show me today's conversations"* (works once the v2 Conversations section ships) |

---

## What's coming next

The site is functional today but the admin is shallow (4 of 11 v2 sections). The v2 retrofit currently in `the-tile-v2-retrofit/` ships:
- Documentation (this file, plus the page-by-page guide, client-handoff runbook, admin spec)
- Test scripts (gate-0 reachability, gate-5 headers / admin-auth, gate-6 env-var modes, gate-10 admin security)
- The fixed `deploy.yml` that unblocks every push
- The Cowork plugin skeleton

The v2 build (a fresh Claude Code session) finishes the missing 7 admin sections, the live preview iframe, the draft/publish state machine, version history, and Cowork plugin backends. Estimated 6–8 sessions of Claude Code work, $30–80 of token spend, **zero infrastructure cost** unless you opt into a paid tier (per-action confirm always required).

---

## ⚠ Final reminders

- **No paid action without your explicit "yes" per action.** Every time. Always.
- **Drafts before live, always.** Nothing on the production site changes until you hit publish.
- **`halt`** is the master kill switch. Type it any time anything feels off.
- **You own everything.** The repo, the CF project, the domain, the source, the plugin. No vendor lock-in.

If you're handing this site to a client, follow `docs/spec/the-tile/14-client-handoff-runbook.md` step-by-step. Operator never enters client's payment details. Per-step confirms.
