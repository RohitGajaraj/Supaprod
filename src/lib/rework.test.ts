/**
 * INSTRUMENT: the rework rollup. Every guard here is about HONESTY rather than
 * arithmetic, because each way this can mislead is a way a dashboard lies
 * quietly: a perfect-looking score for an agent nobody has ever checked, a
 * confident rate over three events, a corpus that is 99% seed data reported as
 * fact, a breakdown that does not sum to the total printed beside it, and a
 * zero for clarification loops that means "nobody counts them".
 */
import { describe, expect, test } from "bun:test";
import {
  DEMO_WORKSPACE_ID_PATTERN,
  REWORK_CONFIDENCE_FLOOR,
  SEND_BACK_VERDICT,
  isDemoWorkspaceId,
  rollUpRework,
  rollUpSpecDesign,
  type ReworkGateRow,
  type ReworkSpecRow,
} from "./rework";
import { summarizeGateSignals } from "./gate-signals";

const REAL_WS = "abcdef12-3456-4789-8abc-def012345678";
const DEMO_WS = "10000000-0000-4000-8000-000000000000";

function gate(p: Partial<ReworkGateRow> = {}): ReworkGateRow {
  return {
    gate_type: "approval",
    agent_slug: "builder",
    workspace_id: REAL_WS,
    subject_type: "spec",
    verdict: "approved",
    created_at: "2026-08-10T10:00:00.000Z",
    ...p,
  };
}

function spec(p: Partial<ReworkSpecRow> = {}): ReworkSpecRow {
  return {
    status: "approved",
    design_gate_status: "approved",
    workspace_id: REAL_WS,
    is_sample: false,
    ...p,
  };
}

/** N clean approvals, enough to clear the confidence floor. */
function manyApprovals(n: number): ReworkGateRow[] {
  return Array.from({ length: n }, () => gate());
}

/* ==================================================================
 * THE EMPTY CORPUS: zero must not be able to mean "perfect"
 * ================================================================== */

describe("the empty-corpus zero collision", () => {
  test("summarizeGateSignals really does report 0 for an empty corpus", () => {
    // This is the defect being defended against, asserted at its source so the
    // reason for every `number | null` below stays visible. 0 here is the same
    // value an agent with a flawless record produces.
    expect(summarizeGateSignals([]).overall.correctionRate).toBe(0);
  });

  test("an empty corpus yields a NULL rate, never a zero", () => {
    const r = rollUpRework({ gateEvents: [] });
    expect(r.firstPassAcceptance.overall.firstPassAcceptanceRate).toBeNull();
    expect(r.firstPassAcceptance.overall.measured).toBe(false);
    expect(r.corpus.measured).toBe(false);
    expect(r.corpus.gateEventsCounted).toBe(0);
    expect(r.firstPassAcceptance.byAgent).toEqual([]);
  });

  test("a rate of 0 is reachable, and it means the opposite of empty", () => {
    // Every gate needed a correction. That is a real, drawable claim, and it is
    // now the ONLY thing a zero can mean on this field.
    const r = rollUpRework({ gateEvents: [gate({ gate_type: "rejection" })] });
    expect(r.firstPassAcceptance.overall.firstPassAcceptanceRate).toBe(0);
    expect(r.firstPassAcceptance.overall.measured).toBe(true);
  });

  test("a perfect record is 1, and is distinguishable from both", () => {
    const r = rollUpRework({ gateEvents: [gate()] });
    expect(r.firstPassAcceptance.overall.firstPassAcceptanceRate).toBe(1);
    expect(r.firstPassAcceptance.overall.measured).toBe(true);
  });

  test("no rate anywhere in an empty rollup is a number", () => {
    // The whole surface must be unable to draw a confident zero from nothing.
    const r = rollUpRework({ gateEvents: [], specs: [] });
    expect(r.firstPassAcceptance.overall.firstPassAcceptanceRate).toBeNull();
    expect(r.reviewBurden.gatesPerDay).toBeNull();
    expect(r.specDesignMismatch.divergenceRate).toBeNull();
    expect(r.reviewBurden.measured).toBe(false);
    expect(r.reopened.measured).toBe(false);
    expect(r.specDesignMismatch.measured).toBe(false);
  });

  test("an agent nobody has checked never appears as perfect", () => {
    // The failure mode in one line: a roster read that produced an entry per
    // agent with no events would score every one of them 100%.
    const r = rollUpRework({ gateEvents: [gate({ agent_slug: "builder" })] });
    expect(r.firstPassAcceptance.byAgent.map((a) => a.agentSlug)).toEqual(["builder"]);
  });
});

