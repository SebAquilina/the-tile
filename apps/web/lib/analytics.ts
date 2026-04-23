/**
 * Thin Plausible wrapper for custom events.
 *
 * Per 04-backend-spec §5 we emit a small fixed set of custom events:
 *   agent.opened, agent.message_sent, agent.action_emitted,
 *   save_list.added, contact.submitted
 *
 * The Plausible script is injected conditionally by components/Analytics.tsx
 * when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set. When the domain is absent (local
 * dev / Phase 0) this module is a pure no-op so call sites never crash.
 */

interface PlausibleProps {
  props?: Record<string, string | number | boolean>;
}

type PlausibleFn = (event: string, options?: PlausibleProps) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn & { q?: Array<[string, PlausibleProps?]> };
  }
}

const DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export function track(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (!DOMAIN) return;
  if (typeof window === "undefined") return;

  // Plausible exposes a queue-before-load pattern; we defer to it if present.
  const fn = window.plausible;
  if (typeof fn === "function") {
    fn(event, props ? { props } : undefined);
  }
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(DOMAIN);
}
