import { describe, it, expect } from "bun:test";
import { PRIMARY_NAV, navKeyHint } from "@/lib/nav-model";
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

  it("displays the derived key hint (digits 1-9, then g for Engine Room)", () => {
    expect(JUMP_DESTINATIONS.map((d) => d.hint)).toEqual(PRIMARY_NAV.map((n) => navKeyHint(n)));
  });
});

describe("derivation law - the shortcut range", () => {
  it("has twelve destinations; the ten digits are spent, then letters take over", () => {
    // Was ten. Runs and Crew joined on 2026-08-05: both were already rail rows
    // in AppFrame and in no nav list, so no key reached them and their rows
    // drew no keycap. They are keyed u and e (a letter of their own label -
    // `r` is Reject on the approvals queue and `c` is Challenge on the decide
    // gate, so neither door could take the obvious one).
    const n = PRIMARY_NAV.length;
    expect(n).toBe(12);
    for (let key = 1; key <= 9; key++) {
      expect(PRIMARY_NAV[key - 1]).toBeDefined();
    }
    expect(PRIMARY_NAV[n]).toBeUndefined();
    // Every digit 0-9 is still claimed exactly once, and nothing is left over
    // without a key: twelve destinations, twelve bindings.
    const hints = PRIMARY_NAV.map((d) => navKeyHint(d));
    expect(hints.filter((h) => /^[0-9]$/.test(h)).sort()).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
    ]);
    expect(hints.filter((h) => h === "")).toEqual([]);
  });

  it("the last destination is Pulse (the /engine-room route), keyed 9 (with a standing g alias)", () => {
    const last = PRIMARY_NAV[PRIMARY_NAV.length - 1];
    expect(last.to).toBe("/engine-room");
    expect(navKeyHint(last)).toBe("9");
  });
});
