import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A HOLD THAT CANNOT SAY WHY INVITES THE READER TO INVENT A REASON (F-175).
 *
 * ── WHAT HAPPENED, AND IT HAPPENED TO ME ─────────────────────────────────────
 * Track `d2263583` held at `nothing-to-hand-on` four sweeps running with
 * `last_hold_because` NULL. Having no recorded reason, I read the template out
 * of `driver.server.ts` and reported it as though the record had said it. That
 * was a fabrication and it is retracted. Measured the same hour: **97 held
 * tracks, exactly ONE carrying a `last_hold_because`.**
 *
 * ── THE RULE, AND WHY IT IS EXACTLY THIS RULE ────────────────────────────────
 * F-127 argued a hold should write NOTHING when its line is `HOLD_LINE[hold]`,
 * because a generic line in a column meant for specifics is worse than a null —
 * it looks like a reason while being derivable from the word beside it. That is
 * right, and it is the whole test: **a site whose line is computed holds
 * something no reader can reconstruct** — the verifier's reason, the horizon
 * date, the failing tool, the next station's unmet need, the thrown error —
 * **and it dies with the tick unless the write carries it.**
 *
 * So: every `last_hold` write persists a `last_hold_because`, and the only
 * exemptions are the three whose sentence is the static map itself.
 *
 * ── WHY THIS IS SHAPED THE WAY IT IS ─────────────────────────────────────────
 * Read STRUCTURALLY, not by matching sentences. Three source-text assertions
 * broke in one day when the code they quoted was rewrapped or refactored, none
 * of which changed behaviour. This asks a question about the shape of each
 * update object, so re-wording a hold line, renaming a local, or reflowing the
 * file leaves it green — and deleting the column write turns it red.
 */

const DRIVER = readFileSync(join(import.meta.dir, "driver.server.ts"), "utf8");

/**
 * The sites whose line IS `HOLD_LINE[hold]`, verbatim, with nothing computed.
 *
 * Each names a fact about the WORLD rather than about this track: the Worker ran
 * out of duration, the account ran out of money, a person has not answered yet,
 * or `decideCorrection` chose a hold whose sentence is the static map (F-127).
 * The word carries the whole meaning, so a sentence in the column would add
 * length and no information — and would READ as a specific reason while being
 * derivable, which is the failure in the other direction.
 *
 * Written as the hold EXPRESSION rather than the hold word because the last of
 * them is dynamic. Adding a line here means arguing that case in the comment.
 */
const SAYS_ONLY_WHAT_THE_WORD_SAYS = [
  'last_hold: "out-of-time"',
  'last_hold: "over-budget"',
  'last_hold: "waiting-on-a-person"',
  // F-127, and the file argues it at the site: this branch's line is
  // `HOLD_LINE[decision.hold]`, which `holdLine()` already derives on read.
  "last_hold: decision.hold",
];

/** Every `.update({ ... } as never)` object literal in the driver, flattened. */
function updateObjects(): string[] {
  return DRIVER.split(".update(")
    .slice(1)
    .map((chunk) => chunk.split("as never")[0].replace(/\s+/g, " "))
    .filter((o) => o.includes("last_hold:"));
}

describe("a hold must say why", () => {
  it("writes a reason at every hold whose sentence is computed", () => {
    const objects = updateObjects();
    // Guards the guard: if the driver is refactored so this finds nothing, the
    // test would pass by vacuously checking zero sites.
    expect(objects.length).toBeGreaterThanOrEqual(8);

    const silent = objects.filter((o) => {
      if (o.includes("last_hold_because")) return false;
      return !SAYS_ONLY_WHAT_THE_WORD_SAYS.some((site) => o.includes(site));
    });

    expect(silent).toEqual([]);
  });

  /**
   * ── "LEAVES THE COLUMN ALONE" WAS THE WRONG HALF OF F-127 (2026-09-03) ────
   *
   * This test used to assert that a generic hold writes NOTHING to
   * `last_hold_because`, and it was right about the sentence and wrong about the
   * write. Leaving the column alone does not leave it empty: it leaves whatever
   * the LAST hold put there, attached to a hold it has nothing to do with.
   *
   * Both halves were seen on one night, 2026-09-02, by A1 watching the live run:
   *
   *   `6817e386`  hold `waiting-on-a-person` on a merge gate, because-sentence
   *               "Stopped by you." -- from a stop cleared eight minutes earlier.
   *   `2fdf93b6`  hold `out-of-time`, because-sentence "The checks were never
   *               run on this change" -- from the self-check before it.
   *
   * Both sentences were true when written and both were lies where they were
   * read. F-127's argument survives intact and points the other way once the
   * distinction is made: a GENERIC sentence is worse than null, and null is
   * readable as "no more was said". A STALE sentence is worse than either,
   * because it reads as a specific reason for the wrong hold.
   *
   * So a generic hold now writes `null` explicitly. That is not a sentence; it
   * is the removal of one.
   */
  it("clears the column where the word already carries the meaning", () => {
    for (const expression of SAYS_ONLY_WHAT_THE_WORD_SAYS) {
      const sites = updateObjects().filter((o) => o.includes(expression));
      expect(sites.length).toBeGreaterThan(0);
      for (const site of sites) {
        // Written, and written as null. Both halves matter: omitting the key
        // leaves the stale line, and any string here is the generic sentence
        // F-127 refused.
        expect(site, `${expression} must clear the sentence`).toContain("last_hold_because: null");
      }
    }
  });

  it("no hold anywhere writes a word without settling its sentence", () => {
    /*
     * THE CANARY A1 ASKED FOR. Every object that sets `last_hold` must also say
     * what happens to `last_hold_because` -- a real sentence, or null. Silence
     * is the bug, and it is invisible at the call site because the column simply
     * keeps its old value.
     */
    const silent = updateObjects().filter((o) => !o.includes("last_hold_because"));
    expect(silent).toEqual([]);
  });
});
