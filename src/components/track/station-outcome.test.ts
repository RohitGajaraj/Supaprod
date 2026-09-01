/**
 * WHAT CAME OF EACH STATION, AND THE VERSION OF THIS THAT SHIPPED FIRST.
 *
 * `RunMapStation.outcome` promised "WHAT CAME OF THIS STATION" and nothing ever
 * set it, so every stage on the run map and the run strip drew a blank line.
 *
 * My first fill counted rows in `agent_runs` and said "3 turns, 2 with
 * failures". True, and the wrong answer: it described the WORK where the field
 * asks for the PRODUCT. `whatItProduced` had been in the tree the whole time,
 * doing exactly this from `spine_track_members`, through a query the run screen
 * already polls. This module is now the hand-off and nothing else, so what is
 * worth testing is the hand-off's edges rather than the sentence -- that has
 * its own tests next to the function that builds it.
 */
import { describe, expect, it } from "bun:test";

import { stationOutcomes, type OutcomeStop } from "./station-outcome";

const stop = (
  station: string,
  label: string,
  members: { kind: string; missing: boolean; title?: string | null }[],
) => ({ station, label, members }) as OutcomeStop;

describe("the hand-off from the chain to the map", () => {
  it("says what a station filed, in the chain's own words", () => {
    const out = stationOutcomes([
      stop("sense", "Discover", [{ kind: "signal", missing: false, title: "A finding" }]),
    ]);
    expect(out?.sense).toBe("Discover filed 1 finding.");
  });

  it("carries a station that filed several things", () => {
    const out = stationOutcomes([
      stop("design", "Design", [
        { kind: "prototype", missing: false, title: "A" },
        { kind: "prototype", missing: false, title: "B" },
      ]),
    ]);
    expect(out?.design).toContain("2 prototypes");
  });
});

describe("and the absences, which are most of a run", () => {
  it("omits a station that filed nothing rather than mapping it to a blank", () => {
    // An absent key means the stop renders no note. "" would be a note that is
    // empty, which reserves meaning for something that has nothing to say.
    const out = stationOutcomes([stop("ship", "Ship", [])]);
    expect(out).toEqual({});
    expect("ship" in (out ?? {})).toBe(false);
  });

  it("omits a station whose every artifact has gone missing", () => {
    // `whatItProduced` returns null when nothing present resolves, and a
    // sentence about artifacts that are not there would be worse than silence
    // on the surface a person opens to audit the run.
    const out = stationOutcomes([
      stop("build", "Build", [{ kind: "changeset", missing: true, title: null }]),
    ]);
    expect(out).toEqual({});
  });

  /*
   * UNDEFINED IS NOT AN EMPTY MAP, and the difference is what the run screen
   * shows on arrival. Undefined means the chain has not answered: every stop
   * renders exactly as it did before this feature existed. An empty map means
   * the chain answered and nothing was filed anywhere.
   */
  it("returns undefined while the read has not answered", () => {
    expect(stationOutcomes(undefined)).toBeUndefined();
    expect(stationOutcomes([])).toEqual({});
  });
});
