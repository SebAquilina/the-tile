/**
 * v1.x admin-store stub kept memory-only for product overrides (those still
 * use the publish-to-git flow). Leads now read from D1 directly — the v1.x
 * memory store lost every lead on cold start.
 *
 * Per ref 19 § Class 9 — leads MUST persist. The /api/contact route inserts
 * to D1; this module reads them back for /admin/leads.
 */

export type ProductOverride = {
  inStock?: boolean;
  showInCatalog?: boolean;
  summary?: string;
  updatedAt?: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredContactMethod?: "email" | "phone" | "whatsapp";
  saveListIds?: string[];
  createdAt: string;
  status: "new" | "replied" | "archived";
};

type OverridesShape = {
  products?: Record<string, ProductOverride>;
};

const memory: OverridesShape = {};

// --- product overrides (memory-only, unchanged from v1.x) -----------------

export function getProductOverride(id: string): ProductOverride | undefined {
  return memory.products?.[id];
}
export function getAllProductOverrides(): Record<string, ProductOverride> {
  return memory.products ?? {};
}
export function setProductOverride(id: string, patch: ProductOverride): ProductOverride {
  const current = memory.products?.[id] ?? {};
  const next: ProductOverride = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if (!memory.products) memory.products = {};
  memory.products[id] = next;
  return next;
}
export function clearProductOverride(id: string): void {
  if (memory.products) delete memory.products[id];
}

// --- leads (D1-backed, v1.9 fix) ------------------------------------------

function db(): D1Database | null {
  return (process.env as unknown as { DB?: D1Database }).DB ?? null;
}

function rowToLead(r: Record<string, unknown>): Lead {
  let saveListIds: string[] | undefined;
  if (typeof r.save_list_ids === "string" && r.save_list_ids) {
    try { saveListIds = JSON.parse(r.save_list_ids as string); } catch { /* ignore */ }
  }
  // Lead status is admin-managed via PATCH; default to "new".
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    phone: r.phone ? String(r.phone) : undefined,
    message: String(r.message),
    preferredContactMethod: (r.preferred_contact_method as Lead["preferredContactMethod"]) ?? undefined,
    saveListIds,
    createdAt: String(r.created_at),
    status: ((r.status as Lead["status"]) ?? "new"),
  };
}

export async function getAllLeads(): Promise<Lead[]> {
  const d = db();
  if (!d) return [];
  try {
    const r = await d
      .prepare(`SELECT * FROM leads ORDER BY created_at DESC LIMIT 500`)
      .all();
    const rows = (r.results as Record<string, unknown>[]) ?? [];
    return rows.map(rowToLead);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[admin-store.getAllLeads] failed:", (e as Error).message);
    return [];
  }
}

export async function getLead(id: string): Promise<Lead | null> {
  const d = db();
  if (!d) return null;
  try {
    const r = await d.prepare(`SELECT * FROM leads WHERE id = ?`).bind(id).first();
    return r ? rowToLead(r as Record<string, unknown>) : null;
  } catch { return null; }
}

export async function updateLeadStatus(id: string, status: Lead["status"]): Promise<void> {
  const d = db();
  if (!d) return;
  try {
    // Add `status` column if the migration hasn't run yet — best-effort.
    await d
      .prepare(`UPDATE leads SET status = ? WHERE id = ?`)
      .bind(status, id)
      .run();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[admin-store.updateLeadStatus] failed:", (e as Error).message);
  }
}

// addLead retained as a no-op for callers that still reference it.
// Real persistence lives in /api/contact/route.ts.
export function addLead(_lead: Lead): void {
  // no-op
}
