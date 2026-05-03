import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { liveSnapshot } from "@/lib/analytics/queries";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const db = ((process.env as unknown as { DB?: D1Database }).DB ??
    (globalThis as unknown as { DB?: D1Database }).DB) as D1Database | undefined;
  if (!db) return NextResponse.json({ ok: false, error: "no_db" }, { status: 500 });
  const snap = await liveSnapshot(db);
  return NextResponse.json({ ok: true, ...snap }, { headers: { "Cache-Control": "no-store" } });
}
