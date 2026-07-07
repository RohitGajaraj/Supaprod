import { describe, expect, test } from "bun:test";
import {
  asReviewVerdict,
  buildSkeletonReview,
  composeReviewSummary,
  designationForReview,
  scoreBetCall,
  REVIEW_SUMMARY_MAX,
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
