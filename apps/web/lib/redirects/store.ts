/**
 * URL redirects. Edge middleware reads from this and 301s.
 *
 * Important: redirect map is hot-cached in module-scope for ~30s to avoid
 * D1 hits on every request. Mutations bust the cache via revalidatePath.
 */

import { z } from "zod";

export const RedirectInput = z.object({
  from_path: z.string().min(1).max(500).regex(/^\//, "must start with /"),
  to_path:   z.string().min(1).max(2000),
  status_code: z.number().int().refine((n) => n === 301 || n === 302).default(301),
  active: z.boolean().default(true),
});

export type RedirectInputType = z.infer<typeof RedirectInput>;

export type RedirectRow = {
  id: string;
  from_path: string;
  to_path: string;
  status_code: 301 | 302;
  active: number;
  created_at: number;
  updated_at: number;
};

function db(): D1Database | null {
  return (globalThis as unknown as { DB?: D1Database }).DB ?? null;
}

let cache: { at: number; map: Map<string, RedirectRow> } | null = null;
const TTL_MS = 30_000;

export async function getRedirectMap(): Promise<Map<string, RedirectRow>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.map;
  const d = db();
  if (!d) return new Map();
  try {
    const r = await d.prepare(`SELECT * FROM redirects WHERE active = 1`).all();
    const map = new Map<string, RedirectRow>();
    for (const row of (r.results as unknown as RedirectRow[]) ?? []) {
      map.set(row.from_path, row);
    }
    cache = { at: Date.now(), map };
    return map;
  } catch { return new Map(); }
}

export function bustRedirectCache() { cache = null; }

export async function listRedirects(): Promise<RedirectRow[]> {
  const d = db();
  if (!d) return [];
  const r = await d.prepare(`SELECT * FROM redirects ORDER BY from_path`).all();
  return (r.results as unknown as RedirectRow[]) ?? [];
}

export async function createRedirect(input: RedirectInputType): Promise<RedirectRow> {
  const d = db();
  if (!d) throw new Error("db_unbound");
  const id = crypto.randomUUID();
  const now = Date.now();
  try {
    await d.prepare(
      `INSERT INTO redirects (id, from_path, to_path, status_code, active, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?)`
    ).bind(id, input.from_path, input.to_path, input.status_code, input.active ? 1 : 0, now, now).run();
  } catch (e) {
    if (/UNIQUE constraint failed.*\.from_path/i.test((e as Error).message))
      throw new Error(`from_taken:${input.from_path}`);
    throw e;
  }
  bustRedirectCache();
  return (await listRedirects()).find((r) => r.id === id)!;
}

export async function updateRedirect(id: string, patch: Partial<RedirectInputType>): Promise<void> {
  const d = db();
  if (!d) throw new Error("db_unbound");
  const fields: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    fields.push(`${k} = ?`);
    vals.push(k === "active" ? (v ? 1 : 0) : v);
  }
  if (fields.length === 0) return;
  fields.push("updated_at = ?");
  vals.push(Date.now());
  vals.push(id);
  await d.prepare(`UPDATE redirects SET ${fields.join(", ")} WHERE id = ?`).bind(...vals).run();
  bustRedirectCache();
}

export async function deleteRedirect(id: string): Promise<void> {
  const d = db();
  if (!d) throw new Error("db_unbound");
  await d.prepare(`DELETE FROM redirects WHERE id = ?`).bind(id).run();
  bustRedirectCache();
}
