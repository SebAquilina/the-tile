import Link from "next/link";
import { ReviewCard } from "./ReviewCard";
import type { Review } from "@/lib/reviews";

export interface ReviewStripProps {
  /** All active reviews; the strip picks 3 featured (5★ with headline). */
  reviews: Review[];
}

export function ReviewStrip({ reviews }: ReviewStripProps) {
  const featured = reviews
    .filter((r) => r.rating === 5 && r.headline)
    .slice(0, 3);
  if (featured.length === 0) return null;

  const avg =
    reviews.length === 0
      ? 0
      : Number(
          (
            reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          ).toFixed(2),
        );

  return (
    <section className="mx-auto mt-space-11 max-w-content px-space-5 md:px-space-7">
      <header className="max-w-prose">
        <p className="text-xs uppercase tracking-widest text-ink-subtle">
          What customers say
        </p>
        <h2 className="mt-space-3 font-display text-3xl leading-tight text-ink md:text-4xl">
          {avg.toFixed(1)} across {reviews.length} review
          {reviews.length === 1 ? "" : "s"}
        </h2>
        <p className="mt-space-4 text-ink-muted">
          Unhurried advice, Italian porcelain chosen for Malta. Recent notes
          from the showroom floor.
        </p>
      </header>

      <ul className="mt-space-7 grid gap-space-5 md:grid-cols-3">
        {featured.map((r) => (
          <li key={r.id}>
            <ReviewCard review={r} />
          </li>
        ))}
      </ul>

      <div className="mt-space-6">
        <Link
          href="/reviews"
          className="text-sm text-umber underline underline-offset-4 hover:text-umber-strong"
        >
          Read every review
        </Link>
      </div>
    </section>
  );
}
