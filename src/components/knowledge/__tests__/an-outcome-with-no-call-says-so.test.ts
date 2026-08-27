/**
 * AN OUTCOME LINKED TO NOTHING SAID NOTHING, ON THE PANEL WHOSE JOB IS THE CAUSE.
 *
 * LearningDetail's "Where it points" region rendered only when at least one of
 * `decision_id`, `opportunity_id` or `prd_id` existed. With none of them the
 * whole section was absent, and a reader could not tell an outcome that was
 * never measured against a call from a section they had scrolled past.
 *
 * MEASURED ON THE LIVE DATABASE, 2026-08-27: 135 learnings, 133 with a NULL
 * `decision_id` -- F-65 records the same figure and the reason, that the column
 * only started being written that day -- and 35 with no opportunity, spec or
 * decision at all. The silent case is not an edge here. It is almost every row
 * a person opens.
 *
 * A MISSING LINK IS NOT "THERE WAS NO CALL". Saying nothing lets a reader
 * conclude the outcome was never measured against anything, which is the
 * reassuring reading of a gap in our own wiring, on the surface that exists to
 * show the record compounding.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync("src/components/knowledge/LearningDetail.tsx", "utf8");

/** Prose only: the comment explaining the fix has to describe the old shape. */
const body = SRC.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

describe("an outcome with no call says so", () => {
  it("the region is no longer gated on having a link", () => {
    // The old shape was `{l.opportunity_id || l.prd_id || gradedDecision ? (`
    // immediately before the region. If that returns, the silent case returns.
    expect(body).not.toMatch(/l\.opportunity_id \|\| l\.prd_id \|\| gradedDecision \?/);
    expect(body).toContain('<Region title="Where it points">');
  });

  it("and says which link is missing, in words that do not blame the record", () => {
    expect(body).toContain("No call is linked to this outcome");
    expect(body).toContain("Nothing else is linked either");
    // The explanation names OUR wiring as the cause, not the workspace's.
    expect(body).toContain("outcomes recorded before that was wired carry none");
  });

  it("never states the absence as a verdict about the work", () => {
    const said = body.toLowerCase();
    // "This was never measured" and "no decision was made" are the two readings
    // this region must not hand a person, because neither is knowable from a
    // null column.
    expect(said).not.toContain("was never measured");
    expect(said).not.toContain("no decision was made");
  });
});
