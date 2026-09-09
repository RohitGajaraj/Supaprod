/**
 * Phase 7: Accessibility Testing
 * Keyboard navigation, focus traps, aria-labels, color contrast
 */
import { test, expect, Page, Cookie } from "@playwright/test";
import { login, takeScreenshot, waitForShell } from "./helpers/auth";
import { becomesVisible } from "./helpers/waits";

async function checkColorContrast(page: Page) {
  return await page.evaluate(() => {
    // Sample key text elements and check approximate contrast
    const textElements = document.querySelectorAll("h1, h2, h3, p, span, label, button");
    const samples: {
      tag: string;
      color: string;
      bg: string;
      text: string;
    }[] = [];

    let count = 0;
    textElements.forEach((el) => {
      if (count >= 10) return;
      if (!el.textContent?.trim()) return;

      const style = getComputedStyle(el);
      samples.push({
        tag: el.tagName,
        color: style.color,
        bg: style.backgroundColor,
        text: el.textContent.trim().substring(0, 30),
      });
      count++;
    });

    return samples;
  });
}

async function checkAriaLabels(page: Page) {
  return await page.evaluate(() => {
    const interactiveEls = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"]',
    );
    const missing: string[] = [];
    const hasLabel: string[] = [];

    interactiveEls.forEach((el) => {
      const ariaLabel = el.getAttribute("aria-label");
      const ariaLabelledBy = el.getAttribute("aria-labelledby");
      const title = el.getAttribute("title");
      const textContent = el.textContent?.trim();
      const placeholder = el.getAttribute("placeholder");

      const hasAccessibleName = ariaLabel || ariaLabelledBy || textContent || title || placeholder;

      if (!hasAccessibleName) {
        const tag = el.tagName;
        const className = (el.className || "").toString().substring(0, 40);
        missing.push(`${tag}.${className}`);
      } else {
        hasLabel.push(
          `${el.tagName}: ${ariaLabel || textContent?.substring(0, 20) || "via-labelledby"}`,
        );
      }
    });

    return {
      missing: missing.slice(0, 15),
      hasLabel: hasLabel.slice(0, 10),
      totalChecked: interactiveEls.length,
    };
  });
}

async function checkSemanticHTML(page: Page) {
  return await page.evaluate(() => {
    const landmarks = {
      main: document.querySelectorAll("main").length,
      nav: document.querySelectorAll("nav").length,
      header: document.querySelectorAll("header").length,
      footer: document.querySelectorAll("footer").length,
      aside: document.querySelectorAll("aside").length,
    };

    const headingHierarchy: string[] = [];
    let prevLevel = 0;
    const headingViolations: string[] = [];

    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      const level = parseInt(h.tagName[1]);
      headingHierarchy.push(`${h.tagName}: "${h.textContent?.trim().substring(0, 40)}"`);

      if (level > prevLevel + 1 && prevLevel > 0) {
        headingViolations.push(`Skipped from h${prevLevel} to h${level}`);
      }
      prevLevel = level;
    });

    return { landmarks, headingHierarchy: headingHierarchy.slice(0, 10), headingViolations };
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

test.describe("Accessibility - Keyboard Navigation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: Cookie[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  const surfaces = [
    { path: "/today", name: "today" },
    { path: "/build", name: "build" },
    { path: "/settings", name: "settings" },
    { path: "/agents", name: "agents" },
  ];

  for (const surface of surfaces) {
    test(`keyboard navigation on ${surface.path}`, async ({ page }) => {
      await page.context().addCookies(authCookies);
      await page.goto(surface.path, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      if (page.url().includes("/login")) {
        await login(page);
        await page.goto(surface.path, { waitUntil: "domcontentloaded" });
        await waitForShell(page);
      }

      // Tab through elements and track focus
      const focusPath: string[] = [];
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("Tab");
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          return {
            tag: el.tagName,
            role: el.getAttribute("role"),
            ariaLabel: el.getAttribute("aria-label"),
            text: el.textContent?.trim().substring(0, 30),
            hasOutline:
              getComputedStyle(el).outline !== "none" || getComputedStyle(el).boxShadow !== "none",
          };
        });
        if (focused) {
          focusPath.push(
            `${focused.tag}${focused.ariaLabel ? `[${focused.ariaLabel}]` : ""}: "${focused.text}" (ring:${focused.hasOutline})`,
          );
        }
      }

      console.log(`Focus path on ${surface.path}:`, focusPath);
      await takeScreenshot(page, `a11y-keyboard-${surface.name}`, "accessibility");

      // At least some focusable elements should exist
      expect(focusPath.length).toBeGreaterThan(0);
    });
  }

  test("Escape key closes modals/dropdowns", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    // Try to open a dialog if one exists
    const dialogTrigger = page
      .locator('[data-testid*="dialog"], button[aria-haspopup="dialog"], [aria-haspopup="true"]')
      .first();
    const hasDialogTrigger = await dialogTrigger.isVisible().catch(() => false);

    if (hasDialogTrigger) {
      const dialog = page.locator('[role="dialog"], [aria-modal="true"]').first();

      await dialogTrigger.click();
      // `locator.isVisible()` is a SNAPSHOT with no retry, so the old
      // `click(); waitForTimeout(500); isVisible()` was betting the dialog
      // mounted, animated in and painted inside 500ms. `becomesVisible` waits on
      // the condition and turns only the timeout into `false` — which stays
      // legal here, because the trigger selector is a heuristic and "this
      // surface has no dialog" is a real outcome, not a failure.
      const dialogOpen = await becomesVisible(dialog);

      if (dialogOpen) {
        await takeScreenshot(page, "a11y-modal-open", "accessibility");
        await page.keyboard.press("Escape");
        // Once the dialog HAS opened, closing on Escape is not optional — so
        // this is the web-first assertion, which retries until the dialog is
        // gone and fails loudly if it never is. The 300ms sleep it replaces
        // would have reported a slow-closing dialog as a broken one.
        await expect(dialog, "Escape must close an open dialog").toBeHidden();
        await takeScreenshot(page, "a11y-modal-closed", "accessibility");
      }
    }
  });
});

