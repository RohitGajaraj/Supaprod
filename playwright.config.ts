import { defineConfig, devices } from "@playwright/test";

import { STORAGE_STATE } from "./e2e/helpers/auth";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  timeout: 60000,
  reporter: [
    ["html", { outputFolder: "./test-results/html-report", open: "never" }],
    ["junit", { outputFile: "./test-results/junit.xml" }],
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "on",
    video: "off",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    /**
     * Sign in once, save the session, and let every other project start from
     * it. See `e2e/auth.setup.ts` for why this is not optional: the per-test
     * cookie replay the specs used to do could never carry a Supabase session,
     * because that session is a localStorage entry and `context.cookies()`
     * cannot see one. `storageState` captures localStorage too.
     */
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium-desktop",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        storageState: STORAGE_STATE,
      },
    },
    {
      name: "chromium-tablet",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        storageState: STORAGE_STATE,
      },
    },
    {
      name: "chromium-mobile",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 320, height: 667 },
        storageState: STORAGE_STATE,
      },
    },
  ],
});
