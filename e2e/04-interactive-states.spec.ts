/**
 * Phase 3: Interactive State Testing
 * Hover, focus, loading, error, empty, disabled states
 */
import { test, expect, Page } from '@playwright/test';
import { login, takeScreenshot } from './helpers/auth';

test.describe('Interactive States - Today', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: any;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test('button hover states on Today', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    await takeScreenshot(page, 'today-default', 'interactive/today');

    // Hover over primary buttons
    const buttons = page.locator('button:visible').all();
    const btns = await buttons;

    if (btns.length > 0) {
      await btns[0].hover();
      await page.waitForTimeout(200); // Allow transition to settle
      await takeScreenshot(page, 'today-button-hover', 'interactive/today');
    }
  });

  test('focus ring visibility on Today - keyboard navigation', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    // Tab through elements to verify focus rings
    await page.keyboard.press('Tab');
    await takeScreenshot(page, 'today-focus-first', 'interactive/today');

    await page.keyboard.press('Tab');
    await takeScreenshot(page, 'today-focus-second', 'interactive/today');

    await page.keyboard.press('Tab');
    await takeScreenshot(page, 'today-focus-third', 'interactive/today');

    // Check that focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        outline: style.outline,
        outlineColor: style.outlineColor,
        boxShadow: style.boxShadow,
      };
    });

    console.log('Focused element state:', focusedElement);
  });

  test('card hover states on Today', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    // Find cards
    const cards = page.locator('[class*="card"], [data-testid*="card"], article').first();
    const isVisible = await cards.isVisible().catch(() => false);

    if (isVisible) {
      await cards.hover();
      await page.waitForTimeout(200);
      await takeScreenshot(page, 'today-card-hover', 'interactive/today');
    }
  });
});

test.describe('Interactive States - Build', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: any;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test('build surface interactive states', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/build', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/build', { waitUntil: 'networkidle' });
    }

    await takeScreenshot(page, 'build-default', 'interactive/build');

    // Tab navigation
    await page.keyboard.press('Tab');
    await takeScreenshot(page, 'build-focus-tab1', 'interactive/build');

    // Check empty state if present
    const emptyState = page.locator('[class*="empty"], [data-testid*="empty"]').first();
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    if (hasEmpty) {
      await takeScreenshot(page, 'build-empty-state', 'interactive/build');
    }
  });

  test('keyboard navigation through Build', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/build', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/build', { waitUntil: 'networkidle' });
    }

    // Tab through 5 elements and log focus
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? { tag: el.tagName, role: el.getAttribute('role'), text: el.textContent?.trim().substring(0, 30) } : null;
      });
      console.log(`Tab ${i + 1}:`, focused);
    }
    await takeScreenshot(page, 'build-keyboard-nav', 'interactive/build');
  });
});

test.describe('Interactive States - Discover', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: any;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test('discover interactive states', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/discover', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/discover', { waitUntil: 'networkidle' });
    }

    await takeScreenshot(page, 'discover-default', 'interactive/discover');

    // Check for search/filter inputs
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.click();
      await takeScreenshot(page, 'discover-search-focus', 'interactive/discover');
      await searchInput.fill('test');
      await takeScreenshot(page, 'discover-search-typed', 'interactive/discover');
    }

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await takeScreenshot(page, 'discover-focus-state', 'interactive/discover');
  });
});

test.describe('Focus Ring Compliance', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: any;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test('focus rings use glacier/blue (not ember)', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    await page.keyboard.press('Tab');

    const focusStyle = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      const cssVars = getComputedStyle(document.documentElement);
      return {
        outline: style.outline,
        outlineColor: style.outlineColor,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
        focusColor: cssVars.getPropertyValue('--ds-focus-color').trim(),
        focusRing: cssVars.getPropertyValue('--ds-focus-ring-outline').trim(),
      };
    });

    console.log('Focus ring styles:', focusStyle);

    // Focus color should be blue/glacier, not ember orange
    if (focusStyle?.focusColor) {
      const color = focusStyle.focusColor.toLowerCase();
      // Should not be an orange/ember color
      const isEmber = color.includes('#ff6b2c') || color.includes('oklch(0.65 0.18 50');
      expect(isEmber).toBe(false);
    }
  });
});
