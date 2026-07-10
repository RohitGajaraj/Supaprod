// SEAM-3 (mission 3.9): pure logic tests for the insight-push channel.
// Covers the hard throttle (cap 3/day) and the three candidate classifiers.

import { describe, expect, test } from "bun:test";
import {
  applyPushThrottle,
  classifyPushCandidates,
  DAILY_PUSH_CAP,
  detectBetContradictions,
  detectCalibrationMisses,
  detectGroundShifts,
  NEGATIVE_VERDICTS,
  type CalibrationMissInput,
  type LearningInput,
  type LiveDecisionInput,
} from "./push-insights";

const decision = (over: Partial<LiveDecisionInput> = {}): LiveDecisionInput => ({
  id: "d1",
  title: "Ship the export flow",
  status: "approved",
  mission_id: null,
  prd_id: null,
  meeting_id: null,
  ...over,
});

const learning = (over: Partial<LearningInput> = {}): LearningInput => ({
  id: "l1",
  opportunity_id: "opp1",
  verdict: "missed",
  summary: "Activation stayed flat after launch.",
  created_at: "2026-07-06T10:00:00.000Z",
  ...over,
});

const miss = (over: Partial<CalibrationMissInput> = {}): CalibrationMissInput => ({
  id: "i1",
  kind: "prediction",
  claim: "Churn complaints will double by August",
  theme_id: "t1",
  resolution: "miss",
  resolved_at: "2026-07-07T06:00:00.000Z",
  evidence: null,
  ...over,
});

const SINCE = "2026-07-01T00:00:00.000Z";

describe("detectGroundShifts", () => {
  test("live decision whose source prd was superseded produces a push candidate", () => {
    const d = decision({ prd_id: "prd9", status: "pending" });
    const out = detectGroundShifts([d], new Map([["prd9", "d2"]]), new Map([["d2", "Newer call"]]));
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("ground_shift");
    expect(out[0].dedupKey).toBe("ground_shift:d1");
    expect(out[0].action).toEqual({
      label: "Open the decision",
      kind: "open_decision",
      targetId: "d1",
    });
    expect(out[0].body).toContain("Newer call");
    expect(out[0].priority).toBe(3);
  });

  test("decision superseded via its own id also fires, without a known superseder title", () => {
    const out = detectGroundShifts([decision()], new Map([["d1", ""]]), new Map());
    expect(out).toHaveLength(1);
    expect(out[0].body).toContain("A newer decision superseded");
    expect(out[0].evidence.superseded_by).toBeNull();
  });

  test("rejected decisions never fire", () => {
    const out = detectGroundShifts(
      [decision({ status: "rejected" })],
      new Map([["d1", "d2"]]),
      new Map(),
    );
    expect(out).toHaveLength(0);
  });

  test("a decision whose linked prd already shipped never fires", () => {
    const d = decision({ prd_id: "prd9", prdShipped: true });
    const out = detectGroundShifts([d], new Map([["prd9", "d2"]]), new Map());
    expect(out).toHaveLength(0);
  });

  test("a live decision with untouched ground never fires", () => {
    const out = detectGroundShifts([decision()], new Map([["other", "d2"]]), new Map());
    expect(out).toHaveLength(0);
  });
});

