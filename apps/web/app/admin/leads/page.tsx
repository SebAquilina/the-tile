import { getAllLeads } from "@/lib/admin-store";

export default function AdminLeadsPage() {
  const leads = getAllLeads();

  return (
    <div className="space-y-space-7">
      <header>
        <h1 className="font-display text-3xl text-ink">Leads</h1>
        <p className="mt-space-2 text-sm text-ink-muted">
          Contact-form submissions. {leads.length} in the current file-backed
          store. Production-scale lead storage moves to D1 once migrations
          are applied.
        </p>
      </header>

      {leads.length === 0 ? (
        <div className="rounded-md border border-dashed border-line bg-surface p-space-7 text-ink-muted">
          No leads yet. Submissions from /contact will appear here.
        </div>
      ) : (
        <ul className="space-y-space-4">
          {leads.map((l) => (
            <li
              key={l.id}
              className="rounded-md border border-line bg-surface p-space-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-space-3">
                <div>
                  <p className="font-medium text-ink">{l.name}</p>
                  <p className="text-xs text-ink-subtle">
                    {new Date(l.createdAt).toLocaleString("en-GB")} ·{" "}
                    {l.status}
                  </p>
                </div>
                <div className="text-sm text-ink-muted">
                  <a
                    href={`mailto:${l.email}`}
                    className="text-umber underline underline-offset-4 hover:text-umber-strong"
                  >
                    {l.email}
                  </a>
                  {l.phone ? <> · {l.phone}</> : null}
                </div>
              </div>
              <p className="mt-space-3 whitespace-pre-wrap text-ink">
                {l.message}
              </p>
              {l.saveListIds && l.saveListIds.length > 0 ? (
                <p className="mt-space-3 text-xs text-ink-subtle">
                  Shortlist: {l.saveListIds.join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
