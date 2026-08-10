import { describe, expect, test } from "bun:test";
import {
  decideDecisionReview,
  DECISION_RECORD_EFFECT,
  TRACK_RECORD_MIN_EVENTS,
  TRACK_RECORD_MAX_CORRECTION_RATE,
  type DecisionReviewInputs,
} from "./decision-gate";
import { assessTool, toolConsequence } from "./tool-consequences";

/**
 * The two shapes production actually writes, so the tests are about the live
 * rows and not about a hypothesis. Both mission write points build exactly
 * these; if one of them changes, the corresponding constant here is the thing
 * that should fail to match reality.
 */

/** `runTriggers` (routes/api/public/hooks/trigger-tick.ts) — the 170 rows. */
const TRIGGER_TICK_RECEIPT: DecisionReviewInputs = {
  sourceKind: "mission",
  agentSlug: "strategist",
  confidence: "medium",
  effect: DECISION_RECORD_EFFECT,
  commitsBeyondTheRecord: false,
};

/** `maybeCompleteMission` (lib/ai/handoff.server.ts) — a clean completion. */
const MISSION_COMPLETED_RECEIPT: DecisionReviewInputs = {
  sourceKind: "mission",
  agentSlug: "discovery-scout",
  confidence: "medium",
  effect: DECISION_RECORD_EFFECT,
  commitsBeyondTheRecord: false,
};

describe("the benign class auto-approves", () => {
  test("a mission proposal receipt lands on the record", () => {
    const d = decideDecisionReview(TRIGGER_TICK_RECEIPT);
    expect(d.action).toBe("auto_approve");
    expect(d.status).toBe("approved");
  });

  test("a completed-mission receipt lands on the record", () => {
    const d = decideDecisionReview(MISSION_COMPLETED_RECEIPT);
    expect(d.action).toBe("auto_approve");
    expect(d.status).toBe("approved");
  });

  test("the action and the status can never disagree", () => {
    const rows: DecisionReviewInputs[] = [
      TRIGGER_TICK_RECEIPT,
      MISSION_COMPLETED_RECEIPT,
      { ...TRIGGER_TICK_RECEIPT, confidence: "low" },
      { ...TRIGGER_TICK_RECEIPT, sourceKind: "manual" },
      { ...TRIGGER_TICK_RECEIPT, effect: null },
    ];
    for (const r of rows) {
      const d = decideDecisionReview(r);
      expect(d.status).toBe(d.action === "auto_approve" ? "approved" : "pending");
    }
  });

  test("an auto-approval names its drafter, so the audit row can attribute it", () => {
    const d = decideDecisionReview(TRIGGER_TICK_RECEIPT);
    expect(d.reason).toContain("strategist");
    expect(d.because.some((f) => f.includes("strategist"))).toBe(true);
  });
});

