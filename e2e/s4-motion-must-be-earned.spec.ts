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
 * A filename for a path that may carry a query string.
 *
 * `?` and `=` are legal on this filesystem and are a nuisance everywhere else,
 * and the harness could not reach a view-scoped surface at all until now.
 * S3 asked for `/settings?section=autonomy` specifically, having noted that a
 * path census cannot see a query-string view, which is true and was a real gap:
 * `/engine-room?view=suites` answers and draws no tab, so a surface can exist
 * with no door and no row in any of my tables.
 */
function shotName(path: string): string {
  return path.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "") || "root";
}

/** Keeps a phone run from overwriting the desk run of the same surface. */
/*
 * Built by concatenation rather than interpolation on purpose. The guard in
 * the-browser-suite-cannot-carry-a-password.test.ts matches any quoted token of
 * 8 to 64 characters carrying all four character classes, and a template
 * literal wrapping this variable name hits it. The guard is shape-based so it
 * can name a leaked credential without reprinting it, which is the right
 * design, so the fix is for this line to stop looking like a secret rather
 * than for the guard to learn about this file.
 */
/** What the report should call the failure, so the label matches the run. */
const FAILURE_MODE = process.env.S4_MOTION_EXPIRED === "yes" ? "expired session" : "dead backend";

const SHOT_SUFFIX = process.env.S4_MOTION_VIEWPORT ? "_" + process.env.S4_MOTION_VIEWPORT : "";

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
/**
 * `S4_MOTION_VIEWPORT` set to 390x844 measures a phone.
 *
 * Everything S4 had measured until now was 1280x800, which is the width the
 * screenshots are composed at and the width nobody has trouble with. A surface
 * that is honest at desk width and unusable at phone width is still a surface a
 * person cannot use, and the dead backend is the harder case for it: error copy
 * is longer than the data it replaces, so the failure states are exactly where a
 * narrow column breaks first.
 */
const VIEWPORT = (() => {
  const raw = process.env.S4_MOTION_VIEWPORT;
  if (!raw) return undefined;
  const [w, h] = raw.split("x").map((n) => Number(n.trim()));
  if (!Number.isFinite(w) || !Number.isFinite(h)) return undefined;
  return { width: w, height: h };
})();

