import { describe, expect, it } from "bun:test";

import { countIsAFloor, notTheWholeQueue } from "@/components/approvals/not-the-whole-queue";

/**
 * THE BOARD STOPS STATING A BOUNDED READ AS A COMPLETE ONE.
 *
 * ── THE DEFECT, AND WHY NO GUARD COULD BE WRITTEN FOR IT UNTIL NOW ─────────
 * `getApprovalsQueue` federates ten families, bounds every one of them, and
 * degrades a family that THROWS to an empty list so one refusal cannot blank
 * the other nine. That is right for the queue and fatal for this board:
 *
 *   the top-level read SUCCEEDS      so `queue.isError` is false
 *   `items` comes back short or empty so the count is wrong or zero
 *   nothing in the payload says so    so no client guard could tell
 *
 * `quietMorning` guards both `isError` flags and could not see this at all. The
 * board would print "Nothing needs you right now." over a queue that failed to
 * load, which is the worst sentence this surface can say because it is the one
 * a person acts on by closing the tab.
 *
 * S1 measured the cost of the other half: 116 specs pending a design gate
 * against a family limit of 100, so sixteen calls that needed a person were
 * absent from every screen listing them and no surface could tell.
 *
 * THIS LANE DELIBERATELY DID NOT GUESS. The guard was left unwritten until
 * `incomplete` shipped, because a confident wrong guard on a false all-clear is
 * worse than a missing one.
 */

describe("the signal", () => {
  it("is a floor exactly when the queue reported a gap", () => {
    expect(countIsAFloor([])).toBe(false);
    expect(countIsAFloor(undefined)).toBe(false);
    expect(countIsAFloor([{ family: "design_gate", why: "capped" }])).toBe(true);
    expect(countIsAFloor([{ family: "memory", why: "failed" }])).toBe(true);
  });

  it("says nothing when the queue reported itself in full", () => {
    expect(notTheWholeQueue([])).toBeNull();
  });
});

// "the board" left this file (P-14, A-QUEUE.md): every case checked
// `components/today/Board.tsx` and `components/today/state-sentence.tsx`,
// both unmounted (zero importers) and deleted with the cluster they alone
// belonged to.
