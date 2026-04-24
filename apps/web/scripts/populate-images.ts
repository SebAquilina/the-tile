/**
 * populate-images — stamps a curated Unsplash stock photo onto every
 * product in data/seed/products.seed.json whose `images` array is empty.
 *
 * Why stock: The Tile's supplier imagery is not yet licensed for web use.
 * This script gives the site real photographs (not placeholders) so the
 * pitch demo and initial launch look lived-in. Each image is an
 * interior-design photo that matches the effect — not a specific tile.
 *
 * Every image object is stamped with `"source": "unsplash-stock"` so the
 * admin UI / future scripts can bulk-replace them the day real imagery
 * arrives. Run:
 *
 *   pnpm tsx scripts/populate-images.ts        # dry-run
 *   pnpm tsx scripts/populate-images.ts --write # commit changes
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const seedPath = resolve(here, "..", "data", "seed", "products.seed.json");

type Image = {
  src: string;
  alt: string;
  context?: "flat" | "in-room" | "detail" | "lifestyle";
  width?: number;
  height?: number;
  source?: string;
};

type Product = {
  id: string;
  name: string;
  effect: string;
  summary?: string;
  images?: Image[];
  [k: string]: unknown;
};

// Curated pools of Unsplash photos per effect (direct CDN URLs with
// explicit width + quality params — stable, no hotlinking warning,
// cached by CF Pages). These are interior-design / material photographs
// chosen to evoke the effect category; none is a specific product.
const POOLS: Record<string, Image[]> = {
  marble: [
    {
      src: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=1600&q=80&auto=format",
      alt: "Pale marble-veined surface catching natural light",
      context: "detail",
    },
    {
      src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80&auto=format",
      alt: "Calm interior with marble-effect flooring and soft furniture",
      context: "in-room",
    },
    {
      src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80&auto=format",
      alt: "Minimal bathroom in warm marble tones",
      context: "lifestyle",
    },
  ],
  wood: [
    {
      src: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1600&q=80&auto=format",
      alt: "Warm wood-grain flooring detail",
      context: "detail",
    },
    {
      src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80&auto=format",
      alt: "Sunlit living room with wood-effect porcelain floor",
      context: "in-room",
    },
    {
      src: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1600&q=80&auto=format",
      alt: "Herringbone wood-look tiles near a window",
      context: "lifestyle",
    },
  ],
  stone: [
    {
      src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=80&auto=format",
      alt: "Stone-textured wall and floor in a Mediterranean interior",
      context: "in-room",
    },
    {
      src: "https://images.unsplash.com/photo-1582655475075-27b85c90f9f0?w=1600&q=80&auto=format",
      alt: "Close-up of rough natural stone surface",
      context: "detail",
    },
    {
      src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=80&auto=format",
      alt: "Courtyard with stone-effect paving",
      context: "lifestyle",
    },
  ],
  slate: [
    {
      src: "https://images.unsplash.com/photo-1615529162924-f8605388461d?w=1600&q=80&auto=format",
      alt: "Slate-grey textured surface under directional light",
      context: "detail",
    },
    {
      src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80&auto=format",
      alt: "Dark slate-effect floor in a modern kitchen",
      context: "in-room",
    },
  ],
  concrete: [
    {
      src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80&auto=format",
      alt: "Concrete-effect floor in a minimal gallery-style room",
      context: "in-room",
    },
    {
      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80&auto=format",
      alt: "Smooth concrete surface with gentle variation",
      context: "detail",
    },
    {
      src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80&auto=format",
      alt: "Contemporary bathroom finished in concrete tones",
      context: "lifestyle",
    },
  ],
  terrazzo: [
    {
      src: "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=1600&q=80&auto=format",
      alt: "Terrazzo pattern close-up — warm chip detail",
      context: "detail",
    },
    {
      src: "https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=1600&q=80&auto=format",
      alt: "Cafe interior with terrazzo flooring",
      context: "in-room",
    },
  ],
  terracotta: [
    {
      src: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=1600&q=80&auto=format",
      alt: "Terracotta-toned interior with warm morning light",
      context: "in-room",
    },
    {
      src: "https://images.unsplash.com/photo-1587502537745-84b86da1204f?w=1600&q=80&auto=format",
      alt: "Close-up of aged terracotta surface",
      context: "detail",
    },
  ],
  gesso: [
    {
      src: "https://images.unsplash.com/photo-1616593969747-4797dc75033e?w=1600&q=80&auto=format",
      alt: "Soft plaster-finish wall in a minimal room",
      context: "in-room",
    },
    {
      src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&q=80&auto=format",
      alt: "Matte plaster bathroom, diffuse light",
      context: "lifestyle",
    },
  ],
  "full-colour": [
    {
      src: "https://images.unsplash.com/photo-1615873968403-89e068629265?w=1600&q=80&auto=format",
      alt: "Saturated solid-colour surface as a feature wall",
      context: "detail",
    },
    {
      src: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=1600&q=80&auto=format",
      alt: "Bold monochrome kitchen with full-colour tiles",
      context: "in-room",
    },
  ],
};

const DEFAULT_POOL = POOLS["stone"];

function imagesForProduct(product: Product, indexWithinEffect: number): Image[] {
  const pool = POOLS[product.effect] ?? DEFAULT_POOL;
  if (pool.length === 0) return [];
  // Deterministic rotation: tile N in effect E picks image N mod poolLength.
  const hero = pool[indexWithinEffect % pool.length];
  const secondary = pool.length > 1 ? pool[(indexWithinEffect + 1) % pool.length] : undefined;
  const stamped: Image[] = [
    {
      ...hero,
      alt: `${product.name} — ${product.effect}-effect, ${hero.alt}`,
      source: "unsplash-stock",
      width: 1600,
      height: 1067,
    },
  ];
  if (secondary) {
    stamped.push({
      ...secondary,
      alt: `${product.name} — ${secondary.alt}`,
      source: "unsplash-stock",
      width: 1600,
      height: 1067,
    });
  }
  return stamped;
}

function main() {
  const write = process.argv.includes("--write");
  const raw = readFileSync(seedPath, "utf8");
  const parsed = JSON.parse(raw) as { products: Product[] };

  const indexPerEffect = new Map<string, number>();
  let touched = 0;

  for (const product of parsed.products) {
    if (Array.isArray(product.images) && product.images.length > 0) continue;
    const i = indexPerEffect.get(product.effect) ?? 0;
    indexPerEffect.set(product.effect, i + 1);
    product.images = imagesForProduct(product, i);
    touched += 1;
  }

  console.log(
    `[populate-images] would stamp ${touched} / ${parsed.products.length} products` +
      (write ? " (writing)" : " (dry run — pass --write to save)"),
  );

  if (write && touched > 0) {
    writeFileSync(seedPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
    console.log(`[populate-images] wrote ${seedPath}`);
  }
}

main();
