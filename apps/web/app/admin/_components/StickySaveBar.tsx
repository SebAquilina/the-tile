"use client";

import { Loader2, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";

/**
 * Per-form sticky save bar that appears at the bottom of the viewport when a
 * form is dirty. Pairs with `useUnsavedChanges`/local dirty flags. Sits above
 * the page content but below the global PublishBar via z-index.
 */
export function StickySaveBar({
  dirty,
  saving,
  onSave,
  onReset,
  saveLabel = "Save changes",
  hint,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset?: () => void;
  saveLabel?: string;
  hint?: string;
}) {
  if (!dirty && !saving) return null;
  return (
    <div
      role="region"
      aria-label="Unsaved changes"
      className={cn(
        "sticky bottom-space-3 z-20 mt-space-6",
        "rounded-md border border-umber/40 bg-surface-elevated shadow-md",
        "px-space-4 py-space-3",
        "flex flex-col gap-space-3 md:flex-row md:items-center md:justify-between",
      )}
    >
      <div className="flex items-center gap-space-3 text-sm">
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex h-2 w-2 rounded-full",
            saving ? "bg-warning" : "bg-umber",
          )}
        />
        <span className="font-medium text-ink">
          {saving ? "Saving…" : "You have unsaved changes"}
        </span>
        {hint ? <span className="text-ink-muted hidden md:inline">{hint}</span> : null}
      </div>
      <div className="flex items-center gap-space-3">
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            disabled={saving}
            className={cn(
              "inline-flex items-center gap-space-2 rounded-md border border-line px-space-3 py-space-2 text-sm text-ink-muted",
              "hover:border-ink-subtle hover:text-ink",
              "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
              saving && "opacity-50 cursor-not-allowed",
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        ) : null}
        <Button
          variant="primary"
          size="md"
          onClick={onSave}
          loading={saving}
          leadingIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        >
          {saving ? "Saving…" : saveLabel}
        </Button>
      </div>
    </div>
  );
}
