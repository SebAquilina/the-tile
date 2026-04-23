import { getAllProducts } from "@/lib/seed";
import type { Product } from "@/lib/schemas";
import { HomeView } from "./_components/HomeView";

/**
 * Home page — wraps a client view that decides between AgentHero (first
 * visit this session) and the return-visit home content. Featured products
 * are picked server-side from the seed so the client doesn't need the full
 * catalog.
 */
export default function HomePage() {
  const all = getAllProducts();
  const featured = pickFeatured(all, 6);
  return <HomeView featured={featured} />;
}

function pickFeatured(products: Product[], count: number): Product[] {
  // Deterministic-ish pick: first N that have at least one image and a
  // summary. Falls back to head of list.
  const withImages = products.filter(
    (p) => Array.isArray(p.images) && p.images.length > 0 && p.summary,
  );
  const pool = withImages.length >= count ? withImages : products;
  return pool.slice(0, count);
}
