/**
 * Test suite for UsageIndicator component — billing surface meter render.
 * Tests the quiet usage bar (pricing-architecture.md §2 Rule 3 enforcement):
 * no per-action dollars, no mid-flow cost confirmations, calm by design.
 */

import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import {
  UsageIndicator,
  usageRemainingFraction,
  type UsageIndicatorProps,
} from "./UsageIndicator";
import { LOW_CREDITS_WARN } from "@/lib/entitlements";

describe("usageRemainingFraction (pure helper)", () => {
  it("should return 1 when allowance is 0", () => {
    expect(usageRemainingFraction(100, 0)).toBe(1);
  });

  it("should return 1 when allowance is negative", () => {
    expect(usageRemainingFraction(100, -50)).toBe(1);
  });

  it("should return 1 when allowance is not finite", () => {
    expect(usageRemainingFraction(100, Infinity)).toBe(1);
    expect(usageRemainingFraction(100, -Infinity)).toBe(1);
    expect(usageRemainingFraction(100, NaN)).toBe(1);
  });

  it("should clamp to [0, 1]", () => {
    expect(usageRemainingFraction(50, 100)).toBe(0.5);
    expect(usageRemainingFraction(0, 100)).toBe(0);
    expect(usageRemainingFraction(100, 100)).toBe(1);
    expect(usageRemainingFraction(150, 100)).toBe(1); // clamped
  });

  it("should handle used > allowance", () => {
    expect(usageRemainingFraction(200, 100)).toBe(1);
  });

  it("should handle used < 0", () => {
    expect(usageRemainingFraction(-50, 100)).toBe(0);
  });

  it("should calculate correct fractions", () => {
    expect(usageRemainingFraction(25, 100)).toBe(0.25);
    expect(usageRemainingFraction(33, 100)).toBe(0.33);
    expect(usageRemainingFraction(99, 100)).toBe(0.99);
  });
});

