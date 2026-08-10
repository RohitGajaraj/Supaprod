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
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      /**
       * THE ONE TEST THAT TYPES A PASSWORD RECORDS NOTHING.
       *
       * Every other project starts from `storageState`, so `auth.setup.ts` is
       * the only place a credential ever reaches a page — which makes this the
       * only project whose artifacts can contain one.
       *
       * Measured on 2026-08-11, not assumed. A trace of a login carries the
       * password in TWO independent places:
       *
       *   "method":"fill","params":{...,"value":"<the password>"}
       *   ["INPUT",{"__playwright_value_":"<the password>", "type":"password"…
       *
       * the recorded action, and the `__playwright_value_` attribute stamped
       * into every DOM snapshot so the trace viewer can replay the form. Both
       * survive clearing the field afterwards, because neither is the live DOM.
       * `error-context.md` IS the live DOM — an aria snapshot, which renders a
       * password field as `- textbox "Password": <plaintext>` — and that one is
       * handled in `helpers/auth.ts` by emptying the field before we return.
       *
       * The trap worth naming: the browser masks the field visually, so a
       * SCREENSHOT of the failing moment shows dots. The artifact everyone
       * thinks to protect is the safe one.
       *
       * Nothing diagnostic is lost. This test's failure message already says
       * exactly what went wrong and what to do about it; a trace of it adds a
       * credential and no information. `test-results/` is gitignored so none of
       * this could be committed, but it is precisely the directory somebody
       * zips onto a bug report.
       */
      use: { trace: "off", screenshot: "off", video: "off" },
    },
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
