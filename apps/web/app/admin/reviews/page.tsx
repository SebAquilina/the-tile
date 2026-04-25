import { getAllReviews } from "@/lib/reviews";
import { ReviewCard } from "@/components/reviews/ReviewCard";

export const runtime = 'edge';

export default function AdminReviewsPage() {
  const reviews = getAllReviews();
  const placeholderCount = reviews.filter((r) => r.placeholder).length;

  return (
    <div className="space-y-space-7">
      <header>
        <h1 className="font-display text-3xl text-ink">Reviews</h1>
        <p className="mt-space-2 max-w-prose text-sm text-ink-muted">
          {reviews.length} total · {placeholderCount} fabricated placeholder
          reviews. Replace these with consented real customer quotes before
          launch — edit <code>apps/web/lib/reviews.ts</code> and set{" "}
          <code>placeholder: false</code>, or migrate to a D1-backed reviews
          table when you are ready for self-service moderation.
        </p>
      </header>

      <ul className="grid gap-space-5 md:grid-cols-2">
        {reviews.map((r) => (
          <li key={r.id}>
            <ReviewCard review={r} />
          </li>
        ))}
      </ul>
    </div>
  );
}
