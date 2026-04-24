import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Auth is enforced by middleware.ts (HTTP Basic on /admin/**). This layout
// simply renders the admin chrome once the request is authorised.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-wide items-center justify-between px-space-5 py-space-4 md:px-space-7">
          <Link
            href="/admin"
            className="font-display text-xl text-ink hover:text-umber-strong"
          >
            Admin · The Tile
          </Link>
          <nav className="flex items-center gap-space-5 text-sm">
            <Link href="/admin/products" className="hover:text-umber">
              Products
            </Link>
            <Link href="/admin/leads" className="hover:text-umber">
              Leads
            </Link>
            <Link href="/admin/reviews" className="hover:text-umber">
              Reviews
            </Link>
            <Link href="/" className="text-ink-subtle hover:text-ink">
              View site
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-wide px-space-5 py-space-8 md:px-space-7">
        {children}
      </main>
    </div>
  );
}
