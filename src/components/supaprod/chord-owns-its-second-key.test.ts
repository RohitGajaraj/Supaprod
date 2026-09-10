import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PRIMARY_NAV, FOOTER_NAV, navKeyHint, NAV_CHORD_PREFIX } from "@/lib/nav-model";

/**
 * ONE KEYSTROKE, ONE ACT.
 *
 * THE DEFECT, proven live in a browser on 2026-08-06 with the network blocked
 * so it could not commit. Pressing `g` then `d` on /today navigated to Discover
 * AND fired `decideApprovalItem` with `verdict: "reject"` on the call that was
 * waiting. The receipt was the request body, carrying a real decision id. The
 * same shape existed on /inbox (`g r` rejected the focused call), on
 * /decide (`g k` drafted a spec and spent money, `g c` dispatched the Critic)
 * and on /discover. Every one of them silent, and the destructive half of each
 * was the irreversible half.
 *
 * WHY NOTHING CAUGHT IT. `preventDefault` stops the BROWSER's default action
 * and says nothing to other listeners. This handler and the surfaces' handlers
 * all bound `keydown` on `window`, so both always ran. The armed marker could
 * not rescue a page handler either: `disarm()` runs before the second key is
 * resolved, so a surface reading it would always find it already cleared. And
 * the chord's own tests only ever asked whether it NAVIGATED, which it did,
 * correctly, the whole time.
 *
 * The surfaces are not at fault and are deliberately not changed. Asking every
 * present and future surface to check a flag is a rule that gets forgotten
 * exactly once. The chord takes the key at the capture phase instead, which
 * runs before every bubble listener in the document regardless of the order
 * React happened to mount things in, and settles it in one place forever.
 */

const SRC = readFileSync(join(import.meta.dir, "GotoShortcuts.tsx"), "utf8");

/** The block that binds the chord, so a match elsewhere in the file cannot
 *  stand in for the real one. */
const HANDLER = (() => {
  const start = SRC.indexOf("export function GotoShortcuts()");
  expect(start).toBeGreaterThan(-1);
  return SRC.slice(start);
})();

describe("the chord takes its second key where nothing can outrun it", () => {
  it("listens on the capture phase, not the bubble phase", () => {
    // `true` as the third argument. Without it the listener sits in the bubble
    // phase, where `stopPropagation` only silences listeners registered LATER
    // on the same target -- an ordering decided by React tree position, which
    // is not something a keyboard contract may depend on.
    expect(HANDLER).toMatch(/window\.addEventListener\("keydown", onKey, true\)/);
    // And removed with the same flag, or the listener leaks: addEventListener
    // and removeEventListener must agree on capture to match a registration.
    expect(HANDLER).toMatch(/window\.removeEventListener\("keydown", onKey, true\)/);
  });

  it("stops the event, not just the browser's default", () => {
    expect(HANDLER).toMatch(/e\.stopPropagation\(\)/);
    expect(HANDLER).toMatch(/e\.preventDefault\(\)/);
  });

  it("consumes the second key whether or not it is bound to a destination", () => {
    // The claim on CHORD_WINDOW_MS is that "a mistyped chord costs nothing".
    // It did not hold: `g` then a typo'd `x` on /decide dropped a bet, because
    // the old code only stopped the event when a destination matched. Both
    // calls must therefore come BEFORE the lookup.
    const consume = HANDLER.indexOf("e.stopPropagation()");
    const lookup = HANDLER.indexOf("const target = [...PRIMARY_NAV");
    expect(consume).toBeGreaterThan(-1);
    expect(lookup).toBeGreaterThan(-1);
    expect(consume).toBeLessThan(lookup);
  });

  it("lets through the keys that cannot be a chord's second key", () => {
    // Escape, Enter, Tab and the arrows have to reach the surface, or a chord
    // left armed would swallow the Escape that closes a dialog. `e.key` is
    // longer than one character for every one of them.
    expect(HANDLER).toMatch(/if \(key\.length !== 1\) return;/);
  });
});

describe("the second key is a letter no surface can also claim", () => {
  /**
   * A SECOND LINE OF DEFENCE, and it is about intent rather than mechanism.
   * The capture listener means a chord letter can no longer TRIGGER a surface
   * action. It does not stop the two from being the same letter, and when they
   * are, a person who learns `g d` for Discover also learns that `d` alone
   * declines -- two meanings for one glyph, which is the confusion the founder
   * raised about `r` for Reject versus `r` for Runs. The prefix is what makes
   * that survivable, so this test records the overlap rather than banning it.
   */
  const CHORD_LETTERS = [...PRIMARY_NAV, ...FOOTER_NAV]
    .map((d) => navKeyHint(d))
    .filter((k) => k !== "");

  it("binds every door to exactly one letter, and the prefix to none of them", () => {
    expect(new Set(CHORD_LETTERS).size).toBe(CHORD_LETTERS.length);
    expect(CHORD_LETTERS).not.toContain(NAV_CHORD_PREFIX);
  });

  it("is a single alphabet: no door anywhere takes a digit", () => {
    // The founder's ruling, and the reason the 01-07 markers on the strip can
    // only mean identity.
    for (const k of CHORD_LETTERS) expect(k).not.toMatch(/[0-9]/);
  });
});
