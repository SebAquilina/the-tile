import { NextResponse } from "next/server";
import {
  PageInput, getPage, updatePage, deletePage, VersionConflictError,
} from "@/lib/pages/store";
import { requireAdmin } from "@/lib/auth";
import { revalidatePaths } from "@/lib/revalidate-map";

export const runtime = "edge";

const noStore = (b: unknown, init?: ResponseInit) =>
  NextResponse.json(b, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });

function ifMatch(h: string | null): number | null {
  if (!h) return null;
  const m = h.match(/^W\/"(\d+)"$/);
  return m ? Number(m[1]) : null;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const p = await getPage(params.id);
  if (!p) return noStore({ ok: false }, { status: 404 });
  return noStore({ page: p }, { headers: { ETag: `W/"${p.version}"` } });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const ev = ifMatch(req.headers.get("if-match"));
  if (ev === null) return noStore({ ok: false, error: "if_match_required" }, { status: 428 });
  const body = await req.json().catch(() => null);
  const parsed = PageInput.partial().safeParse(body);
  if (!parsed.success) return noStore({ ok: false, errors: parsed.error.issues }, { status: 400 });
  try {
    const updated = await updatePage(params.id, parsed.data, ev);
    const paths = revalidatePaths("pages.upsert", updated.slug);
    return noStore({ ok: true, page: updated, revalidated: paths }, {
      headers: { ETag: `W/"${updated.version}"` },
    });
  } catch (e) {
    if (e instanceof VersionConflictError)
      return noStore({ ok: false, error: "version_conflict", currentVersion: e.currentVersion }, { status: 412 });
    if ((e as Error).message === "not_found")
      return noStore({ ok: false }, { status: 404 });
    throw e;
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const ev = ifMatch(req.headers.get("if-match"));
  if (ev === null) return noStore({ ok: false, error: "if_match_required" }, { status: 428 });
  const cur = await getPage(params.id);
  if (!cur) return noStore({ ok: false }, { status: 404 });
  try {
    await deletePage(params.id, ev);
    const paths = revalidatePaths("pages.delete", cur.slug);
    return noStore({ ok: true, revalidated: paths });
  } catch (e) {
    if (e instanceof VersionConflictError)
      return noStore({ ok: false, error: "version_conflict", currentVersion: e.currentVersion }, { status: 412 });
    throw e;
  }
}
