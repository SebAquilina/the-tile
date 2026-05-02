"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, useToast } from "@/components/ui";

type Item = { label: string; href: string; external?: boolean };

// Common routes the operator can quickly autocomplete to.
const ROUTE_SUGGESTIONS = [
  "/", "/collections", "/brands", "/showroom", "/about", "/contact",
  "/journal", "/reviews", "/save-list", "/privacy", "/terms", "/cookies",
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-line bg-surface p-space-5 md:p-space-6">
      <header className="mb-space-5">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {description ? (
          <p className="mt-space-1 text-sm text-ink-muted">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function NavigationEditor({
  handle,
  initialItems,
}: {
  handle: string;
  initialItems: Item[];
}) {
  const router = useRouter();
  const datalistId = useId();
  const [items, setItems] = useState<Item[]>(initialItems);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const baseline = JSON.stringify(initialItems);
  const dirty = JSON.stringify(items) !== baseline;

  function move(from: number, to: number) {
    const next = items.slice();
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setItems(next);
  }
  function set(i: number, patch: Partial<Item>) {
    setItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  }
  function add() {
    setItems([...items, { label: "", href: "/", external: false }]);
  }
  function remove(i: number) {
    setItems(items.filter((_, j) => j !== i));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/navigation", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle, items: items.filter((it) => it.label.trim()) }),
      });
      if (res.ok) {
        toast.success(`${handle} menu saved`);
        router.refresh();
      } else {
        toast.error(`Save failed: HTTP ${res.status}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      title={`${handle.charAt(0).toUpperCase() + handle.slice(1)} menu`}
      description="Drag to reorder. Each item is a label + path. External links open in a new tab."
    >
      <datalist id={datalistId}>
        {ROUTE_SUGGESTIONS.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>

      <ul className="flex flex-col gap-space-2">
        {items.map((it, i) => (
          <li
            key={i}
            draggable
            onDragStart={() => setDraggingIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingIdx !== null && draggingIdx !== i) move(draggingIdx, i);
              setDraggingIdx(null);
            }}
            className="grid grid-cols-1 gap-space-2 rounded-md border border-line bg-surface-muted p-space-3 md:grid-cols-[auto_1fr_2fr_auto_auto] md:items-center"
          >
            <span className="cursor-grab select-none text-ink-muted" aria-label="Drag handle">
              ⋮⋮
            </span>
            <Input
              value={it.label}
              onChange={(e) => set(i, { label: e.target.value })}
              placeholder="Label"
              maxLength={80}
            />
            <Input
              value={it.href}
              onChange={(e) => set(i, { href: e.target.value })}
              placeholder="/path"
              maxLength={500}
              list={datalistId}
            />
            <label className="flex items-center gap-space-1 whitespace-nowrap text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={!!it.external}
                onChange={(e) => set(i, { external: e.target.checked })}
              />
              External
            </label>
            <Button variant="ghost" size="sm" onClick={() => remove(i)} aria-label="Remove">
              ×
            </Button>
          </li>
        ))}
      </ul>

      <div className="mt-space-4 flex items-center justify-between gap-space-3">
        <Button variant="secondary" size="sm" onClick={add}>
          + Add item
        </Button>
        <div className="flex items-center gap-space-3">
          {dirty ? (
            <span className="text-xs text-umber">Unsaved changes</span>
          ) : (
            <span className="text-xs text-ink-subtle">Saved</span>
          )}
          <Button onClick={save} disabled={busy || !dirty}>
            {busy ? "Saving..." : "Save menu"}
          </Button>
        </div>
      </div>

      {items.length > 0 ? (
        <details className="mt-space-5">
          <summary className="cursor-pointer text-sm text-ink-muted">Preview</summary>
          <nav className="mt-space-3 flex flex-wrap gap-space-4 rounded-md border border-line bg-surface p-space-4">
            {items.filter((it) => it.label.trim()).map((it, i) => (
              <span key={i} className="text-sm text-ink-muted">
                {it.label}
                {it.external ? <span className="ml-space-1 text-ink-subtle">↗</span> : null}
                <span className="ml-space-2 font-mono text-xs text-ink-subtle">{it.href}</span>
              </span>
            ))}
          </nav>
        </details>
      ) : null}
    </Section>
  );
}
