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

  test("8. two rows sharing the same id compare equal (defensive finalizer, never a false ordering)", () => {
    const a = mk({ id: "dup" });
    const b = mk({ id: "dup" });
    expect(compareOpportunities(a, b, noCorr)).toBe(0);
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

  test("rationale includes 'flagged to watch' for WATCH verdict", () => {
    const opps = [
      mk({
        id: "watch",
        ice_score: 5,
        critic_review: { verdict: "watch" } as never,
        status: "next",
      }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    expect(ranked[0].rationale).toContain("flagged to watch");
  });

  test("rationale includes 'Critic says revise' for REVISE verdict", () => {
    const opps = [
      mk({
        id: "revise",
        ice_score: 5,
        critic_review: { verdict: "revise" } as never,
        status: "backlog",
      }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    expect(ranked[0].rationale).toContain("Critic says revise");
  });

  test("rationale includes 'Critic says kill' for KILL verdict", () => {
    const opps = [
      mk({
        id: "killed",
        ice_score: 5,
        critic_review: { verdict: "kill" } as never,
        status: "dropped",
      }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    expect(ranked[0].rationale).toContain("Critic says kill");
  });

  test("rationale includes ICE score for non-rank-1 bets", () => {
    const opps = [mk({ id: "high", ice_score: 9 }), mk({ id: "mid", ice_score: 5.7 })];
    const ranked = rankOpportunities(opps, noCorr);
    const mid = ranked.find((r) => r.opp.id === "mid");
    expect(mid?.rationale).toContain("ICE 5.7");
  });

  test("rationale for rank-1 never includes ICE score (uses 'top ICE score' instead)", () => {
    const opps = [mk({ id: "rank1", ice_score: 9.2 })];
    const ranked = rankOpportunities(opps, noCorr);
    expect(ranked[0].rationale).toContain("top ICE score");
    expect(ranked[0].rationale).not.toContain("9.2");
  });

  test("rationale handles zero corroboration (no 'backed by' clause)", () => {
    const opps = [mk({ id: "no-corr", ice_score: 5, critic_review: critic("ship") })];
    const ranked = rankOpportunities(opps, () => 0);
    expect(ranked[0].rationale).toContain("Critic endorsed");
    expect(ranked[0].rationale).not.toContain("backed by");
  });

  test("rationale handles null ice_score (no ice clause for non-rank-1)", () => {
    const opps = [
      mk({ id: "no-ice", ice_score: null, critic_review: critic("ship") }),
      mk({ id: "with-ice", ice_score: 5 }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    const noIce = ranked.find((r) => r.opp.id === "no-ice");
    // Should have "Critic endorsed" but no ice clause
    expect(noIce?.rationale).toContain("Critic endorsed");
    expect(noIce?.rationale).not.toMatch(/ICE \d/);
  });

  test("rationale falls back to plain 'Ranked #N' when no clauses apply", () => {
    const opps = [
      mk({ id: "plain", ice_score: null, critic_review: null }),
      mk({ id: "other", ice_score: 5 }),
    ];
    const ranked = rankOpportunities(opps, () => 0);
    const plain = ranked.find((r) => r.opp.id === "plain");
    // A pending, null-ice bet with zero corroboration should just say "Ranked #N"
    expect(plain?.rationale).toMatch(/^Ranked #\d+$/);
  });

  test("next action: shipped bets are told to review the outcome", () => {
    const opps = [mk({ id: "s", status: "shipped", critic_review: critic("ship") })];
    expect(rankOpportunities(opps, noCorr)[0].nextAction).toBe("Review the outcome");
  });

  test("next action: REVISE verdict (not shipped) is told to draft the spec", () => {
    // Confirms that REVISE verdicts (which should ideally have a different next action
    // like "refine and resubmit") currently get the same "Draft the spec" as SHIP.
    // This test documents the current behavior and should be updated if the logic changes.
    const opps = [mk({ id: "revise", status: "backlog", critic_review: critic("revise") })];
    expect(rankOpportunities(opps, noCorr)[0].nextAction).toBe("Draft the spec");
  });

  test("next action: KILL verdict (not shipped) is told to draft the spec", () => {
    // Confirms that KILL verdicts (which should probably have a different next action
    // like "close or archive") currently get the same "Draft the spec" as SHIP.
    // This test documents the current behavior and should be updated if the logic changes.
    const opps = [mk({ id: "killed", status: "dropped", critic_review: critic("kill") })];
    expect(rankOpportunities(opps, noCorr)[0].nextAction).toBe("Draft the spec");
  });

  test("next action: SHIP verdict (not shipped) is told to draft the spec", () => {
    // Confirms that endorsed bets that haven't shipped are told to draft the spec.
    const opps = [mk({ id: "ship", status: "backlog", critic_review: critic("ship") })];
    expect(rankOpportunities(opps, noCorr)[0].nextAction).toBe("Draft the spec");
  });

  test("does not throw when ice_score arrives as a numeric string (PostgREST numeric columns serialize as strings, not JS numbers)", () => {
    // ice_score is typed `number | null`, but PostgREST's actual wire shape for
    // a NUMERIC column is a string - the generated Supabase type lies. A
    // non-#1 row with a string ice_score used to crash rationaleFor's
    // .toFixed() call synchronously during OpportunityQueue's render.
    const opps = [
      mk({ id: "top", ice_score: 9 }),
      mk({ id: "stringy", ice_score: "7.333333333333333333" as unknown as number }),
    ];
    expect(() => rankOpportunities(opps, noCorr)).not.toThrow();
    const stringy = rankOpportunities(opps, noCorr).find((r) => r.opp.id === "stringy")!;
    expect(stringy.rationale).toBe("Ranked #2: ICE 7.3");
  });
});

describe("deriveDesignation", () => {
  test("rank 1 is always 'best bet', even when a lower rule would also match", () => {
    // A rank-1 bet that is also needs-validation (not endorsed, high impact)
    // and a heavy lift (low ease) and well corroborated still reads 'best bet':
    // the rank-1 rule is evaluated first and wins.
    expect(
      deriveDesignation({ rank: 1, verdict: "PENDING", impact: 9, ease: 2, corroboration: 8 }),
    ).toBe("best bet");
  });

  test("a high-impact, not-endorsed, non-#1 bet is 'needs validation'", () => {
    expect(
      deriveDesignation({ rank: 2, verdict: "PENDING", impact: 7, ease: 5, corroboration: 0 }),
    ).toBe("needs validation");
  });

  test("an endorsed bet is never 'needs validation' (endorsed skips rule 2)", () => {
    // SHIP is the endorsed top, so even a high-impact SHIP bet with low ease
    // falls through rule 2 (and rule 3 quick win, ease < 7) to 'heavy lift'.
    expect(
      deriveDesignation({ rank: 3, verdict: "SHIP", impact: 9, ease: 2, corroboration: 0 }),
    ).toBe("heavy lift");
  });

  test("'needs validation' outranks 'heavy lift' when a bet matches both", () => {
    // Not endorsed + high impact AND low ease: rule 2 (needs validation) is
    // evaluated before rule 4 (heavy lift), so needs validation wins.
    expect(
      deriveDesignation({ rank: 2, verdict: "PENDING", impact: 8, ease: 2, corroboration: 0 }),
    ).toBe("needs validation");
  });

  test("an easy, high-impact, endorsed bet is a 'quick win'", () => {
    // Endorsed (skips needs validation), ease >= 7 AND impact >= 5 -> quick win,
    // which is evaluated before heavy lift and watch this week.
    expect(
      deriveDesignation({ rank: 3, verdict: "SHIP", impact: 6, ease: 8, corroboration: 0 }),
    ).toBe("quick win");
  });

  test("a low-ease, endorsed, non-#1 bet is 'heavy lift'", () => {
    expect(
      deriveDesignation({ rank: 3, verdict: "SHIP", impact: 4, ease: 3, corroboration: 0 }),
    ).toBe("heavy lift");
  });

  test("a well-corroborated otherwise-plain bet is 'watch this week'", () => {
    // Endorsed (skips needs validation), mid ease (skips quick win and heavy
    // lift), 3+ backing signals -> watch this week.
    expect(
      deriveDesignation({ rank: 4, verdict: "SHIP", impact: 5, ease: 5, corroboration: 3 }),
    ).toBe("watch this week");
  });

  test("a plain bet earns no designation (null)", () => {
    expect(
      deriveDesignation({ rank: 5, verdict: "SHIP", impact: 5, ease: 5, corroboration: 2 }),
    ).toBe(null);
  });
});

describe("rankOpportunities designation", () => {
  test("populates a designation on every ranked entry and best bet on #1", () => {
    const opps = [
      // #1 by ICE: the best bet.
      mk({ id: "top", ice_score: 9, critic_review: critic("ship") }),
      // Not endorsed + high impact: needs validation.
      mk({ id: "unvalidated", ice_score: 6, critic_review: null, impact: 8, ease: 6 }),
      // Endorsed + low ease: heavy lift.
      mk({ id: "big", ice_score: 5, critic_review: critic("ship"), impact: 4, ease: 2 }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    const byId = new Map(ranked.map((r) => [r.opp.id, r]));
    expect(byId.get("top")!.designation).toBe("best bet");
    expect(byId.get("unvalidated")!.designation).toBe("needs validation");
    expect(byId.get("big")!.designation).toBe("heavy lift");
  });

  test("uses corroboration for 'watch this week' via corroborationOf", () => {
    const opps = [
      mk({ id: "top", ice_score: 9, critic_review: critic("ship") }),
      // Endorsed, mid ease (not a quick win), plain on its own but well
      // corroborated.
      mk({ id: "watch", ice_score: 5, critic_review: critic("ship"), impact: 5, ease: 5 }),
    ];
    const corr = (o: RankableOpportunity) => (o.id === "watch" ? 5 : 0);
    const ranked = rankOpportunities(opps, corr);
    expect(ranked.find((r) => r.opp.id === "watch")!.designation).toBe("watch this week");
  });
});

// --- The reinforcement seam: recorded outcomes move the order ---------------
// (2026-07-10) What actually happened to past bets on the same evidence now
// informs NEW bets: after ICE and the Critic's verdict, a theme with a
// validated record lifts its bets and a missed record sinks them - capped so
// memory advises the human's scoring, never overrules it.

import { outcomeSupportFromCounts } from "./ranking";

describe("outcomeSupportFromCounts", () => {
  test("validated lifts, missed sinks, mixed history nets out", () => {
    expect(outcomeSupportFromCounts(2, 0)).toBe(2);
    expect(outcomeSupportFromCounts(0, 2)).toBe(-2);
    expect(outcomeSupportFromCounts(2, 1)).toBe(1);
    expect(outcomeSupportFromCounts(0, 0)).toBe(0);
  });

  test("each side caps at 3 so one prolific theme cannot swamp the scoring", () => {
    expect(outcomeSupportFromCounts(10, 0)).toBe(3);
    expect(outcomeSupportFromCounts(0, 10)).toBe(-3);
    expect(outcomeSupportFromCounts(10, 10)).toBe(0);
  });

  test("garbage-tolerant: negative inputs clamp to zero", () => {
    expect(outcomeSupportFromCounts(-5, -5)).toBe(0);
  });
});

describe("outcome support in the comparator chain", () => {
  test("splits an ICE-and-verdict tie: the theme with proven outcomes wins", () => {
    const proven = mk({ id: "b-proven", theme_id: "t-proven" });
    const burned = mk({ id: "a-burned", theme_id: "t-burned" });
    const support = (o: RankableOpportunity) =>
      o.theme_id === "t-proven" ? 2 : o.theme_id === "t-burned" ? -1 : 0;
    // Without support the ids alone would put a-burned first...
    expect(compareOpportunities(burned, proven, () => 0)).toBeLessThan(0);
    // ...with it, the proven theme's bet wins the tie.
    expect(compareOpportunities(burned, proven, () => 0, support)).toBeGreaterThan(0);
  });

  test("never outranks the Critic: a SHIP verdict beats any outcome support", () => {
    const endorsedNoHistory = mk({ id: "endorsed", critic_review: critic("ship") });
    const provenButRevise = mk({
      id: "proven",
      theme_id: "t",
      critic_review: critic("revise"),
    });
    const support = (o: RankableOpportunity) => (o.theme_id === "t" ? 3 : 0);
    expect(compareOpportunities(endorsedNoHistory, provenButRevise, () => 0, support)).toBeLessThan(
      0,
    );
  });

  test("outranks corroboration: one recorded outcome beats raw signal volume", () => {
    const loudButBurned = mk({ id: "loud", theme_id: "t-loud" });
    const quietButProven = mk({ id: "quiet", theme_id: "t-quiet" });
    const corroboration = (o: RankableOpportunity) => (o.theme_id === "t-loud" ? 9 : 0);
    const support = (o: RankableOpportunity) => (o.theme_id === "t-quiet" ? 1 : 0);
    expect(
      compareOpportunities(quietButProven, loudButBurned, corroboration, support),
    ).toBeLessThan(0);
  });

  test("rankOpportunities carries the support through and speaks it in the rationale", () => {
    const ranked = rankOpportunities(
      [mk({ id: "a", theme_id: "t-proven" }), mk({ id: "b", theme_id: "t-burned" })],
      () => 0,
      (o) => (o.theme_id === "t-proven" ? 2 : -1),
    );
    expect(ranked[0].opp.id).toBe("a");
    expect(ranked[0].outcomeSupport).toBe(2);
    expect(ranked[0].rationale).toContain("outcomes on this theme run proven");
    expect(ranked[1].outcomeSupport).toBe(-1);
    expect(ranked[1].rationale).toContain("outcomes on this theme have missed");
  });

  test("default callback keeps every existing caller byte-identical: support 0, no clause", () => {
    const ranked = rankOpportunities([mk({ id: "a" })], () => 0);
    expect(ranked[0].outcomeSupport).toBe(0);
    expect(ranked[0].rationale).not.toContain("outcomes on this theme");
  });
});

// ---------------------------------------------------------------------------
// Designation precedence boundary: rule 2 ("needs validation") vs rule 3 ("quick win")
//
// The designation rules evaluated in strict if-else order are:
//   1. rank === 1                                  -> "best bet"
//   2. !endorsed && impact >= 6                    -> "needs validation"
//   3. ease >= 7 && impact >= 5                    -> "quick win"
//   4. ease <= 3                                   -> "heavy lift"
//   5. corroboration >= 3                          -> "watch this week"
//   6. otherwise                                   -> null
//
// A bet that is NOT endorsed, has impact >= 6, AND has ease >= 7 satisfies both
// rule 2 and rule 3 simultaneously. Because rule 2 is tested first in the
// if-else chain, "needs validation" is the precedence winner and "quick win"
// must never be returned for such a bet.
//
// These tests pin that boundary so a future refactor (e.g. reordering the
// rules) cannot silently change visible behaviour.
// ---------------------------------------------------------------------------
describe("designation precedence boundary: needs validation beats quick win", () => {
  // Convenience: build the minimal input that triggers the boundary.
  // All variants keep rank > 1 (rank 1 short-circuits to "best bet" before
  // either rule is reached) and verdict = PENDING (not endorsed).
  function boundary(over: {
    impact: number;
    ease: number;
  }): Parameters<typeof deriveDesignation>[0] {
    return { rank: 2, verdict: "PENDING", corroboration: 0, ...over };
  }

  test("should return 'needs validation' when bet qualifies for both rules (impact=6, ease=7 — both at exact thresholds)", () => {
    // impact=6 satisfies rule 2 (>= 6); ease=7 satisfies rule 3 (>= 7).
    // Rule 2 is first in the if-else chain, so "needs validation" wins.
    expect(deriveDesignation(boundary({ impact: 6, ease: 7 }))).toBe("needs validation");
  });

  test("should return 'needs validation' when bet qualifies for both rules (impact=8, ease=9 — both well above thresholds)", () => {
    // Exceeding both thresholds still returns only one designation.
    // Rule 2 fires first regardless of how far past the threshold the values are.
    expect(deriveDesignation(boundary({ impact: 8, ease: 9 }))).toBe("needs validation");
  });

  test("should return 'needs validation' when bet qualifies for both rules (impact=8, ease=7 — impact high, ease at threshold)", () => {
    // impact=8 > 6 (rule 2 fires), ease=7 >= 7 (rule 3 would also fire).
    // The precedence winner is rule 2.
    expect(deriveDesignation(boundary({ impact: 8, ease: 7 }))).toBe("needs validation");
  });

  test("should return 'needs validation' when bet qualifies for both rules (impact=6, ease=8 — impact at threshold, ease high)", () => {
    // The symmetric case: impact is exactly at rule 2's threshold (6), ease
    // exceeds rule 3's threshold (8 >= 7). Rule 2 still fires first.
    expect(deriveDesignation(boundary({ impact: 6, ease: 8 }))).toBe("needs validation");
  });

  test("should return 'quick win' when impact drops below rule 2 threshold but ease still qualifies for rule 3 (impact=5, ease=7)", () => {
    // impact=5 does NOT meet rule 2 (needs >= 6), so rule 2 is skipped.
    // ease=7 and impact=5 DO meet rule 3 thresholds, so "quick win" wins.
    // This confirms the boundary is sharp: one point below impact=6 flips the designation.
    expect(deriveDesignation(boundary({ impact: 5, ease: 7 }))).toBe("quick win");
  });

  test("should return 'quick win' when endorsement is added — endorsed bets skip rule 2 and fall through to rule 3", () => {
    // When the Critic endorses the bet (SHIP), !endorsed is false so rule 2 is
    // bypassed entirely. ease >= 7 && impact >= 5 then makes rule 3 the winner.
    // This tests that the not-endorsed gate is what causes the rule 2 / rule 3
    // ambiguity in the first place.
    expect(
      deriveDesignation({ rank: 2, verdict: "SHIP", impact: 6, ease: 7, corroboration: 0 }),
    ).toBe("quick win");
  });

  test("should return only 'needs validation' (not both designations) when both rules match — result is a single Designation, not an array", () => {
    // Defensive sanity: deriveDesignation returns a scalar Designation, so it is
    // structurally impossible to return two at once. This test confirms the return
    // value is NOT an array and IS the rule-2 winner.
    const result = deriveDesignation(boundary({ impact: 6, ease: 7 }));
    expect(Array.isArray(result)).toBe(false);
    expect(result).toBe("needs validation");
  });

  test("should propagate the precedence decision through rankOpportunities end-to-end", () => {
    // Confirm the same precedence holds when designation is derived via the full
    // ranking pipeline (not just deriveDesignation in isolation).
    const opps = [
      // rank 1 anchor — ensures the dual-qualifier bet lands at rank 2.
      mk({ id: "anchor", ice_score: 9, critic_review: critic("ship") }),
      // Dual-qualifier: not endorsed, impact=6 (rule 2), ease=8 (rule 3).
      mk({ id: "dual", ice_score: 5, critic_review: null, impact: 6, ease: 8 }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    const dual = ranked.find((r) => r.opp.id === "dual")!;
    expect(dual.rank).toBe(2); // confirms it is not the best-bet short-circuit
    expect(dual.designation).toBe("needs validation");
  });
});

/**
 * ★ CRITICAL GAP: nextActionFor verdict differentiation
 *
 * The nextActionFor function currently returns "Draft the spec" for all
 * verdicts except PENDING and shipped status, treating SHIP/WATCH/REVISE/KILL
 * identically. This was discovered during coverage audit 2026-07-09.
 *
 * ACTUAL BEHAVIOR (lines 187-192):
 *   - PENDING → "Challenge with the Critic first"
 *   - status === "shipped" → "Review the outcome"
 *   - everything else (SHIP, WATCH, REVISE, KILL) → "Draft the spec"
 *
 * EXPECTED BEHAVIOR:
 *   - PENDING → "Challenge with the Critic first"
 *   - REVISE → Something like "Address the Critic's feedback" (fixable)
 *   - KILL → Something like "Understand why this was rejected" (not fixable)
 *   - SHIP → Something like "Start building" or "Begin execution"
 *   - WATCH → Something like "Monitor and validate" or "Watch for progress"
 *   - shipped status → "Review the outcome"
 *
 * These tests validate the fix once implemented.
 */
describe.skip("nextActionFor verdict differentiation (CRITICAL GAP)", () => {
  /**
   * SKELETON: Test that REVISE gets actionable feedback
   *
   * ASSERTION: nextActionFor should return a string that suggests
   * fixing/improving the opportunity based on Critic feedback,
   * NOT the generic "Draft the spec".
   *
   * This differentiates REVISE (fixable) from KILL (not fixable).
   */
  test("REVISE verdict returns action guiding user to address Critic feedback", () => {
    // TODO: Implement
    // 1. Create opp with status !== "shipped" and critic_review with verdict="revise"
    // 2. Call nextActionFor(opp)
    // 3. Assert result !== "Draft the spec"
    // 4. Assert result suggests addressing/revising (e.g., includes "revise", "improve", "feedback", "address")
    // 5. Assert result is a helpful imperative, not generic filler
  });

  /**
   * SKELETON: Test that KILL gets rejection clarity
   *
   * ASSERTION: nextActionFor should return a string that acknowledges
   * the bet was rejected and suggests understanding why,
   * distinct from REVISE (which is fixable).
   */
  test("KILL verdict returns action guiding user to understand rejection", () => {
    // TODO: Implement
    // 1. Create opp with status !== "shipped" and critic_review with verdict="kill"
    // 2. Call nextActionFor(opp)
    // 3. Assert result !== "Draft the spec"
    // 4. Assert result does NOT suggest fixing (unlike REVISE)
    // 5. Assert result suggests understanding why or accepting the decision
  });

  /**
   * SKELETON: Test that SHIP gets execution action
   *
   * ASSERTION: nextActionFor should return a string that suggests
   * proceeding with building/implementation for endorsed bets,
   * distinct from PENDING (needs more validation) or REVISE (needs fixing).
   */
  test("SHIP verdict returns action guiding user to begin execution", () => {
    // TODO: Implement
    // 1. Create opp with status !== "shipped" and critic_review with verdict="ship"
    // 2. Call nextActionFor(opp)
    // 3. Assert result !== "Draft the spec" (or if it is, that's OK as a default action)
    // 4. Assert result suggests building, shipping, or executing (not just "Draft")
    // 5. Compare with PENDING to confirm they are different actions
  });

  /**
   * SKELETON: Test that WATCH gets monitoring action
   *
   * ASSERTION: nextActionFor should return a string that suggests
   * monitoring progress or waiting for more evidence,
   * distinct from SHIP (endorsed to proceed) or PENDING (needs validation).
   */
  test("WATCH verdict returns action guiding user to monitor and validate", () => {
    // TODO: Implement
    // 1. Create opp with status !== "shipped" and critic_review with verdict="watch"
    // 2. Call nextActionFor(opp)
    // 3. Assert result !== "Draft the spec"
    // 4. Assert result suggests monitoring, watching, or gathering more evidence
    // 5. Confirm it is distinct from SHIP (proceeding) and PENDING (validating)
  });

  /**
   * SKELETON: Test that PENDING (no Critic review) gets validation action
   *
   * ASSERTION: nextActionFor("PENDING") should suggest challenging
   * the opinion or getting Critic feedback, NOT defaulting to "Draft the spec".
   *
   * CURRENT BEHAVIOR: Already correct ("Challenge with the Critic first").
   * This test confirms it stays differentiated when REVISE/KILL/SHIP are fixed.
   */
  test("PENDING verdict returns 'Challenge with the Critic first' (existing behavior)", () => {
    const opp = mk({
      id: "pending-opp",
      status: "backlog",
      critic_review: null, // No Critic review → PENDING
    });

    // TODO: Implement
    // This test documents the CORRECT behavior that should stay in place.
    // 1. Call nextActionFor(opp)
    // 2. Assert result === "Challenge with the Critic first"
    // 3. This is the baseline; REVISE/KILL/SHIP/WATCH must differ from it
  });

  /**
   * SKELETON: Test that shipped status overrides verdict
   *
   * ASSERTION: nextActionFor should return "Review the outcome"
   * regardless of the Critic verdict, when status === "shipped".
   * This should already work correctly.
   */
  test("shipped status returns 'Review the outcome' (overrides verdict)", () => {
    // TODO: Implement
    // 1. Create opp with status="shipped" and various critic verdicts (SHIP, REVISE, KILL, or null)
    // 2. Call nextActionFor for each
    // 3. Assert ALL return "Review the outcome" (status takes precedence)
    // 4. This already works; test confirms it stays stable when other verdicts are fixed
  });

  /**
   * SKELETON: Comprehensive verdict comparison
   *
   * ASSERTION: All five verdict outcomes (SHIP, WATCH, REVISE, KILL, PENDING)
   * return distinct, non-generic actions when status !== "shipped".
   * This is a high-level integration test for the fix.
   */
  test("all five verdicts (SHIP/WATCH/REVISE/KILL/PENDING) return distinct actions", () => {
    // TODO: Implement
    // 1. Create opps for each verdict: SHIP, WATCH, REVISE, KILL, PENDING (critic_review: null)
    // 2. Call nextActionFor for each
    // 3. Store the results in a Set (to detect duplicates)
    // 4. Assert Set.size === 5 (all actions are unique, no two verdicts share the same action)
    // 5. Assert none are "Draft the spec" EXCEPT possibly SHIP (which could defensibly use "Draft the spec")
    // 6. Assert each action is specific to its verdict (REVISE ≠ KILL ≠ SHIP ≠ WATCH ≠ PENDING)
  });
});
