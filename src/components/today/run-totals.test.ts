import { describe, expect, it } from "bun:test";

import { runTotals, spendWords } from "./run-totals";

const session = (cost: number | null, merged = false) =>
  ({
    cost_usd: cost,
    status: "completed",
    changeset: merged ? { status: "merged" } : null,
  }) as never;

describe("runTotals", () => {
  it("sums what sessions reported and counts what shipped", () => {
    const t = runTotals([session(1.5), session(0.25, true), session(0.25, true)], []);
    expect(t.sessionSpendUsd).toBeCloseTo(2.0);
    expect(t.shipped).toBe(2);
  });

  it("KEEPS THE TWO ENGINES APART instead of inventing a combined total", () => {
    // A studio session and a spine track are different objects. Adding their
    // spend would produce a figure neither source can be checked against.
    const t = runTotals([session(2)], [{ spend_used_usd: 3.4734 }]);
    expect(t.sessionSpendUsd).toBe(2);
    expect(t.trackSpendUsd).toBeCloseTo(3.4734);
  });

  it("answers NULL, never zero, when nothing reported a cost", () => {
    // "$0.00 spent" claims the work was free. "No cost reported" is a statement
    // about our knowledge. A surface must never print the first meaning second.
    const t = runTotals([session(null), session(null)], []);
    expect(t.sessionSpendUsd).toBeNull();
    expect(t.sessionsWithoutCost).toBe(2);
  });

  it("says how many sessions reported nothing, so a total can name what it omits", () => {
    const t = runTotals([session(1), session(null), session(null)], []);
    expect(t.sessionSpendUsd).toBe(1);
    expect(t.sessionsWithoutCost).toBe(2);
  });

  it("refuses a negative or non-finite cost rather than folding it into a sum", () => {
    const t = runTotals([session(1), session(-5), session(Number.NaN)], []);
    expect(t.sessionSpendUsd).toBe(1);
    expect(t.sessionsWithoutCost).toBe(2);
  });

  it("survives reads that have not answered", () => {
    expect(runTotals(undefined, undefined)).toEqual({
      shipped: 0,
      sessionSpendUsd: null,
      trackSpendUsd: null,
      sessionsWithoutCost: 0,
    });
  });

  it("matches the live track figure that motivated it", () => {
    // Measured 2026-08-27: $3.4734 across 37 of 47 visible tracks.
    const tracks = [
      ...Array.from({ length: 37 }, () => ({ spend_used_usd: 3.4734 / 37 })),
      ...Array.from({ length: 10 }, () => ({ spend_used_usd: null })),
    ];
    expect(runTotals([], tracks).trackSpendUsd).toBeCloseTo(3.4734, 4);
  });
});

describe("spendWords", () => {
  it("never rounds real spend down to a claim that it was free", () => {
    expect(spendWords(0.004)).toBe("under $0.01");
    expect(spendWords(0.0001)).toBe("under $0.01");
  });

  it("prints ordinary money ordinarily", () => {
    expect(spendWords(3.4734)).toBe("$3.47");
    expect(spendWords(0)).toBe("$0.00");
  });

  it("says nothing when there is nothing to say", () => {
    expect(spendWords(null)).toBeNull();
  });
});
