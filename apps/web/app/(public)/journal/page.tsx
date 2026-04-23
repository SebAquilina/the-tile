import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal",
  description: "Notes on tile, texture, and Mediterranean interiors.",
};

export default function JournalPage() {
  return (
    <section className="mx-auto max-w-prose px-space-5 md:px-space-7 py-space-10">
      <h1 className="font-display text-4xl">Journal</h1>
      <p className="mt-space-5 text-ink-muted">Articles arriving at launch.</p>
    </section>
  );
}
