import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CollectionsExplorer } from "@/components/catalog/CollectionsExplorer";
import {
  getAllProducts,
  getCategoryById,
  getEffectCategories,
  getProductsByEffect,
} from "@/lib/seed";

const EFFECT_IDS = [
  "marble",
  "wood",
  "stone",
  "slate",
  "concrete",
  "terrazzo",
  "terracotta",
  "gesso",
  "full-colour",
] as const;

type EffectId = (typeof EFFECT_IDS)[number];

export function generateStaticParams() {
  return EFFECT_IDS.map((effect) => ({ effect }));
}

export function generateMetadata({ params }: { params: { effect: string } }): Metadata {
  const category = getCategoryById(params.effect);
  if (!category) return { title: "Not found" };
  return {
    title: `${category.name} tiles`,
    description: category.summary || `${category.name} tile collections at The Tile.`,
  };
}

function isEffect(effect: string): effect is EffectId {
  return (EFFECT_IDS as readonly string[]).includes(effect);
}

export default function EffectLandingPage({ params }: { params: { effect: string } }) {
  if (!isEffect(params.effect)) notFound();

  const category = getCategoryById(params.effect);
  if (!category || category.type !== "effect") notFound();

  const products = getProductsByEffect(params.effect).filter(
    (p) => p.showInCatalog !== false,
  );
  // The facet bar needs the full catalog's distinct brands/tags/usages to be
  // useful — though effect is locked, the other dimensions still need options.
  const allProducts = getAllProducts().filter((p) => p.showInCatalog !== false);
  const effectCategories = getEffectCategories();

  return (
    <>
      <header className="mx-auto max-w-wide px-space-5 md:px-space-7 pt-space-9 pb-space-5">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-subtle">
          <ol className="flex items-center gap-space-2">
            <li>
              <Link href="/" className="hover:text-ink underline-offset-4 hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/collections"
                className="hover:text-ink underline-offset-4 hover:underline"
              >
                Collections
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {category.name}
            </li>
          </ol>
        </nav>
        <p className="mt-space-5 text-xs uppercase tracking-wider text-ink-subtle">
          Effect
        </p>
        <h1 className="mt-space-3 font-display text-4xl md:text-5xl text-ink">
          {category.name}
        </h1>
        {category.summary ? (
          <p className="mt-space-4 max-w-prose text-ink-muted text-lg leading-relaxed">
            {category.summary}
          </p>
        ) : null}
      </header>
      <Suspense fallback={null}>
        <CollectionsExplorer
          products={allProducts}
          effectCategories={effectCategories}
          lockedEffect={params.effect}
          countLabelPrefix={`Showing ${products.length} of`}
        />
      </Suspense>
    </>
  );
}
