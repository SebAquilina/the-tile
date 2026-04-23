import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brands",
  description: "The Italian manufacturers we carry.",
};

export default function BrandsPage() {
  return (
    <section className="mx-auto max-w-prose px-space-5 md:px-space-7 py-space-10">
      <h1 className="font-display text-4xl">Brands</h1>
      <p className="mt-space-5 text-ink-muted">
        Emilceramica, Emilgroup, Ergon, Provenza, Viva — and more. Full brand pages coming soon.
      </p>
    </section>
  );
}
