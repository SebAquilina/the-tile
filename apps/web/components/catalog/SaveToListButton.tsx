"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSaveList } from "@/lib/save-list";
import { useToast } from "@/components/ui";

export interface SaveToListButtonProps {
  productId: string;
  size?: "sm" | "md";
  /** Optional extra class (e.g. for absolute positioning on a card). */
  className?: string;
  /** Optional accessible name override. */
  label?: string;
}

const sizeMap = {
  sm: { btn: "h-8 w-8", icon: "h-4 w-4" },
  md: { btn: "h-10 w-10", icon: "h-5 w-5" },
} as const;

/**
 * Heart toggle bound to the save-list. Lives outside any <Link> wrapping its
 * parent card (TileCard positions it absolutely so nested-anchor rules aren't
 * violated).
 */
export function SaveToListButton({
  productId,
  size = "md",
  className,
  label,
}: SaveToListButtonProps) {
  const { has, toggle } = useSaveList();
  const toast = useToast();
  const [popping, setPopping] = useState(false);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      prefersReducedMotion.current = mq.matches;
    };
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  const saved = has(productId);
  const dims = sizeMap[size];

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const wasSaved = saved;
      toggle(productId);
      if (!prefersReducedMotion.current) {
        setPopping(true);
        window.setTimeout(() => setPopping(false), 180);
      }
      if (wasSaved) {
        toast.info("Removed from list");
      } else {
        toast.success("Saved to list");
      }
    },
    [productId, saved, toggle, toast],
  );

  const ariaLabel = label ?? (saved ? "Remove from save list" : "Save to list");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "bg-surface/90 backdrop-blur border border-line",
        "transition-all duration-fast ease-out",
        "hover:border-umber hover:bg-surface",
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
        dims.btn,
        popping && "scale-[1.2]",
        className,
      )}
    >
      <Heart
        aria-hidden="true"
        className={cn(
          dims.icon,
          "transition-colors duration-fast ease-out",
          saved ? "fill-umber stroke-umber" : "fill-none stroke-ink-subtle",
        )}
      />
    </button>
  );
}
