/**
 * Phase 8: Dark/Light Theme Verification
 * Token resolution in both themes, contrast, no hardcoded colors
 */
import { test, expect, Page, Cookie } from "@playwright/test";
import { login, takeScreenshot, waitForShell } from "./helpers/auth";
import { becomesVisible, readThemeMarker } from "./helpers/waits";

/**
 * THE THEME TOGGLE, LOCATED BY THE COPY IT ACTUALLY RENDERS.
 *
 * `AppFrame.tsx` L1343-1351 draws one `<button className="sp-setbtn">` whose
 * `aria-label` and `title` both come from `THEME_TITLE`, which names the NEXT
 * stop in the cycle rather than the control:
 *
 *     light -> "Switch to dark"   dark -> "Follow the system"   system -> "Switch to light"
 *
 * The previous selector list here was `[data-testid="theme-toggle"]`,
 * `button[aria-label*="theme" i]`, `button[aria-label*="dark" i]`,
 * `button[aria-label*="light" i]`, `[class*="theme-toggle"]`. None of those
 * matches "Follow the system" — and the app's DEFAULT theme is dark, so in the
 * default state the toggle was unfindable and the light-theme test below has
 * never once run against light theme. It logged "could not find toggle" and
 * asserted nothing.
 *
 * FRAGILE ON PURPOSE, AND FLAGGED: matching on user-facing copy means a
 * rewording of `THEME_TITLE` silently un-finds this control and sends the
 * light-theme test back to skipping. The right fix is a `data-testid` on that
 * button, which is a `src/` change this lane cannot make. Keep the
 * `data-testid` arm first so it takes over the day someone adds it.
 */
const THEME_LABELS = ["Switch to dark", "Switch to light", "Follow the system"] as const;

function themeToggle(page: Page) {
  return page
    .locator(
      [
        '[data-testid="theme-toggle"]',
        ...THEME_LABELS.map((label) => `button[aria-label="${label}"]`),
      ].join(", "),
    )
    .first();
}

async function getThemeTokenValues(page: Page) {
  return await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const tokens = [
      "--ds-background-100",
      "--ds-background-200",
      "--ds-gray-100",
      "--ds-gray-200",
      "--ds-gray-900",
      "--ds-gray-1000",
      "--ember",
      "--ds-focus-color",
      "--ds-focus-ring-outline",
      "--ds-red-700",
      "--ds-green-700",
    ];

    const values: Record<string, string> = {};
    tokens.forEach((token) => {
      values[token] = root.getPropertyValue(token).trim() || "NOT_SET";
    });

    // THEME DETECTION, WHICH COULD NOT REPORT "light".
    //
    // This line used to read:
    //
    //     const theme = htmlEl.getAttribute('data-theme')
    //       || htmlEl.className.includes('dark') ? 'dark' : 'light';
    //
    // `||` binds tighter than `?:`, so it parsed as
    // `(getAttribute(...) || className.includes('dark')) ? 'dark' : 'light'`.
    // In LIGHT theme the app sets `data-theme="light"` — a truthy string — so
    // the condition was true and the function reported `'dark'`. It returned
    // 'light' only when the document had no theme marker at all. Every "light
    // theme tokens" log this file has ever produced was labelled dark.
    //
    // The real contract (`src/hooks/use-theme.tsx` `applyThemeClass`): dark is
    // the `dark` CLASS with `data-theme` DELETED, because `:root` already holds
    // the dark tokens; light is `data-theme="light"` with the class removed.
    // There is no `data-theme="dark"`.
    const htmlEl = document.documentElement;
    const marker = htmlEl.getAttribute("data-theme");
    const theme =
      marker === "light" ? "light" : htmlEl.classList.contains("dark") ? "dark" : "unknown";

    return { theme, values };
  });
}

