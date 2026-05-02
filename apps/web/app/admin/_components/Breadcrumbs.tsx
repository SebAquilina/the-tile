"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const LABELS: Record<string, string> = {
  admin: "Admin",
  products: "Tiles",
  leads: "Leads",
  reviews: "Reviews",
  pages: "Pages",
  navigation: "Navigation",
  theme: "Theme",
  agent: "Agent",
  redirects: "Redirects",
  settings: "Settings",
  new: "New",
};

function pretty(seg: string): string {
  if (LABELS[seg]) return LABELS[seg];
  // ID-like — keep first 8 chars, capitalized
  return seg.length > 16 ? seg.slice(0, 8) + "…" : seg;
}

export function Breadcrumbs() {
  const pathname = usePathname() ?? "";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0 || parts[0] !== "admin") return null;

  // Build cumulative paths for each segment
  const crumbs = parts.map((seg, i) => ({
    href: "/" + parts.slice(0, i + 1).join("/"),
    label: pretty(seg),
  }));

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink-subtle">
      <ol className="flex flex-wrap items-center gap-space-1">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.href} className="inline-flex items-center gap-space-1">
              {i > 0 ? (
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-ink-subtle/60" />
              ) : null}
              {last ? (
                <span aria-current="page" className="text-ink">
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="hover:text-ink">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
