import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // CI also writes an HTML report (playwright-report/) so a failure's
  // traces/screenshots can be uploaded as a workflow artifact; local runs
  // stay with the plain list reporter to avoid extra clutter.
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  // devices["iPhone 13"] launches WebKit (Safari's engine), not Chromium —
  // matches what a real iPhone runs, and CI only needs to install webkit.
  projects: [
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      USE_FAKE_ANALYSIS: "true",
      ANTHROPIC_API_KEY: "sk-ant-fake-for-e2e",
    },
  },
});