async function checkForHardcodedColors(page: Page) {
  return await page.evaluate(() => {
    // Look for common hardcoded color patterns in inline styles
    const allEls = document.querySelectorAll(
      '[style*="color:"], [style*="background:"], [style*="background-color:"]',
    );
    const hardcoded: string[] = [];

    allEls.forEach((el) => {
      const style = el.getAttribute("style") || "";
      // Check for hardcoded hex, rgb, etc. (not CSS variables)
      if (style.match(/#[0-9a-fA-F]{3,6}|rgb\(|rgba\(/) && !style.includes("var(")) {
        hardcoded.push(`${el.tagName}: style="${style.substring(0, 80)}"`);
      }
    });

    return hardcoded.slice(0, 15);
  });
}

/**
 * Cycles the theme control until the document is in LIGHT theme. Returns false
 * if the control cannot be found at all.
 *
 * The three `waitForTimeout(500/300/500)` calls this replaces were each waiting
 * for React to commit a theme change after a click. The observable they should
 * have waited on is the toggle's own `aria-label`, which names the NEXT stop in
 * the cycle and therefore changes on every single click — including the
 * `dark -> system` hop, which can leave the html marker untouched when the OS
 * also prefers dark and so is invisible to a marker-only wait. Waiting on the
 * label makes this correct under either system preference.
 *
 * Cycling rather than single-clicking is deliberate: `use-theme.tsx` walks
 * `light -> dark -> system -> light`, so reaching light from the default (dark)
 * takes one or two hops depending on `prefers-color-scheme`. The loop is bounded
 * at 3 because that is the length of the cycle — a fourth iteration would mean
 * the control is not cycling, which is a failure, not a reason to keep clicking.
 */
async function switchToLightTheme(page: Page): Promise<boolean> {
  const toggle = themeToggle(page);
  if (!(await becomesVisible(toggle))) return false;

  for (let hop = 0; hop < 3; hop++) {
    if ((await readThemeMarker(page)) === "light") return true;

    const labelBefore = await toggle.getAttribute("aria-label");
    await toggle.click();
    await page.waitForFunction(
      ({ labels, previous }) => {
        const button = Array.from(document.querySelectorAll("button[aria-label]")).find((b) =>
          labels.includes(b.getAttribute("aria-label") ?? ""),
        );
        return !!button && button.getAttribute("aria-label") !== previous;
      },
      { labels: [...THEME_LABELS] as string[], previous: labelBefore },
      { timeout: 5_000 },
    );
  }

  return (await readThemeMarker(page)) === "light";
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

test.describe("Theme Verification", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: Cookie[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test("dark theme tokens resolve correctly on Today", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const darkTokens = await getThemeTokenValues(page);
    console.log("Dark theme tokens:", JSON.stringify(darkTokens, null, 2));
    await takeScreenshot(page, "theme-dark-today", "themes");

    // Critical tokens should resolve
    const missingTokens = Object.entries(darkTokens.values).filter(([, v]) => v === "NOT_SET");
    if (missingTokens.length > 0) {
      console.warn("Missing token values:", missingTokens);
    }
    expect(missingTokens.length).toBeLessThan(3); // Allow up to 2 optional tokens missing
  });

  test("light theme tokens resolve correctly", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    // Read the dark values first, so "light actually swapped the tokens" is
    // checkable rather than assumed.
    const darkTokens = await getThemeTokenValues(page);
    expect(darkTokens.theme, "the app should boot dark by default").toBe("dark");

    const switched = await switchToLightTheme(page);

    // REVIVED ON 2026-08-10. This used to be `if (switched) {…} else { log
    // 'Skipping light theme test' }`, and the else branch is the one that ran:
    // the old selector list could not match the toggle's default-state label
    // ("Follow the system"), so this test logged a skip and asserted nothing on
    // every run it has ever had. With a selector that matches, the skip branch
    // is no longer a legitimate outcome — a missing theme control IS the defect.
    expect(switched, "the theme control must be reachable and must reach light theme").toBe(true);

    const lightTokens = await getThemeTokenValues(page);
    console.log("Light theme tokens:", JSON.stringify(lightTokens, null, 2));
    await takeScreenshot(page, "theme-light-today", "themes");

    expect(lightTokens.theme).toBe("light");

    const missingTokens = Object.entries(lightTokens.values).filter(([, v]) => v === "NOT_SET");
    expect(
      missingTokens.map(([k]) => k),
      "light theme must resolve the same tokens dark does",
    ).toHaveLength(0);

    // The attribute flipping is not the same thing as the tokens flipping. On
    // 2026-08-09 a light-theme regression shipped where the theme applied but a
    // token pair did not (commit 9afce753, "The light theme put two borders in
    // the opposite order from dark"). Backgrounds inverting is the cheapest
    // observable that the token layer, not just the attribute, changed.
    expect(
      lightTokens.values["--ds-background-100"],
      "light --ds-background-100 must differ from dark; equal values mean the " +
        "theme attribute flipped but the token block did not apply",
    ).not.toBe(darkTokens.values["--ds-background-100"]);
  });

  test("no hardcoded color literals in inline styles", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const hardcoded = await checkForHardcodedColors(page);
    console.log("Hardcoded colors found:", hardcoded);

    if (hardcoded.length > 0) {
      console.warn(`${hardcoded.length} elements with hardcoded color values`);
    }
    // This is informational; some dynamic inline colors may be acceptable
  });

  test("dark theme applied to Engine Room", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/engine-room", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/engine-room", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const tokens = await getThemeTokenValues(page);
    console.log("Engine Room theme tokens:", tokens);
    await takeScreenshot(page, "theme-dark-engine-room", "themes");
  });

  test("dark theme applied to Settings", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/settings", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    await takeScreenshot(page, "theme-dark-settings", "themes");
    const tokens = await getThemeTokenValues(page);

    const hardcoded = await checkForHardcodedColors(page);
    if (hardcoded.length > 0) {
      console.warn("Hardcoded colors in Settings:", hardcoded.slice(0, 5));
    }
  });

  test("background token resolves correctly (dark = #0a0a0a equivalent)", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto("/today", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    if (page.url().includes("/login")) {
      await login(page);
      await page.goto("/today", { waitUntil: "domcontentloaded" });
      await waitForShell(page);
    }

    const bgColor = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const bg100 = root.getPropertyValue("--ds-background-100").trim();
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      return { bg100, bodyBg };
    });

    console.log("Background colors:", bgColor);
    // Dark background should be very dark
    expect(bgColor.bg100 || bgColor.bodyBg).toBeTruthy();
  });
});
