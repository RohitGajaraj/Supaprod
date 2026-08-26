import { describe, expect, it } from "bun:test";

import { takeOver, undoneLine } from "./take-over";
import { fullRoute, type SpineRoute } from "@/lib/spine/route";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

const open = (station: AgentStation, route: SpineRoute = fullRoute()) =>
  takeOver({ status: "open" as const, station, route });

describe("what a person may take over", () => {
  it("offers nothing on work that is closed, and says why", () => {
    for (const status of ["done", "abandoned"] as const) {
      const t = takeOver({ status, station: "build", route: fullRoute() });
      expect(t.undoTo).toBeNull();
      expect(t.handback).toBe(false);
      expect(t.nothing).toContain("closed");
    }
  });

  it("has nothing to send back at the first step on the route", () => {
    const t = open("sense");
    expect(t.undoTo).toBeNull();
    expect(t.undoLabel).toBeNull();
    expect(t.nothing).toContain("first step");
  });

  it("goes back exactly one step, and names it", () => {
    const t = open("define");
    expect(t.undoTo).toBe("decide");
    expect(t.undoLabel).toBe("Send it back to Decide");
    // The line REPLACES the controls; it must not appear beside one.
    expect(t.nothing).toBeNull();
  });

  /*
   * THE TEST THAT PAYS FOR THIS FILE. Walking `AGENT_STATION_ORDER` instead of
   * the run's own route passes every other case here and fails only this one --
   * by sending the work back to a station it was never going to visit.
   */
  it("skips a waived station, because the route is the run's, not the spine's", () => {
    const waivedDecide: SpineRoute = {
      entry: "sense",
      path: ["sense", "define", "design", "build", "ship", "learn"],
      waived: [
        { station: "decide", reason: "The call was already made.", by: "person", reopensWhen: "never" },
      ],
      origin: null,
    };
    expect(open("define", waivedDecide).undoTo).toBe("sense");
  });

  it("offers a handback only where a link can stand in for the outcome", () => {
    for (const s of ["build", "ship"] as const) expect(open(s).handback).toBe(true);
    for (const s of ["sense", "decide", "define", "design", "learn"] as const) {
      expect(open(s).handback).toBe(false);
    }
  });

  it("never points forward, at any station on the route", () => {
    for (const station of AGENT_STATION_ORDER) {
      const { undoTo } = open(station);
      if (!undoTo) continue;
      expect(AGENT_STATION_ORDER.indexOf(undoTo)).toBeLessThan(
        AGENT_STATION_ORDER.indexOf(station),
      );
    }
  });
});

describe("what the undo says it did", () => {
  /*
   * A TRIPWIRE ON THE GUARANTEE, not on the wording. `rewindTrackTo` supersedes
   * and never deletes; if this sentence is ever rewritten to say the work was
   * removed, the surface is claiming something the server does not do -- on the
   * one record a verdict is measured against.
   */
  it("promises the earlier work is kept", () => {
    const line = undoneLine("define");
    expect(line).toContain("Plan");
    expect(line).toContain("not deleted");
    expect(line.toLowerCase()).not.toContain("removed");
  });
});
