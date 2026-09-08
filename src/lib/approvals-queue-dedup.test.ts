/**
 * THE SAME JUDGMENT MUST NOT BE QUEUED TWICE.
 *
 * Measured on production 2026-08-10: 172 decisions sat pending, 170 of them
 * `source_kind: 'mission'`. Of those, 155 belonged to a mission whose own
 * status was still 'proposed' — work nobody had agreed to run yet. There were
 * 228 proposed missions at the same moment, each already carrying its own
 * "Review and launch" gate, which studio.functions fetches separately for
 * exactly that reason.
 *
 * So the queue asked a person to judge the same proposal twice: once where
 * pressing the button launches the work, and once where pressing it does
 * nothing. `updateDecision` and `routeDecision` are a decision's only
 * resolvers and both do one thing — flip a status, write a stage event.
 * Confirmed at the database as well, because application code could not settle
 * it alone: `decisions_reactor_fanout` fires on INSERT only, does not branch on
 * status, and no 'decision.made' subscription is enabled.
 *
 * That duplicate is what made the queue read as 172 items of homework. It is
 * the concrete thing behind "why does an agentic-first product hand me a
 * hundred things to approve".
 *
 * WHY FILTERED AND NOT AUTO-APPROVED, which is the decision worth pinning:
 * marking these approved would assert that a human agreed to work they have
 * never seen, on a mission still awaiting launch. That is consent they did not
 * give. Hiding a duplicate claims nothing at all. The row stays pending and
 * honest; it simply stops being counted as a second call while the first is
 * still open.
 *
 * These guards are source-level because the defect is an ABSENT filter, and an
 * absent filter is what a happy-path test never sees.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..");

/** Comments stripped: this fix is documented by describing the old behaviour,
 *  and a scan that cannot tell code from prose about code would match the
 *  explanation. Same lesson as `the-brain-does-not-rank-fiction`. */
function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const QUEUE = codeOf(readFileSync(join(SRC, "lib", "approvals-queue.functions.ts"), "utf8"));
// Since 2026-09-08 the mission's status rides the decisions read itself (the
// hop that hydrates the "From <title>" line), not a read of the queue's own:
// the Inbox's 7.7 s was twelve dependent round trips and this was one of them.
const DECISIONS = codeOf(readFileSync(join(SRC, "lib", "decisions.functions.ts"), "utf8"));

describe("a decision whose mission is still proposed is not a second call", () => {
  it("the queue reads mission status to decide what to drop", () => {
    expect(DECISIONS).toMatch(/\.from\("missions"\)\.select\("id,title,status"\)/);
    expect(DECISIONS).toMatch(
      /d\.mission_status = d\.mission_id \? \(missionStatus\.get\(d\.mission_id\) \?\? null\) : null;/,
    );
    expect(QUEUE).toMatch(/d\.mission_status === "proposed"/);
  });

  it("the filter is applied to the pending list the queue renders", () => {
    // The dedup has to reach `pendingDecisions`, the variable every downstream
    // mapping reads. Computing the set and not applying it would look correct
    // in review and change nothing on screen.
    expect(QUEUE).toMatch(/mission_status === "proposed"/);
    expect(QUEUE).toMatch(/const pendingDecisions = rawPendingDecisions\.filter\(/);
  });

  it("a decision with no mission is never dropped", () => {
    // 7 of the 170 carried no mission row at all. A null mission_id must not
    // match the proposed set, or a real call vanishes because of a missing
    // foreign key rather than because of a duplicate.
    expect(QUEUE).toMatch(/d\.mission_id && d\.mission_status === "proposed"/);
  });

  it("a failed lookup shows everything rather than hiding a call", () => {
    // Fail-open, deliberately, and it is the opposite of the usual default.
    // Showing a duplicate is a nuisance; dropping a real decision because a
    // lookup failed is a call nobody ever sees. The read error is reported
    // through the queue's own noteReadError rather than swallowed.
    // The decisions read hands its hydration error up instead of swallowing
    // it, and the queue files it under the dedup's own name, right before the
    // filter that would have used it.
    expect(DECISIONS).toMatch(
      /hydrationError: missions\.error \?\? prds\.error \?\? meetings\.error \?\? null/,
    );
    const at = QUEUE.indexOf(
      'noteReadError("proposed-mission dedup", decisionsRes.hydrationError)',
    );
    expect(at).toBeGreaterThan(-1);
    expect(QUEUE.slice(at, at + 400)).toMatch(
      /const pendingDecisions = rawPendingDecisions\.filter\(/,
    );
  });

  it("nothing here approves a decision", () => {
    // The whole point. If a future edit turns this filter into a status write,
    // it starts asserting consent a human never gave, and that is a far worse
    // defect than the duplicate it replaced.
    const block = QUEUE.slice(QUEUE.indexOf("rawPendingDecisions"));
    const window = block.slice(0, 1500);
    expect(window).not.toMatch(/status:\s*"approved"/);
    expect(window).not.toMatch(/updateDecision/);
  });
});
