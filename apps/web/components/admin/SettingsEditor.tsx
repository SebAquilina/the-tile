"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toast";

type Settings = {
  store_name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  hours?: string;
  currency: string;
  timezone: string;
  default_locale: string;
  robots_txt_extra?: string;
  google_analytics_id?: string;
  plausible_domain?: string;
};

export function SettingsEditor({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [s, setS] = useState<Settings>(initial);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Settings>(k: K, v: Settings[K]) {
    setS({ ...s, [k]: v });
  }

  async function save() {
    setBusy(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(s),
    });
    setBusy(false);
    if (res.ok) {
      showToast({ kind: "success", message: "Settings saved" });
      router.refresh();
    } else {
      showToast({ kind: "error", message: `Save failed: ${res.status}` });
    }
  }

  return (
    <div className="form" style={{ maxWidth: 720 }}>
      <h2>General</h2>
      <label>Store name <input value={s.store_name} onChange={(e) => set("store_name", e.target.value)} /></label>
      <label>Contact email <input type="email" value={s.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} /></label>
      <label>Contact phone <input value={s.contact_phone ?? ""} onChange={(e) => set("contact_phone", e.target.value)} /></label>
      <label>Address <input value={s.address ?? ""} onChange={(e) => set("address", e.target.value)} /></label>
      <label>Opening hours <input value={s.hours ?? ""} onChange={(e) => set("hours", e.target.value)} placeholder="Mon–Fri 09:00–18:00" /></label>
      <label>Currency <input value={s.currency} onChange={(e) => set("currency", e.target.value)} maxLength={3} style={{ maxWidth: 100 }} /></label>
      <label>Time zone <input value={s.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="Europe/Malta" /></label>

      <h2 style={{ marginTop: "var(--space-8)" }}>SEO + analytics</h2>
      <label>
        Plausible domain
        <input value={s.plausible_domain ?? ""} onChange={(e) => set("plausible_domain", e.target.value)} placeholder="the-tile.com" />
      </label>
      <label>
        Google Analytics ID
        <input value={s.google_analytics_id ?? ""} onChange={(e) => set("google_analytics_id", e.target.value)} placeholder="G-XXXXXX" />
      </label>
      <label>
        robots.txt extra rules (appended)
        <textarea value={s.robots_txt_extra ?? ""} onChange={(e) => set("robots_txt_extra", e.target.value)} rows={5} style={{ fontFamily: "ui-monospace, monospace" }} />
      </label>

      <div style={{ marginTop: "var(--space-6)" }}>
        <button onClick={save} disabled={busy} className="btn btn-primary btn-lg">{busy ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}
