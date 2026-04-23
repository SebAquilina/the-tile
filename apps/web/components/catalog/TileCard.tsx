import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/schemas";
import { SaveToListButton } from "./SaveToListButton";

export interface TileCardProps {
  product: Product;
  /** Highlight ring pulse (driven by TileGrid). */
  highlighted?: boolean;
  /** Tighter density (for the related-tiles rail). */
  compact?: boolean;
}

/**
 * TileCard — the grid primitive. The <Link> covers the image + text so the
 * card is a single click target; the heart button lives outside the <Link>
 * (absolutely positioned) to avoid a nested-interactive-element a11y bug.
 *
 * Images are rare in Phase 0, so the textured placeholder is the common case.
 * We keep the placeholder warm and editorial — a soft gradient from cream to
 * surface-muted with the product name centred in display serif.
 */
export function TileCard({ product, highlighted = false, compact = false }: TileCardProps) {
  const image = product.images?.[0];
  const alt = image?.alt || `${product.name} — ${product.effect} effect tile`;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-space-3",
        "transition-shadow duration-base ease-out",
        highlighted && "ring-2 ring-umber rounded-md",
      )}
    >
      <Link
        href={product.url}
        className={cn(
          "block focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 rounded-md",
        )}
      >
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-md",
            "bg-surface-muted border border-line",
            "transition-shadow duration-base ease-out",
            "group-hover:shadow-md",
          )}
        >
          {image?.src ? (
            <img
              src={image.src}
              alt={alt}
              loading="lazy"
              className={cn(
                "h-full w-full object-cover",
                "transition-transform duration-base ease-out",
                "group-hover:scale-[1.02]",
              )}
            />
          ) : (
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                "bg-[linear-gradient(135deg,var(--color-cream),var(--color-surface-muted))]",
                "transition-transform duration-base ease-out",
                "group-hover:scale-[1.02]",
              )}
            >
              <span
                className={cn(
                  "px-space-4 text-center font-display text-ink-muted",
                  compact ? "text-base" : "text-xl",
                )}
              >
                {product.name}
              </span>
            </div>
          )}
        </div>

        <div className={cn("flex flex-col gap-space-1", compact ? "mt-space-2" : "mt-space-3")}>
          {product.brand ? (
            <span className="font-sans text-xs uppercase tracking-wider text-ink-subtle">
              {product.brand}
            </span>
          ) : null}
          <h3
            className={cn(
              "font-display text-ink leading-snug",
              compact ? "text-base" : "text-lg",
            )}
          >
            {product.name}
          </h3>
          <span className="font-sans text-xs uppercase tracking-wider text-ink-muted">
            {product.effect}
          </span>
        </div>
      </Link>

      <SaveToListButton
        productId={product.id}
        size={compact ? "sm" : "md"}
        className="absolute right-space-3 top-space-3"
      />
    </article>
  );
}
