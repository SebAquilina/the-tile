/**
 * Persistent JSON overrides for admin edits.
 *
 * The seed JSON stays the source of truth. Admin-UI edits write to a
 * local override file; `lib/seed.ts` merges the overrides on read so the
 * UI reflects the change without requiring a re-commit to seed.
 *
 * In production on Cloudflare Pages the filesystem is read-only, so
 * overrides will be in-memory only and persist across requests on the same
 * isolate but will not survive deploys. The recommended workflow remains
 * GitHub editing for durable changes; this admin UI is a convenience for
 * intra-day updates (stock flags, temporary visibility).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OVERRIDES_PATH = resolve(here, "..", "data", "overrides.json");

export type ProductOverride = {
  inStock?: boolean;
  showInCatalog?: boolean;
  summary?: string;
  updatedAt?: string;
};

type OverridesShape = {
  products?: Record<string, ProductOverride>;
  leads?: Array<Lead>;
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

const memory: OverridesShape = {};
let loaded = false;
const writable = (() => {
  try {
    // On Cloudflare Pages we can't write the filesystem. Detect by trying
    // to open a tmp path — but the simple proxy is an env flag.
    return process.env.ADMIN_WRITABLE !== "false";
  } catch {
    return false;
  }
})();

function loadIfNeeded(): OverridesShape {
  if (loaded) return memory;
  try {
    if (existsSync(OVERRIDES_PATH)) {
      const raw = JSON.parse(readFileSync(OVERRIDES_PATH, "utf8"));
      Object.assign(memory, raw);
    }
  } catch (err) {
    console.warn("[admin-store] failed to load overrides:", err);
  }
  loaded = true;
  return memory;
}

function persist(): void {
  if (!writable) return;
  try {
    mkdirSync(dirname(OVERRIDES_PATH), { recursive: true });
    writeFileSync(OVERRIDES_PATH, JSON.stringify(memory, null, 2), "utf8");
  } catch (err) {
    console.warn("[admin-store] failed to persist overrides:", err);
  }
}

// --- product overrides ---
export function getProductOverride(id: string): ProductOverride | undefined {
  return loadIfNeeded().products?.[id];
}

export function getAllProductOverrides(): Record<string, ProductOverride> {
  return loadIfNeeded().products ?? {};
}

export function setProductOverride(id: string, patch: ProductOverride): ProductOverride {
  const store = loadIfNeeded();
  const current = store.products?.[id] ?? {};
  const next: ProductOverride = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if (!store.products) store.products = {};
  store.products[id] = next;
  persist();
  return next;
}

// --- leads ---
export function getAllLeads(): Lead[] {
  return loadIfNeeded().leads ?? [];
}

export function addLead(lead: Lead): void {
  const store = loadIfNeeded();
  if (!store.leads) store.leads = [];
  store.leads.unshift(lead);
  // Cap so the JSON doesn't grow forever.
  if (store.leads.length > 500) store.leads.length = 500;
  persist();
}

export function updateLeadStatus(id: string, status: Lead["status"]): void {
  const store = loadIfNeeded();
  const lead = store.leads?.find((l) => l.id === id);
  if (lead) {
    lead.status = status;
    persist();
  }
}
