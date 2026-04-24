"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";
import { Textarea } from "@/components/ui";
import { emit } from "@/lib/events";

const STARTER_CHIPS = [
  "warm floor for a living room",
  "bathroom, something calm",
  "outdoor patio tile",
  "surprise me",
] as const;

const DISMISS_KEY = "the-tile:hero-dismissed";

/**
 * Full-viewport greeting on first visit. Morphs away (up + fade) when the
 * visitor submits a first message; the seed is handed to the AgentPanel via
 * `agent:open` with `detail.seed`.
 */
export function AgentHero() {
  const [input, setInput] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // prefers-reduced-motion check (client-only).
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    // Autofocus the input on mount (respect reduced-motion: still focus).
    textareaRef.current?.focus();
    // Tell AgentMount we're showing so the bubble stays hidden.
    emit("hero:showing");
  }, []);

  const commitDismissAndSeed = useCallback(
    (seed?: string) => {
      // Persist sessionStorage flag so reloads don't re-show the hero.
      try {
        window.sessionStorage.setItem(DISMISS_KEY, "1");
      } catch {
        // sessionStorage can throw in some embedded contexts — no-op.
      }

      const transitionMs = reducedMotion ? 0 : 400;
      // Trigger the morph-away visual.
      setDismissed(true);

      window.setTimeout(() => {
        emit("hero:dismissed");
        if (seed && seed.trim().length > 0) {
          emit("agent:open", { seed: seed.trim() });
        }
      }, transitionMs);
    },
    [reducedMotion],
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    commitDismissAndSeed(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) commitDismissAndSeed(input);
    }
  };

  const handleChip = (chipText: string) => {
    commitDismissAndSeed(chipText);
  };

  const handleBrowse = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // no-op
    }
    setDismissed(true);
    const transitionMs = reducedMotion ? 0 : 400;
    window.setTimeout(() => {
      emit("hero:dismissed");
    }, transitionMs);
  };

  return (
    <section
      aria-label="Concierge greeting"
      className={cn(
        "relative flex min-h-[100dvh] w-full flex-col",
        "bg-canvas text-ink",
        "transition-all ease-out",
        reducedMotion ? "duration-fast" : "duration-[400ms]",
        dismissed ? "-translate-y-4 opacity-0" : "translate-y-0 opacity-100",
      )}
    >
      <div className="px-space-5 pt-space-5 text-xs uppercase tracking-wide text-ink-muted md:px-space-7 md:pt-space-7">
        The Tile · since 1990
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-space-5 py-space-10 text-center md:px-space-7">
        <h1
          className={cn(
            "font-display text-4xl leading-tight text-ink md:text-6xl",
            "max-w-[18ch]",
          )}
        >
          Tell me what you are looking for.
        </h1>

        <p className="mt-space-5 max-w-prose text-base text-ink-muted md:text-lg">
          A concierge for Italian porcelain stoneware. We&apos;ll narrow sixty
          collections to the three that suit your room.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-space-7 w-full max-w-[640px]"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="a warm floor for the kitchen, something calm for a bathroom…"
            aria-label="Describe what you are looking for"
            className="text-base"
          />
        </form>

        <div className="mt-space-5 flex flex-wrap items-center justify-center gap-space-2">
          {STARTER_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChip(chip)}
              className={cn(
                "rounded-pill border border-line bg-surface px-space-4 py-space-2",
                "text-sm text-ink-muted",
                "transition-colors duration-fast ease-out",
                "hover:border-umber hover:text-umber",
                "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
              )}
            >
              {chip}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleBrowse}
          className={cn(
            "mt-space-10 text-sm text-ink-subtle underline underline-offset-4",
            "hover:text-ink-muted",
            "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
            "rounded-sm",
          )}
        >
          [just let me browse]
        </button>
      </div>
    </section>
  );
}
