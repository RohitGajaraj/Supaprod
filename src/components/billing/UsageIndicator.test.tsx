/**
 * Test suite for UsageIndicator component — billing surface meter render.
 * Tests the quiet usage bar (pricing-architecture.md §2 Rule 3 enforcement):
 * no per-action dollars, no mid-flow cost confirmations, calm by design.
 */

import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import {
  UsageIndicator,
  usedFraction,
  isRunningLow,
  type UsageIndicatorProps,
} from "./UsageIndicator";
import { LOW_CREDITS_WARN } from "@/lib/entitlements";

describe("usedFraction (pure helper)", () => {
  it("should return 1 when allowance is 0", () => {
    expect(usedFraction(100, 0)).toBe(1);
  });

  it("should return 1 when allowance is negative", () => {
    expect(usedFraction(100, -50)).toBe(1);
  });

  it("should return 1 when allowance is not finite", () => {
    expect(usedFraction(100, Infinity)).toBe(1);
    expect(usedFraction(100, -Infinity)).toBe(1);
    expect(usedFraction(100, NaN)).toBe(1);
  });

  it("should clamp to [0, 1]", () => {
    expect(usedFraction(50, 100)).toBe(0.5);
    expect(usedFraction(0, 100)).toBe(0);
    expect(usedFraction(100, 100)).toBe(1);
    expect(usedFraction(150, 100)).toBe(1); // clamped
  });

  it("should handle used > allowance", () => {
    expect(usedFraction(200, 100)).toBe(1);
  });

  it("should handle used < 0", () => {
    expect(usedFraction(-50, 100)).toBe(0);
  });

  it("should calculate correct fractions", () => {
    expect(usedFraction(25, 100)).toBe(0.25);
    expect(usedFraction(33, 100)).toBe(0.33);
    expect(usedFraction(99, 100)).toBe(0.99);
  });
});

