/**
 * Reviews store. D1-backed CRUD for /admin/reviews.
 *
 * Replaces the hardcoded REVIEWS array in apps/web/lib/reviews.ts.
 *
 * Per ref 19 § Class 9 we throw on `db_unbound` (no silent fallbacks)
 * and throw `not_found` on UPDATE / DELETE returning zero rows
 * (ref 33). Per ref 22 we use the
 *   process.env.DB ?? globalThis.DB ?? null
 * binding-resolution chain. Per ref 30 every string field has a
 * `.max()` ceiling.
 */

import { z } from "zod";

export const ReviewStatus = z.enum(["active", "draft", "archived"]);
export type ReviewStatusType = z.infer<typeof ReviewStatus>;

export const ReviewInput = z.object({
  author: z.string().min(1).max(160),
  location: z.string().max(120).optional().nullable(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
    .max(10),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional().nullable(),
  quote: z.string().min(20).max(2000),
  source: z.string().max(80).optional().nullable(),
  product_id: z.string().max(120).optional().nullable(),
  status: ReviewStatus.default("active"),
  placeholder: z.boolean().default(false),
});

export type ReviewInputType = z.infer<typeof ReviewInput>;

export type ReviewRow = {
  id: string;
  author: string;
  location: string | null;
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string | null;
  quote: string;
  source: string | null;
  product_id: string | null;
  status: ReviewStatusType;
  placeholder: number;
  version: number;
  created_at: number;
  updated_at: number;
};

function db(): D1Database {
  const d =
    (process.env as unknown as { DB?: D1Database }).DB ??
    (globalThis as unknown as { DB?: D1Database }).DB ??
    null;
  if (!d) throw new Error("db_unbound");
  return d;
}

export async function listReviews(
  opts?: { status?: ReviewStatusType | "all" },
): Promise<ReviewRow[]> {
  const status = opts?.status ?? "all";
  const d = db();
  const stmt =
    status === "all"
      ? d.prepare(
          `SELECT * FROM reviews ORDER BY date DESC, created_at DESC`,
        )
      : d
          .prepare(
            `SELECT * FROM reviews WHERE status = ? ORDER BY date DESC, created_at DESC`,
          )
          .bind(status);
  const r = await stmt.all();
  return (r.results as unknown as ReviewRow[]) ?? [];
}

export async function getReview(id: string): Promise<ReviewRow | null> {
  const d = db();
  const r = await d
    .prepare(`SELECT * FROM reviews WHERE id = ?`)
    .bind(id)
    .first();
  return (r as unknown as ReviewRow) ?? null;
}

export async function createReview(input: ReviewInputType): Promise<ReviewRow> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const d = db();
  await d
    .prepare(
      `INSERT INTO reviews (
         id, author, location, date, rating, title, quote, source,
         product_id, status, placeholder, version, created_at, updated_at
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      id,
      input.author,
      input.location ?? null,
      input.date,
      input.rating,
      input.title ?? null,
      input.quote,
      input.source ?? null,
      input.product_id ?? null,
      input.status,
      input.placeholder ? 1 : 0,
      0,
      now,
      now,
    )
    .run();
  const row = await getReview(id);
  if (!row) throw new Error("create_failed");
  return row;
}

export async function updateReview(
  id: string,
  patch: Partial<ReviewInputType>,
): Promise<ReviewRow> {
  const cur = await getReview(id);
  if (!cur) throw new Error("not_found");
  const merged = { ...cur, ...patch };
  const now = Date.now();
  const d = db();
  const r = await d
    .prepare(
      `UPDATE reviews SET
         author = ?, location = ?, date = ?, rating = ?, title = ?,
         quote = ?, source = ?, product_id = ?, status = ?,
         placeholder = ?, version = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      merged.author,
      merged.location ?? null,
      merged.date,
      merged.rating,
      merged.title ?? null,
      merged.quote,
      merged.source ?? null,
      merged.product_id ?? null,
      merged.status,
      patch.placeholder === undefined
        ? cur.placeholder
        : patch.placeholder
          ? 1
          : 0,
      cur.version + 1,
      now,
      id,
    )
    .run();
  if (r.meta.changes === 0) throw new Error("not_found");
  const row = await getReview(id);
  if (!row) throw new Error("not_found");
  return row;
}

export async function deleteReview(id: string): Promise<void> {
  const d = db();
  const r = await d.prepare(`DELETE FROM reviews WHERE id = ?`).bind(id).run();
  if (r.meta.changes === 0) throw new Error("not_found");
}