describe("the refusals — each one is a fact a confident model cannot talk past", () => {
  test("unknown provenance asks: a null source_kind is not 'agent'", () => {
    const d = decideDecisionReview({ ...TRIGGER_TICK_RECEIPT, sourceKind: null });
    expect(d.action).toBe("ask");
    expect(d.reason).toContain("where it came from");
  });

  test("a blank source_kind is unknown too, not an empty pass", () => {
    expect(decideDecisionReview({ ...TRIGGER_TICK_RECEIPT, sourceKind: "   " }).action).toBe("ask");
  });

  test("a human-authored decision is not ours to approve", () => {
    const d = decideDecisionReview({ ...TRIGGER_TICK_RECEIPT, sourceKind: "manual" });
    expect(d.action).toBe("ask");
  });

  test("an unattributable approval asks, however benign everything else is", () => {
    for (const slug of [null, "", "  "]) {
      const d = decideDecisionReview({ ...MISSION_COMPLETED_RECEIPT, agentSlug: slug });
      expect(d.action).toBe("ask");
      expect(d.reason).toContain("No agent is named");
    }
  });

  test("low confidence asks — the PC-11 convention, finally wired", () => {
    const d = decideDecisionReview({ ...MISSION_COMPLETED_RECEIPT, confidence: "low" });
    expect(d.action).toBe("ask");
  });

  test("medium and high both clear it, exactly as shouldGateForReview says", () => {
    expect(decideDecisionReview({ ...TRIGGER_TICK_RECEIPT, confidence: "medium" }).action).toBe(
      "auto_approve",
    );
    expect(decideDecisionReview({ ...TRIGGER_TICK_RECEIPT, confidence: "high" }).action).toBe(
      "auto_approve",
    );
  });

  test("an uncatalogued effect asks: unknown blast radius is maximal blast radius", () => {
    const d = decideDecisionReview({ ...TRIGGER_TICK_RECEIPT, effect: "some.tool.nobody.scored" });
    expect(d.action).toBe("ask");
  });

  test("a missing effect asks", () => {
    expect(decideDecisionReview({ ...TRIGGER_TICK_RECEIPT, effect: null }).action).toBe("ask");
  });

  test("irreversible, external and spend-touching tools all ask", () => {
    // One per disqualifying dimension, drawn from the live catalogue rather
    // than invented: publishing a release cannot be undone, merging a PR leaves
    // the workspace, dispatching a mission starts work nothing checks first.
    for (const tool of [
      "release.publish",
      "studio.pr.merge",
      "mission.dispatch",
      "studio.commit",
    ]) {
      const d = decideDecisionReview({ ...TRIGGER_TICK_RECEIPT, effect: tool });
      expect(d.action).toBe("ask");
      expect(d.reason).toContain(assessTool(tool).drivenBy);
    }
  });

  test("something moving outside the record asks", () => {
    const d = decideDecisionReview({ ...TRIGGER_TICK_RECEIPT, commitsBeyondTheRecord: true });
    expect(d.action).toBe("ask");
  });

  test("NOT KNOWING whether something moves asks — absent is not benign", () => {
    const d = decideDecisionReview({ ...TRIGGER_TICK_RECEIPT, commitsBeyondTheRecord: null });
    expect(d.action).toBe("ask");
    expect(d.reason).toContain("unknown is not a no");
  });

  test("every refusal still carries its facts, so a queued item can explain itself", () => {
    const refusals: DecisionReviewInputs[] = [
      { ...TRIGGER_TICK_RECEIPT, sourceKind: null },
      { ...TRIGGER_TICK_RECEIPT, sourceKind: "manual" },
      { ...TRIGGER_TICK_RECEIPT, agentSlug: null },
      { ...TRIGGER_TICK_RECEIPT, confidence: "low" },
      { ...TRIGGER_TICK_RECEIPT, effect: null },
      { ...TRIGGER_TICK_RECEIPT, effect: "release.publish" },
      { ...TRIGGER_TICK_RECEIPT, commitsBeyondTheRecord: null },
    ];
    for (const r of refusals) {
      const d = decideDecisionReview(r);
      expect(d.action).toBe("ask");
      expect(d.reason.length).toBeGreaterThan(20);
      // Five inputs, five facts: the list is the record of what was weighed,
      // so it must not shrink when the answer is no.
      expect(d.because.length).toBe(5);
    }
  });
});

/**
 * PLANTING THE DEFECT.
 *
 * A refusal test only proves something if the same test would have PASSED
 * against the permissive version of the rule and now fails. So the permissive
 * version is written out below and run against the same input: `permissiveGate`
 * is the bar as it would read if "we have no signal" were treated as "the
 * signal is fine", which is the single mistake this module exists to prevent
 * and the one a future edit is most likely to reintroduce (it always looks like
 * a harmless default).
 *
 * If `decideDecisionReview` ever drifts toward it, the second half of each
 * assertion pair starts failing.
 */
describe("planted defect: 'no signal' must not read as 'good signal'", () => {
  /** The bar with every fail-closed default flipped to fail-open. */
  function permissiveGate(i: DecisionReviewInputs): "auto_approve" | "ask" {
    if (i.sourceKind === "manual") return "ask";
    if (i.confidence === "low") return "ask";
    // The defect, four times over: an absent source is assumed agentic, an
    // absent drafter is assumed fine, an uncatalogued effect is assumed
    // harmless, and an unknown side effect is assumed to be none.
    //
    // `toolConsequence` rather than `assessTool` is the realistic form of the
    // mistake: it answers for an unknown tool with a DEFAULT row reading
    // "partly reversible", which looks like an answer and is actually a shrug.
    // `assessTool` is the one that fails closed, and reaching for it instead is
    // the whole difference.
    if (i.effect && toolConsequence(i.effect).reversible === "irreversible") return "ask";
    if (i.commitsBeyondTheRecord === true) return "ask";
    return "auto_approve";
  }

  const unknowns: { name: string; input: DecisionReviewInputs }[] = [
    { name: "no provenance", input: { ...TRIGGER_TICK_RECEIPT, sourceKind: null } },
    { name: "no drafter", input: { ...TRIGGER_TICK_RECEIPT, agentSlug: null } },
    { name: "no catalogued effect", input: { ...TRIGGER_TICK_RECEIPT, effect: null } },
    {
      name: "an effect nobody scored",
      input: { ...TRIGGER_TICK_RECEIPT, effect: "some.tool.nobody.scored" },
    },
    {
      name: "cannot tell whether anything moves",
      input: { ...TRIGGER_TICK_RECEIPT, commitsBeyondTheRecord: null },
    },
  ];

  for (const { name, input } of unknowns) {
    test(`${name}: the permissive bar waves it through, the real one asks`, () => {
      expect(permissiveGate(input)).toBe("auto_approve");
      expect(decideDecisionReview(input).action).toBe("ask");
    });
  }
});

