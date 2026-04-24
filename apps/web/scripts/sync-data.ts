/**
 * Copies seed JSON from docs/spec/the-tile/seed/ into apps/web/data/seed/
 * so the Next.js app can import it via a relative path at build/runtime.
 *
 * Idempotent — safe to run repeatedly.
 */
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../../../docs/spec/the-tile/seed");
const dst = resolve(here, "../data/seed");

if (!existsSync(src)) {
  console.warn(`[sync-data] seed source missing at ${src} — skipping.`);
  process.exit(0);
}

mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true });
console.log(`[sync-data] copied seed JSON: ${src} → ${dst}`);
