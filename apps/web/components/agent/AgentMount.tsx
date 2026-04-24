"use client";

import { useEffect, useState } from "react";
import { AgentBubble } from "./AgentBubble";
import { AgentPanel } from "./AgentPanel";
import { on } from "@/lib/events";

/**
 * Site-wide mount for the agent UI. Listens for `agent:open` to open the
 * panel and hides the floating bubble while the hero is showing or the panel
 * is open.
 */
export function AgentMount() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [heroShowing, setHeroShowing] = useState(false);

  // Work out whether the hero is currently showing. We track this via the
  // `hero:dismissed` event — but on non-home pages the hero never mounts, so
  // the bubble should always be visible. To keep things simple, we start with
  // the assumption "no hero" and let the home page flip it on via a one-off
  // `hero:showing` convention. We detect the hero's presence by checking
  // sessionStorage at mount and staying optimistic: if the hero is in the DOM
  // it sits at position:fixed zIndex higher than the bubble, and the hero's
  // handler will `hero:dismissed` when it finishes.
  useEffect(() => {
    const offOpen = on("agent:open", () => setPanelOpen(true));
    const offClose = on("agent:close", () => setPanelOpen(false));
    const offShowing = on("hero:showing", () => setHeroShowing(true));
    const offDismiss = on("hero:dismissed", () => setHeroShowing(false));

    // Sniff the DOM on mount too — handles the case where the hero has
    // already hydrated before this effect runs.
    if (typeof document !== "undefined") {
      const hero = document.querySelector('[aria-label="Concierge greeting"]');
      if (hero) setHeroShowing(true);
    }

    return () => {
      offOpen();
      offClose();
      offShowing();
      offDismiss();
    };
  }, []);

  return (
    <>
      <AgentPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
      <AgentBubble hidden={heroShowing || panelOpen} />
    </>
  );
}
