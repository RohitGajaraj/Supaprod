/**
 * Phase 3: Interactive State Testing
 * Hover, focus, loading, error, empty, disabled states
 */
import { test, expect, Page, Cookie } from "@playwright/test";
import { login, takeScreenshot, waitForShell } from "./helpers/auth";
import { waitForStyleToSettle } from "./helpers/waits";

/** Hue channel out of `oklch(L C H)` / `oklch(L C H / a)`, or null if the value
 *  is not an oklch colour. Lightness may be `65%` or `0.65`; only the third
 *  component is read. */
function parseOklchHue(value: string): number | null {
  const match = /oklch\(\s*[\d.%]+\s+[\d.]+\s+([\d.]+)/i.exec(value);
  return match ? Number.parseFloat(match[1]) : null;
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

test.describe("Interactive States - Today", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: Cookie[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test("button hover states on Today", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    await takeScreenshot(page, "today-default", "interactive/today");

    // Hover over primary buttons
    const buttons = page.locator("button:visible").all();
    const btns = await buttons;

    if (btns.length > 0) {
      await btns[0].hover();
      // Was `waitForTimeout(200) // Allow transition to settle` — a guess at a
      // transition duration nothing in this test knows. Wait for the transition
      // to actually end instead, so the screenshot captures the settled hover
      // state on a slow box too.
      await waitForStyleToSettle(btns[0]);
      await takeScreenshot(page, "today-button-hover", "interactive/today");
    }
  });

  test("focus ring visibility on Today - keyboard navigation", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    // Tab through elements to verify focus rings
    await page.keyboard.press("Tab");
    await takeScreenshot(page, "today-focus-first", "interactive/today");

    await page.keyboard.press("Tab");
    await takeScreenshot(page, "today-focus-second", "interactive/today");

    await page.keyboard.press("Tab");
    await takeScreenshot(page, "today-focus-third", "interactive/today");

    // Check that focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        outline: style.outline,
        outlineColor: style.outlineColor,
        boxShadow: style.boxShadow,
      };
    });

    console.log("Focused element state:", focusedElement);
  });

  test("card hover states on Today", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    // Find cards
    const cards = page.locator('[class*="card"], [data-testid*="card"], article').first();
    const isVisible = await cards.isVisible().catch(() => false);

    if (isVisible) {
      await cards.hover();
      // Same substitution as the button hover above: settle on the condition,
      // not on a clock.
      await waitForStyleToSettle(cards);
      await takeScreenshot(page, "today-card-hover", "interactive/today");
    }
  });
});

test.describe("Interactive States - Build", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: Cookie[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test("build surface interactive states", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/build", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/build", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    await takeScreenshot(page, "build-default", "interactive/build");

    // Tab navigation
    await page.keyboard.press("Tab");
    await takeScreenshot(page, "build-focus-tab1", "interactive/build");

    // Check empty state if present
    const emptyState = page.locator('[class*="empty"], [data-testid*="empty"]').first();
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    if (hasEmpty) {
      await takeScreenshot(page, "build-empty-state", "interactive/build");
    }
  });

  test("keyboard navigation through Build", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/build", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/build", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    // Tab through 5 elements and log focus
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el
          ? {
              tag: el.tagName,
              role: el.getAttribute("role"),
              text: el.textContent?.trim().substring(0, 30),
            }
          : null;
      });
      console.log(`Tab ${i + 1}:`, focused);
    }
    await takeScreenshot(page, "build-keyboard-nav", "interactive/build");
  });
});

test.describe("Interactive States - Discover", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: Cookie[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test("discover interactive states", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/discover", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/discover", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    await takeScreenshot(page, "discover-default", "interactive/discover");

    // Check for search/filter inputs
    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]',
      )
      .first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.click();
      await takeScreenshot(page, "discover-search-focus", "interactive/discover");
      await searchInput.fill("test");
      await takeScreenshot(page, "discover-search-typed", "interactive/discover");
    }

    // Tab through elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await takeScreenshot(page, "discover-focus-state", "interactive/discover");
  });
});

