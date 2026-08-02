import { describe, expect, test } from "bun:test";
import {
  asReviewVerdict,
  basisFor,
  buildSkeletonReview,
  classifyOutcomeSettlement,
  composeReviewSummary,
  designationForReview,
  metricWasDeclared,
  metricWasObserved,
  overturnMove,
  scoreBetCall,
  settlementEvidence,
  settlementStakes,
  EVIDENCE_WEIGHTS,
  REVIEW_SUMMARY_MAX,
  SETTLE_FLOOR,
  SETTLE_STAKES_SPAN,
  type SettlementInputs,
  type SkeletonReviewInput,
} from "./outcome-review";

describe("asReviewVerdict", () => {
  test("passes the learnings vocabulary through", () => {
    expect(asReviewVerdict("validated")).toBe("validated");
    expect(asReviewVerdict("missed")).toBe("missed");
    expect(asReviewVerdict("mixed")).toBe("mixed");
  });

  test("rejects the wider tolerated-on-read vocabulary and junk", () => {
    expect(asReviewVerdict("confirmed")).toBeNull();
    expect(asReviewVerdict("achieved")).toBeNull();
    expect(asReviewVerdict("")).toBeNull();
    expect(asReviewVerdict(null)).toBeNull();
    expect(asReviewVerdict(undefined)).toBeNull();
    expect(asReviewVerdict(42)).toBeNull();
  });
});

describe("designationForReview", () => {
  test("null opportunity earns no designation", () => {
    expect(designationForReview(null)).toBeNull();
  });

  test("not endorsed + high impact reads needs validation", () => {
    expect(
      designationForReview({ status: "backlog", critic_review: null, impact: 7, ease: 8 }),
    ).toBe("needs validation");
  });

  test("Critic-endorsed easy high-impact bet reads quick win", () => {
    expect(
      designationForReview({
        status: "backlog",
        critic_review: { verdict: "ship" },
        impact: 6,
        ease: 8,
      }),
    ).toBe("quick win");
  });

  test("hard bet reads heavy lift", () => {
    expect(
      designationForReview({
        status: "backlog",
        critic_review: { verdict: "ship" },
        impact: 4,
        ease: 2,
      }),
    ).toBe("heavy lift");
  });

  test("plain bet earns null; rank-dependent designations can never fire", () => {
    // Endorsed, mid impact, mid ease: none of the rank-free rules match, and
    // "best bet" / "watch this week" need list context the review lacks.
    expect(
      designationForReview({
        status: "backlog",
        critic_review: { verdict: "ship" },
        impact: 4,
        ease: 5,
      }),
    ).toBeNull();
  });

  test("missing numbers default to the neutral 5", () => {
    // impact null -> 5 (< 6, so no needs-validation), ease null -> 5.
    expect(
      designationForReview({ status: "backlog", critic_review: null, impact: null, ease: null }),
    ).toBeNull();
  });
});

describe("scoreBetCall", () => {
  test("backed designations score right on validated, wrong on missed", () => {
    expect(scoreBetCall("best bet", "validated")).toBe("right call");
    expect(scoreBetCall("best bet", "missed")).toBe("wrong call");
    expect(scoreBetCall("quick win", "validated")).toBe("right call");
    expect(scoreBetCall("quick win", "missed")).toBe("wrong call");
  });

  test("needs validation is vindicated by a miss, unclear on a win", () => {
    expect(scoreBetCall("needs validation", "missed")).toBe("right call");
    expect(scoreBetCall("needs validation", "validated")).toBe("unclear");
  });

  test("designations that claim nothing about outcome stay unclear", () => {
    expect(scoreBetCall("heavy lift", "validated")).toBe("unclear");
    expect(scoreBetCall("heavy lift", "missed")).toBe("unclear");
    expect(scoreBetCall("watch this week", "validated")).toBe("unclear");
    expect(scoreBetCall(null, "validated")).toBe("unclear");
    expect(scoreBetCall(null, "missed")).toBe("unclear");
  });

  test("a mixed verdict decides nothing", () => {
    expect(scoreBetCall("best bet", "mixed")).toBe("unclear");
    expect(scoreBetCall("needs validation", "mixed")).toBe("unclear");
    expect(scoreBetCall(null, "mixed")).toBe("unclear");
  });
});

const baseInput: SkeletonReviewInput = {
  shippedAt: null,
  checkBy: "2026-08-06T10:00:00.000Z",
  successMetric: null,
  problem: null,
  hypothesis: null,
  outcome: null,
  suggestion: null,
};

