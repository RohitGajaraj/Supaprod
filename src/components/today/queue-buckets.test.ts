import { describe, expect, it } from "bun:test";

import { bucketTabs, inBucket, worthFiltering } from "./queue-buckets";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";

/**
 * THE FILTER THE FOLD WAS ABOUT TO COST A PERSON.
 *
 * `/approvals` carries five text tabs over `filterBucket` with a count on each.
 * SURFACE-MAP marks that route FOLD, and the board it folds into has no filter,
 * so a person would lose the only way they had to triage fifty-two calls.
 * Measured on the live queue: 26 design gates, 6 assumption challenges, 4 tool
 * gates, 3 challenged opportunities, 3 memory candidates.
 */

const item = (bucket: string, id = Math.random().toString()) =>
  ({ id, filterBucket: bucket }) as unknown as ApprovalQueueItem;

describe("bucketTabs", () => {
  it("counts what the SERVER already assigned rather than deciding anything", () => {
    const tabs = bucketTabs([item("gates"), item("gates"), item("proposals")]);
    expect(tabs.map((t) => [t.id, t.count])).toEqual([
      ["proposals", 1],
      ["gates", 2],
    ]);
  });

  it("DOES NOT DRAW AN EMPTY BUCKET, which is why `spend` matters", () => {
    // The queue function says of that bucket: "nothing routes into it yet
    // because no spend-gate READ exists in the codebase today". /approvals
    // draws it anyway, a permanently empty tab. On a three-row board that is
    // furniture.
    const tabs = bucketTabs([item("gates"), item("memory")]);
    expect(tabs.map((t) => t.id)).not.toContain("spend");
  });

  it("keeps the vocabulary's own order, so tabs do not reshuffle as work arrives", () => {
    const tabs = bucketTabs([item("memory"), item("gates"), item("proposals")]);
    expect(tabs.map((t) => t.id)).toEqual(["proposals", "gates", "memory"]);
  });

  it("uses /approvals' labels rather than rewording them", () => {
    expect(bucketTabs([item("proposals")])[0]!.label).toBe("Proposals");
  });

  it("ignores a bucket this build does not know about instead of crashing", () => {
    expect(bucketTabs([item("something-new"), item("gates")]).map((t) => t.id)).toEqual(["gates"]);
  });

  it("survives a read that has not answered", () => {
    expect(bucketTabs(undefined)).toEqual([]);
  });
});

describe("worthFiltering", () => {
  it("ONE BUCKET IS NOT A CHOICE, so the row does not draw", () => {
    expect(worthFiltering(bucketTabs([item("gates"), item("gates")]))).toBe(false);
  });

  it("draws once there is genuinely something to choose between", () => {
    expect(worthFiltering(bucketTabs([item("gates"), item("proposals")]))).toBe(true);
  });

  it("draws nothing for an empty queue, which the lane already explains", () => {
    expect(worthFiltering(bucketTabs([]))).toBe(false);
  });
});

describe("inBucket", () => {
  it("returns everything when no bucket is chosen", () => {
    const all = [item("gates"), item("memory")];
    expect(inBucket(all, null)).toHaveLength(2);
  });

  it("narrows to one bucket", () => {
    const all = [item("gates"), item("memory"), item("gates")];
    expect(inBucket(all, "gates")).toHaveLength(2);
  });

  it("never mutates what it was given", () => {
    const all = [item("gates"), item("memory")];
    inBucket(all, "gates");
    expect(all).toHaveLength(2);
  });
});
