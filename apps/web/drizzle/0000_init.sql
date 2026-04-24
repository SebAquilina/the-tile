-- Initial D1 schema for The Tile.
--
-- Apply:
--   pnpm wrangler d1 migrations apply the-tile-staging --remote
--   pnpm wrangler d1 migrations apply the-tile-prod    --remote
--
-- Regenerate from db/schema.ts via `pnpm drizzle-kit generate`.

CREATE TABLE IF NOT EXISTS `products` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `effect` text NOT NULL,
  `brand` text,
  `summary` text NOT NULL,
  `description` text,
  `url` text NOT NULL,
  `source_url` text,
  `attributes_json` text,
  `images_json` text,
  `tags_json` text,
  `best_for_json` text,
  `usage_json` text,
  `related_ids_json` text,
  `in_stock` integer DEFAULT 1 NOT NULL,
  `show_in_catalog` integer DEFAULT 1 NOT NULL,
  `updated_at` text
);
CREATE UNIQUE INDEX IF NOT EXISTS `products_url_uq` ON `products` (`url`);

CREATE TABLE IF NOT EXISTS `categories` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `summary` text,
  `source_url` text
);

CREATE TABLE IF NOT EXISTS `brands` (
  `name` text PRIMARY KEY NOT NULL,
  `logo_url` text
);

CREATE TABLE IF NOT EXISTS `leads` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `phone` text,
  `preferred_contact_method` text,
  `message` text NOT NULL,
  `save_list_ids` text,
  `ip_hash` text,
  `user_agent` text,
  `consent_given` integer NOT NULL,
  `email_status` text DEFAULT 'pending' NOT NULL,
  `email_attempts` integer DEFAULT 0 NOT NULL,
  `email_last_error` text,
  `created_at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `agent_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `ip_hash` text NOT NULL,
  `turns` integer DEFAULT 0 NOT NULL,
  `total_input_tokens` integer DEFAULT 0 NOT NULL,
  `total_output_tokens` integer DEFAULT 0 NOT NULL,
  `turnstile_verified` integer DEFAULT 0 NOT NULL,
  `created_at` text NOT NULL,
  `last_seen_at` text NOT NULL
);
