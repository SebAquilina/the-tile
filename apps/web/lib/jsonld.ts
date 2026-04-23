/**
 * Typed JSON-LD helpers.
 *
 * Each function returns a plain object conforming to schema.org JSON-LD,
 * ready to be injected via:
 *   <script
 *     type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }}
 *   />
 *
 * No runtime deps — everything is type-level.
 */

import type { Product } from "@/lib/schemas";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.the-tile.com";

const ORG_ID = `${SITE_URL}/#organization`;
const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;

// --- Base types (lightweight — we don't ship a full schema.org typing here) ---

type JsonLdPrimitive = string | number | boolean | null;
type JsonLdValue =
  | JsonLdPrimitive
  | JsonLdObject
  | ReadonlyArray<JsonLdPrimitive | JsonLdObject>;

export interface JsonLdObject {
  "@context"?: string;
  "@type"?: string | string[];
  "@id"?: string;
  [key: string]: JsonLdValue | undefined;
}

// --- Organization -----------------------------------------------------------

export interface OrganizationLd extends JsonLdObject {
  "@context": "https://schema.org";
  "@type": "Organization";
  "@id": string;
  name: string;
  url: string;
  logo: string;
  address: JsonLdObject;
  areaServed: string;
  sameAs: string[];
}

export function organizationLd(): OrganizationLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "The Tile",
    url: SITE_URL,
    logo: `${SITE_URL}/og-default.svg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Gwann",
      addressCountry: "MT",
    },
    areaServed: "MT",
    sameAs: [],
  };
}

// --- LocalBusiness ----------------------------------------------------------

export interface LocalBusinessLd extends JsonLdObject {
  "@context": "https://schema.org";
  "@type": "LocalBusiness";
  "@id": string;
  name: string;
  url: string;
  image: string;
  address: JsonLdObject;
  areaServed: string;
  priceRange: string;
  openingHoursSpecification: JsonLdObject[];
  geo: JsonLdObject;
  sameAs: string[];
}

export function localBusinessLd(): LocalBusinessLd {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": LOCAL_BUSINESS_ID,
    name: "The Tile",
    url: SITE_URL,
    image: `${SITE_URL}/og-default.svg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Gwann",
      addressCountry: "MT",
    },
    areaServed: "MT",
    priceRange: "€€",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    geo: {
      "@type": "GeoCoordinates",
      // Placeholder: generic Malta centroid — replace with true showroom
      // coordinates when available.
      latitude: 35.9042,
      longitude: 14.4842,
    },
    sameAs: [],
  };
}

// --- Product ----------------------------------------------------------------

export interface ProductLd extends JsonLdObject {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  url: string;
  category?: string;
  brand?: JsonLdObject;
  image?: string[];
  potentialAction?: JsonLdObject;
}

export function productLd(product: Product): ProductLd {
  const url = `${SITE_URL}${product.url}`;
  const images =
    product.images?.map((img) =>
      img.src.startsWith("http") ? img.src : `${SITE_URL}${img.src}`,
    ) ?? [];

  const ld: ProductLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary || product.description || product.name,
    url,
    category: String(product.effect),
    potentialAction: {
      "@type": "ContactAction",
      name: "Request a quote",
      target: `${SITE_URL}/contact`,
      // Quote-driven: price is on-request, no offers block emitted.
    },
  };

  if (product.brand) {
    ld.brand = {
      "@type": "Brand",
      name: product.brand,
    };
  }

  if (images.length > 0) {
    ld.image = images;
  }

  return ld;
}

// --- BreadcrumbList ---------------------------------------------------------

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbListLd extends JsonLdObject {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: JsonLdObject[];
}

export function breadcrumbLd(items: BreadcrumbItem[]): BreadcrumbListLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

// --- Article ----------------------------------------------------------------

export interface ArticleInput {
  slug: string;
  title: string;
  description?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
}

export interface ArticleLd extends JsonLdObject {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description?: string;
  datePublished: string;
  dateModified?: string;
  author: JsonLdObject;
  image?: string;
  mainEntityOfPage: JsonLdObject;
}

export function articleLd(post: ArticleInput): ArticleLd {
  const url = `${SITE_URL}/journal/${post.slug}`;
  const ld: ArticleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.datePublished,
    author: {
      "@type": "Organization",
      name: post.author ?? "The Tile",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  if (post.description) ld.description = post.description;
  if (post.dateModified) ld.dateModified = post.dateModified;
  if (post.image) {
    ld.image = post.image.startsWith("http")
      ? post.image
      : `${SITE_URL}${post.image}`;
  }

  return ld;
}

// --- FAQPage ----------------------------------------------------------------

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqLd extends JsonLdObject {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: JsonLdObject[];
}

export function faqLd(qa: FaqItem[]): FaqLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

// --- Helper for inline <script> injection -----------------------------------

/**
 * Serialises a JSON-LD object safely for injection into dangerouslySetInnerHTML.
 * Escapes `</script>` sequences that could close the tag prematurely.
 */
export function jsonLdToString(obj: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
