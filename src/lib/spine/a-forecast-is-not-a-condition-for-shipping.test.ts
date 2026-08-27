/**
 * F-115: SHIP REFUSED TO SHIP UNTIL THE PREDICTION HAD ALREADY COME TRUE.
 *
 * ── MEASURED, ON THE BEST TRACK THIS PRODUCT HAS EVER RUN ──────────────────
 * `a30238f5` entered at `sense`, walked five stations under the sweep, and
 * opened a real pull request on a real repository. It then sat at `ship` on
 * `given-up` with attempts exhausted. Its `release-verifier` runs say why, in
 * the model's own words (2026-08-27 02:10):
 *
 *   *"the spec requires <=5% abandonment on the tablet address re-confirm
 *   screen within 7 days of full rollout, but the actual outcome is 67% tablet
 *   checkout completion, meaning ~33% abandonment, far above the target.
 *   Shipping cannot proceed until the success metric is met."*
 *
 * **No rollout can ever satisfy that.** The number is a claim about seven days
 * AFTER full rollout, and it is being demanded before rollout. One sentence,
 * and it closes the last station before `learn` permanently.
 *
 * ── THE SEAT WAS NOT WRONG, IT WAS UNINFORMED ──────────────────────────────
 * `release-verifier`'s prompt says *"check it against the spec it was built
 * from"*. The number is in the spec. Nothing anywhere told it which numbers in
 * a spec are already-true and which are predictions, so it read a forecast as a
 * requirement and refused honestly.
 *
 * That makes this the same defect as F-114 and as the Learn brief, in a third
 * costume: **the product's central object, the forecast recorded before the
 * outcome is known, was being read by seats that had never been told what it
 * is.** At Learn nobody read it at all. At Ship somebody read it and mistook it
 * for an entry condition. One missing sentence, two opposite failures.
 *
 * ── WHY THE RULE IS STATED IN BOTH DIRECTIONS ──────────────────────────────
 * "Never refuse a forecast for being unmet" on its own invites the worse
 * failure: a seat shipping against a prediction nobody can ever check. An
 * ungradeable forecast makes the verdict at Learn impossible and quietly
 * removes the one thing this product sells. So the legitimate refusal is named
 * as well, and it is about MEASURABILITY, never about the value.
 */
import { describe, expect, it } from "bun:test";

import { AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";
import { stationCrew, stationGoal } from "@/lib/spine/driver";

const TRACK = { title: "Homeowners abandon checkout on the address screen", origin: null };

describe("the rule reaches the seats that were refusing", () => {
  it("the lead seat at ship is told a success metric is a forecast", () => {
    const brief = stationGoal("ship", TRACK);
    expect(brief).toMatch(/success metric in the spec is a FORECAST/i);
  });

  /*
   * RENDERED, NOT READ OFF THE CONSTANT. S4 caught me testing `FILE_IT[station]`
   * directly while the composed brief said something else, because
   * `seat?.file ?? FILE_IT[station]` only reached the constant when a station
   * had no seats. A rule proven present in a constant and absent from the
   * delivered brief is exactly the defect F-114 was.
   */
  it("and so is every other seat in ship's crew, through the composed brief", () => {
    const crew = stationCrew("ship");
    expect(crew.length, "ship has a crew to tell").toBeGreaterThan(0);
    for (const seat of crew) {
      const brief = stationGoal("ship", TRACK, [], seat);
      expect(brief, `ship/${seat.slug}`).toMatch(/REASON to ship, never a condition for shipping/i);
    }
  });
});

describe("what the sentence has to say, in both directions", () => {
  const brief = stationGoal("ship", TRACK);

  it("it forbids the refusal that deadlocked the station", () => {
    expect(brief).toMatch(/never refuse to ship because a predicted number has not happened/i);
  });

  it("it says WHY, so the rule survives a seat that wants to argue with it", () => {
    // "because it cannot have" is the whole argument in three words. A bare
    // prohibition gets reasoned around; a reason does not.
    expect(brief).toMatch(/because it cannot have/i);
  });

  it("it names what a pre-ship check IS, rather than only what it is not", () => {
    // F-24's lesson: a prohibition whose alternative the agent cannot see gets
    // the same behaviour under a new name.
    expect(brief).toMatch(/whether the change is READY/i);
    expect(brief).toMatch(/it exists, review passed, it can be turned back off/i);
  });

  it("it keeps the legitimate refusal, which is about measurability", () => {
    expect(brief).toMatch(/only when it cannot be MEASURED/i);
    expect(brief).toMatch(/what will be observed or by when/i);
  });
});

describe("THE INVARIANT: no station is told a forecast gates its own work", () => {
  /*
   * The mirror of F-115, checked across the whole spine rather than at the one
   * station where it was caught. A rule placed only where it was first broken
   * is a rule waiting to be broken somewhere else.
   *
   * Learn is the exception and must be: grading a forecast IS its work, and
   * `learning.record` refuses a verdict written before the horizon.
   */
  it("only Learn is told to hold work against a forecast's value", () => {
    for (const station of AGENT_STATION_ORDER) {
      if (station === "learn") continue;
      const brief = stationGoal(station, TRACK);
      expect(brief, `${station} waits on a forecast`).not.toMatch(
        /until the (success metric|forecast) is met/i,
      );
    }
  });
});
