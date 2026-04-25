import { z } from "zod";
import { ContactLeadSchema } from "@/lib/schemas";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendLeadEmail } from "@/lib/resend";
import { limit } from "@/lib/rate-limit";
import { hashIp, clientIp } from "@/lib/ip-hash";

export const runtime = 'edge';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ContactRequestSchema = ContactLeadSchema.extend({
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = ContactRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "validation", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { turnstileToken, ...lead } = parsed.data;

  // Rate limit: 5 submissions per IP per hour.
  const ipHash = await hashIp(request);
  const limited = limit(`contact:${ipHash}`, 5, 3600);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: "rate_limit" },
      { status: 429 },
    );
  }

  // Bot check (no-op in dev when TURNSTILE_SECRET is unset).
  const ok = await verifyTurnstile(turnstileToken, clientIp(request));
  if (!ok) {
    return Response.json(
      { ok: false, error: "bot-check" },
      { status: 400 },
    );
  }

  const leadId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Keep the console log for local debugging.
  // eslint-disable-next-line no-console
  console.log("[contact] new lead:", { leadId, ...lead });

  const email = await sendLeadEmail(lead);
  if (!email.ok) {
    // eslint-disable-next-line no-console
    console.warn("[contact] email deferred:", email.error);
    return Response.json({
      ok: true,
      leadId,
      emailStatus: "deferred",
    });
  }

  return Response.json({
    ok: true,
    leadId,
    emailStatus: "sent",
    emailId: email.id,
  });
}
