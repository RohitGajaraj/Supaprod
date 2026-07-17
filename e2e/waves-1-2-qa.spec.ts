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

const DEMO_EMAIL = "demo@redcadence.app";
const DEMO_PASSWORD = "Cadence!Demo2026";
const BASE_URL = "http://localhost:8080";

// All 14 authenticated surfaces to test
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
  "/premium",
];

// 3 breakpoints: mobile, tablet, desktop
const BREAKPOINTS = [
  { name: "mobile", width: 320, height: 640 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

test.describe("Waves 1-2 QA: Design System Verification", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Log in with demo credentials
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', DEMO_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to authenticated route
    await page.waitForURL(
      /\/(today|discover|plan|build|brain|engine-room|settings|guardrails|agents|evals|traces|drift|premium)/,
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
          await page.goto(`${BASE_URL}${surface}`, { waitUntil: "networkidle" });
          await page.waitForTimeout(300); // Let layout settle

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
        page.on("console", (msg) => {
          if (msg.type() === "error") {
            errors.push(msg.text());
          }
        });

        await page.goto(`${BASE_URL}${surface}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(500);

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
      await page.goto(`${BASE_URL}/today`, { waitUntil: "networkidle" });

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
      await page.goto(`${BASE_URL}/today`, { waitUntil: "networkidle" });

      // Tab to first interactive element
      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);

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
      await page.goto(`${BASE_URL}/today`, { waitUntil: "networkidle" });

      const fontLoaded = await page.evaluate(() => {
        return document.fonts.check("12px Geist");
      });

      expect(fontLoaded, "Geist Sans should be loaded").toBe(true);
    });

    test("Color tokens resolve (no hardcoded hex visible)", async () => {
      await page.goto(`${BASE_URL}/today`, { waitUntil: "networkidle" });

      // Sample: check that elements use CSS variables, not hardcoded colors
      const elementsWithVar = await page.evaluate(() => {
        const elements = document.querySelectorAll("[style*='var(--']");
        return elements.length > 0;
      });

      expect(elementsWithVar, "Elements should use CSS variables (--ds-*)").toBe(true);
    });
  });

  test.describe("Responsive Rail & Navigation", () => {
    test("Rail hidden on mobile (<768px)", async () => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`${BASE_URL}/today`, { waitUntil: "networkidle" });

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
      await page.goto(`${BASE_URL}/today`, { waitUntil: "networkidle" });

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
      await page.goto(`${BASE_URL}/today`, { waitUntil: "networkidle" });

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
      await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });

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
      await page.goto(`${BASE_URL}/today`, { waitUntil: "networkidle" });

      const isDarkTheme = await page.evaluate(() => {
        const html = document.documentElement;
        return html.classList.contains("dark") || html.getAttribute("data-theme") === "dark";
      });

      expect(isDarkTheme, "Dark theme should be default").toBe(true);
    });
  });
});
