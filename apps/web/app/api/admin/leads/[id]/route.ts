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
    const msg = (e as Error).message;
    if (msg === "not_found") {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    // Surface other failures so the inbox UI's optimistic update rolls back.
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true });
}
