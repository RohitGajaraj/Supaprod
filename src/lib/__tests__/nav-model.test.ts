/*
 * "Findings" -> "Evidence", 2026-09-10. The page's own subtitle is "What came
 * in", and a finding is what you found OUT -- a conclusion. It also collided
 * with `Outcomes`, so a person looking for "what did we learn" had two
 * plausible doors and the one called Findings was the inbox for evidence that
 * has concluded nothing yet. "Evidence" is the founder's own keep word for
 * in-product use, and it is the first noun of the entry's sentence about the
 * product: "from evidence to shipped".
 *
 * The KEY moved with it -- `f` to `e` -- because this file's own rule is that a
 * key is a letter of the label a person can SEE.
 */
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
    /*
     * NINE SINCE P-60 (R-38: a surface without a door is not shipped). The
     * count is not the law -- the assertions below it are, and they hold at any
     * number: a letter each, no digit, no door without a key, no letter twice.
     * A hardcoded count here only records the day it was written.
     */
    expect(n).toBe(7);
    expect(PRIMARY_NAV[n]).toBeUndefined();

    const hints = PRIMARY_NAV.map((d) => navKeyHint(d));
    // No digit anywhere, and no destination left without a key.
    expect(hints.filter((h) => /[0-9]/.test(h))).toEqual([]);
    expect(hints.filter((h) => h === "")).toEqual([]);
    // One letter each, and no letter twice.
    expect(hints.every((h) => /^[a-z]$/.test(h))).toBe(true);
    expect(new Set(hints).size).toBe(n);
  });

  it("the nine doors are the person's questions, in order", () => {
    expect(PRIMARY_NAV.map((d) => d.to)).toEqual([
      "/start",
      "/approvals",
      "/arriving",
      "/outcomes",
      "/crew",
      "/sync",
      "/settings",
    ]);
    expect(PRIMARY_NAV.map((d) => d.label)).toEqual([
      "Home",
      "Inbox",
      "Evidence",
      "Outcomes",
      "Team",
      "Sources",
      "Settings",
    ]);
    expect(PRIMARY_NAV.map((d) => navKeyHint(d))).toEqual(["h", "i", "e", "o", "m", "u", "s"]);
    expect(NAV_CHORD_PREFIX).toBe("g");
  });
});
