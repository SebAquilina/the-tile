import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal",
  description: "Notes on tile, texture, and Mediterranean interiors.",
};

export default function JournalPage() {
  return (
    <main className="mx-auto max-w-prose px-6 py-20">
      <h1 className="font-display text-4xl">Journal</h1>
      <p className="mt-6 text-ink-muted">Articles arriving at launch.</p>
    </main>
  );
}
