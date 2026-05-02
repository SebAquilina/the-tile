import { listReviews } from "@/lib/reviews/store";
import { ReviewsAdmin } from "@/components/admin/ReviewsAdmin";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  let reviews: Awaited<ReturnType<typeof listReviews>> = [];
  let loadError: string | null = null;
  try {
    reviews = await listReviews({ status: "all" });
  } catch (e) {
    loadError = (e as Error).message;
  }

  const live = reviews.filter((r) => r.status === "active").length;
  const drafts = reviews.filter((r) => r.status === "draft").length;
  const archived = reviews.filter((r) => r.status === "archived").length;

  return (
    <div className="space-y-space-7">
      <header className="flex flex-col gap-space-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Reviews</h1>
          <p className="mt-space-2 text-sm text-ink-muted">
            {live} live · {drafts} draft{drafts === 1 ? "" : "s"}
            {archived > 0 ? ` · ${archived} archived` : ""}
          </p>
        </div>
      </header>

      {loadError ? (
        <p
          className="rounded-md border border-line bg-surface p-space-5 text-sm text-ink-muted"
          role="alert"
        >
          Could not load reviews from D1: <code>{loadError}</code>. Apply
          migration <code>0004_reviews.sql</code> against the bound database.
        </p>
      ) : (
        <ReviewsAdmin initial={reviews} />
      )}
    </div>
  );
}
