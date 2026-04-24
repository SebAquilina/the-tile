/**
 * sync-seed — truncate + reload D1 products/categories/brands from the
 * JSON source of truth.
 *
 * Usage (CI):
 *   pnpm tsx scripts/sync-seed.ts staging
 *   pnpm tsx scripts/sync-seed.ts main     # → the-tile-prod
 *
 * Reads the seed JSON and emits batched SQL to the D1 HTTP API.
 *
 *   env required: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const seedDir = resolve(here, "..", "data", "seed");

const branch = (process.argv[2] ?? "staging").trim();
const dbName =
  branch === "main" || branch === "production"
    ? "the-tile-prod"
    : "the-tile-staging";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error(
    "[sync-seed] CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required.",
  );
  process.exit(2);
}

type ProductSeed = {
  id: string;
  name: string;
  effect: string;
  brand?: string | null;
  summary: string;
  description?: string;
  url: string;
  sourceUrl?: string | null;
  attributes?: unknown;
  images?: unknown;
  tags?: unknown;
  bestFor?: unknown;
  usage?: unknown;
  relatedIds?: unknown;
  inStock?: boolean;
  showInCatalog?: boolean;
  updatedAt?: string;
};

type CategorySeed = {
  id: string;
  name: string;
  type: string;
  summary?: string;
  sourceUrl?: string;
};

type BrandSeed = { name: string; logoUrl?: string | null };

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(seedDir, file), "utf8")) as T;
}

function sqlQuote(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function orNull(v: unknown): string {
  return v == null ? "NULL" : sqlQuote(String(v));
}

function jsonOrNull(v: unknown): string {
  if (v == null) return "NULL";
  return sqlQuote(JSON.stringify(v));
}

function bool(v: unknown, def = true): string {
  const b = typeof v === "boolean" ? v : def;
  return b ? "1" : "0";
}

async function runSql(statements: string[]): Promise<void> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${dbName}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql: statements.join(";\n") + ";" }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 query failed: ${res.status} ${text}`);
  }
  const body = (await res.json()) as { success?: boolean; errors?: unknown };
  if (!body.success) {
    throw new Error(`D1 query rejected: ${JSON.stringify(body.errors)}`);
  }
}

async function main() {
  console.log(`[sync-seed] target: ${dbName} (branch ${branch})`);

  const { products, categories } = loadJson<{
    products: ProductSeed[];
    categories: CategorySeed[];
  }>("products.seed.json");
  const { brands } = loadJson<{ brands: BrandSeed[] }>("brands.seed.json");

  // Truncate
  await runSql([
    "DELETE FROM products",
    "DELETE FROM categories",
    "DELETE FROM brands",
  ]);
  console.log("[sync-seed] truncated existing rows");

  // Insert brands
  const brandRows = brands.map(
    (b) =>
      `INSERT INTO brands (name, logo_url) VALUES (${sqlQuote(b.name)}, ${orNull(b.logoUrl)})`,
  );
  if (brandRows.length) await runSql(brandRows);
  console.log(`[sync-seed] inserted ${brandRows.length} brands`);

  // Insert categories
  const catRows = categories.map(
    (c) =>
      `INSERT INTO categories (id, name, type, summary, source_url) VALUES (${sqlQuote(c.id)}, ${sqlQuote(c.name)}, ${sqlQuote(c.type ?? "effect")}, ${orNull(c.summary)}, ${orNull(c.sourceUrl)})`,
  );
  if (catRows.length) {
    // Batch to avoid overly large payloads.
    for (let i = 0; i < catRows.length; i += 20)
      await runSql(catRows.slice(i, i + 20));
  }
  console.log(`[sync-seed] inserted ${catRows.length} categories`);

  // Insert products
  const rows = products.map((p) => {
    const cols = [
      sqlQuote(p.id),
      sqlQuote(p.name),
      sqlQuote(p.effect),
      orNull(p.brand),
      sqlQuote(p.summary),
      orNull(p.description),
      sqlQuote(p.url),
      orNull(p.sourceUrl),
      jsonOrNull(p.attributes),
      jsonOrNull(p.images),
      jsonOrNull(p.tags),
      jsonOrNull(p.bestFor),
      jsonOrNull(p.usage),
      jsonOrNull(p.relatedIds),
      bool(p.inStock, true),
      bool(p.showInCatalog, true),
      orNull(p.updatedAt ?? new Date().toISOString()),
    ];
    return `INSERT INTO products (id,name,effect,brand,summary,description,url,source_url,attributes_json,images_json,tags_json,best_for_json,usage_json,related_ids_json,in_stock,show_in_catalog,updated_at) VALUES (${cols.join(",")})`;
  });
  for (let i = 0; i < rows.length; i += 10)
    await runSql(rows.slice(i, i + 10));
  console.log(`[sync-seed] inserted ${rows.length} products`);

  console.log("[sync-seed] done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
