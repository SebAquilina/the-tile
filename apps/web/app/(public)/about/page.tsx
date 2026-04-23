import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Porcelain stoneware specialists in San Gwann, Malta — since 1990.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-prose px-space-5 md:px-space-7 py-space-10">
      <h1 className="font-display text-4xl">About The Tile</h1>
      <p className="mt-space-5 text-ink-muted">
        Thirty years of quiet curation on the island of Malta. This page is coming soon.
      </p>
    </section>
  );
}
