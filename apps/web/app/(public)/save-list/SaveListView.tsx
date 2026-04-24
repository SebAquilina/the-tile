"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSaveList } from "@/lib/save-list";
import { getAllProducts } from "@/lib/seed";
import { TileCard } from "@/components/catalog/TileCard";
import { Button } from "@/components/ui";

/**
 * Client view of the save-list page. Reads the sessionStorage-backed context,
 * resolves each saved id to a real product from the seed catalog, and offers
 * a "Request a quote" CTA that deep-links into /contact with the ids attached.
 */
export function SaveListView() {
  const { ids, clear, count } = useSaveList();

  const products = useMemo(() => {
    const all = getAllProducts();
    const byId = new Map(all.map((p) => [p.id, p] as const));
    return ids
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [ids]);

  if (count === 0) {
    return (
      <section className="mt-space-10 rounded-md border border-dashed border-line bg-surface p-space-8">
        <h2 className="font-display text-2xl text-ink">
          Nothing saved yet
        </h2>
        <p className="mt-space-3 max-w-prose text-ink-muted">
          Browse the catalog and tap the heart on any tile that earns a second
          look. Your shortlist lives in this browser tab — we never save it to
          our servers without you asking.
        </p>
        <div className="mt-space-5 flex flex-wrap gap-space-3">
          <Link
            href="/collections"
            className="inline-flex items-center rounded-md bg-umber px-space-5 py-space-3 text-sm font-medium text-surface hover:bg-umber-strong focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Browse collections
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-line px-space-5 py-space-3 text-sm font-medium text-ink hover:border-umber focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Ask the concierge
          </Link>
        </div>
      </section>
    );
  }

  const quoteHref = `/contact?saveIds=${encodeURIComponent(ids.join(","))}&reason=quote`;

  return (
    <div className="mt-space-10 space-y-space-10">
      <div className="flex flex-wrap items-center justify-between gap-space-4">
        <p className="text-ink-muted">
          <span className="font-medium text-ink">{count}</span>{" "}
          {count === 1 ? "tile saved" : "tiles saved"} in this session.
        </p>
        <div className="flex flex-wrap gap-space-3">
          <Link
            href={quoteHref}
            className="inline-flex items-center rounded-md bg-umber px-space-5 py-space-3 text-sm font-medium text-surface hover:bg-umber-strong focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            Request a quote on these
          </Link>
          <Button variant="ghost" size="sm" onClick={clear} type="button">
            Clear shortlist
          </Button>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-space-5 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p.id}>
            <TileCard product={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
