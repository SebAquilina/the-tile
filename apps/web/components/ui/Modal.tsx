"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalHandle {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
}

export interface ModalProps {
  title?: ReactNode;
  description?: ReactNode;
  size?: ModalSize;
  children?: ReactNode;
  /** Optional footer slot (typically action buttons). */
  footer?: ReactNode;
  /** Hide the built-in close button (e.g. for forced-choice modals). */
  hideCloseButton?: boolean;
  /** Fires after the modal has actually closed. */
  onClose?: () => void;
  /** Controlled mode: if provided, the modal reflects this prop. */
  open?: boolean;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-[480px]",
  md: "max-w-[640px]",
  lg: "max-w-[900px]",
};

/**
 * <dialog>-based Modal with Esc-to-close, body scroll lock, and a
 * simple focus trap (focus first focusable on open, return focus on close).
 *
 * Usage — imperative:
 *   const modal = useRef<ModalHandle>(null);
 *   <Modal ref={modal} title="…">…</Modal>
 *   modal.current?.open();
 *
 * Usage — controlled:
 *   <Modal open={flag} onClose={() => setFlag(false)}>…</Modal>
 */
export const Modal = forwardRef<ModalHandle, ModalProps>(function Modal(
  {
    title,
    description,
    size = "md",
    children,
    footer,
    hideCloseButton,
    onClose,
    open: controlledOpen,
    className,
  },
  ref,
) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const doOpen = useCallback(() => {
    const el = dialogRef.current;
    if (!el || el.open) return;
    previouslyFocusedRef.current = (document.activeElement as HTMLElement) ?? null;
    el.showModal();
    setIsOpen(true);
    // Focus first focusable after paint.
    requestAnimationFrame(() => {
      const focusable = getFocusable(el);
      (focusable[0] ?? el).focus();
    });
  }, []);

  const doClose = useCallback(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (el.open) el.close();
    setIsOpen(false);
    // Restore focus.
    const prev = previouslyFocusedRef.current;
    if (prev && typeof prev.focus === "function") {
      try {
        prev.focus();
      } catch {
        /* ignore */
      }
    }
    onClose?.();
  }, [onClose]);

  useImperativeHandle(
    ref,
    () => ({
      open: doOpen,
      close: doClose,
      isOpen: () => isOpen,
    }),
    [doOpen, doClose, isOpen],
  );

  // Reflect controlled `open` prop into the dialog.
  useEffect(() => {
    if (controlledOpen === undefined) return;
    if (controlledOpen && !isOpen) doOpen();
    else if (!controlledOpen && isOpen) doClose();
  }, [controlledOpen, isOpen, doOpen, doClose]);

  // Body scroll lock + listen for native `close` event (Esc fires this).
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onNativeClose = () => {
      setIsOpen(false);
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === "function") {
        try {
          prev.focus();
        } catch {
          /* ignore */
        }
      }
      onClose?.();
    };
    el.addEventListener("close", onNativeClose);
    return () => el.removeEventListener("close", onNativeClose);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Simple focus trap: loop Tab inside the dialog.
  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable(el);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !el.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Backdrop click to close.
  const onDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) doClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={onDialogClick}
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
      className={cn(
        // Reset default <dialog> styles; the dialog itself is the card.
        "bg-transparent p-0 m-auto",
        "backdrop:bg-ink/60 backdrop:backdrop-blur-sm",
        // open animation uses transition-duration token
      )}
    >
      <div
        className={cn(
          "relative w-[calc(100vw-2rem)] mx-auto",
          sizeClasses[size],
          "bg-surface text-ink rounded-xl shadow-lg border border-line",
          "p-space-7",
          className,
        )}
      >
        {hideCloseButton ? null : (
          <button
            type="button"
            onClick={doClose}
            aria-label="Close"
            className={cn(
              "absolute top-space-4 right-space-4 inline-flex items-center justify-center",
              "h-9 w-9 rounded-md text-ink-muted",
              "hover:bg-surface-muted hover:text-ink",
              "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
              "transition-colors duration-fast ease-out",
            )}
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {title ? (
          <h2 id="modal-title" className="font-display text-2xl text-ink mb-space-3 pr-space-8">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p id="modal-description" className="text-base text-ink-muted mb-space-5">
            {description}
          </p>
        ) : null}
        <div className="text-base text-ink">{children}</div>
        {footer ? (
          <div className="mt-space-6 flex items-center justify-end gap-space-3">{footer}</div>
        ) : null}
      </div>
    </dialog>
  );
});

function getFocusable(root: HTMLElement): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("aria-hidden") && el.offsetParent !== null,
  );
}

/**
 * Imperative helper hook. Returns a ref to attach to <Modal> plus `open`/`close`.
 *   const { modalRef, open, close } = useModal();
 *   <Modal ref={modalRef} title="…">…</Modal>
 *   <Button onClick={open}>Open</Button>
 */
export function useModal() {
  const modalRef = useRef<ModalHandle | null>(null);
  const open = useCallback(() => modalRef.current?.open(), []);
  const close = useCallback(() => modalRef.current?.close(), []);
  return { modalRef, open, close };
}
