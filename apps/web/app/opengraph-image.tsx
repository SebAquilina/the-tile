import { ImageResponse } from "next/og";

// Next.js opengraph-image route — produces a 1200×630 PNG that the
// metadata `openGraph.images` and `twitter.images` auto-reference.
export const runtime = "edge";
export const alt = "The Tile — Italian porcelain stoneware, San Gwann Malta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 96,
          background: "linear-gradient(135deg,#f7f5f0 0%,#efebe3 100%)",
          color: "#0f0e0c",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#8b8579",
          }}
        >
          The Tile · San Gwann Malta
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div
            style={{
              display: "flex",
              fontSize: 104,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: "#0f0e0c",
            }}
          >
            Italian porcelain
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 104,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: "#5b4a2e",
            }}
          >
            chosen for Malta.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 28,
            color: "#56524a",
          }}
        >
          <span>Since 1990</span>
          <span>60 collections · 5 Italian suppliers</span>
        </div>
      </div>
    ),
    size,
  );
}
