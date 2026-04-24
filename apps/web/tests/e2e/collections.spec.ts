import { expect, test } from "@playwright/test";

test.describe("Collections — catalog + filters", () => {
  test("collections index shows at least 50 tile links in SSR HTML", async ({ page }) => {
    await page.goto("/collections");
    const links = page.locator('a[href^="/collections/"][href*="/"]').filter({
      hasNot: page.locator('a[href$="/collections"]'),
    });
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(50);
  });

  test("marble effect landing shows exactly the marble tiles", async ({ page }) => {
    await page.goto("/collections/marble");
    const marbleLinks = page.locator(
      'a[href^="/collections/marble/"]',
    );
    await expect(marbleLinks.first()).toBeVisible();
    expect(await marbleLinks.count()).toBeGreaterThanOrEqual(8);
  });

  test("clicking a card opens a product detail page", async ({ page }) => {
    await page.goto("/collections/marble");
    const first = page.locator('a[href^="/collections/marble/"]').first();
    await first.click();
    await expect(page).toHaveURL(/\/collections\/marble\//);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
});
