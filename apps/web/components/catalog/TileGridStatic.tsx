import { cn } from "@/lib/cn";
import type { Product } from "@/lib/schemas";
import { TileCard } from "./TileCard";

export interface TileGridStaticProps {
  products: Product[];
  /** Optional extra class on the grid container. */
  className?: string;
  /** Optional copy for the empty state (no clear-filters button — SSR can't handle it). */
  emptyMessage?: string;
}

/**
 * Server-renderable version of TileGrid — no highlight-pulse state, no
 * clear-filters handler. Used for the initial SSR pass so search engines and
 * no-JS clients see real tile cards with real links. The interactive
 * TileGrid client component can mount on top for agent-driven highlights.
 */
export function TileGridStatic({
  products,
  className,
  emptyMessage = "No tiles match this filter.",
}: TileGridStaticProps) {
  if (products.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-space-4",
          "py-space-10 text-center",
        )}
      >
        <p className="font-display text-2xl text-ink">{emptyMessage}</p>
        <p className="text-ink-muted max-w-prose">
          Try loosening a filter, or browse the full collection.
        </p>
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
        <TileCard key={product.id} product={product} />
      ))}
    </div>
  );
}
