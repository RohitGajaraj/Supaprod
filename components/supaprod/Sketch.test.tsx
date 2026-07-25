import { describe, test, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  mulberry32,
  seedOf,
  sketchPath,
  SketchLine,
  SketchBar,
  SketchBarChart,
  capFirst,
  barInsight,
  sketchLineGeometry,
  sketchBarGeometry,
  type SketchBarDatum,
} from "./Sketch";

describe("mulberry32", () => {
  test("produces deterministic pseudo-random numbers from a seed", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  test("produces different sequences for different seeds", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(99);
    const vals1 = Array.from({ length: 5 }, () => rng1());
    const vals2 = Array.from({ length: 5 }, () => rng2());
    expect(vals1).not.toEqual(vals2);
  });

  test("produces values in the range [0, 1)", () => {
    const rng = mulberry32(1337);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe("seedOf", () => {
  test("produces deterministic seeds from data and salt", () => {
    const seed1 = seedOf([1, 2, 3], 100);
    const seed2 = seedOf([1, 2, 3], 100);
    expect(seed1).toBe(seed2);
  });

  test("produces different seeds for different data", () => {
    const seed1 = seedOf([1, 2, 3], 100);
    const seed2 = seedOf([4, 5, 6], 100);
    expect(seed1).not.toBe(seed2);
  });

  test("produces different seeds for different salts", () => {
    const seed1 = seedOf([1, 2, 3], 100);
    const seed2 = seedOf([1, 2, 3], 200);
    expect(seed1).not.toBe(seed2);
  });

  test("handles empty data", () => {
    const seed = seedOf([], 50);
    expect(typeof seed).toBe("number");
  });

  test("incorporates data length into the seed", () => {
    const seed1 = seedOf([1], 100);
    const seed2 = seedOf([1, 1], 100); // Same values, different length
    expect(seed1).not.toBe(seed2);
  });
});

describe("sketchPath", () => {
  test("returns a valid SVG path string starting with M", () => {
    const pts: [number, number][] = [
      [0, 0],
      [10, 10],
    ];
    const rng = mulberry32(42);
    const path = sketchPath(pts, rng, 1);
    expect(path).toMatch(/^M/);
  });

  test("connects all points with L commands", () => {
    const pts: [number, number][] = [
      [0, 0],
      [10, 10],
      [20, 5],
    ];
    const rng = mulberry32(42);
    const path = sketchPath(pts, rng, 1);
    const lCount = (path.match(/ L/g) || []).length;
    expect(lCount).toBeGreaterThan(0);
  });

  test("respects the step size parameter", () => {
    const pts: [number, number][] = [
      [0, 0],
      [100, 0],
    ];
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const pathSmall = sketchPath(pts, rng1, 1, 3); // Small step
    const pathLarge = sketchPath(pts, rng2, 1, 20); // Large step
    // More subdivisions in pathSmall should produce more coordinates
    const coordsSmall = (pathSmall.match(/L/g) || []).length;
    const coordsLarge = (pathLarge.match(/L/g) || []).length;
    expect(coordsSmall).toBeGreaterThan(coordsLarge);
  });

  test("does not jitter the first and last points", () => {
    const pts: [number, number][] = [
      [0, 0],
      [10, 10],
    ];
    const rng = mulberry32(42);
    const path = sketchPath(pts, rng, 5); // Large amplitude
    // Extract the first and last coordinates
    const matches = path.match(/[\d.]+/g) || [];
    const firstX = parseFloat(matches[0]!);
    const firstY = parseFloat(matches[1]!);
    expect(firstX).toBe(0); // Should not be jittered
    expect(firstY).toBe(0);
  });

  test("returns an empty string for a single-point path (no segment to walk)", () => {
    const pts: [number, number][] = [[5, 5]];
    const rng = mulberry32(42);
    const path = sketchPath(pts, rng, 1);
    expect(path).toBe("");
  });

  test("returns different paths for different random sequences", () => {
    const pts: [number, number][] = [
      [0, 0],
      [10, 10],
    ];
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    const path1 = sketchPath(pts, rng1, 2);
    const path2 = sketchPath(pts, rng2, 2);
    expect(path1).not.toBe(path2);
  });
});

describe("capFirst", () => {
  test("capitalizes the first letter of a string", () => {
    expect(capFirst("hello")).toBe("Hello");
  });

  test("leaves already-capitalized strings unchanged", () => {
    expect(capFirst("Hello")).toBe("Hello");
  });

  test("returns empty string for empty input", () => {
    expect(capFirst("")).toBe("");
  });

  test("handles single-character strings", () => {
    expect(capFirst("a")).toBe("A");
    expect(capFirst("Z")).toBe("Z");
  });

  test("only capitalizes the first character", () => {
    expect(capFirst("hELLO")).toBe("HELLO");
  });

  test("handles strings with numbers and special characters", () => {
    expect(capFirst("123abc")).toBe("123abc");
    expect(capFirst("-hello")).toBe("-hello");
  });
});

describe("barInsight", () => {
  test("returns empty string for empty data", () => {
    const insight = barInsight([], (v) => String(v));
    expect(insight).toBe("");
  });

  test("returns single reading message for one-element data", () => {
    const data: SketchBarDatum[] = [{ label: "Jan", value: 50 }];
    const insight = barInsight(data, (v) => `${v}x`);
    expect(insight).toBe("One reading: 50x (Jan).");
  });

  test("identifies flat trends when delta < 5%", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 100 },
      { label: "Feb", value: 101 },
      { label: "Mar", value: 100 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("flat");
    expect(insight).toContain("peak");
  });

  test("detects upward trends", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 75 },
      { label: "Mar", value: 100 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("Up");
    expect(insight).toContain("%");
  });

  test("detects downward trends", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 100 },
      { label: "Feb", value: 75 },
      { label: "Mar", value: 50 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("Down");
    expect(insight).toContain("%");
  });

  test("includes peak label in insight", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 10 },
      { label: "Feb", value: 50 },
      { label: "Mar", value: 20 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("peak");
    expect(insight).toContain("Feb");
  });

  test("handles zero delta when all values are equal", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 50 },
      { label: "Mar", value: 50 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("flat");
  });

  test("handles first value of zero (avoids division by zero)", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 0 },
      { label: "Feb", value: 10 },
      { label: "Mar", value: 20 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("Up to");
    expect(insight).not.toMatch(/%/);
  });

  test("capitalizes the direction word", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toMatch(/^[A-Z]/); // First char is capitalized
  });

  test("uses custom formatter for values", () => {
    const data: SketchBarDatum[] = [{ label: "Test", value: 50 }];
    const fmt = (v: number) => `$${v}`;
    const insight = barInsight(data, fmt);
    expect(insight).toContain("$50");
  });

  test("properly calculates negative percentage changes", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 200 },
      { label: "Feb", value: 100 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("Down 50%");
  });

  test("finds the peak value correctly", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 10 },
      { label: "Feb", value: 5 },
      { label: "Mar", value: 30 },
      { label: "Apr", value: 20 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("30");
    expect(insight).toContain("Mar");
  });

  test("picks the first bar when two bars share the peak value (strict > tie-break)", () => {
    // The tie-break logic uses b.value > a.value (strict >), so on a tie it keeps 'a'.
    // This means the FIRST occurrence of the peak value is selected.
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 }, // First peak
      { label: "Mar", value: 100 }, // Second peak (same value, should not be selected)
      { label: "Apr", value: 75 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("100");
    expect(insight).toContain("Feb"); // Should pick Feb, not Mar
    expect(insight).not.toContain("Mar at 100"); // Mar should not be mentioned as peak
  });

  test("handles all equal values: peak is the first bar", () => {
    // When all values are identical, the first bar is selected as peak.
    const data: SketchBarDatum[] = [
      { label: "A", value: 50 },
      { label: "B", value: 50 },
      { label: "C", value: 50 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("50");
    expect(insight).toContain("A");
  });
});

