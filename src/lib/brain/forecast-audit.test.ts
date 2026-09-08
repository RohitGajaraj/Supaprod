import { describe, expect, test } from "bun:test";
import {
  forecastAuditPrompt,
  parseAuditReply,
  AUDITOR_SLUG,
  linkedOutcomeIsSettled,
  nothingCouldMeasureIt,
} from "./forecast-audit.server";
import { AUTO_SETTLE_CONFIDENCE_FLOOR, canAutoSettle } from "./forecast-resolution";
import { readKitAsText } from "./what-the-grader-read";

describe("parseAuditReply (FC-01)", () => {
  test("keeps a well formed verdict and its confidence", () => {
    const r = parseAuditReply({
      outcome: "hit",
      rationale: "Activation cleared 22 percent.",
      confidence: 0.82,
    });
    expect(r.verdict).toBe("hit");
    expect(r.rationale).toBe("Activation cleared 22 percent.");
    expect(r.confidence).toBeCloseTo(0.82, 5);
  });

  test("inconclusive is a real verdict and keeps its confidence", () => {
    const r = parseAuditReply({
      outcome: "inconclusive",
      rationale: "No cohort data.",
      confidence: 0.9,
    });
    expect(r.verdict).toBe("inconclusive");
    expect(r.confidence).toBeCloseTo(0.9, 5);
  });

  /**
   * A reply we had to correct carries no confidence, so it can never clear the
   * floor and settle itself. Keeping the model's own number here would let a
   * malformed answer auto-settle on the strength of a verdict we invented.
   */
  test("an unrecognised verdict falls back to inconclusive with zero confidence", () => {
    const r = parseAuditReply({ outcome: "probably", rationale: "", confidence: 0.9 });
    expect(r.verdict).toBe("inconclusive");
    expect(r.confidence).toBe(0);
    expect(canAutoSettle({ linkedOutcomeSettled: true, confidence: r.confidence })).toBe(false);
  });

  test("a missing confidence cannot clear the auto-settle floor", () => {
    const r = parseAuditReply({ outcome: "hit", rationale: "x" });
    expect(r.confidence).toBe(0);
    expect(r.confidence).toBeLessThan(AUTO_SETTLE_CONFIDENCE_FLOOR);
  });

  test("an empty reply does not throw and settles nothing", () => {
    const r = parseAuditReply({});
    expect(r.verdict).toBe("inconclusive");
    expect(r.confidence).toBe(0);
  });

  test("out-of-range confidence is clamped", () => {
    expect(parseAuditReply({ outcome: "hit", confidence: 1.7 }).confidence).toBe(1);
    expect(parseAuditReply({ outcome: "hit", confidence: -2 }).confidence).toBe(0);
  });
});

