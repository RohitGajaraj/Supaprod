import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { judgmentFor } from "@/lib/discovery.functions";

/**
 * THE JUDGMENT GATE RECORDED THAT A CALL HAPPENED, NEVER WHY.
 *
 * WHAT WAS MISSING. Decide is the highest-stakes human act in the product: keep
 * this bet or kill it. Settling one wrote a status enum on `opportunities` and a
 * `stage_events` row, and nothing else. Measured on the live database while
 * fixing it: 267 `decisions` rows exist and EVERY ONE carries a rationale --
 * from missions, specs, the roadmap, the Critic, retrospectives, meetings -- and
 * NOT ONE came from the gate. `createDecision` has call sites; /decide was not
 * one of them.
 *
 * WHY IT BREAKS THE MOAT RATHER THAN A REPORT. Layer 03 is the only layer
 * defensible alone: a settled outcome re-ranks the next call. Learn grades a
 * decision against what actually happened, and it cannot grade a judgment that
 * left no reasoning behind. The single richest signal the product generates --
 * a human weighing evidence and choosing -- was thrown away at the instant it
 * was made, and every later recommendation was poorer for it.
 *
 * NOTHING COULD SEE IT. Every write succeeded. The status changed, the stage
 * event landed, the receipt printed, the UI was correct. The absence is only
 * visible by asking a question no single query asked: which decisions came from
 * the gate.
 */

const SRC = readFileSync(join(import.meta.dir, "..", "discovery.functions.ts"), "utf8");

const BET = { title: "Skip the address re-confirm", impact: 8, confidence: 7, ease: 5 };

describe("what counts as a judgment, and what is only scheduling", () => {
  it("dropping a bet is a rejection", () => {
    const j = judgmentFor({ row: BET, from: "backlog", to: "dropped" });
    expect(j?.verdict).toBe("rejected");
  });

  for (const lane of ["now", "next"]) {
    it(`promoting into ${lane} is an approval`, () => {
      expect(judgmentFor({ row: BET, from: "backlog", to: lane })?.verdict).toBe("approved");
    });
  }

  for (const lane of ["later", "backlog", "shipped"]) {
    it(`moving to ${lane} records nothing, because it is scheduling`, () => {
      // A decision log that records everything records nothing. Filing every
      // drag between lanes would bury the calls that were actually made, which
      // is the failure mode that makes most decision logs useless.
      expect(judgmentFor({ row: BET, from: "now", to: lane })).toBeNull();
    });
  }
});

describe("the reasoning is assembled from the row, never typed and never invented", () => {
  it("names the lane it moved between and the score it was judged on", () => {
    const j = judgmentFor({ row: BET, from: "backlog", to: "next" });
    expect(j?.rationale).toBe(
      "Kept at the gate, from backlog to next, scored impact 8/10, confidence 7/10, ease 5/10.",
    );
  });

  it("a drop says the evidence survives it, because it does", () => {
    // Dropping does not delete anything: the theme, its signals and the lineage
    // all remain, and the surface says so. The record must agree with it.
    const j = judgmentFor({ row: BET, from: "now", to: "dropped" });
    expect(j?.rationale).toContain("The evidence stays on the record");
  });

  it("drops a missing number rather than defaulting it", () => {
    // A fabricated "5 out of 10" is indistinguishable from a real one, which
    // makes it worse than a shorter sentence. This is the whole difference
    // between a record and a plausible story.
    const j = judgmentFor({ row: { title: "Bare bet" }, from: null, to: "dropped" });
    expect(j?.rationale).not.toMatch(/impact|confidence|ease|\/10/);
    expect(j?.rationale).toContain("set to dropped");
  });

  it("keeps whichever numbers are real when only some are", () => {
    const j = judgmentFor({ row: { title: "Half", impact: 9 }, from: "backlog", to: "now" });
    expect(j?.rationale).toContain("impact 9/10");
    expect(j?.rationale).not.toContain("confidence");
  });

  it("falls back to a noun rather than an empty title", () => {
    expect(judgmentFor({ row: {}, from: null, to: "dropped" })?.title).toBe("This bet");
    expect(judgmentFor({ row: null, from: null, to: "dropped" })?.title).toBe("This bet");
  });

  it("is pure: the same settle produces the same sentence", () => {
    const a = judgmentFor({ row: BET, from: "backlog", to: "next" });
    const b = judgmentFor({ row: BET, from: "backlog", to: "next" });
    expect(a).toEqual(b);
  });
});

