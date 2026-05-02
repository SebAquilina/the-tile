/**
 * Agent settings (singleton). The agent route reads these at request time
 * — operator edits prompt + persona without a redeploy. Per ref 19 § Class 1.
 */

import { z } from "zod";
import { unstable_noStore as noStore } from "next/cache";

export const AgentInput = z.object({
  persona_name: z.string().min(1).max(80),
  voice: z.string().min(1).max(2000),
  rules_json: z.array(z.string().max(500)).max(50),
  fallback_contact: z.string().max(500).optional(),
  hand_off_phone: z.string().max(40).optional(),
  hand_off_email: z.string().email().max(200).optional(),
  custom_kb_md: z.string().max(50_000).optional(),
});

export type AgentInputType = z.infer<typeof AgentInput>;

export type AgentSettingsRow = AgentInputType & {
  version: number;
  updated_at: number;
};

const DEFAULT: AgentSettingsRow = {
  persona_name: "Concierge",
  voice: "Warm, expert, direct. Knows the catalogue. Says when it doesn't know.",
  rules_json: [
    "Lead with what the tile IS and where it works.",
    "Never invent a price, size, or finish that isn't in the catalogue.",
    "When you can't help: hand off to /contact.",
  ],
  fallback_contact: "/contact",
  hand_off_phone: "",
  hand_off_email: "",
  custom_kb_md: "",
  version: 0,
  updated_at: Date.now(),
};

function db(): D1Database | null {
  return (
    (process.env as unknown as { DB?: D1Database }).DB ??
    (globalThis as unknown as { DB?: D1Database }).DB ??
    null
  );
}

export async function getAgentSettings(): Promise<AgentSettingsRow> {
  noStore();
  const d = db();
  if (d) {
    try {
      const r = await d.prepare(`SELECT * FROM agent_settings WHERE id = 'singleton'`).first();
      if (r) {
        return {
          persona_name: (r as { persona_name: string }).persona_name,
          voice: (r as { voice: string }).voice,
          rules_json: JSON.parse((r as { rules_json: string }).rules_json || "[]"),
          fallback_contact: (r as { fallback_contact: string | null }).fallback_contact ?? "",
          hand_off_phone: (r as { hand_off_phone: string | null }).hand_off_phone ?? "",
          hand_off_email: (r as { hand_off_email: string | null }).hand_off_email ?? "",
          custom_kb_md: (r as { custom_kb_md: string | null }).custom_kb_md ?? "",
          version: (r as { version: number }).version,
          updated_at: (r as { updated_at: number }).updated_at,
        };
      }
    } catch (e) { console.warn(`[agent] read failed: ${(e as Error).message}`); }
  }
  return DEFAULT;
}

export async function setAgentSettings(input: AgentInputType): Promise<AgentSettingsRow> {
  const d = db();
  if (!d) throw new Error("db_unbound");
  const now = Date.now();
  await d.prepare(
    `INSERT INTO agent_settings (id, persona_name, voice, rules_json, fallback_contact, hand_off_phone, hand_off_email, custom_kb_md, version, updated_at)
     VALUES ('singleton', ?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       persona_name = excluded.persona_name,
       voice = excluded.voice,
       rules_json = excluded.rules_json,
       fallback_contact = excluded.fallback_contact,
       hand_off_phone = excluded.hand_off_phone,
       hand_off_email = excluded.hand_off_email,
       custom_kb_md = excluded.custom_kb_md,
       version = agent_settings.version + 1,
       updated_at = excluded.updated_at`
  ).bind(
    input.persona_name, input.voice, JSON.stringify(input.rules_json),
    input.fallback_contact ?? null, input.hand_off_phone ?? null,
    input.hand_off_email ?? null, input.custom_kb_md ?? null, now
  ).run();
  return await getAgentSettings();
}

/** Build the system prompt at request time from current settings + catalogue. */
export async function buildSystemPrompt(catalogueText: string): Promise<string> {
  const a = await getAgentSettings();
  const rules = a.rules_json.map((r) => `- ${r}`).join("\n");
  const handOff = [
    a.fallback_contact && `Fallback contact: ${a.fallback_contact}`,
    a.hand_off_phone && `Phone: ${a.hand_off_phone}`,
    a.hand_off_email && `Email: ${a.hand_off_email}`,
  ].filter(Boolean).join("\n");

  return `You are ${a.persona_name}.

# Voice
${a.voice}

# Rules
${rules}

# Hand-off
When you cannot help, point the user here:
${handOff}

# Custom knowledge
${a.custom_kb_md || "(none)"}

# Catalogue (read-only, do not invent additions)
${catalogueText}
`;
}
