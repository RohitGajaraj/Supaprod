/**
 * A CAUSE THE PLATFORM RECORDED OUTRANKS A SHAPE THE DRIVER INFERRED.
 *
 * S1's rule from the entry, 2026-09-10. A hold is the driver reading a count; a
 * halt is the platform saying it refused to run at all. On `6cc7a010` the run
 * screen's card leads with *"Design has been run many times over and the work
 * has not moved on once"* while the record holds twelve `out_of_credit` halts --
 * and of the six tracks that have ever held a halted run, FIVE halted for that
 * reason. It is the commonest real blocker this product has and no
 * top-of-screen surface has ever named it.
 *
 * A surface cannot act on that without the slug. `stopLine` renders the column
 * for a reader and renders it well; what it cannot do is let anything DECIDE,
 * because telling "out of credit" from "no progress for 4 hours" would mean
 * matching the sentence -- the trap this lane refused four times tonight.
 *
 * The column was already selected, so this costs no query and no hop.
 */
import { describe, expect, it } from "bun:test";

import { buildActivity } from "./activity";

const row = (over: Record<string, unknown> = {}) => ({
  id: "r-1",
  agent_slug: "ux-architect",
  agent_name: "Design",
  status: "halted",
  created_at: "2026-09-04T04:10:03Z",
  output: null,
  duration_ms: 612,
  tokens_used: null,
  spend_used_usd: null,
  trace_id: null,
  halted_reason: null,
  failure_kind: null,
  ...over,
});

const oneTurn = (over: Record<string, unknown> = {}) =>
  buildActivity({ runs: [row(over)] as never, members: [], creditsByTrace: {} })[0]!;

describe("the platform's own word reaches a surface", () => {
  it("carries the slug the halt path writes", () => {
    expect(oneTurn({ halted_reason: "out_of_credit" }).haltedReason).toBe("out_of_credit");
  });

  it("and still renders it for a reader, unchanged", () => {
    // The prose half is not replaced. A surface that wants to DECIDE reads the
    // slug; a person reads the sentence.
    expect(oneTurn({ halted_reason: "out_of_credit" }).stopLine).toBeTruthy();
  });
});

describe("what is NOT a slug is not offered as one", () => {
  /*
   * `halted_reason` is two vocabularies in one column, both live on production:
   * a slug the halt path writes (`out_of_credit`) and a whole sentence the stall
   * sweeper writes ("Stopped automatically: no progress for 4 hours..."). A
   * surface keying on the second would be matching prose in a field that merely
   * looks structured, which is worse than matching prose openly.
   *
   * Whitespace is the test, and it is exact rather than clever: a slug has none.
   */
  it("a whole sentence yields null", () => {
    const t = oneTurn({
      halted_reason: "Stopped automatically: no progress for 4 hours on this step.",
    });
    expect(t.haltedReason).toBeNull();
    // And the reader still gets it.
    expect(t.stopLine).toBeTruthy();
  });

  it("an absent reason yields null", () => {
    expect(oneTurn().haltedReason).toBeNull();
    expect(oneTurn({ halted_reason: "" }).haltedReason).toBeNull();
  });

  it("and a slug with stray whitespace round it still reads as a slug", () => {
    expect(oneTurn({ halted_reason: "  out_of_credit  " }).haltedReason).toBe("out_of_credit");
  });
});
