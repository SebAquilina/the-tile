"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { SendHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, Textarea, useToast } from "@/components/ui";
import { executeAction, on, type AgentAction } from "@/lib/events";
import { sendChatMessage } from "@/lib/agent-client";
import type { AgentMessage } from "@/lib/schemas";
import { ActionReceipt } from "./ActionReceipt";

export interface AgentPanelProps {
  open: boolean;
  onClose: () => void;
}

interface StoredMessage extends AgentMessage {
  id: string;
  actions?: AgentAction[];
}

/**
 * Right-docked side panel on desktop (~440px), full-height sheet on mobile.
 * Listens for `agent:open` events (dispatched by AgentHero and AgentBubble);
 * when the event includes `detail.seed`, the seed is posted as the first user
 * message on mount.
 */
export function AgentPanel({ open, onClose }: AgentPanelProps) {
  const router = useRouter();
  const toast = useToast();

  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [currentAssistantText, setCurrentAssistantText] = useState("");
  const [currentActions, setCurrentActions] = useState<AgentAction[]>([]);
  const [input, setInput] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stable session id, generated once on mount.
  const [sessionId] = useState<string>(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  });

  // Focus the textarea when the panel opens.
  useEffect(() => {
    if (open) {
      // Defer so the panel has rendered before focusing.
      const id = window.setTimeout(() => textareaRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  // Auto-scroll to the bottom when new content lands.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, currentAssistantText, streaming]);

  // Esc closes the panel without clearing the conversation.
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Clean up the in-flight stream if the component unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const userMsg: StoredMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
      };

      // Capture the full history that the server needs (including the user msg).
      const historyForServer: AgentMessage[] = [
        ...messages.map(({ role, content }) => ({ role, content })),
        { role: userMsg.role, content: userMsg.content },
      ];

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setStreaming(true);
      setCurrentAssistantText("");
      setCurrentActions([]);

      const controller = new AbortController();
      abortRef.current = controller;

      const collectedActions: AgentAction[] = [];
      let visibleText = "";

      await sendChatMessage({
        messages: historyForServer,
        sessionId,
        signal: controller.signal,
        onDelta: (delta) => {
          setCurrentAssistantText((prev) => prev + delta);
        },
        onAction: (action) => {
          collectedActions.push(action);
          setCurrentActions((prev) => [...prev, action]);
          // Fire side-effects as they land.
          void executeAction(action, router, toast);
        },
        onError: (err) => {
          toast.error(`Concierge hiccup: ${err}`);
        },
        onDone: (final) => {
          visibleText = final;
        },
      });

      // Commit the assistant message.
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: visibleText || "",
          actions: collectedActions,
        },
      ]);
      setStreaming(false);
      setCurrentAssistantText("");
      setCurrentActions([]);
      abortRef.current = null;
    },
    [messages, router, sessionId, streaming, toast],
  );

  // Listen for `agent:open` events — a seed means the caller wants to kick off
  // the conversation with a first user message.
  useEffect(() => {
    const off = on("agent:open", (detail) => {
      const seed = detail?.seed?.trim();
      if (seed) {
        // Submit after the panel is open + this tick finishes.
        window.setTimeout(() => {
          void submit(seed);
        }, 50);
      }
    });
    return off;
  }, [submit]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    void submit(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || streaming) return;
      void submit(input);
    }
  };

  const assistantStreamingBlock = useMemo(() => {
    if (!streaming) return null;
    return (
      <AssistantBubble
        content={currentAssistantText || ""}
        actions={currentActions}
        streaming
      />
    );
  }, [streaming, currentAssistantText, currentActions]);

  return (
    <>
      {/* Backdrop — mobile only so the side panel on desktop stays non-modal. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-ink/20 transition-opacity duration-base ease-out md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="false"
        aria-label="Concierge chat"
        className={cn(
          "fixed z-50 bg-canvas",
          "border-l border-line shadow-lg",
          "flex flex-col",
          // Mobile: full-sheet from bottom.
          "inset-x-0 bottom-0 top-0",
          // Desktop: 440px side panel docked right.
          "md:left-auto md:right-0 md:w-[440px]",
          "transition-transform duration-base ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-line px-space-5 py-space-4">
          <h2 className="font-display text-2xl text-ink">Concierge</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close concierge"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md",
              "text-ink-muted hover:text-ink hover:bg-surface-muted",
              "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-space-5 py-space-4"
          aria-live="polite"
        >
          <ul className="flex flex-col gap-space-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <li key={m.id} className="flex justify-end">
                  <div
                    className={cn(
                      "max-w-[85%] rounded-md px-space-4 py-space-3",
                      "bg-umber text-canvas",
                      "text-sm leading-relaxed whitespace-pre-wrap break-words",
                    )}
                  >
                    {m.content}
                  </div>
                </li>
              ) : (
                <li key={m.id} className="flex flex-col items-start">
                  <AssistantBubble
                    content={m.content}
                    actions={m.actions ?? []}
                    streaming={false}
                  />
                </li>
              ),
            )}
            {assistantStreamingBlock ? (
              <li className="flex flex-col items-start">{assistantStreamingBlock}</li>
            ) : null}
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-line bg-surface px-space-4 py-space-3"
        >
          <div className="flex items-end gap-space-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Ask for a tile, a collection, a room…"
                disabled={streaming}
                aria-label="Message the concierge"
                className="resize-none"
              />
            </div>
            <Button
              type="submit"
              size="md"
              disabled={streaming || !input.trim()}
              aria-label="Send message"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}

interface AssistantBubbleProps {
  content: string;
  actions: AgentAction[];
  streaming: boolean;
}

function AssistantBubble({ content, actions, streaming }: AssistantBubbleProps) {
  return (
    <div className="max-w-full">
      <div
        className={cn(
          "max-w-[90%] rounded-md border border-line bg-cream",
          "px-space-4 py-space-3",
          "text-sm leading-relaxed text-ink",
        )}
      >
        <div
          className={cn(
            "prose prose-sm max-w-none",
            "[&_p]:my-space-2 [&_ul]:my-space-2 [&_ol]:my-space-2",
            "[&_strong]:text-ink [&_a]:text-umber [&_a]:underline",
          )}
        >
          {content ? (
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
              {content}
            </ReactMarkdown>
          ) : streaming ? (
            <span className="text-ink-muted">…</span>
          ) : null}
        </div>
        {streaming ? (
          <span
            aria-hidden="true"
            className="ml-1 inline-block animate-pulse text-ink"
          >
            ▍
          </span>
        ) : null}
      </div>
      {actions.length > 0 ? (
        <div className="mt-space-1 flex flex-wrap gap-space-2">
          {actions.map((a, i) => (
            <ActionReceipt key={i} action={a} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
