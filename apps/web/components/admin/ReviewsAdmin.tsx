"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, useToast } from "@/components/ui";

export type ReviewRow = {
  id: string;
  author: string;
  location: string | null;
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string | null;
  quote: string;
  source: string | null;
  product_id: string | null;
  status: "active" | "draft" | "archived";
  placeholder: number;
  version: number;
  created_at: number;
  updated_at: number;
};

type Draft = {
  author: string; location: string; date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string; quote: string; source: string; product_id: string;
  status: "active" | "draft" | "archived"; placeholder: boolean;
};

const SOURCES = ["showroom", "google", "facebook", "email", "survey", "other"];
const today = () => new Date().toISOString().slice(0, 10);
const blank = (): Draft => ({
  author: "", location: "", date: today(), rating: 5,
  title: "", quote: "", source: "showroom", product_id: "",
  status: "active", placeholder: false,
});
const fromRow = (r: ReviewRow): Draft => ({
  author: r.author, location: r.location ?? "", date: r.date,
  rating: r.rating, title: r.title ?? "", quote: r.quote,
  source: r.source ?? "showroom", product_id: r.product_id ?? "",
  status: r.status, placeholder: !!r.placeholder,
});

function Stars({ rating, onChange, size = "h-4 w-4" }: {
  rating: number; onChange?: (v: 1 | 2 | 3 | 4 | 5) => void; size?: string;
}) {
  return (
    <div className="flex items-center gap-space-1 text-umber"
      aria-label={`${rating} out of 5 stars`}>
      {([1, 2, 3, 4, 5] as const).map((i) => {
        const filled = i <= rating;
        if (!onChange) {
          return (
            <Star key={i} aria-hidden="true"
              className={cn(size, filled ? "fill-umber" : "fill-transparent")} />
          );
        }
        return (
          <button key={i} type="button" onClick={() => onChange(i)}
            aria-label={`Set rating to ${i}`}
            className="rounded-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2">
            <Star aria-hidden="true"
              className={cn(size, filled ? "fill-umber" : "fill-transparent")} />
          </button>
        );
      })}
    </div>
  );
}

function Badge({ status }: { status: ReviewRow["status"] }) {
  const styles = status === "active"
    ? "bg-umber/10 text-umber-strong border-umber/30"
    : "bg-canvas text-ink-muted border-line";
  return (
    <span className={cn(
      "inline-flex items-center rounded-sm border px-space-2 py-px text-xs uppercase tracking-wider",
      styles,
    )}>{status}</span>
  );
}

const inputCls =
  "mt-space-2 w-full rounded-md border border-line bg-canvas px-space-3 py-space-2 text-sm text-ink";

function Field({ label, children, hint }: {
  label: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-ink-muted">{label}</span>
      {children}
      {hint ? <span className="mt-space-1 block text-xs text-ink-subtle">{hint}</span> : null}
    </label>
  );
}

