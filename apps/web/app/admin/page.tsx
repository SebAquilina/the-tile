import Link from "next/link";
import { getAllProducts } from "@/lib/seed";
import { getAllReviews } from "@/lib/reviews";
import { BUSINESS } from "@/lib/business-info";

export default function AdminHome() {
  const products = getAllProducts();
  const outOfStock = products.filter((p) => p.inStock === false).length;
  const hiddenFromCatalog = products.filter(
    (p) => p.showInCatalog === false,
  ).length;
  const reviews = getAllReviews();

  const cards = [
    {
      href: "/admin/products",
      title: "Products",
      value: `${products.length} series`,
      detail: `${outOfStock} out of stock · ${hiddenFromCatalog} hidden`,
    },
    {
      href: "/admin/leads",
      title: "Leads",
      value: "Queue",
      detail: "Contact-form submissions (Phase 2: D1-backed; for now logs).",
    },
    {
      href: "/admin/reviews",
      title: "Reviews",
      value: `${reviews.length} published`,
      detail: "Fabricated placeholders — replace before launch.",
    },
  ];

  return (
    <div className="space-y-space-8">
      <header>
        <h1 className="font-display text-4xl text-ink">Welcome back</h1>
        <p className="mt-space-3 text-ink-muted">
          Quick operations for {BUSINESS.name} — {BUSINESS.addressDisplay}.
        </p>
      </header>

      <ul className="grid gap-space-5 md:grid-cols-3">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="group block rounded-md border border-line bg-surface p-space-6 transition-colors duration-fast ease-out hover:border-umber"
            >
              <p className="text-xs uppercase tracking-widest text-ink-subtle">
                {c.title}
              </p>
              <p className="mt-space-3 font-display text-3xl text-ink group-hover:text-umber-strong">
                {c.value}
              </p>
              <p className="mt-space-2 text-sm text-ink-muted">{c.detail}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="rounded-md border border-line bg-surface p-space-6">
        <h2 className="font-display text-2xl text-ink">How editing works</h2>
        <p className="mt-space-3 max-w-prose text-ink-muted">
          Stock flags, catalogue visibility, and quick copy edits commit to
          an override file in the repo. The production site rebuilds within
          three minutes of the commit. Team members who prefer editing the
          seed JSON directly via GitHub can still do so — this admin UI is a
          thin layer on top.
        </p>
      </section>
    </div>
  );
}
