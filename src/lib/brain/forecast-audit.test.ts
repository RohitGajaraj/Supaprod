import { describe, expect, test } from "bun:test";
import {
  forecastAuditPrompt,
  parseAuditReply,
  AUDITOR_SLUG,
  linkedOutcomeIsSettled,
} from "./forecast-audit.server";
import { AUTO_SETTLE_CONFIDENCE_FLOOR, canAutoSettle } from "./forecast-resolution";

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
      evidence: "The linked spec outcome was settled on 2026-08-11.",
    });
    expect(p).toContain("The activation panel for the cohort");
    expect(p).toContain("Activation clears 20 percent in week one");
    expect(p).toContain("The linked spec outcome was settled on 2026-08-11.");
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

  test("says plainly when no linked outcome exists rather than leaving a blank", () => {
    const p = forecastAuditPrompt({
      claim: "c",
      howWeWillKnow: "o",
      horizonDate: "2026-08-10T00:00:00.000Z",
      evidence: "",
    });
    expect(p).toContain("No linked outcome has been settled.");
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
    const r = await linkedOutcomeIsSettled(prdDb({ verdict: "validated", settled_by: "human" }), "p1");
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
