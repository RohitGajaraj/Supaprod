import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SketchBarChart, SketchLine, SketchBar } from "../Sketch";
import type { SketchBarDatum } from "../Sketch";

/**
 * DOM-MOUNTED TESTS FOR SKETCH COMPONENTS
 *
 * Gap 1 remediation: These tests render components into a real DOM (happy-dom)
 * and verify interactive behavior (state changes, event handling, styling).
 * Previous test suites used hand-rolled JSX mirrors that couldn't catch:
 *   - State swapping on hover (activeIdx tracking in SketchBarChart)
 *   - Race conditions in hover-leave handlers
 *   - Inline style application (glow spotlight, dimming of non-active bars)
 *   - Accessible attribute presence (aria-labels, roles)
 *
 * Real component contracts under test (see ../Sketch.tsx):
 *   - SketchBarChart: bars are <button> elements labeled "label: value"; the
 *     active bar's readout floats above it; hover/focus move the active index,
 *     defaulting to the last bar.
 *   - SketchLine: data is number[]; double jittered pencil pass, never filled;
 *     dashed baseline only when inside the data range; null under 2 points.
 *   - SketchBar: pct/seed/color/trackH; decorative svg (hatch + outline paths)
 *     with deterministic seeded jitter.
 *
 * Note: React synthesizes onMouseEnter/onMouseLeave from native mouseover and
 * mouseout, so tests fire mouseOver/mouseOut to drive the hover handlers.
 */

/* The floating value readout (value + label above the active bar) is an
   aria-hidden div. The optional baseline line, when present, is an earlier
   aria-hidden div, so the readout is always the last one. */
function getReadout(container: HTMLElement): HTMLElement {
  const nodes = container.querySelectorAll("div[aria-hidden='true']");
  return nodes[nodes.length - 1] as HTMLElement;
}

