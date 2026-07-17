import { Page, BrowserContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

export const DEMO_EMAIL = 'demo@redcadence.app';
export const DEMO_PASSWORD = 'Cadence!Demo2026';
export const BASE_URL = 'http://localhost:8080';

export const SCREENSHOT_DIR = path.join(
  '/Users/rohitgajaraj/Projects/My Projects/My Builds/cadence-lane-4',
  'test-results',
  'screenshots'
);

export async function ensureScreenshotDir(subDir?: string) {
  const dir = subDir ? path.join(SCREENSHOT_DIR, subDir) : SCREENSHOT_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function login(page: Page): Promise<boolean> {
  await page.goto('/login', { waitUntil: 'networkidle' });

  // Wait for the login form
  const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="password-input"]').first();

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(DEMO_EMAIL);
  await passwordInput.fill(DEMO_PASSWORD);

  // Submit
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();

  // Wait for redirect away from login
  try {
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
    return true;
  } catch {
    return false;
  }
}

export async function takeScreenshot(
  page: Page,
  name: string,
  subDir?: string
): Promise<string> {
  const dir = await ensureScreenshotDir(subDir);
  const filePath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

export async function takeFullPageScreenshot(
  page: Page,
  name: string,
  subDir?: string
): Promise<string> {
  const dir = await ensureScreenshotDir(subDir);
  const filePath = path.join(dir, `${name}-full.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}
