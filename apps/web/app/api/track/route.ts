import { NextResponse } from "next/server";
import { recordTrack } from "@/lib/analytics/track";
import { limit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/ip-hash";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const BODY_CAP_BYTES = 8 * 1024;
const BOT_RE = /(bot|crawl|spider|slurp|curl|wget|python-requests|monitor|http-client|headlesschrome|phantom|selenium)/i;

export async function POST(req: Request) {
  // Body cap — drop fat beacons.
  const cl = Number(req.headers.get("content-length") || 0);
  if (cl > BODY_CAP_BYTES) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  // Cheap bot 204 — no DB writes for known crawlers.
  const ua = req.headers.get("user-agent") || "";
  if (BOT_RE.test(ua)) return new NextResponse(null, { status: 204 });

  // Rate-limit per IP — 60 beacons / 60s is generous for a real visitor
  // (each pageview = 1, plus a handful of events) but caps abuse.
  const ip = clientIp(req);
  const rl = limit(`track:${ip}`, 60, 60);
  if (!rl.ok) return new NextResponse(null, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } });

  const db = ((process.env as unknown as { DB?: D1Database }).DB ??
    (globalThis as unknown as { DB?: D1Database }).DB) as D1Database | undefined;
  if (!db) return NextResponse.json({ ok: true, stored: false }, { status: 200 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const client_id = String(body.client_id ?? "").trim();
  const path = String(body.path ?? "").trim();
  if (!/^[0-9a-f-]{20,40}$/i.test(client_id)) {
    return NextResponse.json({ ok: false, error: "bad_client_id" }, { status: 400 });
  }
  if (!path || path.length > 256 || !path.startsWith("/")) {
    return NextResponse.json({ ok: false, error: "bad_path" }, { status: 400 });
  }

  const cfCountry = req.headers.get("CF-IPCountry") || req.headers.get("cf-ipcountry") || null;
  const ipForHash = req.headers.get("CF-Connecting-IP")
    || req.headers.get("x-real-ip")
    || req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || null;

  try {
    const result = await recordTrack(db, {
      client_id,
      path,
      title: body.title ? String(body.title).slice(0, 200) : undefined,
      referrer: body.referrer ? String(body.referrer).slice(0, 500) : undefined,
      utm_source: body.utm_source ? String(body.utm_source).slice(0, 100) : undefined,
      utm_medium: body.utm_medium ? String(body.utm_medium).slice(0, 100) : undefined,
      utm_campaign: body.utm_campaign ? String(body.utm_campaign).slice(0, 100) : undefined,
      utm_content: body.utm_content ? String(body.utm_content).slice(0, 100) : undefined,
      utm_term: body.utm_term ? String(body.utm_term).slice(0, 100) : undefined,
      ua,
      screen_w: typeof body.screen_w === "number" ? body.screen_w : undefined,
      screen_h: typeof body.screen_h === "number" ? body.screen_h : undefined,
      ts: typeof body.ts === "number" ? body.ts : Date.now(),
      prev_pageview_id: body.prev_pageview_id ? String(body.prev_pageview_id) : undefined,
      prev_dwell_ms: typeof body.prev_dwell_ms === "number" ? body.prev_dwell_ms : undefined,
      event_only: body.event_only === true,
      event: body.event && typeof body.event === "object"
        ? {
            kind: String((body.event as Record<string, unknown>).kind ?? "").slice(0, 50),
            payload: (body.event as Record<string, unknown>).payload as Record<string, unknown>,
          }
        : undefined,
    }, ipForHash, cfCountry);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("track failed", err);
    return NextResponse.json({ ok: false, error: "store_failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
    },
  });
}
