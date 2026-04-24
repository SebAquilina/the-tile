import { expect, test } from "@playwright/test";

test.describe("Save list — shortlist → quote handoff", () => {
  test("empty state renders the two primary CTAs", async ({ page }) => {
    await page.goto("/save-list");
    await expect(
      page.getByRole("heading", { name: /nothing saved yet/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /browse collections/i }),
    ).toBeVisible();
  });

  test("populated state shows tiles and deep-links into contact with saveIds", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      sessionStorage.setItem(
        "the-tile:save-list",
        JSON.stringify(["tele-di-marmo-revolution", "unique-marble"]),
      );
    });
    await page.goto("/save-list");

    await expect(page.getByText(/2\s+tiles saved/i)).toBeVisible();

    const quoteCta = page.getByRole("link", {
      name: /request a quote on these/i,
    });
    await expect(quoteCta).toBeVisible();
    const href = await quoteCta.getAttribute("href");
    expect(href).toContain("/contact");
    expect(href).toContain("saveIds=");
    expect(href).toContain("reason=quote");
  });
});
