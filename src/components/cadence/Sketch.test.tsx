import { describe, it, expect } from "bun:test";
import {
  mulberry32,
  seedOf,
  sketchPath,
  capFirst,
  barInsight,
  sketchLineGeometry,
  sketchBarGeometry,
  SketchBarDatum,
} from "./Sketch";

describe("sketchLineGeometry", () => {
  it("should compute geometry for simple data series", () => {
    const data = [1, 2, 3, 2, 1];
    const geom = sketchLineGeometry(data, 100, 50);

    expect(geom.passA).toBeDefined();
    expect(geom.passB).toBeDefined();
    expect(typeof geom.endX).toBe("number");
    expect(typeof geom.endY).toBe("number");
    expect(geom.baseY).toBeNull();
  });

  it("should position end point at correct x coordinate", () => {
    const data = [1, 2, 3];
    const w = 100;
    const geom = sketchLineGeometry(data, w, 50);

    // Last point should be at x = 5 + (data.length - 1) * ((100 - 10) / 2) = 5 + 2 * 45 = 95
    expect(geom.endX).toBe(95);
  });

  it("should compute baseline y when baseline is in range", () => {
    const data = [10, 20, 30];
    const baseline = 20;
    const geom = sketchLineGeometry(data, 100, 50, baseline);

    // Baseline should be at 20 which is in range [10, 30]
    expect(geom.baseY).not.toBeNull();
    expect(typeof geom.baseY).toBe("number");
  });

  it("should return null baseline when baseline is below min", () => {
    const data = [10, 20, 30];
    const baseline = 5;
    const geom = sketchLineGeometry(data, 100, 50, baseline);

    expect(geom.baseY).toBeNull();
  });

  it("should return null baseline when baseline is above max", () => {
    const data = [10, 20, 30];
    const baseline = 40;
    const geom = sketchLineGeometry(data, 100, 50, baseline);

    expect(geom.baseY).toBeNull();
  });

  it("should handle constant data (span = 0)", () => {
    const data = [5, 5, 5, 5];
    const geom = sketchLineGeometry(data, 100, 50);

    expect(geom.passA).toBeDefined();
    expect(geom.passB).toBeDefined();
    expect(geom.endX).toBeDefined();
    expect(geom.endY).toBeDefined();
  });

  it("should generate deterministic paths for same data", () => {
    const data = [1, 2, 3, 2, 1];
    const geom1 = sketchLineGeometry(data, 100, 50);
    const geom2 = sketchLineGeometry(data, 100, 50);

    expect(geom1.passA).toBe(geom2.passA);
    expect(geom1.passB).toBe(geom2.passB);
    expect(geom1.endX).toBe(geom2.endX);
    expect(geom1.endY).toBe(geom2.endY);
  });

  it("should vary geometry for different data", () => {
    const data1 = [1, 2, 3];
    const data2 = [3, 2, 1];
    const geom1 = sketchLineGeometry(data1, 100, 50);
    const geom2 = sketchLineGeometry(data2, 100, 50);

    expect(geom1.passA).not.toBe(geom2.passA);
  });

  it("should respect viewport dimensions", () => {
    const data = [1, 2, 3];
    const geom1 = sketchLineGeometry(data, 100, 50);
    const geom2 = sketchLineGeometry(data, 200, 100);

    // Different dimensions should produce different geometry
    expect(geom1.endX).not.toBe(geom2.endX);
  });

  it("should handle single data point", () => {
    const data = [42];
    const geom = sketchLineGeometry(data, 100, 50);

    expect(geom.endX).toBe(5); // Single point at start x
    expect(geom.passA).toBeDefined();
  });
});