describe("SketchBarChart — Interactive Hover State (DOM-mounted)", () => {
  it("should render bars as buttons with aria-label accessibility attributes", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 25 },
    ];
    const { container } = render(
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} />,
    );
    // Each bar is a real <button> carrying "label: value" for screen readers
    const bars = container.querySelectorAll("button[aria-label]");
    expect(bars.length).toBe(data.length);
    expect(bars[0]?.getAttribute("aria-label")).toBe("Mon: 10");
    expect(bars[1]?.getAttribute("aria-label")).toBe("Tue: 25");
  });

  it("should swap activeIdx on bar hover (state machine test)", async () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 25 },
      { label: "Wed", value: 15 },
    ];
    const { container } = render(
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} />,
    );

    const buttons = container.querySelectorAll("button");

    // Initial state: no hover, the readout shows the LAST bar (default active)
    expect(getReadout(container).textContent).toContain("Wed");

    // Hover over the second bar: activeIdx should follow, readout shows Tue
    fireEvent.mouseOver(buttons[1] as HTMLElement);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Tue");
    });
    expect(getReadout(container).textContent).toContain("25");

    // Hover back to the first bar
    fireEvent.mouseOver(buttons[0] as HTMLElement);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Mon");
    });
  });

  it("should detect and bypass stale onMouseLeave events (race guard logic)", async () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 25 },
      { label: "Wed", value: 15 },
    ];
    const { container } = render(
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} />,
    );

    const buttons = container.querySelectorAll("button");
    const btn0 = buttons[0] as HTMLElement;
    const btn1 = buttons[1] as HTMLElement;

    // Simulate the problematic sequence:
    // 1. Hover over btn0 -> activeIdx becomes 0, readout shows "Mon"
    fireEvent.mouseOver(btn0);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Mon");
    });

    // 2. Hover over btn1 -> activeIdx becomes 1, readout shows "Tue"
    fireEvent.mouseOver(btn1);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Tue");
    });

    // 3. Leave btn0 (a stale event from the old hover) -> should NOT reset
    //    because the functional updater checks h === i before clearing.
    //    Since btn1 is now active (h === 1), leaving btn0 (i === 0) does nothing.
    fireEvent.mouseOut(btn0);

    // 4. Verify "Tue" is STILL shown (not reverted to default or "Mon")
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Tue");
    });

    // 5. Now leave btn1 intentionally -> activeIdx falls back to the default
    fireEvent.mouseOut(btn1);
    await waitFor(() => {
      // The default active bar is the last one (Wed) when hover is null
      expect(getReadout(container).textContent).toContain("Wed");
    });
  });

  it("should detect and bypass stale onBlur events (focus race guard logic)", async () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 25 },
      { label: "Wed", value: 15 },
    ];
    const { container } = render(
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} />,
    );

    const buttons = container.querySelectorAll("button");
    const btn0 = buttons[0] as HTMLElement;
    const btn1 = buttons[1] as HTMLElement;

    // Simulate the problematic sequence (equivalent to hover race condition):
    // 1. Focus on btn0 -> activeIdx becomes 0, readout shows "Mon"
    btn0.focus();
    fireEvent.focus(btn0);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Mon");
    });

    // 2. Focus on btn1 -> activeIdx becomes 1, readout shows "Tue"
    btn1.focus();
    fireEvent.focus(btn1);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Tue");
    });

    // 3. Blur btn0 (a stale event from the old focus) -> should NOT reset
    //    because the functional updater checks h === i before clearing.
    //    Since btn1 is now active (h === 1), blurring btn0 (i === 0) does nothing.
    fireEvent.blur(btn0);

    // 4. Verify "Tue" is STILL shown (not reverted to default or "Mon")
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Tue");
    });

    // 5. Now blur btn1 intentionally -> activeIdx falls back to the default
    fireEvent.blur(btn1);
    await waitFor(() => {
      // The default active bar is the last one (Wed) when focus is lost
      expect(getReadout(container).textContent).toContain("Wed");
    });
  });
  it("should spotlight the hovered bar and dim the others (inline styles)", async () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 25 },
    ];
    const { container } = render(
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} />,
    );

    const buttons = container.querySelectorAll("button");
    const first = buttons[0] as HTMLElement;
    const second = buttons[1] as HTMLElement;

    // Default: the last bar is active (glow filter); nothing is dimmed yet
    expect(second.style.filter).toContain("drop-shadow");
    expect(first.style.filter).toBe("none");
    expect(first.style.opacity).toBe("1");
    expect(second.style.opacity).toBe("1");

    // Hover the first bar: it takes the glow, the non-active bar dims
    fireEvent.mouseOver(first);
    await waitFor(() => {
      expect(first.style.filter).toContain("drop-shadow");
      expect(second.style.opacity).toBe("0.42");
    });
  });

  it("should render the auto-derived insight text using formatValue", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 30 },
    ];
    render(<SketchBarChart data={data} trackH={100} formatValue={(v) => `$${v}`} />);

    // barInsight derives "Up 200% since Mon; peak $30 on Tue." from the series;
    // the peak value must come through the caller's formatter.
    const insightText = screen.getByText(/Up 200% since Mon; peak \$30 on Tue/);
    expect(insightText).toBeDefined();
  });

  it("should maintain accessibility on hover (no role loss)", async () => {
    const data: SketchBarDatum[] = [{ label: "Test", value: 50 }];
    const { container } = render(
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} />,
    );

    const button = container.querySelectorAll("button")[0] as HTMLElement;
    fireEvent.mouseOver(button);

    await waitFor(() => {
      // Still a labeled, interactive button after hover
      expect(button.getAttribute("aria-label")).toBe("Test: 50");
      expect(button.getAttribute("type")).toBe("button");
    });
  });

  it("should support Tab-order keyboard navigation (focus follows Tab key)", async () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 25 },
      { label: "Wed", value: 15 },
    ];
    const { container } = render(
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} />,
    );

    const buttons = container.querySelectorAll("button");
    const btn0 = buttons[0] as HTMLElement;
    const btn1 = buttons[1] as HTMLElement;
    const btn2 = buttons[2] as HTMLElement;

    // Initial state: no button has focus
    expect(document.activeElement).not.toBe(btn0);

    // Programmatically focus the first button (simulating Tab into the group)
    btn0.focus();
    expect(document.activeElement).toBe(btn0);
    // Focus should trigger onFocus, updating activeIdx to 0
    fireEvent.focus(btn0);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Mon");
    });

    // Focus second button (simulating Tab forward)
    btn1.focus();
    expect(document.activeElement).toBe(btn1);
    fireEvent.focus(btn1);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Tue");
    });

    // Focus third button
    btn2.focus();
    expect(document.activeElement).toBe(btn2);
    fireEvent.focus(btn2);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Wed");
    });

    // Blur the focused button: activeIdx falls back to default (last bar)
    fireEvent.blur(btn2);
    await waitFor(() => {
      // Without focus, the readout should revert to the last bar (default)
      expect(getReadout(container).textContent).toContain("Wed");
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
        trackH={100}
        formatValue={(v) => `$${v}`}
        ariaLabel="Weekly Revenue"
        insight={customInsight}
      />,
    );

    // The group role should have both the aria-label and the insight text
    const group = container.querySelector("[role='group']");
    expect(group).not.toBeNull();
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
      <SketchBarChart
        data={data}
        trackH={100}
        formatValue={(v) => String(v)}
        ariaLabel="Activity"
      />,
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
  it("should render the double pencil pass with the given stroke color", () => {
    const { container } = render(<SketchLine data={[10, 20, 15]} w={100} h={50} color="blue" />);

    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(2);
    for (const path of Array.from(paths)) {
      expect(path.getAttribute("stroke")).toBe("blue");
      const d = path.getAttribute("d") || "";
      expect(d.startsWith("M")).toBe(true);
      expect(d).not.toContain("NaN");
    }
    // Hand-set dot on the last point, with real coordinates
    const dot = container.querySelector("circle");
    expect(dot).not.toBeNull();
    expect(dot?.getAttribute("fill")).toBe("blue");
    expect(dot?.getAttribute("cy") || "").not.toContain("NaN");
  });

  it("should keep both pencil passes unfilled (a line, never an area)", () => {
    const { container } = render(<SketchLine data={[10, 20]} w={100} h={50} color="blue" />);

    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(2);
    for (const path of Array.from(paths)) {
      expect(path.getAttribute("fill")).toBe("none");
    }
  });

  it("should draw the dashed baseline only when it falls inside the data range", () => {
    // Inside the range: a straight dashed hairline (the one non-sketch mark)
    const inRange = render(<SketchLine data={[10, 20, 15]} w={100} h={50} baseline={15} />);
    const line = inRange.container.querySelector("line");
    expect(line).not.toBeNull();
    expect(line?.getAttribute("stroke-dasharray")).toBe("3 3");

    // Outside the range: not drawn (reference Sparkline contract)
    const outOfRange = render(<SketchLine data={[10, 20, 15]} w={100} h={50} baseline={99} />);
    expect(outOfRange.container.querySelector("line")).toBeNull();
  });

  it("should render nothing for fewer than two points", () => {
    // Empty series and a single point both have no line to sketch
    const empty = render(<SketchLine data={[]} w={100} h={50} />);
    expect(empty.container.querySelector("svg")).toBeNull();

    const single = render(<SketchLine data={[10]} w={100} h={50} />);
    expect(single.container.querySelector("svg")).toBeNull();
  });

  it("should handle flat series (all identical values) without crashing and draw baseline when it matches the data range", () => {
    // Flat series where all points have the same value (e.g., [50, 50, 50])
    // sketchLineGeometry should compute a path where all y-coords map to the same position
    const { container } = render(<SketchLine data={[50, 50, 50]} w={100} h={50} baseline={50} />);

    // Should render the SVG and paths without NaN
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();

    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(2); // Double pencil pass

    // Both paths should have valid d attributes (no NaN)
    for (const path of Array.from(paths)) {
      const d = path.getAttribute("d") || "";
      expect(d).not.toContain("NaN");
    }

    // The baseline at 50 (the flat value) should be drawn because it's inside the data range
    const line = container.querySelector("line");
    expect(line).not.toBeNull();
    expect(line?.getAttribute("stroke-dasharray")).toBe("3 3");
  });

  it("should use the fixed pencil stroke weights (heavy pass + light pass)", () => {
    const { container } = render(<SketchLine data={[10, 20]} w={100} h={50} />);

    const paths = container.querySelectorAll("path");
    expect(paths[0]?.getAttribute("stroke-width")).toBe("1.3");
    expect(paths[0]?.getAttribute("opacity")).toBe("0.85");
    expect(paths[1]?.getAttribute("stroke-width")).toBe("0.9");
    expect(paths[1]?.getAttribute("opacity")).toBe("0.45");
  });
});

