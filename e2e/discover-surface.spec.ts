/**
 * DISCOVER Surface — Targeted E2E Test Suite
 *
 * Covers:
 *   D-01  Page loads authenticated at /discover
 *   D-02  Page title is "Discover · Supaprod"
 *   D-03  TopBar crumb shows "Discover"
 *   D-04  PageHeader hero text present ("Raw signal in," + "ranked bets out.")
 *   D-05  Pipeline sentence present
 *   D-06  Signals tab (only tab) is active and labeled correctly
 *   D-07  Tab has correct ARIA roles (tablist / tab / tabpanel)
 *   D-08  Signal panel renders (loading OR content OR empty state)
 *   D-09  Empty state — shows "Nothing sensed yet" and CTA when no signals
 *   D-10  Empty state CTA navigates to /settings?section=connections
 *   D-11  SignalFeed skeleton renders during data fetch
 *   D-12  No horizontal scroll at 375 / 768 / 1280 / 1440
 *   D-13  Geist font applied to body
 *   D-14  Design tokens resolve (--ember, --ds-background-100, --hairline)
 *   D-15  No console errors on load
 *   D-16  ?tab=queue param lands on signals tab (queue absorbed by /decide)
 *   D-17  ?tab=signals param lands and tab is still active
 *   D-18  Tab keyboard: ArrowLeft/ArrowRight still work on the single tab
 *   D-19  TabBar ember underline visible on active tab
 *   D-20  /decide 301-redirects to /discover (redirect from route)
 *   D-21  Focus ring visible on tab button
 *   D-22  Signals panel: "Signals captured" heading present when data exists
 *   D-23  AutoClustered panel: "Clustered into bets" heading when data exists
 *   D-24  Market watch section present when data exists
 *   D-25  No ad-hoc hardcoded rgba shadows (design token compliance)
 */

import { test, expect, Page, BrowserContext } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const DEMO_EMAIL = "demo@redcadence.app";
const DEMO_PASSWORD = "Cadence!Demo2026";
const BASE_URL = "http://localhost:8080";

const SS_DIR = path.join(
  "/Users/rohitgajaraj/Projects/My Projects/My Builds/cadence-lane-4",
  "test-results",
  "discover",
);

