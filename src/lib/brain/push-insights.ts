// SEAM-3 (mission 3.9): the Brain pushes, not just stores.
//
// Pure detection + throttle logic for the insight-push channel. No AI, no IO:
// every push candidate is a deterministic read of ground that already shifted,
// so a pushed card is always honest and always checkable. The server pass
// (push-insights.server.ts) feeds these functions real rows and persists the
// results; Today's SW-5 lane reads them back via getPushedInsights.

/** Hard cap: at most this many pushes per workspace per day. The rest digest. */
export const DAILY_PUSH_CAP = 3;

/** Verdicts that read as a negative outcome (mirrors the Brain lenses' NEGATIVE set). */
export const NEGATIVE_VERDICTS = new Set(["missed", "invalidated", "refuted", "loss"]);

export type PushActionKind = "open_decision" | "rerank_bets" | "review_assumption";

export type PushAction = { label: string; kind: PushActionKind; targetId: string };

export type PushKind = "ground_shift" | "bet_contradiction" | "assumption_miss";

export type PushCandidate = {
  kind: PushKind;
  title: string;
  body: string;
  action: PushAction;
  /** Event-scoped (not day-scoped): each real-world event pushes at most once, ever. */
  dedupKey: string;
  /** Higher pushes first when the daily cap forces a cut. */
  priority: number;
  themeId: string | null;
  evidence: Record<string, unknown>;
};

