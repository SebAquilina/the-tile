"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, Select, useToast } from "@/components/ui";

type Row = {
  id: string;
  from_path: string;
  to_path: string;
  status_code: 301 | 302;
  active: number;
};

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

export function RedirectsEditor({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial);
  const toast = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [code, setCode] = useState<301 | 302>(301);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  async function add() {
    if (!from || !to) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/redirects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from_path: from, to_path: to, status_code: code, active: true }),
      });
      if (res.status === 409) { toast.error("That from-path is already in use"); return; }
      if (!res.ok) { toast.error(`Add failed: ${res.status}`); return; }
      const j = (await res.json()) as { redirect?: Row };
      if (j.redirect) setRows([...rows, j.redirect]);
      setFrom(""); setTo("");
      toast.success("Redirect added");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    const res = await fetch(`/api/admin/redirects/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (!res.ok) { toast.error(`Toggle failed: ${res.status}`); return; }
    setRows(rows.map((r) => (r.id === id ? { ...r, active: active ? 1 : 0 } : r)));
  }

  async function remove(id: string, fromPath: string) {
    if (!confirm(`Delete redirect for ${fromPath}?`)) return;
    const res = await fetch(`/api/admin/redirects/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error(`Delete failed: ${res.status}`); return; }
    setRows(rows.filter((r) => r.id !== id));
    toast.success("Redirect deleted");
  }

  async function testRedirect(fromPath: string) {
    try {
      const url = new URL(fromPath, window.location.origin).toString();
      const res = await fetch(url, { redirect: "manual" });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        toast.success(`${res.status} -> ${loc ?? "(no location)"}`);
      } else {
        toast.info(`HTTP ${res.status} (no redirect)`);
      }
    } catch (e) {
      toast.error(`Probe failed: ${(e as Error).message}`);
    }
  }

  const filtered = rows.filter((r) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return r.from_path.toLowerCase().includes(q) || r.to_path.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-space-6">
      <Section
        title="Add redirect"
        description="301 for permanent moves, 302 for temporary. Used when migrating from old URLs."
      >
        <div className="grid grid-cols-1 gap-space-3 md:grid-cols-[2fr_2fr_1fr_auto] md:items-end">
          <Input
            label="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="/old-product.html"
          />
          <Input
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="/products/new-slug"
          />
          <Select
            label="Code"
            value={String(code)}
            onChange={(e) => setCode(Number(e.target.value) as 301 | 302)}
          >
            <option value="301">301</option>
            <option value="302">302</option>
          </Select>
          <Button onClick={add} disabled={busy || !from || !to}>
            Add
          </Button>
        </div>
      </Section>

      <Section
        title={`Redirects (${rows.length})`}
        description="Active redirects fire on every request. Toggle off to disable without deleting."
      >
        {rows.length === 0 ? (
          <p className="text-sm text-ink-muted">No redirects yet.</p>
        ) : (
          <>
            <div className="mb-space-4">
              <Input
                placeholder="Filter by path..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <ul className="flex flex-col gap-space-2">
              {filtered.map((r) => (
                <li
                  key={r.id}
                  className="grid grid-cols-1 gap-space-2 rounded-md border border-line bg-surface-muted p-space-3 md:grid-cols-[2fr_2fr_auto_auto] md:items-center"
                >
                  <div className="font-mono text-sm">
                    <span className={r.active ? "text-ink" : "text-ink-subtle line-through"}>{r.from_path}</span>
                  </div>
                  <div className="font-mono text-sm text-ink-muted">
                    <span className="text-ink-subtle">{r.status_code} →</span> {r.to_path}
                  </div>
                  <div className="flex items-center gap-space-2">
                    <label className="flex items-center gap-space-1 text-xs text-ink-muted">
                      <input
                        type="checkbox"
                        checked={r.active === 1}
                        onChange={(e) => toggle(r.id, e.target.checked)}
                      />
                      Active
                    </label>
                  </div>
                  <div className="flex gap-space-2">
                    <Button variant="ghost" size="sm" onClick={() => testRedirect(r.from_path)}>
                      Test
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(r.id, r.from_path)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {filtered.length === 0 && filter ? (
              <p className="mt-space-3 text-sm text-ink-muted">
                No redirects match "{filter}".
              </p>
            ) : null}
          </>
        )}
      </Section>
    </div>
  );
}
