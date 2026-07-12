import { describe, expect, test } from "bun:test";
import type { CSSProperties } from "react";
import { ConfidenceDisclosureChip } from "./ConfidenceDisclosureChip";

describe("ConfidenceDisclosureChip", () => {
  // Helper to convert children array to string for easier testing
  function childrenToString(children: unknown): string {
    if (Array.isArray(children)) {
      return children.map((c) => (typeof c === "string" ? c : String(c))).join("");
    }
    return String(children);
  }

  test("renders with high confidence tier", () => {
    const el = ConfidenceDisclosureChip({
      confidence: 0.85,
      tier: "high",
    });
    expect(el).not.toBeNull();
    expect(el.type).toBe("span");
    const childStr = childrenToString(el.props.children);
    expect(childStr).toContain("85");
    expect(childStr).toContain("confident");
  });

  test("renders with medium confidence tier", () => {
    const el = ConfidenceDisclosureChip({
      confidence: 0.55,
      tier: "medium",
    });
    const childStr = childrenToString(el.props.children);
    expect(childStr).toContain("55");
    expect(childStr).toContain("moderate");
  });

  test("renders with low confidence tier", () => {
    const el = ConfidenceDisclosureChip({
      confidence: 0.2,
      tier: "low",
    });
    const childStr = childrenToString(el.props.children);
    expect(childStr).toContain("20");
    expect(childStr).toContain("unsure");
  });

  test("clamps confidence to 0 when below range", () => {
    const el = ConfidenceDisclosureChip({
      confidence: -0.5,
      tier: "high",
    });
    const childStr = childrenToString(el.props.children);
    expect(childStr).toContain("0");
  });

  test("clamps confidence to 100 when above range", () => {
    const el = ConfidenceDisclosureChip({
      confidence: 1.5,
      tier: "high",
    });
    const childStr = childrenToString(el.props.children);
    expect(childStr).toContain("100");
  });

  test("rounds confidence to nearest percent", () => {
    const el = ConfidenceDisclosureChip({
      confidence: 0.504,
      tier: "high",
    });
    const childStr = childrenToString(el.props.children);
    expect(childStr).toContain("50");
  });

  test("applies custom style prop", () => {
    const customStyle: CSSProperties = { marginLeft: "8px" };
    const el = ConfidenceDisclosureChip({
      confidence: 0.75,
      tier: "high",
      style: customStyle,
    });
    expect(el.props.style?.marginLeft).toBe("8px");
  });

  test("sets title attribute with percentage and disclosure message", () => {
    const el = ConfidenceDisclosureChip({
      confidence: 0.65,
      tier: "medium",
    });
    expect(el.props.title).toContain("65");
    expect(el.props.title).toContain("Cadence discloses");
  });

  test("renders with display inline-flex and proper alignment", () => {
    const el = ConfidenceDisclosureChip({
      confidence: 0.5,
      tier: "medium",
    });
    expect(el.props.style.display).toBe("inline-flex");
    expect(el.props.style.alignItems).toBe("center");
    expect(el.props.style.gap).toBe(4);
  });

  test("applies tier-specific color to border and text", () => {
    const elHigh = ConfidenceDisclosureChip({
      confidence: 0.9,
      tier: "high",
    });
    expect(elHigh.props.style.color).toBe("var(--emerald)");

    const elLow = ConfidenceDisclosureChip({
      confidence: 0.2,
      tier: "low",
    });
    expect(elLow.props.style.color).toBe("var(--ember)");
  });
});
