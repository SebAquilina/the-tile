import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How The Tile handles your personal data under GDPR.",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-prose px-space-5 md:px-space-7 py-space-10">
      <h1 className="font-display text-4xl">Privacy policy</h1>
      <p className="mt-space-5 text-ink-muted">Coming soon.</p>
    </section>
  );
}