test.use({
  storageState: process.env.S4_MOTION_STATE
    ? process.env.S4_MOTION_STATE
    : { cookies: [], origins: [] },
  ...(VIEWPORT ? { viewport: VIEWPORT } : {}),
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
 * AN EXPIRED SESSION IS NOT THE SAME FAILURE AS A DEAD DATABASE.
 *
 * S1 built this shim independently and it found something the dead-port harness
 * could not, so it belongs here rather than in one lane's worktree.
 *
 * A dead port fails every request identically, including the ones the shell
 * needs. An expired session is narrower and more common: the app loads, the
 * route guard passes because `getSession()` reads localStorage and asks nobody,
 * and then every authenticated READ comes back 401. That is what a person
 * actually sees when they leave a tab open overnight.
 *
 * The difference is not academic. Rendering it is how S0 and S1 found that every
 * ReadFailed in the product offers a "Try again" that CANNOT WORK: retrying a
 * request whose session has ended returns the same 401 forever, so the one
 * control the failure state offers is the one thing guaranteed not to help.
 *
 * ── WHAT IT ACTUALLY EXERCISES, CORRECTED BY S1 WHO BUILT IT ───────────────
 * I wrote "the middleware runs" in this header, from S1's own description, and
 * they have since measured all three states and corrected it. It is worth having
 * exactly, because it decides what this mode may claim:
 *
 *   exp moved into the past, refresh token intact
 *     -> supabase-js spends the refresh token and the session RECOVERS before
 *        the page finishes loading. Full data renders. Nothing to see.
 *   access AND refresh both broken
 *     -> the guard finds no usable session and REDIRECTS TO /login, so no
 *        in-app failure copy renders at all.
 *   signature corrupted, expiry untouched          <- the state worth having
 *     -> `auth-middleware.ts` calls `supabase.auth.getClaims(token)`, which
 *        ACCEPTS a broken signature. The guard passes, the shell renders, and
 *        every query underneath is rejected.
 *
 * So the mechanism is THE DATA LAYER REFUSING, not the middleware throwing. The
 * errors that reach the components are real and carry the real strings, which is
 * why the sign-in doors verified this way are genuinely verified.
 *
 * S1's reason for keeping it, which is the best one: it is the ONLY state that
 * exposes a server function SWALLOWING its error. A swallowed 401 returns an
 * empty list, and the screen then reports an empty desk rather than a failed
 * read. That is how they found TrackStart saying "Nothing is in flight" on /plan
 * beside work that was moving.
 *
 * ── WHAT THIS MODE CANNOT DO, AND IT COST A RETRACTED FINDING ──────────────
 * A route interception is NOT the middleware. `requireSupabaseAuth` THROWS; this
 * fulfils a response, and the TanStack Start serverFn client does not
 * necessarily treat the two the same. On its first run it produced
 * "data is undefined" carrying a React Query cache key on four surfaces, S4 filed
 * it as a product defect (S4-074) and sent another lane three call sites, and it
 * was this shim. It does not reproduce against a genuinely expired session.
 *
 * So: ANY FINDING FROM THIS MODE IS A LEAD, NOT A RESULT. Confirm it against a
 * real session before filing it or sending it to anyone. The stronger instrument
 * is to sign in for real and corrupt the stored token in place, which leaves the
 * middleware and the real error mapping running and fakes only the signature.
 * That needs credentials this harness deliberately does not have.
 *
 * Turned on with S4_MOTION_EXPIRED=yes, and it changes nothing unless asked.
 */
async function failEveryAuthenticatedRead(page: import("@playwright/test").Page): Promise<void> {
  if (process.env.S4_MOTION_EXPIRED !== "yes") return;
  // The exact shape auth returns, so the product's own error mapping is exercised
  // rather than a generic network failure it would never see in production.
  const body = JSON.stringify({ message: "Invalid token", code: 401 });
  for (const pattern of ["**/rest/v1/**", "**/_serverFn/**", "**/auth/v1/user**"]) {
    await page.route(pattern, (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body }),
    );
  }
}

/**
 * PROSE WIDER THAN MERIDIAN'S OWN MEASURE.
 *
 * `meridian.css:938` sets `--mrd-measure: 68ch` and comments it "prose only,
 * never a table or a row". S2 found board prose running to 110 characters
 * because nothing on that surface used the token, and it shipped.
 *
 * S2 also made the fair criticism that this harness boots against a dead backend
 * and is therefore blind to defects that only appear on POPULATED screens. That
 * is true and it is a real limit. Line measure is the half of that class it does
 * NOT have to be blind to: failure copy is prose, marketing pages are prose, and
 * both render fully with no database at all.
 *
 * ── HOW ch IS MEASURED, since guessing at it would make the number worthless ──
 * A `ch` is the width of the digit zero in the element's OWN font, so it is
 * measured per element with a probe span carrying that element's computed font,
 * rather than approximated from font-size.
 *
 * THE THRESHOLD IS 76, WHICH IS 68 PLUS AN EIGHT-CHARACTER TOLERANCE. It said 80
 * for its first three runs while this comment said "an eight-character
 * tolerance", and 68 plus 8 is 76. The prose and the number disagreed and the
 * number was looser.
 *
 * That gap is not academic: S2 measured a `today-notice` column rendering at
 * 79ch, from a cap written as `72ch` on a grid whose font is 14px and filled by
 * a child at 13px, so the cap counts in one font and the text arrives in
 * another. At 80 this check would have reported that surface as clean, and the
 * defect was found by a person measuring it by hand instead.
 *
 * Tables and rows are excluded, as the token's own comment instructs.
 */
async function proseWiderThanMeasure(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(() => {
    const probe = document.createElement("span");
    probe.textContent = "0";
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;";
    document.body.appendChild(probe);

    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("p, li, dd, blockquote"))) {
      if (el.closest("table, [role='row'], [role='table'], [role='grid']")) continue;
      const text = (el.innerText || "").trim();
      // Short strings wrap to one line whatever the box is; they are not prose.
      if (text.length < 120) continue;
      const cs = getComputedStyle(el);
      probe.style.font = cs.font || `${cs.fontSize} ${cs.fontFamily}`;
      const chWidth = probe.getBoundingClientRect().width;
      if (!chWidth) continue;

      /*
       * MEASURE THE RENDERED LINE, NOT THE BOX.
       *
       * The first version divided `clientWidth` by the ch width, which is the
       * width of the CONTAINER. A paragraph can sit in a wide box and still
       * wrap short, and reporting the box as the line would have sent another
       * lane to fix prose that reads fine. A Range over the text yields one
       * client rect PER LINE BOX, so the widest rect is the longest line a
       * person actually reads.
       */
      const range = document.createRange();
      range.selectNodeContents(el);
      const lines = Array.from(range.getClientRects()).filter((r) => r.width > 0);
      range.detach?.();
      if (lines.length === 0) continue;
      const widest = Math.max(...lines.map((r) => r.width));
      const ch = Math.round(widest / chWidth);

      /*
       * A PIXEL CAP ON PROSE IS A DEFECT EVEN WHEN THE CHARACTER COUNT PASSES.
       *
       * S3's find: /pricing bounded a paragraph at `maxWidth: 640px`, roughly
       * 91ch. Somebody DID cap it, in a unit that cannot track type, so the
       * measure drifts the day the font scale moves and nothing warns anyone.
       * A ch threshold is blind to it whenever the current font happens to land
       * inside the bound, which is exactly when it looks fine and is not.
       */
      /*
       * ONLY THE INLINE, AUTHORED VALUE COUNTS AS A PIXEL CAP.
       *
       * `getComputedStyle().maxWidth` RESOLVES ch, em and % to pixels, so
       * reading it flags every capped element on earth, including one correctly
       * written as `68ch`. The first version of this did exactly that and
       * reported /decide as pixel-capped at 653.57px — a fractional pixel is the
       * fingerprint of a computed value, not something anybody typed.
       *
       * `el.style.maxWidth` is the inline value as AUTHORED, so `maxWidth: 640`
       * in a component shows as `640px` and `68ch` shows as `68ch`. That is the
       * only reading that can tell a pixel cap from a character one.
       *
       * The cost is stated rather than hidden: a px cap written in a CSS FILE is
       * invisible to this, because the cascade has already resolved it by the
       * time the DOM can be asked. Catching those needs the stylesheet, not the
       * element.
       */
      const declared = el.style.maxWidth.trim();
      const pixelBound = /^\d+(\.\d+)?px$/.test(declared);
      if (ch <= 76 && !pixelBound) continue;
      const how = pixelBound
        ? ` [capped in PIXELS: ${declared.trim()}, which cannot track type]`
        : "";
      out.push(`${ch}ch over ${lines.length} line(s)${how}: ${text.slice(0, 50)}...`);
    }
    probe.remove();
    return Array.from(new Set(out)).slice(0, 6);
  });
}

