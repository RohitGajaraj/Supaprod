import { describe, expect, it } from "bun:test";

import { countIsAFloor, notTheWholeQueue } from "@/components/approvals/not-the-whole-queue";
import { FAMILY_LIMIT, type QueueGap } from "@/lib/approvals-queue.functions";

const CAPPED: QueueGap[] = [{ family: "design gates", why: "capped" }];
const FAILED: QueueGap[] = [{ family: "specs in review", why: "failed" }];

describe("a bounded read is not a count", () => {
  it("is silent on a queue that reported itself in full", () => {
    expect(notTheWholeQueue([])).toBeNull();
    expect(notTheWholeQueue(undefined)).toBeNull();
    expect(countIsAFloor([])).toBe(false);
  });

  it("makes the count a floor the moment anything is missing", () => {
    expect(countIsAFloor(CAPPED)).toBe(true);
    expect(countIsAFloor(FAILED)).toBe(true);
  });

  it("tells a capped queue and a broken one apart, because the advice differs", () => {
    /*
     * A ceiling means more of the same is waiting and settling these reveals
     * it. A failure means something is broken and coming back is the honest
     * advice. One sentence for both would be useless for either.
     */
    expect(notTheWholeQueue(CAPPED)).toContain("Settling these makes room");
    expect(notTheWholeQueue(FAILED)).toContain("did not load");
    expect(notTheWholeQueue(FAILED)).not.toContain("Settling these makes room");
  });

  it("says both when both happened", () => {
    const line = notTheWholeQueue([...CAPPED, ...FAILED]);
    expect(line).toContain("More calls are waiting");
    expect(line).toContain("did not load");
  });

  it("never names the family, because the name is for a log", () => {
    /*
     * "critic'd opportunities" and "memory graduation" are right in a console
     * and wrong in front of a person, and naming one invites the reader to
     * work out which of their calls is missing. That is a puzzle, not an
     * answer.
     */
    for (const gaps of [CAPPED, FAILED, [...CAPPED, ...FAILED]]) {
      const line = notTheWholeQueue(gaps) ?? "";
      expect(line).not.toContain("design gates");
      expect(line).not.toContain("specs in review");
      expect(line).not.toContain("critic'd");
    }
  });

  it("keeps the limit a shared constant rather than a literal in six places", () => {
    // The number has to be comparable against a result length to know whether
    // it bit; a literal repeated seven times is a rule nobody can enforce.
    expect(FAMILY_LIMIT).toBe(100);
  });
});
