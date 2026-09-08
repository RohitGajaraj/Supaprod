import { describe, it, expect } from "bun:test";
import { whatItProduced, type ProducedMember } from "./what-it-produced";

const m = (kind: string, missing = false, title: string | null = null): ProducedMember => ({
  kind,
  missing,
  title,
});

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

  it("FOLDS the repeats into the thing they repeat, because a count alone flatters a stuck station", () => {
    /*
     * CAUGHT ON THE LIVE ACCEPTANCE CANDIDATE. `d2263583` reached Decide with 8
     * decisions -- 1 approved, 7 declined, four sharing one title, written in
     * pairs a minute apart across two sweeps. "Decide filed 8 decisions." was
     * true and the impression was false: a person infers eight distinct calls,
     * and one call re-made is what happened.
     *
     * The first fix said "4 of them say the same thing", which reports the
     * record as a defect. The fold says what was filed: one call, four times.
     */
    const out = whatItProduced("Decide", [
      m("decision", false, "Tablet address layout contributes to abandonment"),
      m("decision", false, "Do not attribute tablet checkout abandonment to address"),
      m("decision", false, "Do not attribute tablet checkout abandonment to address"),
      m("decision", false, "Do not attribute tablet checkout abandonment to address"),
      m("decision", false, "Do not attribute tablet checkout abandonment to address"),
    ]);
    expect(out).toBe(
      "Decide filed 5 decisions (4 on Do not attribute tablet checkout abandonment to address).",
    );
    expect(out).not.toContain("say the same thing");
  });

  it("one thing filed four times is four of that thing, not a confession", () => {
    /*
     * Seen live 2026-09-08: four prototypes of one screen under Ship read as
     * "4 of them say the same thing". They are one screen drawn four times.
     */
    const title = "Relay Checkout Tablet - Address Confirmation Screen (read-only)";
    const out = whatItProduced("Design", [
      m("prototype", false, title),
      m("prototype", false, title),
      m("prototype", false, title),
      m("prototype", false, title),
    ]);
    expect(out).toBe(`Design filed 4 prototypes of ${title}.`);
  });

  it("names each repeated thing when several repeat, rather than counting the repeats", () => {
    // Deduping would swap one wrong impression for another: how many times a
    // station filed the same thing is the fact that reveals the jam, so the
    // count stays and each repeated thing is named with its own count.
    const out = whatItProduced("Decide", [
      m("decision", false, "A"),
      m("decision", false, "A"),
      m("decision", false, "B"),
      m("decision", false, "B"),
    ]);
    expect(out).toBe("Decide filed 4 decisions (2 on A and 2 on B).");
  });

  it("keeps a fold readable inside a list of several kinds", () => {
    // The parenthesis is what keeps "4 of X" from reading as a fourth kind.
    const out = whatItProduced("Ship", [
      m("prototype", false, "Address screen"),
      m("prototype", false, "Address screen"),
      m("prototype", false, "Settings"),
      m("decision", false, "Go"),
      m("deployment", false, "v1"),
    ]);
    expect(out).toBe("Ship filed 3 prototypes (2 of Address screen), 1 decision and 1 release.");
  });

  it("says nothing extra when every filing is distinct", () => {
    const out = whatItProduced("Design", [
      m("prototype", false, "First cut"),
      m("prototype", false, "Second cut"),
    ]);
    expect(out).toBe("Design filed 2 prototypes.");
  });

  it("does not call untitled things repeats of each other", () => {
    /*
     * A signal carries no title, so keying on it would report every finding as
     * a repeat of every other. Untitled members are counted and never compared.
     */
    const out = whatItProduced("Discover", [m("signal"), m("signal"), m("signal")]);
    expect(out).toBe("Discover filed 3 findings.");
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
