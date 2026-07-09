import { describe, it, expect } from "bun:test";
import { shouldWarnLowCredits } from "./BillingBanner";
import { LOW_CREDITS_WARN } from "@/lib/entitlements";

// Founder ruling 2026-07-09: a quiet running-low prompt around the last
// hundred credits. These pin the pure decision so the threshold cannot
// silently drift or start lying while metering is dormant.

describe("shouldWarnLowCredits", () => {
  it("warns at and under the threshold while metering is on", () => {
    expect(shouldWarnLowCredits(true, LOW_CREDITS_WARN, false)).toBe(true);
    expect(shouldWarnLowCredits(true, 50, false)).toBe(true);
    expect(shouldWarnLowCredits(true, 0, false)).toBe(true);
  });

  it("stays quiet above the threshold", () => {
    expect(shouldWarnLowCredits(true, LOW_CREDITS_WARN + 1, false)).toBe(false);
    expect(shouldWarnLowCredits(true, 750, false)).toBe(false);
  });

  it("never speaks while the credits engine is dormant - a 0 balance with metering off is not 'running low'", () => {
    expect(shouldWarnLowCredits(false, 0, false)).toBe(false);
    expect(shouldWarnLowCredits(false, LOW_CREDITS_WARN, false)).toBe(false);
  });

  it("never speaks before the balance has actually loaded", () => {
    expect(shouldWarnLowCredits(true, null, false)).toBe(false);
  });

  it("respects the session dismiss", () => {
    expect(shouldWarnLowCredits(true, 10, true)).toBe(false);
  });

  it("honors a custom threshold when one is passed", () => {
    expect(shouldWarnLowCredits(true, 150, false, 200)).toBe(true);
    expect(shouldWarnLowCredits(true, 250, false, 200)).toBe(false);
  });
});
