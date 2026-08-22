/**
 * TWO DOORS INTO `decisions`, AND THE HEADLESS ONE WAS THE WEAKER.
 *
 * ── WHAT THIS GUARDS ────────────────────────────────────────────────────
 * `decision.record` (lib/ai/tools/registry.server.ts) is the hand the product's
 * own Decide crew is told to call. `record_decision` over MCP is the hand an
 * external agent is handed with a `write:decision` grant. They insert into the
 * same table, and on 2026-08-22 the internal one was tightened to refuse a call
 * with no rationale, no rejected alternative, or an incomplete forecast — while
 * the external one still required `title` and nothing else.
 *
 * So an outside agent could write a decision the product's own agents are
 * refused. That is the wrong way round twice over: the door with less context
 * behind it had the lower bar, and the rule that a decision must be gradeable
 * was enforced only where we could already see it being followed.
 *
 * ── WHY THE ASSERTIONS ARE BEHAVIOURAL ──────────────────────────────────
 * The two schemas cannot be one object. `registry.server.ts` pulls in the whole
 * agent runtime, and `mcp.functions.ts` is reachable from client bundles through
 * its `createServerFn` exports, so importing one into the other would drag the
 * tool registry into the browser graph — the same reason `settleOutcome` reaches
 * `applyOutcome` by dynamic import. What can be shared IS shared:
 * `forecastRefusal` is wired by both, so the horizon rules cannot diverge. What
 * cannot be shared is pinned here instead, by running the same inputs through
 * both doors and comparing verdicts and words.
 *
 * This follows the pattern the forecast horizon already has in
 * `lib/ai/tools/__tests__/decision-record-forecast.test.ts`, whose last block
 * asserts the agent door and the person door reach the same verdict on the same
 * forecast. This is that block's missing third door.
 */
import { describe, expect, it } from "bun:test";

import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";
import { recordDecision } from "./mcp.functions";
import { MCP_WRITE_TOOLS } from "./mcp-protocol";

const WS = "22222222-2222-2222-2222-222222222222";
const USER = "11111111-1111-1111-1111-111111111111";

const internal = TOOL_REGISTRY["decision.record"];

const FUTURE = new Date(Date.now() + 14 * 24 * 3600_000).toISOString();
const PAST = new Date(Date.now() - 24 * 3600_000).toISOString();

/** The whole call, and the only shape either door accepts. */
const WHOLE = {
  title: "Ship the firmware notice behind a flag",
  rationale:
    "Homeowners cannot tell a planned restart from an outage, and support volume shows it.",
  alternatives_considered: ["Rewrite the whole onboarding", "Do nothing and watch another month"],
  forecast_claim: "Support tickets mentioning a reboot fall below 20 a week",
  forecast_how_we_will_know: "The weekly count on the firmware theme in Discover",
  forecast_horizon_date: FUTURE,
};

/** A db that accepts any insert, so a refusal is the schema's and never the row's. */
function stubDb() {
  const inserts: Array<Record<string, unknown>> = [];
  const db = {
    from() {
      return {
        insert(row: Record<string, unknown>) {
          inserts.push(row);
          return {
            select: () => ({ single: async () => ({ data: { id: "new-row-id" }, error: null }) }),
          };
        },
      };
    },
  };
  return { db, inserts };
}

/** Does the INTERNAL door accept this call? */
function internalVerdict(input: Record<string, unknown>): { ok: boolean; message: string } {
  const r = internal.argsSchema.safeParse(input);
  return r.success
    ? { ok: true, message: "" }
    : { ok: false, message: r.error.issues.map((i) => i.message).join(" ") };
}

/** Does the EXTERNAL door accept it? Asserted through the exported function
 *  rather than its private schema, so the guard survives the schema moving. */
