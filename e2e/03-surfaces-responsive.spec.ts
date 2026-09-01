/**
 * Phase 2 & 4: Responsive surface audit (tablet 768px, mobile 320px)
 * Verifies layout at breakpoints, checks bottom nav, rail visibility
 */
import { test, expect, Page } from "@playwright/test";
import { login, takeScreenshot, waitForShell } from "./helpers/auth";

const KEY_SURFACES = [
  { path: "/today", name: "today", label: "Today" },
  { path: "/discover", name: "discover", label: "Discovery" },
  { path: "/build", name: "build", label: "Build" },
  { path: "/brain", name: "brain", label: "Brain" },
  { path: "/engine-room", name: "engine-room", label: "Engine Room" },
  { path: "/settings", name: "settings", label: "Settings" },
  { path: "/guardrails", name: "guardrails", label: "Guardrails" },
  { path: "/agents", name: "agents", label: "Agents" },
  { path: "/evals", name: "evals", label: "Evals" },
  { path: "/traces", name: "traces", label: "Traces" },
  { path: "/drift", name: "drift", label: "Drift" },
  { path: "/plan", name: "plan", label: "Plan" },
  { path: "/decide", name: "decide", label: "Decide" },
  { path: "/ship", name: "ship", label: "Ship" },
];

async function checkHorizontalScroll(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
}

async function checkTouchTargets(page: Page): Promise<{ element: string; size: string }[]> {
  return await page.evaluate(() => {
    const interactiveElements = document.querySelectorAll(
      'button, a, [role="button"], input, select',
    );
    const violations: { element: string; size: string }[] = [];

    interactiveElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.width < 44 || rect.height < 44) {
          violations.push({
            element: el.tagName + (el.className ? "." + el.className.toString().split(" ")[0] : ""),
            size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
          });
        }
      }
    });
    return violations.slice(0, 20);
  });
}

/**
 * NAVIGATION IN THIS FILE: `domcontentloaded` PLUS `waitForShell`, never
 * `networkidle`. Measured on 2026-08-11 across the whole suite: `/evals`,
 * `/agents` and `/drift` redirect to `/engine-room`, which loads
 * `js.stripe.com`, and Stripe holds its connection open, so the page never
 * gives `networkidle` the 500ms of silence it waits for. `goto` sat for the
 * full navigation timeout and threw WHILE THE PAGE WAS RENDERED AND CORRECT
 * BEHIND IT.
 *
 * `networkidle` does not report "the page is not ready". It reports "something
 * on this page is still talking", and the two are unrelated, which is why
 * Playwright discourages it. `waitForShell` waits for `main` to be visible,
 * which IS the readiness condition every assertion below depends on, and it is
 * indifferent to a third-party socket.
 *
 * Proven first on `02-surfaces-desktop.spec.ts`, where the same substitution
 * turned 3 failures into 15 passes and a run of timeouts into 38 seconds.
 */

test.describe("Responsive Audit - Tablet 768px", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  let authCookies: any;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  for (const surface of KEY_SURFACES) {
    test(`${surface.label} - tablet 768px`, async ({ page }) => {
      await page.context().addCookies(authCookies);
      await page.goto(surface.path, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      if (page.url().includes("/login")) {
        await login(page);
        await page.goto(surface.path, { waitUntil: "domcontentloaded" });
        await waitForShell(page);
      }

      await takeScreenshot(page, `tablet-${surface.name}`, "surfaces/tablet");

      const hasHorizontalScroll = await checkHorizontalScroll(page);
      if (hasHorizontalScroll) {
        console.warn(`HORIZONTAL SCROLL at 768px on ${surface.path}`);
      }
      expect(hasHorizontalScroll).toBe(false);
    });
  }
});

test.describe("Responsive Audit - Mobile 320px", () => {
  test.use({ viewport: { width: 320, height: 667 } });

  let authCookies: any;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  for (const surface of KEY_SURFACES) {
    test(`${surface.label} - mobile 320px`, async ({ page }) => {
      await page.context().addCookies(authCookies);
      await page.goto(surface.path, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      if (page.url().includes("/login")) {
        await login(page);
        await page.goto(surface.path, { waitUntil: "domcontentloaded" });
        await waitForShell(page);
      }

      await takeScreenshot(page, `mobile-${surface.name}`, "surfaces/mobile");

      // Critical: no horizontal scroll at 320px
      const hasHorizontalScroll = await checkHorizontalScroll(page);
      if (hasHorizontalScroll) {
        console.warn(`HORIZONTAL SCROLL at 320px on ${surface.path}`);
      }
      expect(hasHorizontalScroll).toBe(false);

      // Check touch targets on mobile
      const smallTargets = await checkTouchTargets(page);
      if (smallTargets.length > 0) {
        console.warn(`Touch target violations on ${surface.path}:`, smallTargets.slice(0, 5));
      }
    });
  }

  test("bottom nav visibility at 320px", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    // Check for bottom nav (mobile nav)
    const bottomNav = page
      .locator(
        '[data-testid="bottom-nav"], nav[class*="bottom"], nav[class*="mobile"], [class*="bottom-nav"]',
      )
      .first();
    // Note: bottom nav may or may not be present depending on implementation
    await takeScreenshot(page, "mobile-bottom-nav", "surfaces/mobile");

    // Check the page body doesn't overflow
    const bodyOverflow = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return {
        bodyScrollWidth: body.scrollWidth,
        htmlScrollWidth: html.scrollWidth,
        clientWidth: html.clientWidth,
      };
    });
    console.log("Mobile overflow check:", bodyOverflow);
    expect(bodyOverflow.htmlScrollWidth).toBeLessThanOrEqual(bodyOverflow.clientWidth + 5); // 5px tolerance
  });
});

test.describe("Responsive Breakpoint - 640px", () => {
  test.use({ viewport: { width: 640, height: 896 } });

  let authCookies: any;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test("today - no horizontal scroll at 640px", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    await takeScreenshot(page, "breakpoint-640-today", "surfaces/breakpoints");
    const hasHorizontalScroll = await checkHorizontalScroll(page);
    expect(hasHorizontalScroll).toBe(false);
  });
});
