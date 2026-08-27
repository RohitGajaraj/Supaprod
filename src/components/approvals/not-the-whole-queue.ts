/**
 * WHEN THE QUEUE KNOWS IT IS NOT SHOWING YOU EVERYTHING.
 *
 * -- THE DEFECT ------------------------------------------------------------
 * `getApprovalsQueue` federates ten families and bounds every one of them at
 * `FAMILY_LIMIT`. That bound is correct: one enormous family must not flood a
 * queue somebody has to walk. What was not correct is that three surfaces then
 * turned a bounded read into an exact count and put it in the largest type on
 * the screen.
 *
 * Measured 2026-08-27: 116 specs carry `design_gate_status = 'pending'` in
 * workspaces with the design stage on, against a limit of 100. Sixteen calls
 * that need a person were not on the only screens that list them, every count
 * derived from that read was short by sixteen, and no surface could tell.
 *
 * The handler's own comment had already named the missing half: "TELLING THE
 * USER is the other half and is NOT done here: it needs a field on
 * ApprovalsQueueResult plus rendering... which spans files this pass does not
 * own." This is that field being rendered. The sibling case it was written for,
 * a family whose read FAILED and degraded to an empty list so one refusal could
 * not blank the other nine, has the same shape and the same answer.
 *
 * -- IT IS ONE MODULE BECAUSE IT IS ONE SENTENCE ---------------------------
 * `/approvals` and the inbox both state a count. Two spellings of one caveat is
 * how a person gets two answers about the same queue, so the wording lives
 * here and both call it.
 *
 * -- WHY IT DOES NOT NAME THE FAMILY ---------------------------------------
 * The gaps carry internal names: "critic'd opportunities", "memory
 * graduation". They are right for a log and wrong for a person, and naming a
 * family invites the reader to work out which of their calls is missing, which
 * is a puzzle rather than an answer. What a reader can act on is that the
 * number is a floor and the queue is worth opening again.
 */

import type { QueueGap } from "@/lib/approvals-queue.functions";

/**
 * Whether a count drawn from this queue is a floor rather than a total.
 *
 * Callers put "At least" in front of the number. That is deliberately weaker
 * than hiding the number: the count is still the most useful thing on the
 * screen, and it is only its exactness that was never earned.
 */
export function countIsAFloor(incomplete: readonly QueueGap[] | null | undefined): boolean {
  return Boolean(incomplete && incomplete.length > 0);
}

/**
 * The line to add under a queue that could not report itself in full, or null
 * when it could.
 *
 * The two causes are kept apart because they tell a person different things
 * about what to do. A family that hit its ceiling means there is more of the
 * same waiting and settling these will reveal it. A family that failed to load
 * means something is broken and coming back later is the honest advice.
 */
export function notTheWholeQueue(
  incomplete: readonly QueueGap[] | null | undefined,
): string | null {
  if (!incomplete || incomplete.length === 0) return null;

  const capped = incomplete.some((g) => g.why === "capped");
  const failed = incomplete.some((g) => g.why === "failed");

  if (capped && failed) {
    return "More calls are waiting than this lists, and part of your queue did not load at all. Settle these and reopen, and if the count still looks short, the failure is on our side.";
  }
  if (capped) {
    return "More calls are waiting than this lists. Settling these makes room for the rest.";
  }
  return "Part of your queue did not load, so this is not everything waiting on you.";
}
