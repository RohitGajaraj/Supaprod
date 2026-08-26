/**
 * S4-002 — THE SIXTY SECONDS, MEASURED NOT ARGUED.
 *
 * The founder's second acceptance: a person who has never seen this product
 * opens it and, inside sixty seconds and without being told anything, knows
 * what it is doing for them. This spec does not decide that — it RECORDS what
 * such a person could see, at 10s / 30s / 60s, with screenshots and the copy
 * actually rendered, so the verdict in docs/lanes/verify/ rests on evidence.
 *
 * GUARDED (S4_SIXTY=yes) for three reasons, all on the record:
 *   1. It needs a LOCAL dev server plus .env; no lane has either yet
 *      (coordination/requests/S4/runtime-access.md).
 *   2. It simulates a stranger WITH an account via storageState — a true
 *      signed-out stranger hits the public landing instead of /start. That is
 *      the closest honest simulation available and the header says so rather
 *      than pretending.
 *   3. Every other guarded spec here presses something. THIS ONE MUST NOT: it
 *      types into the composer and never submits, because a submit creates a
 *      real spine_tracks row wherever the server points. If anyone adds a
 *      submit to this file, they must re-read round-8.spec.ts first.
 *
 * Run:
 *   PHASE-safe: lsof -ti:8080 first; bun run dev in another shell;
 *   S4_SIXTY=yes bunx playwright test e2e/s4-sixty-seconds.spec.ts
 * Screenshots land in docs/screenshots/s4-002/ (gitignored by policy).
 */
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { findRepoRoot } from "./helpers/auth";

/**
 * SAMPLE SANDBOX WORKSPACE — the guarded workspace for e2e.
 * `is_sample = true` → sweep provably skips it (track-tick.ts:85).
 * Workspace ID: b90da531-34aa-4009-bcce-2162b87f50ac ("Sample sandbox").
 * F-90 reversal: is_sample=true means demo fixture sweep SKIPS (not "may drive").
 */
const SAMPLE_SANDBOX_WORKSPACE_ID = "b90da531-34aa-4009-bcce-2162b87f50ac";

const SHOT_DIR = join(findRepoRoot(), "docs", "screenshots", "s4-002");
const CHECKPOINTS = [10, 30, 60] as const;

test.skip(
  process.env.S4_SIXTY !== "yes",
  "Needs a local server + .env + Sample sandbox workspace; records only, never submits. Opt in with S4_SIXTY=yes.",
);

test("the sixty seconds — what a stranger can read at 10s, 30s, 60s", async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(SHOT_DIR, { recursive: true });

  const t0 = Date.now();
  await page.goto("/start", { waitUntil: "domcontentloaded" });

  const at = () => Math.round((Date.now() - t0) / 1000);

  /** What a reader could take in: headings, buttons, links, and the composer's
   * own words — the surface's argument, not its DOM dump. */
  async function observe(label: string): Promise<void> {
    const stamp = `${label}@${at()}s`;
    await page.screenshot({ path: join(SHOT_DIR, `${stamp.replace(/@/, "-at-")}.png`), fullPage: true });

    const copy = await page.evaluate(() => {
      const pick = (sel: string) =>
        [...document.querySelectorAll(sel)]
          .map((el) => (el.textContent ?? "").trim().replace(/\s+/g, " "))
          .filter((t) => t.length > 0 && t.length < 200);
      return {
        title: document.title,
        h1: pick("h1, h2"),
        buttons: pick("button").slice(0, 12),
        labels: pick("label, [data-mrd-label], placeholder") as string[],
        composerHint: document.querySelector("textarea")?.getAttribute("placeholder") ?? null,
        bodySample: (document.body.innerText ?? "")
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
          .slice(0, 40),
      };
    });
    console.log(`\n===== ${stamp} =====`);
    console.log(JSON.stringify(copy, null, 2));
  }

  // The three checkpoints. Waiting IS the measurement here — this is the one
  // legitimate sleep the waits.ts header allows: the elapsed time is the thing
  // under observation, not a bet against an async read.
  for (const second of CHECKPOINTS) {
    const target = t0 + second * 1000;
    const wait = target - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
    await observe(`${second}s`);
  }

  // The stranger's one action, performed but NOT submitted: type a sentence.
  const composer = page.locator("textarea").first();
  if (await composer.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await composer.fill("Draft a launch plan for our new checkout flow");
    await page.screenshot({ path: join(SHOT_DIR, `typed-not-submitted-at-${at()}s.png`) });
    console.log(`\n[typed@${at()}s] sentence typed, NOT submitted — no rows created`);
  } else {
    console.log(`\n[typed@${at()}s] NO COMPOSER VISIBLE — that is itself a sixty-seconds finding`);
  }

  // The only assert: the page rendered enough to read at all. Everything else
  // is recorded for human judgement, which is the point of the unit.
  expect(await page.locator("body").innerText()).not.toBe("");
});
