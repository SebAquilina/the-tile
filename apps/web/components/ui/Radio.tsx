"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  helpText?: ReactNode;
  errorMessage?: ReactNode;
  containerClassName?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    id,
    label,
    helpText,
    errorMessage,
    containerClassName,
    className,
    disabled,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `radio-${autoId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = errorMessage ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpId, errorId].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(errorMessage);

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
            ref={ref}
            id={inputId}
            type="radio"
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
              "border rounded-pill bg-surface",
              "transition-colors duration-fast ease-out",
              invalid ? "border-error" : "border-line",
              "peer-hover:border-umber",
              "peer-checked:border-umber",
              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-focus peer-focus-visible:outline-offset-2",
              "peer-disabled:bg-surface-muted peer-disabled:hover:border-line",
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 m-auto h-2.5 w-2.5 rounded-pill bg-umber",
              "scale-0 peer-checked:scale-100",
              "transition-transform duration-fast ease-out",
            )}
          />
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
