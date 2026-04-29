import { NextResponse } from "next/server";
import { ThemeInput, getTheme, setTheme } from "@/lib/theme/store";
import { requireAdmin } from "@/lib/auth";
import { revalidatePaths } from "@/lib/revalidate-map";

export const runtime = "edge";
const noStore = (b: unknown, init?: ResponseInit) =>
  NextResponse.json(b, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });

export async function GET(req: Request) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  return noStore({ theme: await getTheme() });
}

export async function PUT(req: Request) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const parsed = ThemeInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStore({ ok: false, errors: parsed.error.issues }, { status: 400 });
  const updated = await setTheme(parsed.data);
  revalidatePaths("theme.tokens");
  return noStore({ ok: true, theme: updated });
}
