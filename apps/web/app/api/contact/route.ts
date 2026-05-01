import { z } from "zod";
import { ContactLeadSchema } from "@/lib/schemas";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendLeadEmail } from "@/lib/resend";
import { limit } from "@/lib/rate-limit";
import { hashIp, clientIp } from "@/lib/ip-hash";

export const runtime = 'edge';
export const dynamic = "force-dynamic";

const ContactRequestSchema = ContactLeadSchema.extend({
  turnstileToken: z.string().optional(),
});

/**
 * Lead intake — v1.9 hardened per ref 19 § Class 9 (no silent drops).
 *
 * v1.x bug: the lead was console.log'd and sendLeadEmail was called, but
 * never inserted into the D1 `leads` table. If Resend deferred (or wasn't
 * wired), the customer got "ok" and the lead was lost forever.
 *
 * Fix: persist to D1 first. KV dead-letter on D1 failure. Honest 5xx if
 * neither works. Email is best-effort and never blocks the lead.
 */
export async function POST(request: Request): Promise<Response> {
  // Per round-3 audit: enforce request size cap at the edge before parse.
  const cl = Number(request.headers.get("content-length") || 0);
  if (cl > 32 * 1024) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ ok: false, error: "invalid_json" }, { status: 400 }); }

  const parsed = ContactRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "validation", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { turnstileToken, ...lead } = parsed.data;

  // Rate limit: 5 / IP / hour.
  const ipHash = await hashIp(request);
  const limited = limit(`contact:${ipHash}`, 5, 3600);
  if (!limited.ok) return Response.json({ ok: false, error: "rate_limit" }, { status: 429 });

  // Bot check (no-op if TURNSTILE_SECRET unset).
  const ok = await verifyTurnstile(turnstileToken, clientIp(request));
  if (!ok) return Response.json({ ok: false, error: "bot-check" }, { status: 400 });

  const leadId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const ua = request.headers.get("user-agent") || null;

  // 1. Persist to D1.
  const d = (process.env as unknown as { DB?: D1Database }).DB;
  let storedVia: "primary" | "dead-letter" | "failed" = "failed";
  if (d) {
    try {
      await d
        .prepare(
          `INSERT INTO leads (
             id, name, email, phone, preferred_contact_method, message,
             save_list_ids, ip_hash, user_agent, consent_given,
             email_status, email_attempts, email_last_error, created_at
           ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        )
        .bind(
          leadId,
          lead.name,
          lead.email,
          lead.phone ?? null,
          lead.preferredContactMethod ?? null,
          lead.message,
          lead.saveListIds ? JSON.stringify(lead.saveListIds) : null,
          ipHash,
          ua,
          lead.consentGiven ? 1 : 0,
          "pending",
          0,
          null,
          createdAt
        )
        .run();
      storedVia = "primary";
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[contact] D1 insert failed:", (e as Error).message);
    }
  } else {
    // eslint-disable-next-line no-console
    console.error("[contact] DB binding missing");
  }

  // KV dead-letter fallback (per ref 19 § Class 9).
  if (storedVia === "failed") {
    const dl = (process.env as unknown as { DEAD_LETTER?: KVNamespace }).DEAD_LETTER;
    if (dl) {
      try {
        await dl.put(
          `lead/${leadId}`,
          JSON.stringify({ id: leadId, ...lead, ipHash, ua, createdAt }),
          { expirationTtl: 60 * 60 * 24 * 90 }
        );
        storedVia = "dead-letter";
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[contact] dead-letter failed:", (e as Error).message);
      }
    }
  }

  if (storedVia === "failed") {
    // Honest 5xx — never silently drop the lead.
    return Response.json(
      { ok: false, error: "storage_unavailable", id: leadId },
      { status: 503 },
    );
  }

  // 2. Best-effort email. If Resend defers, lead is still safe in D1.
  let emailStatus: "sent" | "deferred" = "deferred";
  let emailId: string | undefined;
  try {
    const email = await sendLeadEmail(lead);
    if (email.ok) {
      emailStatus = "sent";
      emailId = email.id;
      if (d && storedVia === "primary") {
        await d
          .prepare(`UPDATE leads SET email_status = 'sent' WHERE id = ?`)
          .bind(leadId)
          .run()
          .catch(() => {});
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn("[contact] email deferred:", email.error);
      if (d && storedVia === "primary") {
        await d
          .prepare(`UPDATE leads SET email_status = 'deferred', email_last_error = ? WHERE id = ?`)
          .bind(email.error || "unknown", leadId)
          .run()
          .catch(() => {});
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[contact] email threw:", (e as Error).message);
  }

  return Response.json({
    ok: true,
    leadId,
    storedVia,
    emailStatus,
    emailId,
  });
}
