import { NextResponse } from "next/server";
import { z } from "zod";
import { setProductOverride, getProductOverride } from "@/lib/admin-store";

export const runtime = "nodejs";

const PatchSchema = z.object({
  inStock: z.boolean().optional(),
  showInCatalog: z.boolean().optional(),
  summary: z.string().min(10).max(300).optional(),
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
  const next = setProductOverride(params.id, parsed.data);
  return NextResponse.json({ ok: true, override: next });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  // Mark "not an override" by clearing all known fields — the overrides
  // file retains an empty object which `getProductOverride` still treats
  // as "no effective change". For a cleaner implementation, add a real
  // delete helper; the import surface here stays small.
  const existing = getProductOverride(params.id);
  if (!existing) return NextResponse.json({ ok: true, cleared: false });
  setProductOverride(params.id, {
    inStock: undefined,
    showInCatalog: undefined,
    summary: undefined,
  });
  return NextResponse.json({ ok: true, cleared: true });
}