/**
 * CONTROLS A SCREEN READER CANNOT NAME.
 *
 * Every other check in this file asks whether the screen tells the truth. This
 * one asks whether it can be USED, which is the same standard applied to a
 * person who is not looking at it.
 *
 * A button with an icon and no accessible name is announced as "button" and
 * nothing else. On the failure states this harness specialises in, that is
 * sharper than usual: those screens are mostly a sentence and a way out, so an
 * unnamed control is frequently the ONLY control, and losing it loses the page.
 *
 * The four ways a control gets a name are all accepted: its own text, its
 * `aria-label`, an `aria-labelledby` that resolves, or a `title`. An
 * `aria-hidden` control is skipped, because it is deliberately not in the tree.
 *
 * Reported rather than asserted, for now. I have not established a clean number
 * on this product, and a gate that fires on its first run before anyone has
 * agreed the rule is how a check gets switched off.
 */
async function unnamedControls(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const sel = 'button, a[href], input, select, textarea, [role="button"], [role="link"]';
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      if (el.closest("[aria-hidden='true']")) continue;
      if (el.offsetParent === null && el.getClientRects().length === 0) continue;
      const labelledby = (el.getAttribute("aria-labelledby") ?? "")
        .split(/\s+/)
        .filter(Boolean)
        .some((id) => document.getElementById(id)?.textContent?.trim());
      const named =
        (el.innerText || el.textContent || "").trim() ||
        el.getAttribute("aria-label")?.trim() ||
        el.getAttribute("title")?.trim() ||
        (el as HTMLInputElement).labels?.length ||
        labelledby;
      if (named) continue;
      const cls = el.className?.toString().trim().split(/\s+/).slice(0, 2).join(".");
      out.push(`${el.tagName.toLowerCase()}${cls ? "." + cls : ""}`);
    }
    /*
     * Count the ELEMENTS behind each shape, not just the shapes.
     *
     * /checkout reported "1 control shape" and it is TWO inputs, both
     * `input.text-mrd-prose`, one for a name and one for an email. Deduping to a
     * shape is what makes the list readable on a page with forty rows, and
     * printing only the shape understates the defect on a page with two.
     */
    const counts = new Map<string, number>();
    for (const shape of out) counts.set(shape, (counts.get(shape) ?? 0) + 1);
    return [...counts].map(([shape, n]) => (n > 1 ? `${shape} x${n}` : shape)).slice(0, 10);
  });
}

