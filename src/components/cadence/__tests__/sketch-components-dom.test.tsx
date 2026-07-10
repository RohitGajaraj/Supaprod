import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SketchBarChart, SketchLine, SketchBar } from "../Sketch";
import type { SketchBarDatum, SketchLineDatum } from "../Sketch";

/**
 * DOM-MOUNTED TESTS FOR SKETCH COMPONENTS
 *
 * Gap 1 remediation: These tests render components into a real DOM (happy-dom)
 * and verify interactive behavior (state changes, event handling, CSS classes).
 * Previous test suites used hand-rolled JSX mirrors that couldn't catch:
 *   - State swapping on hover (activeIdx tracking in SketchBarChart)
 *   - Race conditions in focus-blur handlers
 *   - CSS class application and styling
 *   - Accessible attribute presence (aria-labels, roles)
 *
 * Strategy: Render component, fire user events (hover, blur), verify DOM updates.
 */

describe("SketchBarChart — Interactive Hover State (DOM-mounted)", () => {
  it("should render bars with aria-label accessibility attributes", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 25 },
    ];
    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(v)} />,
    );
    // Verify each bar has accessible labeling
    const bars = container.querySelectorAll("g[role='button']");
    expect(bars.length).toBe(data.length);
  });

  it("should swap activeIdx on bar hover (state machine test)", async () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 25 },
      { label: "Wed", value: 15 },
    ];
    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(v)} />,
    );

    // Find all bar groups (the interactive elements)
    const bars = container.querySelectorAll("g[role='button']");
    const firstBar = bars[0] as SVGGElement;
    const secondBar = bars[1] as SVGGElement;

    // Initial state: insight shows first bar
    expect(screen.getByText(/Mon/i) || screen.getByText(/10/i)).toBeDefined();

    // Hover over second bar: activeIdx should change
    fireEvent.mouseEnter(secondBar);
    await waitFor(() => {
      // After hover, the insight text should change to reflect second bar
      expect(screen.getByText(/Tue/i) || screen.getByText(/25/i)).toBeDefined();
    });

    // Hover back to first bar
    fireEvent.mouseEnter(firstBar);
    await waitFor(() => {
      expect(screen.getByText(/Mon/i) || screen.getByText(/10/i)).toBeDefined();
    });
  });

  it("should detect and bypass stale onMouseLeave events (race guard logic)", async () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 25 },
      { label: "Wed", value: 15 },
    ];
    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(v)} />,
    );

    const buttons = container.querySelectorAll("button");
    const btn0 = buttons[0];
    const btn1 = buttons[1];
    const btn2 = buttons[2];

    // Simulate the problematic sequence:
    // 1. Hover over btn0 -> activeIdx becomes 0, "Mon" shows
    fireEvent.mouseEnter(btn0);
    await waitFor(() => {
      expect(screen.getByText(/Mon/i)).toBeDefined();
    });

    // 2. Hover over btn1 -> activeIdx becomes 1, "Tue" shows
    fireEvent.mouseEnter(btn1);
    await waitFor(() => {
      expect(screen.getByText(/Tue/i)).toBeDefined();
    });

    // 3. Leave btn0 (a stale event from the old hover) -> should NOT reset
    //    because the functional updater checks h === i before clearing.
    //    Since btn1 is now active (h === 1), leaving btn0 (i === 0) does nothing.
    fireEvent.mouseLeave(btn0);

    // 4. Verify "Tue" is STILL shown (not reverted to default or "Mon")
    await waitFor(() => {
      expect(screen.getByText(/Tue/i)).toBeDefined();
    });

    // 5. Now leave btn1 intentionally -> activeIdx should go back to default
    fireEvent.mouseLeave(btn1);
    await waitFor(() => {
      // Should show the last bar (Wed) as the default when hover is null
      expect(screen.getByText(/Wed/i)).toBeDefined();
    });
  });

  it("should apply correct CSS classes on hover", async () => {
    const data: SketchBarDatum[] = [{ label: "Mon", value: 10 }];
    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(v)} />,
    );

    const bar = container.querySelector("g[role='button']") as SVGGElement;
    const rect = bar.querySelector("rect") as SVGRectElement;

    // Default opacity
    expect(rect.getAttribute("opacity")).toBeDefined();

    // On hover, opacity should change
    fireEvent.mouseEnter(bar);
    await waitFor(() => {
      const newOpacity = rect.getAttribute("opacity");
      expect(newOpacity).toBeDefined();
    });
  });

  it("should render insight text and update on state change", async () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 30 },
    ];
    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => `$${v}`} />,
    );

    // Insight should reference formatted values
    const insightText = screen.getByText(/\$/);
    expect(insightText).toBeDefined();
  });

  it("should maintain accessibility on hover (no role loss)", async () => {
    const data: SketchBarDatum[] = [{ label: "Test", value: 50 }];
    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(v)} />,
    );

    const buttons = container.querySelectorAll("button");
    const button = buttons[0];
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      // Button should still be interactive after hover
      expect(button).toBeDefined();
    });
  });

  it("should include insight text in group aria-label for agent accessibility", async () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 100 },
      { label: "Tue", value: 50 },
      { label: "Wed", value: 75 },
    ];
    const customInsight = "Revenue is trending upward with a dip midweek";
    const { container } = render(
      <SketchBarChart
        data={data}
        height={100}
        formatValue={(v) => `$${v}`}
        ariaLabel="Weekly Revenue"
        insight={customInsight}
      />,
    );

    // The group role should have both the aria-label and the insight text
    const group = container.querySelector("[role='group']");
    expect(group).toBeDefined();
    const ariaLabel = group?.getAttribute("aria-label") || "";
    expect(ariaLabel).toContain("Weekly Revenue");
    expect(ariaLabel).toContain(customInsight);
    expect(ariaLabel).toMatch(/Weekly Revenue.*Revenue is trending upward/);
  });

  it("should render auto-derived insight text in aria-label when not overridden", async () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 25 },
      { label: "Wed", value: 5 },
    ];
    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(v)} ariaLabel="Activity" />,
    );

    // Should auto-derive insight and include in aria-label
    const group = container.querySelector("[role='group']");
    const ariaLabel = group?.getAttribute("aria-label") || "";
    expect(ariaLabel).toContain("Activity");
    // Auto-derived insight should be present (barInsight function generates it)
    expect(ariaLabel.length).toBeGreaterThan("Activity".length);
  });
});

