/**
 * Very small auth gate for /admin routes.
 *
 * Basic-auth against env-var credentials. This is sufficient for the
 * Phase-2 lightweight admin UI — non-sensitive operations, single-digit
 * users. Upgrade to a proper session/identity provider before exposing
 * any destructive endpoints.
 */

const REALM = 'The Tile admin';

export function getAdminCredentials(): { user: string; pass: string } | null {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return null;
  return { user, pass };
}

export function parseBasicAuth(
  headerValue: string | null | undefined,
): { user: string; pass: string } | null {
  if (!headerValue || !headerValue.toLowerCase().startsWith("basic ")) {
    return null;
  }
  try {
    const b64 = headerValue.slice(6).trim();
    const decoded =
      typeof atob === "function"
        ? atob(b64)
        : Buffer.from(b64, "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx === -1) return null;
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

export function unauthorizedResponse(): Response {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Express-style guard for Route Handlers. Returns `null` if the caller is
 * authenticated; otherwise returns a Response to be forwarded.
 *
 *   const unauth = requireAdmin(req);
 *   if (unauth) return unauth;
 */
export function requireAdmin(req: Request): Response | null {
  const creds = getAdminCredentials();
  // If ADMIN_USER / ADMIN_PASSWORD aren't configured we refuse entirely —
  // the admin UI is opt-in.
  if (!creds) {
    return new Response("Admin is disabled.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const provided = parseBasicAuth(req.headers.get("authorization"));
  if (!provided || provided.user !== creds.user || provided.pass !== creds.pass) {
    return unauthorizedResponse();
  }
  return null;
}
