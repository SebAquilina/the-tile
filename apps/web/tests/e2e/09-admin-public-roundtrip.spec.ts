import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Admin → Public roundtrip — for every admin section that writes to D1,
 * verify the change reaches the public surface within one request.
 *
 * Per ref 25 + ref 35 (admin-public roundtrip SOP). Catches the bug
 * shape: operator adds a row via /admin/<section>, expects to see the
 * change on the public site, sees nothing because the public component
 * still renders a hardcoded constant or the layout is statically baked.
 *
 * This test was the gap that let the user's "New" footer item ship to
 * D1 but not appear on the public footer in May 2026.
 *
 * Skipped by default (SKIP_ADMIN_ROUNDTRIP=1) because it requires admin
 * basic-auth credentials. Run locally with:
 *   ADMIN_USER=admin ADMIN_PASS=tile1990 \
 *   PLAYWRIGHT_BASE_URL=https://the-tile-web.pages.dev \
 *   pnpm test:e2e tests/e2e/09-admin-public-roundtrip.spec.ts
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const ADMIN_USER = process.env.ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.ADMIN_PASS ?? "";
const SKIP = process.env.SKIP_ADMIN_ROUNDTRIP === "1" || !ADMIN_PASS;

function authHeader(): Record<string, string> {
  const tok = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString("base64");
  return { Authorization: `Basic ${tok}` };
}

