/**
 * RPT-50 (deterministic slice): the self-improvement PROPOSAL COMPOSER.
 *
 * Supaprod-on-Supaprod: read Supaprod's OWN quality signals and turn them into
 * concrete, plain-language improvement proposals the workspace can review. This
 * module is the PURE core: it takes already-summarized signals (eval pass rates,
 * per-agent human-correction rates, per-playbook win rates) and emits a stable,
 * fully deterministic set of flags with a reason and the evidence behind each.
 *
 * NO AI here, and none anywhere in this slice. Every proposal is a rule firing on
 * a real number over a real sample size. The AI-composed variant is a separate,
 * founder-gated increment; this one never guesses and never fabricates.
 *
 * PURE: no db, no network, no imports. The server adapter feeds live signals in.
 */

/** A suite's eval health, already summarized (pass rate over a run sample). */
export type EvalSignal = {
  suite_id: string;
  name: string;
  /** Cases passed / cases run, 0..1. */
  pass_rate: number;
  /** Sample size (completed runs the pass rate was pooled over). */
  total: number;
};

/** One agent's human-correction picture (from the RPT-32 gate signals). */
export type AgentSignal = {
  agent_slug: string;
  /** Corrected / total gate decisions, 0..1. Higher means humans keep fixing it. */
  correction_rate: number;
  /** Sample size (gate decisions on this agent's drafts). */
  total: number;
};

/** One playbook's per-outcome track record in this workspace. */
export type PlaybookSignal = {
  playbook_key: string;
  station: string;
  /** Validated / decisive runs, 0..1. Lower means the method keeps losing. */
  win_rate: number;
  /** Sample size (recorded applications of the playbook). */
  runs: number;
};

export type SelfImprovementSignals = {
  evals: EvalSignal[];
  agents: AgentSignal[];
  playbooks: PlaybookSignal[];
};

export type ProposalKind = "eval" | "agent" | "playbook";
export type ProposalSeverity = "high" | "medium" | "low";

export type SelfImprovementProposal = {
  /** Deterministic slug: `<kind>:<subject>`, stable across recomputes. */
  id: string;
  kind: ProposalKind;
  severity: ProposalSeverity;
  title: string;
  detail: string;
  evidence: string;
  subject_ref: string | null;
};

// --- Thresholds (named so they are one place to tune, and greppable) ---

/** Eval: never flag a suite until it has run at least this many times. */
export const EVAL_MIN_TOTAL = 3;
/** Eval: below this pooled pass rate the suite counts as failing. */
export const EVAL_PASS_RATE_FLOOR = 0.6;
/** Eval: at or under this pass rate the failure is high severity. */
export const EVAL_HIGH_PASS_RATE = 0.3;
/** Eval: at or under this pass rate it is medium; above (but still failing) is low. */
export const EVAL_MEDIUM_PASS_RATE = 0.45;

/** Agent: never flag an agent until it has this many gate decisions. */
export const AGENT_MIN_TOTAL = 5;
/** Agent: above this human-correction rate the agent counts as over-corrected. */
export const AGENT_CORRECTION_CEIL = 0.5;
/** Agent: at or over this correction rate it is high severity. */
export const AGENT_HIGH_CORRECTION = 0.75;
/** Agent: at or over this it is medium; above the ceiling (but under this) is low. */
export const AGENT_MEDIUM_CORRECTION = 0.6;

