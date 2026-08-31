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

  it("leaves the column alone where the word already carries the meaning", () => {
    // The other half of F-127. A generic line stored here would read as a
    // specific reason to every surface that shows it, which is the failure this
    // whole finding is about — one direction of it rather than the other.
    for (const expression of SAYS_ONLY_WHAT_THE_WORD_SAYS) {
      const sites = updateObjects().filter((o) => o.includes(expression));
      expect(sites.length).toBeGreaterThan(0);
      for (const site of sites) expect(site).not.toContain("last_hold_because");
    }
  });
});
