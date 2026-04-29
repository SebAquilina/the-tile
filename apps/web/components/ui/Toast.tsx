"use client";

import { useEffect, useState } from "react";

export type Toast = { id: string; kind: "success" | "error" | "info"; message: string; ttl?: number };
const listeners = new Set<(t: Toast) => void>();

export function showToast(t: Omit<Toast, "id">) {
  const id = crypto.randomUUID();
  const full: Toast = { ttl: 3500, ...t, id };
  for (const l of listeners) l(full);
  return id;
}

export function ToastViewport() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    function on(t: Toast) {
      setToasts((p) => [...p, t]);
      if (t.ttl) setTimeout(() => setToasts((p) => p.filter((x) => x.id !== t.id)), t.ttl);
    }
    listeners.add(on);
    return () => { listeners.delete(on); };
  }, []);
  return (
    <div role="status" aria-live="polite" style={{ position: "fixed", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ background: t.kind === "error" ? "#b3261e" : t.kind === "success" ? "#2f7d32" : "#111", color: "#fff", padding: "0.6rem 1rem", borderRadius: "0.5rem", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", fontSize: "0.95rem" }}>{t.message}</div>
      ))}
    </div>
  );
}
