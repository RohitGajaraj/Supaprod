import { describe, expect, test } from "bun:test";
import { resolveInitialDensity } from "./use-density";

/**
 * OBS-13 - useDensity itself reads window.localStorage/document, which this
 * repo cannot render-test (no jsdom/RTL, same constraint documented in
 * TodayCoachMark.test.tsx). resolveInitialDensity is the pure decision
 * extracted from that effect: given whatever localStorage.getItem returned,
 * which Density to start from.
 */
describe("resolveInitialDensity", () => {
  test("no stored value (first visit) defaults to comfortable", () => {
    expect(resolveInitialDensity(null)).toBe("comfortable");
  });

  test("'compact' verbatim opts into compact", () => {
    expect(resolveInitialDensity("compact")).toBe("compact");
  });

  test("'comfortable' verbatim stays comfortable", () => {
    expect(resolveInitialDensity("comfortable")).toBe("comfortable");
  });

  test("an empty string fails safe to comfortable", () => {
    expect(resolveInitialDensity("")).toBe("comfortable");
  });

  test("a wrong-case or garbage value fails safe to comfortable, never throws", () => {
    expect(resolveInitialDensity("COMPACT")).toBe("comfortable");
    expect(resolveInitialDensity("dense")).toBe("comfortable");
  });
});
