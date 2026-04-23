/**
 * Sentry init stubs — Phase 1 no-op.
 *
 * Full Sentry integration (source-maps, tracing, beforeSend PII scrub) is a
 * Phase 2 lift per 04-backend-spec §5. For now we keep a thin `captureException`
 * surface so call-sites can be written once and will "come alive" the moment
 * NEXT_PUBLIC_SENTRY_DSN is configured AND the optional `@sentry/nextjs`
 * package is installed.
 *
 * The dynamic import is guarded in a try/catch so builds succeed even when
 * `@sentry/nextjs` is not listed in package.json — this is the intended state
 * in Phase 0/1. Do not add @sentry/nextjs to package.json as part of Phase 1.
 */

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

type SentryLike = {
  captureException: (err: unknown, context?: unknown) => void;
};

let loaded: Promise<SentryLike | null> | null = null;

async function loadSentry(): Promise<SentryLike | null> {
  if (!DSN) return null;
  if (!loaded) {
    loaded = (async () => {
      try {
        // @sentry/nextjs is an optional peer; may not be installed in Phase 1.
        // Using a string indirection so the bundler does not try to resolve it.
        const pkg = "@sentry/nextjs";
        const mod = await import(/* webpackIgnore: true */ /* @vite-ignore */ pkg);
        return mod as unknown as SentryLike;
      } catch {
        // Module not installed — stay in no-op mode for the rest of the
        // process lifetime. Don't log; the DSN being set but the package
        // missing is an expected Phase 1 state.
        return null;
      }
    })();
  }
  return loaded;
}

export function captureException(
  err: unknown,
  context?: Record<string, unknown>,
): void {
  if (!DSN) return;
  // Fire-and-forget — we never want the caller to await Sentry.
  loadSentry()
    .then((s) => {
      if (s) s.captureException(err, context ? { extra: context } : undefined);
    })
    .catch(() => undefined);
}

export function isSentryEnabled(): boolean {
  return Boolean(DSN);
}
