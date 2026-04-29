import { NextResponse } from "next/server";
import { z } from "zod";
import { listMenus, setMenu, type MenuItemType } from "@/lib/navigation/store";
import { requireAdmin } from "@/lib/auth";
import { revalidatePaths } from "@/lib/revalidate-map";

export const runtime = "edge";
const noStore = (b: unknown, init?: ResponseInit) =>
  NextResponse.json(b, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });

const Item: z.ZodType<MenuItemType> = z.lazy(() =>
  z.object({
    label: z.string().min(1).max(80),
    href: z.string().min(1).max(500),
    external: z.boolean().optional(),
    children: z.array(Item).max(20).optional(),
  })
);
const Body = z.object({ handle: z.string(), items: z.array(Item).max(50) });

export async function GET(req: Request) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  return noStore({ menus: await listMenus() });
}

export async function PUT(req: Request) {
  const a = await requireAdmin(req);
  if (!a.ok) return a.response;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStore({ ok: false, errors: parsed.error.issues }, { status: 400 });
  await setMenu(parsed.data.handle, parsed.data.items);
  revalidatePaths("menu.update");
  return noStore({ ok: true });
}
