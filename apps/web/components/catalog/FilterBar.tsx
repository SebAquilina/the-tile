"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Category, Product } from "@/lib/schemas";
import { Select } from "@/components/ui";

export interface FilterBarProps {
  /** The full product set the parent is filtering — used to compute facet counts. */
  products: Product[];
  /** All 9 effect categories — shown even if their count is 0. */
  effectCategories: Category[];
  /** Optional: lock one facet (e.g. on `/collections/[effect]`, effect is fixed). */
  lockedEffect?: string;
  /**
   * Optional: initial filter values for SSR hydration. When the page is a
   * server component, it computes the same filter state and passes it in so
   * the FilterBar's first client render matches the server HTML before
   * `useSearchParams()` is available.
   */
  initialParams?: Partial<Record<FilterKey, string>>;
  /** Optional extra class for the outer container. */
  className?: string;
}

type FilterKey = "effect" | "usage" | "brand" | "tag";
const ALL_KEYS: FilterKey[] = ["effect", "usage", "brand", "tag"];

interface FacetOption {
  value: string;
  label: string;
  count: number;
}

function titleCase(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildFacet(
  values: string[],
  opts?: { forceEntries?: Array<{ value: string; label: string }> },
): FacetOption[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const seen = new Set<string>();
  const out: FacetOption[] = [];
  for (const forced of opts?.forceEntries ?? []) {
    seen.add(forced.value);
    out.push({
      value: forced.value,
      label: forced.label,
      count: counts.get(forced.value) ?? 0,
    });
  }
  for (const [value, count] of Array.from(counts.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    if (seen.has(value)) continue;
    out.push({ value, label: titleCase(value), count });
  }
  return out;
}

export function FilterBar({
  products,
  effectCategories,
  lockedEffect,
  initialParams,
  className,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Prefer `initialParams` on the very first render so the client tree matches
  // the server HTML before `useSearchParams()` populates. Once the Suspense
  // boundary resolves `searchParams` it takes over.
  const hasSearchParams = searchParams.toString().length > 0;
  const current = useMemo<Record<FilterKey, string>>(
    () => ({
      effect:
        lockedEffect ??
        searchParams.get("effect") ??
        (hasSearchParams ? "" : initialParams?.effect ?? ""),
      usage:
        searchParams.get("usage") ??
        (hasSearchParams ? "" : initialParams?.usage ?? ""),
      brand:
        searchParams.get("brand") ??
        (hasSearchParams ? "" : initialParams?.brand ?? ""),
      tag:
        searchParams.get("tag") ??
        (hasSearchParams ? "" : initialParams?.tag ?? ""),
    }),
    [searchParams, lockedEffect, initialParams, hasSearchParams],
  );

  // Facet options from the product set the parent passed in.
  const effectOptions = useMemo<FacetOption[]>(
    () =>
      buildFacet(
        products.map((p) => String(p.effect)),
        {
          forceEntries: effectCategories.map((c) => ({ value: c.id, label: c.name })),
        },
      ),
    [products, effectCategories],
  );

  const usageOptions = useMemo<FacetOption[]>(
    () => buildFacet(products.flatMap((p) => p.usage ?? [])),
    [products],
  );

  const brandOptions = useMemo<FacetOption[]>(() => {
    const names = products
      .map((p) => (typeof p.brand === "string" ? p.brand : null))
      .filter((x): x is string => Boolean(x));
    const counts = new Map<string, number>();
    for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, label: value, count }));
  }, [products]);

  const tagOptions = useMemo<FacetOption[]>(
    () => buildFacet(products.flatMap((p) => p.tags ?? [])),
    [products],
  );

  const pushFilters = useCallback(
    (next: Partial<Record<FilterKey, string>>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const key of ALL_KEYS) {
        if (key === "effect" && lockedEffect) continue;
        if (!(key in next)) continue;
        const value = next[key];
        if (value && value.length > 0) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, lockedEffect],
  );

  // Agent-bus: respond to `catalog:filter` custom events.
  useEffect(() => {
    function onFilter(event: Event) {
      const detail = (event as CustomEvent<Partial<Record<FilterKey, string>>>).detail ?? {};
      const next: Partial<Record<FilterKey, string>> = {};
      for (const key of ALL_KEYS) {
        if (key in detail) {
          const value = detail[key];
          next[key] = typeof value === "string" ? value : "";
        }
      }
      pushFilters(next);
    }
    window.addEventListener("catalog:filter", onFilter as EventListener);
    return () => window.removeEventListener("catalog:filter", onFilter as EventListener);
  }, [pushFilters]);

  const activeEntries = useMemo(
    () =>
      ALL_KEYS.filter((k) => {
        if (k === "effect" && lockedEffect) return false;
        return Boolean(current[k]);
      }).map((k) => ({
        key: k,
        value: current[k],
        label: labelForValue(k, current[k], {
          effectOptions,
          usageOptions,
          brandOptions,
          tagOptions,
        }),
      })),
    [current, lockedEffect, effectOptions, usageOptions, brandOptions, tagOptions],
  );

  const clearAll = useCallback(() => {
    pushFilters({ effect: "", usage: "", brand: "", tag: "" });
  }, [pushFilters]);

  return (
    <div
      className={cn(
        "bg-surface/90 backdrop-blur border-y border-line",
        "md:sticky md:top-[72px] z-20",
        className,
      )}
    >
      <div className="mx-auto max-w-wide px-space-5 md:px-space-7 py-space-4">
        <div className="flex flex-wrap items-end gap-space-4">
          <FacetSelect
            label="Effect"
            value={current.effect}
            options={effectOptions}
            onChange={(v) => pushFilters({ effect: v })}
            disabled={Boolean(lockedEffect)}
            placeholder="All effects"
          />
          <FacetSelect
            label="Usage"
            value={current.usage}
            options={usageOptions}
            onChange={(v) => pushFilters({ usage: v })}
            placeholder="Any usage"
          />
          <FacetSelect
            label="Brand"
            value={current.brand}
            options={brandOptions}
            onChange={(v) => pushFilters({ brand: v })}
            placeholder="All brands"
          />
          <FacetSelect
            label="Tag"
            value={current.tag}
            options={tagOptions}
            onChange={(v) => pushFilters({ tag: v })}
            placeholder="Any tag"
          />
          {activeEntries.length > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className={cn(
                "text-sm text-umber hover:text-umber-strong underline-offset-4 hover:underline",
                "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 rounded-sm",
                "ml-auto",
              )}
            >
              Clear all
            </button>
          ) : null}
        </div>

        {activeEntries.length > 0 ? (
          <ul className="mt-space-3 flex flex-wrap gap-space-2" aria-label="Active filters">
            {activeEntries.map((entry) => (
              <li key={entry.key}>
                <button
                  type="button"
                  onClick={() => pushFilters({ [entry.key]: "" } as Partial<Record<FilterKey, string>>)}
                  className={cn(
                    "inline-flex items-center gap-space-2 rounded-pill",
                    "border border-line bg-surface-muted px-space-3 py-1 text-xs text-ink",
                    "hover:border-umber hover:text-umber",
                    "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
                  )}
                  aria-label={`Remove filter ${entry.label}`}
                >
                  <span className="uppercase tracking-wider text-ink-subtle">{entry.key}</span>
                  <span>{entry.label}</span>
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

interface FacetSelectProps {
  label: string;
  value: string;
  options: FacetOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder: string;
}

function FacetSelect({ label, value, options, onChange, disabled, placeholder }: FacetSelectProps) {
  return (
    <Select
      label={label}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      disabled={disabled}
      containerClassName="min-w-[180px] flex-1 md:flex-none md:w-[200px]"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
          className={cn(opt.count === 0 && "text-ink-subtle")}
        >
          {opt.label}
          {opt.count === 0 ? " (0)" : ` (${opt.count})`}
        </option>
      ))}
    </Select>
  );
}

function labelForValue(
  key: FilterKey,
  value: string,
  all: {
    effectOptions: FacetOption[];
    usageOptions: FacetOption[];
    brandOptions: FacetOption[];
    tagOptions: FacetOption[];
  },
): string {
  const source =
    key === "effect"
      ? all.effectOptions
      : key === "usage"
        ? all.usageOptions
        : key === "brand"
          ? all.brandOptions
          : all.tagOptions;
  return source.find((o) => o.value === value)?.label ?? titleCase(value);
}
