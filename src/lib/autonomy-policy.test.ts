import { describe, expect, test } from "bun:test";
import {
  AUTONOMY_BOUNDS,
  coldStartBarFor,
  COLD_START_FLOOR,
  COLD_START_MATURE_AT,
  decideSettlement,
  promotionBarFor,
  resolveAutonomyPolicy,
  settleBarFor,
  SHIPPED_AUTONOMY_POLICY,
  type AutonomyPolicy,
  type AutonomyPolicyRow,
} from "./autonomy-policy";
import { DEFAULT_PROMOTION_BAR, qualifies, rankForPromotion } from "@/lib/spine/promote";
import {
  classifyOutcomeSettlement,
  SETTLE_FLOOR,
  SETTLE_STAKES_SPAN,
  SHIPPED_SETTLE_BAR,
  type SettlementInputs,
} from "@/lib/ai/outcome-review";

/* ========================================================================== *
 * The whole point of this file is one claim: turning two constants into
 * workspace policy changed NOTHING until somebody deliberately moves them.
 * Every "the default reproduces today's behaviour" assertion below is written
 * against the shipped constants themselves AND against their literal values,
 * so neither a drifting copy nor a quietly edited constant can pass.
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

/** A spread wide enough that a changed rule cannot hide inside one case. */
const SPREAD: SettlementInputs[] = [
  inputs(),
  inputs({ impact: null, otherBetsOnTheme: 0, movesTheScore: false }),
  inputs({ impact: 10, otherBetsOnTheme: 4, movesTheScore: true }),
  inputs({ metricObserved: false, metricDeclared: true, verdict: "mixed", movesTheScore: false }),
  inputs({ metricObserved: false, metricDeclared: false, basis: null }),
  inputs({ verdict: "missed", holdsPromotionFor: "Engineer" }),
  inputs({ verdict: "missed", verdictIsRecordFact: true, metricDeclared: false, basis: null }),
  inputs({
    metricObserved: true,
    basis: { data_days: 0, sample_users: 0, has_shipped_changeset: true, has_prediction: true },
    impact: 10,
    otherBetsOnTheme: 4,
  }),
];

describe("the shipped policy IS today's behaviour", () => {
  test("every default is the constant the engine already used", () => {
    expect(SHIPPED_AUTONOMY_POLICY.minFrequency).toBe(DEFAULT_PROMOTION_BAR.minFrequency);
    expect(SHIPPED_AUTONOMY_POLICY.minSeverity).toBe(DEFAULT_PROMOTION_BAR.minSeverity);
    expect(SHIPPED_AUTONOMY_POLICY.minConfidence).toBe(DEFAULT_PROMOTION_BAR.minConfidence);
    expect(SHIPPED_AUTONOMY_POLICY.settleFloor).toBe(SETTLE_FLOOR);
    expect(SHIPPED_AUTONOMY_POLICY.settleStakesSpan).toBe(SETTLE_STAKES_SPAN);
  });

  test("and those constants are still the numbers that shipped", () => {
    // Written literally on purpose. The assertion above would still pass if
    // somebody moved a constant; this one is the tripwire that says they did.
    expect(SHIPPED_AUTONOMY_POLICY.minFrequency).toBe(8);
    expect(SHIPPED_AUTONOMY_POLICY.minSeverity).toBe(4);
    expect(SHIPPED_AUTONOMY_POLICY.minConfidence).toBe(0.75);
    expect(SHIPPED_AUTONOMY_POLICY.settleFloor).toBe(0.45);
    expect(SHIPPED_AUTONOMY_POLICY.settleStakesSpan).toBe(0.4);
  });

  test("nothing is carved out and nothing is claimed as the workspace's", () => {
    expect(SHIPPED_AUTONOMY_POLICY.neverSettleAboveImpact).toBeNull();
    expect(SHIPPED_AUTONOMY_POLICY.chosen).toEqual([]);
  });

  test("the promotion bar it hands the sweep is the platform bar, field for field", () => {
    expect(promotionBarFor(SHIPPED_AUTONOMY_POLICY)).toEqual(DEFAULT_PROMOTION_BAR);
  });

  test("the settle bar it hands the rule is the shipped bar", () => {
    expect(settleBarFor(SHIPPED_AUTONOMY_POLICY)).toEqual(SHIPPED_SETTLE_BAR);
  });
});

