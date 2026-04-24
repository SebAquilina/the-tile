type SentryLike = { init: (o: Record<string, unknown>) => void };

const DSN = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  (async () => {
    try {
      const pkg = "@sentry/nextjs";
      const mod = (await import(
        /* webpackIgnore: true */ /* @vite-ignore */ pkg
      )) as unknown;
      const Sentry = mod as SentryLike;
      Sentry.init({
        dsn: DSN,
        environment: process.env.SENTRY_ENV ?? "production",
        tracesSampleRate: 0.05,
        beforeSend(event: Record<string, unknown>) {
          const req = event.request as Record<string, unknown> | undefined;
          if (req) {
            delete req.data;
            delete req.cookies;
          }
          return event;
        },
      });
    } catch {
      // Sentry not installed — no-op.
    }
  })();
}

export {};
