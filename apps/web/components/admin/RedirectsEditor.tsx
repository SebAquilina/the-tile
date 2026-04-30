"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";

type Row = {
  id: string;
  from_path: string;
  to_path: string;
  status_code: 301 | 302;
  active: number;
};

export function RedirectsEditor({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial);
  const toast = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [code, setCode] = useState<301 | 302>(301);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!from || !to) return;
    setBusy(true);
    const res = await fetch("/api/admin/redirects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ from_path: from, to_path: to, status_code: code, active: true }),
    });
    setBusy(false);
    if (res.status === 409) { toast.error(`from path already in use`); return; }
    if (!res.ok) { toast.error(`Add failed: ${res.status}`); return; }
    const j = (await res.json()) as { currentVersion?: number; error?: string; page?: { version: number; [k: string]: unknown }; redirect?: { id: string; from_path: string; to_path: string; status_code: 301 | 302; active: number } };
    setRows([...rows, j.redirect as Row]);
    setFrom(""); setTo("");
    toast.success("Redirect added");
    router.refresh();
  }

  async function toggle(id: string, active: boolean) {
    // Phantom-UI audit P1 #6 — must surface server failures to admin.
    const res = await fetch(`/api/admin/redirects/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (!res.ok) {
      toast.error(`Toggle failed: ${res.status}`);
      return;
    }
    setRows(rows.map((r) => r.id === id ? { ...r, active: active ? 1 : 0 } : r));
  }

  async function remove(id: string) {
    if (!confirm("Delete this redirect?")) return;
    const res = await fetch(`/api/admin/redirects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(`Delete failed: ${res.status}`);
      return;
    }
    setRows(rows.filter((r) => r.id !== id));
    toast.success("Redirect deleted");
  }

  return (
    <>
      <div className="form" style={{ marginBottom: "var(--space-6)", maxWidth: 800 }}>
        <h3>Add redirect</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px auto", gap: "0.5rem", alignItems: "end" }}>
          <label>From <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/old-product.html" /></label>
          <label>To <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="/products/new-slug" /></label>
          <label>Code
            <select value={code} onChange={(e) => setCode(Number(e.target.value) as 301 | 302)}>
              <option value={301}>301</option>
              <option value={302}>302</option>
            </select>
          </label>
          <button onClick={add} disabled={busy || !from || !to} className="btn btn-primary">Add</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="muted">No redirects yet.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>From</th><th>To</th><th>Code</th><th>Active</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><code>{r.from_path}</code></td>
                <td><code>{r.to_path}</code></td>
                <td>{r.status_code}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={!!r.active}
                    onChange={(e) => toggle(r.id, e.target.checked)}
                    aria-label="Active"
                  />
                </td>
                <td><button onClick={() => remove(r.id)} className="btn btn-danger btn-sm">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
