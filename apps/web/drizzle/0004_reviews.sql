-- 0004_reviews.sql — admin-managed customer reviews.
--
-- Replaces the hardcoded apps/web/lib/reviews.ts with a D1-backed
-- table so a non-technical operator can add / edit / archive reviews
-- from /admin/reviews. Per ref 22 IF NOT EXISTS, ref 19 § Class 5
-- every editable row has a `version` column.
--
-- Apply:
--   pnpm wrangler d1 migrations apply the-tile-staging --remote
--   pnpm wrangler d1 migrations apply the-tile-prod    --remote

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  location TEXT,
  date TEXT NOT NULL,                             -- ISO YYYY-MM-DD
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  quote TEXT NOT NULL,
  source TEXT,                                    -- 'showroom' / 'google' / 'facebook' / etc.
  product_id TEXT,                                -- optional series id (e.g. tele-di-marmo-revolution)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  placeholder INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status, date DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- Seed: the 13 placeholder reviews previously hardcoded in lib/reviews.ts.
-- Inserted once on first migration; OR IGNORE keeps re-runs idempotent and
-- preserves any operator edits that happen after seeding.
INSERT OR IGNORE INTO reviews (id, author, location, date, rating, title, quote, source, product_id, status, placeholder, version, created_at, updated_at) VALUES
('r1','Karen M.','Sliema','2026-02-18',5,'Unhurried, honest, genuinely knowledgeable','I walked in with a Pinterest board and a kitchen plan and walked out forty minutes later with three samples, none of which were the tiles I thought I wanted. Two months later I am sitting in the kitchen and they were absolutely right. Thank you.','showroom','tele-di-marmo-revolution','active',1,0,1761908400000,1761908400000),
('r2','Matthew G.','Birkirkara','2026-01-30',5,'The outdoor 20mm delivered a month early','We were dreading the Italian lead time. The 20mm paving came in under five weeks, was laid before Easter, and has survived a full winter without a mark. Good advice on the slip rating — R11 was the right call for the pool edge.','showroom',NULL,'active',1,0,1761908400000,1761908400000),
('r3','Ruth S.','Naxxar','2026-01-12',5,'Bathroom feels like a hotel now','Gesso in the 60x120 format across floor and walls. Calm, soft, slightly warm. The concierge chatbot on the site was actually helpful — it pointed me at the series and then the team in the showroom backed up what it said.','showroom','gesso','active',1,0,1761908400000,1761908400000),
('r4','Paul D.','St Julian''s','2025-12-08',4,'Good tile, patient advice on the grout','Bought Salt Stone for a hallway and a small kitchen. The tile is beautiful; my issue was with the grout colour which we got slightly wrong on the first box. The team replaced the grout, no fuss, and the finished floor looks like it was laid by someone who knew what they were doing.','showroom','salt_stone','active',1,0,1761908400000,1761908400000),
('r5','Maria C.','Mdina','2025-11-26',5,'Thirty years of taste','My parents bought tiles from The Tile in the nineties. It is a different generation running the showroom now but the taste is still there. We did a full renovation on an old Mdina house and the porcelain we picked sits properly with the limestone and the wood. No cheap sheen.','showroom',NULL,'active',1,0,1761908400000,1761908400000),
('r6','Andrei V.','Msida','2025-10-14',5,'Actually understood what a commercial floor needs','Specified for a physio clinic — R10, porcelain, colour-body, high-traffic tolerance. The team asked all the right questions and the Ergon range they pulled was exactly the brief. Installation went clean.','showroom',NULL,'active',1,0,1761908400000,1761908400000),
('r7','Sarah B.','Mellieha','2025-09-02',5,'Showroom visit worth the drive','Drove from Mellieha on a Saturday morning, half expecting to be rushed through. Spent the best part of an hour with the owner looking at wood-effect in different lights. No pressure, no upsell. Booked the Provoak the next week and it has been installed since July.','showroom','provoak','active',1,0,1761908400000,1761908400000),
('r8','Joseph F.','Qormi','2025-08-19',4,NULL,'Stone-effect for an outdoor courtyard. Arrived on schedule, laid beautifully. Four stars because the pricing felt a touch ambitious, but the quality is there and the support after the sale is what will bring me back for the next project.','showroom',NULL,'active',1,0,1761908400000,1761908400000),
('r9','Elena T.','Gzira','2025-07-03',5,'Large format, no fuss','120x240 marble-effect slabs for a feature wall. Everyone told me it would be a nightmare to install. The team recommended a fitter who actually knew how to handle large formats and the result is one of the best rooms in the house.','showroom','tele-di-marmo-onyx','active',1,0,1761908400000,1761908400000),
('r10','Conrad A.','Swieqi','2025-06-21',5,'Concrete-effect that does not look cheap','Concrete-effect is everywhere now and most of it looks awful. Viva''s range here is the exception. We put it in the living area and the contrast with the wooden ceiling is perfect. Compliments every time a guest walks in.','showroom',NULL,'active',1,0,1761908400000,1761908400000),
('r11','Anna B.','Attard','2025-05-12',5,'Samples, samples, samples','I took eight samples home and lived with them for ten days. The team never once chased me. When I came back with my pick, they already knew my brief and had the formats confirmed. That is service.','showroom',NULL,'active',1,0,1761908400000,1761908400000),
('r12','David P.','Gharghur','2025-04-04',4,NULL,'Restoring a townhouse. Wanted terracotta-effect that read authentic. The Kotto range they showed us was spot on. Delivery had a minor snag — the wrong box arrived first — but was corrected within a week. Would recommend for anyone doing a heritage project.','showroom',NULL,'active',1,0,1761908400000,1761908400000),
('r13','Michela C.','Lija','2025-03-18',5,'Renovation sanity-saver','We are doing a whole-house renovation and tile choices were sinking me. One afternoon in the San Gwann showroom with the team laying out combinations and suddenly every room had a direction. The quote was thorough, the fitter they recommended was excellent.','showroom',NULL,'active',1,0,1761908400000,1761908400000);
