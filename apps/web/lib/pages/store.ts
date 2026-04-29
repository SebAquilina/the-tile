/**
 * Pages store. D1-backed CRUD with version-based optimistic concurrency
 * (ref 19 § Class 5). Body is markdown; HTML cache regenerated on save.
 */

import { z } from "zod";

const RESERVED_SLUGS = new Set([
  "admin","api","login","logout","static","_next","feed","rss","robots","sitemap",
  "well-known","favicon","new","collections","products","contact",
]);
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export const Slug = z
  .string()
  .min(1).max(64)
  .regex(SLUG_RE, "lowercase alphanumeric with internal dashes")
  .refine((s) => !RESERVED_SLUGS.has(s), "slug is reserved");

export const PageInput = z.object({
  slug: Slug,
  title: z.string().min(1).max(200),
  body_md: z.string().max(100_000),
  seo_title: z.string().max(200).optional(),
  seo_description: z.string().max(400).optional(),
  template: z.string().default("default"),
  status: z.enum(["draft","active","archived"]).default("draft"),
  is_policy: z.boolean().default(false),
  position: z.number().int().nonnegative().default(0),
});

export type PageInputType = z.infer<typeof PageInput>;

export type PageRow = {
  id: string;
  slug: string;
  title: string;
  body_md: string;
  body_html: string | null;
  seo_title: string | null;
  seo_description: string | null;
  template: string;
  status: "draft" | "active" | "archived";
  is_policy: number;
  position: number;
  version: number;
  published_at: number | null;
  created_at: number;
  updated_at: number;
};

export class VersionConflictError extends Error {
  constructor(public readonly currentVersion: number) {
    super(`version conflict (current=${currentVersion})`);
    this.name = "VersionConflictError";
  }
}

function db(): D1Database | null {
  return (process.env as unknown as { DB?: D1Database }).DB ?? null;
}

/** Tiny markdown → HTML renderer. Headings, paragraphs, lists, links, bold/italic, code. */
export function renderMarkdown(md: string): string {
  let html = md
    // escape HTML first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Headings
  html = html.replace(/^###### (.+)$/gm, "<h6>$1</h6>")
             .replace(/^##### (.+)$/gm, "<h5>$1</h5>")
             .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
             .replace(/^### (.+)$/gm, "<h3>$1</h3>")
             .replace(/^## (.+)$/gm, "<h2>$1</h2>")
             .replace(/^# (.+)$/gm, "<h1>$1</h1>");
  // Bold/italic/inline code
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
             .replace(/\*([^*]+)\*/g, "<em>$1</em>")
             .replace(/`([^`]+)`/g, "<code>$1</code>");
  // Links: [text](href)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Unordered lists (very permissive): contiguous lines starting with "- "
  html = html.replace(/(^|\n)((?:- .+(?:\n|$))+)/g, (_m, lead, block) => {
    const items = block.trim().split(/\n/).map((l: string) => `<li>${l.replace(/^- /, "")}</li>`).join("");
    return `${lead}<ul>${items}</ul>`;
  });
  // Paragraphs: blank-line separated chunks not already in a tag
  html = html.split(/\n{2,}/).map((chunk) => {
    const t = chunk.trim();
    if (!t) return "";
    if (/^<(h\d|ul|ol|pre|blockquote|p|div|table)[\s>]/.test(t)) return t;
    return `<p>${t.replace(/\n/g, "<br />")}</p>`;
  }).join("\n");
  return html;
}

export async function listPages(opts?: { status?: "active" | "all" }): Promise<PageRow[]> {
  const status = opts?.status ?? "all";
  const d = db();
  if (!d) return [];
  const sql = status === "all"
    ? `SELECT * FROM pages ORDER BY position, title`
    : `SELECT * FROM pages WHERE status = 'active' ORDER BY position, title`;
  const r = await d.prepare(sql).all();
  return (r.results as unknown as PageRow[]) ?? [];
}

export async function getPage(id: string): Promise<PageRow | null> {
  const d = db();
  if (!d) return null;
  const r = await d.prepare(`SELECT * FROM pages WHERE id = ?`).bind(id).first();
  return (r as unknown as PageRow) ?? null;
}

export async function getPageBySlug(slug: string): Promise<PageRow | null> {
  const d = db();
  if (!d) return null;
  const r = await d.prepare(`SELECT * FROM pages WHERE slug = ?`).bind(slug).first();
  return (r as unknown as PageRow) ?? null;
}

export async function createPage(input: PageInputType): Promise<PageRow> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const html = renderMarkdown(input.body_md);
  const d = db();
  if (!d) throw new Error("db_unbound");
  try {
    await d.prepare(
      `INSERT INTO pages (
         id, slug, title, body_md, body_html, seo_title, seo_description,
         template, status, is_policy, position, version, published_at,
         created_at, updated_at
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      id, input.slug, input.title, input.body_md, html,
      input.seo_title ?? null, input.seo_description ?? null,
      input.template, input.status, input.is_policy ? 1 : 0,
      input.position, 0,
      input.status === "active" ? now : null,
      now, now
    ).run();
  } catch (e) {
    if (/UNIQUE constraint failed.*\.slug/i.test((e as Error).message)) {
      throw new Error(`slug_taken:${input.slug}`);
    }
    throw e;
  }
  return (await getPage(id))!;
}

export async function updatePage(
  id: string,
  patch: Partial<PageInputType>,
  expectedVersion: number
): Promise<PageRow> {
  const cur = await getPage(id);
  if (!cur) throw new Error("not_found");
  if (cur.version !== expectedVersion) throw new VersionConflictError(cur.version);
  const merged = {
    ...cur,
    ...patch,
    is_policy: patch.is_policy === undefined ? cur.is_policy : (patch.is_policy ? 1 : 0),
  };
  const html = patch.body_md !== undefined ? renderMarkdown(patch.body_md) : cur.body_html;
  const now = Date.now();
  const published_at =
    cur.status !== "active" && merged.status === "active" ? now : cur.published_at;
  const d = db()!;
  const r = await d.prepare(
    `UPDATE pages SET
       slug = ?, title = ?, body_md = ?, body_html = ?, seo_title = ?,
       seo_description = ?, template = ?, status = ?, is_policy = ?,
       position = ?, version = ?, published_at = ?, updated_at = ?
     WHERE id = ? AND version = ?`
  ).bind(
    merged.slug, merged.title, merged.body_md, html,
    merged.seo_title ?? null, merged.seo_description ?? null,
    merged.template, merged.status, merged.is_policy,
    merged.position, cur.version + 1, published_at, now,
    id, expectedVersion
  ).run();
  if (r.meta.changes === 0) {
    const fresh = await getPage(id);
    throw new VersionConflictError(fresh?.version ?? -1);
  }
  return (await getPage(id))!;
}

export async function deletePage(id: string, expectedVersion: number): Promise<void> {
  const cur = await getPage(id);
  if (!cur) throw new Error("not_found");
  if (cur.version !== expectedVersion) throw new VersionConflictError(cur.version);
  const d = db()!;
  const r = await d.prepare(`DELETE FROM pages WHERE id = ? AND version = ?`)
    .bind(id, expectedVersion).run();
  if (r.meta.changes === 0) throw new VersionConflictError(-1);
}
