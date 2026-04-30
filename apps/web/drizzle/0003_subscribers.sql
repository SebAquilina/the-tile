-- 0003_subscribers.sql — newsletter subscribers (was a phantom-form before).
-- Per ref 19 § Class 9 (no silent drops) + the-tile phantom-UI audit P0 #1.

CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','unsubscribed','bounced','spam')),
  source TEXT NOT NULL DEFAULT 'footer',
  consent_given INTEGER NOT NULL DEFAULT 1,  -- footer copy is opt-in by submission
  ip_hash TEXT,
  ua TEXT,
  unsubscribe_token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status, created_at DESC);
