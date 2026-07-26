import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Wave 1-2 design system validation.
 * Uses list reporter only (no HTML/JUnit) to avoid ENOSPC from the HTML reporter's
 * Vite trace viewer asset copies.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results/wave1-2-artifacts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries in validation run — we need clear signal per test
  workers: 1,
  timeout: 60000,
  reporter: [["list"], ["json", { outputFile: "./test-results/wave1-2-results.json" }]],
  use: {
    baseURL: "http://localhost:8080",
    trace: "off",
    screenshot: "off", // Tests take their own screenshots manually
    video: "off",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