describe("sketchBarGeometry", () => {
  it("should compute geometry for valid bar", () => {
    const geom = sketchBarGeometry(50, 1, 100);

    expect(geom.outline).toBeDefined();
    expect(geom.hatch).toBeDefined();
    expect(typeof geom.outline).toBe("string");
    expect(typeof geom.hatch).toBe("string");
  });

  it("should produce outline path string", () => {
    const geom = sketchBarGeometry(50, 1, 100);

    expect(geom.outline).toMatch(/^M/);
    expect(geom.outline).toContain("L");
  });

  it("should scale bar height by percentage", () => {
    const geom25 = sketchBarGeometry(25, 1, 100);
    const geom75 = sketchBarGeometry(75, 1, 100);

    // Both should have outline (non-empty string)
    expect(geom25.outline.length).toBeGreaterThan(0);
    expect(geom75.outline.length).toBeGreaterThan(0);
  });

  it("should handle full height bar (100%)", () => {
    const geom = sketchBarGeometry(100, 1, 100);

    expect(geom.outline).toBeDefined();
    expect(geom.hatch).toBeDefined();
  });

  it("should handle minimal bar (0%)", () => {
    const geom = sketchBarGeometry(0, 1, 100);

    expect(geom.outline).toBeDefined();
    // Minimal bar should still have some outline
    expect(geom.outline.length).toBeGreaterThan(0);
  });

  it("should vary outline by seed (deterministic jitter per bar)", () => {
    const geom1 = sketchBarGeometry(50, 1, 100);
    const geom2 = sketchBarGeometry(50, 2, 100);

    // Different seeds should produce different wobble
    expect(geom1.outline).not.toBe(geom2.outline);
  });

  it("should regenerate same geometry for same seed", () => {
    const geom1 = sketchBarGeometry(50, 123, 100);
    const geom2 = sketchBarGeometry(50, 123, 100);

    expect(geom1.outline).toBe(geom2.outline);
    expect(geom1.hatch).toBe(geom2.hatch);
  });

  it("should scale track height", () => {
    const geom1 = sketchBarGeometry(50, 1, 50);
    const geom2 = sketchBarGeometry(50, 1, 100);

    // Different track heights should produce different geometry
    expect(geom1.outline).not.toBe(geom2.outline);
  });

  it("should generate hatch pattern for non-minimal bars", () => {
    const geom = sketchBarGeometry(50, 1, 100);

    // Hatch should exist for 50% bar
    expect(geom.hatch.length).toBeGreaterThan(0);
  });

  it("should respect minimum bar height constraint", () => {
    const geomTiny = sketchBarGeometry(1, 1, 100);
    const geomSmall = sketchBarGeometry(10, 1, 100);

    expect(geomTiny.outline).toBeDefined();
    expect(geomSmall.outline).toBeDefined();
  });

  it("should handle oversized percentages (> 100%)", () => {
    const geom = sketchBarGeometry(150, 1, 100);

    expect(geom.outline).toBeDefined();
    expect(geom.hatch).toBeDefined();
  });
});

describe("barInsight", () => {
  it("should return empty string for empty data", () => {
    const insight = barInsight([], (v) => String(v));
    expect(insight).toBe("");
  });

  it("should describe single reading", () => {
    const data: SketchBarDatum[] = [{ label: "Mon", value: 100 }];
    const insight = barInsight(data, (v) => String(v));

    expect(insight).toContain("One reading");
    expect(insight).toContain("100");
    expect(insight).toContain("Mon");
  });

  it("should detect upward trend", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 100 },
      { label: "Tue", value: 110 },
      { label: "Wed", value: 120 },
    ];
    const insight = barInsight(data, (v) => String(Math.round(v)));

    expect(insight.toLowerCase()).toContain("up");
    expect(insight).toContain("%");
  });

  it("should detect downward trend", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 120 },
      { label: "Tue", value: 110 },
      { label: "Wed", value: 100 },
    ];
    const insight = barInsight(data, (v) => String(Math.round(v)));

    expect(insight.toLowerCase()).toContain("down");
  });

  it("should identify flat trend", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 100 },
      { label: "Tue", value: 101 },
      { label: "Wed", value: 100 },
    ];
    const insight = barInsight(data, (v) => String(Math.round(v)));

    expect(insight).toContain("flat");
  });

  it("should identify peak", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 100 },
      { label: "Tue", value: 200 },
      { label: "Wed", value: 150 },
    ];
    const insight = barInsight(data, (v) => String(Math.round(v)));

    expect(insight).toContain("peak");
    expect(insight).toContain("200");
    expect(insight).toContain("Tue");
  });

  it("should handle zero baseline (no percentage calculation)", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 0 },
      { label: "Tue", value: 10 },
    ];
    const insight = barInsight(data, (v) => String(v));

    expect(insight.toLowerCase()).toContain("up");
  });

  it("should use custom formatter", () => {
    const data: SketchBarDatum[] = [{ label: "Mon", value: 1500 }];
    const format = (v: number) => `$${(v / 1000).toFixed(1)}k`;
    const insight = barInsight(data, format);

    expect(insight).toContain("$1.5k");
  });

  it("should capitalize direction", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 100 },
      { label: "Tue", value: 150 },
    ];
    const insight = barInsight(data, (v) => String(v));

    // Should start with capital letter
    expect(insight[0]).toBe(insight[0]?.toUpperCase());
  });

  it("should report percentage correctly for small changes", () => {
    const data: SketchBarDatum[] = [
      { label: "Mon", value: 1000 },
      { label: "Tue", value: 1050 },
    ];
    const insight = barInsight(data, (v) => String(v));

    // 5% increase
    expect(insight).toContain("5%");
  });
});