describe("UsageIndicator component", () => {
  describe("render nullability", () => {
    it("should render null when allowance is 0", () => {
      const { container } = render(<UsageIndicator used={50} allowance={0} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render null when allowance is negative", () => {
      const { container } = render(<UsageIndicator used={50} allowance={-100} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render null when allowance is Infinity", () => {
      const { container } = render(<UsageIndicator used={50} allowance={Infinity} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render null when allowance is NaN", () => {
      const { container } = render(<UsageIndicator used={50} allowance={NaN} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render when allowance is positive and finite", () => {
      const { container } = render(<UsageIndicator used={50} allowance={100} />);
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe("accessibility", () => {
    it("should have role='group' for semantic structure", () => {
      const { container } = render(<UsageIndicator used={50} allowance={100} />);
      const group = container.querySelector('[role="group"]');
      expect(group).toBeTruthy();
    });

    it("should have aria-label describing usage", () => {
      render(<UsageIndicator used={50} allowance={100} />);
      expect(screen.getByLabelText("50 of 100 credits used this month")).toBeTruthy();
    });

    it("should update aria-label when props change", () => {
      const { rerender } = render(<UsageIndicator used={50} allowance={100} />);
      expect(screen.getByLabelText("50 of 100 credits used this month")).toBeTruthy();

      rerender(<UsageIndicator used={75} allowance={100} />);
      expect(screen.getByLabelText("75 of 100 credits used this month")).toBeTruthy();
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
        screen.getByText("Everyday actions are free. Only missions and builds draw from this."),
      ).toBeTruthy();
    });

    it("should hide caption when compact=true", () => {
      render(<UsageIndicator used={50} allowance={100} compact={true} />);
      expect(
        screen.queryByText("Everyday actions are free. Only missions and builds draw from this."),
      ).toBeNull();
    });

    it("should show caption when compact=false", () => {
      render(<UsageIndicator used={50} allowance={100} compact={false} />);
      expect(
        screen.getByText("Everyday actions are free. Only missions and builds draw from this."),
      ).toBeTruthy();
    });

    it("should show caption when compact is undefined (default)", () => {
      render(<UsageIndicator used={50} allowance={100} />);
      expect(
        screen.getByText("Everyday actions are free. Only missions and builds draw from this."),
      ).toBeTruthy();
    });
  });

  describe("bar color (low credits warning)", () => {
    it("should render component when used <= LOW_CREDITS_WARN", () => {
      const { container } = render(<UsageIndicator used={LOW_CREDITS_WARN} allowance={1000} />);
      // Component should render (not null)
      expect(container.firstChild).not.toBeNull();
    });

    it("should render component when used > LOW_CREDITS_WARN", () => {
      const { container } = render(<UsageIndicator used={LOW_CREDITS_WARN + 1} allowance={1000} />);
      // Component should render (not null)
      expect(container.firstChild).not.toBeNull();
    });

    it("should have a bar element with role='group'", () => {
      render(<UsageIndicator used={LOW_CREDITS_WARN - 1} allowance={1000} />);
      const group = screen.getByRole("group");
      expect(group).toBeTruthy();
    });
  });

  describe("bar width calculation", () => {
    it("the bar fills with the share consumed", () => {
      const { container } = render(<UsageIndicator used={25} allowance={100} />);
      // 25 of 100 spent, so the bar is a quarter full and grows from here.
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      const style = filledBar?.getAttribute("style") || "";
      expect(style).toContain("width: 25%");
    });

    it("is full when the allowance is spent", () => {
      const { container } = render(<UsageIndicator used={100} allowance={100} />);
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      expect(filledBar?.getAttribute("style")).toContain("width: 100%");
    });

    it("is empty before anything is spent", () => {
      const { container } = render(<UsageIndicator used={0} allowance={100} />);
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      expect(filledBar?.getAttribute("style")).toContain("width: 0%");
    });

    it("should round width to nearest integer", () => {
      const { container } = render(<UsageIndicator used={33} allowance={100} />);
      // 33 of 100 spent, so the bar is 33% full.
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      const style = filledBar?.getAttribute("style") || "";
      const widthMatch = style.match(/width: (\d+)%/);
      expect(widthMatch?.[1]).toBe("33");
    });
  });

  describe("styling and layout", () => {
    it("should have flex column layout", () => {
      const { container } = render(<UsageIndicator used={50} allowance={100} />);
      const group = container.querySelector('[role="group"]');
      const style = group?.getAttribute("style") || "";
      expect(style).toContain("flex-direction: column");
    });

    it("should have 4px gap between elements", () => {
      const { container } = render(<UsageIndicator used={50} allowance={100} />);
      const group = container.querySelector('[role="group"]');
      const style = group?.getAttribute("style") || "";
      expect(style).toContain("gap: 4");
    });

    it("should have minimum width of 96px", () => {
      const { container } = render(<UsageIndicator used={50} allowance={100} />);
      const group = container.querySelector('[role="group"]');
      const style = group?.getAttribute("style") || "";
      expect(style).toContain("min-width: 96");
    });

    it("should have proper bar styling (height and radius)", () => {
      const { container } = render(<UsageIndicator used={50} allowance={100} />);
      const barBackground = container.querySelector('[style*="height: 4"]');
      const style = barBackground?.getAttribute("style") || "";
      expect(style).toContain("height: 4");
      expect(style).toContain("border-radius: 99");
      // background property will be on outer container
      expect(style).toContain("overflow: hidden");
    });

    it("should apply smooth transition to bar width", () => {
      const { container } = render(<UsageIndicator used={50} allowance={100} />);
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
      const { container } = render(<UsageIndicator used={50} allowance={100} />);
      const text = container.textContent || "";
      expect(text).not.toContain("$");
      expect(text).not.toContain("cost");
      expect(text).not.toContain("price");
      expect(text).not.toContain("COGS");
    });

    it("should NOT show costs for mid-flow operations", () => {
      const { container } = render(<UsageIndicator used={50} allowance={100} />);
      const text = container.textContent || "";
      expect(text).not.toContain("$");
      expect(text).not.toContain("cost");
      // "Everyday actions are free" contains "actions" so we can't check for that
      expect(text).not.toContain("confirm");
    });
  });

  describe("edge cases", () => {
    it("should handle fractional used/allowance values", () => {
      const { container } = render(<UsageIndicator used={33.333} allowance={100.5} />);
      expect(screen.getByText(/33.333 of 100.5 this month/)).toBeTruthy();
    });

    it("should handle very large numbers", () => {
      const { container } = render(<UsageIndicator used={1000000} allowance={10000000} />);
      expect(screen.getByText("1000000 of 10000000 this month")).toBeTruthy();
    });

    it("should handle used=0, allowance=1", () => {
      const { container } = render(<UsageIndicator used={0} allowance={1} />);
      expect(screen.getByText("0 of 1 this month")).toBeTruthy();
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      expect(filledBar?.getAttribute("style")).toContain("width: 0%");
    });

    it("should handle used > allowance by large margin", () => {
      const { container } = render(<UsageIndicator used={1000} allowance={100} />);
      const bars = container.querySelectorAll("div");
      const filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      // Clamped, never past full.
      expect(filledBar?.getAttribute("style")).toContain("width: 100%");
    });
  });

  describe("prop changes (rerenders)", () => {
    it("should update bar when used changes", () => {
      const { rerender, container } = render(<UsageIndicator used={25} allowance={100} />);
      let bars = container.querySelectorAll("div");
      let filledBar = Array.from(bars).find((el) =>
        el.getAttribute("style")?.includes("height: 100%"),
      );
      expect(filledBar?.getAttribute("style")).toContain("width: 25%");

      rerender(<UsageIndicator used={50} allowance={100} />);
      bars = container.querySelectorAll("div");
      filledBar = Array.from(bars).find((el) => el.getAttribute("style")?.includes("height: 100%"));
      expect(filledBar?.getAttribute("style")).toContain("width: 50%");
    });

    it("should update text when used changes", () => {
      const { rerender } = render(<UsageIndicator used={25} allowance={100} />);
      expect(screen.getByText("25 of 100 this month")).toBeTruthy();

      rerender(<UsageIndicator used={75} allowance={100} />);
      expect(screen.getByText("75 of 100 this month")).toBeTruthy();
    });

    it("should handle allowance changing", () => {
      const { rerender } = render(<UsageIndicator used={50} allowance={100} />);
      expect(screen.getByText("50 of 100 this month")).toBeTruthy();

      rerender(<UsageIndicator used={50} allowance={200} />);
      expect(screen.getByText("50 of 200 this month")).toBeTruthy();
    });
  });
});

/**
 * THE ALARM WAS FIRING BACKWARDS AND NOTHING TESTED IT.
 *
 * `LOW_CREDITS_WARN` is 100 and it is a REMAINING-credits threshold: BillingBanner
 * applies it as `balance <= threshold` in `shouldWarnLowCredits`. This component
 * applied the same constant to CONSUMPTION (`used <= LOW_CREDITS_WARN`), and its
 * one caller passes `monthlyGrantCredits - balanceCredits`, which is spend. **So
 * the low-credit colour showed while somebody had barely spent anything and
 * switched OFF as they ran out.**
 *
 * Forty-four tests covered this component and not one asserted the warning, so
 * the inversion was invisible to the suite. Seven of them actively pinned the bar
 * moving the wrong way: **the tests encoded the defect**, which is why it lasted.
 *
 * ASSERTED AS A PREDICATE, NOT A COLOUR, and the first attempt taught me why. I
 * wrote these against the rendered `background`, and they failed on a case that
 * is correct in a browser: the old value was `var(--action-blue, var(--mrd-you))`
 * and the test DOM drops a nested `var()` fallback, so the style came back with
 * no background at all. A colour is a `var()` chain Meridian owns and may re-map;
 * the RULE is what this component is responsible for.
 */
describe("running low follows what is LEFT, not what is spent", () => {
  it("is calm when barely anything has been spent", () => {
    // 10 of 1000 spent, 990 left. This is the case that used to raise the alarm,
    // because 10 <= 100.
    expect(isRunningLow(10, 1000)).toBe(false);
  });

  it("warns once the remainder crosses the threshold", () => {
    expect(isRunningLow(950, 1000)).toBe(true);
  });

  it("warns at the boundary and not one credit before it", () => {
    expect(isRunningLow(900, 1000)).toBe(true); // exactly 100 left
    expect(isRunningLow(899, 1000)).toBe(false); // 101 left
  });

  it("still warns when the allowance is spent past zero", () => {
    expect(isRunningLow(1200, 1000)).toBe(true);
  });

  /** No allowance is not an emergency; the component renders nothing at all. */
  it("does not warn when there is no allowance to run out of", () => {
    for (const bad of [0, -50, Infinity, NaN]) {
      expect(isRunningLow(10, bad)).toBe(false);
    }
  });

  /**
   * The regression that would undo the fix: applying the threshold to spend
   * again. Pinned as the pair that must disagree, so a future edit cannot make
   * both ends true at once.
   */
  it("disagrees with the inverted rule at both ends", () => {
    expect(isRunningLow(10, 1000)).not.toBe(10 <= 100);
    expect(isRunningLow(950, 1000)).not.toBe(950 <= 100);
  });
});
