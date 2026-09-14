import { describe, expect, test } from "bun:test";
/*
 * ── THE BUILDER IS POSTGREST'S, NOT `createClient`'S, AND THAT IS THE POINT ──
 *
 * This fixture's whole value is that it drives the REAL query builder, so a
 * missing column in a `.select()` fails the test instead of being papered over
 * by a hand-written stub. It used to reach that builder through
 * `createClient`, and that made it pass alone and fail in the suite:
 * `src/lib/payments/grant-core.money-safety.test.ts` installs a process-wide
 * module mock over the supabase-js package, and such a mock is global for the
 * whole Bun run, so by the time this file ran `createClient` returned a
 * money-safety double with no `.from` at all. Six tests failed with
 * `db.from is not a function` on a module they never referenced.
 *
 * THE PACKAGE SPECIFIER IS DELIBERATELY NOT WRITTEN NEXT TO THAT VERB ABOVE.
 * `src/__tests__/a-module-mock-is-process-wide.test.ts` finds process-wide
 * mocks by reading test files as TEXT, so a docblock quoting the call verbatim
 * registers as a second file mocking that package and fails its ratchet. My
 * first version of this comment did exactly that -- the same "a guard matching
 * its own documentation" trap `driver.ts` records paying for twice.
 *
 * `PostgrestClient` IS the layer under test -- the code below only ever calls
 * `.from().select().in().eq().is().order()`, all of it PostgREST -- and nothing
 * in the repo mocks `@supabase/postgrest-js`. So this both removes the coupling
 * and narrows the fixture to exactly the surface being verified. The auth and
 * realtime layers `createClient` dragged in were never used here; the
 * per-fixture `storageKey` existed only to stop them colliding.
 */
import { PostgrestClient } from "@supabase/postgrest-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tracksAReadingBringsForward } from "./waiting-on-a-date-is-not-waiting-in-a-queue.server";

const readings = [6, 7, 8].map((day) => ({
  value: 71,
  at: "2026-09-0" + day + "T10:00:00Z",
  by: "founder",
}));
const metric = { id: "metric", status: "standing", measures_decision_id: "decision", readings };

/** Real Supabase query builder and server adapter, with an in-memory HTTP transport. */
function fixture(
  options: {
    decision?: Record<string, unknown>;
    metrics?: unknown[];
    failedTable?: string;
    nullTable?: string;
  } = {},
) {
  const requests: URL[] = [];
  const tables: Record<string, Record<string, unknown>[]> = {
    spine_track_members: [
      {
        track_id: "track",
        artifact_id: "decision",
        artifact_kind: "decision",
        created_at: "2026-09-08",
        superseded_at: null,
      },
      {
        track_id: "track",
        artifact_id: "prd",
        artifact_kind: "prd",
        created_at: "2026-09-08",
        superseded_at: null,
      },
    ],
    prds: [{ id: "prd", contract: { success_metrics: options.metrics ?? [metric] } }],
    decisions: [
      {
        id: "decision",
        forecast_clause_id: "metric",
        forecast_direction: "higher-is-better",
        forecast_band_drifting_at: 70,
        forecast_band_missed_at: 64,
        forecast_observations: 41200,
        ...options.decision,
      },
    ],
  };
  const db = new PostgrestClient("https://forecast-test.invalid/rest/v1", {
    fetch: async (input: RequestInfo | URL) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
      );
      requests.push(url);
      const table = url.pathname.split("/").at(-1)!;
      if (!(table in tables)) throw new Error("Unexpected table: " + table);
      if (options.failedTable === table) {
        return new Response(JSON.stringify({ message: "read failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      const columns = url.searchParams.get("select")!.split(",");
      const kind = url.searchParams.get("artifact_kind")?.replace(/^eq./, "");
      const rows = tables[table].filter((row) => !kind || row.artifact_kind === kind);
      // Projection is essential: a fixture returning complete rows would hide a missing SELECT field.
      const data =
        options.nullTable === table
          ? null
          : rows.map((row) => Object.fromEntries(columns.map((column) => [column, row[column]])));
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    },
  }) as unknown as SupabaseClient;
  return { db, requests };
}

describe("tracksAReadingBringsForward server read adapter", () => {
  test("selects and uses forecast_clause_id through the real query builder", async () => {
    const { db, requests } = fixture();
    expect([...(await tracksAReadingBringsForward(db, ["track"]))]).toEqual(["track"]);
    const decisionRead = requests.find((url) => url.pathname.endsWith("/decisions"));
    expect(decisionRead?.searchParams.get("select")?.split(",")).toContain("forecast_clause_id");
    const mismatch = fixture({ decision: { forecast_clause_id: "another-metric" } });
    expect([...(await tracksAReadingBringsForward(mismatch.db, ["track"]))]).toEqual([]);
  });
  test("declared population cannot lift zero or one record", async () => {
    for (const records of [[], readings.slice(0, 1)]) {
      const { db } = fixture({ metrics: [{ ...metric, readings: records }] });
      expect([...(await tracksAReadingBringsForward(db, ["track"]))]).toEqual([]);
    }
  });
  test("requires both sides of the link and rejects ambiguous ownership", async () => {
    for (const metrics of [
      [{ ...metric, measures_decision_id: "someone-else" }],
      [metric, { ...metric, id: "another-metric" }],
      [metric, { ...metric, status: "superseded" }],
    ]) {
      const { db } = fixture({ metrics });
      expect([...(await tracksAReadingBringsForward(db, ["track"]))]).toEqual([]);
    }
    const { db } = fixture({ decision: { forecast_clause_id: null } });
    expect([...(await tracksAReadingBringsForward(db, ["track"]))]).toEqual([]);
  });
  test("other metric readings do not block the explicit link", async () => {
    const { db } = fixture({
      metrics: [metric, { ...metric, id: "other", measures_decision_id: "other-decision" }],
    });
    expect([...(await tracksAReadingBringsForward(db, ["track"]))]).toEqual(["track"]);
  });
  test("failed and null reads cannot manufacture a lift", async () => {
    for (const table of ["spine_track_members", "prds", "decisions"]) {
      for (const options of [{ failedTable: table }, { nullTable: table }]) {
        const { db } = fixture(options);
        expect([...(await tracksAReadingBringsForward(db, ["track"]))]).toEqual([]);
      }
    }
  });
  test("an error refuses even when an adapter also returns usable data", async () => {
    for (const failedTable of ["prds", "decisions"]) {
      const { db } = fixture();
      const withReadError = {
        from(table: string) {
          const query = db.from(table);
          if (table !== failedTable) return query;
          return {
            select(columns: string) {
              return {
                async in(column: string, values: string[]) {
                  const result = await query.select(columns).in(column, values);
                  expect(result.data).not.toBeNull();
                  return { ...result, error: { message: "partial read failed" } };
                },
              };
            },
          };
        },
      } as unknown as SupabaseClient;
      expect([...(await tracksAReadingBringsForward(withReadError, ["track"]))]).toEqual([]);
    }
  });
  test("an empty track batch performs no reads", async () => {
    const { db, requests } = fixture();
    expect([...(await tracksAReadingBringsForward(db, []))]).toEqual([]);
    expect(requests).toHaveLength(0);
  });
});
