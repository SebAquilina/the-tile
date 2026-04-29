import { NextResponse } from "next/server";
import { AgentInput, getAgentSettings, setAgentSettings } from "@/lib/agent-config/store";
import { requireAdmin } from "@/lib/auth";
import { revalidatePaths } from "@/lib/revalidate-map";

export const runtime = "edge";
const noStore = (b: unknown, init?: ResponseInit) =>
  NextResponse.json(b, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });

export async function GET(req: Request) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  return noStore({ agent: await getAgentSettings() });
}

export async function PUT(req: Request) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const parsed = AgentInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStore({ ok: false, errors: parsed.error.issues }, { status: 400 });
  const updated = await setAgentSettings(parsed.data);
  revalidatePaths("agent.prompt");
  return noStore({ ok: true, agent: updated });
}
