import { describe, expect, test } from "bun:test";
import {
  MCP_READ_TOOL_NAMES,
  MCP_WRITE_SCOPES,
  MCP_WRITE_TOOL_NAMES,
  WRITE_SCOPE_BY_TOOL,
  canCallWriteTool,
  isWriteTool,
  toolsForScopes,
} from "./mcp-protocol";
import { recordForecast, settleForecastViaMcp, listDueForecastsForAgent } from "./mcp.functions";

/**
 * FC-01 on the agent surface.
 *
 * Until 2026-08-14 none of the fifteen MCP tools touched a forecast column, so
 * the one artifact the positioning calls unrebuildable was the only station with
 * no programmatic door at all: not a read, not a write. These pin the three that
 * close it, and in particular pin the two properties that make them safe to
 * grant -- separate scopes, and a settle that cannot overwrite a human.
 */

describe("the forecast tools exist and are governed", () => {
  test("record_forecast and settle_forecast are governed writes", () => {
    expect(isWriteTool("record_forecast")).toBe(true);
    expect(isWriteTool("settle_forecast")).toBe(true);
    expect(MCP_WRITE_TOOL_NAMES).toContain("record_forecast");
    expect(MCP_WRITE_TOOL_NAMES).toContain("settle_forecast");
  });

  test("list_due_forecasts is a read, so an agent can find what needs settling", () => {
    // A settle tool whose queue is invisible is a tool nobody can drive. This is
    // deliberately NOT scope-gated: knowing which of your own calls are overdue
    // is not a privileged action.
    expect(MCP_READ_TOOL_NAMES).toContain("list_due_forecasts");
    expect(isWriteTool("list_due_forecasts")).toBe(false);
  });

  /**
   * THE SEPARATION IS THE POINT. Recording what you expect and grading whether
   * it happened are different permissions. Collapsing them into one scope would
   * mean any token allowed to state a belief could also mark that belief
   * correct, which is the precise loop the immutability trigger exists to break.
   */
  test("stating a belief and grading it are different scopes", () => {
    expect(WRITE_SCOPE_BY_TOOL.record_forecast).toBe("write:forecast");
    expect(WRITE_SCOPE_BY_TOOL.settle_forecast).toBe("write:forecast_resolution");
    expect(WRITE_SCOPE_BY_TOOL.record_forecast).not.toBe(WRITE_SCOPE_BY_TOOL.settle_forecast);
  });

  test("a token that may record a forecast may not settle one", () => {
    expect(canCallWriteTool("record_forecast", ["write:forecast"], true).allowed).toBe(true);
    expect(canCallWriteTool("settle_forecast", ["write:forecast"], true).allowed).toBe(false);
    // And the converse, so neither scope is quietly a superset of the other.
    expect(canCallWriteTool("record_forecast", ["write:forecast_resolution"], true).allowed).toBe(
      false,
    );
  });

  test("both scopes are mintable, which three earlier write tools were not", () => {
    // The defect this repo already shipped once: a tool catalogued and dispatched
    // with a scope no code path could grant.
    expect(MCP_WRITE_SCOPES).toContain("write:forecast");
    expect(MCP_WRITE_SCOPES).toContain("write:forecast_resolution");
  });

  test("neither forecast tool is visible while the write gate is closed", () => {
    const tools = toolsForScopes(["write:forecast", "write:forecast_resolution"], false);
    expect(tools.some((t) => t.name === "record_forecast")).toBe(false);
    expect(tools.some((t) => t.name === "settle_forecast")).toBe(false);
  });
});

