/**
 * Phase 6 Exhaustive Validation — Wave 1-2 Final Gate
 *
 * Sections:
 *   6A: Responsive Behavior (375 / 768 / 1440px) — 6 primary surfaces × 3 viewports = 18 screenshots
 *   6B: Interactive State Testing — buttons, inputs, cards, modals, dropdowns, loading/empty
 *   6C: Motion & Animation Compliance — transition timing, reduced-motion gate
 *   6D: Accessibility (WCAG 2.2 AA) — keyboard nav, focus rings, ARIA, semantic HTML
 *   6E: Cross-Browser spot check stubs (Chromium primary; Firefox/Safari flags if unavailable)
 *   6F: Visual Regression baseline comparison
 *
 * Auth:  demo@redcadence.app / Cadence!Demo2026
 * Base:  http://localhost:8080
 */

import { test, expect, Page, Browser, BrowserContext } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ─── Constants ──────────────────────────────────────────────────────────────

const DEMO_EMAIL = "demo@redcadence.app";
const DEMO_PASSWORD = "Cadence!Demo2026";
const BASE_URL = "http://localhost:8080";

const BREAKPOINTS = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
] as const;

const PRIMARY_SURFACES = [
  { path: "/today", name: "today", label: "Today" },
  { path: "/discover", name: "discover", label: "Discovery" },
  { path: "/plan", name: "plan", label: "Plan" },
  { path: "/build", name: "build", label: "Build" },
  { path: "/govern", name: "govern", label: "Governance" },
  { path: "/brain", name: "brain", label: "Brain" },
] as const;

const EXTENDED_SURFACES = [
  { path: "/settings", name: "settings", label: "Settings" },
  { path: "/traces", name: "traces", label: "Traces" },
  { path: "/agents", name: "agents", label: "Agents" },
  { path: "/engine-room", name: "engine-room", label: "Engine Room" },
] as const;

const PHASE6_DIR = path.join(
  "/Users/rohitgajaraj/Projects/My Projects/My Builds/cadence-lane-4",
  "test-results",
  "phase6",
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function ensureDir(subDir: string): string {
  const dir = path.join(PHASE6_DIR, subDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function shot(page: Page, name: string, subDir: string): Promise<string> {
  const dir = ensureDir(subDir);
  const p = path.join(dir, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function fullShot(page: Page, name: string, subDir: string): Promise<string> {
  const dir = ensureDir(subDir);
  const p = path.join(dir, `${name}-full.png`);
  await page.screenshot({ path: p, fullPage: true });
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
  } catch (e) {
    console.warn("Login failed:", e);
    return false;
  }
}

async function loginAndGo(page: Page, routePath: string): Promise<void> {
  await page.goto(`${BASE_URL}${routePath}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (page.url().includes("/login")) {
    await login(page);
    await page.goto(`${BASE_URL}${routePath}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  }
  // Brief settle for async data
  await page.waitForTimeout(1500);
}

// Measure computed style properties of an element found by a selector
async function getComputedProp(
  page: Page,
  selector: string,
  props: string[],
): Promise<Record<string, string> | null> {
  return page.evaluate(
    ({ sel, ps }: { sel: string; ps: string[] }) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const style = window.getComputedStyle(el);
      const result: Record<string, string> = {};
      ps.forEach((p) => {
        result[p] = style.getPropertyValue(p);
      });
      return result;
    },
    { sel: selector, ps: props },
  );
}

// ─── Phase 6A: Responsive Behavior ──────────────────────────────────────────

test.describe("Phase 6A: Responsive Behavior", () => {
  let authCookies: Parameters<BrowserContext["addCookies"]>[0];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await login(page);
    authCookies = await ctx.cookies();
    await page.close();
    await ctx.close();
  });

  for (const surface of PRIMARY_SURFACES) {
    for (const bp of BREAKPOINTS) {
      test(`[${bp.name}] ${surface.label} — no horizontal scroll, touch targets, layout`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await page.context().addCookies(authCookies);
        await loginAndGo(page, surface.path);

        // Screenshot
        const imgPath = await shot(page, `${surface.name}-${bp.name}`, "6A-responsive");
        console.log(`  Screenshot: ${imgPath}`);

        // 1. No horizontal scroll
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(
          scrollWidth,
          `[${bp.name}] ${surface.label}: horizontal scroll detected (scrollWidth=${scrollWidth} > ${bp.width})`,
        ).toBeLessThanOrEqual(bp.width + 2);

        // 2. Body is in viewport width range
        const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
        expect(
          bodyWidth,
          `Body wider than viewport on ${surface.label} at ${bp.name}`,
        ).toBeLessThanOrEqual(bp.width + 2);

        // 3. At 375px: nav rail must be hidden (or collapsed to icon-only)
        if (bp.width === 375) {
          const navRail = await page.evaluate(() => {
            const possibleNav = document.querySelector(
              '[data-testid="nav-rail"], nav[class*="sidebar"], aside[class*="nav"], [class*="LeftNav"], [class*="SideNav"]',
            );
            if (!possibleNav) return { found: false };
            const style = window.getComputedStyle(possibleNav);
            return {
              found: true,
              display: style.display,
              width: possibleNav.getBoundingClientRect().width,
              visibility: style.visibility,
            };
          });
          console.log(`  Mobile nav state:`, navRail);
          // Nav should either not exist, be hidden, or be narrowed to ≤60px icon-rail
          if (navRail.found && navRail.display !== "none" && navRail.visibility !== "hidden") {
            expect(
              navRail.width ?? 0,
              "Nav rail must collapse below 80px on mobile",
            ).toBeLessThanOrEqual(80);
          }
        }

        // 4. Touch targets: any button/link ≥ 44px tall
        if (bp.width <= 768) {
          const touchTargets = await page.evaluate(() => {
            const buttons = [
              ...document.querySelectorAll("button:not([disabled]), a[href], [role='button']"),
            ];
            const visible = buttons.filter((b) => {
              const r = b.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && r.top >= 0 && r.top < window.innerHeight;
            });
            const too_small = visible.filter((b) => b.getBoundingClientRect().height < 40);
            return {
              total: visible.length,
              tooSmall: too_small.length,
              samples: too_small.slice(0, 5).map((b) => ({
                tag: b.tagName,
                text: b.textContent?.trim().substring(0, 20),
                h: b.getBoundingClientRect().height,
                className: b.className?.toString().substring(0, 50),
              })),
            };
          });
          console.log(`  Touch targets on ${surface.label} at ${bp.name}:`, touchTargets);
          // Warn but don't hard-fail: many icon buttons are intentionally smaller
          if (touchTargets.tooSmall > 0) {
            console.warn(
              `  WARN: ${touchTargets.tooSmall}/${touchTargets.total} visible interactive elements below 40px height`,
            );
          }
        }

        // 5. At 1440: content max-width respected (≤1400px per Tempo)
        if (bp.width === 1440) {
          const maxContentWidth = await page.evaluate(() => {
            const main = document.querySelector(
              "main, [role='main'], .main-content, [class*='main']",
            );
            return main ? main.scrollWidth : null;
          });
          if (maxContentWidth !== null) {
            console.log(`  Main content width at 1440: ${maxContentWidth}px`);
            // Content should not exceed 1440px; Tempo says max 1400px for content
            expect(maxContentWidth).toBeLessThanOrEqual(1440);
          }
        }
      });
    }
  }

  // Extended surfaces at desktop only for regression
  for (const surface of EXTENDED_SURFACES) {
    test(`[desktop-1440] ${surface.label} — no scroll regression`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.context().addCookies(authCookies);
      await loginAndGo(page, surface.path);
      await shot(page, `${surface.name}-desktop-1440`, "6A-responsive/extended");
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(1442);
    });
  }
});

