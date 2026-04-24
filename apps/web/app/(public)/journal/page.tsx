import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import {
  estimateReadingMinutes,
  getAllJournalPosts,
} from "@/lib/journal";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Notes from the showroom — tile choices, material behaviour, and Mediterranean interiors.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function JournalIndex() {
  const posts = getAllJournalPosts();

  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Journal" }]} />

      <header className="mt-space-7 max-w-prose">
        <p className="text-xs uppercase tracking-widest text-ink-subtle">
          Journal
        </p>
        <h1 className="mt-space-3 font-display text-4xl leading-tight text-ink md:text-5xl">
          Notes from the showroom
        </h1>
        <p className="mt-space-5 text-lg text-ink-muted">
          Short pieces on the material decisions that show up in our showroom
          most often — finishes, formats, durability, the questions worth
          asking before you buy a square metre of anything.
        </p>
      </header>

      <ul className="mt-space-10 divide-y divide-line border-y border-line">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/journal/${p.slug}`}
              className="group block py-space-6 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
            >
              <div className="flex flex-wrap items-baseline gap-space-3 text-xs uppercase tracking-widest text-ink-subtle">
                <span>{formatDate(p.publishedAt)}</span>
                <span aria-hidden="true">·</span>
                <span>{estimateReadingMinutes(p.body)} min read</span>
              </div>
              <h2 className="mt-space-3 font-display text-2xl text-ink group-hover:text-umber-strong md:text-3xl">
                {p.title}
              </h2>
              <p className="mt-space-3 max-w-prose text-ink-muted">{p.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
