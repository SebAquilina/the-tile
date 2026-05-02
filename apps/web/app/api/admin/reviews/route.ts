import { NextResponse } from "next/server";
import { ReviewInput, createReview, listReviews } from "@/lib/reviews/store";
import { requireAdmin } from "@/lib/auth";
import { revalidatePaths } from "@/lib/revalidate-map";

export const runtime = "edge";

const noStore = (b: unknown, init?: ResponseInit) =>
  NextResponse.json(b, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) },
  });

export async function GET(req: Request) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  try {
    return noStore({ reviews: await listReviews({ status: "all" }) });
  } catch (e) {
    return noStore(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const body = await req.json().catch(() => null);
  const parsed = ReviewInput.safeParse(body);
  if (!parsed.success)
    return noStore(
      { ok: false, errors: parsed.error.issues },
      { status: 400 },
    );
  try {
    const created = await createReview(parsed.data);
    const paths = revalidatePaths("review.upsert");
    return noStore(
      { ok: true, review: created, revalidated: paths },
      { status: 201 },
    );
  } catch (e) {
    return noStore(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
