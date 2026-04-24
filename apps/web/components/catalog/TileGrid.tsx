"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/schemas";
import { Button } from "@/components/ui";
import { TileCard } from "./TileCard";

export interface TileGridProps {
  products: Product[];
  /** IDs to flash with a ring-2 pulse for ~1.2s (agent highlight). */
  highlightIds?: string[];
  /** Optional handler for "Clear filters" in the empty state. */
  onClearFilters?: () => void;
  /** Optional extra class on the grid container. */
  className?: string;
}

const HIGHLIGHT_MS = 1200;

export function TileGrid({
  products,
  highlightIds,
  onClearFilters,
  className,
}: TileGridProps) {
  const highlightKey = useMemo(
    () => (highlightIds?.length ? highlightIds.join("|") : ""),
    [highlightIds],
  );
  const [activeHighlight, setActiveHighlight] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!highlightIds || highlightIds.length === 0) {
      setActiveHighlight(new Set());
      return;
    }
    setActiveHighlight(new Set(highlightIds));
    const timer = window.setTimeout(() => {
      setActiveHighlight(new Set());
    }, HIGHLIGHT_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightKey]);

  if (products.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-space-4",
          "py-space-10 text-center",
        )}
      >
        <p className="font-display text-2xl text-ink">No tiles match this filter.</p>
        <p className="text-ink-muted max-w-prose">
          Try loosening a filter, or browse the full collection.
        </p>
        {onClearFilters ? (
          <Button variant="secondary" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-space-7",
        className,
      )}
    >
      {products.map((product) => (
        <TileCard
          key={product.id}
          product={product}
          highlighted={activeHighlight.has(product.id)}
        />
      ))}
    </div>
  );
}
