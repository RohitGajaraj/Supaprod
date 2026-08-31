import { describe, it, expect } from "bun:test";
import { whatItProduced, type ProducedMember } from "./what-it-produced";

const m = (kind: string, missing = false): ProducedMember => ({ kind, missing });

describe("what a station produced, as one sentence", () => {
  it("says the count and the plain noun, never the table's word", () => {
    /*
     * The nouns come from `wordFor`, which is the one vocabulary the chain and
     * the driver already share. **The first version of this test asserted
     * "patterns" and "drawings", which are words I invented rather than read**
     * -- `KIND_WORD` says `theme: cluster` and `prototype: prototype`. The test
     * failed, which is the system working: a surface may not coin a noun, and
     * neither may its test. §12: a "changeset" is a code change on every
     * surface or the rename has made things worse, and nothing in this file is
     * allowed to invent a word of its own.
     */
    expect(whatItProduced("Build", [m("changeset")])).toBe("Build filed 1 code change.");
    expect(whatItProduced("Plan", [m("prd")])).toBe("Plan filed 1 spec.");
  });

  it("joins several kinds plainly, in the order they were filed", () => {
    const out = whatItProduced("Discover", [m("theme"), m("signal"), m("signal"), m("theme")]);
    expect(out).toBe("Discover filed 2 clusters and 2 findings.");
  });

  it("counts repeats rather than hiding them", () => {
    /*
     * A station that drafted its prototype five times filed five, and that is a
     * fact worth reading. `station-file.ts` makes the OPPOSITE call for the
     * handed-over document, and deliberately: a file repeating one paragraph
     * five times is unreadable, a count is not.
     */
    expect(whatItProduced("Design", [m("prototype"), m("prototype"), m("prototype")])).toBe(
      "Design filed 3 prototypes.",
    );
  });

  it("says a member the lookup missed rather than subtracting it", () => {
    // `missing` means the row was looked for and was not there. A count that
    // quietly excluded them reports a tidier station than the one that exists.
    expect(whatItProduced("Ship", [m("deployment"), m("deployment", true)])).toBe(
      "Ship filed 1 release. One more no longer resolves to anything we can show.",
    );
    expect(
      whatItProduced("Ship", [m("deployment"), m("deployment", true), m("deployment", true)]),
    ).toBe("Ship filed 1 release. 2 more no longer resolve to anything we can show.");
  });

  it("STAYS SILENT when the station produced nothing, and that is the point", () => {
    /*
     * `StationPanel` already owns the empty case and says it better: it names
     * the noun the station was supposed to file ("Plan ran and filed no spec"),
     * and defers to the hold line when the hold already said it. A second
     * sentence here would repeat or contradict that, and `run-status.ts`
     * records what three copies of one fact on one screen cost.
     */
    expect(whatItProduced("Plan", [])).toBeNull();
    // Every member gone is still nothing PRODUCED, so the panel's own sentence
    // keeps the floor rather than this one claiming a filing that cannot be shown.
    expect(whatItProduced("Plan", [m("prd", true)])).toBeNull();
  });
});
