import { describe, expect, test } from "bun:test";

import { standingState } from "./journey-of-a-run";

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