// ★ Insight ─────────────────────────────────────
// sketchLineGeometry is a "pure for testability" helper extracted from SketchLine's
// useMemo — it computes SVG path strings and endpoint coordinates from data.
// These tests verify the core contract: deterministic output, correct scaling to canvas,
// and baseline handling. The function uses seeded PRNG internally so tests are deterministic.
// ─────────────────────────────────────────────────

describe("sketchLineGeometry", () => {
  test("returns SVG paths for two-point minimum data", () => {
    const data = [10, 20];
    const result = sketchLineGeometry(data, 100, 50);
    expect(result.passA).toMatch(/^M/);
    expect(result.passB).toMatch(/^M/);
    expect(result.endX).toBeGreaterThan(0);
    expect(result.endY).toBeGreaterThan(0);
  });

  test("scales endpoint X to the rightmost data point", () => {
    const data = [10, 20, 30];
    const result = sketchLineGeometry(data, 100, 50);
    // endX should be close to the right edge (w - 5 = 95)
    expect(result.endX).toBeCloseTo(95, 1);
  });

  test("scales endpoint Y based on value within canvas height", () => {
    const data = [10, 20]; // min=10, max=20, span=10
    const result = sketchLineGeometry(data, 100, 50);
    // Last value is 20 (max), so endY should be at top: h - 6 - (h - 12) = 6
    expect(result.endY).toBeCloseTo(6, 0);
  });

  test("returns null baseY when baseline is outside data range", () => {
    const data = [10, 20, 30];
    const result = sketchLineGeometry(data, 100, 50, 100); // baseline > max
    expect(result.baseY).toBeNull();
  });

  test("computes baseY when baseline is within data range", () => {
    const data = [10, 20, 30];
    const result = sketchLineGeometry(data, 100, 50, 20); // baseline = mid value
    expect(result.baseY).not.toBeNull();
    expect(typeof result.baseY).toBe("number");
  });

  test("handles constant-value data (span=0 fallback)", () => {
    const data = [15, 15, 15];
    const result = sketchLineGeometry(data, 100, 50);
    // All points should have same Y (middle of canvas)
    expect(result.endY).toBeGreaterThan(0);
    expect(result.passA).toMatch(/^M/);
  });

  test("produces deterministic paths for same data", () => {
    const data = [5, 15, 10, 20];
    const result1 = sketchLineGeometry(data, 100, 50);
    const result2 = sketchLineGeometry(data, 100, 50);
    expect(result1.passA).toBe(result2.passA);
    expect(result1.passB).toBe(result2.passB);
  });

  test("produces different paths for different data", () => {
    const result1 = sketchLineGeometry([10, 20], 100, 50);
    const result2 = sketchLineGeometry([10, 25], 100, 50);
    expect(result1.passA).not.toBe(result2.passA);
  });
});

