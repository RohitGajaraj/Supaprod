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

/**
 * THE GROUND THESE COLOURS ACTUALLY LAND ON, MEASURED RATHER THAN ASSUMED.
 *
 * The first version of this file compared everything to `R.card` (#0d0d0e),
 * on the reasoning that it was the darkest ground named and therefore the worst
 * case. S4 corrected the direction and was right: for light text on a dark
 * ground the ground is the DENOMINATOR, so a darker ground raises the ratio.
 * #0d0d0e was the most flattering ground named, not the harshest.
 *
 * Rather than argue about which is worst, the ground was READ OUT OF A RUNNING
 * BROWSER. Walking up from each station-name span to the first ancestor
 * painting an opaque colour lands on the landing root's `bg-[#0a0a0a]`, not on
 * the replay card at all. So that is what these are judged against.
 *
 * `card` is still checked below, because faint DOES sit on it elsewhere in the
 * family and both grounds have to hold.
 */
const LANDING_GROUND = "#0a0a0a";
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

  it("every step of the replay palette clears AA on BOTH grounds it lands on", () => {
    for (const ground of [LANDING_GROUND, card]) {
      for (const [name, hex] of [
        ["text", text],
        ["muted", muted],
        ["faint", faint],
      ] as const) {
        expect(
          contrastRatio(hex, ground),
          `${name} (${hex}) is below AA on ${ground}`,
        ).toBeGreaterThanOrEqual(AA_TEXT);
      }
    }
  });

  /**
   * THE PUBLIC SHELL'S TWO QUIET STEPS, which were the whole of what remained.
   * Measured in a real browser by painting each computed colour into a 1x1
   * canvas: 34 shapes below AA on `/` and 8 on `/demo`, all of them Tailwind's
   * zinc-500 (4.10:1) and zinc-600 (2.56:1) as text on #0a0a0a. Both are lifted
   * once, scoped to `.public-ink`, in src/styles/public-legibility.css.
   */
  /**
   * THE PUBLIC SHELL'S TWO QUIET STEPS, which were the whole of what remained.
   * Measured in a real browser by painting each computed colour into a 1x1
   * canvas: 34 shapes below AA on `/` and 8 on `/demo`, all of them Tailwind's
   * zinc-500 (4.10:1) and zinc-600 (2.56:1) as text on #0a0a0a.
   *
   * They are lifted once, scoped to `.public-ink`, in
   * src/styles/public-legibility.css -- and onto MERIDIAN TOKENS rather than
   * onto measured hex, because the first draft used hex and the ratchet refused
   * it. The refusal was right and produced the better fix: `--mrd-faint` is
   * documented in meridian.css as "the quietest stop that is still AA", which is
   * this exact requirement already solved. The contrast itself is verified in a
   * browser rather than here, because a token's computed value is not knowable
   * from the stylesheet.
   */
  it("the public shell borrows Meridian's quiet stops rather than inventing colours", () => {
    const css = readFileSync("src/styles/public-legibility.css", "utf8");
    expect(css).toContain(".public-ink .text-zinc-600");
    expect(css).toContain(".public-ink .text-zinc-500");
    // Two different tokens: collapsing them would pass the floor by deleting a
    // step that means something. zinc-600 is the quietest text the landing has.
    expect(css).toContain("color: var(--mrd-faint)");
    expect(css).toContain("color: var(--mrd-mute)");
    // And no raw colour crept back in beside them.
    const rules = css.slice(css.lastIndexOf("*/"));
    expect(rules).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(rules).not.toMatch(/\b(rgb|hsl|oklch)\(/);
  });

  it("and the values they replaced really did fail", () => {
    expect(contrastRatio("#71717a", LANDING_GROUND)).toBeCloseTo(4.1, 1);
    expect(contrastRatio("#52525b", LANDING_GROUND)).toBeCloseTo(2.56, 2);
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
    expect(contrastRatio(m![1], LANDING_GROUND)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("a malformed colour throws rather than reading as a pass", () => {
    // A silently-zero luminance would make every ratio look enormous.
    expect(() => relativeLuminance("not-a-colour")).toThrow();
    expect(() => relativeLuminance("#12345")).toThrow();
    expect(relativeLuminance("#fff")).toBeCloseTo(1, 5);
  });
});