test.describe("admin -> public roundtrip", () => {
  test.skip(SKIP, "SKIP_ADMIN_ROUNDTRIP=1 or ADMIN_PASS not set");

  test("[CRITICAL] navigation: adding a footer menu item appears on public site", async ({ request }) => {
    // 1. Read current state
    const before = await request.get(`${BASE}/api/menu/footer`).then((r) => r.json());
    const original = (before as { items: { label: string; href: string }[] }).items;

    // 2. Write a probe item via admin API
    const probeLabel = `roundtrip-${Date.now()}`;
    const next = [...original, { label: probeLabel, href: "/" }];
    const writeRes = await request.put(`${BASE}/api/admin/navigation`, {
      headers: { ...authHeader(), "content-type": "application/json" },
      data: { handle: "footer", items: next },
    });
    expect(writeRes.status(), "write should succeed").toBeLessThan(400);

    try {
      // 3. Read the public surface — the API the Footer hydrates from
      const liveRes = await request.get(`${BASE}/api/menu/footer`, {
        headers: { "cache-control": "no-cache" },
      });
      const live = (await liveRes.json()) as { items: { label: string }[] };
      const labels = live.items.map((i) => i.label);
      expect(labels, "probe item must appear on public").toContain(probeLabel);
    } finally {
      // 4. Revert — always, even on failure
      await request.put(`${BASE}/api/admin/navigation`, {
        headers: { ...authHeader(), "content-type": "application/json" },
        data: { handle: "footer", items: original },
      });
    }
  });

  test("[CRITICAL] settings: changing the contact phone appears on public footer", async ({ request }) => {
    const before = await request
      .get(`${BASE}/api/admin/settings`, { headers: authHeader() })
      .then((r) => r.json() as Promise<{ settings: Record<string, unknown> }>);
    const original = before.settings;

    const probePhone = `+356 9999 ${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;
    const writeRes = await request.put(`${BASE}/api/admin/settings`, {
      headers: { ...authHeader(), "content-type": "application/json" },
      data: { ...original, contact_phone: probePhone },
    });
    expect(writeRes.status(), "write should succeed").toBeLessThan(400);

    try {
      // Read the SSR'd public footer — phone is rendered server-side from getSettings
      const html = await request.get(`${BASE}/?cb=${Date.now()}`).then((r) => r.text());
      expect(html, "probe phone should appear in public HTML").toContain(probePhone);
    } finally {
      await request.put(`${BASE}/api/admin/settings`, {
        headers: { ...authHeader(), "content-type": "application/json" },
        data: original,
      });
    }
  });

  test("[CRITICAL] theme: changing primary color appears in public CSS tokens", async ({ request }) => {
    const before = await request
      .get(`${BASE}/api/admin/theme`, { headers: authHeader() })
      .then((r) => r.json() as Promise<{ theme: { tokens: Record<string, string> } }>);
    const originalTokens = before.theme.tokens;

    const probeColor = "#ff00aa"; // distinct hot-pink, won't clash
    const writeRes = await request.put(`${BASE}/api/admin/theme`, {
      headers: { ...authHeader(), "content-type": "application/json" },
      data: { ...before.theme, tokens: { ...originalTokens, primary: probeColor } },
    });
    expect(writeRes.status(), "write should succeed").toBeLessThan(400);

    try {
      const html = await request.get(`${BASE}/?cb=${Date.now()}`).then((r) => r.text());
      expect(html, "probe color should appear in <style id=theme-tokens>").toContain(probeColor);
    } finally {
      await request.put(`${BASE}/api/admin/theme`, {
        headers: { ...authHeader(), "content-type": "application/json" },
        data: { ...before.theme, tokens: originalTokens },
      });
    }
  });

  test("[CRITICAL] pages: creating a markdown page makes it reachable at /<slug>", async ({ request }) => {
    const slug = `roundtrip-${Date.now()}`;
    const writeRes = await request.post(`${BASE}/api/admin/pages`, {
      headers: { ...authHeader(), "content-type": "application/json" },
      data: {
        slug,
        title: "Roundtrip Test",
        body_md: "# Roundtrip\n\nIf you can read this, the page made it through.",
        status: "active",
      },
    });
    expect(writeRes.status(), "page create should succeed").toBeLessThan(400);
    const created = (await writeRes.json()) as { page?: { id: string; version: number } };
    const pageId = created.page?.id;
    const pageVersion = created.page?.version ?? 0;

    try {
      const publicRes = await request.get(`${BASE}/${slug}`);
      expect(publicRes.status(), `/${slug} should resolve`).toBe(200);
      const html = await publicRes.text();
      expect(html, "page body must appear on public").toContain("Roundtrip Test");
    } finally {
      if (pageId) {
        // The DELETE handler requires If-Match for optimistic concurrency.
        await request
          .delete(`${BASE}/api/admin/pages/${pageId}`, {
            headers: { ...authHeader(), "If-Match": `W/"${pageVersion}"` },
          })
          .catch(() => {});
      }
    }
  });

  test("[HIGH] redirects: adding a redirect causes /from to 301 to /to", async ({ request }) => {
    const fromPath = `/roundtrip-${Date.now()}`;
    const writeRes = await request.post(`${BASE}/api/admin/redirects`, {
      headers: { ...authHeader(), "content-type": "application/json" },
      data: { from_path: fromPath, to_path: "/about", status_code: 301, active: true },
    });
    expect(writeRes.status(), "redirect create should succeed").toBeLessThan(400);
    const created = (await writeRes.json()) as { redirect?: { id: string } };
    const redirectId = created.redirect?.id;

    try {
      const r = await request.get(`${BASE}${fromPath}`, { maxRedirects: 0 });
      expect(r.status(), "should be 301").toBe(301);
      expect(r.headers().location, "should redirect to /about").toMatch(/\/about$/);
    } finally {
      if (redirectId) {
        await request
          .delete(`${BASE}/api/admin/redirects/${redirectId}`, { headers: authHeader() })
          .catch(() => {});
      }
    }
  });

  test("[CRITICAL] products: editing image alt text appears on public detail page", async ({ request }) => {
    // Products are written back to the seed JSON via /api/admin/publish,
    // which commits to GitHub and triggers a Cloudflare Pages rebuild.
    // The public detail page is statically generated, so the roundtrip
    // takes ~3 minutes. Gate this test behind an extra flag so CI doesn't
    // wait by default.
    test.skip(
      process.env.RUN_PUBLISH_ROUNDTRIP !== "1",
      "RUN_PUBLISH_ROUNDTRIP=1 to opt into this rebuild-driven test",
    );

    // Pick a known product (architect-resin is in the marble/concrete effect).
    // The seed loader resolves it via product.url; we read the seed via the
    // public detail HTML to learn the canonical effect/slug.
    const productId = "architect-resin";
    const probeAlt = `roundtrip-alt-${Date.now()}`;

    // 1. Read current images so we can revert exactly.
    //    The public detail page exposes the hero image alt in <img alt="…">.
    const detailUrl = `${BASE}/collections/concrete/${productId}`;
    const beforeHtml = await request.get(`${detailUrl}?cb=${Date.now()}`).then((r) => r.text());
    expect(beforeHtml, "detail page should resolve").toMatch(/<img[^>]+alt=/i);

    // 2. Stage + publish a probe via the admin publish flow.
    //    We send a single image entry with the probe alt to keep the test
    //    self-contained; if more images existed they will be replaced.
    //    Revert restores the original list (best-effort: pulled from the
    //    seed by re-reading the source-of-truth JSON via raw github).
    const seedRes = await request.get(
      `https://raw.githubusercontent.com/SebAquilina/the-tile/main/apps/web/data/seed/products.seed.json?cb=${Date.now()}`,
    );
    expect(seedRes.ok(), "seed JSON should be reachable on raw").toBeTruthy();
    const seedBody = (await seedRes.json()) as {
      products: Array<{ id: string; images?: unknown[] }>;
    };
    const product = seedBody.products.find((p) => p.id === productId);
    expect(product, `${productId} in seed`).toBeDefined();
    const originalImages = (product?.images as Array<Record<string, unknown>>) ?? [];

    const probeImages = originalImages.map((img, i) => ({
      ...img,
      alt: i === 0 ? probeAlt : (img.alt as string | undefined),
    }));

    const writeRes = await request.post(`${BASE}/api/admin/publish`, {
      headers: { ...authHeader(), "content-type": "application/json" },
      data: {
        products: { [productId]: { images: probeImages } },
        commitMessage: `test: roundtrip alt probe ${probeAlt}`,
      },
    });
    expect(writeRes.status(), "publish should succeed").toBeLessThan(400);

    try {
      // 3. Poll the public detail page until the rebuild lands or we time out.
      //    CF Pages typically rebuilds in ~2-3 minutes; we give it 6 minutes.
      const deadline = Date.now() + 6 * 60_000;
      let saw = false;
      while (Date.now() < deadline) {
        const html = await request
          .get(`${detailUrl}?cb=${Date.now()}`)
          .then((r) => r.text());
        if (html.includes(probeAlt)) {
          saw = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 15_000));
      }
      expect(saw, `probe alt ${probeAlt} should appear on public after rebuild`).toBe(true);
    } finally {
      // 4. Revert — restore original images.
      await request
        .post(`${BASE}/api/admin/publish`, {
          headers: { ...authHeader(), "content-type": "application/json" },
          data: {
            products: { [productId]: { images: originalImages } },
            commitMessage: `test: roundtrip revert ${probeAlt}`,
          },
        })
        .catch(() => {});
    }
  });
});
