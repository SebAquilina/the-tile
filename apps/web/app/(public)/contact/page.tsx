import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact — The Tile",
  description:
    "Talk to The Tile — San Gwann, Malta. Email, phone, WhatsApp, or visit the showroom. Tell us about the room you are working on.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

      <div className="mt-space-7 grid gap-space-10 md:grid-cols-[1fr_minmax(0,320px)]">
        <section className="max-w-prose">
          <p className="text-xs uppercase tracking-widest text-ink-subtle">
            Say hello
          </p>
          <h1 className="mt-space-3 font-display text-4xl leading-tight text-ink md:text-5xl">
            Tell us about the room
          </h1>
          <p className="mt-space-5 text-lg text-ink-muted">
            Size, light, timeline, a mood you are chasing — whatever you have.
            We read every note and reply within two working days, usually the
            same day if it lands before lunch.
          </p>

          <ContactForm />
        </section>

        <aside className="md:pt-space-10">
          <div className="rounded-md border border-line bg-surface p-space-5">
            <p className="text-xs uppercase tracking-widest text-ink-subtle">
              Other ways to reach us
            </p>
            <dl className="mt-space-4 space-y-space-3 text-sm">
              <div>
                <dt className="text-ink-subtle">Email</dt>
                <dd className="mt-space-1">
                  <a
                    href="mailto:hello@the-tile.com"
                    className="text-umber underline underline-offset-4 hover:text-umber-strong"
                  >
                    hello@the-tile.com
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Phone</dt>
                <dd className="mt-space-1 text-ink">+356 XXXX XXXX</dd>
              </div>
              <div>
                <dt className="text-ink-subtle">WhatsApp</dt>
                <dd className="mt-space-1 text-ink">+356 XXXX XXXX</dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Showroom</dt>
                <dd className="mt-space-1 text-ink">
                  Triq X, San Gwann, Malta
                  <br />
                  <span className="text-ink-muted">
                    Monday to Saturday · 9:00 – 18:00
                  </span>
                </dd>
              </div>
            </dl>
            <p className="mt-space-4 text-xs italic text-ink-subtle">
              Contact details pending final confirmation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
