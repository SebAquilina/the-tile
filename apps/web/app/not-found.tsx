import Link from "next/link";

export const metadata = {
  title: "Not found",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-prose flex-col justify-center px-space-5 py-space-10 md:px-space-7">
      <p className="text-xs uppercase tracking-widest text-ink-subtle">404</p>
      <h1 className="mt-space-3 font-display text-4xl leading-tight text-ink md:text-5xl">
        We could not find that page
      </h1>
      <p className="mt-space-5 text-lg text-ink-muted">
        The page may have moved, or the link might be from an older version of
        the site. A couple of places to start instead:
      </p>
      <ul className="mt-space-5 space-y-space-3 text-lg">
        <li>
          <Link
            href="/"
            className="text-umber underline underline-offset-4 hover:text-umber-strong"
          >
            The home page
          </Link>
          <span className="text-ink-muted"> — talk to the concierge.</span>
        </li>
        <li>
          <Link
            href="/collections"
            className="text-umber underline underline-offset-4 hover:text-umber-strong"
          >
            Browse all collections
          </Link>
          <span className="text-ink-muted"> — 60 series across nine effects.</span>
        </li>
        <li>
          <Link
            href="/contact"
            className="text-umber underline underline-offset-4 hover:text-umber-strong"
          >
            Contact the showroom
          </Link>
          <span className="text-ink-muted"> — we reply within two working days.</span>
        </li>
      </ul>
    </main>
  );
}
