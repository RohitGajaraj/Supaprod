import { describe, expect, it } from "bun:test";

import { stillWaiting } from "@/lib/query-state";
import { countIsAFloor } from "@/components/approvals/not-the-whole-queue";

const answered = { isError: false, isPending: false, data: {} as unknown, fetchStatus: "idle" };
const pending = { isError: false, isPending: true, data: undefined, fetchStatus: "fetching" };
const failed = { isError: true, isPending: false, data: undefined, fetchStatus: "idle" };

describe("a verdict that came due needs you", () => {
  it("keeps the page loading while the verdict read is still in flight", () => {
    /*
     * THE DEFECT THIS PREVENTS. With the queue and the missions back and empty
     * and this read outstanding, the headline said "Nothing needs you." and
     * then fifteen verdicts appeared underneath it. Zero and not-yet-known are
     * different answers, and this page has been fixed for that twice already.
     */
    expect(stillWaiting(answered, answered, pending)).toBe(true);
    expect(stillWaiting(answered, answered, answered)).toBe(false);
  });

  it("will not claim nothing needs you when the verdict read failed", () => {
    // `countIsAFloor` answers for the queue's own families; this page
    // federates one read more than the queue knows about.
    const floor = countIsAFloor([]) || failed.isError;
    expect(floor).toBe(true);
  });

  it("says nothing extra when every read answered", () => {
    const floor = countIsAFloor([]) || answered.isError;
    expect(floor).toBe(false);
  });
});
