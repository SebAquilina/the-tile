import type { Metadata } from "next";
import Link from "next/link";
import { ToastProvider } from "@/components/ui";
import { PublishBar } from "./_components/PublishBar";
import { DesktopSidebar, MobileNavToggle } from "./_components/Sidebar";
import { Breadcrumbs } from "./_components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Force dynamic rendering — admin pages depend on request headers (for
// Basic-auth), on env vars (GITHUB_TOKEN for the Publish banner), and on
// sessionStorage-backed client draft state. None of that should be
// prerendered at build time.
export const dynamic = "force-dynamic";

// Auth is enforced by middleware.ts (HTTP Basic on /admin/**). This layout
// renders the admin chrome once the request is authorised:
//   - sticky top bar with wordmark + view-site link
//   - left sidebar (desktop) / hamburger drawer (mobile)
//   - breadcrumbs under the top bar
//   - global ToastProvider (top-right)
//   - global PublishBar (commit-pending badge)
//   - skip-to-content link for a11y
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-canvas text-ink">
        <a
          href="#admin-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-space-3 focus:top-space-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-space-4 focus:py-space-2 focus:text-sm focus:text-ink focus:shadow-md"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-wide items-center gap-space-4 px-space-5 md:px-space-7">
            <MobileNavToggle />
            <Link
              href="/admin"
              className="font-display text-xl text-ink hover:text-umber-strong"
            >
              Admin · The Tile
            </Link>
            <div className="ml-auto flex items-center gap-space-5 text-sm text-ink-muted">
              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                View site ↗
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-wide gap-space-6 px-space-5 md:px-space-7">
          <DesktopSidebar />
          <main id="admin-content" className="min-w-0 flex-1 pb-space-11 pt-space-5">
            <div className="mb-space-5">
              <Breadcrumbs />
            </div>
            {children}
          </main>
        </div>

        <PublishBar />
      </div>
    </ToastProvider>
  );
}
