import { NextResponse } from "next/server";
import { PageInput, createPage, listPages } from "@/lib/pages/store";
import { requireAdmin } from "@/lib/auth";
import { revalidatePaths } from "@/lib/revalidate-map";

export const runtime = "edge";

const noStore = (b: unknown, init?: ResponseInit) =>
  NextResponse.json(b, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });

export async function GET(req: Request) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  return noStore({ pages: await listPages({ status: "all" }) });
}

export async function POST(req: Request) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const body = await req.json().catch(() => null);
  const parsed = PageInput.safeParse(body);
  if (!parsed.success) return noStore({ ok: false, errors: parsed.error.issues }, { status: 400 });
  try {
    const created = await createPage(parsed.data);
    const paths = revalidatePaths("pages.upsert", created.slug);
    return noStore({ ok: true, page: created, revalidated: paths }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.startsWith("slug_taken:"))
      return noStore({ ok: false, error: "slug_taken", slug: msg.split(":")[1] }, { status: 409 });
    throw e;
  }
}
