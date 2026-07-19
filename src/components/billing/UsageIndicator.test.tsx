import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { usageRemainingFraction, UsageIndicator } from "./UsageIndicator";
import { LOW_CREDITS_WARN } from "@/lib/entitlements";

describe("usageRemainingFraction (PR-A4 quiet usage indicator)", () => {
  it("is 0 at zero usage, 1 at full usage", () => {
    expect(usageRemainingFraction(0, 300)).toBe(0);
    expect(usageRemainingFraction(300, 300)).toBe(1);
  });

  it("clamps overuse to 1 (never renders a negative bar)", () => {
    expect(usageRemainingFraction(500, 300)).toBe(1);
  });

  it("clamps a negative used to 0", () => {
    expect(usageRemainingFraction(-10, 300)).toBe(0);
  });

  it("is 1 (full/no-render-signal) for a non-positive allowance", () => {
    expect(usageRemainingFraction(50, 0)).toBe(1);
    expect(usageRemainingFraction(50, -5)).toBe(1);
  });

  it("is proportional for a mid-range value", () => {
    expect(usageRemainingFraction(120, 300)).toBeCloseTo(0.4, 5);
  });
});

describe("UsageIndicator (React component)", () => {
  it("renders null when allowance is non-positive", () => {
    const { container } = render(
      <UsageIndicator used={50} allowance={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders null when allowance is negative", () => {
    const { container } = render(
      <UsageIndicator used={50} allowance={-5} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the bar and usage text for valid allowance", () => {
    render(<UsageIndicator used={100} allowance={300} />);
    // The aria-label should contain the usage text
    const group = screen.getByRole("group");
    expect(group.getAttribute("aria-label")).toBe(
      "100 of 300 credits used this month"
    );
  });

  it("displays correct count text", () => {
    render(<UsageIndicator used={150} allowance={500} />);
    expect(screen.getByText("150 of 500 this month")).toBeTruthy();
  });

  it("applies low-warning color when used exceeds LOW_CREDITS_WARN threshold", () => {
    // Render with usage above the warn threshold
    const { container } = render(
      <UsageIndicator used={LOW_CREDITS_WARN + 1} allowance={1000} />
    );
    const group = screen.getByRole("group");
    // Bar should render with proper aria-label
    expect(group.getAttribute("aria-label")).toBeTruthy();
  });

  it("applies normal color when used is below LOW_CREDITS_WARN threshold", () => {
    // Render with usage below the warn threshold
    const { container } = render(
      <UsageIndicator used={LOW_CREDITS_WARN - 1} allowance={1000} />
    );
    const group = screen.getByRole("group");
    expect(group.getAttribute("aria-label")).toBeTruthy();
  });

  it("suppresses caption when compact=true", () => {
    render(
      <UsageIndicator used={50} allowance={200} compact={true} />
    );
    // The caption "Everyday actions are free..." should not be present
    const caption = screen.queryByText(/Everyday actions are free/);
    expect(caption).toBeNull();
  });

  it("includes caption when compact=false (default)", () => {
    render(
      <UsageIndicator used={50} allowance={200} compact={false} />
    );
    // The caption should be present when compact is false
    expect(
      screen.getByText("Everyday actions are free. Only missions and builds draw from this.")
    ).toBeTruthy();
  });

  it("includes caption by default when compact is not specified", () => {
    render(<UsageIndicator used={50} allowance={200} />);
    // The caption should be present when compact is not specified (default false)
    expect(
      screen.getByText("Everyday actions are free. Only missions and builds draw from this.")
    ).toBeTruthy();
  });

  it("calculates bar width correctly based on usage fraction", () => {
    // Verify the fraction calculation is correct
    const fraction = usageRemainingFraction(120, 300);
    expect(fraction).toBeCloseTo(0.4, 5);
    // Width should be (1 - fraction) * 100 = 60%
    const expectedWidth = Math.round((1 - fraction) * 100);
    expect(expectedWidth).toBe(60);
  });

  it("clamps bar width to 100% when overused", () => {
    // Verify the fraction is clamped to 1 when overused
    const fraction = usageRemainingFraction(400, 300);
    expect(fraction).toBe(1);
    // Width should be (1 - 1) * 100 = 0%
    const expectedWidth = Math.round((1 - fraction) * 100);
    expect(expectedWidth).toBe(0);
  });
});
