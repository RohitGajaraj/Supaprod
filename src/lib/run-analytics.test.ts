/**
 * INSTRUMENT rollup. The guards here are mostly about HONESTY rather than
 * arithmetic, because every way this can mislead is a way a dashboard lies
 * quietly: a split status vocabulary showing a category nobody can explain, a
 * hardcoded zero dragging a median to nothing, an unmapped agent making the
 * station breakdown disagree with the run count beside it, and a "0 retries"
 * that means "nobody counts retries".
 */
import { expect, test, describe } from "bun:test";
import { rollUpRuns, classifyRunOutcome, type RunRow } from "./run-analytics";

function row(p: Partial<RunRow>): RunRow {
  return {
    agent_slug: "builder",
    status: "completed",
    duration_ms: 1000,
    failure_kind: null,
    halted_reason: null,
    ...p,
  };
}

describe("classifyRunOutcome: two spellings of one state", () => {
  test("'complete' and 'completed' are the same outcome", () => {
    // Written by two different code paths; 2 of 245 real successful runs carry
    // the singular. Any surface grouping on the raw column split them.
    expect(classifyRunOutcome("complete")).toBe("succeeded");
    expect(classifyRunOutcome("completed")).toBe("succeeded");
  });

  test("a halt is abandonment, not failure", () => {
    expect(classifyRunOutcome("halted")).toBe("abandoned");
    expect(classifyRunOutcome("failed")).toBe("failed");
    expect(classifyRunOutcome("completed_with_failures")).toBe("succeeded_with_failures");
  });

  test("an in-flight run is not an outcome at all", () => {
    // Counting these would inflate the denominator with runs that have not
    // finished, quietly depressing every success rate.
    expect(classifyRunOutcome("running")).toBeNull();
    expect(classifyRunOutcome("waiting_approval")).toBeNull();
    expect(classifyRunOutcome(null)).toBeNull();
  });
});

describe("the totals always reconcile", () => {
  test("per-station runs sum to the overall run count", () => {
    const a = rollUpRuns([
      row({ agent_slug: "builder" }),
      row({ agent_slug: "strategist" }),
      row({ agent_slug: "not-a-real-agent" }),
      row({ status: "running" }), // excluded from both sides
    ]);
    const summed = a.byStation.reduce((n, s) => n + s.runs, 0);
    expect(summed).toBe(a.overall.runs);
    expect(a.overall.runs).toBe(3);
  });

  test("an agent that maps to no station is kept, not dropped", () => {
    // Dropping it would make the station breakdown disagree with the run count
    // on the same screen.
    const a = rollUpRuns([row({ agent_slug: "not-a-real-agent" })]);
    expect(a.byStation.map((s) => s.station)).toContain("(unattributed)");
    expect(a.overall.runs).toBe(1);
  });
});

describe("duration: zero is missing, never instantaneous", () => {
  test("a hardcoded zero does not drag the median down", () => {
    // Every run written before 2026-08-10 carries duration_ms = 0. Counting
    // those as real measurements would make the slowest stations look fastest.
    const a = rollUpRuns([
      row({ duration_ms: 0 }),
      row({ duration_ms: 0 }),
      row({ duration_ms: 400 }),
      row({ duration_ms: 600 }),
    ]);
    expect(a.overall.medianDurationMs).toBe(500);
    expect(a.overall.runsMissingDuration).toBe(2);
  });

  test("null durations are counted as missing and reported", () => {
    const a = rollUpRuns([row({ duration_ms: null }), row({ duration_ms: 100 })]);
    expect(a.overall.medianDurationMs).toBe(100);
    expect(a.overall.runsMissingDuration).toBe(1);
  });

  test("no usable duration yields null, not zero", () => {
    // Null renders as "not measured". Zero renders as "instant", which is a
    // claim, and it is the exact claim that hid the original defect.
    const a = rollUpRuns([row({ duration_ms: 0 })]);
    expect(a.overall.medianDurationMs).toBeNull();
  });

  test("the median is a true median, not a mean", () => {
    // One long outlier must not move "how long this usually takes".
    const a = rollUpRuns([
      row({ duration_ms: 100 }),
      row({ duration_ms: 200 }),
      row({ duration_ms: 100000 }),
    ]);
    expect(a.overall.medianDurationMs).toBe(200);
  });
});

describe("outcomes and their reasons", () => {
  test("success rate counts only finished runs", () => {
    const a = rollUpRuns([
      row({ status: "completed" }),
      row({ status: "failed" }),
      row({ status: "running" }),
    ]);
    expect(a.overall.runs).toBe(2);
    expect(a.overall.successRate).toBe(0.5);
  });

  test("failure kinds and halt reasons are ranked", () => {
    const a = rollUpRuns([
      row({ status: "failed", failure_kind: "model_error" }),
      row({ status: "failed", failure_kind: "model_error" }),
      row({ status: "failed", failure_kind: "timeout" }),
      row({ status: "halted", halted_reason: "spend_cap" }),
    ]);
    expect(a.overall.topFailureKinds[0]).toEqual({ kind: "model_error", count: 2 });
    expect(a.overall.haltReasons[0]).toEqual({ reason: "spend_cap", count: 1 });
    expect(a.overall.abandoned).toBe(1);
  });

  test("an empty set produces zeros and nulls, never NaN", () => {
    const a = rollUpRuns([]);
    expect(a.overall.runs).toBe(0);
    expect(a.overall.successRate).toBe(0);
    expect(a.overall.medianDurationMs).toBeNull();
    expect(a.byStation).toEqual([]);
  });
});

describe("retries are declared unmeasured rather than reported as zero", () => {
  test("the flag is always present", () => {
    // Nothing in the schema counts retries: agent_runs has no attempt column
    // and no parent-run reference, so a re-run is indistinguishable from a
    // first attempt. A surface must say "not measured", because a drawn zero
    // reads as "retries do not happen".
    expect(rollUpRuns([]).retriesNotMeasured).toBe(true);
    expect(rollUpRuns([row({})]).retriesNotMeasured).toBe(true);
  });
});
