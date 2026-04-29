"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toast";

type AgentRow = {
  persona_name: string;
  voice: string;
  rules_json: string[];
  fallback_contact?: string;
  hand_off_phone?: string;
  hand_off_email?: string;
  custom_kb_md?: string;
  version: number;
};

export function AgentEditor({ initial }: { initial: AgentRow }) {
  const router = useRouter();
  const [a, setA] = useState<AgentRow>(initial);
  const [busy, setBusy] = useState(false);

  function setRule(i: number, v: string) {
    setA({ ...a, rules_json: a.rules_json.map((r, j) => j === i ? v : r) });
  }
  function addRule() { setA({ ...a, rules_json: [...a.rules_json, ""] }); }
  function delRule(i: number) { setA({ ...a, rules_json: a.rules_json.filter((_, j) => j !== i) }); }

  async function save() {
    setBusy(true);
    const res = await fetch("/api/admin/agent", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        persona_name: a.persona_name,
        voice: a.voice,
        rules_json: a.rules_json.filter((r) => r.trim()),
        fallback_contact: a.fallback_contact || undefined,
        hand_off_phone: a.hand_off_phone || undefined,
        hand_off_email: a.hand_off_email || undefined,
        custom_kb_md: a.custom_kb_md || undefined,
      }),
    });
    setBusy(false);
    if (res.ok) {
      showToast({ kind: "success", message: "Agent settings saved" });
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      showToast({ kind: "error", message: `Save failed: ${(j as { error?: string }).error || res.status}` });
    }
  }

  return (
    <div className="form" style={{ maxWidth: 800 }}>
      <label>
        Persona name (what the customer sees)
        <input value={a.persona_name} onChange={(e) => setA({ ...a, persona_name: e.target.value })} />
      </label>

      <label>
        Voice
        <textarea
          value={a.voice}
          onChange={(e) => setA({ ...a, voice: e.target.value })}
          rows={4}
          placeholder="Warm, expert, direct. Knows the catalogue. Says when it doesn't know."
        />
      </label>

      <h3 style={{ marginTop: "var(--space-6)" }}>Rules</h3>
      <p className="muted">One rule per line. The agent treats these as hard constraints.</p>
      {a.rules_json.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input value={r} onChange={(e) => setRule(i, e.target.value)} style={{ flex: 1 }} />
          <button onClick={() => delRule(i)} className="btn btn-danger btn-sm">×</button>
        </div>
      ))}
      <button onClick={addRule} className="btn btn-secondary btn-sm">+ Add rule</button>

      <h3 style={{ marginTop: "var(--space-6)" }}>Hand-off</h3>
      <label>
        Fallback URL
        <input value={a.fallback_contact ?? ""} onChange={(e) => setA({ ...a, fallback_contact: e.target.value })} placeholder="/contact" />
      </label>
      <label>
        Phone
        <input value={a.hand_off_phone ?? ""} onChange={(e) => setA({ ...a, hand_off_phone: e.target.value })} placeholder="+356 ..." />
      </label>
      <label>
        Email
        <input type="email" value={a.hand_off_email ?? ""} onChange={(e) => setA({ ...a, hand_off_email: e.target.value })} placeholder="info@the-tile.com" />
      </label>

      <h3 style={{ marginTop: "var(--space-6)" }}>Custom knowledge (markdown)</h3>
      <p className="muted">Anything the agent should know that isn&apos;t in the product catalogue.</p>
      <textarea
        value={a.custom_kb_md ?? ""}
        onChange={(e) => setA({ ...a, custom_kb_md: e.target.value })}
        rows={12}
        style={{ fontFamily: "ui-monospace, monospace" }}
      />

      <div style={{ marginTop: "var(--space-6)" }}>
        <button onClick={save} disabled={busy} className="btn btn-primary btn-lg">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
