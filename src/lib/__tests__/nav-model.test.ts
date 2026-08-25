import { describe, it, expect } from "bun:test";
import { PRIMARY_NAV, navKeyHint, NAV_CHORD_PREFIX } from "@/lib/nav-model";
import { JUMP_DESTINATIONS } from "@/lib/palette-sections";

/**
 * THE SUPAPROD LOOP (Option B, 2026-07-13) - the DERIVATION LAW: the palette
 * JUMP section, the displayed key hints, and the GotoShortcuts key range are
 * DERIVED from PRIMARY_NAV, never hand-copied. These tests fail the moment
 * anything drifts back to a parallel list.
 */

describe("derivation law - palette JUMP mirrors PRIMARY_NAV exactly", () => {
  it("has one JUMP row per primary destination, in rail order", () => {
    expect(JUMP_DESTINATIONS.length).toBe(PRIMARY_NAV.length);
    expect(JUMP_DESTINATIONS.map((d) => d.label)).toEqual(PRIMARY_NAV.map((n) => n.label));
    expect(JUMP_DESTINATIONS.map((d) => d.run.to)).toEqual(PRIMARY_NAV.map((n) => n.to));
  });

  it("carries each destination's search params through unchanged", () => {
    JUMP_DESTINATIONS.forEach((d, i) => {
      expect(d.run.search).toEqual(PRIMARY_NAV[i].search);
    });
  });

  it("displays the derived key hint (the chord letter, one per destination)", () => {
    expect(JUMP_DESTINATIONS.map((d) => d.hint)).toEqual(PRIMARY_NAV.map((n) => navKeyHint(n)));
  });
});

describe("derivation law - the shortcut range", () => {
  it("has fifteen destinations, each on one letter, and not a digit among them", () => {
    /**
     * THE LAW INVERTED, founder ruling 2026-08-05.
     *
     * This test used to assert the opposite: that all ten digits were spent
     * (Today 0, the loop 1-7, Brain 8, Engine 9) before letters took over. That
     * scheme mixed the two alphabets, and a number beside a rail row could be
     * the station's 01-07 identity, its shortcut, or a count. Now every door is
     * `g` then a letter, so a digit on a row can only ever mean identity.
     */
    const n = PRIMARY_NAV.length;
    // Fifteen since 2026-08-25: Work (/start, g w) joined the home zone.
    expect(n).toBe(15);
    expect(PRIMARY_NAV[n]).toBeUndefined();

    const hints = PRIMARY_NAV.map((d) => navKeyHint(d));
    // No digit anywhere, and no destination left without a key.
    expect(hints.filter((h) => /[0-9]/.test(h))).toEqual([]);
    expect(hints.filter((h) => h === "")).toEqual([]);
    // One letter each, and no letter twice.
    expect(hints.every((h) => /^[a-z]$/.test(h))).toBe(true);
    expect(new Set(hints).size).toBe(n);
  });

  it("the last destination is Pulse (the /engine-room route), keyed g then u", () => {
    const last = PRIMARY_NAV[PRIMARY_NAV.length - 1];
    expect(last.to).toBe("/engine-room");
    // `p` belongs to Plan, so Pulse takes the `u` its own label carries. The
    // old standing bare-`g` alias for this route is gone: `g` now arms every
    // chord, so a door that answered to it would shadow the arming press.
    expect(navKeyHint(last)).toBe("u");
    expect(NAV_CHORD_PREFIX).toBe("g");
  });
});
