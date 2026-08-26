import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

import { findRepoRoot } from "./helpers/auth";

/**
 * MOTION MUST BE EARNED. THE DEAD BACKEND TEST, AS A SPEC RATHER THAN A RULE.
 *
 * `S4-051` formalised the rule and `S4-039` proved it by hand: point the app at
 * a database that does not exist, open a surface, and watch what still moves.
 * Motion that continues with no backend is a clock. Motion that stops is data.
 *
 * A rule nobody can run is a slogan, so this is the rule as a spec. It exists
 * because the direction is that the visual aspects of the agentic workflow
 * should be SEEN, with stickiness and interactivity, and generation tooling now
 * makes motion cheap to produce. Cheap to produce is also cheap to fake, and a
 * timer-driven progress bar and a run-driven one are the same picture.
 *
 * ── WHAT THIS ASSERTS, AND WHAT IT DELIBERATELY DOES NOT ───────────────────
 * It asserts only that a surface reaches a STEADY STATE when nothing can be
 * read. It does NOT assert that a surface is static: a spinner while a request
 * is in flight is honest, a skeleton is honest, and a transition that settles is
 * honest. All of those stop. What cannot stop is a `setInterval` driving a state
 * label, which is the one thing this catches and the one thing the operating
 * model calls theatre by name.
 *
 * ── HOW IT DECIDES ─────────────────────────────────────────────────────────
 * Three samples of the rendered text, spaced past any plausible settle time. If
 * sample 2 and sample 3 differ, something is still changing long after every
 * request has failed, and the only thing left driving it is a clock.
 *
 * The first sample is discarded on purpose. Mount, hydration and the first
 * failed fetch all land inside it, and a surface is allowed to change while it
 * is still finding out that nothing is there.
 *
 * ── RUNNING IT ─────────────────────────────────────────────────────────────
 *   lsof -ti:8080 first, and say DEVSERVER in your NOW line while you hold it.
 *   Write a .env whose VITE_SUPABASE_URL points at a port with nothing on it:
 *     VITE_SUPABASE_URL=http://localhost:54321
 *   bun run dev, then:
 *     S4_MOTION=yes bunx playwright test e2e/s4-motion-must-be-earned.spec.ts \
 *       --no-deps --project=chromium-desktop
 *   Kill the server the moment it finishes. Remove the dummy .env.
 *
 * This spec presses nothing and submits nothing, so it cannot write a row
 * wherever it is pointed. Keep it that way.
 */

const SHOT_DIR = join(findRepoRoot(), "docs", "screenshots", "s4-motion");

/**
 * Public surfaces by default; override with S4_MOTION_PATHS="/today,/runs".
 *
 * The default set is public because those render with no session. A lane
 * checking its own signed-in surface passes its paths in and supplies a
 * storageState, and the honesty question is identical either way.
 */
const SURFACES: readonly string[] = (process.env.S4_MOTION_PATHS ?? "/,/pricing,/product,/demo")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

/** Past mount, hydration, and the first failed request. */
const SETTLE_MS = 6_000;
/** Between the two samples that actually decide it. */
const GAP_MS = 9_000;

/**
 * How long a surface gets to FINISH RENDERING before this spec gives up on it.
 *
 * A spec that starts sampling a surface which is still loading measures the
 * LOADING INDICATOR, and a loading indicator always moves. It would then report
 * every slow route as theatre, which is the exact false positive that cost S4
 * three wrong findings about `/runs` (`S4-057`).
 *
 * Heavy authenticated routes in a browser with an empty cache genuinely need
 * tens of seconds in dev, because every module in the graph is a separate
 * request. `/runs` pulls in a 1,786-line sibling. That is slow; it is not a lie.
 */
const RENDER_BUDGET_MS = 60_000;

/**
 * Enough text on screen to be a page rather than a wait state.
 *
 * The pending component renders one word. Every real surface in this product,
 * including the signed-out login, clears this by a wide margin, so the threshold
 * separates "rendered" from "still spinning" without hard-coding a label that a
 * lane could rename out from under this spec.
 */
const RENDERED_MIN_CHARS = 60;

/** Resolves when the surface is a page, or reports how long it waited in vain. */
async function waitUntilRendered(
  page: import("@playwright/test").Page,
): Promise<{ rendered: boolean; ms: number }> {
  const started = Date.now();
  while (Date.now() - started < RENDER_BUDGET_MS) {
    const chars = await page.evaluate(() => document.body.innerText.trim().length);
    if (chars >= RENDERED_MIN_CHARS) return { rendered: true, ms: Date.now() - started };
    await page.waitForTimeout(500);
  }
  return { rendered: false, ms: Date.now() - started };
}

test.skip(
  process.env.S4_MOTION !== "yes",
  "Needs a local dev server pointed at a dead database. Opt in with S4_MOTION=yes.",
);

