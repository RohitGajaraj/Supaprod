import { describe, expect, test } from "bun:test";

import { standingState, withPresences } from "./journey-of-a-run";

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
