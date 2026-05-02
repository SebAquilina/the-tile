import { getAllProducts } from "@/lib/seed";
import type { Product } from "@/lib/schemas";
import { HomeView } from "./_components/HomeView";
import { listReviews } from "@/lib/reviews/store";

/**
 * Home page — wraps a client view that decides between AgentHero (first
 * visit this session) and the return-visit home content. Featured products
 * are picked server-side from the seed so the client doesn't need the full
 * catalog. Reviews are loaded from D1 and passed in so the embedded
 * ReviewStrip stays a simple, props-driven component.
 */
export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const all = getAllProducts();
  const featured = pickFeatured(all, 6);

  let reviewRows: Awaited<ReturnType<typeof listReviews>> = [];
  try {
    reviewRows = await listReviews({ status: "active" });
  } catch {
    reviewRows = [];
  }
  const reviews = reviewRows.map((r) => ({
    id: r.id,
    author: { name: r.author, locality: r.location ?? undefined },
    rating: r.rating,
    publishedAt: r.date,
    body: r.quote,
    headline: r.title ?? undefined,
    productId: r.product_id ?? undefined,
    placeholder: !!r.placeholder,
  }));

  return <HomeView featured={featured} reviews={reviews} />;
}

function pickFeatured(products: Product[], count: number): Product[] {
  const withImages = products.filter(
    (p) => Array.isArray(p.images) && p.images.length > 0 && p.summary,
  );
  const pool = withImages.length >= count ? withImages : products;
  return pool.slice(0, count);
}
