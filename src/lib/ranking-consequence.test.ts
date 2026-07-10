import { describe, it, expect } from "bun:test";
import {
  compareByConsequence,
  sortByConsequence,
  type ConsequenceInputs,
} from "./ranking-consequence";

function item(overrides: Partial<ConsequenceInputs> = {}): ConsequenceInputs {
  return {
    needsHumanNow: false,
    windowClosesAt: null,
    stakes: 0,
    recencyAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("compareByConsequence: needs-human-now > window-closing > stakes > recency (PC-32)", () => {
  it("puts a needs-human-now item ahead of everything else", () => {
    const rows = [
      item({ stakes: 100, recencyAt: "2026-07-10T00:00:00Z" }),
      item({ needsHumanNow: true, stakes: 0 }),
    ];
    const sorted = [...rows].sort(compareByConsequence);
    expect(sorted[0].needsHumanNow).toBe(true);
  });

  it("among non-blocking items, the soonest-closing window wins", () => {
    const rows = [
      item({ windowClosesAt: "2026-08-01T00:00:00Z" }),
      item({ windowClosesAt: "2026-07-15T00:00:00Z" }),
      item({ windowClosesAt: null }),
    ];
    const sorted = [...rows].sort(compareByConsequence);
    expect(sorted.map((r) => r.windowClosesAt)).toEqual([
      "2026-07-15T00:00:00Z",
      "2026-08-01T00:00:00Z",
      null,
    ]);
  });

  it("falls back to stakes, then recency, when the earlier tiers tie", () => {
    const rows = [
      item({ stakes: 3, recencyAt: "2026-01-01T00:00:00Z" }),
      item({ stakes: 9, recencyAt: "2026-01-01T00:00:00Z" }),
      item({ stakes: 9, recencyAt: "2026-07-01T00:00:00Z" }),
    ];
    const sorted = [...rows].sort(compareByConsequence);
    expect(sorted.map((r) => [r.stakes, r.recencyAt])).toEqual([
      [9, "2026-07-01T00:00:00Z"],
      [9, "2026-01-01T00:00:00Z"],
      [3, "2026-01-01T00:00:00Z"],
    ]);
  });

  it("does not mutate its input via sortByConsequence", () => {
    const input = [item({ stakes: 1 }), item({ stakes: 2 })];
    const frozen = JSON.stringify(input);
    sortByConsequence(input, (i) => i);
    expect(JSON.stringify(input)).toEqual(frozen);
  });
});
