import { describe, it, expect } from "bun:test";
import { shouldShowCoachMark } from "./TodayCoachMark";

/**
 * OBS-14 - the component itself reads window.localStorage/document, which
 * this repo cannot render-test (no jsdom/RTL, the same constraint every
 * other Obsidian component here documents). shouldShowCoachMark is the pure
 * decision extracted from that logic: renders once on the just-landed
 * session, never again once dismissed.
 */
describe("TodayCoachMark - shouldShowCoachMark", () => {
  it("shows on the just-landed session when never dismissed", () => {
    expect(shouldShowCoachMark(true, false)).toBe(true);
  });

  it("never shows once dismissed, even on a just-landed session", () => {
    expect(shouldShowCoachMark(true, true)).toBe(false);
  });

  it("never shows outside the just-landed session", () => {
    expect(shouldShowCoachMark(false, false)).toBe(false);
    expect(shouldShowCoachMark(false, true)).toBe(false);
  });
});