describe("resolveAutonomyPolicy falls back to the shipped default, never to an extreme", () => {
  test("no row at all", () => {
    expect(resolveAutonomyPolicy(null)).toEqual(SHIPPED_AUTONOMY_POLICY);
    expect(resolveAutonomyPolicy(undefined)).toEqual(SHIPPED_AUTONOMY_POLICY);
  });

  test("a row with no policy columns on it yet, which is the pre-migration read", () => {
    expect(resolveAutonomyPolicy({})).toEqual(SHIPPED_AUTONOMY_POLICY);
  });

  test("a row whose every policy column is null, which is a workspace that set nothing", () => {
    const row: AutonomyPolicyRow = {
      promotion_min_frequency: null,
      promotion_min_severity: null,
      promotion_min_confidence: null,
      settle_evidence_floor: null,
      settle_stakes_span: null,
      never_settle_above_impact: null,
    };
    expect(resolveAutonomyPolicy(row)).toEqual(SHIPPED_AUTONOMY_POLICY);
  });

  test("a value that makes no sense falls back per field rather than poisoning the row", () => {
    const p = resolveAutonomyPolicy({
      promotion_min_frequency: 500, // past the top of the range
      promotion_min_severity: 0, // below the bottom
      promotion_min_confidence: Number.NaN,
      settle_evidence_floor: 0.6, // the one good value
    });
    expect(p.minFrequency).toBe(SHIPPED_AUTONOMY_POLICY.minFrequency);
    expect(p.minSeverity).toBe(SHIPPED_AUTONOMY_POLICY.minSeverity);
    expect(p.minConfidence).toBe(SHIPPED_AUTONOMY_POLICY.minConfidence);
    expect(p.settleFloor).toBe(0.6);
    // Only the readable one is reported as the workspace's own.
    expect(p.chosen).toEqual(["settleFloor"]);
  });

  test("numerics that arrive as strings over PostgREST are read as numbers", () => {
    const p = resolveAutonomyPolicy({
      promotion_min_frequency: "12",
      promotion_min_confidence: "0.90",
      settle_stakes_span: "0.20",
      never_settle_above_impact: "8",
    });
    expect(p.minFrequency).toBe(12);
    expect(p.minConfidence).toBe(0.9);
    expect(p.settleStakesSpan).toBe(0.2);
    expect(p.neverSettleAboveImpact).toBe(8);
  });

  test("a partly-set row keeps our numbers for everything it did not state", () => {
    const p = resolveAutonomyPolicy({ promotion_min_frequency: 3 });
    expect(p.minFrequency).toBe(3);
    expect(p.minSeverity).toBe(SHIPPED_AUTONOMY_POLICY.minSeverity);
    expect(p.settleFloor).toBe(SHIPPED_AUTONOMY_POLICY.settleFloor);
    expect(p.chosen).toEqual(["minFrequency"]);
  });

  test("every field can be stated, and then every field reads as theirs", () => {
    const p = resolveAutonomyPolicy({
      promotion_min_frequency: 20,
      promotion_min_severity: 5,
      promotion_min_confidence: 0.95,
      settle_evidence_floor: 0.8,
      settle_stakes_span: 0.15,
      never_settle_above_impact: 7,
    });
    expect(p.chosen).toHaveLength(6);
    expect(promotionBarFor(p)).toEqual({ minFrequency: 20, minSeverity: 5, minConfidence: 0.95 });
    expect(settleBarFor(p)).toEqual({ floor: 0.8, span: 0.15 });
  });

  test("the bounds are the ones the write path validates against", () => {
    expect(AUTONOMY_BOUNDS.minSeverity).toEqual({ min: 1, max: 5 });
    expect(AUTONOMY_BOUNDS.neverSettleAboveImpact).toEqual({ min: 1, max: 10 });
  });
});

describe("the promotion default decides exactly as the hardcoded bar did", () => {
  const themes = [
    {
      id: "a",
      title: "Nine loud people",
      summary: null,
      frequency: 9,
      severity: 5,
      confidence: 0.9,
      status: "open",
    },
    {
      id: "b",
      title: "Eight on the nose",
      summary: null,
      frequency: 8,
      severity: 4,
      confidence: 0.75,
      status: "open",
    },
    {
      id: "c",
      title: "One short",
      summary: null,
      frequency: 7,
      severity: 4,
      confidence: 0.75,
      status: "open",
    },
    {
      id: "d",
      title: "Mild",
      summary: null,
      frequency: 40,
      severity: 2,
      confidence: 0.99,
      status: "open",
    },
    {
      id: "e",
      title: "Unsure",
      summary: null,
      frequency: 40,
      severity: 5,
      confidence: 0.5,
      status: "open",
    },
  ];

  test("qualifies gives the same verdict with the resolved default as with no bar at all", () => {
    const bar = promotionBarFor(resolveAutonomyPolicy(null));
    for (const t of themes) {
      expect(qualifies(t, bar)).toEqual(qualifies(t));
    }
  });

  test("and ranks the same clusters in the same order", () => {
    const bar = promotionBarFor(resolveAutonomyPolicy(null));
    expect(rankForPromotion(themes, bar)).toEqual(rankForPromotion(themes));
  });

  test("a workspace that lowers the bar promotes what the platform bar refused", () => {
    const loose = promotionBarFor(resolveAutonomyPolicy({ promotion_min_frequency: 5 }));
    expect(qualifies(themes[2]).ok).toBe(false);
    expect(qualifies(themes[2], loose).ok).toBe(true);
  });

  test("a workspace that raises it stops what the platform bar allowed", () => {
    const tight = promotionBarFor(resolveAutonomyPolicy({ promotion_min_confidence: 0.95 }));
    expect(qualifies(themes[1]).ok).toBe(true);
    expect(qualifies(themes[1], tight).ok).toBe(false);
    expect(qualifies(themes[1], tight).why).toContain("not confident enough");
  });
});

