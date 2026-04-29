-- 0003_shopify_admin.sql — adds the rest of the Shopify-influenced admin
-- tables that ref 18 promised but only Collections shipped (JOB G).
-- Per ref 19 § Class 5 every editable row has a `version` column.

-- === leads === (already in 0000_init.sql + 0001_lead_status.sql)

-- === pages ===============================================================
-- Admin-editable pages (about, faq, care-guide, custom). Public catch-all
-- at app/(public)/[slug]/page.tsx reads from this table.
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,                  -- markdown source
  body_html TEXT,                         -- rendered cache (regenerated on save)
  seo_title TEXT,
  seo_description TEXT,
  template TEXT NOT NULL DEFAULT 'default',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  is_policy INTEGER NOT NULL DEFAULT 0,   -- privacy/terms/refund/shipping/contact
  position INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 0,
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);

-- === menus (navigation) ==================================================
-- Header / footer / mega-shop menus. items_json is a nested list:
-- [{label, href, children?: [...]}]
CREATE TABLE IF NOT EXISTS menus (
  id TEXT PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,            -- 'header','footer','mega-shop'
  label TEXT NOT NULL,
  items_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- === theme settings (singleton) ==========================================
-- One row, id='singleton'. tokens_json carries the full --color-* set.
-- Public layout reads this and injects <style> at request time.
CREATE TABLE IF NOT EXISTS theme_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  tokens_json TEXT NOT NULL,
  custom_css TEXT,
  logo_src TEXT,
  logo_alt TEXT,
  favicon_src TEXT,
  og_default_src TEXT,
  version INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- === products ============================================================
-- Per-product CRUD. Replaces the seed-JSON-as-source-of-truth model from
-- v1.x. Public product pages read from D1; if no rows exist yet (first
-- migration) the seed JSON is the bootstrap source.
-- === agent_settings (singleton) ==========================================
-- One row, id='singleton'. The system prompt + persona + voice rules. The
-- agent route reads this at request time (no rebuild needed to update tone).
CREATE TABLE IF NOT EXISTS agent_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  persona_name TEXT NOT NULL DEFAULT 'Concierge',
  voice TEXT NOT NULL,
  rules_json TEXT NOT NULL DEFAULT '[]',  -- array of strings
  fallback_contact TEXT,
  hand_off_phone TEXT,
  hand_off_email TEXT,
  custom_kb_md TEXT,                      -- extra knowledge added to the system prompt
  version INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- === redirects ===========================================================
-- Edge middleware reads from this. 301 by default. Used for legacy URL
-- migration (the-tile.com had old Weebly URLs we want to redirect).
CREATE TABLE IF NOT EXISTS redirects (
  id TEXT PRIMARY KEY,
  from_path TEXT UNIQUE NOT NULL,
  to_path TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302)),
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_redirects_active ON redirects(active);

-- === site_settings (singleton) ===========================================
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  store_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  hours TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  timezone TEXT NOT NULL DEFAULT 'Europe/Malta',
  default_locale TEXT NOT NULL DEFAULT 'en',
  robots_txt_extra TEXT,                  -- appended to default robots.txt
  google_analytics_id TEXT,
  plausible_domain TEXT,
  version INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

