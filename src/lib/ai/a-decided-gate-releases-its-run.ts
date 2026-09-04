/**
 * A DECIDED GATE RELEASES ITS RUN, AND ONE RULE SAYS WHEN.
 *
 * ── WHAT 06:01 UTC ON 2026-09-04 LOOKED LIKE ─────────────────────────────
 * Fourteen runs sat at `waiting_approval`. Thirteen had no pending approval at
 * all: their gates had been cancelled, expired, failed, and in one case
 * APPROVED AND EXECUTED two days earlier. The tool ran, the change landed, and
 * the run that asked for it never heard.
 *
 * ── WHY A CALL AT EVERY OUTCOME IS THE WRONG FIX ─────────────────────────
 * An approval reaches a terminal state in at least four places -- the decision
 * path, the executor, the expiry tick, and cancellation -- and `driver.server`
 * has already paid for the lesson that patching writers one at a time is a
 * losing game: *"There are seven writers downstream of this point and patching
 * them in the order a live run happens to reach them is a losing game -- the
 * eighth is written by somebody who never reads this comment."*
 *
 * So the rule is DERIVED FROM THE STATE, not fired by an event. "Is this run
 * still waiting on somebody" is a question about the approvals that exist right
 * now, and any number of writers can change them without knowing this file
 * exists. The predicate lives here, one copy, and both readers call it: the
 * decision path releases immediately because a person is watching, and the
 * resume sweep releases everything else because it asks the same question on a
 * timer.
 */

/**
 * The approval states that still hold a run at its gate.
 *
 * `pending` is undecided. `approved` is decided but NOT yet run -- the tool
 * fires in `executeApproval`, which flips the row to `executed` or `failed`, so
 * a run released at `approved` would resume alongside its own tool.
 *
 * Everything else -- executed, failed, expired, cancelled, denied -- is over.
 * The run may not like the answer; it is still entitled to hear one.
 */
export const GATE_STILL_HOLDS: ReadonlySet<string> = new Set(["pending", "approved"]);

/** Does any of these approvals still hold the run at its gate? */
export function stillHeldByAGate(
  approvalStatuses: readonly (string | null | undefined)[],
): boolean {
  return approvalStatuses.some((s) => GATE_STILL_HOLDS.has((s ?? "").trim()));
}

/**
 * May this run be let go of its gate?
 *
 * `known: false` when the approvals could not be read, and then the answer is
 * NO. A failed read is not evidence that nothing is pending, and releasing a
 * run on one would resume it into a tool call a person has not answered -- the
 * one mistake in this file that spends someone else's money.
 */
export function gateHasBeenAnswered(input: {
  runStatus: string | null | undefined;
  approvalStatuses: readonly (string | null | undefined)[];
  known: boolean;
}): boolean {
  if (!input.known) return false;
  if ((input.runStatus ?? "") !== "waiting_approval") return false;
  return !stillHeldByAGate(input.approvalStatuses);
}
