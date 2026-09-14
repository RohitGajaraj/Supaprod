import { describe, expect, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readForecastReading } from "./forecast-reading.server";

const decisionId = "92e6d0a4-9b4e-4a3e-8f28-0c3e5efa2bc7";
const clauseId = "3081f05b-ecf0-4b41-9d98-4a851e677ae9";
const clause = {
  id: clauseId,
  measures_decision_id: decisionId,
  status: "standing",
  readings: [
    { value: 60, at: "2026-09-06T10:00:00Z", by: "founder" },
    { value: 61, at: "2026-09-07T10:00:00Z", by: "founder" },
    { value: 62, at: "2026-09-08T10:00:00Z", by: "founder" },
  ],
};

/** Apply projection and both filters, so an omitted query field cannot pass by fixture. */
function database(failed = false) {
  const rows = [
    { workspace_id: "ours", contract: { success_metrics: [clause] } },
    {
      workspace_id: "theirs",
      contract: { success_metrics: [{ ...clause, readings: [] }] },
    },
    {
      workspace_id: "ours",
      contract: { success_metrics: [{ ...clause, measures_decision_id: "other" }] },
    },
  ];
  let reads = 0;
  return {
    get reads() {
      return reads;
    },
    db: {
      from(table: string) {
        expect(table).toBe("prds");
        reads++;
        return {
          select(columns: string) {
            return {
              eq(field: string, workspace: string) {
                expect(field).toBe("workspace_id");
                return {
                  contains(
                    field: string,
                    match: { success_metrics: Array<{ id: string; measures_decision_id: string }> },
                  ) {
                    expect(field).toBe("contract");
                    const wanted = match.success_metrics[0];
                    const matched = rows.filter(
                      (r) =>
                        r.workspace_id === workspace &&
                        r.contract.success_metrics.some(
                          (c) =>
                            c.id === wanted.id &&
                            c.measures_decision_id === wanted.measures_decision_id,
                        ),
                    );
                    return Promise.resolve({
                      error: failed ? { message: "read failed" } : null,
                      data: matched.map((row) =>
                        Object.fromEntries(
                          columns
                            .split(",")
                            .map((column) => [column, row[column as keyof typeof row]]),
                        ),
                      ),
                    });
                  },
                };
              },
            };
          },
        };
      },
    } as unknown as SupabaseClient,
  };
}

describe("the forecast card reads the actual linked record", () => {
  test("reads a reciprocal clause in this workspace with its actual value and attribution", async () => {
    const { db } = database();
    const record = await readForecastReading(db, "ours", decisionId, clauseId);
    expect(record.status).toBe("ready");
    expect(record.count).toBe(3);
    expect(record.reading).toEqual(clause.readings[2]);
  });

  test("a failed read is not an empty history even if a partial payload exists", async () => {
    const record = await readForecastReading(database(true).db, "ours", decisionId, clauseId);
    expect(record).toEqual({ status: "unavailable", reading: null, count: 0 });
  });

  test("an absent link or workspace never runs a broad query", async () => {
    const testDb = database();
    expect((await readForecastReading(testDb.db, "ours", decisionId, null)).status).toBe(
      "unlinked",
    );
    expect((await readForecastReading(testDb.db, null, decisionId, clauseId)).status).toBe(
      "unavailable",
    );
    expect(testDb.reads).toBe(0);
  });
});
