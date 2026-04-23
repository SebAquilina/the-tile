"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Menu, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { MobileNav } from "./MobileNav";

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Collections", href: "/collections" },
  { label: "Brands", href: "/brands" },
  { label: "Showroom", href: "/showroom" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const SCROLL_THRESHOLD = 80;

/**
 * Optional save-list count hook hook-up.
 *
 * `lib/save-list.ts` is Wave 3 catalog's responsibility. Until that file
 * exists, this component renders a static 0. When the file lands and exposes
 * a `useSaveList` hook, swap the import and consume its `count`.
 */
function useSaveListCount(): number {
  // Intentionally static — see note above.
  return 0;
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const saveCount = useSaveListCount();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openAgent = useCallback(() => {
    window.dispatchEvent(new CustomEvent("agent:open"));
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    // Return focus to the hamburger that opened the drawer
    requestAnimationFrame(() => hamburgerRef.current?.focus());
  }, []);

  return (
    <>
      <a
        href="#main"
        className={cn(
          "sr-only focus:not-sr-only",
          "focus:absolute focus:left-space-4 focus:top-space-4 focus:z-50",
          "focus:bg-surface focus:text-ink focus:rounded-md focus:px-space-4 focus:py-space-2",
          "focus:shadow-md",
        )}
      >
        Skip to content
      </a>
      <header
        className={cn(
          "sticky top-0 z-40",
          "bg-canvas/90 backdrop-blur",
          "border-b border-line",
          "transition-all duration-base ease-out",
          scrolled ? "shadow-sm" : "",
        )}
      >
        <div
          className={cn(
            "mx-auto max-w-wide flex items-center justify-between",
            "px-space-5 md:px-space-7",
            "transition-all duration-base ease-out",
            scrolled ? "py-space-3" : "py-space-5",
          )}
        >
          {/* Logo wordmark */}
          <Link
            href="/"
            aria-label="The Tile — home"
            className={cn(
              "font-display tracking-tight text-ink",
              "transition-all duration-base ease-out",
              scrolled ? "text-xl" : "text-2xl",
              "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
              "rounded-md",
            )}
          >
            THE TILE
          </Link>

          {/* Desktop nav */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-space-6"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-sans text-sm text-ink-muted",
                  "hover:text-ink hover:underline underline-offset-4",
                  "transition-colors duration-fast ease-out",
                  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 focus-visible:rounded-sm",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right-side actions */}
          <div className="flex items-center gap-space-2">
            <button
              type="button"
              onClick={openAgent}
              aria-label="Open the assistant"
              className={cn(
                "inline-flex items-center justify-center h-11 w-11 rounded-md",
                "text-ink hover:bg-surface-muted",
                "transition-colors duration-fast ease-out",
                "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
              )}
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </button>

            <Link
              href="/save-list"
              aria-label={`Save list, ${saveCount} ${saveCount === 1 ? "item" : "items"}`}
              className={cn(
                "relative inline-flex items-center justify-center h-11 w-11 rounded-md",
                "text-ink hover:bg-surface-muted",
                "transition-colors duration-fast ease-out",
                "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
              )}
            >
              <Bookmark className="h-5 w-5" aria-hidden="true" />
              {saveCount > 0 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -right-0.5 -top-0.5 min-w-5 h-5 px-1",
                    "inline-flex items-center justify-center",
                    "rounded-pill bg-umber text-canvas text-xs font-medium",
                  )}
                >
                  {saveCount}
                </span>
              ) : null}
            </Link>

            <button
              ref={hamburgerRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              className={cn(
                "md:hidden inline-flex items-center justify-center h-11 w-11 rounded-md",
                "text-ink hover:bg-surface-muted",
                "transition-colors duration-fast ease-out",
                "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
              )}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      <MobileNav
        open={mobileOpen}
        onClose={closeMobile}
        items={NAV_ITEMS}
        saveCount={saveCount}
      />
    </>
  );
}
