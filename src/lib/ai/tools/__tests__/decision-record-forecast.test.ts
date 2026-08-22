/**
 * THE ONE FIELD THAT CANNOT BE BACKFILLED, and the tool that would not insist on it.
 *
 * ── WHAT THIS GUARDS, AND WHY IT IS WORTH A FILE ────────────────────────
 * The strategy's claim is narrow and testable: everything about a decision can be
 * reconstructed after the fact from artifacts, EXCEPT what a team believed would
 * happen, recorded before the outcome was known. That exists only if something
 * wrote it down at the moment of the call.
 *
 * `decisions` has carried eleven forecast columns, an immutability trigger, a
 * refusal guard and a partial index for some time. The cause of their emptiness
 * was not the schema and not the crew's instructions: `decision.record` is the
 * tool the Decide crew is told to call and it had no forecast parameter at all,
 * so 303 of 304 decisions were recorded through a hand that could not hold the
 * one thing the strategy calls defensible.
 *
 * ── WHY THESE ASSERTIONS FLIPPED ON 2026-08-22 ──────────────────────────
 * The fields arrived OPTIONAL on 2026-08-20, and this file asserted that a
 * decision with no forecast stayed valid. The reasoning was that a mandatory
 * forecast would make an agent fabricate a horizon or file nothing at all.
 *
 * That was a forecast about the tool, and it resolved. Measured in production
 * 2026-08-22: five decisions carry source_kind='agent', which is written nowhere
 * but here, and none of them carries a forecast -- including one recorded twenty-
 * two hours AFTER the optional fields shipped. Across real workspaces the count
 * is 0 of 131. An optional field on a tool an LLM calls is a field that does not
 * exist, so the tests that pinned "optional" are inverted here rather than left
 * standing as a description of something that never happened.
 *
 * So the assertions are about the SCHEMA and the PREVIEW, which is all a unit
 * test can see. Whether the insert lands, whether the immutability trigger accepts
 * an agent write, and whether the count moves off 0 in real workspaces are
 * production questions and are not answerable here.
 */
import { describe, expect, it } from "bun:test";

import { setDecisionForecastSchema } from "@/lib/decisions.functions";
import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";

const tool = TOOL_REGISTRY["decision.record"];

/** Everything a decision needed before the forecast was required. No longer enough. */
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

/** The whole call, and the only shape this tool accepts. */
const VALID = { ...BASE, ...FORECAST };

function parse(input: Record<string, unknown>) {
  return tool.argsSchema.safeParse(input);
}

/** Every refusal message on one string, which is what the tool loop hands the model. */
function refusal(input: Record<string, unknown>): string {
  const result = parse(input);
  if (result.success) throw new Error("expected a refusal");
  return result.error.issues.map((i) => i.message).join(" ");
}

describe("the tool exists and still refuses what it always refused", () => {
  it("is registered", () => {
    expect(tool, "decision.record is gone from the registry").toBeTruthy();
  });

  it("accepts a complete decision", () => {
    const result = parse(VALID);
    expect(result.success, JSON.stringify("error" in result ? result.error.issues : [])).toBe(true);
  });

  it("still refuses a decision with nothing weighed against it", () => {
    // The pre-existing rule, asserted here because adding fields to a schema is a
    // normal way to lose one. A choice with no rejected alternative is an
    // assertion rather than a decision.
    expect(parse({ ...VALID, alternatives_considered: [] }).success).toBe(false);
  });
});

describe("a decision with no forecast is refused", () => {
  it("refuses the call that used to be the whole call", () => {
    /*
     * THE ASSERTION THIS FILE EXISTS FOR. Until 2026-08-22 this exact input was
     * asserted valid, and every agent decision in production took it. A decision
     * with nothing wagered on it is an opinion rather than a bet, refused on the
     * same grounds as one with nothing weighed against it.
     */
    expect(parse(BASE).success).toBe(false);
  });

  it("refuses each part missing on its own", () => {
    // Three separate holes, because a required field is easy to lose one at a
    // time and each missing part breaks the artifact differently: no observable
    // and it settles as an argument, no horizon and it never comes due.
    for (const key of Object.keys(FORECAST) as (keyof typeof FORECAST)[]) {
      const partial = { ...VALID };
      delete partial[key];
      expect(parse(partial).success, `${key} was allowed to be absent`).toBe(false);
    }
  });

  it("refuses a null in place of a value", () => {
    // A model that has been told a field is required and has nothing to say will
    // reach for null before it will omit the key. Same refusal, same message.
    expect(parse({ ...VALID, forecast_claim: null }).success).toBe(false);
    expect(refusal({ ...VALID, forecast_claim: null })).toContain("an opinion, not a bet");
  });

  it("says why, in the voice of the rule it mirrors", () => {
    /*
     * The loop pushes `error.message` back to the model verbatim and asks it to
     * fix the args, so this string is the entire explanation an agent gets. zod's
     * default for a missing required string is "Required", which teaches the
     * shape and not the point -- and an agent that fills a box to satisfy a shape
     * is exactly the fabrication the optional argument warned about.
     */
    const message = refusal(BASE);
    expect(message).toContain("an opinion, not a bet");
    expect(message).toContain("cannot be reconstructed afterwards");
    // And it names the three fields, so the fix does not need a second round trip.
    expect(message).toContain("forecast_claim");
    expect(message).toContain("forecast_how_we_will_know");
    expect(message).toContain("forecast_horizon_date");
  });

  it("puts the refusal on the fields, not on the object", () => {
    // A message with no path cannot be attributed to anything, and a native
    // tool-call client shows the model the path before it shows it the prose.
    const result = parse(BASE);
    if (result.success) throw new Error("expected a refusal");
    const paths = result.error.issues.map((i) => i.path.join("."));
    expect(paths).toContain("forecast_claim");
    expect(paths).toContain("forecast_how_we_will_know");
    expect(paths).toContain("forecast_horizon_date");
  });
});

