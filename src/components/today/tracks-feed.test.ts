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
    // The row says the short fact and the sentence rides underneath, verbatim,
    // the same split the waiting rows use: the driver's reasons run past 200
    // characters and the state slot truncates.
    expect(running[0]?.holdLine).toBe("held");
    expect(running[0]?.reason).toBe("No agent is cast for this station.");
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
      /* "needs a restart", never "waiting on your answer": nothing was asked,
         the loop ran out of road and will not try again on its own.

         THE STRING IS RULED (A10) rather than chosen, and it must match
         `run-tab.ts`'s chip lowercased. §12 already spends "Waiting for you"
         on Approvals, a queue of ANSWERABLE items, so a parked row wearing a
         waiting-on-you phrase sends a reader hunting for something to press —
         and 36 of the 37 tracks that wear it have nothing queued at all. */
      expect(waiting[0]?.holdLine).toBe("needs a restart");
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

describe("a calendar wait is not a stoppage, and not an agent either", () => {
  /*
   * `d2263583` reached `learn` at 17:31:31 on 2026-08-31 under sweep - the
   * FIRST track ever to walk there with zero presses - and its forecast is due
   * 2026-10-15, forty-five days out. Its hold sentence says in as many words
   * "nothing here is waiting on a person", while the row above it read "held"
   * inside a lane headed "Waiting on an agent, not on you."
   */
  const learnTrack = {
    id: "d2263583",
    title: "Homeowners abandon checkout when the saved address is re-requested",
    station: "learn" as const,
    status: "open" as const,
    holdReason: "needs-evidence",
    hold: "The forecast this work is graded against comes due on 2026-10-15. Learn returns when it does; nothing here is waiting on a person.",
    updatedAt: "2026-08-31T17:31:31Z",
    drivenAt: "2026-08-31T17:51:04Z",
  };

  it("says it is waiting on time, not that it is held", () => {
    const { running } = trackToBoardRows([learnTrack as never], new Set<string>(), () => "20m");
    expect(running).toHaveLength(1);
    expect(running[0]!.holdLine).toBe("waiting on time");
    expect(running[0]!.holdLine).not.toBe("held");
  });

  it("draws the DRIVER'S sentence, not the generic one that contradicts the row", () => {
    /*
     * THIS TEST ASSERTED THE RIGHT THING FOR THE WRONG REASON AND PASSED ANYWAY,
     * WHICH IS THE LESSON. Its first version fed a fixture whose `hold` I had
     * written myself, containing the date, and concluded the board showed the
     * date. Driving the real board showed `way-out.ts`'s generic sentence -
     * "Connect a source, or file the missing input by hand" - under a row that
     * says nothing is waiting on a person. A fixture I invented cannot falsify
     * a claim about a payload I did not read.
     *
     * So the fixture now carries BOTH fields as the real payload does, and the
     * assertion is that `holdBecause` wins: `hold` is prose built from the
     * reason, `holdBecause` is the driver's own sentence and the only one that
     * names the horizon.
     */
    const real = {
      ...learnTrack,
      hold: "Learn has nothing to work from, and no other station can make it. Connect a source, or file the missing input by hand, and this starts again on its own.",
      holdBecause:
        "The forecast this work is graded against comes due on 2026-10-15. Learn returns when it does; nothing here is waiting on a person.",
    };
    const { running } = trackToBoardRows([real as never], new Set<string>(), () => "20m");
    expect(running[0]!.reason).toContain("2026-10-15");
    expect(running[0]!.reason).toContain("nothing here is waiting on a person");
    expect(running[0]!.reason).not.toContain("Connect a source");
  });

  it("falls back to the generic sentence rather than drawing nothing", () => {
    /* A track held before `last_hold_because` existed has no driver sentence.
       Silence there would lose the only explanation the row has. */
    const older = { ...learnTrack, holdBecause: null, hold: "Learn has nothing to work from." };
    const { running } = trackToBoardRows([older as never], new Set<string>(), () => "20m");
    expect(running[0]!.reason).toBe("Learn has nothing to work from.");
  });

  it("still says HELD for needs-evidence anywhere other than learn", () => {
    /* Both halves are required. `needs-evidence` elsewhere is a real stop -
       way-out.ts answers it with "Connect a source, or file the missing input
       by hand" - and only at learn does it mean the horizon has not arrived. */
    const atBuild = { ...learnTrack, station: "build" as const };
    const { running } = trackToBoardRows([atBuild as never], new Set<string>(), () => "20m");
    expect(running[0]!.holdLine).toBe("held");
  });

  it("still says HELD for a different hold at learn", () => {
    const other = { ...learnTrack, holdReason: "out-of-time" };
    const { running } = trackToBoardRows([other as never], new Set<string>(), () => "20m");
    expect(running[0]!.holdLine).toBe("held");
  });

  it("does not steal a terminal hold from the person's lane", () => {
    /* A10 stands: a terminal hold at learn is still parked work needing a
       restart, and it must not be recoloured as a calendar wait. */
    const givenUp = { ...learnTrack, holdReason: "given-up" };
    const { waiting, running } = trackToBoardRows(
      [givenUp as never],
      new Set<string>(),
      () => "20m",
    );
    expect(running).toHaveLength(0);
    expect(waiting[0]!.holdLine).toBe("needs a restart");
  });
});
