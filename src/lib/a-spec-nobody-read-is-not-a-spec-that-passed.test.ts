/**
 * F-116: THE ACCEPTANCE WAS IMPOSSIBLE BY CONSTRUCTION, AND THREE COLUMNS SAY SO.
 *
 * R-18 asks for one piece of work walking seven stations with no human touching
 * it mid-run. Measured on production 2026-08-27, the path from Define to Ship
 * passes three states, and a person is the only writer of every one:
 *
 *   · `prds.status` -- no `prd.approve` tool exists; the only review->approved
 *     write is the human tray at approvals-queue.functions.ts:1403.
 *   · `prds.design_gate_status` -- 116 of 119 `pending`; the only writer is
 *     `decideDesignGate`, behind `requireSupabaseAuth`, stamping
 *     `design_decided_by: userId`.
 *   · the success metric -- 117 of 119 specs carry none at all.
 *
 * Ship reads the first two and refuses, which is why tracks die one station
 * from `learn` having done all the work.
 *
 * THE CAUSE IS NOT A MISSING PERMISSION. `design-critic` is already in Design's
 * crew doing exactly this judgement, and its filing line said *"say plainly if
 * it is sound as it stands"* -- so a PASS left no trace. Only a change wrote
 * anything. `pending` therefore meant both "nobody looked" and "the critic
 * looked and it was fine". This gate reads the verdict that seat files instead.
 *
 * WHAT THESE TESTS ARE GUARDING. A gate on a LEVER, not on a receipt. Every one
 * must fail on ABSENCE, and no combination of good signals may ever overturn a
 * person's refusal. The property test at the bottom is the real assertion: it
 * takes the one input set that clears, blanks each field in turn, and requires
 * every single one to ask.
 */
import { describe, expect, it } from "bun:test";

import {
  decideSpecReview,
  SPEC_CLEAR_MIN_CONFIDENCE,
  type SpecReviewInputs,
} from "@/lib/spec-gate";

/** The one shape that clears. Every test below is this, minus one thing. */
const CLEARS: SpecReviewInputs = {
  status: "review",
  designGateStatus: "pending",
  criticVerdict: "ship",
  criticConfidence: 0.9,
  criticMissingEvidence: [],
  designVerdict: "ship",
  successMetrics: [{ text: "Address-screen abandonment at or under 5%", oracleKind: "eval" }],
  servesABet: true,
};

const decide = (over: Partial<SpecReviewInputs> = {}) => decideSpecReview({ ...CLEARS, ...over });

describe("the case the whole module exists for", () => {
  it("a spec both seats cleared, with a metric something can check, does not wait for a person", () => {
    const d = decide();
    expect(d.action).toBe("clear");
    expect(d.status).toBe("approved");
    expect(d.reason).toContain("did not need to wait for you");
  });

  it("and it clears while design_gate_status is still 'pending'", () => {
    // The point stated as an assertion. 116 of 119 rows sit on `pending` because
    // nobody answered a human-only column, not because anything was refused.
    expect(decide({ designGateStatus: "pending" }).action).toBe("clear");
    expect(decide({ designGateStatus: null }).action).toBe("clear");
  });

  it("a draft clears too, because 'draft' is where an unlinked spec sits", () => {
    expect(decide({ status: "draft" }).action).toBe("clear");
  });
});

describe("a person's refusal is absolute, and is read before anything else", () => {
  it("a rejected design gate asks, however good every other signal is", () => {
    const d = decide({ designGateStatus: "rejected" });
    expect(d.action).toBe("ask");
    expect(d.reason).toContain("nothing here reopens that");
  });

  it("it is checked FIRST, so no later gate can be reached to overturn it", () => {
    // Every other input simultaneously broken: the sentence must still be the
    // human-refusal one, not whichever gate happens to fire second.
    const d = decideSpecReview({
      status: null,
      designGateStatus: "rejected",
      criticVerdict: null,
      criticConfidence: null,
      criticMissingEvidence: null,
      designVerdict: null,
      successMetrics: [],
      servesABet: false,
    });
    expect(d.reason).toContain("turned this design down");
  });
});