describe("a forecast is only a forecast before the outcome is known", () => {
  it("refuses a horizon that has already passed", () => {
    expect(parse({ ...VALID, forecast_horizon_date: PAST }).success).toBe(false);
  });

  it("refuses a horizon of right now", () => {
    // `<=`, not `<`. A horizon of this instant is being written with the answer
    // available, same as one an hour ago.
    expect(parse({ ...VALID, forecast_horizon_date: new Date().toISOString() }).success).toBe(false);
  });

  it("says why, rather than reporting an invalid date", () => {
    const message = refusal({ ...VALID, forecast_horizon_date: PAST });
    expect(message).toContain("already passed");
    expect(message).toContain("before the outcome is known");
  });

  it("blames the horizon field rather than the claim", () => {
    const result = parse({ ...VALID, forecast_horizon_date: PAST });
    if (result.success) throw new Error("expected a refusal");
    expect(result.error.issues[0].path).toEqual(["forecast_horizon_date"]);
  });

  it("accepts a horizon a minute from now", () => {
    // The rule is about the answer being available, not about a minimum window.
    // Inventing a minimum here would be a product decision nobody has taken.
    const soon = new Date(Date.now() + 60_000).toISOString();
    expect(parse({ ...VALID, forecast_horizon_date: soon }).success).toBe(true);
  });

  it("closes the cheapest fabrication", () => {
    /*
     * The standing objection to a required forecast is that an agent will invent
     * one. The cheapest invention is a horizon already in the settled past, which
     * makes the bet un-losable, and it is the one the horizon rule refuses
     * outright. An invented FUTURE horizon still resolves to a miss and still
     * teaches something, which an absent forecast never does.
     */
    expect(parse({ ...VALID, forecast_horizon_date: PAST }).success).toBe(false);
  });
});

describe("the horizon is a timestamp, not a loose string", () => {
  it("refuses a bare date", () => {
    /*
     * `decisions.forecast_horizon_date` is `timestamptz`, so Postgres reads
     * "2026-09-05" as midnight UTC -- a moment nobody chose, on a day that is
     * already yesterday for half the people who might settle it. The MCP door
     * has always demanded a full offset timestamp; this one used to take any
     * string up to forty characters.
     */
    expect(parse({ ...VALID, forecast_horizon_date: "2026-09-05" }).success).toBe(false);
  });

  it("refuses prose where a timestamp belongs", () => {
    expect(parse({ ...VALID, forecast_horizon_date: "in about two weeks" }).success).toBe(false);
  });

  it("names the format it wants, with an example", () => {
    const message = refusal({ ...VALID, forecast_horizon_date: "2026-09-05" });
    expect(message).toContain("ISO 8601");
    expect(message).toContain("2026-09-05T00:00:00Z");
  });

  it("accepts a non-UTC offset", () => {
    // `offset: true`, not bare `.datetime()`. An agent running against a real
    // team's calendar writes +05:30 as readily as it writes Z.
    const plusFive = new Date(Date.now() + 30 * 24 * 3600_000)
      .toISOString()
      .replace(/\.\d+Z$/, "+05:30");
    expect(parse({ ...VALID, forecast_horizon_date: plusFive }).success).toBe(true);
  });
});

