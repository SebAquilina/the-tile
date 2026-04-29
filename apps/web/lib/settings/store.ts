/**
 * Site settings (singleton). Reads on the public side: site title in
 * <head>, contact email/phone in footer, robots.txt, plausible domain.
 */

import { z } from "zod";

export const SettingsInput = z.object({
  store_name: z.string().min(1).max(160),
  contact_email: z.string().email().max(200).optional(),
  contact_phone: z.string().max(40).optional(),
  address: z.string().max(500).optional(),
  hours: z.string().max(500).optional(),
  currency: z.string().length(3).default("EUR"),
  timezone: z.string().max(60).default("Europe/Malta"),
  default_locale: z.string().max(8).default("en"),
  robots_txt_extra: z.string().max(2000).optional(),
  google_analytics_id: z.string().max(40).optional(),
  plausible_domain: z.string().max(120).optional(),
});

export type SettingsInputType = z.infer<typeof SettingsInput>;
export type SettingsRow = SettingsInputType & { version: number; updated_at: number };

const DEFAULT: SettingsRow = {
  store_name: "the tile",
  contact_email: "info@the-tile.com",
  contact_phone: "+356 XXXX XXXX",
  address: "the tile, Malta",
  hours: "Mon–Fri 09:00–18:00 · Sat 09:00–13:00",
  currency: "EUR",
  timezone: "Europe/Malta",
  default_locale: "en",
  robots_txt_extra: "",
  google_analytics_id: "",
  plausible_domain: "",
  version: 0,
  updated_at: Date.now(),
};

function db(): D1Database | null {
  return (globalThis as unknown as { DB?: D1Database }).DB ?? null;
}

export async function getSettings(): Promise<SettingsRow> {
  const d = db();
  if (!d) return DEFAULT;
  try {
    const r = await d.prepare(`SELECT * FROM site_settings WHERE id = 'singleton'`).first();
    if (!r) return DEFAULT;
    return { ...DEFAULT, ...(r as SettingsRow) };
  } catch { return DEFAULT; }
}

export async function setSettings(input: SettingsInputType): Promise<SettingsRow> {
  const d = db();
  if (!d) throw new Error("db_unbound");
  const now = Date.now();
  await d.prepare(
    `INSERT INTO site_settings (id, store_name, contact_email, contact_phone, address, hours,
       currency, timezone, default_locale, robots_txt_extra, google_analytics_id, plausible_domain,
       version, updated_at)
     VALUES ('singleton', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       store_name = excluded.store_name,
       contact_email = excluded.contact_email,
       contact_phone = excluded.contact_phone,
       address = excluded.address,
       hours = excluded.hours,
       currency = excluded.currency,
       timezone = excluded.timezone,
       default_locale = excluded.default_locale,
       robots_txt_extra = excluded.robots_txt_extra,
       google_analytics_id = excluded.google_analytics_id,
       plausible_domain = excluded.plausible_domain,
       version = site_settings.version + 1,
       updated_at = excluded.updated_at`
  ).bind(
    input.store_name,
    input.contact_email ?? null,
    input.contact_phone ?? null,
    input.address ?? null,
    input.hours ?? null,
    input.currency,
    input.timezone,
    input.default_locale,
    input.robots_txt_extra ?? null,
    input.google_analytics_id ?? null,
    input.plausible_domain ?? null,
    now
  ).run();
  return await getSettings();
}
