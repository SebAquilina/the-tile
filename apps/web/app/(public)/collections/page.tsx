import type { Metadata } from "next";
import { CollectionsExplorerServer } from "@/components/catalog/CollectionsExplorerServer";
import { getAllProducts, getEffectCategories } from "@/lib/seed";

export const metadata: Metadata = {
  title: "All collections",
  description:
    "Every tile series The Tile carries — filter by effect, usage, brand, or tag.",
};

export default function CollectionsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const products = getAllProducts().filter((p) => p.showInCatalog !== false);
  const effectCategories = getEffectCategories();

  return (
    <>
      <header className="mx-auto max-w-wide px-space-5 md:px-space-7 pt-space-9 pb-space-5">
        <p className="text-xs uppercase tracking-wider text-ink-subtle">Collections</p>
        <h1 className="mt-space-3 font-display text-4xl md:text-5xl text-ink">
          Collections
        </h1>
        <p className="mt-space-4 max-w-prose text-ink-muted">
          {products.length} tile series across nine effects — filter to narrow, or ask the
          concierge if you&apos;d rather talk it through.
        </p>
      </header>
      <CollectionsExplorerServer
        products={products}
        effectCategories={effectCategories}
        searchParams={searchParams}
        countLabelPrefix="Showing"
      />
    </>
  );
}
