import { cn } from "@/lib/cn";
import type { Product } from "@/lib/schemas";
import { TileCard } from "./TileCard";

export interface RelatedTilesProps {
  current: Product;
  all: Product[];
  className?: string;
}

export function RelatedTiles({ current, all, className }: RelatedTilesProps) {
  const related = all
    .filter((p) => p.effect === current.effect && p.id !== current.id)
    .slice(0, 6);

  if (related.length === 0) return null;

  return (
    <section className={cn("flex flex-col gap-space-5", className)} aria-label="Related tiles">
      <h2 className="font-display text-2xl text-ink">More {String(current.effect)} effects</h2>
      <div
        className={cn(
          "flex gap-space-5 overflow-x-auto pb-space-3",
          "-mx-space-5 px-space-5 md:-mx-space-7 md:px-space-7",
          "snap-x snap-mandatory",
        )}
      >
        {related.map((product) => (
          <div
            key={product.id}
            className="w-[220px] md:w-[260px] shrink-0 snap-start"
          >
            <TileCard product={product} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
