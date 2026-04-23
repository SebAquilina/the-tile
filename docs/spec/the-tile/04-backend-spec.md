# 04 — Backend Spec

**Project**: The Tile · agent-first rebuild

---

## 1. Stack

**Runtime**: **Cloudflare Pages Functions + Workers**, both on the CF Edge network.
**Database**: **Cloudflare D1** (SQLite at the edge).
**Email**: **Resend** (transactional, 100 free/day, enough for quote requests).
**Bot protection**: **Cloudflare Turnstile** (free, invisible by default).
**Secrets**: CF Pages + Workers environment variables.
**Monitoring**: **Sentry** + CF Logs.

**Why this stack for this project**: agent-first sites are latency-sensitive — the user is having a conversation, and proxy round-trips make that feel sluggish. Edge runtime (Workers / Pages Functions) keeps every endpoint co-located with the user. D1 is enough database for a quote-only site (no high-throughput transactional load, no complex joins). Resend is the simplest transactional-email story. Everything here stays on Cloudflare's free/near-free tier for the expected traffic of a Malta tile showroom.

---

## 2. Data model

Data shape. Implementation agent: generate Drizzle ORM migrations from this directly.

### `products` (synced from `seed/products.seed.json` at build — this table is a *cache*, source of truth is the JSON)

```sql
CREATE TABLE products (
  id           TEXT PRIMARY KEY,              -- slug
  name         TEXT NOT NULL,
  effect       TEXT NOT NULL,                 -- one of the 9 effect slugs
  brand        TEXT,
  summary      TEXT NOT NULL,
  description  TEXT,
  url          TEXT NOT NULL UNIQUE,
  source_url   TEXT,                          -- original the-tile.com URL for ops reference
  tags         TEXT,                          -- JSON array as string
  usage        TEXT,                          -- JSON array as string
  best_for     TEXT,                          -- JSON array as string
  attributes   TEXT,                          -- JSON object as string
  images       TEXT,                          -- JSON array as string
  in_stock     INTEGER NOT NULL DEFAULT 1,    -- 0 or 1
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_products_effect ON products(effect);
CREATE INDEX idx_products_brand  ON products(brand);
```

A `scripts/sync-products.ts` script runs at build (and on-demand via a GitHub Action when the seed changes). It truncates the table and re-inserts from `seed/products.seed.json`. Never hand-edit this table — always edit the JSON and redeploy.

### `categories` (effects + usage tags)

```sql
CREATE TABLE categories (
  id        TEXT PRIMARY KEY,                 -- effect or usage slug
  name      TEXT NOT NULL,
  type      TEXT NOT NULL,                    -- 'effect' | 'usage'
  summary   TEXT,
  source_url TEXT
);
```

Also synced from seed.

### `brands`

