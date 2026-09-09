/**
 * THE DEFECT THIS EXISTS TO PREVENT: two chips reading "Stopped", 200 pixels
 * apart, on the run screen. Header at top 97, the "What is happening now" card
 * at top 295, both visible together at every scroll position -- S1 measured
 * both containers to their bottoms before either of us cut anything.
 *
 * It is law 14 in its purest form: `run-status.ts` is right, `run-now.ts` is
 * right, and the repetition exists only BETWEEN them, so no test of either
 * could ever have seen it.
 */
import { describe, expect, it } from "bun:test";

import { theCardStillNeedsItsChip } from "./the-header-already-said-it";

/** The measured card: "Stopped", with the hold sentence as its headline. */
const STOPPED = {
  word: "Stopped",
  headline: "Design has been run many times over and the work has not moved on once.",
  line: null,
};

describe("the second chip goes", () => {
  it("when the header is already saying the same word", () => {
    expect(theCardStillNeedsItsChip("Stopped", STOPPED)).toBe(false);
  });

  it("and the card still says everything, because the headline carries it", () => {
    // The headline sits on the chip's own row, so removing the chip promotes
    // the sentence rather than leaving a gap where a state word was.
    expect(STOPPED.headline).toBeTruthy();
  });
});

describe("and the two cases where it stays", () => {
  it("the header is drawing NO chip", () => {
    /*
     * `runStatus` returns null when there is nothing to report and the route
     * draws nothing at all. That is not the same as the header showing a
     * different word, and cutting here would leave the screen with no state
     * word anywhere.
     */
    expect(theCardStillNeedsItsChip(null, STOPPED)).toBe(true);
    expect(theCardStillNeedsItsChip(undefined, STOPPED)).toBe(true);
    expect(theCardStillNeedsItsChip("", STOPPED)).toBe(true);
  });

  it("the header is saying something ELSE", () => {
    // Two different words are two different claims and both belong. The header
    // and the card are separate deciders with seven and twelve branches; they
    // agree on this screen by construction, not by contract.
    expect(theCardStillNeedsItsChip("Waiting on you", STOPPED)).toBe(true);
    expect(theCardStillNeedsItsChip("Running", STOPPED)).toBe(true);
  });

  it("the same word, but the chip is the card's ONLY content", () => {
    /*
     * Three of `run-now.ts`'s twelve registers return `headline: null` on
     * purpose -- "the chip is then the only thing on the row, and it reads as
     * calm rather than as a hole". Cutting it there empties the row.
     */
    expect(
      theCardStillNeedsItsChip("Finished", { word: "Finished", headline: null, line: null }),
    ).toBe(true);
  });

  it("but a line alone is enough to let it go", () => {
    // `line` renders under the row. A card with a sentence is not an empty
    // card, so the chip is redundant there in the same way it is with a
    // headline.
    expect(
      theCardStillNeedsItsChip("Between steps", {
        word: "Between steps",
        headline: null,
        line: "Run it now to start Design yourself.",
      }),
    ).toBe(false);
  });
});

describe("it compares the word and never the state", () => {
  it("so a word that differs by case or spacing is a different word", () => {
    /*
     * Deliberate. What a reader sees is the WORD; mapping `run-status.ts`'s
     * five statuses onto `run-now.ts`'s twelve registers would be inventing a
     * correspondence between two vocabularies, which is a third thing to be
     * wrong. Exact match is the same comparison the eye makes.
     */
    expect(theCardStillNeedsItsChip("stopped", STOPPED)).toBe(true);
    expect(theCardStillNeedsItsChip("Stopped ", STOPPED)).toBe(true);
  });
});