describe("the settle default decides exactly as the hardcoded bar did", () => {
  test("an explicit shipped bar and no bar at all are the same decision", () => {
    for (const i of SPREAD) {
      expect(classifyOutcomeSettlement(i, SHIPPED_SETTLE_BAR)).toEqual(
        classifyOutcomeSettlement(i),
      );
    }
  });

  test("the shipped policy through decideSettlement is the same decision again", () => {
    for (const i of SPREAD) {
      expect(decideSettlement(i, SHIPPED_AUTONOMY_POLICY)).toEqual(classifyOutcomeSettlement(i));
    }
  });

  test("and so is calling decideSettlement with no policy at all", () => {
    for (const i of SPREAD) {
      expect(decideSettlement(i)).toEqual(classifyOutcomeSettlement(i));
    }
  });
});

describe("moving the settle bar moves the line, in both directions", () => {
  // A read number and a merged change, no usage behind it: enough for a small
  // bet under the shipped bar, not enough for a big one.
  const thin: Partial<SettlementInputs> = {
    metricObserved: true,
    metricDeclared: true,
    basis: { data_days: 0, sample_users: 0, has_shipped_changeset: true, has_prediction: true },
  };

  test("a lower floor settles what the shipped bar handed to a person", () => {
    const i = inputs({ ...thin, impact: 10, otherBetsOnTheme: 4, movesTheScore: true });
    expect(decideSettlement(i, SHIPPED_AUTONOMY_POLICY).action).toBe("escalate");

    const loose = resolveAutonomyPolicy({ settle_evidence_floor: 0.2, settle_stakes_span: 0.1 });
    expect(decideSettlement(i, loose).action).toBe("settle");
  });

  test("a higher floor asks about what the shipped bar settled", () => {
    const i = inputs({ ...thin, impact: 2, otherBetsOnTheme: 0, movesTheScore: false });
    expect(decideSettlement(i, SHIPPED_AUTONOMY_POLICY).action).toBe("settle");

    const tight = resolveAutonomyPolicy({ settle_evidence_floor: 0.95 });
    const d = decideSettlement(i, tight);
    expect(d.action).toBe("escalate");
    // The floor moved and the span did not, so the bar it had to clear is the
    // new floor plus the shipped climb for whatever rides on this one.
    expect(d.required).toBeCloseTo(0.95 + SETTLE_STAKES_SPAN * d.stakes, 10);
  });

  test("no loosening can clear the three hard gates, which are floors and not settings", () => {
    const wideOpen = resolveAutonomyPolicy({
      settle_evidence_floor: 0,
      settle_stakes_span: 0,
    });
    // Nothing was ever attached to the bet that could check it.
    expect(
      decideSettlement(inputs({ metricDeclared: false, metricObserved: false }), wideOpen).action,
    ).toBe("escalate");
    // A decisive verdict with no number read.
    expect(
      decideSettlement(inputs({ verdict: "missed", metricObserved: false }), wideOpen).action,
    ).toBe("escalate");
    // A miss that holds another agent's promotion on a soft read.
    expect(
      decideSettlement(inputs({ verdict: "missed", holdsPromotionFor: "Engineer" }), wideOpen)
        .action,
    ).toBe("escalate");
  });
});

