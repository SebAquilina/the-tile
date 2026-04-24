import Link from "next/link";
import { getAllProducts } from "@/lib/seed";
import { getAllProductOverrides } from "@/lib/admin-store";

export default function AdminProductsPage() {
  const products = getAllProducts();
  const overrides = getAllProductOverrides();
  const overrideCount = Object.keys(overrides).length;

  return (
    <div className="space-y-space-7">
      <header className="flex flex-wrap items-baseline justify-between gap-space-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Products</h1>
          <p className="mt-space-2 text-sm text-ink-muted">
            {products.length} series in the catalogue · {overrideCount} with
            active overrides
          </p>
        </div>
        <p className="text-xs italic text-ink-subtle">
          Admin overrides stage for the next rebuild; the public site is
          cached at the edge.
        </p>
      </header>

      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line bg-surface-muted text-left text-xs uppercase tracking-widest text-ink-subtle">
            <tr>
              <th className="px-space-4 py-space-3">Name</th>
              <th className="px-space-4 py-space-3">Effect</th>
              <th className="px-space-4 py-space-3">Brand</th>
              <th className="px-space-4 py-space-3">Stock</th>
              <th className="px-space-4 py-space-3">Visible</th>
              <th className="px-space-4 py-space-3">Override</th>
              <th className="px-space-4 py-space-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const o = overrides[p.id];
              const inStock = o?.inStock ?? p.inStock ?? true;
              const showInCatalog = o?.showInCatalog ?? p.showInCatalog ?? true;
              return (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-space-4 py-space-3">
                    <div className="font-medium text-ink">{p.name}</div>
                    <div className="text-xs text-ink-subtle">{p.id}</div>
                  </td>
                  <td className="px-space-4 py-space-3 text-ink-muted">
                    {p.effect}
                  </td>
                  <td className="px-space-4 py-space-3 text-ink-muted">
                    {p.brand ?? "—"}
                  </td>
                  <td className="px-space-4 py-space-3">
                    <span
                      className={
                        inStock ? "text-success" : "text-warning"
                      }
                    >
                      {inStock ? "In stock" : "Out of stock"}
                    </span>
                  </td>
                  <td className="px-space-4 py-space-3">
                    <span
                      className={
                        showInCatalog ? "text-ink" : "text-ink-subtle"
                      }
                    >
                      {showInCatalog ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-space-4 py-space-3 text-xs text-ink-subtle">
                    {o ? "Staged" : "—"}
                  </td>
                  <td className="px-space-4 py-space-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-umber underline underline-offset-4 hover:text-umber-strong"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
