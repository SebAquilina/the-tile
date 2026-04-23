import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Tile — Italian porcelain stoneware, San Gwann Malta",
    template: "%s · The Tile",
  },
  description:
    "Porcelain stoneware specialists since 1990. Curated Italian collections — marble, wood, stone, concrete, terrazzo and more.",
  metadataBase: new URL("https://www.the-tile.com"),
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-canvas text-ink">{children}</body>
    </html>
  );
}