/* ==================================================================
 * DEMO EXCLUSION: 112 of 113 rows are fiction
 * ================================================================== */

describe("demo exclusion", () => {
  test("the pattern matches all seven seeded workspaces and nothing else", () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7]) {
      expect(isDemoWorkspaceId(`${n}0000000-0000-4000-8000-000000000000`)).toBe(true);
    }
    expect(isDemoWorkspaceId(REAL_WS)).toBe(false);
    // Same length, different shape: must not be caught by a loose match.
    expect(isDemoWorkspaceId("10000001-0000-4000-8000-000000000000")).toBe(false);
    expect(DEMO_WORKSPACE_ID_PATTERN.test(DEMO_WS)).toBe(true);
  });

  test("a null workspace is NOT a demo workspace", () => {
    // The one gate event a real human ever produced carries workspace_id NULL.
    // A SQL `NOT LIKE` would have dropped it while claiming to remove seed data,
    // which is why this filter lives here and answers null honestly.
    expect(isDemoWorkspaceId(null)).toBe(false);
    expect(isDemoWorkspaceId(undefined)).toBe(false);
    const r = rollUpRework({ gateEvents: [gate({ workspace_id: null })] });
    expect(r.corpus.gateEventsCounted).toBe(1);
    expect(r.corpus.gateEventsFromDemo).toBe(0);
  });

  test("seed rows are excluded from every number, not just the total", () => {
    // Production shape: 112 seed rows against 1 real one. Without the filter
    // the instrument reports the seed's behaviour and calls it the product's.
    const seed = Array.from({ length: 112 }, () =>
      gate({ workspace_id: DEMO_WS, agent_slug: "seeded-agent", gate_type: "approval" }),
    );
    const r = rollUpRework({
      gateEvents: [...seed, gate({ workspace_id: null, gate_type: "rejection" })],
    });
    expect(r.corpus.gateEventsScanned).toBe(113);
    expect(r.corpus.gateEventsFromDemo).toBe(112);
    expect(r.corpus.gateEventsCounted).toBe(1);
    expect(r.firstPassAcceptance.overall.firstPassAcceptanceRate).toBe(0);
    expect(r.firstPassAcceptance.byAgent.map((a) => a.agentSlug)).toEqual(["builder"]);
    expect(r.reviewBurden.gatesTouched).toBe(1);
  });

  test("excluding every row leaves an unmeasured instrument, not a perfect one", () => {
    const r = rollUpRework({ gateEvents: [gate({ workspace_id: DEMO_WS })] });
    expect(r.corpus.gateEventsCounted).toBe(0);
    expect(r.corpus.measured).toBe(false);
    expect(r.firstPassAcceptance.overall.firstPassAcceptanceRate).toBeNull();
  });

  test("specs are excluded by BOTH the flag and the workspace shape", () => {
    // The seeded Helio Labs clones carry is_sample = false, so the flag alone
    // misses them. Six of the seven were only ever caught by the id shape.
    const r = rollUpSpecDesign([
      spec({ is_sample: true }),
      spec({ workspace_id: DEMO_WS, is_sample: false }),
      spec({ status: "approved", design_gate_status: "rejected" }),
    ]);
    expect(r.specsScanned).toBe(3);
    expect(r.specsFromDemo).toBe(2);
    expect(r.specsCounted).toBe(1);
    expect(r.divergent).toBe(1);
    expect(r.divergenceRate).toBe(1);
  });
});

/* ==================================================================
 * THE CORPUS HAS ALMOST NO HISTORY, AND MUST SAY SO
 * ================================================================== */