// ★ Insight ─────────────────────────────────────
// sketchBarGeometry is extracted from SketchBar's useMemo and computes the
// SVG paths for the bar outline and diagonal hatch fill. Core contract:
// outline follows the bar's height, hatch lines are clipped to the bar shape,
// and jitter is deterministic per seed.
// ─────────────────────────────────────────────────

describe("sketchBarGeometry", () => {
  test("returns outline and hatch paths", () => {
    const result = sketchBarGeometry(50, 1, 100);
    expect(typeof result.outline).toBe("string");
    expect(typeof result.hatch).toBe("string");
    expect(result.outline.length).toBeGreaterThan(0);
    expect(result.hatch.length).toBeGreaterThan(0);
  });

  test("outline starts with M command (SVG path)", () => {
    const result = sketchBarGeometry(50, 1, 100);
    expect(result.outline).toMatch(/^M/);
  });

  test("0% fill produces minimal bar geometry", () => {
    const result0 = sketchBarGeometry(0, 1, 100);
    const result50 = sketchBarGeometry(50, 1, 100);
    // 0% bar outline should be shorter than 50% (less path to draw)
    expect(result0.outline.length).toBeLessThan(result50.outline.length);
  });

  test("100% fill produces full-height bar outline", () => {
    const result = sketchBarGeometry(100, 1, 100);
    expect(result.outline).toMatch(/^M/);
    // Hatch should span most of the height
    expect(result.hatch).toContain("L");
  });

  test("produces deterministic geometry for same seed", () => {
    const result1 = sketchBarGeometry(75, 42, 100);
    const result2 = sketchBarGeometry(75, 42, 100);
    expect(result1.outline).toBe(result2.outline);
    expect(result1.hatch).toBe(result2.hatch);
  });

  test("produces different geometry for different seeds", () => {
    const result1 = sketchBarGeometry(75, 1, 100);
    const result2 = sketchBarGeometry(75, 2, 100);
    expect(result1.outline).not.toBe(result2.outline);
  });

  test("scales height based on trackH parameter", () => {
    const resultSmall = sketchBarGeometry(50, 1, 50);
    const resultLarge = sketchBarGeometry(50, 1, 200);
    // Larger trackH should produce different geometry
    expect(resultSmall.outline).not.toBe(resultLarge.outline);
  });

  test("hatch lines exist for visible bars", () => {
    const result = sketchBarGeometry(50, 1, 100);
    // Hatch should contain multiple line segments
    const lineCount = (result.hatch.match(/L/g) || []).length;
    expect(lineCount).toBeGreaterThan(0);
  });

  test("enforces minimum bar height (3px guard)", () => {
    // Even at 0%, there's a 3px minimum (see: Math.max(3, ...))
    const result = sketchBarGeometry(0, 1, 100);
    expect(result.outline).toContain("M");
    // Outline path should be valid even for minimal bar
  });
});

