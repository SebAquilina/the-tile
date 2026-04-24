import Link from "next/link";
import { ReviewCard } from "./ReviewCard";
import { averageRating, getFeaturedReviews, REVIEWS } from "@/lib/reviews";

export function ReviewStrip() {
  const reviews = getFeaturedReviews(3);
  if (reviews.length === 0) return null;
  const avg = averageRating();

  return (
    <section className="mx-auto mt-space-11 max-w-content px-space-5 md:px-space-7">
      <header className="max-w-prose">
        <p className="text-xs uppercase tracking-widest text-ink-subtle">
          What customers say
        </p>
        <h2 className="mt-space-3 font-display text-3xl leading-tight text-ink md:text-4xl">
          {avg.toFixed(1)} across {REVIEWS.length} reviews
        </h2>
        <p className="mt-space-4 text-ink-muted">
          Unhurried advice, Italian porcelain chosen for Malta. Recent notes
          from the showroom floor.
        </p>
      </header>

      <ul className="mt-space-7 grid gap-space-5 md:grid-cols-3">
        {reviews.map((r) => (
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
