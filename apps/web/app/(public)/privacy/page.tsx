import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How The Tile handles your personal data under GDPR.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
      />

      <article className="mt-space-7 max-w-prose space-y-space-5">
        <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">
          Privacy notice
        </h1>

        <p className="text-sm italic text-ink-subtle">
          Phase 1 draft — please have your solicitor review before launch.
        </p>

        <p className="text-ink-muted">
          This notice describes how The Tile (San Gwann, Malta) handles
          personal data under the General Data Protection Regulation (GDPR)
          and the Data Protection Act (Malta, Cap. 586).
        </p>

        <h2 className="font-display text-2xl text-ink">Who we are</h2>
        <p className="text-ink-muted">
          The Tile is the trading name of the porcelain-stoneware retailer at
          San Gwann, Malta, operating since 1990. The data controller for any
          personal data collected via this website is The Tile. You can reach
          us at{" "}
          <a
            href="mailto:hello@the-tile.com"
            className="text-umber underline underline-offset-4 hover:text-umber-strong"
          >
            hello@the-tile.com
          </a>
          .
        </p>

        <h2 className="font-display text-2xl text-ink">What we collect</h2>
        <ul className="list-disc space-y-space-2 pl-space-6 text-ink-muted">
          <li>
            <strong className="text-ink">Contact form submissions.</strong>{" "}
            Your name, email, optional phone number, preferred contact method,
            and the project notes you write.
          </li>
          <li>
            <strong className="text-ink">Agent conversations.</strong> The
            messages you exchange with the concierge on the home page. These
            are processed by Gemini (Google) for response generation and
            retained briefly in transit only.
          </li>
          <li>
            <strong className="text-ink">Aggregate analytics.</strong> If
            analytics is enabled, we use Plausible, which does not set cookies
            and does not collect personal data. Page views and custom events
            only.
          </li>
        </ul>

        <h2 className="font-display text-2xl text-ink">Why we process it</h2>
        <p className="text-ink-muted">
          To respond to your enquiry, prepare a quotation, or answer a
          question. The lawful bases we rely on: your explicit consent when
          you submit a form, and our legitimate interest in running the
          showroom.
        </p>

        <h2 className="font-display text-2xl text-ink">How long we keep it</h2>
        <p className="text-ink-muted">
          Lead enquiries are retained for up to 18 months from last contact,
          after which they are deleted unless you have become an active
          customer. Agent conversations are not persisted to our database in
          this phase.
        </p>

        <h2 className="font-display text-2xl text-ink">Your rights</h2>
        <p className="text-ink-muted">
          You can request access to, correction of, or deletion of your data
          at any time by emailing{" "}
          <a
            href="mailto:hello@the-tile.com"
            className="text-umber underline underline-offset-4 hover:text-umber-strong"
          >
            hello@the-tile.com
          </a>
          . You also have the right to lodge a complaint with the Information
          and Data Protection Commissioner of Malta.
        </p>

        <h2 className="font-display text-2xl text-ink">Third parties</h2>
        <p className="text-ink-muted">
          We use Google (Gemini API), Cloudflare (hosting, bot protection),
          Resend (transactional email), and Plausible (analytics). None of
          these services sell your data.
        </p>

        <p className="text-sm text-ink-subtle">Last updated: April 2026.</p>
      </article>
    </div>
  );
}
