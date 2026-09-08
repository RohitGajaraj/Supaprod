import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * THE SHELL DOES NOT REPEAT THE BOARD'S PRIMARY CLAIM.
 *
 * This file already carries the rule and had applied it exactly once, to the
 * station name: "this file's own rule bans the third statement of one fact
 * inside 100 pixels." The gate count never got the same treatment, and it is
 * the worst offender, because it duplicates the PRIMARY claim of the surface
 * it sits on top of.
 *
 * Screenshotted on the running board 2026-08-27, signed in:
 *
 *     top bar   "52 decisions are ready for you"
 *     headline  "52 decisions are ready for your review."      190px below
 *
 * Same number, same things, near-identical words. A reader does not experience
 * that as emphasis; they read it as a screen with nothing else to say.
 *
 * THE ERROR BRANCH IS DELIBERATELY OUTSIDE THE GUARD. "Cannot see what is
 * running" must survive on every surface including the board, because silence
 * there would be read as calm. Suppressing a fact that is duplicated is not the
 * same as suppressing a fact that is missing.
 */

const SRC = readFileSync("src/components/shell/AppFrame.tsx", "utf8");

describe("the live line on the board", () => {
  it("suppresses the gate sentence where the board already states it", () => {
    expect(SRC).toContain("if (waiting > 0 && !onTheBoard) {");
  });

  /*
   * ── THIS ASSERTION IS WHY THE DEFECT CAME BACK ONCE ALREADY (2026-09-01),
   * AND WHY ITS OWN FIX HAS NOW GONE STALE TOO (P-14, 2026-09-03) ──────────
   * It used to read `expect(SRC).toContain('const onTheBoard = pathname ===
   * "/today";')`, a SPELLING pin that broke when `/today` redirected and
   * `<Board />` moved to `/start`. The 2026-09-01 fix replaced that with a
   * check that `SIGNED_IN_HOME`'s own route file contains the literal text
   * `<Board />` -- which is ALSO a spelling pin, just one substring further
   * removed, and it was never caught because the repo happened to keep a
   * comment mentioning `<Board />` in `_authenticated.start.tsx` the whole
   * time. `Board.tsx` is now deleted outright (P-14, A-QUEUE.md): there is no
   * component by that name anywhere in the codebase for any route to render,
   * so the literal-string check can now only pass on a comment, exactly the
   * failure mode A1 named it for.
   *
   * The claim underneath both versions -- "the top bar's gate sentence is
   * suppressed because the surface it is suppressed ON already states the
   * same count" -- needs a fresh answer, not a third spelling of the same
   * check: `_authenticated.start.tsx` today shows no "N decisions are ready"
   * sentence at all, in any form; it shows the person's own runs marked
   * "Needs you" instead, a structurally different claim (a list of items, not
   * a summed count). Whether that still justifies suppressing the top bar's
   * sentence on this page, or whether the suppression is now hiding the only
   * mention of pending gates a person on Start ever sees, is a live-behaviour
   * question about AppFrame.tsx's own counting logic -- P-18a's stated scope,
   * next after this sweep -- not something this test should guess at.
   *
   * So the over-fit assertion is deleted rather than re-spelled a third time.
   * The other four tests in this file stay: they pin the guard's own
   * mechanics (it exists, matches exactly, never silences a failure,
   * recomputes on navigation), which remain true regardless of what renders
   * at SIGNED_IN_HOME.
   */

  it("matches the route EXACTLY, so a child route is not silenced by inheritance", () => {
    // A child route is a different surface making its own claims; inheriting
    // the suppression would silence a fact nothing else on screen is saying.
    expect(SRC).not.toContain("pathname.startsWith(");
  });

  it("KEEPS THE FAILURE SENTENCE EVERYWHERE, board included", () => {
    // The guard sits below this line on purpose. A live line that goes quiet on
    // a failed read is read as calm, which is the false all-clear this whole
    // lane exists to prevent.
    const errAt = SRC.indexOf('return "Cannot see what is running"');
    const guardAt = SRC.indexOf("if (waiting > 0 && !onTheBoard)");
    expect(errAt).toBeGreaterThan(-1);
    expect(guardAt).toBeGreaterThan(errAt);
  });

  it("still recomputes when the route changes", () => {
    // Without this in the dependency array the line would keep the previous
    // surface's sentence after navigation - stale by exactly one route.
    const memoEnd = SRC.indexOf("    strip,\n    movingRuns,\n  ]);");
    expect(memoEnd).toBeGreaterThan(-1);
    expect(SRC.slice(memoEnd - 400, memoEnd)).toContain("onTheBoard,");
  });
});

/*
 * "THE SHELL STATES A BOUNDED COUNT AS A BOUND" IS RETIRED, NOT RE-SPELLED
 * (P-18a, A-QUEUE.md).
 *
 * It pinned `gatesArePartial`, the "At least N" / "N+" floor caveat that
 * existed because `getApprovalsQueue` bounded ten gate families to a fixed
 * limit each and could silently drop some of what it counted (S1's own
 * measurement: 116 specs pending a design gate against a limit of 100).
 *
 * `gates` no longer reads `getApprovalsQueue` at all -- P-18a replaced it
 * with `listGatesOnTracks` (src/lib/spine/track.functions.ts), which reads
 * pending gates on OPEN TRACKS ONLY, the same rows Start marks "Needs you".
 * That fixed the count's own defect (65 decisions claimed ready when no
 * count in the workspace was 65) and, with it, removed the thing this block
 * asserted: one query with no families to bound has no floor left to name.
 * `listTracks` and `listMovingTracks` cap at the same 50 open tracks and
 * neither flags that cap as partial; `gates` now matches them rather than
 * carrying a caveat true of a reader it no longer uses.
 */