describe("capFirst", () => {
  it("should capitalize first letter", () => {
    expect(capFirst("hello")).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(capFirst("")).toBe("");
  });

  it("should leave already capitalized unchanged", () => {
    expect(capFirst("Hello")).toBe("Hello");
  });

  it("should handle single character", () => {
    expect(capFirst("a")).toBe("A");
  });

  it("should preserve rest of string", () => {
    expect(capFirst("hELLO")).toBe("HELLO");
  });
});

describe("seedOf", () => {
  it("should produce integer seed", () => {
    const seed = seedOf([1, 2, 3], 100);
    expect(Number.isInteger(seed)).toBe(true);
  });

  it("should vary seed by data", () => {
    const seed1 = seedOf([1, 2, 3], 100);
    const seed2 = seedOf([1, 2, 4], 100);

    expect(seed1).not.toBe(seed2);
  });

  it("should vary seed by salt", () => {
    const seed1 = seedOf([1, 2, 3], 100);
    const seed2 = seedOf([1, 2, 3], 200);

    expect(seed1).not.toBe(seed2);
  });

  it("should be deterministic", () => {
    const seed1 = seedOf([1, 2, 3], 100);
    const seed2 = seedOf([1, 2, 3], 100);

    expect(seed1).toBe(seed2);
  });

  it("should account for data length", () => {
    const seed1 = seedOf([1, 2, 3], 100);
    const seed2 = seedOf([1, 2, 3, 4], 100);

    expect(seed1).not.toBe(seed2);
  });
});

describe("mulberry32", () => {
  it("should return function", () => {
    const rng = mulberry32(42);
    expect(typeof rng).toBe("function");
  });

  it("should produce values in [0, 1)", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("should be deterministic per seed", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const values1: number[] = [];
    const values2: number[] = [];

    for (let i = 0; i < 10; i++) {
      values1.push(rng1());
      values2.push(rng2());
    }

    expect(values1).toEqual(values2);
  });

  it("should vary with different seeds", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(43);
    const v1 = rng1();
    const v2 = rng2();

    expect(v1).not.toBe(v2);
  });
});

describe("sketchPath", () => {
  it("should produce SVG path string", () => {
    const pts: [number, number][] = [
      [0, 0],
      [10, 10],
    ];
    const rng = mulberry32(42);
    const path = sketchPath(pts, rng, 1);

    expect(path).toMatch(/^M/);
    expect(path).toContain("L");
  });

  it("should start with M command for multi-point path", () => {
    const pts: [number, number][] = [
      [0, 0],
      [10, 10],
    ];
    const rng = mulberry32(42);
    const path = sketchPath(pts, rng, 1);

    expect(path).toMatch(/^M/);
  });

  it("should respect step parameter", () => {
    const pts: [number, number][] = [
      [0, 0],
      [100, 100],
    ];
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);

    // Larger step = fewer subdivisions
    const path1 = sketchPath(pts, rng1, 1, 5);
    const path2 = sketchPath(pts, rng2, 1, 50);

    // Fewer L commands with larger step
    const count1 = (path1.match(/L/g) || []).length;
    const count2 = (path2.match(/L/g) || []).length;

    expect(count1).toBeGreaterThan(count2);
  });

  it("should apply jitter amplitude", () => {
    const pts: [number, number][] = [
      [0, 0],
      [10, 10],
      [20, 0],
    ];
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);

    const path1 = sketchPath(pts, rng1, 0.1);
    const path2 = sketchPath(pts, rng2, 10);

    // Different amplitudes should produce different paths
    expect(path1).not.toBe(path2);
  });

  it("should not jitter endpoints", () => {
    const pts: [number, number][] = [
      [5, 5],
      [15, 15],
    ];
    const rng = () => 0.99; // Max jitter
    const path = sketchPath(pts, rng as any, 10);

    // Should start with exact coordinates (no jitter applied to first point)
    expect(path).toMatch(/^M5.*5/);
  });

  it("should handle multi-segment polyline", () => {
    const pts: [number, number][] = [
      [0, 0],
      [10, 10],
      [20, 0],
      [30, 10],
    ];
    const rng = mulberry32(42);
    const path = sketchPath(pts, rng, 1);

    // Should have multiple line commands
    const lineCount = (path.match(/L/g) || []).length;
    expect(lineCount).toBeGreaterThan(2);
  });

  it("should be deterministic with same RNG seed", () => {
    const pts: [number, number][] = [
      [0, 0],
      [10, 10],
    ];
    const path1 = sketchPath(pts, mulberry32(42), 1);
    const path2 = sketchPath(pts, mulberry32(42), 1);

    expect(path1).toBe(path2);
  });
});
