import { defineConfig, devices } from "@playwright/test";

const remote = process.env.SMOKE_BASE_URL;
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: remote ? "smoke.spec.ts" : "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: { channel: "chromium", baseURL: (remote ?? "http://127.0.0.1:4371/halal-e-check").replace(/\/?$/, "/"), trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ],
  webServer: remote ? undefined : {
    command: "node scripts/serve-export.mjs",
    url: "http://127.0.0.1:4371/halal-e-check/",
    reuseExistingServer: false
  }
});
