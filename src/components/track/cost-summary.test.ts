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

import { costLines, costSummary, spendClause } from "./cost-summary";

const t = (over: {
  tookMs?: number | null;
  tokens?: number | null;
  usd?: number;
  credits?: number;
}) => ({
  tookMs: over.tookMs ?? null,
  tokens: over.tokens ?? null,
  usd: over.usd ?? 0,
  credits: over.credits ?? 0,
});

describe("costSummary", () => {
  it("sums only what the record actually measured", () => {
    const s = costSummary([t({ tookMs: 1000, tokens: 100, usd: 0.5, credits: 40 }), t({})]);
    expect(s.msTotal).toBe(1000);
    expect(s.timedTurns).toBe(1);
    expect(s.tokenTotal).toBe(100);
    expect(s.usdTotal).toBe(0.5);
    expect(s.creditsTotal).toBe(40);
    expect(s.turns).toBe(2);
  });

  it("money reads the column even when it lands on zero", () => {
    expect(costSummary([t({ usd: 0 }), t({ usd: 0 })]).usdTotal).toBe(0);
    expect(costSummary([t({ usd: 1.25 })]).usdTotal).toBe(1.25);
  });

  it("credits read the column even when they land on zero, the same rule as money", () => {
    expect(costSummary([t({ credits: 0 }), t({ credits: 0 })]).creditsTotal).toBe(0);
    expect(
      costSummary([t({ credits: 8 }), t({ credits: 25 }), t({ credits: 7 })]).creditsTotal,
    ).toBe(40);
  });

  it("an empty record aggregates to an empty audit", () => {
    const s = costSummary([]);
    expect(s.turns).toBe(0);
    expect(costLines(s)).toEqual([]);
  });
});

describe("spendClause (P-136: one currency on the run screen)", () => {
  it("leads with credits and demotes the dollar figure to the parenthetical", () => {
    expect(spendClause(costSummary([t({ usd: 0.44, credits: 40 })]))).toBe("40 credits ($0.44)");
  });

  it("says just the count for a single credit, never a plural of one", () => {
    expect(spendClause(costSummary([t({ usd: 0.01, credits: 1 })]))).toBe("1 credit ($0.01)");
  });

  it("falls back to the dollar figure alone when nothing joined to credits", () => {
    // The record still says money moved (an older run, or a call path the
    // ledger join does not cover), so this is not the same as "nothing was
    // charged" -- see the null case below.
    expect(spendClause(costSummary([t({ usd: 0.44, credits: 0 })]))).toBe("$0.44");
  });

  it("is null when neither currency recorded anything, never a fabricated zero", () => {
    expect(spendClause(costSummary([t({ usd: 0, credits: 0 })]))).toBeNull();
  });

  /* THE GUARD (A-QUEUE P-136 Scope): a run with three ledger rows shows their
     sum in credits. */
  it("sums three ledger rows' worth of turns to their total in credits", () => {
    const s = costSummary([
      t({ usd: 0.1, credits: 8 }),
      t({ usd: 0.34, credits: 25 }),
      t({ usd: 0.01, credits: 7 }),
    ]);
    expect(s.creditsTotal).toBe(40);
    expect(spendClause(s)).toBe("40 credits ($0.45)");
  });
});

describe("costLines", () => {
  it("says when no turn recorded its duration instead of printing zero", () => {
    const lines = costLines(costSummary([t({ tokens: 500, usd: 0.2, credits: 8 })]));
    expect(lines.some((l) => l.includes("No turn recorded"))).toBe(true);
    expect(lines.join(" ")).not.toContain("Worked for");
  });

  it("a fully measured run reads like a receipt, credits first", () => {
    const lines = costLines(
      costSummary([
        t({ tookMs: 61_000, tokens: 1200, usd: 0.8, credits: 70 }),
        t({ tookMs: 30_000, tokens: 300, usd: 0.2, credits: 20 }),
      ]),
    );
    expect(lines[0]).toContain("Worked for 1m 31s across 2 turns");
    expect(lines).toContain("1,500 tokens");
    expect(lines).toContain("90 credits ($1.00) spent");
  });

  it("an uncharged record says nothing was charged, never $0.00 dressed as news", () => {
    const lines = costLines(costSummary([t({ tookMs: 1000 })]));
    expect(lines).toContain("Nothing was charged.");
  });
});
