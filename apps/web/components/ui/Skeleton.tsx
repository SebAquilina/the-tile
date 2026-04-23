import { cn } from "@/lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Convenience for simple sized blocks. */
  width?: string | number;
  height?: string | number;
  /** Rounded-pill for text-like lines / avatars. */
  rounded?: "none" | "sm" | "lg" | "pill";
}

const roundedMap: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  lg: "rounded-lg",
  pill: "rounded-pill",
};

/**
 * Shimmering placeholder block. The shimmer gradient + animation are defined
 * in globals.css under `.skeleton-shimmer` and the shimmer keyframes in
 * tailwind.config.ts. `prefers-reduced-motion` disables the animation via a
 * media query in globals.css (no shimmer, just static fill).
 */
export function Skeleton({
  className,
  width,
  height,
  rounded = "sm",
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton-shimmer animate-shimmer", roundedMap[rounded], className)}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
}
