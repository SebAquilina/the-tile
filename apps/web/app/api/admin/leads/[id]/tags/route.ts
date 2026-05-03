import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { addTag, removeTag } from "@/lib/customer/store";

export const runtime = "edge";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const body = (await req.json().catch(() => ({}))) as { tag?: string; color?: string };
  if (!body.tag) return NextResponse.json({ ok: false, error: "tag_required" }, { status: 400 });
  try {
    const tag = await addTag(params.id, body.tag, auth.user.email, body.color);
    return NextResponse.json({ ok: true, tag });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const body = (await req.json().catch(() => ({}))) as { tag?: string };
  if (!body.tag) return NextResponse.json({ ok: false, error: "tag_required" }, { status: 400 });
  await removeTag(params.id, body.tag);
  return NextResponse.json({ ok: true });
}
