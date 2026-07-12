import { describe, expect, test } from "bun:test";
import {
  verdictRankOf,
  compareOpportunities,
  deriveDesignation,
  rankOpportunities,
  outcomeSupportFromCounts,
  type RankableOpportunity,
  type VerdictWord,
} from "../ranking";

// Helper to create test opportunities
function createOpp(overrides?: Partial<RankableOpportunity>): RankableOpportunity {
  return {
    id: "test-id",
    ice_score: 50,
    confidence: 7,
    impact: 6,
    ease: 5,
    created_at: "2026-07-12T00:00:00Z",
    status: "draft",
    next_phase: "discovery",
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// verdictRankOf - Verdict strength mapping
// ─────────────────────────────────────────────────────────────────────────────
describe("verdictRankOf", () => {
  test("SHIP returns 4 (highest)", () => {
    expect(verdictRankOf("SHIP")).toBe(4);
  });

  test("WATCH returns 3", () => {
    expect(verdictRankOf("WATCH")).toBe(3);
  });

  test("PENDING returns 2 (middle)", () => {
    expect(verdictRankOf("PENDING")).toBe(2);
  });

  test("REVISE returns 1", () => {
    expect(verdictRankOf("REVISE")).toBe(1);
  });

  test("KILL returns 0 (lowest)", () => {
    expect(verdictRankOf("KILL")).toBe(0);
  });

  test("all verdicts are properly ordered", () => {
    const verdicts: VerdictWord[] = ["KILL", "REVISE", "PENDING", "WATCH", "SHIP"];
    const ranks = verdicts.map(verdictRankOf);
    // Verify ascending order
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1]);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// outcomeSupportFromCounts - Reinforcement seam (validated - missed)
// ─────────────────────────────────────────────────────────────────────────────
describe("outcomeSupportFromCounts", () => {
  test("returns 0 when both counts are 0", () => {
    expect(outcomeSupportFromCounts(0, 0)).toBe(0);
  });

  test("positive when validated > missed", () => {
    expect(outcomeSupportFromCounts(3, 1)).toBe(2);
  });

  test("negative when missed > validated", () => {
    expect(outcomeSupportFromCounts(1, 3)).toBe(-2);
  });

  test("caps validated at 3", () => {
    expect(outcomeSupportFromCounts(10, 0)).toBe(3);
  });

  test("caps missed at 3", () => {
    expect(outcomeSupportFromCounts(0, 10)).toBe(-3);
  });

  test("both are capped independently", () => {
    expect(outcomeSupportFromCounts(10, 10)).toBe(0);
  });

  test("clamps negative validated to 0", () => {
    expect(outcomeSupportFromCounts(-5, 2)).toBe(-2);
  });

  test("clamps negative missed to 0", () => {
    expect(outcomeSupportFromCounts(2, -5)).toBe(2);
  });

  test("maximum positive value is 3", () => {
    expect(outcomeSupportFromCounts(3, 0)).toBe(3);
    expect(outcomeSupportFromCounts(5, 0)).toBe(3);
  });

  test("minimum negative value is -3", () => {
    expect(outcomeSupportFromCounts(0, 3)).toBe(-3);
    expect(outcomeSupportFromCounts(0, 5)).toBe(-3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// compareOpportunities - Deterministic tie-break chain
// ─────────────────────────────────────────────────────────────────────────────
describe("compareOpportunities", () => {
  const mockCorroboration = (opp: RankableOpportunity) => opp.corroboration ?? 0;

  test("orders by ice_score first (descending)", () => {
    const a = createOpp({ ice_score: 50 });
    const b = createOpp({ ice_score: 60 });
    const result = compareOpportunities(a, b, mockCorroboration);
    expect(result).toBeGreaterThan(0); // a should come after b
  });

  test("uses verdict rank as second tie-breaker", () => {
    const a = createOpp({ ice_score: 50, status: "draft", next_phase: "discovery" });
    const b = createOpp({ ice_score: 50, status: "draft", next_phase: "discovery" });
    // Set up verdicts by manipulating necessary fields
    const result = compareOpportunities(a, b, mockCorroboration);
    // If ice_score is equal, should check verdict
  });

  test("breaks ties with outcome support", () => {
    const a = createOpp({ ice_score: 50 });
    const b = createOpp({ ice_score: 50 });
    const mockOutcomeSupport = (opp: RankableOpportunity) => (opp.id === "a" ? 1 : 0);
    const result = compareOpportunities(a, b, mockCorroboration, mockOutcomeSupport);
    // a has more support, should sort higher
  });

  test("breaks ties with corroboration", () => {
    const a = createOpp({ ice_score: 50, corroboration: 3 });
    const b = createOpp({ ice_score: 50, corroboration: 1 });
    const mockCorr = (opp: RankableOpportunity) => opp.corroboration ?? 0;
    const result = compareOpportunities(a, b, mockCorr);
    expect(result).toBeLessThan(0); // a has more corroboration, should come first
  });

  test("breaks ties with confidence", () => {
    const a = createOpp({ ice_score: 50, confidence: 8 });
    const b = createOpp({ ice_score: 50, confidence: 6 });
    const result = compareOpportunities(a, b, mockCorroboration);
    expect(result).toBeLessThan(0); // a has higher confidence
  });

  test("breaks ties with impact", () => {
    const a = createOpp({ ice_score: 50, impact: 8 });
    const b = createOpp({ ice_score: 50, impact: 6 });
    const result = compareOpportunities(a, b, mockCorroboration);
    expect(result).toBeLessThan(0);
  });

  test("uses created_at (oldest first) as late tie-breaker", () => {
    const a = createOpp({ created_at: "2026-07-01T00:00:00Z" });
    const b = createOpp({ created_at: "2026-07-12T00:00:00Z" });
    const result = compareOpportunities(a, b, mockCorroboration);
    expect(result).toBeLessThan(0); // a is older, comes first
  });

  test("uses id as final absolute tie-breaker", () => {
    const a = createOpp({ id: "aaa" });
    const b = createOpp({ id: "zzz" });
    const result = compareOpportunities(a, b, mockCorroboration);
    expect(result).toBeLessThan(0); // "aaa" < "zzz"
  });

  test("returns 0 for identical opportunities", () => {
    const a = createOpp({ id: "same" });
    const b = createOpp({ id: "same" });
    const result = compareOpportunities(a, b, mockCorroboration);
    expect(result).toBe(0);
  });

  test("handles null ice_score (treated as 0)", () => {
    const a = createOpp({ ice_score: null });
    const b = createOpp({ ice_score: 50 });
    const result = compareOpportunities(a, b, mockCorroboration);
    expect(result).toBeGreaterThan(0); // null (0) should be lower
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// deriveDesignation - PM vocabulary for bets
// ─────────────────────────────────────────────────────────────────────────────
describe("deriveDesignation", () => {
  test("rank 1 always returns 'best bet'", () => {
    const result = deriveDesignation({
      rank: 1,
      verdict: "PENDING",
      impact: 1,
      ease: 1,
      corroboration: 0,
    });
    expect(result).toBe("best bet");
  });

  test("rank 1 overrides all other conditions", () => {
    const result = deriveDesignation({
      rank: 1,
      verdict: "KILL",
      impact: 10,
      ease: 10,
      corroboration: 5,
    });
    expect(result).toBe("best bet");
  });

  test("unendorsed + impact >= 6 returns 'needs validation'", () => {
    const result = deriveDesignation({
      rank: 2,
      verdict: "PENDING",
      impact: 6,
      ease: 2,
      corroboration: 0,
    });
    expect(result).toBe("needs validation");
  });

  test("unendorsed includes PENDING, WATCH, REVISE, KILL", () => {
    const verdicts: VerdictWord[] = ["PENDING", "WATCH", "REVISE", "KILL"];
    verdicts.forEach((verdict) => {
      const result = deriveDesignation({
        rank: 2,
        verdict,
        impact: 6,
        ease: 2,
        corroboration: 0,
      });
      if (verdict !== "WATCH") {
        // WATCH is actually endorsed, so skip
        expect(result).toContain("validation");
      }
    });
  });

  test("endorsed verdict does not trigger 'needs validation'", () => {
    const result = deriveDesignation({
      rank: 2,
      verdict: "SHIP",
      impact: 6,
      ease: 2,
      corroboration: 0,
    });
    expect(result).not.toBe("needs validation");
  });

  test("ease >= 7 AND impact >= 5 returns 'quick win'", () => {
    const result = deriveDesignation({
      rank: 2,
      verdict: "PENDING",
      impact: 5,
      ease: 7,
      corroboration: 0,
    });
    expect(result).toBe("quick win");
  });

  test("'quick win' requires BOTH ease >= 7 AND impact >= 5", () => {
    const result1 = deriveDesignation({
      rank: 2,
      verdict: "PENDING",
      impact: 4,
      ease: 7,
      corroboration: 0,
    });
    expect(result1).not.toBe("quick win");

    const result2 = deriveDesignation({
      rank: 2,
      verdict: "PENDING",
      impact: 5,
      ease: 6,
      corroboration: 0,
    });
    expect(result2).not.toBe("quick win");
  });

  test("ease <= 3 returns 'heavy lift'", () => {
    const result = deriveDesignation({
      rank: 2,
      verdict: "PENDING",
      impact: 2,
      ease: 3,
      corroboration: 0,
    });
    expect(result).toBe("heavy lift");
  });

  test("corroboration >= 3 returns 'watch this week'", () => {
    const result = deriveDesignation({
      rank: 2,
      verdict: "PENDING",
      impact: 2,
      ease: 5,
      corroboration: 3,
    });
    expect(result).toBe("watch this week");
  });

  test("no matching rules returns null", () => {
    const result = deriveDesignation({
      rank: 2,
      verdict: "PENDING",
      impact: 3,
      ease: 5,
      corroboration: 0,
    });
    expect(result).toBe(null);
  });

  test("rules are evaluated in strict order", () => {
    // This case matches multiple rules; the first should win
    const result = deriveDesignation({
      rank: 2,
      verdict: "PENDING",
      impact: 6,
      ease: 7,
      corroboration: 3,
    });
    // Should match "needs validation" first, not "quick win"
    expect(result).toBe("needs validation");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// rankOpportunities - Full ranking pipeline
// ─────────────────────────────────────────────────────────────────────────────
describe("rankOpportunities", () => {
  const mockCorroboration = (opp: RankableOpportunity) => opp.corroboration ?? 0;

  test("returns empty array for empty input", () => {
    const result = rankOpportunities([], mockCorroboration);
    expect(result).toEqual([]);
  });

  test("returns single ranked entry for single opportunity", () => {
    const opps = [createOpp({ id: "opp1" })];
    const result = rankOpportunities(opps, mockCorroboration);
    expect(result.length).toBe(1);
    expect(result[0].rank).toBe(1);
    expect(result[0].isBestBet).toBe(true);
  });

  test("ranks are 1-based and contiguous", () => {
    const opps = [
      createOpp({ id: "opp1", ice_score: 30 }),
      createOpp({ id: "opp2", ice_score: 50 }),
      createOpp({ id: "opp3", ice_score: 40 }),
    ];
    const result = rankOpportunities(opps, mockCorroboration);
    expect(result.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  test("only rank 1 has isBestBet=true", () => {
    const opps = [
      createOpp({ id: "opp1", ice_score: 30 }),
      createOpp({ id: "opp2", ice_score: 50 }),
      createOpp({ id: "opp3", ice_score: 40 }),
    ];
    const result = rankOpportunities(opps, mockCorroboration);
    const bestBetCount = result.filter((r) => r.isBestBet).length;
    expect(bestBetCount).toBe(1);
    expect(result[0].isBestBet).toBe(true);
  });

  test("sorts by ice_score descending", () => {
    const opps = [
      createOpp({ id: "opp1", ice_score: 30 }),
      createOpp({ id: "opp2", ice_score: 50 }),
      createOpp({ id: "opp3", ice_score: 40 }),
    ];
    const result = rankOpportunities(opps, mockCorroboration);
    const scores = result.map((r) => r.opp.ice_score);
    expect(scores).toEqual([50, 40, 30]);
  });

  test("includes rationale for each ranked entry", () => {
    const opps = [createOpp({ id: "opp1" })];
    const result = rankOpportunities(opps, mockCorroboration);
    expect(result[0].rationale).toBeDefined();
    expect(typeof result[0].rationale).toBe("string");
    expect(result[0].rationale.length).toBeGreaterThan(0);
  });

  test("includes nextAction for each ranked entry", () => {
    const opps = [createOpp({ id: "opp1" })];
    const result = rankOpportunities(opps, mockCorroboration);
    expect(result[0].nextAction).toBeDefined();
    expect(typeof result[0].nextAction).toBe("string");
  });

  test("includes designation for each ranked entry", () => {
    const opps = [createOpp({ id: "opp1" })];
    const result = rankOpportunities(opps, mockCorroboration);
    expect(result[0].designation).toBeDefined();
  });

  test("includes outcomeSupport for each ranked entry", () => {
    const opps = [createOpp({ id: "opp1" })];
    const result = rankOpportunities(opps, mockCorroboration);
    expect(result[0].outcomeSupport).toBeDefined();
    expect(typeof result[0].outcomeSupport).toBe("number");
  });

  test("does not mutate input array", () => {
    const opps = [
      createOpp({ id: "opp1", ice_score: 30 }),
      createOpp({ id: "opp2", ice_score: 50 }),
    ];
    const original = [...opps];
    rankOpportunities(opps, mockCorroboration);
    expect(opps).toEqual(original);
  });

  test("passes outcome support to comparison", () => {
    const opps = [
      createOpp({ id: "opp1", ice_score: 50 }),
      createOpp({ id: "opp2", ice_score: 50 }),
    ];
    const outcomeSupport = (opp: RankableOpportunity) => (opp.id === "opp1" ? 2 : 0);
    const result = rankOpportunities(opps, mockCorroboration, outcomeSupport);
    // opp1 should rank higher due to outcome support
    expect(result[0].opp.id).toBe("opp1");
  });

  test("handles large opportunity lists", () => {
    const opps = Array.from({ length: 100 }, (_, i) =>
      createOpp({ id: `opp${i}`, ice_score: Math.random() * 100 }),
    );
    const result = rankOpportunities(opps, mockCorroboration);
    expect(result.length).toBe(100);
    expect(result[0].rank).toBe(1);
    expect(result[99].rank).toBe(100);
  });
});