```sql
CREATE TABLE brands (
  id        TEXT PRIMARY KEY,                 -- slug
  name      TEXT NOT NULL,
  logo_url  TEXT,
  body      TEXT,                             -- Markdown description
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### `leads` (form submissions + quote requests)

```sql
CREATE TABLE leads (
  id              TEXT PRIMARY KEY,           -- uuid generated server-side
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  source          TEXT NOT NULL,              -- 'contact-form' | 'agent' | 'save-list'
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  project_notes   TEXT,
  saved_tile_ids  TEXT,                       -- JSON array
  area_m2         REAL,
  consent_marketing INTEGER NOT NULL DEFAULT 0,
  consent_privacy INTEGER NOT NULL DEFAULT 1,
  ip_hash         TEXT,                       -- SHA-256 of IP for rate-limiting, not identity
  user_agent      TEXT,
  email_status    TEXT,                       -- 'pending' | 'sent' | 'failed'
  status          TEXT NOT NULL DEFAULT 'new' -- 'new' | 'contacted' | 'quoted' | 'closed'
);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
```

### `agent_sessions` (for rate-limiting + lightweight analytics, not user identity)

```sql
CREATE TABLE agent_sessions (
  id              TEXT PRIMARY KEY,           -- random session id, cookie-backed
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_message_at TEXT,
  message_count   INTEGER NOT NULL DEFAULT 0,
  ip_hash         TEXT
);
CREATE INDEX idx_agent_sessions_ip ON agent_sessions(ip_hash);
CREATE INDEX idx_agent_sessions_last ON agent_sessions(last_message_at);
```

No user accounts table. No carts. No orders. Quote-driven business — the lead is the conversion.

### Migrations

Drizzle ORM for schema + migrations. Migration file path: `apps/web/drizzle/`. Every schema change:
1. Edit Drizzle schema in `apps/web/db/schema.ts`
2. `pnpm drizzle-kit generate` produces a new migration file
3. Commit both schema + migration
4. Deploy runs migration against D1 (staging, then prod) via `wrangler d1 migrations apply`

---

## 3. API routes

All routes live under `/api/*` as Next.js route handlers, running on the Edge runtime (`export const runtime = 'edge'`). They consume D1 and external APIs via `process.env` / the CF platform bindings.

### `POST /api/agent/chat` — the Gemini proxy

**The most important endpoint on the site.** Gets deep spec treatment below in §4.

### `POST /api/contact` — form submission / quote request

Request:
```ts
{
  name: string,              // required, 2-100 chars
  email: string,             // required, email format
  phone?: string,
  projectNotes?: string,     // free text, up to 2000 chars
  savedTileIds?: string[],   // ids from products.json
  areaM2?: number,           // optional
  consent: {
    privacy: true,           // must be true to submit
    marketing: boolean,
  },
  turnstileToken: string,    // required, validated server-side
}
```

Response:
```ts
{ ok: true, leadId: string }
// or
{ ok: false, error: 'validation' | 'turnstile' | 'rate_limit' | 'server' }
```

Behaviour:
1. Validate Zod schema
2. Verify Turnstile token with CF Turnstile API
3. Rate-limit: 3 submissions/hour per IP hash, 10/day
4. Insert lead into D1
5. Send email via Resend to The Tile's shop inbox (templated — see §6)
6. Return leadId

### `GET /api/products`

Used when the client needs filtered products without a full page reload (e.g. FilterBar async updates). Returns paginated products matching query filters.

Query: `?effect=marble&usage=bathroom&tag=warm&sort=name&limit=24&offset=0`

Response:
```ts
{
  items: Product[],
  total: number,
  facets: { effects: Record<string, number>, brands: Record<string, number>, tags: Record<string, number> }
}
```

Edge-cached for 5 minutes via Cloudflare cache headers.

### `GET /api/products/:id`

Returns a single full product record with related tiles (same-collection, same-effect, complementary).

### `POST /api/save-list/sync` (optional)

For logged-out users, save-list lives in `sessionStorage`. For Phase 2 (if auth is added), this endpoint persists the list server-side. Stubbed for Phase 1 but schema-ready.

### `GET /api/health`

Returns `{ ok: true, version: string, time: string }` for uptime monitoring. No DB access.

---

## 4. Gemini proxy — deep spec

### Request handling

```ts
// app/api/agent/chat/route.ts
export const runtime = 'edge';

export async function POST(request: Request) {
  // 1. Parse + validate
  const { messages, sessionId } = await request.json();
  // ... Zod validation ...

  // 2. Rate limit
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const ipHash = await sha256(ip + env.IP_HASH_SALT);
  if (await exceedsRateLimit(db, ipHash, sessionId)) {
    return new Response('Rate limit', { status: 429 });
  }

  // 3. Load static context (baked at build, not per-request)
  const systemPrompt = SYSTEM_PROMPT; // imported from /lib/agent-system-prompt.ts (generated from spec/07 at build)
  const grounding = SITE_KNOWLEDGE;   // imported from /lib/site-knowledge.ts (generated from spec/06 at build)

  // 4. Build Gemini request body (see §4.2)
  const body = {
    contents: messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    systemInstruction: { parts: [{ text: `${systemPrompt}\n\n---\n\nSITE KNOWLEDGE:\n${grounding}` }] },
    generationConfig: {
      temperature: 0.5,
      topP: 0.95,
      maxOutputTokens: 800,
    },
  };

  // 5. Call Gemini and stream
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:streamGenerateContent?key=${env.GEMINI_API_KEY}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  // 6. Update session counters (fire-and-forget)
  await incrementAgentSession(db, sessionId, ipHash);

  // 7. Pipe stream to client
  return new Response(geminiRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
```

### Model config

| Param | Value | Reason |
|---|---|---|
| Model | `gemini-3.1-flash-lite` | Cheapest current-gen Gemini ($0.25/M in, $1.50/M out), 1M ctx, fast TTFT. Upgradable to `gemini-3.1-pro` later via env var if quality needs demand it. |
| Temperature | 0.5 | Warm but not erratic. Italian-concierge voice needs some character without hallucinating product facts. |
| topP | 0.95 | Standard |
| maxOutputTokens | 800 | ≈600 words. Enough for a rich concierge response, caps worst-case cost. |
| Safety | default | No content-moderation issues expected in tile shopping |
| Stream | true | Critical for UX — streaming text feels conversational, non-streaming feels like a page load |

### Rate limiting

- **Per IP hash**: 30 messages / minute, 200 / hour. Prevents scraping + abuse.
- **Per session**: 500 / day. A real user having a long conversation rarely exceeds 50-100 turns.
- **Bot gate**: Turnstile token required on the **first** message of a session. After that, the session is trusted.

Stored in D1 `agent_sessions` table (see §2) plus a simple in-memory KV cache on the Worker for fast path.

### Structured-output trailer for navigation directives

The agent plain-text streams its reply, then emits — at the very end of the response — a sentinel + JSON trailer:

```
[streamed reply text]

---ACTIONS---
[{"type":"filter","data":{"effect":"marble","usage":"bathroom"}}]
```

Client parsing:
1. Collect streamed chunks
2. When the stream ends, look for the last occurrence of `---ACTIONS---\n`
3. Parse whatever follows as JSON
4. Strip the sentinel + trailer from the displayed reply
5. Emit each action through the event bus

Sentinel is included verbatim in the system prompt (see `07-agent-system-prompt.md`). Gemini Flash-Lite handles this reliably with `temperature: 0.5`. In dev we've seen ~99% sentinel emission compliance; the 1% fail case is "agent emitted text reply with no actions" which is benign.

### Cost + quota management

Baseline assumption: 500 unique visitors/month, 20% engage the agent, avg 6 turns per conversation, avg ~400 tokens per turn (input+output combined).

```
500 × 0.20 × 6 × 400 tokens = 240,000 tokens/month
```

At Gemini 3.1 Flash-Lite rates, ≈ $0.10 input + $0.25 output per month — call it **$1-2/month at current volume**. Even 10× traffic is sub-$20/month. The Gemini cost is not a line-item to worry about for this scale.

Set a CF Worker-level budget cap via `env.MONTHLY_TOKEN_CAP`: if exceeded, the agent replies "I'm taking a short break — in the meantime, please browse the collections or drop us a note." This protects against runaway bills if someone weaponises the proxy.

---

## 5. Integrations

### Resend (transactional email)

- **Purpose**: notify The Tile's shop inbox when a lead is submitted
- **API key**: `RESEND_API_KEY` env var, server-only
- **Template**: plain-but-branded HTML + text, both versions
- **Rate**: 100/day free, plenty for expected volume
- **Failure mode**: if Resend fails, the lead still persists in D1; a retry cron (CF Scheduled Worker) retries every 15min, up to 4 attempts

Template variables: `{{ name, email, phone, projectNotes, savedTiles[], areaM2, leadId, adminUrl }}`
adminUrl = `https://the-tile.com/admin/leads/[id]` (Phase 2 — for now, The Tile manages leads from the emailed notification + optional CSV export).

### Turnstile

- **Purpose**: bot gate on contact form + first agent message per session
- **Site key**: public, injected into frontend build
- **Secret**: `TURNSTILE_SECRET` env var, used server-side for verification
- **Failure mode**: if the challenge fails, the user sees a "please try again" message. No silent blocking.

### Plausible (analytics)

- **Purpose**: pageview + conversion tracking, GDPR-simple
- **No PII stored**, no cross-site tracking, no cookies
- Custom events: `agent.opened`, `agent.message_sent`, `agent.action_emitted`, `save_list.added`, `contact.submitted`
- Domain: `the-tile.com` (configure in Plausible dashboard)

### Sentry

- **Purpose**: errors + performance on the frontend + API routes
- **DSN**: `NEXT_PUBLIC_SENTRY_DSN` (safe in frontend — keys are public-designed)
- **Source maps uploaded at deploy** via `SENTRY_AUTH_TOKEN` (GitHub Actions secret, not in frontend env)
- **Sample rate**: 10% of transactions in prod, 100% of errors
- **PII**: scrub email/phone in payloads via `beforeSend`

---

## 6. Email templates

Template for the "new lead" email sent to The Tile. Both HTML and text versions. Render with a lightweight templating function (no external lib needed).

```
Subject: New enquiry from {{name}} — {{savedTiles.length}} tiles saved

{{name}} just sent a message via the-tile.com.

Contact:
  Email: {{email}}
  {% if phone %}Phone: {{phone}}{% endif %}

{% if areaM2 %}Approximate area: {{areaM2}} m²{% endif %}

{% if projectNotes %}
Their notes:
  {{projectNotes}}
{% endif %}

{% if savedTiles.length %}
They've saved these tiles:
{% for tile in savedTiles %}
  — {{tile.name}} ({{tile.effect}}) — the-tile.com{{tile.url}}
{% endfor %}
{% endif %}

Reply to this email to contact them directly.
Lead ID: {{leadId}}
```

HTML version has a single CTA button to reply and a styled list of saved tiles with thumbnail images.

---

## 7. Environment variables

`.env.example`:

```
# App
NEXT_PUBLIC_SITE_URL=https://the-tile.com

# Gemini
GEMINI_API_KEY=                         # server-only
MONTHLY_TOKEN_CAP=5000000               # soft cap, adjust per billing comfort

# Cloudflare D1 (bound via wrangler.toml, not env var, but for reference)
# DB binding name: DB

# Resend
RESEND_API_KEY=                         # server-only
RESEND_FROM=noreply@the-tile.com
RESEND_TO_SHOP=shop@the-tile.com        # The Tile's notification inbox

# Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET=                       # server-only

# Plausible
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=the-tile.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=                      # GitHub Actions only (source-maps upload)

# Security
IP_HASH_SALT=                           # random 32+ char string, server-only
```

Each variable documented in `README.md` with: what it's for, where to get it, failure mode if missing.

---

## 8. Observability

- **Uptime monitor**: Better Stack or UptimeRobot pinging `/api/health` every 1 min, `/` every 5 min, `/api/agent/chat` with a scripted HEAD every 15 min
- **Alerts**: error-rate spike in Sentry → Slack webhook, uptime failures → email, unusual Gemini token burn → weekly digest email
- **Log retention**: CF Logs 7d default (enough for debugging); Sentry 30d; D1 data retained indefinitely (it's quote leads, they matter)

---

## 9. Definition of Done (backend)

- D1 schema deployed on staging + prod
- All API routes live, rate-limited, and schema-validated
- Gemini proxy: streams, injects system prompt + grounding, handles Turnstile on first message
- Resend sending lead emails on form submission, retry cron active
- All env vars set in CF Pages + Worker settings, nothing in repo
- `/api/health` returns 200 from staging + prod
- Error tracking verified by deliberately-thrown test
- GDPR privacy page live, cookie policy live, no non-essential cookies set before consent

## 10. Open questions (backend)

- **Lead CSV export**: Phase 1 ships email-only notification. A lightweight admin UI for The Tile to view/export leads is a natural Phase 2. Mention in pitch as "the foundation supports it — shipping in Phase 2."
- **WhatsApp integration**: "Contact us on WhatsApp" as a direct `wa.me` link in Phase 1. A real WhatsApp Business API integration (replies from within an admin panel) is substantial effort — Phase 3 at earliest.
- **Sample request flow**: right now "save to list" + "request quote" is one combined flow. Some tile shops do a separate "request a physical sample" flow. Flag with The Tile — may be a Phase 2 nice-to-have.