describe("the instrument declares how little it knows", () => {
  test("three events are counted but flagged as under the floor", () => {
    const r = rollUpRework({ gateEvents: [gate(), gate(), gate({ gate_type: "edit" })] });
    expect(r.corpus.gateEventsCounted).toBe(3);
    expect(r.corpus.belowConfidenceFloor).toBe(true);
    expect(r.corpus.confidenceFloor).toBe(REWORK_CONFIDENCE_FLOOR);
    expect(r.firstPassAcceptance.overall.belowConfidenceFloor).toBe(true);
  });

  test("clearing the floor turns the flag off, on both the corpus and the agent", () => {
    const r = rollUpRework({ gateEvents: manyApprovals(REWORK_CONFIDENCE_FLOOR) });
    expect(r.corpus.belowConfidenceFloor).toBe(false);
    expect(r.firstPassAcceptance.overall.belowConfidenceFloor).toBe(false);
    expect(r.firstPassAcceptance.byAgent[0].belowConfidenceFloor).toBe(false);
  });

  test("an unmeasured corpus is not 'below the floor' — it is not on the scale", () => {
    // Conflating the two would let a surface render "too few events" for a
    // corpus that has none, which reads as "nearly there" rather than "never".
    const r = rollUpRework({ gateEvents: [] });
    expect(r.corpus.belowConfidenceFloor).toBe(false);
    expect(r.corpus.measured).toBe(false);
  });

  test("the window and the observed span both travel, and may disagree", () => {
    // Capture began 2026-08-10, so a 30-day window over one day of events
    // divides by thirty and produces a per-day burden nobody experienced. The
    // surface needs both numbers to say "all of them today".
    const r = rollUpRework({
      gateEvents: [gate({ created_at: "2026-08-10T09:00:00.000Z" }), gate()],
      window: {
        days: 30,
        sinceIso: "2026-07-11T00:00:00.000Z",
        untilIso: "2026-08-10T12:00:00.000Z",
      },
    });
    expect(r.window.days).toBe(30);
    expect(r.window.sinceIso).toBe("2026-07-11T00:00:00.000Z");
    expect(r.reviewBurden.windowDays).toBe(30);
    expect(r.reviewBurden.gatesPerDay).toBeCloseTo(2 / 30);
    expect(r.reviewBurden.observedSpanDays).toBeCloseTo(1 / 24);
    expect(r.corpus.firstEventAt).toBe("2026-08-10T09:00:00.000Z");
    expect(r.corpus.lastEventAt).toBe("2026-08-10T10:00:00.000Z");
  });

  test("a window with no events yields no per-day rate", () => {
    const r = rollUpRework({ gateEvents: [], window: { days: 30 } });
    expect(r.reviewBurden.gatesPerDay).toBeNull();
    expect(r.reviewBurden.observedSpanDays).toBeNull();
  });
});

/* ==================================================================
 * COMPONENT 1: FIRST-PASS ACCEPTANCE, REUSING THE EXISTING DEFINITION
 * ================================================================== */

describe("first-pass acceptance", () => {
  test("rejection, edit and override are corrections; approval is not", () => {
    const r = rollUpRework({
      gateEvents: [
        gate({ gate_type: "approval" }),
        gate({ gate_type: "rejection" }),
        gate({ gate_type: "edit" }),
        gate({ gate_type: "override" }),
      ],
    });
    expect(r.firstPassAcceptance.overall.acceptedFirstPass).toBe(1);
    expect(r.firstPassAcceptance.overall.corrected).toBe(3);
    expect(r.firstPassAcceptance.overall.firstPassAcceptanceRate).toBe(0.25);
  });

  test("the rate is exactly the complement of the correction rate it reuses", () => {
    // The definition of a correction is NOT restated in the rework module; it
    // is read off summarizeGateSignals. This pins that they cannot drift.
    const rows = [
      gate({ gate_type: "approval" }),
      gate({ gate_type: "approval" }),
      gate({ gate_type: "edit" }),
    ];
    const signals = summarizeGateSignals(rows);
    const r = rollUpRework({ gateEvents: rows });
    expect(r.firstPassAcceptance.overall.firstPassAcceptanceRate).toBeCloseTo(
      1 - signals.overall.correctionRate,
    );
  });

  test("an unrecognised gate type is unscorable, never a clean approval", () => {
    // Counting it as an approval would flatter the agent for a row nobody can
    // interpret, which is the most expensive direction to be wrong in.
    const r = rollUpRework({ gateEvents: [gate(), gate({ gate_type: "shrug" })] });
    expect(r.corpus.gateEventsScanned).toBe(2);
    expect(r.corpus.gateEventsUnscorable).toBe(1);
    expect(r.corpus.gateEventsCounted).toBe(1);
    expect(r.firstPassAcceptance.overall.firstPassAcceptanceRate).toBe(1);
  });

  test("a gate with no agent is attributed to a named bucket, not dropped", () => {
    const r = rollUpRework({
      gateEvents: [gate({ agent_slug: null }), gate({ agent_slug: "builder" })],
    });
    expect(r.firstPassAcceptance.byAgent.map((a) => a.agentSlug).sort()).toEqual([
      "(unattributed)",
      "builder",
    ]);
    expect(r.corpus.gateEventsCounted).toBe(2);
  });

  test("agents are ordered by how much evidence there is about them", () => {
    const r = rollUpRework({
      gateEvents: [gate({ agent_slug: "a" }), gate({ agent_slug: "b" }), gate({ agent_slug: "b" })],
    });
    expect(r.firstPassAcceptance.byAgent.map((a) => a.agentSlug)).toEqual(["b", "a"]);
  });
});

