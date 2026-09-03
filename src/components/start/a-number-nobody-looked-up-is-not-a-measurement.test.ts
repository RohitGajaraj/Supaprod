/**
 * THE ARRIVING LINE STATES ONLY WHAT IT HAS A ROW FOR.
 *
 * ── WHY EACH CLAUSE IS SEPARATELY REFUSABLE ───────────────────────────────
 * Three numbers, three reads, and they fail independently: the signal coverage,
 * the theme list, and the workspace's own promotion bar. A line that printed a
 * zero for a read that has not answered would tell a person nothing is arriving
 * when the truth is that nobody looked, which is the substitution this repo has
 * paid for repeatedly and which is at its most expensive here, on the page a
 * person judges the product from.
 *
 * ── THE THIRD CLAUSE IS THE CLAIM, AND IT IS THE ONE THAT MUST NOT DRIFT ──
 * "None has crossed the bar yet" is a statement about a threshold. The bar is
 * `DEFAULT_PROMOTION_BAR` at 8 / 4 / 0.75 and every one of the three is
 * overridable per workspace, so a count computed against the shipped default for
 * a workspace that set its own is a number that looks measured and is not. No
 * bar read, no clause: the sentence is shorter and true.
 */
import { describe, expect, it } from "bun:test";

import { arrivingLine } from "./Arriving";

describe("what it says when every read answered", () => {
  it("reads as one sentence a person could say out loud", () => {
    expect(arrivingLine({ signals7d: 14, sources: 3, forming: 2, crossed: 0 })).toBe(
      "14 findings this week from 3 sources · 2 clusters forming · none has crossed the bar yet",
    );
  });

  it("says how many crossed when any did, because that is the interesting week", () => {
    expect(arrivingLine({ signals7d: 40, sources: 5, forming: 6, crossed: 1 })).toBe(
      "40 findings this week from 5 sources · 6 clusters forming · 1 has crossed the bar",
    );
    expect(arrivingLine({ signals7d: 40, sources: 5, forming: 6, crossed: 2 })).toContain(
      "2 have crossed the bar",
    );
  });

  it("counts in the singular where the count is one", () => {
    expect(arrivingLine({ signals7d: 1, sources: 1, forming: 1, crossed: 0 })).toBe(
      "1 finding this week from 1 source · 1 cluster forming · none has crossed the bar yet",
    );
  });
});

describe("what it refuses to say", () => {
  it("drops the bar clause entirely when the bar was not read", () => {
    /*
     * THE ONE THAT MATTERS. Falling back to the shipped default here would
     * print a threshold this workspace may never have agreed to, in a sentence
     * that reads as a measurement.
     */
    const line = arrivingLine({ signals7d: 14, sources: 3, forming: 2, crossed: null });
    expect(line).toBe("14 findings this week from 3 sources · 2 clusters forming");
    expect(line).not.toContain("bar");
  });

  it("drops the source count without dropping the findings it has", () => {
    expect(arrivingLine({ signals7d: 14, sources: null, forming: null, crossed: null })).toBe(
      "14 findings this week",
    );
  });

  it("says nothing at all when nothing answered, rather than a row of zeroes", () => {
    /*
     * A workspace with no connected source has no arriving evidence, and a strip
     * reading "0 findings this week" over a product that has never been given
     * anything to read is a reproach rather than a fact. The component renders
     * nothing on null.
     */
    expect(
      arrivingLine({ signals7d: null, sources: null, forming: null, crossed: null }),
    ).toBeNull();
  });

  it("still speaks a real zero, because a quiet week is a fact", () => {
    /*
     * Zero is only silent when it is UNKNOWN. A read that answered zero has
     * measured something, and a quiet week over CONNECTED sources is worth
     * knowing about -- that is the case this assertion holds, and it is the
     * one the principle was written for.
     *
     * It used to pass `sources: 0` here, which made it the guard for the exact
     * sentence Arriving.tsx's own header calls a reproach:
     *
     *   "0 findings this week from 0 sources - 0 clusters forming -
     *    none has crossed the bar yet"
     *
     * That is not a quiet week. Nothing was ever connected, so nothing could
     * arrive, and four counts plus a verdict against an unseen bar were the
     * first thing a new workspace said to the person who had just made it.
     */
    expect(arrivingLine({ signals7d: 0, sources: 3, forming: 0, crossed: 0 })).toBe(
      "0 findings this week from 3 sources · 0 clusters forming · none has crossed the bar yet",
    );
  });

  it("says nothing at all when nothing is connected, which no zero can express", () => {
    // The clause-dropping in this file drops on null, and 0 is not null, so the
    // silence has to be decided before the clauses are built. `if (!line)` at
    // the call site was written for this and could never fire.
    expect(arrivingLine({ signals7d: 0, sources: 0, forming: 0, crossed: 0 })).toBeNull();
    expect(arrivingLine({ signals7d: null, sources: 0, forming: null, crossed: null })).toBeNull();
  });

  it("still speaks when a source is connected but the signal count is unknown", () => {
    // Only the both-are-empty case is silent. A workspace with sources whose
    // signal read failed is a different state and keeps its clauses.
    expect(arrivingLine({ signals7d: null, sources: 2, forming: 1, crossed: 0 })).toBe(
      "1 cluster forming · none has crossed the bar yet",
    );
  });
});
