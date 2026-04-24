import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],

  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm start",
        port: PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
