/**
 * F-68's other half. The driver now CATCHES a seat claiming a step its own tool
 * calls show was refused (`driver.server.ts`); this is the half that tells the
 * seat not to, so the catch is a backstop rather than the only line.
 *
 * MEASURED, and it is the only instance in 2,635 runs. At 15:00:03 on
 * 2026-08-25 the builder wrote *"These changes were staged and committed to a
 * pull request (#5)"*. Its own calls, same turn: `studio.stage` ok,
 * `studio.stage` ok, **`studio.commit` ok:FALSE**, `studio.pr.open` ok:true.
 * **Staged was true. Committed was false, and it had been told so in the same
 * turn.**
 *
 * WHY IT IS ON EVERY SEAT rather than in the builder's brief: it is not a
 * property of building or of shipping, it is a property of ANSWERING, and every
 * seat answers. A rule placed at the station where it was first broken is a rule
 * that waits to be broken somewhere else.
 */
import { describe, expect, it } from "bun:test";

import { AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";
import { stationCrew, stationGoal } from "@/lib/spine/driver";

const TRACK = { title: "Homeowners abandon checkout on the address screen", origin: null };

describe("every seat, at every station, is told a refusal is not a completion", () => {
  it.each(AGENT_STATION_ORDER)("tells the lead seat at %s", (station) => {
    const brief = stationGoal(station, TRACK);
    expect(brief).toMatch(/report only what your tools actually did/i);
    expect(brief).toMatch(/may not describe that step as done/i);
  });

  /**
   * The property, over the real cast rather than a sampled one: a seat added
   * tomorrow inherits this the day it is written, because it is appended by
   * `stationGoal` rather than copied into each brief.
   */
  it("tells every crew member of every station, not just the leads", () => {
    for (const station of AGENT_STATION_ORDER) {
      for (const seat of stationCrew(station)) {
        const brief = stationGoal(station, TRACK, [], seat);
        expect(brief, `${station}/${seat.slug}`).toMatch(/a step you were told failed/i);
      }
    }
  });
});

describe("what the sentence has to do, and not do", () => {
  const brief = stationGoal("build", TRACK);

  /**
   * F-24's lesson, which F-63 proved again the hard way: a prohibition whose
   * alternative the agent cannot see gets the same behaviour under a new name.
   * F-56 told the builder it could not add a dependency and said nothing about
   * the gate enforcing that — so it disabled the gate.
   */
  it("names the honest alternative rather than only prohibiting", () => {
    expect(brief).toMatch(/say plainly which call was refused and what it said/i);
  });

  /**
   * The alternative has to be worth choosing, not merely permitted. A refusal
   * names the wall, and the wall is the thing a person actually needs.
   */
  it("says why reporting the refusal is useful, not just allowed", () => {
    expect(brief).toMatch(/tells a person which wall this hit/i);
  });

  /**
   * NOT "be accurate" or "be honest". That is advice, and advice does not
   * survive pressure — 13:01 is the measurement. It names the checkable thing:
   * a refusal you were shown.
   */
  it("names a checkable event rather than asking for a virtue", () => {
    expect(brief).toMatch(/refused or returned an error/i);
    expect(brief).not.toMatch(/be honest|be accurate|be truthful/i);
  });

  /**
   * It must not read as "do not report failures", which would produce silence
   * where the whole point is a sentence.
   */
  it("does not discourage reporting the failure itself", () => {
    expect(brief).not.toMatch(/do not mention|omit|leave out/i);
  });

  it("keeps the station's own filing instruction intact beside it", () => {
    expect(brief).toMatch(/studio\.stage/);
    expect(brief).toMatch(/studio\.commit/);
  });
});
