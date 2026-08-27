/**
 * THE SAME APPROVAL QUEUE TOLD TWO DIFFERENT STORIES DEPENDING ON THE DOOR.
 *
 * `listGovernApprovals` returns `gatesLiveWork`, which S0 added after F-128
 * measured that for 22 of 29 pending tool-call gates THE RUN THEY HELD WAS
 * ALREADY OVER. Approving one releases nothing.
 *
 * /approvals draws that correction. The Today queue draws it. The governance
 * ApprovalsPanel reads the same server function and did not, so it went on
 * telling a person "nothing runs until you decide or put it back on the clock"
 * about gates whose work had finished.
 *
 * One queue, one read, two accounts of the same row.
 *
 * The correction REPLACES the expiry consequence rather than joining it:
 * "nothing runs until you decide" and "the work has already finished" cannot
 * both be true, and `stillHoldsWork`'s own header says a caller renders it
 * INSTEAD.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { stillHoldsWork } from "@/components/approvals/still-holds-work";

const PANEL = "src/components/governance/ApprovalsPanel.tsx";

/** Comments quote the old sentence to explain it. */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

describe("one queue, two stories", () => {
  it("the governance panel now draws the same correction as the other two doors", () => {
    const body = code(readFileSync(PANEL, "utf8"));
    expect(body).toContain("stillHoldsWork");
    expect(body).toContain("a.gatesLiveWork");
  });

  it("and it replaces the expiry line rather than sitting beside it", () => {
    const body = code(readFileSync(PANEL, "utf8"));
    // The expiry arm must be the ELSE of the stranded arm. Both on screen would
    // put two contradictory accounts of one row in front of a person.
    expect(body).toMatch(/if \(stranded\)[\s\S]{0,120}\} else if \(expiry\)/);
  });

  /**
   * THE THIRD STATE IS THE WHOLE POINT. `false` means we looked and the work is
   * over; `null` means no mission on the approval or no run row for it, which
   * is the seven `memory.promote` rows F-128 found. Collapsing null into false
   * would tell a person the work had finished when nothing ever started.
   */
  it("only a measured false speaks; live and unknowable stay silent", () => {
    expect(stillHoldsWork(false)).toContain("already finished");
    expect(stillHoldsWork(true)).toBeNull();
    expect(stillHoldsWork(null)).toBeNull();
    expect(stillHoldsWork(undefined)).toBeNull();
  });

  it("the sentence offers no verb, because the controls beside it already do", () => {
    const said = stillHoldsWork(false)!;
    expect(said).not.toMatch(/\b(clear it|dismiss|delete|you should)\b/i);
  });
});
