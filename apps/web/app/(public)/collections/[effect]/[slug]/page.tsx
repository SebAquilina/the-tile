import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/cn";
import { RelatedTiles } from "@/components/catalog/RelatedTiles";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { listReviews } from "@/lib/reviews/store";
import { SaveToListButton } from "@/components/catalog/SaveToListButton";
import { SpecsTable } from "@/components/catalog/SpecsTable";
import { Button } from "@/components/ui";
import {
  breadcrumbLd,
  jsonLdToString,
  productLd,
} from "@/lib/jsonld";
import { getAllProducts, getProductBySlug, getCategoryById } from "@/lib/seed";

interface Params {
  effect: string;
  slug: string;
}

export function generateStaticParams() {
  return getAllProducts().map((product) => {
    const url = product.url.replace(/^\/collections\//, "");
    const [effect, slug] = url.split("/");
    return { effect, slug };
  });
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const product = getProductBySlug(params.effect, params.slug);
  if (!product) return { title: "Not found" };
  return {
    title: `${product.name} — ${String(product.effect)} tile`,
    description: product.summary,
  };
}

export default function ProductDetailPage({ params }: { params: Params }) {
  const product = getProductBySlug(params.effect, params.slug);
  if (!product) notFound();

  const heroImage = product.images?.[0];
  const heroAlt =
    heroImage?.alt || `${product.name} — ${String(product.effect)} effect tile`;
  const allProducts = getAllProducts();

  const effectCategory = getCategoryById(String(product.effect));
  const effectLabel = effectCategory?.name ?? String(product.effect);
  const breadcrumbs = breadcrumbLd([
    { name: "Home", url: "/" },
    { name: "Collections", url: "/collections" },
    { name: effectLabel, url: `/collections/${String(product.effect)}` },
    { name: product.name, url: product.url },
  ]);
  const productLdObj = productLd(product);

  return (
    <div className="mx-auto max-w-wide px-space-5 md:px-space-7 pt-space-7 pb-space-10">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: jsonLdToString(productLdObj) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: jsonLdToString(breadcrumbs) }}
        />
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-ink-subtle">
          <ol className="flex flex-wrap items-center gap-space-2">
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
            <li>
              <Link
                href={`/collections/${String(product.effect)}`}
                className="hover:text-ink underline-offset-4 hover:underline"
              >
                {String(product.effect)}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Hero + metadata */}
        <div className="mt-space-7 grid grid-cols-1 md:grid-cols-2 gap-space-7 md:gap-space-8 items-start">
          <div
            className={cn(
              "relative aspect-square w-full overflow-hidden rounded-md",
              "bg-surface-muted border border-line",
            )}
          >
            {heroImage?.src ? (
              <img
                src={heroImage.src}
                alt={heroAlt}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  "bg-[linear-gradient(135deg,var(--color-cream),var(--color-surface-muted))]",
                )}
              >
                <span className="px-space-5 text-center font-display text-3xl text-ink-muted">
                  {product.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-space-4">
            {product.brand ? (
              <span className="text-xs uppercase tracking-wider text-ink-subtle">
                {product.brand}
              </span>
            ) : null}
            <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
              {product.name}
            </h1>
            <span className="text-xs uppercase tracking-wider text-ink-muted">
              {String(product.effect)} effect
            </span>
            <p className="text-lg text-ink-muted leading-relaxed max-w-prose">
              {product.summary}
            </p>

            <div className="flex flex-wrap items-center gap-space-3 mt-space-3">
              <div className="inline-flex items-center gap-space-3 rounded-md border border-line bg-surface px-space-4 py-space-3">
                <SaveToListButton productId={product.id} size="sm" />
                <span className="text-sm text-ink">Save to list</span>
              </div>
              <Link
                href="/contact"
                className={cn(
                  "inline-flex items-center justify-center h-11 px-space-5 rounded-md",
                  "bg-umber text-canvas border border-umber text-base font-medium",
                  "hover:bg-umber-strong hover:border-umber-strong",
                  "transition-colors duration-fast ease-out",
                  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
                )}
              >
                Request a quote
              </Link>
            </div>

            {product.bestFor && product.bestFor.length > 0 ? (
              <div className="mt-space-4">
                <p className="text-xs uppercase tracking-wider text-ink-subtle mb-space-2">
                  Best for
                </p>
                <ul className="flex flex-wrap gap-space-2">
                  {product.bestFor.map((tag) => (
                    <li
                      key={tag}
                      className={cn(
                        "inline-flex items-center rounded-pill",
                        "border border-line bg-surface-muted px-space-3 py-1 text-xs text-ink-muted",
                      )}
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        {/* Description */}
        {product.description && product.description !== product.summary ? (
          <section className="mt-space-9 max-w-prose">
            <h2 className="font-display text-2xl text-ink mb-space-4">About this series</h2>
            <div className="text-ink-muted leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </section>
        ) : null}

        {/* Specs */}
        <section className="mt-space-9 max-w-prose">
          <h2 className="font-display text-2xl text-ink mb-space-4">Specifications</h2>
          <SpecsTable attributes={product.attributes} />
          {!product.attributes ||
          Object.keys(product.attributes).filter(
            (k) => (product.attributes as Record<string, unknown>)[k],
          ).length === 0 ? (
            <p className="text-sm text-ink-subtle">
              Detailed specs available on request — ask the concierge or{" "}
              <Link href="/contact" className="underline underline-offset-4 hover:text-umber">
                get in touch
              </Link>
              .
            </p>
          ) : null}
        </section>

        {/* CTA strip */}
        <section className="mt-space-9 rounded-lg border border-line bg-surface-muted p-space-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-space-5">
            <div>
              <h2 className="font-display text-2xl text-ink">
                Want to see it in person?
              </h2>
              <p className="mt-space-2 text-ink-muted max-w-prose">
                Visit the San Gwann showroom or request a sample — we&apos;ll arrange delivery.
              </p>
            </div>
            <div className="flex flex-wrap gap-space-3">
              <Link
                href="/contact"
                className={cn(
                  "inline-flex items-center justify-center h-11 px-space-5 rounded-md",
                  "bg-umber text-canvas border border-umber text-base font-medium",
                  "hover:bg-umber-strong hover:border-umber-strong",
                  "transition-colors duration-fast ease-out",
                )}
              >
                Request a quote
              </Link>
              <Link
                href="/showroom"
                className={cn(
                  "inline-flex items-center justify-center h-11 px-space-5 rounded-md",
                  "border border-line bg-surface text-ink text-base font-medium",
                  "hover:border-umber hover:text-umber",
                  "transition-colors duration-fast ease-out",
                )}
              >
                Visit the showroom
              </Link>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <ProductReviews productId={product.id} />

        {/* Related */}
        <div className="mt-space-10">
          <RelatedTiles current={product} all={allProducts} />
        </div>
      </div>
  );
}

async function ProductReviews({ productId }: { productId: string }) {
  let rows: Awaited<ReturnType<typeof listReviews>> = [];
  try {
    rows = await listReviews({ status: "active" });
  } catch {
    rows = [];
  }
  const reviews = rows
    .filter((r) => r.product_id === productId)
    .map((r) => ({
      id: r.id,
      author: { name: r.author, locality: r.location ?? undefined },
      rating: r.rating,
      publishedAt: r.date,
      body: r.quote,
      headline: r.title ?? undefined,
      productId: r.product_id ?? undefined,
      placeholder: !!r.placeholder,
    }));
  if (reviews.length === 0) return null;
  return (
    <section className="mt-space-10">
      <h2 className="font-display text-2xl text-ink">What customers said</h2>
      <ul className="mt-space-5 grid gap-space-5 md:grid-cols-2">
        {reviews.map((r) => (
          <li key={r.id}>
            <ReviewCard review={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}
