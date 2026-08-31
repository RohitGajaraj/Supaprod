/**
 * A MISSED FORECAST COMES BACK AS ORDINARY WORK — gap #4, the return edge.
 *
 * `Learn -> Discover` has processed ZERO workspaces in its life (F-51). The
 * playbook's Stage 6 turns a breach into a **normal, refusable piece of work**
 * re-entering at Stage 1 rather than a special object, and that is what these
 * assert: what it says, and which misses still owe one.
 *
 * **And it is the acceptance path (F-164).** 18 of 20 tracks ever driven were
 * PRESSED as their first drive — the composer creates and presses in the same
 * breath — so every track born through the front door is disqualified from the
 * acceptance at birth. A track from this edge carries no press.
 */
import { describe, expect, it } from "bun:test";

import {
  returnedWorkTitle,
  returnedWorkOrigin,
  missesStillOwedWork,
  type MissedForecast,
} from "./return-edge";

const miss = (over: Partial<MissedForecast> = {}): MissedForecast => ({
  learningId: "l1",
  decisionId: "d1",
  forecastClaim: "Checkout abandonment falls below 5% within 7 days of rollout",
  howWeWillKnow: "The tablet checkout funnel in analytics",
  horizonDate: "2026-09-15",
  summary: "Abandonment sat at 31% two weeks after rollout",
  decisionTitle: "Skip the address re-confirm when nothing changed",
  ...over,
});

describe("what the returning work says", () => {
  it("states the gap rather than the status", () => {
    // "Forecast missed" is a status a person cannot act on and would not write.
    const t = returnedWorkTitle(miss());
    expect(t).toContain("did not happen");
    expect(t).toContain("Skip the address re-confirm");
    expect(t.toLowerCase()).not.toContain("forecast missed");
  });

  it("falls back to the claim when the decision has no title", () => {
    expect(returnedWorkTitle(miss({ decisionTitle: "  " }))).toContain("Checkout abandonment");
  });

  it("says plainly that it cannot say, rather than inventing a title", () => {
    const t = returnedWorkTitle(miss({ decisionTitle: null, forecastClaim: null }));
    expect(t).toContain("cannot say");
  });

  it("CARRIES THE FORECAST VERBATIM, because a grade must carry what it grades", () => {
    /*
     * The same reason `verdict.md` copies its forecast rather than linking it
     * (SPEC-STATION-MODEL §2.5): a claim rendered by lookup can be read after
     * the source row changed, and the next station would then be deciding
     * against a claim it cannot see.
     */
    const o = returnedWorkOrigin(miss());
    expect(o).toContain("Checkout abandonment falls below 5%");
    expect(o).toContain("2026-09-15");
    expect(o).toContain("The tablet checkout funnel in analytics");
    expect(o).toContain("Abandonment sat at 31%");
  });

  it("SAYS IT IS REFUSABLE, which is the whole adoption", () => {
    expect(returnedWorkOrigin(miss())).toContain("declined");
  });

  it("omits what it does not know instead of printing an empty label", () => {
    const o = returnedWorkOrigin(miss({ howWeWillKnow: null, horizonDate: null, summary: "  " }));
    expect(o).not.toContain("How we said");
    expect(o).not.toContain("By:");
    expect(o).not.toContain("What actually happened:");
  });
});

describe("which misses still owe a piece of work", () => {
  const none = { learningIds: new Set<string>(), decisionIds: new Set<string>() };

  it("a fresh miss owes one", () => {
    expect(missesStillOwedWork([miss()], none).map((m) => m.learningId)).toEqual(["l1"]);
  });

  it("a learning that already returned is skipped", () => {
    const seen = { learningIds: new Set(["l1"]), decisionIds: new Set<string>() };
    expect(missesStillOwedWork([miss()], seen)).toEqual([]);
  });

  it("A DECISION THAT ALREADY RETURNED IS SKIPPED TOO, and F-158 is why", () => {
    // The only two real learnings this product has recorded are the SAME
    // learning, written by two agents 26 seconds apart against one decision.
    // Deduping on the learning alone turns one miss into two identical pieces
    // of work -- the duplicate-output defect reaching the backlog a person reads.
    const seen = { learningIds: new Set<string>(), decisionIds: new Set(["d1"]) };
    expect(missesStillOwedWork([miss({ learningId: "l2" })], seen)).toEqual([]);
  });

  it("TWO LEARNINGS FOR ONE DECISION IN THE SAME BATCH yield ONE piece of work", () => {
    /*
     * The database index cannot catch this: the two rows carry different
     * `from_learning_id` values, so both would be accepted. It has to be caught
     * here, within the pass, which is exactly the F-158 shape arriving in one
     * batch rather than across two.
     */
    const out = missesStillOwedWork([miss({ learningId: "l1" }), miss({ learningId: "l2" })], none);
    expect(out.map((m) => m.learningId)).toEqual(["l1"]);
  });

  it("but two misses on DIFFERENT decisions both owe work", () => {
    const out = missesStillOwedWork(
      [miss({ learningId: "l1", decisionId: "d1" }), miss({ learningId: "l2", decisionId: "d2" })],
      none,
    );
    expect(out).toHaveLength(2);
  });

  it("a miss with no decision is never suppressed by another miss with no decision", () => {
    // Null is not an identity. Two unattributed misses are two misses.
    const out = missesStillOwedWork(
      [miss({ learningId: "l1", decisionId: null }), miss({ learningId: "l2", decisionId: null })],
      none,
    );
    expect(out).toHaveLength(2);
  });
});