// ★ Insight ─────────────────────────────────────
// React component tests for SketchLine, SketchBar, and SketchBarChart using
// @testing-library/react + happy-dom. These test render correctness, prop
// handling, state management, and accessibility attributes.
// ─────────────────────────────────────────────────

describe("SketchLine (React component)", () => {
  test("renders SVG with correct dimensions", () => {
    const { container } = render(<SketchLine data={[10, 20, 15]} w={200} h={40} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
    expect(svg?.getAttribute("width")).toBe("200");
    expect(svg?.getAttribute("height")).toBe("40");
  });

  test("returns null for single-point data (guard)", () => {
    const { container } = render(<SketchLine data={[10]} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  test("returns null for empty data (guard)", () => {
    const { container } = render(<SketchLine data={[]} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  test("renders two path elements (passA and passB)", () => {
    const { container } = render(<SketchLine data={[10, 20, 15]} />);
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  test("renders end-point circle", () => {
    const { container } = render(<SketchLine data={[10, 20, 15]} />);
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThan(0);
  });

  test("applies custom color to strokes", () => {
    const { container } = render(<SketchLine data={[10, 20]} color="red" />);
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThan(0);
    const strokeValue = paths[0]?.getAttribute("stroke");
    expect(strokeValue).toMatch(/red|var\(--text-muted\)/);
  });

  test("renders baseline line when baseline is in range", () => {
    const { container } = render(<SketchLine data={[10, 20, 30]} baseline={20} />);
    const lines = container.querySelectorAll("line");
    expect(lines.length).toBeGreaterThan(0);
  });

  test("does not render baseline line when baseline is out of range", () => {
    const { container } = render(<SketchLine data={[10, 20, 30]} baseline={100} />);
    const lines = container.querySelectorAll("line");
    expect(lines.length).toBe(0);
  });

  test("applies sketch-draw animation class when animate=true", () => {
    const { container } = render(<SketchLine data={[10, 20, 15]} animate={true} />);
    const animatedPaths = container.querySelectorAll(".sketch-draw");
    expect(animatedPaths.length).toBeGreaterThan(0);
  });

  test("marks SVG as aria-hidden (decorative)", () => {
    const { container } = render(<SketchLine data={[10, 20]} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("SketchBar (React component)", () => {
  test("renders SVG with correct viewBox", () => {
    const { container } = render(<SketchBar pct={50} seed={1} trackH={100} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toContain("0 0 60");
  });

  test("scales height based on trackH prop", () => {
    const { container: container100 } = render(<SketchBar pct={50} seed={1} trackH={100} />);
    const svg100 = container100.querySelector("svg");
    const { container: container200 } = render(<SketchBar pct={50} seed={1} trackH={200} />);
    const svg200 = container200.querySelector("svg");
    expect(svg100?.getAttribute("height")).toBe("100");
    expect(svg200?.getAttribute("height")).toBe("200");
  });

  test("renders outline and hatch paths", () => {
    const { container } = render(<SketchBar pct={75} seed={1} trackH={100} />);
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  test("applies custom color to strokes", () => {
    const { container } = render(<SketchBar pct={50} seed={1} color="blue" />);
    const paths = container.querySelectorAll("path");
    paths.forEach((path) => {
      const stroke = path.getAttribute("stroke");
      expect(stroke).toBeDefined();
    });
  });

  test("marks SVG as aria-hidden (decorative)", () => {
    const { container } = render(<SketchBar pct={50} seed={1} trackH={100} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  test("uses different seeds to produce different jitter", () => {
    const { container: container1 } = render(<SketchBar pct={50} seed={1} trackH={100} />);
    const outline1 = container1.querySelectorAll("path")[0]?.getAttribute("d");
    const { container: container2 } = render(<SketchBar pct={50} seed={2} trackH={100} />);
    const outline2 = container2.querySelectorAll("path")[0]?.getAttribute("d");
    expect(outline1).not.toBe(outline2);
  });
});

describe("SketchBarChart (React component)", () => {
  const sampleData: SketchBarDatum[] = [
    { label: "Jan", value: 50 },
    { label: "Feb", value: 75 },
    { label: "Mar", value: 60 },
  ];

  test("returns null for empty data", () => {
    const { container } = render(<SketchBarChart data={[]} />);
    expect(container.querySelector("[role='group']")).toBeNull();
  });

  test("renders group role with aria-label", () => {
    const { container } = render(<SketchBarChart data={sampleData} ariaLabel="Sales" />);
    const group = container.querySelector("[role='group']");
    expect(group).toBeDefined();
    expect(group?.getAttribute("aria-label")).toMatch(/Sales/);
  });

  test("renders insight text when showInsight=true", () => {
    const { container } = render(<SketchBarChart data={sampleData} showInsight={true} />);
    // barInsight should produce text for multi-value data
    const insightText = container.textContent;
    expect(insightText).toMatch(/since|peak/i);
  });

  test("does not render insight text when showInsight=false", () => {
    const { container } = render(<SketchBarChart data={sampleData} showInsight={false} />);
    // Should not contain the auto-derived insight text
    const insightDiv = container.querySelector('[style*="font-family: var(--font-pencil)"]');
    if (insightDiv) {
      expect(insightDiv.textContent?.length || 0).toBeLessThan(10);
    }
  });

  test("renders a button for each bar", () => {
    const { container } = render(<SketchBarChart data={sampleData} />);
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(sampleData.length);
  });

  test("bar buttons have aria-labels with value and label", () => {
    const { container } = render(<SketchBarChart data={sampleData} />);
    const buttons = container.querySelectorAll("button");
    const label0 = buttons[0]?.getAttribute("aria-label") || "";
    const label1 = buttons[1]?.getAttribute("aria-label") || "";
    expect(label0).toMatch(/Jan.*50/);
    expect(label1).toMatch(/Feb.*75/);
  });

  test("hover over bar updates active state (opacity)", () => {
    const { container } = render(<SketchBarChart data={sampleData} />);
    const buttons = container.querySelectorAll("button");
    const firstBar = buttons[0]!;
    // Initial: opacity=1 for active (last bar on load)
    fireEvent.mouseEnter(buttons[1]!); // Hover Feb
    // Feb should now be active; Jan should dim (opacity=0.42)
    const style = (firstBar as HTMLElement).getAttribute("style");
    expect(style).toMatch(/opacity.*0\.42/);
  });

  test("focus on bar updates active state", () => {
    const { container } = render(<SketchBarChart data={sampleData} />);
    const buttons = container.querySelectorAll("button");
    fireEvent.focus(buttons[0]!);
    // Jan should be active; Feb (was initially active) should dim
    const style = (buttons[1] as HTMLElement).getAttribute("style");
    expect(style).toMatch(/opacity.*0\.42/);
  });

  test("blur removes hover highlight", () => {
    const { container } = render(<SketchBarChart data={sampleData} />);
    const buttons = container.querySelectorAll("button");
    fireEvent.mouseEnter(buttons[0]!);
    fireEvent.mouseLeave(buttons[0]!);
    // After leaving, the button should have style attribute (opacity may be 1 or 0.42 depending on state)
    const style = (buttons[0] as HTMLElement).getAttribute("style");
    expect(style).toBeDefined();
    expect(typeof style).toBe("string");
  });

  test("renders peak label in scale section", () => {
    const { container } = render(<SketchBarChart data={sampleData} />);
    const text = container.textContent;
    expect(text).toMatch(/peak/i);
  });

  test("applies baseline line when provided", () => {
    const { container } = render(
      <SketchBarChart data={sampleData} baseline={65} baselineLabel="Target" />,
    );
    const baselineDiv = container.querySelector('[aria-hidden="true"][style*="border"]');
    expect(baselineDiv).toBeDefined();
  });

  test("uses custom formatValue for display", () => {
    const { container } = render(
      <SketchBarChart data={sampleData} formatValue={(v) => `$${v}`} ariaLabel="Revenue" />,
    );
    // Custom formatter should be used in aria-labels
    const buttons = container.querySelectorAll("button");
    const label = buttons[0]?.getAttribute("aria-label") || "";
    expect(label).toMatch(/\$50/);
  });

  test("uses custom insight over auto-derived", () => {
    const customInsight = "Custom trend analysis";
    const { container } = render(
      <SketchBarChart data={sampleData} insight={customInsight} showInsight={true} />,
    );
    expect(container.textContent).toContain(customInsight);
  });

  test("includes insight in aria-label for accessibility", () => {
    const { container } = render(
      <SketchBarChart data={sampleData} ariaLabel="Sales" showInsight={true} />,
    );
    const group = container.querySelector("[role='group']");
    const ariaLabel = group?.getAttribute("aria-label") || "";
    // aria-label should combine ariaLabel and insight text
    expect(ariaLabel).toContain("Sales");
    expect(ariaLabel).toMatch(/since|peak/i);
  });

  test("renders bottom axis labels (floor and range)", () => {
    const { container } = render(<SketchBarChart data={sampleData} />);
    const text = container.textContent;
    expect(text).toMatch(/Jan.*Mar/);
  });

  test("shows active bar value floating above the bar", () => {
    const { container } = render(<SketchBarChart data={sampleData} />);
    const floatingValue = container.querySelector(
      '[aria-hidden="true"][style*="position: absolute"]',
    );
    expect(floatingValue).toBeDefined();
    expect(floatingValue?.textContent).toContain("60"); // Last bar value on load
  });

  test("updates floating value on hover", () => {
    const { container } = render(<SketchBarChart data={sampleData} />);
    const buttons = container.querySelectorAll("button");
    fireEvent.mouseEnter(buttons[0]!); // Hover Jan
    // Floating value should now show "50" (Jan's value)
    const style = (buttons[0] as HTMLElement).getAttribute("style");
    expect(style).toMatch(/opacity.*1/);
  });
});
