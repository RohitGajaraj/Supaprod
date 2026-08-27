import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

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

const SRC = readFileSync("src/routes/_authenticated.today.tsx", "utf8");
/**
 * The headline builder, extracted from the route on 2026-08-27 so its wording
 * could be RENDERED and asserted rather than grepped. A source assertion cannot
 * tell "At least 52" from "At least52", and that wording had no other way to be
 * checked: this workspace's largest family holds 10 calls against a limit of
 * 100, so the capped path never fires here, and patching the gap into the
 * response failed because the server function's body is TSS-framed.
 * `state-sentence.test.tsx` asserts the rendered text; these two are the cheap
 * structural half.
 */
const SENTENCE = readFileSync("src/components/today/state-sentence.tsx", "utf8");

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

describe("the board", () => {
  it("A PARTIAL READ IS NOT A QUIET MORNING", () => {
    // The whole point: `isError` is false in this case, so the existing guards
    // are blind to it.
    const at = SRC.indexOf("const quietMorning =");
    expect(at).toBeGreaterThan(-1);
    expect(SRC.slice(at, at + 1400)).toContain("!queueIsPartial &&");
  });

  it("calls the count a floor rather than hiding it", () => {
    // Weaker than hiding on purpose: the number is still the most useful thing
    // on screen, and only its exactness was never earned.
    expect(SENTENCE).toContain('{n.partial ? "At least " : null}');
  });

  it("REFUSES 'Nothing is ready' ON A ZERO IT CANNOT TRUST", () => {
    expect(SENTENCE).toContain(
      '"Some of your queue did not load, so this cannot say what is waiting."',
    );
  });

  it("draws the reason with the shared sentence, not a second wording", () => {
    // Three surfaces show this queue. Two spellings of one caveat is how a
    // person gets two answers about one queue.
    expect(SRC).toContain("notTheWholeQueue(incomplete)");
    expect(SRC).toContain('from "@/components/approvals/not-the-whole-queue"');
  });

  it("announces it, because the list empties under the reader", () => {
    const at = SRC.indexOf("{notTheWholeQueue(incomplete)}");
    expect(SRC.slice(Math.max(0, at - 400), at)).toContain('role="status"');
  });
});
