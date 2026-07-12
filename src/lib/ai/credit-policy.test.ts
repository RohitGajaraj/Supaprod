import { describe, it, expect } from "bun:test";
import {
  isChargeableSurface,
  isAmbientSurface,
  artifactCreditCost,
  isDeliveredStatus,
  isAbandonedStatus,
  ARTIFACT_CREDIT_COST,
  isMoatSurfaceLockedToManaged,
  byokFeeUsd,
  BYOK_FEE_PCT,
  overageCeiling,
  withinBoundedOverage,
} from "./credit-policy";

describe("isChargeableSurface (PR-A2 free-vs-charged map)", () => {
  it("never charges the trust/plumbing surfaces", () => {
    for (const s of ["eval", "judge", "embed", "scheduler", "test"] as const) {
      expect(isChargeableSurface(s)).toBe(false);
    }
  });

  it("charges every other surface, including sense", () => {
    for (const s of [
      "agent",
      "chat",
      "copilot",
      "prd",
      "discovery",
      "studio",
      "brief",
      "sense",
      "decision",
    ] as const) {
      expect(isChargeableSurface(s)).toBe(true);
    }
  });
});

describe("isAmbientSurface (PR-D2 downgrade-to-free)", () => {
  it("is true only for sense", () => {
    expect(isAmbientSurface("sense")).toBe(true);
    expect(isAmbientSurface("chat")).toBe(false);
    expect(isAmbientSurface("agent")).toBe(false);
  });
});

describe("artifactCreditCost (PR-A3 coarse sizing)", () => {
  it("prices every known artifact kind as a positive whole number", () => {
    for (const kind of Object.keys(ARTIFACT_CREDIT_COST) as Array<
      keyof typeof ARTIFACT_CREDIT_COST
    >) {
      const cost = artifactCreditCost(kind);
      expect(Number.isInteger(cost)).toBe(true);
      expect(cost).toBeGreaterThan(0);
    }
  });

  it("a build costs more than a mission (heaviest COGS, pricing-architecture §11a)", () => {
    expect(artifactCreditCost("build")).toBeGreaterThan(artifactCreditCost("mission"));
  });

  it("a mission costs more than an everyday brief", () => {
    expect(artifactCreditCost("mission")).toBeGreaterThan(artifactCreditCost("brief"));
  });
});

describe("isDeliveredStatus / isAbandonedStatus (PR-A1 charge-on-delivery)", () => {
  it("classifies completed statuses as delivered", () => {
    expect(isDeliveredStatus("completed")).toBe(true);
    expect(isDeliveredStatus("completed_with_failures")).toBe(true);
    expect(isDeliveredStatus("shipped")).toBe(true);
  });

  it("classifies halted/failed/stopped statuses as abandoned, never delivered", () => {
    for (const s of ["halted", "failed", "stopped", "cancelled", "canceled"]) {
      expect(isAbandonedStatus(s)).toBe(true);
      expect(isDeliveredStatus(s)).toBe(false);
    }
  });

  it("a status is never both delivered and abandoned", () => {
    const all = ["completed", "completed_with_failures", "shipped", "halted", "failed", "stopped"];
    for (const s of all) {
      expect(isDeliveredStatus(s) && isAbandonedStatus(s)).toBe(false);
    }
  });
});

describe("isMoatSurfaceLockedToManaged (PR-C1 enterprise BYOK moat guard)", () => {
  it("locks judge/eval/decision to managed models by default", () => {
    expect(isMoatSurfaceLockedToManaged("judge")).toBe(true);
    expect(isMoatSurfaceLockedToManaged("eval")).toBe(true);
    expect(isMoatSurfaceLockedToManaged("decision")).toBe(true);
  });

  it("never locks a non-moat surface", () => {
    for (const s of ["agent", "chat", "prd", "sense", "brief"] as const) {
      expect(isMoatSurfaceLockedToManaged(s)).toBe(false);
    }
  });

  it("unlocks a moat surface explicitly on the approved-model list", () => {
    expect(isMoatSurfaceLockedToManaged("judge", new Set(["judge"]))).toBe(false);
    // an approval for one surface does not leak to another
    expect(isMoatSurfaceLockedToManaged("eval", new Set(["judge"]))).toBe(true);
  });
});

describe("byokFeeUsd (PR-C2 the thin platform-fee %)", () => {
  it("is the rated spend times the fee pct", () => {
    expect(byokFeeUsd(2500, 0.15)).toBeCloseTo(375, 5);
  });

  it("uses BYOK_FEE_PCT (15%, inside the founder's 10-20% band) by default", () => {
    expect(BYOK_FEE_PCT).toBeGreaterThanOrEqual(0.1);
    expect(BYOK_FEE_PCT).toBeLessThanOrEqual(0.2);
    expect(byokFeeUsd(100)).toBeCloseTo(100 * BYOK_FEE_PCT, 5);
  });

  it("is 0 for a non-positive or non-finite spend", () => {
    expect(byokFeeUsd(0)).toBe(0);
    expect(byokFeeUsd(-5)).toBe(0);
    expect(byokFeeUsd(Number.NaN)).toBe(0);
  });

  it("never exceeds the rated spend itself for any pct in [0,1]", () => {
    expect(byokFeeUsd(1000, 0.2)).toBeLessThan(1000);
  });
});

describe("overageCeiling / withinBoundedOverage (PR-D2 bounded, opt-in overage)", () => {
  it("is 0 (no overage available) when there is no monthly grant to bound against", () => {
    expect(overageCeiling(0, 1.25)).toBe(0);
    expect(withinBoundedOverage(0, 5, 0, 1.25)).toBe(false);
  });

  it("clamps the multiplier into the 1.0-3.0 Zapier-precedent band", () => {
    expect(overageCeiling(100, 10)).toBe(300); // clamped to 3x
    expect(overageCeiling(100, 0.1)).toBe(100); // clamped to 1x
    expect(overageCeiling(100, Number.NaN)).toBe(125); // falls back to 1.25x
  });

  it("allows a draw that fits inside the bounded ceiling", () => {
    // 100 grant, 1.25x cap = 125 ceiling. Already spent 100 (fully drawn), 20 more fits.
    expect(withinBoundedOverage(100, 20, 100, 1.25)).toBe(true);
  });

  it("refuses a draw that would exceed the bounded ceiling", () => {
    // 100 grant, 1.25x cap = 125 ceiling. Already spent 100, 30 more does not fit.
    expect(withinBoundedOverage(100, 30, 100, 1.25)).toBe(false);
  });

  it("never allows unlimited overage regardless of how small the projected draw is", () => {
    // Even a tiny draw fails once spentSinceGrant already exceeds the ceiling.
    expect(withinBoundedOverage(1000, 1, 100, 1.25)).toBe(false);
  });
});
