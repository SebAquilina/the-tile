import { notFound } from "next/navigation";
import { getLead } from "@/lib/admin-store";
import { listTags, listNotes, leadClientId } from "@/lib/customer/store";
import { customerTimeline } from "@/lib/analytics/queries";
import { CustomerTimeline } from "@/components/admin/CustomerTimeline";
import { CustomerTagsAndNotes } from "@/components/admin/CustomerTagsAndNotes";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function LeadDetail({ params }: { params: { id: string } }) {
  const lead = await getLead(params.id);
  if (!lead) notFound();

  const db = ((process.env as unknown as { DB?: D1Database }).DB ??
    (globalThis as unknown as { DB?: D1Database }).DB) as D1Database | undefined;

  const [tags, notes, clientId] = await Promise.all([
    listTags(params.id).catch(() => []),
    listNotes(params.id).catch(() => []),
    leadClientId(params.id).catch(() => null),
  ]);
  const timeline = db ? await customerTimeline(db, params.id, clientId) : [];

  return (
    <div className="mx-auto max-w-wide px-space-5 py-space-7 md:px-space-7">
      <header className="admin-header">
        <div>
          <h1 className="font-display text-2xl text-ink">{lead.name}</h1>
          <p className="text-sm text-ink-muted">
            <a href={`mailto:${lead.email}`} className="underline">{lead.email}</a>
            {lead.phone ? <> · {lead.phone}</> : null}
            {" · "}
            <span className="muted">Received {new Date(lead.createdAt).toLocaleString()}</span>
          </p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <section className="admin-card">
            <h2 style={{ marginTop: 0 }}>Customer</h2>
            <dl style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "0.6rem 1.5rem", margin: 0 }}>
              <dt className="muted">Preferred contact</dt>
              <dd>{lead.preferredContactMethod ?? "—"}</dd>
              <dt className="muted">Saved tiles</dt>
              <dd>{lead.saveListIds && lead.saveListIds.length > 0 ? lead.saveListIds.join(", ") : "—"}</dd>
              <dt className="muted">Message</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>{lead.message ?? "(none)"}</dd>
            </dl>
          </section>

          <section className="admin-card">
            <h2 style={{ marginTop: 0 }}>Timeline</h2>
            <p className="muted" style={{ fontSize: "0.85em", marginTop: 0 }}>
              Every touchpoint with this person — page views, concierge sessions, and pipeline events.
            </p>
            <CustomerTimeline rows={timeline} />
          </section>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <section className="admin-card">
            <h2 style={{ marginTop: 0, fontSize: "1.05em" }}>Tags &amp; notes</h2>
            <CustomerTagsAndNotes leadId={params.id} initialTags={tags} initialNotes={notes} />
          </section>
        </aside>
      </div>
    </div>
  );
}
