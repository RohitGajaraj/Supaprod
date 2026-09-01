/**
 * Phase 6: Icon Audit
 * Sizing consistency, stroke weight, color role compliance
 */
import { test, expect, Page } from "@playwright/test";
import { login, takeScreenshot, waitForShell } from "./helpers/auth";

async function auditIcons(page: Page) {
  return await page.evaluate(() => {
    // Find all SVG icons
    const svgs = document.querySelectorAll("svg");
    const iconData: {
      size: string;
      strokeWidth: string | null;
      color: string;
      parent: string;
    }[] = [];

    const sizeViolations: string[] = [];

    svgs.forEach((svg) => {
      const rect = svg.getBoundingClientRect();
      const style = getComputedStyle(svg);
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      if (w > 0 && h > 0) {
        const strokeWidth = svg.getAttribute("stroke-width") || svg.style.strokeWidth || null;
        const parent = svg.parentElement?.tagName || "unknown";

        iconData.push({
          size: `${w}x${h}`,
          strokeWidth,
          color: style.color,
          parent,
        });

        // Flag non-standard sizes (expect 16, 20, 24, 32)
        const standardSizes = [12, 14, 16, 20, 24, 32, 40];
        if (!standardSizes.includes(w) || !standardSizes.includes(h)) {
          sizeViolations.push(`${w}x${h}px in <${parent}>`);
        }
      }
    });

    // Summarize sizes
    const sizeCounts: Record<string, number> = {};
    iconData.forEach((icon) => {
      sizeCounts[icon.size] = (sizeCounts[icon.size] || 0) + 1;
    });

    return {
      totalIcons: iconData.length,
      sizeCounts,
      sizeViolations: sizeViolations.slice(0, 15),
      sample: iconData.slice(0, 10),
    };
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

test.describe("Icon Audit", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: any;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  const surfaces = [
    { path: "/today", name: "today" },
    { path: "/engine-room", name: "engine-room" },
    { path: "/agents", name: "agents" },
    { path: "/settings", name: "settings" },
    { path: "/guardrails", name: "guardrails" },
  ];

  for (const surface of surfaces) {
    test(`icon audit on ${surface.path}`, async ({ page }) => {
      await page.context().addCookies(authCookies);
      await page.goto(surface.path, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      if (page.url().includes("/login")) {
        await login(page);
        await page.goto(surface.path, { waitUntil: "domcontentloaded" });
        await waitForShell(page);
      }

      const audit = await auditIcons(page);
      console.log(`Icon audit (${surface.path}):`, JSON.stringify(audit, null, 2));

      await takeScreenshot(page, `icons-${surface.name}`, "icons");

      // Report size violations (warn, not fail - some custom sizing OK)
      if (audit.sizeViolations.length > 0) {
        console.warn(`Icon size violations on ${surface.path}:`, audit.sizeViolations);
      }

      // Basic check: icons exist
      expect(audit.totalIcons).toBeGreaterThan(0);
    });
  }

  test("icon color compliance - check for ember vs neutral usage", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const colorAudit = await page.evaluate(() => {
      const svgs = document.querySelectorAll("svg");
      const coloredIcons: { color: string; class: string }[] = [];

      svgs.forEach((svg) => {
        const style = getComputedStyle(svg);
        const color = style.color;
        // Flag explicitly colored icons (not inheriting gray)
        if (
          color &&
          !color.includes("128, 128") &&
          !color.includes("0, 0, 0") &&
          !color.includes("255, 255, 255")
        ) {
          coloredIcons.push({
            color,
            class: (svg.className?.toString() || "").substring(0, 50),
          });
        }
      });
      return coloredIcons.slice(0, 15);
    });

    console.log("Colored icons:", colorAudit);
    await takeScreenshot(page, "icons-color-audit", "icons");
  });

  test("icon alignment in buttons", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const buttonIconAlignment = await page.evaluate(() => {
      const buttonsWithIcons = document.querySelectorAll('button svg, [role="button"] svg');
      const results: { buttonClass: string; iconSize: string; aligned: boolean }[] = [];

      buttonsWithIcons.forEach((svg) => {
        const button = svg.closest('button, [role="button"]');
        if (button) {
          const buttonStyle = getComputedStyle(button);
          const svgRect = svg.getBoundingClientRect();
          const buttonRect = button.getBoundingClientRect();

          // Check if icon is roughly centered vertically
          const iconMidY = svgRect.top + svgRect.height / 2;
          const buttonMidY = buttonRect.top + buttonRect.height / 2;
          const verticalDiff = Math.abs(iconMidY - buttonMidY);
          const aligned = verticalDiff < 3; // Within 3px

          results.push({
            buttonClass: (button.className || "").toString().split(" ")[0],
            iconSize: `${Math.round(svgRect.width)}x${Math.round(svgRect.height)}`,
            aligned,
          });
        }
      });
      return results.slice(0, 15);
    });

    console.log("Button icon alignment:", buttonIconAlignment);

    const misalignedIcons = buttonIconAlignment.filter((b) => !b.aligned);
    if (misalignedIcons.length > 0) {
      console.warn("Misaligned icons in buttons:", misalignedIcons);
    }
  });
});