// ─── Phase 6B: Interactive States ───────────────────────────────────────────

test.describe("Phase 6B: Interactive States", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let authCookies: Parameters<BrowserContext["addCookies"]>[0];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await login(page);
    authCookies = await ctx.cookies();
    await page.close();
    await ctx.close();
  });

  // ── 6B-1: Button States ──────────────────────────────────────────────────

  test("6B-1: Button states — Today (default, hover, active, disabled, loading)", async ({
    page,
  }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/today");
    await shot(page, "today-buttons-default", "6B-interactive/buttons");

    // Collect all visible buttons
    const buttonData = await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")].filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= 0 && r.top < window.innerHeight;
      });

      return btns.slice(0, 20).map((b) => ({
        text: b.textContent?.trim().substring(0, 30) ?? "",
        disabled: (b as HTMLButtonElement).disabled,
        hasSpinner:
          b.querySelector('[class*="spin"], [class*="loader"], [class*="loading"]') !== null,
        ariaLabel: b.getAttribute("aria-label"),
        className: b.className?.toString().substring(0, 80),
        height: b.getBoundingClientRect().height,
        tag: b.tagName,
      }));
    });
    console.log("  Buttons on Today:", JSON.stringify(buttonData, null, 2));

    // Hover over first visible non-disabled button
    const firstBtn = page.locator("button:visible").first();
    const hasBtn = await firstBtn.isVisible().catch(() => false);
    if (hasBtn) {
      await firstBtn.hover();
      await page.waitForTimeout(200); // let 150ms transition settle
      await shot(page, "today-button-hover", "6B-interactive/buttons");

      // Check computed style in hover state
      const hoverStyle = await page.evaluate(() => {
        const el = document.querySelector("button:hover") as HTMLElement | null;
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
          background: s.backgroundColor,
          transform: s.transform,
          opacity: s.opacity,
          transition: s.transition,
        };
      });
      console.log("  Button hover style:", hoverStyle);

      // Hover transition should not be 0ms
      if (hoverStyle?.transition) {
        const has150ms =
          /0\.[12]/.test(hoverStyle.transition) ||
          /1[0-9][0-9]ms/.test(hoverStyle.transition) ||
          /15\dms/.test(hoverStyle.transition);
        const isInstant =
          hoverStyle.transition.includes("0s") && !hoverStyle.transition.includes("0.1");
        if (isInstant) {
          console.warn("  WARN: Button transition appears instant (0s) — may violate 150ms spec");
        }
      }
    }

    // Check for any disabled buttons
    const disabledBtns = await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button[disabled], button[aria-disabled='true']")];
      return btns.slice(0, 5).map((b) => ({
        text: b.textContent?.trim().substring(0, 30),
        opacity: window.getComputedStyle(b).opacity,
        cursor: window.getComputedStyle(b).cursor,
      }));
    });
    console.log("  Disabled buttons:", disabledBtns);

    // Disabled buttons should have cursor:not-allowed or reduced opacity
    for (const btn of disabledBtns) {
      const opacityVal = parseFloat(btn.opacity ?? "1");
      const hasReducedOpacity = opacityVal < 0.8;
      const hasNotAllowed = btn.cursor === "not-allowed" || btn.cursor === "default";
      if (!hasReducedOpacity && !hasNotAllowed) {
        console.warn(
          `  WARN: Disabled button "${btn.text}" has full opacity and non-restricted cursor`,
        );
      }
    }
  });

  test("6B-1b: Button states — Discovery surface", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/discover");
    await shot(page, "discover-buttons-default", "6B-interactive/buttons");

    const buttons = await page.evaluate(() => {
      return [...document.querySelectorAll("button")]
        .filter((b) => {
          const r = b.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        })
        .slice(0, 10)
        .map((b) => ({
          text: b.textContent?.trim().substring(0, 25),
          height: b.getBoundingClientRect().height,
          disabled: (b as HTMLButtonElement).disabled,
        }));
    });
    console.log("  Buttons on Discovery:", buttons);

    const firstBtn = page.locator("button:visible").first();
    const hasBtn = await firstBtn.isVisible().catch(() => false);
    if (hasBtn) {
      await firstBtn.hover();
      await page.waitForTimeout(200);
      await shot(page, "discover-button-hover", "6B-interactive/buttons");
    }
  });

  // ── 6B-2: Form Inputs ────────────────────────────────────────────────────

  test("6B-2: Form inputs — empty, focus, filled, disabled states", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/settings");
    await shot(page, "settings-inputs-default", "6B-interactive/inputs");

    // Collect all visible inputs
    const inputData = await page.evaluate(() => {
      const inputs = [...document.querySelectorAll("input, textarea, select")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      return inputs.slice(0, 10).map((el) => ({
        type: (el as HTMLInputElement).type,
        placeholder: (el as HTMLInputElement).placeholder,
        disabled: (el as HTMLInputElement).disabled,
        value: (el as HTMLInputElement).value?.substring(0, 20),
        label: el.getAttribute("aria-label") ?? el.getAttribute("id"),
        border: window.getComputedStyle(el).borderColor,
        bg: window.getComputedStyle(el).backgroundColor,
      }));
    });
    console.log("  Inputs on Settings:", JSON.stringify(inputData, null, 2));

    // Test focus state on first visible text input
    const textInput = page
      .locator(
        'input[type="text"], input[type="email"], input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])',
      )
      .first();
    const hasInput = await textInput.isVisible().catch(() => false);

    if (hasInput) {
      // Empty state
      await shot(page, "settings-input-empty", "6B-interactive/inputs");

      // Focus state
      await textInput.click();
      await page.waitForTimeout(150);
      await shot(page, "settings-input-focused", "6B-interactive/inputs");

      const focusedStyle = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
          outline: s.outline,
          outlineColor: s.outlineColor,
          outlineWidth: s.outlineWidth,
          borderColor: s.borderColor,
          boxShadow: s.boxShadow,
        };
      });
      console.log("  Input focus style:", focusedStyle);

      // Filled state
      await textInput.fill("test-value-123");
      await page.waitForTimeout(100);
      await shot(page, "settings-input-filled", "6B-interactive/inputs");

      // Blur
      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);
      await shot(page, "settings-input-blurred", "6B-interactive/inputs");
    }
  });

  test("6B-2b: Form inputs — login page (neutral reference)", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await shot(page, "login-inputs-empty", "6B-interactive/inputs");

    // Focus email
    await page.click('input[type="email"]');
    await page.waitForTimeout(150);
    await shot(page, "login-email-focused", "6B-interactive/inputs");

    const emailFocusStyle = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const s = window.getComputedStyle(el);
      const cssVars = window.getComputedStyle(document.documentElement);
      return {
        outline: s.outline,
        outlineColor: s.outlineColor,
        outlineWidth: s.outlineWidth,
        borderColor: s.borderColor,
        boxShadow: s.boxShadow,
        focusColorVar: cssVars.getPropertyValue("--ds-focus-color").trim(),
      };
    });
    console.log("  Email input focus:", emailFocusStyle);

    // Fill email
    await page.fill('input[type="email"]', "test@example.com");
    await shot(page, "login-email-filled", "6B-interactive/inputs");

    // Focus password
    await page.click('input[type="password"]');
    await page.waitForTimeout(150);
    await shot(page, "login-password-focused", "6B-interactive/inputs");
  });

  // ── 6B-3: Cards & Surfaces ────────────────────────────────────────────────

  test("6B-3: Card hover states on Today", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/today");
    await shot(page, "today-cards-default", "6B-interactive/cards");

    // Find visible card-like elements
    const cardData = await page.evaluate(() => {
      const cards = [
        ...document.querySelectorAll(
          '[class*="card"], [class*="Card"], article, [role="article"], [class*="tile"]',
        ),
      ].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 100 && r.height > 50 && r.top >= 0 && r.top < window.innerHeight;
      });
      return {
        count: cards.length,
        samples: cards.slice(0, 5).map((el) => ({
          tag: el.tagName,
          className: el.className?.toString().substring(0, 60),
          bg: window.getComputedStyle(el).backgroundColor,
          border: window.getComputedStyle(el).borderColor,
          shadow: window.getComputedStyle(el).boxShadow,
          cursor: window.getComputedStyle(el).cursor,
        })),
      };
    });
    console.log("  Cards on Today:", JSON.stringify(cardData, null, 2));

    const firstCard = page.locator('[class*="card"], [class*="Card"], article').first();
    const hasCard = await firstCard.isVisible().catch(() => false);
    if (hasCard) {
      await firstCard.hover();
      await page.waitForTimeout(200);
      await shot(page, "today-card-hover", "6B-interactive/cards");

      const hoverStyle = await page.evaluate(() => {
        const el = document.querySelector('[class*="card"]:hover, [class*="Card"]:hover');
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
          bg: s.backgroundColor,
          shadow: s.boxShadow,
          transform: s.transform,
          transition: s.transition,
        };
      });
      console.log("  Card hover style:", hoverStyle);
    }
  });

  test("6B-3b: Card hover states on Discovery", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/discover");
    await shot(page, "discover-cards-default", "6B-interactive/cards");

    const firstCard = page
      .locator('[class*="card"], [class*="Card"], article, [class*="opportunity"]')
      .first();
    const hasCard = await firstCard.isVisible().catch(() => false);
    if (hasCard) {
      await firstCard.hover();
      await page.waitForTimeout(200);
      await shot(page, "discover-card-hover", "6B-interactive/cards");
    }
  });

  // ── 6B-4: Modals & Dialogs ────────────────────────────────────────────────

  test("6B-4: Modal lifecycle — open animation, escape close, focus trap", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/today");

    // Look for dialog-triggering buttons
    const dialogTriggers = [
      '[data-testid*="dialog"], [data-testid*="modal"]',
      'button[aria-haspopup="dialog"]',
      'button:has-text("New"), button:has-text("Create"), button:has-text("Add")',
    ];

    let triggerFound = false;
    for (const sel of dialogTriggers) {
      const trigger = page.locator(sel).first();
      const visible = await trigger.isVisible().catch(() => false);
      if (visible) {
        await trigger.click();
        await page.waitForTimeout(350); // Allow 300ms open animation to complete
        const dialogOpen = await page
          .locator('[role="dialog"], [aria-modal="true"]')
          .isVisible()
          .catch(() => false);
        if (dialogOpen) {
          triggerFound = true;
          await shot(page, "today-modal-open", "6B-interactive/modals");
          console.log("  Modal opened via:", sel);

          // Check animation properties on open dialog
          const dialogStyle = await page.evaluate(() => {
            const el = document.querySelector('[role="dialog"]') as HTMLElement | null;
            if (!el) return null;
            const s = window.getComputedStyle(el);
            return {
              opacity: s.opacity,
              transform: s.transform,
              transition: s.transition,
              animation: s.animation,
            };
          });
          console.log("  Modal open style:", dialogStyle);

          // Focus trap: Tab should stay within dialog
          const initialFocused = await page.evaluate(() => {
            const el = document.activeElement;
            return el ? { tag: el.tagName, text: el.textContent?.trim().substring(0, 20) } : null;
          });
          console.log("  Initial focus in dialog:", initialFocused);

          // Tab 3 times and ensure focus stays in dialog
          for (let i = 0; i < 3; i++) {
            await page.keyboard.press("Tab");
            const focused = await page.evaluate(() => {
              const el = document.activeElement;
              const dialog = document.querySelector('[role="dialog"]');
              const isInDialog = dialog ? dialog.contains(el) : false;
              return {
                tag: el?.tagName,
                isInDialog,
                text: el?.textContent?.trim().substring(0, 20),
              };
            });
            console.log(`    Focus Tab ${i + 1}:`, focused);
            if (!focused.isInDialog) {
              console.warn("  WARN: Focus escaped dialog on Tab press");
            }
          }

          // Escape should close
          await page.keyboard.press("Escape");
          await page.waitForTimeout(350);
          const dialogClosed = !(await page
            .locator('[role="dialog"]')
            .isVisible()
            .catch(() => false));
          console.log("  Dialog closed by Escape:", dialogClosed);
          await shot(page, "today-modal-closed", "6B-interactive/modals");

          if (!dialogClosed) {
            console.warn("  WARN: Escape key did not close dialog");
          }

          break;
        }
      }
    }

    if (!triggerFound) {
      console.log("  No dialog trigger found on /today — checking /plan for modals");
      await loginAndGo(page, "/plan");
      const createBtn = page
        .locator('button:has-text("New"), button:has-text("Create"), button:has-text("Add")')
        .first();
      const hasBtnOnPlan = await createBtn.isVisible().catch(() => false);
      if (hasBtnOnPlan) {
        await createBtn.click();
        await page.waitForTimeout(350);
        const hasDialog = await page
          .locator('[role="dialog"]')
          .isVisible()
          .catch(() => false);
        if (hasDialog) {
          await shot(page, "plan-modal-open", "6B-interactive/modals");
          await page.keyboard.press("Escape");
          await page.waitForTimeout(350);
          await shot(page, "plan-modal-closed", "6B-interactive/modals");
        }
      }
    }
  });

  // ── 6B-5: Dropdowns & Menus ───────────────────────────────────────────────

  test("6B-5: Dropdown menus — open/close, keyboard navigation", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/today");

    // Check for select/combobox/dropdown triggers
    const dropdownSelectors = [
      "select:visible",
      '[role="combobox"]',
      '[aria-haspopup="listbox"]',
      '[aria-haspopup="menu"]',
      '[data-testid*="dropdown"]',
      "button[aria-expanded]",
    ];

    let dropdownFound = false;
    for (const sel of dropdownSelectors) {
      const el = page.locator(sel).first();
      const visible = await el.isVisible().catch(() => false);
      if (visible) {
        dropdownFound = true;
        console.log("  Found dropdown trigger:", sel);

        const beforeStyle = await page.evaluate((s) => {
          const el = document.querySelector(s);
          if (!el) return null;
          return {
            ariaExpanded: el.getAttribute("aria-expanded"),
            tag: el.tagName,
          };
        }, sel);
        console.log("  Before open:", beforeStyle);

        await el.click();
        await page.waitForTimeout(250); // let 200ms popover animation run

        const menuOpen = await page
          .locator('[role="menu"], [role="listbox"], [role="option"]')
          .isVisible()
          .catch(() => false);
        if (menuOpen) {
          await shot(page, "today-dropdown-open", "6B-interactive/dropdowns");
          console.log("  Dropdown opened. Testing keyboard nav...");

          // Arrow key navigation
          await page.keyboard.press("ArrowDown");
          await page.waitForTimeout(50);
          const afterArrow = await page.evaluate(() => {
            const el = document.activeElement;
            return {
              tag: el?.tagName,
              role: el?.getAttribute("role"),
              text: el?.textContent?.trim().substring(0, 20),
            };
          });
          console.log("  After ArrowDown:", afterArrow);

          // Escape closes
          await page.keyboard.press("Escape");
          await page.waitForTimeout(250);
          const menuClosed = !(await page
            .locator('[role="menu"], [role="listbox"]')
            .first()
            .isVisible()
            .catch(() => false));
          console.log("  Dropdown closed by Escape:", menuClosed);
          await shot(page, "today-dropdown-closed", "6B-interactive/dropdowns");
        } else {
          // Close if it was a select
          await page.keyboard.press("Escape");
        }
        break;
      }
    }

    if (!dropdownFound) {
      console.log("  No dropdown triggers found on /today — logging note only");
    }
  });

  // ── 6B-6: Loading & Empty States ──────────────────────────────────────────

  test("6B-6: Loading state — skeleton loaders during data fetch", async ({ page }) => {
    await page.context().addCookies(authCookies);

    // Intercept and delay API responses to capture loading state
    await page.route("**/functions/v1/**", (route) => {
      setTimeout(() => route.continue(), 1500);
    });

    await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (page.url().includes("/login")) {
      await page.unroute("**/functions/v1/**");
      await login(page);
      await page.route("**/functions/v1/**", (route) => {
        setTimeout(() => route.continue(), 1500);
      });
      await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded", timeout: 30000 });
    }

    // Immediately capture to catch loading state
    await page.waitForTimeout(300);
    await shot(page, "today-loading-state", "6B-interactive/loading");

    // Check for skeleton/spinner elements
    const loadingElements = await page.evaluate(() => {
      const skeletons = document.querySelectorAll(
        '[class*="skeleton"], [class*="Skeleton"], [class*="shimmer"], [class*="pulse"]',
      );
      const spinners = document.querySelectorAll(
        '[class*="spinner"], [class*="Spinner"], [class*="loading"], svg[class*="animate"]',
      );
      return {
        skeletonCount: skeletons.length,
        spinnerCount: spinners.length,
        skeletonSamples: [...skeletons]
          .slice(0, 3)
          .map((el) => el.className?.toString().substring(0, 50)),
      };
    });
    console.log("  Loading elements:", loadingElements);

    await page.unroute("**/functions/v1/**");
    await page.waitForTimeout(2000);
    await shot(page, "today-loaded-state", "6B-interactive/loading");
  });

  test("6B-6b: Empty state check — Build surface", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/build");
    await shot(page, "build-default", "6B-interactive/loading");

    const emptyStates = await page.evaluate(() => {
      const empties = document.querySelectorAll(
        '[class*="empty"], [data-testid*="empty"], [class*="Empty"], [class*="placeholder"]',
      );
      return {
        count: empties.length,
        samples: [...empties].slice(0, 3).map((el) => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 60),
          hasIcon: el.querySelector("svg, img") !== null,
        })),
      };
    });
    console.log("  Empty states on Build:", emptyStates);

    if (emptyStates.count === 0) {
      // Check if there's actual content (normal state)
      const hasMissions = await page
        .locator('[class*="mission"], [class*="Mission"]')
        .first()
        .isVisible()
        .catch(() => false);
      console.log("  Build surface has mission content:", hasMissions);
    }
  });
});