describe("buildSkeletonReview", () => {
  test("a human-recorded outcome wins and is not provisional", () => {
    const r = buildSkeletonReview({
      ...baseInput,
      shippedAt: "2026-07-10T00:00:00.000Z",
      outcome: {
        verdict: "validated",
        summary: "Activation rose 9%.",
        metric_label: "Activation",
        metric_value: "+9%",
      },
    });
    expect(r.verdict).toBe("validated");
    expect(r.provisional).toBe(false);
    expect(r.actual).toContain("Activation rose 9%.");
    expect(r.actual).toContain("Activation: +9%.");
  });

  test("a high-confidence suggestion stands in, provisionally", () => {
    const r = buildSkeletonReview({
      ...baseInput,
      shippedAt: "2026-07-10T00:00:00.000Z",
      suggestion: {
        verdict: "missed",
        summary: "Usage stayed flat after ship.",
        confidence_tier: "high",
        metric_label: "Distinct users (30d)",
        metric_value: "3",
      },
    });
    expect(r.verdict).toBe("missed");
    expect(r.provisional).toBe(true);
    expect(r.actual).toContain("Usage stayed flat after ship.");
  });

  test("a low-confidence suggestion is ignored", () => {
    const r = buildSkeletonReview({
      ...baseInput,
      shippedAt: "2026-07-10T00:00:00.000Z",
      suggestion: { verdict: "missed", summary: "Thin signal.", confidence_tier: "low" },
    });
    expect(r.verdict).toBe("mixed");
    expect(r.actual).toContain("no recorded result");
  });

  test("a window that closes without a ship is a miss, stated plainly", () => {
    const r = buildSkeletonReview(baseInput);
    expect(r.verdict).toBe("missed");
    expect(r.provisional).toBe(true);
    expect(r.actual).toContain("without the spec shipping");
    expect(r.actual).toContain("2026-08-06");
  });

  test("shipped with no readable signal is mixed", () => {
    const r = buildSkeletonReview({ ...baseInput, shippedAt: "2026-07-10T00:00:00.000Z" });
    expect(r.verdict).toBe("mixed");
    expect(r.actual).toContain("Shipped 2026-07-10");
    expect(r.actual).toContain("no recorded result and no strong signal");
  });

  test("prediction assembles from problem, hypothesis, and success metric", () => {
    const r = buildSkeletonReview({
      ...baseInput,
      problem: "Onboarding stalls at step 3",
      hypothesis: "A shorter form lifts completion",
      successMetric: "Signup completion rate",
    });
    expect(r.predicted).toBe(
      "Problem: Onboarding stalls at step 3. Hypothesis: A shorter form lifts completion. Success metric: Signup completion rate.",
    );
  });

  test("no prediction fields reads honestly", () => {
    expect(buildSkeletonReview(baseInput).predicted).toBe("No recorded prediction.");
  });

  test("an outcome with an unknown verdict falls through instead of trusting it", () => {
    const r = buildSkeletonReview({
      ...baseInput,
      outcome: { verdict: "achieved", summary: "Legacy vocab." },
    });
    expect(r.verdict).toBe("missed"); // fell through to the unshipped-window rule
  });
});

describe("composeReviewSummary", () => {
  test("carries provenance, prediction, result, and the bet call", () => {
    const s = composeReviewSummary({
      checkBy: "2026-08-06T10:00:00.000Z",
      predicted: "Problem: X.",
      happened: "Usage flat.",
      betCall: "wrong call",
      designation: "quick win",
      provisional: true,
    });
    expect(s).toContain("Outcome window closed 2026-08-06");
    expect(s).toContain("Predicted: Problem: X.");
    expect(s).toContain("What happened: Usage flat.");
    expect(s).toContain('Bet call: wrong call (designated "quick win").');
    expect(s).toContain("Provisional: no human-recorded outcome yet.");
  });

  test("names the missing designation instead of inventing one", () => {
    const s = composeReviewSummary({
      checkBy: null,
      predicted: "No recorded prediction.",
      happened: "Nothing recorded.",
      betCall: "unclear",
      designation: null,
      provisional: false,
    });
    expect(s).toContain("Bet call: unclear (no designation derivable at review time).");
    expect(s).not.toContain("Provisional:");
  });

  test("caps at the learnings summary max", () => {
    const s = composeReviewSummary({
      checkBy: "2026-08-06T10:00:00.000Z",
      predicted: "p".repeat(3000),
      happened: "h".repeat(3000),
      betCall: "unclear",
      designation: null,
      provisional: true,
    });
    expect(s.length).toBe(REVIEW_SUMMARY_MAX);
  });
});

