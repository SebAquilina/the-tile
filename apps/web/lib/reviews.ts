/**
 * Review display helpers — sourced from the D1-backed store at
 * `lib/reviews/store.ts` (writable via /admin/reviews).
 *
 * Historically this module exported a hardcoded `REVIEWS` array. That
 * fabricated content has been migrated into the `reviews` table by
 * 0004_reviews.sql; keep this file only as a typed adapter so existing
 * components that render a `Review` shape (the card + strip) keep working
 * without churning every import site.
 */

import { listReviews, type ReviewRow } from "@/lib/reviews/store";

export type ReviewAuthor = {
  /** Display name (first name + last initial, e.g. "Karen M."). */
  name: string;
  /** Free-text location used on the card (e.g. "Sliema"). */
  locality?: string;
};

export type Review = {
  id: string;
  author: ReviewAuthor;
  rating: 1 | 2 | 3 | 4 | 5;
  publishedAt: string;
  body: string;
  productId?: string;
  headline?: string;
  /** Whether the row is still flagged as fabricated demo content. */
  placeholder: boolean;
};

function rowToReview(r: ReviewRow): Review {
  return {
    id: r.id,
    author: {
      name: r.author,
      locality: r.location ?? undefined,
    },
    rating: r.rating,
    publishedAt: r.date,
    body: r.quote,
    productId: r.product_id ?? undefined,
    headline: r.title ?? undefined,
    placeholder: !!r.placeholder,
  };
}

/** Active reviews, newest first. D1-backed; throws on `db_unbound`. */
export async function getAllReviews(): Promise<Review[]> {
  const rows = await listReviews({ status: "active" });
  return rows.map(rowToReview);
}

export async function getReviewsForProduct(productId: string): Promise<Review[]> {
  const all = await getAllReviews();
  return all.filter((r) => r.productId === productId);
}

export async function getFeaturedReviews(count = 3): Promise<Review[]> {
  const all = await getAllReviews();
  return all.filter((r) => r.rating === 5 && r.headline).slice(0, count);
}

export async function averageRating(): Promise<number> {
  const all = await getAllReviews();
  if (all.length === 0) return 0;
  const sum = all.reduce((acc, r) => acc + r.rating, 0);
  return Number((sum / all.length).toFixed(2));
}

export async function getReviewCount(): Promise<number> {
  return (await getAllReviews()).length;
}
