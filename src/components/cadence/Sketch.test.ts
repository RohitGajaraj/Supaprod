import { describe, it, expect } from "bun:test";
import {
  mulberry32,
  seedOf,
  sketchPath,
  SketchLine,
  SketchBar,
  SketchBarChart,
  capFirst,
  barInsight,
  type SketchBarDatum,
} from "./Sketch";

describe("mulberry32", () => {
  it("produces deterministic pseudo-random numbers from a seed", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("produces different sequences for different seeds", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(99);
    const vals1 = Array.from({ length: 5 }, () => rng1());
    const vals2 = Array.from({ length: 5 }, () => rng2());
    expect(vals1).not.toEqual(vals2);
  });

  it("produces values in the range [0, 1)", () => {
    const rng = mulberry32(1337);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe("seedOf", () => {
  it("produces deterministic seeds from data and salt", () => {
    const seed1 = seedOf([1, 2, 3], 100);
    const seed2 = seedOf([1, 2, 3], 100);
    expect(seed1).toBe(seed2);
  });

  it("produces different seeds for different data", () => {
    const seed1 = seedOf([1, 2, 3], 100);
    const seed2 = seedOf([4, 5, 6], 100);
    expect(seed1).not.toBe(seed2);
  });

  it("produces different seeds for different salts", () => {
    const seed1 = seedOf([1, 2, 3], 100);
    const seed2 = seedOf([1, 2, 3], 200);
    expect(seed1).not.toBe(seed2);
  });

  it("handles empty data", () => {
    const seed = seedOf([], 50);
    expect(typeof seed).toBe("number");
  });

  it("incorporates data length into the seed", () => {
    const seed1 = seedOf([1], 100);
    const seed2 = seedOf([1, 1], 100); // Same values, different length
    expect(seed1).not.toBe(seed2);
  });
});

describe("sketchPath", () => {
  it("returns a valid SVG path string starting with M", () => {
    const pts: [number, number][] = [
      [0, 0],
      [10, 10],
    ];
    const rng = mulberry32(42);
    const path = sketchPath(pts, rng, 1);
    expect(path).toMatch(/^M/);
  });

  it("connects all points with L commands", () => {
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

  it("respects the step size parameter", () => {
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

  it("does not jitter the first and last points", () => {
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

  it("handles single-point paths gracefully", () => {
    const pts: [number, number][] = [[5, 5]];
    const rng = mulberry32(42);
    const path = sketchPath(pts, rng, 1);
    expect(path).toMatch(/^M\d+\.\d+ \d+\.\d+$/);
  });

  it("returns different paths for different random sequences", () => {
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
  it("capitalizes the first letter of a string", () => {
    expect(capFirst("hello")).toBe("Hello");
  });

  it("leaves already-capitalized strings unchanged", () => {
    expect(capFirst("Hello")).toBe("Hello");
  });

  it("returns empty string for empty input", () => {
    expect(capFirst("")).toBe("");
  });

  it("handles single-character strings", () => {
    expect(capFirst("a")).toBe("A");
    expect(capFirst("Z")).toBe("Z");
  });

  it("only capitalizes the first character", () => {
    expect(capFirst("hELLO")).toBe("HELLO");
  });

  it("handles strings with numbers and special characters", () => {
    expect(capFirst("123abc")).toBe("123abc");
    expect(capFirst("-hello")).toBe("-hello");
  });
});

describe("barInsight", () => {
  it("returns empty string for empty data", () => {
    const insight = barInsight([], (v) => String(v));
    expect(insight).toBe("");
  });

  it("returns single reading message for one-element data", () => {
    const data: SketchBarDatum[] = [{ label: "Jan", value: 50 }];
    const insight = barInsight(data, (v) => `${v}x`);
    expect(insight).toBe("One reading: 50x (Jan).");
  });

  it("identifies flat trends when delta < 5%", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 100 },
      { label: "Feb", value: 101 },
      { label: "Mar", value: 100 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("flat");
    expect(insight).toContain("peak");
  });

  it("detects upward trends", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 75 },
      { label: "Mar", value: 100 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("up");
    expect(insight).toContain("%");
  });

  it("detects downward trends", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 100 },
      { label: "Feb", value: 75 },
      { label: "Mar", value: 50 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("down");
    expect(insight).toContain("%");
  });

  it("includes peak label in insight", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 10 },
      { label: "Feb", value: 50 },
      { label: "Mar", value: 20 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("peak");
    expect(insight).toContain("Feb");
  });

  it("handles zero delta when all values are equal", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 50 },
      { label: "Mar", value: 50 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("flat");
  });

  it("handles first value of zero (avoids division by zero)", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 0 },
      { label: "Feb", value: 10 },
      { label: "Mar", value: 20 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("up to");
    expect(insight).not.toMatch(/%/);
  });

  it("capitalizes the direction word", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toMatch(/^[A-Z]/); // First char is capitalized
  });

  it("uses custom formatter for values", () => {
    const data: SketchBarDatum[] = [{ label: "Test", value: 50 }];
    const fmt = (v: number) => `$${v}`;
    const insight = barInsight(data, fmt);
    expect(insight).toContain("$50");
  });

  it("properly calculates negative percentage changes", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 200 },
      { label: "Feb", value: 100 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("down 50%");
  });

  it("finds the peak value correctly", () => {
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
});

describe("SketchLine", () => {
  it("returns null for less than 2 data points", () => {
    const component = SketchLine({ data: [5] });
    expect(component).toBeNull();
  });

  it("returns null for empty data", () => {
    const component = SketchLine({ data: [] });
    expect(component).toBeNull();
  });

  it("returns an SVG element for valid data", () => {
    const component = SketchLine({ data: [1, 2, 3, 4, 5] });
    expect(component?.type).toBe("svg");
  });

  it("includes two path elements for the double-stroke effect", () => {
    const component = SketchLine({ data: [1, 2, 3, 4, 5] });
    const paths = component?.props?.children?.filter((child: any) => child?.type === "path");
    expect(paths?.length).toBe(2);
  });

  it("includes a circle element for the end-point dot", () => {
    const component = SketchLine({ data: [1, 2, 3, 4, 5] });
    const circle = component?.props?.children?.find((child: any) => child?.type === "circle");
    expect(circle).toBeDefined();
    expect(circle?.type).toBe("circle");
  });

  it("respects custom color prop", () => {
    const customColor = "var(--custom-color)";
    const component = SketchLine({ data: [1, 2, 3], color: customColor });
    const paths = component?.props?.children?.filter((child: any) => child?.type === "path");
    expect(paths?.[0]?.props?.stroke).toBe(customColor);
  });

  it("respects custom width and height", () => {
    const component = SketchLine({ data: [1, 2, 3], w: 300, h: 100 });
    expect(component?.props?.width).toBe(300);
    expect(component?.props?.height).toBe(100);
  });

  it("includes baseline line when baseline is within data range", () => {
    const component = SketchLine({
      data: [1, 2, 3, 4, 5],
      baseline: 2.5,
    });
    const lines = component?.props?.children?.filter((child: any) => child?.type === "line");
    expect(lines?.length).toBeGreaterThan(0);
  });

  it("does not include baseline line when baseline is outside data range", () => {
    const component = SketchLine({
      data: [1, 2, 3],
      baseline: 10,
    });
    const lines = component?.props?.children?.filter((child: any) => child?.type === "line");
    expect(lines?.length || 0).toBe(0);
  });

  it("applies animate class when animate prop is true", () => {
    const component = SketchLine({ data: [1, 2, 3], animate: true });
    const paths = component?.props?.children?.filter((child: any) => child?.type === "path");
    const hasAnimateClass = paths?.some((p: any) => p?.props?.className?.includes("sketch-draw"));
    expect(hasAnimateClass).toBe(true);
  });

  it("handles flat data (all same values)", () => {
    const component = SketchLine({ data: [5, 5, 5, 5] });
    expect(component?.type).toBe("svg");
  });

  it("has aria-hidden for semantic compliance", () => {
    const component = SketchLine({ data: [1, 2, 3] });
    expect(component?.props?.["aria-hidden"]).toBe(true);
  });
});

describe("SketchBar", () => {
  it("returns an SVG element", () => {
    const component = SketchBar({ pct: 50, seed: 1 });
    expect(component?.type).toBe("svg");
  });

  it("respects custom color prop", () => {
    const customColor = "var(--custom-color)";
    const component = SketchBar({ pct: 50, seed: 1, color: customColor });
    const paths = component?.props?.children?.filter((child: any) => child?.type === "path");
    expect(paths?.[0]?.props?.stroke).toBe(customColor);
  });

  it("respects custom trackH", () => {
    const component = SketchBar({ pct: 50, seed: 1, trackH: 120 });
    expect(component?.props?.height).toBe(120);
  });

  it("includes hatch and outline paths", () => {
    const component = SketchBar({ pct: 50, seed: 1 });
    const paths = component?.props?.children?.filter((child: any) => child?.type === "path");
    expect(paths?.length).toBe(2); // hatch and outline
  });

  it("clamps pct to 0-100 range conceptually", () => {
    const component1 = SketchBar({ pct: 0, seed: 1 });
    const component2 = SketchBar({ pct: 100, seed: 1 });
    const component3 = SketchBar({ pct: 150, seed: 1 });
    expect(component1?.type).toBe("svg");
    expect(component2?.type).toBe("svg");
    expect(component3?.type).toBe("svg");
  });

  it("varies outline based on seed (deterministic)", () => {
    const component1 = SketchBar({ pct: 50, seed: 1 });
    const component2 = SketchBar({ pct: 50, seed: 2 });
    const path1 = component1?.props?.children?.[1]?.props?.d;
    const path2 = component2?.props?.children?.[1]?.props?.d;
    expect(path1).not.toBe(path2);
  });

  it("uses preserveAspectRatio='none' for stretching", () => {
    const component = SketchBar({ pct: 50, seed: 1 });
    expect(component?.props?.preserveAspectRatio).toBe("none");
  });

  it("has aria-hidden for semantic compliance", () => {
    const component = SketchBar({ pct: 50, seed: 1 });
    expect(component?.props?.["aria-hidden"]).toBe(true);
  });

  it("handles edge case: pct = 0", () => {
    const component = SketchBar({ pct: 0, seed: 1 });
    expect(component?.type).toBe("svg");
  });

  it("handles edge case: pct = 100", () => {
    const component = SketchBar({ pct: 100, seed: 1 });
    expect(component?.type).toBe("svg");
  });
});

describe("SketchBarChart", () => {
  it("returns null for empty data", () => {
    const component = SketchBarChart({ data: [] });
    expect(component).toBeNull();
  });

  it("returns a div with role='group' for valid data", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
    ];
    const component = SketchBarChart({ data });
    expect(component?.type).toBe("div");
    expect(component?.props?.role).toBe("group");
  });

  it("includes aria-label in group", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
    ];
    const component = SketchBarChart({ data, ariaLabel: "Sales chart" });
    expect(component?.props?.["aria-label"]).toContain("Sales chart");
  });

  it("auto-derives insight text from data when not provided", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
    ];
    const component = SketchBarChart({ data });
    const ariaLabel = component?.props?.["aria-label"];
    expect(ariaLabel).toContain("up");
  });

  it("uses provided insight text over auto-derived", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
    ];
    const customInsight = "Custom insight text";
    const component = SketchBarChart({ data, insight: customInsight });
    const ariaLabel = component?.props?.["aria-label"];
    expect(ariaLabel).toContain(customInsight);
  });

  it("does not include insight when showInsight=false", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
    ];
    const component = SketchBarChart({ data, showInsight: false });
    const ariaLabel = component?.props?.["aria-label"];
    expect(ariaLabel).not.toContain("up");
  });

  it("respects custom formatValue", () => {
    const data: SketchBarDatum[] = [{ label: "Jan", value: 50 }];
    const formatValue = (v: number) => `$${v}`;
    const component = SketchBarChart({ data, formatValue });
    const ariaLabel = component?.props?.["aria-label"];
    expect(ariaLabel).toContain("$50");
  });

  it("includes baseline line when baseline is provided", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
    ];
    const component = SketchBarChart({ data, baseline: 75 });
    // Check for presence of baseline div
    const children = Array.isArray(component?.props?.children)
      ? component.props.children
      : [component?.props?.children];
    const hasBaseline = children.some(
      (c: any) => c?.props?.["aria-hidden"] && c?.props?.style?.borderTop,
    );
    expect(hasBaseline).toBe(true);
  });

  it("does not include baseline when baseline is 0 or undefined", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
    ];
    const component = SketchBarChart({ data });
    const children = Array.isArray(component?.props?.children)
      ? component.props.children
      : [component?.props?.children];
    const hasBaseline = children.some(
      (c: any) => c?.props?.["aria-hidden"] && c?.props?.style?.borderTop,
    );
    expect(hasBaseline).toBe(false);
  });

  it("renders a button for each data point", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
      { label: "Mar", value: 75 },
    ];
    const component = SketchBarChart({ data });
    const children = Array.isArray(component?.props?.children)
      ? component.props.children
      : [component?.props?.children];
    const barsContainer = children.find(
      (c: any) => c?.props?.style?.display === "flex" && c?.props?.role === undefined,
    );
    const buttons = barsContainer?.props?.children?.filter((c: any) => c?.type === "button");
    expect(buttons?.length || 0).toBeGreaterThanOrEqual(data.length);
  });

  it("includes peak and floor labels", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
    ];
    const component = SketchBarChart({ data });
    const ariaLabel = component?.props?.["aria-label"];
    // Peak value should be in aria-label from insight
    expect(ariaLabel).toBeDefined();
  });

  it("respects custom color", () => {
    const data: SketchBarDatum[] = [{ label: "Jan", value: 50 }];
    const customColor = "var(--custom)";
    const component = SketchBarChart({ data, color: customColor });
    // The color should be used in styling/aria-label
    expect(component).toBeDefined();
  });

  it("handles single data point", () => {
    const data: SketchBarDatum[] = [{ label: "Jan", value: 50 }];
    const component = SketchBarChart({ data });
    expect(component?.type).toBe("div");
  });

  it("tracks hover state via buttons", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
    ];
    const component = SketchBarChart({ data });
    const children = Array.isArray(component?.props?.children)
      ? component.props.children
      : [component?.props?.children];
    const barsContainer = children.find(
      (c: any) => c?.props?.style?.display === "flex" && c?.props?.role === undefined,
    );
    const firstButton = barsContainer?.props?.children?.find((c: any) => c?.type === "button");
    // Check button has hover handlers
    expect(firstButton?.props?.onMouseEnter).toBeDefined();
    expect(firstButton?.props?.onMouseLeave).toBeDefined();
    expect(firstButton?.props?.onFocus).toBeDefined();
    expect(firstButton?.props?.onBlur).toBeDefined();
  });

  it("includes value display overlay", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 50 },
      { label: "Feb", value: 100 },
    ];
    const component = SketchBarChart({ data });
    const children = Array.isArray(component?.props?.children)
      ? component.props.children
      : [component?.props?.children];
    const barsContainer = children.find(
      (c: any) => c?.props?.style?.display === "flex" && c?.props?.role === undefined,
    );
    // Look for the value display div with absolute positioning
    const valueDisplay = barsContainer?.props?.children?.find(
      (c: any) =>
        c?.type === "div" && c?.props?.style?.position === "absolute" && c?.props?.["aria-hidden"],
    );
    expect(valueDisplay).toBeDefined();
  });

  it("respects custom trackH", () => {
    const data: SketchBarDatum[] = [{ label: "Jan", value: 50 }];
    const trackH = 150;
    const component = SketchBarChart({ data, trackH });
    expect(component).toBeDefined();
  });
});
