/**
 * Persistent JSON overrides for admin edits — edge-runtime-compatible stub.
 *
 * v1 used node:fs/path/url to persist a local overrides.json. Edge runtime
 * (required by CF Pages) cannot use node modules, so this version keeps
 * everything in module-level memory. State persists across requests on the
 * same isolate but does NOT survive cold starts or deploys.
 *
 * For durable changes, the admin's PublishBar commits to GitHub via the
 * /api/admin/publish route; that triggers a rebuild and the new state is
 * baked into the seed JSON.
 *
 * The full DB-backed admin (with draft/published state per record + version
 * history) is specced in docs/spec/the-tile/15-admin-panel-spec.md and is the
 * v2 follow-up build.
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
  leads?: Lead[];
};

const memory: OverridesShape = {};

// --- product overrides ---
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

// --- leads ---
export function getAllLeads(): Lead[] {
  return memory.leads ?? [];
}

export function addLead(lead: Lead): void {
  if (!memory.leads) memory.leads = [];
  memory.leads.unshift(lead);
  if (memory.leads.length > 500) memory.leads.length = 500;
}

export function updateLeadStatus(id: string, status: Lead["status"]): void {
  const lead = memory.leads?.find((l) => l.id === id);
  if (lead) lead.status = status;
}
