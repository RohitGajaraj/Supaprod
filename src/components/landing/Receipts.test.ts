// Guards the two truthfulness invariants of the "Receipts, not claims" beat.
//
// These are source-level assertions on purpose. The defect being locked out was
// not a rendering bug: it was a CONSTANT in the source (a hardcoded share slug
// that resolved to a seeded is_sample workspace, the exact class of row /proof
// filters out). A render test would have happily passed on it. The thing that
// has to stay true is a property of the file, so the file is what is asserted.
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(import.meta.dir, "Receipts.tsx"), "utf8");

describe("Receipts beat, truthfulness invariants", () => {
  it("hardcodes no decision share slug", () => {
    // Share slugs are 32 hex chars. Any literal /d/<slug> in this file is a
    // constant that cannot be verified as real at build time and WILL rot into
    // a link to a seed fixture, which is precisely what happened before.
    const hardcoded = SRC.match(/["'`]\/d\/[0-9a-f]{6,}["'`]/gi) ?? [];
    expect(hardcoded).toEqual([]);
  });

  it("resolves the decision receipt through the sample-filtered server fn", () => {
    // listPublicDecisions applies the is_sample workspace filter server-side,
    // so whatever it returns is real by construction. If this import ever goes
    // away, the link went back to being asserted rather than read.
    expect(SRC).toContain("listPublicDecisions");
    expect(SRC).toContain("@/lib/decisions-share.functions");
  });

  it("does not claim the illustrative table is our own data", () => {
    // The sentence that used to sit above the invented table. It scoped itself
    // to "every artifact here" while the table was inside that same "here".
    expect(SRC).not.toContain("Every artifact here is a live object");
  });

  it("discloses the worked example above the faint-label threshold", () => {
    // The old disclosure was text-[10px] text-zinc-600, the faintest treatment
    // on the page. The banner must not regress to that weight.
    expect(SRC).toContain("Worked example");
    expect(SRC).toContain("not our data");
    const faintDisclosure = /text-\[10px\][^"]*text-zinc-600[^"]*"\s*>\s*\{?\s*Illustrative/i;
    expect(faintDisclosure.test(SRC)).toBe(false);
  });

  it("carries the example marker inside the table, so a crop keeps it", () => {
    // A screenshot cropped to the four rows is how a made-up table travels.
    const header = SRC.slice(SRC.indexOf("aria-hidden"));
    expect(header).toContain("example");
    // ...without losing the column's own label.
    expect(header).toContain("week");
  });

  it("keeps the section and every ledger row (ratchet)", () => {
    expect(SRC).toContain("Receipts,");
    for (const week of ["Week 02", "Week 04", "Week 07", "Week 11"]) {
      expect(SRC).toContain(week);
    }
    // The miss is the point of the beat and must never be quietly dropped.
    expect(SRC).toContain('"WRONG"');
  });
});