describe("SketchBar — Individual Bar Element (DOM-mounted)", () => {
  it("should render an svg with hatch and outline paths at the track height", () => {
    const { container } = render(<SketchBar pct={60} seed={1} trackH={72} />);

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("height")).toBe("72");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 60 72");
    expect(svg?.getAttribute("preserveAspectRatio")).toBe("none");
    expect(container.querySelectorAll("path").length).toBe(2);
  });

  it("should be decorative: aria-hidden, labeling lives on the parent control", () => {
    const { container } = render(<SketchBar pct={60} seed={1} />);

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("should apply the fixed pencil opacities (light hatch, heavy outline)", () => {
    const { container } = render(<SketchBar pct={60} seed={1} />);

    const paths = container.querySelectorAll("path");
    expect(paths[0]?.getAttribute("opacity")).toBe("0.38");
    expect(paths[1]?.getAttribute("opacity")).toBe("0.85");
  });

  it("should forward the color prop to both strokes", () => {
    const { container } = render(<SketchBar pct={60} seed={1} color="red" />);

    const paths = container.querySelectorAll("path");
    expect(paths[0]?.getAttribute("stroke")).toBe("red");
    expect(paths[1]?.getAttribute("stroke")).toBe("red");
  });

  it("should handle pct=0 without crashing", () => {
    const { container } = render(<SketchBar pct={0} seed={1} />);

    const outline = container.querySelectorAll("path")[1];
    const d = outline?.getAttribute("d") || "";
    expect(d.startsWith("M")).toBe(true);
    expect(d).not.toContain("NaN");
  });

  it("should keep jitter deterministic: same seed same geometry, new seed new geometry", () => {
    const dOf = (r: ReturnType<typeof render>) =>
      r.container.querySelectorAll("path")[1]?.getAttribute("d") || "";

    const a = render(<SketchBar pct={40} seed={3} />);
    const b = render(<SketchBar pct={40} seed={3} />);
    const c = render(<SketchBar pct={40} seed={4} />);

    expect(dOf(a).length).toBeGreaterThan(0);
    expect(dOf(b)).toBe(dOf(a));
    expect(dOf(c)).not.toBe(dOf(a));
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
        trackH={100}
        formatValue={(v) => String(v)}
        baseline={15}
        baselineLabel="Target"
      />,
    );

    // The baseline is a titled, positioned div. Note: happy-dom mangles the
    // borderTop shorthand readback when it holds a CSS variable, so assert
    // presence + position, not the dash style string.
    const baseline = container.querySelector("div[title='Target']") as HTMLElement | null;
    expect(baseline).not.toBeNull();
    // baseline 15 of max 25 sits at 60% from the floor
    expect(baseline?.style.bottom).toBe("60%");
  });

  it("should position baseline correctly at percentage height", () => {
    const data: SketchBarDatum[] = [
      { label: "Low", value: 5 },
      { label: "High", value: 100 },
    ];
    const { container } = render(
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} baseline={50} />,
    );

    // Unlabeled baselines carry the default "baseline" title
    const baseline = container.querySelector("div[title='baseline']") as HTMLElement | null;
    expect(baseline).not.toBeNull();
    // Baseline at 50 out of 100 max should be at 50%
    expect(baseline?.style.bottom).toBe("50%");
  });

  it("should not render baseline when not provided", () => {
    const data: SketchBarDatum[] = [{ label: "Mon", value: 10 }];
    const { container } = render(
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} />,
    );

    // No titled baseline div exists in the chart at all
    expect(container.querySelector("div[title]")).toBeNull();
  });

  it("should clamp baseline to max 100%", () => {
    const data: SketchBarDatum[] = [{ label: "Mon", value: 10 }];
    const { container } = render(
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} baseline={1000} />,
    );

    // A baseline above every bar becomes the scale max and sits at the top,
    // never above 100%
    const baseline = container.querySelector("div[title='baseline']") as HTMLElement | null;
    expect(baseline).not.toBeNull();
    expect(baseline?.style.bottom).toBe("100%");
  });
});

