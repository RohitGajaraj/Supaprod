/**
 * THE DECISIONS A LEARNING MAY BE GRADING, which is all of them.
 *
 * ── WHAT WAS ON SCREEN ────────────────────────────────────────────────────
 * `LearningCard` finds the call its verdict grades by exact id, and that much
 * was already right and already hard-won -- its own header records that
 * matching "the first decision on the decide stop" once put a verdict beside
 * the wrong forecast. What was never widened is the LIST it searches. The pane
 * handed it only the decide stop's decisions, so a decision recorded at any
 * other station was invisible.
 *
 * Measured on `d1168015`, the only track in this database that has walked all
 * seven stations: its learning carries `decision_id = 663c7376`, that decision
 * is a member of the track, it holds a real forecast -- "The PRD will be
 * approved and design gate cleared within 3 business days" -- and it is filed
 * at the SHIP stop. The lookup came back empty, so the Learn tab read:
 *
 *     ACTUALLY
 *     Nothing was recorded as expected, so there is nothing to check against.
 *     WHAT WE NOW BELIEVE
 *     ... confirming failure to meet the spec's success metric.   [Did not hold]
 *
 * Two sentences on one screen, and the first was false. A forecast written at
 * decision time is the artifact this product claims nothing else has, and on
 * the single run that reached Learn it was being denied.
 *
 * ── WHY WIDENING IS SAFE, which is the whole argument ─────────────────────
 * The match downstream is an exact id. A larger haystack finds the same needle
 * or none at all; it cannot find a different one. Narrowing by station was
 * never a correctness measure, only an assumption about where decisions live,
 * and `spine_track_members` disproves it.
 */

/** The shape this needs from a stop, kept minimal so the pane's types can move. */
export type StopWithItems<T> = { items: readonly T[] };

/**
 * Every decision filed anywhere on the track, in stop order, minus the ones
 * whose row could not be read.
 *
 * `missing` means the lookup ran and the row was not there. Passing one on
 * would let a card render a forecast it never actually read.
 */
export function decisionsForGrading<T extends { kind: string; missing?: boolean }>(
  stops: readonly StopWithItems<T>[] | undefined,
): T[] {
  if (!stops) return [];
  return stops.flatMap((s) => s.items).filter((it) => it.kind === "decision" && !it.missing);
}
