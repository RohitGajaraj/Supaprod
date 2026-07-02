import { describe, it, expect } from "bun:test";
import {
  defaultLaunchChecklist,
  pickSuccessMetric,
  defaultCheckByDate,
} from "./launch-plan.functions";

describe("defaultLaunchChecklist", () => {
  it("returns a standing, deterministic checklist with everything unchecked", () => {
    const checklist = defaultLaunchChecklist();
    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist.every((i) => i.done === false)).toBe(true);
  });

  it("returns a fresh array each call (no shared mutable state)", () => {
    const a = defaultLaunchChecklist();
    const b = defaultLaunchChecklist();
    a[0].done = true;
    expect(b[0].done).toBe(false);
  });
});

describe("pickSuccessMetric", () => {
  it("returns null for a missing or empty contract", () => {
    expect(pickSuccessMetric(null)).toBeNull();
    expect(pickSuccessMetric(undefined)).toBeNull();
    expect(pickSuccessMetric({ success_metrics: [] })).toBeNull();
  });

  it("returns the first stated metric's text, never invented", () => {
    const metric = pickSuccessMetric({
      success_metrics: [{ text: "Activation rate up 10% in 30 days" }, { text: "Second" }],
    });
    expect(metric).toBe("Activation rate up 10% in 30 days");
  });

  it("skips a blank first metric text rather than returning whitespace", () => {
    expect(pickSuccessMetric({ success_metrics: [{ text: "   " }] })).toBeNull();
  });
});

describe("defaultCheckByDate", () => {
  it("arms the outcome window 30 days out by default", () => {
    const checkBy = defaultCheckByDate("2026-07-03T00:00:00.000Z");
    expect(checkBy).toBe("2026-08-02T00:00:00.000Z");
  });

  it("honors a custom day count", () => {
    const checkBy = defaultCheckByDate("2026-07-03T00:00:00.000Z", 7);
    expect(checkBy).toBe("2026-07-10T00:00:00.000Z");
  });
});
