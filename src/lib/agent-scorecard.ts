/**
 * RPT-37: the cross-vendor agent scorecard, pure core.
 *
 * "The agent org chart, with receipts." Where TrustDial shows one agent-level
 * approve/outcome number, the scorecard adds the two dimensions operators
 * hand-build a tier list from: per TASK TYPE (agent_approvals.tool_name, the
 * established (agent, tool) key) and REVERT rate as its own honest metric.
 *
 * Revert rate is newly honest: agent-track-record.ts long said "rollbacks are
 * not tracked, so we deliberately do NOT claim 0 rollbacks", but RPT-04's rewind
 * path now writes a real signal (a status:'rejected' agent_approvals row keyed
 * by tool_name:'artifact.rewind'). This is the follow-on that comment
 * anticipated: reverts are counted from that signal, and kept OUT of the
 * approve-rate tally (a human undoing shipped work is a different judgment from
 * rejecting a proposed action), so a task type's approve rate is not polluted by
 * rewinds.
 *
 * PURE: it reuses summarizeAgentRecords / summarizeAgentOutcomes wholesale (same
 * decided-judgment rules, so the scorecard can never disagree with TrustDial on
 * a shared number) and takes rows the server layer already fetched + joined. No
 * db, no catalog: the panel resolves display names from the catalog exactly as
 * AgentRosterPanel/TrustDial already do. "native vs BYO per agent" is NOT
 * computed here: ai_events.via records it at the call level but has no agent_slug
 * join, so there is no honest wiring for it yet (a follow-on schema task).
 */
import {
  summarizeAgentOutcomes,
  summarizeAgentRecords,
  type AgentOutcomeRecord,
  type AgentTrackRecord,
  type DecidedLearningRow,
} from "@/lib/agent-track-record";

/** The tool_name RPT-04's rewind path writes; its rows are reverts, not gate rejections. */
export const REVERT_TOOL = "artifact.rewind";

/** A per-task-type row needs at least this many decided judgments to show (no single-datapoint tiers). */
export const MIN_TOOL_SAMPLES = 2;

export type ToolRecord = { tool_name: string; approved: number; total: number };

export type AgentScorecard = {
  slug: string;
  /** Agent-level approve record over NON-revert decisions (approved / approved+rejected). */
  approve: AgentTrackRecord;
  /** Recorded outcome quality (validated / validated+missed), joined from learnings via decisions. */
  outcome: AgentOutcomeRecord;
  /** How many times a human rewound this agent's shipped work (RPT-04 signal). */
  reverts: number;
  /** Per task type, non-revert, at least MIN_TOOL_SAMPLES decided, most-active first. */
  byTool: ToolRecord[];
};

export type ScorecardApprovalRow = {
  agent_slug: string | null;
  tool_name: string | null;
  status: string | null;
};

/** Stable, deterministic group: preserves first-seen order of keys. */
function groupBy<T>(rows: T[], key: (r: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    const bucket = out.get(k);
    if (bucket) bucket.push(r);
    else out.set(k, [r]);
  }
  return out;
}

/**
 * PURE. Build one scorecard per agent that has any decided signal (an approval,
 * an outcome, or a revert). Reuses the shared summarizers so every number
 * matches the rest of the trust surface.
 */
export function computeAgentScorecard(
  approvalRows: ScorecardApprovalRow[] | null | undefined,
  learningRows: DecidedLearningRow[] | null | undefined,
): AgentScorecard[] {
  const rows = Array.isArray(approvalRows) ? approvalRows : [];
  const revertRows = rows.filter((r) => (r.tool_name ?? "").trim() === REVERT_TOOL);
  const gateRows = rows.filter((r) => (r.tool_name ?? "").trim() !== REVERT_TOOL);

  // Agent-level approve, reverts, and outcomes: each is the same summarizer over a
  // different slice, so the decided-judgment rules are applied once, consistently.
  const approveBySlug = summarizeAgentRecords(gateRows);
  const revertBySlug = summarizeAgentRecords(revertRows); // rewinds are all 'rejected' -> total = revert count
  const outcomeBySlug = summarizeAgentOutcomes(learningRows);

  // Per (agent, tool): run the summarizer per tool bucket, then invert to per-agent.
  const toolsByAgent = new Map<string, ToolRecord[]>();
  for (const [tool, toolRows] of groupBy(gateRows, (r) => (r.tool_name ?? "").trim())) {
    if (!tool) continue;
    for (const [slug, rec] of summarizeAgentRecords(toolRows)) {
      if (rec.total < MIN_TOOL_SAMPLES) continue;
      const list = toolsByAgent.get(slug) ?? [];
      list.push({ tool_name: tool, approved: rec.approved, total: rec.total });
      toolsByAgent.set(slug, list);
    }
  }

  const slugs = new Set<string>([
    ...approveBySlug.keys(),
    ...revertBySlug.keys(),
    ...outcomeBySlug.keys(),
  ]);

  const cards: AgentScorecard[] = [];
  for (const slug of slugs) {
    const approve = approveBySlug.get(slug) ?? { approved: 0, total: 0 };
    const outcome = outcomeBySlug.get(slug) ?? { validated: 0, total: 0 };
    const reverts = revertBySlug.get(slug)?.total ?? 0;
    const byTool = (toolsByAgent.get(slug) ?? []).sort((a, b) => b.total - a.total);
    cards.push({ slug, approve, outcome, reverts, byTool });
  }

  // Most-active first: total decided activity across all three signals.
  cards.sort(
    (a, b) =>
      b.approve.total +
      b.outcome.total +
      b.reverts -
      (a.approve.total + a.outcome.total + a.reverts),
  );
  return cards;
}

/** PURE. Acceptance rate as a 0..1 fraction, or null when there is no decided history. */
export function acceptanceRate(rec: AgentTrackRecord | null | undefined): number | null {
  if (!rec || rec.total <= 0) return null;
  return rec.approved / rec.total;
}

/** PURE. Outcome hit rate as a 0..1 fraction, or null when there is no recorded outcome. */
export function outcomeHitRate(rec: AgentOutcomeRecord | null | undefined): number | null {
  if (!rec || rec.total <= 0) return null;
  return rec.validated / rec.total;
}
