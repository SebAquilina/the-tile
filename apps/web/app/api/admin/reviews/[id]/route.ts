import { NextResponse } from "next/server";
import {
  ReviewInput,
  getReview,
  updateReview,
  deleteReview,
} from "@/lib/reviews/store";
import { requireAdmin } from "@/lib/auth";
import { revalidatePaths } from "@/lib/revalidate-map";

export const runtime = "edge";

const noStore = (b: unknown, init?: ResponseInit) =>
  NextResponse.json(b, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) },
  });

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  try {
    const r = await getReview(params.id);
    if (!r) return noStore({ ok: false }, { status: 404 });
    return noStore({ review: r });
  } catch (e) {
    return noStore(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const body = await req.json().catch(() => null);
  const parsed = ReviewInput.partial().safeParse(body);
  if (!parsed.success)
    return noStore(
      { ok: false, errors: parsed.error.issues },
      { status: 400 },
    );
  try {
    const updated = await updateReview(params.id, parsed.data);
    const paths = revalidatePaths("review.upsert");
    return noStore({ ok: true, review: updated, revalidated: paths });
  } catch (e) {
    if ((e as Error).message === "not_found")
      return noStore({ ok: false, error: "not_found" }, { status: 404 });
    return noStore(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  try {
    await deleteReview(params.id);
    const paths = revalidatePaths("review.delete");
    return noStore({ ok: true, revalidated: paths });
  } catch (e) {
    if ((e as Error).message === "not_found")
      return noStore({ ok: false, error: "not_found" }, { status: 404 });
    return noStore(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