/* ==================================================================
 * COMPONENT 2: REVIEW BURDEN
 * ================================================================== */

describe("review burden", () => {
  test("every gate a human decided counts as a gate a human had to stand at", () => {
    const r = rollUpRework({
      gateEvents: [gate(), gate({ gate_type: "edit" }), gate({ gate_type: "rejection" })],
    });
    expect(r.reviewBurden.gatesTouched).toBe(3);
    expect(r.reviewBurden.gatesRequiringCorrection).toBe(2);
  });

  test("the subject breakdown is complete, so it sums to the total beside it", () => {
    const r = rollUpRework({
      gateEvents: [
        gate({ subject_type: "spec" }),
        gate({ subject_type: "tool_call" }),
        gate({ subject_type: "decision" }),
        gate({ subject_type: "contract_clause" }),
        gate({ subject_type: "design_gate" }),
        gate({ subject_type: "memory_candidate" }),
      ],
    });
    // Six distinct kinds and no top-5 truncation: a truncated list under a
    // total is a breakdown that visibly does not add up.
    expect(r.reviewBurden.bySubjectType).toHaveLength(6);
    const summed = r.reviewBurden.bySubjectType.reduce((n, s) => n + s.gates, 0);
    expect(summed).toBe(r.reviewBurden.gatesTouched);
  });

  test("a gate with no subject lands in a named bucket", () => {
    const r = rollUpRework({
      gateEvents: [gate({ subject_type: null }), gate({ subject_type: "  " })],
    });
    expect(r.reviewBurden.bySubjectType).toEqual([{ subjectType: "(unspecified)", gates: 2 }]);
  });
});

/* ==================================================================
 * COMPONENT 3: REOPENED
 * ================================================================== */

describe("reopened", () => {
  test("a send-back is a reopen and is read off its verdict", () => {
    const r = rollUpRework({
      gateEvents: [
        gate({ gate_type: "rejection", verdict: SEND_BACK_VERDICT, agent_slug: "drafter" }),
        gate({ gate_type: "rejection", verdict: "rejected" }),
        gate(),
      ],
    });
    expect(r.reopened.reopens).toBe(1);
    expect(r.reopened.byAgent).toEqual([{ agentSlug: "drafter", reopens: 1 }]);
    expect(r.reopened.bySubjectType).toEqual([{ subjectType: "spec", reopens: 1 }]);
  });

  test("a plain decline is not a reopen", () => {
    // Declining a gate ends it. Sending it back starts it again. Scoring the
    // first as the second would inflate rework with work that never returned.
    const r = rollUpRework({ gateEvents: [gate({ gate_type: "rejection", verdict: "rejected" })] });
    expect(r.reopened.reopens).toBe(0);
    expect(r.reopened.measured).toBe(true);
  });

  test("reopens are a subset of corrections, which are a subset of gates", () => {
    const r = rollUpRework({
      gateEvents: [
        gate({ gate_type: "rejection", verdict: SEND_BACK_VERDICT }),
        gate({ gate_type: "edit" }),
        gate(),
      ],
    });
    expect(r.reopened.reopens).toBeLessThanOrEqual(r.reviewBurden.gatesRequiringCorrection);
    expect(r.reviewBurden.gatesRequiringCorrection).toBeLessThanOrEqual(
      r.reviewBurden.gatesTouched,
    );
  });

  test("a send-back verdict on an approval gate is bucketed, not counted or dropped", () => {
    // Impossible via the capture site, which writes gate_type 'rejection'. If
    // it ever happens the row is visible rather than silently reshaping the
    // reopen count or vanishing from the reconciliation.
    const r = rollUpRework({
      gateEvents: [gate({ gate_type: "approval", verdict: SEND_BACK_VERDICT })],
    });
    expect(r.reopened.reopens).toBe(0);
    expect(r.reopened.reopenVerdictOnNonCorrectionGate).toBe(1);
  });

  test("the undercount is declared, and the note count is kept separate", () => {
    // sendBackApprovalItem writes its gate event only when the draft was the
    // agent's. A human sending back their own draft leaves a note and no event,
    // so the gate-derived count is a floor, not a total.
    const r = rollUpRework({
      gateEvents: [gate({ gate_type: "rejection", verdict: SEND_BACK_VERDICT })],
      sendBackNotes: 4,
    });
    expect(r.reopened.gateEventReopensUndercount).toBe(true);
    expect(r.reopened.reopens).toBe(1);
    // Never summed into the headline: approval_feedback has no workspace_id, so
    // its rows cannot be scoped or demo-cleaned and must not be added to a
    // number that has been.
    expect(r.reopened.sendBackNotesRecorded).toBe(4);
  });

  test("an unread note stream is null, not zero", () => {
    const r = rollUpRework({ gateEvents: [gate()] });
    expect(r.reopened.sendBackNotesRecorded).toBeNull();
  });

  test("a seeded send-back never reaches the reopen count", () => {
    const r = rollUpRework({
      gateEvents: [
        gate({ workspace_id: DEMO_WS, gate_type: "rejection", verdict: SEND_BACK_VERDICT }),
      ],
    });
    expect(r.reopened.reopens).toBe(0);
    expect(r.reopened.measured).toBe(false);
  });
});

