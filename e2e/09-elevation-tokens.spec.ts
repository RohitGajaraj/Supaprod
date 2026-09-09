/**
 * Elevation token verification
 *
 * Shadows come from the `--ds-shadow-*` scale on `:root` (2xs · xs · small ·
 * medium · large · xl · 2xl, plus the composed `--ds-shadow-border*` variants),
 * and inline hardcoded shadows are violations.
 *
 * The header used to name "material-base/small/medium/large". Those tokens do
 * not exist and were retired with the material-era design system; the file kept
 * probing them for weeks and reporting 0/8 into a console.log. See
 * `checkElevationTokens` for the full note.
 */
import { test, expect, Page, Cookie } from "@playwright/test";
import { login, takeScreenshot, waitForShell } from "./helpers/auth";

async function checkElevationTokens(page: Page) {
  return await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);

    // ELEVATION TOKENS, RENAMED TO THE ONES THAT EXIST.
    //
    // All eight names this probed before — `--material-base/small/medium/large`
    // and `--ds-shadow-base/sm/md/lg` — are absent from `src/styles.css`. Not
    // one of them has ever resolved. The file's header still claims it verifies
    // "preset tokens (material-base/small/medium/large)"; that vocabulary was
    // retired with the material-era design system and never re-pointed here.
    //
    // It went unnoticed because the only consumer of this object is a
    // `console.log` reading "Elevation tokens defined: 0/8" — a line that has
    // been printing 0/8 as though that were information, in a test that asserts
    // nothing and therefore passes at zero coverage.
    //
    // The real names (`styles.css` L3262-3278) are a t-shirt scale plus the
    // composed border variants.
    const SHADOW_TOKENS = [
      "--ds-shadow-2xs",
      "--ds-shadow-xs",
      "--ds-shadow-small",
      "--ds-shadow-medium",
      "--ds-shadow-large",
      "--ds-shadow-xl",
      "--ds-shadow-2xl",
      "--ds-shadow-border",
    ];
    const elevationTokens: Record<string, string> = {};
    SHADOW_TOKENS.forEach((token) => {
      elevationTokens[token] = root.getPropertyValue(token).trim();
    });

    // Find elements with box-shadow
    const shadowed: { tag: string; class: string; shadow: string; usesVar: boolean }[] = [];
    document.querySelectorAll("*").forEach((el) => {
      const style = window.getComputedStyle(el);
      const shadow = style.boxShadow;
      if (shadow && shadow !== "none") {
        // Check if the computed value looks like a token-based shadow
        // Inline styles with hardcoded values are violations
        const inlineStyle = (el as HTMLElement).style.boxShadow;
        const usesVar = !inlineStyle || !inlineStyle.match(/rgba?\(|#[0-9a-f]{3,6}/i);

        shadowed.push({
          tag: el.tagName,
          class: (el.className || "").toString().split(" ")[0].substring(0, 40),
          shadow: shadow.substring(0, 100),
          usesVar,
        });
      }
    });

    return {
      elevationTokens,
      shadowedElements: shadowed.slice(0, 20),
      adHocShadowCount: shadowed.filter((s) => !s.usesVar).length,
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

test.describe("Elevation & Shadow Token Compliance", () => {
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
  ];

  for (const surface of surfaces) {
    test(`elevation tokens on ${surface.path}`, async ({ page }) => {
      await page.context().addCookies(authCookies);
      await page.goto(surface.path, { waitUntil: "domcontentloaded" });
      await waitForShell(page);

      if (page.url().includes("/login")) {
        await login(page);
        await page.goto(surface.path, { waitUntil: "domcontentloaded" });
        await waitForShell(page);
      }

      const elevationAudit = await checkElevationTokens(page);
      console.log(
        `Elevation audit (${surface.path}):`,
        JSON.stringify(
          {
            tokens: elevationAudit.elevationTokens,
            adHocCount: elevationAudit.adHocShadowCount,
            sampleShadows: elevationAudit.shadowedElements.slice(0, 5),
          },
          null,
          2,
        ),
      );

      await takeScreenshot(page, `elevation-${surface.name}`, "elevation");

      // REVIVED ON 2026-08-10. This block used to compute `setTokens` and
      // `console.log` the count, asserting nothing — so the test passed with
      // every token missing, which is exactly what was happening (the names it
      // probed did not exist; see checkElevationTokens above). All eight are
      // declared on `:root` in `src/styles.css` L3262-3278, so every one of them
      // must resolve on every surface. An unresolved shadow token is a flat
      // surface where the design called for depth.
      const unresolved = Object.entries(elevationAudit.elevationTokens)
        .filter(([, value]) => value === "")
        .map(([token]) => token);
      expect(unresolved, `elevation tokens did not resolve on ${surface.path}`).toEqual([]);
    });
  }

  test("glass panel material on sidebar rail", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    // Check sidebar/rail for glass material
    const railGlass = await page.evaluate(() => {
      const rail = document.querySelector(
        '[class*="rail"], [class*="sidebar"], nav[class*="side"]',
      );
      if (!rail) return null;
      const style = getComputedStyle(rail);
      return {
        backdropFilter: style.backdropFilter,
        background: style.background.substring(0, 100),
        opacity: style.opacity,
      };
    });

    console.log("Rail glass material:", railGlass);
    await takeScreenshot(page, "elevation-rail-glass", "elevation");
  });

  test("TopBar glass material", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const topBarGlass = await page.evaluate(() => {
      const topBar = document.querySelector(
        '[class*="topbar"], [class*="TopBar"], [class*="top-bar"], header',
      );
      if (!topBar) return null;
      const style = getComputedStyle(topBar);
      return {
        backdropFilter: style.backdropFilter,
        background: style.background.substring(0, 100),
        position: style.position,
        zIndex: style.zIndex,
      };
    });

    console.log("TopBar glass:", topBarGlass);
    await takeScreenshot(page, "elevation-topbar-glass", "elevation");
  });
});
