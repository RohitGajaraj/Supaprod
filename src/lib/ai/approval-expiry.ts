/**
 * WHAT AN UNANSWERED CALL DOES WHEN ITS CLOCK RUNS OUT.
 *
 * Measured in production 2026-08-22: 38 approvals pending, every one older than
 * 24 hours, the oldest 696. `approvals-tick` runs every minute and moved none of
 * them. Not because the sweeper was broken — it works, and its precondition
 * discipline is right — but because a queue that only ever GROWS until a person
 * empties it is the workload the doctrine already refused to render: "a long
 * approvals queue is a policy failure to surface, not a workload to render", and
 * "an approval with no expiry is not a question, it is litter."
 *
 * A gate is a QUESTION, and a question with no stated consequence for silence is
 * not answerable by silence — which is the answer people actually give. Over 145
 * decisions a human really made, the median came in at 18 minutes and the 95th
 * percentile at 12.9 hours (rows where `decided_at` precedes `created_at`
 * excluded; 17 seeded rows do that, and including them puts the average at
 * MINUS 58.7 hours, which is why the raw column cannot be averaged).
 *
 * ── THE TWO AXES, AND WHY THEY ARE THE RIGHT ONES ─────────────────────────
 *
 * `tool-consequences.ts` already carries both halves of the only question that
 * matters here: can this be undone, and does it leave the workspace. Nothing new
 * is invented below; this module reads that catalogue and nothing else, so a
 * tool's default can never disagree with the consequence card a person is shown
 * when they open the same call.
 *
 *   reversible AND internal  -> PROCEED. Silence is consent for something that
 *                               can be undone and that nobody outside sees. The
 *                               record says it proceeded unasked.
 *   anything else            -> CANCEL. Silence is refusal for anything
 *                               irreversible, anything that crosses the boundary,
 *                               anything only partly reversible, and anything not
 *                               in the catalogue at all.
 *
 * FAIL CLOSED ON `partial`, and on the uncatalogued. `toolConsequence` answers
 * `partial` for BOTH a tool catalogued as partly reversible and a tool it has
 * never heard of, so `partial` alone cannot tell those apart — `isCataloguedTool`
 * is the membership test that can, and both answers land in the same lane
 * anyway. (It must be `isCataloguedTool` and not `isSideEffectingTool`: the two
 * were one predicate answering two questions until they were split on
 * 2026-08-22, and the surviving `isSideEffectingTool` now means "not a read",
 * which is true of every name this file has never heard of.) Proceeding is the
 * only lane that acts without being asked, so it takes the narrowest possible
 * entry condition.
 *
 * ── THE TWO CLOCKS ─────────────────────────────────────────────────────────
 *
 * Different defaults deserve different deadlines, because the two mistakes are
 * not symmetric. Proceeding early does something undoable; cancelling early
 * throws away work nobody agreed to throw away.
 *
 *   PROCEED_TTL_HOURS = 24. Just under twice the 95th percentile of every human
 *                           decision on record (12.9h) and 80x the median. If a
 *                           reversible internal call has sat for a day, silence
 *                           IS the answer.
 *   CANCEL_TTL_HOURS  = 72. Longer than the slowest decision anyone has ever
 *                           made here (58.99h). Nothing gets thrown away inside
 *                           the window where somebody has historically still
 *                           turned up.
 *
 * Both are declared ON THE ROW when the call is raised, not computed when the
 * sweeper arrives, so a person reading the queue can see the deadline and what
 * happens at it BEFORE it passes. That is also why the answer is stored rather
 * than re-derived: a row raised under today's policy must expire into what it
 * promised, even if this file changes tomorrow.
 */
import { isCataloguedTool, isExternalTool, toolConsequence } from "@/lib/tool-consequences";

/** What happens to a call nobody answered. Stored on the row at raise time. */
export type ExpiryDefault = "proceed" | "cancel";

/** Hours a reversible, internal call waits before it goes ahead on its own. */
export const PROCEED_TTL_HOURS = 24;

/** Hours anything else waits before it is cancelled unrun. */
export const CANCEL_TTL_HOURS = 72;

