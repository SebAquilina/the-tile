"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";

type Item = { label: string; href: string; external?: boolean };

export function NavigationEditor({ handle, initialItems }: { handle: string; initialItems: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  function move(from: number, to: number) {
    const next = items.slice();
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setItems(next);
  }

  async function save() {
    setBusy(true);
    const res = await fetch("/api/admin/navigation", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle, items }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(`${handle} menu saved`);
      router.refresh();
    } else {
      toast.error(`Save failed: HTTP ${res.status}`);
    }
  }

  return (
    <div className="nav-editor" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {items.map((it, i) => (
          <li
            key={i}
            draggable
            onDragStart={() => setDraggingIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (draggingIdx !== null && draggingIdx !== i) move(draggingIdx, i); setDraggingIdx(null); }}
            onDragEnd={() => setDraggingIdx(null)}
            style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-bg)" }}
          >
            <span style={{ cursor: "grab", color: "var(--color-muted)" }} aria-hidden>⋮⋮</span>
            <input
              value={it.label}
              onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
              placeholder="Label"
              style={{ flex: 1 }}
            />
            <input
              value={it.href}
              onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, href: e.target.value } : x))}
              placeholder="/path or https://..."
              style={{ flex: 1 }}
            />
            <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="btn btn-danger btn-sm" aria-label="Remove">×</button>
          </li>
        ))}
      </ol>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "var(--space-4)" }}>
        <button onClick={() => setItems([...items, { label: "New", href: "/" }])} className="btn btn-secondary btn-sm">+ Add item</button>
        <button onClick={save} disabled={busy} className="btn btn-primary">{busy ? "Saving…" : "Save menu"}</button>
      </div>
    </div>
  );
}
