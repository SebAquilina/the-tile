"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, useToast } from "@/components/ui";
import { useAdminDraft } from "@/lib/admin-draft";

export function PublishBar() {
  const { draft, pendingCount, clearDraft } = useAdminDraft();
  const [publishing, setPublishing] = useState(false);
  const toast = useToast();
  const router = useRouter();

  if (pendingCount === 0) return null;

  async function publish() {
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ products: draft.products }),
      });
      const body = (await res.json().catch(() => null)) as
        | {
            ok: boolean;
            error?: string;
            touched?: string[];
            notFound?: string[];
            rebuildWithin?: string;
          }
        | null;
      if (!res.ok || !body?.ok) {
        const msg = body?.error ?? `HTTP ${res.status}`;
        toast.error(
          typeof msg === "string"
            ? `Couldn't publish: ${msg}`
            : "Couldn't publish — see console.",
        );
        return;
      }
      toast.success(
        `Published ${body.touched?.length ?? 0} change(s). Site rebuilds ${body.rebuildWithin ?? "shortly"}.`,
      );
      clearDraft();
      router.refresh();
    } catch (err) {
      toast.error(`Couldn't publish: ${(err as Error).message}`);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div
      role="region"
      aria-label="Pending admin changes"
      className={cn(
        "fixed inset-x-space-4 bottom-space-4 z-40",
        "mx-auto max-w-content rounded-md border border-umber bg-surface-elevated shadow-lg",
        "px-space-5 py-space-4",
      )}
    >
      <div className="flex flex-col gap-space-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-space-3 text-sm">
          <AlertCircle
            aria-hidden="true"
            className="mt-[2px] h-5 w-5 flex-shrink-0 text-umber"
          />
          <div>
            <p className="font-medium text-ink">
              {pendingCount} unpublished {pendingCount === 1 ? "change" : "changes"}
            </p>
            <p className="mt-space-1 text-ink-muted">
              These are staged in this browser tab. Publish to commit to GitHub
              and trigger a rebuild (~3 minutes).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-space-3">
          <button
            type="button"
            onClick={clearDraft}
            disabled={publishing}
            className={cn(
              "inline-flex items-center gap-space-2 rounded-md border border-line px-space-4 py-space-2 text-sm text-ink-muted",
              "hover:border-ink-subtle hover:text-ink",
              "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
              publishing && "opacity-60",
            )}
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Discard all
          </button>
          <Button
            variant="primary"
            onClick={publish}
            disabled={publishing}
            loading={publishing}
          >
            {publishing ? (
              <span className="inline-flex items-center gap-space-2">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Publishing…
              </span>
            ) : (
              <span className="inline-flex items-center gap-space-2">
                <Check aria-hidden="true" className="h-4 w-4" />
                Publish {pendingCount} change{pendingCount === 1 ? "" : "s"}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
