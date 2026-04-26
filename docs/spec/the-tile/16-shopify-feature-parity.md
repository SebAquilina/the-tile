# Shopify-feature-parity admin — comprehensive inventory + agent-first scope

This file enumerates every site-owner feature available in Shopify (as of April 2026) and maps each to a recommendation for an **agent-first non-commerce / lead-funnel site** (the skill's primary target). Use this as the master feature backlog for `references/13-admin-panel-sop.md` and the build prompt for any project's admin section.

> ⚠ **No purchases without consent.** Every feature in this list that would trigger a paid action — Stripe live mode, paid plan upgrade on a connected service, broadcast emails over a free quota, app-store paid app installs, domain registrations / renewals, paid theme purchases — is gated by a per-action confirmation. Two-step: (1) confirm intent; (2) type the cost amount to authorize. Server-enforced, not just UX. Restated in every admin section that gates these.

---

## Legend

| Tag | Meaning |
|---|---|
| 🔴 **CORE** | Must-have in v1 of any agent-first site admin |
| 🟠 **STANDARD** | Add when the site has a relevant feature surface (e.g. checkout pages → checkout settings) |
| 🟡 **EXTENDED** | Nice-to-have; build on demand |
| 🟢 **E-COMM ONLY** | Only relevant if the site sells things via on-site checkout — skip for catalog-only / lead-funnel sites |
| ⚪ **POS ONLY** | Only relevant if the operator has physical retail; out of scope for web-only |
| 💎 **PLUS / ENTERPRISE** | Shopify Plus features; out of scope for small-business builds |

---

## 1. Home / Dashboard

| Shopify feature | Tag | Agent-first equivalent |
|---|---|---|
| Overview cards (sales, visitors, returning customers) | 🔴 CORE | Visitors, conversations, leads, agent cost, top products |
| Live visitor count | 🟠 STANDARD | Real-time count via Plausible or D1 events |
| Activity timeline | 🟠 STANDARD | Every admin write + every customer-side event in last 24h |
| Sales trends, conversion rate | 🟢 E-COMM ONLY | For lead-funnel: visitor → conversation → lead funnel |
| KPI cards customisable | 🟡 EXTENDED | Drag-drop dashboard layout, persist per-user |
| Onboarding checklist | 🟡 EXTENDED | First-login tour from `references/13` Section 10 |
| Tasks (e.g. "respond to 3 abandoned carts") | 🟢 E-COMM ONLY | For agent-first: "respond to 3 unflagged conversations" |
| Recent orders snippet | 🟢 E-COMM ONLY | Replace with: recent leads, recent flagged conversations |

## 2. Orders 🟢 E-COMM ONLY (skip entirely for catalog-only)

If the site has on-site checkout, ship the full Orders section per Shopify:
- Order list (filterable: status, date, customer, channel, tag)
- Order detail (items, customer, payment, fulfillment, notes, tags, timeline)
- Fulfillment workflow (manual / automated, shipping labels, tracking)
- Partial / full refunds + cancellations
- Print packing slips, invoices
- Draft orders (manual order entry)
- Abandoned checkouts (recover via email, see partial cart)
- Order risk analysis (Shopify-native fraud heuristics)
- Order tags + bulk actions
- Order export (CSV)
- Order timeline events

For lead-funnel sites: **skip the entire Orders section**. There are no orders. The Customers/Leads section absorbs the lead-tracking workflow.

## 3. Products / Catalog

| Shopify feature | Tag | Notes |
|---|---|---|
| Catalog list/grid view | 🔴 CORE | Sortable, filterable, bulk-selectable |
| Add product — title, description, status (draft/active/archived) | 🔴 CORE | Rich-text description editor |
| Add product — media (drag-drop upload, alt text, ordering, focal point) | 🔴 CORE | R2 storage + Cloudflare Images for resize variants |
| Variants matrix (size × color × …) | 🟠 STANDARD | Auto-generates per-variant rows; per-variant SKU/price/inventory/image |
| Inventory tracking (per-location) | 🟠 STANDARD | Quantity, SKU, barcode, "track" toggle, "out of stock" behaviour |
| Pricing — regular, compare-at, cost (margin shown) | 🔴 CORE | Cost & margin not shown to customers; admin-only |
| Tax class | 🟢 E-COMM ONLY | |
| Vendor, type, tags, collections | 🔴 CORE | Manual selection + auto-collection rules ("All terrazzo tiles") |
| Search engine listing (SEO title/desc/slug + character count) | 🔴 CORE | |
| Product status (active/draft/archived) | 🔴 CORE | Draft = not visible publicly; archived = hidden from new listings, kept for reporting |
| Visibility per sales channel | 🟠 STANDARD | For agent-first: visibility per page/section (home, brand page, search results) |
| CSV import/export | 🟠 STANDARD | Accept Shopify product CSV format for portability |
| Bulk edit | 🔴 CORE | Multi-select → bulk price/status/tag edit |
| Product videos / 3D models | 🟡 EXTENDED | Many tile/furniture sites benefit from this |
| Gift card products | 🟢 E-COMM ONLY | |
| Subscriptions | 🟢 E-COMM ONLY | |
| Cost & margin tracking | 🟡 EXTENDED | Operator-only; helps with pricing decisions |
| Weight + customs info | 🟢 E-COMM ONLY | |
| Schema/structured data preview | 🟠 STANDARD | Verify Google's Rich Results test passes |
| AI product description generator | 🟡 EXTENDED | Powered by Gemini/Claude; one-click "draft a description from these specs" |
| AI image background remover | 🟡 EXTENDED | For catalog photography hygiene |
| Compare-at-price (sale flag) | 🟢 E-COMM ONLY (price-driven) | Lead-funnel sites can skip |

## 4. Customers / Leads

| Shopify feature | Tag | Notes |
|---|---|---|
| Customer list (segments, tags, lifetime spend) | 🔴 CORE | For agent-first: leads list with stage workflow |
| Customer detail (orders, addresses, notes, communications) | 🔴 CORE | All form submissions + agent conversations + manual notes |
| Customer notes & tags | 🔴 CORE | |
| Marketing consent | 🔴 CORE | GDPR-required: opt-in/out for email/SMS; track consent date+source |
| Customer accounts (login) | 🟡 EXTENDED | Lead-funnel sites usually skip; e-comm needs |
| Saved payment methods | 🟢 E-COMM ONLY | |
| Order history per customer | 🟢 E-COMM ONLY | Replace with: lead history (timeline of contacts) |
| Customer segments (saved filters) | 🟠 STANDARD | "Leads from agent in last 30d", "leads tagged 'high-value'" |
| Customer reviews | 🟠 STANDARD | Moderation queue (approve/reject); display on product pages |
| Loyalty/rewards | 🟢 E-COMM ONLY | Out of scope for catalog-only |
| Bulk email/SMS to customers | 🟠 STANDARD | Triggered marketing message; ⚠ paid-action confirm above sender's free tier |
| GDPR data export & deletion | 🔴 CORE | Per-customer "export my data" + "delete my data"; required by EU regulation |
| Customer lifetime value, average order value | 🟢 E-COMM ONLY | Replace with: lead-to-conversion-rate, time-to-close, source breakdown |

## 5. Marketing

| Shopify feature | Tag | Notes |
|---|---|---|
| Discount codes (%, fixed, free shipping, BOGO, volume) | 🟢 E-COMM ONLY | If checkout exists |
| Automatic discounts (no code) | 🟢 E-COMM ONLY | |
| Gift cards | 🟢 E-COMM ONLY | |
| Promotional bars / banners | 🔴 CORE | Top-of-site banner with CTA + countdown + scheduled show/hide |
| Pop-ups | 🟠 STANDARD | Email-capture pop-up; gated by GDPR consent |
| Email campaigns (manual broadcast) | 🟠 STANDARD | Compose + recipient picker + send-test + ⚠ paid-action confirm above provider's free tier |
| Email automation (welcome series, abandoned cart, post-purchase) | 🟠 STANDARD | For lead-funnel: welcome series + lead-nurture series + form-not-completed reminder |
| SMS campaigns | 🟡 EXTENDED | ⚠ Always paid; per-message confirm |
| Push notifications | 🟡 EXTENDED | Browser push; gated by user consent |
| Marketing automation flows (if-this-then-that) | 🟡 EXTENDED | Visual flow builder; trigger → condition → action chains |
| Campaign performance (opens / clicks / conversions) | 🟠 STANDARD | Per-email + aggregate |
| A/B testing | 🟡 EXTENDED | Subject lines, banner copy, agent greeting variants |
| Sales channels (Shop / POS / marketplaces) | 🟢 E-COMM ONLY (mostly) | |
| SEO tools (sitemap, robots.txt, redirects, meta defaults) | 🔴 CORE | Auto-generated sitemap.xml + RSS; redirect editor for old URLs |
| Search & Discovery (boost / pin / synonyms) | 🟠 STANDARD | Internal site search tuning |
| Search trends report | 🟡 EXTENDED | What customers searched for (and what came up empty) |
| Affiliate program | 🟡 EXTENDED | Track referrals; commission management |
| Social media auto-post | 🟡 EXTENDED | New product → auto-post to Instagram/Facebook |

## 6. Content

| Shopify feature | Tag | Notes |
|---|---|---|
| Pages (about, contact, custom) | 🔴 CORE | Rich text + image blocks + video embed + custom HTML (advanced) |
| Blog posts (multi-author, scheduled, RSS) | 🔴 CORE | If the site has a journal/news section |
| Navigation menus (header / footer / mobile) | 🔴 CORE | Drag-drop tree builder |
| Files / asset library | 🟠 STANDARD | Upload + browse + bulk delete; PDFs, images, videos |
| Metaobjects (custom data types) | 🟡 EXTENDED | Define custom data types (e.g. "Studio location" with name/address/photo) used by storefront sections |
| Search filters configuration | 🟠 STANDARD | Which facets to show in catalog search |
| Footer customisation | 🔴 CORE | Editable footer text, links, social icons |
| Cookie banner | 🔴 CORE | GDPR-mandatory if the site collects PII or uses tracking |
| Privacy / Terms / Refund / Shipping policies | 🔴 CORE | Auto-generated templates with edit; edit-then-publish |
| FAQ | 🟠 STANDARD | Q&A pairs; auto-feeds the agent's KB so it can answer them |

## 7. Online Store / Theme — the Shopify customizer

This is the section non-technical owners use most. Top priority for v1 admin.

| Shopify feature | Tag | Notes |
|---|---|---|
| Theme library (free + paid themes) | 🟢 E-COMM ONLY (mostly) | Agent-first sites typically have one custom theme |
| Theme customizer (drag-drop sections + blocks) | 🔴 CORE | The visual editor with live preview iframe |
| Color palette editor | 🔴 CORE | Color picker with palette presets + accessibility checker |
| Typography (font picker, base size, line-height, heading weights) | 🔴 CORE | Curated Google Fonts dropdown + named pairings |
| Logo (light + dark variants) + favicon | 🔴 CORE | Upload, auto-optimize, served via CF Images |
| Spacing & density slider (compact/standard/spacious) | 🔴 CORE | One slider scales the whole spacing scale |
| Motion intensity slider (none/subtle/standard/lively) | 🔴 CORE | Honors `prefers-reduced-motion` automatically |
| Border radius slider | 🟠 STANDARD | Sharp / soft / round preset |
| Sections (drag-drop home page builder) | 🔴 CORE | Hero / featured products / image+text / testimonials / FAQ / etc. |
| Section groups (header/footer reused) | 🟠 STANDARD | Edit once, applies everywhere |
| Templates (home, product, collection, page, blog) | 🟠 STANDARD | Per-template customisation |
| App embeds (chat, reviews widget) | 🟠 STANDARD | Toggles for optional integrations |
| Custom CSS injection | 🟡 EXTENDED | Behind "Advanced" toggle; saved as separate stylesheet |
| Theme code editor (full Liquid/code editor) | 💎 PLUS / advanced | Out of scope for non-technical operators |
| Preview without publishing | 🔴 CORE | Iframe of staging URL with `?draftId=...` |
| Mobile / desktop / tablet preview toggle | 🔴 CORE | One click to switch viewport |
| Publish / revert | 🔴 CORE | Atomic publish; one-click rollback to previous published state |
| Compare versions | 🟠 STANDARD | Diff view of theme settings between any two versions |
| Translations (multi-language) | 🟠 STANDARD | If site supports multiple languages |
| Currency localization | 🟢 E-COMM ONLY | |

## 8. AI Agent — what makes the agent-first admin different from Shopify

This entire section is **NEW** vs Shopify (Shopify has Shopify Magic but doesn't have a stand-alone agent admin). The agent-first skill must ship this.

| Feature | Tag | Notes |
|---|---|---|
| Persona (name, tone slider, language, pronouns) | 🔴 CORE | Drives system prompt synthesis |
| System prompt visual editor | 🔴 CORE | Sectioned editor (identity, scope, tone, refusal rules, navigation directives, fallback). Advanced toggle reveals raw prompt |
| Prompt version history with rollback | 🔴 CORE | Every prompt change retained for 90 days |
| Knowledge base preview (read-only `06-site-knowledge.md`) | 🔴 CORE | Searchable; line-anchors; "what does the agent know about X?" |
| KB regeneration trigger | 🔴 CORE | Rebuild from current published catalog/content/FAQ |
| Test playground | 🔴 CORE | Type a query, see response + token cost; "save as test case" |
| Conversation log | 🔴 CORE | Every dialog with PII auto-redacted; flag bad responses |
| Quick-reply chip editor | 🟠 STANDARD | The 3–4 default CTAs the greeting card shows |
| Fallback behaviour | 🔴 CORE | What happens when agent says "I don't know": show contact form / FAQ / redirect |
| Cost monitoring (today's tokens, monthly burn, projection) | 🔴 CORE | Daily cost graph; alert at threshold |
| Cost cap setting (hard ceiling — agent goes silent past cap) | 🔴 CORE | Prevents runaway costs from scrapers; ⚠ raising the cap is a paid-action confirm |
| Rate limit (per-IP per-minute) | 🔴 CORE | Default 60/IP/min |
| Conversation analytics (avg length, completion rate, top intents, top out-of-scope) | 🟠 STANDARD | KPIs that drive prompt-iteration decisions |
| Multi-agent / multi-prompt routing | 🟡 EXTENDED | Different agents for different sections (concierge vs support) |

## 9. Analytics / Reports

| Shopify feature | Tag | Notes |
|---|---|---|
| Dashboards (sales, traffic, customers, marketing) | 🔴 CORE | Tabbed dashboards per area |
| Live View (real-time visitors, on-page actions) | 🟠 STANDARD | Map of visitors right now + what page they're on |
| Reports (live + historical) | 🔴 CORE | Page views, conversions, sources |
| Customers by location | 🟠 STANDARD | Country level (no IP exposure) |
| Sessions by source / device / browser | 🔴 CORE | |
| Conversion funnel | 🔴 CORE | Visitor → conversation → lead → primary action |
| Top products / collections | 🔴 CORE | By views, conversations mentioning, conversions |
| Sales by traffic source / referrer / search keyword | 🟢 E-COMM ONLY (sales) | Replace with: leads by source |
| Returning vs new customers | 🟠 STANDARD | |
| Average order value, lifetime value | 🟢 E-COMM ONLY | |
| Marketing attribution | 🟠 STANDARD | First-touch, last-touch, multi-touch |
| Custom reports | 💎 PLUS | Out of scope |
| Speed report | 🟠 STANDARD | Lighthouse-derived; flag perf regressions per deploy |
| Inventory reports | 🟢 E-COMM ONLY | |
| Custom events tracking | 🟠 STANDARD | Per-event stream from the site |

## 10. Settings

### 10a. General
🔴 CORE: Store details (name, contact, address, time zone), logo, favicon, currency display, unit system, sender email, domain settings, SSL status, customer accounts setting.

### 10b. Payments 🟢 E-COMM ONLY
Payment providers, manual payment methods, authorization timing, refunds, multi-currency, test mode toggle. **All paid-action gated** — Stripe live mode, PayPal accept, etc.

### 10c. Checkout 🟢 E-COMM ONLY
Customer accounts (classic vs passwordless), form options, address autocomplete, tipping, abandoned-cart timing, order processing.

### 10d. Shipping & delivery 🟢 E-COMM ONLY
Zones, rates, carrier-calculated shipping, local pickup/delivery, package types, carrier accounts.

### 10e. Taxes & duties 🟢 E-COMM ONLY
Regions, overrides, charge tax on shipping, VAT, compliance reporting.

### 10f. Locations ⚪ POS ONLY (mostly)
Multiple warehouses/stores, per-location inventory, pickup options.

### 10g. Markets 💎 PLUS
Multi-country, per-market language/currency/domain, market-specific pricing.

### 10h. Notifications 🔴 CORE
Customer email templates (each transactional email editable), staff notifications (new lead, low inventory if applicable), email/SMS routing, webhooks.

### 10i. Users and permissions 🔴 CORE
Staff accounts (invite, roles), permission templates, two-step authentication, activity log per user. Roles in agent-first admin: Owner / Admin / Editor / Viewer.

### 10j. Plan / Billing 🟠 STANDARD
Subscription tier, usage/billing, payment method, bills/receipts. **All paid-action gated** for upgrades. For agent-first: tracks Cloudflare/Resend/Sentry/Plausible spending.

### 10k. Brand 🟠 STANDARD
Brand assets library (logos, colors, slogan, cover image). For agent-first: this is where the v1.4-extracted `brand.json` lives + the operator can override extracted values.

### 10l. Languages 🟡 EXTENDED
Add languages, translations editor, default language per market.

### 10m. Policies 🔴 CORE
Refund / Privacy / Terms / Shipping / Contact policies. Auto-generated templates with edit. The Privacy + Terms pages are required for any site collecting PII.

### 10n. Files 🟠 STANDARD
File library (images, videos, PDFs); search/filter; bulk upload; public URLs per file.

### 10o. Custom data (Metafields) 🟡 EXTENDED
Define custom fields per resource (product, variant, customer, page, etc.). Reference-type fields. Used by themes for custom storefront data.

### 10p. Apps and sales channels 🟠 STANDARD
Manage installed apps (Resend, Sentry, Plausible, Slack, etc.); enable/disable; per-app billing transparency.

### 10q. Backup & export 🔴 CORE
"Export everything" → ZIP of DB dump + R2 contents + theme settings JSON + brand assets. Used for client handoffs and disaster recovery.

## 11. POS ⚪ POS ONLY
Skip entirely for web-only sites.

## 12. Apps / Integrations

| Shopify feature | Tag | Notes |
|---|---|---|
| App store browse + install | 💎 (Shopify-specific) | Not relevant for non-Shopify builds |
| Per-app permissions | 🔴 CORE | If the build has any third-party integration |
| App embeds in theme | 🟠 STANDARD | |
| Custom apps (developer-built) | 🟡 EXTENDED | |

For agent-first: replace with **Integrations panel** in Settings. Each integration (Resend, Sentry, Plausible, Slack, Stripe, etc.) has a status card (connected/disconnected/error), config button, paid-action gate for upgrades.

## 13. Shopify Magic (AI features)

| Feature | Tag | Notes |
|---|---|---|
| AI product description generator | 🟡 EXTENDED | One-click "draft a description from these specs" |
| AI image background remover | 🟡 EXTENDED | For product photo hygiene |
| AI email writer | 🟡 EXTENDED | Compose campaigns with AI assist |
| AI semantic search | 🟡 EXTENDED | Natural-language site search ("show me dark blue tiles for a kitchen") |
| AI translation | 🟡 EXTENDED | Auto-translate strings |
| AI chat (built-in customer support agent) | (covered) | The agent-first skill IS this — it's the primary surface |

## 14. Other site-owner features

| Feature | Tag | Notes |
|---|---|---|
| Wishlist / Save list | 🔴 CORE (if catalog) | Save-list / favourite products |
| Customer reviews moderation | 🟠 STANDARD | Approve / reject / flag spam |
| Subscriptions | 🟢 E-COMM ONLY | |
| Pre-orders | 🟢 E-COMM ONLY | |
| Bundles | 🟢 E-COMM ONLY | |
| Cross-sell / upsell rules | 🟢 E-COMM ONLY | |
| Recently viewed | 🟠 STANDARD | Visitor session tracking |
| Compare products | 🟠 STANDARD | Side-by-side comparison |
| Quick view | 🟠 STANDARD | Modal preview from catalog grid |
| Live chat (Shopify Inbox) | (covered) | The agent IS the live chat surface for agent-first sites |
| FAQ pages | (covered in Content) | |
| Customer service tickets | 🟡 EXTENDED | If the site needs a support workflow |
| Affiliate program | 🟡 EXTENDED | |
| Influencer collaborations | 🟡 EXTENDED | |

---

## Implementation roadmap for the-tile (and any agent-first site)

The 11-section admin from `references/13-admin-panel-sop.md` already covers most CORE features. Use this priority order to flesh out the missing details:

### Tier 1 — Ship these in v1 of the admin (immediate operator value)

**Products** (currently shipped at /admin/products):
- ✅ List + edit existing
- ❌ Add new product (full editor with image upload to R2)
- ❌ CSV import / export
- ❌ Bulk edit (multi-select → bulk price/status/tag)
- ❌ Variants matrix UI
- ❌ "Where this is used" panel (cross-section dependency surfacing)

**Customers / Leads** (currently shipped at /admin/leads):
- ✅ List + read
- ❌ Lead-stage workflow (New → Contacted → Won / Lost)
- ❌ Notes & tags
- ❌ Segments (saved filters)
- ❌ Export CSV
- ❌ GDPR delete-my-data per record

**Theme editor** (NOT shipped yet — biggest gap for non-technical edits):
- ❌ Color picker with palette presets + AA contrast checker
- ❌ Font picker (curated Google Fonts + named pairings)
- ❌ Logo upload (R2)
- ❌ Spacing density slider, motion intensity slider, border radius slider
- ❌ Sections drag-drop home page builder
- ❌ Live preview iframe with desktop/tablet/mobile toggle
- ❌ Publish / revert / version compare

**Content** (NOT shipped yet — needed for non-developer copy edits):
- ❌ Pages editor (rich text + blocks; about/contact/custom)
- ❌ Navigation drag-drop builder
- ❌ FAQ editor (auto-feeds agent KB)
- ❌ Footer customisation
- ❌ Cookie banner config
- ❌ Privacy / Terms / Cookies policy editor

**AI Agent** (NOT shipped — agent currently configured via code):
- ❌ Persona settings (name, tone, language)
- ❌ System prompt visual editor
- ❌ Test playground
- ❌ Conversation log with flag-bad-response
- ❌ Cost cap setting (hard ceiling; ⚠ raise = paid-action confirm)
- ❌ Quick-reply chip editor

### Tier 2 — Add when needed (project-specific)

**Marketing**: discount codes, promo banners, broadcast emails (paid-gated).
**Analytics dashboard**: page views (Plausible), agent metrics, conversion funnel.
**Conversations** (separate from agent settings): list + flagging UI.

### Tier 3 — Enterprise-y; add only if scale demands

Multi-language translation editor, metaobjects, multi-location inventory, multi-currency, app marketplace.

---

## Database schema additions for full feature parity

The v2 admin spec (`references/13`) already covers most of these tables. Additions needed for v1.5 feature parity:

```sql
-- Tier 1 additions
CREATE TABLE pages (id, slug, title, draft_jsonb, published_jsonb, version);
CREATE TABLE nav_menus (id, location, draft_tree_jsonb, published_tree_jsonb);
CREATE TABLE faq_items (id, q, a, category_id, draft, published, order);
CREATE TABLE theme_settings (id, draft_jsonb, published_jsonb, version);
CREATE TABLE agent_settings (id, persona, system_prompt_draft, system_prompt_published, fallback_config);
CREATE TABLE conversations (id, ip_hash, started_at, ended_at, message_count, outcome, language);
CREATE TABLE conversation_turns (id, conversation_id, role, content, ts, tokens_in, tokens_out);
CREATE TABLE conversation_flags (id, turn_id, user_id, reason);
CREATE TABLE leads (id, name, email, phone, message, source, status, tags, notes, agent_captured);
CREATE TABLE lead_stages (id, name, order);
CREATE TABLE _revisions (table_name, record_id, prev_state, new_state, diff, user_id, ts);
CREATE TABLE users (id, email, role, last_login);
CREATE TABLE sessions (token, user_id, expires_at);

-- Tier 2 additions
CREATE TABLE discount_codes (id, code, type, value, conditions, limits, status);
CREATE TABLE promo_banners (id, headline, cta, schedule_start, schedule_end, status);
CREATE TABLE email_broadcasts (id, subject, body, segment_query, scheduled_at, sent_at, recipient_count);
CREATE TABLE events (id, name, payload, ts, ip_hash);

-- Tier 3 additions (enterprise)
CREATE TABLE translations (id, locale, key, value);
CREATE TABLE metaobjects (id, type_id, fields_jsonb);
```

All editable resources have `draft` + `published` columns + a `_revisions` row per change. Live preview reads `draft`; live site reads `published`.

---

## Realistic build sequence for any agent-first site

| Sprint | Sections | Estimate |
|---|---|---|
| 1 | Foundation: session auth + roles + CSRF + draft/publish state machine + `_revisions` table | 1 Claude Code session |
| 2 | Products full editor (add/edit/variants/images/CSV/bulk) + Leads full UI | 1 session |
| 3 | Theme editor (live preview iframe + color picker + font picker + sections) | 1 session |
| 4 | Content editor (pages + nav + FAQ + footer + policies) | 1 session |
| 5 | AI Agent admin (persona + prompt editor + test playground + conversation log) | 1 session |
| 6 | Analytics dashboard (Plausible wired + agent metrics + funnel) | 1 session |
| 7 | Marketing (discounts + banners + broadcast) + Settings (integrations + users + backup) | 1 session |
| 8 | Cowork plugin per-skill backends (Gate 8 parity) + final tests | 1 session |

**Total: ~8 sessions of Claude Code, $50–150 in tokens.** The full Shopify-feature-parity build is a multi-week project; this skill ships the spec + the foundation, the build is execution.

---

## ⚠ The no-purchase rule is woven through every gated feature

Restated for emphasis. Every feature in this inventory that touches money — Stripe live mode, paid plan upgrades, broadcast emails over free quotas, paid SaaS sign-ups, domain renewals, Shopify-style app marketplace installs of paid apps — is gated by a two-step confirmation:

1. **Step 1 — Intent**: "You're about to {action}. This costs {amount} {frequency}. Continue?"
2. **Step 2 — Authorization**: "Type the cost amount to confirm: ____"

Server-enforced via authorization tokens, not just UX. Pre-authorisations don't carry over. Implicit consent doesn't exist. The admin and Cowork plugin mirror each other on this — the user cannot bypass by switching surfaces.
