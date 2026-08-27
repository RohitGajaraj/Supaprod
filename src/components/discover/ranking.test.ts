import { describe, expect, test } from "bun:test";
import type { CriticReview } from "@/lib/discovery.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";

// The reviewer's display name comes from the catalog, never from a literal, so
// these assertions survive a rename the same way the code does. Asserting the
// string "Critic" here is what let the UI drift: the mark rendered "Challenge"
// while the sentence beside it said "Critic", and the test agreed with the bug.
const REVIEWER = agentDisplayName("critic");
import {
  compareOpportunities,
  deriveDesignation,
  nextActionFor,
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

  test("3.5. equal ice + verdict + corroboration falls through to briefAlignment", () => {
    // Two opportunities tied on all major discriminators; briefAlignment decides.
    // Without briefAlignment, id alone decides: alphabetically first wins.
    // With briefAlignment, a tied bet to a standing top bet outranks an untied one.
    const tied = mk({ id: "zzz" }); // Would sort LAST without briefAlignment
    const untied = mk({ id: "aaa" }); // Would sort FIRST without briefAlignment
    const briefAlignment = (o: RankableOpportunity) => (o.id === "zzz" ? 1 : 0);
    // Without briefAlignment, untied wins (lower id = earlier sort).
    expect(compareOpportunities(tied, untied, noCorr)).toBeGreaterThan(0);
    // With briefAlignment, tied wins (higher briefAlignment overrides id order).
    expect(compareOpportunities(tied, untied, noCorr, undefined, briefAlignment)).toBeLessThan(0);
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

  test("ice_score primary sort handles mixed numeric/string types (PostgREST quirk)", () => {
    // PostgREST serializes NUMERIC columns as strings; when one ice_score is
    // a number and another is a string, compareOpportunities should still sort
    // by numeric value, not lexicographic string order. "9" > "10" as strings,
    // but 9 < 10 as numbers.
    const numericHigh = mk({ id: "numeric_9", ice_score: 9 });
    const stringLow = mk({ id: "string_10", ice_score: "10" as unknown as number });
    // stringLow should rank higher (10 > 9 numerically)
    expect(compareOpportunities(numericHigh, stringLow, noCorr)).toBeGreaterThan(0);
    expect(compareOpportunities(stringLow, numericHigh, noCorr)).toBeLessThan(0);
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
    expect(best.rationale).toBe(
      `Ranked #1: top ICE score, ${REVIEWER} endorsed, backed by 7 findings`,
    );
    // SHIP verdict now gets "Proceed with the spec" instead of generic "Draft the spec"
    expect(best.nextAction).toMatch(/proceed|spec|build/);
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

  test("rationale names the reviewer from the catalog for a REVISE verdict", () => {
    const opps = [
      mk({
        id: "revise",
        ice_score: 5,
        critic_review: { verdict: "revise" } as never,
        status: "backlog",
      }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    expect(ranked[0].rationale).toContain(`${REVIEWER} says revise`);
  });

  test("rationale names the reviewer from the catalog for a KILL verdict", () => {
    const opps = [
      mk({
        id: "killed",
        ice_score: 5,
        critic_review: { verdict: "kill" } as never,
        status: "dropped",
      }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    expect(ranked[0].rationale).toContain(`${REVIEWER} says kill`);
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
    expect(ranked[0].rationale).toContain(`${REVIEWER} endorsed`);
    expect(ranked[0].rationale).not.toContain("backed by");
  });

  test("rationale handles null ice_score (no ice clause for non-rank-1)", () => {
    const opps = [
      mk({ id: "no-ice", ice_score: null, critic_review: critic("ship") }),
      mk({ id: "with-ice", ice_score: 5 }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    const noIce = ranked.find((r) => r.opp.id === "no-ice");
    // Should name the reviewer, but carry no ice clause
    expect(noIce?.rationale).toContain(`${REVIEWER} endorsed`);
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

  test("next action: REVISE verdict (not shipped) is told to address Critic feedback", () => {
    // REVISE verdicts guide users to address the Critic's specific feedback, not generic drafting.
    const opps = [mk({ id: "revise", status: "backlog", critic_review: critic("revise") })];
    expect(rankOpportunities(opps, noCorr)[0].nextAction).toBe("Address Critic feedback");
  });

  test("next action: KILL verdict (not shipped) is told to understand rejection", () => {
    // KILL verdicts guide users to understand why the bet was rejected, not attempt a fix.
    const opps = [mk({ id: "killed", status: "dropped", critic_review: critic("kill") })];
    expect(rankOpportunities(opps, noCorr)[0].nextAction).toBe("Understand why it was rejected");
  });

  test("next action: SHIP verdict (not shipped) gets execution-specific action", () => {
    // Confirms that endorsed bets now get an action that suggests building/proceeding.
    const opps = [mk({ id: "ship", status: "backlog", critic_review: critic("ship") })];
    expect(rankOpportunities(opps, noCorr)[0].nextAction).toMatch(/proceed|spec|build/);
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

  test("handles ice_score === null (nullish coalesce in scoreOf)", () => {
    const opps = [mk({ id: "a", ice_score: null }), mk({ id: "b", ice_score: 5 })];
    const ranked = rankOpportunities(opps, noCorr);
    // Bet with ice_score=5 should rank above the null-score bet
    expect(ranked[0].opp.id).toBe("b");
  });

  test("all bets with null ice_score fall through to verdict/corroboration/confidence", () => {
    const opps = [
      mk({ id: "a", ice_score: null, critic_review: null }),
      mk({ id: "b", ice_score: null, critic_review: critic("ship") }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    // Endorsed bet should rank higher despite both having null ice_score
    expect(ranked[0].opp.id).toBe("b");
  });

  test("malformed created_at dates default to 0 in tie-break (timeOf fallback)", () => {
    const opps = [
      mk({ id: "a", created_at: "not-a-date", ice_score: 5 }),
      mk({ id: "b", created_at: "2026-01-01T00:00:00Z", ice_score: 5 }),
    ];
    const ranked = rankOpportunities(opps, noCorr);
    // Both have same ICE, malformed date should be treated as time 0
    // Tie-break then goes to created_at: older (0) should come first
    expect(ranked[0].opp.id).toBe("a");
  });

  test("single opportunity is marked as best bet", () => {
    const opps = [mk({ id: "only" })];
    const ranked = rankOpportunities(opps, noCorr);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].isBestBet).toBe(true);
    expect(ranked[0].rank).toBe(1);
  });
});

// --- Terms: the comparator's reasoning as structured data -------------------
// Every ranked entry carries `terms`, ordered most-decisive-first along the
// comparator's own tie-break chain. These tests pin that the terms restate
// fields already computed (never invent weights), that they never reorder
// anything, and that `rationale` stays their prose projection.

import type { Term } from "./ranking";

describe("rankOpportunities terms", () => {
  test("clear winner: ICE leads with its value, then endorsement, then signal backing", () => {
    const opps = [
      mk({ id: "top", ice_score: 9, critic_review: critic("ship"), status: "backlog" }),
      mk({ id: "mid", ice_score: 4 }),
    ];
    const corr = (o: RankableOpportunity) => (o.id === "top" ? 7 : 0);
    const ranked = rankOpportunities(opps, corr);
    // Most-decisive-first follows the tie-break chain: ICE, verdict, then corroboration.
    expect(ranked[0].terms).toEqual([
      { label: "ICE", detail: "9.0 - highest in queue" },
      { label: `${REVIEWER} endorsed`, detail: "critic run, no kill" },
      { label: "Evidence behind it", detail: "7 backing findings" },
    ] satisfies Term[]);
    // A plain lower bet carries only its ICE term (pending, uncorroborated).
    const mid = ranked.find((r) => r.opp.id === "mid")!;
    expect(mid.terms).toEqual([{ label: "ICE", detail: "4.0" }] satisfies Term[]);
  });

  test("an ICE tie carries identical ICE terms; the secondary term names what separated them", () => {
    const endorsed = mk({ id: "a", critic_review: critic("ship") });
    const pending = mk({ id: "b", critic_review: null });
    const ranked = rankOpportunities([pending, endorsed], noCorr);
    // Order unchanged from the pinned chain behaviour...
    expect(ranked.map((r) => r.opp.id)).toEqual(["a", "b"]);
    // ...and both bets agree on the primary term (they tied on it).
    expect(ranked[0].terms[0]).toEqual({ label: "ICE", detail: "5.0 - highest in queue" });
    expect(ranked[1].terms[0]).toEqual({ label: "ICE", detail: "5.0" });
    // The endorsement is the term that broke the tie, present on exactly one.
    expect(ranked[0].terms[1]?.label).toBe(`${REVIEWER} endorsed`);
    expect(ranked[1].terms).toHaveLength(1);
  });

  test("terms follow the comparator chain when outcome support breaks the tie", () => {
    const ranked = rankOpportunities(
      [mk({ id: "a", theme_id: "t-proven" }), mk({ id: "b", theme_id: "t-burned" })],
      () => 0,
      (o) => (o.theme_id === "t-proven" ? 2 : -1),
    );
    expect(ranked[0].terms).toEqual([
      { label: "ICE", detail: "5.0 - highest in queue" },
      { label: "Theme track record", detail: "outcomes on this theme run proven" },
    ] satisfies Term[]);
    expect(ranked[1].terms).toEqual([
      { label: "ICE", detail: "5.0" },
      { label: "Theme track record", detail: "outcomes on this theme have missed" },
    ] satisfies Term[]);
  });

  test("degenerate inputs: empty list, single bet, and an unscored best bet", () => {
    expect(rankOpportunities([], noCorr)).toEqual([]);
    // One bet: just the ICE term, still marked highest in queue.
    const solo = rankOpportunities([mk({ id: "only", ice_score: 2 })], noCorr);
    expect(solo[0].terms).toEqual([
      { label: "ICE", detail: "2.0 - highest in queue" },
    ] satisfies Term[]);
    // A null-scored best bet says so instead of quoting a fabricated number.
    const unscored = rankOpportunities(
      [mk({ id: "plain", ice_score: null, critic_review: null })],
      () => 0,
    );
    expect(unscored[0].terms).toEqual([
      { label: "ICE", detail: "no score yet - highest in queue" },
    ] satisfies Term[]);
  });

  test("rationale stays the prose projection of the same factors", () => {
    // Every non-ICE term label must appear verbatim in the entry's rationale,
    // so a surface rendering chips beside the sentence can never contradict it.
    const ranked = rankOpportunities(
      [mk({ id: "top", ice_score: 9, critic_review: critic("ship") })],
      () => 7,
      () => 2,
      () => 1,
    );
    // Every non-ICE term must have its clause in the rationale - same factors,
    // same order, so a surface rendering chips beside the sentence can never
    // contradict it. Wording matches clause-by-clause where the prose names it.
    const entry = ranked[0];
    expect(entry.rationale).toContain(`${REVIEWER} endorsed`);
    expect(entry.rationale.toLowerCase()).toContain("standing top bet");
    expect(entry.rationale).toContain("run proven");
    expect(entry.rationale).toContain("backed by 7 findings");
    expect(entry.terms.map((t) => t.label)).toEqual([
      "ICE",
      `${REVIEWER} endorsed`,
      "On a standing top bet",
      "Theme track record",
      "Evidence behind it",
    ]);
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

  test("should return 'needs validation' when bet qualifies for both rules (impact=6, ease=7, both at exact thresholds)", () => {
    // impact=6 satisfies rule 2 (>= 6); ease=7 satisfies rule 3 (>= 7).
    // Rule 2 is first in the if-else chain, so "needs validation" wins.
    expect(deriveDesignation(boundary({ impact: 6, ease: 7 }))).toBe("needs validation");
  });

  test("should return 'needs validation' when bet qualifies for both rules (impact=8, ease=9, both well above thresholds)", () => {
    // Exceeding both thresholds still returns only one designation.
    // Rule 2 fires first regardless of how far past the threshold the values are.
    expect(deriveDesignation(boundary({ impact: 8, ease: 9 }))).toBe("needs validation");
  });

  test("should return 'needs validation' when bet qualifies for both rules (impact=8, ease=7, impact high, ease at threshold)", () => {
    // impact=8 > 6 (rule 2 fires), ease=7 >= 7 (rule 3 would also fire).
    // The precedence winner is rule 2.
    expect(deriveDesignation(boundary({ impact: 8, ease: 7 }))).toBe("needs validation");
  });

  test("should return 'needs validation' when bet qualifies for both rules (impact=6, ease=8, impact at threshold, ease high)", () => {
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

  test("should return 'quick win' when endorsement is added, endorsed bets skip rule 2 and fall through to rule 3", () => {
    // When the Critic endorses the bet (SHIP), !endorsed is false so rule 2 is
    // bypassed entirely. ease >= 7 && impact >= 5 then makes rule 3 the winner.
    // This tests that the not-endorsed gate is what causes the rule 2 / rule 3
    // ambiguity in the first place.
    expect(
      deriveDesignation({ rank: 2, verdict: "SHIP", impact: 6, ease: 7, corroboration: 0 }),
    ).toBe("quick win");
  });

  test("should return only 'needs validation' (not both designations) when both rules match, result is a single Designation, not an array", () => {
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
      // rank 1 anchor, ensures the dual-qualifier bet lands at rank 2.
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
 * ✓ FIXED: nextActionFor verdict differentiation
 *
 * The nextActionFor function now returns verdict-specific actions (lines 211-230).
 * This was fixed after the coverage audit 2026-07-09. These tests validate the
 * complete differentiation for all verdict paths.
 *
 * CURRENT BEHAVIOR (ranking.ts lines 211-230):
 *   - shipped status → "Review the outcome" (status check takes precedence)
 *   - PENDING → "Challenge with the Critic first"
 *   - SHIP → "Draft the spec"
 *   - WATCH → "Gather more evidence"
 *   - REVISE → "Address Critic feedback"
 *   - KILL → "Understand why it was rejected"
 */
describe("nextActionFor verdict differentiation (VERIFIED FIXED)", () => {
  /**
   * Test that REVISE gets actionable feedback
   *
   * ASSERTION: nextActionFor should return a string that suggests
   * fixing/improving the opportunity based on Critic feedback,
   * NOT the generic "Draft the spec".
   *
   * This differentiates REVISE (fixable) from KILL (not fixable).
   */
  test("REVISE verdict returns action guiding user to address Critic feedback", () => {
    const opp = mk({
      id: "revise-opp",
      status: "backlog",
      critic_review: critic("revise"),
    });

    const action = nextActionFor(opp);

    // REVISE should NOT be generic "Draft the spec"
    expect(action).not.toBe("Draft the spec");
    // Should suggest addressing/improving
    const suggestsAction = /revise|improve|address|refine|adjust/i.test(action);
    expect(suggestsAction).toBe(true);
  });

  /**
   * Test that KILL gets rejection clarity
   *
   * ASSERTION: nextActionFor should return a string that acknowledges
   * the bet was rejected and suggests understanding why,
   * distinct from REVISE (which is fixable).
   */
  test("KILL verdict returns action guiding user to understand rejection", () => {
    const opp = mk({
      id: "kill-opp",
      status: "backlog",
      critic_review: critic("kill"),
    });

    const action = nextActionFor(opp);

    // KILL should NOT be "Draft the spec"
    expect(action).not.toBe("Draft the spec");
    // Should NOT suggest fixing (unlike REVISE)
    const suggestsFixing = /revise|improve|address|refine/i.test(action);
    expect(suggestsFixing).toBe(false);
    // Should suggest understanding/accepting the rejection
    const suggestsReject = /reject|dismiss|understand|accept/i.test(action);
    expect(suggestsReject).toBe(true);
  });

  /**
   * Test that SHIP gets execution action
   *
   * ASSERTION: nextActionFor should return a string that suggests
   * proceeding with building/implementation for endorsed bets,
   * distinct from PENDING (needs more validation) or REVISE (needs fixing).
   */
  test("SHIP verdict returns action distinct from PENDING (already endorsed)", () => {
    const oppShip = mk({
      id: "ship-opp",
      status: "backlog",
      critic_review: critic("ship"),
    });

    const actionShip = nextActionFor(oppShip);

    // Create PENDING for comparison
    const oppPending = mk({
      id: "pending-opp",
      status: "backlog",
      critic_review: null,
    });
    const actionPending = nextActionFor(oppPending);

    // SHIP and PENDING must have different actions
    expect(actionShip).not.toBe(actionPending);
    // SHIP suggests drafting (already endorsed, next step is to draft the spec)
    expect(actionShip).toBe("Draft the spec");
    // PENDING suggests challenging with Critic
    expect(actionPending).toBe("Challenge with the Critic first");
  });

  /**
   * Test that WATCH gets monitoring action
   *
   * ASSERTION: nextActionFor should return a string that suggests
   * monitoring progress or waiting for more evidence,
   * distinct from SHIP (endorsed to proceed) or PENDING (needs validation).
   */
  test("WATCH verdict returns action guiding user to monitor and validate", () => {
    // WATCH status (status="next") gives WATCH verdict
    const opp = mk({
      id: "watch-opp",
      status: "next", // This makes verdictFor return "WATCH"
      critic_review: null,
    });

    const action = nextActionFor(opp);

    // WATCH should NOT collapse to "Draft the spec"
    expect(action).not.toBe("Draft the spec");
    // Should suggest monitoring/gathering evidence
    const suggestsMonitor = /monitor|watch|gather|evidence|validate|track/i.test(action);
    expect(suggestsMonitor).toBe(true);
  });

  /**
   * Test that PENDING (no Critic review) gets validation action
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

    const action = nextActionFor(opp);
    expect(action).toBe("Challenge with the Critic first");
  });

  /**
   * Test that shipped status overrides verdict
   *
   * ASSERTION: nextActionFor should return "Review the outcome"
   * regardless of the Critic verdict, when status === "shipped".
   * This should already work correctly.
   */
  test("shipped status returns 'Review the outcome' (overrides verdict)", () => {
    const oppShipped1 = mk({
      id: "shipped-1",
      status: "shipped",
      critic_review: null,
    });
    const oppShipped2 = mk({
      id: "shipped-2",
      status: "shipped",
      critic_review: critic("revise"),
    });
    const oppShipped3 = mk({
      id: "shipped-3",
      status: "shipped",
      critic_review: critic("kill"),
    });

    // All shipped opps should return "Review the outcome" regardless of verdict
    expect(nextActionFor(oppShipped1)).toBe("Review the outcome");
    expect(nextActionFor(oppShipped2)).toBe("Review the outcome");
    expect(nextActionFor(oppShipped3)).toBe("Review the outcome");
  });

  /**
   * Comprehensive verdict comparison
   *
   * ASSERTION: All five verdict outcomes (SHIP, WATCH, REVISE, KILL, PENDING)
   * return distinct, non-generic actions when status !== "shipped".
   * This is a high-level integration test for the fix.
   */
  test("all five verdicts (SHIP/WATCH/REVISE/KILL/PENDING) return distinct actions", () => {
    const oppShip = mk({
      id: "ship",
      status: "backlog",
      critic_review: critic("ship"),
    });
    const oppWatch = mk({
      id: "watch",
      status: "next", // Gives WATCH verdict
      critic_review: null,
    });
    const oppRevise = mk({
      id: "revise",
      status: "backlog",
      critic_review: critic("revise"),
    });
    const oppKill = mk({
      id: "kill",
      status: "backlog",
      critic_review: critic("kill"),
    });
    const oppPending = mk({
      id: "pending",
      status: "backlog",
      critic_review: null,
    });

    const actions = new Set([
      nextActionFor(oppShip),
      nextActionFor(oppWatch),
      nextActionFor(oppRevise),
      nextActionFor(oppKill),
      nextActionFor(oppPending),
    ]);

    // All five verdicts should produce distinct actions
    expect(actions.size).toBe(5);
    // Verify the specific expected actions are in the set
    expect(actions.has("Draft the spec")).toBe(true); // SHIP
    expect(actions.has("Gather more evidence")).toBe(true); // WATCH
    expect(actions.has("Address Critic feedback")).toBe(true); // REVISE
    expect(actions.has("Understand why it was rejected")).toBe(true); // KILL
    expect(actions.has("Challenge with the Critic first")).toBe(true); // PENDING
  });
});
