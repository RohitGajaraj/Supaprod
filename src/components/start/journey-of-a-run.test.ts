import { describe, expect, test } from "bun:test";

import { roughDuration, standingState, withPresences, withTimings } from "./journey-of-a-run";

const base = {
  status: "open" as const,
  needsYou: false,
  working: false,
  holdReason: null as string | null,
  holdBecause: null as string | null,
};

describe("standingState", () => {
  test("a route that skips a station the work needs is held, so the row gets its Decide", () => {
    // Seen live 12:37 IST 2026-09-08: the row said "Put it back, or file it
    // yourself" and offered neither, because this reason drew a waiting dot
    // and no control. Held is what opens the hold card under the row.
    expect(standingState({ ...base, holdReason: "needs-a-waived-station" })).toBe("held");
  });

  test("a wait for a date the machine already knows is scheduled, not held", () => {
    expect(
      standingState({
        ...base,
        holdReason: "needs-evidence",
        holdBecause: "Graded on 2026-10-03. Nothing to do until then.",
      }),
    ).toBe("scheduled");
  });

  test("a person's call outranks any hold", () => {
    expect(standingState({ ...base, needsYou: true, holdReason: "given-up" })).toBe("you");
  });
});

describe("withPresences", () => {
  const stations = [
    { key: "sense" as const, state: "working" as const, count: 1 },
    { key: "build" as const, state: "pending" as const, count: 0 },
  ];
  const colour = (seat: string) => `--mrd-viz-${seat.length}`;

  test("a seat working at a station is drawn there, in its own colour", () => {
    const out = withPresences(stations, [{ seat: "Ada", station: "sense" }], colour);
    expect(out[0]!.presences).toEqual([{ seat: "Ada", colour: "--mrd-viz-3" }]);
    expect(out[1]!.presences).toBeUndefined();
  });

  test("the same seat twice at one station is one dot; a seat with no station draws nowhere", () => {
    const out = withPresences(
      stations,
      [
        { seat: "Ada", station: "sense" },
        { seat: "Ada", station: "sense" },
        { seat: "Grace", station: null },
      ],
      colour,
    );
    expect(out[0]!.presences).toHaveLength(1);
    expect(out[1]!.presences).toBeUndefined();
  });

  test("no seats leaves the map exactly as it was", () => {
    expect(withPresences(stations, [], colour)).toEqual(stations);
  });
});

describe("withTimings", () => {
  const stations = [
    { key: "sense" as const, state: "working" as const },
    { key: "build" as const, state: "pending" as const },
  ];

  test("a working station says how long it usually takes here, from a real sample", () => {
    const out = withTimings(stations, {
      byStation: { sense: { p50Ms: 4 * 60_000, n: 3 }, build: { p50Ms: 60_000, n: 2 } },
    });
    expect(out[0]!.outcome).toBe("usually about 4 min here");
    expect(out[1]!.outcome).toBeUndefined();
  });

  test("no sample says nothing, and a station's own outcome line is never overwritten", () => {
    expect(
      withTimings(stations, { byStation: { sense: { p50Ms: null, n: 0 } } })[0]!.outcome,
    ).toBeUndefined();
    const own = [{ key: "sense" as const, state: "working" as const, outcome: "3 findings" }];
    expect(withTimings(own, { byStation: { sense: { p50Ms: 60_000, n: 9 } } })[0]!.outcome).toBe(
      "3 findings",
    );
    expect(withTimings(stations, undefined)).toEqual(stations);
  });

  test("a seat past the usual time says so, with the usual time beside it", () => {
    const now = Date.parse("2026-09-08T09:00:00Z");
    const late = [{ key: "sense" as const, state: "working" as const, at: "2026-09-08T08:50:00Z" }];
    const out = withTimings(late, { byStation: { sense: { p50Ms: 4 * 60_000, n: 3 } } }, now);
    expect(out[0]!.outcome).toBe("past its usual time here (about 4 min)");
    const early = [
      { key: "sense" as const, state: "working" as const, at: "2026-09-08T08:59:00Z" },
    ];
    expect(
      withTimings(early, { byStation: { sense: { p50Ms: 4 * 60_000, n: 3 } } }, now)[0]!.outcome,
    ).toBe("usually about 4 min here");
  });

  test("the duration is coarse on purpose", () => {
    expect(roughDuration(20_000)).toBe("under a minute");
    expect(roughDuration(7 * 60_000)).toBe("about 7 min");
    expect(roughDuration(2.6 * 3_600_000)).toBe("about 3 h");
  });
});
