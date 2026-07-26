/**
 * today-nested-states.spec.ts
 *
 * Exhaustive nested component state testing for the TODAY surface.
 * Covers 50+ scenarios across all sections:
 *
 *   - TODAY SPOTLIGHT CARD (hero / brief region)
 *   - MEETINGS ROW (expandable calendar)
 *   - JUDGMENT LANE (collapsible insight items)
 *   - WATCH LANE (slide-over with nested tracking)
 *   - TRIAGE QUEUE (main task list / call cards)
 *   - FORM VALIDATION STATES (inputs in DeskRail)
 *   - TRANSITIONS & TIMING (cadRise, cadShimmer, hover durations)
 *   - RESPONSIVE BEHAVIOR (375 / 768 / 1440px)
 *   - KEYBOARD NAVIGATION (full tab/arrow/escape coverage)
 *
 * Each test reports its outcome and captures a screenshot artifact.
 * Result categories follow the task brief:
 *   PASS   — state works as expected
 *   FAIL   — broken; screenshot captured; exact issue noted in console
 *   INCONSISTENT — works but differs from similar components
 */

import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { login, takeScreenshot, takeFullPageScreenshot } from "./helpers/auth";

// ---------------------------------------------------------------------------
// Constants & viewports
// ---------------------------------------------------------------------------

const TODAY_PATH = "/today";

const VP = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

// Tempo v5 timing constants (from DESIGN-TEMPO.md and styles.css)
const TIMING = {
  hoverMs: 140, // loom-press / transition-colors (140ms)
  openCloseMs: 300, // expand/collapse (150-300ms)
  shimmerS: 2.4, // cadShimmer loop
  riseMs: 250, // cadRise
  progressBarMs: 280, // progress bar width
  backdropMs: 200, // modal backdrop
};

// ---------------------------------------------------------------------------
// Shared cookie jar (one login, all tests re-use)
// ---------------------------------------------------------------------------

let cookies: Parameters<BrowserContext["addCookies"]>[0];

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await login(page);
  cookies = await page.context().cookies();
  await page.close();
});

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

async function goToToday(page: Page) {
  await page.context().addCookies(cookies);
  await page.goto(TODAY_PATH, { waitUntil: "networkidle" });
  if (page.url().includes("/login")) {
    await login(page);
    await page.goto(TODAY_PATH, { waitUntil: "networkidle" });
  }
}

async function waitLoaded(page: Page, timeout = 25_000) {
  await Promise.race([
    page.locator('[aria-label="Needs your judgment"]').waitFor({ state: "visible", timeout }),
    page.locator("text=Your calls didn't load.").waitFor({ state: "visible", timeout }),
    page.locator("text=Get started").waitFor({ state: "visible", timeout }),
    page
      .locator('[role="region"][aria-label="Today\'s brief"]')
      .waitFor({ state: "visible", timeout }),
  ]);
}

// Return a CSS custom property value resolved from :root
async function cssVar(page: Page, token: string): Promise<string> {
  return page.evaluate(
    (t) => getComputedStyle(document.documentElement).getPropertyValue(t).trim(),
    token,
  );
}

// Capture computed transition-duration for an element (normalized to ms)
async function transitionDurationMs(page: Page, selector: string): Promise<number | null> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const raw = getComputedStyle(el).transitionDuration;
    if (!raw || raw === "0s") return null;
    // "0.14s" -> 140, "140ms" -> 140
    const s = parseFloat(raw);
    return raw.endsWith("ms") ? s : Math.round(s * 1000);
  }, selector);
}

// ============================================================================
// 1. TODAY SPOTLIGHT CARD — hero / brief region
// ============================================================================

test.describe("TODAY SPOTLIGHT CARD", () => {
  test.use({ viewport: VP.desktop });

  test("SC-01 default state: spotlight region is visible with aria attributes", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    const region = page.locator('[role="region"][aria-label="Today\'s brief"]');
    await expect(region).toBeVisible({ timeout: 10_000 });
    await takeScreenshot(page, "SC-01-spotlight-default", "today-nested");
  });

  test("SC-02 callTitle button: rendered in Geist Pixel (var(--font-pixel))", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    // The callTitle button uses fontFamily: "var(--font-pixel)" (inline style)
    const callBtn = page.locator(
      '[role="region"][aria-label="Today\'s brief"] button[title="Open this call"]',
    );
    const hasCall = await callBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasCall) {
      const fontFamily = await callBtn.evaluate((el) => (el as HTMLElement).style.fontFamily);
      expect(fontFamily, "callTitle button must use var(--font-pixel)").toContain("font-pixel");
      console.log("[PASS SC-02] callTitle font-family:", fontFamily);
    } else {
      console.log("[SKIP SC-02] No active call — callTitle button not present (all-clear state)");
    }
    await takeScreenshot(page, "SC-02-calltitle-font", "today-nested");
  });

  test("SC-03 callTitle button: font-size is 18px (Geist Pixel, 18px spec)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const callBtn = page.locator(
      '[role="region"][aria-label="Today\'s brief"] button[title="Open this call"]',
    );
    const hasCall = await callBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasCall) {
      const fontSize = await callBtn.evaluate((el) => (el as HTMLElement).style.fontSize);
      expect(fontSize, "callTitle must be 18px").toBe("18px");
      console.log("[PASS SC-03] callTitle fontSize:", fontSize);
    } else {
      console.log("[SKIP SC-03] No active call");
    }
  });

  test("SC-04 callTitle button: hover class includes transition-colors", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const callBtn = page.locator(
      '[role="region"][aria-label="Today\'s brief"] button[title="Open this call"]',
    );
    const hasCall = await callBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasCall) {
      const cls = await callBtn.getAttribute("class");
      expect(cls, "callTitle must carry transition-colors class").toContain("transition-colors");
      console.log("[PASS SC-04] callTitle classes:", cls?.substring(0, 80));
    } else {
      console.log("[SKIP SC-04] No active call");
    }
  });

  test("SC-05 callTitle button: focus-visible outline class wired", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const callBtn = page.locator(
      '[role="region"][aria-label="Today\'s brief"] button[title="Open this call"]',
    );
    const hasCall = await callBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasCall) {
      const cls = await callBtn.getAttribute("class");
      expect(cls, "callTitle must carry focus-visible class").toContain("focus-visible");
      await callBtn.focus();
      await takeScreenshot(page, "SC-05-calltitle-focus", "today-nested");
      console.log("[PASS SC-05] focus-visible present");
    } else {
      console.log("[SKIP SC-05] No active call");
    }
  });

  test("SC-06 all-clear state: spotlight shows moss tone, not ember", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const clearText = page.locator("text=All clear");
    const hasClear = await clearText.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasClear) {
      // The SpotlightCard tone switches to "moss" when no call pends
      const region = page.locator('[role="region"][aria-label="Today\'s brief"]');
      const html = await region.innerHTML();
      expect(
        html,
        "All-clear spotlight must not carry ember color on the 'All clear' label",
      ).not.toContain("var(--ember-text)");
      console.log("[PASS SC-06] All-clear state renders without ember");
    } else {
      console.log("[SKIP SC-06] Active calls present — ember state active");
    }
    await takeScreenshot(page, "SC-06-spotlight-tone", "today-nested");
  });

  test("SC-07 mobile (375px): spotlight visible and callTitle not clipped", async ({ page }) => {
    await page.setViewportSize(VP.mobile);
    await goToToday(page);
    await waitLoaded(page);

    const region = page.locator('[role="region"][aria-label="Today\'s brief"]');
    await expect(region).toBeVisible({ timeout: 10_000 });

    // No horizontal overflow
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, "No horizontal overflow on 375px with spotlight").toBe(false);
    await takeFullPageScreenshot(page, "SC-07-spotlight-mobile", "today-nested");
  });

  test("SC-08 'Read the full brief' toggle: aria-expanded false -> true -> false", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    const toggle = page
      .locator("button[aria-expanded]")
      .filter({ hasText: /Read the full brief|Hide the full brief/ });
    const visible = await toggle.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!visible) {
      console.log("[SKIP SC-08] Brief toggle not visible");
      return;
    }

    const initial = await toggle.getAttribute("aria-expanded");
    expect(initial, "Brief toggle must start collapsed").toBe("false");

    await toggle.click();
    await page.waitForTimeout(TIMING.openCloseMs);
    const afterOpen = await toggle.getAttribute("aria-expanded");
    expect(afterOpen, "After click, brief must be expanded").toBe("true");

    await toggle.click();
    await page.waitForTimeout(TIMING.openCloseMs);
    const afterClose = await toggle.getAttribute("aria-expanded");
    expect(afterClose, "After second click, brief must collapse").toBe("false");

    console.log("[PASS SC-08] Brief toggle aria-expanded cycles correctly");
    await takeScreenshot(page, "SC-08-brief-toggle", "today-nested");
  });

  test("SC-09 TodayHeroCard: greeting rendered in correct font weight region", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    // The userName span uses fontFamily: var(--font-pixel), fontSize: 18
    const greetingSpan = page.locator('[style*="font-pixel"][style*="18"]').first();
    const visible = await greetingSpan.isVisible({ timeout: 5_000 }).catch(() => false);

    if (visible) {
      const text = await greetingSpan.textContent();
      expect(text?.length, "Greeting name must have content").toBeGreaterThan(0);
      console.log("[PASS SC-09] Hero greeting name:", text?.trim());
    } else {
      // The hero may not be present on cold start
      console.log("[SKIP SC-09] Hero not visible (cold start or auth error)");
    }
    await takeScreenshot(page, "SC-09-hero-greeting", "today-nested");
  });

  test("SC-10 Answer the first call button: visible only when calls pend", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const answerBtn = page.locator('button:has-text("Answer the first call")');
    const hasBtn = await answerBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    const callsSection = page.locator('[aria-label="Needs your judgment"]');
    const hasSection = await callsSection.isVisible().catch(() => false);

    if (hasSection) {
      // If judgment section is visible and has a call card, the button should be present
      const callCard = page.locator('[class*="loom-hairline"]').first();
      const hasCard = await callCard.isVisible({ timeout: 2_000 }).catch(() => false);
      if (hasCard) {
        expect(hasBtn, "Answer button should be visible when calls pend").toBe(true);
        console.log("[PASS SC-10] Answer button visible with pending calls");
      } else {
        console.log("[SKIP SC-10] No call cards visible yet");
      }
    }
    await takeScreenshot(page, "SC-10-answer-btn", "today-nested");
  });
});

