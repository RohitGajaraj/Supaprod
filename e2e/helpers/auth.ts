/**
 * Auth and artifact helpers for the browser suite.
 *
 * READ THIS BEFORE TRUSTING THE `beforeAll` BLOCKS. Eight of the nine specs in
 * this folder open with the same pattern: log in on a throwaway page, call
 * `context.cookies()`, stash the result, and replay it per test with
 * `addCookies`. That mechanism has never carried a session.
 * `src/integrations/supabase/client.ts` builds the client with
 * `auth: { storage: localStorage, persistSession: true }` — the session is a
 * `localStorage` entry, and `context.cookies()` cannot see it. `addCookies`
 * restores nothing.
 *
 * It has stayed invisible because every one of those tests follows the replay
 * with `if (page.url().includes('/login')) await login(page)`. That fallback
 * silently does the entire job, so the suite works but pays a full interactive
 * login per test instead of once per file, and the `beforeAll` is decoration.
 *
 * NOT FIXED HERE ON PURPOSE. The right fix is a `storageState` setup project in
 * `playwright.config.ts`, which is the Playwright-wiring lane's work; a
 * half-migration in this file would collide with it. Reported instead.
 */
import { expect, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

export const DEMO_EMAIL = "demo@redcadence.app";
export const DEMO_PASSWORD = "Cadence!Demo2026";
export const BASE_URL = "http://localhost:8080";

/**
 * REPO ROOT, DISCOVERED — never a path typed by hand.
 *
 * This constant used to be an absolute path into
 * `…/My Builds/cadence-lane-4/test-results/screenshots`. That worktree was
 * deleted on 2026-08-03 and the constant pointed at nothing for a week, which
 * nobody noticed because `ensureScreenshotDir` calls `mkdirSync(…, {recursive:
 * true})` — so every run CREATED the dead tree and wrote into it. A hardcoded
 * absolute path does not fail, it succeeds somewhere you are not looking.
 *
 * Walking up from `cwd` rather than using `__dirname`/`import.meta.url` is
 * deliberate: those two are not interchangeable across CJS and ESM, this
 * package is `"type": "module"`, and the suite cannot be run right now to find
 * out which one the loader hands us. Walking for a marker works under either.
 * It THROWS when it cannot find the root, because the whole lesson here is that
 * a silent fallback is how a path goes stale for a week.
 */
export function findRepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "playwright.config.ts")) &&
      fs.existsSync(path.join(dir, "e2e", "helpers", "auth.ts"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    `[e2e] Could not locate the repo root by walking up from ${process.cwd()}. ` +
      `Run Playwright from inside the checkout. Refusing to guess a screenshot ` +
      `path — the last hardcoded one pointed at a deleted worktree for a week.`,
  );
}

/**
 * `docs/screenshots/` is the repo's one home for visual artifacts and it is
 * gitignored (`.gitignore` §"Local screenshots / visual artifacts"), so nothing
 * written here can be committed by accident — which is the rule in CLAUDE.md
 * that these files most often break. `e2e/` scopes the run's output so it never
 * collides with hand-taken screenshots.
 */
export const SCREENSHOT_DIR = path.join(findRepoRoot(), "docs", "screenshots", "e2e");

/**
 * Where the one signed-in session for the whole run is parked.
 *
 * Under `test-results/`, which is already gitignored, and derived from the
 * repo root for the same reason SCREENSHOT_DIR is: a hardcoded absolute path
 * here is what pointed this suite at a deleted worktree for a week.
 *
 * Written by `e2e/auth.setup.ts` and consumed by every project through
 * `storageState` in playwright.config.ts. It holds localStorage as well as
 * cookies, which is the whole point: the Supabase session lives in
 * localStorage, so the cookie replay this file's header describes could never
 * have carried it.
 */
export const STORAGE_STATE = path.join(findRepoRoot(), "test-results", "storage-state.json");

export async function ensureScreenshotDir(subDir?: string) {
  const dir = subDir ? path.join(SCREENSHOT_DIR, subDir) : SCREENSHOT_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function login(page: Page): Promise<boolean> {
  await page.goto("/login", { waitUntil: "networkidle" });

  // Wait for the login form
  const emailInput = page
    .locator('input[type="email"], input[name="email"], [data-testid="email-input"]')
    .first();
  const passwordInput = page
    .locator('input[type="password"], input[name="password"], [data-testid="password-input"]')
    .first();

  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.fill(DEMO_EMAIL);
  await passwordInput.fill(DEMO_PASSWORD);

  // Submit
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();

  // Wait for redirect away from login
  try {
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Waits for the authenticated shell to be on screen.
 *
 * `AppFrame` renders `<main className="sp-work">` (src/components/shell/
 * AppFrame.tsx), so `main` being visible is the observable "this surface has
 * actually rendered" — the condition several tests used to approximate with a
 * fixed sleep after `goto`.
 */
export async function waitForShell(page: Page, timeout = 15_000): Promise<void> {
  await expect(page.locator("main").first()).toBeVisible({ timeout });
}

export async function takeScreenshot(page: Page, name: string, subDir?: string): Promise<string> {
  const dir = await ensureScreenshotDir(subDir);
  const filePath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

export async function takeFullPageScreenshot(
  page: Page,
  name: string,
  subDir?: string,
): Promise<string> {
  const dir = await ensureScreenshotDir(subDir);
  const filePath = path.join(dir, `${name}-full.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}
