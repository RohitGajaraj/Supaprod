/**
 * THE FIELD THAT WAS DESIGNED AND NEVER FILLED (2026-09-02).
 *
 * `RunMapStation.outcome` promised "WHAT CAME OF THIS STATION, in outcome words
 * a reader would use" and nothing ever set it, so every stage on the run map
 * and the run strip rendered a blank line. This is what fills it.
 *
 * The tests that matter here are the REFUSALS. A line on an audit surface that
 * overstates what happened is worse than no line, because the reader has no way
 * to tell an invented sentence from a measured one.
 */
import { describe, expect, it } from "bun:test";

import { runsByStation, stationOutcome, stationOutcomes } from "./station-outcome";

const run = (agent_slug: string, status: string) => ({ agent_slug, status });

describe("what a station says about itself", () => {
  it("counts the turns taken there and says they finished", () => {
    expect(
      stationOutcome([run("discovery-scout", "completed"), run("researcher", "completed")]),
    ).toBe("2 turns finished");
  });

  it("names how many came out with failures, which is the fact worth seeing", () => {
    // The real shape of run ce846e9b at Discover on production: three agents,
    // two of which reached their step limit.
    expect(
      stationOutcome([
        run("discovery-scout", "completed"),
        run("researcher", "completed_with_failures"),
        run("customer-insights", "completed_with_failures"),
      ]),
    ).toBe("3 turns, 2 with failures");
  });

  it("says none finished clean when every attempt went wrong", () => {
    // Different from "some did" and a person should not have to count to see it.
    expect(stationOutcome([run("builder", "failed"), run("qa", "failed")])).toBe(
      "2 turns, none finished clean",
    );
  });

  it("reads naturally for a single agent", () => {
    expect(stationOutcome([run("critic", "completed")])).toBe("1 turn finished");
    expect(stationOutcome([run("critic", "failed")])).toBe("1 turn, with failures");
  });
});

describe("and what it refuses to say", () => {
  it("says nothing at all for a station that has not run", () => {
    // "0 agents" is a number standing in for an absence. The stage renders no
    // note, which is what an unreached station looks like.
    expect(stationOutcome([])).toBe("");
    expect(stationOutcome(undefined)).toBe("");
  });

  /*
   * A run waiting on a person has NOT gone wrong. It is the one state this
   * product exists to surface, the stage's own state already carries it in
   * `--mrd-you`, and counting it as a failure would paint an ordinary gate as
   * a fault on the audit trail.
   */
  it("does not count a run waiting on a person as a failure", () => {
    expect(
      stationOutcome([run("strategist", "completed"), run("critic", "waiting_approval")]),
    ).toBe("2 turns finished");
  });

  it("drops an agent whose slug maps to no station rather than guessing one", () => {
    // `agentStation` returns null for a delegate or a renamed slug. Filing it
    // under a station it does not serve would put a number on a stage that
    // never ran it.
    const grouped = runsByStation([
      run("discovery-scout", "completed"),
      run("not-a-real-agent-slug", "completed"),
    ]);
    expect(grouped.sense).toHaveLength(1);
    expect(Object.values(grouped).flat()).toHaveLength(1);
  });

  it("omits a station from the map entirely rather than mapping it to an empty string", () => {
    const out = stationOutcomes([run("discovery-scout", "completed")]);
    expect(out.sense).toBe("1 turn finished");
    expect("build" in out).toBe(false);
  });
});

describe("the grouping follows the roster, not the run order", () => {
  it("buckets each agent under the station it serves", () => {
    const out = stationOutcomes([
      run("discovery-scout", "completed"),
      run("researcher", "completed"),
      run("strategist", "completed"),
      run("builder", "failed"),
      run("qa", "completed"),
    ]);
    expect(out.sense).toBe("2 turns finished");
    expect(out.decide).toBe("1 turn finished");
    expect(out.build).toBe("2 turns, 1 with failures");
  });
});
