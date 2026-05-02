"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Edit3,
  Eye,
  EyeOff,
  Filter as FilterIcon,
  Search,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Brand, Category, Product } from "@/lib/schemas";
import { applyDraft, useAdminDraft } from "@/lib/admin-draft";

export interface ProductAdminListProps {
  products: Product[];
  effects: Category[];
  brands: Brand[];
}

type StockFilter = "all" | "in-stock" | "out-of-stock" | "hidden";

export function ProductAdminList({
  products,
  effects,
  brands,
}: ProductAdminListProps) {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") ?? "all") as StockFilter;

  const [query, setQuery] = useState("");
  const [effectFilter, setEffectFilter] = useState<string>("");
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<StockFilter>(
    ["in-stock", "out-of-stock", "hidden"].includes(initialFilter)
      ? initialFilter
      : "all",
  );

  const { draft, pendingCount, patchProduct, discardProduct } = useAdminDraft();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .map((p) => applyDraft(p, draft))
      .filter((p) => {
        if (effectFilter && p.effect !== effectFilter) return false;
        if (brandFilter && p.brand !== brandFilter) return false;
        const inStock = p.inStock ?? true;
        const visible = p.showInCatalog ?? true;
        if (stockFilter === "in-stock" && !inStock) return false;
        if (stockFilter === "out-of-stock" && inStock) return false;
        if (stockFilter === "hidden" && visible) return false;
        if (q) {
          const hay = `${p.name} ${p.id} ${p.brand ?? ""} ${p.effect}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [products, draft, query, effectFilter, brandFilter, stockFilter]);

  function toggleStock(product: Product) {
    const effective = applyDraft(product, draft);
    const next = !(effective.inStock ?? true);
    // If the next value matches the seed value, clear the override instead.
    if (next === (product.inStock ?? true)) {
      patchProduct(product.id, { inStock: undefined });
    } else {
      patchProduct(product.id, { inStock: next });
    }
  }

  function toggleVisible(product: Product) {
    const effective = applyDraft(product, draft);
    const next = !(effective.showInCatalog ?? true);
    if (next === (product.showInCatalog ?? true)) {
      patchProduct(product.id, { showInCatalog: undefined });
    } else {
      patchProduct(product.id, { showInCatalog: next });
    }
  }

  return (
    <div className="space-y-space-6">
      <header className="flex flex-wrap items-baseline justify-between gap-space-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Tiles</h1>
          <p className="mt-space-2 text-sm text-ink-muted">
            {filtered.length} shown · {products.length} in catalogue ·{" "}
            {pendingCount > 0 ? (
              <span className="text-umber">
                {pendingCount} staged change{pendingCount === 1 ? "" : "s"}
              </span>
            ) : (
              "no pending changes"
            )}
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="sticky top-[64px] z-20 -mx-space-5 bg-canvas px-space-5 py-space-3 md:-mx-space-7 md:px-space-7">
        <div className="flex flex-wrap gap-space-3">
          <label className="relative flex flex-1 items-center min-w-[240px]">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-space-3 h-4 w-4 text-ink-subtle"
            />
            <input
              type="search"
              placeholder="Search by name, id, brand…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "h-11 w-full rounded-md border border-line bg-surface pl-space-7 pr-space-3 text-sm",
                "placeholder:text-ink-subtle",
                "focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring",
              )}
            />
          </label>
          <select
            value={effectFilter}
            onChange={(e) => setEffectFilter(e.target.value)}
            aria-label="Filter by effect"
            className="h-11 rounded-md border border-line bg-surface px-space-3 text-sm text-ink focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring"
          >
            <option value="">All effects</option>
            {effects.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            aria-label="Filter by brand"
            className="h-11 rounded-md border border-line bg-surface px-space-3 text-sm text-ink focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring"
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          <div className="flex items-stretch rounded-md border border-line bg-surface">
            {(["all", "in-stock", "out-of-stock", "hidden"] as StockFilter[]).map(
              (k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStockFilter(k)}
                  className={cn(
                    "px-space-4 text-xs uppercase tracking-wider",
                    "transition-colors duration-fast ease-out",
                    "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-[-2px]",
                    stockFilter === k
                      ? "bg-umber text-surface"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {k === "all"
                    ? "All"
                    : k === "in-stock"
                      ? "Stock"
                      : k === "out-of-stock"
                        ? "OOS"
                        : "Hidden"}
                </button>
              ),
            )}
          </div>
          {(query || effectFilter || brandFilter || stockFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setEffectFilter("");
                setBrandFilter("");
                setStockFilter("all");
              }}
              className="inline-flex items-center gap-space-2 text-xs text-ink-muted hover:text-ink"
            >
              <FilterIcon aria-hidden="true" className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Grid of product cards */}
      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-line bg-surface p-space-7 text-center text-ink-muted">
          No tiles match these filters.
        </div>
      ) : (
        <ul className="grid gap-space-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const seed = products.find((x) => x.id === p.id)!;
            const isStaged = Boolean(draft.products[p.id]);
            const inStock = p.inStock ?? true;
            const visible = p.showInCatalog ?? true;
            const hero = p.images?.[0];
            return (
              <li
                key={p.id}
                className={cn(
                  "overflow-hidden rounded-md border bg-surface transition-colors duration-fast ease-out",
                  isStaged
                    ? "border-umber shadow-md"
                    : "border-line hover:border-ink-subtle",
                )}
              >
                <div className="relative aspect-[4/3] bg-surface-muted">
                  {hero?.src ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={hero.src}
                      alt={hero.alt ?? p.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-x-space-3 top-space-3 flex items-center justify-between gap-space-2">
                    {isStaged ? (
                      <span className="rounded-full bg-umber px-space-3 py-space-1 text-xs font-medium text-surface">
                        Staged
                      </span>
                    ) : (
                      <span />
                    )}
                    {!visible ? (
                      <span className="rounded-full bg-ink/80 px-space-3 py-space-1 text-xs font-medium text-surface">
                        Hidden
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-space-4 p-space-5">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-ink-subtle">
                      {p.brand ?? "Uncredited"} · {p.effect}
                    </p>
                    <h2 className="mt-space-2 font-display text-xl text-ink">
                      {p.name}
                    </h2>
                    <p className="mt-space-2 line-clamp-2 text-sm text-ink-muted">
                      {p.summary}
                    </p>
                  </div>

                  {/* Inline toggles */}
                  <div className="flex flex-wrap items-center justify-between gap-space-3">
                    <div className="flex gap-space-2">
                      <Toggle
                        active={inStock}
                        activeLabel="In stock"
                        inactiveLabel="Out of stock"
                        ActiveIcon={CheckCircle2}
                        InactiveIcon={Circle}
                        onClick={() => toggleStock(seed)}
                      />
                      <Toggle
                        active={visible}
                        activeLabel="Visible"
                        inactiveLabel="Hidden"
                        ActiveIcon={Eye}
                        InactiveIcon={EyeOff}
                        onClick={() => toggleVisible(seed)}
                      />
                    </div>
                    <div className="flex items-center gap-space-2">
                      {isStaged ? (
                        <button
                          type="button"
                          onClick={() => discardProduct(p.id)}
                          title="Discard this tile's changes"
                          className="inline-flex items-center gap-space-1 text-xs text-ink-muted hover:text-ink"
                        >
                          <Undo2 aria-hidden="true" className="h-3 w-3" />
                          Discard
                        </button>
                      ) : null}
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="inline-flex items-center gap-space-1 rounded-md border border-line px-space-3 py-space-2 text-xs text-ink hover:border-umber hover:text-umber"
                      >
                        <Edit3 aria-hidden="true" className="h-3 w-3" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Toggle({
  active,
  activeLabel,
  inactiveLabel,
  ActiveIcon,
  InactiveIcon,
  onClick,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  ActiveIcon: typeof CheckCircle2;
  InactiveIcon: typeof Circle;
  onClick: () => void;
}) {
  const Icon = active ? ActiveIcon : InactiveIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-space-2 rounded-md border px-space-3 py-space-2 text-xs transition-colors duration-fast ease-out",
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
        active
          ? "border-success/50 bg-success/10 text-success"
          : "border-warning/50 bg-warning/10 text-warning",
      )}
    >
      <Icon aria-hidden="true" className="h-3 w-3" />
      {active ? activeLabel : inactiveLabel}
    </button>
  );
}
