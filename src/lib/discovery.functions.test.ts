import { describe, test, expect } from "bun:test";
import { computeThemePromotionCounts, type ThemePromotionRow } from "@/lib/discovery.functions";

/**
 * P-32 (A-QUEUE.md). Arriving.tsx used to run `qualifies()` on the client
 * over `listThemes`'s full row set (title, summary, frequency, severity,
 * confidence, status -- and, until this packet, a raw pgvector `embedding`
 * column) just to reduce it to two integers. `computeThemePromotionCounts`
 * is the same reduction, moved server-side, so nothing this component
 * renders needs to reach the browser as theme rows at all.
 *
 * Pins that the composition is a straight port, not a rewrite: `qualifies`
 * and `resolveAutonomyPolicy`/`promotionBarFor` already have their own test
 * suites (promote.test.ts, autonomy-policy.test.ts); this only asserts the
 * wiring between them counts correctly.
 */

const row = (over: Partial<ThemePromotionRow> = {}): ThemePromotionRow => ({
  id: "t-1",
  title: "Checkout drops on mobile Safari",
  frequency: 10,
  severity: 5,
  confidence: 0.9,
  status: "open",
  ...over,
});

describe("computeThemePromotionCounts", () => {
  test("a theme clearing the default bar counts as crossed, not forming", () => {
    const out = computeThemePromotionCounts([row()], null);
    expect(out).toEqual({ forming: 0, crossed: 1 });
  });

  test("a theme under any one threshold counts as forming, not crossed", () => {
    expect(computeThemePromotionCounts([row({ frequency: 2 })], null)).toEqual({
      forming: 1,
      crossed: 0,
    });
    expect(computeThemePromotionCounts([row({ severity: 1 })], null)).toEqual({
      forming: 1,
      crossed: 0,
    });
    expect(computeThemePromotionCounts([row({ confidence: 0.1 })], null)).toEqual({
      forming: 1,
      crossed: 0,
    });
  });

  test("a theme somebody already settled counts as neither", () => {
    // `qualifies`'s own first branch refuses an ineligible status outright --
    // it is not "forming" (still eligible, not yet over the bar) and not
    // "crossed" either. Confirmed against promote.ts's INELIGIBLE_STATUSES.
    const out = computeThemePromotionCounts([row({ status: "promoted" })], null);
    expect(out.crossed).toBe(0);
  });

  test("a workspace's own bar is read, not assumed", () => {
    // A theme that clears the shipped default (8/4/0.75) but not a stricter
    // workspace-set bar must count as forming under ITS bar, never the
    // platform default -- the same refusal Arriving.tsx's own client-side
    // read used to make.
    const strict = {
      promotion_min_frequency: 50,
      promotion_min_severity: 5,
      promotion_min_confidence: 0.9,
    };
    expect(computeThemePromotionCounts([row()], strict)).toEqual({ forming: 1, crossed: 0 });
    expect(computeThemePromotionCounts([row({ frequency: 100 })], strict)).toEqual({
      forming: 0,
      crossed: 1,
    });
  });

  test("counts across several rows, not just the first", () => {
    const out = computeThemePromotionCounts(
      [row({ id: "a" }), row({ id: "b", frequency: 1 }), row({ id: "c" })],
      null,
    );
    expect(out).toEqual({ forming: 1, crossed: 2 });
  });

  test("no themes is zero and zero, not null or a thrown error", () => {
    expect(computeThemePromotionCounts([], null)).toEqual({ forming: 0, crossed: 0 });
  });
});
