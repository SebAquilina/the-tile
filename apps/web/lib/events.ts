/**
 * Typed event bus over `window` CustomEvents for the agent↔frontend contract.
 *
 * Actions come back from the agent in the SSE stream (see lib/agent-client.ts).
 * `executeAction` is the single place that maps an action to a side-effect —
 * either a router push, a scroll, or a CustomEvent dispatched on `window` that
 * other islands (filter bar, save-list provider, etc.) listen for.
 *
 * Event names intentionally namespace by the target domain: `catalog:*`,
 * `save-list:*`, `agent:*`, `hero:*`.
 */

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// --- Action types (mirror `docs/spec/the-tile/07-agent-system-prompt.md`) ---

export type AgentAction =
  | { type: "navigate"; data: { url: string } }
  | { type: "scroll"; data: { selector: string } }
  | {
      type: "filter";
      data: {
        effect?: string;
        usage?: string;
        brand?: string;
        tag?: string;
        q?: string;
      };
    }
  | { type: "highlight-products"; data: { ids: string[] } }
  | { type: "add-to-save-list"; data: { productId: string } }
  | { type: "open-save-list" }
  | {
      type: "submit-lead";
      data: {
        name: string;
        email: string;
        phone?: string;
        projectNotes?: string;
        areaM2?: number;
        saveIds?: string[];
      };
    }
  | {
      type: "escalate";
      data: {
        channel: "email" | "whatsapp" | "showroom";
        reason?: string;
      };
    }
  | { type: "cite"; data: { productIds: string[] } };

export type AgentActionType = AgentAction["type"];

/**
 * Map of custom event names → expected `detail` payload shape. Any component
 * that listens via `on("catalog:filter", cb)` gets a typed `detail` argument.
 */
export interface AgentEventMap {
  "agent:open": { seed?: string };
  "agent:close": undefined;
  "hero:showing": undefined;
  "hero:dismissed": undefined;
  "catalog:filter": {
    effect?: string;
    usage?: string;
    brand?: string;
    tag?: string;
    q?: string;
  };
  "catalog:highlight": { ids: string[] };
  "save-list:add": { productId: string };
  "save-list:open": undefined;
}

// --- Emit / on helpers ---

export function emit<K extends keyof AgentEventMap>(
  eventName: K,
  detail?: AgentEventMap[K],
): void {
  if (typeof window === "undefined") return;
  const event =
    detail === undefined
      ? new CustomEvent(eventName)
      : new CustomEvent(eventName, { detail });
  window.dispatchEvent(event);
}

export function on<K extends keyof AgentEventMap>(
  eventName: K,
  cb: (detail: AgentEventMap[K]) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<AgentEventMap[K]>).detail;
    cb(detail);
  };
  window.addEventListener(eventName, handler);
  return () => window.removeEventListener(eventName, handler);
}

// --- Toast shape (loose — we only need `.success` / `.info` / `.error`) ---

export interface ToastLike {
  success: (message: string) => void;
  info: (message: string) => void;
  error: (message: string) => void;
}

// --- executeAction: the single dispatcher ---

export async function executeAction(
  action: AgentAction,
  router: AppRouterInstance,
  toast: ToastLike,
): Promise<void> {
  switch (action.type) {
    case "navigate": {
      const url = action.data?.url;
      if (url) router.push(url);
      return;
    }

    case "scroll": {
      const selector = action.data?.selector;
      if (!selector || typeof document === "undefined") return;
      try {
        const el = document.querySelector(selector);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } catch {
        // Invalid selector — silently drop.
      }
      return;
    }

    case "filter": {
      emit("catalog:filter", action.data);
      return;
    }

    case "highlight-products": {
      const ids = action.data?.ids;
      if (Array.isArray(ids) && ids.length > 0) {
        emit("catalog:highlight", { ids });
      }
      return;
    }

    case "add-to-save-list": {
      const productId = action.data?.productId;
      if (productId) {
        emit("save-list:add", { productId });
        toast.success("Added to your save list.");
      }
      return;
    }

    case "open-save-list": {
      router.push("/save-list");
      return;
    }

    case "submit-lead": {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: action.data.name,
            email: action.data.email,
            phone: action.data.phone,
            message: action.data.projectNotes ?? "",
            consentGiven: true,
            saveListIds: action.data.saveIds ?? [],
          }),
        });
        if (res.ok) {
          toast.success("Message sent — the showroom will be in touch.");
        } else {
          toast.error("Couldn't send that — please try again in a moment.");
        }
      } catch {
        toast.error("Couldn't send that — please try again in a moment.");
      }
      return;
    }

    case "escalate": {
      const channel = action.data?.channel ?? "email";
      toast.info(`We'll reach out via ${channel}.`);
      return;
    }

    case "cite": {
      // Metadata only — no visible side effect in Phase 0.
      if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[agent] cite", action.data);
      }
      return;
    }

    default: {
      // Unknown action — ignore.
      return;
    }
  }
}
