/**
 * "CAME FROM 0" IS A CLAIM WE CANNOT SUPPORT.
 *
 * `getLineageCounts` returns **`counts: null` for a FAILED read**, never a board
 * with no lineage — its own contract says so, and F-76 is the finding behind it.
 * So the line has to keep three states apart where a careless one keeps two:
 *
 *   read failed / not answered  ->  ask the question, claim nothing
 *   read answered, all zero     ->  ask the question, claim nothing
 *   read answered, seeded only  ->  SAY SO, because it is a different fact
 *
 * The third is S4's: `producedBy 0, fed 0, seededExcluded 4` and a flat `0,0,0`
 * are different facts and **only one of them is a gap in the product**.
 */
import { describe, expect, it } from "bun:test";
import { lineageIds, lineageLine } from "./lineage-line";
import { NO_LINEAGE } from "@/lib/lineage-graph";

describe("the line never claims a zero it cannot support", () => {
  it("asks the question when the read failed", () => {
    expect(lineageLine(null)).toBe("Where this came from");
  });

  it("asks the question when the row was never counted", () => {
    /* An id absent from the result is "not looked at", which is not "has none".
       The reader gives every id asked about an entry precisely so this case is
       distinguishable, and the surface must not collapse it. */
    expect(lineageLine(undefined)).toBe("Where this came from");
  });

  it("never renders the words 'came from 0'", () => {
    for (const c of [null, undefined, { ...NO_LINEAGE }]) {
      expect(lineageLine(c).toLowerCase()).not.toContain("came from 0");
      expect(lineageLine(c).toLowerCase()).not.toContain("led to 0");
    }
  });
});

describe("what it says when the read answered", () => {
  it("names both directions when both exist", () => {
    expect(lineageLine({ producedBy: 1, fed: 2, seededExcluded: 0 })).toBe(
      "Came from 1 · led to 2",
    );
  });

  it("names only the direction that exists", () => {
    expect(lineageLine({ producedBy: 3, fed: 0, seededExcluded: 0 })).toBe("Came from 3");
    expect(lineageLine({ producedBy: 0, fed: 5, seededExcluded: 0 })).toBe("Led to 5");
  });

  it("keeps 'only demo links' apart from genuinely unconnected", () => {
    /* S4's distinction. A row whose only links are fixtures should say so
       rather than read as unconnected work - and a row with nothing at all
       should not be labelled demo. */
    expect(lineageLine({ producedBy: 0, fed: 0, seededExcluded: 4 })).toBe("Only demo links");
    expect(lineageLine({ ...NO_LINEAGE })).toBe("Where this came from");
  });

  it("prefers the live count over the seeded note when both are present", () => {
    /* Seeded edges are excluded from the totals, so a row with live links and
       fixtures is a live row. The demo sentence is for rows that have ONLY
       fixtures. */
    expect(lineageLine({ producedBy: 2, fed: 0, seededExcluded: 9 })).toBe("Came from 2");
  });
});

describe("the ids we ask about", () => {
  it("deduplicates, because the board merges three lanes over one mission set", () => {
    expect(lineageIds(["a", "b", "a", "b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("drops absent ids rather than sending empty strings to a uuid validator", () => {
    expect(lineageIds(["a", null, undefined, "", "b"])).toEqual(["a", "b"]);
  });

  it("caps at 200, because the reader rejects more and a rejected call counts nothing", () => {
    /* Slicing here means a long board still gets counts on the rows a person is
       looking at. Letting the server refuse the whole call would give the board
       no counts at all - the same choice the lanes already make when they show
       the first rows and name the overflow. */
    const many = Array.from({ length: 250 }, (_, i) => `id-${i}`);
    expect(lineageIds(many)).toHaveLength(200);
  });
});
