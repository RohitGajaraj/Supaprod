import { describe, expect, it } from "bun:test";

import type { Track } from "@/lib/spine/track.functions";
import { TRACK_FRESH_MS, trackToBoardRows } from "./tracks-feed";

const NOW = Date.parse("2026-08-26T15:00:00Z");

/** Date.now is read inside the mapper for freshness; these tests pin behaviour
 *  relative to real time by building timestamps a moment ago. */
const minsAgo = (n: number) => new Date(NOW - n * 60_000).toISOString();

function track(over: Partial<Track>): Track {
  return {
    id: "t1",
    title: "Launch pricing page",
    origin: null,
    entry: "sense",
    station: "sense",
    status: "open",
    route: {
      entry: "sense",
      path: ["sense", "decide", "define", "design", "build", "ship", "learn"],
      waived: [],
    },
    summary: "From Discover to Learn.",
    updatedAt: minsAgo(2),
    hold: null,
    holdReason: null,
    drivenAt: minsAgo(1),
    attempts: 0,
    ...over,
  };
}

// Keep the clock honest without mocking globals: build rows immediately, so
// `minsAgo(1)` is always inside the fresh window and `minsAgo(600)` never is.

describe("trackToBoardRows", () => {
  it("sends a person-hold to waiting-on-you with the stop reason verbatim", () => {
    const { waiting, running } = trackToBoardRows(
      [
        track({
          id: "w",
          holdReason: "waiting-on-a-person",
          hold: "A call is waiting on you at Decide.",
        }),
      ],
      new Set(),
      (iso) => (iso ? "2m" : null),
    );
    expect(waiting).toHaveLength(1);
    // The row says the short fact; the sentence rides UNDER it, verbatim. A
    // 250-character hold in a row's state slot squeezes the title to nothing.
    expect(waiting[0]?.holdLine).toBe("waiting on your answer");
    expect(waiting[0]?.reason).toBe("A call is waiting on you at Decide.");
    expect(running).toHaveLength(0);
  });

  it("files freshly driven open work as running", () => {
    const { running } = trackToBoardRows([track({ id: "r" })], new Set(), (iso) =>
      iso ? "1m" : null,
    );
    expect(running).toHaveLength(1);
    expect(running[0]?.stationWord).toBe("Discover");
    expect(running[0]?.lastMoved).toBe("1m");
  });

  it("keeps stale open work visible instead of quietly dropping it", () => {
    const { running } = trackToBoardRows(
      [track({ id: "s", drivenAt: minsAgo(TRACK_FRESH_MS / 60_000 + 5), holdReason: null })],
      new Set(),
      (iso) => (iso ? "3h" : null),
    );
    expect(running).toHaveLength(1);
    expect(running[0]?.lastMoved).toBe("3h");
  });

  it("carries a non-person hold on a running row so stopped does not read as slow", () => {
    // `no-agent` is a hold the sweep WILL revisit: cast an agent for that
    // station and the track moves on its own. It stays in Running, carrying
    // its reason. `tools-refused` used to be the example here and no longer
    // qualifies, because it is terminal: see the test below.
    const { running } = trackToBoardRows(
      [
        track({
          id: "h",
          drivenAt: minsAgo(30),
          holdReason: "no-agent",
          hold: "No agent is cast for this station.",
        }),
      ],
      new Set(),
      (iso) => (iso ? "30m" : null),
    );
    expect(running).toHaveLength(1);
    expect(running[0]?.holdLine).toBe("No agent is cast for this station.");
  });

  it("PUTS PARKED WORK IN FRONT OF THE PERSON, because no agent is coming", () => {
    /*
     * Every TERMINAL_HOLDS reason used to land in Running, whose sentence is
     * "waiting on an agent, not on you", when the sweep excludes exactly those
     * from selection and one human press is the only exit. S4 measured eight of
     * the nine real open tracks in that state on 2026-08-27, one across 316
     * drives. The list is imported from the sweep rather than restated, so the
     * surface cannot drift from what actually gets driven.
     */
    for (const held of ["given-up", "station-cannot-finish", "tools-refused", "going-in-circles"]) {
      const { waiting, running } = trackToBoardRows(
        [track({ id: held, drivenAt: minsAgo(30), holdReason: held, hold: `Stopped: ${held}.` })],
        new Set(),
        (iso) => (iso ? "30m" : null),
      );
      expect(running, `${held} must not read as running`).toHaveLength(0);
      expect(waiting, `${held} belongs to the person`).toHaveLength(1);
      // "stopped, needs you", never "waiting on your answer": nothing was
      // asked. The loop ran out of road and will not try again on its own.
      expect(waiting[0]?.holdLine).toBe("stopped, needs you");
      expect(waiting[0]?.reason).toBe(`Stopped: ${held}.`);
    }
  });

  it("files done tracks as finished and drops abandoned ones", () => {
    const { finished, running, waiting } = trackToBoardRows(
      [track({ id: "d", status: "done" }), track({ id: "x", status: "abandoned" })],
      new Set(),
      (iso) => (iso ? "1h" : null),
    );
    expect(finished.map((r) => r.id)).toEqual(["d"]);
    expect(running).toHaveLength(0);
    expect(waiting).toHaveLength(0);
  });

  it("never renders a track its mission already shows", () => {
    const rows = trackToBoardRows([track({ id: "dup" })], new Set(["dup"]), (iso) =>
      iso ? "1m" : null,
    );
    expect(rows.running).toHaveLength(0);
    expect(rows.waiting).toHaveLength(0);
    expect(rows.finished).toHaveLength(0);
  });

  it("answers empty when the read has not answered", () => {
    const rows = trackToBoardRows(undefined, new Set(), () => null);
    expect(rows.running).toHaveLength(0);
    expect(rows.waiting).toHaveLength(0);
    expect(rows.finished).toHaveLength(0);
  });

  it("sorts each group newest-touch first", () => {
    const { running } = trackToBoardRows(
      [track({ id: "old", updatedAt: minsAgo(9), drivenAt: minsAgo(8) }), track({ id: "new" })],
      new Set(),
      (iso) => (iso ? "1m" : null),
    );
    expect(running.map((r) => r.id)).toEqual(["new", "old"]);
  });
});
