/**
 * Phase 1: Login & Environment verification
 * Tests authentication flow and initial authenticated state
 */
import { test, expect } from "@playwright/test";
import { login, takeScreenshot, waitForShell } from "./helpers/auth";

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    // Verify key login elements exist
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();

    await takeScreenshot(page, "01-login-page", "auth");
  });

  test("login with demo credentials and verify redirect", async ({ page }) => {
    // The listener has to be attached BEFORE the navigation it is meant to
    // observe. It used to be attached after `login()` had already run and after
    // the screenshot, so it could not see a single error the login emitted — the
    // array it filled was empty for structural reasons, not because the page was
    // clean. Then a 2000ms sleep "waited for async errors to surface" on a
    // listener that was watching an already-finished page.
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    const success = await login(page);
    expect(success).toBe(true);

    // Should be on an authenticated route now
    const url = page.url();
    expect(url).not.toContain("/login");

    // The condition the sleep was standing in for: the authenticated shell has
    // rendered, so anything it logs on mount has already been logged.
    await waitForShell(page);

    await takeScreenshot(page, "02-post-login-authenticated", "auth");

    // Log errors but don't fail on them (some may be non-critical).
    // STALE-BY-DESIGN, REPORTED: this test collects console errors and asserts
    // nothing about them, so it cannot fail on a broken login. `waves-1-2-qa`
    // has the assertion; this is the diagnostic.
    if (errors.length > 0) {
      console.log("Console errors detected:", errors);
    }
  });

  test("authenticated state persists on navigation", async ({ page }) => {
    await login(page);
    await page.goto("/today", { waitUntil: "networkidle" });

    // Should not be redirected to login
    expect(page.url()).not.toContain("/login");
    await takeScreenshot(page, "03-today-authenticated", "auth");
  });
});
