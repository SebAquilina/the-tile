import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Save list",
  description: "The tiles you've shortlisted.",
};

export default function SaveListPage() {
  return (
    <main className="mx-auto max-w-content px-6 py-20">
      <h1 className="font-display text-4xl">Your save list</h1>
      <p className="mt-6 text-ink-muted">
        Loading your selections. Full page wires up with the catalog in Wave 3.
      </p>
    </main>
  );
}
