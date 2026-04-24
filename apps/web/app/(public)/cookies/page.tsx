import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const metadata: Metadata = {
  title: "Cookies",
  description: "How The Tile uses cookies and similar storage.",
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Cookies" }]} />

      <article className="mt-space-7 max-w-prose space-y-space-5">
        <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">
          Cookie policy
        </h1>

        <p className="text-sm italic text-ink-subtle">
          Phase 1 draft — please have your solicitor review before launch.
        </p>

        <p className="text-ink-muted">
          We try to use as little browser storage as possible. This page
          explains what we do use and why.
        </p>

        <h2 className="font-display text-2xl text-ink">What we do not set</h2>
        <p className="text-ink-muted">
          No advertising cookies. No third-party tracking cookies. We use
          Plausible analytics, which is cookieless and GDPR-compliant out of
          the box.
        </p>

        <h2 className="font-display text-2xl text-ink">What we do set</h2>
        <ul className="list-disc space-y-space-2 pl-space-6 text-ink-muted">
          <li>
            A small session identifier in <code>sessionStorage</code> so the
            concierge can follow a conversation across page changes. It is
            discarded when you close the tab.
          </li>
          <li>
            Your save-list — the tiles you mark to review later — stored in{" "}
            <code>sessionStorage</code> and also discarded when you close the
            tab.
          </li>
          <li>
            A preference for light or dark appearance, stored in{" "}
            <code>localStorage</code> so we can remember your choice on return
            visits. You can clear it from your browser at any time.
          </li>
        </ul>

        <h2 className="font-display text-2xl text-ink">Bot protection</h2>
        <p className="text-ink-muted">
          When enabled, Cloudflare Turnstile may set a short-lived token when
          you submit a form. It is not used to identify you and is discarded
          after the submission.
        </p>

        <p className="text-sm text-ink-subtle">Last updated: April 2026.</p>
      </article>
    </div>
  );
}