/* ========================================================================== *
 * The settle-or-ask rule.
 *
 * These are the tests that decide whether an agent is allowed to say what a
 * shipped bet meant. They are written against the two failure modes that
 * matter in opposite directions: an agent that says `validated` on nothing,
 * and a queue so long the human is back to approving every row.
 * ========================================================================== */

const BASE: SettlementInputs = {
  verdict: "validated",
  verdictIsRecordFact: false,
  metricDeclared: true,
  metricObserved: true,
  basis: { data_days: 14, sample_users: 40, has_shipped_changeset: true, has_prediction: true },
  impact: 5,
  otherBetsOnTheme: 0,
  movesTheScore: true,
  holdsPromotionFor: null,
};

const inputs = (over: Partial<SettlementInputs> = {}): SettlementInputs => ({ ...BASE, ...over });

describe("settlementEvidence", () => {
  test("a record fact carries full evidence, whatever else is missing", () => {
    expect(
      settlementEvidence(
        inputs({
          verdictIsRecordFact: true,
          metricDeclared: false,
          metricObserved: false,
          basis: null,
        }),
      ),
    ).toBe(1);
  });

  test("everything present sums to 1", () => {
    expect(settlementEvidence(inputs())).toBeCloseTo(1, 10);
  });

  test("nothing present scores zero", () => {
    expect(
      settlementEvidence(inputs({ metricDeclared: false, metricObserved: false, basis: null })),
    ).toBe(0);
  });

  test("a declared but unread metric is worth far less than a read one", () => {
    const declared = settlementEvidence(
      inputs({ metricObserved: false, metricDeclared: true, basis: null }),
    );
    const observed = settlementEvidence(inputs({ metricObserved: true, basis: null }));
    expect(declared).toBeCloseTo(EVIDENCE_WEIGHTS.metricDeclared, 10);
    expect(observed).toBeCloseTo(EVIDENCE_WEIGHTS.metricObserved, 10);
    expect(observed).toBeGreaterThan(declared * 3);
  });

  test("usage ramps over 14 days and never past full weight", () => {
    const at7 = settlementEvidence(
      inputs({
        metricObserved: false,
        metricDeclared: false,
        basis: {
          data_days: 7,
          sample_users: 5,
          has_shipped_changeset: false,
          has_prediction: false,
        },
      }),
    );
    const at28 = settlementEvidence(
      inputs({
        metricObserved: false,
        metricDeclared: false,
        basis: {
          data_days: 28,
          sample_users: 5,
          has_shipped_changeset: false,
          has_prediction: false,
        },
      }),
    );
    expect(at7).toBeCloseTo(EVIDENCE_WEIGHTS.usage / 2, 10);
    expect(at28).toBeCloseTo(EVIDENCE_WEIGHTS.usage, 10);
  });

  test("a negative or absurd day count never scores below zero", () => {
    expect(
      settlementEvidence(
        inputs({
          metricObserved: false,
          metricDeclared: false,
          basis: {
            data_days: -5,
            sample_users: 0,
            has_shipped_changeset: false,
            has_prediction: false,
          },
        }),
      ),
    ).toBe(0);
  });
});

describe("settlementStakes", () => {
  test("an unlinked spec risks nothing", () => {
    expect(settlementStakes(inputs({ impact: null, otherBetsOnTheme: 0 }))).toBe(0);
  });

  test("a big bet that moves the score with siblings behind it maxes out", () => {
    expect(settlementStakes(inputs({ impact: 10, movesTheScore: true, otherBetsOnTheme: 3 }))).toBe(
      1,
    );
  });

  test("a verdict that moves nothing is cheaper than one that does", () => {
    const moves = settlementStakes(inputs({ movesTheScore: true }));
    const inert = settlementStakes(inputs({ movesTheScore: false }));
    expect(inert).toBeLessThan(moves);
  });

  test("blast radius saturates rather than running away", () => {
    const three = settlementStakes(inputs({ otherBetsOnTheme: 3 }));
    const thirty = settlementStakes(inputs({ otherBetsOnTheme: 30 }));
    expect(thirty).toBe(three);
  });
});

