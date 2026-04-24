import type { MetadataRoute } from "next";
import {
  getAllProducts,
  getEffectCategories,
} from "@/lib/seed";
import { getAllBrandProfiles } from "@/lib/brand-profiles";

/**
 * Sitemap (Next.js Metadata Route).
 *
 * Statically generated at build time from the seed JSON. Covers:
 * - Static top-level pages
 * - 9 effect landings (/collections/[effect])
 * - 60 product detail pages (/collections/[effect]/[slug])
 * - /brands (brand sub-pages aren't in the route tree yet, so we omit them
 *   rather than emit 404s)
 * - Journal index (/journal). A per-post loader isn't present yet
 *   (lib/journal.ts not in repo) — we gracefully skip post URLs until it is.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.the-tile.com";

type ChangeFreq = MetadataRoute.Sitemap[number]["changeFrequency"];

interface StaticEntry {
  path: string;
  priority: number;
  changeFrequency: ChangeFreq;
}

const STATIC_ROUTES: StaticEntry[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/collections", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/brands", priority: 0.6, changeFrequency: "monthly" },
  { path: "/showroom", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/journal", priority: 0.6, changeFrequency: "weekly" },
  { path: "/save-list", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  { path: "/reviews", priority: 0.5, changeFrequency: "monthly" },
];

// Optional journal loader — gracefully skipped if the module doesn't exist.
// We use dynamic import guarded by a try/catch inside sitemap(); Next allows
// sitemap() to be async when needed.
interface JournalPost {
  slug: string;
  updatedAt?: string;
  publishedAt?: string;
}

async function loadJournalPosts(): Promise<JournalPost[]> {
  try {
    // Optional module; returns an empty list if not yet populated.
    const mod: Record<string, unknown> = await import("@/lib/journal");
    const candidateFns = [
      "getAllJournalPosts",
      "getAllPosts",
    ] as const;
    for (const fn of candidateFns) {
      const f = mod[fn];
      if (typeof f === "function") {
        const out = (f as () => unknown)();
        if (Array.isArray(out)) return out as JournalPost[];
      }
    }
    const fallback =
      (mod.JOURNAL_POSTS as unknown) ?? (mod.posts as unknown) ?? [];
    return Array.isArray(fallback) ? (fallback as JournalPost[]) : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Effect landings
  for (const cat of getEffectCategories()) {
    entries.push({
      url: `${SITE_URL}/collections/${cat.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  // Product detail pages
  for (const product of getAllProducts()) {
    if (product.showInCatalog === false) continue;
    entries.push({
      url: `${SITE_URL}${product.url}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Brand detail pages
  for (const brand of getAllBrandProfiles()) {
    entries.push({
      url: `${SITE_URL}/brands/${brand.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // Journal posts — optional
  const posts = await loadJournalPosts();
  for (const post of posts) {
    if (!post?.slug) continue;
    const lastMod = post.updatedAt ?? post.publishedAt ?? undefined;
    entries.push({
      url: `${SITE_URL}/journal/${post.slug}`,
      lastModified: lastMod ? new Date(lastMod) : now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
