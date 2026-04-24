/**
 * Sentry — client-side config.
 *
 * No-op unless NEXT_PUBLIC_SENTRY_DSN is set. When set, @sentry/nextjs
 * must also be installed (add to dependencies; Phase 1 leaves it optional
 * so the build works without a Sentry project).
 */
type SentryLike = { init: (o: Record<string, unknown>) => void };

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN && typeof window !== "undefined") {
  (async () => {
    try {
      const pkg = "@sentry/nextjs";
      // Dynamic import through a string indirection — keeps the bundler
      // from trying to resolve the package when it is not installed.
      const mod = (await import(
        /* webpackIgnore: true */ /* @vite-ignore */ pkg
      )) as unknown;
      const Sentry = mod as SentryLike;
      Sentry.init({
        dsn: DSN,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? "production",
        tracesSampleRate: 0.1,
        replaysOnErrorSampleRate: 0.0,
        replaysSessionSampleRate: 0.0,
        beforeSend(event: Record<string, unknown>) {
          const req = event.request as Record<string, unknown> | undefined;
          if (req?.headers) delete (req.headers as Record<string, unknown>)["cookie"];
          const user = event.user as Record<string, unknown> | undefined;
          if (user) {
            delete user.email;
            delete user.ip_address;
          }
          const extra = event.extra as Record<string, unknown> | undefined;
          if (extra) {
            for (const k of Object.keys(extra)) {
              if (/email|phone|password|token|key/i.test(k)) {
                extra[k] = "[scrubbed]";
              }
            }
          }
          return event;
        },
      });
    } catch {
      // Sentry not installed — stay silent.
    }
  })();
}

export {};
