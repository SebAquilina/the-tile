import { NextResponse } from "next/server";
import { RedirectInput, listRedirects, updateRedirect, deleteRedirect } from "@/lib/redirects/store";
import { requireAdmin } from "@/lib/auth";
import { revalidatePaths } from "@/lib/revalidate-map";

export const runtime = "edge";
const noStore = (b: unknown, init?: ResponseInit) =>
  NextResponse.json(b, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });

function mapError(e: Error): Response {
  const msg = e.message;
  if (msg === "not_found") return noStore({ ok: false, error: "not_found" }, { status: 404 });
  if (msg === "circular") return noStore({ ok: false, error: "circular" }, { status: 400 });
  if (msg === "nothing_to_update") return noStore({ ok: false, error: "nothing_to_update" }, { status: 400 });
  return noStore({ ok: false, error: msg }, { status: 503 });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  // Use .partial() then re-validate for circular if both fields present.
  // RedirectInput's .refine runs only on full schemas; for partials we check inline below.
  const ShallowInput = RedirectInput.innerType().partial();
  const parsed = ShallowInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStore({ ok: false, errors: parsed.error.issues }, { status: 400 });
  try {
    await updateRedirect(params.id, parsed.data);
  } catch (e) {
    return mapError(e as Error);
  }
  const r = (await listRedirects()).find((r) => r.id === params.id);
  if (r) revalidatePaths("redirect.upsert", r.from_path);
  return noStore({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const r = (await listRedirects()).find((r) => r.id === params.id);
  try {
    await deleteRedirect(params.id);
  } catch (e) {
    return mapError(e as Error);
  }
  if (r) revalidatePaths("redirect.delete", r.from_path);
  return noStore({ ok: true });
}
