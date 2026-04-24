"use client";

import { useRouter } from "next/navigation";
import { Filter, Heart, Navigation, Send, Sparkles, Bookmark, Phone } from "lucide-react";
import type { AgentAction } from "@/lib/events";
import { cn } from "@/lib/cn";

export interface ActionReceiptProps {
  action: AgentAction;
}

/**
 * Inline card summarising the side-effect of a parsed agent action. Shown
 * directly below the assistant message that produced it. `cite` renders null
 * (metadata-only).
 *
 * Reversible actions (navigate, filter) include a small undo button that
 * calls `router.back()`.
 */
export function ActionReceipt({ action }: ActionReceiptProps) {
  const router = useRouter();

  const descriptor = describe(action);
  if (!descriptor) return null;

  const { Icon, label, reversible } = descriptor;

  return (
    <div
      role="status"
      className={cn(
        "mt-space-2 inline-flex items-center gap-space-2",
        "rounded-md border border-line bg-surface-muted",
        "px-space-3 py-space-2",
        "text-xs text-ink-muted",
      )}
    >
      <Icon aria-hidden="true" className="h-4 w-4 text-umber" />
      <span>{label}</span>
      {reversible ? (
        <button
          type="button"
          onClick={() => router.back()}
          className={cn(
            "ml-space-2 text-xs underline underline-offset-2",
            "text-ink-muted hover:text-ink",
            "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
            "rounded-sm",
          )}
        >
          undo
        </button>
      ) : null}
    </div>
  );
}

interface Descriptor {
  Icon: typeof Navigation;
  label: string;
  reversible: boolean;
}

function describe(action: AgentAction): Descriptor | null {
  switch (action.type) {
    case "navigate": {
      const pretty = prettifyUrl(action.data.url);
      return { Icon: Navigation, label: pretty, reversible: true };
    }
    case "scroll":
      return { Icon: Navigation, label: "Scrolled to the section.", reversible: false };
    case "filter": {
      const parts = Object.entries(action.data)
        .filter(([, v]) => typeof v === "string" && v.length > 0)
        .map(([, v]) => v as string);
      const label = parts.length
        ? `Filtered to ${parts.join(" · ")}.`
        : "Filters applied.";
      return { Icon: Filter, label, reversible: true };
    }
    case "highlight-products": {
      const count = action.data.ids.length;
      const label =
        count === 1 ? "Highlighted 1 tile." : `Highlighted ${count} tiles.`;
      return { Icon: Sparkles, label, reversible: false };
    }
    case "add-to-save-list":
      return { Icon: Heart, label: "Added to your save list.", reversible: false };
    case "open-save-list":
      return { Icon: Bookmark, label: "Opened your save list.", reversible: true };
    case "submit-lead":
      return { Icon: Send, label: "Sent to the showroom.", reversible: false };
    case "escalate":
      return {
        Icon: Phone,
        label: `Handing off via ${action.data.channel}.`,
        reversible: false,
      };
    case "cite":
      return null;
    default:
      return null;
  }
}

function prettifyUrl(url: string): string {
  // "/collections/marble" -> "Opened Marble collection"
  if (!url) return "Opened the page.";
  const segs = url.split("/").filter(Boolean);
  if (segs[0] === "collections" && segs[1]) {
    const name = titleCase(segs[1]);
    return `Opened ${name} collection.`;
  }
  if (segs[0] === "collections") {
    return "Opened Collections.";
  }
  if (segs.length === 0) return "Back to home.";
  return `Opened ${titleCase(segs[segs.length - 1])}.`;
}

function titleCase(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
