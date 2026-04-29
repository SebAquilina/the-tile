/**
 * Per ref 19 § Class 2 — when admin mutates X, public path Y must be
 * invalidated. Single source of truth.
 *
 * Adds the v1.12 admin sections to the existing v1.9 map.
 */

import { revalidatePath } from "next/cache";

export type MutationKey =
  | "collections.upsert"
  | "collections.delete"
  | "collections.coverImage"
  | "collections.products"
  | "pages.upsert"
  | "pages.delete"
  | "menu.update"
  | "theme.tokens"
  | "product.upsert"
  | "product.delete"
  | "product.image"
  | "redirect.upsert"
  | "redirect.delete"
  | "agent.prompt"
  | "site.settings"
  | "lead.create"
  | "lead.update";

type Resolver = (slug?: string) => string[];

export const REVALIDATE_MAP: Record<MutationKey, Resolver> = {
  "collections.upsert":     (slug) => ["/collections", `/collections/${slug ?? ""}`, "/sitemap.xml"],
  "collections.delete":     (slug) => ["/collections", `/collections/${slug ?? ""}`, "/sitemap.xml"],
  "collections.coverImage": (slug) => ["/collections", `/collections/${slug ?? ""}`],
  "collections.products":   (slug) => [`/collections/${slug ?? ""}`],
  "pages.upsert":           (slug) => [`/${slug ?? ""}`, "/sitemap.xml"],
  "pages.delete":           (slug) => [`/${slug ?? ""}`, "/sitemap.xml"],
  "menu.update":            () => ["/"],
  "theme.tokens":           () => ["/"],
  "product.upsert":         (slug) => [`/products/${slug ?? ""}`, "/collections", "/sitemap.xml"],
  "product.delete":         (slug) => [`/products/${slug ?? ""}`, "/collections", "/sitemap.xml"],
  "product.image":          (slug) => [`/products/${slug ?? ""}`],
  "redirect.upsert":        (from) => [from ?? "/"],
  "redirect.delete":        (from) => [from ?? "/"],
  "agent.prompt":           () => ["/"],
  "site.settings":          () => ["/", "/sitemap.xml", "/robots.txt"],
  "lead.create":            () => ["/admin/leads"],
  "lead.update":            () => ["/admin/leads"],
};

export function revalidatePaths(key: MutationKey, slug?: string): string[] {
  const paths = REVALIDATE_MAP[key](slug).filter((p) => p && p !== "/" || p === "/");
  for (const p of paths) {
    try { revalidatePath(p); }
    catch (e) { console.warn(`[revalidate] ${p}: ${(e as Error).message}`); }
  }
  return paths;
}
