import Script from "next/script";

/**
 * Plausible analytics snippet — renders only when NEXT_PUBLIC_PLAUSIBLE_DOMAIN
 * is set. Uses the `script.js` tag with `defer` so it never blocks first paint.
 *
 * We also install the queue shim inline so `window.plausible(...)` calls made
 * before the Plausible script loads are captured and flushed once it arrives.
 * Per 04-backend-spec §5 we track these custom events — the queue means
 * `track()` from lib/analytics.ts is always safe regardless of ordering.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  return (
    <>
      <Script
        defer
        data-domain={domain}
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
      />
      <Script id="plausible-queue" strategy="afterInteractive">
        {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) };`}
      </Script>
    </>
  );
}

export default Analytics;