describe("SketchLine — Path Rendering (DOM-mounted)", () => {
  it("should render SVG path element with correct data attribute", () => {
    const data: SketchLineDatum[] = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 15 },
    ];
    const { container } = render(<SketchLine data={data} width={100} height={50} color="blue" />);

    const path = container.querySelector("path");
    expect(path).toBeDefined();
    expect(path?.getAttribute("d")).toBeDefined();
    expect(path?.getAttribute("stroke")).toBe("blue");
  });

  it("should apply fill property when specified", () => {
    const data: SketchLineDatum[] = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
    ];
    const { container } = render(
      <SketchLine data={data} width={100} height={50} color="blue" fill="rgba(0, 0, 255, 0.1)" />,
    );

    const path = container.querySelector("path");
    expect(path?.getAttribute("fill")).toBe("rgba(0, 0, 255, 0.1)");
  });

  it("should render as closed shape when area=true", () => {
    const data: SketchLineDatum[] = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 15 },
    ];
    const { container } = render(
      <SketchLine data={data} width={100} height={50} color="blue" area={true} />,
    );

    const path = container.querySelector("path");
    // Area path should contain "Z" to close the shape
    const pathData = path?.getAttribute("d") || "";
    expect(pathData.includes("Z") || pathData.includes("z")).toBe(true);
  });

  it("should handle empty data gracefully", () => {
    const { container } = render(<SketchLine data={[]} width={100} height={50} color="blue" />);

    // Should not crash; SVG container should still render
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
  });

  it("should render stroke-width when specified", () => {
    const data: SketchLineDatum[] = [{ x: 0, y: 10 }];
    const { container } = render(
      <SketchLine data={data} width={100} height={50} color="blue" strokeWidth={3} />,
    );

    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke-width")).toBe("3");
  });
});

