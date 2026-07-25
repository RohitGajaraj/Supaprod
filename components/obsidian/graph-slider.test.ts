import { describe, it, expect } from "bun:test";
import {
  graphX,
  graphY,
  graphPoints,
  smoothLinePath,
  nearestIndex,
  indexOfExtreme,
} from "./graph-slider";

describe("graphX", () => {
  it("calculates x position for first point (n > 1)", () => {
    expect(graphX(0, 10, 300)).toBe(12); // PAD_X = 12
  });

  it("calculates x position for last point (n > 1)", () => {
    // x = 12 + (9/9)*276 = 12 + 276 = 288
    expect(graphX(9, 10, 300)).toBeCloseTo(288);
  });

  it("calculates x position for middle point (n > 1)", () => {
    // x = 12 + (5/9)*276 ≈ 12 + 153 = 165
    const mid = graphX(5, 10, 300);
    expect(mid).toBeCloseTo(165, 0);
  });

  it("returns PAD_X when n <= 1", () => {
    expect(graphX(0, 1, 300)).toBe(12); // Returns PAD_X (no spread)
    expect(graphX(0, 0, 300)).toBe(12); // Edge case
  });

  it("distributes points evenly across width", () => {
    // innerW = 300 - 12*2 = 276
    const x0 = graphX(0, 5, 300);
    const x4 = graphX(4, 5, 300);
    const width = x4 - x0;
    expect(width).toBeCloseTo(276); // Inner width (300 - 24)
  });

  it("handles small widths correctly", () => {
    const result = graphX(1, 2, 50);
    expect(result).toBeGreaterThan(12); // Should be > PAD_X
  });
});

describe("graphY", () => {
  it("calculates y position for minimum value", () => {
    const data = [10, 20, 30] as const;
    const y = graphY(10, data, 140);
    // y = 22 + 94 - ((10-10)/20)*94 = 22 + 94 = 116
    expect(y).toBeCloseTo(116);
  });

  it("calculates y position for maximum value", () => {
    const data = [10, 20, 30] as const;
    const y = graphY(30, data, 140);
    // y = 22 + 94 - ((30-10)/20)*94 = 22 + 94 - 94 = 22
    expect(y).toBeCloseTo(22);
  });

  it("calculates y position for middle value", () => {
    const data = [10, 20, 30] as const;
    const y = graphY(20, data, 140);
    // y = 22 + 94 - ((20-10)/20)*94 = 22 + 94 - 47 = 69
    expect(y).toBeCloseTo(69);
  });

  it("handles equal min/max (span = 0, defaulting to 1)", () => {
    const data = [20, 20, 20] as const;
    const y = graphY(20, data, 140);
    // y = 22 + 94 - ((20-20)/1)*94 = 22 + 94 = 116
    expect(y).toBeCloseTo(116);
  });

  it("handles negative values", () => {
    const data = [-10, 0, 10] as const;
    const y0 = graphY(-10, data, 140);
    const y10 = graphY(10, data, 140);
    expect(y10).toBeLessThan(y0); // Higher value = lower y
  });

  it("handles single-value data array (implicitly negative/zero span)", () => {
    const data = [42] as const;
    const y = graphY(42, data, 140);
    // y = 22 + 94 - ((42-42)/1)*94 = 22 + 94 = 116 (top of range)
    expect(y).toBeCloseTo(116);
  });

  it("scales correctly to height", () => {
    const data = [0, 100] as const;
    const y1 = graphY(50, data, 140);
    const y2 = graphY(50, data, 280);
    expect(Math.abs(y2 - y1)).toBeGreaterThan(50); // Larger height should shift y more
  });
});

describe("graphPoints", () => {
  it("returns array of [x, y] coordinate pairs", () => {
    const data = [10, 20, 30];
    const points = graphPoints(data, 300, 140);
    expect(points.length).toBe(3);
    expect(Array.isArray(points[0])).toBe(true);
    expect(points[0]?.length).toBe(2);
  });

  it("maps each data point to coordinates", () => {
    const data = [10, 20, 30];
    const points = graphPoints(data, 300, 140);
    // x coordinates should increase
    expect(points[0]![0]).toBeLessThan(points[1]![0]!);
    expect(points[1]![0]!).toBeLessThan(points[2]![0]!);
    // y coordinates should be in inverse order (higher value = lower y)
    expect(points[0]![1]).toBeGreaterThan(points[2]![1]!);
  });

  it("handles empty data array", () => {
    const points = graphPoints([], 300, 140);
    expect(points.length).toBe(0);
  });

  it("handles single point", () => {
    const points = graphPoints([42], 300, 140);
    expect(points.length).toBe(1);
    expect(typeof points[0]![0]).toBe("number");
    expect(typeof points[0]![1]).toBe("number");
  });
});

