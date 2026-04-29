"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toast";

type Tokens = {
  primary: string; primary_hover: string; on_primary: string;
  secondary: string; on_secondary: string; accent: string;
  text: string; bg: string; surface: string; muted: string; border: string;
};
type Theme = {
  tokens: Tokens; custom_css: string | null;
  logo_src: string | null; logo_alt: string | null;
  favicon_src: string | null; og_default_src: string | null;
  version: number;
};

const TOKEN_LABELS: Record<keyof Tokens, string> = {
  primary: "Primary (CTAs, links)",
  primary_hover: "Primary hover",
  on_primary: "Text on primary",
  secondary: "Secondary",
  on_secondary: "Text on secondary",
  accent: "Accent",
  text: "Body text",
  bg: "Page background",
  surface: "Card background",
  muted: "Muted text",
  border: "Border / divider",
};

export function ThemeEditor({ initial }: { initial: Theme }) {
  const router = useRouter();
  const [t, setT] = useState<Theme>(initial);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch("/api/admin/theme", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tokens: t.tokens,
        custom_css: t.custom_css ?? undefined,
        logo_src: t.logo_src ?? undefined,
        logo_alt: t.logo_alt ?? undefined,
        favicon_src: t.favicon_src ?? undefined,
        og_default_src: t.og_default_src ?? undefined,
      }),
    });
    setBusy(false);
    if (res.ok) {
      showToast({ kind: "success", message: "Theme saved — public site updates within 60s" });
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      showToast({ kind: "error", message: `Save failed: ${(j as { error?: string }).error || res.status}` });
    }
  }

  return (
    <div className="form" style={{ maxWidth: 760 }}>
      <h2>Brand colors</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
        {(Object.keys(TOKEN_LABELS) as (keyof Tokens)[]).map((k) => (
          <label key={k} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span>{TOKEN_LABELS[k]}</span>
            <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="color"
                value={t.tokens[k]}
                onChange={(e) => setT({ ...t, tokens: { ...t.tokens, [k]: e.target.value } })}
                style={{ width: 40, height: 40, padding: 0, border: "1px solid var(--color-border)" }}
              />
              <input
                value={t.tokens[k]}
                onChange={(e) => setT({ ...t, tokens: { ...t.tokens, [k]: e.target.value } })}
                style={{ flex: 1 }}
              />
            </span>
          </label>
        ))}
      </div>

      <h2 style={{ marginTop: "var(--space-8)" }}>Brand assets</h2>
      <label>
        Logo URL
        <input value={t.logo_src ?? ""} onChange={(e) => setT({ ...t, logo_src: e.target.value })} placeholder="/brand/logo.png or https://..." />
      </label>
      <label>
        Logo alt text
        <input value={t.logo_alt ?? ""} onChange={(e) => setT({ ...t, logo_alt: e.target.value })} placeholder="THE TILE" />
      </label>

      <details style={{ marginTop: "var(--space-4)" }}>
        <summary>Advanced — Custom CSS</summary>
        <textarea
          value={t.custom_css ?? ""}
          onChange={(e) => setT({ ...t, custom_css: e.target.value })}
          rows={8}
          placeholder="/* appended after the brand tokens */"
          style={{ fontFamily: "ui-monospace, monospace", marginTop: "0.5rem" }}
        />
      </details>

      <div style={{ marginTop: "var(--space-6)" }}>
        <button onClick={save} disabled={busy} className="btn btn-primary btn-lg">
          {busy ? "Saving…" : "Save theme"}
        </button>
      </div>
    </div>
  );
}