function parseMs(iso: string | null | undefined): number {
  const t = Date.parse(iso ?? "");
  return Number.isFinite(t) ? t : 0;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 3).trimEnd()}...`;
}

// ---------------------------------------------------------------------------
// Detector 1: a supersession flipped ground under a live decision.
// ---------------------------------------------------------------------------

export type LiveDecisionInput = {
  id: string;
  title: string;
  status: string;
  mission_id: string | null;
  prd_id: string | null;
  meeting_id: string | null;
  /** True when the decision's linked PRD already shipped (too late to reopen the call). */
  prdShipped?: boolean;
};

/**
 * PURE. A decision that is still live (pending or approved, not shipped) whose
 * ground (its own id or a source artifact) sits under an active `supersedes`
 * edge is standing on a belief that no longer holds. That is the single
 * highest-signal push: the human thinks the call is settled and it is not.
 */
export function detectGroundShifts(
  decisions: LiveDecisionInput[],
  superseded: Map<string, string>,
  titleById: Map<string, string>,
): PushCandidate[] {
  const out: PushCandidate[] = [];
  for (const d of Array.isArray(decisions) ? decisions : []) {
    if (!d || typeof d.id !== "string" || d.id === "") continue;
    const status = (d.status ?? "").trim().toLowerCase();
    if (status !== "pending" && status !== "approved") continue;
    if (d.prdShipped) continue;
    let found = false;
    let supersedingId: string | null = null;
    for (const id of [d.id, d.mission_id, d.prd_id, d.meeting_id]) {
      if (typeof id === "string" && id !== "" && superseded.has(id)) {
        found = true;
        supersedingId = superseded.get(id) || null;
        break;
      }
    }
    if (!found) continue;
    const byTitle = supersedingId ? titleById.get(supersedingId) : undefined;
    out.push({
      kind: "ground_shift",
      title: `Ground shifted under "${truncate(d.title, 120)}"`,
      body: byTitle
        ? `"${truncate(byTitle, 120)}" superseded what this ${status} call rests on. Reconfirm the decision or revise it.`
        : `A newer decision superseded what this ${status} call rests on. Reconfirm the decision or revise it.`,
      action: { label: "Open the decision", kind: "open_decision", targetId: d.id },
      dedupKey: `ground_shift:${d.id}`,
      priority: 3,
      themeId: null,
      evidence: { decision_id: d.id, decision_status: status, superseded_by: supersedingId },
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Detector 2: a recorded outcome contradicts the currently ranked best bet.
// ---------------------------------------------------------------------------

export type BestBetInput = { id: string; title: string };

export type LearningInput = {
  id: string;
  opportunity_id: string | null;
  verdict: string | null;
  summary: string | null;
  created_at: string;
};

/**
 * PURE. The best bet is rank 1 of the deterministic queue order. A learning
 * with a negative verdict recorded against that same opportunity means reality
 * already voted against the top of the queue. One candidate max, carried by
 * the newest contradicting learning.
 */
export function detectBetContradictions(
  bestBet: BestBetInput | null | undefined,
  learnings: LearningInput[],
): PushCandidate[] {
  if (!bestBet || !bestBet.id) return [];
  const hits = (Array.isArray(learnings) ? learnings : []).filter(
    (l) =>
      l &&
      l.opportunity_id === bestBet.id &&
      NEGATIVE_VERDICTS.has((l.verdict ?? "").trim().toLowerCase()),
  );
  if (hits.length === 0) return [];
  const newest = hits.reduce((a, b) => (parseMs(a.created_at) >= parseMs(b.created_at) ? a : b));
  const verdict = (newest.verdict ?? "").trim().toLowerCase();
  return [
    {
      kind: "bet_contradiction",
      title: `A recorded outcome cuts against your best bet "${truncate(bestBet.title, 100)}"`,
      body: newest.summary
        ? `The outcome came back ${verdict}: ${truncate(newest.summary, 240)}`
        : `A ${verdict} outcome landed against this bet. The current ranking may no longer hold.`,
      action: { label: "Re-rank the queue", kind: "rerank_bets", targetId: bestBet.id },
      dedupKey: `bet_contradiction:${bestBet.id}:${newest.id}`,
      priority: 2,
      themeId: null,
      evidence: { opportunity_id: bestBet.id, learning_id: newest.id, verdict: newest.verdict },
    },
  ];
}

// ---------------------------------------------------------------------------
// Detector 3: a watched (calibrated) assumption resolved as a miss.
// ---------------------------------------------------------------------------

export type CalibrationMissInput = {
  id: string;
  kind: string;
  claim: string | null;
  theme_id: string | null;
  resolution: string | null;
  resolved_at: string | null;
  evidence?: Record<string, unknown> | null;
};

/**
 * PURE. FS-01's calibrate pass scores expired prediction/risk claims. A fresh
 * `miss` means an assumption the workspace was steering by did not hold; that
 * deserves a push, not a buried resolution column.
 */
export function detectCalibrationMisses(
  rows: CalibrationMissInput[],
  sinceIso: string,
): PushCandidate[] {
  const sinceMs = parseMs(sinceIso);
  const out: PushCandidate[] = [];
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || r.resolution !== "miss") continue;
    const resolvedMs = parseMs(r.resolved_at);
    if (resolvedMs === 0 || resolvedMs < sinceMs) continue;
    const claim = (r.claim ?? "").trim();
    const rationale =
      typeof r.evidence?.calibration_rationale === "string"
        ? r.evidence.calibration_rationale.trim()
        : "";
    out.push({
      kind: "assumption_miss",
      title: claim
        ? `A watched assumption missed: ${truncate(claim, 120)}`
        : "A watched assumption missed",
      body:
        rationale ||
        "The claim did not hold when its window closed. Review what was resting on it.",
      action: { label: "Review the assumption", kind: "review_assumption", targetId: r.id },
      dedupKey: `assumption_miss:${r.id}`,
      priority: 1,
      themeId: r.theme_id ?? null,
      evidence: { insight_id: r.id, source_kind: r.kind, claim: claim || null },
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Classification + throttle.
// ---------------------------------------------------------------------------

export type ClassifyInput = {
  decisions: LiveDecisionInput[];
  superseded: Map<string, string>;
  decisionTitleById: Map<string, string>;
  bestBet: BestBetInput | null;
  learnings: LearningInput[];
  calibrationRows: CalibrationMissInput[];
  missesSinceIso: string;
};

/** PURE. Runs the three detectors and orders candidates highest-signal first. */
export function classifyPushCandidates(input: ClassifyInput): PushCandidate[] {
  const all = [
    ...detectGroundShifts(input.decisions, input.superseded, input.decisionTitleById),
    ...detectBetContradictions(input.bestBet, input.learnings),
    ...detectCalibrationMisses(input.calibrationRows, input.missesSinceIso),
  ];
  // Stable sort: same-priority candidates keep detector order.
  return all.sort((a, b) => b.priority - a.priority);
}

/**
 * PURE. The hard throttle: at most `cap` pushes per workspace per day. The
 * first `cap - alreadyPushedToday` candidates push now; every remaining
 * candidate is flagged for the digest instead, never dropped.
 */
export function applyPushThrottle<T>(
  candidates: T[],
  alreadyPushedToday: number,
  cap: number = DAILY_PUSH_CAP,
): { push: T[]; digest: T[] } {
  const used = Number.isFinite(alreadyPushedToday)
    ? Math.max(0, Math.floor(alreadyPushedToday))
    : 0;
  const slots = Math.max(0, cap - used);
  const list = Array.isArray(candidates) ? candidates : [];
  return { push: list.slice(0, slots), digest: list.slice(slots) };
}
