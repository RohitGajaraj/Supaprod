import { describe, it, expect } from "bun:test";
import { mulberry32, seedOf, sketchPath, capFirst } from "../Sketch";

describe("mulberry32 (seeded PRNG behind the hand-sketched jitter)", () => {
  it("is deterministic: the same seed reproduces the same sequence", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("always returns a value in [0, 1)", () => {
    const rnd = mulberry32(7);
    for (let i = 0; i < 25; i++) {
      const v = rnd();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("different seeds produce a different first value", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe("seedOf (deterministic per-series seed)", () => {
  it("is stable for the same data and salt", () => {
    expect(seedOf([1, 2, 3], 1)).toBe(seedOf([1, 2, 3], 1));
  });

  it("varies with the salt for identical data (so two passes never share a wobble)", () => {
    expect(seedOf([1, 2, 3], 1)).not.toBe(seedOf([1, 2, 3], 2));
  });

  it("varies with the data for an identical salt", () => {
    expect(seedOf([1, 2, 3], 1)).not.toBe(seedOf([4, 5, 6], 1));
  });

  it("falls back to the bare salt for an empty series (no division by zero)", () => {
    expect(seedOf([], 5)).toBe(5);
  });
});

describe("sketchPath (jittered polyline builder)", () => {
  it("starts with an absolute moveto", () => {
    const d = sketchPath(
      [
        [0, 0],
        [10, 10],
      ],
      mulberry32(1),
      2,
    );
    expect(d.startsWith("M")).toBe(true);
  });

  it("keeps the true start and end points exact, with no jitter at either endpoint", () => {
    const d = sketchPath(
      [
        [0, 0],
        [20, 0],
      ],
      mulberry32(3),
      5,
      7,
    );
    expect(d.startsWith("M0.0 0.0")).toBe(true);
    expect(d.endsWith("L20.0 0.0")).toBe(true);
  });

  it("subdivides a longer segment into more commands than a short one at the same step", () => {
    const countCommands = (d: string) => (d.match(/M|L/g) ?? []).length;
    const short = sketchPath(
      [
        [0, 0],
        [5, 0],
      ],
      mulberry32(1),
      2,
      7,
    );
    const long = sketchPath(
      [
        [0, 0],
        [100, 0],
      ],
      mulberry32(1),
      2,
      7,
    );
    expect(countCommands(long)).toBeGreaterThan(countCommands(short));
  });

  it("returns an empty string for a single-point path (no segment to walk)", () => {
    expect(sketchPath([[0, 0]], mulberry32(1), 2)).toBe("");
  });
});

describe("capFirst", () => {
  it("uppercases the first character of a lowercase phrase", () => {
    expect(capFirst("up 12%")).toBe("Up 12%");
  });

  it("returns an empty string unchanged", () => {
    expect(capFirst("")).toBe("");
  });

  it("leaves an already-capitalized string unchanged", () => {
    expect(capFirst("Down 5%")).toBe("Down 5%");
  });
});
