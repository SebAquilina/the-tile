import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Server-safe inline breadcrumb. Hidden on hero pages by passing
 * `className="sr-only"` from the parent (still announced to assistive tech,
 * still rendered in the DOM for SEO).
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className={cn("w-full", className)}>
      <ol className="flex flex-wrap items-center gap-space-2 text-sm text-ink-muted">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-space-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    "hover:text-ink hover:underline underline-offset-4",
                    "transition-colors duration-fast ease-out",
                    "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 rounded-sm",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "text-ink" : undefined}
                >
                  {item.label}
                </span>
              )}
              {isLast ? null : (
                <ChevronRight
                  aria-hidden="true"
                  className="h-4 w-4 text-ink-subtle"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
