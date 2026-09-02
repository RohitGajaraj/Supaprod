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
  it("has three destinations, each on one letter, and not a digit among them", () => {
    /**
     * THE LAW INVERTED, founder ruling 2026-08-05, STILL TRUE AT THREE DOORS
     * (P-11, A-QUEUE.md, 2026-09-02): `g` then a letter, never a digit, so a
     * number on a row can only ever mean identity.
     */
    const n = PRIMARY_NAV.length;
    // Three since P-11: Start, Run, Settings. Everything else the rail once
    // carried is reachable by URL only and correctly carries no chord.
    expect(n).toBe(3);
    expect(PRIMARY_NAV[n]).toBeUndefined();

    const hints = PRIMARY_NAV.map((d) => navKeyHint(d));
    // No digit anywhere, and no destination left without a key.
    expect(hints.filter((h) => /[0-9]/.test(h))).toEqual([]);
    expect(hints.filter((h) => h === "")).toEqual([]);
    // One letter each, and no letter twice.
    expect(hints.every((h) => /^[a-z]$/.test(h))).toBe(true);
    expect(new Set(hints).size).toBe(n);
  });

  it("the three doors are Start, Run and Settings, in that order", () => {
    expect(PRIMARY_NAV.map((d) => d.to)).toEqual(["/start", "/track", "/settings"]);
    expect(PRIMARY_NAV.map((d) => d.label)).toEqual(["Start", "Run", "Settings"]);
    expect(PRIMARY_NAV.map((d) => navKeyHint(d))).toEqual(["t", "r", "s"]);
    expect(NAV_CHORD_PREFIX).toBe("g");
  });
});
