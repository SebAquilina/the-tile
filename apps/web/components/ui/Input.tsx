"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  helpText?: ReactNode;
  errorMessage?: ReactNode;
  required?: boolean;
  leadingAdornment?: ReactNode;
  trailingAdornment?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    helpText,
    errorMessage,
    required,
    leadingAdornment,
    trailingAdornment,
    containerClassName,
    className,
    disabled,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `input-${autoId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = errorMessage ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpId, errorId].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(errorMessage);

  return (
    <div className={cn("flex flex-col gap-space-2", containerClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ink"
        >
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-1 text-error">
              *
            </span>
          ) : null}
          {required ? <span className="sr-only"> (required)</span> : null}
        </label>
      ) : null}
      <div
        className={cn(
          "flex items-center gap-space-2",
          "border rounded-md bg-surface",
          "transition-colors duration-fast ease-out",
          invalid ? "border-error" : "border-line",
          "focus-within:outline-2 focus-within:outline focus-within:outline-focus focus-within:outline-offset-2",
          disabled && "opacity-50 cursor-not-allowed bg-surface-muted",
        )}
      >
        {leadingAdornment ? (
          <span aria-hidden="true" className="pl-space-3 text-ink-subtle inline-flex">
            {leadingAdornment}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          className={cn(
            "flex-1 bg-transparent outline-none border-0",
            "h-11 px-space-4 text-base text-ink placeholder:text-ink-subtle",
            "disabled:cursor-not-allowed",
            leadingAdornment && "pl-space-2",
            trailingAdornment && "pr-space-2",
            className,
          )}
          {...props}
        />
        {trailingAdornment ? (
          <span aria-hidden="true" className="pr-space-3 text-ink-subtle inline-flex">
            {trailingAdornment}
          </span>
        ) : null}
      </div>
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
