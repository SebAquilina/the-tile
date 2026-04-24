/**
 * Feature-flagged Cloudflare Turnstile verification.
 *
 * When TURNSTILE_SECRET is unset, verification is a no-op that returns true —
 * this keeps local / Phase 0 dev unblocked per 04-backend-spec §7. A single
 * cold-start warning is emitted so the bypass is visible in logs.
 */

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

let bypassWarned = false;

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  action?: string;
  hostname?: string;
}

export async function verifyTurnstile(
  token: string | undefined,
  ip?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;

  if (!secret) {
    if (!bypassWarned) {
      bypassWarned = true;
      // eslint-disable-next-line no-console
      console.warn(
        "[turnstile] TURNSTILE_SECRET not set — verification bypassed (Phase 0 fallback).",
      );
    }
    return true;
  }

  if (!token) return false;

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(`[turnstile] verify HTTP ${res.status}`);
      return false;
    }
    const data = (await res.json()) as TurnstileVerifyResponse;
    return data.success === true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[turnstile] verify error: ${(err as Error).message}`);
    return false;
  }
}
