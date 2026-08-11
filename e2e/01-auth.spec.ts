/**
 * Phase 1: Login & Environment verification
 * Tests authentication flow and initial authenticated state
 */
import { test, expect } from "@playwright/test";
import { login, takeScreenshot, waitForShell } from "./helpers/auth";

/**
 * THIS FILE RUNS SIGNED OUT, and it is the only one that does.
 *
 * The `setup` project signs in once and every other project inherits that
 * session through `storageState`, which is the whole point: a spec about the
 * Brain should not spend ten seconds at a login form. But this file's subject
 * IS the login form. Inheriting the session made `/login` redirect straight to
 * `/today`, so every assertion here failed looking for an email input on a
 * dashboard.
 *
 * That was a real regression introduced by wiring `storageState`, not a stale
 * assertion: these three tests were correct before and correct after, and the
 * harness underneath them changed. An empty state opts this file back out.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication", () => {
  /**
   * `domcontentloaded`, NOT `networkidle`, AND NOT `waitForShell` EITHER.
   *
   * `networkidle` went out of this suite on 2026-08-11: it waits for 500ms of
   * network silence, which several surfaces never give it because
   * `/engine-room` loads `js.stripe.com` and Stripe holds the connection open,
   * so `goto` threw on pages that were rendered and correct behind it. It never
   * reported readiness; it reported that something was still talking.
   *
   * Everywhere else the replacement is `domcontentloaded` plus `waitForShell`.
   * NOT HERE. `/login` renders no `<main>` (the shell is what you get AFTER
   * signing in), so waiting for the shell on this page would hang until the
   * timeout on a login form that is present and working.
   *
   * Nothing is added on top either: the three `toBeVisible` assertions below are
   * web-first and retry until the form appears, so they already wait for the
   * exact thing this test needs.
   */
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

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
    await page.goto("/today", { waitUntil: "domcontentloaded" });

    // `/today` IS authenticated, so this one does take the shell wait, and it
    // is doing more work here than it looks. `page.url()` below is a
    // synchronous snapshot with no retry: under `domcontentloaded` it would
    // read "/today" before the client-side auth guard has had a chance to bounce
    // a dead session back to `/login`, and the assertion would go green without
    // ever testing what its name claims. Waiting for the shell to render is what
    // makes "the session survived a navigation" observable.
    await waitForShell(page);

    // Should not be redirected to login
    expect(page.url()).not.toContain("/login");
    await takeScreenshot(page, "03-today-authenticated", "auth");
  });
});
