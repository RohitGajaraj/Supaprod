/**
 * THE ONE FIELD THAT CANNOT BE BACKFILLED, and the tool that could not express it.
 *
 * ── WHAT THIS GUARDS, AND WHY IT IS WORTH A FILE ────────────────────────
 * The strategy's claim is narrow and testable: everything about a decision can be
 * reconstructed after the fact from artifacts, EXCEPT what a team believed would
 * happen, recorded before the outcome was known. That exists only if something
 * wrote it down at the moment of the call.
 *
 * `decisions` has carried eleven forecast columns, an immutability trigger, a
 * refusal guard and a partial index for some time, and 1 row of 304 used them. The
 * cause was not the schema and not the crew's instructions: `decision.record` is
 * the tool the Decide crew is told to call and it had no forecast parameter at all,
 * so 303 of 304 decisions were recorded through a hand that could not hold the one
 * thing the strategy calls defensible.
 *
 * So the assertions here are about the SCHEMA and the PREVIEW, which is all a unit
 * test can see. Whether the insert lands, whether the immutability trigger accepts
 * an agent write, and whether the count moves off 1 are production questions and
 * are not answerable here. That line is the whole reason this is a Kiro item and
 * the verification is not.
 */
import { describe, expect, it } from "bun:test";

import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";

const tool = TOOL_REGISTRY["decision.record"];

/** A valid call with no forecast, which must stay valid. */
const BASE = {
  title: "Ship the firmware notice behind a flag",
  rationale: "Homeowners cannot tell a planned restart from an outage, and support volume shows it.",
  alternatives_considered: ["Rewrite the whole onboarding", "Do nothing and watch another month"],
};

const FUTURE = new Date(Date.now() + 14 * 24 * 3600_000).toISOString();
const PAST = new Date(Date.now() - 24 * 3600_000).toISOString();

const FORECAST = {
  forecast_claim: "Support tickets mentioning a reboot fall below 20 a week",
  forecast_how_we_will_know: "The weekly count on the firmware theme in Discover",
  forecast_horizon_date: FUTURE,
};

function parse(input: Record<string, unknown>) {
  return tool.argsSchema.safeParse(input);
}

describe("the tool exists and still accepts what it always accepted", () => {
  it("is registered", () => {
    expect(tool, "decision.record is gone from the registry").toBeTruthy();
  });

  it("accepts a decision with no forecast at all", () => {
    /*
     * OPTIONAL, NOT REQUIRED, and this assertion is the one that keeps it honest.
     * Making a forecast mandatory would mean an agent either fabricates a horizon
     * to satisfy the schema or files nothing, and both are worse than a decision
     * recorded honestly with no bet attached.
     */
    expect(parse(BASE).success).toBe(true);
  });

  it("still refuses a decision with nothing weighed against it", () => {
    // The pre-existing rule, asserted here because adding fields to a schema is a
    // normal way to lose one. A choice with no rejected alternative is an
    // assertion rather than a decision.
    expect(parse({ ...BASE, alternatives_considered: [] }).success).toBe(false);
  });
});

describe("all three parts of a forecast, or none", () => {
  it("accepts the complete set", () => {
    const result = parse({ ...BASE, ...FORECAST });
    expect(result.success, JSON.stringify("error" in result ? result.error.issues : [])).toBe(true);
  });

  it("refuses a claim with no observable and no horizon", () => {
    const result = parse({ ...BASE, forecast_claim: FORECAST.forecast_claim });
    expect(result.success).toBe(false);
  });

  it("refuses a claim and an observable with no horizon", () => {
    /*
     * The shape that matters most, because it looks complete. A claim with no
     * horizon is never due, so the calibrator's partial index never surfaces it and
     * it silently never resolves: a decision that reads as forecast-bearing and can
     * never be graded, which is worse than carrying no forecast because the count
     * then overstates what can ever be settled.
     */
    const result = parse({
      ...BASE,
      forecast_claim: FORECAST.forecast_claim,
      forecast_how_we_will_know: FORECAST.forecast_how_we_will_know,
    });
    expect(result.success).toBe(false);
  });

  it("refuses a horizon on its own", () => {
    expect(parse({ ...BASE, forecast_horizon_date: FUTURE }).success).toBe(false);
  });

  it("names the missing pieces in words an agent can act on", () => {
    const result = parse({ ...BASE, forecast_claim: FORECAST.forecast_claim });
    expect(result.success).toBe(false);
    if (result.success) return;
    const message = result.error.issues.map((i) => i.message).join(" ");
    expect(message).toContain("all three parts");
    expect(message).toContain("how you will know");
    // And it explains the consequence rather than only stating the rule.
    expect(message).toContain("never comes due");
  });

  it("puts the refusal on a field, not on the object", () => {
    // A message with no path cannot be shown next to anything, and the tool loop
    // reports the issue back to the agent verbatim.
    const result = parse({ ...BASE, forecast_claim: FORECAST.forecast_claim });
    if (result.success) throw new Error("expected a refusal");
    expect(result.error.issues[0].path).toEqual(["forecast_claim"]);
  });
});

