import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Save list",
  description: "The tiles you've shortlisted.",
};

export default function SaveListPage() {
  return (
    <section className="mx-auto max-w-content px-space-5 md:px-space-7 py-space-10">
      <h1 className="font-display text-4xl">Your save list</h1>
      <p className="mt-space-5 text-ink-muted">
        Loading your selections. Full page wires up with the catalog in Wave 3.
      </p>
    </section>
  );
}