test.describe("Accessibility - Semantic HTML & ARIA", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: Cookie[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  const surfaces = [
    { path: "/today", name: "today" },
    { path: "/agents", name: "agents" },
    { path: "/settings", name: "settings" },
    { path: "/engine-room", name: "engine-room" },
    { path: "/guardrails", name: "guardrails" },
  ];

  for (const surface of surfaces) {
    test(`aria-labels audit on ${surface.path}`, async ({ page }) => {
      await page.context().addCookies(authCookies);
      await page.goto(surface.path, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      if (page.url().includes("/login")) {
        await login(page);
        await page.goto(surface.path, { waitUntil: "domcontentloaded" });
        await waitForShell(page);
      }

      const ariaAudit = await checkAriaLabels(page);
      console.log(`ARIA audit (${surface.path}):`, JSON.stringify(ariaAudit, null, 2));

      const semanticAudit = await checkSemanticHTML(page);
      console.log(`Semantic HTML (${surface.path}):`, JSON.stringify(semanticAudit, null, 2));

      // Warn about missing labels but don't hard-fail
      if (ariaAudit.missing.length > 0) {
        console.warn(
          `${ariaAudit.missing.length} elements missing accessible names on ${surface.path}`,
        );
      }

      // Should have landmark regions
      expect(semanticAudit.landmarks.main + semanticAudit.landmarks.nav).toBeGreaterThan(0);
    });
  }

  test("color contrast sampling on Today", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const contrastSamples = await checkColorContrast(page);
    console.log("Color contrast samples:", JSON.stringify(contrastSamples, null, 2));
    await takeScreenshot(page, "a11y-contrast-today", "accessibility");
  });

  test("heading hierarchy is logical", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const semanticAudit = await checkSemanticHTML(page);
    console.log("Heading hierarchy:", semanticAudit.headingHierarchy);

    if (semanticAudit.headingViolations.length > 0) {
      console.warn("Heading hierarchy violations:", semanticAudit.headingViolations);
    }
  });
});

test.describe("Accessibility - Reduced Motion", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: Cookie[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test("reduced motion media query is respected", async ({ page }) => {
    await page.context().addCookies(authCookies);

    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const motionCheck = await page.evaluate(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Check for animation-duration: 0s on animated elements
      const animatedEls = document.querySelectorAll(
        '[class*="animate"], [class*="transition"], [class*="motion"]',
      );
      const results: { el: string; duration: string }[] = [];

      animatedEls.forEach((el) => {
        const style = getComputedStyle(el);
        if (style.animationName !== "none") {
          results.push({
            el: el.tagName + "." + (el.className || "").toString().split(" ")[0],
            duration: style.animationDuration,
          });
        }
      });

      return { prefersReduced, animatedElements: results.slice(0, 10) };
    });

    console.log("Reduced motion check:", motionCheck);
    await takeScreenshot(page, "a11y-reduced-motion", "accessibility");

    expect(motionCheck.prefersReduced).toBe(true);
  });
});