describe("SketchBarChart — Edge Cases (DOM-mounted)", () => {
  it("should handle single-bar data (no trend analysis)", () => {
    const data: SketchBarDatum[] = [{ label: "Only", value: 42 }];
    const { container } = render(
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} />,
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
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(Math.round(v))} />,
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
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} />,
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
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} />,
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(2);
  });

  it("should handle very small track height", () => {
    const data: SketchBarDatum[] = [{ label: "Tiny", value: 10 }];
    const { container } = render(
      <SketchBarChart data={data} trackH={1} formatValue={(v) => String(v)} />,
    );

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("height")).toBe("1");
  });

  /**
   * GAP 3: Cross-modality race guard (mouse + keyboard combined).
   *
   * Tests a scenario where keyboard focus and mouse events interact:
   * - Mouse hovers over bar 0, setting activeIdx = 0
   * - Keyboard focus moves to bar 1, setting activeIdx = 1
   * - Mouse blur event from bar 0 fires (stale, delayed mouseOut)
   *
   * The functional updater on blur should check h === i before clearing,
   * so a stale mouseleave from bar 0 should NOT reset activeIdx when bar 1
   * is keyboard-focused.
   */
  it("should maintain focus state when stale mouse events arrive during keyboard focus", async () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 25 },
      { label: "Wed", value: 15 },
    ];
    const { container } = render(
      <SketchBarChart data={data} trackH={100} formatValue={(v) => String(v)} />,
    );

    const buttons = container.querySelectorAll("button");
    const btn0 = buttons[0] as HTMLElement;
    const btn1 = buttons[1] as HTMLElement;

    // 1. Hover over btn0 → activeIdx = 0, readout shows "Mon"
    fireEvent.mouseOver(btn0);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Mon");
    });

    // 2. Focus btn1 via keyboard → activeIdx = 1, readout shows "Tue"
    btn1.focus();
    fireEvent.focus(btn1);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Tue");
    });

    // 3. Stale mouseOut from btn0 fires (cross-modality race)
    //    The functional updater checks h === i, and since btn1 is now focused
    //    (h = 1), the leave event from btn0 (i = 0) should be ignored.
    fireEvent.mouseOut(btn0);

    // 4. Verify btn1 is STILL active (not reset by the stale mouseOut)
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Tue");
    });

    // 5. Now blur btn1 intentionally → activeIdx falls back to default (last bar)
    btn1.blur();
    fireEvent.blur(btn1);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("Wed");
    });
  });

  /**
   * GAP 4: Data shrinking without bounds check.
   *
   * Tests a crash scenario: if data prop shrinks while a bar is active,
   * activeIdx could exceed the new data.length - 1, causing an out-of-bounds
   * access. The component does NOT clamp activeIdx, so this would crash:
   *
   *   const active = data[activeIdx]!;
   *   const on = i === activeIdx;  // on line 397 during render
   *
   * This test triggers the scenario by rerendering with fewer bars while
   * one is hovered, then verifies the component doesn't crash.
   */
  it("should not crash when data shrinks while a bar is hovered", async () => {
    const initialData: SketchBarDatum[] = [
      { label: "A", value: 10 },
      { label: "B", value: 25 },
      { label: "C", value: 15 },
      { label: "D", value: 30 },
      { label: "E", value: 20 },
    ];
    const { container, rerender } = render(
      <SketchBarChart data={initialData} trackH={100} formatValue={(v) => String(v)} />,
    );

    const buttons = container.querySelectorAll("button");
    const btn3 = buttons[3] as HTMLElement;

    // 1. Hover over the 4th bar (index 3) → activeIdx = 3
    fireEvent.mouseOver(btn3);
    await waitFor(() => {
      expect(getReadout(container).textContent).toContain("D");
    });

    // 2. Shrink data to 2 bars (removing indices 2, 3, 4)
    //    activeIdx is still 3, but data.length is now 2, so activeIdx > data.length - 1
    const shrunkData: SketchBarDatum[] = [
      { label: "A", value: 10 },
      { label: "B", value: 25 },
    ];

    // 3. Rerender with smaller data array
    //    If the component doesn't clamp activeIdx, this will try to access
    //    data[3] which is undefined, and the ! assertion will hide the error.
    //    If it crashes or throws, that's the bug we're detecting.
    expect(() => {
      rerender(<SketchBarChart data={shrunkData} trackH={100} formatValue={(v) => String(v)} />);
    }).not.toThrow();

    // 4. Verify the component still renders (fallback to last bar)
    const newButtons = container.querySelectorAll("button");
    expect(newButtons.length).toBe(2);
    expect(getReadout(container).textContent).toBeDefined();
  });
});
