/**
 * TWENTY-SIX UNREAD DECISIONS WERE BEING DESCRIBED AS ONE.
 *
 * The product's central claim is that the record learns and then guides: the
 * steward distils a rule out of validated outcomes, a human approves it, and it
 * goes into every agent's prompt before it acts.
 *
 * MEASURED ON THE LIVE DATABASE, 2026-08-27: `house_rules` holds 26 rows across
 * 9 workspaces and EVERY ONE is `pending`. Not one has ever been approved. So
 * the only thing standing between the claim and being able to show it is that
 * nobody has read them -- and the Brain's own empty state said "The steward has
 * written A RULE out of what shipped, and IT IS waiting on a human", whatever
 * the count was.
 *
 * The button beside it already carried the number. The sentence a person reads
 * did not, and the sentence is the half that decides whether they press it.
 */
import { describe, it, expect } from "bun:test";
import { nothingStandingYet, ratedPopulation, ratedRecalls } from "../standing-words";

describe("twenty-six rules are not a rule", () => {
  it("says the number, at the size the live database has", () => {
    expect(nothingStandingYet(26)).toBe(
      "Nothing standing yet. The steward has written 26 rules out of what shipped, and they are waiting on a human.",
    );
  });

  it("reads as English about one", () => {
    expect(nothingStandingYet(1)).toBe(
      "Nothing standing yet. The steward has written a rule out of what shipped, and it is waiting on a human.",
    );
  });

  /**
   * Nothing pending is a different fact from something pending, and it wants a
   * different sentence: with no drafts the useful thing to say is how a rule
   * comes to exist at all, not that none is waiting.
   */
  it("with nothing waiting it explains how a rule appears instead", () => {
    const said = nothingStandingYet(0);
    expect(said).toContain("proposes a rule when the same lesson turns up twice");
    expect(said).not.toContain("waiting on a human");
    // A negative count is a broken read, and it must not become "-1 rules".
    expect(nothingStandingYet(-3)).toBe(said);
  });

  it("never claims anything is standing, because nothing is", () => {
    for (const n of [0, 1, 26]) {
      expect(nothingStandingYet(n)).toStartWith("Nothing standing yet.");
    }
  });
});

/**
 * "70 HELPED" BESIDE "12,531 RECALLS" IMPLIED SOMETHING FALSE AND GLOOMIER
 * THAN THE TRUTH.
 *
 * The recall line put three counts on one axis, and the only arithmetic
 * available to a reader gives 70 in 12,531, which is 0.6% and reads as "the
 * brain surfaces memories nobody uses".
 *
 * `memory_recall_log.outcome` DEFAULTS to `ignored` at insert
 * (memory.server.ts) and is upgraded to `used` or `contradicted` only when a
 * human rates any event in the same trace (feedback.functions.ts). So `ignored`
 * is the absence of a verdict, not a verdict.
 *
 * Measured 2026-08-27: 12,531 recalls, 70 used, 7 contradicted, 12,454 at the
 * default. 91% of the RATED recalls helped, and 99.4% were never rated. Both
 * are worth knowing; the old line said neither.
 */
describe("the rated recalls carry their own population", () => {
  it("names the denominator at the size the live database has", () => {
    expect(ratedPopulation(70, 7)).toBe("77 of them rated");
    expect(ratedRecalls(70, 7)).toBe(77);
  });

  it("reads as English about one", () => {
    expect(ratedPopulation(1, 0)).toBe("one of them rated");
    expect(ratedPopulation(0, 1)).toBe("one of them rated");
  });

  /* Nothing rated draws no clause at all rather than "0 of them rated", which
     would be a claim about a measurement nobody has made. */
  it("says nothing when nothing has been rated", () => {
    expect(ratedPopulation(0, 0)).toBeNull();
    expect(ratedRecalls(0, 0)).toBe(0);
  });

  /* A failed read arrives as zeros, and a negative can only be a broken count.
     Neither may become a population. */
  it("a broken count never becomes a denominator", () => {
    expect(ratedPopulation(-5, 0)).toBeNull();
    expect(ratedRecalls(-5, 3)).toBe(3);
  });
});
