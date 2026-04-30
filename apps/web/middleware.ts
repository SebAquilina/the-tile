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

export async function middleware(request: NextRequest) {
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


  // Per ref 19 § Class 2 redirect engine — read /redirects table and 301.
  // Per audit P1-F8: do NOT skip paths containing "." — that kills .html
  // legacy redirects (`/old-product.html → /products/new`). Instead skip
  // only known static asset extensions.
  const ASSET_EXT = /\.(?:css|js|mjs|json|svg|png|jpg|jpeg|webp|gif|ico|woff2?|ttf|eot|mp4|webm|map|txt|xml)$/i;
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/") && !ASSET_EXT.test(pathname)) {
    try {
      const { getRedirectMap } = await import("@/lib/redirects/store");
      const map = await getRedirectMap();
      const hit = map.get(pathname);
      if (hit) {
        const dest = hit.to_path.startsWith("http")
          ? hit.to_path
          : new URL(hit.to_path, request.nextUrl.origin).toString();
        // Per audit P0-F4: refuse to follow a redirect that would land on
        // the same URL (defence-in-depth — store-level Zod refine should
        // already reject these on insert).
        if (dest === request.nextUrl.toString() || hit.to_path === pathname) {
          console.warn("[middleware.redirects] refusing self-loop:", pathname, "->", hit.to_path);
        } else {
          return withSecurityHeaders(NextResponse.redirect(dest, hit.status_code));
        }
      }
    } catch (e) {
      console.warn("[middleware.redirects] failed:", (e as Error).message);
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