export function ReviewsAdmin({ initial }: { initial: ReviewRow[] }) {
  const [rows, setRows] = useState<ReviewRow[]>(initial);
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; id?: string; draft: Draft } | null>(null);
  const [confirmDel, setConfirmDel] = useState<ReviewRow | null>(null);
  const toast = useToast();
  const router = useRouter();
  const [busy, startTx] = useTransition();

  const counts = useMemo(() => ({
    live: rows.filter((r) => r.status === "active").length,
    drafts: rows.filter((r) => r.status === "draft").length,
  }), [rows]);

  function patchDraft(p: Partial<Draft>) {
    setEditing((cur) => cur ? { ...cur, draft: { ...cur.draft, ...p } } : cur);
  }

  async function save() {
    if (!editing) return;
    const d = editing.draft;
    if (!d.author.trim()) { toast.error("Author is required."); return; }
    if (d.quote.trim().length < 20) { toast.error("Quote must be at least 20 characters."); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) { toast.error("Date must be YYYY-MM-DD."); return; }
    const payload = {
      author: d.author.trim(), location: d.location.trim() || null,
      date: d.date, rating: d.rating,
      title: d.title.trim() || null, quote: d.quote.trim(),
      source: d.source || null, product_id: d.product_id.trim() || null,
      status: d.status, placeholder: d.placeholder,
    };
    startTx(async () => {
      const url = editing.mode === "create"
        ? "/api/admin/reviews"
        : `/api/admin/reviews/${editing.id}`;
      const method = editing.mode === "create" ? "POST" : "PATCH";
      try {
        const res = await fetch(url, {
          method, headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string; errors?: { message: string }[] };
          toast.error(`Save failed: ${j.errors?.[0]?.message || j.error || `HTTP ${res.status}`}`);
          return;
        }
        const j = (await res.json()) as { review: ReviewRow };
        setRows((p) => editing.mode === "create"
          ? [j.review, ...p]
          : p.map((r) => r.id === j.review.id ? j.review : r));
        toast.success(editing.mode === "create" ? "Review created." : "Review saved.");
        setEditing(null);
        router.refresh();
      } catch (e) {
        toast.error(`Save failed: ${(e as Error).message}`);
      }
    });
  }

  async function performDelete(r: ReviewRow) {
    startTx(async () => {
      try {
        const res = await fetch(`/api/admin/reviews/${r.id}`, { method: "DELETE" });
        if (!res.ok) { toast.error(`Delete failed: HTTP ${res.status}`); return; }
        setRows((p) => p.filter((x) => x.id !== r.id));
        setConfirmDel(null);
        toast.success("Review deleted.");
        router.refresh();
      } catch (e) {
        toast.error(`Delete failed: ${(e as Error).message}`);
      }
    });
  }

  return (
    <div className="space-y-space-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {counts.live} live · {counts.drafts} draft{counts.drafts === 1 ? "" : "s"}
        </p>
        <Button variant="primary" onClick={() => setEditing({ mode: "create", draft: blank() })}>
          <span className="inline-flex items-center gap-space-2">
            <Plus aria-hidden="true" className="h-4 w-4" /> Add review
          </span>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-line bg-surface p-space-7 text-center">
          <p className="text-ink-muted">No reviews yet. Add the first one to surface on <code>/reviews</code>.</p>
          <div className="mt-space-4">
            <Button variant="primary" onClick={() => setEditing({ mode: "create", draft: blank() })}>Add review</Button>
          </div>
        </div>
      ) : (
        <ul className="grid gap-space-4 md:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-space-3 rounded-md border border-line bg-surface p-space-5">
              <div className="flex items-start justify-between gap-space-3">
                <Stars rating={r.rating} />
                <Badge status={r.status} />
              </div>
              {r.title ? <h3 className="font-display text-lg text-ink">{r.title}</h3> : null}
              <p className="text-sm text-ink-muted line-clamp-3">{r.quote}</p>
              <p className="text-xs text-ink-subtle">
                <span className="text-ink">{r.author}</span>
                {r.location ? <> · {r.location}</> : null} ·{" "}
                {new Date(r.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                {r.placeholder ? " · placeholder" : ""}
              </p>
              <div className="mt-auto flex items-center gap-space-2 pt-space-2">
                <button type="button"
                  onClick={() => setEditing({ mode: "edit", id: r.id, draft: fromRow(r) })}
                  className="inline-flex items-center gap-space-2 rounded-md border border-line px-space-3 py-space-2 text-xs text-ink hover:border-umber hover:text-umber">
                  <Pencil aria-hidden="true" className="h-3.5 w-3.5" /> Edit
                </button>
                <button type="button" onClick={() => setConfirmDel(r)}
                  className="inline-flex items-center gap-space-2 rounded-md border border-line px-space-3 py-space-2 text-xs text-ink-muted hover:border-red-500/40 hover:text-red-600">
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <Modal title={editing.mode === "create" ? "New review" : "Edit review"}
          onClose={() => setEditing(null)} busy={busy}
          footer={
            <>
              <button type="button" onClick={() => setEditing(null)} disabled={busy}
                className="rounded-md border border-line px-space-4 py-space-2 text-sm text-ink-muted hover:border-ink-subtle hover:text-ink">
                Cancel
              </button>
              <Button variant="primary" onClick={save} disabled={busy}>
                {busy ? "Saving..." : editing.mode === "create" ? "Create review" : "Save"}
              </Button>
            </>
          }>
          <div className="space-y-space-5">
            <Field label="Rating">
              <div className="mt-space-2"><Stars rating={editing.draft.rating} size="h-5 w-5"
                onChange={(v) => patchDraft({ rating: v })} /></div>
            </Field>
            <Field label="Title (optional)">
              <input type="text" value={editing.draft.title} maxLength={200}
                onChange={(e) => patchDraft({ title: e.target.value })} className={inputCls} />
            </Field>
            <Field label={`Quote (${editing.draft.quote.length}/2000)`} hint="Min 20 characters.">
              <textarea rows={6} value={editing.draft.quote} maxLength={2000}
                onChange={(e) => patchDraft({ quote: e.target.value })} className={inputCls} />
            </Field>
            <div className="grid gap-space-4 md:grid-cols-2">
              <Field label="Author">
                <input type="text" value={editing.draft.author} maxLength={160}
                  onChange={(e) => patchDraft({ author: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Location">
                <input type="text" value={editing.draft.location} maxLength={120}
                  onChange={(e) => patchDraft({ location: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Date">
                <input type="date" value={editing.draft.date}
                  onChange={(e) => patchDraft({ date: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Source">
                <select value={editing.draft.source}
                  onChange={(e) => patchDraft({ source: e.target.value })} className={inputCls}>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Product (optional)">
                <input type="text" value={editing.draft.product_id} maxLength={120}
                  placeholder="series id (e.g. provoak)"
                  onChange={(e) => patchDraft({ product_id: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Status">
                <select value={editing.draft.status}
                  onChange={(e) => patchDraft({ status: e.target.value as Draft["status"] })} className={inputCls}>
                  <option value="active">Active (visible)</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-space-3 text-sm text-ink-muted">
              <input type="checkbox" checked={editing.draft.placeholder}
                onChange={(e) => patchDraft({ placeholder: e.target.checked })} />
              Placeholder (fabricated demo content — flag for replacement)
            </label>
          </div>
        </Modal>
      ) : null}

      {confirmDel ? (
        <Modal title="Delete review?" onClose={() => setConfirmDel(null)} busy={busy}
          footer={
            <>
              <button type="button" onClick={() => setConfirmDel(null)} disabled={busy}
                className="rounded-md border border-line px-space-4 py-space-2 text-sm text-ink-muted hover:border-ink-subtle hover:text-ink">
                Cancel
              </button>
              <button type="button" onClick={() => performDelete(confirmDel)} disabled={busy}
                className="rounded-md bg-red-600 px-space-4 py-space-2 text-sm text-white hover:bg-red-700 disabled:opacity-60">
                {busy ? "..." : "Delete"}
              </button>
            </>
          }>
          <p className="text-sm text-ink-muted">
            Permanently remove the review by {confirmDel.author}. This cannot be undone.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({ title, children, footer, onClose, busy }: {
  title: string; children: React.ReactNode; footer: React.ReactNode;
  onClose: () => void; busy: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-space-4 md:items-center"
      role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-md border border-line bg-surface shadow-lg">
        <header className="flex items-center justify-between border-b border-line px-space-5 py-space-4">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy}
            className="text-sm text-ink-subtle hover:text-ink">Close</button>
        </header>
        <div className="flex-1 overflow-y-auto px-space-5 py-space-5">{children}</div>
        <footer className="sticky bottom-0 flex items-center justify-end gap-space-3 border-t border-line bg-surface px-space-5 py-space-4">
          {footer}
        </footer>
      </div>
    </div>
  );
}
