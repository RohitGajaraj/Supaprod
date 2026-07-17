import { describe, it, expect } from "bun:test";
import { barInsight } from "../Sketch";

const fmt = (v: number) => String(Math.round(v));
const d = (vals: number[]) => vals.map((value, i) => ({ label: `w${i + 1}`, value }));

describe("barInsight (honest plain-language takeaway for humans + agents)", () => {
  it("returns nothing for an empty series", () => {
    expect(barInsight([], fmt)).toBe("");
  });

  it("states a single reading plainly", () => {
    expect(barInsight(d([5]), fmt)).toBe("One reading: 5 (w1).");
  });

  it("names the direction, magnitude, and the peak for a rising series", () => {
    const s = barInsight(d([2, 3, 5, 4, 8]), fmt);
    expect(s).toContain("Up 300%");
    expect(s).toContain("since w1");
    expect(s).toContain("peak 8 on w5");
  });

  it("reads a falling series as down", () => {
    expect(barInsight(d([10, 5]), fmt)).toContain("Down 50%");
  });

  it("reads a flat series as flat, never a fabricated move", () => {
    expect(barInsight(d([5, 5, 5]), fmt)).toContain("About flat");
  });

  it("handles a zero base without dividing by zero", () => {
    expect(barInsight(d([0, 4]), fmt)).toContain("Up to 4");
  });

  it("handles a zero base that goes negative as down-to, not a fabricated percent", () => {
    expect(barInsight(d([0, -4]), fmt)).toContain("Down to -4");
  });

  it("treats a sub-5% change as flat (not a spurious trend)", () => {
    expect(barInsight(d([100, 103]), fmt)).toContain("About flat");
  });
});
