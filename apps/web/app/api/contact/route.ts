import { ContactLeadSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TODO(phase-0): Turnstile verification, rate-limit per IP hash,
//                D1 insert into `leads`, Resend email dispatch with retry.

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = ContactLeadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "validation", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const leadId = `demo-${Date.now()}`;

  // eslint-disable-next-line no-console
  console.log("[contact] new lead:", { leadId, ...parsed.data });

  return Response.json({ ok: true, leadId });
}
