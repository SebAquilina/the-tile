import { NextResponse } from "next/server";
import { RedirectInput, listRedirects, updateRedirect, deleteRedirect } from "@/lib/redirects/store";
import { requireAdmin } from "@/lib/auth";
import { revalidatePaths } from "@/lib/revalidate-map";

export const runtime = "edge";
const noStore = (b: unknown, init?: ResponseInit) =>
  NextResponse.json(b, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const parsed = RedirectInput.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStore({ ok: false, errors: parsed.error.issues }, { status: 400 });
  await updateRedirect(params.id, parsed.data);
  const r = (await listRedirects()).find((r) => r.id === params.id);
  if (r) revalidatePaths("redirect.upsert", r.from_path);
  return noStore({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const r = (await listRedirects()).find((r) => r.id === params.id);
  await deleteRedirect(params.id);
  if (r) revalidatePaths("redirect.delete", r.from_path);
  return noStore({ ok: true });
}
