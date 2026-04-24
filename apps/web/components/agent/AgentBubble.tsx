"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { emit } from "@/lib/events";

export interface AgentBubbleProps {
  /** When true, hide the bubble (e.g. hero is showing or panel is open). */
  hidden?: boolean;
}

/**
 * Floating 56px circular button bottom-right of the viewport. Dispatches
 * `agent:open` (no seed) when clicked. Hidden while the AgentHero is
 * rendered or while the AgentPanel is already open.
 */
export function AgentBubble({ hidden }: AgentBubbleProps) {
  if (hidden) return null;

  return (
    <button
      type="button"
      aria-label="Open concierge"
      onClick={() => emit("agent:open", {})}
      className={cn(
        "fixed bottom-space-7 right-space-7 z-30",
        "inline-flex h-14 w-14 items-center justify-center rounded-full",
        "bg-umber text-canvas shadow-lg",
        "transition-transform duration-fast ease-out",
        "hover:-translate-y-0.5 hover:bg-umber-strong",
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
      )}
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
