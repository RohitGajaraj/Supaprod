/**
 * ── THE MOAT CLAIM, AND UNTIL P-42 IT COULD NOT LOOK AT THE WORLD ─────────
 *
 * The forecast grader was handed the claim, the observable, the horizon and one
 * line of evidence whose only source was the linked spec's settled outcome.
 * With no linked spec that line read, verbatim, *No linked outcome has been
 * settled.* It had no tools and read nothing else, and eight due forecasts on
 * production came back at **confidence 1.0 with nothing behind them**.
 *
 * These two tests are the packet's two sentences, driven through the real
 * functions rather than asserted on source:
 *
 *   a decision with two post-horizon signals and a deployment  ->  the verdict
 *   names all three
 *
 *   a decision with nothing to read  ->  it stays inconclusive
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import { readKitForForecast, readKitAsText, citedRows } from "./what-the-grader-read";

/**
 * A chainable PostgREST stub. Every filter returns `this`, and awaiting the
 * builder yields whatever `rowsFor` gives for the table. `neq` calls are
 * RECORDED, because one of the properties under test is that the loop's own
 * writing is excluded, and that is a filter rather than a result.
 */
function stubDb(rowsFor: Record<string, unknown[]>, neqLog: Array<[string, string]> = []) {
  const make = (table: string) => {
    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    for (const m of ["select", "eq", "gt", "in", "order", "limit"]) builder[m] = chain;
    builder.neq = (col: string, val: string) => {
      neqLog.push([col, val]);
      return builder;
    };
    builder.then = (resolve: (v: { data: unknown[]; error: null }) => unknown) =>
      resolve({ data: rowsFor[table] ?? [], error: null });
    return builder;
  };
  return { from: (t: string) => make(t) } as unknown as SupabaseClient;
}

const DECISION = {
  id: "d-1",
  workspace_id: "ws-1",
  product_id: "p-1",
  prd_id: "prd-1",
  created_at: "2026-08-01T00:00:00.000Z",
  horizonDate: "2026-09-01T00:00:00.000Z",
};

describe("a decision with two post-horizon signals and a deployment names all three", () => {
  it("reads them, and gives each an id the verdict can cite", async () => {
    const neq: Array<[string, string]> = [];
    const db = stubDb(
      {
        signals: [
          {
            id: "s-1",
            title: "Completion rate rose to 62 percent",
            source: "analytics",
            created_at: "2026-08-20T00:00:00Z",
          },
          {
            id: "s-2",
            title: "Three customers said the step is gone",
            source: "canny",
            created_at: "2026-08-22T00:00:00Z",
          },
        ],
        studio_changesets: [{ id: "cs-1" }],
        deployments: [
          {
            id: "dep-1",
            status: "succeeded",
            environment: "production",
            failure_reason: null,
            deployed_at: "2026-08-15T00:00:00Z",
          },
        ],
      },
      neq,
    );

    const kit = await readKitForForecast(
      db,
      DECISION,
      "The linked spec has a settled outcome: shipped",
    );
    const ids = kit.rows.map((r) => `${r.kind}:${r.id}`);

    expect(kit.empty).toBe(false);
    expect(ids).toContain("signal:s-1");
    expect(ids).toContain("signal:s-2");
    expect(ids).toContain("deployment:dep-1");
    // The linked outcome is still in the kit: it is what the grader always had.
    expect(kit.rows.some((r) => r.kind === "outcome")).toBe(true);

    // Every row is offered to the model with the id it must cite.
    const text = readKitAsText(kit);
    expect(text).toContain("[signal:s-1]");
    expect(text).toContain("[deployment:dep-1]");
    // The deployment carries whether it actually shipped, which is the
    // difference between a miss and an inconclusive.
    expect(text).toContain("succeeded to production");
  });

  it("excludes the loop's own writing from what it may grade against", async () => {
    // P-41's rule, applied here because a grader marking its own homework is
    // that defect with a verdict attached, which ends on the record as a
    // proven call.
    const neq: Array<[string, string]> = [];
    const db = stubDb({ signals: [], studio_changesets: [], deployments: [] }, neq);
    await readKitForForecast(db, DECISION, "");
    expect(neq).toContainEqual(["source", "agent"]);
    expect(neq).toContainEqual(["source_kind", "loop_authored"]);
  });

  it("only counts a citation the model was actually shown", async () => {
    const kit = await readKitForForecast(
      stubDb({
        signals: [
          {
            id: "s-1",
            title: "Rate rose",
            source: "analytics",
            created_at: "2026-08-20T00:00:00Z",
          },
        ],
      }),
      DECISION,
      "",
    );
    // Cites a real row: counted.
    expect(citedRows(kit, "It held, per [signal:s-1].").map((r) => r.id)).toEqual(["s-1"]);
    // Cites something it was never given: not counted, so the verdict cannot
    // manufacture a source.
    expect(citedRows(kit, "It held, per [signal:invented-99].")).toEqual([]);
  });
});

describe("a decision with nothing to read stays inconclusive", () => {
  it("reports an empty kit rather than an empty string", async () => {
    const kit = await readKitForForecast(
      stubDb({ signals: [], studio_changesets: [], deployments: [] }),
      DECISION,
      "",
    );
    expect(kit.empty).toBe(true);
    expect(kit.rows).toEqual([]);
  });

  it("tells the model plainly that there was nothing, so it does not guess", async () => {
    const kit = await readKitForForecast(
      stubDb({ signals: [], studio_changesets: [], deployments: [] }),
      DECISION,
      "",
    );
    expect(readKitAsText(kit)).toContain("NOTHING.");
  });

  it("cites nothing, which is what forces the verdict to inconclusive", async () => {
    // The grader's coercion turns on `citedRows(...).length === 0`, so an empty
    // kit can never produce a stored hit or miss.
    const kit = await readKitForForecast(
      stubDb({ signals: [], studio_changesets: [], deployments: [] }),
      DECISION,
      "",
    );
    expect(citedRows(kit, "It clearly held.")).toEqual([]);
  });
});
