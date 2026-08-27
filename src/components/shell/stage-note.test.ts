import { describe, expect, it } from "bun:test";

import { stageNote, type StationTally } from "./stage-note";

/**
 * A CHIP MUST NOT CLAIM A BOUND BELONGING TO A READ IT NEVER MADE.
 *
 * This existed as a ternary inside `useSpineStrip`, so the only available check
 * was reading the hook's source and matching a string - and that is how the bug
 * these tests pin shipped. The guard excluded the Learn badge by comparing the
 * note against `learnExtra`, which is the SUFFIX form appended to a run count,
 * while a Learn chip with no runs builds its note from a different branch. The
 * strings never matched. The test asserted the source line, passed, and the
 * rendered strip carried four "More are waiting than this counts" titles where
 * three were true.
 */

const tally = (o: Partial<StationTally> = {}): StationTally => ({
  total: 0,
  working: 0,
  gate: 0,
  held: 0,
  failed: 0,
  ...o,
});
const opts = (o: Partial<Parameters<typeof stageNote>[1]> = {}) => ({
  sessionsBounded: false,
  learnCount: 0,
  isLearn: false,
  ...o,
});

describe("what it says", () => {
  it("puts the gate first, because it is the one waiting on a person", () => {
    expect(stageNote(tally({ total: 9, gate: 2, working: 3, failed: 1 }), opts()).note).toBe(
      "2 runs waiting on you",
    );
  });

  it("says a failure before it says running", () => {
    // A station both running something and having broken something needs the
    // breakage said out loud.
    expect(stageNote(tally({ total: 4, working: 3, failed: 1 }), opts()).note).toBe("1 failed");
  });

  it("IS EMPTY, NOT 'none', when there is nothing to act on", () => {
    expect(stageNote(tally(), opts()).note).toBe("");
  });
});

describe("whether the number is a floor", () => {
  it('marks a session figure with "+", not with "At least"', () => {
    // The words wrapped the Discover chip to two lines and grew the strip.
    expect(stageNote(tally({ gate: 89 }), opts({ sessionsBounded: true })).note).toBe(
      "89+ runs waiting on you",
    );
    expect(stageNote(tally({ gate: 89 }), opts()).note).toBe("89 runs waiting on you");
  });

  it("marks EVERY session branch, not just the loudest", () => {
    // A strip where only the gate line hedges reads as the other six being
    // exact: the same wrong claim in a quieter voice.
    const b = opts({ sessionsBounded: true });
    expect(stageNote(tally({ failed: 1 }), b).note).toBe("1+ failed");
    expect(stageNote(tally({ working: 3 }), b).note).toBe("3+ running");
    expect(stageNote(tally({ held: 2 }), b).note).toBe("2+ held");
    expect(stageNote(tally({ total: 5 }), b).note).toBe("5+ runs");
    for (const t of [{ failed: 1 }, { working: 3 }, { held: 2 }, { total: 5 }, { gate: 1 }]) {
      expect(stageNote(tally(t), b).bounded).toBe(true);
    }
  });

  it("DOES NOT MARK THE LEARN BADGE, which is the bug this file exists for", () => {
    // Outcomes come from `listPendingOutcomes` and `listDueForecastsHere`.
    // Neither is bounded by the sessions cap.
    const out = stageNote(tally(), opts({ sessionsBounded: true, isLearn: true, learnCount: 2 }));
    expect(out.note).toBe("2 outcomes to record");
    expect(out.bounded).toBe(false);
  });

  it("never marks an empty chip", () => {
    expect(stageNote(tally(), opts({ sessionsBounded: true })).bounded).toBe(false);
  });

  it("says BOTH when Learn is running work and holding outcomes", () => {
    const out = stageNote(tally({ total: 3 }), opts({ isLearn: true, learnCount: 2 }));
    expect(out.note).toBe("3 runs, 2 outcomes to record");
    // That figure DID come from the sessions read, so the bound applies to it.
    expect(
      stageNote(tally({ total: 3 }), opts({ isLearn: true, learnCount: 2, sessionsBounded: true }))
        .bounded,
    ).toBe(true);
  });

  it("agrees with itself about one", () => {
    expect(stageNote(tally(), opts({ isLearn: true, learnCount: 1 })).note).toBe(
      "1 outcome to record",
    );
    expect(stageNote(tally({ gate: 1 }), opts()).note).toBe("1 run waiting on you");
  });
});
