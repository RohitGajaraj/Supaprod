import { describe, it, expect } from "bun:test";
import { graphX, graphY, graphPoints, smoothLinePath, nearestIndex } from "../graph-slider";

// Padding constants are internal to graph-slider; these assert the observable
// contract (endpoints, monotonic x, value->y inversion, snapping) rather than
// the exact pixel math, so a padding tweak does not break the suite.

describe("GraphSlider geometry", () => {
  const W = 300;
  const H = 140;

  it("maps the first and last index to the plot edges (inside the horizontal padding)", () => {
    const n = 7;
    const x0 = graphX(0, n, W);
    const xLast = graphX(n - 1, n, W);
    expect(x0).toBeGreaterThan(0);
    expect(x0).toBeLessThan(xLast);
    expect(xLast).toBeLessThan(W);
    // Evenly spaced.
    const step = graphX(1, n, W) - graphX(0, n, W);
    expect(graphX(3, n, W) - graphX(2, n, W)).toBeCloseTo(step, 5);
  });

  it("inverts value to y: a larger value sits higher (smaller y) than a smaller one", () => {
    const data = [10, 50, 30];
    const yHigh = graphY(50, data, H);
    const yLow = graphY(10, data, H);
    expect(yHigh).toBeLessThan(yLow);
  });

  it("handles a flat series without dividing by zero", () => {
    const data = [5, 5, 5];
    for (const p of graphPoints(data, W, H)) {
      expect(Number.isFinite(p[0])).toBe(true);
      expect(Number.isFinite(p[1])).toBe(true);
    }
  });

  it("builds a smooth path that starts with a move and uses cubic segments", () => {
    const d = smoothLinePath(graphPoints([1, 4, 2, 8], W, H));
    expect(d.startsWith("M ")).toBe(true);
    expect(d).toContain(" C ");
  });

  it("snaps a pointer x to the nearest data index and clamps to the ends", () => {
    const n = 5;
    expect(nearestIndex(-100, W, n)).toBe(0);
    expect(nearestIndex(W + 100, W, n)).toBe(n - 1);
    // A pointer near the middle lands on a middle index.
    const mid = nearestIndex(W / 2, W, n);
    expect(mid).toBeGreaterThanOrEqual(1);
    expect(mid).toBeLessThanOrEqual(3);
  });

  it("returns index 0 for a single-point series", () => {
    expect(nearestIndex(123, W, 1)).toBe(0);
  });
});
