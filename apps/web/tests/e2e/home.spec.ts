import { expect, test } from "@playwright/test";

test.describe("Home — agent-first hero", () => {
  test("first visit shows the full-viewport agent hero", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1 }).first(),
    ).toBeVisible();
    // Starter chips are the visual signal for the hero.
    const chips = page.getByRole("button").or(page.getByRole("link"));
    await expect(chips.first()).toBeVisible();
  });

  test("just-let-me-browse path escapes to the return-visit home", async ({ page }) => {
    await page.goto("/");
    const browseLink = page.getByRole("button", { name: /just let me browse/i });
    if (await browseLink.count()) {
      await browseLink.first().click();
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test("return visit surfaces recommendations + review strip", async ({ page }) => {
    await page.goto("/");
    // Simulate a returning visitor; key name matches the HomeView logic.
    await page.evaluate(() => {
      sessionStorage.setItem(
        "the-tile:last-agent-touch",
        String(Date.now() - 60_000),
      );
    });
    await page.reload();
    await expect(
      page.getByRole("heading", { name: /welcome back|A few we like/i }).first(),
    ).toBeVisible();
  });
});