describe("each gate names a DIFFERENT next action, rather than 'needs review'", () => {
  it("nobody red-teamed it", () => {
    expect(decide({ criticVerdict: null }).reason).toContain("nobody having looked");
  });

  it("the Critic said kill, and the sentence does not call it fixable", () => {
    expect(decide({ criticVerdict: "kill" }).reason).toContain("should not be built at all");
  });

  it("the Critic said revise, and the sentence does not call it dead", () => {
    expect(decide({ criticVerdict: "revise" }).reason).toContain("changed before it goes anywhere");
  });

  it("the Critic listed something still missing, and the sentence quotes it", () => {
    const d = decide({ criticMissingEvidence: ["no baseline for the abandonment number"] });
    expect(d.action).toBe("ask");
    expect(d.reason).toContain("no baseline for the abandonment number");
  });

  it("no design verdict was filed", () => {
    expect(decide({ designVerdict: null }).reason).toContain(
      "read this design back against the spec",
    );
  });

  it("the design does not match the spec", () => {
    expect(decide({ designVerdict: "revise" }).reason).toContain("does not do what the spec asked");
  });

  it("it serves no bet, so nothing could grade it", () => {
    expect(decide({ servesABet: false }).reason).toContain("nothing could grade it afterwards");
  });

  it("it is already settled", () => {
    expect(decide({ status: "shipped" }).reason).toContain("already shipped");
    expect(decide({ status: "approved" }).reason).toContain("already approved");
  });
});

describe("F-115 as arithmetic: unmeasurable blocks, unmet does not", () => {
  it("no success metric at all means the verdict could never arrive", () => {
    const d = decide({ successMetrics: [] });
    expect(d.action).toBe("ask");
    expect(d.reason).toContain("could never be judged");
  });

  it("an UNCLASSIFIED metric asks, because null is not 'fine'", () => {
    // 117 of 119 live specs are in this shape. `oracle_kind: null` means nobody
    // has said how this would be checked, which is not the same as checkable.
    const d = decide({
      successMetrics: [{ text: "Checkout feels faster", oracleKind: null }],
    });
    expect(d.action).toBe("ask");
    expect(d.reason).toContain("Nothing can check");
  });

  it("an explicitly unverifiable metric asks", () => {
    expect(
      decide({ successMetrics: [{ text: "Users are happier", oracleKind: "unverifiable" }] })
        .action,
    ).toBe("ask");
  });

  it("ONE unmeasurable metric among good ones is enough to ask", () => {
    const d = decide({
      successMetrics: [
        { text: "Abandonment at or under 5%", oracleKind: "eval" },
        { text: "It feels premium", oracleKind: null },
      ],
    });
    expect(d.action).toBe("ask");
    expect(d.reason).toContain("It feels premium");
  });

  it("but a metric that is simply NOT YET TRUE never blocks anything", () => {
    /*
     * The F-115 half, and the reason this file names both directions. Ship was
     * refusing because "~33% abandonment, far above the target". This gate has
     * no access to the metric's current VALUE and deliberately never will: a
     * forecast is graded at Learn, and it is the reason to ship rather than a
     * condition for shipping.
     */
    const d = decide({
      successMetrics: [
        { text: "Address-screen abandonment at or under 5% within 7 days", oracleKind: "eval" },
      ],
    });
    expect(d.action).toBe("clear");
  });

  it("and nothing in the input shape can even express a current value", () => {
    // Stated structurally, so a future edit that adds one has to break this.
    expect(Object.keys(CLEARS.successMetrics[0]!).sort()).toEqual(["oracleKind", "text"]);
  });
});

describe("confidence is tested positively, so a missing number asks", () => {
  it("below the bar asks", () => {
    expect(decide({ criticConfidence: SPEC_CLEAR_MIN_CONFIDENCE - 0.01 }).action).toBe("ask");
  });

  it("exactly at the bar clears", () => {
    expect(decide({ criticConfidence: SPEC_CLEAR_MIN_CONFIDENCE }).action).toBe("clear");
  });

  it("null, NaN and out-of-range all ask", () => {
    /*
     * decision-gate.ts gate 4 was the one gate in this house that failed OPEN,
     * because it asked whether a value was BAD rather than whether it was GOOD.
     * `criticConfidence` is assembled from model output, where a field going
     * missing is routine, so the same shape would fail the same way.
     */
    for (const bad of [null, Number.NaN, -1, 1.5, 42]) {
      expect(decide({ criticConfidence: bad as number }).action, `confidence ${bad}`).toBe("ask");
    }
  });

  it("the bar is above the settle floor, because acting is not the same as claiming", () => {
    expect(SPEC_CLEAR_MIN_CONFIDENCE).toBeGreaterThan(0.45);
  });
});

