import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Showroom",
  description: "Visit the San Gwann showroom — see samples in person.",
};

export default function ShowroomPage() {
  return (
    <section className="mx-auto max-w-prose px-space-5 md:px-space-7 py-space-10">
      <h1 className="font-display text-4xl">Showroom</h1>
      <p className="mt-space-5 text-ink-muted">
        San Gwann, Malta. Hours and directions coming soon.
      </p>
    </section>
  );
}
