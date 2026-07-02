import { expect, test, describe } from "bun:test";
import { formatFlowContext, computeDesignParity } from "./design-parity.functions";

describe("formatFlowContext (DSN-04) — the flow rides into the mission goal", () => {
  test("renders numbered step labels in order", () => {
    const text = formatFlowContext({
      steps: [{ label: "Land on the pricing page" }, { label: "Pick a plan" }],
      edges: [],
    });
    expect(text).toContain("1. Land on the pricing page");
    expect(text).toContain("2. Pick a plan");
  });

  test("empty on a null flow", () => {
    expect(formatFlowContext(null)).toBe("");
  });

  test("empty on a flow with no steps", () => {
    expect(formatFlowContext({ steps: [], edges: [] })).toBe("");
  });

  test("drops steps with no label rather than rendering a blank line", () => {
    const text = formatFlowContext({
      steps: [{ label: "Only real step" }, {}],
      edges: [],
    });
    expect(text).toContain("1. Only real step");
    expect(text).not.toContain("2.");
  });
});

describe("computeDesignParity (DSN-04) — the lightweight return-side check", () => {
  test("no_context when the PRD had nothing to check against", () => {
    const signal = computeDesignParity("Some PR title and summary", []);
    expect(signal.verdict).toBe("no_context");
    expect(signal.expected).toEqual([]);
  });

  test("aligned when at least one expected reference appears (case-insensitive)", () => {
    const signal = computeDesignParity("Add the pricing flow, uses the TOKENS category colors", [
      "tokens",
      "voice",
    ]);
    expect(signal.verdict).toBe("aligned");
    expect(signal.matched).toEqual(["tokens"]);
  });

  test("unverified when none of the expected references appear", () => {
    const signal = computeDesignParity("A totally unrelated bug fix", ["tokens", "voice"]);
    expect(signal.verdict).toBe("unverified");
    expect(signal.matched).toEqual([]);
  });

  test("dedupes expected references before checking", () => {
    const signal = computeDesignParity("mentions tokens once", ["tokens", "tokens"]);
    expect(signal.expected).toEqual(["tokens"]);
  });
});