/* ==================================================================
 * COMPONENT 4: SPEC / DESIGN MISMATCH
 * ================================================================== */

describe("spec/design mismatch", () => {
  test("a rejected design gate on a decided spec is the divergence", () => {
    const r = rollUpSpecDesign([
      spec({ status: "approved", design_gate_status: "rejected" }),
      spec({ status: "shipped", design_gate_status: "rejected" }),
    ]);
    expect(r.divergent).toBe(2);
    expect(r.divergenceRate).toBe(1);
  });

  test("a pending gate is undecided, not divergent", () => {
    // Folding these in would report divergence for every spec that has simply
    // not reached its design gate yet, which is most of them.
    const r = rollUpSpecDesign([spec({ status: "approved", design_gate_status: "pending" })]);
    expect(r.divergent).toBe(0);
    expect(r.designGateUndecided).toBe(1);
    expect(r.divergenceRate).toBe(0);
  });

  test("an undecided spec has nothing for the gate to contradict", () => {
    const r = rollUpSpecDesign([
      spec({ status: "draft", design_gate_status: "rejected" }),
      spec({ status: "review", design_gate_status: "rejected" }),
    ]);
    expect(r.divergent).toBe(0);
    expect(r.specUndecided).toBe(2);
  });

  test("an out-of-constraint gate value is bucketed, never read as pending", () => {
    const r = rollUpSpecDesign([spec({ status: "approved", design_gate_status: "wat" })]);
    expect(r.unclassifiable).toBe(1);
    expect(r.aligned).toBe(0);
    expect(r.designGateUndecided).toBe(0);
  });

  test("the four buckets plus the unclassifiable one account for every counted spec", () => {
    const r = rollUpSpecDesign([
      spec({ status: "approved", design_gate_status: "rejected" }),
      spec({ status: "approved", design_gate_status: "pending" }),
      spec({ status: "shipped", design_gate_status: "approved" }),
      spec({ status: "draft" }),
      spec({ status: "approved", design_gate_status: "wat" }),
      spec({ is_sample: true }),
    ]);
    const summed =
      r.divergent + r.designGateUndecided + r.aligned + r.specUndecided + r.unclassifiable;
    expect(summed).toBe(r.specsCounted);
    expect(r.specsCounted + r.specsFromDemo).toBe(r.specsScanned);
  });

  test("no specs means unmeasured, not zero divergence", () => {
    const r = rollUpSpecDesign([]);
    expect(r.divergenceRate).toBeNull();
    expect(r.measured).toBe(false);
    // And 'zero divergence' remains a reachable, meaningful answer.
    const clean = rollUpSpecDesign([spec()]);
    expect(clean.divergenceRate).toBe(0);
    expect(clean.measured).toBe(true);
  });

  test("the rollup wires specs through and defaults to unmeasured when absent", () => {
    const withSpecs = rollUpRework({
      gateEvents: [],
      specs: [spec({ status: "approved", design_gate_status: "rejected" })],
    });
    expect(withSpecs.specDesignMismatch.divergent).toBe(1);
    expect(rollUpRework({ gateEvents: [] }).specDesignMismatch.measured).toBe(false);
  });
});

