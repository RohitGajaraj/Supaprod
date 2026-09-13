/**
 * THE DECISIONS LIST HAD TWO VALUES IN ITS LAST COLUMN, AND ONE OF THEM WAS
 * THE ABSENCE OF THE OTHER.
 *
 * Read signed in on `/outcomes`, workspace `c8ffbbe7`, 2026-09-10. Eight
 * rows: six ended "· hold", two ended "· no forecast". Nothing in that column
 * told a reader anything about any row.
 *
 * And two of the six read, twenty pixels apart:
 *
 *   Warn a homeowner before an installer visit is cancelled
 *   Kept · You settled it · Forecast: Warn a homeowner before an installer
 *   visit is cancelled · hold
 *
 * Both rules are in `decisions-shared.ts` with the measurements. This pins
 * them, and pins the one interaction between them that must never happen.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  claimRestatesTitle,
  forecastChip,
  HOLD_WORD,
  holdIsTheWholeColumn,
} from "../decisions-shared";

const row = (claim: string | null, resolution: string | null = null) => ({
  forecast_claim: claim,
  forecast_resolution: resolution,
});

describe("holdIsTheWholeColumn", () => {
  it("fires on the six rows that ended in one word", () => {
    const six = Array.from({ length: 6 }, (_, i) => row(`A claim ${i}`));
    expect(holdIsTheWholeColumn(six)).toBe(true);
  });

  it("stops the moment one forecast is settled, whichever way", () => {
    for (const settled of ["hit", "miss", "inconclusive"]) {
      const mixed = [row("A"), row("B"), row("C", settled)];
      expect(holdIsTheWholeColumn(mixed)).toBe(false);
    }
  });

  it("ignores rows carrying no forecast, which say something else already", () => {
    // Two on hold and three with nothing is still a column whose every
    // forecast word is the same word.
    expect(holdIsTheWholeColumn([row("A"), row("B"), row(null), row(null), row(null)])).toBe(true);
    // And one on hold is not a repetition of anything.
    expect(holdIsTheWholeColumn([row("A"), row(null), row(null)])).toBe(false);
  });

  it("says nothing about an empty or single-forecast list", () => {
    expect(holdIsTheWholeColumn([])).toBe(false);
    expect(holdIsTheWholeColumn([row("A")])).toBe(false);
  });

  it("agrees with the word forecastChip actually produces", () => {
    /* Derived from the subject rather than restated beside it: if the
       fall-through word is ever renamed, this fails rather than drifting. */
    expect(forecastChip(row("A claim"))!.word).toBe(HOLD_WORD);
  });
});

describe("claimRestatesTitle", () => {
  const TITLE = "Warn a homeowner before an installer visit is cancelled";

  it("catches the two rows that printed one sentence twice", () => {
    expect(claimRestatesTitle(TITLE, TITLE)).toBe(true);
  });

  it("forgives the differences a model introduces when it copies a line", () => {
    expect(claimRestatesTitle(`  ${TITLE}.  `, TITLE)).toBe(true);
    expect(claimRestatesTitle(TITLE.toLowerCase(), TITLE)).toBe(true);
  });

  it("is exact restatement and never similarity", () => {
    // A real forecast about the same subject is a second fact and stays. A
    // threshold here would be a judgement this check cannot make; see the
    // label-similarity scorer this repo declined on 2026-09-09.
    expect(
      claimRestatesTitle(
        "Homeowners warned before a cancellation reschedule rather than call support, at least 5 times a day",
        TITLE,
      ),
    ).toBe(false);
    expect(claimRestatesTitle(`${TITLE} within 30 days`, TITLE)).toBe(false);
  });

  it("never calls two empties a restatement", () => {
    expect(claimRestatesTitle("", "")).toBe(false);
    expect(claimRestatesTitle("   ", "")).toBe(false);
  });
});

describe("the row keeps one of the two, always", () => {
  it("is wired so the claim and the word can never both leave", () => {
    /*
     * THE ONE INTERACTION THAT MUST NOT HAPPEN. Between them the claim span
     * and the verdict word are what distinguishes a row carrying a forecast
     * from one reading "no forecast". Suppress both -- a claim that restates
     * its title, on a column that is all `hold` -- and the two become the
     * same picture, which is the single thing this second line exists to keep
     * apart.
     *
     * Source-pinned: `DecisionsPanel` has no DOM renderer in its tests, which
     * is exactly how a sentence like this rots with nothing failing.
     */
    const src = readFileSync(
      fileURLToPath(new URL("../DecisionsPanel.tsx", import.meta.url)),
      "utf8",
    );
    expect(src).toContain("holdEverywhere && fc.word === HOLD_WORD && !claimIsTheLead");
    expect(src).toContain("claimIsTheLead ? null : (");
    expect(src).toContain("const holdEverywhere = holdIsTheWholeColumn(shown);");
    // And the word, having left the rows, is said once above them.
    expect(src).toContain('holdEverywhere ? " None of them has been settled yet." : null');
  });
});
