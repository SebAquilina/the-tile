"use client";

import { useState } from "react";
import { Button, Checkbox, Textarea, useToast } from "@/components/ui";
import type { ProductOverride } from "@/lib/admin-store";

export function ProductEditor({
  id,
  seed,
  override,
}: {
  id: string;
  seed: { inStock: boolean; showInCatalog: boolean; summary: string };
  override: ProductOverride | null;
}) {
  const toast = useToast();
  const [inStock, setInStock] = useState(override?.inStock ?? seed.inStock);
  const [showInCatalog, setShowInCatalog] = useState(
    override?.showInCatalog ?? seed.showInCatalog,
  );
  const [summary, setSummary] = useState(override?.summary ?? seed.summary);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          inStock,
          showInCatalog,
          summary: summary !== seed.summary ? summary : undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Changes staged.");
    } catch (err) {
      toast.error(`Save failed: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function revert() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setInStock(seed.inStock);
      setShowInCatalog(seed.showInCatalog);
      setSummary(seed.summary);
      toast.info("Reverted to seed values.");
    } catch (err) {
      toast.error(`Revert failed: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-space-6 rounded-md border border-line bg-surface p-space-6">
      <fieldset className="space-y-space-4">
        <Checkbox
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
          label="In stock"
        />
        <Checkbox
          checked={showInCatalog}
          onChange={(e) => setShowInCatalog(e.target.checked)}
          label="Visible in catalogue"
        />
      </fieldset>

      <Textarea
        label="Summary (one-to-two sentences, used on cards + meta)"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={3}
      />

      <div className="flex flex-wrap items-center gap-space-3">
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="ghost" onClick={revert} disabled={saving}>
          Revert to seed
        </Button>
        {override ? (
          <p className="text-xs text-ink-subtle">
            Last updated {new Date(override.updatedAt ?? "").toLocaleString("en-GB")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
