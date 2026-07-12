import { describe, test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ConfidenceDisclosureChip } from "../ConfidenceDisclosureChip";

describe("ConfidenceDisclosureChip", () => {
  test("renders confidence as rounded percentage", () => {
    const { container } = render(<ConfidenceDisclosureChip confidence={0.856} tier="high" />);
    expect(screen.getByText(/86%/)).toBeDefined();
  });

  test("clamps confidence to 0 when below range", () => {
    const { container } = render(<ConfidenceDisclosureChip confidence={-0.5} tier="low" />);
    expect(screen.getByText(/0%/)).toBeDefined();
  });

  test("clamps confidence to 1 when above range", () => {
    const { container } = render(<ConfidenceDisclosureChip confidence={1.5} tier="high" />);
    expect(screen.getByText(/100%/)).toBeDefined();
  });

  test("rounds to nearest percent", () => {
    // 0.445 * 100 = 44.5, Math.round(44.5) = 44 (banker's rounding) or 45 (standard)
    const { container } = render(<ConfidenceDisclosureChip confidence={0.445} tier="medium" />);
    // The rendered text should contain either 44% or 45%
    const text = screen.getByText(/4[45]%/);
    expect(text).toBeDefined();
  });

  test("renders 'confident' label for high tier", () => {
    render(<ConfidenceDisclosureChip confidence={0.9} tier="high" />);
    expect(screen.getByText(/confident/)).toBeDefined();
  });

  test("renders 'moderate' label for medium tier", () => {
    render(<ConfidenceDisclosureChip confidence={0.5} tier="medium" />);
    expect(screen.getByText(/moderate/)).toBeDefined();
  });

  test("renders 'unsure' label for low tier", () => {
    render(<ConfidenceDisclosureChip confidence={0.3} tier="low" />);
    expect(screen.getByText(/unsure/)).toBeDefined();
  });

  test("applies correct color for high tier", () => {
    const { container } = render(<ConfidenceDisclosureChip confidence={0.8} tier="high" />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--emerald)");
  });

  test("applies correct color for medium tier", () => {
    const { container } = render(<ConfidenceDisclosureChip confidence={0.5} tier="medium" />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--text-muted)");
  });

  test("applies correct color for low tier", () => {
    const { container } = render(<ConfidenceDisclosureChip confidence={0.3} tier="low" />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--ember)");
  });

  test("renders as inline-flex display", () => {
    const { container } = render(<ConfidenceDisclosureChip confidence={0.7} tier="high" />);
    const span = container.querySelector("span");
    expect(span?.style.display).toBe("inline-flex");
  });

  test("applies custom style prop", () => {
    const { container } = render(
      <ConfidenceDisclosureChip confidence={0.7} tier="high" style={{ marginRight: "10px" }} />,
    );
    const span = container.querySelector("span");
    expect(span?.style.marginRight).toBe("10px");
  });

  test("includes title attribute with disclosure text", () => {
    const { container } = render(<ConfidenceDisclosureChip confidence={0.75} tier="high" />);
    const span = container.querySelector("span");
    expect(span?.title).toContain("75%");
    expect(span?.title).toContain("confidence");
  });

  test("renders zero confidence as 0%", () => {
    render(<ConfidenceDisclosureChip confidence={0} tier="low" />);
    expect(screen.getByText(/0%/)).toBeDefined();
  });

  test("renders full confidence as 100%", () => {
    render(<ConfidenceDisclosureChip confidence={1} tier="high" />);
    expect(screen.getByText(/100%/)).toBeDefined();
  });
});
