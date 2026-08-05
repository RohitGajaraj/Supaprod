import { describe, expect, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordLineage, recordLineageSafe } from "./lineage.functions";

// SW-5 / mission 3.11 chain audit (data-gaps c2+c3): every promotion stamps its
// artifact_lineage edge so the chain is walkable by EDGES. These tests pin the
// exact upsert shape (the one insert idiom every writer reuses) and the
// fail-soft contract of recordLineageSafe: a lineage stamp runs after the main
// write succeeded and must never throw back into the promotion.

type CapturedUpsert = { table: string; row: Record<string, unknown>; options: unknown };

function mockSupabase(captured: CapturedUpsert[], failWith?: Error) {
  return {
    from: (table: string) => ({
      upsert: (row: Record<string, unknown>, options: unknown) => {
        if (failWith) return Promise.reject(failWith);
        captured.push({ table, row, options });
        return Promise.resolve({ error: null });
      },
    }),
  } as unknown as SupabaseClient;
}

const edge = {
  parent_kind: "theme",
  parent_id: "11111111-1111-1111-1111-111111111111",
  child_kind: "opportunity",
  child_id: "22222222-2222-2222-2222-222222222222",
} as const;

describe("recordLineage insert shape", () => {
  test("upserts the full edge row into artifact_lineage with the promoted default", async () => {
    const captured: CapturedUpsert[] = [];
    await recordLineage(mockSupabase(captured), "user-1", { ...edge });

    expect(captured.length).toBe(1);
    expect(captured[0].table).toBe("artifact_lineage");
    expect(captured[0].row).toEqual({
      user_id: "user-1",
      parent_kind: "theme",
      parent_id: edge.parent_id,
      child_kind: "opportunity",
      child_id: edge.child_id,
      relation: "promoted",
      rationale: null,
      created_by_agent: null,
      ai_event_id: null,
    });
  });

  test("dedupes on the unique edge key (user, parent, child, relation)", async () => {
    const captured: CapturedUpsert[] = [];
    await recordLineage(mockSupabase(captured), "user-1", { ...edge });

    expect(captured[0].options).toEqual({
      onConflict: "user_id,parent_kind,parent_id,child_kind,child_id,relation",
    });
  });

  test("passes an explicit relation and metadata through unchanged", async () => {
    const captured: CapturedUpsert[] = [];
    await recordLineage(mockSupabase(captured), "user-1", {
      ...edge,
      parent_kind: "prd",
      child_kind: "mission",
      relation: "dispatched",
      rationale: "Sent to Studio",
      created_by_agent: "studio",
    });

    expect(captured[0].row.relation).toBe("dispatched");
    expect(captured[0].row.rationale).toBe("Sent to Studio");
    expect(captured[0].row.created_by_agent).toBe("studio");
  });
});

/**
 * A REFUSED EDGE MUST LEAVE A TRACE.
 *
 * supabase-js RESOLVES a refused write with `{ error }` rather than rejecting.
 * recordLineage used to `await` the upsert and never look at `error`, so a
 * rejected edge returned normally and recordLineageSafe's try/catch was guarding
 * a throw that essentially never came. Both layers reported success for a write
 * that did not happen — which is how a missing `prd -> mission` edge held the
 * outcome-memory pool at zero without a single visible symptom.
 *
 * Fail-soft is still the contract: the promotion already succeeded, so a failed
 * provenance stamp must never throw back into it. What changed is that the
 * failure now reaches error_events, per the house rule that console.error is not
 * observability.
 */
describe("recordLineage does not swallow a refused write", () => {
  function mockRefusing(message: string) {
    return {
      from: () => ({
        upsert: () => Promise.resolve({ error: { message } }),
      }),
    } as unknown as SupabaseClient;
  }

  test("still resolves, because provenance must never fail the promotion", async () => {
    await expect(
      recordLineage(mockRefusing("new row violates row-level security policy"), "user-1", {
        ...edge,
      }),
    ).resolves.toBeUndefined();
  });

  test("reports the refusal to error_events, naming which edge went missing", async () => {
    const seen: { message: string; ctx: Record<string, unknown> }[] = [];

    await recordLineage(
      mockRefusing("permission denied"),
      "user-9",
      { ...edge, parent_kind: "prd", child_kind: "mission", relation: "dispatched" },
      {
        report: async (err, ctx) => {
          seen.push({
            message: err instanceof Error ? err.message : String(err),
            ctx: ctx as unknown as Record<string, unknown>,
          });
        },
      },
    );

    expect(seen.length).toBe(1);
    expect(seen[0].message).toContain("permission denied");
    expect(seen[0].ctx.surface).toBe("lineage.recordLineage");
    expect(seen[0].ctx.user_id).toBe("user-9");
    // The record says WHICH link is missing, not that something somewhere failed.
    expect(seen[0].ctx.failure_kind).toBe("prd->mission:dispatched");
  });
});

describe("recordLineageSafe fail-soft contract", () => {
  test("absorbs a thrown transport error instead of failing the promotion", async () => {
    const captured: CapturedUpsert[] = [];
    const boom = mockSupabase(captured, new Error("network down"));

    await expect(recordLineageSafe(boom, "user-1", { ...edge })).resolves.toBeUndefined();
    expect(captured.length).toBe(0);
  });

  test("writes the identical edge shape when the transport is healthy", async () => {
    const captured: CapturedUpsert[] = [];
    await recordLineageSafe(mockSupabase(captured), "user-1", { ...edge });

    expect(captured.length).toBe(1);
    expect(captured[0].table).toBe("artifact_lineage");
    expect(captured[0].row.relation).toBe("promoted");
  });
});
