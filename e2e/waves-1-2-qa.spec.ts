/**
 * Waves 1-2 QA: Comprehensive visual & interactive verification
 *
 * Tests all 14 authenticated surfaces for:
 * - Layout correctness (no horizontal scroll)
 * - Responsive behavior at 3 breakpoints
 * - Interactive states (hover, focus, click)
 * - Typography and color token resolution
 * - Accessibility baseline
 */

import { test, expect, Page } from "@playwright/test";
import { waitForFocusToLand, waitForLayoutToSettle } from "./helpers/waits";

// A SECOND COPY OF THE LEAKED CREDENTIAL LIVED HERE.
//
// This file kept its own `DEMO_PASSWORD` constant rather than importing the
// helper, so removing the one in `helpers/auth.ts` alone would have left the
// secret in the repo and this spec still trying a password rotated on
// 2026-07-25. A duplicated credential is the reason a rotation half-lands:
// whoever fixes the obvious copy reasonably believes they are done.
//
// The value is not quoted here. `error-context.md` embeds source around a
// failure, so a comment naming it puts it straight back into an artifact —
// see the header of `helpers/auth.ts`.
//
// Both now come from one place, and the absence of the env var throws by name.
import { DEMO_EMAIL, demoPassword, BASE_URL, waitForShell } from "./helpers/auth";

/**
 * The comment above this list said "All 14 authenticated surfaces" and the list
 * held 13. It now holds 12: `/premium` was removed on 2026-08-10 because there
 * is no such route — `src/routes/` has no `_authenticated.premium.tsx`, so
 * TanStack Router serves the not-found boundary. The three `/premium` cases
 * (one per breakpoint) were passing VACUOUSLY: a 404 boundary is a small,
 * well-behaved page, so "no horizontal scroll" held on it trivially and the
 * suite reported three green checks for a surface that does not exist.
 *
 * `/decide` and `/ship` are deliberately NOT added here even though they exist
 * and `02-surfaces-desktop.spec.ts` covers them — this file is a wave-scoped QA
 * snapshot, and widening it is a separate decision from repairing it.
 */
const SURFACES = [
  "/today",
  "/discover",
  "/plan",
  "/build",
  "/brain",
  "/engine-room",
  "/settings",
  "/guardrails",
  "/agents",
  "/evals",
  "/traces",
  "/drift",
];

