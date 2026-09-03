/**
 * THE CHARACTER MUST NOT PROMISE WORK THAT IS CLOSED (S1 → S0, 2026-08-27).
 *
 * Photographed on an abandoned track. Supa said:
 *
 *     "I've stopped, the reason is on the hold line. I'll carry on when it
 *      clears."
 *
 * Two false claims in one sentence, on a screen that contradicts both.
 *
 * **There is no hold line on that surface**, so it points at something nothing
 * is drawing — the defect `TrackRun` already names: *"Pointing at a door that is
 * not there is the same defect as pointing at none."*
 *
 * **And "I'll carry on" promises work that is closed**, eight lines above two
 * controls that say the opposite and say it well: *"This work was abandoned, so
 * there is nothing left to drive"* and *"This work is closed, so there is no
 * step to take over."* So the product's own voice contradicted two correct
 * statements on its own screen.
 *
 * ── THE CAUSE IS A SOUND COMMENT THAT OUTLIVED ITS CONDITION ───────────────
 * The hold branch defers to the hold line rather than restating it, which is
 * right WHILE a hold line exists and something will clear it. Once the work is
 * closed neither is true, and the branch never asked.
 */
import { describe, expect, it } from "bun:test";

import { deriveCharacter } from "./character";

const at = (status: string, holdReason: string | null = "station-cannot-finish") =>
  deriveCharacter({ track: { status, holdReason, drivenAt: "2026-08-26T12:00:00Z" } } as never);

describe("closed work is answered before the hold branch", () => {
  it("an abandoned track is not promised a return", () => {
    const line = at("abandoned").line;
    expect(line).not.toContain("carry on");
    expect(line).not.toContain("hold line");
    expect(line).toContain("will not pick it up again");
  });

  it("a finished track is not promised one either", () => {
    // S1 raised this without asserting it: `done` reaches the done branch only
    // via `result.stopped === "finished"` or the done hold, so a read straight
    // from the database with neither would have fallen through to the promise.
    const line = at("done").line;
    expect(line).not.toContain("carry on");
    expect(line).not.toContain("hold line");
  });

  it("and neither points at a hold line the surface is not drawing", () => {
    for (const status of ["abandoned", "done"]) {
      expect(at(status).line).not.toContain("hold line");
    }
  });
});

describe("what must NOT change: open work still defers to the hold line", () => {
  it("an open held track says nothing at all now, rather than deferring in words", () => {
    /*
     * The rule this protects is unchanged and its remedy is stronger. Two
     * sentences disagreeing about one stop is how surfaces drift, and the
     * character used to avoid that by CHOOSING WORDS that deferred. P-37 takes
     * the sentence away instead: the card owns the run's state, so there is no
     * second sentence left to drift from.
     */
    const p = at("open");
    expect(p.state).toBe("quiet");
    expect(p.line).toBe("");
  });

  it("and an open track with no hold is unaffected", () => {
    expect(at("open", null).line).not.toContain("hold line");
  });
});
