/**
 * Navigation menus. Public Header/Footer read via getMenu(handle).
 * Default seed values returned when the row doesn't exist (first run).
 */

import { z } from "zod";

const MenuItem: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    label: z.string().min(1).max(80),
    href: z.string().min(1).max(500),
    external: z.boolean().optional(),
    children: z.array(MenuItem).max(20).optional(),
  })
);

export const MenuItems = z.array(MenuItem).max(50);
export type MenuItemType = { label: string; href: string; external?: boolean; children?: MenuItemType[] };

const DEFAULTS: Record<string, MenuItemType[]> = {
  header: [
    { label: "Collections", href: "/collections" },
    { label: "Brands", href: "/brands" },
    { label: "Showroom", href: "/showroom" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  footer: [
    { label: "Collections", href: "/collections" },
    { label: "Brands", href: "/brands" },
    { label: "Showroom", href: "/showroom" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

function db(): D1Database | null {
  return (
    (process.env as unknown as { DB?: D1Database }).DB ??
    (globalThis as unknown as { DB?: D1Database }).DB ??
    null
  );
}

export async function getMenu(handle: string): Promise<MenuItemType[]> {
  const d = db();
  if (d) {
    try {
      const r = await d.prepare(`SELECT items_json FROM menus WHERE handle = ?`).bind(handle).first();
      if (r && (r as { items_json?: string }).items_json) {
        return JSON.parse((r as { items_json: string }).items_json);
      }
    } catch (e) { console.warn(`[menu] read failed: ${(e as Error).message}`); }
  }
  return DEFAULTS[handle] ?? [];
}

export async function listMenus(): Promise<{ handle: string; label: string; items: MenuItemType[]; version: number; updated_at: number }[]> {
  const d = db();
  const handles = ["header", "footer"];
  const out: { handle: string; label: string; items: MenuItemType[]; version: number; updated_at: number }[] = [];
  for (const h of handles) {
    let items: MenuItemType[] = DEFAULTS[h] ?? [];
    let version = 0;
    let updated_at = Date.now();
    if (d) {
      try {
        const r = await d.prepare(`SELECT items_json, version, updated_at FROM menus WHERE handle = ?`).bind(h).first();
        if (r) {
          items = JSON.parse((r as { items_json: string }).items_json);
          version = (r as { version: number }).version;
          updated_at = (r as { updated_at: number }).updated_at;
        }
      } catch { /* fallthrough to defaults */ }
    }
    out.push({ handle: h, label: h === "header" ? "Header navigation" : "Footer navigation", items, version, updated_at });
  }
  return out;
}

export async function setMenu(handle: string, items: MenuItemType[]): Promise<void> {
  const d = db();
  if (!d) throw new Error("db_unbound");
  const now = Date.now();
  const id = `menu-${handle}`;
  await d.prepare(
    `INSERT INTO menus (id, handle, label, items_json, version, updated_at)
     VALUES (?, ?, ?, ?, 0, ?)
     ON CONFLICT(handle) DO UPDATE SET
       items_json = excluded.items_json,
       version = menus.version + 1,
       updated_at = excluded.updated_at`
  ).bind(id, handle, handle === "header" ? "Header" : "Footer", JSON.stringify(items), now).run();
}
