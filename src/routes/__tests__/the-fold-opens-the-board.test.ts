import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * THE FOLD SENDS `/runs` WHERE THE BOARD ACTUALLY IS.
 *
 * ── THIS GUARD WAS INVERTED ON 2026-08-31, AND THE REASON IS THE POINT ────
 * It used to assert the opposite — that `/runs` must name `/today` and must
 * NOT couple to `SIGNED_IN_HOME` — and that was RIGHT when it was written.
 * The drift it was built after is real: this route once read "/runs folds into
 * /today (the board)" while redirecting to `SIGNED_IN_HOME`, so when the home
 * flipped to `/start` on 2026-08-25 the fold went with it and a person
 * clicking **Runs** landed on the composer. **A fold that replaces two doors
 * with a third is worse than the two.**
 *
 * **What changed is not the rule but the world it described.** The rule was
 * always "send them where the board is". While the board was its own route,
 * that meant naming `/today` and refusing the home constant, because the two
 * answered different questions. S0's ruling A01 folded `/today` into the home
 * and A07 landed the mount, so **the board is now drawn ON the home** — and
 * the two questions have one answer. Naming `/today` today would send a person
 * through a route that is itself a redirect: a double hop to reach one surface,
 * which S0 named before it shipped.
 *
 * **So the assertion is inverted and the invariant is untouched.** What this
 * file has always protected is that `/runs` opens the board rather than
 * whatever is convenient, and that the target is checked rather than assumed.
 * If the board ever moves off the home, this flips back — and the comment above
 * the route is the place that will say so first.
 */

const SRC = readFileSync("src/routes/_authenticated.runs.index.tsx", "utf8");

describe("the fold opens the board", () => {
  it("redirects to the home, which is where the board is drawn", () => {
    expect(SRC).toMatch(/redirect\(\{\s*to:\s*SIGNED_IN_HOME\s*\}\)/);
  });

  it("never hops through /today, which is itself a redirect now", () => {
    /*
     * The CODE, not the prose. The comment above the route explains the history
     * and necessarily says "/today" while doing it, so a bare string search
     * would fail on the explanation rather than on the defect. Only the
     * redirect target is asserted.
     *
     * Two redirects to reach one surface is not a fold, it is a chain — and it
     * is the specific hazard S0 named in A07 before either half shipped.
     */
    expect(SRC).not.toMatch(/redirect\(\{\s*to:\s*"\/today"/);
  });

  it("takes the home from the constant rather than spelling it", () => {
    /* The same derivation F-144 turned on: the rail's home door and the
       wordmark both name `SIGNED_IN_HOME`, so a future flip moves all three
       together. A spelled "/start" here would be the half-change that started
       this whole finding. */
    expect(SRC).toMatch(/import\s*\{[^}]*SIGNED_IN_HOME[^}]*\}/);
    expect(SRC).not.toMatch(/redirect\(\{\s*to:\s*"\/start"/);
  });

  it("is still a redirect and renders no surface of its own", () => {
    expect(SRC).toContain("beforeLoad");
    expect(SRC).not.toContain("component:");
  });
});
