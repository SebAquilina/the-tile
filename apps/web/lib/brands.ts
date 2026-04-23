import { getAllBrands, getAllProducts } from "@/lib/seed";
import type { Brand, Product } from "@/lib/schemas";

/**
 * Per-brand editorial blurbs for the /brands and /brands/[slug] pages.
 * Kept under 350 chars each, in the Italian-concierge voice.
 */
export const BRAND_BLURBS: Record<string, string> = {
  emilgroup:
    "The umbrella group for Emilceramica and Ergon. Deep marble-effect catalogues and technical 20mm paving lines — the part of the Italian stoneware world that runs from a Carrara-inspired bathroom to a contract-grade pool deck without losing coherence.",
  emilceramica:
    "Founded in 1961 in Fiorano Modenese. One of the houses that defined what marble- and stone-effect porcelain stoneware can be, with a range that still sets the reference for how Italian quarries translate into large-format tile.",
  ergon:
    "Emilgroup's contract-grade brand. Built for high-traffic commercial interiors and outdoor applications — anti-slip finishes, 20mm pavers, and technical surfaces that behave well under weather and weight.",
  provenza:
    "Sassuolo-based, and quieter by design. A catalogue of natural textures — slate, terrazzo, wood — with a restrained palette that tends to age well in the rooms that commission it.",
  viva:
    "Founded in 1991. A design-led house for concrete-effect and full-colour surfaces, drawn to the kind of flat, confident colour that modern interiors keep asking for.",
};

export function brandSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export interface BrandWithSlug extends Brand {
  slug: string;
  blurb: string;
}

export function getAllBrandsWithSlugs(): BrandWithSlug[] {
  return getAllBrands().map((b) => {
    const slug = brandSlug(b.name);
    return {
      ...b,
      slug,
      blurb: BRAND_BLURBS[slug] ?? "",
    };
  });
}

export function getBrandBySlug(slug: string): BrandWithSlug | null {
  return getAllBrandsWithSlugs().find((b) => b.slug === slug) ?? null;
}

export function getProductsForBrand(brandName: string): Product[] {
  const lc = brandName.toLowerCase();
  return getAllProducts().filter((p) => {
    const raw = (p.brand ?? "").toString().toLowerCase();
    return raw === lc;
  });
}
