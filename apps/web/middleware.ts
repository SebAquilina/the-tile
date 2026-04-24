import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseBasicAuth } from "@/lib/admin-auth";

/**
 * Phase 1 security headers + Phase 2 admin-area basic auth. Edge-compatible.
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

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("Content-Security-Policy", CSP_DIRECTIVES);
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return res;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin-area gate: HTTP Basic against env-var credentials.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const user = process.env.ADMIN_USER;
    const pass = process.env.ADMIN_PASSWORD;

    if (!user || !pass) {
      return withSecurityHeaders(
        new NextResponse("Admin is disabled. Configure ADMIN_USER and ADMIN_PASSWORD.", {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        }),
      );
    }

    const provided = parseBasicAuth(request.headers.get("authorization"));
    if (!provided || provided.user !== user || provided.pass !== pass) {
      return withSecurityHeaders(
        new NextResponse("Unauthorized", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="The Tile admin", charset="UTF-8"',
            "Cache-Control": "no-store",
          },
        }),
      );
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