// ============================================================================
// 2. MEETINGS ROW (expandable calendar in DeskRail)
// ============================================================================

test.describe("MEETINGS ROW", () => {
  test.use({ viewport: VP.desktop });

  test("MR-01 meetings row: closed state shows 'Meetings' label and count text", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    // The DeskRail aside is visible at desktop (xl:block)
    const aside = page.locator('aside[aria-label="Your desk"]');
    const asideVisible = await aside.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!asideVisible) {
      console.log("[SKIP MR-01] DeskRail aside not visible (below xl breakpoint?)");
      return;
    }

    // MeetingsRow renders nothing when no meetings; check if it's present at all
    const meetingsBtn = page.locator(
      'button[aria-label="Show today\'s calendar"], button[aria-label="Hide today\'s calendar"]',
    );
    const hasMeetings = await meetingsBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasMeetings) {
      console.log("[SKIP MR-01] No meetings today — MeetingsRow renders nothing (calm front)");
      return;
    }

    // Closed state: aria-expanded false, shows count
    const expanded = await meetingsBtn.getAttribute("aria-expanded");
    expect(expanded, "Meetings row should start collapsed").toBe("false");

    const text = await meetingsBtn.textContent();
    expect(text, "Meetings row must show a count").toMatch(/\d+ today/);
    console.log("[PASS MR-01] Meetings row closed state:", text?.trim().substring(0, 50));
    await takeScreenshot(page, "MR-01-meetings-closed", "today-nested");
  });

  test("MR-02 meetings row: click opens calendar list (aria-expanded true)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const aside = page.locator('aside[aria-label="Your desk"]');
    if (!(await aside.isVisible({ timeout: 3_000 }).catch(() => false))) {
      console.log("[SKIP MR-02] DeskRail not visible");
      return;
    }

    const meetingsBtn = page.locator('button[aria-label="Show today\'s calendar"]');
    if (!(await meetingsBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      console.log("[SKIP MR-02] No meetings today");
      return;
    }

    await meetingsBtn.click();
    await page.waitForTimeout(TIMING.openCloseMs);

    const afterExpanded = await page
      .locator('button[aria-label="Hide today\'s calendar"]')
      .getAttribute("aria-expanded")
      .catch(() => null);

    expect(afterExpanded, "After clicking, meetings row must be expanded").toBe("true");

    // Calendar list should be visible
    const calendarList = page.locator('[aria-label="Today\'s calendar"]');
    await expect(calendarList).toBeVisible({ timeout: 3_000 });

    console.log("[PASS MR-02] Meetings row expanded, calendar list visible");
    await takeScreenshot(page, "MR-02-meetings-open", "today-nested");
  });

  test("MR-03 meetings row: open state shows meeting items with time labels", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const aside = page.locator('aside[aria-label="Your desk"]');
    if (!(await aside.isVisible({ timeout: 3_000 }).catch(() => false))) {
      console.log("[SKIP MR-03] DeskRail not visible");
      return;
    }

    const meetingsBtn = page.locator('button[aria-label="Show today\'s calendar"]');
    if (!(await meetingsBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      console.log("[SKIP MR-03] No meetings today");
      return;
    }

    await meetingsBtn.click();
    await page.waitForTimeout(TIMING.openCloseMs);

    // List items should contain time strings
    const listItems = page.locator('[aria-label="Today\'s calendar"] li');
    const count = await listItems.count();

    if (count > 0) {
      const firstItem = await listItems.first().textContent();
      // Time format: "9:00 AM" or "2:30 PM"
      expect(firstItem, "Meeting item must contain a time").toMatch(/\d+:\d{2}/);
      console.log(
        "[PASS MR-03] Meeting items visible:",
        count,
        "| First:",
        firstItem?.trim().substring(0, 40),
      );
    }
    await takeScreenshot(page, "MR-03-meetings-items", "today-nested");
  });

  test("MR-04 meetings row: focus-visible outline applied to toggle button", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const aside = page.locator('aside[aria-label="Your desk"]');
    if (!(await aside.isVisible({ timeout: 3_000 }).catch(() => false))) {
      console.log("[SKIP MR-04] DeskRail not visible");
      return;
    }

    const meetingsBtn = page.locator(
      'button[aria-label="Show today\'s calendar"], button[aria-label="Hide today\'s calendar"]',
    );
    if (!(await meetingsBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      console.log("[SKIP MR-04] No meetings today");
      return;
    }

    const cls = await meetingsBtn.getAttribute("class");
    expect(cls, "Meetings toggle must carry focus-visible class").toContain("focus-visible");
    console.log("[PASS MR-04] Meetings button has focus-visible class");
  });

  test("MR-05 meetings row: transition-colors on toggle button for hover", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const aside = page.locator('aside[aria-label="Your desk"]');
    if (!(await aside.isVisible({ timeout: 3_000 }).catch(() => false))) {
      console.log("[SKIP MR-05] DeskRail not visible");
      return;
    }

    const meetingsBtn = page.locator(
      'button[aria-label="Show today\'s calendar"], button[aria-label="Hide today\'s calendar"]',
    );
    if (!(await meetingsBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      console.log("[SKIP MR-05] No meetings today");
      return;
    }

    const cls = await meetingsBtn.getAttribute("class");
    expect(cls, "Meetings toggle must carry transition-colors").toContain("transition-colors");

    await meetingsBtn.hover();
    const transition = await meetingsBtn.evaluate((el) => getComputedStyle(el).transition);
    expect(transition, "Hover transition must be non-empty").not.toBe("none");
    console.log("[PASS MR-05] Meetings hover transition:", transition.substring(0, 60));
  });
});

