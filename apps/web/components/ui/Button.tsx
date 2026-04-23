"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const baseStyles = cn(
  "relative inline-flex items-center justify-center gap-space-2",
  "font-sans font-medium whitespace-nowrap select-none",
  "transition-colors duration-fast ease-out",
  "focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-busy:cursor-wait",
);

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-umber text-canvas border border-umber",
    "hover:bg-umber-strong hover:border-umber-strong",
    "active:bg-umber-strong",
    "disabled:hover:bg-umber disabled:hover:border-umber",
  ),
  secondary: cn(
    "bg-transparent text-ink border border-line",
    "hover:border-umber hover:text-umber",
    "active:bg-surface-muted",
    "disabled:hover:border-line disabled:hover:text-ink",
  ),
  ghost: cn(
    "bg-transparent text-ink border border-transparent",
    "hover:bg-surface-muted",
    "active:bg-cream",
  ),
  link: cn(
    "bg-transparent text-umber border border-transparent px-0",
    "underline-offset-4 hover:underline",
    "active:text-umber-strong",
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  // Sizes tuned so md hits the 44px mobile touch target per spec §4 (Button).
  sm: "h-9 px-space-3 text-sm rounded-md",
  md: "h-11 px-space-5 text-base rounded-md",
  lg: "h-12 px-space-6 text-base rounded-md",
};

const linkSizeStyles: Record<ButtonSize, string> = {
  sm: "h-auto px-0 text-sm",
  md: "h-auto px-0 text-base",
  lg: "h-auto px-0 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    fullWidth,
    className,
    children,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  const isLink = variant === "link";
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      className={cn(
        baseStyles,
        variantStyles[variant],
        isLink ? linkSizeStyles[size] : sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-space-2">
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin-slow" />
          <span>{children}</span>
        </span>
      ) : (
        <>
          {leadingIcon ? (
            <span aria-hidden="true" className="inline-flex">
              {leadingIcon}
            </span>
          ) : null}
          <span>{children}</span>
          {trailingIcon ? (
            <span aria-hidden="true" className="inline-flex">
              {trailingIcon}
            </span>
          ) : null}
        </>
      )}
    </button>
  );
});
