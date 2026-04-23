import clsx, { type ClassValue } from "clsx";

/**
 * Class-name join helper. Thin wrapper around `clsx` so the import surface in
 * components stays small ("@/lib/cn") and we can swap/augment (e.g. add
 * tailwind-merge) in a single place later if conflicts become painful.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