describe("the agent door and the person door agree about what a forecast is", () => {
  /*
   * THE POINT OF THIS BLOCK IS THAT THERE IS ONE ANSWER, NOT TWO. `createDecision`
   * and `setDecisionForecast` validate a human's forecast, `record_forecast`
   * validates an MCP client's, and this tool validates an agent's. Two copies of
   * "what makes a forecast valid" is how those doors come to disagree, and the
   * rules each carry a paragraph of reasoning that would not be copied with them.
   *
   * Asserted behaviourally rather than by reading the import, so it still holds if
   * the wiring moves.
   */
  const throughTheOtherDoor = (f: Record<string, unknown>) =>
    setDecisionForecastSchema.safeParse({
      decisionId: "00000000-0000-4000-8000-000000000001",
      ...f,
    }).success;

  it("refuses exactly what `forecastRefusal` refuses", () => {
    const cases: [Record<string, unknown>, boolean][] = [
      [{}, false],
      [FORECAST, true],
      [{ forecast_claim: "x" }, false],
      [{ forecast_how_we_will_know: "x" }, false],
      [{ forecast_horizon_date: FUTURE }, false],
      [{ forecast_claim: "x", forecast_how_we_will_know: "y" }, false],
      [{ ...FORECAST, forecast_horizon_date: PAST }, false],
    ];
    for (const [forecast, ok] of cases) {
      expect(parse({ ...BASE, ...forecast }).success, JSON.stringify(forecast)).toBe(ok);
    }
  });

  it("reaches the same verdict as the MCP and human path on the same forecast", () => {
    // `setDecisionForecastSchema` is what `record_forecast` parses through
    // (mcp.functions.ts calls setDecisionForecastImpl behind it), so agreeing with
    // it is agreeing with both other doors at once.
    const cases: Record<string, unknown>[] = [
      FORECAST,
      { ...FORECAST, forecast_horizon_date: PAST },
      { ...FORECAST, forecast_horizon_date: "2026-09-05" },
      { ...FORECAST, forecast_horizon_date: "in about two weeks" },
      { ...FORECAST, forecast_claim: "x".repeat(501) },
      { ...FORECAST, forecast_how_we_will_know: "x".repeat(501) },
      { ...FORECAST, forecast_claim: "" },
      { forecast_claim: FORECAST.forecast_claim },
    ];
    for (const forecast of cases) {
      expect(parse({ ...BASE, ...forecast }).success, JSON.stringify(forecast).slice(0, 120)).toBe(
        throughTheOtherDoor(forecast),
      );
    }
  });

  it("holds the same length limit, so a claim is not accepted here and refused there", () => {
    // The tool shipped at 1000 while both other doors were at 500. Nothing broke,
    // because nothing had written a forecast yet -- which is the only reason a
    // drift this simple survived.
    expect(parse({ ...VALID, forecast_claim: "x".repeat(500) }).success).toBe(true);
    expect(parse({ ...VALID, forecast_claim: "x".repeat(501) }).success).toBe(false);
    expect(parse({ ...VALID, forecast_how_we_will_know: "x".repeat(501) }).success).toBe(false);
  });
});

describe("the plain-language render shows the bet, not just the title", () => {
  it("names the claim and the horizon", () => {
    // Unconditional now, because the schema refuses a call without one. Whoever
    // reads this line should see the part that makes the record gradeable.
    const preview = tool.preview(VALID);
    expect(preview).toContain(FORECAST.forecast_claim);
    expect(preview).toContain(FUTURE);
  });

  it("still counts the rejected alternatives", () => {
    expect(tool.preview(VALID)).toContain("2 rejected alternatives");
  });

  it("gets the singular right for one alternative", () => {
    const preview = tool.preview({ ...VALID, alternatives_considered: ["Do nothing"] });
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
    expect(description).toContain("is refused");
  });

  it("says the thing that makes it defensible: it cannot be reconstructed later", () => {
    /* Lowercased before matching, because a test should not pin which words are
       capitalised for emphasis. */
    const said = description.toLowerCase();
    expect(said).toContain("before the outcome is known");
    expect(said).toContain("reconstructed afterwards");
  });

  it("states every refusal, so an agent does not have to discover them by failing", () => {
    expect(description).toContain("All three parts are required together");
    expect(description).toContain("already passed");
  });

  it("explains what each field is for", () => {
    // A field list an agent has to guess at is how `forecast_how_we_will_know`
    // becomes a restatement of the claim.
    expect(description).toContain("forecast_claim");
    expect(description).toContain("forecast_how_we_will_know");
    expect(description).toContain("forecast_horizon_date");
    expect(description).toContain("the observable that will settle it");
  });

  it("says the horizon is a real commitment and names its format", () => {
    // The horizon is the field an agent is most likely to treat as decoration,
    // and the only one it can never correct afterwards.
    expect(description).toContain("ISO 8601");
    expect(description).toContain("set once");
    expect(description).toContain("cannot be moved later");
  });

  it("keeps the rule it already had", () => {
    expect(description).toContain("at least one rejected alternative");
  });
});
