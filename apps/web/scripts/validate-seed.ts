/**
 * validate-seed — CI gate.
 *
 * Zod-validates every product / category / brand in the seed JSON against
 * the canonical schemas in lib/schemas.ts. Exits non-zero on any failure.
 *
 *   pnpm tsx scripts/validate-seed.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ProductSchema, CategorySchema, BrandSchema } from "../lib/schemas";

const here = dirname(fileURLToPath(import.meta.url));
const seedDir = resolve(here, "..", "data", "seed");

type Problem = { file: string; index: number; id?: string; errors: unknown };
const problems: Problem[] = [];

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(seedDir, file), "utf8")) as T;
}

// Products
try {
  const raw = loadJson<{ products: unknown[] }>("products.seed.json");
  raw.products.forEach((p, i) => {
    const res = ProductSchema.safeParse(p);
    if (!res.success) {
      problems.push({
        file: "products.seed.json",
        index: i,
        id: (p as { id?: string }).id,
        errors: res.error.flatten(),
      });
    }
  });
  console.log(`products.seed.json → ${raw.products.length} records checked`);
} catch (err) {
  console.error("products.seed.json read failed:", err);
  process.exit(2);
}

// Categories
try {
  const raw = loadJson<{ categories: unknown[] }>("products.seed.json");
  raw.categories.forEach((c, i) => {
    const res = CategorySchema.safeParse(c);
    if (!res.success) {
      problems.push({
        file: "products.seed.json:categories",
        index: i,
        id: (c as { id?: string }).id,
        errors: res.error.flatten(),
      });
    }
  });
  console.log(`products.seed.json → ${raw.categories.length} categories checked`);
} catch (err) {
  console.warn("categories absent from products.seed.json:", err);
}

// Brands
try {
  const raw = loadJson<{ brands: unknown[] }>("brands.seed.json");
  raw.brands.forEach((b, i) => {
    const res = BrandSchema.safeParse(b);
    if (!res.success) {
      problems.push({
        file: "brands.seed.json",
        index: i,
        id: (b as { name?: string }).name,
        errors: res.error.flatten(),
      });
    }
  });
  console.log(`brands.seed.json → ${raw.brands.length} brands checked`);
} catch (err) {
  console.error("brands.seed.json read failed:", err);
  process.exit(2);
}

if (problems.length > 0) {
  console.error(`\n${problems.length} seed validation failures:\n`);
  for (const p of problems) {
    console.error(
      `  [${p.file}] #${p.index} ${p.id ?? "(no id)"}:\n`,
      JSON.stringify(p.errors, null, 2),
    );
  }
  process.exit(1);
}

console.log("\nseed OK");
