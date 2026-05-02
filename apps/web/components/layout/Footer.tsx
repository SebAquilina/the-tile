"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, Input, useToast } from "@/components/ui";
import { BUSINESS } from "@/lib/business-info";
import type { SettingsRow } from "@/lib/settings/store";
import type { MenuItemType } from "@/lib/navigation/store";

export interface FooterProps {
  settings?: SettingsRow | null;
  footerMenu?: MenuItemType[] | null;
}

type Theme = "light" | "dark";

interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

const COLUMNS: FooterColumn[] = [
  {
    heading: "About",
    links: [
      { label: "Our story", href: "/about" },
      { label: "Journal", href: "/journal" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Collections",
    links: [
      { label: "All collections", href: "/collections" },
      { label: "Marble effect", href: "/collections/marble" },
      { label: "Wood effect", href: "/collections/wood" },
      { label: "Stone effect", href: "/collections/stone" },
      { label: "Brands", href: "/brands" },
    ],
  },
  {
    heading: "Visit",
    links: [
      { label: "Showroom", href: "/showroom" },
      { label: "Save list", href: "/save-list" },
      { label: "Request a quote", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
];

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("theme");
  return stored === "light" || stored === "dark" ? stored : null;
}

function readSystemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

export function Footer({ settings, footerMenu }: FooterProps = {}) {
  // Phantom-UI fix CR-B4: prefer D1-backed site_settings over BUSINESS const,
  // so /admin/settings edits actually reach the public footer.
  const phoneDisplay = settings?.contact_phone || BUSINESS.phoneDisplay;
  const phoneTel = (settings?.contact_phone || BUSINESS.phoneTel).replace(/\s+/g, "");
  const contactEmail = settings?.contact_email || BUSINESS.email;
  const addressDisplay = settings?.address || BUSINESS.addressDisplay;

  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const toast = useToast();

  // Initialise from storage or system preference.
  useEffect(() => {
    const stored = readStoredTheme();
    const initial = stored ?? readSystemTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        window.localStorage.setItem("theme", next);
      } catch {
        // Storage can be blocked (privacy mode, quota). Ignore — the class flip
        // still works for this session.
      }
      return next;
    });
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const onNewsletterSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (submitting) return;
      const trimmed = email.trim();
      if (!trimmed) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: trimmed, source: "footer" }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { errors?: Array<{ message: string }>; error?: string };
          if (res.status === 429) {
            toast.error("Too many attempts — try again in a minute.");
          } else if (j?.errors?.[0]?.message) {
            toast.error(j.errors[0].message);
          } else {
            toast.error("Could not subscribe — please try again.");
          }
          return;
        }
        toast.success("We'll be in touch when there's something worth your inbox.", {
          title: "Subscribed",
        });
        setEmail("");
      } catch {
        toast.error("Network error — please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [email, submitting, toast],
  );

  return (
    <footer
      className={cn(
        "mt-space-10 border-t border-line bg-surface-muted text-ink",
      )}
      aria-labelledby="site-footer-heading"
    >
      <h2 id="site-footer-heading" className="sr-only">
        Site
      </h2>
      <div className="mx-auto max-w-wide px-space-5 md:px-space-7 py-space-9">
        {/* Wordmark + newsletter */}
        <div className="flex flex-col gap-space-7 md:flex-row md:items-end md:justify-between">
          <Link
            href="/"
            aria-label="The Tile — home"
            className={cn(
              "font-display text-4xl md:text-5xl tracking-tight text-ink",
              "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 rounded-md",
            )}
          >
            THE TILE
          </Link>

          <div className="w-full md:w-auto md:min-w-[360px]">
            <p className="font-display text-lg text-ink mb-space-3">
              New collections, quietly.
            </p>
            <form
              onSubmit={onNewsletterSubmit}
              aria-label="Subscribe to the newsletter"
            >
            <div className="flex flex-col gap-space-2 sm:flex-row sm:items-end">
              <Input
                type="email"
                required
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                containerClassName="flex-1"
                autoComplete="email"
              />
              <Button type="submit" variant="primary" size="md">
                Join
              </Button>
            </div>
            </form>
          </div>
        </div>

        {/* 4 structural columns + 1 operator-managed (rendered from D1
            menus.handle='footer' via /admin/navigation). Per ref 25 +
            ref 34 admin-public coverage SOP — every admin write must
            reach a public surface. */}
        <div className={cn(
          "mt-space-9 grid grid-cols-2 gap-space-7",
          (footerMenu && footerMenu.length > 0) ? "md:grid-cols-5" : "md:grid-cols-4",
        )}>
          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="font-sans text-sm font-medium text-ink">
                {col.heading}
              </h3>
              <ul className="mt-space-4 flex flex-col gap-space-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={cn(
                        "text-sm text-ink-muted hover:text-ink",
                        "transition-colors duration-fast ease-out",
                        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 rounded-sm",
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          {footerMenu && footerMenu.length > 0 ? (
            <nav aria-label="More" data-source="d1-menus-footer">
              <h3 className="font-sans text-sm font-medium text-ink">More</h3>
              <ul className="mt-space-4 flex flex-col gap-space-3">
                {footerMenu.map((it) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      target={it.external ? "_blank" : undefined}
                      rel={it.external ? "noopener noreferrer" : undefined}
                      className={cn(
                        "text-sm text-ink-muted hover:text-ink",
                        "transition-colors duration-fast ease-out",
                        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 rounded-sm",
                      )}
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>

        {/* Bottom bar */}
        <div
          className={cn(
            "mt-space-9 pt-space-5 border-t border-line",
            "flex flex-col gap-space-4 md:flex-row md:items-center md:justify-between",
          )}
        >
          <div className="flex flex-col gap-space-1 text-xs text-ink-subtle">
            <p>
              &copy; 2026 The Tile &middot; {addressDisplay} &middot;
              Since {BUSINESS.foundedYear}
            </p>
            <p className="flex flex-wrap items-center gap-space-2">
              <a
                href={`tel:${phoneTel}`}
                className="hover:text-ink"
              >
                {phoneDisplay}
              </a>
              <span aria-hidden="true">·</span>
              <a
                href={`mailto:${contactEmail}`}
                className="hover:text-ink"
              >
                {email}
              </a>
              <span aria-hidden="true">·</span>
              <a
                href={BUSINESS.social.facebook}
                rel="noopener noreferrer"
                target="_blank"
                className="hover:text-ink"
              >
                Facebook
              </a>
              <span aria-hidden="true">·</span>
              <a
                href={BUSINESS.social.instagram}
                rel="noopener noreferrer"
                target="_blank"
                className="hover:text-ink"
              >
                Instagram
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="/admin"
                className="text-ink-subtle/70 hover:text-ink"
                title="Staff sign-in"
              >
                Staff
              </a>
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              mounted
                ? theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
                : "Toggle theme"
            }
            aria-pressed={mounted ? theme === "dark" : undefined}
            className={cn(
              "inline-flex items-center gap-space-2 self-start",
              "h-11 px-space-4 rounded-md border border-line text-sm text-ink",
              "hover:border-umber hover:text-umber",
              "transition-colors duration-fast ease-out",
              "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
            )}
          >
            {mounted && theme === "dark" ? (
              <>
                <Sun className="h-4 w-4" aria-hidden="true" />
                <span>Light mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" aria-hidden="true" />
                <span>Dark mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
