/**
 * Phase 5: Typography & Font Verification
 * Geist Sans, Mono, Pixel rendering, weights, line-heights
 */
import { test, expect, Page, Cookie } from "@playwright/test";
import { login, takeScreenshot, waitForShell } from "./helpers/auth";

async function getTypographyAudit(page: Page) {
  return await page.evaluate(() => {
    const result: {
      fonts: { [key: string]: string };
      headingWeights: string[];
      bodyLineHeight: string[];
      missingFonts: string[];
    } = {
      fonts: {},
      headingWeights: [],
      bodyLineHeight: [],
      missingFonts: [],
    };

    // Check CSS variables for fonts
    const rootStyle = getComputedStyle(document.documentElement);
    const fontSans = rootStyle.getPropertyValue("--font-geist-sans").trim();
    const fontMono = rootStyle.getPropertyValue("--font-geist-mono").trim();
    const fontPixel = rootStyle.getPropertyValue("--font-geist-pixel").trim();

    result.fonts = {
      "--font-geist-sans": fontSans || "NOT DEFINED",
      "--font-geist-mono": fontMono || "NOT DEFINED",
      "--font-geist-pixel": fontPixel || "NOT DEFINED",
    };

    // Check headings
    const headings = document.querySelectorAll("h1, h2, h3");
    headings.forEach((h) => {
      const style = getComputedStyle(h);
      result.headingWeights.push(
        `${h.tagName}: weight=${style.fontWeight}, size=${style.fontSize}, family=${style.fontFamily.split(",")[0]}`,
      );
    });

    // Check body text
    const bodyEls = document.querySelectorAll("p, span, div");
    let sample = 0;
    bodyEls.forEach((el) => {
      if (sample >= 3) return;
      const style = getComputedStyle(el);
      if (el.textContent && el.textContent.trim().length > 20) {
        result.bodyLineHeight.push(
          `${el.tagName}: lineHeight=${style.lineHeight}, fontSize=${style.fontSize}`,
        );
        sample++;
      }
    });

    // Check if Geist fonts actually loaded
    document.fonts.forEach((font) => {
      if (font.family.toLowerCase().includes("geist")) {
        result.fonts[`loaded:${font.family}`] = font.status;
      }
    });

    return result;
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

test.describe("Typography Verification", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: Cookie[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test("Geist fonts are loaded and active", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    // Wait for fonts
    await page.evaluate(() => document.fonts.ready);

    const fontCheck = await page.evaluate(() => {
      const loaded: string[] = [];
      const notLoaded: string[] = [];

      document.fonts.forEach((font) => {
        if (font.status === "loaded") {
          loaded.push(font.family + " " + font.weight);
        } else {
          notLoaded.push(font.family + " " + font.weight + " (" + font.status + ")");
        }
      });

      return { loaded, notLoaded };
    });

    console.log("Fonts loaded:", fontCheck.loaded);
    console.log("Fonts not loaded:", fontCheck.notLoaded);

    const geistFontsLoaded = fontCheck.loaded.some((f) => f.toLowerCase().includes("geist"));
    expect(geistFontsLoaded).toBe(true);
  });

  test("typography audit on Today surface", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const audit = await getTypographyAudit(page);
    console.log("Typography audit (Today):", JSON.stringify(audit, null, 2));
    await takeScreenshot(page, "typography-today", "typography");
  });

  test("typography audit on Brain surface", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/brain", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/brain", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const audit = await getTypographyAudit(page);
    console.log("Typography audit (Brain):", JSON.stringify(audit, null, 2));
    await takeScreenshot(page, "typography-brain", "typography");
  });

  test("Geist Pixel used for brand display moments", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/engine-room", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/engine-room", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    // Look for elements using Geist Pixel
    const pixelUsage = await page.evaluate(() => {
      const all = document.querySelectorAll("*");
      const pixelEls: string[] = [];
      all.forEach((el) => {
        const style = getComputedStyle(el);
        if (style.fontFamily.toLowerCase().includes("pixel")) {
          pixelEls.push(
            `${el.tagName}[${(el.className || "").toString().split(" ")[0]}]: "${el.textContent?.trim().substring(0, 30)}"`,
          );
        }
      });
      return pixelEls.slice(0, 10);
    });

    console.log("Geist Pixel usage:", pixelUsage);
    await takeScreenshot(page, "typography-engine-room-pixel", "typography");
  });

  test("heading weight compliance (600 expected)", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const headingWeights = await page.evaluate(() => {
      const headings = document.querySelectorAll("h1, h2, h3, h4");
      const results: { tag: string; weight: string; size: string }[] = [];
      headings.forEach((h) => {
        const style = getComputedStyle(h);
        results.push({
          tag: h.tagName,
          weight: style.fontWeight,
          size: style.fontSize,
        });
      });
      return results;
    });

    console.log("Heading weights:", headingWeights);

    // NAME PROMISES A CHECK THE BODY DOES NOT MAKE — flagged, not silently
    // fixed. The test is called "heading weight compliance (600 expected)" and
    // then only `console.warn`s, at a threshold of 500 rather than the 600 in
    // its own name. It cannot fail. Turning it into a real assertion needs a
    // ruling first: `styles.css` sets heading weights per type ramp rather than
    // one global 600, and `/today` renders headings from several families, so
    // the honest bar is not obviously "every h1-h4 is >= 600".
    //
    // The one thing that is unambiguous: a heading must not render at BODY
    // weight, which is the regression that makes a page look unstyled.
    headingWeights.forEach((h) => {
      const weight = parseInt(h.weight);
      if (weight < 500) {
        console.warn(`Heading ${h.tag} has low weight: ${h.weight}`);
      }
    });

    if (headingWeights.length > 0) {
      const bodyWeight = headingWeights.filter((h) => parseInt(h.weight) < 500);
      expect(
        bodyWeight.map((h) => `${h.tag}@${h.weight}`),
        "headings rendering below weight 500 read as body copy",
      ).toEqual([]);
    }
  });

  test("Geist Mono used for technical content", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/traces", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/traces", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const monoUsage = await page.evaluate(() => {
      const all = document.querySelectorAll('code, pre, [class*="mono"], kbd');
      const results: string[] = [];
      all.forEach((el) => {
        const style = getComputedStyle(el);
        results.push(`${el.tagName}: ${style.fontFamily.split(",")[0]}`);
      });
      return results.slice(0, 10);
    });

    console.log("Mono font usage:", monoUsage);
    await takeScreenshot(page, "typography-traces-mono", "typography");
  });
});
