/**
 * Edge-compatible IP hashing for rate-limit keys. Never stored as identity —
 * per 04-backend-spec §2 the `leads.ip_hash` column is for abuse detection
 * only. Web Crypto SHA-256, first 16 hex chars.
 */

const FALLBACK_SALT = "dev-salt";

function getIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    // XFF is a comma-separated list; first entry is the origin client.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  return "unknown";
}

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export async function hashIp(request: Request): Promise<string> {
  const ip = getIp(request);
  const salt = process.env.IP_HASH_SALT ?? FALLBACK_SALT;
  const data = new TextEncoder().encode(`${ip}:${salt}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest).slice(0, 16);
}

export function clientIp(request: Request): string {
  return getIp(request);
}
