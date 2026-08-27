import { waitingSince } from "@/components/meridian/stopped-for";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";

/**
 * WHAT AN OLDEST-FIRST QUEUE OWES A CALL THAT CARRIES NO AGE.
 *
 * ── THE PROMISE THE SORT MAKES ─────────────────────────────────────────────
 * Since 2026-08-27 the board sorts its review queue oldest first, and the card
 * that opens is the call that has waited longest. That is a claim about every
 * row: the further down you read, the more recently it arrived.
 *
 * **A row with no timestamp breaks that claim silently.** `waitingSince`
 * returns null for it, the comparator has to put it somewhere, and wherever it
 * goes the reader will interpret its position as an age. Placed last, it reads
 * as the newest thing in the queue. It could be the oldest.
 *
 * S1 sent this from `/approvals`, which met it first and whose `UndatedCalls`
 * header records the two answers that BOTH shipped in this codebase and were
 * both wrong:
 *
 *   passing `Date.now()` for a missing time  -> a call that has waited four days
 *                                               is drawn as one that just arrived
 *   dropping the row                         -> a call that needs a person is
 *                                               silently taken off the only
 *                                               screen that lists them
 *
 * The second is much the worse, and this module takes neither.
 *
 * ── WHY THE BOARD SAYS IT INSTEAD OF SPLITTING THE LIST ────────────────────
 * `/approvals` draws undated calls as their own quiet list, which is right for
 * that page: its rows are a read-only overflow beneath a single focused gate,
 * so moving one costs it nothing.
 *
 * **On the board it would cost the verbs.** `DecisionQueue` holds approve,
 * decline, snooze, send back, the a/d/z keys, selection and bulk, and `focused`
 * resolves through `visibleItems`. Lift a row out of that array and its Open
 * control sets `focusedId` to an id the lookup cannot find, so it falls through
 * to `visibleItems[0]` and OPENS A DIFFERENT CALL - a wrong verdict on the
 * wrong item, from a control that looked like it worked. Taking a capability
 * away to make a layout match is the trade this lane exists to refuse.
 *
 * So the rows stay in the queue with every verb intact, and the surface states
 * the one thing the order cannot: that its meaning stops at the bottom. The
 * FACT survives the fold, which is what the rule asks. The layout is allowed to
 * differ where the two surfaces genuinely differ.
 *
 * ── IT DRAWS NOTHING TODAY, AND THAT IS NOT A REASON TO SKIP IT ────────────
 * Every gate family the queue federates carries a timestamp. Measured on the
 * rendered board 2026-08-27, signed in: all 52 calls printed an age, reading
 * 49d, 42d, 41d, 41d, 41d, 37d, 33d, 33d, 33d, 33d, 27d down the page. So this
 * returns null and costs the surface nothing.
 *
 * A sort is exactly where an unexpected null stops being harmless. Handling it
 * costs one function; not handling it costs a person the wrong call.
 */

/** How many of these the order cannot place. */
export function undatedCount(items: readonly ApprovalQueueItem[] | undefined): number {
  return (items ?? []).filter((i) => waitingSince(i.timestamp) === null).length;
}

/**
 * The sentence, or null when every call carries an age.
 *
 * IT CORRECTS THE MISREADING RATHER THAN ONLY REPORTING THE GAP. "3 calls carry
 * no start time" tells a reader a fact about our data; it does not tell them
 * that the three at the bottom are not the newest three, which is the thing
 * they are about to get wrong.
 */
export function undatedNote(items: readonly ApprovalQueueItem[] | undefined): string | null {
  const n = undatedCount(items);
  if (n === 0) return null;
  return n === 1
    ? "One call carries no start time. It sits last because the order cannot place it, not because it is newest."
    : `${n} calls carry no start time. They sit last because the order cannot place them, not because they are newest.`;
}
