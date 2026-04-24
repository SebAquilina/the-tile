import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Review } from "@/lib/reviews";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function ReviewCard({
  review,
  className,
}: {
  review: Review;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "rounded-md border border-line bg-surface p-space-5",
        className,
      )}
    >
      <div
        className="flex items-center gap-space-1 text-umber"
        aria-label={`${review.rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < review.rating ? "fill-umber" : "fill-transparent",
            )}
            aria-hidden="true"
          />
        ))}
      </div>

      {review.headline ? (
        <h3 className="mt-space-4 font-display text-lg text-ink">
          {review.headline}
        </h3>
      ) : null}

      <blockquote className="mt-space-3 text-ink-muted">
        <p>{review.body}</p>
      </blockquote>

      <figcaption className="mt-space-5 text-sm text-ink-subtle">
        <span className="text-ink">{review.author.name}</span>
        {review.author.locality ? <> · {review.author.locality}</> : null}
        <> · {formatDate(review.publishedAt)}</>
      </figcaption>
    </figure>
  );
}