// 3 breakpoints: mobile, tablet, desktop
const BREAKPOINTS = [
  { name: "mobile", width: 320, height: 640 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

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

test.describe("Waves 1-2 QA: Design System Verification", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Log in with demo credentials
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', demoPassword());
    await page.click('button[type="submit"]');

    // Wait for redirect to authenticated route
    await page.waitForURL(
      /\/(today|discover|plan|build|brain|engine-room|settings|guardrails|agents|evals|traces|drift)/,
      {
        timeout: 10000,
      },
    );
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.describe("Layout & Responsiveness", () => {
    for (const surface of SURFACES) {
      for (const bp of BREAKPOINTS) {
        test(`${surface} @ ${bp.name} (${bp.width}x${bp.height}): no horizontal scroll`, async () => {
          await page.setViewportSize({ width: bp.width, height: bp.height });
          await page.goto(`${BASE_URL}${surface}`, { waitUntil: "domcontentloaded" });
          await waitForShell(page);
          // Was `waitForTimeout(300) // Let layout settle`. Settling is a
          // condition — the document box stops changing — so wait for that and
          // then assert ONCE. Deliberately not `expect.poll(hasHorizontalScroll)
          // .toBe(false)`: a page that overflows and then corrects is a defect a
          // user sees, and polling the assertion would pass it.
          await waitForLayoutToSettle(page);

          // Check for horizontal scroll (critical P0 defect)
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });

          expect(hasHorizontalScroll, `${surface} at ${bp.name} has horizontal scroll!`).toBe(
            false,
          );
        });
      }
    }
  });

  test.describe("Console Errors", () => {
    for (const surface of SURFACES.slice(0, 3)) {
      // Test first 3 surfaces (representative sample)
      test(`${surface}: no critical console errors`, async () => {
        const errors: string[] = [];
        const collect = (msg: { type(): string; text(): string }) => {
          if (msg.type() === "error") {
            errors.push(msg.text());
          }
        };
        // `page` is shared across this whole file via `beforeAll`, so a listener
        // added per test and never removed accumulates for the life of the run
        // (and trips Node's max-listeners warning at 11). Remove it in a
        // `finally` so each test observes only its own navigation.
        page.on("console", collect);

        try {
          await page.goto(`${BASE_URL}${surface}`, { waitUntil: "domcontentloaded" });
          await waitForShell(page);
          // Was `waitForTimeout(500)`, standing in for "let async errors
          // surface". The condition underneath that guess is "the surface has
          // finished rendering", because that is when mount-time errors have
          // been logged. Settling is the observable version of it.
          await waitForLayoutToSettle(page);
        } finally {
          page.off("console", collect);
        }

        // Ignore known non-critical errors, capture only critical ones
        const criticalErrors = errors.filter(
          (e) =>
            !e.includes("Warning") &&
            !e.includes("deprecated") &&
            !e.includes("Unsupported") &&
            !e.includes("not found in"),
        );

        expect(criticalErrors, `${surface} has critical console errors`).toHaveLength(0);
      });
    }
  });

  test.describe("Interactive States", () => {
    test("Buttons: hover state smooth (desktop only)", async () => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      // Find first interactive button
      const button = await page.locator("button:visible").first();
      if (await button.isVisible()) {
        // Hover and check computed styles transition smoothly
        await button.hover();
        const computedStyle = await button.evaluate((el) => {
          return window.getComputedStyle(el).transitionDuration;
        });

        // Verify transition is defined (smooth hover, not instant)
        expect(computedStyle, "Button hover should have CSS transition").not.toBe("0s");
      }
    });

    test("Focus ring: visible on Tab navigation", async () => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      // Tab to first interactive element.
      await page.keyboard.press("Tab");
      // Was `waitForTimeout(100)`. Waiting for focus to LEAVE `<body>` also
      // repairs the assertions below: `document.activeElement` is essentially
      // never null — it falls back to `<body>` — so the old shape passed
      // whether or not anything on the surface was focusable. Timing out here
      // means the surface has no reachable focus target, which is the defect.
      await waitForFocusToLand(page);

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        if (!el) return null;
        const styles = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          outline: styles.outline,
          boxShadow: styles.boxShadow,
        };
      });

      expect(focusedElement, "Focus ring should be visible on Tab").not.toBeNull();
      expect(
        focusedElement?.outline || focusedElement?.boxShadow,
        "Focused element should have outline or box-shadow",
      ).toBeTruthy();
    });
  });

  test.describe("Typography & Tokens", () => {
    test("Geist Sans font loads", async () => {
      await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      const fontLoaded = await page.evaluate(() => {
        return document.fonts.check("12px Geist");
      });

      expect(fontLoaded, "Geist Sans should be loaded").toBe(true);
    });

    /**
     * REWRITTEN ON 2026-08-10 — the old assertion rewarded the defect.
     *
     * It was:
     *
     *     document.querySelectorAll("[style*='var(--']").length > 0
     *
     * That counts elements carrying an INLINE `style` attribute containing
     * `var(--`, and required at least one. A perfectly tokenised app styles
     * through classes and has ZERO inline `var(--` attributes — so the cleaner
     * the codebase got, the closer this came to failing, and the way to make it
     * green was to add inline styles. Its name ("no hardcoded hex visible")
     * describes a check it never performed.
     *
     * The property actually worth guarding is the one `02-surfaces-desktop`'s
     * `checkTokenResolution` also aims at: the design-system tokens resolve on
     * `:root`. An unresolved token is the failure that turns a surface
     * transparent, and it is observable directly.
     */
    test("design-system color tokens resolve on :root", async () => {
      await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      const unresolved = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        return [
          "--ds-background-100",
          "--ds-background-200",
          "--ds-gray-100",
          "--ds-gray-1000",
          "--ember",
          "--ds-focus-color",
        ].filter((token) => root.getPropertyValue(token).trim() === "");
      });

      expect(unresolved, "these design tokens did not resolve on :root").toEqual([]);
    });
  });

  /**
   * THE BREAKPOINT IN THESE TWO TEST NAMES IS WRONG, AND THE ASSERTIONS STILL
   * HOLD. `src/styles/shell.css` L1266-1269 hides the rail at
   * `@media (max-width: 640px)`, not 768. The tests run at 320 and 1280, which
   * sit either side of BOTH numbers, so they pass — but nothing here covers
   * 641-767px, the band where the names claim the rail is hidden and it is in
   * fact visible. Names left in place and flagged rather than silently
   * corrected: which breakpoint is intended is a design call, not a test call.
   *
   * The selectors are also mostly dead. `[data-slot="app-rail"]` and `.rail`
   * match nothing — `AppFrame.tsx` L1236 renders `<aside className="sp-rail">`.
   * Only the third fallback, `[class*='rail']`, ever matches. Note the asymmetry
   * that hides: `if (!rail) return false` means the MOBILE test would pass
   * vacuously if the rail element vanished entirely, while the desktop test
   * would correctly fail.
   */
  test.describe("Responsive Rail & Navigation", () => {
    test("Rail hidden on mobile (<768px)", async () => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      const railVisible = await page.evaluate(() => {
        const rail =
          document.querySelector('[data-slot="app-rail"]') ||
          document.querySelector(".rail") ||
          document.querySelector("[class*='rail']");
        if (!rail) return false;
        const styles = window.getComputedStyle(rail);
        return styles.display !== "none";
      });

      expect(railVisible, "Rail should be hidden on mobile").toBe(false);
    });

    test("Rail visible on desktop (≥768px)", async () => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      const railVisible = await page.evaluate(() => {
        const rail =
          document.querySelector('[data-slot="app-rail"]') ||
          document.querySelector(".rail") ||
          document.querySelector("[class*='rail']");
        if (!rail) return false;
        const styles = window.getComputedStyle(rail);
        return styles.display !== "none";
      });

      expect(railVisible, "Rail should be visible on desktop").toBe(true);
    });
  });

  test.describe("Accessibility Baseline", () => {
    test("Images have alt text or aria-label", async () => {
      await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      const imagesWithoutAlt = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll("img"));
        return images.filter((img) => {
          const hasAlt = !!img.alt && img.alt.trim().length > 0;
          const hasAriaLabel =
            !!img.getAttribute("aria-label") && img.getAttribute("aria-label")!.trim().length > 0;
          return !hasAlt && !hasAriaLabel;
        }).length;
      });

      expect(imagesWithoutAlt, "All images should have alt text or aria-label").toBe(0);
    });

    test("Form inputs associated with labels", async () => {
      await page.goto(`${BASE_URL}/settings`, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      const inputsWithoutLabel = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll("input, textarea, select"));
        return inputs.filter((input) => {
          const hasId = !!input.id && input.id.trim().length > 0;
          const hasLabel = hasId && !!document.querySelector(`label[for="${input.id}"]`);
          const hasAriaLabel =
            !!input.getAttribute("aria-label") &&
            input.getAttribute("aria-label")!.trim().length > 0;
          return !hasLabel && !hasAriaLabel;
        }).length;
      });

      expect(inputsWithoutLabel, "Form inputs should be associated with labels").toBeLessThan(5); // Allow some inputs without explicit labels (search, etc)
    });
  });

  test.describe("Dark Theme", () => {
    test("Dark theme applied by default", async () => {
      await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      const isDarkTheme = await page.evaluate(() => {
        const html = document.documentElement;
        return html.classList.contains("dark") || html.getAttribute("data-theme") === "dark";
      });

      expect(isDarkTheme, "Dark theme should be default").toBe(true);
    });
  });
});
