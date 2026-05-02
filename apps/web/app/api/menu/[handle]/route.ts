import { NextResponse } from "next/server";
import { getMenu } from "@/lib/navigation/store";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Per ref 22 + ref 34 admin-public coverage SOP — Footer reads this at
 * hydration time so /admin/navigation edits reach the public site without
 * waiting for ISR revalidate (which under next-on-pages doesn't always
 * fire). Client-side fetch is a clean way to bridge: layout stays static,
 * footer hydrates with fresh data.
 */
export async function GET(_req: Request, { params }: { params: { handle: string } }) {
  const items = await getMenu(params.handle);
  return NextResponse.json(
    { handle: params.handle, items },
    { headers: { "Cache-Control": "no-store" } },
  );
}
