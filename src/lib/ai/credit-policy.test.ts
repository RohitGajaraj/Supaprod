import { describe, it, expect } from "bun:test";
import {
  isChargeableSurface,
  isAmbientSurface,
  artifactCreditCost,
  isDeliveredStatus,
  isAbandonedStatus,
  ARTIFACT_CREDIT_COST,
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
