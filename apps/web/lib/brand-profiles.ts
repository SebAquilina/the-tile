import type { Brand } from "@/lib/schemas";

export type BrandProfile = {
  slug: string;
  name: string;
  blurb: string;
  heritage: string;
  focus: string[];
};

export const BRAND_PROFILES: BrandProfile[] = [
  {
    slug: "emilgroup",
    name: "Emilgroup",
    blurb:
      "The umbrella group for Emilceramica and Ergon, with a deep marble-effect catalogue and technical 20mm paving lines.",
    heritage:
      "Headquartered in Fiorano Modenese, Italy, Emilgroup brings together decades of porcelain-stoneware craft under one roof. Their strength is range — from quiet domestic finishes to contract-grade paving.",
    focus: ["Marble-effect", "20mm outdoor paving", "Large formats"],
  },
  {
    slug: "emilceramica",
    name: "Emilceramica",
    blurb:
      "Founded in 1961 in Fiorano Modenese — one of the defining houses in marble and stone-effect porcelain.",
    heritage:
      "Sixty years of Italian ceramic tradition, expressed through collections that read as both architectural and residential. Their Tele di Marmo family has quietly become a benchmark.",
    focus: ["Marble-effect", "Stone-effect", "Classical interiors"],
  },
  {
    slug: "ergon",
    name: "Ergon",
    blurb:
      "Emilgroup's contract-grade brand for high-traffic and outdoor applications.",
    heritage:
      "Ergon was spun up to serve architects and specifiers working on projects that need to wear well — commercial floors, hospitality, wet areas, outdoor patios. The finishes lean technical without losing warmth.",
    focus: ["High-traffic", "Outdoor paving", "Commercial"],
  },
  {
    slug: "provenza",
    name: "Provenza",
    blurb:
      "Sassuolo-based. A quieter catalogue of natural textures — slate, terrazzo, wood.",
    heritage:
      "Provenza's catalogue reads like a materials library — rugged slate, aged wood, micro-terrazzo. Collections tend to be design-led and well-curated rather than broad.",
    focus: ["Slate-effect", "Wood-effect", "Terrazzo"],
  },
  {
    slug: "viva",
    name: "Viva",
    blurb:
      "Founded in 1991 — a design-led house for concrete and full-colour surfaces.",
    heritage:
      "Viva's collections sit squarely in the contemporary end of the market — concrete-effect, resin-effect, bold full-colour. Popular in architect-led residential projects across Malta.",
    focus: ["Concrete-effect", "Full-colour", "Contemporary"],
  },
];

const BY_NAME = new Map(
  BRAND_PROFILES.map((b) => [b.name.toLowerCase(), b] as const),
);

export function getAllBrandProfiles(): BrandProfile[] {
  return BRAND_PROFILES;
}

export function getBrandProfileBySlug(slug: string): BrandProfile | null {
  return BRAND_PROFILES.find((b) => b.slug === slug) ?? null;
}

/** Given a seed Brand, match to a profile by lowercased name. */
export function matchBrandProfile(brand: Brand): BrandProfile | null {
  return BY_NAME.get(brand.name.toLowerCase()) ?? null;
}