describe("forecastAuditPrompt (FC-01)", () => {
  test("puts the stated observable in front of the judge", () => {
    const p = forecastAuditPrompt({
      claim: "Activation clears 20 percent in week one",
      howWeWillKnow: "The activation panel for the cohort",
      horizonDate: "2026-08-10T00:00:00.000Z",
      /* P-42: `evidence` (one line, whose only source was the linked spec's
         outcome) became `readKit` (every row the grader may look at, each
         carrying the id it must cite). */
      readKit: "- [outcome:prd-1] The linked spec outcome was settled on 2026-08-11.",
    });
    expect(p).toContain("The activation panel for the cohort");
    expect(p).toContain("Activation clears 20 percent in week one");
    expect(p).toContain("The linked spec outcome was settled on 2026-08-11.");
  });

  test("demands a citation, because a verdict naming no source is not a verdict", () => {
    // The whole of P-42 in one assertion: eight drafts came back at confidence
    // 1.0 having read nothing, so the prompt now requires the model to name the
    // rows it used and says what to do when none of them settle the observable.
    const p = forecastAuditPrompt({
      claim: "c",
      howWeWillKnow: "o",
      horizonDate: "2026-08-10T00:00:00.000Z",
      readKit: "- [signal:s-1] Completion rate rose",
    });
    expect(p).toContain("CITE WHAT YOU USED");
    expect(p).toContain("[signal:s-1]");
    expect(p).toContain("answer inconclusive with confidence 0");
    expect(p).toContain("Do not reason from anything you were not shown");
  });

  test("never invites a guess", () => {
    const p = forecastAuditPrompt({
      claim: "c",
      howWeWillKnow: "o",
      horizonDate: "2026-08-10T00:00:00.000Z",
      evidence: "",
    });
    expect(p.toLowerCase()).toContain("inconclusive");
  });

  test("says plainly when there was nothing to read rather than leaving a blank", () => {
    /*
     * This asserted "No linked outcome has been settled.", which was the whole
     * of what the grader could be told before P-42 and was the sentence seven of
     * the eight due forecasts on production actually got. The kit says it now,
     * and says it about everything rather than about the spec alone.
     */
    const p = forecastAuditPrompt({
      claim: "c",
      howWeWillKnow: "o",
      horizonDate: "2026-08-10T00:00:00.000Z",
      readKit: readKitAsText({ rows: [], empty: true }),
    });
    expect(p).toContain("NOTHING. No evidence dated after this decision could be read.");
  });
});

describe("AUDITOR_SLUG (FC-01)", () => {
  /**
   * The slug is what makes an agent verdict identifiable, and therefore
   * reversible in one query. A blank one would file agent work as human work.
   */
  test("is a non-empty stable identifier", () => {
    expect(AUDITOR_SLUG).toBe("forecast-auditor");
    expect(AUDITOR_SLUG.length).toBeGreaterThan(0);
  });
});

describe("nothingCouldMeasureIt (P-137: the grader refuses what nothing measures)", () => {
  /** A spec row plus the eval results its clauses point at. */
  const db = (contract: unknown, caseIdsWithResults: string[], opts?: { prdError?: boolean }) =>
    ({
      from: (table: string) =>
        table === "prds"
          ? {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () =>
                    opts?.prdError
                      ? { data: null, error: { message: "boom" } }
                      : { data: { contract }, error: null },
                }),
              }),
            }
          : {
              select: () => ({
                in: async () => ({
                  data: caseIdsWithResults.map((case_id) => ({ case_id })),
                  error: null,
                }),
              }),
            },
    }) as never;

  /** The two clauses exactly as production stores them on spec f2aa82f1. */
  const LIVE_CONTRACT = {
    success_metrics: [
      {
        text: "Increase in tablet checkout completion rate from 67 percent.",
        status: "standing",
        oracle_kind: "eval",
        oracle_ref: "a653a20b-7c05-4eb6-9cc9-7e0ed807467e",
      },
      {
        text: "Reduction in abandonment rate on the 'Shipping Address' screen.",
        status: "standing",
        oracle_kind: "eval",
        oracle_ref: "6dbb1c54-9a78-406a-b5ab-9ce0ca7abf42",
      },
    ],
  };

  test("the first live release refuses: both oracles resolve, neither has ever run", async () => {
    // MEASURED 2026-09-04. This is the row the 09-09 horizon would otherwise
    // hand to the model, which would return miss or drifting from the absence
    // of any observation.
    const r = await nothingCouldMeasureIt(db(LIVE_CONTRACT, []), "f2aa82f1");
    expect(r.refuse).toBe(true);
    expect(r.metric).toContain("67 percent");
  });

  test("one reading anywhere is enough to hand it back to the model", async () => {
    const r = await nothingCouldMeasureIt(
      db(LIVE_CONTRACT, ["a653a20b-7c05-4eb6-9cc9-7e0ed807467e"]),
      "f2aa82f1",
    );
    expect(r.refuse).toBe(false);
  });

  test("a hand-recorded reading on the clause is a source", async () => {
    const withHand = {
      success_metrics: [
        {
          ...LIVE_CONTRACT.success_metrics[0],
          readings: [{ value: 71, at: "2026-09-08T10:00:00Z", by: "founder" }],
        },
      ],
    };
    expect((await nothingCouldMeasureIt(db(withHand, []), "p1")).refuse).toBe(false);
  });

  test("an unlinked forecast is never refused, because its metric is unknown", async () => {
    // "We cannot identify the metric" is not "the metric has no source".
    expect((await nothingCouldMeasureIt(db(LIVE_CONTRACT, []), null)).refuse).toBe(false);
  });

  test("a failed read refuses nothing, so a transient fault cannot become a verdict", async () => {
    const r = await nothingCouldMeasureIt(db(LIVE_CONTRACT, [], { prdError: true }), "p1");
    expect(r.refuse).toBe(false);
  });

  test("a spec with no standing metric promises no outcome, so nothing is refused", async () => {
    expect((await nothingCouldMeasureIt(db({ success_metrics: [] }, []), "p1")).refuse).toBe(false);
    expect(
      (
        await nothingCouldMeasureIt(
          db({ success_metrics: [{ text: "old", status: "superseded" }] }, []),
          "p1",
        )
      ).refuse,
    ).toBe(false);
  });

  test("a ci-only contract refuses: a green build is not an observation of users", async () => {
    const ciOnly = {
      success_metrics: [
        { text: "Telemetry is integrated.", status: "standing", oracle_kind: "ci" },
      ],
    };
    expect((await nothingCouldMeasureIt(db(ciOnly, []), "p1")).refuse).toBe(true);
  });
});