describe("classifyOutcomeSettlement: the hard gates", () => {
  test("no oracle at all is escalated no matter how confident everything else looks", () => {
    const d = classifyOutcomeSettlement(
      inputs({
        metricDeclared: false,
        metricObserved: false,
        basis: {
          data_days: 30,
          sample_users: 900,
          has_shipped_changeset: true,
          has_prediction: true,
        },
      }),
    );
    expect(d.action).toBe("escalate");
    expect(d.reason).toContain("judgment call");
  });

  test("validated with no number read is escalated", () => {
    const d = classifyOutcomeSettlement(
      inputs({ verdict: "validated", metricObserved: false, metricDeclared: true }),
    );
    expect(d.action).toBe("escalate");
    expect(d.reason).toContain("a win");
  });

  test("missed with no number read is escalated too, not only the flattering one", () => {
    const d = classifyOutcomeSettlement(
      inputs({ verdict: "missed", metricObserved: false, metricDeclared: true }),
    );
    expect(d.action).toBe("escalate");
    expect(d.reason).toContain("a miss");
  });

  test("mixed is not gated on a reading, because it claims nothing decisive", () => {
    const d = classifyOutcomeSettlement(
      inputs({
        verdict: "mixed",
        movesTheScore: false,
        metricObserved: false,
        metricDeclared: true,
        impact: 4,
      }),
    );
    expect(d.action).toBe("settle");
  });

  test("a miss that holds another agent's promotion is escalated", () => {
    const d = classifyOutcomeSettlement(
      inputs({ verdict: "missed", holdsPromotionFor: "Engineer" }),
    );
    expect(d.action).toBe("escalate");
    expect(d.reason).toContain("Engineer");
  });

  test("a validated verdict is not blocked by the promotion gate", () => {
    const d = classifyOutcomeSettlement(
      inputs({ verdict: "validated", holdsPromotionFor: "Engineer" }),
    );
    expect(d.action).toBe("settle");
  });

  test("a window that closed with nothing shipped settles even against the promotion gate", () => {
    const d = classifyOutcomeSettlement(
      inputs({
        verdict: "missed",
        verdictIsRecordFact: true,
        metricDeclared: false,
        metricObserved: false,
        basis: null,
        holdsPromotionFor: "Engineer",
      }),
    );
    expect(d.action).toBe("settle");
    expect(d.reason).toContain("settles itself");
  });
});

describe("classifyOutcomeSettlement: the sliding bar", () => {
  test("the bar it had to clear rises with the stakes", () => {
    const cheap = classifyOutcomeSettlement(inputs({ impact: null, otherBetsOnTheme: 0 }));
    const dear = classifyOutcomeSettlement(
      inputs({ impact: 10, movesTheScore: true, otherBetsOnTheme: 3 }),
    );
    expect(cheap.required).toBeCloseTo(SETTLE_FLOOR, 10);
    expect(dear.required).toBeCloseTo(SETTLE_FLOOR + SETTLE_STAKES_SPAN, 10);
    expect(dear.required).toBeGreaterThan(cheap.required);
  });

  test("the same evidence settles a small bet and is escalated on a large one", () => {
    // A read metric and a merged change, no usage history behind it.
    const thin = {
      metricObserved: true,
      metricDeclared: true,
      basis: {
        data_days: 0,
        sample_users: 0,
        has_shipped_changeset: true,
        has_prediction: true,
      },
    } satisfies Partial<SettlementInputs>;
    const small = classifyOutcomeSettlement(
      inputs({ ...thin, impact: 2, otherBetsOnTheme: 0, movesTheScore: false }),
    );
    const large = classifyOutcomeSettlement(
      inputs({ ...thin, impact: 10, otherBetsOnTheme: 4, movesTheScore: true }),
    );
    expect(small.evidence).toBeCloseTo(large.evidence, 10);
    expect(small.action).toBe("settle");
    expect(large.action).toBe("escalate");
    expect(large.reason).toContain("thin");
  });

  test("the full evidence set settles even the biggest bet", () => {
    const d = classifyOutcomeSettlement(
      inputs({ impact: 10, otherBetsOnTheme: 9, movesTheScore: true }),
    );
    expect(d.action).toBe("settle");
    expect(d.evidence).toBeCloseTo(1, 10);
  });

  test("every decision carries the facts it rested on", () => {
    const d = classifyOutcomeSettlement(inputs({ otherBetsOnTheme: 2 }));
    expect(d.because.length).toBeGreaterThan(2);
    expect(d.because.join(" ")).toContain("2 other bets");
    expect(d.evidence).toBeGreaterThanOrEqual(0);
    expect(d.evidence).toBeLessThanOrEqual(1);
    expect(d.stakes).toBeGreaterThanOrEqual(0);
    expect(d.stakes).toBeLessThanOrEqual(1);
  });

  test("no reason line ever carries a dash the commit hook rejects", () => {
    const all = [
      classifyOutcomeSettlement(inputs()),
      classifyOutcomeSettlement(inputs({ metricDeclared: false, metricObserved: false })),
      classifyOutcomeSettlement(inputs({ verdict: "missed", holdsPromotionFor: "Engineer" })),
      classifyOutcomeSettlement(inputs({ verdict: "missed", metricObserved: false })),
      classifyOutcomeSettlement(inputs({ impact: 10, otherBetsOnTheme: 4, basis: null })),
    ];
    for (const d of all) {
      const text = [d.reason, ...d.because].join(" ");
      // Escaped rather than literal so this file is itself clean for the hook.
      expect(text).not.toContain("\u2014");
      expect(text).not.toContain("\u2013");
    }
  });
});

