"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUnsavedChanges, useCmdS } from "@/lib/use-unsaved-changes";
import { useToast } from "@/components/ui";
import { renderMarkdown } from "@/lib/pages/markdown-client";

type PageRow = {
  id: string;
  slug: string;
  title: string;
  body_md: string;
  seo_title: string | null;
  seo_description: string | null;
  template: string;
  status: "draft" | "active" | "archived";
  is_policy: number;
  position: number;
  version: number;
};

export function PageEditor({ initial }: { initial: PageRow }) {
  const router = useRouter();
  const [p, setP] = useState<PageRow>(initial);
  const toast = useToast();
  const [busy, startTx] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { dirty, markSaved } = useUnsavedChanges(initial, p);

  async function save() {
    setErr(null);
    startTx(async () => {
      try {
        const res = await fetch(`/api/admin/pages/${p.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json", "if-match": `W/"${p.version}"` },
          body: JSON.stringify({
            slug: p.slug, title: p.title, body_md: p.body_md,
            seo_title: p.seo_title, seo_description: p.seo_description,
            template: p.template, status: p.status,
            is_policy: !!p.is_policy, position: p.position,
          }),
        });
        if (res.status === 412) {
          const j = await res.json();
          setErr(`Edited elsewhere (current v${j.currentVersion}). Reload to see latest.`);
          toast.error("Save blocked — newer version exists.");
          return;
        }
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          const msg = j.error || `HTTP ${res.status}`;
          setErr(msg);
          toast.error(`Save failed — ${msg}`);
          return;
        }
        const j = await res.json();
        setP(j.page);
        markSaved(j.page);
        toast.success(`Saved at ${new Date().toLocaleTimeString()}`);
        router.refresh();
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }
  useCmdS(save);

  async function archive() {
    setP({ ...p, status: "archived" });
    setTimeout(save, 0);
  }

  async function destroy() {
    const typed = prompt(`Type "${p.slug}" to permanently delete this page.`);
    if (typed !== p.slug) return;
    const res = await fetch(`/api/admin/pages/${p.id}`, {
      method: "DELETE",
      headers: { "if-match": `W/"${p.version}"` },
    });
    if (!res.ok) { setErr(`Delete failed: ${res.status}`); return; }
    toast.success("Page deleted");
    router.push("/admin/pages");
  }

  return (
    <div className="page-editor">
      <div className="action-bar" style={{ marginBottom: "1rem" }}>
        <span className="dirty-indicator">{dirty ? "● Unsaved changes" : "✓ Saved"}</span>
        <button onClick={() => setShowPreview(!showPreview)} className="btn btn-ghost btn-sm">
          {showPreview ? "Edit" : "Preview"}
        </button>
        <button onClick={save} disabled={busy || !dirty} className="btn btn-primary" title="⌘S">
          {busy ? "Saving…" : dirty ? "Save" : "Saved"}
        </button>
        <button onClick={archive} disabled={busy || p.status === "archived"} className="btn btn-secondary">
          Archive
        </button>
        <button onClick={destroy} className="btn btn-danger">Delete forever…</button>
      </div>

      {err && <p className="error" role="alert">{err}</p>}

      {showPreview ? (
        <article className="page" style={{ background: "var(--color-surface)", padding: "var(--space-6)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
          <h1>{p.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body_md) }} />
        </article>
      ) : (
        <div className="form" style={{ maxWidth: 800 }}>
          <label>
            Title
            <input value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} />
          </label>
          <label>
            Slug
            <input value={p.slug} onChange={(e) => setP({ ...p, slug: e.target.value })} />
            <small className="muted">/{p.slug}</small>
          </label>
          <label>
            Body (markdown)
            <textarea value={p.body_md} onChange={(e) => setP({ ...p, body_md: e.target.value })} rows={20} style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.95rem" }} />
            <small className="muted">Supports: # headings, **bold**, *italic*, `code`, [links](url), - lists.</small>
          </label>
          <label>
            Status
            <select value={p.status} onChange={(e) => setP({ ...p, status: e.target.value as "draft" | "active" | "archived" })}>
              <option value="draft">Draft</option>
              <option value="active">Active (visible)</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            <input type="checkbox" checked={!!p.is_policy} onChange={(e) => setP({ ...p, is_policy: e.target.checked ? 1 : 0 })} />
            {" "}This is a policy page (privacy, terms, refund, shipping, contact)
          </label>
          <details>
            <summary>SEO</summary>
            <label style={{ marginTop: "1rem" }}>
              SEO title
              <input value={p.seo_title ?? ""} onChange={(e) => setP({ ...p, seo_title: e.target.value })} placeholder={p.title} />
            </label>
            <label>
              SEO description
              <textarea value={p.seo_description ?? ""} onChange={(e) => setP({ ...p, seo_description: e.target.value })} rows={3} />
            </label>
          </details>
        </div>
      )}
    </div>
  );
}
