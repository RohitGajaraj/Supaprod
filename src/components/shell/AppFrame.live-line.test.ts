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
    expect(SRC).toContain("if (gateCount > 0 && !onTheBoard) {");
  });

  it("matches the route EXACTLY, so a child route is not silenced by inheritance", () => {
    // A child of /today is a different surface making its own claims; inheriting
    // the suppression would silence a fact nothing else on screen is saying.
    expect(SRC).toContain('const onTheBoard = pathname === "/today";');
    expect(SRC).not.toContain('pathname.startsWith("/today")');
  });

  it("KEEPS THE FAILURE SENTENCE EVERYWHERE, board included", () => {
    // The guard sits below this line on purpose. A live line that goes quiet on
    // a failed read is read as calm, which is the false all-clear this whole
    // lane exists to prevent.
    const errAt = SRC.indexOf('return "Cannot see what is running"');
    const guardAt = SRC.indexOf("if (gateCount > 0 && !onTheBoard)");
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

describe("the shell states a bounded count as a bound", () => {
  /*
   * `AppFrame` took `queue.data?.items.length ?? 0` and put it in two places a
   * person acts on: the rail's hot number, which is what they navigate by, and
   * the live line's sentence.
   *
   * `getApprovalsQueue` bounds every one of ten families and degrades a family
   * that throws to an empty list, so that length is what SURVIVED the read, not
   * what is waiting. S1 measured the gap: 116 specs pending a design gate
   * against a limit of 100.
   *
   * The board's headline was fixed for this first. Fixing one surface and not
   * the other would be worse than fixing neither: two counts of one population
   * within a viewport, one hedged and one not, reads as the two disagreeing.
   */
  it("knows whether the count is a floor", () => {
    expect(SRC).toContain("const gatesArePartial = countIsAFloor(queue.data?.incomplete);");
  });

  it("uses the board's own wording in the sentence", () => {
    expect(SRC).toContain('const lead = gatesArePartial ? "At least " : "";');
  });

  it("MARKS THE RAIL CHIP, which has no room for the word", () => {
    // "52+" is the compact form of "At least 52". The title carries the
    // sentence for anyone who stops on it.
    expect(SRC).toContain('{count === "gates" && gatesArePartial ? "+" : ""}');
    expect(SRC).toContain('"More are waiting than this counts"');
  });

  it("marks only the count that can actually be bounded", () => {
    // The Runs row counts a different read and must not inherit a caveat that
    // is not true of it.
    const at = SRC.indexOf('{count === "gates" && gatesArePartial ? "+" : ""}');
    expect(at).toBeGreaterThan(-1);
    expect(SRC.slice(at - 500, at)).toContain('count === "gates"');
  });

  it("recomputes when the gap does", () => {
    const memoEnd = SRC.indexOf("    strip,\n    movingRuns,\n  ]);");
    expect(SRC.slice(memoEnd - 500, memoEnd)).toContain("gatesArePartial,");
  });
});
