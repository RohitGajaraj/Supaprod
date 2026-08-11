/**
 * RPT-32: log the human at every gate.
 *
 * Every time a human decides on an agent's draft, that decision is the
 * flywheel's highest-signal data, and it is free: the diff between what the
 * agent proposed and what the human approved is exactly the correction signal
 * that should feed the ranking. `agent_approvals` already stores the raw
 * approve/reject status; this module turns any gate decision into a normalized
 * `human_gate_events` row and rolls a set of those rows up into a per-agent
 * correction rate.
 *
 * Pure and dependency-free: the same builder and summarizer drive the server
 * capture, the read surface, and the unit tests, so what is stored, shown, and
 * tested can never diverge.
 */

/** What the human did at the gate. */
export type GateType = "approval" | "rejection" | "edit" | "override";

/** A clean approval means the agent was right as drafted; everything else is
 *  the human having to intervene, which is the correction signal. */
export const CORRECTION_GATE_TYPES: ReadonlySet<GateType> = new Set<GateType>([
  "rejection",
  "edit",
  "override",
]);

export type HumanGateEventInput = {
  gateType: GateType;
  /** What the gate was about: "tool_call" | "spec" | "decision" | "contract_clause" | ... */
  subjectType: string;
  subjectRef?: string | null;
  /** Which agent produced the draft the human judged (attribution). */
  agentSlug?: string | null;
  /** Which tool/action, when applicable. */
  toolName?: string | null;
  /** Resolved verdict, e.g. "approved" | "rejected" | "edited" | "overridden". */
  verdict?: string | null;
  /** Short human-readable summary of what the human changed. */
  diffSummary?: string | null;
  /** Which workspace the gate belongs to. REQUIRED, because every reader of
   *  `human_gate_events` scopes by workspace_id and self-improve's
   *  `readAgentSignals` scopes by it with no fallback - a row written without
   *  one is stored, counted in no rate, and read by nobody. Still nullable, and
   *  the null must be passed on purpose: `trust_graduation_proposals` predates
   *  workspace tenancy and has no workspace to name (GATE_SOURCE
   *  .trust_graduation.hasWorkspace === false), so null is a real answer there
   *  rather than a forgotten one. */
  workspaceId: string | null;
};

/** The insert shape for the `human_gate_events` table (snake_case columns). */
export type HumanGateEventRow = {
  user_id: string;
  workspace_id: string | null;
  gate_type: GateType;
  subject_type: string;
  subject_ref: string | null;
  agent_slug: string | null;
  tool_name: string | null;
  verdict: string | null;
  diff_summary: string | null;
};

const DIFF_SUMMARY_MAX = 2000;
const SUBJECT_TYPE_MAX = 60;

function clampOrNull(v: string | null | undefined, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t.slice(0, max);
}

/**
 * Normalize a gate decision into a `human_gate_events` insert row. Pure; never
 * throws. Callers pass the acting user id; an unknown gate_type falls back to
 * "override" (a human intervention we could not classify is still a correction,
 * never silently a clean approval).
 */
export function buildGateEventRow(userId: string, input: HumanGateEventInput): HumanGateEventRow {
  const gateType: GateType = isGateType(input.gateType) ? input.gateType : "override";
  return {
    user_id: userId,
    workspace_id: input.workspaceId ?? null,
    gate_type: gateType,
    subject_type: clampOrNull(input.subjectType, SUBJECT_TYPE_MAX) ?? "unknown",
    subject_ref: clampOrNull(input.subjectRef, 200),
    agent_slug: clampOrNull(input.agentSlug, 100),
    tool_name: clampOrNull(input.toolName, 100),
    verdict: clampOrNull(input.verdict, 60),
    diff_summary: clampOrNull(input.diffSummary, DIFF_SUMMARY_MAX),
  };
}

function isGateType(v: unknown): v is GateType {
  return v === "approval" || v === "rejection" || v === "edit" || v === "override";
}

/** Per-agent (or overall) rollup: how often the human had to correct the agent. */
export type GateSignalStats = {
  approved: number;
  /** rejection + edit + override */
  corrected: number;
  total: number;
  /** corrected / total, 0 when total is 0. Lower is a more trustworthy agent. */
  correctionRate: number;
};

type GateRowLike = {
  gate_type?: string | null;
  agent_slug?: string | null;
};

function emptyStats(): GateSignalStats {
  return { approved: 0, corrected: 0, total: 0, correctionRate: 0 };
}

function withRate(s: GateSignalStats): GateSignalStats {
  return { ...s, correctionRate: s.total === 0 ? 0 : s.corrected / s.total };
}

/**
 * Roll gate events up into a per-agent correction picture plus an overall one.
 * A row whose gate_type is not recognized is ignored (it cannot be scored),
 * never miscounted as a clean approval. Rows with no agent_slug roll into the
 * "(unattributed)" bucket so the overall total always reconciles.
 */
export function summarizeGateSignals(rows: readonly GateRowLike[]): {
  perAgent: Record<string, GateSignalStats>;
  overall: GateSignalStats;
} {
  const perAgent: Record<string, GateSignalStats> = {};
  let overall = emptyStats();

  for (const r of rows) {
    if (!isGateType(r.gate_type)) continue;
    const isCorrection = CORRECTION_GATE_TYPES.has(r.gate_type);
    const key = clampOrNull(r.agent_slug, 100) ?? "(unattributed)";
    const cur = perAgent[key] ?? emptyStats();
    cur.total += 1;
    overall.total += 1;
    if (isCorrection) {
      cur.corrected += 1;
      overall.corrected += 1;
    } else {
      cur.approved += 1;
      overall.approved += 1;
    }
    perAgent[key] = cur;
  }

  for (const key of Object.keys(perAgent)) perAgent[key] = withRate(perAgent[key]);
  overall = withRate(overall);
  return { perAgent, overall };
}
