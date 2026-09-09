import { describe, expect, it } from "bun:test";

import { whatTheRunWasWorth } from "./what-the-run-was-worth";

const learn = (verdict: unknown) => ({
  station: "learn",
  items: [{ kind: "learning", fields: { verdict } }],
});

describe("how the forecast was graded", () => {
  it("reads the verdict off the Learn stop", () => {
    expect(whatTheRunWasWorth([learn("missed")])).toBe("missed");
  });

  it("folds the record's five words into the three a person is told", () => {
    // `confirmed` and `held` are one outcome to a reader, and so are `refuted`
    // and `missed`. The road folds them too, and a second opinion about what
    // `refuted` means is exactly the drift this repo keeps paying for.
    expect(whatTheRunWasWorth([learn("held")])).toBe("held");
    expect(whatTheRunWasWorth([learn("confirmed")])).toBe("held");
    expect(whatTheRunWasWorth([learn("refuted")])).toBe("missed");
    expect(whatTheRunWasWorth([learn("inconclusive")])).toBe("inconclusive");
  });

  it("takes the newest, because a track sent back through Learn is graded again", () => {
    expect(
      whatTheRunWasWorth([
        { station: "learn", items: [{ kind: "learning", fields: { verdict: "missed" } }] },
        { station: "learn", items: [{ kind: "learning", fields: { verdict: "held" } }] },
      ]),
    ).toBe("held");
  });
});

describe("null is not a grade", () => {
  /*
   * A run that has not reached Learn, or reached it and filed no learning, has
   * NO verdict. `inconclusive` is a real grade meaning the evidence could not
   * settle it. Collapsing them would tell a person their forecast was tested
   * and unclear when nothing was ever tested.
   */
  it("on a run that never reached Learn", () => {
    expect(
      whatTheRunWasWorth([{ station: "design", items: [{ kind: "prototype", fields: {} }] }]),
    ).toBeNull();
  });

  it("on a Learn stop that filed no learning", () => {
    expect(whatTheRunWasWorth([{ station: "learn", items: [] }])).toBeNull();
  });

  it("on a learning with no verdict written", () => {
    expect(whatTheRunWasWorth([learn(null)])).toBeNull();
    expect(whatTheRunWasWorth([{ station: "learn", items: [{ kind: "learning" }] }])).toBeNull();
  });

  it("and on no stops at all", () => {
    expect(whatTheRunWasWorth(null)).toBeNull();
    expect(whatTheRunWasWorth(undefined)).toBeNull();
    expect(whatTheRunWasWorth([])).toBeNull();
  });
});

describe("a word this build has never heard of draws nothing", () => {
  it("rather than putting a raw column value at a person", () => {
    /*
     * `verdict` is a text column, not an enum, so a newer deploy can write a
     * grade this build does not know. `tracks-feed.ts` records paying for
     * exactly this on `forecast_resolution`.
     */
    expect(whatTheRunWasWorth([learn("partially_held")])).toBeNull();
    expect(whatTheRunWasWorth([learn(42)])).toBeNull();
  });

  it("and does not let it wipe out a grade that came before it", () => {
    // The unknown value is skipped, not treated as the newest answer, or a
    // deploy adding a word would blank the card on every already-graded run.
    expect(
      whatTheRunWasWorth([
        { station: "learn", items: [{ kind: "learning", fields: { verdict: "held" } }] },
        { station: "learn", items: [{ kind: "learning", fields: { verdict: "who knows" } }] },
      ]),
    ).toBe("held");
  });
});
