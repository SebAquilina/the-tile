"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/schemas";
import { AgentHero } from "@/components/agent/AgentHero";
import { on } from "@/lib/events";

const DISMISS_KEY = "the-tile:hero-dismissed";

export interface HomeViewProps {
  featured: Product[];
}

/**
 * Switches between AgentHero (first-visit) and the return-visit home. The
 * sessionStorage check happens client-side so the first-load experience stays
 * the locked-intake hero.
 */
export function HomeView({ featured }: HomeViewProps) {
  // `undefined` = still deciding (pre-hydration); keeps the server render
  // blank so the hero doesn't flash for returning visitors.
  const [heroMode, setHeroMode] = useState<"hero" | "return" | undefined>(
    undefined,
  );

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(DISMISS_KEY) !== null;
    } catch {
      dismissed = false;
    }
    setHeroMode(dismissed ? "return" : "hero");

    const off = on("hero:dismissed", () => setHeroMode("return"));
    return off;
  }, []);

  if (heroMode === undefined) {
    // Invisible placeholder keeps layout stable while we decide.
    return <div aria-hidden="true" className="min-h-[60vh]" />;
  }

  if (heroMode === "hero") {
    return <AgentHero />;
  }

  return <ReturnHome featured={featured} />;
}

function ReturnHome({ featured }: { featured: Product[] }) {
  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <section>
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          The Tile · since 1990
        </p>
        <h1 className="mt-space-3 max-w-prose font-display text-4xl leading-tight text-ink md:text-5xl">
          Welcome back.
        </h1>
        <p className="mt-space-4 max-w-prose text-base text-ink-muted md:text-lg">
          Sixty collections of Italian porcelain stoneware, curated for Maltese
          homes. Tap the concierge anytime, or pick up where you left off.
        </p>
      </section>

      <section className="mt-space-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-ink md:text-3xl">
            A few we like this week
          </h2>
          <Link
            href="/collections"
            className="text-sm text-umber underline underline-offset-4 hover:text-umber-strong"
          >
            See all collections
          </Link>
        </div>

        <ul
          className={cn(
            "mt-space-5 grid gap-space-4",
            "grid-cols-2 md:grid-cols-3",
          )}
        >
          {featured.map((p) => (
            <li key={p.id}>
              <FeaturedCard product={p} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function FeaturedCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  return (
    <Link
      href={product.url}
      className={cn(
        "group block",
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
        "rounded-md",
      )}
    >
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-md bg-surface-muted",
        )}
      >
        {image?.src ? (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            fill
            sizes="(min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-base ease-out group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <p className="mt-space-2 text-sm font-medium text-ink">{product.name}</p>
      {product.summary ? (
        <p className="mt-space-1 line-clamp-2 text-xs text-ink-muted">
          {product.summary}
        </p>
      ) : null}
    </Link>
  );
}
