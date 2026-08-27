import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";

/**
 * WHAT THE FIFTY-TWO ACTUALLY ARE, SO A PERSON CAN WORK THEM IN BATCHES.
 *
 * ── THE CAPABILITY THE FOLD WAS ABOUT TO LOSE ──────────────────────────────
 * `/approvals` carries a filter row: five text tabs over `filterBucket`, with a
 * count on each, filtering the queue. SURFACE-MAP marks that route **FOLD →
 * asked in place (R-04)**, and the board it folds into has no filter at all.
 *
 * This lane's rule is that **the fold removes a door, not a capability**. So
 * the filter has to exist here before that route goes, or the fold quietly
 * costs a person the only way they had to triage fifty-two calls.
 *
 * ── WHY THIS IS NOT A THRESHOLD, WHICH IS WHY IT IS BUILDABLE ──────────────
 * I tried first to say the useful thing in a sentence — "26 of these are
 * design gates" — and could not, honestly. It needs a rule for when one kind
 * "dominates", and measured on the live queue the largest is 26 of 52: every
 * natural boundary sits exactly on the knife edge, so the sentence would appear
 * or vanish on a single item. `--mrd-d-alive`'s own comment refuses to invent a
 * number for the same reason.
 *
 * `filterBucket` is not invented. It is a designed vocabulary with a stated
 * taste law behind it — "text tabs, not a facet explosion" — and every item
 * already carries one. Nothing here decides what a bucket is; it counts what
 * the server already assigned.
 *
 * ── EMPTY BUCKETS ARE NOT DRAWN, AND `spend` IS WHY THAT MATTERS ───────────
 * `approvals-queue.functions.ts` says of that bucket: "nothing routes into it
 * yet because no spend-gate READ exists in the codebase today". `/approvals`
 * draws it anyway, which is a permanently empty tab. On the board — denser, and
 * three rows tall — a tab that can never have anything behind it is furniture,
 * and R-20 section 8 says a region either carries a fact the person came for or
 * is removed.
 *
 * ── AND ONE TAB IS NO CHOICE ───────────────────────────────────────────────
 * With every call in one bucket there is nothing to filter, so the row does not
 * draw at all. That is not a threshold: it is the difference between offering a
 * choice and offering the illusion of one.
 */

/** The buckets, in the order `/approvals` names them, so the two agree. */
const ORDER = ["proposals", "gates", "memory", "spend"] as const;

export type QueueBucket = (typeof ORDER)[number];

/** The label each bucket wears, taken from `/approvals` rather than reworded. */
const LABEL: Record<QueueBucket, string> = {
  proposals: "Proposals",
  gates: "Gates",
  memory: "Memory",
  spend: "Spend",
};

export interface BucketTab {
  id: QueueBucket;
  label: string;
  count: number;
}

/**
 * The buckets that actually hold something, largest first is NOT used — the
 * order is the vocabulary's own, so the tabs do not reshuffle under a reader
 * as work arrives.
 */
export function bucketTabs(
  items: readonly ApprovalQueueItem[] | undefined,
  /**
   * THE BUCKET THE PERSON IS CURRENTLY IN, KEPT EVEN AT ZERO.
   *
   * S1 caught this in the first version, which was purely count-driven. Settle
   * the last gate while filtered to Gates and that tab's count reaches zero, so
   * the row deletes the control under the pointer and the list silently widens
   * back to everything. The person did not ask for that and reads it as the
   * page losing their place.
   *
   * A tab is drawn if it HAS something or if it is the one you are standing in.
   */
  active?: QueueBucket | null,
): BucketTab[] {
  const counts = new Map<QueueBucket, number>();
  for (const it of items ?? []) {
    const b = it.filterBucket as QueueBucket;
    if (!ORDER.includes(b)) continue; // a bucket this build does not know about
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  return ORDER.filter((b) => (counts.get(b) ?? 0) > 0 || b === active).map((b) => ({
    id: b,
    label: LABEL[b],
    count: counts.get(b) ?? 0,
  }));
}

/**
 * Whether a filter row is worth drawing at all.
 *
 * One bucket is not a choice, and no bucket means the queue is empty and the
 * lane already says so in its own words.
 */
export function worthFiltering(tabs: readonly BucketTab[]): boolean {
  return tabs.length > 1;
}

/** The items in one bucket, or all of them. */
export function inBucket(
  items: readonly ApprovalQueueItem[] | undefined,
  bucket: QueueBucket | null,
): ApprovalQueueItem[] {
  const all = [...(items ?? [])];
  return bucket === null ? all : all.filter((i) => i.filterBucket === bucket);
}

/**
 * WHAT THE QUEUE SAYS WHEN THE FILTER EXCLUDED EVERYTHING, WHICH IS NOT WHAT AN
 * EMPTY QUEUE SAYS.
 *
 * ── THE DEFECT THIS EXISTS FOR, AND IT WAS MINE ────────────────────────────
 * The board renders its queue behind `focused ? ... : null`, where `focused` is
 * the first visible item. That guard was written when "no visible item" had
 * exactly one cause: nothing is waiting. **Adding a filter gave the same
 * observable condition a second cause, and every guard downstream kept the old
 * meaning.**
 *
 * Shipped behaviour before this: filter to Gates, settle the last gate, and the
 * whole section disappears - the queue, its heading, AND THE TAB ROW ITSELF,
 * because the row was rendered inside the branch its own state can delete. What
 * is left is a region title and a sentence about undo, with 52 calls still
 * waiting and no control on screen to reach them. R-20 section 6: no dead ends.
 *
 * A control must never live inside the branch its own state can delete. The row
 * now draws from the unfiltered `items`, so the way back survives the state
 * that needs it.
 *
 * ── WHY A SENTENCE OF ITS OWN AND NOT THE EMPTY-QUEUE ONE ──────────────────
 * S1 states the rule from `/approvals`, which hit this first: *"Nothing needs
 * you" and "nothing matches Gates" are different facts and the second must not
 * wear the first's clothes.* It is the same rule this repo already enforces
 * between loading, empty and failed, one filter across.
 *
 * So this names the bucket that is empty AND the number that is not, because
 * the second fact is the one the old behaviour destroyed. A person who filtered
 * to Gates and cleared them has not finished their morning, and a screen that
 * implies they have is lying by omission.
 */
export function bucketEmptyLine(bucket: QueueBucket, othersWaiting: number): string {
  const nothingHere = `Nothing in ${LABEL[bucket]} is waiting on you.`;
  // Defensive: the caller only draws this with items outstanding, but a
  // sentence that claims other work exists must never be built from a zero.
  if (othersWaiting <= 0) return nothingHere;
  return othersWaiting === 1
    ? `${nothingHere} 1 other call still is.`
    : `${nothingHere} ${othersWaiting} other calls still are.`;
}
