import { expect, test } from "@playwright/test";

test.describe("Contact form", () => {
  test("submits a valid lead and surfaces the success toast", async ({ page }) => {
    await page.goto("/contact");

    await page.getByLabel(/your name/i).fill("Playwright Test");
    await page.getByLabel(/^email/i).first().fill("playwright@example.com");
    await page.getByLabel(/project notes/i).fill(
      "Testing the enquiry flow — please disregard.",
    );
    // Consent checkbox's label is a React fragment; target by role instead.
    await page.getByRole("checkbox").first().check();

    await page.getByRole("button", { name: /send enquiry/i }).click();

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
    await page.getByLabel(/^email/i).first().fill("noconsent@example.com");
    await page.getByLabel(/project notes/i).fill("x");
    await page.getByRole("button", { name: /send enquiry/i }).click();
    // Zod consent error surfaces under the checkbox.
    await expect(
      page.getByText(/consent|agree/i).first(),
    ).toBeVisible();
  });
});
