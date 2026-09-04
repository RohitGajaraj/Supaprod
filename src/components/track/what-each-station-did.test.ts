/**
 * FOUNDER, 2026-09-04 at 04:09: a person in a run needs to see the lifecycle
 * and where the work is on it. Live on the tablet track the seven names appeared
 * only as transcript labels, and Ship and Learn not at all.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { didLine, stateFor, stationsForMap, type StopLike } from "./what-each-station-did";

const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const stop = (o: Partial<StopLike> & Pick<StopLike, "station">): StopLike => ({
  state: "passed",
  waivedReason: null,
  hold: null,
  holdReason: null,
  everDriven: true,
  items: [],
  ...o,
});

describe("each station says what it did, not what it is for", () => {
  it("counts what a station actually filed", () => {
    expect(
      didLine(stop({ station: "sense", items: [{ kind: "signal" }, { kind: "signal" }] })),
    ).toBe("Found 2 things.");
    expect(didLine(stop({ station: "sense", items: [{ kind: "signal" }] }))).toBe("Found 1 thing.");
    expect(didLine(stop({ station: "define", items: [{ kind: "prd" }] }))).toBe("Spec written.");
  });

  it("says nothing rather than something plausible", () => {
    // A map that invents a sentence for a station it cannot see is a
    // decoration. The name and the state are the honest reading.
    expect(
      didLine(stop({ station: "decide", state: "not-reached", everDriven: false })),
    ).toBeNull();
    expect(didLine(stop({ station: "build", everDriven: false }))).toBeNull();
  });

  it("treats R-36's empty search as something done", () => {
    // Nothing found is not nothing done: the carry IS the finding.
    expect(didLine(stop({ station: "sense", everDriven: true }))).toBe(
      "Searched and found nothing; carried on your sentence.",
    );
  });

  it("lets the hold speak first where the work is standing", () => {
    // A station stopped on something is not described by what it filed before
    // stopping, and the hold is the thing a person can act on.
    expect(
      didLine(
        stop({
          station: "ship",
          state: "here",
          hold: "produced-nothing",
          holdReason: "Waiting for a preview of this change.",
          items: [{ kind: "deployment" }],
        }),
      ),
    ).toBe("Waiting for a preview of this change.");
  });

  it("gives a waived station its reason, which is the point of drawing it", () => {
    expect(
      didLine(
        stop({
          station: "design",
          state: "waived",
          waivedReason: "the call was not to build",
        }),
      ),
    ).toBe("Waived: the call was not to build");
  });

  it("does not draw a held station as live", () => {
    // A station standing on a hold is not working, and drawing it live would be
    // the spinner this product refuses.
    expect(stateFor(stop({ station: "ship", state: "here", hold: "produced-nothing" }))).toBe(
      "held",
    );
    expect(stateFor(stop({ station: "ship", state: "here" }))).toBe("active");
    expect(stateFor(stop({ station: "learn", state: "not-reached" }))).toBe("pending");
    expect(stateFor(stop({ station: "design", state: "waived" }))).toBe("skipped");
  });

  it("omits the outcome key entirely when there is nothing to say", () => {
    const [s] = stationsForMap([stop({ station: "learn", state: "not-reached" })]);
    expect("outcome" in s).toBe(false);
    expect(s.state).toBe("pending");
  });

  it("draws the whole route, including the stations still ahead", () => {
    // The defect: Ship and Learn did not appear at all, so a person could not
    // tell how much route was left.
    const all = stationsForMap([
      stop({ station: "sense", items: [{ kind: "signal" }] }),
      stop({ station: "decide", items: [{ kind: "decision" }] }),
      stop({ station: "ship", state: "here", hold: "produced-nothing", holdReason: "Waiting." }),
      stop({ station: "learn", state: "not-reached", everDriven: false }),
    ]);
    expect(all.map((s) => s.station)).toEqual(["sense", "decide", "ship", "learn"]);
    expect(all[3].state).toBe("pending");
  });
});

describe("it is a map, not navigation", () => {
  const PANE = code(readFileSync("src/components/track/ArtifactPane.tsx", "utf8"));
  const MOD = code(readFileSync("src/components/track/what-each-station-did.ts", "utf8"));

  it("draws in replay mode and carries no destination (R-01)", () => {
    // The seven stations are the route the work takes, not places a person goes.
    expect(PANE).toContain('<RunMap stops={mapStations} mode="replay"');
    expect(MOD).not.toContain("navigate");
    expect(MOD).not.toContain("to:");
  });

  it("sits above the record it describes", () => {
    const map = PANE.indexOf("<RunMap stops={mapStations}");
    const made = PANE.indexOf('title="What it has made"');
    expect(map).toBeGreaterThan(-1);
    expect(made).toBeGreaterThan(map);
  });

  it("draws nothing at all when there is no route to draw", () => {
    expect(PANE).toContain("mapStations.length > 0 ?");
    expect(stationsForMap([])).toEqual([]);
  });
});