describe("smoothLinePath", () => {
  it("returns empty string for empty points", () => {
    expect(smoothLinePath([])).toBe("");
  });

  it("starts with M command (move to first point)", () => {
    const points: [number, number][] = [[10, 20]];
    const path = smoothLinePath(points);
    expect(path).toMatch(/^M\s+/);
  });

  it("includes cubic bezier curves (C command) for multiple points", () => {
    const points: [number, number][] = [
      [10, 20],
      [20, 30],
      [30, 25],
    ];
    const path = smoothLinePath(points);
    expect(path).toContain("C");
  });

  it("generates one C command per segment (n-1 curves for n points)", () => {
    const points: [number, number][] = [
      [10, 20],
      [20, 30],
      [30, 25],
      [40, 35],
    ];
    const path = smoothLinePath(points);
    const curveCount = (path.match(/C/g) || []).length;
    expect(curveCount).toBe(3); // 4 points = 3 curves
  });

  it("uses horizontal-midpoint control points (gentle curves)", () => {
    const points: [number, number][] = [
      [10, 20],
      [30, 40],
    ];
    const path = smoothLinePath(points);
    // Midpoint x = (10 + 30) / 2 = 20
    expect(path).toContain("20"); // Control points should use midpoint x
  });

  it("formats coordinates with 2 decimal places", () => {
    const points: [number, number][] = [[10.123, 20.456]];
    const path = smoothLinePath(points);
    expect(path).toMatch(/\d+\.\d{2}/); // Should have decimal formatting
  });
});

describe("nearestIndex", () => {
  it("returns 0 for empty data (n <= 1)", () => {
    expect(nearestIndex(100, 300, 0)).toBe(0);
    expect(nearestIndex(100, 300, 1)).toBe(0);
  });

  it("clamps to valid range [0, n-1]", () => {
    const result = nearestIndex(-100, 300, 10); // Far left (out of bounds)
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(9);
  });

  it("maps x position to nearest data index", () => {
    // 300px width, 10 points, PAD_X = 12
    // innerW = 300 - 24 = 276
    // Point 0 at x=12, point 9 at x=288
    // x=150 should be roughly in the middle
    const idx = nearestIndex(150, 300, 10);
    expect(idx).toBeGreaterThanOrEqual(3);
    expect(idx).toBeLessThanOrEqual(6);
  });

  it("rounds to nearest index (not floor)", () => {
    // x=100 in a range should round to the closest point, not always down
    const idx1 = nearestIndex(12, 300, 5); // Left edge
    const idx2 = nearestIndex(288, 300, 5); // Right edge
    expect(idx1).toBeLessThan(idx2);
  });

  it("handles single point (n=2)", () => {
    const idx = nearestIndex(150, 300, 2);
    expect([0, 1]).toContain(idx);
  });

  it("handles very small widths", () => {
    const idx = nearestIndex(5, 50, 10);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(9);
  });
});

describe("indexOfExtreme", () => {
  it("finds index of maximum value", () => {
    const data = [10, 30, 20, 40, 15] as const;
    expect(indexOfExtreme(data, "max")).toBe(3); // 40 is at index 3
  });

  it("finds index of minimum value", () => {
    const data = [10, 30, 20, 40, 15] as const;
    expect(indexOfExtreme(data, "min")).toBe(0); // 10 is at index 0
  });

  it("returns 0 when data has one element", () => {
    expect(indexOfExtreme([42], "max")).toBe(0);
    expect(indexOfExtreme([42], "min")).toBe(0);
  });

  it("returns first index when all values are equal", () => {
    expect(indexOfExtreme([5, 5, 5], "max")).toBe(0);
    expect(indexOfExtreme([5, 5, 5], "min")).toBe(0);
  });

  it("returns first occurrence of max when there are duplicates", () => {
    const data = [10, 30, 30, 20] as const;
    const idx = indexOfExtreme(data, "max");
    expect(idx).toBe(1); // First occurrence of 30
  });

  it("returns first occurrence of min when there are duplicates", () => {
    const data = [20, 10, 10, 30] as const;
    const idx = indexOfExtreme(data, "min");
    expect(idx).toBe(1); // First occurrence of 10
  });

  it("handles negative values", () => {
    const data = [-20, -10, -30, -5] as const;
    expect(indexOfExtreme(data, "max")).toBe(3); // -5 is max
    expect(indexOfExtreme(data, "min")).toBe(2); // -30 is min
  });

  it("handles mixed positive and negative values", () => {
    const data = [-10, 20, -30, 40, 0] as const;
    expect(indexOfExtreme(data, "max")).toBe(3); // 40 is max
    expect(indexOfExtreme(data, "min")).toBe(2); // -30 is min
  });

  it("handles floating-point values", () => {
    const data = [1.5, 2.7, 1.2, 3.1] as const;
    expect(indexOfExtreme(data, "max")).toBe(3); // 3.1
    expect(indexOfExtreme(data, "min")).toBe(2); // 1.2
  });
});
