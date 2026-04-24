import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllProducts } from "@/lib/seed";
import { ProductEditor } from "./ProductEditor";

export default function AdminProductEditPage({
  params,
}: {
  params: { id: string };
}) {
  const product = getAllProducts().find((p) => p.id === params.id);
  if (!product) notFound();

  const hero = product.images?.[0];

  return (
    <div className="space-y-space-7">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-space-2 text-sm text-ink-subtle hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to tiles
        </Link>
      </div>

      <div className="grid gap-space-7 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="space-y-space-4">
          <div className="aspect-[4/3] overflow-hidden rounded-md border border-line bg-surface-muted">
            {hero?.src ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={hero.src}
                alt={hero.alt ?? product.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <dl className="space-y-space-3 text-sm">
            <div>
              <dt className="text-ink-subtle">ID</dt>
              <dd className="mt-space-1 font-mono text-xs text-ink">
                {product.id}
              </dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Effect</dt>
              <dd className="mt-space-1 text-ink">{product.effect}</dd>
            </div>
            {product.brand ? (
              <div>
                <dt className="text-ink-subtle">Brand</dt>
                <dd className="mt-space-1 text-ink">{product.brand}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-ink-subtle">Public URL</dt>
              <dd className="mt-space-1">
                <Link
                  href={product.url}
                  target="_blank"
                  rel="noopener"
                  className="text-umber underline underline-offset-4 hover:text-umber-strong"
                >
                  {product.url}
                </Link>
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <header>
            <h1 className="font-display text-3xl text-ink">{product.name}</h1>
            <p className="mt-space-2 text-sm text-ink-muted">
              Edit the card summary and flags. Changes stage until you publish.
            </p>
          </header>
          <div className="mt-space-6">
            <ProductEditor
              id={product.id}
              seed={{
                inStock: product.inStock ?? true,
                showInCatalog: product.showInCatalog ?? true,
                summary: product.summary,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
