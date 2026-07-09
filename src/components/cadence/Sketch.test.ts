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

  it("returns an empty string for a single-point path (no segment to walk)", () => {
    const pts: [number, number][] = [[5, 5]];
    const rng = mulberry32(42);
    const path = sketchPath(pts, rng, 1);
    expect(path).toBe("");
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
    expect(insight).toContain("Up");
    expect(insight).toContain("%");
  });

  it("detects downward trends", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 100 },
      { label: "Feb", value: 75 },
      { label: "Mar", value: 50 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("Down");
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
    expect(insight).toContain("Up to");
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
    expect(insight).toContain("Down 50%");
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
  it.todo("returns null for less than 2 data points");
  it.todo("returns null for empty data");
  it.todo("returns an SVG element for valid data");
  it.todo("includes two path elements for the double-stroke effect");
  it.todo("includes a circle element for the end-point dot");
  it.todo("respects custom color prop");
  it.todo("respects custom width and height");
  it.todo("includes baseline line when baseline is within data range");
  it.todo("does not include baseline line when baseline is outside data range");
  it.todo("applies animate class when animate prop is true");
  it.todo("handles flat data (all same values)");
  it.todo("has aria-hidden for semantic compliance");
});

describe("SketchBar", () => {
  it.todo("returns an SVG element");
  it.todo("respects custom color prop");
  it.todo("respects custom trackH");
  it.todo("includes hatch and outline paths");
  it.todo("clamps pct to 0-100 range conceptually");
  it.todo("varies outline based on seed (deterministic)");
  it.todo("uses preserveAspectRatio='none' for stretching");
  it.todo("has aria-hidden for semantic compliance");
  it.todo("handles edge case: pct = 0");
  it.todo("handles edge case: pct = 100");
});

describe("SketchBarChart", () => {
  it.todo("returns null for empty data");
  it.todo("returns a div with role='group' for valid data");
  it.todo("includes aria-label in group");
  it.todo("auto-derives insight text from data when not provided");
  it.todo("uses provided insight text over auto-derived");
  it.todo("does not include insight when showInsight=false");
  it.todo("respects custom formatValue");
  it.todo("includes baseline line when baseline is provided");
  it.todo("does not include baseline when baseline is 0 or undefined");
  it.todo("renders a button for each data point");
  it.todo("includes peak and floor labels");
  it.todo("respects custom color");
  it.todo("handles single data point");
  it.todo("tracks hover state via buttons");
  it.todo("includes value display overlay");
  it.todo("respects custom trackH");
});
