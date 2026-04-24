import productsSeed from "@/data/seed/products.seed.json";
import brandsSeed from "@/data/seed/brands.seed.json";
import contentSeed from "@/data/seed/content.seed.json";
import {
  BrandSchema,
  CategorySchema,
  HomeContentSchema,
  ProductSchema,
  type Brand,
  type Category,
  type HomeContent,
  type Product,
} from "@/lib/schemas";

/**
 * Typed loaders over the build-time seed JSON.
 *
 * All results are validated with Zod on first call, then memoised in module
 * scope. Validation is lenient (matches seed reality); a parse failure logs
 * the error and returns what it can, so a single bad record doesn't brick
 * the whole catalog at boot.
 */

interface ProductsSeedShape {
  products?: unknown[];
  categories?: unknown[];
}

interface BrandsSeedShape {
  brands?: unknown[];
}

let _products: Product[] | null = null;
let _categories: Category[] | null = null;
let _brands: Brand[] | null = null;
let _home: HomeContent | null = null;

function loadProducts(): Product[] {
  if (_products) return _products;

  const raw = (productsSeed as ProductsSeedShape).products ?? [];
  const out: Product[] = [];
  for (const item of raw) {
    const parsed = ProductSchema.safeParse(item);
    if (parsed.success) {
      out.push(parsed.data);
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        "[seed] product failed schema validation, skipping:",
        (item as { id?: string })?.id ?? "(no id)",
        parsed.error.issues.slice(0, 2),
      );
    }
  }
  _products = out;
  return _products;
}

function loadCategories(): Category[] {
  if (_categories) return _categories;

  const raw = (productsSeed as ProductsSeedShape).categories ?? [];
  const out: Category[] = [];
  for (const item of raw) {
    const parsed = CategorySchema.safeParse(item);
    if (parsed.success) {
      out.push(parsed.data);
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        "[seed] category failed schema validation, skipping:",
        (item as { id?: string })?.id ?? "(no id)",
        parsed.error.issues.slice(0, 2),
      );
    }
  }
  _categories = out;
  return _categories;
}

function loadBrands(): Brand[] {
  if (_brands) return _brands;

  const raw = (brandsSeed as BrandsSeedShape).brands ?? [];
  const out: Brand[] = [];
  for (const item of raw) {
    const parsed = BrandSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  _brands = out;
  return _brands;
}

function loadHome(): HomeContent {
  if (_home) return _home;
  const parsed = HomeContentSchema.safeParse(contentSeed);
  _home = parsed.success ? parsed.data : (contentSeed as HomeContent);
  return _home;
}

// --- Public API ---

export function getAllProducts(): Product[] {
  return loadProducts();
}

export function getProductBySlug(effect: string, slug: string): Product | null {
  const products = loadProducts();
  const target = `/collections/${effect}/${slug}`;
  return (
    products.find((p) => p.url === target) ??
    products.find((p) => p.effect === effect && p.id === slug) ??
    null
  );
}

export function getProductsByEffect(effect: string): Product[] {
  return loadProducts().filter((p) => p.effect === effect);
}

export function getAllCategories(): Category[] {
  return loadCategories();
}

export function getEffectCategories(): Category[] {
  return loadCategories().filter((c) => c.type === "effect");
}

export function getUsageCategories(): Category[] {
  // Lenient: treat anything-that-isn't-"effect" as a usage category.
  return loadCategories().filter((c) => c.type !== "effect");
}

export function getCategoryById(id: string): Category | null {
  return loadCategories().find((c) => c.id === id) ?? null;
}

export function getAllBrands(): Brand[] {
  return loadBrands();
}

export function getHomeContent(): HomeContent {
  return loadHome();
}
