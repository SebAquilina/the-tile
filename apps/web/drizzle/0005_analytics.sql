-- 0005_analytics.sql — Shopify-parity behavior analytics for the-tile.com.
-- Same shape as concierge-studio's 0003_analytics.sql; INTEGER epoch ms
-- timestamps in the new tables (legacy `leads.created_at` stays TEXT ISO).

CREATE TABLE IF NOT EXISTS analytics_sessions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  lead_id TEXT,
  landing_path TEXT NOT NULL,
  referrer TEXT,
  referrer_host TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  device TEXT NOT NULL CHECK (device IN ('mobile','tablet','desktop','bot','unknown')),
  browser TEXT,
  os TEXT,
  ua_raw TEXT,
  ip_hash TEXT,
  started_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  ended_at INTEGER,
  pageview_count INTEGER NOT NULL DEFAULT 0,
  total_dwell_ms INTEGER NOT NULL DEFAULT 0,
  engaged_with_front INTEGER NOT NULL DEFAULT 0,
  asked_front_question INTEGER NOT NULL DEFAULT 0,
  reached_quote_step INTEGER NOT NULL DEFAULT 0,
  submitted_lead INTEGER NOT NULL DEFAULT 0,
  converted_to_won INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sessions_client ON analytics_sessions(client_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_lead ON analytics_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON analytics_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON analytics_sessions(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_country ON analytics_sessions(country);
CREATE INDEX IF NOT EXISTS idx_sessions_landing ON analytics_sessions(landing_path);
CREATE INDEX IF NOT EXISTS idx_sessions_device ON analytics_sessions(device);

CREATE TABLE IF NOT EXISTS analytics_pageviews (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  path TEXT NOT NULL,
  title TEXT,
  referrer_path TEXT,
  ts INTEGER NOT NULL,
  dwell_ms INTEGER,
  FOREIGN KEY (session_id) REFERENCES analytics_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pv_session ON analytics_pageviews(session_id, ts);
CREATE INDEX IF NOT EXISTS idx_pv_path ON analytics_pageviews(path, ts);
CREATE INDEX IF NOT EXISTS idx_pv_ts ON analytics_pageviews(ts DESC);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  path TEXT NOT NULL,
  payload TEXT,
  ts INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES analytics_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_events_kind ON analytics_events(kind, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_ts ON analytics_events(ts DESC);

CREATE TABLE IF NOT EXISTS customer_tags (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  color TEXT,
  created_at INTEGER NOT NULL,
  created_by TEXT,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  UNIQUE (lead_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_tags_lead ON customer_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag ON customer_tags(tag);

CREATE TABLE IF NOT EXISTS customer_notes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  created_by TEXT,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notes_lead ON customer_notes(lead_id, created_at DESC);

CREATE TABLE IF NOT EXISTS daily_pulse (
  id TEXT PRIMARY KEY,
  pulse_date TEXT NOT NULL UNIQUE,
  sessions INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  avg_dwell_seconds INTEGER NOT NULL DEFAULT 0,
  bounce_rate REAL NOT NULL DEFAULT 0,
  engaged INTEGER NOT NULL DEFAULT 0,
  asked_front INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  quotes_sent INTEGER NOT NULL DEFAULT 0,
  quotes_accepted INTEGER NOT NULL DEFAULT 0,
  mobile_share REAL NOT NULL DEFAULT 0,
  top_country TEXT,
  top_landing_path TEXT,
  top_referrer_host TEXT,
  ai_summary TEXT,
  anomalies_json TEXT,
  generated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pulse_date ON daily_pulse(pulse_date DESC);
