/**
 * D1 schema (Drizzle ORM).
 *
 * Seed JSON remains the source of truth; D1 is an edge-cached copy that
 * lets the agent run faceted queries without parsing JSON on every request
 * and gives us a durable place to store leads and agent session metadata.
 *
 * Tables:
 *   products        — cached from seed/products.seed.json
 *   categories      — effects + usages
 *   brands          — Italian suppliers
 *   leads           — contact-form submissions (1:1 with Resend sends)
 *   agent_sessions  — rate-limit + token-cap telemetry
 */

import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// --- products -------------------------------------------------------------
export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    effect: text("effect").notNull(),
    brand: text("brand"),
    summary: text("summary").notNull(),
    description: text("description"),
    url: text("url").notNull(),
    sourceUrl: text("source_url"),

    // Serialised JSON blobs; parsed at read time.
    attributesJson: text("attributes_json"),
    imagesJson: text("images_json"),
    tagsJson: text("tags_json"),
    bestForJson: text("best_for_json"),
    usageJson: text("usage_json"),
    relatedIdsJson: text("related_ids_json"),

    inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
    showInCatalog: integer("show_in_catalog", { mode: "boolean" })
      .notNull()
      .default(true),
    updatedAt: text("updated_at"),
  },
  (t) => ({
    urlUnique: uniqueIndex("products_url_uq").on(t.url),
  }),
);

// --- categories -----------------------------------------------------------
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "effect" | "usage"
  summary: text("summary"),
  sourceUrl: text("source_url"),
});

// --- brands ---------------------------------------------------------------
export const brands = sqliteTable("brands", {
  name: text("name").primaryKey(),
  logoUrl: text("logo_url"),
});

// --- leads ----------------------------------------------------------------
export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  preferredContactMethod: text("preferred_contact_method"),
  message: text("message").notNull(),
  /** Comma-separated product ids at submission time. */
  saveListIds: text("save_list_ids"),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  consentGiven: integer("consent_given", { mode: "boolean" }).notNull(),
  emailStatus: text("email_status").notNull().default("pending"),
  emailAttempts: integer("email_attempts").notNull().default(0),
  emailLastError: text("email_last_error"),
  createdAt: text("created_at").notNull(),
});

// --- agent_sessions -------------------------------------------------------
export const agentSessions = sqliteTable("agent_sessions", {
  id: text("id").primaryKey(),
  ipHash: text("ip_hash").notNull(),
  turns: integer("turns").notNull().default(0),
  totalInputTokens: integer("total_input_tokens").notNull().default(0),
  totalOutputTokens: integer("total_output_tokens").notNull().default(0),
  turnstileVerified: integer("turnstile_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
});

export type ProductRow = typeof products.$inferSelect;
export type LeadRow = typeof leads.$inferSelect;
export type AgentSessionRow = typeof agentSessions.$inferSelect;
