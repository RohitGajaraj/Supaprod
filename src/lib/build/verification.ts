/**
 * RPT-26: verified-completion receipts, the three-state honesty layer for
 * every "done" claim a Build row makes. Distinct axis from `studioVerdict`
 * (build-status.ts, the ship/kill outcome): this answers "do we have real
 * evidence behind the claim", never the outcome itself, so it stays additive
 * alongside the existing SHIP/KILL verdict chip rather than replacing it.
 *
 * Pure + unit-testable, mirrors the rest of `src/lib/build/*.ts` (design-gate,
 * repo-gate, ard-block): no I/O, no fabrication. The only evidence this layer
 * knows about today is the changeset ladder (`studio_changesets.status` +
 * `pr_url`, see `StudioSessionListItem` in `studio.functions.ts`): a merged
 * changeset with a real PR url is a genuine trace link an operator can click
 * and verify; anything short of that is not proof yet, no matter what the
 * mission's own status string claims. When uncertain, this never returns
 * "verified". It funnels to "needs-verification" (evidence pipeline exists,
 * just hasn't landed) or "cannot-do-yet" (no evidence artifact exists at all
 * for this row, so there is structurally nothing to check yet).
 */

export type CompletionEvidence = "verified" | "needs-verification" | "cannot-do-yet";

export interface CompletionClaimInput {
  /** True only when this row's own status bucket already reads "done" (see
   * `studioToMissionRowStatus`): a queued/working/gate/blocked row is not
   * claiming completion yet, so it earns no evidence badge at all. */
  claimsDone: boolean;
  /** 'mission' rows (an orchestrator goal-run, `StudioSessionListItem.kind`)
   * have no changeset/PR concept to check at all, a structurally different
   * "cannot verify" than a build session whose changeset just hasn't landed. */
  kind: "build" | "mission";
  changesetStatus: "staged" | "committed" | "pr_open" | "merged" | "abandoned" | null;
  prUrl: string | null;
}

/** Returns `null` when the row isn't making a completion claim at all, so
 * there is nothing to attach a receipt to yet. */
export function completionEvidence(input: CompletionClaimInput): CompletionEvidence | null {
  if (!input.claimsDone) return null;
  // No changeset ever surfaced for this mission (an orchestrator run, or a
  // build session that completed without ever staging one): there is no
  // artifact to check, not merely one that hasn't landed.
  if (input.kind === "mission" || !input.changesetStatus) return "cannot-do-yet";
  // Only a merged changeset backed by a real, clickable PR url counts as
  // verified. Never fabricate "verified" from a merged status with no url.
  if (input.changesetStatus === "merged" && input.prUrl) return "verified";
  return "needs-verification";
}

export const COMPLETION_EVIDENCE_LABEL: Record<CompletionEvidence, string> = {
  verified: "Verified",
  "needs-verification": "Needs verification",
  "cannot-do-yet": "No evidence yet",
};

/** Plain-language reason shown as the badge's tooltip (title attr): the
 * receipt's why, not just its one-word state. */
export const COMPLETION_EVIDENCE_REASON: Record<CompletionEvidence, string> = {
  verified: "A merged pull request backs this claim. Opens it.",
  "needs-verification": "This claims done, but no merged pull request backs it up yet.",
  "cannot-do-yet":
    "No changeset was ever produced for this run, so there is nothing to verify yet.",
};

/** Role-color law (DESIGN-LOOM): moss is confirmed good, ember means it needs
 * a human to look, faint is a quiet limitation (not an alarm, not a call to
 * action). */
export const COMPLETION_EVIDENCE_TONE: Record<CompletionEvidence, "moss" | "ember" | "faint"> = {
  verified: "moss",
  "needs-verification": "ember",
  "cannot-do-yet": "faint",
};
