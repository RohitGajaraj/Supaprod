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
import { nothingStandingYet } from "../standing-words";

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
