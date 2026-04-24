import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  jsonLdToString,
  localBusinessLd,
  organizationLd,
} from "@/lib/jsonld";
import { Analytics } from "@/components/Analytics";
import { CookieConsent } from "@/components/CookieConsent";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.the-tile.com";

export const metadata: Metadata = {
  title: {
    default: "The Tile — Italian porcelain stoneware, San Gwann Malta",
    template: "%s · The Tile",
  },
  description:
    "Porcelain stoneware specialists since 1990. Curated Italian collections — marble, wood, stone, concrete, terrazzo and more.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "en_MT",
    siteName: "The Tile",
    url: SITE_URL,
    images: [
      {
        url: "/og-default.svg",
        width: 1200,
        height: 630,
        alt: "The Tile — Italian porcelain stoneware, San Gwann Malta",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-default.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#14110e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [organizationLd(), localBusinessLd()],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-canvas text-ink">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: jsonLdToString(graph) }}
        />
        <Analytics />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
