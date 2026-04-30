import { NextResponse } from "next/server";
import { z } from "zod";
import { updateLeadStatus } from "@/lib/admin-store";

export const runtime = "edge";
const PatchSchema = z.object({
  status: z.enum(["new", "replied", "archived"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    await updateLeadStatus(params.id, parsed.data.status);
  } catch (e) {
    // Surface the failure so the inbox UI's optimistic update rolls back.
    // Per phantom-UI audit P0 #2.
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true });
}
