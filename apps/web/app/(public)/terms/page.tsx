import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for The Tile.",
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-prose px-space-5 md:px-space-7 py-space-10">
      <h1 className="font-display text-4xl">Terms of use</h1>
      <p className="mt-space-5 text-ink-muted">Coming soon.</p>
    </section>
  );
}
