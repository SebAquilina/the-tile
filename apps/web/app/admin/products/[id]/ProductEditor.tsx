"use client";

import { useEffect, useState } from "react";
import { Button, Checkbox, Textarea, useToast } from "@/components/ui";
import { useAdminDraft } from "@/lib/admin-draft";

export function ProductEditor({
  id,
  seed,
}: {
  id: string;
  seed: { inStock: boolean; showInCatalog: boolean; summary: string };
}) {
  const toast = useToast();
  const { draft, patchProduct, discardProduct } = useAdminDraft();
  const patch = draft.products[id] ?? {};

  const [inStock, setInStock] = useState<boolean>(patch.inStock ?? seed.inStock);
  const [showInCatalog, setShowInCatalog] = useState<boolean>(
    patch.showInCatalog ?? seed.showInCatalog,
  );
  const [summary, setSummary] = useState<string>(patch.summary ?? seed.summary);

  // Keep local form in sync if another tab / view mutates the draft.
  useEffect(() => {
    setInStock(patch.inStock ?? seed.inStock);
    setShowInCatalog(patch.showInCatalog ?? seed.showInCatalog);
    setSummary(patch.summary ?? seed.summary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.updatedAt]);

  const dirty =
    inStock !== seed.inStock ||
    showInCatalog !== seed.showInCatalog ||
    summary.trim() !== seed.summary.trim();

  function stage() {
    patchProduct(id, {
      inStock: inStock === seed.inStock ? undefined : inStock,
      showInCatalog:
        showInCatalog === seed.showInCatalog ? undefined : showInCatalog,
      summary: summary.trim() === seed.summary.trim() ? undefined : summary,
    });
    toast.success("Change staged — publish from the bottom bar when ready.");
  }

  function revert() {
    discardProduct(id);
    setInStock(seed.inStock);
    setShowInCatalog(seed.showInCatalog);
    setSummary(seed.summary);
    toast.info("Reverted to the published values.");
  }

  return (
    <div className="space-y-space-6 rounded-md border border-line bg-surface p-space-6">
      <fieldset className="space-y-space-4">
        <legend className="sr-only">Stock and visibility</legend>
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
        label="Summary"
        helpText="One or two sentences. Shown on tile cards and in search results (max 300 characters)."
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={4}
        maxLength={300}
      />

      <div className="flex flex-wrap items-center justify-between gap-space-3 border-t border-line pt-space-5">
        <div className="flex gap-space-3">
          <Button variant="primary" onClick={stage} disabled={!dirty}>
            {dirty ? "Stage changes" : "No changes"}
          </Button>
          <Button
            variant="ghost"
            onClick={revert}
            disabled={Object.keys(patch).length === 0}
          >
            Revert to published
          </Button>
        </div>
        {Object.keys(patch).length > 0 ? (
          <p className="text-xs text-umber">Draft pending publish.</p>
        ) : null}
      </div>
    </div>
  );
}