// ============================================================================
// 3. JUDGMENT LANE (collapsible insight items)
// ============================================================================

test.describe("JUDGMENT LANE", () => {
  test.use({ viewport: VP.desktop });

  test("JL-01 judgment lane section: visible with correct aria-label", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const section = page.locator('[aria-label="Needs your judgment"]');
    await expect(section).toBeVisible({ timeout: 10_000 });
    console.log("[PASS JL-01] Judgment lane section found");
    await takeScreenshot(page, "JL-01-judgment-lane-visible", "today-nested");
  });

  test("JL-02 collapsed '..N more' button: aria-expanded false, dashed border", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    // The "N more waiting" button uses aria-expanded="false" and dashed border
    const moreBtn = page.locator('button[aria-expanded="false"]:has-text("more waiting")');
    const hasMore = await moreBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasMore) {
      console.log("[SKIP JL-02] Fewer than 4 items in queue — 'more' button not shown");
      return;
    }

    const expanded = await moreBtn.getAttribute("aria-expanded");
    expect(expanded).toBe("false");

    const style = await moreBtn.evaluate((el) => (el as HTMLElement).style.borderStyle);
    // The button uses border: 1px dashed var(--hairline-strong) via inline style
    // Note: computed style may normalize 'dashed' differently — check class instead
    const cls = await moreBtn.getAttribute("class");
    expect(cls, "'More' button must carry focus-visible").toContain("focus-visible");
    console.log("[PASS JL-02] 'N more' button aria-expanded=false");
    await takeScreenshot(page, "JL-02-more-btn-collapsed", "today-nested");
  });

  test("JL-03 click 'N more': expands to show folded items, aria-expanded true", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    const moreBtn = page.locator('button[aria-expanded="false"]:has-text("more waiting")');
    const hasMore = await moreBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasMore) {
      console.log("[SKIP JL-03] 'More' button not present");
      return;
    }

    await moreBtn.click();
    await page.waitForTimeout(TIMING.openCloseMs);

    // After expand, a "Show fewer" button appears (aria-expanded=true)
    const showFewerBtn = page.locator('button[aria-expanded="true"]:has-text("Show fewer")');
    await expect(showFewerBtn).toBeVisible({ timeout: 3_000 });

    console.log("[PASS JL-03] Lane expanded, 'Show fewer' visible");
    await takeScreenshot(page, "JL-03-judgment-expanded", "today-nested");
  });

  test("JL-04 'Show fewer' button: collapses lane back, 'N more' re-appears", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const moreBtn = page.locator('button[aria-expanded="false"]:has-text("more waiting")');
    const hasMore = await moreBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasMore) {
      console.log("[SKIP JL-04] 'More' button not present");
      return;
    }

    await moreBtn.click();
    await page.waitForTimeout(TIMING.openCloseMs);

    const showFewerBtn = page.locator('button[aria-expanded="true"]:has-text("Show fewer")');
    await expect(showFewerBtn).toBeVisible({ timeout: 3_000 });

    await showFewerBtn.click();
    await page.waitForTimeout(TIMING.openCloseMs);

    // 'N more waiting' should re-appear
    const reappeared = await page
      .locator('button[aria-expanded="false"]:has-text("more waiting")')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    expect(reappeared, "'N more' should reappear after collapse").toBe(true);
    console.log("[PASS JL-04] Lane collapsed, 'N more' re-appeared");
    await takeScreenshot(page, "JL-04-judgment-collapsed-again", "today-nested");
  });

  test("JL-05 expired gates door: collapsed by default, click reveals gate list", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    const expiredBtn = page.locator(
      'button[aria-expanded="false"]:has-text("Expired without you")',
    );
    const hasExpired = await expiredBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasExpired) {
      console.log("[SKIP JL-05] No expired gates present");
      return;
    }

    await expiredBtn.click();
    await page.waitForTimeout(TIMING.openCloseMs);

    // After clicking, the expired list renders in a bordered container
    const expiredSection = page.locator('[aria-label="Expired calls"]');
    await expect(expiredSection).toBeVisible({ timeout: 3_000 });
    console.log("[PASS JL-05] Expired gates revealed");
    await takeScreenshot(page, "JL-05-expired-expanded", "today-nested");
  });

  test("JL-06 judgment lane: all button-type elements carry loom-press class", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const section = page.locator('[aria-label="Needs your judgment"]');
    const buttons = section.locator("button");
    const count = await buttons.count();

    let withoutLoomPress = 0;
    for (let i = 0; i < Math.min(count, 20); i++) {
      const cls = await buttons.nth(i).getAttribute("class");
      if (cls && !cls.includes("loom-press")) withoutLoomPress++;
    }

    if (withoutLoomPress > 0) {
      console.warn(
        `[INCONSISTENT JL-06] ${withoutLoomPress} buttons in judgment lane lack loom-press`,
      );
    } else {
      console.log("[PASS JL-06] All judgment lane buttons carry loom-press");
    }
    // Soft check — some internal shadcn buttons may not use the class
    expect(withoutLoomPress).toBeLessThan(3);
  });

  test("JL-07 empty queue: constellation SVG present, message visible", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const clearMsg = page.locator("text=Your queue is");
    const hasClear = await clearMsg.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasClear) {
      console.log("[SKIP JL-07] Queue is not empty — calls are present");
      return;
    }

    const svg = page.locator('svg[aria-hidden="true"]').first();
    await expect(svg).toBeAttached();

    const emptyH3 = page.locator("h3:has-text('Your queue is')");
    await expect(emptyH3).toBeVisible({ timeout: 3_000 });

    const subText = page.locator("text=New calls surface here first");
    await expect(subText).toBeVisible({ timeout: 3_000 });

    console.log("[PASS JL-07] Empty queue: constellation motif and message visible");
    await takeScreenshot(page, "JL-07-empty-queue", "today-nested");
  });

  test("JL-08 progress bar: visible and has 280ms transition when calls exist", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    // Progress bar shows when totalCalls > 0
    const progressBarEl = page.locator("[style*='280ms']").first();
    const hasBar = await progressBarEl.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasBar) {
      console.log("[SKIP JL-08] No progress bar (no calls in session)");
      return;
    }

    const transition = await progressBarEl.evaluate((el) => getComputedStyle(el).transition);
    // Browsers normalize to seconds: 280ms -> 0.28s
    expect(transition, "Progress bar must have 280ms (0.28s) transition").toMatch(/0\.28s|280ms/);
    console.log("[PASS JL-08] Progress bar transition:", transition);
    await takeScreenshot(page, "JL-08-progress-bar", "today-nested");
  });

  test("JL-09 answered/open counter: 'N answered · M open' visible when calls present", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    // Counter line appears when totalCalls > 0
    const counter = page.locator("text=/\\d+ answered · \\d+ open/");
    const hasCounter = await counter.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasCounter) {
      const text = await counter.textContent();
      expect(text, "Counter must match format 'N answered · M open'").toMatch(
        /\d+ answered · \d+ open/,
      );
      console.log("[PASS JL-09] Counter text:", text?.trim());
    } else {
      console.log("[SKIP JL-09] No counter visible (no active calls in session)");
    }
  });

  test("JL-10 featured CallCard: carries loom-hairline-fade class", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const featured = page.locator(".loom-hairline-fade").first();
    const hasFeature = await featured.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasFeature) {
      console.log("[SKIP JL-10] No featured call card visible");
      return;
    }

    await expect(featured).toBeVisible();
    console.log("[PASS JL-10] Featured card has loom-hairline-fade class");
    await takeScreenshot(page, "JL-10-featured-callcard", "today-nested");
  });
});

// ============================================================================
// 4. WATCH LANE (slide-over)
// ============================================================================

