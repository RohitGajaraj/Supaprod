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

/**
 * Signed out by default, because a stranger has no session and the public
 * surfaces render without one.
 *
 * `S4_MOTION_STATE` points at a storageState file instead, which is how the
 * PRODUCT surfaces get measured: signed out they all redirect to `/login` and
 * the measurement is of the login page. See `e2e/helpers/dead-backend-session.mjs`
 * for what that state is and why it is a test double rather than a credential.
 */
test.use({
  storageState: process.env.S4_MOTION_STATE
    ? process.env.S4_MOTION_STATE
    : { cookies: [], origins: [] },
});

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

/**
 * THE HALF OF THIS QUESTION THAT DOES NOT NEED A HUMAN.
 *
 * Pixel hashing answers "did the screen change", and the question that matters is
 * "did a STATE change". Nothing in the DOM says which elements are state-bearing,
 * which is why the surrounding test reports rather than asserts.
 *
 * But one family of state IS self-identifying, because it is written in a shape
 * that means only one thing: COUNTED PROGRESS. "step 3 of 8" and "47%" are claims
 * about how far along real work is. With no database reachable there is no work
 * and no row to advance, so if either number is HIGHER nine seconds later, it was
 * driven by a clock. There is no honest reading of that, and no judgement call to
 * make, so this half is asserted rather than reported.
 *
 * Deliberately narrow, and each exclusion is a decision:
 *  - MAX rather than per-element tracking, because an element path is not stable
 *    across a re-render and a moved counter is not a rising one.
 *  - HIGHER only. A progress claim falling or vanishing is what SHOULD happen
 *    when a read fails, and failing a surface for becoming honest would be
 *    exactly backwards.
 *  - Elapsed timers (mm:ss) are collected and REPORTED, never asserted. A public
 *    page may legitimately count down to a date that needs no backend, and a
 *    guard that fails a marketing countdown is a guard people turn off.
 */
/**
 * WHERE AN ADVANCING PROGRESS CLAIM IS A LIE, AND WHERE IT IS AN ADVERTISEMENT.
 *
 * The first version of this asserted everywhere and immediately failed `/`, on
 * the hero loop strip, which advances 3 -> 4 with no backend. That is a REAL
 * clock and it is also fine: HeroLoopDemo.tsx says in its own header that it is
 * an illustration of the seven stations on a `setInterval`, and S4-039 already
 * ruled that an illustrative landing animation is ordinary, that every product
 * ships one, and that what was wrong there was the capability copy beside it.
 *
 * A guard that fails a surface its own author already cleared is the failure
 * this file warns about two comments down: people turn it off.
 *
 * So the line is drawn where the deception actually lands. On a marketing page a
 * moving diagram is understood as a diagram. Inside the product, "step 4 of 7"
 * is a claim about the person's OWN work, and if it advances while nothing can
 * be read, it is telling them something happened that did not. That is asserted.
 *
 * The list is small, explicit, and public-only on purpose. Adding a product
 * surface to it would be the move that quietly disables this check, so anything
 * added here needs the reason written beside it.
 */
const MARKETING_SURFACES: readonly string[] = ["/", "/pricing", "/product", "/demo"];

const PROGRESS_PATTERNS: readonly { name: string; re: RegExp }[] = [
  // "step 3 of 8", "3/8"
  { name: "counted progress", re: /(\d+)\s*(?:of|\/)\s*\d+/g },
  // "47%"
  { name: "percent complete", re: /(\d+)\s*%/g },
];

/** The highest value each progress shape currently claims, or null if absent. */
async function progressClaims(
  page: import("@playwright/test").Page,
): Promise<Record<string, number | null>> {
  const text = await page.evaluate(() => document.body.innerText);
  const out: Record<string, number | null> = {};
  for (const { name, re } of PROGRESS_PATTERNS) {
    let max: number | null = null;
    for (const m of text.matchAll(new RegExp(re.source, "g"))) {
      const v = Number(m[1]);
      if (Number.isFinite(v) && (max === null || v > max)) max = v;
    }
    out[name] = max;
  }
  return out;
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
  const advancing: string[] = [];
  const illustrated: string[] = [];

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
    const claimsA = await progressClaims(page);
    await page.waitForTimeout(GAP_MS);
    const b = await frameHash(page);
    const claimsB = await progressClaims(page);

    for (const { name } of PROGRESS_PATTERNS) {
      const before = claimsA[name];
      const after = claimsB[name];
      if (before !== null && after !== null && after > before) {
        const line = `${path}: ${name} went ${before} -> ${after} with no backend`;
        if (MARKETING_SURFACES.includes(path)) {
          illustrated.push(line);
        } else {
          advancing.push(line);
        }
      }
    }

    /*
     * PHOTOGRAPH EVERY SURFACE, not only the ones that moved.
     *
     * This used to shoot only the movers, which meant a surface that SETTLED was
     * never seen by anybody. That is backwards: settling is the pass condition
     * for motion and says nothing about whether the words on it are true. It
     * cost a real gap, `/work` came back "settled, nothing moves" in a sweep of
     * seven and was the one surface whose copy I could not read afterwards.
     *
     * The dead backend test is worth as much for what a surface SAYS as for what
     * it does, and both findings in S4-065 were read off screenshots rather than
     * measured. So the shot is unconditional and named for the path.
     */
    await page.screenshot({ path: join(SHOT_DIR, `surface${path.replace(/\//g, "_")}.png`) });

    const changed = a !== b;
    if (changed) {
      moving.push(path);
      report.push(
        `\n=== ${path} STILL MOVING ${GAP_MS}ms after settle, with no backend ===\n` +
          `  frame at settle+0s : ${a}\n` +
          `  frame at settle+${GAP_MS / 1000}s : ${b}\n` +
          `  screenshot: docs/screenshots/s4-motion/surface${path.replace(/\//g, "_")}.png`,
      );
    } else {
      report.push(
        `\n=== ${path} settled after rendering in ${(render.ms / 1000).toFixed(1)}s. ` +
          `Nothing moves without data. ===\n` +
          `  screenshot: docs/screenshots/s4-motion/surface${path.replace(/\//g, "_")}.png\n` +
          `  Settling is the pass for MOTION. Open it anyway and read what it SAYS.`,
      );
    }
  }

  writeFileSync(join(SHOT_DIR, "motion-report.txt"), report.join("\n"), "utf8");

  if (illustrated.length) {
    console.info(
      "Progress claims that advanced on a MARKETING surface, reported and not failed,\n" +
        "because an illustration is expected there. Check the copy beside them says so:\n  " +
        illustrated.join("\n  "),
    );
  }

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

  // The measurement ran for every surface.
  expect(report.length).toBe(SURFACES.length);

  /*
   * AND THE ONE THING THAT IS NOT A JUDGEMENT CALL.
   *
   * Whether a drifting gradient is theatre needs a person. Whether a progress
   * claim rose while nothing could be read does not. This fails.
   */
  expect(
    advancing,
    `A counted progress claim ADVANCED while no data could be read. Nothing was ` +
      `there to make progress, so a clock moved it:\n  ${advancing.join("\n  ")}`,
  ).toEqual([]);
});
