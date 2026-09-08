import { expect, test, describe } from "bun:test";
import { formatFlowContext } from "./design-parity.functions";

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
