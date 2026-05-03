import {
  headline, conversionFunnel, topFrontQuestions, noAnswerQuestions,
  sessionsByLandingPage, sessionsByDevice, sessionsByCountry,
  topReferrers, topPages, promptPerformance, windowMs, type Window,
} from "@/lib/analytics/queries";
import Link from "next/link";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const WINDOWS: { slug: Window; label: string }[] = [
  { slug: "24h", label: "Last 24h" },
  { slug: "7d", label: "Last 7 days" },
  { slug: "30d", label: "Last 30 days" },
  { slug: "90d", label: "Last 90 days" },
];

function fmt(n: number) { return n.toLocaleString(); }
function pct(n: number, digits = 1) { return `${(n * 100).toFixed(digits)}%`; }
function dur(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export default async function AnalyticsPage({ searchParams }: { searchParams: { window?: string } }) {
  const win = (WINDOWS.find((w) => w.slug === searchParams.window)?.slug ?? "7d") as Window;
  const since = Date.now() - windowMs(win);
  const db = ((process.env as unknown as { DB?: D1Database }).DB ??
    (globalThis as unknown as { DB?: D1Database }).DB) as D1Database | undefined;

  if (!db) {
    return (
      <>
        <header className="admin-header"><h1>Analytics</h1></header>
        <p className="muted">Database not bound. Visit on the live site to see data.</p>
      </>
    );
  }

  const [head, funnel, topQ, noAns, landings, devices, countries, refs, pages, prompts] = await Promise.all([
    headline(db, since),
    conversionFunnel(db, since),
    topFrontQuestions(db, since),
    noAnswerQuestions(db, since),
    sessionsByLandingPage(db, since),
    sessionsByDevice(db, since),
    sessionsByCountry(db, since),
    topReferrers(db, since),
    topPages(db, since),
    promptPerformance(db, since),
  ]);

  return (
    <>
      <header className="admin-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>Analytics &amp; Behavior</h1>
        <nav style={{ display: "flex", gap: "0.4rem" }}>
          {WINDOWS.map((w) => (
            <Link key={w.slug} href={`/admin/analytics?window=${w.slug}`}
              className={`btn btn-sm ${win === w.slug ? "btn-primary" : "btn-secondary"}`}>
              {w.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="admin-kpi-grid">
        <Kpi label="Sessions" value={fmt(head.sessions)} />
        <Kpi label="Unique visitors" value={fmt(head.unique_visitors)} />
        <Kpi label="Pageviews" value={fmt(head.pageviews)} />
        <Kpi label="Avg dwell" value={dur(head.avg_dwell_seconds)} />
        <Kpi label="Bounce rate" value={pct(head.bounce_rate)} />
        <Kpi label="Mobile share" value={pct(head.mobile_share)} />
      </section>

      <section className="admin-card">
        <h2>Conversion funnel</h2>
        <p className="muted" style={{ fontSize: "0.85em" }}>
          Sessions → engaged with Front → asked a question → submitted lead → won.
        </p>
        <div className="funnel">
          {funnel.map((step, i) => {
            const widthPct = Math.max(step.pct * 100, step.count > 0 ? 4 : 0);
            return (
              <div key={step.step} className="funnel-row">
                <div className="funnel-label">{step.step}</div>
                <div className="funnel-bar-wrap">
                  <div className="funnel-bar" style={{ width: `${widthPct}%` }}
                    aria-label={`${step.count} sessions, ${pct(step.pct)} of total`}>
                    <span className="funnel-bar-text">{fmt(step.count)} · {pct(step.pct, 0)}</span>
                  </div>
                </div>
                {i > 0 && (
                  <div className="funnel-drop" title="Drop-off from previous step">
                    {step.drop_pct > 0 ? `−${pct(step.drop_pct, 0)}` : "—"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="admin-card">
        <h2>Top Front questions</h2>
        <p className="muted" style={{ fontSize: "0.85em" }}>
          What people are actually asking the concierge. Equivalent to Shopify&rsquo;s Top Online Store Searches.
        </p>
        {topQ.length === 0 ? (
          <p className="muted">No data yet — questions populate as visitors talk to Front.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Question</th><th style={{ textAlign: "right" }}>Asked</th><th style={{ textAlign: "right" }}>Answered</th><th style={{ textAlign: "right" }}>No answer</th></tr></thead>
            <tbody>
              {topQ.map((r, i) => (
                <tr key={i}>
                  <td>{String(r.text)}</td>
                  <td style={{ textAlign: "right" }}>{fmt(Number(r.hits))}</td>
                  <td style={{ textAlign: "right" }}>{fmt(Number(r.answered))}</td>
                  <td style={{ textAlign: "right" }}>{fmt(Number(r.no_answer))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="admin-card">
        <h2>Questions with no good answer</h2>
        <p className="muted" style={{ fontSize: "0.85em" }}>
          Gold mine: things people asked that Front couldn&rsquo;t answer well.
        </p>
        {noAns.length === 0 ? (
          <p className="muted">No no-answer events recorded yet.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Question</th><th style={{ textAlign: "right" }}>Times asked</th><th style={{ textAlign: "right" }}>Last seen</th></tr></thead>
            <tbody>
              {noAns.map((r, i) => (
                <tr key={i}>
                  <td>{String(r.text)}</td>
                  <td style={{ textAlign: "right" }}>{fmt(Number(r.hits))}</td>
                  <td style={{ textAlign: "right" }} className="muted">
                    {new Date(Number(r.last_seen)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div style={{ display: "grid", gap: "var(--space-6)", gridTemplateColumns: "repeat(auto-fit, minmax(360px,1fr))" }}>
        <section className="admin-card">
          <h2>Sessions by landing page</h2>
          <table className="admin-table">
            <thead><tr><th>Page</th><th style={{ textAlign: "right" }}>Sessions</th><th style={{ textAlign: "right" }}>Avg dwell</th><th style={{ textAlign: "right" }}>Bounce</th><th style={{ textAlign: "right" }}>Lead %</th></tr></thead>
            <tbody>
              {landings.length === 0 ? <tr><td colSpan={5} className="muted">No data yet.</td></tr> : (
                landings.map((r, i) => (
                  <tr key={i}>
                    <td>{String(r.path)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(Number(r.sessions))}</td>
                    <td style={{ textAlign: "right" }}>{dur(Number(r.avg_dwell_seconds))}</td>
                    <td style={{ textAlign: "right" }}>{pct(Number(r.bounce_rate), 0)}</td>
                    <td style={{ textAlign: "right" }}>{pct(Number(r.lead_rate), 1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="admin-card">
          <h2>Sessions by device</h2>
          <table className="admin-table">
            <thead><tr><th>Device</th><th style={{ textAlign: "right" }}>Sessions</th><th style={{ textAlign: "right" }}>Avg dwell</th><th style={{ textAlign: "right" }}>Lead %</th></tr></thead>
            <tbody>
              {devices.length === 0 ? <tr><td colSpan={4} className="muted">No data yet.</td></tr> : (
                devices.map((r, i) => (
                  <tr key={i}>
                    <td style={{ textTransform: "capitalize" }}>{String(r.device)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(Number(r.sessions))}</td>
                    <td style={{ textAlign: "right" }}>{dur(Number(r.avg_dwell_seconds))}</td>
                    <td style={{ textAlign: "right" }}>{pct(Number(r.lead_rate), 1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      <div style={{ display: "grid", gap: "var(--space-6)", gridTemplateColumns: "repeat(auto-fit, minmax(360px,1fr))" }}>
        <section className="admin-card">
          <h2>Sessions by country</h2>
          <table className="admin-table">
            <thead><tr><th>Country</th><th style={{ textAlign: "right" }}>Sessions</th><th style={{ textAlign: "right" }}>Leads</th></tr></thead>
            <tbody>
              {countries.length === 0 ? <tr><td colSpan={3} className="muted">No data yet.</td></tr> : (
                countries.map((r, i) => (
                  <tr key={i}>
                    <td>{String(r.country)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(Number(r.sessions))}</td>
                    <td style={{ textAlign: "right" }}>{fmt(Number(r.leads))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="admin-card">
          <h2>Top referrers</h2>
          <table className="admin-table">
            <thead><tr><th>Referrer</th><th style={{ textAlign: "right" }}>Sessions</th><th style={{ textAlign: "right" }}>Leads</th></tr></thead>
            <tbody>
              {refs.length === 0 ? <tr><td colSpan={3} className="muted">No data yet.</td></tr> : (
                refs.map((r, i) => (
                  <tr key={i}>
                    <td>{String(r.host)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(Number(r.sessions))}</td>
                    <td style={{ textAlign: "right" }}>{fmt(Number(r.leads))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section className="admin-card">
        <h2>Top pages</h2>
        <table className="admin-table">
          <thead><tr><th>Page</th><th style={{ textAlign: "right" }}>Views</th><th style={{ textAlign: "right" }}>Avg dwell</th></tr></thead>
          <tbody>
            {pages.length === 0 ? <tr><td colSpan={3} className="muted">No data yet.</td></tr> : (
              pages.map((r, i) => (
                <tr key={i}>
                  <td>{String(r.path)}</td>
                  <td style={{ textAlign: "right" }}>{fmt(Number(r.views))}</td>
                  <td style={{ textAlign: "right" }}>{dur(Number(r.avg_dwell_seconds))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2>Home-page prompt performance</h2>
        <p className="muted" style={{ fontSize: "0.85em" }}>
          Click-through and lead conversion for the &ldquo;Try one of these&rdquo; prompt buttons.
        </p>
        {prompts.length === 0 ? (
          <p className="muted">No prompt clicks recorded yet.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Prompt</th><th style={{ textAlign: "right" }}>Clicks</th><th style={{ textAlign: "right" }}>Leads</th><th style={{ textAlign: "right" }}>Lead rate</th></tr></thead>
            <tbody>
              {prompts.map((r, i) => (
                <tr key={i}>
                  <td>{String(r.label)}</td>
                  <td style={{ textAlign: "right" }}>{fmt(Number(r.clicks))}</td>
                  <td style={{ textAlign: "right" }}>{fmt(Number(r.leads))}</td>
                  <td style={{ textAlign: "right" }}>{pct(Number(r.lead_rate), 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-kpi">
      <div className="admin-kpi-label">{label}</div>
      <div className="admin-kpi-value">{value}</div>
    </div>
  );
}
