"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";

export function RunPulseButton() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/insights?action=run", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      toast.success("Pulse regenerated" );
      router.refresh();
    } catch (e) {
      toast.error(`Pulse failed: ${(e as Error).message}`);
    } finally { setBusy(false); }
  }
  return (
    <button type="button" className="btn btn-primary" onClick={run} disabled={busy}>
      {busy ? "Generating…" : "Run Pulse →"}
    </button>
  );
}
