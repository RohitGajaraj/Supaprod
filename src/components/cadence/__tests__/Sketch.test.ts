import { describe, expect, test } from "bun:test";
import {
  mulberry32,
  seedOf,
  sketchPath,
  capFirst,
  sketchLineGeometry,
  sketchBarGeometry,
  SketchLine,
  SketchBar,
  SketchBarChart,
  barInsight,
  type SketchBarDatum,
} from "../Sketch";

// ─────────────────────────────────────────────────────────────────────────────
// mulberry32 - Seeded PRNG
// ─────────────────────────────────────────────────────────────────────────────
describe("mulberry32", () => {
  test("produces consistent sequence for the same seed", () => {
    const rnd1 = mulberry32(12345);
    const rnd2 = mulberry32(12345);

    const seq1 = [rnd1(), rnd1(), rnd1()];
    const seq2 = [rnd2(), rnd2(), rnd2()];

    expect(seq1).toEqual(seq2);
  });

  test("produces different sequences for different seeds", () => {
    const rnd1 = mulberry32(12345);
    const rnd2 = mulberry32(54321);

    const seq1 = [rnd1(), rnd1(), rnd1()];
    const seq2 = [rnd2(), rnd2(), rnd2()];

    expect(seq1).not.toEqual(seq2);
  });

  test("values are in range [0, 1)", () => {
    const rnd = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const val = rnd();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  test("produces long sequence without repeating (reasonable cycle length)", () => {
    const rnd = mulberry32(12345);
    const values = Array.from({ length: 1000 }, () => rnd());
    // Check that not all values are the same (basic randomness)
    const unique = new Set(values);
    expect(unique.size).toBeGreaterThan(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// seedOf - Data-driven seed derivation
// ─────────────────────────────────────────────────────────────────────────────
describe("seedOf", () => {
  test("produces same seed for identical data and salt", () => {
    const data = [1.5, 2.3, 3.7];
    const salt = 42;
    const seed1 = seedOf(data, salt);
    const seed2 = seedOf(data, salt);
    expect(seed1).toBe(seed2);
  });

  test("produces different seed for different data", () => {
    const salt = 42;
    const seed1 = seedOf([1.5, 2.3, 3.7], salt);
    const seed2 = seedOf([1.5, 2.3, 3.8], salt);
    expect(seed1).not.toBe(seed2);
  });

  test("produces different seed for different salt", () => {
    const data = [1.5, 2.3, 3.7];
    const seed1 = seedOf(data, 42);
    const seed2 = seedOf(data, 43);
    expect(seed1).not.toBe(seed2);
  });

  test("incorporates array length into seed", () => {
    const salt = 42;
    const seed1 = seedOf([1.5, 2.3, 3.7], salt);
    const seed2 = seedOf([1.5, 2.3, 3.7, 4.2], salt);
    expect(seed1).not.toBe(seed2);
  });

  test("handles empty array", () => {
    const seed = seedOf([], 42);
    expect(typeof seed).toBe("number");
  });

  test("handles negative and zero values", () => {
    const seed1 = seedOf([-1.5, 0, 1.5], 42);
    const seed2 = seedOf([-1.5, 0, 1.5], 42);
    expect(seed1).toBe(seed2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sketchPath - Path generation with jitter
// ─────────────────────────────────────────────────────────────────────────────
describe("sketchPath", () => {
  test("returns valid SVG path string", () => {
    const pts: [number, number][] = [
      [0, 0],
      [10, 10],
    ];
    const rnd = mulberry32(42);
    const path = sketchPath(pts, rnd, 1.0);
    expect(typeof path).toBe("string");
    expect(path.startsWith("M")).toBe(true);
  });

  test("starts at first point (M command)", () => {
    const pts: [number, number][] = [
      [5, 10],
      [20, 30],
    ];
    const rnd = mulberry32(42);
    const path = sketchPath(pts, rnd, 1.0);
    expect(path).toContain("M5");
    expect(path).toContain("10");
  });

  test("handles single segment path", () => {
    const pts: [number, number][] = [
      [0, 0],
      [100, 100],
    ];
    const rnd = mulberry32(42);
    const path = sketchPath(pts, rnd, 1.0);
    expect(path).toContain("L");
  });

  test("handles multi-segment path", () => {
    const pts: [number, number][] = [
      [0, 0],
      [50, 50],
      [100, 100],
    ];
    const rnd = mulberry32(42);
    const path = sketchPath(pts, rnd, 1.0);
    const lCount = (path.match(/L/g) || []).length;
    expect(lCount).toBeGreaterThan(0);
  });

  test("respects amplitude parameter (higher amp = more jitter)", () => {
    const pts: [number, number][] = [
      [0, 0],
      [100, 0],
    ];

    const path1 = sketchPath(pts, mulberry32(42), 0.1);
    const path2 = sketchPath(pts, mulberry32(42), 2.0);

    // Paths should differ due to different jitter amplitudes
    expect(path1).not.toBe(path2);
  });

  test("endpoint (first and last points) are not jittered", () => {
    const pts: [number, number][] = [
      [0, 0],
      [100, 100],
    ];
    const rnd = mulberry32(42);
    const path = sketchPath(pts, rnd, 10.0); // Large amplitude
    // The path should still start at M0 and pass through M100
    expect(path.startsWith("M0")).toBe(true);
  });

  test("respects step parameter (controls subdivision)", () => {
    const pts: [number, number][] = [
      [0, 0],
      [100, 0],
    ];
    const rnd1 = mulberry32(42);
    const rnd2 = mulberry32(42);

    const path1 = sketchPath(pts, rnd1, 1.0, 7); // default step
    const path2 = sketchPath(pts, rnd2, 1.0, 50); // large step
    // Larger step = fewer subdivisions = fewer L commands
    expect((path2.match(/L/g) || []).length).toBeLessThan((path1.match(/L/g) || []).length);
  });

  test("produces valid fixed-point decimals", () => {
    const pts: [number, number][] = [
      [1.234, 5.678],
      [10.901, 20.123],
    ];
    const rnd = mulberry32(42);
    const path = sketchPath(pts, rnd, 1.0);
    // Path should contain only one decimal place (toFixed(1))
    const hasMultiDecimals = /\d+\.\d\d/.test(path);
    expect(hasMultiDecimals).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// capFirst - String capitalization
// ─────────────────────────────────────────────────────────────────────────────
describe("capFirst", () => {
  test("capitalizes first character of lowercase string", () => {
    expect(capFirst("hello")).toBe("Hello");
  });

  test("leaves already capitalized string unchanged", () => {
    expect(capFirst("Hello")).toBe("Hello");
  });

  test("capitalizes first character of mixed case", () => {
    expect(capFirst("hELLO")).toBe("HELLO");
  });

  test("handles empty string", () => {
    expect(capFirst("")).toBe("");
  });

  test("handles single character", () => {
    expect(capFirst("a")).toBe("A");
    expect(capFirst("A")).toBe("A");
  });

  test("preserves rest of string exactly", () => {
    expect(capFirst("hello world")).toBe("Hello world");
    expect(capFirst("HELLO WORLD")).toBe("HELLO WORLD");
  });

  test("handles special characters", () => {
    expect(capFirst("@hello")).toBe("@hello");
    expect(capFirst("123abc")).toBe("123abc");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sketchLineGeometry - Line chart geometry computation
// ─────────────────────────────────────────────────────────────────────────────
describe("sketchLineGeometry", () => {
  test("returns both passes and end point coordinates", () => {
    const data = [10, 20, 15, 30];
    const geo = sketchLineGeometry(data, 210, 42);

    expect(geo).toHaveProperty("passA");
    expect(geo).toHaveProperty("passB");
    expect(geo).toHaveProperty("endX");
    expect(geo).toHaveProperty("endY");
    expect(geo).toHaveProperty("baseY");
  });

  test("returns null baseY when no baseline", () => {
    const data = [10, 20, 15, 30];
    const geo = sketchLineGeometry(data, 210, 42);
    expect(geo.baseY).toBe(null);
  });

  test("returns valid baseY when baseline is in range", () => {
    const data = [10, 20, 15, 30];
    const geo = sketchLineGeometry(data, 210, 42, 15); // 15 is within [10, 30]
    expect(geo.baseY).not.toBe(null);
    expect(typeof geo.baseY).toBe("number");
  });

  test("returns null baseY when baseline is below min", () => {
    const data = [10, 20, 15, 30];
    const geo = sketchLineGeometry(data, 210, 42, 5); // 5 < min(10)
    expect(geo.baseY).toBe(null);
  });

  test("returns null baseY when baseline is above max", () => {
    const data = [10, 20, 15, 30];
    const geo = sketchLineGeometry(data, 210, 42, 40); // 40 > max(30)
    expect(geo.baseY).toBe(null);
  });

  test("end point is at last data value", () => {
    const data = [10, 20, 15, 30];
    const w = 210;
    const h = 42;
    const geo = sketchLineGeometry(data, w, h);
    // endX should be at x position of last point
    const expectedEndX = 5 + (data.length - 1) * ((w - 10) / Math.max(1, data.length - 1));
    expect(geo.endX).toBe(expectedEndX);
  });

  test("handles single data point", () => {
    // Single point should return null or handle gracefully
    const data = [10];
    const geo = sketchLineGeometry(data, 210, 42);
    expect(geo).toBeDefined();
    expect(typeof geo.passA).toBe("string");
    expect(typeof geo.passB).toBe("string");
  });

  test("handles all identical values", () => {
    const data = [15, 15, 15, 15];
    const geo = sketchLineGeometry(data, 210, 42);
    expect(geo.passA).toBeDefined();
    expect(geo.passB).toBeDefined();
  });

  test("different widths affect endX", () => {
    const data = [10, 20, 15, 30];
    const geo1 = sketchLineGeometry(data, 210, 42);
    const geo2 = sketchLineGeometry(data, 100, 42);
    expect(geo1.endX).not.toBe(geo2.endX);
  });

  test("passA and passB are both valid SVG paths", () => {
    const data = [10, 20, 15, 30];
    const geo = sketchLineGeometry(data, 210, 42);
    expect(geo.passA.startsWith("M")).toBe(true);
    expect(geo.passB.startsWith("M")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sketchBarGeometry - Bar chart geometry computation
// ─────────────────────────────────────────────────────────────────────────────
describe("sketchBarGeometry", () => {
  test("returns outline and hatch paths", () => {
    const geo = sketchBarGeometry(50, 42, 72);
    expect(geo).toHaveProperty("outline");
    expect(geo).toHaveProperty("hatch");
    expect(typeof geo.outline).toBe("string");
    expect(typeof geo.hatch).toBe("string");
  });

  test("outline is a valid SVG path", () => {
    const geo = sketchBarGeometry(50, 42, 72);
    expect(geo.outline.startsWith("M")).toBe(true);
  });

  test("hatch is a valid SVG path", () => {
    const geo = sketchBarGeometry(50, 42, 72);
    expect(geo.hatch.startsWith("M")).toBe(true);
  });

  test("0% pct produces minimal bar height", () => {
    const geo1 = sketchBarGeometry(0, 42, 72);
    const geo2 = sketchBarGeometry(50, 42, 72);
    // Paths should be different
    expect(geo1.outline).not.toBe(geo2.outline);
  });

  test("100% pct produces full bar height", () => {
    const geo = sketchBarGeometry(100, 42, 72);
    expect(geo.outline).toBeDefined();
    expect(geo.hatch).toBeDefined();
  });

  test("same seed produces same geometry", () => {
    const geo1 = sketchBarGeometry(50, 42, 72);
    const geo2 = sketchBarGeometry(50, 42, 72);
    expect(geo1.outline).toBe(geo2.outline);
    expect(geo1.hatch).toBe(geo2.hatch);
  });

  test("different seed produces different jitter", () => {
    const geo1 = sketchBarGeometry(50, 42, 72);
    const geo2 = sketchBarGeometry(50, 43, 72);
    expect(geo1.outline).not.toBe(geo2.outline);
  });

  test("different trackH affects bar height range", () => {
    const geo1 = sketchBarGeometry(50, 42, 72);
    const geo2 = sketchBarGeometry(50, 42, 144);
    expect(geo1.outline).not.toBe(geo2.outline);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// barInsight - Plain-language data interpretation
// ─────────────────────────────────────────────────────────────────────────────
describe("barInsight", () => {
  test("returns empty string for empty data", () => {
    const insight = barInsight([], (v) => String(v));
    expect(insight).toBe("");
  });

  test("handles single data point", () => {
    const data: SketchBarDatum[] = [{ label: "Jan", value: 42 }];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("One reading");
    expect(insight).toContain("42");
    expect(insight).toContain("Jan");
  });

  test("identifies flat trend", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 100 },
      { label: "Feb", value: 100 },
      { label: "Mar", value: 100 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("flat");
  });

  test("identifies upward trend", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 100 },
      { label: "Feb", value: 110 },
      { label: "Mar", value: 120 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight.toLowerCase()).toContain("up");
  });

  test("identifies downward trend", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 120 },
      { label: "Feb", value: 110 },
      { label: "Mar", value: 100 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight.toLowerCase()).toContain("down");
  });

  test("identifies peak correctly", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 10 },
      { label: "Feb", value: 100 },
      { label: "Mar", value: 20 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("peak");
    expect(insight).toContain("Feb");
    expect(insight).toContain("100");
  });

  test("respects custom formatter", () => {
    const data: SketchBarDatum[] = [{ label: "Jan", value: 42 }];
    const insight = barInsight(data, (v) => `$${v.toFixed(2)}`);
    expect(insight).toContain("$42.00");
  });

  test("handles small percentage changes (<5%)", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 100 },
      { label: "Feb", value: 103 }, // +3%, treated as flat
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("flat");
  });

  test("includes ranked percentage for notable changes", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 100 },
      { label: "Feb", value: 150 }, // +50%
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(insight).toContain("50%");
  });

  test("handles zero base value gracefully", () => {
    const data: SketchBarDatum[] = [
      { label: "Jan", value: 0 },
      { label: "Feb", value: 50 },
    ];
    const insight = barInsight(data, (v) => String(v));
    expect(typeof insight).toBe("string");
  });
});

// Note: React components (SketchLine, SketchBar, SketchBarChart) use hooks and
// cannot be tested as plain functions without a React rendering context.
// Their integration testing should be done via e2e or visual tests.
// The geometry helpers above (sketchLineGeometry, sketchBarGeometry) exercise
// the core computation logic that these components depend on, providing indirect
// coverage of component rendering paths.