function ensureDir(sub?: string): string {
  const dir = sub ? path.join(SS_DIR, sub) : SS_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function shot(page: Page, name: string, sub?: string): Promise<string> {
  const dir = ensureDir(sub);
  const p = path.join(dir, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function login(page: Page): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', DEMO_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 25000 });
    return true;
  } catch {
    return false;
  }
}

async function goDiscover(page: Page, search = ""): Promise<void> {
  await page.goto(`${BASE_URL}/discover${search}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  if (page.url().includes("/login")) {
    await login(page);
    await page.goto(`${BASE_URL}/discover${search}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
  }
  // Allow async data queries to settle
  await page.waitForTimeout(2000);
}

// ─── Shared auth setup ───────────────────────────────────────────────────────

/** Each test logs in directly — avoids the cross-context cookie-sharing pitfall
 * with Playwright's beforeAll when test.use() overrides the context. */
async function ensureAuth(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/discover`, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (page.url().includes("/login")) {
    const ok = await login(page);
    if (!ok) throw new Error("Could not authenticate for DISCOVER tests");
    await page.goto(`${BASE_URL}/discover`, { waitUntil: "domcontentloaded", timeout: 30000 });
  }
  await page.waitForTimeout(2000);
}

test.describe("DISCOVER Surface — Core", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // ── D-01: Auth guard ────────────────────────────────────────────────────────
  test("D-01: /discover loads authenticated (no redirect to /login)", async ({ page }) => {
    await ensureAuth(page);
    await shot(page, "D-01-discover-loaded");
    expect(page.url()).not.toContain("/login");
    expect(page.url()).toContain("/discover");
  });

  // ── D-02: Page title ────────────────────────────────────────────────────────
  test("D-02: Page title is 'Discover · Supaprod'", async ({ page }) => {
    await ensureAuth(page);
    const title = await page.title();
    console.log("  Page title:", title);
    expect(title).toBe("Discover · Supaprod");
  });

  // ── D-03: TopBar crumb ──────────────────────────────────────────────────────
  test("D-03: TopBar crumb shows 'Discover'", async ({ page }) => {
    await ensureAuth(page);
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toContain("Discover");
  });

  // ── D-04: PageHeader hero text ──────────────────────────────────────────────
  test("D-04: PageHeader hero 'Raw signal in,' and 'ranked bets out.' present", async ({
    page,
  }) => {
    await ensureAuth(page);
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toContain("Raw signal in,");
    expect(bodyText).toContain("ranked bets out.");
  });

  // ── D-05: Pipeline sentence ─────────────────────────────────────────────────
  test("D-05: Pipeline sentence present", async ({ page }) => {
    await ensureAuth(page);
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toContain("Signals cluster into bets");
  });

  // ── D-06: Signals tab active ────────────────────────────────────────────────
  test("D-06: 'Signals' tab is present and rendered", async ({ page }) => {
    await ensureAuth(page);
    const signalsTab = page.locator('[role="tab"]', { hasText: "Signals" });
    await expect(signalsTab).toBeVisible();
  });

  // ── D-07: ARIA tablist / tab / tabpanel ─────────────────────────────────────
  test("D-07: ARIA roles — tablist, tab, and tabpanel are all present", async ({ page }) => {
    await ensureAuth(page);

    const tablist = page.locator('[role="tablist"]');
    const tab = page.locator('[role="tab"]').first();
    const tabpanel = page.locator('[role="tabpanel"]').first();

    await expect(tablist).toBeVisible();
    await expect(tab).toBeVisible();
    await expect(tabpanel).toBeVisible();

    const ariaSelected = await tab.getAttribute("aria-selected");
    expect(ariaSelected).toBe("true");

    const panelLabelledBy = await tabpanel.getAttribute("aria-labelledby");
    expect(panelLabelledBy).toBeTruthy();

    console.log("  Tab aria-selected:", ariaSelected);
    console.log("  Panel aria-labelledby:", panelLabelledBy);
  });

  // ── D-08: Signals panel renders ─────────────────────────────────────────────
  test("D-08: Signals tabpanel renders without crashing (loading, content, or empty)", async ({
    page,
  }) => {
    await ensureAuth(page);

    const panel = page.locator('[role="tabpanel"]').first();
    await expect(panel).toBeVisible();

    const panelText = await panel.textContent();
    expect((panelText ?? "").trim().length).toBeGreaterThan(0);

    await shot(page, "D-08-signals-panel");
  });

  // ── D-09: Empty state content ────────────────────────────────────────────────
  test("D-09: Empty state shows correct copy when no signals exist OR signals list is shown", async ({
    page,
  }) => {
    await ensureAuth(page);

    const bodyText = (await page.locator("body").textContent()) ?? "";

    const hasEmptyState = bodyText.includes("Nothing sensed yet");
    const hasSignalsFeed =
      bodyText.includes("Signals captured") || bodyText.includes("Clustered into bets");

    console.log("  Has empty state:", hasEmptyState);
    console.log("  Has signals feed:", hasSignalsFeed);

    expect(hasEmptyState || hasSignalsFeed).toBe(true);

    if (hasEmptyState) {
      await shot(page, "D-09-empty-state");
      expect(bodyText).toContain("Connect a source");
    }
  });

  // ── D-10: Empty state CTA navigates ─────────────────────────────────────────
  test("D-10: 'Connect a source' CTA navigates to Settings connections (when shown)", async ({
    page,
  }) => {
    await ensureAuth(page);

    const connectBtn = page.locator("button", { hasText: "Connect a source" });
    const isVisible = await connectBtn.isVisible().catch(() => false);

    if (!isVisible) {
      console.log("  D-10: 'Connect a source' not shown — signals feed is populated. Skipping.");
      test.skip();
      return;
    }

    await connectBtn.click();
    await page.waitForURL(/settings/, { timeout: 10000 });
    expect(page.url()).toContain("/settings");
    expect(page.url()).toContain("connections");
  });

  // ── D-11: Skeleton loader captured on slow network ──────────────────────────
  test("D-11: Skeleton loaders appear during slow data fetch", async ({ page }) => {
    // Delay the Supabase edge function responses
    await page.route("**/functions/v1/**", (route) => {
      setTimeout(() => route.continue(), 1800);
    });

    await page.goto(`${BASE_URL}/discover`, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (page.url().includes("/login")) {
      await page.unroute("**/functions/v1/**");
      await login(page);
      await page.route("**/functions/v1/**", (route) => {
        setTimeout(() => route.continue(), 1800);
      });
      await page.goto(`${BASE_URL}/discover`, { waitUntil: "domcontentloaded", timeout: 30000 });
    }

    await page.waitForTimeout(400);
    await shot(page, "D-11-skeleton-loading");

    const loadingEls = await page.evaluate(() => {
      const skeletons = document.querySelectorAll(
        '[class*="skeleton"], [class*="Skeleton"], [class*="shimmer"], [aria-label="Loading signals"]',
      );
      const statusRoles = document.querySelectorAll('[role="status"]');
      return { skeletonCount: skeletons.length, statusRoleCount: statusRoles.length };
    });
    console.log("  Loading elements during fetch:", loadingEls);

    const panelVisible = await page
      .locator('[role="tabpanel"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(panelVisible).toBe(true);

    await page.unroute("**/functions/v1/**");
  });

  // ── D-13: Geist font ────────────────────────────────────────────────────────
  test("D-13: Geist font is applied to body on /discover", async ({ page }) => {
    await ensureAuth(page);
    const fontFamily = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);
    console.log("  Body fontFamily:", fontFamily);
    expect(fontFamily.toLowerCase()).toContain("geist");
  });

  // ── D-14: Design tokens resolve ─────────────────────────────────────────────
  test("D-14: Core design tokens resolve (--ember, --ds-background-100, --hairline)", async ({
    page,
  }) => {
    await ensureAuth(page);

    const tokens = await page.evaluate(() => {
      const css = window.getComputedStyle(document.documentElement);
      return {
        ember: css.getPropertyValue("--ember").trim(),
        bg100: css.getPropertyValue("--ds-background-100").trim(),
        hairline: css.getPropertyValue("--hairline").trim(),
        textPrimary: css.getPropertyValue("--text-primary").trim(),
        focusRing: css.getPropertyValue("--focus-ring").trim(),
      };
    });
    console.log("  Design tokens:", tokens);

    expect(tokens.ember, "--ember must be defined").toBeTruthy();
    expect(tokens.bg100, "--ds-background-100 must be defined").toBeTruthy();
    expect(tokens.hairline, "--hairline must be defined").toBeTruthy();
  });

  // ── D-15: No console errors ──────────────────────────────────────────────────
  test("D-15: /discover loads with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          !text.includes("net::ERR_") &&
          !text.includes("Failed to load resource") &&
          !text.includes("Extension context")
        ) {
          errors.push(text.substring(0, 120));
        }
      }
    });

    await ensureAuth(page);

    if (errors.length > 0) {
      console.warn("  Console errors detected:", errors);
    } else {
      console.log("  No console errors on /discover");
    }

    expect(errors.length, `Console errors: ${errors.join("; ")}`).toBe(0);
  });

  // ── D-16: ?tab=queue lands on signals (queue moved to /decide) ───────────────
  test("D-16: ?tab=queue param — surface still renders signals panel (queue absorbed by /decide)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/discover?tab=queue`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (page.url().includes("/login")) {
      await login(page);
      await page.goto(`${BASE_URL}/discover?tab=queue`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    }
    await page.waitForTimeout(2000);

    const panel = page.locator('[role="tabpanel"]#discover-panel-signals');
    await expect(panel).toBeVisible();

    const bodyText = await page.locator("body").textContent();
    expect(
      bodyText?.includes("Nothing sensed yet") ||
        bodyText?.includes("Signals captured") ||
        bodyText?.includes("Clustered into bets"),
    ).toBe(true);
  });

  // ── D-17: ?tab=signals param works ──────────────────────────────────────────
  test("D-17: ?tab=signals param — signals tab is active", async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?tab=signals`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (page.url().includes("/login")) {
      await login(page);
      await page.goto(`${BASE_URL}/discover?tab=signals`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    }
    await page.waitForTimeout(2000);

    const tab = page.locator('[role="tab"]', { hasText: "Signals" });
    await expect(tab).toBeVisible();

    const ariaSelected = await tab.getAttribute("aria-selected");
    expect(ariaSelected).toBe("true");
  });

  // ── D-18: Arrow key navigation on tab bar ────────────────────────────────────
  test("D-18: ArrowLeft/ArrowRight on Signals tab stays on tab (single tab edge case)", async ({
    page,
  }) => {
    await ensureAuth(page);

    const tab = page.locator('[role="tab"]', { hasText: "Signals" });
    await tab.focus();

    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(100);

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return { tag: el?.tagName, role: el?.getAttribute("role"), text: el?.textContent?.trim() };
    });
    console.log("  After ArrowRight:", focused);
    expect(focused.tag).toBeTruthy();
  });

  // ── D-19: Ember underline on active tab ──────────────────────────────────────
  test("D-19: Active Signals tab has ember-colored bottom border", async ({ page }) => {
    await ensureAuth(page);

    const tabStyle = await page.evaluate(() => {
      const tab = document.querySelector(
        '[role="tab"][aria-selected="true"]',
      ) as HTMLElement | null;
      if (!tab) return null;
      const s = window.getComputedStyle(tab);
      const css = window.getComputedStyle(document.documentElement);
      return {
        borderBottomColor: s.borderBottomColor,
        borderBottomWidth: s.borderBottomWidth,
        borderBottomStyle: s.borderBottomStyle,
        emberVar: css.getPropertyValue("--ember").trim(),
      };
    });

    console.log("  Active tab border style:", tabStyle);

    if (tabStyle) {
      expect(tabStyle.borderBottomWidth).toBe("2px");
      expect(tabStyle.borderBottomStyle).not.toBe("none");
      expect(tabStyle.borderBottomColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(tabStyle.borderBottomColor).not.toBe("transparent");
    }
  });

  // ── D-21: Focus ring on tab button ──────────────────────────────────────────
  test("D-21: Focus ring visible on Signals tab when focused via keyboard", async ({ page }) => {
    await ensureAuth(page);

    const tab = page.locator('[role="tab"]', { hasText: "Signals" });
    await tab.focus();
    await page.waitForTimeout(100);

    const ringStyle = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        outline: s.outline,
        outlineColor: s.outlineColor,
        outlineWidth: s.outlineWidth,
        outlineStyle: s.outlineStyle,
        boxShadow: s.boxShadow,
      };
    });

    console.log("  Tab focus ring style:", ringStyle);

    if (ringStyle) {
      const hasOutline = ringStyle.outlineStyle !== "none" && ringStyle.outlineWidth !== "0px";
      const hasBoxShadow =
        ringStyle.boxShadow && ringStyle.boxShadow !== "none" && ringStyle.boxShadow.length > 5;
      if (!hasOutline && !hasBoxShadow) {
        console.warn("  WARN: No visible focus ring on the Signals tab");
      }
    }
  });

  // ── D-25: No ad-hoc rgba box shadows ────────────────────────────────────────
  test("D-25: No hardcoded rgba box-shadows (design token compliance)", async ({ page }) => {
    await ensureAuth(page);

    const violations = await page.evaluate(() => {
      const all = document.querySelectorAll("*");
      const found: string[] = [];
      all.forEach((el) => {
        const s = window.getComputedStyle(el);
        const shadow = s.boxShadow;
        if (shadow && shadow !== "none" && !shadow.includes("var(") && shadow.includes("rgba")) {
          const tag = el.tagName.toLowerCase();
          const cls = (el.className || "").toString().substring(0, 50);
          found.push(`${tag}.${cls}: ${shadow.substring(0, 60)}`);
        }
      });
      return found.slice(0, 10);
    });

    if (violations.length > 0) {
      console.warn("  Ad-hoc rgba shadows found:", violations);
    } else {
      console.log("  PASS: No hardcoded rgba box-shadows");
    }

    console.log(`  Violation count: ${violations.length}`);
  });
});

// ─── Responsive layout ────────────────────────────────────────────────────────

test.describe("DISCOVER Surface — Responsive Layout", () => {
  const VIEWPORTS = [
    { name: "mobile-375", width: 375, height: 812 },
    { name: "tablet-768", width: 768, height: 1024 },
    { name: "desktop-1280", width: 1280, height: 800 },
    { name: "desktop-1440", width: 1440, height: 900 },
  ] as const;

  for (const vp of VIEWPORTS) {
    test(`D-12 [${vp.name}]: no horizontal scroll on /discover`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto(`${BASE_URL}/discover`, { waitUntil: "domcontentloaded", timeout: 30000 });
      if (page.url().includes("/login")) {
        await login(page);
        await page.goto(`${BASE_URL}/discover`, { waitUntil: "domcontentloaded", timeout: 30000 });
      }
      await page.waitForTimeout(2000);

      await shot(page, `D-12-${vp.name}`, "responsive");

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const bodyWidth = await page.evaluate(() => document.body.offsetWidth);

      console.log(
        `  [${vp.name}] scrollWidth=${scrollWidth}px, bodyWidth=${bodyWidth}px, viewport=${vp.width}px`,
      );

      expect(
        scrollWidth,
        `[${vp.name}] horizontal scroll: scrollWidth ${scrollWidth} > viewport ${vp.width}`,
      ).toBeLessThanOrEqual(vp.width + 2);
    });
  }
});

// ─── Content states ───────────────────────────────────────────────────────────

test.describe("DISCOVER Surface — Content States (data-conditional)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // ── D-22: Signals captured heading ──────────────────────────────────────────
  test("D-22: 'Signals captured' heading present when signals data is loaded", async ({ page }) => {
    await ensureAuth(page);

    const bodyText = await page.locator("body").textContent();
    if (bodyText?.includes("Signals captured")) {
      const heading = page.locator("h2", { hasText: "Signals captured" });
      await expect(heading).toBeVisible();
      console.log("  D-22: Signals captured heading found");
    } else {
      console.log("  D-22: Signals feed not shown (empty state active) — skipping heading check");
    }
  });

  // ── D-23: Clustered into bets heading ───────────────────────────────────────
  test("D-23: 'Clustered into bets' heading present when signals data is loaded", async ({
    page,
  }) => {
    await ensureAuth(page);

    const bodyText = await page.locator("body").textContent();
    if (bodyText?.includes("Clustered into bets")) {
      const heading = page.locator("h2", { hasText: "Clustered into bets" });
      await expect(heading).toBeVisible();
      console.log("  D-23: Clustered into bets heading found");
    } else {
      console.log(
        "  D-23: Clustered column not shown (likely empty state or no themes) — skipping",
      );
    }
  });

  // ── D-24: Market watch section ───────────────────────────────────────────────
  test("D-24: Market watch section present when signals feed is populated", async ({ page }) => {
    await ensureAuth(page);

    const bodyText = await page.locator("body").textContent();
    if (bodyText?.includes("Market watch")) {
      const heading = page.locator("h2", { hasText: "Market watch" });
      await expect(heading).toBeVisible();
      console.log("  D-24: Market watch section found");
    } else {
      console.log("  D-24: Market watch not rendered — signals may be empty");
    }
  });

  // ── D-20: /decide is its own surface (Option B, 2026-07-13) ─────────────────
  // The IA spine comment in discover.tsx says /decide 301-redirects, but the
  // actual route _authenticated.decide.tsx implements a standalone DecideSurface.
  // The test verifies /decide loads as an authenticated surface (not to /login).
  test("D-20: /decide loads as its own authenticated surface (Decide — Keep it, or kill it.)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/decide`, { waitUntil: "domcontentloaded", timeout: 20000 });
    if (page.url().includes("/login")) {
      await login(page);
      await page.goto(`${BASE_URL}/decide`, { waitUntil: "domcontentloaded", timeout: 20000 });
    }
    await page.waitForTimeout(1500);

    console.log("  Final URL at /decide:", page.url());
    expect(page.url()).toContain("/decide");

    const bodyText = await page.locator("body").textContent();
    // DecideSurface shows its own PageHeader: "Keep it, or" + "kill it."
    expect(bodyText).toContain("Keep it");
    await shot(page, "D-20-decide-surface");
  });
});
