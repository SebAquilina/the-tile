"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ImageOff, ImagePlus, Trash2 } from "lucide-react";
import { Button, Input, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ProductImagePatch } from "@/lib/admin-draft";

export interface ImagesEditorProps {
  /** Current effective images (seed + draft). */
  value: ProductImagePatch[];
  /** Called whenever the array changes (reorder / edit / add / remove). */
  onChange: (next: ProductImagePatch[]) => void;
}

/**
 * Image management UI per product.
 *
 * - List + thumbnails of every image in `images[]`
 * - Editable alt text per row
 * - Reorder up/down (array order = display order on the public page)
 * - Remove
 * - Add by URL (existing /images/products/..., R2, external CDN — anything)
 * - Soft URL validation: best-effort HEAD/GET fetch, warns but does not block
 *
 * Persistence is the caller's responsibility — this component is a
 * controlled editor: it emits the new array via onChange and the parent
 * stages it into the admin draft (which publishes via /api/admin/publish).
 *
 * NOTE: R2 isn't enabled (paywall) so today the operator pastes URLs.
 * When R2 lands we layer an upload affordance on top of this same component
 * and feed the resulting URL into addImage().
 */
export function ImagesEditor({ value, onChange }: ImagesEditorProps) {
  const toast = useToast();
  const [newSrc, setNewSrc] = useState("");
  const [newAlt, setNewAlt] = useState("");
  const [newPlaceholder, setNewPlaceholder] = useState(false);
  const [validating, setValidating] = useState(false);

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    const [item] = next.splice(idx, 1);
    next.splice(j, 0, item);
    onChange(next);
  }

  function remove(idx: number) {
    const next = value.slice();
    next.splice(idx, 1);
    onChange(next);
  }

  function patchAlt(idx: number, alt: string) {
    const next = value.slice();
    next[idx] = { ...next[idx], alt };
    onChange(next);
  }

  async function softValidate(src: string): Promise<{ ok: boolean; reason?: string }> {
    // CORS will often block us — that's OK, we treat non-200/CORS as a
    // soft warning, not a hard block. The browser will still try to load
    // the image after publish.
    try {
      const res = await fetch(src, { method: "GET", mode: "no-cors" });
      // no-cors gives an opaque response — we can't read status, so we
      // treat this as "loaded without throwing" = good enough.
      if (res.type === "opaque") return { ok: true };
      if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.startsWith("image/")) {
        return { ok: false, reason: `content-type: ${ct || "(none)"}` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  }

  async function addImage() {
    const src = newSrc.trim();
    if (!src) return;
    // Don't add duplicates by src.
    if (value.some((img) => img.src === src)) {
      toast.error("That image is already in the list.");
      return;
    }

    setValidating(true);
    const v = await softValidate(src);
    setValidating(false);

    if (!v.ok) {
      toast.info(
        `Couldn't verify the image (${v.reason}) — adding anyway. Check the public page after publish.`,
      );
    }

    const next: ProductImagePatch = {
      src,
      alt: newAlt.trim() || undefined,
    };
    if (newPlaceholder) next.isPlaceholder = true;
    onChange([...value, next]);
    setNewSrc("");
    setNewAlt("");
    setNewPlaceholder(false);
  }

  return (
    <div className="space-y-space-5">
      <div>
        <h3 className="font-display text-lg text-ink">Images</h3>
        <p className="mt-space-1 text-xs text-ink-muted">
          The first image is the hero on tile cards and detail pages. Drag-free
          reordering — use the arrows. Alt text is read by screen readers and
          shows when the image fails to load.
        </p>
      </div>

      {value.length === 0 ? (
        <div className="rounded-md border border-dashed border-line bg-surface-muted p-space-5 text-center text-sm text-ink-muted">
          <ImageOff aria-hidden="true" className="mx-auto h-6 w-6" />
          <p className="mt-space-2">No images yet. Add one below.</p>
        </div>
      ) : (
        <ul className="space-y-space-3">
          {value.map((img, idx) => (
            <li
              key={`${img.src}-${idx}`}
              className={cn(
                "flex items-start gap-space-4 rounded-md border border-line bg-surface p-space-4",
              )}
            >
              <div className="flex-shrink-0">
                <div
                  className={cn(
                    "h-20 w-20 overflow-hidden rounded-sm border border-line bg-surface-muted",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.alt ?? ""}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = "0.2";
                    }}
                  />
                </div>
                {img.isPlaceholder ? (
                  <p className="mt-space-1 text-center text-[10px] uppercase tracking-wider text-warning">
                    placeholder
                  </p>
                ) : null}
              </div>

              <div className="min-w-0 flex-1 space-y-space-2">
                <p className="break-all font-mono text-xs text-ink-subtle">
                  {img.src}
                </p>
                <Input
                  aria-label={`Image ${idx + 1} alt text`}
                  value={img.alt ?? ""}
                  onChange={(e) => patchAlt(idx, e.target.value)}
                  placeholder="Describe what the image shows…"
                />
                <div className="flex flex-wrap items-center gap-space-2">
                  <span className="text-[10px] uppercase tracking-wider text-ink-subtle">
                    {idx === 0 ? "Hero" : `#${idx + 1}`}
                  </span>
                  {img.source ? (
                    <span className="text-[10px] text-ink-subtle">
                      · {img.source}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-shrink-0 flex-col gap-space-2">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  aria-label={`Move image ${idx + 1} up`}
                  title="Move up"
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-muted",
                    "hover:border-ink-subtle hover:text-ink",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  )}
                >
                  <ArrowUp aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === value.length - 1}
                  aria-label={`Move image ${idx + 1} down`}
                  title="Move down"
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-muted",
                    "hover:border-ink-subtle hover:text-ink",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  )}
                >
                  <ArrowDown aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  aria-label={`Remove image ${idx + 1}`}
                  title="Remove"
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-warning",
                    "hover:border-warning hover:bg-warning/10",
                  )}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <fieldset className="space-y-space-3 rounded-md border border-dashed border-line bg-surface-muted p-space-4">
        <legend className="px-space-2 text-xs uppercase tracking-wider text-ink-subtle">
          Add an image
        </legend>
        <Input
          label="Image URL"
          value={newSrc}
          onChange={(e) => setNewSrc(e.target.value)}
          placeholder="/images/products/<slug>/N.jpg or https://…"
          helpText="Paste a URL. Self-hosted /images/... paths, R2 URLs, or any HTTPS image will work."
        />
        <Input
          label="Alt text"
          value={newAlt}
          onChange={(e) => setNewAlt(e.target.value)}
          placeholder="Describe what the image shows (optional but recommended)"
        />
        <label className="flex items-center gap-space-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={newPlaceholder}
            onChange={(e) => setNewPlaceholder(e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          Mark as placeholder (showroom doesn&apos;t have a real photo yet)
        </label>
        <div>
          <Button
            type="button"
            variant="primary"
            onClick={addImage}
            disabled={!newSrc.trim() || validating}
            loading={validating}
          >
            <ImagePlus aria-hidden="true" className="mr-space-2 h-4 w-4" />
            {validating ? "Checking…" : "Add image"}
          </Button>
        </div>
      </fieldset>
    </div>
  );
}
