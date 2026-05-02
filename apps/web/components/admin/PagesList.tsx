"use client";

/**
 * Admin pages list. Renders the table/grid of all pages with search,
 * status filter, and per-row inline actions (edit / view / archive /
 * delete). Bulk select+actions are wired in for archive / publish.
 *
 * Server delivers the initial list; this component owns local mutations
 * (archive, delete) so the UI updates without a full reload, then calls
 * router.refresh() to re-sync.
 */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
  Archive,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, useToast } from "@/components/ui";
import type { PageRow } from "@/lib/pages/store";

type StatusFilter = "all" | "active" | "draft" | "archived";

function relativeTime(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(epochMs).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: PageRow["status"] }) {
  const styles =
    status === "active"
      ? "bg-umber/10 text-umber-strong border-umber/30"
      : status === "draft"
        ? "bg-canvas text-ink-muted border-line"
        : "bg-surface-muted text-ink-subtle border-line";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-space-2 py-px text-xs uppercase tracking-wider",
        styles,
      )}
    >
      {status}
    </span>
  );
}

export function PagesList({ initial }: { initial: PageRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState<PageRow[]>(initial);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, startTx] = useTransition();
  const [confirmDel, setConfirmDel] = useState<PageRow | null>(null);

  const counts = useMemo(
    () => ({
      total: rows.length,
      drafts: rows.filter((p) => p.status === "draft").length,
      active: rows.filter((p) => p.status === "active").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  }

  async function patchStatus(p: PageRow, status: PageRow["status"]): Promise<PageRow | null> {
    const res = await fetch(`/api/admin/pages/${p.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "if-match": `W/"${p.version}"`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.status === 412) {
      toast.error(`${p.title}: edited elsewhere — reload to see the latest.`);
      return null;
    }
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(`${p.title}: ${j.error ?? `HTTP ${res.status}`}`);
      return null;
    }
    const j = (await res.json()) as { page: PageRow };
    return j.page;
  }

  async function destroy(p: PageRow) {
    const res = await fetch(`/api/admin/pages/${p.id}`, {
      method: "DELETE",
      headers: { "if-match": `W/"${p.version}"` },
    });
    if (res.status === 412) {
      toast.error(`${p.title}: edited elsewhere — reload to delete.`);
      return false;
    }
    if (!res.ok) {
      toast.error(`${p.title}: delete failed (HTTP ${res.status}).`);
      return false;
    }
    return true;
  }

  function archiveRow(p: PageRow) {
    startTx(async () => {
      const updated = await patchStatus(p, "archived");
      if (!updated) return;
      setRows((curr) => curr.map((r) => (r.id === p.id ? updated : r)));
      toast.success(`Archived "${p.title}".`);
      router.refresh();
    });
  }

  function publishRow(p: PageRow) {
    startTx(async () => {
      const updated = await patchStatus(p, "active");
      if (!updated) return;
      setRows((curr) => curr.map((r) => (r.id === p.id ? updated : r)));
      toast.success(`Published "${p.title}".`);
      router.refresh();
    });
  }

  function deleteRow(p: PageRow) {
    startTx(async () => {
      const ok = await destroy(p);
      if (!ok) return;
      setRows((curr) => curr.filter((r) => r.id !== p.id));
      setSelected((curr) => {
        const next = new Set(curr);
        next.delete(p.id);
        return next;
      });
      setConfirmDel(null);
      toast.success(`Deleted "${p.title}".`);
      router.refresh();
    });
  }

  function bulkAction(action: "publish" | "archive" | "delete") {
    const targets = rows.filter((r) => selected.has(r.id));
    if (targets.length === 0) return;
    if (action === "delete") {
      const ok = window.confirm(
        `Permanently delete ${targets.length} page${targets.length === 1 ? "" : "s"}? This cannot be undone.`,
      );
      if (!ok) return;
    }
    startTx(async () => {
      let updatedRows = [...rows];
      let okCount = 0;
      for (const t of targets) {
        const latest = updatedRows.find((r) => r.id === t.id);
        if (!latest) continue;
        if (action === "delete") {
          const ok = await destroy(latest);
          if (ok) {
            updatedRows = updatedRows.filter((r) => r.id !== latest.id);
            okCount += 1;
          }
        } else {
          const next = await patchStatus(
            latest,
            action === "publish" ? "active" : "archived",
          );
          if (next) {
            updatedRows = updatedRows.map((r) => (r.id === next.id ? next : r));
            okCount += 1;
          }
        }
      }
      setRows(updatedRows);
      setSelected(new Set());
      toast.success(
        `${okCount}/${targets.length} ${action}${action === "publish" ? "ed" : "d"}.`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-space-6">
      {/* Header */}
      <header className="flex flex-wrap items-baseline justify-between gap-space-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Pages</h1>
          <p className="mt-space-2 text-sm text-ink-muted">
            {counts.total} page{counts.total === 1 ? "" : "s"} ·{" "}
            {counts.active} live · {counts.drafts} draft
            {counts.drafts === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className={cn(
            "inline-flex h-11 items-center gap-space-2 rounded-md bg-umber px-space-5 text-base font-medium text-canvas",
            "border border-umber transition-colors hover:bg-umber-strong hover:border-umber-strong",
            "focus-visible:outline-2 focus-visible:outline focus-visible:outline-focus focus-visible:outline-offset-2",
          )}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New page
        </Link>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-space-3">
        <label className="relative flex flex-1 items-center min-w-[240px]">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-space-3 h-4 w-4 text-ink-subtle"
          />
          <input
            type="search"
            placeholder="Search title or slug…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              "h-11 w-full rounded-md border border-line bg-surface pl-space-7 pr-space-3 text-sm text-ink",
              "placeholder:text-ink-subtle",
              "focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring",
            )}
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filter by status"
          className="h-11 rounded-md border border-line bg-surface px-space-3 text-sm text-ink focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Bulk action bar (only when something selected) */}
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-space-3 rounded-md border border-line bg-surface px-space-4 py-space-3 text-sm">
          <span className="text-ink-muted">
            {selected.size} selected
          </span>
          <div className="flex flex-wrap gap-space-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => bulkAction("publish")}
              disabled={busy}
            >
              Publish
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => bulkAction("archive")}
              disabled={busy}
            >
              Archive
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => bulkAction("delete")}
              disabled={busy}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Delete
            </Button>
            <Button
              variant="link"
              size="sm"
              onClick={() => setSelected(new Set())}
              disabled={busy}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      {/* Empty state */}
      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-line bg-surface p-space-8 text-center">
          <h2 className="font-display text-xl text-ink">No pages yet</h2>
          <p className="mt-space-2 text-sm text-ink-muted">
            Create the first one to start the content section.
            About / FAQ / care guide / privacy / terms all live here.
          </p>
          <div className="mt-space-5">
            <Link
              href="/admin/pages/new"
              className={cn(
                "inline-flex h-11 items-center gap-space-2 rounded-md bg-umber px-space-5 text-base font-medium text-canvas",
                "border border-umber transition-colors hover:bg-umber-strong hover:border-umber-strong",
              )}
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              New page
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-md border border-line bg-surface p-space-7 text-center text-sm text-ink-muted">
          No pages match your filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-canvas text-left text-xs uppercase tracking-wider text-ink-subtle">
              <tr>
                <th className="w-10 px-space-4 py-space-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={
                      filtered.length > 0 && selected.size === filtered.length
                    }
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-space-4 py-space-3 font-medium">Title</th>
                <th className="px-space-4 py-space-3 font-medium">Slug</th>
                <th className="px-space-4 py-space-3 font-medium">Status</th>
                <th className="px-space-4 py-space-3 font-medium">Updated</th>
                <th className="px-space-4 py-space-3 font-medium" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-line last:border-b-0 hover:bg-canvas/60"
                >
                  <td className="px-space-4 py-space-3 align-middle">
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.title}`}
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                  </td>
                  <td className="px-space-4 py-space-3 align-middle">
                    <Link
                      href={`/admin/pages/${p.id}`}
                      className="font-medium text-ink hover:text-umber"
                    >
                      {p.title}
                    </Link>
                    {p.is_policy ? (
                      <span
                        title="Policy page"
                        className="ml-space-2 inline-flex items-center gap-space-1 rounded-sm border border-line px-space-2 py-px align-middle text-[10px] uppercase tracking-wider text-ink-muted"
                      >
                        <ShieldCheck aria-hidden="true" className="h-3 w-3" />
                        Policy
                      </span>
                    ) : null}
                  </td>
                  <td className="px-space-4 py-space-3 align-middle">
                    <code className="font-mono text-xs text-ink-subtle">
                      /{p.slug}
                    </code>
                  </td>
                  <td className="px-space-4 py-space-3 align-middle">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-space-4 py-space-3 align-middle text-ink-muted">
                    <time
                      dateTime={new Date(p.updated_at).toISOString()}
                      title={new Date(p.updated_at).toLocaleString()}
                    >
                      {relativeTime(p.updated_at)}
                    </time>
                  </td>
                  <td className="px-space-4 py-space-3 align-middle">
                    <div className="flex items-center justify-end gap-space-1">
                      <Link
                        href={`/admin/pages/${p.id}`}
                        className="inline-flex items-center gap-space-1 rounded-md border border-line px-space-3 py-space-2 text-xs text-ink hover:border-umber hover:text-umber"
                      >
                        <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      {p.status === "active" ? (
                        <a
                          href={`/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-space-1 rounded-md border border-line px-space-3 py-space-2 text-xs text-ink-muted hover:border-ink-subtle hover:text-ink"
                        >
                          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                          View
                        </a>
                      ) : null}
                      {p.status === "active" || p.status === "draft" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => archiveRow(p)}
                          className="inline-flex items-center gap-space-1 rounded-md border border-line px-space-3 py-space-2 text-xs text-ink-muted hover:border-ink-subtle hover:text-ink disabled:opacity-50"
                        >
                          <Archive aria-hidden="true" className="h-3.5 w-3.5" />
                          Archive
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => publishRow(p)}
                          className="inline-flex items-center gap-space-1 rounded-md border border-line px-space-3 py-space-2 text-xs text-ink-muted hover:border-ink-subtle hover:text-ink disabled:opacity-50"
                        >
                          <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                          Publish
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmDel(p)}
                        className="inline-flex items-center gap-space-1 rounded-md border border-line px-space-3 py-space-2 text-xs text-ink-muted hover:border-red-500/40 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDel ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-space-4 md:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-del-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDel(null);
          }}
        >
          <div className="flex w-full max-w-md flex-col rounded-md border border-line bg-surface shadow-lg">
            <header className="border-b border-line px-space-5 py-space-4">
              <h2 id="confirm-del-title" className="font-display text-xl text-ink">
                Delete page?
              </h2>
            </header>
            <div className="px-space-5 py-space-5 text-sm text-ink-muted">
              <p>
                Permanently remove{" "}
                <strong className="text-ink">{confirmDel.title}</strong>{" "}
                <code className="font-mono text-xs text-ink-subtle">
                  /{confirmDel.slug}
                </code>
                . This cannot be undone.
              </p>
            </div>
            <footer className="flex items-center justify-end gap-space-3 border-t border-line px-space-5 py-space-4">
              <Button
                variant="secondary"
                onClick={() => setConfirmDel(null)}
                disabled={busy}
              >
                Cancel
              </Button>
              <button
                type="button"
                disabled={busy}
                onClick={() => deleteRow(confirmDel)}
                className="rounded-md bg-red-600 px-space-4 py-space-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
