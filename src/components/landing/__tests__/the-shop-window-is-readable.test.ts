/**
 * THE SEVEN STATION NAMES WERE THE LEAST READABLE TEXT ON THE HOME PAGE.
 *
 * S4 measured the shop window in a real browser against a dead backend, which
 * is the page exactly as a visitor gets it: twelve text shapes on `/` below AA,
 * and the seven worst were Discover, Decide, Plan, Design, Build, Ship, Learn,
 * all at 2.94:1 against a 4.5:1 floor. The product is told as three layers and
 * seven stations. The page rendered that one idea in the dimmest ink it had.
 *
 * One constant caused it: `Replay.tsx`'s `R.faint`, #565c66 on a #0d0d0e card.
 * `TheGap`'s craft column was a second, #71717a at 4.02:1.
 *
 * WCAG HAS NO OBJECTION TO HIERARCHY, ONLY TO THE FLOOR, and this test is
 * written to keep both. It asserts the ratios clear AA and, separately, that
 * the palette still reads as three distinct steps -- so a future fix that
 * flattens faint into muted to pass the first half fails the second.
 *
 * Every number here is COMPUTED from the palette's own constants rather than
 * pasted, so moving a colour moves the assertion with it.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { contrastRatio, relativeLuminance, AA_TEXT } from "../contrast";

/** Read the live constant out of the module rather than restating it: a test
 *  carrying its own copy of the value under test proves only that two literals
 *  match. */
function hexNamed(path: string, name: string): string {
  const src = readFileSync(path, "utf8");
  const m = new RegExp(`${name}:\\s*"(#[0-9a-fA-F]{3,6})"`).exec(src);
  if (!m) throw new Error(`no ${name} in ${path}`);
  return m[1];
}

const REPLAY = "src/components/landing/replay/Replay.tsx";
const card = hexNamed(REPLAY, "card");
const text = hexNamed(REPLAY, "text");
const muted = hexNamed(REPLAY, "muted");
const faint = hexNamed(REPLAY, "faint");

describe("the shop window is readable", () => {
  it("the formula agrees with what was measured in a browser", () => {
    // S4 measured 2.94:1 in-browser for the old value and 2.88 by hand; the
    // browser figure is higher because the painted ground is a shade lighter
    // than the card constant. Computing the OLD value here is what proves this
    // implementation is the same one that found the bug.
    expect(contrastRatio("#565c66", card)).toBeCloseTo(2.88, 2);
    expect(contrastRatio("#71717a", card)).toBeCloseTo(4.02, 2);
  });

  it("every step of the replay palette clears AA on its own ground", () => {
    for (const [name, hex] of [
      ["text", text],
      ["muted", muted],
      ["faint", faint],
    ] as const) {
      expect(contrastRatio(hex, card), `${name} (${hex}) is below AA`).toBeGreaterThanOrEqual(
        AA_TEXT,
      );
    }
  });

  /**
   * The half that stops the fix becoming a different defect. Passing AA by
   * lifting faint until it matches muted would delete the recession that is the
   * station strip's whole argument.
   */
  it("and the three steps are still three", () => {
    expect(relativeLuminance(text)).toBeGreaterThan(relativeLuminance(muted));
    expect(relativeLuminance(muted)).toBeGreaterThan(relativeLuminance(faint));
    // A real gap, not a rounding difference: muted is well clear of faint.
    expect(contrastRatio(muted, card) / contrastRatio(faint, card)).toBeGreaterThan(1.2);
  });

  it("the craft column on TheGap clears AA too", () => {
    const src = readFileSync("src/components/landing/TheGap.tsx", "utf8");
    const m = /missing \? "#FF6B2C" : "(#[0-9a-fA-F]{6})"/.exec(src);
    expect(m, "the craft label colour moved").not.toBeNull();
    expect(contrastRatio(m![1], card)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("a malformed colour throws rather than reading as a pass", () => {
    // A silently-zero luminance would make every ratio look enormous.
    expect(() => relativeLuminance("not-a-colour")).toThrow();
    expect(() => relativeLuminance("#12345")).toThrow();
    expect(relativeLuminance("#fff")).toBeCloseTo(1, 5);
  });
});
