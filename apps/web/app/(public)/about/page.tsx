import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const metadata: Metadata = {
  title: "About — The Tile",
  description:
    "Italian porcelain stoneware specialists in San Gwann, Malta. Since 1990 — curating marble, wood, stone and concrete-effect tile for Maltese homes and projects.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />

      <article className="mt-space-7 max-w-prose">
        <p className="text-xs uppercase tracking-widest text-ink-subtle">
          The Tile · since 1990
        </p>
        <h1 className="mt-space-3 font-display text-4xl leading-tight text-ink md:text-5xl">
          A quiet showroom, thirty-odd years in
        </h1>

        <p className="mt-space-6 text-lg text-ink-muted">
          The Tile opened its doors in San Gwann in 1990, in the years when
          porcelain stoneware was just beginning to change what a Maltese
          floor could be. We have been here ever since, in the same
          neighbourhood, selling tile the way we always have — by sitting down
          with the people who will live on it.
        </p>

        <h2 className="mt-space-8 font-display text-2xl text-ink md:text-3xl">
          A curated range, not a warehouse
        </h2>
        <p className="mt-space-4 text-ink-muted">
          We do not try to carry everything. Over the years the catalogue has
          settled into roughly sixty active series, drawn almost entirely from
          five Italian houses — Emilceramica, Emilgroup, Ergon, Provenza and
          Viva. Each series is here because it earned its place: a
          marble-effect that holds up in summer light, a wood-look that does
          not feel like a compromise, a 20mm paver that behaves well on a
          Mediterranean terrace.
        </p>

        <h2 className="mt-space-8 font-display text-2xl text-ink md:text-3xl">
          Why Italian porcelain
        </h2>
        <p className="mt-space-4 text-ink-muted">
          The short answer is that the best porcelain stoneware in the world
          is made in Sassuolo and the Emilian hills around it. The longer
          answer involves kilns refined across four generations, a lineage
          that treats marble-effect as architecture rather than imitation,
          and photography that gives tile the same dignity as stone. We work
          with houses that care about that distinction. Our floor plan is
          small enough that we can.
        </p>

        <h2 className="mt-space-8 font-display text-2xl text-ink md:text-3xl">
          How a visit usually goes
        </h2>
        <p className="mt-space-4 text-ink-muted">
          People arrive with a room in mind — a ground-floor renovation, a
          bathroom that has run its course, a pool deck, a restaurant fit-out.
          We talk about light and traffic and the mood of the space, then we
          walk the showroom and pull samples. Most visits leave with a handful
          of 30×60 pieces to hold up against paint and fabric at home. Quotes
          follow once a direction has settled. There is no rush, and there is
          no cart.
        </p>

        <div className="mt-space-10 border-t border-line pt-space-6">
          <p className="text-xs uppercase tracking-widest text-ink-subtle">
            By the numbers
          </p>
          <p className="mt-space-3 font-display text-xl text-ink md:text-2xl">
            Since 1990 · San Gwann, Malta · 5 Italian suppliers · 60 active
            series
          </p>
        </div>

        <div className="mt-space-8 flex flex-wrap gap-space-4 text-sm">
          <Link
            href="/showroom"
            className="text-umber underline underline-offset-4 hover:text-umber-strong"
          >
            Plan a visit to the showroom
          </Link>
          <span aria-hidden="true" className="text-ink-subtle">
            ·
          </span>
          <Link
            href="/brands"
            className="text-umber underline underline-offset-4 hover:text-umber-strong"
          >
            The Italian houses we carry
          </Link>
          <span aria-hidden="true" className="text-ink-subtle">
            ·
          </span>
          <Link
            href="/contact"
            className="text-umber underline underline-offset-4 hover:text-umber-strong"
          >
            Talk to the concierge
          </Link>
        </div>
      </article>
    </div>
  );
}