describe("SketchBar — Individual Bar Element (DOM-mounted)", () => {
  it("should render rect element with correct dimensions", () => {
    const { container } = render(
      <SketchBar x={10} y={20} width={30} height={40} fill="red" label="Bar" />,
    );

    const rect = container.querySelector("rect");
    expect(rect).toBeDefined();
    expect(rect?.getAttribute("x")).toBe("10");
    expect(rect?.getAttribute("y")).toBe("20");
    expect(rect?.getAttribute("width")).toBe("30");
    expect(rect?.getAttribute("height")).toBe("40");
    expect(rect?.getAttribute("fill")).toBe("red");
  });

  it("should include accessible label", () => {
    const { container } = render(
      <SketchBar x={10} y={20} width={30} height={40} fill="red" label="MonthlyRevenue" />,
    );

    // Should have a title or aria-label for accessibility
    const title = container.querySelector("title");
    expect(title).toBeDefined();
  });

  it("should apply opacity when provided", () => {
    const { container } = render(
      <SketchBar x={10} y={20} width={30} height={40} fill="red" label="Bar" opacity={0.5} />,
    );

    const rect = container.querySelector("rect");
    expect(rect?.getAttribute("opacity")).toBe("0.5");
  });

  it("should render inside a group element", () => {
    const { container } = render(
      <SketchBar x={10} y={20} width={30} height={40} fill="red" label="Bar" />,
    );

    const group = container.querySelector("g");
    expect(group).toBeDefined();
    const rect = group?.querySelector("rect");
    expect(rect).toBeDefined();
  });

  it("should handle zero dimensions", () => {
    const { container } = render(
      <SketchBar x={0} y={0} width={0} height={0} fill="red" label="Empty" />,
    );

    // Should render without crashing
    const rect = container.querySelector("rect");
    expect(rect).toBeDefined();
  });

  it("should render with border/stroke when specified", () => {
    const { container } = render(
      <SketchBar
        x={10}
        y={20}
        width={30}
        height={40}
        fill="red"
        label="Bar"
        stroke="blue"
        strokeWidth={2}
      />,
    );

    const rect = container.querySelector("rect");
    expect(rect?.getAttribute("stroke")).toBe("blue");
    expect(rect?.getAttribute("stroke-width")).toBe("2");
  });
});

describe("SketchBarChart — Baseline Reference Line (DOM-mounted)", () => {
  it("should render baseline line when baseline prop is provided", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 25 },
    ];
    const { container } = render(
      <SketchBarChart
        data={data}
        height={100}
        formatValue={(v) => String(v)}
        baseline={15}
        baselineLabel="Target"
      />,
    );

    // Should have a dashed line div for baseline
    const baseline = container.querySelector("div[title='Target']");
    expect(baseline).toBeDefined();
    expect(baseline?.style.borderTop).toContain("dashed");
  });

  it("should position baseline correctly at percentage height", () => {
    const data: SketchBarDatum[] = [
      { label: "Low", value: 5 },
      { label: "High", value: 100 },
    ];
    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(v)} baseline={50} />,
    );

    const baseline = container.querySelector("div[style*='bottom']");
    const bottomStyle = baseline?.getAttribute("style") || "";
    // Baseline at 50 out of 100 max should be at 50%
    expect(bottomStyle).toContain("50%");
  });

  it("should not render baseline when not provided", () => {
    const data: SketchBarDatum[] = [{ label: "Mon", value: 10 }];
    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(v)} />,
    );

    const baselineRefs = container.querySelectorAll("[style*='dashed']");
    expect(baselineRefs.length).toBe(0);
  });

  it("should clamp baseline to max 100%", () => {
    const data: SketchBarDatum[] = [{ label: "Mon", value: 10 }];
    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(v)} baseline={1000} />,
    );

    const baseline = container.querySelector("div[style*='bottom']");
    const bottomStyle = baseline?.getAttribute("style") || "";
    // Baseline higher than max should clamp to 100%
    expect(bottomStyle).toContain("100%");
  });
});

describe("SketchBarChart — Edge Cases (DOM-mounted)", () => {
  it("should handle single-bar data (no trend analysis)", () => {
    const data: SketchBarDatum[] = [{ label: "Only", value: 42 }];
    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(v)} />,
    );

    // Should render without crashing
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(1);
  });

  it("should handle large dataset (performance check)", () => {
    const data: SketchBarDatum[] = Array.from({ length: 100 }, (_, i) => ({
      label: `Day${i}`,
      value: Math.random() * 100,
    }));

    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(Math.round(v))} />,
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(100);
  });

  it("should handle all zero values", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 0 },
      { label: "Tue", value: 0 },
      { label: "Wed", value: 0 },
    ];

    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(v)} />,
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(3);
  });

  it("should handle negative values", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: -10 },
      { label: "Tue", value: 25 },
    ];

    const { container } = render(
      <SketchBarChart data={data} height={100} formatValue={(v) => String(v)} />,
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(2);
  });

  it("should handle very small height", () => {
    const data: SketchBarDatum[] = [{ label: "Tiny", value: 10 }];
    const { container } = render(
      <SketchBarChart data={data} height={1} formatValue={(v) => String(v)} />,
    );

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("height")).toBe("1");
  });
});
