import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for The Tile website.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Terms" }]} />

      <article className="mt-space-7 max-w-prose space-y-space-5">
        <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">
          Terms of use
        </h1>

        <p className="text-sm italic text-ink-subtle">
          Phase 1 draft — please have your solicitor review before launch.
        </p>

        <p className="text-ink-muted">
          These terms cover the use of this website. Purchases, deliveries and
          returns are covered by the separate quotation you sign with The
          Tile at the showroom.
        </p>

        <h2 className="font-display text-2xl text-ink">Accuracy</h2>
        <p className="text-ink-muted">
          We work hard to keep product information accurate, but tile
          collections change — colours, formats, finishes and stock levels can
          shift without notice. Before committing to a purchase, please
          confirm the specifics with the showroom team. Swatches and images
          are representative; exact appearance depends on production batch,
          lighting and installation.
        </p>

        <h2 className="font-display text-2xl text-ink">Use of the site</h2>
        <p className="text-ink-muted">
          You may browse, save tiles to your shortlist, and send us enquiries.
          Automated scraping, reverse-engineering the agent, or attempting to
          disrupt the service is not permitted.
        </p>

        <h2 className="font-display text-2xl text-ink">Intellectual property</h2>
        <p className="text-ink-muted">
          Product names, series names and manufacturer logos belong to the
          respective Italian suppliers (Emilgroup, Emilceramica, Ergon,
          Provenza, Viva, and others). The rest of the site — copy, layout,
          photography where commissioned — is owned by The Tile.
        </p>

        <h2 className="font-display text-2xl text-ink">Liability</h2>
        <p className="text-ink-muted">
          The website is offered as-is for informational purposes. The Tile is
          not liable for decisions made solely on the basis of website content
          without consulting the showroom.
        </p>

        <h2 className="font-display text-2xl text-ink">Governing law</h2>
        <p className="text-ink-muted">
          These terms are governed by the laws of Malta. Disputes will be
          handled in the competent courts of Malta.
        </p>

        <p className="text-sm text-ink-subtle">Last updated: April 2026.</p>
      </article>
    </div>
  );
}
