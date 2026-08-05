import { describe, it, expect } from "bun:test";
import { routeIntent, asStation, describeRoutedIntent } from "@/lib/ask/route-intent";
import { AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";
import { WORK_SHAPE_LABEL, type WorkShape } from "@/lib/spine/route";

/**
 * WHERE A SPOKEN INTENT ENTERS THE SEVEN STATIONS.
 *
 * A read-only study concluded that a conversational front door is a ROUTING
 * problem rather than a rebuild, and named the two lines that conclusion stood
 * on: `startTrackCore` has two production callers and `api/chat.ts` is not one
 * of them, and the classifier emits no station, so there is no key to look up
 * in a routing table that is otherwise fully built.
 *
 * `routeIntent` is that missing composition and nothing more. It is pure, it is
 * uncalled, and it ships ahead of the classifier change and the
 * `startTrackCore` call because those touch a live response path on a Workers
 * isolate and this does not. Settling the logic first means the risky piece
 * arrives with its reasoning already proven.
 */

const SHAPES = Object.keys(WORK_SHAPE_LABEL) as WorkShape[];

describe("routeIntent composes what already existed", () => {
  it("has a shape for every one the spine declares", () => {
    // A floor: if WorkShape grows and this list does not, the loop below would
    // pass by checking fewer things than exist.
    expect(SHAPES.length).toBeGreaterThanOrEqual(5);
  });

  it("gives every shape an entry station that is one of the seven", () => {
    for (const shape of SHAPES) {
      const routed = routeIntent({ shape, origin: "asked in Ask" });
      expect(AGENT_STATION_ORDER).toContain(routed.station);
      expect(routed.stationName.length).toBeGreaterThan(0);
    }
  });

  it("names the station in the words a person reads, never the internal id", () => {
    // `sense` is the id; "Discover" is what the whole product calls it, and a
    // receipt reading "Waived: sense" is the exact leak this prevents.
    const routed = routeIntent({ shape: "new-capability", origin: "asked in Ask" });
    expect(routed.stationName).not.toBe(routed.station);
    expect(routed.stationName[0]).toBe(routed.stationName[0].toUpperCase());
  });

  it("carries the whole route, including which stations policy waives and why", () => {
    for (const shape of SHAPES) {
      const routed = routeIntent({ shape, origin: "asked in Ask" });
      expect(Array.isArray(routed.route.path)).toBe(true);
      expect(routed.route.path.length).toBeGreaterThan(0);
      // A waiver without a reason is the thing the spine route model exists to
      // prevent, so if any are present they must each carry one.
      for (const w of routed.route.waived) {
        expect(typeof w.reason).toBe("string");
        expect(w.reason.length).toBeGreaterThan(0);
      }
    }
  });

  it("resolves the seats that serve the entry station", () => {
    const routed = routeIntent({ shape: "interface-change", origin: "asked in Ask" });
    for (const seat of routed.crew) {
      expect(typeof seat.slug).toBe("string");
      expect(seat.slug.length).toBeGreaterThan(0);
    }
  });
});

describe("a named station outranks the shape's default", () => {
  it("enters where the person said, not where the shape guessed", () => {
    // "design the checkout" tells us where to start more directly than any
    // inference from shape does.
    const guessed = routeIntent({ shape: "new-capability", origin: "asked in Ask" });
    const named = routeIntent({
      shape: "new-capability",
      origin: "asked in Ask",
      station: "design",
    });
    expect(named.station).toBe("design");
    if (guessed.station !== "design") expect(named.station).not.toBe(guessed.station);
  });

  it("falls back to the shape rather than throwing on a station it does not know", () => {
    // A model returning something new must degrade to the old behaviour, never
    // fail the send.
    const base = routeIntent({ shape: "incident-fix", origin: "asked in Ask" });
    for (const bad of ["triage", "", "SENSE", null, undefined, 7 as unknown as string]) {
      const routed = routeIntent({ shape: "incident-fix", origin: "asked in Ask", station: bad });
      expect(routed.station).toBe(base.station);
    }
  });

  it("asStation accepts only the seven", () => {
    for (const s of AGENT_STATION_ORDER) expect(asStation(s)).toBe(s);
    for (const bad of ["triage", "Sense", "", null, undefined, {}, 3]) {
      expect(asStation(bad)).toBeNull();
    }
  });
});

describe("what the pane can say before anything is dispatched", () => {
  it("names the station and the seat, both checkable the moment a run starts", () => {
    const routed = routeIntent({ shape: "new-capability", origin: "asked in Ask" });
    const line = describeRoutedIntent(routed);
    expect(line).toContain(routed.stationName);
    expect(line.endsWith(".")).toBe(true);
  });

  it("promises no outcome, because the product does not claim work it has not done", () => {
    for (const shape of SHAPES) {
      const line = describeRoutedIntent(routeIntent({ shape, origin: "asked in Ask" }));
      expect(line).not.toMatch(/\bwill (build|ship|fix|deliver|complete)\b/i);
      expect(line).not.toMatch(/\bfor you\b/i);
    }
  });

  it("never says the same word twice when a station and its seat share a name", () => {
    // Found by printing all five shapes: an interface change produced "Design
    // picks this up, with Design on it." The station carries the information,
    // so the seat clause is what gives way.
    for (const shape of SHAPES) {
      const routed = routeIntent({ shape, origin: "asked in Ask" });
      const line = describeRoutedIntent(routed);
      const station = routed.stationName;
      const occurrences = line.split(station).length - 1;
      expect({ shape, line, occurrences }).toEqual({ shape, line, occurrences: 1 });
    }
  });

  it("is pure: the same intent returns the same sentence", () => {
    const once = describeRoutedIntent(routeIntent({ shape: "under-the-hood", origin: "x" }));
    const twice = describeRoutedIntent(routeIntent({ shape: "under-the-hood", origin: "x" }));
    expect(once).toBe(twice);
  });
});