describe("UsageIndicator component", () => {
  describe("render nullability", () => {
    it("should render null when allowance is 0", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={0} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render null when allowance is negative", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={-100} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render null when allowance is Infinity", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={Infinity} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render null when allowance is NaN", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={NaN} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render when allowance is positive and finite", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={100} />,
      );
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe("accessibility", () => {
    it("should have role='group' for semantic structure", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={100} />,
      );
      const group = container.querySelector('[role="group"]');
      expect(group).toBeTruthy();
    });

    it("should have aria-label describing usage", () => {
      render(<UsageIndicator used={50} allowance={100} />);
      expect(
        screen.getByLabelText("50 of 100 credits used this month"),
      ).toBeTruthy();
    });

    it("should update aria-label when props change", () => {
      const { rerender } = render(
        <UsageIndicator used={50} allowance={100} />,
      );
      expect(
        screen.getByLabelText("50 of 100 credits used this month"),
      ).toBeTruthy();

      rerender(<UsageIndicator used={75} allowance={100} />);
      expect(
        screen.getByLabelText("75 of 100 credits used this month"),
      ).toBeTruthy();
    });
  });

  describe("usage text rendering", () => {
    it("should display usage count text", () => {
      render(<UsageIndicator used={120} allowance={300} />);
      expect(screen.getByText("120 of 300 this month")).toBeTruthy();
    });

    it("should show 0 usage", () => {
      render(<UsageIndicator used={0} allowance={100} />);
      expect(screen.getByText("0 of 100 this month")).toBeTruthy();
    });

    it("should show equal used and allowance", () => {
      render(<UsageIndicator used={100} allowance={100} />);
      expect(screen.getByText("100 of 100 this month")).toBeTruthy();
    });

    it("should show usage > allowance", () => {
      render(<UsageIndicator used={150} allowance={100} />);
      expect(screen.getByText("150 of 100 this month")).toBeTruthy();
    });
  });

  describe("compact mode", () => {
    it("should show caption by default", () => {
      render(<UsageIndicator used={50} allowance={100} />);
      expect(
        screen.getByText(
          "Everyday actions are free. Only missions and builds draw from this.",
        ),
      ).toBeTruthy();
    });

    it("should hide caption when compact=true", () => {
      render(<UsageIndicator used={50} allowance={100} compact={true} />);
      expect(
        screen.queryByText(
          "Everyday actions are free. Only missions and builds draw from this.",
        ),
      ).toBeNull();
    });

    it("should show caption when compact=false", () => {
      render(<UsageIndicator used={50} allowance={100} compact={false} />);
      expect(
        screen.getByText(
          "Everyday actions are free. Only missions and builds draw from this.",
        ),
      ).toBeTruthy();
    });

    it("should show caption when compact is undefined (default)", () => {
      render(<UsageIndicator used={50} allowance={100} />);
      expect(
        screen.getByText(
          "Everyday actions are free. Only missions and builds draw from this.",
        ),
      ).toBeTruthy();
    });
  });

  describe("bar color (low credits warning)", () => {
    it("should render component when used <= LOW_CREDITS_WARN", () => {
      const { container } = render(
        <UsageIndicator used={LOW_CREDITS_WARN} allowance={1000} />,
      );
      // Component should render (not null)
      expect(container.firstChild).not.toBeNull();
    });

    it("should render component when used > LOW_CREDITS_WARN", () => {
      const { container } = render(
        <UsageIndicator used={LOW_CREDITS_WARN + 1} allowance={1000} />,
      );
      // Component should render (not null)
      expect(container.firstChild).not.toBeNull();
    });

    it("should have a bar element with role='group'", () => {
      render(
        <UsageIndicator used={LOW_CREDITS_WARN - 1} allowance={1000} />,
      );
      const group = screen.getByRole("group");
      expect(group).toBeTruthy();
    });
  });

  describe("bar width calculation", () => {
    it("should calculate width as (1 - fraction) * 100%", () => {
      const { container } = render(
        <UsageIndicator used={25} allowance={100} />,
      );
      // fraction = 25/100 = 0.25, so width = (1 - 0.25) * 100 = 75%
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      const style = filledBar?.getAttribute("style") || "";
      expect(style).toContain("width: 75%");
    });

    it("should show 0% width when used >= allowance", () => {
      const { container } = render(
        <UsageIndicator used={100} allowance={100} />,
      );
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      expect(filledBar?.getAttribute("style")).toContain("width: 0%");
    });

    it("should show 100% width when used = 0", () => {
      const { container } = render(
        <UsageIndicator used={0} allowance={100} />,
      );
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      expect(filledBar?.getAttribute("style")).toContain("width: 100%");
    });

    it("should round width to nearest integer", () => {
      const { container } = render(
        <UsageIndicator used={33} allowance={100} />,
      );
      // fraction = 0.33, width = (1 - 0.33) * 100 = 67%, should round to 67
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      const style = filledBar?.getAttribute("style") || "";
      const widthMatch = style.match(/width: (\d+)%/);
      expect(widthMatch?.[1]).toBe("67");
    });
  });

  describe("styling and layout", () => {
    it("should have flex column layout", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={100} />,
      );
      const group = container.querySelector('[role="group"]');
      const style = group?.getAttribute("style") || "";
      expect(style).toContain("flex-direction: column");
    });

    it("should have 4px gap between elements", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={100} />,
      );
      const group = container.querySelector('[role="group"]');
      const style = group?.getAttribute("style") || "";
      expect(style).toContain("gap: 4");
    });

    it("should have minimum width of 96px", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={100} />,
      );
      const group = container.querySelector('[role="group"]');
      const style = group?.getAttribute("style") || "";
      expect(style).toContain("min-width: 96");
    });

    it("should have proper bar styling (height and radius)", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={100} />,
      );
      const barBackground = container.querySelector(
        '[style*="height: 4"]',
      );
      const style = barBackground?.getAttribute("style") || "";
      expect(style).toContain("height: 4");
      expect(style).toContain("border-radius: 99");
      // background property will be on outer container
      expect(style).toContain("overflow: hidden");
    });

    it("should apply smooth transition to bar width", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={100} />,
      );
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("transition:"),
      );
      const style = filledBar?.getAttribute("style") || "";
      expect(style).toContain("transition: width 0.2s ease");
    });
  });

  describe("pricing invariant enforcement", () => {
    it("should NOT expose any per-action cost information", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={100} />,
      );
      const text = container.textContent || "";
      expect(text).not.toContain("$");
      expect(text).not.toContain("cost");
      expect(text).not.toContain("price");
      expect(text).not.toContain("COGS");
    });

    it("should NOT show costs for mid-flow operations", () => {
      const { container } = render(
        <UsageIndicator used={50} allowance={100} />,
      );
      const text = container.textContent || "";
      expect(text).not.toContain("$");
      expect(text).not.toContain("cost");
      // "Everyday actions are free" contains "actions" so we can't check for that
      expect(text).not.toContain("confirm");
    });
  });

  describe("edge cases", () => {
    it("should handle fractional used/allowance values", () => {
      const { container } = render(
        <UsageIndicator used={33.333} allowance={100.5} />,
      );
      expect(
        screen.getByText(/33.333 of 100.5 this month/),
      ).toBeTruthy();
    });

    it("should handle very large numbers", () => {
      const { container } = render(
        <UsageIndicator used={1000000} allowance={10000000} />,
      );
      expect(
        screen.getByText("1000000 of 10000000 this month"),
      ).toBeTruthy();
    });

    it("should handle used=0, allowance=1", () => {
      const { container } = render(
        <UsageIndicator used={0} allowance={1} />,
      );
      expect(screen.getByText("0 of 1 this month")).toBeTruthy();
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      expect(filledBar?.getAttribute("style")).toContain("width: 100%");
    });

    it("should handle used > allowance by large margin", () => {
      const { container } = render(
        <UsageIndicator used={1000} allowance={100} />,
      );
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      expect(filledBar?.getAttribute("style")).toContain("width: 0%");
    });
  });

  describe("prop changes (rerenders)", () => {
    it("should update bar when used changes", () => {
      const { rerender, container } = render(
        <UsageIndicator used={25} allowance={100} />,
      );
      let bars = container.querySelectorAll("div");
      let filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      expect(filledBar?.getAttribute("style")).toContain("width: 75%");

      rerender(<UsageIndicator used={50} allowance={100} />);
      bars = container.querySelectorAll("div");
      filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      expect(filledBar?.getAttribute("style")).toContain("width: 50%");
    });

    it("should update text when used changes", () => {
      const { rerender } = render(
        <UsageIndicator used={25} allowance={100} />,
      );
      expect(screen.getByText("25 of 100 this month")).toBeTruthy();

      rerender(<UsageIndicator used={75} allowance={100} />);
      expect(screen.getByText("75 of 100 this month")).toBeTruthy();
    });

    it("should handle allowance changing", () => {
      const { rerender } = render(
        <UsageIndicator used={50} allowance={100} />,
      );
      expect(screen.getByText("50 of 100 this month")).toBeTruthy();

      rerender(<UsageIndicator used={50} allowance={200} />);
      expect(screen.getByText("50 of 200 this month")).toBeTruthy();
    });
  });
});
