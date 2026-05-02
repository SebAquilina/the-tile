"use client";

/**
 * Page editor — single component that drives both /admin/pages/new and
 * /admin/pages/[id]. Two-pane layout on desktop (form left, live markdown
 * preview right); on mobile the panes collapse into a tabbed view.
 *
 * Concurrency: PATCH sends If-Match: W/"<version>". 412 surfaces a
 * "version conflict" toast and a Reload prompt — operator decides
 * whether to clobber by re-loading and re-saving.
 */

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  Save,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, useToast } from "@/components/ui";
import { useUnsavedChanges, useCmdS } from "@/lib/use-unsaved-changes";
import { renderMarkdown } from "@/lib/pages/markdown-client";
import type { PageRow } from "@/lib/pages/store";

type Mode = "create" | "edit";

type Draft = {
  slug: string;
  title: string;
  body_md: string;
  seo_title: string;
  seo_description: string;
  template: string;
  status: "draft" | "active" | "archived";
  is_policy: boolean;
  position: number;
};

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const TEMPLATES = ["default"] as const;
const SEO_DESC_MAX = 200;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function fromRow(p: PageRow): Draft {
  return {
    slug: p.slug,
    title: p.title,
    body_md: p.body_md,
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    template: p.template ?? "default",
    status: p.status,
    is_policy: !!p.is_policy,
    position: p.position ?? 0,
  };
}

function blank(): Draft {
  return {
    slug: "",
    title: "",
    body_md: "# New page\n\nWrite content here.\n",
    seo_title: "",
    seo_description: "",
    template: "default",
    status: "draft",
    is_policy: false,
    position: 0,
  };
}

interface Props {
  /** Existing row, or null when creating. */
  initial: PageRow | null;
}

