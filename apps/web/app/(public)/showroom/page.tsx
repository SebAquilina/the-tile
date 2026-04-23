import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Showroom",
  description: "Visit the San Gwann showroom — see samples in person.",
};

export default function ShowroomPage() {
  return (
    <main className="mx-auto max-w-prose px-6 py-20">
      <h1 className="font-display text-4xl">Showroom</h1>
      <p className="mt-6 text-ink-muted">
        San Gwann, Malta. Hours and directions coming soon.
      </p>
    </main>
  );
}