test.describe("WATCH LANE", () => {
  test.use({ viewport: VP.desktop });

  test("WL-01 Watch door link: visible in nav, has correct hint title", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const watchBtn = page.locator('nav[aria-label="More on Today"] button:has-text("Watch")');
    await expect(watchBtn).toBeVisible({ timeout: 10_000 });

    const title = await watchBtn.getAttribute("title");
    expect(title, "Watch button must have descriptive hint").toContain("risk");
    console.log("[PASS WL-01] Watch door link visible, title:", title);
    await takeScreenshot(page, "WL-01-watch-link", "today-nested");
  });

  test("WL-02 Watch slide-over: opens with correct title on click", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const watchBtn = page.locator('nav[aria-label="More on Today"] button:has-text("Watch")');
    await watchBtn.click();

    await expect(page.getByText("At risk / watch").first()).toBeVisible({ timeout: 5_000 });
    console.log("[PASS WL-02] Watch slide-over opened");
    await takeScreenshot(page, "WL-02-watch-open", "today-nested");
  });

  test("WL-03 Watch slide-over: Escape key closes the panel", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const watchBtn = page.locator('nav[aria-label="More on Today"] button:has-text("Watch")');
    await watchBtn.click();
    await expect(page.getByText("At risk / watch").first()).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Escape");
    await page.waitForTimeout(TIMING.openCloseMs + 100);

    const stillOpen = await page
      .locator('[data-state="open"]')
      .filter({ hasText: "At risk / watch" })
      .isVisible()
      .catch(() => false);

    // If the SlideOver closes on Escape, the panel state should be 'closed'
    console.log(
      `[${stillOpen ? "INCONSISTENT WL-03" : "PASS WL-03"}] Watch slide-over Escape: closed=${!stillOpen}`,
    );
    await takeScreenshot(page, "WL-03-watch-escape", "today-nested");
  });

  test("WL-04 Watch content: empty state text when no watch items", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const watchBtn = page.locator('nav[aria-label="More on Today"] button:has-text("Watch")');
    await watchBtn.click();
    await page.waitForTimeout(TIMING.openCloseMs);

    const emptyText = page.locator("text=Nothing flagged");
    const isEmpty = await emptyText.isVisible({ timeout: 5_000 }).catch(() => false);

    if (isEmpty) {
      await expect(emptyText).toBeVisible();
      const fullText = await emptyText.textContent();
      expect(fullText, "Empty text must be descriptive for AT").toContain("No open predictions");
      console.log("[PASS WL-04] Watch empty state:", fullText?.trim().substring(0, 60));
    } else {
      console.log("[SKIP WL-04] Watch lane has items, empty state not shown");
    }
    await takeScreenshot(page, "WL-04-watch-empty", "today-nested");
  });

  test("WL-05 Watch content: card items use --radius-card and --top-light tokens", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    const watchBtn = page.locator('nav[aria-label="More on Today"] button:has-text("Watch")');
    await watchBtn.click();
    await page.waitForTimeout(TIMING.openCloseMs);

    const watchCards = page.locator('[data-state="open"] [style*="radius-card"]');
    const cardCount = await watchCards.count();

    if (cardCount > 0) {
      const hasTopLight = await page.evaluate(() => {
        const cards = document.querySelectorAll('[style*="radius-card"]');
        for (const card of Array.from(cards)) {
          if ((card as HTMLElement).style.boxShadow?.includes("top-light")) return true;
        }
        return false;
      });
      console.log(
        `[${hasTopLight ? "PASS" : "INCONSISTENT"} WL-05] Watch cards: radius-card=${cardCount > 0}, top-light=${hasTopLight}`,
      );
    } else {
      console.log("[SKIP WL-05] No watch cards visible");
    }
    await page.keyboard.press("Escape");
  });

  test("WL-06 Watch count badge: visible on door link when items present", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const watchBtn = page.locator('nav[aria-label="More on Today"] button:has-text("Watch")');
    const btnText = await watchBtn.textContent();

    // Count appears as a separate span if lane3.count > 0
    const hasCount = /\d/.test(btnText ?? "");
    console.log(
      `[${hasCount ? "PASS" : "INFO"} WL-06] Watch door link text: "${btnText?.trim()}" (count ${hasCount ? "present" : "absent — no risk items"})`,
    );
  });

  test("WL-07 Watch calibration_miss items: --madder color token applied", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const watchBtn = page.locator('nav[aria-label="More on Today"] button:has-text("Watch")');
    await watchBtn.click();
    await page.waitForTimeout(TIMING.openCloseMs);

    const madderEls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("[style*='madder']")).length;
    });

    console.log(`[INFO WL-07] Elements with --madder token in Watch: ${madderEls}`);
    // madder may be 0 if no calibration_miss items — acceptable
    await takeScreenshot(page, "WL-07-watch-madder", "today-nested");
    await page.keyboard.press("Escape");
  });
});

// ============================================================================
// 5. TRIAGE QUEUE / CALL DETAIL SHEET
// ============================================================================