describe("the carve-out is a sentence, and it only ever takes a call back", () => {
  const carve = resolveAutonomyPolicy({ never_settle_above_impact: 8 });

  test("a bet above the stated impact is never settled, however good the evidence", () => {
    const i = inputs({ impact: 10 });
    expect(decideSettlement(i, SHIPPED_AUTONOMY_POLICY).action).toBe("settle");

    const d = decideSettlement(i, carve);
    expect(d.action).toBe("escalate");
    expect(d.reason).toContain("above impact 8");
    // The evidence is not rewritten to justify the escalation. The record still
    // says the case was strong; the carve-out is why it is on a person's desk.
    expect(d.evidence).toBeCloseTo(decideSettlement(i, SHIPPED_AUTONOMY_POLICY).evidence, 10);
  });

  test("the stated impact itself still answers to the bar, because 'above' means above", () => {
    expect(decideSettlement(inputs({ impact: 8 }), carve).action).toBe("settle");
    expect(decideSettlement(inputs({ impact: 9 }), carve).action).toBe("escalate");
  });

  test("a bet with no impact linked is untouched by it", () => {
    const i = inputs({ impact: null, movesTheScore: false });
    expect(decideSettlement(i, carve)).toEqual(decideSettlement(i, SHIPPED_AUTONOMY_POLICY));
  });

  test("it can never hand an agent a call the rule refused", () => {
    const refused = inputs({ metricDeclared: false, metricObserved: false, impact: 1 });
    expect(decideSettlement(refused, SHIPPED_AUTONOMY_POLICY).action).toBe("escalate");
    expect(
      decideSettlement(refused, resolveAutonomyPolicy({ never_settle_above_impact: 10 })),
    ).toEqual(decideSettlement(refused, SHIPPED_AUTONOMY_POLICY));
  });

  test("it says why, in the facts a person reads before overturning", () => {
    const d = decideSettlement(inputs({ impact: 10 }), carve);
    expect(d.because.join(" ")).toContain("carve-out");
  });

  test("no sentence it writes carries a dash the commit hook rejects", () => {
    const d = decideSettlement(inputs({ impact: 10 }), carve);
    const text = [d.reason, ...d.because].join(" ");
    // Escaped rather than literal so this file is itself clean for the hook.
    expect(text).not.toContain("\u2014");
    expect(text).not.toContain("\u2013");
  });
});

describe("a policy object is enough on its own to drive both engines", () => {
  test("one resolved policy produces both bars without a second read", () => {
    const p: AutonomyPolicy = resolveAutonomyPolicy({
      promotion_min_frequency: 6,
      settle_evidence_floor: 0.5,
    });
    expect(promotionBarFor(p).minFrequency).toBe(6);
    expect(promotionBarFor(p).minSeverity).toBe(DEFAULT_PROMOTION_BAR.minSeverity);
    expect(settleBarFor(p).floor).toBe(0.5);
    expect(settleBarFor(p).span).toBe(SETTLE_STAKES_SPAN);
  });
});

/*
 * THE COLD START. Every number below is the shape measured in production on
 * 2026-08-22: real workspaces hold 4 to 7 signals and their largest theme
 * clusters 3, against a shipped bar of 8, which is why no real workspace has
 * ever promoted a cluster.
 */
describe("coldStartBarFor", () => {
  const bar = DEFAULT_PROMOTION_BAR; // minFrequency 8

  test("a mature workspace is held to exactly the bar that shipped", () => {
    expect(coldStartBarFor(bar, COLD_START_MATURE_AT)).toEqual(bar);
    expect(coldStartBarFor(bar, 400)).toEqual(bar);
  });

  test("the real-workspace case: five signals resolves to the floor, not to one", () => {
    // ceil(8 * 5 / 40) is 1, and one signal is a report rather than a pattern.
    expect(coldStartBarFor(bar, 5).minFrequency).toBe(COLD_START_FLOOR);
  });

  test("it scales between the floor and the bar rather than stepping", () => {
    expect(coldStartBarFor(bar, 20).minFrequency).toBe(4);
    expect(coldStartBarFor(bar, 30).minFrequency).toBe(6);
    expect(coldStartBarFor(bar, 39).minFrequency).toBe(8);
  });

  test("it can only ever lower the bar, never raise it", () => {
    for (const n of [0, 1, 5, 12, 25, 39, 40, 100]) {
      expect(coldStartBarFor(bar, n).minFrequency).toBeLessThanOrEqual(bar.minFrequency);
    }
  });

  test("a workspace that deliberately set a low bar keeps it", () => {
    const deliberate = { ...bar, minFrequency: 2 };
    // The floor must not raise a number a person chose on purpose.
    expect(coldStartBarFor(deliberate, 5).minFrequency).toBe(2);
  });

  test("severity and confidence never move, because they are not corpus-relative", () => {
    const scaled = coldStartBarFor(bar, 5);
    expect(scaled.minSeverity).toBe(bar.minSeverity);
    expect(scaled.minConfidence).toBe(bar.minConfidence);
  });

  test("an unknown corpus size is treated as mature, so it cannot loosen anything", () => {
    expect(coldStartBarFor(bar, Number.NaN)).toEqual(bar);
  });

  test("the measured live theme still has to clear severity and confidence", () => {
    // 17 of 27 real themes clear severity and confidence; frequency alone blocks
    // them. A theme that clears the scaled frequency but not the quality bars
    // must still be refused.
    const scaled = coldStartBarFor(bar, 5);
    const weak = { title: "t", frequency: 3, severity: 2, confidence: 0.9, status: "open" };
    expect(qualifies(weak, scaled).ok).toBe(false);
    const good = { title: "t", frequency: 3, severity: 4, confidence: 0.8, status: "open" };
    expect(qualifies(good, scaled).ok).toBe(true);
  });
});
