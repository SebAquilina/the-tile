"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Boxes,
  FileText,
  Inbox,
  LayoutDashboard,
  Menu as MenuIcon,
  MessageSquareQuote,
  Navigation as NavIcon,
  Palette,
  Route as RouteIcon,
  Settings as SettingsIcon,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const ITEMS: Item[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Tiles", icon: Boxes },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/navigation", label: "Navigation", icon: NavIcon },
  { href: "/admin/theme", label: "Theme", icon: Palette },
  { href: "/admin/agent", label: "Agent", icon: Sparkles },
  { href: "/admin/redirects", label: "Redirects", icon: RouteIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-space-1 p-space-3">
      {ITEMS.map((it) => {
        const Icon = it.icon;
        const active = isActive(pathname, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-space-3 rounded-md px-space-3 py-space-2 text-sm transition-colors duration-fast",
              active
                ? "bg-umber/10 text-umber-strong font-medium"
                : "text-ink-muted hover:bg-surface-muted hover:text-ink",
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn("h-4 w-4 shrink-0", active ? "text-umber-strong" : "text-ink-subtle group-hover:text-ink")}
            />
            <span className="truncate">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Desktop-only sticky sidebar. Hidden on small screens. */
export function DesktopSidebar() {
  const pathname = usePathname() ?? "/admin";
  return (
    <aside
      aria-label="Admin navigation"
      className={cn(
        "hidden md:flex flex-col",
        "sticky top-[64px] h-[calc(100dvh-64px)]",
        "w-[220px] shrink-0 border-r border-line bg-surface/60",
        "overflow-y-auto",
      )}
    >
      <NavList pathname={pathname} />
    </aside>
  );
}

/** Mobile-only hamburger button + slide-out drawer. Hidden on md+. */
export function MobileNavToggle() {
  const pathname = usePathname() ?? "/admin";
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        aria-expanded={open}
        className={cn(
          "md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md",
          "border border-line bg-surface text-ink",
          "hover:bg-surface-muted",
          "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
        )}
      >
        <MenuIcon className="h-5 w-5" />
      </button>
      {open ? (
        <div
          className="md:hidden fixed inset-0 z-40"
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="absolute left-0 top-0 h-dvh w-[260px] bg-surface border-r border-line shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-space-4 py-space-3 border-b border-line">
              <span className="font-display text-lg text-ink">Admin</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex items-center justify-center h-9 w-9 rounded-md text-ink-muted hover:text-ink hover:bg-surface-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
