/**
 * Admin draft store — a session-scoped staging area for edits.
 *
 * Rather than write to a server-side JSON file (which doesn't survive a
 * Cloudflare Pages rebuild), every admin edit lives in sessionStorage in
 * the admin's browser tab. A single "Publish" action then commits the
 * draft to `docs/spec/the-tile/seed/products.seed.json` on GitHub via the
 * admin API, which triggers a real rebuild.
 *
 * Benefits:
 *   - edits are instantly visible in the admin UI (optimistic)
 *   - no stale-cache or read-only-fs surprises
 *   - "Publish" is a single audited commit with a clear message
 *   - drafts can be discarded by closing the tab
 *
 * API (client-side only).
 */
"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "the-tile:admin:draft";

export type ProductImagePatch = {
  src: string;
  alt?: string;
  caption?: string;
  source?: string;
  isPlaceholder?: boolean;
  provenance?: Record<string, unknown>;
};

export type ProductDraftPatch = {
  inStock?: boolean;
  showInCatalog?: boolean;
  summary?: string;
  description?: string;
  bestFor?: string[];
  tags?: string[];
  /**
   * When present, replaces the product's full image array. We use a full
   * replacement (not a per-image patch) because reordering, removing, and
   * adding all share one underlying operation: write the new array.
   */
  images?: ProductImagePatch[];
};

export type AdminDraft = {
  products: Record<string, ProductDraftPatch>;
  updatedAt: string;
};

function readDraft(): AdminDraft {
  if (typeof window === "undefined") return { products: {}, updatedAt: "" };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { products: {}, updatedAt: "" };
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "products" in parsed &&
      typeof (parsed as AdminDraft).products === "object"
    ) {
      return parsed as AdminDraft;
    }
  } catch {
    // fall through
  }
  return { products: {}, updatedAt: "" };
}

function writeDraft(draft: AdminDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // quota / private-mode
  }
  window.dispatchEvent(new CustomEvent("admin-draft:changed"));
}

export function useAdminDraft() {
  const [draft, setDraft] = useState<AdminDraft>({ products: {}, updatedAt: "" });

  useEffect(() => {
    setDraft(readDraft());
    const handler = () => setDraft(readDraft());
    window.addEventListener("admin-draft:changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("admin-draft:changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const patchProduct = useCallback(
    (id: string, patch: ProductDraftPatch) => {
      const current = readDraft();
      const nextPatch: ProductDraftPatch = {
        ...(current.products[id] ?? {}),
        ...patch,
      };
      // Drop keys that got set back to `undefined`.
      for (const k of Object.keys(nextPatch) as (keyof ProductDraftPatch)[]) {
        if (nextPatch[k] === undefined) delete nextPatch[k];
      }
      const products = { ...current.products };
      if (Object.keys(nextPatch).length === 0) {
        delete products[id];
      } else {
        products[id] = nextPatch;
      }
      const next: AdminDraft = {
        products,
        updatedAt: new Date().toISOString(),
      };
      writeDraft(next);
    },
    [],
  );

  const clearDraft = useCallback(() => {
    writeDraft({ products: {}, updatedAt: "" });
  }, []);

  const discardProduct = useCallback((id: string) => {
    const current = readDraft();
    const products = { ...current.products };
    delete products[id];
    writeDraft({ products, updatedAt: new Date().toISOString() });
  }, []);

  const pendingCount = Object.keys(draft.products).length;

  return {
    draft,
    pendingCount,
    patchProduct,
    clearDraft,
    discardProduct,
  };
}

/**
 * Merge the draft over a seed-sourced product, returning the effective
 * current-state values the UI should render. This is purely client-side —
 * it does not mutate any server state.
 */
export function applyDraft<T extends { id: string }>(
  product: T,
  draft: AdminDraft,
): T {
  const patch = draft.products[product.id];
  if (!patch) return product;
  return { ...product, ...patch } as T;
}
