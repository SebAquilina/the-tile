"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Lightweight consent banner.
 *
 * We are cookieless for analytics (Plausible) and the only first-party
 * persistence is session-scoped (agent session id, save-list) or
 * preference-scoped (theme). This banner reflects that: it is informational
 * plus a single acknowledge button, no separate accept/reject flow.
 *
 * If the client later decides to enable cookie-based analytics, swap the
 * acknowledge-only UX for a granular opt-in matrix.
 */

const STORAGE_KEY = "the-tile:cookie-ack";

function readAck(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer the decision to after hydration so SSR / hydration match.
    const acked = readAck();
    if (!acked) {
      // Small delay — let the AgentHero grab attention first on cold load.
      const t = window.setTimeout(() => setVisible(true), 1200);
      return () => window.clearTimeout(t);
    }
  }, []);

  function acknowledge() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage blocked — still hide for this session.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Privacy notice"
      aria-modal="false"
      className={cn(
        "fixed inset-x-space-4 bottom-space-4 z-50",
        "mx-auto max-w-content rounded-md border border-line bg-surface-elevated shadow-lg",
        "p-space-5",
      )}
    >
      <div className="flex flex-col gap-space-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-prose text-sm text-ink-muted">
          <p className="font-medium text-ink">A quick note on storage.</p>
          <p className="mt-space-2">
            We use cookieless analytics and a small session identifier so the
            concierge can follow a conversation across pages. Nothing is sent
            to advertisers. Full details on the{" "}
            <Link
              href="/cookies"
              className="text-umber underline underline-offset-4 hover:text-umber-strong"
            >
              cookie policy
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={acknowledge}
          className={cn(
            "self-start md:self-center",
            "inline-flex items-center rounded-md bg-umber px-space-5 py-space-3 text-sm font-medium text-surface",
            "hover:bg-umber-strong",
            "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
          )}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
