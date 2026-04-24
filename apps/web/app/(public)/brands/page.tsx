import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { getAllBrandProfiles } from "@/lib/brand-profiles";

export const metadata: Metadata = {
  title: "Brands",
  description:
    "The Italian suppliers The Tile carries — Emilceramica, Emilgroup, Ergon, Provenza, Viva.",
};

export default function BrandsPage() {
  const brands = getAllBrandProfiles();

  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Brands" }]} />

      <header className="mt-space-7 max-w-prose">
        <p className="text-xs uppercase tracking-widest text-ink-subtle">
          Italian suppliers
        </p>
        <h1 className="mt-space-3 font-display text-4xl leading-tight text-ink md:text-5xl">
          The houses we work with
        </h1>
        <p className="mt-space-5 text-lg text-ink-muted">
          Thirty years of winnowing Italian porcelain catalogues down to what
          actually works in Malta. These are the five houses that keep turning
          up on our showroom floor.
        </p>
      </header>

      <ul className="mt-space-10 grid gap-space-5 md:grid-cols-2">
        {brands.map((b) => (
          <li key={b.slug}>
            <Link
              href={`/brands/${b.slug}`}
              className="group block rounded-md border border-line bg-surface p-space-6 transition-colors duration-fast ease-out hover:border-umber focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
            >
              <h2 className="font-display text-2xl text-ink group-hover:text-umber-strong">
                {b.name}
              </h2>
              <p className="mt-space-3 text-ink-muted">{b.blurb}</p>
              <ul className="mt-space-4 flex flex-wrap gap-space-2">
                {b.focus.map((f) => (
                  <li
                    key={f}
                    className="rounded-pill border border-line px-space-3 py-space-1 text-xs text-ink-subtle"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