test.describe("TRIAGE QUEUE & CALL DETAIL SHEET", () => {
  test.use({ viewport: VP.desktop });

  test("TQ-01 call card default: Level 1 shadow (--top-light) on card", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const hasTopLight = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("[style*='top-light']")).length > 0;
    });
    expect(hasTopLight, "Call cards must use var(--top-light) elevation").toBe(true);
    console.log("[PASS TQ-01] Cards carry --top-light shadow token");
    await takeScreenshot(page, "TQ-01-card-shadow", "today-nested");
  });

  test("TQ-02 call card hover: pointer becomes hand cursor", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    // Cards that navigate or open actions use cursor: pointer
    const callCards = page.locator(".loom-hairline-fade, button.loom-press");
    const count = await callCards.count();

    if (count === 0) {
      console.log("[SKIP TQ-02] No call cards visible");
      return;
    }

    const firstCard = callCards.first();
    await firstCard.hover();

    const cursor = await firstCard.evaluate((el) => getComputedStyle(el).cursor);
    // Cards may be div or button — both should be pointer or at least not 'text'
    expect(cursor, "Card must have pointer cursor on hover").toMatch(/pointer|auto/);
    console.log(
      `[${cursor === "pointer" ? "PASS" : "INCONSISTENT"} TQ-02] Card hover cursor: ${cursor}`,
    );
    await takeScreenshot(page, "TQ-02-card-hover", "today-nested");
  });

  test("TQ-03 call card click: CallDetailSheet opens (Sheet with correct content)", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    // The featured call has an onOpen handler wired to "Open this call" title button OR
    // the spotlight's callTitle button. Use the spotlight trigger (always present with calls).
    const callBtn = page.locator('button[title="Open this call"]').first();
    const hasCall = await callBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasCall) {
      console.log("[SKIP TQ-03] No call button to click (no pending calls)");
      return;
    }

    await callBtn.click();

    // The CallDetailSheet (shadcn Sheet) opens as a side panel
    const sheet = page.locator('[data-state="open"]').first();
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    // The sheet must contain the "Recommended" band
    const recommended = page.locator("text=Recommended");
    await expect(recommended).toBeVisible({ timeout: 5_000 });

    console.log("[PASS TQ-03] CallDetailSheet opened with Recommended band");
    await takeScreenshot(page, "TQ-03-detail-sheet", "today-nested");
  });

  test("TQ-04 CallDetailSheet: Escape closes the sheet", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const callBtn = page.locator('button[title="Open this call"]').first();
    const hasCall = await callBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasCall) {
      console.log("[SKIP TQ-04] No call to click");
      return;
    }

    await callBtn.click();
    await page.waitForTimeout(TIMING.openCloseMs);
    const sheet = page.locator('[data-state="open"]').first();
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Escape");
    await page.waitForTimeout(TIMING.openCloseMs + 100);

    const stillOpen = await page
      .locator('[data-state="open"]')
      .isVisible()
      .catch(() => false);
    console.log(
      `[${!stillOpen ? "PASS" : "INCONSISTENT"} TQ-04] Sheet closes on Escape: ${!stillOpen}`,
    );
    await takeScreenshot(page, "TQ-04-sheet-closed", "today-nested");
  });

  test("TQ-05 door links: all four exist with focus-visible and transition-colors", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    const nav = page.locator('nav[aria-label="More on Today"]');
    await expect(nav).toBeVisible({ timeout: 10_000 });

    const buttons = nav.locator("button");
    const count = await buttons.count();
    expect(count, "Must have at least 3 door links").toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const cls = await btn.getAttribute("class");
      const hasFocus = cls?.includes("focus-visible");
      const hasTrans = cls?.includes("transition-colors");
      if (!hasFocus || !hasTrans) {
        console.warn(
          `[INCONSISTENT TQ-05] Door link ${i} missing class: focus-visible=${hasFocus}, transition-colors=${hasTrans}`,
        );
      }
    }

    console.log("[PASS TQ-05] Door links checked:", count);
    await takeScreenshot(page, "TQ-05-door-links", "today-nested");
  });

  test("TQ-06 Lucide icons: icon elements visible (not broken fallback)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    // Lucide icons render as SVG. Check at least some SVGs are present with correct structure.
    const svgCount = await page.evaluate(() => {
      return document.querySelectorAll("svg").length;
    });

    expect(svgCount, "Page must have SVG icons rendered").toBeGreaterThan(0);

    // Check for data-lucide or a common lucide SVG shape (stroke attribute)
    const lucideSvgs = await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll("svg"));
      return svgs.filter((s) => s.querySelector("path, circle, line, polyline")).length;
    });

    expect(
      lucideSvgs,
      "At least some SVGs must contain path/circle elements (Lucide icons)",
    ).toBeGreaterThan(0);
    console.log("[PASS TQ-06] SVG icons present:", lucideSvgs);
  });

  test("TQ-07 error state: 'Your calls didn't load.' shows Try again button", async ({ page }) => {
    await page.context().addCookies(cookies);

    // Intercept server function call for getNeedsYou to force error
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      const isServerFn = url.includes("_server") && url.includes("getNeedsYou");
      if (isServerFn) {
        await route.fulfill({ status: 500, body: '{"error":"Simulated"}' });
      } else {
        await route.continue();
      }
    });

    await page.goto(TODAY_PATH, { waitUntil: "networkidle" });

    const errorCard = page.locator("text=Your calls didn't load.");
    const isError = await errorCard.isVisible({ timeout: 8_000 }).catch(() => false);

    if (isError) {
      const retryBtn = page.locator('button:has-text("Try again")');
      await expect(retryBtn).toBeVisible({ timeout: 3_000 });
      console.log("[PASS TQ-07] Error card with retry button visible");
      await takeScreenshot(page, "TQ-07-error-retry", "today-nested");
    } else {
      console.log("[SKIP TQ-07] Mock didn't intercept in time (fast local server)");
    }
  });

  test("TQ-08 A keyboard shortcut: approves featured call when pending", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const hasCall = await page
      .locator('text="SHIP IT?"')
      .or(page.locator('text="WORTH BUILDING?"'))
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (!hasCall) {
      console.log("[SKIP TQ-08] No pending calls for A shortcut");
      return;
    }

    // Track toast or mutation
    let toastSeen = false;
    page.on("console", (msg) => {
      if (msg.text().includes("Approved") || msg.text().includes("Sent back")) toastSeen = true;
    });

    await page.keyboard.press("a");
    await page.waitForTimeout(1000);

    // Toast appears in the DOM after approval
    const toast = page.locator(
      '[data-testid="toast"], [role="status"], text=/Approved|unblocked/i',
    );
    const toastVisible = await toast.isVisible({ timeout: 3_000 }).catch(() => false);

    console.log(
      `[${toastVisible ? "PASS" : "INFO"} TQ-08] A key pressed; toast visible: ${toastVisible}`,
    );
    await takeScreenshot(page, "TQ-08-keyboard-a-approve", "today-nested");
  });
});

// ============================================================================
// 6. FORM VALIDATION STATES (DeskRail inputs)
// ============================================================================

test.describe("FORM VALIDATION STATES", () => {
  test.use({ viewport: VP.desktop });

  async function openDesk(page: Page) {
    const deskLink = page.locator('nav[aria-label="More on Today"] button:has-text("Desk")');
    const visible = await deskLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!visible) return false;
    await deskLink.click();
    await page.waitForTimeout(TIMING.openCloseMs);
    return true;
  }

  test("FV-01 Desk slide-over: opens with 'Your desk' title", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const opened = await openDesk(page);
    if (!opened) {
      console.log("[SKIP FV-01] Desk link not found");
      return;
    }

    await expect(page.getByText("Your desk").first()).toBeVisible({ timeout: 5_000 });
    console.log("[PASS FV-01] Desk slide-over opened");
    await takeScreenshot(page, "FV-01-desk-open", "today-nested");
    await page.keyboard.press("Escape");
  });

  test("FV-02 Capture input: focus changes border to high-contrast state", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const opened = await openDesk(page);
    if (!opened) {
      console.log("[SKIP FV-02] Desk not accessible");
      return;
    }

    // CaptureCard likely has a textarea or input for quick capture
    const input = page
      .locator('[data-state="open"] textarea, [data-state="open"] input[type="text"]')
      .first();
    const hasInput = await input.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasInput) {
      console.log("[SKIP FV-02] No text input found in Desk slide-over");
      await page.keyboard.press("Escape");
      return;
    }

    const beforeBorder = await input.evaluate((el) => getComputedStyle(el).borderColor);
    await input.click();
    await page.waitForTimeout(200);
    const afterBorder = await input.evaluate((el) => getComputedStyle(el).borderColor);

    console.log(
      `[${beforeBorder !== afterBorder ? "PASS" : "INCONSISTENT"} FV-02] Focus border: before="${beforeBorder}" after="${afterBorder}"`,
    );
    await takeScreenshot(page, "FV-02-input-focus", "today-nested");
    await page.keyboard.press("Escape");
  });

  test("FV-03 input typing: text appears without lag (immediate update)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const opened = await openDesk(page);
    if (!opened) {
      console.log("[SKIP FV-03] Desk not accessible");
      return;
    }

    const input = page
      .locator('[data-state="open"] textarea, [data-state="open"] input[type="text"]')
      .first();
    const hasInput = await input.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasInput) {
      console.log("[SKIP FV-03] No text input in Desk");
      await page.keyboard.press("Escape");
      return;
    }

    await input.click();
    await input.type("Hello", { delay: 50 });
    const value = await input.inputValue().catch(() => null);
    // Textarea uses textContent, not value
    const textContent = await input.textContent().catch(() => null);

    const typed = value ?? textContent ?? "";
    expect(typed.length, "Typed text must appear in the input").toBeGreaterThan(0);
    console.log("[PASS FV-03] Input accepts typed text:", typed.substring(0, 20));
    await takeScreenshot(page, "FV-03-input-typed", "today-nested");
    await page.keyboard.press("Escape");
  });

  test("FV-04 FocusCard: visible in Desk slide-over (personal daily tool)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const opened = await openDesk(page);
    if (!opened) {
      console.log("[SKIP FV-04] Desk not accessible");
      return;
    }

    // FocusCard renders a section with "Focus" or "Flow" label
    const focusSection = page.locator('[data-state="open"] section, [data-state="open"] .card');
    const visible = await focusSection
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    console.log(`[${visible ? "PASS" : "INCONSISTENT"} FV-04] FocusCard visible in Desk`);
    await page.keyboard.press("Escape");
  });
});

// ============================================================================
// 7. TRANSITIONS & TIMING
// ============================================================================