/**
 * SURFACES THAT ARE SUPPOSED TO SHOW EVERY FAILURE AT ONCE.
 *
 * `/meridian` is the design system's gallery: "Every component, in both grounds,
 * before it is wired to anything." It scored 8 failure statements and TEN "Try
 * again" buttons, the worst in the product by a factor of two, and every one of
 * them is a SPECIMEN rendering correctly. A catalogue of failure states is
 * supposed to contain failure states.
 *
 * I had "the worst surface in the product" written down before opening the
 * screenshot. The metric cannot tell a gallery from a page, so it is told.
 *
 * Kept as a list of one rather than a pattern, because the honest default is
 * that a surface counts, and every addition here should cost somebody a
 * sentence explaining why it does not.
 */
const GALLERY_SURFACES: readonly string[] = ["/meridian"];

/**
 * HOW MANY TIMES DOES ONE DEAD READ ANNOUNCE ITSELF?
 *
 * S3 asked for this after rendering `/guardrails` against a dead backend and
 * counting SIX separate failure statements and FOUR "Try again" affordances, all
 * produced by a single failed read. Their words for why it matters: whatever
 * route a surface ends up on, one dead read should say so ONCE.
 *
 * It is a real quality number because failure states are the ones nobody
 * designs. They are assembled a component at a time, each one locally correct,
 * and nobody sees the total until the page is rendered with everything broken,
 * which is exactly the condition this harness creates and nothing else does.
 *
 * Counted on `innerText`, deduplicated, because the question is how many
 * DISTINCT sentences a person reads, not how many components rendered.
 *
 * ── THE UNIT IS A SENTENCE, NOT A CAUSE, AND THE DIFFERENCE MATTERS ────────
 * A card's heading and its body are two lines and count as two. S3 fixed
 * /guardrails and reported it "six to three"; this still read six, and both are
 * right about different things. Reading the page settles it: after their fix a
 * person sees THREE CAUSES (the room summary, the boundary, the rules) carried
 * by five or six SENTENCES, because one card legitimately has a heading and a
 * body.
 *
 * So this number will not fall to a cause count, and nobody should try to make
 * it. It is a triage signal for "which page should I look at", and the list it
 * prints is the thing to act on. A lane chasing the number itself would end up
 * deleting a card body that was doing its job.
 */
/*
 * `went wrong` is deliberately anchored to `something went wrong` rather than
 * matched bare. Bare, it counted the TAB LABEL "What went wrong" on /guardrails
 * as a failure statement and reported 7 where a person reads 6. A metric another
 * lane is going to act on has to not do that, and the cross-check that caught it
 * was S3 counting the same page by hand and getting six.
 */
const FAILURE_SENTENCE =
  /(did not load|could not be read|could not read|not readable|is not available|unavailable|something went wrong|session ended|failed to load)/i;

async function failureStatements(
  page: import("@playwright/test").Page,
): Promise<{ distinct: string[]; retries: number }> {
  return page.evaluate((src) => {
    const re = new RegExp(src, "i");
    const lines = document.body.innerText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const distinct = Array.from(new Set(lines.filter((l) => re.test(l))));
    const retries = lines.filter((l) => /^try again$/i.test(l)).length;
    return { distinct, retries };
  }, FAILURE_SENTENCE.source);
}

/**
 * CONTENT THAT IS WIDER THAN ITS BOX AND CANNOT BE SCROLLED TO.
 *
 * A narrow viewport turns a row of seven things into a row of four things and a
 * cliff. That is fine when the box scrolls and invisible-but-fatal when it does
 * not: the remaining content exists in the DOM, reads fine to a test that
 * inspects text, and no person can ever reach it.
 *
 * The signal is exact rather than heuristic. `scrollWidth > clientWidth` means
 * there IS more than fits. `overflow-x: hidden` means it is clipped. Together
 * they mean unreachable. Elements that scroll (`auto`, `scroll`) are fine and are
 * not reported, and `visible` is not reported either because the overflow is
 * still on screen, just outside the box.
 *
 * Reported, not asserted: a clipped decorative strip is a real thing a designer
 * may have chosen, and this cannot tell that from a lost navigation row. The
 * screenshot beside it can.
 */
