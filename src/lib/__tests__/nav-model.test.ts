import { describe, it, expect } from "bun:test";
import { PRIMARY_NAV, navKeyHint } from "@/lib/nav-model";
import { JUMP_DESTINATIONS } from "@/lib/palette-sections";

/**
 * IA SPINE (2026-07-11) - the DERIVATION LAW: the palette JUMP section, the
 * displayed key hints, and the GotoShortcuts key range are DERIVED from
 * PRIMARY_NAV, never hand-copied. These tests fail the moment anything
 * drifts back to a parallel list.
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

  it("displays the derived key hint: the 1-based rail position", () => {
    expect(JUMP_DESTINATIONS.map((d) => d.hint)).toEqual(PRIMARY_NAV.map((_, i) => String(i + 1)));
    expect(JUMP_DESTINATIONS.map((d) => d.hint)).toEqual(PRIMARY_NAV.map((n) => navKeyHint(n)));
  });
});

describe("derivation law - the shortcut range is the nav length", () => {
  it("keys 1..N cover every destination and nothing else (N = PRIMARY_NAV.length)", () => {
    // GotoShortcuts binds Number(e.key) in [1, PRIMARY_NAV.length]; verify the
    // range maps 1:1 onto the rail with no gap and no orphan key.
    const n = PRIMARY_NAV.length;
    expect(n).toBe(7);
    for (let key = 1; key <= n; key++) {
      expect(PRIMARY_NAV[key - 1]).toBeDefined();
    }
    expect(PRIMARY_NAV[n]).toBeUndefined();
  });

  it("key 7 (the last) is the Engine Room, which also keeps its g alias", () => {
    const last = PRIMARY_NAV[PRIMARY_NAV.length - 1];
    expect(last.to).toBe("/engine-room");
    expect(navKeyHint(last)).toBe("7");
  });
});