describe("THE PROPERTY: every gate fails on absence", () => {
  /*
   * The real assertion of this file, and the one that survives someone adding a
   * gate without reading the header. A spec is a LEVER: clearing it is what
   * unblocks Ship. So take the input set that clears, blank ONE field, and every
   * single one must stop being a clearance.
   */
  const BLANKED: Array<[string, Partial<SpecReviewInputs>]> = [
    ["status", { status: null }],
    ["criticVerdict", { criticVerdict: null }],
    ["criticConfidence", { criticConfidence: null }],
    ["designVerdict", { designVerdict: null }],
    ["successMetrics", { successMetrics: [] }],
    ["servesABet", { servesABet: false }],
    ["the metric's oracle", { successMetrics: [{ text: "x", oracleKind: null }] }],
  ];

  it.each(BLANKED)("blanking %s stops the clearance", (_name, over) => {
    expect(decide(over).action).toBe("ask");
  });

  it("and the one field whose absence is HARMLESS is the human column", () => {
    // Deliberate and the whole point: `design_gate_status` unset means nobody
    // was asked, and the gate's job is to stop that from reading as a refusal.
    expect(decide({ designGateStatus: null }).action).toBe("clear");
  });
});

describe("the facts are recorded whichever way it went", () => {
  it("a clearance carries what it rested on, so a person can overturn it", () => {
    const d = decide();
    expect(d.because.join(" ")).toContain("The Critic said ship");
    expect(d.because.join(" ")).toContain("The design lens said ship");
    expect(d.because.join(" ")).toContain("1 success metric, 0 of which nothing can check");
  });

  it("a refusal carries the same facts, so the desk item says what it already has", () => {
    // A tray item that cannot say what it already has is how a queue becomes
    // 172 items long, which is the floor decision-gate.ts was built to close.
    const d = decide({ criticVerdict: null });
    expect(d.action).toBe("ask");
    expect(d.because.join(" ")).toContain("No Critic has red-teamed this spec");
    expect(d.because.join(" ")).toContain("It serves a recorded bet");
  });

  it("the facts never claim a signal that is absent", () => {
    const d = decideSpecReview({
      status: null,
      designGateStatus: null,
      criticVerdict: null,
      criticConfidence: null,
      criticMissingEvidence: null,
      designVerdict: null,
      successMetrics: [],
      servesABet: false,
    });
    const said = d.because.join(" ");
    expect(said).toContain("Spec status: unknown");
    expect(said).toContain("Design gate: never set");
    expect(said).toContain("No design verdict has been filed");
    expect(said).toContain("carries no success metric");
  });
});

describe("the record can name who caused this, or says that it cannot", () => {
  /*
   * S4 measured the two places this product already lost the answer to "who did
   * it", and both lost it the same way: `agent_approvals.decided_by` is NULL, so
   * F-79's disqualifying human act had to be found by reading a log; and
   * `forecast_resolved_by_agent_slug` is NULL on ALL 91 resolved forecasts, so
   * not one verdict this product exists to produce can name its author.
   *
   * In both cases the empty column later read as "no agent did this" when it
   * only ever meant "the record cannot say".
   */
  it("names the seat whose review was read", () => {
    const d = decide({ consideredBy: "design-critic" });
    expect(d.because.join(" ")).toContain("Considered after design-critic filed its review");
  });

  it("and says plainly when it cannot, rather than staying silent", () => {
    const d = decide({ consideredBy: null });
    expect(d.because.join(" ")).toContain("cannot name which seat's review produced this");
  });

  it("an unknown actor NEVER changes the outcome", () => {
    /*
     * The important half. A clearance that depended on WHICH seat asked would be
     * one an agent could shop for by calling from a different seat, and a
     * clearance that REFUSED on an unknown actor would hand every unattributed
     * call to a person for a reason that is about our plumbing.
     */
    expect(decide({ consideredBy: null }).action).toBe("clear");
    expect(decide({ consideredBy: "design-critic" }).action).toBe("clear");
    expect(decide({ consideredBy: "some-seat-invented-tomorrow" }).action).toBe("clear");
  });
});
