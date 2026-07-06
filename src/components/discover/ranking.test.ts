import { describe, expect, test } from "bun:test";
import type { CriticReview } from "@/lib/discovery.functions";
import {
  compareOpportunities,
  deriveDesignation,
  rankOpportunities,
  verdictRankOf,
  type RankableOpportunity,
} from "./ranking";

/** A full, valid CriticReview whose only meaningful field for ranking is the
 * verdict. Keeps fixtures typed to the real opp shape. */
function critic(verdict: "ship" | "revise" | "kill"): CriticReview {
  return {
    verdict,
    summary: "",
    risks: [],
    kill_criteria: [],
    missing_evidence: [],
    confidence: 0,
    reviewer_model: "test",
    reviewed_at: "2026-01-01T00:00:00Z",
  };
}

/** Build a rankable opportunity fixture. Every discriminator defaults to an
 * equal value so a test can vary exactly one key and assert the fall-through. */
function mk(over: Partial<RankableOpportunity> & { id: string }): RankableOpportunity {
  return {
    ice_score: 5,
    confidence: 5,
    impact: 5,
    ease: 5,
    created_at: "2026-01-01T00:00:00Z",
    status: "backlog",
    critic_review: null,
    ...over,
  };
}

/** No corroboration unless a test supplies its own function. */
const noCorr = () => 0;

/** The ranked id order for a list under a corroboration function. */
function order(
  opps: RankableOpportunity[],
  corroborationOf: (o: RankableOpportunity) => number = noCorr,
): string[] {
  return rankOpportunities(opps, corroborationOf).map((r) => r.opp.id);
}

describe("verdictRankOf", () => {
  test("orders SHIP > WATCH > PENDING > REVISE > KILL", () => {
    expect(verdictRankOf("SHIP")).toBeGreaterThan(verdictRankOf("WATCH"));
    expect(verdictRankOf("WATCH")).toBeGreaterThan(verdictRankOf("PENDING"));
    expect(verdictRankOf("PENDING")).toBeGreaterThan(verdictRankOf("REVISE"));
    expect(verdictRankOf("REVISE")).toBeGreaterThan(verdictRankOf("KILL"));
  });
});

describe("compareOpportunities tie-break chain", () => {
  test("1. ice_score decides first (higher first)", () => {
    const hi = mk({ id: "a", ice_score: 8 });
    const lo = mk({ id: "b", ice_score: 3 });
    expect(order([lo, hi])).toEqual(["a", "b"]);
  });

  test("2. equal ice falls through to verdict rank", () => {
    // Same ice; a is Critic-endorsed (SHIP), b is not yet reviewed (PENDING).
    const a = mk({ id: "a", critic_review: critic("ship") });
    const b = mk({ id: "b", critic_review: null });
    expect(order([b, a])).toEqual(["a", "b"]);
  });

  test("3. equal ice + verdict falls through to corroboration", () => {
    const a = mk({ id: "a" });
    const b = mk({ id: "b" });
    const corr = (o: RankableOpportunity) => (o.id === "a" ? 7 : 1);
    expect(order([b, a], corr)).toEqual(["a", "b"]);
  });

  test("4. equal ice + verdict + corroboration falls through to confidence", () => {
    const a = mk({ id: "a", confidence: 9 });
    const b = mk({ id: "b", confidence: 2 });
    expect(order([b, a])).toEqual(["a", "b"]);
  });

  test("5. equal down to confidence falls through to impact", () => {
    const a = mk({ id: "a", impact: 9 });
    const b = mk({ id: "b", impact: 2 });
    expect(order([b, a])).toEqual(["a", "b"]);
  });

  test("6. equal down to impact falls through to created_at (older first)", () => {
    const older = mk({ id: "a", created_at: "2026-01-01T00:00:00Z" });
    const newer = mk({ id: "b", created_at: "2026-06-01T00:00:00Z" });
    expect(order([newer, older])).toEqual(["a", "b"]);
  });

  test("7. fully tied rows finalize on id ascending (never random)", () => {
    const a = mk({ id: "aaa" });
    const b = mk({ id: "bbb" });
    const c = mk({ id: "ccc" });
    // Comparator is a total order regardless of input order.
    expect(compareOpportunities(a, b, noCorr)).toBeLessThan(0);
    expect(compareOpportunities(c, a, noCorr)).toBeGreaterThan(0);
    expect(order([c, b, a])).toEqual(["aaa", "bbb", "ccc"]);
  });
});

