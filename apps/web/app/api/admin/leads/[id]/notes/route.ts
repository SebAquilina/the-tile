import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { addNote, deleteNote, togglePin } from "@/lib/customer/store";

export const runtime = "edge";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const body = (await req.json().catch(() => ({}))) as { body?: string; pinned?: boolean };
  if (!body.body) return NextResponse.json({ ok: false, error: "body_required" }, { status: 400 });
  try {
    const note = await addNote(params.id, body.body, auth.user.email, !!body.pinned);
    return NextResponse.json({ ok: true, note });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const body = (await req.json().catch(() => ({}))) as { id?: string; action?: string };
  if (!body.id || body.action !== "toggle_pin")
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  await togglePin(params.id, body.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
  await deleteNote(params.id, body.id);
  return NextResponse.json({ ok: true });
}