describe("recordForecast", () => {
  const db = () => ({}) as never;

  test("refuses a partial forecast: all three parts or none", async () => {
    await expect(
      recordForecast(db(), "w1", "u1", {
        decision_id: "11111111-1111-1111-1111-111111111111",
        claim: "Activation clears 20 percent",
        // no how_we_will_know, no horizon_date
      }),
    ).rejects.toThrow(/expected \{ decision_id/);
  });

  /**
   * A HORIZON ALREADY PAST means the answer was available when the belief was
   * written, which is a retrospective wearing a forecast's clothes. The database
   * trigger cannot catch this one: it fires BEFORE UPDATE and rejects changes to
   * an existing forecast, so a first write with a stale date is refused here or
   * nowhere.
   */
  test("refuses a horizon that has already passed", async () => {
    await expect(
      recordForecast(db(), "w1", "u1", {
        decision_id: "11111111-1111-1111-1111-111111111111",
        claim: "Activation cleared 20 percent",
        how_we_will_know: "The activation dashboard",
        horizon_date: "2020-01-01T00:00:00.000Z",
      }),
    ).rejects.toThrow();
  });
});

describe("settleForecastViaMcp", () => {
  const settledDb = (rows: unknown[], probe: unknown) =>
    ({
      from: () => ({
        update: () => ({
          eq: () => ({
            not: () => ({
              is: () => ({ select: async () => ({ data: rows, error: null }) }),
            }),
          }),
        }),
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: probe, error: null }) }),
        }),
      }),
    }) as never;

  const args = {
    decision_id: "11111111-1111-1111-1111-111111111111",
    resolution: "hit" as const,
    rationale: "Activation cleared 22 percent on the dashboard we named.",
  };

  test("settles a forecast that has none", async () => {
    const r = await settleForecastViaMcp(settledDb([{ id: "d1" }], null), "w1", "u1", args);
    expect(r.status).toBe("stored");
  });

  /**
   * THE PROPERTY THAT MAKES THIS SAFE TO GRANT. The guard is in the WHERE clause
   * (`.is("forecast_resolution", null)`), not in a preceding read, so it cannot
   * be raced. An agent had its chance before the row was settled; disagreeing
   * with a recorded verdict afterwards is a person's move. It also makes a
   * repeated call harmless rather than a silent rewrite with a fresh timestamp.
   */
  test("refuses to overwrite a verdict already on the record", async () => {
    const probe = { forecast_claim: "we expected x", forecast_resolution: "miss" };
    const r = await settleForecastViaMcp(settledDb([], probe), "w1", "u1", args);
    expect(r.status).toBe("already_settled");
  });

  test("says so plainly when the decision carries no forecast at all", async () => {
    const probe = { forecast_claim: null, forecast_resolution: null };
    await expect(settleForecastViaMcp(settledDb([], probe), "w1", "u1", args)).rejects.toThrow(
      /carries no forecast/,
    );
  });

  test("a decision the token cannot see is named as such, not reported settled", async () => {
    await expect(settleForecastViaMcp(settledDb([], null), "w1", "u1", args)).rejects.toThrow(
      /No decision with that id/,
    );
  });

  test("refuses a verdict outside the three the constraint allows", async () => {
    await expect(
      settleForecastViaMcp(settledDb([{ id: "d1" }], null), "w1", "u1", {
        ...args,
        resolution: "probably",
      }),
    ).rejects.toThrow(/expected \{ decision_id/);
  });
});

describe("listDueForecastsForAgent", () => {
  const rows = [
    {
      id: "d1",
      title: "Ship the new onboarding",
      forecast_claim: "Activation clears 20 percent",
      forecast_how_we_will_know: "The activation dashboard, 30 day cohort",
      forecast_horizon_date: "2020-01-01T00:00:00.000Z",
      forecast_resolution: null,
      forecast_next_check_at: null,
      forecast_resolution_suggestion: { verdict: "hit", confidence: 0.81 },
    },
  ];
  const db = (captured: { limit?: number }) =>
    ({
      from: () => ({
        select: () => ({
          not: () => ({
            is: () => ({
              lte: () => ({
                or: () => ({
                  order: () => ({
                    limit: async (n: number) => {
                      captured.limit = n;
                      return { data: rows, error: null };
                    },
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    }) as never;

  test("returns the queue in the machine-readable shape a settle call needs", async () => {
    const c: { limit?: number } = {};
    const out = await listDueForecastsForAgent(db(c), "w1", {});
    expect(out).toHaveLength(1);
    expect(out[0].decision_id).toBe("d1");
    expect(out[0].claim).toBe("Activation clears 20 percent");
    // The drafted verdict travels with the row, so an agent can defer to a
    // draft it agrees with instead of re-deriving one.
    expect(out[0].drafted_verdict).toBe("hit");
    expect(out[0].drafted_confidence).toBeCloseTo(0.81, 5);
    expect(out[0].days_late).toBeGreaterThan(0);
  });

  test("clamps a caller-supplied limit rather than trusting it", async () => {
    const c: { limit?: number } = {};
    await listDueForecastsForAgent(db(c), "w1", { limit: 100000 });
    expect(c.limit).toBe(100);
  });

  test("a nonsense limit falls back to the default instead of throwing", async () => {
    const c: { limit?: number } = {};
    await listDueForecastsForAgent(db(c), "w1", { limit: "many" });
    expect(c.limit).toBe(20);
  });
});