describe("rankOpportunities", () => {
  test("assigns exactly one best bet across a list", () => {
    const opps = [
      mk({ id: "a", ice_score: 4 }),
      mk({ id: "b", ice_score: 9 }),
      mk({ id: "c", ice_score: 6 }),
      mk({ id: "d", ice_score: 2 }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    const best = ranked.filter((r) => r.isBestBet);
    expect(best).toHaveLength(1);
    expect(best[0].rank).toBe(1);
    // The single best bet is the top-ICE row.
    expect(best[0].opp.id).toBe("b");
  });

  test("empty list has no best bet", () => {
    expect(rankOpportunities([], noCorr)).toEqual([]);
  });

  test("ranks are 1..N contiguous", () => {
    const opps = ["a", "b", "c", "d", "e"].map((id, i) => mk({ id, ice_score: i + 1 }));
    const ranks = rankOpportunities(opps, noCorr).map((r) => r.rank);
    expect(ranks).toEqual([1, 2, 3, 4, 5]);
  });

  test("is deterministic: the same input ranks identically when run twice", () => {
    const opps = [
      mk({ id: "d", ice_score: 5, created_at: "2026-02-01T00:00:00Z" }),
      mk({ id: "a", ice_score: 5, created_at: "2026-01-01T00:00:00Z" }),
      mk({ id: "c", ice_score: 5, created_at: "2026-01-15T00:00:00Z" }),
      mk({ id: "b", ice_score: 5, created_at: "2026-01-10T00:00:00Z" }),
    ];
    const first = order(opps);
    const second = order(opps);
    expect(first).toEqual(second);
    // All tied on ice/verdict/corroboration/confidence/impact, so created_at
    // (older first) decides the whole order.
    expect(first).toEqual(["a", "b", "c", "d"]);
  });

  test("is stable across input permutations (a real total order)", () => {
    const base = [
      mk({ id: "x1", ice_score: 5 }),
      mk({ id: "x2", ice_score: 5 }),
      mk({ id: "x3", ice_score: 5 }),
    ];
    const forward = order([base[0], base[1], base[2]]);
    const reversed = order([base[2], base[1], base[0]]);
    expect(forward).toEqual(reversed);
    expect(forward).toEqual(["x1", "x2", "x3"]);
  });

  test("best bet carries a rationale and a next action", () => {
    const opps = [
      mk({ id: "top", ice_score: 9, critic_review: critic("ship"), status: "backlog" }),
      mk({ id: "mid", ice_score: 4, critic_review: null }),
    ];
    const corr = (o: RankableOpportunity) => (o.id === "top" ? 7 : 0);
    const ranked = rankOpportunities(opps, corr);
    const best = ranked[0];
    expect(best.rationale).toBe("Ranked #1: top ICE score, Critic endorsed, backed by 7 signals");
    expect(best.nextAction).toBe("Draft the spec");
    // A not-yet-reviewed bet is told to Challenge first.
    expect(ranked[1].nextAction).toBe("Challenge with the Critic first");
  });

  test("next action: shipped bets are told to review the outcome", () => {
    const opps = [mk({ id: "s", status: "shipped", critic_review: critic("ship") })];
    expect(rankOpportunities(opps, noCorr)[0].nextAction).toBe("Review the outcome");
  });
});

describe("deriveDesignation", () => {
  test("rank 1 is always 'best bet', even when a lower rule would also match", () => {
    // A rank-1 bet that is also a pet feature (not endorsed, high impact) and a
    // scope creep (low ease) and well corroborated still reads 'best bet': the
    // rank-1 rule is evaluated first and wins.
    expect(
      deriveDesignation({ rank: 1, verdict: "PENDING", impact: 9, ease: 2, corroboration: 8 }),
    ).toBe("best bet");
  });

  test("a high-impact, not-endorsed, non-#1 bet is 'pet feature?'", () => {
    expect(
      deriveDesignation({ rank: 2, verdict: "PENDING", impact: 7, ease: 5, corroboration: 0 }),
    ).toBe("pet feature?");
  });

  test("an endorsed bet is never a 'pet feature?' (endorsed skips rule 2)", () => {
    // SHIP is the endorsed top, so even a high-impact SHIP bet with low ease
    // falls through rule 2 to 'scope creep'.
    expect(
      deriveDesignation({ rank: 3, verdict: "SHIP", impact: 9, ease: 2, corroboration: 0 }),
    ).toBe("scope creep");
  });

  test("'pet feature?' outranks 'scope creep' when a bet matches both", () => {
    // Not endorsed + high impact AND low ease: rule 2 (pet feature?) is
    // evaluated before rule 3 (scope creep), so pet feature? wins.
    expect(
      deriveDesignation({ rank: 2, verdict: "PENDING", impact: 8, ease: 2, corroboration: 0 }),
    ).toBe("pet feature?");
  });

  test("a low-ease, endorsed, non-#1 bet is 'scope creep'", () => {
    expect(
      deriveDesignation({ rank: 3, verdict: "SHIP", impact: 4, ease: 3, corroboration: 0 }),
    ).toBe("scope creep");
  });

  test("a well-corroborated otherwise-plain bet is 'watch this week'", () => {
    // Endorsed (skips pet feature?), ample ease (skips scope creep), 3+ backing
    // signals -> watch this week.
    expect(
      deriveDesignation({ rank: 4, verdict: "SHIP", impact: 5, ease: 8, corroboration: 3 }),
    ).toBe("watch this week");
  });

  test("a plain bet earns no designation (null)", () => {
    expect(
      deriveDesignation({ rank: 5, verdict: "SHIP", impact: 5, ease: 8, corroboration: 2 }),
    ).toBe(null);
  });
});

describe("rankOpportunities designation", () => {
  test("populates a designation on every ranked entry and best bet on #1", () => {
    const opps = [
      // #1 by ICE: the best bet.
      mk({ id: "top", ice_score: 9, critic_review: critic("ship") }),
      // Not endorsed + high impact: a pet feature.
      mk({ id: "pet", ice_score: 6, critic_review: null, impact: 8, ease: 6 }),
      // Endorsed + low ease: scope creep.
      mk({ id: "big", ice_score: 5, critic_review: critic("ship"), impact: 4, ease: 2 }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    const byId = new Map(ranked.map((r) => [r.opp.id, r]));
    expect(byId.get("top")!.designation).toBe("best bet");
    expect(byId.get("pet")!.designation).toBe("pet feature?");
    expect(byId.get("big")!.designation).toBe("scope creep");
  });

  test("uses corroboration for 'watch this week' via corroborationOf", () => {
    const opps = [
      mk({ id: "top", ice_score: 9, critic_review: critic("ship") }),
      // Endorsed, ample ease, plain on its own but well corroborated.
      mk({ id: "watch", ice_score: 5, critic_review: critic("ship"), impact: 5, ease: 8 }),
    ];
    const corr = (o: RankableOpportunity) => (o.id === "watch" ? 5 : 0);
    const ranked = rankOpportunities(opps, corr);
    expect(ranked.find((r) => r.opp.id === "watch")!.designation).toBe("watch this week");
  });
});
