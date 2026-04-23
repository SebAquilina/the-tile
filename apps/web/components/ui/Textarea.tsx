"use client";

import { forwardRef, useId, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  helpText?: ReactNode;
  errorMessage?: ReactNode;
  required?: boolean;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    id,
    label,
    helpText,
    errorMessage,
    required,
    containerClassName,
    className,
    disabled,
    rows = 4,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `textarea-${autoId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = errorMessage ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpId, errorId].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(errorMessage);

  return (
    <div className={cn("flex flex-col gap-space-2", containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-1 text-error">
              *
            </span>
          ) : null}
          {required ? <span className="sr-only"> (required)</span> : null}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full rounded-md bg-surface text-base text-ink placeholder:text-ink-subtle",
          "border transition-colors duration-fast ease-out",
          "px-space-4 py-space-3 resize-y",
          "focus:outline focus:outline-2 focus:outline-focus focus:outline-offset-2",
          invalid ? "border-error" : "border-line",
          disabled && "opacity-50 cursor-not-allowed bg-surface-muted",
          className,
        )}
        {...props}
      />
      {helpText && !invalid ? (
        <p id={helpId} className="text-sm text-ink-muted">
          {helpText}
        </p>
      ) : null}
      {invalid ? (
        <p id={errorId} role="alert" className="text-sm text-error">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
});