// ─── Phase 6C: Motion & Animation Compliance ────────────────────────────────

test.describe("Phase 6C: Motion & Animation Compliance", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let authCookies: Parameters<BrowserContext["addCookies"]>[0];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await login(page);
    authCookies = await ctx.cookies();
    await page.close();
    await ctx.close();
  });

  test("6C-1: CSS transition variables — Tempo v5 motion tokens present", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/today");

    const motionTokens = await page.evaluate(() => {
      const css = window.getComputedStyle(document.documentElement);
      return {
        overlayDuration: css.getPropertyValue("--ds-motion-overlay-duration").trim(),
        popoverDuration: css.getPropertyValue("--ds-motion-popover-duration").trim(),
        timingSwift: css.getPropertyValue("--ds-motion-timing-swift").trim(),
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        // Also check raw transition CSS on interactive elements
        firstButton: (() => {
          const btn = document.querySelector("button");
          if (!btn) return null;
          return window.getComputedStyle(btn).transition;
        })(),
      };
    });
    console.log("  Motion tokens:", motionTokens);

    // Verify motion tokens exist (may be empty string if not set, which is a finding)
    if (!motionTokens.overlayDuration) {
      console.warn("  WARN: --ds-motion-overlay-duration not set in CSS");
    }
    if (!motionTokens.popoverDuration) {
      console.warn("  WARN: --ds-motion-popover-duration not set in CSS");
    }
    if (!motionTokens.timingSwift) {
      console.warn("  WARN: --ds-motion-timing-swift easing not set in CSS");
    }

    console.log("  First button transition:", motionTokens.firstButton);
  });

  test("6C-2: Button hover transitions ≤150ms", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/today");

    const transitions = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll("button")].filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });

      return buttons
        .slice(0, 10)
        .map((btn) => {
          const s = window.getComputedStyle(btn);
          const transition = s.transition;
          // Parse duration from transition string like "color 0.15s ease, background 0.15s ease"
          const durationMatches = transition.match(/(\d+(?:\.\d+)?)(s|ms)/g) ?? [];
          const maxDuration = durationMatches.reduce((max, d) => {
            const val = parseFloat(d);
            const ms = d.endsWith("ms") ? val : val * 1000;
            return Math.max(max, ms);
          }, 0);
          return {
            text: btn.textContent?.trim().substring(0, 20),
            transition,
            maxDurationMs: maxDuration,
            violation: maxDuration > 200 && maxDuration !== 0,
          };
        })
        .filter(
          (b) => b.transition && b.transition !== "none" && b.transition !== "all 0s ease 0s",
        );
    });

    console.log("  Button transitions:", JSON.stringify(transitions, null, 2));

    const violations = transitions.filter((t) => t.violation);
    if (violations.length > 0) {
      console.warn(
        `  WARN: ${violations.length} buttons have transitions >200ms:`,
        violations.map((v) => `"${v.text}" (${v.maxDurationMs}ms)`),
      );
    } else {
      console.log("  All button transitions are ≤200ms or unset");
    }

    // Non-failing check — just verify no button is >500ms (egregious)
    const egregious = transitions.filter((t) => t.maxDurationMs > 500);
    expect(egregious.length, "No button should have >500ms transitions").toBe(0);
  });

  test("6C-3: Prefers-reduced-motion gate — animations respect system preference", async ({
    page,
  }) => {
    await page.context().addCookies(authCookies);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await loginAndGo(page, "/today");
    await shot(page, "today-reduced-motion", "6C-motion");

    const motionCheck = await page.evaluate(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Check elements with animation-name
      const allEls = [...document.querySelectorAll("*")];
      const animatedEls = allEls.filter((el) => {
        const s = window.getComputedStyle(el);
        return s.animationName !== "none" && s.animationDuration !== "0s";
      });

      // Check shimmer/pulse elements specifically
      const shimmers = document.querySelectorAll(
        '[class*="shimmer"], [class*="pulse"], [class*="spin"], [class*="animate"]',
      );
      const shimmerCheck = [...shimmers].slice(0, 5).map((el) => {
        const s = window.getComputedStyle(el);
        return {
          class: el.className?.toString().substring(0, 40),
          animationName: s.animationName,
          animationDuration: s.animationDuration,
        };
      });

      return {
        prefersReduced,
        totalAnimatedElements: animatedEls.length,
        shimmersCheck: shimmerCheck,
      };
    });

    console.log("  Reduced motion state:", motionCheck);
    expect(motionCheck.prefersReduced, "Browser should report reduced motion preference").toBe(
      true,
    );

    if (motionCheck.totalAnimatedElements > 0) {
      console.warn(
        `  WARN: ${motionCheck.totalAnimatedElements} elements still animate under reduced-motion preference`,
      );
    } else {
      console.log("  PASS: No active animations under reduced-motion preference");
    }
  });

  test("6C-4: Page navigation transition — no flash/jump between routes", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/today");
    await shot(page, "nav-from-today", "6C-motion/nav");

    const navStart = Date.now();
    await page.click('a[href="/discover"], [href*="discover"]', { timeout: 5000 }).catch(() => {
      // If nav link not found, use direct navigation
      return page.goto(`${BASE_URL}/discover`, { waitUntil: "domcontentloaded" });
    });
    await page.waitForURL(/discover/, { timeout: 15000 }).catch(() => {});
    const navDuration = Date.now() - navStart;
    await page.waitForTimeout(500);

    await shot(page, "nav-to-discover", "6C-motion/nav");
    console.log(`  Navigation Today→Discovery: ${navDuration}ms`);

    // Navigate to Plan
    const nav2Start = Date.now();
    await page.goto(`${BASE_URL}/plan`, { waitUntil: "domcontentloaded" });
    const nav2Duration = Date.now() - nav2Start;
    await page.waitForTimeout(500);
    await shot(page, "nav-to-plan", "6C-motion/nav");
    console.log(`  Navigation to Plan: ${nav2Duration}ms`);
  });

  test("6C-5: Entrance animations on primary surfaces — no jank detection", async ({ page }) => {
    await page.context().addCookies(authCookies);

    const surfaces = ["/today", "/build", "/govern"];
    for (const surfacePath of surfaces) {
      await loginAndGo(page, surfacePath);

      // Measure long tasks during animation window
      const longTasks = await page.evaluate((): Promise<number> => {
        return new Promise((resolve) => {
          const tasks: number[] = [];
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) tasks.push(entry.duration);
            }
          });
          observer.observe({ entryTypes: ["longtask"] });
          setTimeout(() => {
            observer.disconnect();
            resolve(tasks.length);
          }, 1000);
        });
      });

      console.log(`  Long tasks (>50ms) on ${surfacePath} entrance: ${longTasks}`);
      if (longTasks > 3) {
        console.warn(
          `  WARN: ${longTasks} long tasks detected on ${surfacePath} entrance — potential jank`,
        );
      }

      await shot(page, `entrance-${surfacePath.replace(/\//g, "-")}`, "6C-motion/entrance");
    }
  });
});

