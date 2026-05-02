"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Undo2 } from "lucide-react";
import { Button, Checkbox, Input, Textarea, useToast } from "@/components/ui";
import { ImagesEditor } from "@/components/admin/ImagesEditor";
import {
  useAdminDraft,
  type ProductImagePatch,
} from "@/lib/admin-draft";
import { cn } from "@/lib/cn";

export interface ProductEditorSeed {
  inStock: boolean;
  showInCatalog: boolean;
  summary: string;
  description: string;
  bestFor: string[];
  tags: string[];
  images: ProductImagePatch[];
}

export function ProductEditor({
  id,
  seed,
}: {
  id: string;
  seed: ProductEditorSeed;
}) {
  const toast = useToast();
  const { draft, patchProduct, discardProduct } = useAdminDraft();
  const patch = draft.products[id] ?? {};

  const [inStock, setInStock] = useState<boolean>(patch.inStock ?? seed.inStock);
  const [showInCatalog, setShowInCatalog] = useState<boolean>(
    patch.showInCatalog ?? seed.showInCatalog,
  );
  const [summary, setSummary] = useState<string>(patch.summary ?? seed.summary);
  const [description, setDescription] = useState<string>(
    patch.description ?? seed.description,
  );
  const [bestForText, setBestForText] = useState<string>(
    (patch.bestFor ?? seed.bestFor).join(", "),
  );
  const [tagsText, setTagsText] = useState<string>(
    (patch.tags ?? seed.tags).join(", "),
  );
  const [images, setImages] = useState<ProductImagePatch[]>(
    patch.images ?? seed.images,
  );

  // Resync if another tab/view mutates the draft.
  useEffect(() => {
    setInStock(patch.inStock ?? seed.inStock);
    setShowInCatalog(patch.showInCatalog ?? seed.showInCatalog);
    setSummary(patch.summary ?? seed.summary);
    setDescription(patch.description ?? seed.description);
    setBestForText((patch.bestFor ?? seed.bestFor).join(", "));
    setTagsText((patch.tags ?? seed.tags).join(", "));
    setImages(patch.images ?? seed.images);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.updatedAt]);

  const bestForArr = useMemo(
    () =>
      bestForText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [bestForText],
  );
  const tagsArr = useMemo(
    () =>
      tagsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [tagsText],
  );

  const dirty = useMemo(() => {
    if (inStock !== seed.inStock) return true;
    if (showInCatalog !== seed.showInCatalog) return true;
    if (summary.trim() !== seed.summary.trim()) return true;
    if (description.trim() !== seed.description.trim()) return true;
    if (bestForArr.join("|") !== seed.bestFor.join("|")) return true;
    if (tagsArr.join("|") !== seed.tags.join("|")) return true;
    if (!imagesEqual(images, seed.images)) return true;
    return false;
  }, [
    inStock,
    showInCatalog,
    summary,
    description,
    bestForArr,
    tagsArr,
    images,
    seed,
  ]);

  // Confirm-before-leave when there are unsaved (un-staged) changes.
  useEffect(() => {
    if (!dirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Modern browsers ignore custom strings but require returnValue set.
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function stage() {
    patchProduct(id, {
      inStock: inStock === seed.inStock ? undefined : inStock,
      showInCatalog:
        showInCatalog === seed.showInCatalog ? undefined : showInCatalog,
      summary: summary.trim() === seed.summary.trim() ? undefined : summary,
      description:
        description.trim() === seed.description.trim() ? undefined : description,
      bestFor:
        bestForArr.join("|") === seed.bestFor.join("|") ? undefined : bestForArr,
      tags: tagsArr.join("|") === seed.tags.join("|") ? undefined : tagsArr,
      images: imagesEqual(images, seed.images) ? undefined : images,
    });
    toast.success("Change staged — publish from the bottom bar when ready.");
  }

  function revert() {
    discardProduct(id);
    setInStock(seed.inStock);
    setShowInCatalog(seed.showInCatalog);
    setSummary(seed.summary);
    setDescription(seed.description);
    setBestForText(seed.bestFor.join(", "));
    setTagsText(seed.tags.join(", "));
    setImages(seed.images);
    toast.info("Reverted to the published values.");
  }

  return (
    <div className="space-y-space-7 pb-space-10">
      <section className="space-y-space-5 rounded-md border border-line bg-surface p-space-6">
        <h2 className="font-display text-xl text-ink">Status</h2>
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
      </section>

      <section className="rounded-md border border-line bg-surface p-space-6">
        <ImagesEditor value={images} onChange={setImages} />
      </section>

      <section className="space-y-space-5 rounded-md border border-line bg-surface p-space-6">
        <h2 className="font-display text-xl text-ink">Copy</h2>
        <Textarea
          label="Summary"
          helpText="One or two sentences. Shown on tile cards and in search results (max 300 characters)."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          maxLength={300}
        />
        <Textarea
          label="Description"
          helpText="Long-form copy for the product detail page. Markdown is supported."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          maxLength={8000}
        />
        <Input
          label="Best for"
          value={bestForText}
          onChange={(e) => setBestForText(e.target.value)}
          helpText="Comma-separated. e.g. ‘bathroom floor, wet rooms, lobbies’."
          placeholder="bathroom, kitchen splashback…"
        />
        <Input
          label="Tags"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          helpText="Comma-separated keywords used for search & filtering."
          placeholder="marble, beige, large-format…"
        />
      </section>

      {/* Sticky save bar */}
      <div
        className={cn(
          "sticky bottom-0 z-30 -mx-space-5 mt-space-7 border-t border-line bg-surface/95 px-space-5 py-space-3 backdrop-blur",
          "md:-mx-space-7 md:px-space-7",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-space-3">
          <div className="text-sm text-ink-muted">
            {dirty ? (
              <span className="text-umber">Unsaved changes — stage to draft.</span>
            ) : Object.keys(patch).length > 0 ? (
              <span className="text-umber">Draft pending publish.</span>
            ) : (
              "No changes."
            )}
          </div>
          <div className="flex flex-wrap items-center gap-space-3">
            <Button
              variant="ghost"
              onClick={revert}
              disabled={!dirty && Object.keys(patch).length === 0}
            >
              <Undo2 aria-hidden="true" className="mr-space-2 h-4 w-4" />
              Revert
            </Button>
            <Button variant="primary" onClick={stage} disabled={!dirty}>
              <Save aria-hidden="true" className="mr-space-2 h-4 w-4" />
              {dirty ? "Stage changes" : "No changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function imagesEqual(a: ProductImagePatch[], b: ProductImagePatch[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.src !== y.src) return false;
    if ((x.alt ?? "") !== (y.alt ?? "")) return false;
    if ((x.caption ?? "") !== (y.caption ?? "")) return false;
    if ((x.source ?? "") !== (y.source ?? "")) return false;
    if (Boolean(x.isPlaceholder) !== Boolean(y.isPlaceholder)) return false;
  }
  return true;
}
