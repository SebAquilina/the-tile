import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Phase 1 security headers. Edge-compatible middleware running on every
 * non-static request. The CSP is restrictive but demo-friendly — it whitelists
 * the integrations we currently use (Plausible, Sentry, Turnstile, Gemini).
 */

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://plausible.io https://*.ingest.sentry.io",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://generativelanguage.googleapis.com https://plausible.io https://*.ingest.sentry.io https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("Content-Security-Policy", CSP_DIRECTIVES);
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
