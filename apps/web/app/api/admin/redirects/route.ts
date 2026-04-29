import { NextResponse } from "next/server";
import { RedirectInput, listRedirects, createRedirect } from "@/lib/redirects/store";
import { requireAdmin } from "@/lib/auth";
import { revalidatePaths } from "@/lib/revalidate-map";

export const runtime = "edge";
const noStore = (b: unknown, init?: ResponseInit) =>
  NextResponse.json(b, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });

export async function GET(req: Request) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  return noStore({ redirects: await listRedirects() });
}

export async function POST(req: Request) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const parsed = RedirectInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStore({ ok: false, errors: parsed.error.issues }, { status: 400 });
  try {
    const created = await createRedirect(parsed.data);
    revalidatePaths("redirect.upsert", created.from_path);
    return noStore({ ok: true, redirect: created }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.startsWith("from_taken:"))
      return noStore({ ok: false, error: "from_taken" }, { status: 409 });
    throw e;
  }
}
