/**
 * THE POSITION IS COUNTED, NEVER GUESSED, and these are the counts.
 *
 * The mission this was built for is "agentic work must be seen, not inferred",
 * and the way a surface fails it is not by drawing nothing -- it is by drawing
 * something that reads as progress and is not. This repo has filed four
 * findings in one week about signals that were right about their bookkeeping
 * and wrong about the world, so the assertions that matter here are the ones
 * about what the derivation REFUSES to say:
 *
 *   an idle track never reports `working` or `active`,
 *   a held track never reports `active`,
 *   a waived station is never counted as done or as still to come,
 *   and the denominator is the route the row stores, never seven.
 */
import { describe, expect, test } from "bun:test";

import { runPosition } from "./run-position";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

type Arg = Parameters<typeof runPosition>[0];

function track(over: Partial<Arg> = {}): Arg {
  return {
    station: "build",
    status: "open",
    route: { path: [...AGENT_STATION_ORDER], waived: [] },
    holdReason: null,
    ...over,
  };
}

const states = (t: Arg, walking = false) => runPosition(t, walking).meter.map((m) => m.state);

describe("it counts stops on the route the row actually stores", () => {
  test("a full route is seven stops and the position is where the row says", () => {
    const p = runPosition(track(), false);
    expect(p.total).toBe(7);
    expect(p.index).toBe(AGENT_STATION_ORDER.indexOf("build") + 1);
    expect(p.stops.length).toBe(7);
  });

  test("a shortened route shortens the DENOMINATOR, it does not pad back to seven", () => {
    // Existing-feature work commonly enters at Plan. Reporting "station 2 of 7"
    // on a three-station route would be a proportion of a route this work does
    // not have.
    const path: AgentStation[] = ["define", "build", "ship"];
    const p = runPosition(track({ station: "build", route: { path, waived: [] } }), false);
    expect(p.total).toBe(3);
    expect(p.index).toBe(2);
  });

  test("a waived station stays on the map as the decision it was", () => {
    const path = AGENT_STATION_ORDER.filter((s) => s !== "design");
    const p = runPosition(
      track({
        station: "build",
        route: { path, waived: [{ station: "design", reason: "No interface changes." }] },
      }),
      false,
    );
    // Seven segments, because the waiver is on the record rather than a gap.
    expect(p.total).toBe(7);
    const design = p.meter.find((m) => m.key === "design");
    expect(design?.state).toBe("waived");
    // And the reason travels with it, which is the founder ruling this map
    // exists to enforce.
    expect(p.stops.find((s) => s.station === "design")?.waivedReason).toBe("No interface changes.");
    // A waiver is neither behind it nor ahead of it.
    expect(states(track())).not.toContain("waived");
  });
});

describe("it never claims a machine is working when no row says one is", () => {
  test("parked at a station with nobody driving reads as HERE, not as running", () => {
    const p = runPosition(track({ holdReason: null }), false);
    expect(p.meter[AGENT_STATION_ORDER.indexOf("build")].state).toBe("here");
    expect(states(track())).not.toContain("working");
    // And the map says the same word, so the two cannot disagree.
    expect(p.stops[AGENT_STATION_ORDER.indexOf("build")].state).toBe("here");
  });

  test("a walk in flight is the ONLY thing that turns a stop to working", () => {
    const p = runPosition(track(), true);
    expect(p.meter[AGENT_STATION_ORDER.indexOf("build")].state).toBe("working");
    expect(p.stops[AGENT_STATION_ORDER.indexOf("build")].state).toBe("active");
  });

  test("a hold on a condition is amber and never `active`", () => {
    const p = runPosition(track({ holdReason: "out-of-credit" }), false);
    const i = AGENT_STATION_ORDER.indexOf("build");
    expect(p.meter[i].state).toBe("held");
    expect(p.stops[i].state).toBe("held");
    expect(p.stops[i].hold).toBe("out-of-credit");
  });

  test("a hold on a PERSON is a different state from a hold on a condition", () => {
    const p = runPosition(track({ holdReason: "waiting-on-a-person" }), false);
    const i = AGENT_STATION_ORDER.indexOf("build");
    expect(p.meter[i].state).toBe("waiting");
    expect(p.stops[i].state).toBe("needs-approval");
  });

  test("the walk wins over a stale hold, because the hold is the LAST reason", () => {
    // `last_hold` records why the driver declined last time. While a drive is
    // in flight from this tab, that reason is history, and painting amber over
    // a run that is visibly moving is the surface arguing with the work.
    const p = runPosition(track({ holdReason: "out-of-time" }), true);
    expect(p.meter[AGENT_STATION_ORDER.indexOf("build")].state).toBe("working");
  });
});

describe("a closed run has no position, and says so rather than inventing one", () => {
  test("a finished track has PASSED the station it stopped on", () => {
    // Matched deliberately to `buildChain`'s own rule, so the pane and the
    // header cannot describe one run two ways.
    const p = runPosition(track({ station: "learn", status: "done" }), false);
    expect(p.meter[AGENT_STATION_ORDER.indexOf("learn")].state).toBe("done");
    expect(states(track({ station: "learn", status: "done" }))).not.toContain("here");
  });

  test("abandoned work is not painted as still going", () => {
    const p = runPosition(track({ station: "build", status: "abandoned" }), false);
    expect(p.meter[AGENT_STATION_ORDER.indexOf("build")].state).toBe("done");
    expect(states(track({ station: "build", status: "abandoned" }))).not.toContain("working");
  });
});

describe("it carries no outcome text, and that is structural", () => {
  test("no stop ever leaves here with an `outcome`", () => {
    // What each station FILED is `TrackChain`'s question, answered in the pane
    // beside this one. Two components answering it in two rhythms is how one
    // run comes to have four views of itself.
    const p = runPosition(track(), false);
    for (const stop of p.stops) expect(stop.outcome).toBeUndefined();
  });
});