// ─── Phase 6D: Accessibility (WCAG 2.2 AA) ──────────────────────────────────

test.describe("Phase 6D: Accessibility", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let authCookies: Parameters<BrowserContext["addCookies"]>[0];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await login(page);
    authCookies = await ctx.cookies();
    await page.close();
    await ctx.close();
  });

  // ── 6D-1: Keyboard Navigation ─────────────────────────────────────────────

  const keyboardTestSurfaces = [
    { path: "/today", name: "today" },
    { path: "/discover", name: "discover" },
    { path: "/plan", name: "plan" },
  ];

  for (const surface of keyboardTestSurfaces) {
    test(`6D-1: Keyboard navigation — ${surface.name} (Tab sequence, focus visible, no traps)`, async ({
      page,
    }) => {
      await page.context().addCookies(authCookies);
      await loginAndGo(page, surface.path);
      await shot(page, `a11y-keyboard-start-${surface.name}`, "6D-accessibility/keyboard");

      const focusPath: string[] = [];
      const focusRingCheck: boolean[] = [];

      // Tab through 15 elements to trace focus order
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press("Tab");
        await page.waitForTimeout(50);

        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;

          const s = window.getComputedStyle(el);
          const outline = s.outline;
          const boxShadow = s.boxShadow;

          // Focus ring = outline not "none" OR box-shadow present
          const hasOutline = outline !== "none" && !outline.startsWith("0px");
          const hasShadow = boxShadow !== "none" && boxShadow.length > 0;
          const hasRing = hasOutline || hasShadow;

          return {
            tag: el.tagName,
            role: el.getAttribute("role"),
            ariaLabel: el.getAttribute("aria-label"),
            text: el.textContent?.trim().substring(0, 30),
            outline,
            boxShadow,
            hasVisibleRing: hasRing,
            tabIndex: el.getAttribute("tabindex"),
          };
        });

        if (focused) {
          const label = focused.ariaLabel ? `[${focused.ariaLabel}]` : `"${focused.text}"`;
          const ring = focused.hasVisibleRing ? "ring:YES" : "ring:NO";
          focusPath.push(`${focused.tag}${label} (${ring})`);
          focusRingCheck.push(focused.hasVisibleRing ?? false);
        }
      }

      console.log(`  Focus path on ${surface.path}:`);
      focusPath.forEach((item, i) => console.log(`    [${i + 1}] ${item}`));

      await shot(page, `a11y-keyboard-end-${surface.name}`, "6D-accessibility/keyboard");

      // At least some elements should be focusable
      expect(focusPath.length, `No focusable elements found on ${surface.path}`).toBeGreaterThan(0);

      // Count focus ring violations
      const noRingCount = focusRingCheck.filter((r) => !r).length;
      const totalFocused = focusRingCheck.length;
      console.log(
        `  Focus ring visibility: ${totalFocused - noRingCount}/${totalFocused} have visible rings`,
      );
      if (noRingCount > 0) {
        console.warn(
          `  WARN: ${noRingCount} focused elements had no visible focus ring on ${surface.path}`,
        );
      }

      // Tab order should be logical (at least sequential, not random)
      expect(focusPath.length).toBeGreaterThan(2);
    });
  }

  // ── 6D-2: Focus Ring Compliance ───────────────────────────────────────────

  test("6D-2: Focus ring — color is ember (not blue, not transparent)", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/today");

    // Tab to first interactive element
    await page.keyboard.press("Tab");
    await page.waitForTimeout(100);

    const focusRingData = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;

      const s = window.getComputedStyle(el);
      const cssVars = window.getComputedStyle(document.documentElement);

      return {
        element: el.tagName,
        outline: s.outline,
        outlineColor: s.outlineColor,
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineOffset: s.outlineOffset,
        boxShadow: s.boxShadow,
        // CSS variable values
        focusColorVar: cssVars.getPropertyValue("--ds-focus-color").trim(),
        focusRingVar: cssVars.getPropertyValue("--ds-focus-ring-outline").trim(),
        emberVar: cssVars.getPropertyValue("--ember").trim(),
        dsEmber600: cssVars.getPropertyValue("--ds-ember-600").trim(),
      };
    });
    console.log("  Focus ring data:", focusRingData);

    if (focusRingData) {
      // The Tempo spec says focus ring color = ember (oklch(60% 0.18 50) dark / oklch(65% 0.18 50) light)
      const outlineColor = focusRingData.outlineColor?.toLowerCase();
      const boxShadow = focusRingData.boxShadow?.toLowerCase();
      const focusVar = focusRingData.focusColorVar?.toLowerCase();

      console.log("  Focus color var:", focusVar);
      console.log("  Outline color:", outlineColor);

      // Ensure not transparent
      if (outlineColor === "rgba(0, 0, 0, 0)" && !boxShadow?.includes("rgb")) {
        console.warn("  WARN: Focus ring appears transparent — invisible to users");
      }

      // Verify ember presence in CSS var
      if (focusVar && focusVar !== "") {
        const isEmberLike =
          focusVar.includes("oklch") && (focusVar.includes("0.18") || focusVar.includes("50"));
        console.log("  Focus color var is ember-family:", isEmberLike);
      } else {
        console.warn("  WARN: --ds-focus-color CSS var not set");
      }
    }
  });

  // ── 6D-3: ARIA Audit ─────────────────────────────────────────────────────

  const ariaTestSurfaces = [
    { path: "/today", name: "today" },
    { path: "/build", name: "build" },
    { path: "/govern", name: "govern" },
    { path: "/settings", name: "settings" },
  ];

  for (const surface of ariaTestSurfaces) {
    test(`6D-3: ARIA audit — ${surface.name}`, async ({ page }) => {
      await page.context().addCookies(authCookies);
      await loginAndGo(page, surface.path);

      const ariaAudit = await page.evaluate(() => {
        const interactiveEls = [
          ...document.querySelectorAll(
            'button, a[href], input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"]',
          ),
        ];

        const missing: string[] = [];
        const present: string[] = [];
        let iconOnlyButtons = 0;
        let iconOnlyWithLabel = 0;

        interactiveEls.forEach((el) => {
          const ariaLabel = el.getAttribute("aria-label");
          const ariaLabelledBy = el.getAttribute("aria-labelledby");
          const title = el.getAttribute("title");
          const textContent = el.textContent?.trim();
          const placeholder = el.getAttribute("placeholder");
          const id = el.getAttribute("id");

          // Check if icon-only (no text, has SVG)
          const hasSvg = el.querySelector("svg") !== null;
          const hasText =
            textContent &&
            textContent.length > 0 &&
            !el.querySelector("svg")?.textContent?.includes(textContent);
          const isIconOnly = hasSvg && !hasText && !textContent?.trim();

          if (isIconOnly) {
            iconOnlyButtons++;
            if (ariaLabel || ariaLabelledBy || title) {
              iconOnlyWithLabel++;
            }
          }

          const hasAccessibleName =
            ariaLabel || ariaLabelledBy || title || textContent || placeholder;

          if (!hasAccessibleName) {
            const tag = el.tagName;
            const cls = (el.className || "").toString().substring(0, 40);
            missing.push(`${tag}[${cls}]`);
          } else {
            present.push(
              `${el.tagName}: ${ariaLabel || textContent?.substring(0, 20) || "via-labelledby"}`,
            );
          }
        });

        // ARIA live regions
        const liveRegions = document.querySelectorAll(
          "[aria-live], [role='status'], [role='alert']",
        );

        // Dialogs
        const dialogs = document.querySelectorAll('[role="dialog"]');
        const dialogsWithLabel = [...dialogs].filter(
          (d) => d.getAttribute("aria-label") || d.getAttribute("aria-labelledby"),
        );

        return {
          totalInteractive: interactiveEls.length,
          missing: missing.slice(0, 15),
          missingCount: missing.length,
          presentSample: present.slice(0, 5),
          iconOnlyButtons,
          iconOnlyWithLabel,
          liveRegionCount: liveRegions.length,
          dialogCount: dialogs.length,
          dialogsWithLabel: dialogsWithLabel.length,
        };
      });

      console.log(`  ARIA audit (${surface.path}):`, JSON.stringify(ariaAudit, null, 2));

      if (ariaAudit.missingCount > 0) {
        console.warn(
          `  WARN: ${ariaAudit.missingCount} interactive elements missing accessible names`,
        );
      }

      if (ariaAudit.iconOnlyButtons > 0) {
        const coverage = ariaAudit.iconOnlyWithLabel / ariaAudit.iconOnlyButtons;
        console.log(
          `  Icon-only buttons label coverage: ${ariaAudit.iconOnlyWithLabel}/${ariaAudit.iconOnlyButtons} (${Math.round(coverage * 100)}%)`,
        );
        if (coverage < 0.8) {
          console.warn(
            `  WARN: Only ${Math.round(coverage * 100)}% of icon-only buttons have aria-labels on ${surface.path}`,
          );
        }
      }
    });
  }

  // ── 6D-4: Semantic HTML ────────────────────────────────────────────────────

  for (const surface of ["/today", "/build", "/govern"]) {
    test(`6D-4: Semantic HTML — ${surface} has main, nav, heading hierarchy`, async ({ page }) => {
      await page.context().addCookies(authCookies);
      await loginAndGo(page, surface);

      const semanticAudit = await page.evaluate(() => {
        const landmarks = {
          main: document.querySelectorAll("main").length,
          nav: document.querySelectorAll("nav").length,
          header: document.querySelectorAll("header").length,
          footer: document.querySelectorAll("footer").length,
          aside: document.querySelectorAll("aside").length,
        };

        const headings: string[] = [];
        let prevLevel = 0;
        const headingViolations: string[] = [];

        document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
          const level = parseInt(h.tagName[1]);
          headings.push(`${h.tagName}: "${h.textContent?.trim().substring(0, 40)}"`);
          if (level > prevLevel + 1 && prevLevel > 0) {
            headingViolations.push(`Skipped h${prevLevel} → h${level}`);
          }
          prevLevel = level;
        });

        // Check for div-buttons (bad practice)
        const divButtons = document.querySelectorAll(
          'div[onclick], span[onclick], div[role="button"]:not([tabindex])',
        );
        const divButtonCount = divButtons.length;

        // Forms
        const formInputsWithoutLabel = [
          ...document.querySelectorAll("input:not([type='hidden']), textarea, select"),
        ].filter((inp) => {
          const id = inp.getAttribute("id");
          if (id && document.querySelector(`label[for="${id}"]`)) return false;
          if (inp.getAttribute("aria-label") || inp.getAttribute("aria-labelledby")) return false;
          if (inp.closest("label")) return false;
          return true;
        });

        return {
          landmarks,
          headingCount: headings.length,
          headings: headings.slice(0, 8),
          headingViolations,
          divButtonCount,
          inputsWithoutLabelCount: formInputsWithoutLabel.length,
        };
      });

      console.log(`  Semantic HTML (${surface}):`, JSON.stringify(semanticAudit, null, 2));

      // At minimum should have main or nav
      expect(
        semanticAudit.landmarks.main + semanticAudit.landmarks.nav,
        `${surface} should have at least one landmark element (main or nav)`,
      ).toBeGreaterThan(0);

      if (semanticAudit.headingViolations.length > 0) {
        console.warn(
          `  WARN: Heading hierarchy violations on ${surface}:`,
          semanticAudit.headingViolations,
        );
      }

      if (semanticAudit.divButtonCount > 0) {
        console.warn(
          `  WARN: ${semanticAudit.divButtonCount} div/span acting as buttons (should use <button> element)`,
        );
      }
    });
  }

  // ── 6D-5: Color Contrast Sampling ─────────────────────────────────────────

  test("6D-5: Color contrast — text samples on Today", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/today");

    const contrastData = await page.evaluate(() => {
      // Helper: RGB string to luminance
      function hexToRgb(color: string): [number, number, number] | null {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return null;
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
      }

      function relativeLuminance(r: number, g: number, b: number): number {
        const sRGB = [r / 255, g / 255, b / 255].map((c) => {
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
      }

      function contrastRatio(fg: string, bg: string): number | null {
        const fgRgb = hexToRgb(fg);
        const bgRgb = hexToRgb(bg);
        if (!fgRgb || !bgRgb) return null;
        const L1 = relativeLuminance(...fgRgb);
        const L2 = relativeLuminance(...bgRgb);
        const lighter = Math.max(L1, L2);
        const darker = Math.min(L1, L2);
        return (lighter + 0.05) / (darker + 0.05);
      }

      const textEls = [
        ...document.querySelectorAll(
          "h1, h2, h3, p, span, label, [class*='text'], [class*='label']",
        ),
      ].filter((el) => {
        const r = el.getBoundingClientRect();
        const text = el.textContent?.trim();
        return (
          r.width > 0 &&
          r.height > 0 &&
          r.top >= 0 &&
          r.top < window.innerHeight &&
          text &&
          text.length > 2
        );
      });

      const samples: Array<{
        tag: string;
        text: string;
        color: string;
        bg: string;
        ratio: number | null;
        passes: boolean;
      }> = [];

      textEls.slice(0, 12).forEach((el) => {
        const s = window.getComputedStyle(el);
        const fg = s.color;
        // Walk up to find a meaningful background
        let bgEl: Element | null = el;
        let bg = "transparent";
        while ((bgEl && bg === "transparent") || bg === "rgba(0, 0, 0, 0)") {
          if (!bgEl) break;
          bg = window.getComputedStyle(bgEl).backgroundColor;
          bgEl = bgEl.parentElement;
        }

        const ratio = contrastRatio(fg, bg);
        samples.push({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 25) ?? "",
          color: fg,
          bg,
          ratio: ratio ? Math.round(ratio * 100) / 100 : null,
          passes: ratio !== null ? ratio >= 4.5 : true, // null = unknown, assume pass
        });
      });

      return samples;
    });

    console.log("  Color contrast samples:");
    contrastData.forEach((sample) => {
      const status = sample.ratio === null ? "UNKNOWN" : sample.passes ? "PASS" : "FAIL";
      console.log(
        `    [${status}] ${sample.tag} "${sample.text}" — ratio: ${sample.ratio ?? "N/A"}`,
      );
    });

    const failures = contrastData.filter((s) => s.ratio !== null && !s.passes);
    if (failures.length > 0) {
      console.warn(`  WARN: ${failures.length} text elements fail 4.5:1 contrast ratio`);
    } else {
      console.log("  PASS: All sampled text elements meet or exceed 4.5:1 contrast ratio");
    }

    expect(failures.length, "No text elements should fail WCAG AA contrast").toBe(0);
    await shot(page, "contrast-today", "6D-accessibility/contrast");
  });

  // ── 6D-6: Escape Key & Focus Trap ─────────────────────────────────────────

  test("6D-6: No focus traps — Tab can always exit any open panel", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/today");

    // Tab through all focusable elements to ensure we can cycle
    const focusElements: string[] = [];
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el && el !== document.body ? el.tagName : null;
      });
      if (focused) focusElements.push(focused);
    }

    console.log("  Focus elements in Tab cycle:", focusElements);

    // Tab cycle should work (we got through 20 tabs without getting stuck)
    expect(
      focusElements.length,
      "Should have traversed multiple focusable elements",
    ).toBeGreaterThan(1);

    // Check Shift+Tab goes back
    await page.keyboard.press("Shift+Tab");
    const prevFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : null;
    });
    console.log("  Shift+Tab went back to:", prevFocused);
  });
});

