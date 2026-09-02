/**
 * A ROW IDENTICAL TO ITS NEIGHBOUR MUST CARRY A FACT THAT IS NOT.
 *
 * ── WHAT WAS ON THE SCREEN, WALKED 2026-09-02 ─────────────────────────────
 * Design's list on `ce846e9b` printed *OTA Firmware Reboot Status Tile* four
 * times and *...Tile Differentiation* four times. Every one of the eight rows
 * also read "1d ago", because `relativeTime` rounds and all ten prototypes were
 * filed by one seat inside the same minute.
 *
 * Eight rows carrying two facts between them. A reader cannot tell which row is
 * which, cannot tell whether it is one thing drawn four times or four separate
 * things, and has no reason to press any particular one. That is worse than a
 * shorter list, because it reads as a bug in the record rather than as a fact
 * about the work.
 *
 * ── THE RULE, WHICH THIS REPO HAS ALREADY PAID FOR TWICE ──────────────────
 * `what-it-produced.ts` counts repeated titles and says so in its sentence, and
 * `an-example-says-so` was written for the same defect on a different surface.
 * The rule is the discriminator rule: a row identical to its neighbour must
 * carry a fact that is not.
 *
 * ── AND THE FIX IS NARROW ON PURPOSE ──────────────────────────────────────
 * The exact instant replaces the rounded one ONLY on a row that has a twin. On a
 * row that is already unique, "1d ago" is the more readable of the two and
 * swapping it for "20:14:07" would cost every unique row to serve the repeated
 * ones. The tests below pin both halves, because a fix that fires everywhere is
 * the version a later sweep will correctly delete.
 */
import { describe, expect, it } from "bun:test";

import { repeatedTitles } from "./ArtifactPane";

const m = (title: string | null, missing = false) => ({ title, missing });

describe("which titles have a twin", () => {
  it("names a title printed more than once", () => {
    const repeats = repeatedTitles([
      m("OTA Firmware Reboot Status Tile"),
      m("OTA Firmware Reboot Status Tile"),
      m("Something else"),
    ]);
    expect(repeats.has("ota firmware reboot status tile")).toBe(true);
    expect(repeats.has("something else")).toBe(false);
  });

  it("matches on the trimmed, case-folded title, because that is what a reader sees", () => {
    /*
     * Two rows differing only in capitalisation or trailing space are two
     * identical rows to the person reading them, and the whole point of this is
     * what a person can tell apart.
     */
    const repeats = repeatedTitles([m("Reboot Tile"), m("  reboot tile ")]);
    expect(repeats.has("reboot tile")).toBe(true);
  });

  it("counts nothing for a row whose artifact is gone", () => {
    /*
     * A missing member renders "This prototype is no longer there", not its
     * title, so its title cannot be one of the things on screen that repeat.
     */
    const repeats = repeatedTitles([m("Reboot Tile"), m("Reboot Tile", true)]);
    expect(repeats.size).toBe(0);
  });

  it("ignores an absent title rather than grouping every untitled row together", () => {
    /*
     * A member with no title falls back to its KIND word, and three rows reading
     * "Prototype" are a different problem from three rows reading one title. The
     * empty string is not a title and is not treated as one.
     */
    const repeats = repeatedTitles([m(null), m(null), m("   ")]);
    expect(repeats.size).toBe(0);
  });

  it("says nothing about a list where every row is already distinct", () => {
    const repeats = repeatedTitles([m("One"), m("Two"), m("Three")]);
    expect(repeats.size).toBe(0);
  });
});
