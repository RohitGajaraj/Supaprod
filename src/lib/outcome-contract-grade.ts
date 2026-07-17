/**
 * RPT-23: Outcome Contract verifiability grade (the creation-time gate).
 *
 * Receipts are to decision work what the test suite is to code. An Outcome
 * Contract whose success metrics can never be checked on outcome day is a
 * decision with no test: it looks committed but nothing will ever confirm it
 * was right. This module reads the verifiability signal the contract already
 * carries (each success-metric clause's `oracle_kind`, set by the CNV-02
 * oracle compiler) and turns it into one verdict, so the approve step can
 * refuse to sign off a spec that is hazy by construction.
 *
 * Pure and dependency-free on purpose: the same grade drives the server gate
 * in `savePrd`, the owner-facing verdict in `OutcomeContractPanel`, and its
 * own unit tests, with no divergence between what is shown and what is
 * enforced.
 *
 * Oracle model (from `ContractClause.oracle_kind`):
 *   - "eval" | "ci"    -> machine-checkable (Supaprod grades it / CI gates it)
 *   - "uat"            -> human-verifiable (a real checklist item)
 *   - "unverifiable"   -> a watched assumption; not falsifiable as written
 *   - null             -> not yet compiled to an oracle (verifiability unknown)
 * A clause counts as verifiable when its oracle is eval, ci, or uat.
 */
import type { OutcomeContract, ContractClause } from "@/lib/discovery.functions";

/**
 * - "verifiable": every standing success metric has a real oracle (eval/ci/uat).
 * - "partial":    at least one metric is verifiable, but others are still
 *                 uncompiled or filed as watched assumptions.
 * - "hazy":       the contract has success metrics but NONE are verifiable yet
 *                 (all uncompiled and/or unfalsifiable). This is the blocking
 *                 state: there is nothing to check on outcome day.
 * - "empty":      the contract has no standing success metric at all.
 */
export type ContractVerdict = "verifiable" | "partial" | "hazy" | "empty";

export type ContractGrade = {
  verdict: ContractVerdict;
  /** Standing success metrics considered (superseded clauses are ignored). */
  total: number;
  /** eval | ci: Supaprod or CI can grade this without a human. */
  machine: number;
  /** uat: a human ticks it off on a real checklist. */
  human: number;
  /** oracle_kind null: not yet compiled; verifiability is unknown. */
  pending: number;
  /** unverifiable: filed as a watched assumption; not falsifiable as written. */
  unfalsifiable: number;
  /** machine + human: metrics that can actually be checked on outcome day. */
  verifiable: number;
  /** At least one machine-checkable metric (the "machine-checkable eval twin"). */
  machineCheckable: boolean;
  /**
   * True when approving this contract should be refused: it has metrics but
   * none can be verified, so signing off asserts an outcome nothing will test.
   */
  blocksApproval: boolean;
  /** The standing metrics that are not yet verifiable, for the owner to fix. */
  unverifiableClauses: Array<{ id: string; text: string; pending: boolean }>;
  /** One plain-language line: what the verdict means and what to do. */
  reason: string;
};

type SuccessMetricSource =
  | Pick<OutcomeContract, "success_metrics">
  | { success_metrics?: ContractClause[] | null }
  | null
  | undefined;

function standingSuccessMetrics(contract: SuccessMetricSource): ContractClause[] {
  const metrics = contract?.success_metrics;
  if (!Array.isArray(metrics)) return [];
  return metrics.filter((c) => c && c.status === "standing");
}

/**
 * Grade the verifiability of a contract's success metrics. Never throws; a
 * null/empty contract grades as "empty" (non-blocking) so callers can treat a
 * spec that was never structured the same as one with no metrics.
 */
