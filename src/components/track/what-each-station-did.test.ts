/**
 * FOUNDER, 2026-09-04 at 04:09: a person in a run needs to see the lifecycle
 * and where the work is on it. Live on the tablet track the seven names appeared
 * only as transcript labels, and Ship and Learn not at all.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { didLine, stateFor, stationsForMap, type StopLike } from "./what-each-station-did";
import { HOLD_LINE } from "@/lib/spine/driver";

const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const stop = (o: Partial<StopLike> & Pick<StopLike, "station">): StopLike => ({
  state: "passed",
  waivedReason: null,
  hold: null,
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
    /*
     * A map that invents an OUTCOME for a station it cannot see is a
     * decoration. `build` here has been reached and has filed nothing, so
     * there is genuinely nothing to report about what it did.
     */
    expect(didLine(stop({ station: "build", everDriven: false }))).toBeNull();
  });

  it("a station still ahead says what it will need, not what it did", () => {
    /*
     * P-74b. Blank rows told a person nothing about what is coming. This is
     * not the invention the rule above forbids: a precondition is read from
     * `STATION_NEEDS`, the same table the correction loop gates dispatch on,
     * and it is worded as a requirement so it cannot be misread as a result.
     */
    expect(didLine(stop({ station: "design", state: "not-reached" }))).toBe(
      "Will need a spec to design against.",
    );
    expect(didLine(stop({ station: "ship", state: "not-reached" }))).toBe(
      "Will need a code change to release.",
    );
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
    /*
     * The hold no longer speaks here. `RunMap` draws `holdLine(stop.hold)`
     * beside this line, so a station that filed something and then stopped says
     * BOTH -- what it did, and the hold's own sentence -- instead of the hold
     * twice. The previous fixture passed a sentence into `holdReason`; the
     * caller passes the raw id, which is how `the-call-is-yours` reached a
     * person's screen.
     */
    expect(
      didLine(
        stop({
          station: "ship",
          state: "here",
          hold: "produced-nothing",
          items: [{ kind: "deployment" }],
        }),
      ),
    ).toBe("Released.");
  });

  it("never renders a raw hold id, whatever the hold", () => {
    /*
     * The rule, not the one id that broke. Every hold in the vocabulary is put
     * through the map and the outcome is checked for the kebab-case shape of a
     * `HoldReason`. A future hold added without a sentence cannot reach a
     * person as an identifier through this path.
     */
    for (const hold of Object.keys(HOLD_LINE)) {
      const said = didLine(stop({ station: "decide", state: "here", hold, items: [] }));
      expect(said ?? "", `hold ${hold}`).not.toMatch(/^[a-z]+(-[a-z]+)+$/);
    }
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
    /*
     * A station that has been REACHED and filed nothing. A station still ahead
     * now carries its precondition instead, which is the P-74b change; this
     * case is the one that still has nothing honest to put there.
     */
    const [s] = stationsForMap([stop({ station: "build", state: "here", everDriven: false })]);
    expect("outcome" in s).toBe(false);
    expect(s.state).toBe("active");
  });

  it("draws the whole route, including the stations still ahead", () => {
    // The defect: Ship and Learn did not appear at all, so a person could not
    // tell how much route was left.
    const all = stationsForMap([
      stop({ station: "sense", items: [{ kind: "signal" }] }),
      stop({ station: "decide", items: [{ kind: "decision" }] }),
      stop({ station: "ship", state: "here", hold: "produced-nothing" }),
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
