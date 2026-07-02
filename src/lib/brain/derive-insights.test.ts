import { describe, expect, test } from "bun:test";
import { clampHorizonDays } from "./derive-insights.server";

describe("clampHorizonDays (FS-01)", () => {
  test("clamps below the 30-day floor", () => {
    expect(clampHorizonDays(5)).toBe(30);
  });

  test("clamps above the 90-day ceiling", () => {
    expect(clampHorizonDays(365)).toBe(90);
  });

  test("passes through an in-range value, rounded", () => {
    expect(clampHorizonDays(45.6)).toBe(46);
  });

  test("falls back to the floor for non-numeric input", () => {
    expect(clampHorizonDays(undefined)).toBe(30);
    expect(clampHorizonDays("not a number")).toBe(30);
    expect(clampHorizonDays(null)).toBe(30);
  });
});