export function gradeOutcomeContract(contract: SuccessMetricSource): ContractGrade {
  const standing = standingSuccessMetrics(contract);
  const total = standing.length;

  let machine = 0;
  let human = 0;
  let pending = 0;
  let unfalsifiable = 0;
  const unverifiableClauses: Array<{ id: string; text: string; pending: boolean }> = [];

  for (const c of standing) {
    switch (c.oracle_kind) {
      case "eval":
      case "ci":
        machine += 1;
        break;
      case "uat":
        human += 1;
        break;
      case "unverifiable":
        unfalsifiable += 1;
        unverifiableClauses.push({ id: c.id, text: c.text, pending: false });
        break;
      default:
        // null / anything unrecognized: not yet compiled to an oracle.
        pending += 1;
        unverifiableClauses.push({ id: c.id, text: c.text, pending: true });
        break;
    }
  }

  const verifiable = machine + human;
  const machineCheckable = machine > 0;

  let verdict: ContractVerdict;
  if (total === 0) verdict = "empty";
  else if (verifiable === 0) verdict = "hazy";
  else if (verifiable === total) verdict = "verifiable";
  else verdict = "partial";

  // Block approval ONLY for a contract we can PROVE will never be checkable:
  // every standing metric is explicitly `unverifiable` (a watched assumption,
  // not falsifiable as written). A gate must refuse what it can prove is bad,
  // never what it merely has not confirmed is good, so an uncompiled ("pending",
  // oracle_kind null) metric does NOT block: oracle compilation is a separate,
  // best-effort step (auto at creation + the manual "Compile oracles" button),
  // and a not-yet-compiled metric may well be checkable. Blocking on pending
  // would freeze a freshly created spec before its background compile lands and
  // would regress every pre-existing spec whose metrics were never compiled.
  // "empty" (no metric) is a weak signal, not a broken one, so it does not block.
  const blocksApproval = total > 0 && unfalsifiable === total;

  return {
    verdict,
    total,
    machine,
    human,
    pending,
    unfalsifiable,
    verifiable,
    machineCheckable,
    blocksApproval,
    unverifiableClauses,
    reason: reasonFor({
      verdict,
      total,
      verifiable,
      pending,
      unfalsifiable,
      machineCheckable,
      blocksApproval,
    }),
  };
}

function reasonFor(g: {
  verdict: ContractVerdict;
  total: number;
  verifiable: number;
  pending: number;
  unfalsifiable: number;
  machineCheckable: boolean;
  blocksApproval: boolean;
}): string {
  switch (g.verdict) {
    case "empty":
      return "No success metric to check. Add at least one so this decision can be verified on outcome day.";
    case "hazy": {
      if (g.blocksApproval) {
        // Every standing metric is a proven watched assumption: nothing to check.
        return "Every success metric is a watched assumption, not falsifiable as written. Add at least one metric that an eval, CI, or UAT oracle can check before approving.";
      }
      const bits: string[] = [];
      if (g.pending > 0) bits.push(`${g.pending} not yet compiled to an oracle`);
      if (g.unfalsifiable > 0) bits.push(`${g.unfalsifiable} filed as a watched assumption`);
      const detail = bits.length > 0 ? ` (${bits.join(", ")})` : "";
      return `No success metric has a verifiable oracle yet${detail}. Compile the oracles or add a checkable metric so this can be verified on outcome day.`;
    }
    case "partial":
      return `${g.verifiable} of ${g.total} success metrics are verifiable. The rest are still open, but this can be checked on outcome day.`;
    case "verifiable":
      return g.machineCheckable
        ? "Every success metric has an oracle. Supaprod can verify this on outcome day."
        : "Every success metric is on a checklist to verify on outcome day.";
  }
}

/** A short chip label for the verdict (for compact UI). */
export function verifiabilityLabel(grade: ContractGrade): string {
  switch (grade.verdict) {
    case "verifiable":
      return grade.machineCheckable ? "Machine-checkable" : "Human-verified";
    case "partial":
      return "Partly verifiable";
    case "hazy":
      return "Verification hazy";
    case "empty":
      return "No metric to verify";
  }
}
