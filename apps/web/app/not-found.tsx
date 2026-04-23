import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-prose flex-col items-start justify-center px-6 py-20">
      <p className="text-sm uppercase tracking-widest text-ink-subtle">404</p>
      <h1 className="mt-4 font-display text-4xl">Not found</h1>
      <p className="mt-4 text-ink-muted">
        The page you were looking for has moved, or never existed.
      </p>
      <Link href="/" className="mt-8 text-umber underline-offset-4 hover:underline">
        Return to the home page
      </Link>
    </main>
  );
}
