import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brands",
  description: "The Italian manufacturers we carry.",
};

export default function BrandsPage() {
  return (
    <main className="mx-auto max-w-prose px-6 py-20">
      <h1 className="font-display text-4xl">Brands</h1>
      <p className="mt-6 text-ink-muted">
        Emilceramica, Emilgroup, Ergon, Provenza, Viva — and more. Full brand pages coming soon.
      </p>
    </main>
  );
}
