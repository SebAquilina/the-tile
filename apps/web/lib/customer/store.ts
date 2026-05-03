import type { D1Database } from "@cloudflare/workers-types";

function db(): D1Database | null {
  const env = process.env as unknown as { DB?: D1Database };
  const g = globalThis as unknown as { DB?: D1Database };
  return env.DB ?? g.DB ?? null;
}
function uuid(): string { return crypto.randomUUID(); }

export interface Tag { id: string; lead_id: string; tag: string; color: string | null; created_at: number; created_by: string | null; }
export interface Note { id: string; lead_id: string; body: string; pinned: number; created_at: number; created_by: string | null; }

export async function listTags(lead_id: string): Promise<Tag[]> {
  const d = db(); if (!d) return [];
  const r = await d.prepare(`SELECT * FROM customer_tags WHERE lead_id = ?1 ORDER BY created_at`).bind(lead_id).all();
  return ((r.results as unknown) as Tag[]) ?? [];
}

export async function addTag(lead_id: string, tag: string, by: string, color?: string): Promise<Tag> {
  const d = db(); if (!d) throw new Error("no_db");
  const cleaned = tag.trim().slice(0, 60);
  if (!cleaned) throw new Error("empty_tag");
  const id = uuid();
  const now = Date.now();
  await d.prepare(
    `INSERT INTO customer_tags (id, lead_id, tag, color, created_at, created_by)
     VALUES (?1,?2,?3,?4,?5,?6) ON CONFLICT(lead_id, tag) DO NOTHING`
  ).bind(id, lead_id, cleaned, color ?? null, now, by).run();
  return { id, lead_id, tag: cleaned, color: color ?? null, created_at: now, created_by: by };
}

export async function removeTag(lead_id: string, tag: string): Promise<void> {
  const d = db(); if (!d) return;
  await d.prepare(`DELETE FROM customer_tags WHERE lead_id = ?1 AND tag = ?2`).bind(lead_id, tag).run();
}

export async function listNotes(lead_id: string): Promise<Note[]> {
  const d = db(); if (!d) return [];
  const r = await d.prepare(
    `SELECT * FROM customer_notes WHERE lead_id = ?1 ORDER BY pinned DESC, created_at DESC`
  ).bind(lead_id).all();
  return ((r.results as unknown) as Note[]) ?? [];
}

export async function addNote(lead_id: string, body: string, by: string, pinned = false): Promise<Note> {
  const d = db(); if (!d) throw new Error("no_db");
  const cleaned = body.trim().slice(0, 4000);
  if (!cleaned) throw new Error("empty_note");
  const id = uuid();
  const now = Date.now();
  await d.prepare(
    `INSERT INTO customer_notes (id, lead_id, body, pinned, created_at, created_by) VALUES (?1,?2,?3,?4,?5,?6)`
  ).bind(id, lead_id, cleaned, pinned ? 1 : 0, now, by).run();
  return { id, lead_id, body: cleaned, pinned: pinned ? 1 : 0, created_at: now, created_by: by };
}

export async function deleteNote(lead_id: string, id: string): Promise<void> {
  const d = db(); if (!d) return;
  await d.prepare(`DELETE FROM customer_notes WHERE id = ?1 AND lead_id = ?2`).bind(id, lead_id).run();
}

export async function togglePin(lead_id: string, id: string): Promise<void> {
  const d = db(); if (!d) return;
  await d.prepare(
    `UPDATE customer_notes SET pinned = CASE pinned WHEN 1 THEN 0 ELSE 1 END WHERE id = ?1 AND lead_id = ?2`
  ).bind(id, lead_id).run();
}

export async function leadClientId(lead_id: string): Promise<string | null> {
  const d = db(); if (!d) return null;
  const r = (await d.prepare(
    `SELECT client_id FROM analytics_sessions WHERE lead_id = ?1 ORDER BY started_at DESC LIMIT 1`
  ).bind(lead_id).first()) as { client_id?: string } | null;
  return r?.client_id ?? null;
}
