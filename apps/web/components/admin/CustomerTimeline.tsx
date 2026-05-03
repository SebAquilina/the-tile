"use client";

import { useState } from "react";
import type { TimelineRow } from "@/lib/analytics/queries";

type Source = TimelineRow["source"];

const SOURCE_LABEL: Record<Source, string> = {
  activity: "Pipeline", transcript: "Concierge", pageview: "Browse", event: "Event",
};
const SOURCE_COLOR: Record<Source, string> = {
  activity: "var(--color-primary, #d04a1a)",
  transcript: "#3b82f6",
  pageview: "#6b7280",
  event: "#10b981",
};

export function CustomerTimeline({ rows }: { rows: TimelineRow[] }) {
  const [filter, setFilter] = useState<Source | "all">("all");
  const filtered = filter === "all" ? rows : rows.filter((r) => r.source === filter);

  const counts = rows.reduce<Record<Source, number>>((acc, r) => {
    acc[r.source] = (acc[r.source] || 0) + 1;
    return acc;
  }, { activity: 0, transcript: 0, pageview: 0, event: 0 });

  return (
    <div>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>All ({rows.length})</FilterBtn>
        {(["activity", "transcript", "event", "pageview"] as Source[]).map((s) => (
          <FilterBtn key={s} active={filter === s} onClick={() => setFilter(s)}>
            {SOURCE_LABEL[s]} ({counts[s] || 0})
          </FilterBtn>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="muted">No timeline entries to show.</p>
      ) : (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, position: "relative" }}>
          <div style={{ position: "absolute", left: 13, top: 6, bottom: 6, width: 2, background: "var(--color-border, rgba(255,255,255,0.1))" }} />
          {filtered.map((r, i) => (
            <li key={`${r.source}-${i}-${r.ts}`} style={{ position: "relative", paddingLeft: 36, paddingBottom: "1.1rem" }}>
              <span style={{ position: "absolute", left: 6, top: 4, width: 16, height: 16, borderRadius: "50%", background: SOURCE_COLOR[r.source], border: "3px solid var(--color-bg, #111)", boxShadow: "0 0 0 2px rgba(255,255,255,0.05)" }} />
              <div className="muted" style={{ fontSize: "0.78em", display: "flex", gap: "0.5rem", alignItems: "baseline", flexWrap: "wrap" }}>
                <strong style={{ color: SOURCE_COLOR[r.source] }}>{SOURCE_LABEL[r.source]}</strong>
                <span>{new Date(r.ts).toLocaleString()}</span>
              </div>
              <div style={{ fontWeight: 500 }}>{r.title}</div>
              {r.body && (
                <div style={{ fontSize: "0.92em", color: "var(--color-muted, #9ca3af)", marginTop: 2, whiteSpace: "pre-wrap" }}>
                  {r.body.length > 280 ? r.body.slice(0, 280) + "…" : r.body}
                </div>
              )}
              {r.meta?.dwell_ms ? (
                <div className="muted" style={{ fontSize: "0.78em" }}>
                  Stayed {Math.round(Number(r.meta.dwell_ms) / 1000)}s
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`btn btn-sm ${active ? "btn-primary" : "btn-secondary"}`}>
      {children}
    </button>
  );
}
