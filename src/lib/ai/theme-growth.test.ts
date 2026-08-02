import { describe, it, expect } from "bun:test";
import {
  parseVector,
  cosineSimilarity,
  nearestTheme,
  shouldEscalate,
  escalationNote,
  THEME_ATTACH_THRESHOLD,
} from "./theme-growth";

describe("parseVector", () => {
  it("reads the Postgres text form supabase-js actually returns", () => {
    expect(parseVector("[0.5,0.25,-1]")).toEqual([0.5, 0.25, -1]);
  });

  it("accepts a real array too", () => {
    expect(parseVector([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("tolerates whitespace inside the text form", () => {
    expect(parseVector(" [1, 2 , 3] ")).toEqual([1, 2, 3]);
  });

  it("rejects anything that is not a vector rather than returning garbage", () => {
    expect(parseVector(null)).toBeNull();
    expect(parseVector(undefined)).toBeNull();
    expect(parseVector("")).toBeNull();
    expect(parseVector("[]")).toBeNull();
    expect(parseVector("not a vector")).toBeNull();
    expect(parseVector("[1,oops,3]")).toBeNull();
    expect(parseVector([1, "two", 3])).toBeNull();
  });
});

describe("cosineSimilarity", () => {
  it("is 1 for identical direction", () => {
    expect(cosineSimilarity([1, 0], [2, 0])).toBeCloseTo(1, 10);
  });

  it("is 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
  });

  it("is -1 for opposite direction", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 10);
  });

  it("refuses incomparable input instead of returning NaN", () => {
    expect(cosineSimilarity([1, 0], [1, 0, 0])).toBeNull();
    expect(cosineSimilarity([], [])).toBeNull();
    expect(cosineSimilarity([0, 0], [1, 1])).toBeNull();
  });
});

describe("nearestTheme", () => {
  const near = { id: "near", embedding: "[1,0]" };
  const far = { id: "far", embedding: "[0,1]" };

  it("returns the closest theme above the bar", () => {
    expect(nearestTheme([1, 0], [far, near])).toEqual({ themeId: "near", similarity: 1 });
  });

  it("returns null when nothing clears the bar, so the signal falls through to the model", () => {
    expect(nearestTheme([0, 1], [near])).toBeNull();
  });

  it("skips themes with a missing or malformed vector rather than matching them", () => {
    const broken = { id: "broken", embedding: null };
    const alsoBroken = { id: "alsoBroken", embedding: "junk" };
    expect(nearestTheme([1, 0], [broken, alsoBroken])).toBeNull();
    expect(nearestTheme([1, 0], [broken, near])).toEqual({ themeId: "near", similarity: 1 });
  });

  it("skips themes whose vector has a different width", () => {
    expect(nearestTheme([1, 0], [{ id: "wide", embedding: "[1,0,0]" }])).toBeNull();
  });

  it("honours an explicit threshold", () => {
    // cos 45 degrees is ~0.707: under the default bar, over a lenient one.
    const diagonal = [1, 1];
    expect(nearestTheme(diagonal, [near])).toBeNull();
    expect(nearestTheme(diagonal, [near], 0.7)?.themeId).toBe("near");
  });

  it("keeps the default bar well above the noise floor novelty uses", () => {
    expect(THEME_ATTACH_THRESHOLD).toBeGreaterThan(0.5);
  });
});

describe("shouldEscalate", () => {
  it("does not escalate a theme dismissed before the column existed", () => {
    expect(shouldEscalate(null, 999)).toBe(false);
    expect(shouldEscalate(undefined, 999)).toBe(false);
  });

  it("does not escalate on a single extra signal", () => {
    // Doubling is met (1 -> 2) but the absolute growth of 3 is not.
    expect(shouldEscalate(1, 2)).toBe(false);
  });

  it("escalates a small dismissal only after real repetition", () => {
    expect(shouldEscalate(2, 4)).toBe(false); // doubles, but only +2
    expect(shouldEscalate(2, 5)).toBe(true); // doubles and +3
  });

  it("does not require a large dismissal to double before it is heard again", () => {
    // 40 -> 43 clears the absolute bar but not the multiple: still quiet.
    expect(shouldEscalate(40, 43)).toBe(false);
    expect(shouldEscalate(40, 80)).toBe(true);
  });

  it("never escalates on shrinkage or no change", () => {
    expect(shouldEscalate(5, 5)).toBe(false);
    expect(shouldEscalate(5, 2)).toBe(false);
  });
});

describe("escalationNote", () => {
  it("reads as plain English and carries both numbers", () => {
    expect(escalationNote(4, 12)).toBe("You declined this at 4 signals. It is now at 12.");
  });

  it("says signal, not signals, for one", () => {
    expect(escalationNote(1, 6)).toBe("You declined this at 1 signal. It is now at 6.");
  });
});
