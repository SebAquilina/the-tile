import Link from "next/link";
import { ArrowUpRight, BookmarkX, MessageSquare, PackageCheck, PackageX, Sparkles } from "lucide-react";
import { getAllProducts } from "@/lib/seed";
import { getAllReviews } from "@/lib/reviews";
import { BUSINESS } from "@/lib/business-info";
import { getAllLeads } from "@/lib/admin-store";
import { PersistenceStatus } from "./_components/PersistenceStatus";

export const runtime = 'edge';

export default async function AdminHome() {
  const products = getAllProducts();
  const outOfStock = products.filter((p) => p.inStock === false);
  const hidden = products.filter((p) => p.showInCatalog === false);
  const reviews = getAllReviews();
  const leads = await getAllLeads();
  const newLeads = leads.filter((l) => l.status === "new");

  const cards = [
    {
      href: "/admin/products",
      icon: PackageCheck,
      title: "Tiles",
      primary: `${products.length} in catalogue`,
      secondary: "Thumbnails, inline stock, search, publish.",
    },
    {
      href: "/admin/products?filter=out-of-stock",
      icon: PackageX,
      title: "Out of stock",
      primary: `${outOfStock.length}`,
      secondary:
        outOfStock.length === 0
          ? "Everything is on the floor."
          : outOfStock
              .slice(0, 3)
              .map((p) => p.name)
              .join(" · "),
    },
    {
      href: "/admin/products?filter=hidden",
      icon: BookmarkX,
      title: "Hidden from catalogue",
      primary: `${hidden.length}`,
      secondary: hidden.length === 0 ? "All tiles are visible." : "Click to review.",
    },
    {
      href: "/admin/leads",
      icon: MessageSquare,
      title: "Leads",
      primary: `${newLeads.length} new · ${leads.length} total`,
      secondary:
        newLeads.length === 0
          ? "No new enquiries."
          : "Reply from your inbox or mark replied here.",
    },
    {
      href: "/admin/reviews",
      icon: Sparkles,
      title: "Reviews",
      primary: `${reviews.length}`,
      secondary: `All current reviews are fabricated placeholders.`,
    },
  ];

  return (
    <div className="space-y-space-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-ink-subtle">
          Welcome back
        </p>
        <h1 className="mt-space-2 font-display text-4xl text-ink">
          {BUSINESS.name} admin
        </h1>
        <p className="mt-space-3 max-w-prose text-ink-muted">
          Toggle stock, tweak copy, reply to enquiries. Changes stage in your
          browser; hit <strong className="text-ink">Publish</strong> at the
          bottom of the screen when you are ready to push them live.
        </p>
      </header>

      <PersistenceStatus />

      <ul className="grid gap-space-5 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <li key={c.href}>
              <Link
                href={c.href}
                className="group flex h-full flex-col rounded-md border border-line bg-surface p-space-5 transition-colors duration-fast ease-out hover:border-umber"
              >
                <div className="flex items-center justify-between">
                  <Icon aria-hidden="true" className="h-5 w-5 text-umber" />
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 text-ink-subtle transition-transform duration-fast ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                  />
                </div>
                <p className="mt-space-5 text-xs uppercase tracking-widest text-ink-subtle">
                  {c.title}
                </p>
                <p className="mt-space-2 font-display text-3xl text-ink group-hover:text-umber-strong">
                  {c.primary}
                </p>
                <p className="mt-space-3 text-sm text-ink-muted">
                  {c.secondary}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      <section className="rounded-md border border-line bg-surface p-space-6">
        <h2 className="font-display text-2xl text-ink">How editing works</h2>
        <ol className="mt-space-4 space-y-space-3 text-sm text-ink-muted">
          <li>
            <strong className="text-ink">1.</strong> Flip a switch or edit a
            field. The change is drafted in your browser — nothing is live
            yet. You can close the tab and come back; drafts persist for the
            session.
          </li>
          <li>
            <strong className="text-ink">2.</strong> A bar appears at the
            bottom of the screen showing how many changes are staged. Review
            them on the Tiles page.
          </li>
          <li>
            <strong className="text-ink">3.</strong> Hit <em>Publish</em>.
            That commits all staged changes to GitHub as a single commit; the
            site rebuilds within about three minutes.
          </li>
          <li>
            <strong className="text-ink">4.</strong> Discard any time. Closing
            the tab keeps the draft; clicking Discard clears it completely.
          </li>
        </ol>
      </section>
    </div>
  );
}
