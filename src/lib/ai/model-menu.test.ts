import { describe, it, expect } from "bun:test";
import {
  MODEL_MENU,
  modelMenuOption,
  modelMenuAvailable,
  resolveModelMenuChoice,
  planAllowsModelMenu,
} from "./model-menu";
import { activeModelId } from "./models";

describe("MODEL_MENU (PR-B2 Balanced/Deep/Fast)", () => {
  it("has exactly the three named classes", () => {
    expect(MODEL_MENU.map((m) => m.id).sort()).toEqual(["balanced", "deep", "fast"]);
  });

  it("deep burns credits faster than balanced, which burns faster than fast", () => {
    const fast = modelMenuOption("fast");
    const balanced = modelMenuOption("balanced");
    const deep = modelMenuOption("deep");
    expect(fast.creditBurnRate).toBeLessThan(balanced.creditBurnRate);
    expect(balanced.creditBurnRate).toBeLessThan(deep.creditBurnRate);
  });

  it("falls back to balanced for an unknown class", () => {
    // @ts-expect-error deliberately invalid input
    expect(modelMenuOption("nonsense").id).toBe("balanced");
  });
});

describe("modelMenuAvailable / planAllowsModelMenu (Pro+ gate)", () => {
  it("is unavailable on free", () => {
    expect(modelMenuAvailable("free")).toBe(false);
    expect(planAllowsModelMenu("free")).toBe(false);
  });

  it("is available on every paid tier", () => {
    for (const tier of ["pro", "max", "team", "enterprise"] as const) {
      expect(modelMenuAvailable(tier)).toBe(true);
    }
  });
});

describe("resolveModelMenuChoice", () => {
  it("returns null on free regardless of choice (no dial for free)", () => {
    expect(resolveModelMenuChoice("free", "deep")).toBeNull();
  });

  it("returns null when no choice is set (auto-routing stays in control)", () => {
    expect(resolveModelMenuChoice("pro", null)).toBeNull();
    expect(resolveModelMenuChoice("pro", undefined)).toBeNull();
  });

  it("resolves a valid choice to its model id on a paid tier", () => {
    expect(resolveModelMenuChoice("pro", "fast")).toBe(modelMenuOption("fast").modelId);
  });

  it("follows the catalog when a class points at a model the provider retired", () => {
    // "Deep" still names google/gemini-2.5-pro, retired by Google 2026-07-30 and
    // marked deprecated in the catalog. The dial is a promise about effort, not
    // about a vendor id, so it must resolve to the live replacement rather than
    // hand the chokepoint a 404. Asserted against activeModelId, not a hardcoded
    // id, so this keeps testing the behaviour after the next retirement too.
    const deep = resolveModelMenuChoice("team", "deep");
    expect(deep).toBe(activeModelId(modelMenuOption("deep").modelId));
    expect(deep).not.toBe("google/gemini-2.5-pro");
  });
});
