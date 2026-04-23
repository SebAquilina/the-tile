import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const metadata: Metadata = {
  title: "Showroom — The Tile",
  description:
    "Visit the San Gwann showroom. Sixty Italian series on display, samples to take home, unhurried advice from the team that has been curating them since 1990.",
};

export default function ShowroomPage() {
  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Showroom" }]} />

      <article className="mt-space-7 max-w-prose">
        <p className="text-xs uppercase tracking-widest text-ink-subtle">
          Visit us
        </p>
        <h1 className="mt-space-3 font-display text-4xl leading-tight text-ink md:text-5xl">
          Come and hold the tile
        </h1>

        <p className="mt-space-6 text-lg text-ink-muted">
          Photographs only get you so far. The showroom in San Gwann is where
          a marble-effect decides whether it reads cool or warm, where a
          wood-look stops looking like wood and starts looking like a floor,
          and where a 20mm paver sits in your hand and tells you how heavy
          the right one should feel.
        </p>

        <p className="mt-space-4 text-ink-muted">
          Drop in to browse, or book a slot and we will set aside a quieter
          hour to walk a brief together. Samples are loaned freely — take
          half a dozen home, live with them in your light for a few days,
          and bring back the ones that did not make the shortlist.
        </p>

        <div className="mt-space-8 rounded-md border border-line bg-surface p-space-6">
          <p className="text-xs uppercase tracking-widest text-ink-subtle">
            The Tile · San Gwann
          </p>
          <address className="mt-space-3 not-italic">
            <p className="text-ink">Triq X, San Gwann, Malta</p>
            <p className="mt-space-2 text-ink-muted">
              Monday to Saturday · 9:00 – 18:00
            </p>
            <p className="mt-space-1 text-ink-muted">+356 XXXX XXXX</p>
          </address>
          <p className="mt-space-4 text-sm italic text-ink-subtle">
            Please confirm address and hours with us before visiting — these
            are placeholder details pending final confirmation.
          </p>
        </div>

        <div className="mt-space-8 flex flex-wrap gap-space-4 text-sm">
          <Link
            href="/contact"
            className="text-umber underline underline-offset-4 hover:text-umber-strong"
          >
            Book a visit through the concierge
          </Link>
          <span aria-hidden="true" className="text-ink-subtle">
            ·
          </span>
          <Link
            href="/collections"
            className="text-umber underline underline-offset-4 hover:text-umber-strong"
          >
            Browse the catalogue first
          </Link>
        </div>
      </article>
    </div>
  );
}
