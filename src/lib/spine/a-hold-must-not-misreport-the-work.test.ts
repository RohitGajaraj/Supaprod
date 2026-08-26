/**
 * A HOLD MUST NOT MISREPORT THE WORK (S4-043, 2026-08-27).
 *
 * `station-cannot-finish` is the most expensive sentence the loop writes: it
 * tells a person to stop looking at their work and go inspect a station. It was
 * wrong in two independent ways at once.
 *
 * ── ONE: IT COUNTED WITH A CONSTANT ────────────────────────────────────────
 * It interpolated `MAX_STATION_ATTEMPTS`, not the row. So it said "finished
 * empty 3 times" on 13 tracks whose `attempts` read 0, and it never once
 * reported what actually happened.
 *
 * ── TWO, AND WORSE: IT ASSERTED A PREMISE NOBODY CHECKED ───────────────────
 * S4 measured that **20 of 32 held tracks had filed work at the very station the
 * sentence said finished empty** — Discover 15 of 21, holding 695 rows between
 * them; Design 3 of 7; Decide 2 of 4. One track had 20 signals at Discover,
 * `attempts` 0, 56 drives, and a sentence sending its reader to inspect the
 * station that produced them.
 *
 * A hold that misreports the work is worse than a hold with no sentence. It
 * spends the scarcest thing in the product, a person's attention, on the wrong
 * thing, and it teaches them the product does not know what happened.
 */
import { describe, expect, it } from "bun:test";

import { decideCorrection, type CorrectionInputs } from "./correction";
import { fullRoute } from "./route";

/*
 * REACHING THE BRANCH AT ALL IS HALF THE TEST.
 *
 * The first version of this file guarded every assertion with `if (sentence)`
 * and passed six times while checking nothing: those inputs returned `retry`,
 * so the sentence under test was never built. Discover with its evidence met
 * and its attempts spent is the combination that reaches it, and `reaches()`
 * below asserts that rather than assuming it.
 */
const held = (over: Partial<CorrectionInputs>): CorrectionInputs =>
  ({
    hold: "stalled",
    station: "sense",
    route: fullRoute(),
    attempts: 3,
    corrections: 0,
    filed: ["signal"],
    externalMet: true,
    ...over,
  }) as CorrectionInputs;

function sentence(over: Partial<CorrectionInputs>): string {
  const d = decideCorrection(held(over));
  expect(d.action, "these inputs no longer reach station-cannot-finish").toBe("escalate");
  expect((d as { reason: string }).reason).toBe("station-cannot-finish");
  return (d as { because: string }).because;
}

describe("it counts from the row, never from the constant", () => {
  it("reports the row's own number", () => {
    /*
     * 5, not 2. The branch is only reachable once attempts have been spent, so
     * a number BELOW the constant cannot be used to prove the constant is gone.
     * Above it can: the old code printed MAX_STATION_ATTEMPTS whatever the row
     * held, so a row at 5 printing "5 times" is only possible after the fix.
     */
    expect(sentence({ attempts: 5, filedAtThisStation: [] })).toContain("finished empty 5 times");
  });

  it("so a row reading 5 never prints the constant's 3", () => {
    expect(sentence({ attempts: 5, filedAtThisStation: [] })).not.toContain("3 times");
  });
});

describe("THE PREMISE: it does not claim empty when the station filed", () => {
  it("a station that filed is not described as having finished empty", () => {
    const s = sentence({ filedAtThisStation: ["signal", "signal", "theme"] });
    expect(s).not.toContain("finished empty");
    expect(s).toContain("filed 3 things here");
  });

  it("one artifact reads as one thing, not '1 things'", () => {
    expect(sentence({ filedAtThisStation: ["theme"] })).toContain("filed one thing here");
  });

  it("an unchecked station stays neutral rather than asserting either way", () => {
    // `undefined` means nobody looked. The old code asserted regardless, which
    // is how a sentence nothing verified reached 20 tracks.
    expect(sentence({ filedAtThisStation: undefined })).toContain("finished empty");
  });

  it("and either way it still names the next action", () => {
    for (const here of [[], ["signal"]] as string[][]) {
      expect(sentence({ filedAtThisStation: here })).toContain("your eyes on the station");
    }
  });
});