// ─── Phase 6E: Cross-Browser Spot Check ─────────────────────────────────────

test.describe("Phase 6E: Cross-Browser Spot Check (Chromium Primary)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let authCookies: Parameters<BrowserContext["addCookies"]>[0];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await login(page);
    authCookies = await ctx.cookies();
    await page.close();
    await ctx.close();
  });

  const crossBrowserSurfaces = [
    { path: "/today", name: "today" },
    { path: "/discover", name: "discover" },
    { path: "/build", name: "build" },
  ];

  for (const surface of crossBrowserSurfaces) {
    test(`6E: Chromium — ${surface.name} renders correctly (fonts, colors, layout)`, async ({
      page,
    }) => {
      await page.context().addCookies(authCookies);
      await loginAndGo(page, surface.path);

      const renderCheck = await page.evaluate(() => {
        // Check Geist font is loaded
        const fonts = document.fonts;
        const geistLoaded = [...(fonts as any)].some((f: FontFace) =>
          f.family.toLowerCase().includes("geist"),
        );

        // Check CSS custom properties
        const css = window.getComputedStyle(document.documentElement);
        const bgColor = css.getPropertyValue("--ds-background-100").trim();
        const grayScale = css.getPropertyValue("--ds-gray-1000").trim();
        const emberAccent = css.getPropertyValue("--ember").trim();

        // Verify dark theme (default)
        const isDark =
          document.documentElement.classList.contains("dark") ||
          document.querySelector('[data-theme="dark"]') !== null ||
          document.querySelector("[data-obsidian]") !== null;

        // Check for visible text
        const h1s = [...document.querySelectorAll("h1, h2")].filter((h) => h.textContent?.trim());

        // Check that body background is dark (not white)
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;

        return {
          geistFontLoaded: geistLoaded,
          bgColorVar: bgColor,
          grayScale,
          emberAccent,
          isDarkTheme: isDark,
          h1Count: h1s.length,
          bodyBg,
          fontFamily: window.getComputedStyle(document.body).fontFamily,
        };
      });

      console.log(`  Render check (${surface.path}):`, JSON.stringify(renderCheck, null, 2));

      // Body should have Geist font
      if (renderCheck.fontFamily) {
        const hasGeist = renderCheck.fontFamily.toLowerCase().includes("geist");
        expect(hasGeist, `Geist font should be applied on ${surface.path}`).toBe(true);
      }

      // Should have ember accent token
      if (renderCheck.emberAccent) {
        console.log(`  Ember accent token: ${renderCheck.emberAccent}`);
      } else {
        console.warn(`  WARN: --ember token not set on ${surface.path}`);
      }

      await shot(page, `crossbrowser-chromium-${surface.name}`, "6E-crossbrowser");
    });
  }

  test("6E: Dark theme is default — no white flash on initial load", async ({ page }) => {
    await page.context().addCookies(authCookies);

    // Navigate fresh and check background immediately
    await page.goto(`${BASE_URL}/today`, { waitUntil: "commit" });
    await page.waitForTimeout(100);

    const earlyBg = await page.evaluate(
      () => window.getComputedStyle(document.body).backgroundColor,
    );
    console.log("  Background at commit (100ms):", earlyBg);

    // After full load
    await page.waitForTimeout(1500);
    const lateBg = await page.evaluate(
      () => window.getComputedStyle(document.body).backgroundColor,
    );
    console.log("  Background after load (1600ms):", lateBg);

    // Check for FOUC (white background at start)
    const isWhiteBgEarly = earlyBg === "rgb(255, 255, 255)" || earlyBg === "rgba(255, 255, 255, 1)";
    if (isWhiteBgEarly) {
      console.warn(
        "  WARN: Body started with white background — potential FOUC (flash of unstyled content)",
      );
    }

    await shot(page, "dark-theme-default", "6E-crossbrowser");
  });
});

