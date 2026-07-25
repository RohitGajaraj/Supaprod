import { describe, expect, test } from "bun:test";
import { ConfidenceDisclosureChip } from "./ConfidenceDisclosureChip";

// Helper to convert children array to string for easier testing.
function childrenToString(children: unknown): string {
  if (Array.isArray(children)) {
    return children.map((c) => (typeof c === "string" ? c : String(c))).join("");
  }
  return String(children);
}

describe("ConfidenceDisclosureChip", () => {
  test("renders the tier label and percentage as visible children text", () => {
    const high = ConfidenceDisclosureChip({ confidence: 0.85, tier: "high" });
    expect(childrenToString(high.props.children)).toContain("85");
    expect(childrenToString(high.props.children)).toContain("confident");

    const medium = ConfidenceDisclosureChip({ confidence: 0.55, tier: "medium" });
    expect(childrenToString(medium.props.children)).toContain("55");
    expect(childrenToString(medium.props.children)).toContain("moderate");

    const low = ConfidenceDisclosureChip({ confidence: 0.2, tier: "low" });
    expect(childrenToString(low.props.children)).toContain("20");
    expect(childrenToString(low.props.children)).toContain("unsure");
  });

  test("renders as inline-flex span with gap and alignment", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0.8,
      tier: "high",
    });

    expect(chip.type).toBe("span");
    const styles = (chip.props as { style?: Record<string, unknown> })?.style ?? {};
    expect(styles.display).toBe("inline-flex");
    expect(styles.alignItems).toBe("center");
    expect(styles.gap).toBe(4);
  });

  test("high tier maps to emerald color", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0.9,
      tier: "high",
    });
    const styles = (chip.props as { style?: Record<string, unknown> })?.style ?? {};
    expect(styles.color).toBe("var(--emerald)");
  });

  test("medium tier maps to muted color", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0.5,
      tier: "medium",
    });
    const styles = (chip.props as { style?: Record<string, unknown> })?.style ?? {};
    expect(styles.color).toBe("var(--text-muted)");
  });

  test("low tier maps to ember color", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0.25,
      tier: "low",
    });
    const styles = (chip.props as { style?: Record<string, unknown> })?.style ?? {};
    expect(styles.color).toBe("var(--ember)");
  });

  test("border color uses tier tone at 40% opacity via color-mix", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0.7,
      tier: "high",
    });
    const styles = (chip.props as { style?: Record<string, unknown> })?.style ?? {};
    expect(styles.border).toContain("color-mix(in oklab, var(--emerald) 40%, transparent)");
  });

  test("border is solid 1px with border-radius 99 (pill shape)", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0.5,
      tier: "medium",
    });
    const styles = (chip.props as { style?: Record<string, unknown> })?.style ?? {};
    expect(styles.borderRadius).toBe(99);
  });

  test("applies mono font and small font size", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0.5,
      tier: "medium",
    });
    const styles = (chip.props as { style?: Record<string, unknown> })?.style ?? {};
    expect(styles.fontFamily).toBe("var(--font-mono)");
    expect(styles.fontSize).toBe(9.5);
    expect(styles.fontWeight).toBe(600);
  });

  test("sets title attribute with confidence description", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0.85,
      tier: "high",
    });
    const title = (chip.props as { title?: string })?.title;
    expect(title).toContain("85%");
    expect(title).toContain("Supaprod discloses");
  });

  test("accepts optional custom style prop merged into base styles", () => {
    const customStyle = { marginTop: 10, opacity: 0.8 };
    const chip = ConfidenceDisclosureChip({
      confidence: 0.5,
      tier: "medium",
      style: customStyle,
    });
    const styles = (chip.props as { style?: Record<string, unknown> })?.style ?? {};
    expect(styles.marginTop).toBe(10);
    expect(styles.opacity).toBe(0.8);
    // Base styles still present
    expect(styles.color).toBe("var(--text-muted)");
  });

  test("has whitespace nowrap to keep percentage and label on one line", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0.65,
      tier: "medium",
    });
    const styles = (chip.props as { style?: Record<string, unknown> })?.style ?? {};
    expect(styles.whiteSpace).toBe("nowrap");
  });

  test("has padding and letter-spacing for readability", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0.5,
      tier: "low",
    });
    const styles = (chip.props as { style?: Record<string, unknown> })?.style ?? {};
    expect(styles.padding).toBe("2px 8px");
    expect(styles.letterSpacing).toBe("0.06em");
  });

  test("clamps negative confidence to 0%", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: -0.5,
      tier: "low",
    });
    const title = (chip.props as { title?: string })?.title;
    expect(title).toContain("0%");
  });

  test("clamps excessive confidence to 100%", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 1.5,
      tier: "high",
    });
    const title = (chip.props as { title?: string })?.title;
    expect(title).toContain("100%");
  });

  test("rounds confidence to nearest percent", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0.555,
      tier: "high",
    });
    const title = (chip.props as { title?: string })?.title;
    expect(title).toContain("56%");
  });

  test("edge case: exactly 0 confidence shows 0%", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0,
      tier: "low",
    });
    const title = (chip.props as { title?: string })?.title;
    expect(title).toContain("0%");
  });

  test("edge case: exactly 1 confidence shows 100%", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 1,
      tier: "high",
    });
    const title = (chip.props as { title?: string })?.title;
    expect(title).toContain("100%");
  });

  test("rounds 0.5 to 50% (banker's rounding)", () => {
    const chip = ConfidenceDisclosureChip({
      confidence: 0.5,
      tier: "medium",
    });
    const title = (chip.props as { title?: string })?.title;
    expect(title).toContain("50%");
  });
});
