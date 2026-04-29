"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";

const STATUSES = ["new", "replied", "quoted", "won", "lost", "spam"] as const;

export function LeadStatusEditor({
  id, version, status, notes,
}: {
  id: string; version: number; status: string; notes: string;
}) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const toast = useToast();
  const [n, setN] = useState(notes);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "if-match": `W/"${version}"` },
      body: JSON.stringify({ status: s, notes: n }),
    });
    setBusy(false);
    if (res.status === 412) {
      toast.error("Version conflict — reload to see latest");
      return;
    }
    if (!res.ok) { toast.error(`Save failed: ${res.status}`); return; }
    toast.success("Updated");
    router.refresh();
  }

  return (
    <div className="form" style={{ maxWidth: 520 }}>
      <h3>Status</h3>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {STATUSES.map((opt) => (
          <button
            key={opt}
            onClick={() => setS(opt)}
            className={`btn ${s === opt ? "btn-primary" : "btn-secondary"} btn-sm`}
            type="button"
          >{opt}</button>
        ))}
      </div>
      <label>
        Notes
        <textarea value={n} onChange={(e) => setN(e.target.value)} rows={4} />
      </label>
      <button onClick={save} disabled={busy} className="btn btn-primary">
        {busy ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