export function PageEditor({ initial }: Props) {
  const mode: Mode = initial ? "edit" : "create";
  const router = useRouter();
  const toast = useToast();
  const [busy, startTx] = useTransition();
  const [pane, setPane] = useState<"edit" | "preview">("edit");
  const [seoOpen, setSeoOpen] = useState(true);
  const [advOpen, setAdvOpen] = useState(false);

  const [page, setPage] = useState<PageRow | null>(initial);

  const baseline = useMemo(
    () => (initial ? fromRow(initial) : blank()),
    [initial],
  );
  const [draft, setDraft] = useState<Draft>(baseline);

  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const [previewHtml, setPreviewHtml] = useState(() => renderMarkdown(baseline.body_md));
  useEffect(() => {
    const t = setTimeout(() => setPreviewHtml(renderMarkdown(draft.body_md)), 300);
    return () => clearTimeout(t);
  }, [draft.body_md]);

  const { dirty, markSaved } = useUnsavedChanges(baseline, draft);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function onTitle(v: string) {
    setDraft((d) => {
      const next = { ...d, title: v };
      if (!slugTouched && mode === "create") next.slug = slugify(v);
      return next;
    });
  }

  function validate(d: Draft): string | null {
    if (!d.title.trim()) return "Title is required.";
    if (!SLUG_RE.test(d.slug)) {
      return "Slug must be lowercase letters, digits and dashes (no leading or trailing dash).";
    }
    if (d.seo_description.length > SEO_DESC_MAX) {
      return `SEO description is ${d.seo_description.length}/${SEO_DESC_MAX} chars.`;
    }
    return null;
  }

  async function performCreate(d: Draft): Promise<PageRow | null> {
    const res = await fetch("/api/admin/pages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slug: d.slug,
        title: d.title,
        body_md: d.body_md,
        seo_title: d.seo_title || undefined,
        seo_description: d.seo_description || undefined,
        template: d.template,
        status: d.status,
        is_policy: d.is_policy,
        position: d.position,
      }),
    });
    if (res.status === 409) {
      toast.error(`Slug "${d.slug}" is already in use.`);
      return null;
    }
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        errors?: { message: string }[];
      };
      toast.error(`Create failed — ${j.errors?.[0]?.message ?? j.error ?? `HTTP ${res.status}`}`);
      return null;
    }
    const j = (await res.json()) as { page: PageRow };
    return j.page;
  }

  async function performUpdate(p: PageRow, d: Draft): Promise<PageRow | null> {
    const res = await fetch(`/api/admin/pages/${p.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "if-match": `W/"${p.version}"`,
      },
      body: JSON.stringify({
        slug: d.slug,
        title: d.title,
        body_md: d.body_md,
        seo_title: d.seo_title || undefined,
        seo_description: d.seo_description || undefined,
        template: d.template,
        status: d.status,
        is_policy: d.is_policy,
        position: d.position,
      }),
    });
    if (res.status === 409) {
      toast.error(`Slug "${d.slug}" is already in use.`);
      return null;
    }
    if (res.status === 412) {
      const j = (await res.json().catch(() => ({}))) as { currentVersion?: number };
      toast.error(
        `Version conflict — this page was edited elsewhere (now v${j.currentVersion ?? "?"}). Reload to see the latest.`,
        { duration: 8000 },
      );
      return null;
    }
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        errors?: { message: string }[];
      };
      toast.error(`Save failed — ${j.errors?.[0]?.message ?? j.error ?? `HTTP ${res.status}`}`);
      return null;
    }
    const j = (await res.json()) as { page: PageRow };
    return j.page;
  }

  function save({ thenView = false }: { thenView?: boolean } = {}) {
    const err = validate(draft);
    if (err) {
      toast.error(err);
      return;
    }
    startTx(async () => {
      try {
        if (mode === "create") {
          const created = await performCreate(draft);
          if (!created) return;
          setPage(created);
          markSaved(fromRow(created));
          toast.success("Page created.");
          if (thenView && created.status === "active") {
            window.open(`/${created.slug}`, "_blank", "noreferrer");
          }
          router.replace(`/admin/pages/${created.id}`);
          router.refresh();
        } else {
          if (!page) return;
          const updated = await performUpdate(page, draft);
          if (!updated) return;
          setPage(updated);
          markSaved(fromRow(updated));
          toast.success(`Saved at ${new Date().toLocaleTimeString()}.`);
          if (thenView && updated.status === "active") {
            window.open(`/${updated.slug}`, "_blank", "noreferrer");
          }
          router.refresh();
        }
      } catch (e) {
        toast.error(`Save failed — ${(e as Error).message}`);
      }
    });
  }
  useCmdS(() => save());

  function destroy() {
    if (!page) return;
    const typed = window.prompt(
      `Type "${page.slug}" to permanently delete this page.`,
    );
    if (typed !== page.slug) return;
    startTx(async () => {
      const res = await fetch(`/api/admin/pages/${page.id}`, {
        method: "DELETE",
        headers: { "if-match": `W/"${page.version}"` },
      });
      if (res.status === 412) {
        toast.error("Edited elsewhere — reload to delete the latest version.");
        return;
      }
      if (!res.ok) {
        toast.error(`Delete failed — HTTP ${res.status}.`);
        return;
      }
      toast.success("Page deleted.");
      router.push("/admin/pages");
    });
  }

  const slugInvalid = draft.slug.length > 0 && !SLUG_RE.test(draft.slug);

  const stickyTop: CSSProperties = { top: "64px" };

  return (
    <div className="space-y-space-5">
      {/* Top bar */}
      <div
        className="sticky z-20 -mx-space-5 flex flex-wrap items-center justify-between gap-space-3 border-b border-line bg-canvas/95 px-space-5 py-space-3 backdrop-blur md:-mx-space-7 md:px-space-7"
        style={stickyTop}
      >
        <div className="flex flex-wrap items-center gap-space-3 text-sm">
          <Link
            href="/admin/pages"
            className="inline-flex items-center gap-space-2 text-ink-muted hover:text-ink"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Pages
          </Link>
          <span aria-hidden="true" className="text-ink-subtle">/</span>
          <code className="font-mono text-xs text-ink-muted">
            /{draft.slug || "untitled"}
          </code>
          <span
            className={cn(
              "inline-flex items-center rounded-sm border px-space-2 py-px text-xs uppercase tracking-wider",
              dirty
                ? "bg-canvas text-umber-strong border-umber/30"
                : "bg-canvas text-ink-subtle border-line",
            )}
            aria-live="polite"
          >
            {dirty ? "Unsaved" : mode === "create" ? "New" : "Saved"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-space-2">
          {/* Mobile pane toggle */}
          <div
            role="tablist"
            aria-label="Editor view"
            className="inline-flex rounded-md border border-line bg-surface p-px text-xs md:hidden"
          >
            <button
              role="tab"
              type="button"
              aria-selected={pane === "edit"}
              onClick={() => setPane("edit")}
              className={cn(
                "inline-flex items-center gap-space-1 rounded-sm px-space-3 py-space-2",
                pane === "edit" ? "bg-canvas text-ink" : "text-ink-muted",
              )}
            >
              <FileText aria-hidden="true" className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={pane === "preview"}
              onClick={() => setPane("preview")}
              className={cn(
                "inline-flex items-center gap-space-1 rounded-sm px-space-3 py-space-2",
                pane === "preview" ? "bg-canvas text-ink" : "text-ink-muted",
              )}
            >
              <Eye aria-hidden="true" className="h-3.5 w-3.5" />
              Preview
            </button>
          </div>
          {page && page.status === "active" ? (
            <a
              href={`/${page.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-space-2 rounded-md border border-line px-space-3 py-space-2 text-sm text-ink-muted hover:border-ink-subtle hover:text-ink"
            >
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              View on site
            </a>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => save({ thenView: true })}
            disabled={busy || (!dirty && mode === "edit")}
            title="Save and open the public page"
          >
            Save & view
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => save()}
            disabled={busy || (!dirty && mode === "edit")}
            title="⌘S"
            leadingIcon={<Save aria-hidden="true" className="h-4 w-4" />}
          >
            {busy ? "Saving…" : mode === "create" ? "Create page" : dirty ? "Save" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Two-pane layout */}
      <div className="grid gap-space-5 md:grid-cols-2 md:items-start">
        {/* Left: form */}
        <div
          className={cn(
            "space-y-space-5",
            "md:block",
            pane === "edit" ? "block" : "hidden",
          )}
        >
          <div className="space-y-space-2">
            <label htmlFor="page-title" className="text-sm font-medium text-ink">
              Title <span aria-hidden="true" className="ml-1 text-error">*</span>
            </label>
            <input
              id="page-title"
              type="text"
              value={draft.title}
              maxLength={200}
              onChange={(e) => onTitle(e.target.value)}
              placeholder="About the showroom"
              className="h-11 w-full rounded-md border border-line bg-surface px-space-4 text-base text-ink placeholder:text-ink-subtle focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>

          <div className="space-y-space-2">
            <label htmlFor="page-slug" className="text-sm font-medium text-ink">
              Slug <span aria-hidden="true" className="ml-1 text-error">*</span>
            </label>
            <input
              id="page-slug"
              type="text"
              value={draft.slug}
              maxLength={64}
              onChange={(e) => {
                set("slug", e.target.value);
                setSlugTouched(true);
              }}
              placeholder="about-the-showroom"
              aria-invalid={slugInvalid || undefined}
              className={cn(
                "h-11 w-full rounded-md border bg-surface px-space-4 font-mono text-sm text-ink placeholder:text-ink-subtle",
                "focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring",
                slugInvalid ? "border-error" : "border-line",
              )}
            />
            <p className="text-xs text-ink-subtle">
              Public URL: <code className="font-mono">/{draft.slug || "your-slug"}</code>
            </p>
            {slugInvalid ? (
              <p role="alert" className="text-xs text-error">
                Lowercase letters, digits, and internal dashes only.
              </p>
            ) : null}
          </div>

          <div className="space-y-space-2">
            <label htmlFor="page-status" className="text-sm font-medium text-ink">
              Status
            </label>
            <select
              id="page-status"
              value={draft.status}
              onChange={(e) => set("status", e.target.value as Draft["status"])}
              className="h-11 w-full rounded-md border border-line bg-surface px-space-3 text-sm text-ink focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              <option value="draft">Draft (hidden from the public site)</option>
              <option value="active">Active (visible at /{draft.slug || "slug"})</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="space-y-space-2">
            <label htmlFor="page-body" className="text-sm font-medium text-ink">
              Body (markdown)
            </label>
            <textarea
              id="page-body"
              value={draft.body_md}
              onChange={(e) => set("body_md", e.target.value)}
              rows={20}
              spellCheck
              className="block w-full rounded-md border border-line bg-surface px-space-4 py-space-3 font-mono text-sm leading-6 text-ink placeholder:text-ink-subtle focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring"
              style={{ minHeight: 400, resize: "vertical" }}
            />
            <p className="text-xs text-ink-subtle">
              Supports <code className="font-mono">#</code> headings,
              <code className="font-mono"> **bold**</code>,
              <code className="font-mono"> *italic*</code>,
              <code className="font-mono"> `code`</code>,
              <code className="font-mono"> [links](url)</code>, and{" "}
              <code className="font-mono">- lists</code>. Press ⌘S / Ctrl+S to save.
            </p>
          </div>

          <label className="flex items-start gap-space-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={draft.is_policy}
              onChange={(e) => set("is_policy", e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="font-medium">Policy page</span>
              <span className="block text-xs text-ink-muted">
                Privacy / terms / cookies / refund. Surfaced in the policies block of the footer.
              </span>
            </span>
          </label>

          {/* SEO */}
          <section className="rounded-md border border-line bg-surface">
            <button
              type="button"
              onClick={() => setSeoOpen((v) => !v)}
              className="flex w-full items-center justify-between px-space-4 py-space-3 text-left text-sm font-medium text-ink"
              aria-expanded={seoOpen}
            >
              <span>SEO</span>
              {seoOpen ? (
                <ChevronDown aria-hidden="true" className="h-4 w-4 text-ink-subtle" />
              ) : (
                <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-subtle" />
              )}
            </button>
            {seoOpen ? (
              <div className="space-y-space-4 border-t border-line px-space-4 py-space-4">
                <div className="space-y-space-2">
                  <label htmlFor="seo-title" className="text-sm font-medium text-ink">
                    SEO title <span className="font-normal text-ink-subtle">(optional)</span>
                  </label>
                  <input
                    id="seo-title"
                    type="text"
                    value={draft.seo_title}
                    maxLength={200}
                    onChange={(e) => set("seo_title", e.target.value)}
                    placeholder={draft.title || "Falls back to page title"}
                    className="h-11 w-full rounded-md border border-line bg-canvas px-space-4 text-sm text-ink placeholder:text-ink-subtle focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  />
                </div>
                <div className="space-y-space-2">
                  <label htmlFor="seo-desc" className="flex items-center justify-between text-sm font-medium text-ink">
                    <span>SEO description <span className="font-normal text-ink-subtle">(optional)</span></span>
                    <span
                      className={cn(
                        "text-xs",
                        draft.seo_description.length > SEO_DESC_MAX
                          ? "text-error"
                          : draft.seo_description.length > 160
                            ? "text-umber-strong"
                            : "text-ink-subtle",
                      )}
                    >
                      {draft.seo_description.length}/{SEO_DESC_MAX}
                    </span>
                  </label>
                  <textarea
                    id="seo-desc"
                    value={draft.seo_description}
                    rows={3}
                    onChange={(e) => set("seo_description", e.target.value)}
                    placeholder="One or two sentences for search results."
                    className="block w-full rounded-md border border-line bg-canvas px-space-4 py-space-3 text-sm text-ink placeholder:text-ink-subtle focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  />
                </div>
              </div>
            ) : null}
          </section>

          {/* Advanced */}
          <section className="rounded-md border border-line bg-surface">
            <button
              type="button"
              onClick={() => setAdvOpen((v) => !v)}
              className="flex w-full items-center justify-between px-space-4 py-space-3 text-left text-sm font-medium text-ink"
              aria-expanded={advOpen}
            >
              <span>Advanced</span>
              {advOpen ? (
                <ChevronDown aria-hidden="true" className="h-4 w-4 text-ink-subtle" />
              ) : (
                <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-subtle" />
              )}
            </button>
            {advOpen ? (
              <div className="space-y-space-4 border-t border-line px-space-4 py-space-4">
                <div className="grid gap-space-4 sm:grid-cols-2">
                  <div className="space-y-space-2">
                    <label htmlFor="page-template" className="text-sm font-medium text-ink">
                      Template
                    </label>
                    <select
                      id="page-template"
                      value={draft.template}
                      onChange={(e) => set("template", e.target.value)}
                      className="h-11 w-full rounded-md border border-line bg-canvas px-space-3 text-sm text-ink focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring"
                    >
                      {TEMPLATES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-space-2">
                    <label htmlFor="page-position" className="text-sm font-medium text-ink">
                      Position
                    </label>
                    <input
                      id="page-position"
                      type="number"
                      min={0}
                      value={draft.position}
                      onChange={(e) =>
                        set("position", Math.max(0, Number(e.target.value) || 0))
                      }
                      className="h-11 w-full rounded-md border border-line bg-canvas px-space-4 text-sm text-ink focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring"
                    />
                    <p className="text-xs text-ink-subtle">
                      Lower numbers sort first.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          {mode === "edit" && page ? (
            <div className="flex items-center justify-between border-t border-line pt-space-4">
              <p className="text-xs text-ink-subtle">
                Version {page.version} · last saved{" "}
                {new Date(page.updated_at).toLocaleString()}
              </p>
              <button
                type="button"
                onClick={destroy}
                disabled={busy}
                className="inline-flex items-center gap-space-2 rounded-md border border-line px-space-3 py-space-2 text-xs text-ink-muted hover:border-red-500/40 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                Delete page…
              </button>
            </div>
          ) : null}
        </div>

        {/* Right: live preview */}
        <aside
          className={cn(
            "md:block",
            pane === "preview" ? "block" : "hidden",
          )}
        >
          <div className="sticky" style={stickyTop}>
            <div className="rounded-md border border-line bg-surface">
              <header className="flex items-center justify-between border-b border-line px-space-4 py-space-3 text-xs uppercase tracking-wider text-ink-subtle">
                <span>Live preview</span>
                <span aria-hidden="true">/{draft.slug || "your-slug"}</span>
              </header>
              <article
                className="page page--default px-space-5 py-space-6"
                style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}
              >
                <header className="page-header mb-space-5">
                  <h1 className="font-display text-3xl text-ink">
                    {draft.title || "Untitled"}
                  </h1>
                </header>
                <div
                  className="page-body journal-prose"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </article>
            </div>
            <p className="mt-space-2 text-xs text-ink-subtle">
              The preview uses the same renderer as the public page.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
