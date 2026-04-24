import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TileCard } from "@/components/catalog/TileCard";
import { getAllBrandProfiles, getBrandProfileBySlug } from "@/lib/brand-profiles";
import { getAllProducts } from "@/lib/seed";
import { jsonLdToString, breadcrumbLd } from "@/lib/jsonld";

export function generateStaticParams() {
  return getAllBrandProfiles().map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const brand = getBrandProfileBySlug(params.slug);
  if (!brand) return { title: "Brand not found" };
  return {
    title: `${brand.name} — tiles at The Tile`,
    description: brand.blurb,
  };
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.the-tile.com";

export default function BrandDetailPage({ params }: { params: { slug: string } }) {
  const brand = getBrandProfileBySlug(params.slug);
  if (!brand) notFound();

  const products = getAllProducts().filter(
    (p) =>
      p.showInCatalog !== false &&
      p.brand &&
      p.brand.toLowerCase() === brand.name.toLowerCase(),
  );

  const breadcrumbs = [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Brands", url: `${SITE_URL}/brands` },
    { name: brand.name, url: `${SITE_URL}/brands/${brand.slug}` },
  ];

  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: jsonLdToString(breadcrumbLd(breadcrumbs)),
        }}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Brands", href: "/brands" },
          { label: brand.name },
        ]}
      />

      <header className="mt-space-7 max-w-prose">
        <p className="text-xs uppercase tracking-widest text-ink-subtle">
          Italian supplier
        </p>
        <h1 className="mt-space-3 font-display text-4xl leading-tight text-ink md:text-5xl">
          {brand.name}
        </h1>
        <p className="mt-space-5 text-lg text-ink-muted">{brand.heritage}</p>
        <ul className="mt-space-5 flex flex-wrap gap-space-2">
          {brand.focus.map((f) => (
            <li
              key={f}
              className="rounded-pill border border-line px-space-3 py-space-1 text-xs text-ink-subtle"
            >
              {f}
            </li>
          ))}
        </ul>
      </header>

      <section className="mt-space-10">
        <h2 className="font-display text-2xl text-ink">
          Series we carry ({products.length})
        </h2>
        {products.length > 0 ? (
          <ul className="mt-space-5 grid grid-cols-2 gap-space-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <li key={p.id}>
                <TileCard product={p} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-space-5 max-w-prose text-ink-muted">
            We carry {brand.name} and the current showroom selection rotates.
            Speak to the concierge or{" "}
            <Link
              href="/contact"
              className="text-umber underline underline-offset-4 hover:text-umber-strong"
            >
              ask about availability
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
