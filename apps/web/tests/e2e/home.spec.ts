import { expect, test } from "@playwright/test";

test.describe("Home — agent-first hero", () => {
  test("first visit shows the full-viewport agent hero", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    // AgentHero's h1 is the signal.
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /tell me what you are looking for|welcome back/i,
      }).first(),
    ).toBeVisible();
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
    // Simulate a returning visitor — key matches HomeView.DISMISS_KEY.
    await page.evaluate(() => {
      sessionStorage.setItem("the-tile:hero-dismissed", "1");
    });
    await page.reload();
    await expect(
      page.getByRole("heading", { name: /welcome back|A few we like/i }).first(),
    ).toBeVisible();
  });
});
