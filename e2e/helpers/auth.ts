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

/**
 * The account `docs/operations/demo-credentials.md` designates as "the account
 * any agent uses for testing". It is not a secret and it is in a tracked doc, so
 * a default is right here in a way it is not for the password below: a default
 * that names the documented testing account is the entire point of having one.
 *
 * THIS DEFAULT USED TO BE A DISABLED ACCOUNT. It pointed at a `redcadence.app`
 * login that the same doc says is "disabled and must not be used or quoted
 * anywhere" — rotated, `profiles.suspended = true`, since 2026-07-25. The
 * password beside it had already been made to fail loudly when unset, which
 * made this worse rather than better: set the correct password against the dead
 * email and the suite reports "that email or password isn't right", which is
 * indistinguishable from a wrong password and sends the next person hunting the
 * thing that was already fixed. A guard now refuses either retired address
 * anywhere in this folder.
 */
export const DEMO_EMAIL = process.env.E2E_DEMO_EMAIL ?? "harbor@supaprod.ai";

/**
 * THE PASSWORD IS NOT IN THIS FILE, AND IT USED TO BE.
 *
 * A password sat here as a constant until 2026-08-11. Two things were wrong
 * with that and only one of them is obvious.
 *
 * ITS VALUE IS DELIBERATELY NOT REPRODUCED IN THIS COMMENT, and that is not
 * fussiness. `error-context.md` embeds the SOURCE around a failure, and the
 * throw below is inside `demoPassword()` — so Playwright prints these very
 * lines into a failure artifact. An earlier draft of this comment quoted the
 * value, which meant the file that no longer contains the credential still
 * contained the credential, and the fix that stopped the DOM carrying it moved
 * the failure point onto the lines that did. `src/components/landing/
 * Receipts.tsx` reaches the same conclusion for a weaker reason: do not quote
 * the thing the guard exists to keep out.
 *
 * It was STALE. That account was rotated and suspended on 2026-07-25; the row
 * still exists, is confirmed and unbanned, and its `last_sign_in_at` is
 * 2026-07-23 -- two days before the rotation. So the suite could not have
 * authenticated at any point since, and nobody noticed because the suite could
 * not run at all: `@playwright/test` was never installed.
 *
 * It was also a LEAKED SECRET COMMITTED TO SOURCE. That exact pair appears in
 * `docs/pitch/yc/founder-profile-answers.md` in a table of things exposed
 * publicly, under "Live demo credentials in plain text ... v4 README". The
 * rotation WAS the containment. Restoring the constant to make a test pass
 * would have re-exposed a credential that was neutralised on purpose.
 *
 * And this trap has already been sprung twice. `docs/operations/demo-credentials.md`
 * carries a warning saying an agent followed the documented password on
 * 2026-08-03, failed twice, and burned a chunk of a session on it. A second
 * agent hit the identical wall tonight. A fixture with no guard is an
 * assumption with a filename.
 *
 * So the value comes from the environment and its ABSENCE FAILS LOUDLY AND BY
 * NAME. The alternative -- defaulting to a placeholder -- reproduces the exact
 * failure this replaces: 140 tests redirecting to /login with nothing saying
 * why. A rotation now costs an env var, never an edit, and can never again put
 * a live secret in git.
 */
export const DEMO_PASSWORD_ENV = "E2E_DEMO_PASSWORD";

export function demoPassword(): string {
  const value = process.env[DEMO_PASSWORD_ENV];
  if (!value) {
    throw new Error(
      `${DEMO_PASSWORD_ENV} is not set, so the e2e suite cannot sign in.\n` +
        `The password is deliberately NOT in the repo: the previous constant was a ` +
        `credential that leaked publicly and was rotated on 2026-07-25.\n` +
        `Ask the founder for the current demo password and export it:\n` +
        `  export ${DEMO_PASSWORD_ENV}='...'\n` +
        `See docs/operations/demo-credentials.md, which warns that its own ` +
        `documented passwords are stale until a row is re-verified and re-dated.`,
    );
  }
  return value;
}

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

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
export const STORAGE_STATE = path.join(findRepoRoot(), "playwright", ".auth", "storage-state.json");