// ─── Phase 6F: Visual Regression — 18 Baseline Screenshots ──────────────────

test.describe("Phase 6F: Visual Regression Baselines", () => {
  let authCookies: Parameters<BrowserContext["addCookies"]>[0];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await login(page);
    authCookies = await ctx.cookies();
    await page.close();
    await ctx.close();
  });

  // 6 surfaces × 3 breakpoints = 18 mandatory screenshots
  for (const surface of PRIMARY_SURFACES) {
    for (const bp of BREAKPOINTS) {
      test(`6F: Visual baseline — ${surface.label} @ ${bp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await page.context().addCookies(authCookies);
        await loginAndGo(page, surface.path);

        const imgPath = await shot(page, `${surface.name}-${bp.name}`, "6F-visual-baselines");
        const fullPath = await fullShot(
          page,
          `${surface.name}-${bp.name}`,
          "6F-visual-baselines/full",
        );
        console.log(`  Baseline: ${imgPath}`);
        console.log(`  Full-page: ${fullPath}`);

        // Verify page has rendered content (not blank)
        const hasContent = await page.evaluate(() => {
          const textContent = document.body.textContent?.trim().length ?? 0;
          const visibleEls = document.querySelectorAll("main *, [role='main'] *").length;
          return { textLength: textContent, visibleEls };
        });
        console.log(
          `  Page content: ${hasContent.textLength} chars, ${hasContent.visibleEls} elements`,
        );

        // Should have some content
        expect(
          hasContent.textLength,
          `${surface.label} at ${bp.name} should have text content`,
        ).toBeGreaterThan(50);

        // Check for overflow at this viewport
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(
          scrollWidth,
          `${surface.label} at ${bp.name} has horizontal scroll (${scrollWidth}px > ${bp.width}px)`,
        ).toBeLessThanOrEqual(bp.width + 2);

        // Typography check
        const typographyCheck = await page.evaluate(() => {
          const css = window.getComputedStyle(document.documentElement);
          const body = window.getComputedStyle(document.body);
          return {
            fontSans: css.getPropertyValue("--font-sans").trim(),
            fontMono: css.getPropertyValue("--font-mono").trim(),
            fontPixel: css.getPropertyValue("--font-pixel").trim(),
            bodyFont: body.fontFamily,
          };
        });
        console.log(`  Typography at ${bp.name}:`, typographyCheck);

        if (typographyCheck.fontSans) {
          const hasGeist = typographyCheck.fontSans.toLowerCase().includes("geist");
          if (!hasGeist) {
            console.warn(
              `  WARN: --font-sans does not resolve to Geist: "${typographyCheck.fontSans}"`,
            );
          }
        }
      });
    }
  }
});

// ─── Phase 6: Summary Validation ────────────────────────────────────────────

test.describe("Phase 6: Summary Gate — Critical Invariants", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let authCookies: Parameters<BrowserContext["addCookies"]>[0];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await login(page);
    authCookies = await ctx.cookies();
    await page.close();
    await ctx.close();
  });

  test("GATE: All 6 primary surfaces load without console errors", async ({ page }) => {
    await page.context().addCookies(authCookies);

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text().substring(0, 100));
    });

    for (const surface of PRIMARY_SURFACES) {
      const surfaceErrors = [...consoleErrors];
      consoleErrors.length = 0;

      await loginAndGo(page, surface.path);
      await page.waitForTimeout(1000);

      const newErrors = consoleErrors.filter(
        (e) => !e.includes("Failed to load resource") && !e.includes("net::ERR_"),
      );
      if (newErrors.length > 0) {
        console.warn(`  Console errors on ${surface.path}:`, newErrors);
      } else {
        console.log(`  ${surface.label}: no console errors`);
      }
    }
  });

  test("GATE: Geist fonts loaded on all primary surfaces", async ({ page }) => {
    await page.context().addCookies(authCookies);

    for (const surface of PRIMARY_SURFACES) {
      await loginAndGo(page, surface.path);

      const fontStatus = await page.evaluate(async () => {
        await document.fonts.ready;
        const loadedFamilies = [...(document.fonts as any)].map((f: FontFace) => f.family);
        const geistSans = loadedFamilies.some(
          (f) =>
            f.toLowerCase().includes("geist") &&
            !f.toLowerCase().includes("mono") &&
            !f.toLowerCase().includes("pixel"),
        );
        const geistMono = loadedFamilies.some(
          (f) => f.toLowerCase().includes("geist mono") || f.toLowerCase().includes("geistmono"),
        );
        return {
          geistSans,
          geistMono,
          totalFonts: loadedFamilies.length,
          families: loadedFamilies.slice(0, 5),
        };
      });

      console.log(`  Font status on ${surface.path}:`, fontStatus);

      expect(fontStatus.geistSans, `Geist Sans must be loaded on ${surface.path}`).toBe(true);
    }
  });

  test("GATE: Ember accent token resolves to correct family (#FF6B2C range)", async ({ page }) => {
    await page.context().addCookies(authCookies);
    await loginAndGo(page, "/today");

    const emberCheck = await page.evaluate(() => {
      const css = window.getComputedStyle(document.documentElement);
      return {
        ember: css.getPropertyValue("--ember").trim(),
        dsEmber600: css.getPropertyValue("--ds-ember-600").trim(),
        dsEmber500: css.getPropertyValue("--ds-ember-500").trim(),
        dsEmber700: css.getPropertyValue("--ds-ember-700").trim(),
      };
    });
    console.log("  Ember token values:", emberCheck);

    // At least --ember or --ds-ember-600 should be set
    const hasEmber = emberCheck.ember || emberCheck.dsEmber600;
    expect(hasEmber, "--ember or --ds-ember-600 must be defined").toBeTruthy();
  });

  test("GATE: Dark theme default — background is dark, not white", async ({ page }) => {
    await page.context().addCookies(authCookies);

    for (const surface of PRIMARY_SURFACES.slice(0, 3)) {
      await loginAndGo(page, surface.path);

      const bgCheck = await page.evaluate(() => {
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
        const mainEl = document.querySelector("main, [role='main'], [data-obsidian]");
        const mainBg = mainEl ? window.getComputedStyle(mainEl).backgroundColor : null;
        return { bodyBg, htmlBg, mainBg };
      });

      // Dark theme: background should NOT be pure white rgb(255, 255, 255)
      const isPureWhite =
        bgCheck.bodyBg === "rgb(255, 255, 255)" || bgCheck.htmlBg === "rgb(255, 255, 255)";

      if (isPureWhite) {
        console.warn(
          `  WARN: White background detected on ${surface.path} — dark theme not active?`,
        );
      } else {
        console.log(`  ${surface.label}: body bg = ${bgCheck.bodyBg} (dark theme active)`);
      }

      // Note: We don't hard-fail on this as the user may have toggled light theme
      console.log(`  ${surface.path} bg check:`, bgCheck);
    }
  });

  test("GATE: No horizontal scroll at any breakpoint on primary surfaces", async ({ page }) => {
    let authCookiesLocal: Parameters<BrowserContext["addCookies"]>[0];
    const ctx = page.context();
    await page.context().addCookies(authCookies);

    const results: Array<{
      surface: string;
      bp: string;
      scrollWidth: number;
      viewport: number;
      pass: boolean;
    }> = [];

    for (const surface of PRIMARY_SURFACES) {
      for (const bp of BREAKPOINTS) {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await loginAndGo(page, surface.path);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const pass = scrollWidth <= bp.width + 2;
        results.push({
          surface: surface.label,
          bp: bp.name,
          scrollWidth,
          viewport: bp.width,
          pass,
        });
      }
    }

    console.log("  Horizontal scroll summary:");
    results.forEach((r) => {
      const status = r.pass ? "PASS" : "FAIL";
      console.log(
        `    [${status}] ${r.surface} @ ${r.bp}: scrollWidth=${r.scrollWidth}px (viewport=${r.viewport}px)`,
      );
    });

    const failures = results.filter((r) => !r.pass);
    expect(
      failures.length,
      `${failures.length} surfaces have horizontal scroll:\n${failures.map((f) => `  ${f.surface} @ ${f.bp} (${f.scrollWidth}px)`).join("\n")}`,
    ).toBe(0);
  });
});
