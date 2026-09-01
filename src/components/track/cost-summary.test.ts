/**
 * THE COST FIGURES KEEP EACH COLUMN'S OWN HONESTY RULE.
 *
 * Time and tokens aggregate only measured values -- a zero on those columns is
 * a finalizer that did not write, and summing it would quietly turn "unknown"
 * into "free". Money sums as written: a seat refused before a model is
 * genuinely $0. These tests pin the split, because the two rules look like one
 * rule and drift apart exactly when somebody "simplifies" them.
 */
import { describe, expect, it } from "bun:test";

import { costLines, costSummary } from "./cost-summary";

const t = (over: { tookMs?: number | null; tokens?: number | null; usd?: number }) => ({
  tookMs: over.tookMs ?? null,
  tokens: over.tokens ?? null,
  usd: over.usd ?? 0,
});

describe("costSummary", () => {
  it("sums only what the record actually measured", () => {
    const s = costSummary([t({ tookMs: 1000, tokens: 100, usd: 0.5 }), t({})]);
    expect(s.msTotal).toBe(1000);
    expect(s.timedTurns).toBe(1);
    expect(s.tokenTotal).toBe(100);
    expect(s.usdTotal).toBe(0.5);
    expect(s.turns).toBe(2);
  });

  it("money reads the column even when it lands on zero", () => {
    expect(costSummary([t({ usd: 0 }), t({ usd: 0 })]).usdTotal).toBe(0);
    expect(costSummary([t({ usd: 1.25 })]).usdTotal).toBe(1.25);
  });

  it("an empty record aggregates to an empty audit", () => {
    const s = costSummary([]);
    expect(s.turns).toBe(0);
    expect(costLines(s)).toEqual([]);
  });
});

describe("costLines", () => {
  it("says when no turn recorded its duration instead of printing zero", () => {
    const lines = costLines(costSummary([t({ tokens: 500, usd: 0.2 })]));
    expect(lines.some((l) => l.includes("No turn recorded"))).toBe(true);
    expect(lines.join(" ")).not.toContain("Worked for");
  });

  it("a fully measured run reads like a receipt", () => {
    const lines = costLines(
      costSummary([
        t({ tookMs: 61_000, tokens: 1200, usd: 0.8 }),
        t({ tookMs: 30_000, tokens: 300, usd: 0.2 }),
      ]),
    );
    expect(lines[0]).toContain("Worked for 1m 31s across 2 turns");
    expect(lines).toContain("1,500 tokens");
    expect(lines).toContain("$1.00 spent");
  });

  it("an uncharged record says nothing was charged, never $0.00 dressed as news", () => {
    const lines = costLines(costSummary([t({ tookMs: 1000 })]));
    expect(lines).toContain("Nothing was charged.");
  });
});
