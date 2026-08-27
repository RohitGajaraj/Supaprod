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

describe("the verdict read is paged and the count says so", () => {
  const floorOf = (shown: number, total: number, isError = false) =>
    countIsAFloor([]) || isError || total > shown;

  it("makes the count a floor when more are due than the page carries", () => {
    /*
     * `DUE_FORECAST_PAGE` is 12 and there are 15 forecasts past their horizon
     * right now, so `due.length` understates by three TODAY. This is RUN-99
     * wearing a different hat: a bounded read stated as a total, on the surface
     * whose whole job is telling a person what needs them.
     */
    expect(floorOf(12, 15)).toBe(true);
  });

  it("leaves the count exact when the page holds everything", () => {
    expect(floorOf(4, 4)).toBe(false);
    expect(floorOf(0, 0)).toBe(false);
  });

  it("treats a failed verdict read as a floor as well", () => {
    // F-120 made that read throw so `isError` can be told from "nothing due".
    expect(floorOf(0, 0, true)).toBe(true);
  });

  it("never reads a full page as capped when the total agrees", () => {
    // Exactly-on-the-page is only capped if the population says so, unlike the
    // queue's families where the length IS the only signal available.
    expect(floorOf(12, 12)).toBe(false);
  });
});