describe("linkedOutcomeIsSettled (FC-01 gate, first half)", () => {
  const prdDb = (outcome: unknown) =>
    ({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { outcome, title: "Ship the new onboarding" },
              error: null,
            }),
          }),
        }),
      }),
    }) as never;

  test("a human-settled outcome opens the gate", async () => {
    const r = await linkedOutcomeIsSettled(
      prdDb({ verdict: "validated", settled_by: "human" }),
      "p1",
    );
    expect(r.settled).toBe(true);
  });

  /**
   * THE PIN THAT MATTERED, and the reason the gate's own comment was wrong for
   * four days. Two agent paths write prds.outcome: the historian sweep and the
   * MCP settle_outcome tool. The old check asked only whether `outcome` was
   * non-null, so an agent-settled spec authorized an agent-settled forecast and
   * the whole "a person already judged this" argument evaporated. Proven by
   * planting it: delete the settled_by check and this goes green on a chain with
   * no human in it.
   */
  test("an agent-settled outcome does NOT open the gate", async () => {
    const r = await linkedOutcomeIsSettled(
      prdDb({ verdict: "validated", settled_by: "agent", settled_by_agent_slug: "historian" }),
      "p1",
    );
    expect(r.settled).toBe(false);
    // Still handed to the model as context: it is what is known, it just is not
    // permission to settle unattended.
    expect(r.evidence).toContain("recorded by an agent rather than a person");
  });

  test("an outcome predating the settled_by field counts as human", async () => {
    // Every such row came from the Learn desk, the only door at the time.
    const r = await linkedOutcomeIsSettled(prdDb({ verdict: "validated" }), "p1");
    expect(r.settled).toBe(true);
  });

  test("no linked spec means no gate and no evidence", async () => {
    const r = await linkedOutcomeIsSettled(prdDb(null), null);
    expect(r.settled).toBe(false);
    expect(r.evidence).toBe("");
  });

  test("an unsettled spec does not open the gate", async () => {
    const r = await linkedOutcomeIsSettled(prdDb(null), "p1");
    expect(r.settled).toBe(false);
  });

  test("an agent verdict cannot reach canAutoSettle however confident it is", async () => {
    const r = await linkedOutcomeIsSettled(prdDb({ settled_by: "agent" }), "p1");
    expect(canAutoSettle({ linkedOutcomeSettled: r.settled, confidence: 1 })).toBe(false);
  });
});
