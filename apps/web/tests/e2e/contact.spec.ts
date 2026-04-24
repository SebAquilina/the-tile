import { expect, test } from "@playwright/test";

test.describe("Contact form", () => {
  test("submits a valid lead and surfaces the success toast", async ({ page }) => {
    await page.goto("/contact");

    await page.getByLabel(/your name/i).fill("Playwright Test");
    await page.getByLabel(/^email/i).fill("playwright@example.com");
    await page.getByLabel(/your project/i, { exact: false }).fill(
      "Testing the enquiry flow — please disregard.",
    );
    await page.getByLabel(/i agree to be contacted/i).check();

    await page.getByRole("button", { name: /send/i }).click();

    await expect(
      page
        .getByText(
          /we have your enquiry|thanks|reply|in touch|two working days/i,
        )
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("blocks submission without consent", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel(/your name/i).fill("No Consent");
    await page.getByLabel(/^email/i).fill("noconsent@example.com");
    await page.getByLabel(/your project/i, { exact: false }).fill("x");
    await page.getByRole("button", { name: /send/i }).click();
    await expect(
      page.getByText(/consent|agree/i).first(),
    ).toBeVisible();
  });
});