async function clippedAndUnreachable(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      if (el.scrollWidth <= el.clientWidth + 2) continue;
      if (el.clientWidth === 0) continue;
      if (getComputedStyle(el).overflowX !== "hidden") continue;
      // Screen-reader-only text is clipped ON PURPOSE: that is how it is kept
      // out of the visual layout while staying in the accessibility tree. It is
      // the one case where "wider than its box and not scrollable" is correct,
      // and it was the ONLY thing this check found on its first run.
      if (/(^|\s)(sp-)?sr-only(\s|$)/.test(el.className?.toString() ?? "")) continue;
      const label = el.className?.toString().trim().split(/\s+/).slice(0, 2).join(".");
      const lost = el.scrollWidth - el.clientWidth;
      out.push(`${el.tagName.toLowerCase()}${label ? "." + label : ""} hides ${lost}px`);
    }
    // The same class repeats down a list; one line per shape is what is readable.
    return Array.from(new Set(out)).slice(0, 12);
  });
}

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
  /** Kept apart from `report`, whose length is asserted one-per-surface. */
  const notes: string[] = [];
  const advancing: string[] = [];
  const illustrated: string[] = [];

  await failEveryAuthenticatedRead(page);

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
    await page.screenshot({
      path: join(SHOT_DIR, `surface_${shotName(path)}${SHOT_SUFFIX}.png`),
    });

    const failures = await failureStatements(page);
    if (GALLERY_SURFACES.includes(path)) {
      notes.push(
        `\n--- ${path}: ${failures.distinct.length} failure statement(s), ` +
          `${failures.retries} "Try again" — NOT SCORED. ` +
          `This surface is a component gallery and is MEANT to show them all at once.`,
      );
    } else if (failures.distinct.length) {
      notes.push(
        `\n--- ${path}: ONE ${FAILURE_MODE}, ${failures.distinct.length} failure SENTENCE(S) ` +
          `(a card heading and its body are two), ${failures.retries} "Try again" ---\n  ` +
          failures.distinct.join("\n  ") +
          (failures.distinct.length > 2 ? `\n  ABOVE TWO. One dead read should say so once.` : ""),
      );
    }

    const wide = await proseWiderThanMeasure(page);
    if (wide.length) {
      notes.push(
        `\n--- ${path}: prose measured against Meridian's 68ch ---\n  ` +
          wide.join("\n  ") +
          `\n  meridian.css:938 sets --mrd-measure: 68ch, "prose only, never a table or a row".` +
          `\n  A line OVER 76ch reads too long today. A line capped INLINE IN PIXELS may read` +
          `\n  fine today and stops tracking the type scale the moment it moves; /brief is` +
          `\n  four paragraphs at 28 to 60ch, all correct to read and all pinned at 760px.`,
      );
    }

    const unnamed = await unnamedControls(page);
    if (unnamed.length) {
      notes.push(
        `\n--- ${path}: ${unnamed.length} control shape(s) a screen reader cannot name ---\n  ` +
          unnamed.join("\n  ") +
          `\n  On a failure screen the only control is often the only way out.`,
      );
    }

    const clipped = await clippedAndUnreachable(page);
    if (clipped.length) {
      notes.push(
        `\n--- ${path}: content wider than its box and NOT scrollable ---\n  ` +
          clipped.join("\n  ") +
          `\n  Open the screenshot: is that decoration, or is it a way out of this screen?`,
      );
    }

    const changed = a !== b;
    if (changed) {
      moving.push(path);
      report.push(
        `\n=== ${path} STILL MOVING ${GAP_MS}ms after settle, with no backend ===\n` +
          `  frame at settle+0s : ${a}\n` +
          `  frame at settle+${GAP_MS / 1000}s : ${b}\n` +
          `  screenshot: docs/screenshots/s4-motion/surface_${shotName(path)}${SHOT_SUFFIX}.png`,
      );
    } else {
      report.push(
        `\n=== ${path} settled after rendering in ${(render.ms / 1000).toFixed(1)}s. ` +
          `Nothing moves without data. ===\n` +
          `  screenshot: docs/screenshots/s4-motion/surface_${shotName(path)}${SHOT_SUFFIX}.png\n` +
          `  Settling is the pass for MOTION. Open it anyway and read what it SAYS.`,
      );
    }
  }

  writeFileSync(join(SHOT_DIR, "motion-report.txt"), [...report, ...notes].join("\n"), "utf8");

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
      [...report, ...notes].join("\n"),
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