/** Playbook: never flag a method until it has this many recorded runs. */
export const PLAYBOOK_MIN_RUNS = 3;
/** Playbook: below this win rate the method counts as losing. */
export const PLAYBOOK_WIN_RATE_FLOOR = 0.5;
/** Playbook: at or under this win rate it is high severity. */
export const PLAYBOOK_HIGH_WIN_RATE = 0.2;
/** Playbook: at or under this it is medium; below the floor (but above this) is low. */
export const PLAYBOOK_MEDIUM_WIN_RATE = 0.35;

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function pct(rate: number): number {
  return Math.round(rate * 100);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function severityRank(s: ProposalSeverity): number {
  return s === "high" ? 0 : s === "medium" ? 1 : 2;
}

/** Every proposal carries the sample size it fired on, so the sort can put the
 *  best-evidenced flags first without leaking that number into the public type. */
type ScoredProposal = { proposal: SelfImprovementProposal; sample: number };

function evalProposal(e: EvalSignal): ScoredProposal | null {
  if (!isFiniteNumber(e.total) || e.total < EVAL_MIN_TOTAL) return null;
  if (!isFiniteNumber(e.pass_rate) || e.pass_rate >= EVAL_PASS_RATE_FLOOR) return null;
  const severity: ProposalSeverity =
    e.pass_rate <= EVAL_HIGH_PASS_RATE
      ? "high"
      : e.pass_rate <= EVAL_MEDIUM_PASS_RATE
        ? "medium"
        : "low";
  const pass = pct(e.pass_rate);
  return {
    proposal: {
      id: `eval:${e.suite_id}`,
      kind: "eval",
      severity,
      title: `Eval suite ${e.name} is failing (${pass}% of ${e.total})`,
      detail: `Only ${pass}% of cases pass across ${e.total} runs. Fix the surface it checks or tighten the suite before you trust its verdicts.`,
      evidence: `pass_rate=${round2(e.pass_rate)}, runs=${e.total}`,
      subject_ref: e.suite_id,
    },
    sample: e.total,
  };
}

function agentProposal(a: AgentSignal): ScoredProposal | null {
  if (!isFiniteNumber(a.total) || a.total < AGENT_MIN_TOTAL) return null;
  if (!isFiniteNumber(a.correction_rate) || a.correction_rate <= AGENT_CORRECTION_CEIL) return null;
  const severity: ProposalSeverity =
    a.correction_rate >= AGENT_HIGH_CORRECTION
      ? "high"
      : a.correction_rate >= AGENT_MEDIUM_CORRECTION
        ? "medium"
        : "low";
  const rate = pct(a.correction_rate);
  return {
    proposal: {
      id: `agent:${a.agent_slug}`,
      kind: "agent",
      severity,
      title: `Agent ${a.agent_slug} is corrected by humans ${rate}% of the time`,
      detail: `Across ${a.total} gate decisions, people changed or rejected this agent's draft ${rate}% of the time. Review its prompt, its tools, or the gate it runs behind.`,
      evidence: `correction_rate=${round2(a.correction_rate)}, decisions=${a.total}`,
      subject_ref: a.agent_slug,
    },
    sample: a.total,
  };
}

function playbookProposal(p: PlaybookSignal): ScoredProposal | null {
  if (!isFiniteNumber(p.runs) || p.runs < PLAYBOOK_MIN_RUNS) return null;
  if (!isFiniteNumber(p.win_rate) || p.win_rate >= PLAYBOOK_WIN_RATE_FLOOR) return null;
  const severity: ProposalSeverity =
    p.win_rate <= PLAYBOOK_HIGH_WIN_RATE
      ? "high"
      : p.win_rate <= PLAYBOOK_MEDIUM_WIN_RATE
        ? "medium"
        : "low";
  const rate = pct(p.win_rate);
  return {
    proposal: {
      id: `playbook:${p.playbook_key}`,
      kind: "playbook",
      severity,
      title: `Playbook ${p.playbook_key} at ${p.station} wins ${rate}% of the time`,
      detail: `Of ${p.runs} recorded runs, this method validated only ${rate}% of the time at the ${p.station} station. Try a different method there, or revisit how this one is applied.`,
      evidence: `win_rate=${round2(p.win_rate)}, runs=${p.runs}`,
      subject_ref: p.playbook_key,
    },
    sample: p.runs,
  };
}

/**
 * PURE and fully deterministic. Compose improvement proposals from the three
 * signal families. A signal under its sample-size threshold is skipped silently
 * (never flagged on thin data). Proposals sort by severity (high first), then by
 * sample size (more data first), then by id (a stable tie-break so the same
 * input always yields the same order). Same input in, same output out.
 */
export function composeProposals(signals: SelfImprovementSignals): SelfImprovementProposal[] {
  const scored: ScoredProposal[] = [];

  for (const e of signals?.evals ?? []) {
    const s = evalProposal(e);
    if (s) scored.push(s);
  }
  for (const a of signals?.agents ?? []) {
    const s = agentProposal(a);
    if (s) scored.push(s);
  }
  for (const p of signals?.playbooks ?? []) {
    const s = playbookProposal(p);
    if (s) scored.push(s);
  }

  scored.sort((a, b) => {
    const bySeverity = severityRank(a.proposal.severity) - severityRank(b.proposal.severity);
    if (bySeverity !== 0) return bySeverity;
    if (b.sample !== a.sample) return b.sample - a.sample;
    return a.proposal.id.localeCompare(b.proposal.id);
  });

  return scored.map((s) => s.proposal);
}
