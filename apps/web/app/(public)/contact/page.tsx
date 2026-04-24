import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ContactForm } from "@/components/forms/ContactForm";
import { BUSINESS } from "@/lib/business-info";

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
            We read every note and reply within {BUSINESS.replyWithin}, usually
            the same day if it lands before lunch.
          </p>

          <ContactForm />
        </section>

        <aside className="md:pt-space-10">
          <div className="rounded-md border border-line bg-surface p-space-5">
            <p className="text-xs uppercase tracking-widest text-ink-subtle">
              Other ways to reach us
            </p>
            <dl className="mt-space-4 space-y-space-4 text-sm">
              <div>
                <dt className="text-ink-subtle">Email</dt>
                <dd className="mt-space-1">
                  <a
                    href={`mailto:${BUSINESS.email}`}
                    className="text-umber underline underline-offset-4 hover:text-umber-strong"
                  >
                    {BUSINESS.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Phone</dt>
                <dd className="mt-space-1">
                  <a
                    href={`tel:${BUSINESS.phoneTel}`}
                    className="text-ink hover:underline underline-offset-4"
                  >
                    {BUSINESS.phoneDisplay}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-ink-subtle">WhatsApp</dt>
                <dd className="mt-space-1">
                  <a
                    href={BUSINESS.whatsappLink}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-ink hover:underline underline-offset-4"
                  >
                    {BUSINESS.whatsapp}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Showroom</dt>
                <dd className="mt-space-1 text-ink">
                  {BUSINESS.streetAddress}
                  <br />
                  {BUSINESS.locality} {BUSINESS.postalCode}
                  <br />
                  {BUSINESS.region}
                </dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Hours</dt>
                <dd className="mt-space-1 text-sm text-ink-muted">
                  {BUSINESS.hoursSummary.map((h) => (
                    <div key={h.label} className="flex justify-between gap-space-3">
                      <span>{h.label}</span>
                      <span className="text-ink">{h.value}</span>
                    </div>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Social</dt>
                <dd className="mt-space-1 flex flex-wrap gap-space-3 text-sm">
                  <a
                    href={BUSINESS.social.facebook}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-umber underline underline-offset-4 hover:text-umber-strong"
                  >
                    Facebook
                  </a>
                  <a
                    href={BUSINESS.social.instagram}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-umber underline underline-offset-4 hover:text-umber-strong"
                  >
                    Instagram
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
