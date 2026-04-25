# The Tile — Cowork plugin

Conversational interface to maintain https://www.the-tile.com from your desktop. Every admin operation has an equivalent here.

> ⚠ **No purchase, plan upgrade, paid sign-up, or money movement happens without your explicit per-action "yes" in chat. Default-deny. Pre-authorisations don't carry over. If anything tries to spend money, type "halt".**

---

## Install

In Cowork, open the the-tile repo and run:

```
/install-plugin cowork-plugin
```

Cowork validates `plugin.json`, registers each skill, and announces ready.

---

## Skills (12)

| Skill | What it does | Paid-action gate? |
|---|---|---|
| `update-product` | Edit a product's price, copy, images, variants | No |
| `add-product` | Create a new product (single or bulk from CSV/Excel) | No |
| `edit-page` | Edit any public page's content | No |
| `update-theme` | Change colors, fonts, font sizes, logo, motion | No |
| `tune-agent` | Edit the agent persona, system prompt, fallback | No |
| `regenerate-kb` | Force-rebuild the agent's knowledge base | No |
| `view-leads` | List recent contact-form + agent-captured leads | No |
| `deploy-now` | Trigger a production deploy (after CI green) | No |
| `rollback` | Revert to the previous deployment | No |
| `rotate-admin-password` | Change admin creds + redeploy (BUILD_TIME-inlined) | No |
| `broadcast-email` | Send a campaign to leads | ⚠ **YES** if volume > Resend free tier (100/day) |
| `analytics-summary` | Print today's KPIs in chat | No |

---

## Commands (slash)

(None yet — to be added as the v2 admin builds out.)

---

## Connectors

The plugin doesn't ship its own connectors. It uses what Cowork already has:
- Google Drive (if catalog lives there)
- Slack (for deploy notifications, if wired)
- Whatever else Seb has connected

---

## Status

- **plugin.json validates ✅**
- **Skill stubs present ✅** (each `skills/<name>/SKILL.md` contains the contract)
- **Per-skill backends:** ❌ pending Claude Code v2 admin build (per `CLAUDE-CODE-NEXT-PROMPT.md`)

The skeleton makes the contract clear; the actual API wiring lands as part of the admin panel build because most skills hit `/api/admin/*` endpoints that don't fully exist yet. Until then, the most-mature skills (catalog edits via the existing `/api/admin/products`, leads view via `/api/admin/leads`) work; theme / agent / analytics are stubs.

---

## How a skill talks to the site

```
Seb says to Cowork: "change the home hero subhead to 'Crafted in Malta since 1972'"
   ↓
Cowork triggers skills/edit-page/SKILL.md
   ↓
Skill identifies target = home page, section = hero, field = subhead
   ↓
Skill calls POST /api/admin/content/pages/home with { draft.hero.subhead: "Crafted in Malta since 1972" }
   ↓
the-tile API authenticates Cowork's session token, writes to draft state, returns diff
   ↓
Skill summarises the change to Seb: "I've staged this change in draft. Run 'deploy-now' to publish, or 'preview' to see it on staging."
   ↓
Seb confirms.
```

Every mutation goes through a draft → publish flow once the v2 admin lands. Nothing on production changes until the publish step runs.

---

## ⚠ The no-purchase rule

Restated because it matters most:

- `broadcast-email` halts before sending if recipient count × send rate would exceed Resend's free quota for the day. It surfaces "this will cost $X" and waits for "yes."
- `rotate-admin-password` is free, but redeploys cost CI minutes. CI minutes are free under GitHub's standard plan; Cowork verifies you're not on a paid plan upgrade path before triggering.
- Any future skill that touches Stripe, paid SaaS, or domain renewals must implement the same per-action confirm pattern.

If a skill skips the confirm, it's broken. Report it.
