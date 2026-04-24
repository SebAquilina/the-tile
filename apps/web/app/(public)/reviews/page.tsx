import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { averageRating, getAllReviews, REVIEWS } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "What customers say about The Tile — Italian porcelain stoneware, San Gwann, Malta.",
};

export default function ReviewsPage() {
  const reviews = getAllReviews();
  const avg = averageRating();

  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Reviews" }]} />

      <header className="mt-space-7 max-w-prose">
        <p className="text-xs uppercase tracking-widest text-ink-subtle">
          Reviews
        </p>
        <h1 className="mt-space-3 font-display text-4xl leading-tight text-ink md:text-5xl">
          {avg.toFixed(1)} across {REVIEWS.length} reviews
        </h1>
        <p className="mt-space-5 text-lg text-ink-muted">
          Every note below is from a real customer who agreed to publish. We
          do not curate for flattery — four-star reviews sit alongside the
          fives, because both are useful.
        </p>
        <p className="mt-space-4 text-xs italic text-ink-subtle">
          Phase-2 placeholder data — to be replaced with consented reviews
          before launch.
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
