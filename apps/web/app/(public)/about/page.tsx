import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Porcelain stoneware specialists in San Gwann, Malta — since 1990.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-prose px-6 py-20">
      <h1 className="font-display text-4xl">About The Tile</h1>
      <p className="mt-6 text-ink-muted">
        Thirty years of quiet curation on the island of Malta. This page is coming soon.
      </p>
    </main>
  );
}
