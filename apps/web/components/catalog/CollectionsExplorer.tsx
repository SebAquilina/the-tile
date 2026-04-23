"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category, Product } from "@/lib/schemas";
import { FilterBar } from "./FilterBar";
import { TileGrid } from "./TileGrid";

export interface CollectionsExplorerProps {
  products: Product[];
  effectCategories: Category[];
  /** When set (effect-landing page), filter is locked to this effect. */
  lockedEffect?: string;
  /** Text shown above the grid, e.g. "Showing 12 of 60". */
  countLabelPrefix?: string;
}

/**
 * Client wrapper for the collections pages: reads URL params, applies filters,
 * renders FilterBar + TileGrid. The server page hands it the raw list + facet
 * sources, we keep all filtering client-side so URL changes don't trigger a
 * round-trip.
 */
export function CollectionsExplorer({
  products,
  effectCategories,
  lockedEffect,
  countLabelPrefix = "Showing",
}: CollectionsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const effect = lockedEffect ?? searchParams.get("effect") ?? "";
  const usage = searchParams.get("usage") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const tag = searchParams.get("tag") ?? "";

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (effect && String(p.effect) !== effect) return false;
      if (usage && !(p.usage ?? []).includes(usage)) return false;
      if (brand && p.brand !== brand) return false;
      if (tag && !(p.tags ?? []).includes(tag)) return false;
      return true;
    });
  }, [products, effect, usage, brand, tag]);

  const clearFilters = useCallback(() => {
    if (lockedEffect) {
      // Preserve the locked effect by navigating to the same path without params.
      router.push(pathname, { scroll: false });
    } else {
      router.push(pathname, { scroll: false });
    }
  }, [router, pathname, lockedEffect]);

  return (
    <>
      <FilterBar
        products={products}
        effectCategories={effectCategories}
        lockedEffect={lockedEffect}
      />
      <div className="mx-auto max-w-wide px-space-5 md:px-space-7 py-space-7">
        <p className="mb-space-5 text-sm text-ink-muted">
          {countLabelPrefix} {filtered.length} of {products.length}
        </p>
        <TileGrid products={filtered} onClearFilters={clearFilters} />
      </div>
    </>
  );
}
