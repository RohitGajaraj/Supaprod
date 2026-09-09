/**
 * Phase 2: Visual Audit of 14 Surfaces at desktop (1280px)
 * Captures screenshots and verifies layout for each authenticated surface
 */
import { test, expect, Page, Cookie } from "@playwright/test";
import { login, takeScreenshot, takeFullPageScreenshot, waitForShell } from "./helpers/auth";

const SURFACES = [
  { path: "/today", name: "today", label: "Today" },
  { path: "/discover", name: "discover", label: "Discovery & Signals" },
  { path: "/plan", name: "plan", label: "Roadmap & Planning" },
  { path: "/build", name: "build", label: "Build/Studio" },
  { path: "/brain", name: "brain", label: "Brain/Knowledge" },
  { path: "/engine-room", name: "engine-room", label: "Engine Room" },
  { path: "/settings", name: "settings", label: "Settings" },
  { path: "/guardrails", name: "guardrails", label: "Guardrails" },
  { path: "/agents", name: "agents", label: "Agents" },
  { path: "/evals", name: "evals", label: "Evals" },
  { path: "/traces", name: "traces", label: "Traces" },
  { path: "/drift", name: "drift", label: "Drift" },
  { path: "/decide", name: "decide", label: "Decide" },
  { path: "/ship", name: "ship", label: "Ship" },
];

async function checkHorizontalScroll(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
}

/**
 * DEAD, AND IT COULD NOT HAVE WORKED IF IT WERE CALLED. Kept and marked rather
 * than deleted, because the invariant it is named for is real and worth having.
 *
 * TWO INDEPENDENT FAULTS:
 *
 * 1. NOTHING CALLS IT. It is defined here and never referenced in the test body
 *    below — so the one check this file is named for in the design-system docs
 *    has never run, on top of the whole suite never running.
 *
 * 2. IT ASKS A QUESTION THE BROWSER CANNOT ANSWER. The test is
 *    `!shadow.includes('var(') && shadow.includes('rgba')` against
 *    `getComputedStyle(el).boxShadow`. A COMPUTED value has already had every
 *    `var()` substituted and every colour serialised to `rgb()`/`rgba()` — that
 *    is what "computed" means. So `includes('var(')` is false for every element
 *    on every page, forever, and the surviving condition is "has an rgba
 *    shadow", which every shadow does. Called as written, it would report the
 *    first 10 shadowed elements on the page as violations regardless of whether
 *    they came from a token.
 *
 * HOW TO REVIVE IT: token-vs-ad-hoc is not decidable from the computed value.
 * Either compare each element's computed `box-shadow` against the computed
 * values of the shadow tokens on `:root` (an element whose shadow does not
 * equal any token's value is ad hoc), or check `el.style.boxShadow` — the
 * INLINE value, which is not substituted — the way `09-elevation-tokens.spec.ts`
 * does. The second is narrower but honest.
 */
async function checkNoAdHocShadows(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const elements = document.querySelectorAll("*");
    const violations: string[] = [];
    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const shadow = style.boxShadow;
      if (shadow && shadow !== "none") {
        // Check if it uses CSS variables (acceptable) vs hardcoded rgba/rgb values
        if (!shadow.includes("var(") && shadow.includes("rgba")) {
          const tag = el.tagName.toLowerCase();
          const className = (el.className || "").toString().substring(0, 50);
          violations.push(`${tag}.${className}: ${shadow}`);
        }
      }
    });
    return violations.slice(0, 10); // Limit output
  });
}

async function checkTokenResolution(
  page: Page,
): Promise<{ resolved: number; fallbacks: string[] }> {
  return await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    const tokens = [
      "--ds-background-100",
      "--ds-background-200",
      "--ds-gray-100",
      "--ds-gray-900",
      "--ds-gray-1000",
      "--ember",
      "--ds-focus-color",
    ];

    let resolved = 0;
    const fallbacks: string[] = [];

    tokens.forEach((token) => {
      const value = style.getPropertyValue(token).trim();
      if (value) {
        resolved++;
      } else {
        fallbacks.push(token);
      }
    });

    return { resolved, fallbacks };
  });
}

/**
 * DEAD AND MISLEADING. Nothing calls it, and the shape is a trap: it returns
 * the array SYNCHRONOUSLY at attach time, so a caller writing
 * `const errors = await getConsoleErrors(page)` gets an empty array that fills
 * later by reference. Reading it on the next line always shows zero errors.
 * Each test below inlines the listener correctly instead. Marked, not deleted,
 * so the next person does not re-add it as a "helper".
 */
async function getConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  return errors;
}

test.describe("Surface Audit - Desktop 1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: Cookie[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  for (const surface of SURFACES) {
    test(`${surface.label} (${surface.path}) - desktop layout`, async ({ page }) => {
      // Restore auth cookies
      await page.context().addCookies(authCookies);

      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      /**
       * `domcontentloaded` PLUS AN EXPLICIT READINESS WAIT, never `networkidle`.
       *
       * `networkidle` waits for 500ms with no in-flight requests, and this app
       * never gives it that on some surfaces. Measured 2026-08-11: `/evals`,
       * `/agents` and `/drift` all redirect to `/engine-room`, which loads
       * `js.stripe.com`; Stripe keeps connections open, so `goto` sat for the
       * full 25s and threw while THE PAGE WAS RENDERED AND CORRECT BEHIND IT
       * (body text 1158, 3296 and 877 characters respectively).
       *
       * That is the failure mode worth naming: `networkidle` does not report
       * "the page is not ready", it reports "something on this page is still
       * talking", and the two are unrelated. Playwright discourages it for
       * exactly this reason.
       *
       * `waitForShell` waits for `main` to be visible, which is the real
       * condition every assertion below depends on, and it is both stricter
       * about readiness and indifferent to a third-party socket.
       */
      await page.goto(surface.path, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      // Verify we're authenticated (not redirected to login)
      if (page.url().includes("/login")) {
        // Re-login if needed
        const loginPage = page;
        await login(loginPage);
        await page.goto(surface.path, { waitUntil: "domcontentloaded" });
        await waitForShell(page);
      }

      // Basic viewport screenshot
      await takeScreenshot(page, `desktop-${surface.name}`, "surfaces/desktop");

      // Full page screenshot
      await takeFullPageScreenshot(page, `desktop-${surface.name}`, "surfaces/desktop");

      // Check horizontal scroll
      const hasHorizontalScroll = await checkHorizontalScroll(page);
      if (hasHorizontalScroll) {
        console.warn(`HORIZONTAL SCROLL detected on ${surface.path}`);
      }

      // Check token resolution
      const tokenCheck = await checkTokenResolution(page);
      if (tokenCheck.fallbacks.length > 0) {
        console.warn(`Token fallbacks on ${surface.path}:`, tokenCheck.fallbacks);
      }

      // Log console errors (non-fatal)
      if (consoleErrors.length > 0) {
        console.warn(`Console errors on ${surface.path}:`, consoleErrors.slice(0, 5));
      }

      // The surface should render (body has content)
      const bodyText = await page.locator("body").textContent();
      expect(bodyText?.length).toBeGreaterThan(0);

      // Assert: no horizontal scroll (critical)
      expect(hasHorizontalScroll).toBe(false);
    });
  }
});
