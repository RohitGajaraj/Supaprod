/**
 * P-32 pass 4 (A-QUEUE.md). A1's pass-3 verdict: "the timing marks A3 added
 * are not visible in the browser (no `console` lines, no `performance`
 * marks or measures)" -- true, and structurally so, since
 * `withStartReaderTiming` (`track.functions.ts`) wraps a SERVER handler.
 * `measuredQueryFn` is the client-side fix: a named `performance.mark`/
 * `measure` pair around the actual browser round trip, readable in the
 * Performance panel by the same name every reader is named by elsewhere in
 * this packet's own Reports.
 */
import { describe, test, expect, afterEach } from "bun:test";
import { measuredQueryFn } from "../_authenticated.start";

afterEach(() => {
  performance.clearMarks();
  performance.clearMeasures();
});

describe("measuredQueryFn", () => {
  test("leaves a named measure entry a browser's Performance panel can read", async () => {
    const fn = measuredQueryFn("listRunsForStart", async () => "the answer");
    const result = await fn();
    expect(result).toBe("the answer");

    const measures = performance.getEntriesByName("start:listRunsForStart");
    expect(measures.length).toBe(1);
    expect(measures[0]!.entryType).toBe("measure");
  });

  test("marks the reader by its own name, not a generic one -- readers stay tellable apart", async () => {
    await measuredQueryFn("listRunsForStart", async () => null)();
    await measuredQueryFn("listTopOpportunities", async () => null)();

    expect(performance.getEntriesByName("start:listRunsForStart").length).toBe(1);
    expect(performance.getEntriesByName("start:listTopOpportunities").length).toBe(1);
  });

  test("still leaves the measure when the reader throws, so a failed round trip is not the one that goes unmeasured", async () => {
    const failing = measuredQueryFn("listRunsForStart", async () => {
      throw new Error("boom");
    });
    await expect(failing()).rejects.toThrow("boom");
    expect(performance.getEntriesByName("start:listRunsForStart").length).toBe(1);
  });

  test("returns whatever the wrapped reader resolves, unchanged", async () => {
    const payload = { runs: [{ id: "t-1" }] };
    const fn = measuredQueryFn("listRunsForStart", async () => payload);
    expect(await fn()).toBe(payload);
  });
});
