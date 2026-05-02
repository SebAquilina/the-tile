import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { listReviews } from "@/lib/reviews/store";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "What customers say about The Tile — Italian porcelain stoneware, San Gwann, Malta.",
};

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  let rows: Awaited<ReturnType<typeof listReviews>> = [];
  try {
    rows = await listReviews({ status: "active" });
  } catch {
    rows = [];
  }

  const reviews = rows.map((r) => ({
    id: r.id,
    author: { name: r.author, locality: r.location ?? undefined },
    rating: r.rating,
    publishedAt: r.date,
    body: r.quote,
    headline: r.title ?? undefined,
    productId: r.product_id ?? undefined,
    placeholder: !!r.placeholder,
  }));

  const avg =
    reviews.length === 0
      ? 0
      : Number(
          (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(
            2,
          ),
        );

  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Reviews" }]} />

      <header className="mt-space-7 max-w-prose">
        <p className="text-xs uppercase tracking-widest text-ink-subtle">
          Reviews
        </p>
        <h1 className="mt-space-3 font-display text-4xl leading-tight text-ink md:text-5xl">
          {avg.toFixed(1)} across {reviews.length} review
          {reviews.length === 1 ? "" : "s"}
        </h1>
        <p className="mt-space-5 text-lg text-ink-muted">
          Every note below is from a real customer who agreed to publish. We
          do not curate for flattery — four-star reviews sit alongside the
          fives, because both are useful.
        </p>
      </header>

      <ul className="mt-space-10 grid gap-space-5 md:grid-cols-2">
        {reviews.map((r) => (
          <li key={r.id}>
            <ReviewCard review={r} />
          </li>
        ))}
      </ul>
    </div>
  );
}
