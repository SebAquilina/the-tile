"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const CLIENT_KEY = "cc_cid";
const LAST_PV_KEY = "cc_pv";

function getOrMakeClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_KEY);
    if (existing && /^[0-9a-f-]{20,40}$/i.test(existing)) return existing;
  } catch {}
  const id = (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 10)}`);
  try { localStorage.setItem(CLIENT_KEY, id); } catch {}
  return id;
}

function readLastPv(): { id: string; ts: number } | null {
  try {
    const raw = localStorage.getItem(LAST_PV_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string; ts?: number };
    if (!parsed.id || !parsed.ts) return null;
    return { id: parsed.id, ts: parsed.ts };
  } catch { return null; }
}

function writeLastPv(id: string, ts: number) {
  try { localStorage.setItem(LAST_PV_KEY, JSON.stringify({ id, ts })); } catch {}
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    try {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
      return;
    } catch {}
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body, keepalive: true,
  }).then(async (r) => {
    try {
      const j = (await r.json()) as { pageview_id?: string };
      if (j.pageview_id) writeLastPv(j.pageview_id, Date.now());
    } catch {}
  }).catch(() => {});
}

export function TrackingPixel() {
  const pathname = usePathname();
  const search = useSearchParams();
  const hasSent = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;

    const fullPath = search?.toString() ? `${pathname}?${search.toString()}` : pathname;
    if (hasSent.current === fullPath) return;
    hasSent.current = fullPath;

    const cid = getOrMakeClientId();
    const now = Date.now();
    const prev = readLastPv();
    const prevDwell = prev ? Math.min(now - prev.ts, 30 * 60 * 1000) : undefined;

    const ref = typeof document !== "undefined" ? document.referrer || "" : "";
    const refOut = ref && typeof window !== "undefined" && !ref.startsWith(window.location.origin) ? ref : undefined;

    send({
      client_id: cid,
      path: fullPath,
      title: typeof document !== "undefined" ? document.title : undefined,
      referrer: refOut,
      utm_source: search?.get("utm_source") || undefined,
      utm_medium: search?.get("utm_medium") || undefined,
      utm_campaign: search?.get("utm_campaign") || undefined,
      utm_content: search?.get("utm_content") || undefined,
      utm_term: search?.get("utm_term") || undefined,
      screen_w: typeof window !== "undefined" ? window.innerWidth : undefined,
      screen_h: typeof window !== "undefined" ? window.innerHeight : undefined,
      ts: now,
      prev_pageview_id: prev?.id,
      prev_dwell_ms: prevDwell,
    });
    writeLastPv(`pending-${now}`, now);
  }, [pathname, search]);

  useEffect(() => {
    function flush() {
      const prev = readLastPv();
      if (!prev) return;
      const cid = getOrMakeClientId();
      const dwell = Date.now() - prev.ts;
      if (dwell < 2000) return;
      const blob = new Blob([JSON.stringify({
        client_id: cid,
        path: typeof window !== "undefined" ? window.location.pathname : "/",
        ts: Date.now(),
        prev_pageview_id: prev.id,
        prev_dwell_ms: dwell,
        event_only: true,
        event: { kind: "session_end", payload: {} },
      })], { type: "application/json" });
      try { navigator.sendBeacon?.("/api/track", blob); } catch {}
    }
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  return null;
}

export function trackEvent(kind: string, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;
  const cid = (() => {
    try { return localStorage.getItem(CLIENT_KEY) ?? ""; } catch { return ""; }
  })();
  if (!cid) return;
  const body = JSON.stringify({
    client_id: cid,
    path: window.location.pathname,
    ts: Date.now(),
    event_only: true,
    event: { kind, payload },
  });
  try {
    navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
  } catch {
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body, keepalive: true,
    }).catch(() => {});
  }
}