describe("a forecast is only a forecast before the outcome is known", () => {
  it("refuses a horizon that has already passed", () => {
    const result = parse({ ...BASE, ...FORECAST, forecast_horizon_date: PAST });
    expect(result.success).toBe(false);
  });

  it("refuses a horizon of right now", () => {
    // `<=`, not `<`. A horizon of this instant is being written with the answer
    // available, same as one an hour ago.
    const result = parse({ ...BASE, ...FORECAST, forecast_horizon_date: new Date().toISOString() });
    expect(result.success).toBe(false);
  });

  it("says why, rather than reporting an invalid date", () => {
    const result = parse({ ...BASE, ...FORECAST, forecast_horizon_date: PAST });
    if (result.success) throw new Error("expected a refusal");
    const message = result.error.issues.map((i) => i.message).join(" ");
    expect(message).toContain("already passed");
    expect(message).toContain("before the outcome is known");
  });

  it("blames the horizon field rather than the claim", () => {
    const result = parse({ ...BASE, ...FORECAST, forecast_horizon_date: PAST });
    if (result.success) throw new Error("expected a refusal");
    expect(result.error.issues[0].path).toEqual(["forecast_horizon_date"]);
  });

  it("accepts a horizon a minute from now", () => {
    // The rule is about the answer being available, not about a minimum window.
    // Inventing a minimum here would be a product decision nobody has taken.
    const soon = new Date(Date.now() + 60_000).toISOString();
    expect(parse({ ...BASE, ...FORECAST, forecast_horizon_date: soon }).success).toBe(true);
  });
});

describe("the rules are the human path's, not a second copy", () => {
  it("refuses exactly what `forecastRefusal` refuses", () => {
    /*
     * THE POINT OF THIS TEST IS THE SHARED FUNCTION. `createDecision` in
     * `decisions.functions.ts` validates a human's forecast through
     * `forecastRefusal`, and this tool now runs the same function in the same
     * `superRefine` shape. Two copies of "what makes a forecast valid" is how the
     * agent door and the person door come to disagree about it, and the two rules
     * here each carry a paragraph of reasoning that would not be copied with them.
     *
     * Asserted behaviourally rather than by reading the import, so it still holds
     * if the wiring moves.
     */
    const cases: [Record<string, unknown>, boolean][] = [
      [{}, true],
      [FORECAST, true],
      [{ forecast_claim: "x" }, false],
      [{ forecast_how_we_will_know: "x" }, false],
      [{ forecast_horizon_date: FUTURE }, false],
      [{ forecast_claim: "x", forecast_how_we_will_know: "y" }, false],
      [{ ...FORECAST, forecast_horizon_date: PAST }, false],
    ];
    for (const [extra, ok] of cases) {
      expect(parse({ ...BASE, ...extra }).success, JSON.stringify(extra)).toBe(ok);
    }
  });
});

describe("the approval card shows the bet, not just the title", () => {
  it("names the claim and the horizon when there is one", () => {
    /*
     * Without this, the one field that makes the record gradeable is the one field
     * the reviewer deciding whether to let it land cannot see.
     */
    const preview = tool.preview({ ...BASE, ...FORECAST });
    expect(preview).toContain(FORECAST.forecast_claim);
    expect(preview).toContain(FUTURE);
  });

  it("still counts the rejected alternatives", () => {
    expect(tool.preview({ ...BASE, ...FORECAST })).toContain("2 rejected alternatives");
  });

  it("says nothing about a forecast when there is none", () => {
    const preview = tool.preview(BASE);
    expect(preview).not.toContain("forecasting");
    expect(preview).toContain("2 rejected alternatives");
  });

  it("gets the singular right for one alternative", () => {
    const preview = tool.preview({ ...BASE, alternatives_considered: ["Do nothing"] });
    expect(preview).toContain("1 rejected alternative");
    expect(preview).not.toContain("alternatives");
  });
});

describe("the description tells the agent why, not just what", () => {
  const description = tool.description;

  it("states the reason a forecast is required, in the voice of the alternatives rule", () => {
    // The existing sentence is "a choice with nothing weighed against it is an
    // assertion, not a decision, and is refused." The forecast sentence is built to
    // the same shape rather than as a field list.
    expect(description).toContain("an opinion rather than a bet");
  });

  it("says the thing that makes it defensible: it cannot be reconstructed later", () => {
    /* Lowercased before matching, because the description capitalises BEFORE for
       emphasis and a test should not pin which words are shouted. */
    const said = description.toLowerCase();
    expect(said).toContain("before the outcome is known");
    expect(said).toContain("reconstructed afterwards");
  });

  it("states both refusals, so an agent does not have to discover them by failing", () => {
    expect(description).toContain("all three parts or none");
    expect(description).toContain("already passed");
  });

  it("keeps the rule it already had", () => {
    expect(description).toContain("at least one rejected alternative");
  });
});
