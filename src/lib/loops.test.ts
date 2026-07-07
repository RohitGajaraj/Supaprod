// SW-4 / mission 3.10 LOOP MODE: the pure seam, no DB.
import { describe, expect, test } from "bun:test";
import { CADENCE_MS, LOOP_KINDS, isLoopKind, nextRunAt } from "./loops.shared";

describe("nextRunAt", () => {
  const from = new Date("2026-07-08T00:00:00.000Z");

  test("hourly advances one hour", () => {
    expect(nextRunAt("hourly", from)).toBe("2026-07-08T01:00:00.000Z");
  });

  test("daily advances one day", () => {
    expect(nextRunAt("daily", from)).toBe("2026-07-09T00:00:00.000Z");
  });

  test("weekly advances seven days", () => {
    expect(nextRunAt("weekly", from)).toBe("2026-07-15T00:00:00.000Z");
  });

  test("an unknown cadence falls back to daily so a bad row can never hot-loop the tick", () => {
    expect(nextRunAt("every-minute", from)).toBe("2026-07-09T00:00:00.000Z");
  });
});

describe("LOOP_KINDS registry", () => {
  test("every kind carries a label, a description, and a valid default cadence", () => {
    for (const [kind, spec] of Object.entries(LOOP_KINDS)) {
      expect(isLoopKind(kind)).toBe(true);
      expect(spec.label.length).toBeGreaterThan(2);
      expect(spec.description.length).toBeGreaterThan(10);
      expect(Object.keys(CADENCE_MS)).toContain(spec.defaultCadence);
    }
  });

  test("the three promoted crons are exactly the registry", () => {
    expect(Object.keys(LOOP_KINDS).sort()).toEqual([
      "competitor_sweep",
      "outcome_review",
      "signal_recluster",
    ]);
  });

  test("isLoopKind rejects arbitrary strings", () => {
    expect(isLoopKind("rm_rf_production")).toBe(false);
    expect(isLoopKind("")).toBe(false);
  });
});
