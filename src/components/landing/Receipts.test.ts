// Guards the truthfulness invariants of the "Receipts, not claims" beat.
//
// These are source-level assertions on purpose. The defects being locked out
// were never rendering bugs: they were CONSTANTS in the source (a hardcoded
// share slug that resolved to a seeded is_sample workspace; four invented
// ledger rows). A render test would have happily passed on both. The thing that
// has to stay true is a property of the file, so the file is what is asserted.
//
// ---------------------------------------------------------------------------
// 2026-08-09 - this file's RATCHET WAS REVERSED, and that is the whole point.
//
// It used to assert that the four "graded ledger" rows must never be dropped.
// That was written to stop an agent quietly deleting the WRONG row, which is a
// real risk and a good instinct. But it hardened the wrong object: those rows
// were invented, and the test made the fabrication load-bearing. Any agent
// trying to remove made-up data from the page whose entire argument is that the
// product does not make things up would have been stopped by a failing test.
//
// The rows are gone (founder ruling 2026-08-09). The ratchet now points the
// other way: the invented rows must never come BACK, and the argument they were
// propping up must never be dropped.
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(import.meta.dir, "Receipts.tsx"), "utf8");

// Everything below the doc comment. The header narrates the removed table on
// purpose (that is how the next agent learns why it went), so string assertions
// about absence have to look at the code, not the prose explaining the code.
const CODE = SRC.slice(SRC.indexOf("export function Receipts"));

describe("Receipts beat, truthfulness invariants", () => {
  it("hardcodes no decision share slug", () => {
    // Share slugs are 32 hex chars. Any literal /d/<slug> in this file is a
    // constant that cannot be verified as real at build time and WILL rot into
    // a link to a seed fixture, which is precisely what happened before.
    const hardcoded = SRC.match(/["'`]\/d\/[0-9a-f]{6,}["'`]/gi) ?? [];
    expect(hardcoded).toEqual([]);
  });

  it("ships no invented ledger rows", () => {
    // The four fabricated calls. If any of these strings is back, so is a table
    // of made-up graded decisions presented on the receipts page.
    for (const row of [
      "Week 02",
      "Week 04",
      "Week 07",
      "Week 11",
      "Kill the secondary product line",
      "Say no to the top-voted request",
      "Chase the big logo ahead of roadmap",
      "Reprice from seats to usage",
    ]) {
      expect(CODE).not.toContain(row);
    }
  });

  it("ships no worked-example disclosure, because there is nothing to disclose", () => {
    // A disclosure banner reappearing is the tell that the invented object
    // reappeared under it. The honest fix was never a louder label; it was not
    // shipping the thing that needs one.
    expect(CODE).not.toContain("Worked example");
    expect(CODE).not.toContain("not our data");
    expect(CODE.toLowerCase()).not.toContain("illustrative");
  });

  it("does not claim an illustrative table is our own data", () => {
    // The sentence that used to sit above the invented table. It scoped itself
    // to "every artifact here" while the table was inside that same "here".
    expect(CODE).not.toContain("Every artifact here is a live object");
  });

  it("links only destinations with something behind them", () => {
    // /proof renders three stacked empty states today ("Not enough recorded
    // outcomes yet", "0 decisions caught and corrected", "No public decisions
    // yet") because it reads from applyOutcome, which has never completed in
    // production. Three of this beat's five links used to land there.
    //
    // DELETE THIS ASSERTION the day one outcome settles. It encodes a fact
    // about the database, not a design rule, and /proof is a good link the
    // moment it has a row. Until then it is a dead end reached from the one
    // section that exists to prove we do not have dead ends.
    const hrefs = [...CODE.matchAll(/href[=:]\s*["'{]?["']?([^"'{}\s]+)["']?/g)].map((m) => m[1]);
    expect(hrefs).not.toContain("/proof");
    expect(hrefs.length).toBeGreaterThan(0);
  });

  it("keeps the argument the removed table was propping up (ratchet)", () => {
    // PINS THE IDEA, NOT THE SPELLING (2026-08-11). This line read
    // expect(CODE).toContain("Receipts,") until the practitioner-vocabulary
    // ruling retired that noun, at which point the guard and the copy could not
    // both be right and the cheapest way to pass was to delete the guard. That
    // is the failure mode of pinning a WORD: it makes a rename cost more than
    // leaving the wrong word in, and it protects the spelling while the claim
    // walks away. What is load-bearing here was never the noun. It is the
    // CONTRAST: this beat leads with something a stranger can go and check
    // INSTEAD of an assertion. So the shape is pinned and the noun is free.
    expect(CODE).toMatch(/\w+,\s*<br \/>\s*not claims\./);
    // The moat. This is the beat's actual claim and the only one on the landing
    // page that README names as defensible. It survived the table; it must
    // survive whatever comes next.
    //
    // THIS ASSERTION USED TO PIN THE STRING "cannot be backfilled", AND THAT WAS
    // A TEST GUARDING A FALSEHOOD (corrected 2026-08-10). The claim that a
    // decision record "cannot be backfilled" is falsified on the record: Vercel's
    // COO ran an agent over Slack, email and Gong, reconstructed the true cause
    // of a lost deal, and overturned the account executive's own account -- two
    // days to build, roughly $1,000 a year to run. Causes are recoverable from
    // raw exhaust, so the broad claim breaks the moment a well-read buyer tests
    // it, and a ratchet that pins it makes the falsehood harder to remove than
    // to keep.
    //
    // The moat is real but narrower: what cannot be reconstructed is a FORECAST
    // -- what a team believed WOULD happen, recorded before the outcome was
    // known. That is not an artifact and leaves no trace anywhere unless
    // something captured it at the moment of the call. So the ratchet now pins
    // the load-bearing idea rather than the sentence that expressed it, which is
    // what it should always have done: the wording is free to improve, the claim
    // is not free to disappear or to widen back into something false.
    expect(CODE).toMatch(/believed\s*<em>before<\/em>|believed .{0,20}before/);
    expect(CODE).toContain("forecast leaves no trace");
    expect(CODE).toContain("starts at zero, next year");
    // And the falsified form must not come back.
    expect(CODE).not.toMatch(/It cannot be\s+backfilled, bought, or bolted on/);
    // The thesis close.
    expect(CODE).toContain("is how you answer");
  });
});
