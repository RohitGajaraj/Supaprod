import { describe, expect, it } from "bun:test";
import { HOLD_LINE } from "./driver";

/**
 * THE HOLD LINE CARRIES THE EFFECT. THE REASON CARRIES THE CAUSE. THE WAY OUT
 * CARRIES THE DOOR (F-137, enforced 2026-08-31 as F-177).
 *
 * ── WHY THIS BECAME URGENT RATHER THAN TIDY ──────────────────────────────────
 * F-175 populated `last_hold_because` on the 96 held tracks of 97 that had none.
 * The run screen draws the reason and THEN the hold line, so every duplication
 * between the two had been invisible for as long as the column was empty.
 * Turning a column on does not only add information — it activates every latent
 * composition defect that was dormant because the second half never rendered.
 *
 * Three were live the moment it landed, all on holds that ALWAYS carry a reason
 * because `decideCorrection` writes one at every escalate:
 *
 *   needs-a-waived-station  the line was `correction.ts:624` with pronouns where
 *                           that sentence has names — S1 saw both render on
 *                           `6199f3df`, the reason naming Build and Plan and the
 *                           line then saying "this station" and "that station"
 *                           about the two it had just named.
 *   station-cannot-finish   said "several times over" beside a reason that names
 *                           the real count — a vaguer copy of a stated fact.
 *   needs-evidence          **a contradiction, and S0 introduced it in F-175.**
 *                           This hold has TWO writers: a missing precondition,
 *                           and LEARN WAITING ON ITS HORIZON DATE, whose reason
 *                           ends "nothing here is waiting on a person". The line
 *                           then said "Connect a source, or file the missing
 *                           input by hand". Nothing is waiting on you; now go and
 *                           act. True of one cause, false of the other, and one
 *                           sentence cannot be both.
 *
 * ── WHAT THIS ASKS, AND WHY IT ASKS IT THIS WAY ──────────────────────────────
 * Comparing two templates for "restatement" is not decidable. The DOOR is, and
 * it is the part that must not be here: an imperative addressed to the reader
 * belongs in the reason, which can name the station, or in the way out, which is
 * the control. A hold line that tells you what to do is a hold line that has
 * taken the specific sentence's job — which is how all three drifted.
 */

/**
 * Holds where `decideCorrection` always supplies a specific reason.
 *
 * ── `given-up` WAS MISSING FROM THIS LIST AND BELONGED ON IT ALL ALONG ──────
 * Both of `decideCorrection`'s give-up branches write a `because`
 * (`correction.ts:678` and `:728`) and `driver.server.ts:1578` persists it, so
 * this hold has met the list's entry condition since the day it existed. It was
 * simply not added, and the cost was exact: `HOLD_LINE["given-up"]` stood at 150
 * characters — thirty over the cap below, the longest entry in the map — and
 * carried a vaguer copy of every fact its own reason line states precisely.
 *
 * It is the third entry here to have drifted the same way (F-177 took the shape
 * out of `station-cannot-finish`, F-137 out of `corrections-spent`), which is
 * what makes the omission worth a paragraph rather than a line: this list is the
 * only thing that stops the drift, so a hold left off it is not covered by
 * anything.
 */
const ALWAYS_HAS_A_REASON = [
  "needs-evidence",
  "needs-a-waived-station",
  "station-cannot-finish",
  "corrections-spent",
  "given-up",
] as const;

/**
 * Second person, or an imperative aimed at the reader. Deliberately literal:
 * a cleverer detector would be a second thing to be wrong.
 */
const A_DOOR = /\b(connect|put|file it yourself|reconnect|turn|open|go and|click|press)\b/i;

describe("the hold line carries the effect, not the door", () => {
  it("names a line for every hold that always carries a reason", () => {
    for (const hold of ALWAYS_HAS_A_REASON) {
      expect(HOLD_LINE[hold]).toBeTruthy();
    }
  });

  it("keeps the door out of the generic line", () => {
    const withDoors = ALWAYS_HAS_A_REASON.filter((h) => A_DOOR.test(HOLD_LINE[h]));
    expect(withDoors).toEqual([]);
  });

  it("keeps the leading phrase holdLine substitutes the station into", () => {
    /*
     * ADDED BECAUSE TRIMMING THESE LINES BROKE IT ONCE, IN THE COMMIT THAT
     * WROTE THIS FILE. Three of the four are in `STATION_SPECIFIC`, where
     * `holdLine` swaps a leading "This station" for the station's display name
     * (K-18) — so `station-cannot-finish` renders as "Build has stopped here…"
     * in the run map and in the orchid/amber split.
     *
     * My first trim opened with "This has stopped here", which is better prose
     * and quietly turned the substitution off: the replace found nothing, the
     * sentence stayed generic, and `run-map` and `a-hold-says-whose-it-is` both
     * went red. They were right and this guard was not watching, which is why
     * the constraint now lives beside the rule that caused the edit.
     */
    /* `given-up` joined this loop with the list above: it is in
       `STATION_SPECIFIC` too, so its trim had the same way to go wrong, and
       "This station will not be tried again without you." renders as "Build
       will not be tried again without you." only while the phrase survives. */
    for (const hold of [
      "needs-evidence",
      "needs-a-waived-station",
      "station-cannot-finish",
      "given-up",
    ]) {
      expect(HOLD_LINE[hold].startsWith("This station")).toBe(true);
    }
  });

  it("stays short enough to be an effect rather than an explanation", () => {
    // NOT STYLE, AND MUTATION-PROVED TO BE LOAD-BEARING. Run against the three
    // sentences this finding removed, the door test catches two — and
    // `station-cannot-finish` contains no imperative at all, so THIS assertion
    // is the only one that catches it:
    //
    //   needs-evidence          door=true   len=159
    //   needs-a-waived-station  door=true   len=160
    //   station-cannot-finish   door=FALSE  len=168   <- caught by length alone
    //
    // Each had absorbed a cause clause AND a door clause. Neither assertion is
    // redundant, which is the only reason both are here.
    for (const hold of ALWAYS_HAS_A_REASON) {
      expect(HOLD_LINE[hold].length).toBeLessThan(120);
    }
  });
});
