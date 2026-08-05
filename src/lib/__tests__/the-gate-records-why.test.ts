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
  const fn = SRC.slice(SRC.indexOf("async function recordJudgment("));

  it("passes the workspace explicitly rather than letting the default guess", () => {
    // `decisions.workspace_id` is NOT NULL with a default of
    // current_user_default_workspace(). That exact trap put two bets in a
    // workspace that never saw their evidence, earlier the same night.
    expect(fn.slice(0, 4000)).toContain("workspace_id: input.workspaceId");
  });

  it("checks the error, because a refused write RESOLVES rather than throws", () => {
    // supabase-js does not throw on an RLS refusal. An unchecked insert reports
    // success having changed nothing, which is how this repo lost the
    // prd-to-mission edge for weeks.
    expect(fn.slice(0, 4000)).toMatch(/if \(error \|\| !decision\) return;/);
    expect(fn.slice(0, 4000)).toContain('.select("id")');
  });

  it("writes the lineage edge, or Learn can never walk back to the call", () => {
    expect(fn.slice(0, 4000)).toContain('parent_kind: "opportunity"');
    expect(fn.slice(0, 4000)).toContain('child_kind: "decision"');
  });

  it("never blocks the settle", () => {
    // The person's judgment is the fact; the record of it is a consequence. A
    // failure to file must not stop a bet being settled.
    expect(fn.slice(0, 4000)).toMatch(/catch \{/);
  });

  it("is actually called from the status update, not merely defined", () => {
    // The defect this whole file exists for was a capability that was never
    // invoked. Defining a second one would be the same mistake with a longer
    // comment on it.
    expect(SRC).toMatch(/await recordJudgment\(context\.supabase, context\.userId, \{/);
  });
});