describe("detectBetContradictions", () => {
  const bestBet = { id: "opp1", title: "Faster onboarding" };

  test("a negative learning against the best bet produces one candidate", () => {
    const out = detectBetContradictions(bestBet, [learning()]);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("bet_contradiction");
    expect(out[0].action).toEqual({
      label: "Re-rank the queue",
      kind: "rerank_bets",
      targetId: "opp1",
    });
    expect(out[0].dedupKey).toBe("bet_contradiction:opp1:l1");
    expect(out[0].body).toContain("Activation stayed flat");
  });

  test("no best bet means no candidate", () => {
    expect(detectBetContradictions(null, [learning()])).toHaveLength(0);
  });

  test("positive and neutral verdicts never contradict", () => {
    const out = detectBetContradictions(bestBet, [
      learning({ verdict: "validated" }),
      learning({ id: "l2", verdict: "mixed" }),
    ]);
    expect(out).toHaveLength(0);
  });

  test("a learning on a different opportunity is ignored", () => {
    expect(detectBetContradictions(bestBet, [learning({ opportunity_id: "opp2" })])).toHaveLength(
      0,
    );
  });

  test("the newest contradicting learning carries the single candidate", () => {
    const out = detectBetContradictions(bestBet, [
      learning({ id: "old", created_at: "2026-07-02T00:00:00.000Z" }),
      learning({ id: "new", created_at: "2026-07-06T00:00:00.000Z", verdict: "Missed" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].dedupKey).toBe("bet_contradiction:opp1:new");
  });

  test("the negative verdict vocabulary matches the Brain lenses", () => {
    expect([...NEGATIVE_VERDICTS].sort()).toEqual(["invalidated", "loss", "missed", "refuted"]);
  });
});

describe("detectCalibrationMisses", () => {
  test("a fresh miss produces a review-assumption candidate", () => {
    const out = detectCalibrationMisses([miss()], SINCE);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("assumption_miss");
    expect(out[0].title).toContain("Churn complaints will double");
    expect(out[0].action).toEqual({
      label: "Review the assumption",
      kind: "review_assumption",
      targetId: "i1",
    });
    expect(out[0].dedupKey).toBe("assumption_miss:i1");
    expect(out[0].themeId).toBe("t1");
  });

  test("hits and inconclusive resolutions never fire", () => {
    const out = detectCalibrationMisses(
      [miss({ resolution: "hit" }), miss({ id: "i2", resolution: "inconclusive" })],
      SINCE,
    );
    expect(out).toHaveLength(0);
  });

  test("a miss resolved before the lookback window never fires", () => {
    const out = detectCalibrationMisses([miss({ resolved_at: "2026-06-01T00:00:00.000Z" })], SINCE);
    expect(out).toHaveLength(0);
  });

  test("the calibration rationale becomes the body when recorded", () => {
    const out = detectCalibrationMisses(
      [miss({ evidence: { calibration_rationale: "Complaints fell instead." } })],
      SINCE,
    );
    expect(out[0].body).toBe("Complaints fell instead.");
  });
});

describe("classifyPushCandidates", () => {
  test("orders candidates ground shift, then bet contradiction, then assumption miss", () => {
    const out = classifyPushCandidates({
      decisions: [decision({ prd_id: "prd9" })],
      superseded: new Map([["prd9", "d2"]]),
      decisionTitleById: new Map(),
      bestBet: { id: "opp1", title: "Faster onboarding" },
      learnings: [learning()],
      calibrationRows: [miss()],
      missesSinceIso: SINCE,
    });
    expect(out.map((c) => c.kind)).toEqual([
      "ground_shift",
      "bet_contradiction",
      "assumption_miss",
    ]);
  });

  test("empty inputs classify to nothing", () => {
    const out = classifyPushCandidates({
      decisions: [],
      superseded: new Map(),
      decisionTitleById: new Map(),
      bestBet: null,
      learnings: [],
      calibrationRows: [],
      missesSinceIso: SINCE,
    });
    expect(out).toHaveLength(0);
  });
});

describe("applyPushThrottle", () => {
  const five = ["a", "b", "c", "d", "e"];

  test("the cap is 3 per day", () => {
    expect(DAILY_PUSH_CAP).toBe(3);
  });

  test("with a clean day, the first 3 push and the rest digest", () => {
    const { push, digest } = applyPushThrottle(five, 0);
    expect(push).toEqual(["a", "b", "c"]);
    expect(digest).toEqual(["d", "e"]);
  });

  test("earlier pushes today consume slots", () => {
    const { push, digest } = applyPushThrottle(five, 2);
    expect(push).toEqual(["a"]);
    expect(digest).toEqual(["b", "c", "d", "e"]);
  });

  test("a full day digests everything, nothing is lost", () => {
    const { push, digest } = applyPushThrottle(five, 3);
    expect(push).toEqual([]);
    expect(digest).toEqual(five);
  });

  test("an over-count beyond the cap still digests cleanly", () => {
    const { push, digest } = applyPushThrottle(five, 10);
    expect(push).toEqual([]);
    expect(digest).toEqual(five);
  });

  test("garbage counts are clamped to zero used slots", () => {
    expect(applyPushThrottle(five, -4).push).toEqual(["a", "b", "c"]);
    expect(applyPushThrottle(five, Number.NaN).push).toEqual(["a", "b", "c"]);
  });

  test("a custom cap is respected", () => {
    const { push, digest } = applyPushThrottle(five, 0, 1);
    expect(push).toEqual(["a"]);
    expect(digest).toEqual(["b", "c", "d", "e"]);
  });

  test("fewer candidates than slots all push", () => {
    const { push, digest } = applyPushThrottle(["a"], 0);
    expect(push).toEqual(["a"]);
    expect(digest).toEqual([]);
  });
});
