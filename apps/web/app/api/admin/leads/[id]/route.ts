import { NextResponse } from "next/server";
import { z } from "zod";
import { updateLeadStatus } from "@/lib/admin-store";

export const runtime = "nodejs";

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
  updateLeadStatus(params.id, parsed.data.status);
  return NextResponse.json({ ok: true });
}
