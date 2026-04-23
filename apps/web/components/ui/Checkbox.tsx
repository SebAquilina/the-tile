"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  helpText?: ReactNode;
  errorMessage?: ReactNode;
  indeterminate?: boolean;
  containerClassName?: string;
}

/**
 * Native checkbox with a styled visual.
 *
 * Layout: the `<input>` is marked `peer` and is absolutely positioned over the
 * visual `<span>` (siblings in the same `relative` wrapper). The visual span
 * responds to `peer-checked` / `peer-indeterminate` / `peer-focus-visible` /
 * `peer-hover` / `peer-disabled`. The tick and the dash are rendered as
 * siblings of the box and faded in when their matching state triggers.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    id,
    label,
    helpText,
    errorMessage,
    indeterminate = false,
    containerClassName,
    className,
    disabled,
    checked,
    defaultChecked,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `checkbox-${autoId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = errorMessage ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpId, errorId].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(errorMessage);
  const localRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = localRef.current;
    if (el) el.indeterminate = indeterminate;
  }, [indeterminate]);

  const setRefs = (el: HTMLInputElement | null) => {
    localRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
  };

  return (
    <div className={cn("flex flex-col gap-space-2", containerClassName)}>
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex items-start gap-space-3 cursor-pointer select-none",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className="relative inline-flex mt-[2px] h-5 w-5 shrink-0">
          <input
            ref={setRefs}
            id={inputId}
            type="checkbox"
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(
              "peer absolute inset-0 h-5 w-5 opacity-0 cursor-pointer z-10",
              "disabled:cursor-not-allowed",
              className,
            )}
            {...props}
          />
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-0 inline-flex items-center justify-center",
              "border rounded-sm bg-surface text-canvas",
              "transition-colors duration-fast ease-out",
              invalid ? "border-error" : "border-line",
              "peer-checked:bg-umber peer-checked:border-umber",
              "peer-indeterminate:bg-umber peer-indeterminate:border-umber",
              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-focus peer-focus-visible:outline-offset-2",
              "peer-hover:border-umber",
              "peer-disabled:bg-surface-muted peer-disabled:hover:border-line",
            )}
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 text-canvas",
              "opacity-0 peer-checked:opacity-100 transition-opacity duration-fast ease-out",
            )}
          >
            <polyline points="3 8.5 6.5 12 13 4.5" />
          </svg>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            className={cn(
              "pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 text-canvas",
              "opacity-0 peer-indeterminate:opacity-100 transition-opacity duration-fast ease-out",
            )}
          >
            <line x1="3" y1="8" x2="13" y2="8" />
          </svg>
        </span>
        {label ? <span className="text-base text-ink leading-snug">{label}</span> : null}
      </label>
      {helpText && !invalid ? (
        <p id={helpId} className="text-sm text-ink-muted pl-[calc(1.25rem+var(--space-3))]">
          {helpText}
        </p>
      ) : null}
      {invalid ? (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-error pl-[calc(1.25rem+var(--space-3))]"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
});
