import { describe, it, expect } from "bun:test";
import { PRIMARY_NAV, navKeyHint } from "@/lib/nav-model";
import { JUMP_DESTINATIONS } from "@/lib/palette-sections";

/**
 * THE CADENCE LOOP (Option B, 2026-07-13) - the DERIVATION LAW: the palette
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

  it("displays the derived key hint (digits 1-9, then g for Engine Room)", () => {
    expect(JUMP_DESTINATIONS.map((d) => d.hint)).toEqual(PRIMARY_NAV.map((n) => navKeyHint(n)));
  });
});

describe("derivation law - the shortcut range", () => {
  it("has ten destinations; digit keys 1-9 map 1:1, the 10th uses g", () => {
    const n = PRIMARY_NAV.length;
    expect(n).toBe(10);
    for (let key = 1; key <= 9; key++) {
      expect(PRIMARY_NAV[key - 1]).toBeDefined();
    }
    expect(PRIMARY_NAV[n]).toBeUndefined();
  });

  it("the last destination is Pulse (the /engine-room route), keyed 9 (with a standing g alias)", () => {
    const last = PRIMARY_NAV[PRIMARY_NAV.length - 1];
    expect(last.to).toBe("/engine-room");
    expect(navKeyHint(last)).toBe("9");
  });
});
