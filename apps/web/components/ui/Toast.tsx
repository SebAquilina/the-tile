"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastKind = "info" | "success" | "error";

export interface ToastItem {
  id: string;
  kind: ToastKind;
  title?: ReactNode;
  message: ReactNode;
  /** Milliseconds until auto-dismiss. 0 = persistent. Default 5000. */
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id" | "kind"> & { kind?: ToastKind }) => string;
  dismiss: (id: string) => void;
  success: (message: ReactNode, opts?: Partial<Omit<ToastItem, "kind" | "message">>) => string;
  error: (message: ReactNode, opts?: Partial<Omit<ToastItem, "kind" | "message">>) => string;
  info: (message: ReactNode, opts?: Partial<Omit<ToastItem, "kind" | "message">>) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_STACK = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const hovered = useRef<Set<string>>(new Set());
  const timers = useRef<Map<string, { remaining: number; started: number; timeoutId: number }>>(
    new Map(),
  );

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      window.clearTimeout(t.timeoutId);
      timers.current.delete(id);
    }
    hovered.current.delete(id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, duration: number) => {
      if (duration <= 0) return;
      const timeoutId = window.setTimeout(() => dismiss(id), duration);
      timers.current.set(id, { remaining: duration, started: Date.now(), timeoutId });
    },
    [dismiss],
  );

  const push = useCallback<ToastContextValue["push"]>(
    ({ kind = "info", duration = 5000, ...rest }) => {
      const id = Math.random().toString(36).slice(2, 10);
      setToasts((prev) => {
        const next = [...prev, { id, kind, duration, ...rest } as ToastItem];
        return next.length > MAX_STACK ? next.slice(next.length - MAX_STACK) : next;
      });
      scheduleDismiss(id, duration);
      return id;
    },
    [scheduleDismiss],
  );

  const success = useCallback<ToastContextValue["success"]>(
    (message, opts) => push({ kind: "success", message, ...opts }),
    [push],
  );
  const error = useCallback<ToastContextValue["error"]>(
    (message, opts) => push({ kind: "error", message, ...opts }),
    [push],
  );
  const info = useCallback<ToastContextValue["info"]>(
    (message, opts) => push({ kind: "info", message, ...opts }),
    [push],
  );

  // Pause-on-hover: clear pending timeout, recompute remaining time, resume on leave.
  const pause = (id: string) => {
    hovered.current.add(id);
    const t = timers.current.get(id);
    if (!t) return;
    window.clearTimeout(t.timeoutId);
    const elapsed = Date.now() - t.started;
    t.remaining = Math.max(0, t.remaining - elapsed);
  };
  const resume = (id: string) => {
    hovered.current.delete(id);
    const t = timers.current.get(id);
    if (!t) return;
    if (t.remaining <= 0) {
      dismiss(id);
      return;
    }
    t.started = Date.now();
    t.timeoutId = window.setTimeout(() => dismiss(id), t.remaining);
  };

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t.timeoutId));
      timers.current.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, push, dismiss, success, error, info }),
    [toasts, push, dismiss, success, error, info],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onPause={pause} onResume={resume} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

interface ToastViewportProps {
  toasts: ToastItem[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDismiss: (id: string) => void;
}

function ToastViewport({ toasts, onPause, onResume, onDismiss }: ToastViewportProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className={cn(
        "pointer-events-none fixed z-50 flex flex-col gap-space-3",
        // Mobile: top, full-width-ish. Desktop: top-right.
        "top-space-5 left-space-4 right-space-4",
        "md:left-auto md:right-space-7 md:top-space-7 md:w-[360px]",
      )}
    >
      {toasts.map((t) => (
        <ToastCard
          key={t.id}
          toast={t}
          onMouseEnter={() => onPause(t.id)}
          onMouseLeave={() => onResume(t.id)}
          onFocus={() => onPause(t.id)}
          onBlur={() => onResume(t.id)}
          onDismiss={() => onDismiss(t.id)}
        />
      ))}
    </div>
  );
}

interface ToastCardProps {
  toast: ToastItem;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onDismiss: () => void;
}

function ToastCard({
  toast,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onDismiss,
}: ToastCardProps) {
  const Icon = toast.kind === "success" ? CheckCircle2 : toast.kind === "error" ? AlertCircle : Info;
  const iconColor =
    toast.kind === "success" ? "text-success" : toast.kind === "error" ? "text-error" : "text-umber";

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn(
        "pointer-events-auto",
        "flex items-start gap-space-3 p-space-4",
        "bg-surface border border-line rounded-lg shadow-md",
        "animate-toast-in",
      )}
    >
      <span aria-hidden="true" className={cn("mt-[2px] inline-flex", iconColor)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        {toast.title ? (
          <p className="text-sm font-medium text-ink">{toast.title}</p>
        ) : null}
        <p className="text-sm text-ink-muted break-words">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className={cn(
          "inline-flex items-center justify-center h-6 w-6 rounded-md",
          "text-ink-subtle hover:text-ink hover:bg-surface-muted",
          "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
          "transition-colors duration-fast ease-out",
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