async function externalVerdict(
  input: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  const { db } = stubDb();
  try {
    await recordDecision(db, WS, USER, input);
    return { ok: true, message: "" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

describe("the two doors reach the same verdict on the same decision", () => {
  /**
   * Each case is a shape one door used to take and the other refused. The point
   * is not that any particular one is refused — it is that BOTH answer the same
   * way, so a rule added to one and not the other fails here rather than
   * shipping as a hole in the outward-facing surface.
   */
  const cases: Array<[string, Record<string, unknown>]> = [
    ["the whole call", WHOLE],
    ["title alone, which the external door used to take", { title: WHOLE.title }],
    ["no rationale", { ...WHOLE, rationale: undefined }],
    ["an empty rationale", { ...WHOLE, rationale: "" }],
    ["no alternatives field at all", { ...WHOLE, alternatives_considered: undefined }],
    ["an empty alternatives list", { ...WHOLE, alternatives_considered: [] }],
    ["eleven alternatives", { ...WHOLE, alternatives_considered: Array(11).fill("something") }],
    ["ten alternatives", { ...WHOLE, alternatives_considered: Array(10).fill("something") }],
    ["an empty string among the alternatives", { ...WHOLE, alternatives_considered: ["", "x"] }],
    ["no forecast at all", { ...WHOLE, ...blankForecast() }],
    [
      "a claim with no observable and no horizon",
      { ...WHOLE, ...blankForecast(), forecast_claim: "x" },
    ],
    ["a claim and an observable with no horizon", { ...WHOLE, forecast_horizon_date: undefined }],
    ["a horizon already passed", { ...WHOLE, forecast_horizon_date: PAST }],
    ["a horizon of right now", { ...WHOLE, forecast_horizon_date: new Date().toISOString() }],
    ["a bare date for a horizon", { ...WHOLE, forecast_horizon_date: "2026-09-05" }],
    ["prose where a horizon belongs", { ...WHOLE, forecast_horizon_date: "in about two weeks" }],
    ["a null in place of a claim", { ...WHOLE, forecast_claim: null }],
    ["a 500 character claim", { ...WHOLE, forecast_claim: "x".repeat(500) }],
    ["a 501 character claim", { ...WHOLE, forecast_claim: "x".repeat(501) }],
    ["a 501 character observable", { ...WHOLE, forecast_how_we_will_know: "x".repeat(501) }],
    ["a 200 character title", { ...WHOLE, title: "t".repeat(200) }],
    ["a 201 character title", { ...WHOLE, title: "t".repeat(201) }],
    ["an empty title", { ...WHOLE, title: "" }],
    ["a 4001 character rationale", { ...WHOLE, rationale: "r".repeat(4001) }],
  ];

  for (const [name, input] of cases) {
    it(`agrees about ${name}`, async () => {
      const inside = internalVerdict(input);
      const outside = await externalVerdict(input);
      expect(
        outside.ok,
        `internal ${inside.ok ? "accepted" : "refused"} it, external ${outside.ok ? "accepted" : "refused"} it`,
      ).toBe(inside.ok);
    });
  }
});

describe("the two doors refuse in the same words", () => {
  /**
   * The verdict agreeing is half of it. The tool loop and the MCP envelope both
   * hand the refusal text straight back to the model, so the SENTENCE is the
   * entire explanation a caller gets, and a door that refuses correctly while
   * saying "Required" teaches an agent to fill a box rather than to make a bet.
   *
   * `FORECAST_REQUIRED` is duplicated between the two files by necessity (see
   * the header). This is the guard that makes the duplicate safe: reword either
   * copy and this fails, naming the other one.
   */
  it("carries the same forecast refusal, word for word", async () => {
    const noForecast = { ...WHOLE, ...blankForecast() };
    const inside = internalVerdict(noForecast);
    const outside = await externalVerdict(noForecast);
    expect(inside.ok).toBe(false);
    expect(outside.ok).toBe(false);

    const sentence =
      "A decision needs a forecast, and this one has none. Give all three parts: forecast_claim (what you expect to happen), forecast_how_we_will_know (the observable that will settle it), and forecast_horizon_date (an ISO 8601 timestamp with offset, in the future). A decision with no forecast is an opinion, not a bet. It is the one thing about a decision that cannot be reconstructed afterwards, so it is recorded now or it is never recorded at all.";
    expect(inside.message, "the internal FORECAST_REQUIRED was reworded").toContain(sentence);
    expect(outside.message, "the MCP copy of FORECAST_REQUIRED has drifted").toContain(sentence);
  });

  it("carries the same horizon refusal, from the one function that owns it", async () => {
    // Not duplicated at all: both doors superRefine against `forecastRefusal`,
    // so this asserts the wiring rather than a copied string.
    const stale = { ...WHOLE, forecast_horizon_date: PAST };
    const inside = internalVerdict(stale);
    const outside = await externalVerdict(stale);
    for (const m of [inside.message, outside.message]) {
      expect(m).toContain("already passed");
      expect(m).toContain("before the outcome is known");
    }
  });

  it("names the format it wants, on both doors", async () => {
    const bare = { ...WHOLE, forecast_horizon_date: "2026-09-05" };
    for (const m of [internalVerdict(bare).message, (await externalVerdict(bare)).message]) {
      expect(m).toContain("ISO 8601");
      expect(m).toContain("2026-09-05T00:00:00Z");
    }
  });
});

describe("what the external door advertises matches what it accepts", () => {
  /**
   * A required field the catalogue does not mention is a tool that refuses every
   * caller who reads its schema, which is every MCP client. `append_decision`
   * shipped once on this surface advertising columns that did not exist; this is
   * the same failure with the halves swapped.
   */
  const tool = MCP_WRITE_TOOLS.find((t) => t.name === "record_decision");

  it("declares every field it refuses a call for", () => {
    expect(tool).toBeTruthy();
    const required = new Set(tool?.inputSchema.required ?? []);
    for (const field of [
      "title",
      "rationale",
      "alternatives_considered",
      "forecast_claim",
      "forecast_how_we_will_know",
      "forecast_horizon_date",
    ]) {
      expect(required.has(field), `${field} is refused but not declared required`).toBe(true);
    }
  });

  it("declares each of them as a property, with alternatives as an array", () => {
    const props = (tool?.inputSchema.properties ?? {}) as Record<string, { type?: string }>;
    for (const field of (tool?.inputSchema.required ?? []) as string[]) {
      expect(props[field], `${field} is required and has no property entry`).toBeTruthy();
    }
    expect(props.alternatives_considered?.type).toBe("array");
  });

  it("states every refusal in the description, so nobody has to discover it by failing", () => {
    const said = tool?.description ?? "";
    expect(said).toContain("an assertion, not a decision");
    expect(said).toContain("an opinion rather than a bet");
    expect(said).toContain("All three forecast parts are required together");
    expect(said).toContain("already passed");
    expect(said).toContain("ISO 8601");
  });

  it("keeps the posture that makes this door safe, which is not an asymmetry to close", () => {
    // The internal tool runs a review gate and usually lands 'approved'. This one
    // never does, and closing the refusal gap must not level that down.
    expect(tool?.description).toContain("'pending'");
    expect(tool?.description).toContain("never lands a decision already approved");
  });
});

describe("the forecast tools this change must not have regressed", () => {
  /**
   * `record_forecast` and `settle_forecast` were the ORIGINAL correct
   * implementations — the internal tool was aligned to them on 2026-08-22, not
   * the reverse. `record_decision` now writes a forecast of its own, so the risk
   * worth pinning is that the pair stopped being separately governed.
   */
  it("still catalogues both, and record_decision did not absorb them", () => {
    const names = MCP_WRITE_TOOLS.map((t) => t.name);
    expect(names).toContain("record_forecast");
    expect(names).toContain("settle_forecast");
    expect(names).toContain("record_decision");
  });

  it("record_decision still asks only for its own scope", () => {
    // Requiring write:forecast here would make a REQUIRED field unwritable for a
    // token granted write:decision, which is a tool that always fails.
    const tool = MCP_WRITE_TOOLS.find((t) => t.name === "record_decision");
    expect(tool?.description).toContain("write:decision");
    expect(tool?.description).not.toContain("write:forecast");
  });
});

/** All three forecast keys absent, which is a different input from all three null. */
function blankForecast() {
  return {
    forecast_claim: undefined,
    forecast_how_we_will_know: undefined,
    forecast_horizon_date: undefined,
  };
}
