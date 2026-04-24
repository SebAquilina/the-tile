import type { Category, Product } from "@/lib/schemas";
import { FilterBar } from "./FilterBar";
import { TileGridStatic } from "./TileGridStatic";

export interface CollectionsExplorerServerProps {
  products: Product[];
  effectCategories: Category[];
  /** The URL search params from the page (Next.js App Router page prop). */
  searchParams?: Record<string, string | string[] | undefined>;
  /** When set (effect-landing page), filter is locked to this effect. */
  lockedEffect?: string;
  /** Text shown above the grid, e.g. "Showing 12 of 60". */
  countLabelPrefix?: string;
}

function firstParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * Server component: applies initial filter from URL searchParams, renders
 * FilterBar (client) + TileGridStatic (server) + count line. This is what
 * ships as the initial HTML for /collections and /collections/[effect],
 * so crawlers and no-JS clients see real tile cards and links.
 *
 * The client `CollectionsExplorer` remains available for action-driven
 * dynamic re-filter flows; for the initial page render we prefer this
 * server variant so the grid is visible without hydration.
 */
export function CollectionsExplorerServer({
  products,
  effectCategories,
  searchParams,
  lockedEffect,
  countLabelPrefix = "Showing",
}: CollectionsExplorerServerProps) {
  const params = searchParams ?? {};
  const effect = lockedEffect ?? firstParam(params.effect);
  const usage = firstParam(params.usage);
  const brand = firstParam(params.brand);
  const tag = firstParam(params.tag);

  const filtered = products.filter((p) => {
    if (effect && String(p.effect) !== effect) return false;
    if (usage && !(p.usage ?? []).includes(usage)) return false;
    if (brand && p.brand !== brand) return false;
    if (tag && !(p.tags ?? []).includes(tag)) return false;
    return true;
  });

  const initialParams: Record<string, string> = {};
  if (effect) initialParams.effect = effect;
  if (usage) initialParams.usage = usage;
  if (brand) initialParams.brand = brand;
  if (tag) initialParams.tag = tag;

  return (
    <>
      <FilterBar
        products={products}
        effectCategories={effectCategories}
        lockedEffect={lockedEffect}
        initialParams={initialParams}
      />
      <div className="mx-auto max-w-wide px-space-5 md:px-space-7 py-space-7">
        <p className="mb-space-5 text-sm text-ink-muted">
          {countLabelPrefix} {filtered.length} of {products.length}
        </p>
        <TileGridStatic products={filtered} />
      </div>
    </>
  );
}
