/**
 * Auth shim — adapts the existing `lib/admin-auth.requireAdmin(req)`
 * (returns Response|null) into the contract my v1.10 admin route handlers
 * expect: `{ ok: true, user } | { ok: false, response }`.
 *
 * Both contracts are equivalent — this just adapts the shape.
 */
import { requireAdmin as basicRequire, parseBasicAuth, getAdminCredentials } from "./admin-auth";

type Auth =
  | { ok: true; user: { id: string; email: string; role: string } }
  | { ok: false; response: Response };

export async function requireAdmin(req: Request): Promise<Auth> {
  const blocked = basicRequire(req);
  if (blocked) return { ok: false, response: blocked };
  const creds = parseBasicAuth(req.headers.get("authorization"));
  return {
    ok: true,
    user: { id: creds?.user || "admin", email: creds?.user || "admin", role: "owner" },
  };
}

// Page-level guard not needed in this repo — middleware.ts already gates
// /admin/* before pages render. Provide a no-op for compatibility.
export async function requireAdminPage(): Promise<{ id: string; email: string; role: string }> {
  return { id: "admin", email: "admin", role: "owner" };
}
