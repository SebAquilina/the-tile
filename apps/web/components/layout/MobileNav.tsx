"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Bookmark, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { NavItem } from "./Header";

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  saveCount: number;
}

export function MobileNav({ open, onClose, items, saveCount }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  // Esc closes, body scroll locked
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    // Focus first link when drawer opens
    requestAnimationFrame(() => firstLinkRef.current?.focus());

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      id="mobile-nav"
      className={cn(
        "fixed inset-0 z-50 md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        className={cn(
          "absolute inset-0 bg-ink/40",
          "transition-opacity duration-base ease-out",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={cn(
          "absolute right-0 top-0 h-full w-[min(88vw,360px)]",
          "bg-surface shadow-lg border-l border-line",
          "flex flex-col",
          "transition-transform duration-base ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-space-5 py-space-4 border-b border-line">
          <span className="font-display text-xl text-ink">THE TILE</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={cn(
              "inline-flex items-center justify-center h-11 w-11 rounded-md",
              "text-ink hover:bg-surface-muted",
              "transition-colors duration-fast ease-out",
              "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Primary mobile" className="flex-1 overflow-y-auto">
          <ul className="flex flex-col py-space-4">
            {items.map((item, idx) => (
              <li key={item.href}>
                <Link
                  ref={idx === 0 ? firstLinkRef : undefined}
                  href={item.href}
                  onClick={onClose}
                  tabIndex={open ? 0 : -1}
                  className={cn(
                    "block px-space-5 py-space-4",
                    "font-display text-2xl text-ink",
                    "hover:bg-surface-muted",
                    "transition-colors duration-fast ease-out",
                    "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:-outline-offset-2",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-line px-space-5 py-space-4">
          <Link
            href="/save-list"
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className={cn(
              "inline-flex items-center gap-space-2",
              "text-sm text-ink-muted hover:text-ink",
              "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 rounded-sm",
            )}
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            Save list
            {saveCount > 0 ? (
              <span className="ml-1 text-ink">({saveCount})</span>
            ) : null}
          </Link>
        </div>
      </div>
    </div>
  );
}
