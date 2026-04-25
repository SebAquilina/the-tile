
export const runtime = 'edge';
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json({ ok: true, time: new Date().toISOString() });
}