/* ==================================================================
 * COMPONENT 5: THE ONE THAT IS NOT MEASURED
 * ================================================================== */

describe("clarification loops are declared unmeasured rather than reported as zero", () => {
  test("the flag is always present, whatever the corpus", () => {
    // Nothing counts a clarification loop: human_gate_events records decisions
    // on finished drafts, agent_runs has no question-and-answer turn, and
    // threads mark no message as a request for clarification. A surface must
    // say "not measured", because a drawn zero reads as "this does not happen".
    expect(rollUpRework({ gateEvents: [] }).clarificationLoopsNotMeasured).toBe(true);
    expect(rollUpRework({ gateEvents: manyApprovals(50) }).clarificationLoopsNotMeasured).toBe(
      true,
    );
  });

  test("no proxy leaked in: no clarification count exists on the rollup", () => {
    // Guards against a later, well-meaning edit that quietly starts counting
    // edit gates or message turns as clarification.
    const r = rollUpRework({ gateEvents: [gate({ gate_type: "edit" })] }) as unknown as Record<
      string,
      unknown
    >;
    const suspect = Object.keys(r).filter((k) => /clarif/i.test(k));
    expect(suspect).toEqual(["clarificationLoopsNotMeasured"]);
  });
});

/* ==================================================================
 * RECONCILIATION: the breakdowns must agree with the totals
 * ================================================================== */

describe("everything reconciles against one counted total", () => {
  const rows: ReworkGateRow[] = [
    gate({ agent_slug: "builder", subject_type: "spec" }),
    gate({ agent_slug: "builder", subject_type: "spec", gate_type: "edit" }),
    gate({
      agent_slug: "critic",
      subject_type: "tool_call",
      gate_type: "rejection",
      verdict: SEND_BACK_VERDICT,
    }),
    gate({ agent_slug: null, subject_type: null, gate_type: "override" }),
    gate({ workspace_id: DEMO_WS }),
    gate({ gate_type: "not-a-gate-type" }),
  ];

  test("scanned = demo + unscorable + counted, with nothing unaccounted for", () => {
    const r = rollUpRework({ gateEvents: rows });
    const { gateEventsScanned, gateEventsFromDemo, gateEventsUnscorable, gateEventsCounted } =
      r.corpus;
    expect(gateEventsFromDemo + gateEventsUnscorable + gateEventsCounted).toBe(gateEventsScanned);
    expect(gateEventsCounted).toBe(4);
  });

  test("per-agent gates sum to the overall total", () => {
    const r = rollUpRework({ gateEvents: rows });
    const summed = r.firstPassAcceptance.byAgent.reduce((n, a) => n + a.gatesTouched, 0);
    expect(summed).toBe(r.firstPassAcceptance.overall.gatesTouched);
    expect(summed).toBe(r.corpus.gateEventsCounted);
  });

  test("accepted plus corrected is the total, for every agent and overall", () => {
    const r = rollUpRework({ gateEvents: rows });
    for (const a of [...r.firstPassAcceptance.byAgent, r.firstPassAcceptance.overall]) {
      expect(a.acceptedFirstPass + a.corrected).toBe(a.gatesTouched);
    }
  });

  test("the subject breakdown and review burden agree with the same total", () => {
    const r = rollUpRework({ gateEvents: rows });
    const summed = r.reviewBurden.bySubjectType.reduce((n, s) => n + s.gates, 0);
    expect(summed).toBe(r.corpus.gateEventsCounted);
    expect(r.reviewBurden.gatesTouched).toBe(r.corpus.gateEventsCounted);
    expect(r.reviewBurden.gatesRequiringCorrection).toBe(r.firstPassAcceptance.overall.corrected);
  });

  test("the reopen breakdowns sum to the reopen count", () => {
    const r = rollUpRework({ gateEvents: rows });
    expect(r.reopened.byAgent.reduce((n, a) => n + a.reopens, 0)).toBe(r.reopened.reopens);
    expect(r.reopened.bySubjectType.reduce((n, s) => n + s.reopens, 0)).toBe(r.reopened.reopens);
  });

  test("no unattributed row was quietly discarded to make the sums work", () => {
    const r = rollUpRework({ gateEvents: rows });
    expect(r.firstPassAcceptance.byAgent.map((a) => a.agentSlug)).toContain("(unattributed)");
    expect(r.reviewBurden.bySubjectType.map((s) => s.subjectType)).toContain("(unspecified)");
  });
});
