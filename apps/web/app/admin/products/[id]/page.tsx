import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllProducts } from "@/lib/seed";
import { getProductOverride } from "@/lib/admin-store";
import { ProductEditor } from "./ProductEditor";

export default function AdminProductEditPage({
  params,
}: {
  params: { id: string };
}) {
  const product = getAllProducts().find((p) => p.id === params.id);
  if (!product) notFound();
  const override = getProductOverride(params.id);

  return (
    <div className="space-y-space-7">
      <header>
        <Link
          href="/admin/products"
          className="text-sm text-ink-subtle hover:text-ink"
        >
          ← All products
        </Link>
        <h1 className="mt-space-3 font-display text-3xl text-ink">
          {product.name}
        </h1>
        <p className="mt-space-2 text-sm text-ink-muted">
          {product.id} · {product.effect}
          {product.brand ? ` · ${product.brand}` : ""}
        </p>
      </header>

      <ProductEditor
        id={product.id}
        seed={{
          inStock: product.inStock ?? true,
          showInCatalog: product.showInCatalog ?? true,
          summary: product.summary,
        }}
        override={override ?? null}
      />
    </div>
  );
}