// A stranger has no session, and a signed-out render is the honest one here.
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * A hash of the rendered viewport.
 *
 * ── WHY PIXELS, AFTER TWO INSTRUMENTS FAILED ───────────────────────────────
 * The first version of this spec sampled rendered TEXT and passed on `/`, which
 * is the one surface already PROVEN to animate with no backend (`S4-039`, with
 * screenshots). A second attempt sampled every element's `class` and `style`
 * attribute and reported **zero of 549 elements changed** over fifteen seconds.
 * Both were wrong: hashing the viewport over the same window gives three
 * different hashes at 6s, 15s and 25s.
 *
 * The station strip changes its FILL, and a fill can move without touching text
 * and without touching an attribute this side can read. So the only instrument
 * that reliably sees "the screen changed" is the screen.
 *
 * ── THE COST, AND HOW IT IS CONTAINED ──────────────────────────────────────
 * Pixels are noisier than text: a caret blink, a gradient, an easing curve
 * mid-flight all differ. Two things contain it. The first sample is discarded so
 * mount and hydration are excluded, and the two that decide are taken **nine
 * seconds apart, six seconds after load**, by which point any honest transition
 * has finished. Anything still redrawing then is on a clock.
 */
async function frameHash(page: import("@playwright/test").Page): Promise<string> {
  const buf = await page.screenshot();
  return createHash("sha1").update(buf).digest("hex").slice(0, 16);
}

/*
 * REPORT ONLY, AND THAT IS A FINDING RATHER THAN A CLIMBDOWN.
 *
 * This asserted `moving` was empty until it was run against real pages. It then
 * flagged ALL FOUR, including `/pricing`, `/product` and `/demo`, which carry no
 * state machine at all. They move because these pages have AMBIENT BACKGROUND
 * MOTION, and decoration that carries no state claim is explicitly not theatre by
 * the definition at the top of this file.
 *
 * So pixel hashing answers "did the screen change" and the question that matters
 * is "did a STATE change". Three instruments were tried and none separates them:
 * rendered text misses a fill, class and style attributes miss it too, and pixels
 * catch every drifting gradient.
 *
 * A gate that fails every surface teaches people to skip it, which is worse than
 * no gate. So it reports, and a person reads the report. **The discriminator is
 * still a human looking at what moved**, which is how `S4-039` was proved, and
 * automating it needs a signal none of these three instruments carry: which
 * elements are STATE-BEARING. That is a real open problem and it is written down
 * here rather than papered over with a threshold nobody could justify.
 */
test("report which surfaces still move once nothing can be read", async ({ page }) => {
  // Render budget + settle + gap + screenshot, per surface, with headroom.
  test.setTimeout((RENDER_BUDGET_MS + SETTLE_MS + GAP_MS + 25_000) * SURFACES.length);
  mkdirSync(SHOT_DIR, { recursive: true });

  const report: string[] = [];
  const moving: string[] = [];
  const notRendered: string[] = [];

  for (const path of SURFACES) {
    await page.goto(`http://localhost:8080${path}`, { waitUntil: "domcontentloaded" });

    // Never judge a surface that has not finished rendering. A wait state moves
    // by design, so sampling one produces a confident report about nothing.
    const render = await waitUntilRendered(page);
    if (!render.rendered) {
      notRendered.push(path);
      report.push(
        `\n=== ${path} NOT JUDGED. It never finished rendering in ${RENDER_BUDGET_MS / 1000}s. ===\n` +
          `  This is NOT a finding. A surface still loading shows a wait state, and a wait\n` +
          `  state moves on purpose, so there is nothing here to call theatre.\n` +
          `  Warm the route first (e2e/helpers/warm-routes.mjs) and run this again.`,
      );
      continue;
    }

    await page.waitForTimeout(SETTLE_MS);
    await frameHash(page); // discarded: mount and hydration land in this one
    const a = await frameHash(page);
    await page.waitForTimeout(GAP_MS);
    const b = await frameHash(page);

    const changed = a !== b;
    if (changed) {
      moving.push(path);
      await page.screenshot({ path: join(SHOT_DIR, `moving${path.replace(/\//g, "_")}.png`) });
      report.push(
        `\n=== ${path} STILL MOVING ${GAP_MS}ms after settle, with no backend ===\n` +
          `  frame at settle+0s : ${a}\n` +
          `  frame at settle+${GAP_MS / 1000}s : ${b}\n` +
          `  screenshot: docs/screenshots/s4-motion/moving${path.replace(/\//g, "_")}.png`,
      );
    } else {
      report.push(
        `\n=== ${path} settled after rendering in ${(render.ms / 1000).toFixed(1)}s. ` +
          `Nothing moves without data. ===`,
      );
    }
  }

  writeFileSync(join(SHOT_DIR, "motion-report.txt"), report.join("\n"), "utf8");

  console.info(
    `Surfaces still redrawing ${GAP_MS / 1000}s after settle with no backend: ` +
      `${moving.length ? moving.join(", ") : "none"}.\n` +
      (notRendered.length
        ? `NOT JUDGED because they never finished rendering: ${notRendered.join(", ")}. ` +
          `Warm them and re-run.\n`
        : "") +
      "A surface on this list is NOT automatically theatre: ambient background motion lands\n" +
      "here too, and decoration carrying no state claim is honest. Open the screenshots in\n" +
      "docs/screenshots/s4-motion/ and ask whether what moved was a STATE. That judgement is\n" +
      "not automated and this spec does not pretend to make it.\n" +
      report.join("\n"),
  );

  // The only thing asserted is that the measurement ran. The judgement is a
  // person's, and pretending otherwise is the failure this file is about.
  expect(report.length).toBe(SURFACES.length);
});
