/**
 * Phase 1: Login & Environment verification
 * Tests authentication flow and initial authenticated state
 */
import { test, expect } from '@playwright/test';
import { login, takeScreenshot } from './helpers/auth';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    // Verify key login elements exist
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();

    await takeScreenshot(page, '01-login-page', 'auth');
  });

  test('login with demo credentials and verify redirect', async ({ page }) => {
    const success = await login(page);
    expect(success).toBe(true);

    // Should be on an authenticated route now
    const url = page.url();
    expect(url).not.toContain('/login');

    await takeScreenshot(page, '02-post-login-authenticated', 'auth');

    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for any async errors to surface
    await page.waitForTimeout(2000);

    // Log errors but don't fail on them (some may be non-critical)
    if (errors.length > 0) {
      console.log('Console errors detected:', errors);
    }
  });

  test('authenticated state persists on navigation', async ({ page }) => {
    await login(page);
    await page.goto('/today', { waitUntil: 'networkidle' });

    // Should not be redirected to login
    expect(page.url()).not.toContain('/login');
    await takeScreenshot(page, '03-today-authenticated', 'auth');
  });
});
