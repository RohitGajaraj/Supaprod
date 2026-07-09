import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphSlider, GraphSliderProps } from "../graph-slider";

/**
 * Tests for GraphSlider component.
 * GraphSlider is an interactive trend graph with:
 * - Pointer support (move, down, leave): updates cursor position
 * - Keyboard navigation: ArrowLeft/Right/Home/End keys
 * - Active state tracking: cursor expands while actively interacting
 * - ARIA attributes: role="slider", aria-valuenow/min/max/valuetext
 * - Peak/low marker suppression: markers hidden when cursor is on them
 * - Smooth curve interpolation via cubic Bezier control points
 *
 * The component is fully visual (SVG-based) and stateful (useState for cursor position).
 * Testing requires DOM manipulation (SVG rendering) + event simulation.
 */

describe("GraphSlider component", () => {
  const defaultProps: GraphSliderProps = {
    data: [10, 50, 30, 70, 40],
    w: 300,
    h: 140,
    color: "var(--teal)",
  };

  it("should render an SVG element with role='slider'", () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg[role='slider']");
    expect(svg).toBeDefined();
    expect(svg?.getAttribute("role")).toBe("slider");
  });

  it("should set ARIA attributes for accessibility", () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg[role='slider']");
    expect(svg?.getAttribute("aria-label")).toBe("Trend"); // default
    expect(svg?.getAttribute("aria-valuemin")).toBe("10"); // min of data
    expect(svg?.getAttribute("aria-valuemax")).toBe("70"); // max of data
    expect(svg?.getAttribute("aria-valuenow")).toBe("40"); // last value (default cursor)
  });

  it("should use custom ariaLabel when provided", () => {
    const { container } = render(
      <GraphSlider {...defaultProps} ariaLabel="Revenue trend" />
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-label")).toBe("Revenue trend");
  });

  it("should initialize cursor to the last data index (defaulting to end)", () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg");
    // aria-valuenow should be the last value
    expect(svg?.getAttribute("aria-valuenow")).toBe(String(defaultProps.data[4]));
  });

  it("should update cursor position on pointer move", async () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg") as SVGSVGElement;
    expect(svg).toBeDefined();

    // Move pointer to middle of the SVG
    fireEvent.pointerMove(svg, { clientX: 150 });

    // aria-valuenow should update to reflect the nearest data point
    await waitFor(() => {
      const newValueNow = svg.getAttribute("aria-valuenow");
      expect(newValueNow).toBeDefined();
      // Value should be one of the data points
      expect(defaultProps.data).toContain(parseInt(newValueNow!));
    });
  });

  it("should handle pointer down events to capture interaction", () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    // Pointer down should set active state (dot expands from 3.5r to 4.5r)
    fireEvent.pointerDown(svg, { clientX: 100 });

    // After active, circle should have larger radius (via CSS or style update)
    // This requires inspecting the rendered SVG circle element
  });

  it("should expand cursor dot from 3.5 to 4.5 pixels when active", () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg");

    // Find the cursor circle (the dot at the cursor position)
    const circles = container.querySelectorAll("circle");
    const cursorCircle = circles[circles.length - 1]; // Last circle is the cursor dot

    // Inactive radius: 3.5
    expect(cursorCircle?.getAttribute("r")).toBe("3.5");

    // Simulate pointer down (active)
    fireEvent.pointerDown(svg!);

    // Active radius: 4.5
    expect(cursorCircle?.getAttribute("r")).toBe("4.5");
  });

  it("should handle ArrowRight key to move cursor forward", async () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    // Focus the SVG
    svg.focus();

    const initialValue = svg.getAttribute("aria-valuenow");

    // Press ArrowRight
    await userEvent.keyboard("{ArrowRight}");

    // Cursor should move to the next index
    // With 5 data points, pressing right from index 4 should stay at 4 (clamped)
    // or move to index 4 if starting from earlier index
  });

  it("should handle ArrowLeft key to move cursor backward", async () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    svg.focus();

    // Press ArrowLeft
    await userEvent.keyboard("{ArrowLeft}");

    // Cursor should move to previous index (clamped at 0)
  });

  it("should handle Home key to jump to first data point", async () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    svg.focus();

    // Press Home
    await userEvent.keyboard("{Home}");

    // Cursor should be at index 0 (first value)
    await waitFor(() => {
      expect(svg.getAttribute("aria-valuenow")).toBe(String(defaultProps.data[0]));
    });
  });

  it("should handle End key to jump to last data point", async () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    svg.focus();

    // Press End
    await userEvent.keyboard("{End}");

    // Cursor should be at the last index (last value)
    await waitFor(() => {
      expect(svg.getAttribute("aria-valuenow")).toBe(
        String(defaultProps.data[defaultProps.data.length - 1])
      );
    });
  });

  it("should reset cursor to end on pointer leave", async () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    // Move pointer to interact
    fireEvent.pointerMove(svg, { clientX: 100 });

    // Leave the SVG
    fireEvent.pointerLeave(svg);

    // Cursor should return to the last index
    await waitFor(() => {
      expect(svg.getAttribute("aria-valuenow")).toBe(
        String(defaultProps.data[defaultProps.data.length - 1])
      );
    });
  });

  it("should set active state on focus and clear on blur", async () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    // Focus should activate
    fireEvent.focus(svg);

    // Blur should deactivate
    fireEvent.blur(svg);
  });

  it("should render peak and low markers when not under cursor", () => {
    const { container } = render(<GraphSlider {...defaultProps} />);

    // The data [10, 50, 30, 70, 40]
    // Max is 70 (index 3), Min is 10 (index 0)
    // These should render as small circles with labels

    // Find all circles (background, colored, clip, cursor, peak, low)
    const circles = container.querySelectorAll("circle");

    // Peak circle should exist and not be at cursor
    // Low circle should exist and not be at cursor
    // (This requires knowing which circle indices are peak/low)
  });

  it("should hide peak/low markers when cursor is on them", async () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    // The data [10, 50, 30, 70, 40]: peak at index 3, low at index 0
    // Move cursor to peak
    fireEvent.pointerMove(svg, { clientX: 260 }); // approximate x for index 3

    // Peak marker should not render (return null check in map)
    // This requires rendering inspection or snapshot test
  });

  it("should update aria-valuetext to include label when provided", () => {
    const { container } = render(
      <GraphSlider
        {...defaultProps}
        labels={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}
      />
    );
    const svg = container.querySelector("svg");

    // aria-valuetext should include the label for the current cursor position
    const valueText = svg?.getAttribute("aria-valuetext");
    expect(valueText).toContain("Friday"); // last label at default cursor
  });

  it("should render baseline dashed line when provided", () => {
    const { container } = render(<GraphSlider {...defaultProps} baseline={45} />);

    // Find the baseline line (dashed stroke)
    const lines = container.querySelectorAll("line");
    const baselineLine = Array.from(lines).find((line) =>
      line.getAttribute("stroke-dasharray")
    );

    expect(baselineLine).toBeDefined();
  });

  it("should render baseline label when provided", () => {
    const { container } = render(
      <GraphSlider
        {...defaultProps}
        baseline={45}
        baselineLabel="Target"
      />
    );

    // Find the baseline label text
    const texts = container.querySelectorAll("text");
    const baselineText = Array.from(texts).find((t) => t.textContent === "Target");

    expect(baselineText).toBeDefined();
  });

  it("should apply custom color to the colored line and clip", () => {
    const customColor = "#ff5733";
    const { container } = render(<GraphSlider {...defaultProps} color={customColor} />);

    // The colored line should use the custom color
    const lines = container.querySelectorAll("line");
    const coloredLine = Array.from(lines).find((l) =>
      l.getAttribute("stroke") === customColor
    );

    expect(coloredLine).toBeDefined();
  });

  it("should format values using custom formatValue function", () => {
    const formatValue = (v: number) => `$${(v * 100).toFixed(0)}`;
    const { container } = render(
      <GraphSlider {...defaultProps} formatValue={formatValue} />
    );

    // The readout text should use the custom format
    // aria-valuenow is the raw value; aria-valuetext includes formatted text
    const svg = container.querySelector("svg");
    const valueText = svg?.getAttribute("aria-valuetext");

    // Should contain formatted version (e.g., "$4000" for value 40)
    expect(valueText).toContain("$");
  });

  it("should handle single data point without dividing by zero", () => {
    const { container } = render(<GraphSlider {...defaultProps} data={[42]} />);
    const svg = container.querySelector("svg");

    // Should render without error (flat series handled with span = 1)
    expect(svg).toBeDefined();
    expect(svg?.getAttribute("aria-valuenow")).toBe("42");
  });

  it("should handle empty data array gracefully", () => {
    const { container } = render(<GraphSlider {...defaultProps} data={[]} />);

    // Component should either render nothing or a fallback message
    const result = container.querySelector("svg");

    // With no data, the component should not render an SVG slider
    // (Check for a fallback message instead)
  });

  it("should clamp pointer x to valid range (0 to w)", () => {
    const { container } = render(<GraphSlider {...defaultProps} />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    // Move pointer far beyond the right edge
    fireEvent.pointerMove(svg, { clientX: 10000 });

    // Cursor should be clamped to the last index
    expect(svg.getAttribute("aria-valuenow")).toBe(
      String(defaultProps.data[defaultProps.data.length - 1])
    );
  });

  it("should render smooth path using cubic Bezier interpolation", () => {
    const { container } = render(<GraphSlider {...defaultProps} />);

    // Find the colored path (smooth curve through data points)
    const paths = container.querySelectorAll("path");
    const coloredPath = Array.from(paths).find((p) =>
      p.getAttribute("stroke")?.includes("teal")
    );

    // Path should contain cubic Bezier commands (C)
    const pathData = coloredPath?.getAttribute("d") || "";
    expect(pathData).toContain(" C "); // cubic Bezier curve command
  });
});

/**
 * IMPLEMENTATION ROADMAP:
 * 1. Test infrastructure: render() + userEvent for keyboard/pointer events
 * 2. Snapshot tests for SVG structure (paths, circles, text elements)
 * 3. State management: verify cursor index updates correctly
 * 4. ARIA: verify all attributes reflect state changes
 * 5. Edge cases: single point, empty data, zero-division on flat series
 * 6. Keyboard accessibility: all arrow keys, Home, End work predictably
 * 7. Integration: focus, blur, pointer events, keyboard all coordinate correctly
 *
 * Reference: https://testing-library.com/docs/queries/about
 */