describe("the write is wired the way this repo has learned to wire writes", () => {
  /*
   * BOUNDED BY THE FUNCTION, NOT BY A CHARACTER COUNT.
   *
   * Every assertion below used to read `fn`. On 2026-08-24
   * `recordJudgment` grew a forecast branch (FC-01's human half) and three of
   * those assertions failed at once -- not because the guard, the lineage edge
   * or the catch had gone anywhere, but because they had moved past character
   * 4000. A window sized to yesterday's function is a guard that fails on
   * growth and cannot tell growth from removal, which is the one distinction it
   * exists to make.
   *
   * So the slice runs to the function's own closing brace. `\n}` at column zero
   * is the end of a top-level function in this file's formatting, and nothing
   * inside is indented that far left.
   */
  const fnStart = SRC.indexOf("async function recordJudgment(");
  const fn = SRC.slice(fnStart, SRC.indexOf("\n}", fnStart) + 2);

  it("passes the workspace explicitly rather than letting the default guess", () => {
    // `decisions.workspace_id` is NOT NULL with a default of
    // current_user_default_workspace(). That exact trap put two bets in a
    // workspace that never saw their evidence, earlier the same night.
    expect(fn).toContain("workspace_id: input.workspaceId");
  });

  it("checks the error, because a refused write RESOLVES rather than throws", () => {
    // supabase-js does not throw on an RLS refusal. An unchecked insert reports
    // success having changed nothing, which is how this repo lost the
    // prd-to-mission edge for weeks.
    //
    // ASSERTS THE CHECK, NOT ITS BODY. This pinned `if (error || !decision) return;`
    // and went red on 2026-08-06 when the branch grew a `console.error` naming
    // WHICH failure happened -- a refusal that returns no row reads differently
    // from a driver error, and silently returning told the next reader neither.
    // The guard is what matters; a bare `return` was never the requirement, and
    // pinning it would keep punishing every improvement to it.
    const guard = fn.replace(/\s+/g, " ");
    expect(guard).toMatch(/if \(error \|\| !decision\)/);
    expect(fn).toContain('.select("id")');
    // And it must not fall through into the lineage write on a refusal, which is
    // the actual defect this test exists to prevent: an orphan decision edge
    // pointing at a row that was never inserted.
    //
    // THE PATTERN ASSERTS THAT IT RETURNS, NOT WHAT IT RETURNS, which is the same
    // correction the paragraph above made once already. This read `/return;/` and
    // went red on 2026-08-06 when the guard began returning `{ recorded: false }`
    // -- `recordJudgment` hands its outcome back now, so /decide's drop receipt
    // can stop asserting "and so does the call" on a press whose insert was
    // thrown away. A bare `return` was never the requirement; leaving the whole
    // path unreturned is.
    const afterGuard = guard.slice(guard.indexOf("if (error || !decision)"));
    expect(afterGuard.slice(0, 400)).toMatch(/return(;| \{)/);
  });

  it("writes the lineage edge, or Learn can never walk back to the call", () => {
    expect(fn).toContain('parent_kind: "opportunity"');
    expect(fn).toContain('child_kind: "decision"');
  });

  it("never blocks the settle", () => {
    // The person's judgment is the fact; the record of it is a consequence. A
    // failure to file must not stop a bet being settled.
    expect(fn).toMatch(/catch \{/);
  });

  it("is actually called from the status update, not merely defined", () => {
    // The defect this whole file exists for was a capability that was never
    // invoked. Defining a second one would be the same mistake with a longer
    // comment on it.
    expect(SRC).toMatch(/await recordJudgment\(context\.supabase, context\.userId, \{/);
  });
});