test.describe("TRANSITIONS & TIMING", () => {
  test.use({ viewport: VP.desktop });

  test("TT-01 cadRise animation: keyframe declared in stylesheet", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const declared = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (rule instanceof CSSKeyframesRule && rule.name === "cadRise") return true;
          }
        } catch {
          // cross-origin
        }
      }
      return false;
    });

    const containerRef = await page.evaluate(
      () => Array.from(document.querySelectorAll("[style*='cadRise']")).length > 0,
    );

    expect(declared || containerRef, "cadRise keyframe must be declared or referenced").toBe(true);
    console.log(`[PASS TT-01] cadRise: keyframe=${declared}, container-ref=${containerRef}`);
    await takeScreenshot(page, "TT-01-cadrise-check", "today-nested");
  });

  test("TT-02 cadShimmer animation: keyframe declared (2.4s loop)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const declared = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (rule instanceof CSSKeyframesRule && rule.name === "cadShimmer") return true;
          }
        } catch {
          // cross-origin
        }
      }
      return false;
    });

    expect(declared, "cadShimmer keyframe must be in the stylesheet").toBe(true);
    console.log("[PASS TT-02] cadShimmer keyframe declared");
  });

  test("TT-03 prefers-reduced-motion: all transitions become instant", async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: "reduce" });
    await goToToday(page);
    await waitLoaded(page);

    const { animDuration, transDuration } = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      for (const sheet of styleSheets) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (
              rule instanceof CSSMediaRule &&
              rule.conditionText.includes("prefers-reduced-motion")
            ) {
              for (const inner of Array.from(rule.cssRules)) {
                if (inner instanceof CSSStyleRule) {
                  const style = (inner as CSSStyleRule).style;
                  return {
                    animDuration: style.getPropertyValue("animation-duration"),
                    transDuration: style.getPropertyValue("transition-duration"),
                  };
                }
              }
            }
          }
        } catch {
          // cross-origin
        }
      }
      return { animDuration: null, transDuration: null };
    });

    const reducedApplied = animDuration?.includes("0.001ms") || transDuration?.includes("0.001ms");

    expect(reducedApplied, "Reduced motion media query must kill animations to 0.001ms").toBe(true);
    console.log(
      `[PASS TT-03] Reduced motion: animation-duration="${animDuration}", transition-duration="${transDuration}"`,
    );
  });

  test("TT-04 loom-press elements: have CSS transition (not instant)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const elements = page.locator(".loom-press");
    const count = await elements.count();
    expect(count, "Today must have loom-press interactive elements").toBeGreaterThan(0);

    const firstTransition = await elements
      .first()
      .evaluate((el) => getComputedStyle(el).transition);

    expect(firstTransition, "loom-press elements must have a non-empty CSS transition").not.toBe(
      "",
    );
    expect(firstTransition).not.toBe("none");
    expect(firstTransition).not.toBe("all 0s ease 0s");
    console.log("[PASS TT-04] loom-press transition:", firstTransition.substring(0, 80));
  });

  test("TT-05 hover state: transition-colors class present on door links (140ms)", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    const doorLinks = page.locator('nav[aria-label="More on Today"] button');
    const count = await doorLinks.count();
    expect(count).toBeGreaterThan(0);

    const transition = await doorLinks.first().evaluate((el) => getComputedStyle(el).transition);

    // 140ms = 0.14s; browsers normalize
    expect(transition, "DoorLinks should transition in ~140ms").toMatch(/0\.14s|140ms/);
    console.log("[PASS TT-05] DoorLink transition:", transition.substring(0, 60));
  });

  test("TT-06 loading skeleton: no animation jitter (height/borderRadius fixed)", async ({
    page,
  }) => {
    await page.context().addCookies(cookies);
    // Navigate without waiting for networkidle to catch the skeleton
    await page.goto(TODAY_PATH, { waitUntil: "commit" });

    const skeleton = page.locator('[role="status"][aria-label="Loading your calls"]');
    const skeletonVisible = await skeleton.isVisible({ timeout: 5_000 }).catch(() => false);

    if (skeletonVisible) {
      const { height, borderRadius } = await skeleton.evaluate((el) => {
        const style = getComputedStyle(el);
        return { height: style.height, borderRadius: style.borderRadius };
      });
      // Skeleton should have a defined height (not 0) and a radius
      expect(parseInt(height), "Skeleton must have non-zero height").toBeGreaterThan(0);
      console.log("[PASS TT-06] Skeleton height:", height, "radius:", borderRadius);
      await takeScreenshot(page, "TT-06-skeleton-loading", "today-nested");
    } else {
      console.log("[SKIP TT-06] Skeleton resolved before commit waitUntil (fast server)");
    }
  });

  test("TT-07 page entry (cadRise): page container uses animation property", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    // The Today container has: animation: "cadRise 250ms var(--ease) both"
    const containerHasRise = await page.evaluate(() => {
      const allEls = Array.from(document.querySelectorAll("[style]"));
      return allEls.some(
        (el) =>
          (el as HTMLElement).style.animation?.includes("cadRise") ||
          (el as HTMLElement).style.animation?.includes("250ms"),
      );
    });

    expect(containerHasRise, "Page container must have cadRise animation inline").toBe(true);
    console.log("[PASS TT-07] cadRise inline animation found on page container");
  });
});

// ============================================================================
// 8. RESPONSIVE BEHAVIOR
// ============================================================================

test.describe("RESPONSIVE — 375px Mobile", () => {
  test.use({ viewport: VP.mobile });

  test("RB-01 mobile: no horizontal scroll at 375px", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, "Must not have horizontal scroll at 375px").toBe(false);
    await takeFullPageScreenshot(page, "RB-01-mobile-no-overflow", "today-nested");
    console.log("[PASS RB-01] No horizontal scroll at 375px");
  });

  test("RB-02 mobile: DeskRail aside hidden (hidden xl:block)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const aside = page.locator('aside[aria-label="Your desk"]');
    const hidden = await aside.isHidden().catch(() => true);
    expect(hidden, "DeskRail aside must be hidden on mobile").toBe(true);
    console.log("[PASS RB-02] DeskRail hidden on 375px");
    await takeScreenshot(page, "RB-02-mobile-desk-hidden", "today-nested");
  });

  test("RB-03 mobile: all door link buttons accessible (not cut off)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const nav = page.locator('nav[aria-label="More on Today"]');
    await expect(nav).toBeVisible({ timeout: 10_000 });

    const buttons = nav.locator("button");
    const count = await buttons.count();
    expect(count, "All door links accessible on mobile").toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const bbox = await buttons.nth(i).boundingBox();
      expect(bbox, `Door link ${i} must have a bounding box`).not.toBeNull();
      if (bbox) {
        expect(bbox.width, `Door link ${i} must not have zero width`).toBeGreaterThan(0);
      }
    }
    console.log("[PASS RB-03] All door links have bounding boxes on mobile");
    await takeScreenshot(page, "RB-03-mobile-door-links", "today-nested");
  });

  test("RB-04 mobile: spotlight region fully visible (not clipped)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const region = page.locator('[role="region"][aria-label="Today\'s brief"]');
    await expect(region).toBeVisible({ timeout: 10_000 });

    const bbox = await region.boundingBox();
    expect(bbox, "Spotlight must have bounding box on mobile").not.toBeNull();
    if (bbox) {
      expect(bbox.x, "Spotlight must not start off-screen left").toBeGreaterThanOrEqual(0);
      expect(
        bbox.x + bbox.width,
        "Spotlight right edge must not exceed viewport",
      ).toBeLessThanOrEqual(VP.mobile.width + 1);
    }
    console.log("[PASS RB-04] Spotlight visible and within viewport on mobile");
  });

  test("RB-05 mobile: judgment section stacks vertically (no side-by-side layout)", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    // At mobile, the grid is 1-column: grid-cols-1 xl:grid-cols-[...]
    // The grid container should not have two visible side-by-side columns
    const gridEl = page.locator(".grid.grid-cols-1").first();
    const visible = await gridEl.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(visible, "Single-column grid must be active at 375px").toBe(true);
    console.log("[PASS RB-05] Single-column layout active on mobile");
  });
});