/**
 * The declared default for a tool, from the consequence catalogue alone.
 *
 * A null/absent tool name is not a tool, so it cannot be shown to be reversible
 * and internal, and lands in the cancelling lane with everything else unknown.
 */
export function expiryDefaultFor(toolName: string | null | undefined): ExpiryDefault {
  if (!isCataloguedTool(toolName)) return "cancel";
  if (isExternalTool(toolName)) return "cancel";
  return toolConsequence(toolName).reversible === "reversible" ? "proceed" : "cancel";
}

export function expiryTtlHours(onExpiry: ExpiryDefault): number {
  return onExpiry === "proceed" ? PROCEED_TTL_HOURS : CANCEL_TTL_HOURS;
}

export interface ExpiryPlan {
  /** What happens if nobody answers. */
  onExpiry: ExpiryDefault;
  ttlHours: number;
  /** ISO deadline, written to `agent_approvals.expires_at` at raise time. */
  expiresAt: string;
}

/** Everything the raise site needs to stamp on a new gate, in one call. */
export function planApprovalExpiry(
  toolName: string | null | undefined,
  nowMs: number = Date.now(),
): ExpiryPlan {
  const onExpiry = expiryDefaultFor(toolName);
  const ttlHours = expiryTtlHours(onExpiry);
  return {
    onExpiry,
    ttlHours,
    expiresAt: new Date(nowMs + ttlHours * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Why this call is in the lane it is in, in the words of the catalogue itself.
 *
 * Written into the record on expiry. It says WHICH property put it there, so a
 * person reading the row afterwards can check the reasoning rather than take the
 * verdict — and so a wrong catalogue entry shows up as a wrong sentence rather
 * than as an unexplained outcome.
 */
export function expiryReason(toolName: string | null | undefined): string {
  if (!isCataloguedTool(toolName)) return "it is not in the consequence catalogue";
  // Irreversibility is named ahead of the boundary where both are true. A merge
  // is both, and "it cannot be undone" is the half that decides it; the boundary
  // is what a person needs told about `calendar.create`, which is undoable and
  // still puts something in front of somebody else.
  const reversible = toolConsequence(toolName).reversible;
  if (reversible === "irreversible") return "it cannot be undone";
  if (isExternalTool(toolName)) return "its effect leaves the workspace";
  if (reversible === "partial") return "it can only partly be undone";
  return "it can be undone and stays inside the workspace";
}

/**
 * Something that stopped a call doing what it declared it would do.
 *
 * There is one today — a sample workspace, where proceeding would spend on a demo
 * fixture — and the shape is here rather than at the caller so the sentence stays
 * one sentence and cannot contradict itself.
 */
export interface ExpiryOverride {
  /** What actually happened, when it differs from the declared default. */
  actual: ExpiryDefault;
  /** Why, as a clause that reads after "but". */
  because: string;
}

/**
 * The sentence the row carries afterwards.
 *
 * States the fact (nobody answered), the DEADLINE that passed, and the property
 * that decided the outcome. The proceed line names the undo, because the whole
 * argument for going ahead unasked is that there is one.
 *
 * THE DEADLINE, NOT THE TTL. An earlier draft said "nobody answered within 24h",
 * which is a restatement rather than a fact and is wrong for every row raised
 * under the flat seven-day clock this replaced — the rows most likely to be the
 * first ones swept. The timestamp is true of any row whatever policy raised it.
 */
export function expiryNote(
  toolName: string | null | undefined,
  declared: ExpiryDefault,
  expiresAt: string | null | undefined,
  override?: ExpiryOverride,
): string {
  const deadline = expiresAt ?? "its deadline";
  const why = expiryReason(toolName);
  const opening =
    (override?.actual ?? declared) === "proceed" ? "Proceeded unasked" : "Cancelled unrun";
  const declaredClause = `this call's declared default is to ${declared} because ${why}`;
  const head = `${opening}: nobody answered by ${deadline}, and ${declaredClause}`;
  if (override) return `${head} — but ${override.because}. Nothing ran.`;
  if (declared === "proceed") return `${head}. To undo: ${toolConsequence(toolName).undo}`;
  return `${head}. Nothing ran.`;
}