export async function ensureScreenshotDir(subDir?: string) {
  const dir = subDir ? path.join(SCREENSHOT_DIR, subDir) : SCREENSHOT_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function login(page: Page): Promise<boolean> {
  /**
   * `domcontentloaded`, AND NO SHELL WAIT. The rest of this folder dropped
   * `networkidle` on 2026-08-11 for `domcontentloaded` plus `waitForShell`,
   * because `networkidle` waits for 500ms of network silence that surfaces
   * loading `js.stripe.com` never provide, so `goto` threw on pages that had
   * rendered correctly behind it. `/login` is the exception to the second half:
   * it renders no `<main>`, so waiting for the shell here would hang on a page
   * that is working.
   *
   * IT DOES NEED A SUBSTITUTE WAIT, AND THE FIRST ATTEMPT HERE DID NOT HAVE
   * ONE. The plan for this file said the swap was safe on its own because a
   * `waitFor` on the email input already follows. That is only true on the
   * signed-out path. On the signed-IN path the next thing that runs is the
   * `page.url()` snapshot below, and `networkidle` was silently doing the work
   * that made it correct: it did not return until the client-side redirect off
   * `/login` had already fired.
   *
   * Measured, not reasoned about: with a bare `domcontentloaded` and no wait,
   * `06-icons.spec.ts` failed in `beforeAll` at `emailInput.waitFor` after 10s,
   * one test failed and six never ran. `domcontentloaded` returns while the
   * router is still deciding, so the snapshot read `/login`, the early return
   * did not fire, and the helper went hunting for a form on a page that was on
   * its way to `/today`. See the race below, which is the wait that replaces it.
   */
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  // Declared before the redirect check because the race below needs the email
  // locator; nothing about the selectors changed.
  const emailInput = page
    .locator('input[type="email"], input[name="email"], [data-testid="email-input"]')
    .first();
  const passwordInput = page
    .locator('input[type="password"], input[name="password"], [data-testid="password-input"]')
    .first();

  /**
   * THE TWO LEGAL OUTCOMES OF LOADING `/login`, RACED.
   *
   * Signed in, we get bounced off `/login`. Signed out, the form renders. There
   * is no single observable covering both, and waiting for the wrong one costs
   * the full timeout, so wait for whichever arrives first and let the code below
   * read which it was.
   *
   * Both branches swallow their own rejection. `Promise.race` settles on the
   * first, but the loser keeps running and rejects at its own timeout, and an
   * unhandled rejection surfaces as a failure in whatever test happens to be
   * running by then. A branch losing this race is the normal case, not an error.
   */
  await Promise.race([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 }).catch(() => {}),
    emailInput.waitFor({ state: "visible", timeout: 10000 }).catch(() => {}),
  ]);

  /**
   * ALREADY SIGNED IN IS A SUCCESS, AND IT USED TO BE A TEN-SECOND TIMEOUT.
   *
   * Every project except `01-auth.spec.ts` now starts from `storageState`, so
   * `/login` redirects straight to the app and there is no form on the page.
   * The nine other spec files still call this helper 51 times between them --
   * in `beforeAll`, and again per test -- and each of those calls sat waiting
   * for an email input that could not appear, failed at 10s, and took its test
   * with it.
   *
   * That produced the most misleading failure list this suite has ever written.
   * Twelve assertions across six files all reported themselves as `/today`
   * defects -- layout, icons, aria labels, keyboard nav, theme tokens,
   * elevation -- and `/today` was fine. The page snapshot beside every one of
   * them showed the signed-in app rendered correctly behind the timeout. One
   * broken precondition wearing twelve different surfaces' names.
   *
   * Returning early is also what the specs meant all along: `storageState`
   * exists so a spec about typography does not spend ten seconds at a login
   * form. Fixing it here rather than deleting 51 call sites keeps
   * `01-auth.spec.ts` honest -- that file opts out of the shared session, so it
   * still lands on a real `/login` and still exercises the real form.
   */
  if (!page.url().includes("/login")) return true;

  /**
   * RESOLVED AFTER THE REDIRECT CHECK, and the earlier ordering is worth
   * recording because it was deliberate and it is now wrong.
   *
   * `demoPassword()` throws when `E2E_DEMO_PASSWORD` is unset, and it used to
   * be called before `goto` so the throw landed with no page loaded and
   * Playwright wrote no artifact at all. It cannot stay there: the early return
   * above needs a loaded page to read `page.url()` from, so the resolve has to
   * come after it.
   *
   * The property that mattered survives anyway. The throw now happens on a
   * rendered `/login`, which IS a capture point -- but the password field is
   * still EMPTY, because we have not reached the fill. An `error-context.md`
   * written here holds a blank form, and the source it embeds is
   * `demoPassword()` itself, which does not quote the value for exactly this
   * reason. The cost is one artifact directory, not a credential.
   *
   * It sits below the form check as well as below the redirect check, because
   * both are ways of learning we do not need it. A valid session with the env
   * var unset is a working run, and it should not be failed for lacking a
   * credential it was never going to type.
   */

  /**
   * THE URL IS SAMPLED TWICE, AND THE SECOND SAMPLE IS THE POINT.
   *
   * The check above is a single instant. On a loaded machine the redirect off
   * `/login` for an already-signed-in session is still in flight at that
   * microsecond, so it reads `/login`, concludes a sign-in is needed, and waits
   * ten seconds for a form that is in the middle of being unmounted.
   *
   * That is exactly how the full suite failed on 2026-08-11, on a test named
   * "design-system color tokens resolve on :root". The tokens were fine, all six
   * were defined. `error-context.md` showed the fully authenticated app rendered
   * in the page snapshot while the call log said `waiting for
   * input[type="email"]`. One test out of 141, and only under enough load for
   * the redirect to lose a race it normally wins. The fourth time in one day a
   * failure wore the name of a test that had nothing wrong with it.
   *
   * So the absence of a form is no longer treated as an answer. It is a reason
   * to look at the URL AGAIN, ten seconds later, by which time any redirect has
   * certainly committed. Only a page still on `/login` with no form is a real
   * failure, and it now says that by name rather than throwing on an unfillable
   * input four lines down.
   */
  const formAppeared = await emailInput
    .waitFor({ state: "visible", timeout: 10000 })
    .then(() => true)
    .catch(() => false);

  if (!formAppeared) {
    if (!page.url().includes("/login")) return true;
    throw new Error(
      `[e2e] Still on ${page.url()} after 10s with no sign-in form rendered. ` +
        `This is not a credential problem: the page neither bounced to the app ` +
        `nor drew a form.`,
    );
  }

  const password = demoPassword();

  await emailInput.fill(DEMO_EMAIL);
  await passwordInput.fill(password);

  // Submit. The click is INSIDE the try below rather than above it so that a
  // missing or unclickable submit button — which fails on a page whose password
  // field is already filled — reaches the same cleanup as a rejected login.
  const submitBtn = page.locator('button[type="submit"]').first();

  // Wait for redirect away from login
  try {
    await submitBtn.click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
    return true;
  } catch {
    // AUTH FAILED, AND THE PASSWORD IS STILL SITTING IN THE DOM.
    //
    // Measured on 2026-08-11 rather than assumed: Playwright renders
    // `<input type="password">` into an aria snapshot as
    // `- textbox "Password": <the value, in plaintext>`, and that snapshot is
    // the `error-context.md` it writes beside a failing test. The browser masks
    // the field visually, so a SCREENSHOT of this same moment shows dots — which
    // is the trap. The artifact everyone thinks to protect is the safe one.
    //
    // That capture happens when the TEST fails, which is after this returns, so
    // emptying the field here empties it before the snapshot is taken. Nothing
    // reads it any more: the submit has already fired and we are giving up.
    // Best-effort — if the element detached, we have nothing to clear anyway.
    await passwordInput.fill("").catch(() => {});
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