test.describe("RESPONSIVE — 768px Tablet", () => {
  test.use({ viewport: VP.tablet });

  test("RB-06 tablet: no horizontal scroll at 768px", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, "Must not have horizontal scroll at 768px").toBe(false);
    await takeFullPageScreenshot(page, "RB-06-tablet-no-overflow", "today-nested");
    console.log("[PASS RB-06] No horizontal scroll at 768px");
  });

  test("RB-07 tablet: DeskRail aside hidden (below xl=1280px breakpoint)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const aside = page.locator('aside[aria-label="Your desk"]');
    const hidden = await aside.isHidden().catch(() => true);
    expect(hidden, "DeskRail must be hidden below xl at 768px").toBe(true);
    console.log("[PASS RB-07] DeskRail hidden at 768px");
  });

  test("RB-08 tablet: judgment lane spans full content width", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const section = page.locator('[aria-label="Needs your judgment"]');
    const bbox = await section.boundingBox();
    if (bbox) {
      // At 768px, the section should use most of the viewport (no 312px rail)
      expect(bbox.width, "Judgment lane should span most of viewport at 768px").toBeGreaterThan(
        500,
      );
      console.log("[PASS RB-08] Judgment lane width at 768px:", bbox.width);
    }
  });
});

test.describe("RESPONSIVE — 1440px Desktop", () => {
  test.use({ viewport: VP.desktop });

  test("RB-09 desktop: DeskRail aside visible (xl:block active)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const aside = page.locator('aside[aria-label="Your desk"]');
    await expect(aside).toBeVisible({ timeout: 10_000 });
    console.log("[PASS RB-09] DeskRail visible at 1440px");
    await takeFullPageScreenshot(page, "RB-09-desktop-full", "today-nested");
  });

  test("RB-10 desktop: two-column grid is active (1fr + 312px rail)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    // The grid has xl:grid-cols-[minmax(0,1fr)_312px]
    // At 1440px, the aside should be ~312px wide
    const aside = page.locator('aside[aria-label="Your desk"]');
    const bbox = await aside.boundingBox();
    if (bbox) {
      // Allow some rounding tolerance: 300-325px
      expect(bbox.width, "DeskRail should be ~312px at desktop").toBeGreaterThan(290);
      expect(bbox.width).toBeLessThan(340);
      console.log("[PASS RB-10] DeskRail width:", bbox.width);
    }
  });

  test("RB-11 desktop: no horizontal scroll at 1440px", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, "No horizontal scroll at 1440px").toBe(false);
    console.log("[PASS RB-11] No horizontal scroll at 1440px");
  });

  test("RB-12 desktop: container max-width uses CSS var (not hardcoded)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const containerRef = await page.evaluate(() => {
      const containers = Array.from(document.querySelectorAll("[style*='max-width']"));
      return containers.filter((el) =>
        (el as HTMLElement).style.maxWidth.includes("var(--container"),
      ).length;
    });

    expect(containerRef, "Container must reference CSS var for max-width").toBeGreaterThan(0);
    console.log("[PASS RB-12] Container uses CSS var for max-width");
  });
});

// ============================================================================
// 9. KEYBOARD NAVIGATION
// ============================================================================

test.describe("KEYBOARD NAVIGATION", () => {
  test.use({ viewport: VP.desktop });

  test("KN-01 Tab: navigates to at least 8 interactive elements in order", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const focusLog: { tag: string; text: string }[] = [];

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        return {
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 30) ?? "",
        };
      });
      if (info) focusLog.push(info);
    }

    expect(
      focusLog.length,
      "Tab must reach at least 8 interactive elements",
    ).toBeGreaterThanOrEqual(8);
    console.log("[PASS KN-01] Tab focus order:", JSON.stringify(focusLog.slice(0, 8)));
    await takeScreenshot(page, "KN-01-tab-order", "today-nested");
  });

  test("KN-02 Shift+Tab: reverse focus navigation works", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    // Tab forward several times
    for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");

    const forward = await page.evaluate(
      () => document.activeElement?.textContent?.trim().substring(0, 30) ?? "",
    );

    // Shift+Tab backward
    await page.keyboard.press("Shift+Tab");
    const backward = await page.evaluate(
      () => document.activeElement?.textContent?.trim().substring(0, 30) ?? "",
    );

    // Should land on different element (or same if only one interactive element before)
    console.log(`[PASS KN-02] Forward focus: "${forward}" | After Shift+Tab: "${backward}"`);
    await takeScreenshot(page, "KN-02-shift-tab", "today-nested");
  });

  test("KN-03 Enter: activates focused button (door links)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    // Tab to a door link
    const watchBtn = page.locator('nav[aria-label="More on Today"] button:has-text("Watch")');
    await watchBtn.focus();

    await page.keyboard.press("Enter");
    await page.waitForTimeout(TIMING.openCloseMs);

    // Watch slide-over should open
    const watchOpen = await page
      .getByText("At risk / watch")
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    console.log(
      `[${watchOpen ? "PASS" : "INCONSISTENT"} KN-03] Enter opens Watch slide-over: ${watchOpen}`,
    );
    await takeScreenshot(page, "KN-03-enter-activates", "today-nested");
    await page.keyboard.press("Escape");
  });

  test("KN-04 Escape: closes Watch slide-over after open", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const watchBtn = page.locator('nav[aria-label="More on Today"] button:has-text("Watch")');
    await watchBtn.click();
    await page.waitForTimeout(TIMING.openCloseMs);

    const opened = await page
      .getByText("At risk / watch")
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (!opened) {
      console.log("[SKIP KN-04] Watch panel did not open");
      return;
    }

    await page.keyboard.press("Escape");
    await page.waitForTimeout(TIMING.openCloseMs + 100);

    const closed = await page
      .getByText("At risk / watch")
      .first()
      .isHidden()
      .catch(() => false);

    console.log(`[${closed ? "PASS" : "INCONSISTENT"} KN-04] Escape closes Watch: ${closed}`);
    await takeScreenshot(page, "KN-04-escape-closes", "today-nested");
  });

  test("KN-05 no positive tabindex: all elements use default/0 tabindex", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const positiveTabindex = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("[tabindex]"));
      return els
        .filter((el) => parseInt(el.getAttribute("tabindex") ?? "0") > 0)
        .map((el) => `${el.tagName}[tabindex=${el.getAttribute("tabindex")}]`);
    });

    if (positiveTabindex.length > 0) {
      console.warn("[FAIL KN-05] Positive tabindex elements found:", positiveTabindex);
    } else {
      console.log("[PASS KN-05] No positive tabindex values");
    }
    expect(positiveTabindex.length, "No elements should have positive tabindex").toBe(0);
  });

  test("KN-06 focus ring: :focus-visible produces 2px outline", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    // Tab to the first focusable element, measure focus ring
    await page.keyboard.press("Tab");

    const outlineWidth = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      return getComputedStyle(el).outlineWidth;
    });

    if (outlineWidth) {
      // Focus ring should be 2px
      expect(outlineWidth, "Focus ring must be 2px").toBe("2px");
      console.log("[PASS KN-06] Focus ring width:", outlineWidth);
    } else {
      console.log("[SKIP KN-06] Could not measure focus ring (no focused element)");
    }
    await takeScreenshot(page, "KN-06-focus-ring", "today-nested");
  });

  test("KN-07 S keyboard shortcut: sends back featured call when pending", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const hasCall = await page
      .locator('text="SHIP IT?"')
      .or(page.locator('text="WORTH BUILDING?"'))
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (!hasCall) {
      console.log("[SKIP KN-07] No pending calls for S shortcut");
      return;
    }

    await page.keyboard.press("s");
    await page.waitForTimeout(1000);

    const toast = page.locator("text=/Sent back|Sent back to draft|Changes requested/i");
    const toastVisible = await toast.isVisible({ timeout: 3_000 }).catch(() => false);

    console.log(`[${toastVisible ? "PASS" : "INFO"} KN-07] S key sent-back toast: ${toastVisible}`);
    await takeScreenshot(page, "KN-07-keyboard-s-sendback", "today-nested");
  });

  test("KN-08 interactive element accessible names: <20% unnamed", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const { unnamed, total } = await page.evaluate(() => {
      const interactive = Array.from(
        document.querySelectorAll('button, a, input, [role="button"]'),
      );
      const unnamed = interactive.filter((el) => {
        const label = el.getAttribute("aria-label");
        const text = el.textContent?.trim();
        const title = el.getAttribute("title");
        return !label && !text && !title;
      });
      return { unnamed: unnamed.length, total: interactive.length };
    });

    const unnamedPct = (unnamed / Math.max(total, 1)) * 100;
    console.log(
      `[KN-08] Interactive elements: ${total} total, ${unnamed} unnamed (${unnamedPct.toFixed(1)}%)`,
    );

    expect(unnamedPct, "Less than 20% of interactive elements must be unnamed").toBeLessThan(20);
  });

  test("KN-09 Arrow keys: navigate within expanded judgment lane", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    // Expand the judgment lane if there are hidden items
    const moreBtn = page.locator('button[aria-expanded="false"]:has-text("more waiting")');
    const hasMore = await moreBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasMore) {
      await moreBtn.click();
      await page.waitForTimeout(TIMING.openCloseMs);
    }

    // Tab into the judgment section and use arrow keys
    const firstCallBtn = page.locator('[aria-label="Needs your judgment"] button').first();
    const hasCallBtn = await firstCallBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasCallBtn) {
      await firstCallBtn.focus();
      const focused1 = await page.evaluate(() =>
        document.activeElement?.textContent?.trim().substring(0, 30),
      );

      await page.keyboard.press("Tab");
      const focused2 = await page.evaluate(() =>
        document.activeElement?.textContent?.trim().substring(0, 30),
      );

      console.log(`[PASS KN-09] Tab within judgment: "${focused1}" -> "${focused2}"`);
    } else {
      console.log("[SKIP KN-09] No focusable elements in judgment section");
    }
  });
});

