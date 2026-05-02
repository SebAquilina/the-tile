/**
 * Theme settings (singleton). Tokens injected into the public layout's
 * <head> as a runtime <style> block — no rebuild needed when changed.
 */

import { z } from "zod";

const HEX = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "must be a hex color");

export const ThemeTokens = z.object({
  primary: HEX,
  primary_hover: HEX,
  on_primary: HEX,
  secondary: HEX,
  on_secondary: HEX,
  accent: HEX,
  text: HEX,
  bg: HEX,
  surface: HEX,
  muted: HEX,
  border: HEX,
});

export type ThemeTokensType = z.infer<typeof ThemeTokens>;

export const ThemeInput = z.object({
  tokens: ThemeTokens,
  custom_css: z.string().max(20_000).optional(),
  logo_src: z.string().url().optional(),
  logo_alt: z.string().max(280).optional(),
  favicon_src: z.string().url().optional(),
  og_default_src: z.string().url().optional(),
});

const DEFAULT: ThemeTokensType = {
  primary: "#73becf",
  primary_hover: "#5ca7b8",
  on_primary: "#ffffff",
  secondary: "#dd5857",
  on_secondary: "#ffffff",
  accent: "#dd5857",
  text: "#000000",
  bg: "#ffffff",
  surface: "#ffffff",
  muted: "#555555",
  border: "#e6e6e6",
};

function db(): D1Database | null {
  return (
    (process.env as unknown as { DB?: D1Database }).DB ??
    (globalThis as unknown as { DB?: D1Database }).DB ??
    null
  );
}

export type ThemeRow = {
  tokens: ThemeTokensType;
  custom_css: string | null;
  logo_src: string | null;
  logo_alt: string | null;
  favicon_src: string | null;
  og_default_src: string | null;
  version: number;
  updated_at: number;
};

export async function getTheme(): Promise<ThemeRow> {
  const d = db();
  if (d) {
    try {
      const r = await d.prepare(`SELECT * FROM theme_settings WHERE id = 'singleton'`).first();
      if (r) {
        return {
          tokens: JSON.parse((r as { tokens_json: string }).tokens_json),
          custom_css: (r as { custom_css: string | null }).custom_css,
          logo_src: (r as { logo_src: string | null }).logo_src,
          logo_alt: (r as { logo_alt: string | null }).logo_alt,
          favicon_src: (r as { favicon_src: string | null }).favicon_src,
          og_default_src: (r as { og_default_src: string | null }).og_default_src,
          version: (r as { version: number }).version,
          updated_at: (r as { updated_at: number }).updated_at,
        };
      }
    } catch (e) { console.warn(`[theme] read failed: ${(e as Error).message}`); }
  }
  return {
    tokens: DEFAULT,
    custom_css: null,
    logo_src: null,
    logo_alt: null,
    favicon_src: null,
    og_default_src: null,
    version: 0,
    updated_at: Date.now(),
  };
}

export async function setTheme(input: z.infer<typeof ThemeInput>): Promise<ThemeRow> {
  const d = db();
  if (!d) throw new Error("db_unbound");
  const now = Date.now();
  await d.prepare(
    `INSERT INTO theme_settings (id, tokens_json, custom_css, logo_src, logo_alt, favicon_src, og_default_src, version, updated_at)
     VALUES ('singleton', ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       tokens_json = excluded.tokens_json,
       custom_css = excluded.custom_css,
       logo_src = excluded.logo_src,
       logo_alt = excluded.logo_alt,
       favicon_src = excluded.favicon_src,
       og_default_src = excluded.og_default_src,
       version = theme_settings.version + 1,
       updated_at = excluded.updated_at`
  ).bind(
    JSON.stringify(input.tokens),
    input.custom_css ?? null,
    input.logo_src ?? null,
    input.logo_alt ?? null,
    input.favicon_src ?? null,
    input.og_default_src ?? null,
    now
  ).run();
  return await getTheme();
}

/** Render a runtime <style> block from the current tokens. */
export function tokensToStyle(tokens: ThemeTokensType, customCss?: string | null): string {
  const css = `:root {
  --color-primary: ${tokens.primary};
  --color-primary-hover: ${tokens.primary_hover};
  --color-on-primary: ${tokens.on_primary};
  --color-secondary: ${tokens.secondary};
  --color-on-secondary: ${tokens.on_secondary};
  --color-accent: ${tokens.accent};
  --color-text: ${tokens.text};
  --color-bg: ${tokens.bg};
  --color-surface: ${tokens.surface};
  --color-muted: ${tokens.muted};
  --color-border: ${tokens.border};
}
${customCss ?? ""}`;
  return css;
}
