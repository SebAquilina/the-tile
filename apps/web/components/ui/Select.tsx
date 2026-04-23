"use client";

import { forwardRef, useId, type SelectHTMLAttributes, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: ReactNode;
  helpText?: ReactNode;
  errorMessage?: ReactNode;
  required?: boolean;
  containerClassName?: string;
  placeholder?: string;
}

/**
 * Native <select> under the hood for Phase 0 per spec §7 primitives table.
 * Desktop custom listbox can replace this later; this wrapper preserves the
 * same label/help/error contract as Input/Textarea so form layouts stay
 * consistent.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    id,
    label,
    helpText,
    errorMessage,
    required,
    containerClassName,
    className,
    disabled,
    children,
    placeholder,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? `select-${autoId}`;
  const helpId = helpText ? `${selectId}-help` : undefined;
  const errorId = errorMessage ? `${selectId}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpId, errorId].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(errorMessage);

  return (
    <div className={cn("flex flex-col gap-space-2", containerClassName)}>
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-ink">
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
          "relative flex items-center",
          "border rounded-md bg-surface",
          "transition-colors duration-fast ease-out",
          invalid ? "border-error" : "border-line",
          "focus-within:outline focus-within:outline-2 focus-within:outline-focus focus-within:outline-offset-2",
          disabled && "opacity-50 cursor-not-allowed bg-surface-muted",
        )}
      >
        <select
          ref={ref}
          id={selectId}
          required={required}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "appearance-none w-full bg-transparent outline-none border-0",
            "h-11 pl-space-4 pr-space-8 text-base text-ink",
            "disabled:cursor-not-allowed",
            className,
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {children}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-0 pr-space-3 text-ink-subtle inline-flex"
        >
          <ChevronDown className="h-4 w-4" />
        </span>
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