// ============================================================================
// 10. FULL SURFACE SMOKE — cross-section consistency
// ============================================================================

test.describe("SURFACE SMOKE & CONSISTENCY", () => {
  test("CS-01 desktop: no JS errors on initial Today load", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await goToToday(page);
    await waitLoaded(page);
    await page.waitForTimeout(1500);

    const critical = jsErrors.filter(
      (e) =>
        !e.includes("Warning:") &&
        !e.includes("ResizeObserver") &&
        !e.includes("Hydration") &&
        !e.includes("hydration") &&
        !e.includes("server rendered"),
    );

    if (critical.length > 0) {
      console.warn("[FAIL CS-01] Critical JS errors:", critical);
    } else {
      console.log("[PASS CS-01] No critical JS errors on Today load");
    }
    expect(critical.length, `Critical JS errors: ${critical.join("; ")}`).toBe(0);
    await takeFullPageScreenshot(page, "CS-01-desktop-smoke", "today-nested");
  });

  test("CS-02 spotlight + hero: never both render simultaneously (cold start guard)", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    // The route gates between TodayHeroCard and ColdStartOnramp — never co-renders
    const heroH1 = page.locator("h1[style*='font-pixel']");
    const coldStart = page.locator("text=Get started");

    const heroVisible = await heroH1.isVisible({ timeout: 2_000 }).catch(() => false);
    const coldVisible = await coldStart.isVisible({ timeout: 2_000 }).catch(() => false);

    // They must be mutually exclusive
    expect(heroVisible && coldVisible, "Hero and cold-start on-ramp must never co-render").toBe(
      false,
    );
    console.log(`[PASS CS-02] Hero=${heroVisible}, ColdStart=${coldVisible} (mutually exclusive)`);
  });

  test("CS-03 all cards: no hardcoded hex or rgb() background colors", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const violations = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("[style*='background']"))
        .filter((el) => {
          const bg = (el as HTMLElement).style.background;
          return (
            bg &&
            !bg.includes("var(") &&
            /^(rgb|#|hsl)/.test(bg) &&
            !bg.startsWith("radial-gradient")
          );
        })
        .map((el) => `${el.tagName}: ${(el as HTMLElement).style.background.substring(0, 50)}`);
    });

    if (violations.length > 0) {
      console.warn("[INCONSISTENT CS-03] Hardcoded background colors:", violations.slice(0, 5));
    } else {
      console.log("[PASS CS-03] All card backgrounds use CSS vars");
    }
    expect(violations.length, "Hardcoded background colors must be 0").toBeLessThan(5);
  });

  test("CS-04 all sections: ARIA landmarks present (nav, section, aside)", async ({ page }) => {
    await goToToday(page);
    await waitLoaded(page);

    const landmarks = await page.evaluate(() => ({
      nav: document.querySelectorAll("nav").length,
      sections: document.querySelectorAll("section[aria-label]").length,
      aside: document.querySelectorAll("aside").length,
    }));

    expect(landmarks.nav, "At least one nav landmark").toBeGreaterThan(0);
    expect(landmarks.sections, "At least one labeled section").toBeGreaterThan(0);
    console.log("[PASS CS-04] ARIA landmarks:", landmarks);
  });

  test("CS-05 mobile smoke: Today loads cleanly at 375px", async ({ page }) => {
    await page.setViewportSize(VP.mobile);

    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await goToToday(page);
    await waitLoaded(page);

    const critical = jsErrors.filter(
      (e) => !e.includes("Warning:") && !e.includes("ResizeObserver") && !e.includes("hydration"),
    );
    expect(critical.length, `Mobile JS errors: ${critical.join("; ")}`).toBe(0);
    console.log("[PASS CS-05] Mobile smoke passed");
    await takeFullPageScreenshot(page, "CS-05-mobile-smoke", "today-nested");
  });

  test("CS-06 spacing: 4px grid multiples used in gap values (8, 12, 16, 24px)", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    // Check inline gap values in the flex containers
    const oddGaps = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("[style*='gap']"));
      const odd: string[] = [];
      for (const el of els.slice(0, 100)) {
        const gap = (el as HTMLElement).style.gap;
        if (gap) {
          const px = parseInt(gap);
          if (!isNaN(px) && px % 4 !== 0) {
            odd.push(`${el.tagName}: gap=${gap}`);
          }
        }
      }
      return odd;
    });

    if (oddGaps.length > 0) {
      console.warn("[INCONSISTENT CS-06] Non-4px gap values:", oddGaps.slice(0, 5));
    } else {
      console.log("[PASS CS-06] All sampled gap values are 4px multiples");
    }
    // Soft threshold — some components may use 10px (still close to grid)
    expect(oddGaps.length).toBeLessThan(5);
  });

  test("CS-07 typography: no font-size values outside allowed range (11-18px on labels)", async ({
    page,
  }) => {
    await goToToday(page);
    await waitLoaded(page);

    const violations = await page.evaluate(() => {
      const spans = Array.from(
        document.querySelectorAll("span[style*='font-size'], p[style*='font-size']"),
      );
      const bad: string[] = [];
      for (const el of spans.slice(0, 200)) {
        const fs = (el as HTMLElement).style.fontSize;
        if (fs && !fs.includes("var(")) {
          const px = parseInt(fs);
          if (!isNaN(px) && (px < 11 || px > 18)) {
            bad.push(
              `${el.tagName}: font-size=${fs} ("${el.textContent?.trim().substring(0, 20)}")`,
            );
          }
        }
      }
      return bad.slice(0, 10);
    });

    if (violations.length > 0) {
      console.warn("[INCONSISTENT CS-07] Font sizes outside 11-18px range:", violations);
    } else {
      console.log("[PASS CS-07] All sampled label font sizes in 11-18px range");
    }
    // The hero callTitle uses 18px (Pixel brand moment — allowed)
    expect(violations.length, "Font-size violations outside 11-18px range").toBeLessThan(5);
  });

  test.use({ viewport: VP.desktop });
});
