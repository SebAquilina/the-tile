import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to The Tile — San Gwann, Malta. Email, phone, WhatsApp, or visit the showroom.",
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-prose px-space-5 md:px-space-7 py-space-10">
      <h1 className="font-display text-4xl">Contact</h1>
      <p className="mt-space-5 text-ink-muted">
        The full contact form arrives in Wave 3. In the meantime, visit us in San
        Gwann or send a note and we will be in touch.
      </p>
    </section>
  );
}
