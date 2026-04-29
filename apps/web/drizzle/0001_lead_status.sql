-- Adds the `status` column the admin uses for the leads inbox pipeline.
-- 0000 created the leads table without it; this migration adds it lazily.
-- D1 doesn't support `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, so wrap in
-- a try/catch idiom: this migration may fail on already-applied schemas
-- (safe to ignore — `pnpm drizzle-kit generate` would skip it next time).

ALTER TABLE leads ADD COLUMN status TEXT NOT NULL DEFAULT 'new';
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