describe("overturnMove", () => {
  const deltas = { validated: 2, missed: -2, mixed: 0 } as const;

  test("a first verdict moves by its own delta", () => {
    expect(overturnMove(deltas, "validated", null)).toBe(2);
    expect(overturnMove(deltas, "missed", null)).toBe(-2);
    expect(overturnMove(deltas, "mixed", null)).toBe(0);
  });

  test("overturning lands where the human's verdict alone would have", () => {
    // Agent said validated (+2). Human says missed. The net has to be -2.
    expect(overturnMove(deltas, "missed", "validated")).toBe(-4);
    expect(2 + overturnMove(deltas, "missed", "validated")).toBe(deltas.missed);
    expect(0 + overturnMove(deltas, "validated", "mixed")).toBe(deltas.validated);
  });

  test("confirming an agent's verdict moves nothing twice", () => {
    expect(overturnMove(deltas, "validated", "validated")).toBe(0);
    expect(overturnMove(deltas, "missed", "missed")).toBe(0);
  });

  test("the property holds for any delta table, so it cannot drift", () => {
    const other = { validated: 5, missed: -1, mixed: 3 } as const;
    for (const prior of ["validated", "missed", "mixed"] as const) {
      for (const next of ["validated", "missed", "mixed"] as const) {
        expect(other[prior] + overturnMove(other, next, prior)).toBe(other[next]);
      }
    }
  });
});

describe("the derived booleans", () => {
  test("a metric needs both a label and a value to count as read", () => {
    expect(metricWasObserved({ metric_label: "Signups", metric_value: "412" })).toBe(true);
    expect(metricWasObserved({ metric_label: "Signups", metric_value: "" })).toBe(false);
    expect(metricWasObserved({ metric_label: null, metric_value: "412" })).toBe(false);
    expect(metricWasObserved(null)).toBe(false);
    expect(metricWasObserved(undefined)).toBe(false);
  });

  test("a hazy or empty contract declares nothing checkable", () => {
    expect(metricWasDeclared(null, "hazy")).toBe(false);
    expect(metricWasDeclared(null, "empty")).toBe(false);
    expect(metricWasDeclared(null, null)).toBe(false);
    expect(metricWasDeclared("   ", "hazy")).toBe(false);
  });

  test("a launch plan metric or a checkable contract both count", () => {
    expect(metricWasDeclared("Weekly active users up 10%", null)).toBe(true);
    expect(metricWasDeclared(null, "verifiable")).toBe(true);
    expect(metricWasDeclared(null, "partial")).toBe(true);
  });

  test("the basis narrows junk to zeroes rather than NaN", () => {
    expect(basisFor(null)).toBeNull();
    expect(basisFor({ basis: null })).toBeNull();
    expect(basisFor({ basis: {} })).toEqual({
      data_days: 0,
      sample_users: 0,
      has_shipped_changeset: false,
      has_prediction: false,
    });
    expect(basisFor({ basis: { data_days: 3, has_prediction: true } })).toEqual({
      data_days: 3,
      sample_users: 0,
      has_shipped_changeset: false,
      has_prediction: true,
    });
  });
});
