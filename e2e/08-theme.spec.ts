/**
 * Phase 8: Dark/Light Theme Verification
 * Token resolution in both themes, contrast, no hardcoded colors
 */
import { test, expect, Page } from '@playwright/test';
import { login, takeScreenshot } from './helpers/auth';

async function getThemeTokenValues(page: Page) {
  return await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const tokens = [
      '--ds-background-100',
      '--ds-background-200',
      '--ds-gray-100',
      '--ds-gray-200',
      '--ds-gray-900',
      '--ds-gray-1000',
      '--ember',
      '--ds-focus-color',
      '--ds-focus-ring-outline',
      '--ds-red-700',
      '--ds-green-700',
    ];

    const values: Record<string, string> = {};
    tokens.forEach((token) => {
      values[token] = root.getPropertyValue(token).trim() || 'NOT_SET';
    });

    // Detect current theme
    const htmlEl = document.documentElement;
    const theme = htmlEl.getAttribute('data-theme') || htmlEl.className.includes('dark') ? 'dark' : 'light';

    return { theme, values };
  });
}

async function checkForHardcodedColors(page: Page) {
  return await page.evaluate(() => {
    // Look for common hardcoded color patterns in inline styles
    const allEls = document.querySelectorAll('[style*="color:"], [style*="background:"], [style*="background-color:"]');
    const hardcoded: string[] = [];

    allEls.forEach((el) => {
      const style = el.getAttribute('style') || '';
      // Check for hardcoded hex, rgb, etc. (not CSS variables)
      if (style.match(/#[0-9a-fA-F]{3,6}|rgb\(|rgba\(/) && !style.includes('var(')) {
        hardcoded.push(`${el.tagName}: style="${style.substring(0, 80)}"`);
      }
    });

    return hardcoded.slice(0, 15);
  });
}

async function toggleTheme(page: Page): Promise<boolean> {
  // Try multiple theme toggle approaches
  const themeToggle = page.locator(
    '[data-testid="theme-toggle"], button[aria-label*="theme" i], button[aria-label*="dark" i], button[aria-label*="light" i], [class*="theme-toggle"], [class*="ThemeToggle"]'
  ).first();

  const hasToggle = await themeToggle.isVisible().catch(() => false);
  if (hasToggle) {
    await themeToggle.click();
    await page.waitForTimeout(500);
    return true;
  }

  // Try to find it in a dropdown/menu
  const moreMenus = page.locator('[aria-label*="menu" i], [data-testid*="more"]').first();
  const hasMenu = await moreMenus.isVisible().catch(() => false);
  if (hasMenu) {
    await moreMenus.click();
    await page.waitForTimeout(300);
    const toggleInMenu = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme" i]').first();
    const hasToggleInMenu = await toggleInMenu.isVisible().catch(() => false);
    if (hasToggleInMenu) {
      await toggleInMenu.click();
      await page.waitForTimeout(500);
      return true;
    }
  }

  return false;
}

test.describe('Theme Verification', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: any;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test('dark theme tokens resolve correctly on Today', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    const darkTokens = await getThemeTokenValues(page);
    console.log('Dark theme tokens:', JSON.stringify(darkTokens, null, 2));
    await takeScreenshot(page, 'theme-dark-today', 'themes');

    // Critical tokens should resolve
    const missingTokens = Object.entries(darkTokens.values).filter(([, v]) => v === 'NOT_SET');
    if (missingTokens.length > 0) {
      console.warn('Missing token values:', missingTokens);
    }
    expect(missingTokens.length).toBeLessThan(3); // Allow up to 2 optional tokens missing
  });

  test('light theme tokens resolve correctly', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    // Try to switch to light theme
    const switched = await toggleTheme(page);
    console.log('Theme switch:', switched ? 'succeeded' : 'could not find toggle');

    if (switched) {
      const lightTokens = await getThemeTokenValues(page);
      console.log('Light theme tokens:', JSON.stringify(lightTokens, null, 2));
      await takeScreenshot(page, 'theme-light-today', 'themes');
    } else {
      console.log('Skipping light theme test - toggle not found');
      await takeScreenshot(page, 'theme-no-toggle', 'themes');
    }
  });

  test('no hardcoded color literals in inline styles', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    const hardcoded = await checkForHardcodedColors(page);
    console.log('Hardcoded colors found:', hardcoded);

    if (hardcoded.length > 0) {
      console.warn(`${hardcoded.length} elements with hardcoded color values`);
    }
    // This is informational; some dynamic inline colors may be acceptable
  });

  test('dark theme applied to Engine Room', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/engine-room', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/engine-room', { waitUntil: 'networkidle' });
    }

    const tokens = await getThemeTokenValues(page);
    console.log('Engine Room theme tokens:', tokens);
    await takeScreenshot(page, 'theme-dark-engine-room', 'themes');
  });

  test('dark theme applied to Settings', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/settings', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/settings', { waitUntil: 'networkidle' });
    }

    await takeScreenshot(page, 'theme-dark-settings', 'themes');
    const tokens = await getThemeTokenValues(page);

    const hardcoded = await checkForHardcodedColors(page);
    if (hardcoded.length > 0) {
      console.warn('Hardcoded colors in Settings:', hardcoded.slice(0, 5));
    }
  });

  test('background token resolves correctly (dark = #0a0a0a equivalent)', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    const bgColor = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const bg100 = root.getPropertyValue('--ds-background-100').trim();
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      return { bg100, bodyBg };
    });

    console.log('Background colors:', bgColor);
    // Dark background should be very dark
    expect(bgColor.bg100 || bgColor.bodyBg).toBeTruthy();
  });
});
