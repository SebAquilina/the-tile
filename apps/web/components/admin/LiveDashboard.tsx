"use client";

import { useEffect, useState } from "react";
import { COUNTRY_CENTROIDS, latLngToSvg } from "@/lib/analytics/country-centroids";

interface LiveSnapshot {
  active_sessions: number;
  active_in_front: number;
  in_quote_flow: number;
  sessions_today: number;
  pageviews_today: number;
  leads_today: number;
  pins: Array<{ country: string; landing_path: string; device: string; last_seen_at: number; id: string }>;
  fetched_at: number;
}
const POLL_MS = 3000;

export function LiveDashboard() {
  const [data, setData] = useState<LiveSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    async function tick() {
      try {
        const r = await fetch("/api/admin/live", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as LiveSnapshot & { ok: boolean };
        if (!stopped) { setData(j); setError(null); }
      } catch (e) {
        if (!stopped) setError((e as Error).message);
      }
    }
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => { stopped = true; clearInterval(id); };
  }, []);

  if (error) return <p style={{ color: "var(--color-danger, #c33)" }}>Live feed error: {error}</p>;
  if (!data) return <p className="muted">Connecting to live feed&hellip;</p>;

  const pinsByCountry = new Map<string, typeof data.pins>();
  for (const p of data.pins) {
    if (!pinsByCountry.has(p.country)) pinsByCountry.set(p.country, []);
    pinsByCountry.get(p.country)!.push(p);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="admin-kpi-grid">
        <Kpi label="Active right now" value={String(data.active_sessions)} pulse />
        <Kpi label="In Front conversation" value={String(data.active_in_front)} />
        <Kpi label="In quote flow" value={String(data.in_quote_flow)} />
        <Kpi label="Sessions today" value={data.sessions_today.toLocaleString()} />
        <Kpi label="Pageviews today" value={data.pageviews_today.toLocaleString()} />
        <Kpi label="Leads today" value={String(data.leads_today)} highlight />
      </div>

      <section className="admin-card" style={{ overflow: "hidden" }}>
        <h2>Where they are</h2>
        <p className="muted" style={{ fontSize: "0.85em", marginTop: 0 }}>
          {data.active_sessions === 0
            ? "Nobody on the site right now."
            : `${data.active_sessions} active visitor${data.active_sessions === 1 ? "" : "s"} across ${pinsByCountry.size} countr${pinsByCountry.size === 1 ? "y" : "ies"}.`}
        </p>
        <WorldMap pinsByCountry={pinsByCountry} />
      </section>

      <section className="admin-card">
        <h2>Active sessions</h2>
        {data.pins.length === 0 ? (
          <p className="muted">No active sessions in the last 60 seconds.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Country</th><th>Landing</th><th>Device</th><th style={{ textAlign: "right" }}>Last seen</th></tr>
            </thead>
            <tbody>
              {data.pins.map((p) => (
                <tr key={p.id}>
                  <td><span style={{ fontFamily: "var(--font-mono, monospace)" }}>{p.country}</span></td>
                  <td className="muted">{p.landing_path}</td>
                  <td style={{ textTransform: "capitalize" }}>{p.device}</td>
                  <td style={{ textAlign: "right" }} className="muted">
                    {Math.round((Date.now() - p.last_seen_at) / 1000)}s ago
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function WorldMap({ pinsByCountry }: { pinsByCountry: Map<string, Array<{ country: string }>> }) {
  const W = 1000, H = 500;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "2 / 1", background: "rgba(255,255,255,0.03)", borderRadius: "0.6rem", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block" }}
        aria-label="World map of active visitors">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
        {[...pinsByCountry.entries()].map(([country, pins]) => {
          const c = COUNTRY_CENTROIDS[country];
          if (!c) return null;
          const [x, y] = latLngToSvg(c[0], c[1], W, H);
          const r = Math.min(20, 6 + Math.sqrt(pins.length) * 4);
          return (
            <g key={country}>
              <circle cx={x} cy={y} r={r * 1.6} fill="var(--color-primary, #d04a1a)" opacity="0.18">
                <animate attributeName="r" values={`${r * 1.4};${r * 2.2};${r * 1.4}`} dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.25;0.05;0.25" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={x} cy={y} r={r} fill="var(--color-primary, #d04a1a)" opacity="0.85" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={Math.max(11, r * 0.7)} fontWeight="600" fill="white" style={{ pointerEvents: "none" }}>
                {pins.length}
              </text>
              <title>{`${pins.length} visitor${pins.length === 1 ? "" : "s"} from ${country}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Kpi({ label, value, pulse, highlight }: { label: string; value: string; pulse?: boolean; highlight?: boolean }) {
  return (
    <div className="admin-kpi" style={highlight ? { borderColor: "var(--color-primary)", background: "rgba(208,74,26,0.08)" } : undefined}>
      <div className="admin-kpi-label">
        {pulse && (
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#0a0", marginRight: 6, animation: "cc-pulse 1.2s ease-in-out infinite" }} />
        )}
        {label}
      </div>
      <div className="admin-kpi-value">{value}</div>
      <style>{`@keyframes cc-pulse { 0%,100% { opacity:0.5; transform:scale(1) } 50% { opacity:1; transform:scale(1.4) } }`}</style>
    </div>
  );
}