describe("phase (b): the track-record seam is built and not switched on", () => {
  const perfect = { correctionRate: 0, events: 500 };
  const untested = { correctionRate: 0, events: 0 };
  const thin = { correctionRate: 1, events: TRACK_RECORD_MIN_EVENTS - 1 };
  const bad = { correctionRate: TRACK_RECORD_MAX_CORRECTION_RATE + 0.2, events: 200 };

  test("omitting it changes nothing", () => {
    expect(decideDecisionReview(TRIGGER_TICK_RECEIPT).action).toBe(
      decideDecisionReview(TRIGGER_TICK_RECEIPT, null).action,
    );
    expect(decideDecisionReview(TRIGGER_TICK_RECEIPT, undefined).action).toBe("auto_approve");
  });

  test("a spotless record CANNOT rescue anything the bar refused", () => {
    // The whole point. An agent with 500 clean gates still does not get to
    // auto-approve a release, a low-confidence record, or an unknown effect.
    const refusals: DecisionReviewInputs[] = [
      { ...TRIGGER_TICK_RECEIPT, confidence: "low" },
      { ...TRIGGER_TICK_RECEIPT, effect: "release.publish" },
      { ...TRIGGER_TICK_RECEIPT, effect: null },
      { ...TRIGGER_TICK_RECEIPT, commitsBeyondTheRecord: true },
      { ...TRIGGER_TICK_RECEIPT, sourceKind: null },
    ];
    for (const r of refusals) {
      expect(decideDecisionReview(r, perfect).action).toBe("ask");
    }
  });

  test("an agent with NO history is not treated as a good one", () => {
    // summarizeGateSignals honestly returns correctionRate 0 for an empty
    // corpus, and 0 is also what perfect looks like. This is the collision the
    // seam must never resolve in the agent's favour: it does not widen anything
    // for either, which is the only reading that cannot be gamed by absence.
    expect(
      decideDecisionReview({ ...TRIGGER_TICK_RECEIPT, confidence: "low" }, untested).action,
    ).toBe("ask");
    expect(
      decideDecisionReview({ ...TRIGGER_TICK_RECEIPT, confidence: "low" }, perfect).action,
    ).toBe("ask");
  });

  test("a corpus too thin to be a record is ignored, however alarming", () => {
    // 100% correction over 19 gates is noise, not evidence. Treating noise as
    // evidence in the escalating direction is the same mistake as treating it
    // as evidence in the permissive one.
    expect(decideDecisionReview(TRIGGER_TICK_RECEIPT, thin).action).toBe("auto_approve");
  });

  test("a real bad record DOES escalate — the seam's one live direction", () => {
    const d = decideDecisionReview(TRIGGER_TICK_RECEIPT, bad);
    expect(d.action).toBe("ask");
    expect(d.reason).toContain("strategist");
    expect(d.because.some((f) => f.includes("decided gates"))).toBe(true);
  });

  test("a good real record still does not widen the bar today", () => {
    // Identical answer with and without the signal, on a decision that already
    // cleared: the seam adds nothing until someone deliberately turns it on.
    expect(decideDecisionReview(TRIGGER_TICK_RECEIPT, perfect).action).toBe(
      decideDecisionReview(TRIGGER_TICK_RECEIPT).action,
    );
  });
});

describe("decision.record is the effect both writers claim, and it survives assessTool", () => {
  test("the catalogued row still scores benign — if it stops, the 170 come back", () => {
    const a = assessTool(DECISION_RECORD_EFFECT);
    expect(a.autoApprovable).toBe(true);
    expect(a.reversibility).toBe("reversible");
    expect(a.external).toBe(false);
    expect(a.score).toBe(0);
  });
});
