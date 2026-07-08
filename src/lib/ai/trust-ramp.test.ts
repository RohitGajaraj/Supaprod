// SW-4 / mission 3.10: the trust ramp's pure seam. The DONE-WHEN oracle
// ("a proposal appears after the Nth clean approval and takes effect only on
// acceptance") hinges on this math being exact: streaks count consecutive
// EXECUTED rows newest-first, reset on rejected/failed, ignore neutral
// statuses, and graduations never cross the high-risk ceilings.
import { describe, expect, it } from "bun:test";
import {
  TRUST_RAMP_CLEAN_N,
  computeCleanStreaks,
  nextRampMode,
  shouldProposeGraduation,
  HIGH_RISK_FORCE_REVIEW,
  HIGH_RISK_MIN_CONFIRM,
} from "./trust-ramp";

const at = (i: number) => new Date(Date.UTC(2026, 6, 1, 12, i)).toISOString();
const row = (tool: string, status: string, i: number) => ({
  tool_name: tool,
  status,
  decided_at: at(i),
});

describe("computeCleanStreaks", () => {
  it("counts consecutive executed rows newest-first", () => {
    const rows = [row("t", "executed", 3), row("t", "executed", 2), row("t", "executed", 1)];
    expect(computeCleanStreaks(rows).get("t")).toBe(3);
  });

  it("stops at the first rejected, regardless of older clean rows", () => {
    const rows = [
      row("t", "executed", 5),
      row("t", "executed", 4),
      row("t", "rejected", 3),
      row("t", "executed", 2),
      row("t", "executed", 1),
    ];
    expect(computeCleanStreaks(rows).get("t")).toBe(2);
  });

  it("a failed execution also breaks the streak", () => {
    const rows = [row("t", "executed", 3), row("t", "failed", 2), row("t", "executed", 1)];
    expect(computeCleanStreaks(rows).get("t")).toBe(1);
  });

  it("neutral statuses (approved, cancelled, expired) neither count nor break", () => {
    const rows = [
      row("t", "executed", 5),
      row("t", "approved", 4),
      row("t", "cancelled", 3),
      row("t", "expired", 2),
      row("t", "executed", 1),
    ];
    expect(computeCleanStreaks(rows).get("t")).toBe(2);
  });

  it("tracks tools independently and accepts unsorted input", () => {
    const rows = [
      row("a", "executed", 1),
      row("b", "rejected", 4),
      row("a", "executed", 3),
      row("b", "executed", 2),
    ];
    const streaks = computeCleanStreaks(rows);
    expect(streaks.get("a")).toBe(2);
    expect(streaks.get("b")).toBe(0); // newest b row is the rejection
  });

  it("skips rows with a null decided_at", () => {
    const rows = [
      { tool_name: "t", status: "executed", decided_at: null },
      row("t", "executed", 1),
    ];
    expect(computeCleanStreaks(rows).get("t")).toBe(1);
  });
});

describe("nextRampMode", () => {
  it("walks the ladder review -> confirm -> auto -> (end)", () => {
    expect(nextRampMode("review", "some.tool")).toBe("confirm");
    expect(nextRampMode("confirm", "some.tool")).toBe("auto");
    expect(nextRampMode("auto", "some.tool")).toBeNull();
  });

  it("force-review tools never graduate", () => {
    for (const tool of HIGH_RISK_FORCE_REVIEW) {
      expect(nextRampMode("review", tool)).toBeNull();
    }
  });

  it("min-confirm tools graduate to confirm but never to auto", () => {
    for (const tool of HIGH_RISK_MIN_CONFIRM) {
      expect(nextRampMode("review", tool)).toBe("confirm");
      expect(nextRampMode("confirm", tool)).toBeNull();
    }
  });
});

describe("shouldProposeGraduation", () => {
  const base = {
    toolName: "signals.search",
    streak: TRUST_RAMP_CLEAN_N,
    currentMode: "review" as const,
    hasPendingProposal: false,
    outcomeBlocked: false,
  };

  it("proposes exactly at the Nth clean approval, not before", () => {
    expect(shouldProposeGraduation({ ...base, streak: TRUST_RAMP_CLEAN_N - 1 })).toBeNull();
    expect(shouldProposeGraduation(base)).toEqual({ from: "review", to: "confirm" });
  });

  it("a pending proposal suppresses a duplicate", () => {
    expect(shouldProposeGraduation({ ...base, hasPendingProposal: true })).toBeNull();
  });

  it("the RF-06 missed-outcome guard blocks the ramp entirely", () => {
    expect(shouldProposeGraduation({ ...base, outcomeBlocked: true })).toBeNull();
  });

  it("a tool already at auto has nowhere to go", () => {
    expect(shouldProposeGraduation({ ...base, currentMode: "auto" })).toBeNull();
  });

  it("never proposes past a high-risk ceiling", () => {
    expect(shouldProposeGraduation({ ...base, toolName: "studio.pr.merge" })).toBeNull();
    // The remaining min-confirm ceiling (founder ruling 2026-07-08 moved the
    // build-lane mechanics out of it; calendar.create still stops at confirm).
    expect(
      shouldProposeGraduation({ ...base, toolName: "calendar.create", currentMode: "confirm" }),
    ).toBeNull();
  });

  it("build-lane mechanics graduate to auto (founder ruling 2026-07-08)", () => {
    expect(
      shouldProposeGraduation({ ...base, toolName: "studio.commit", currentMode: "confirm" }),
    ).toEqual({ from: "confirm", to: "auto" });
  });
});
