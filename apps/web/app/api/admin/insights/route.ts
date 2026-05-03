import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generatePulse, listPulses } from "@/lib/analytics/pulse";
import { dailyAnomalies } from "@/lib/analytics/queries";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function getEnv(key: string): string | undefined {
  const g = globalThis as unknown as Record<string, unknown>;
  if (typeof g[key] === "string") return g[key] as string;
  if (typeof process !== "undefined" && process.env?.[key]) return process.env[key];
  return undefined;
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const db = ((process.env as unknown as { DB?: D1Database }).DB ??
    (globalThis as unknown as { DB?: D1Database }).DB) as D1Database | undefined;
  if (!db) return NextResponse.json({ ok: false, error: "no_db" }, { status: 500 });
  const [pulses, anom] = await Promise.all([listPulses(db).catch(() => []), dailyAnomalies(db)]);
  return NextResponse.json({ ok: true, pulses, current: anom });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const db = ((process.env as unknown as { DB?: D1Database }).DB ??
    (globalThis as unknown as { DB?: D1Database }).DB) as D1Database | undefined;
  if (!db) return NextResponse.json({ ok: false, error: "no_db" }, { status: 500 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") !== "run") {
    return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as { date?: string };
    const result = await generatePulse(db, getEnv("GEMINI_API_KEY"), body.date);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