test.describe("Focus Ring Compliance", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: Cookie[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  /**
   * INVERTED ON 2026-08-10. This test used to be named "focus rings use
   * glacier/blue (not ember)" and asserted that `--ds-focus-color` was NOT
   * ember. The product ruled the other way and the ruling is quoted in the
   * source: `src/styles.css` L3309-3313 — "Focus ring color = ember brand
   * accent (founder ruling DESIGN-TEMPO.md §2). Uses ember hue (50), not blue
   * (41)." The test was guarding a retired rule, so it is re-pointed at the
   * live one rather than deleted.
   *
   * IT COULD NEVER HAVE CAUGHT ITS OWN RULE ANYWAY, which is the more useful
   * half of this finding. The check was:
   *
   *     color.includes('#ff6b2c') || color.includes('oklch(0.65 0.18 50')
   *
   * The token has never been spelled `oklch(0.65 …)`. It is `oklch(65% 0.18
   * 50)` — percentage, not decimal — so that arm of the test matched nothing on
   * any day it has existed. The hex arm only fires in `.light-theme`, a class
   * the app does not set (`use-theme.tsx` sets `.dark` / `[data-theme=light]`).
   * So a test that asserted the wrong rule ALSO could not observe the value it
   * was asserting about, and would have gone green either way.
   */
  test("focus ring is the ember brand accent (founder ruling, DESIGN-TEMPO §2)", async ({
    page,
  }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    await page.keyboard.press("Tab");

    const focusStyle = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      const cssVars = getComputedStyle(document.documentElement);
      return {
        outline: style.outline,
        outlineColor: style.outlineColor,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
        focusColor: cssVars.getPropertyValue("--ds-focus-color").trim(),
        focusRing: cssVars.getPropertyValue("--ds-focus-ring-outline").trim(),
      };
    });

    console.log("Focus ring styles:", focusStyle);

    // The token has to resolve at all. A focus ring that falls back to the UA
    // default is the failure this whole describe block exists to catch.
    expect(focusStyle?.focusColor, "--ds-focus-color must resolve").toBeTruthy();
    expect(focusStyle?.focusRing, "--ds-focus-ring-outline must resolve").toBeTruthy();

    // Hue, not an exact string. Matching the literal spelling is what made the
    // previous version of this test unable to fire (see the note above), and a
    // retune of lightness or chroma is not a violation of the ruling — a change
    // of HUE is.
    const EMBER_HUE = 50;
    const hue = parseOklchHue(focusStyle!.focusColor);
    if (hue !== null) {
      expect(
        Math.abs(hue - EMBER_HUE),
        `focus ring hue is ${hue}; the ruling is the ember hue (${EMBER_HUE}). ` +
          `A blue/glacier focus ring is the retired design.`,
      ).toBeLessThanOrEqual(10);
    } else {
      // Not an oklch() value — record it rather than passing silently, so a
      // switch to hex/rgb does not quietly retire this assertion the way the
      // spelling mismatch retired the last one.
      console.warn(
        `Focus color "${focusStyle!.focusColor}" is not oklch(); hue not checked. ` +
          `Update parseOklchHue if the token changed format.`,
      );
    }

    /**
     * REPORTED, NOT ASSERTED — a real defect this test sits next to.
     *
     * `styles.css` L3590 puts the dark-tuned focus colour (`oklch(60% 0.18 50)`,
     * darkened for contrast on a dark background) behind
     * `[data-theme="dark"], .dark-theme`. The app sets NEITHER: `use-theme.tsx`
     * `applyThemeClass` writes dark as the `dark` CLASS with the `data-theme`
     * attribute DELETED. So in the shipped dark theme — the default — the focus
     * ring falls through to `:root`'s light-tuned `oklch(65% 0.18 50)`, and the
     * dark override is dead CSS.
     *
     * Not asserted here because fixing it is a `src/` change and this lane is
     * confined to `e2e/`. Left as a comment so the next reader of this file
     * finds it, since a passing test is otherwise evidence the theme is fine.
     */
  });
});
