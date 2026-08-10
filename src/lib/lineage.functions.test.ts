import { describe, expect, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DECISION_ORIGIN_RELATION,
  recordDecisionOrigins,
  recordLineage,
  recordLineageSafe,
} from "./lineage.functions";

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

/**
 * THE TWO DIRECTIONS THE SCHEMA MODELS AND NOTHING WROTE.
 *
 * `decisions` carries `prd_id` and `mission_id`. Measured against production
 * 2026-08-10: 105 of 154 real decisions carry `source_kind='mission'` and NOT
 * ONE has a lineage edge naming which mission, so the graph could not see the
 * largest source of decisions in the product and every reading of the station
 * chain under-measured Decide's inbound.
 *
 * These pin the behaviour, not the source text. The chain guard
 * (`the-ledger-chain-has-a-writer-for-every-hop`) asserts the writer EXISTS and
 * is called from all four doors; this asserts what it actually sends.
 */
describe("recordDecisionOrigins - the decision's own foreign keys, on the graph", () => {
  const decisionId = "33333333-3333-3333-3333-333333333333";
  const missionId = "44444444-4444-4444-4444-444444444444";
  const prdId = "55555555-5555-5555-5555-555555555555";
  const workspaceId = "66666666-6666-6666-6666-666666666666";

  test("writes mission -> decision when the call was filed against a mission", async () => {
    const captured: CapturedUpsert[] = [];
    await recordDecisionOrigins(mockSupabase(captured), "user-1", {
      decisionId,
      missionId,
      workspaceId,
      createdByAgent: "builder",
      rationale: "The mission this completion receipt was filed against",
    });

    expect(captured.length).toBe(1);
    expect(captured[0].table).toBe("artifact_lineage");
    expect(captured[0].row).toEqual({
      user_id: "user-1",
      parent_kind: "mission",
      parent_id: missionId,
      child_kind: "decision",
      child_id: decisionId,
      relation: "decided",
      rationale: "The mission this completion receipt was filed against",
      created_by_agent: "builder",
      ai_event_id: null,
      workspace_id: workspaceId,
    });
  });

  test("writes prd -> decision when the call was filed against a spec", async () => {
    const captured: CapturedUpsert[] = [];
    await recordDecisionOrigins(mockSupabase(captured), "user-1", {
      decisionId,
      prdId,
      workspaceId,
    });

    expect(captured.length).toBe(1);
    expect(captured[0].row.parent_kind).toBe("prd");
    expect(captured[0].row.parent_id).toBe(prdId);
    expect(captured[0].row.child_kind).toBe("decision");
  });

  /**
   * `decision.record` files a mission-scoped call about a spec routinely, and
   * both statements are true. The unique index keys on the pair PLUS the
   * relation, so two edges out of one decision never collide.
   */
  test("writes BOTH edges when a decision carries both ids", async () => {
    const captured: CapturedUpsert[] = [];
    await recordDecisionOrigins(mockSupabase(captured), "user-1", {
      decisionId,
      missionId,
      prdId,
      workspaceId,
    });

    expect(captured.length).toBe(2);
    expect(captured.map((c) => c.row.parent_kind)).toEqual(["mission", "prd"]);
    for (const c of captured) {
      expect(c.row.child_id).toBe(decisionId);
      expect(c.row.workspace_id).toBe(workspaceId);
    }
  });

  test("writes nothing when the decision was filed against neither", async () => {
    const captured: CapturedUpsert[] = [];
    await recordDecisionOrigins(mockSupabase(captured), "user-1", {
      decisionId,
      workspaceId,
      missionId: null,
      prdId: null,
    });
    expect(captured.length).toBe(0);
  });

  /**
   * AN EDGE POINTING AT A ROW THAT WAS REFUSED IS WORSE THAN A MISSING EDGE.
   * supabase-js resolves a refused insert with no error and no row, so every
   * caller confirms the decision landed before calling this. The empty-id guard
   * is the backstop for the one that forgets.
   */
  test("writes nothing when there is no confirmed decision to point at", async () => {
    const captured: CapturedUpsert[] = [];
    await recordDecisionOrigins(mockSupabase(captured), "user-1", {
      decisionId: "",
      missionId,
      workspaceId,
    });
    expect(captured.length).toBe(0);
  });

  /**
   * WM-F1. `artifact_lineage.workspace_id` defaults to
   * `current_user_default_workspace()` — the CALLER'S default, not the
   * workspace the artifacts live in. An edge filed under the wrong one is read
   * by the wrong reader forever after.
   */
  test("sends the workspace it was given rather than letting the default fire", async () => {
    const captured: CapturedUpsert[] = [];
    const artifactsWorkspace = "77777777-7777-7777-7777-777777777777";
    await recordDecisionOrigins(mockSupabase(captured), "user-1", {
      decisionId,
      missionId,
      workspaceId: artifactsWorkspace,
    });
    expect(captured[0].row.workspace_id).toBe(artifactsWorkspace);
  });

  /**
   * The one case where the column default is allowed to fire is when the caller
   * says so with an explicit null. `recordLineage` OMITS the key rather than
   * writing `workspace_id: null`, which would suppress the default and violate
   * NOT NULL — turning a defaulted edge into a refused one.
   */
  test("omits the column entirely on an explicit null, never writes null", async () => {
    const captured: CapturedUpsert[] = [];
    await recordDecisionOrigins(mockSupabase(captured), "user-1", {
      decisionId,
      missionId,
      workspaceId: null,
    });
    expect(captured[0].row).not.toHaveProperty("workspace_id");
  });

  test("a refused or dead transport never throws back into the write it describes", async () => {
    const captured: CapturedUpsert[] = [];
    const boom = mockSupabase(captured, new Error("network down"));
    await expect(
      recordDecisionOrigins(boom, "user-1", { decisionId, missionId, prdId, workspaceId }),
    ).resolves.toBeUndefined();
    expect(captured.length).toBe(0);
  });

  test("the relation is the one the judgment gate already writes", async () => {
    // Reusing `decided` is what lets one query answer "what calls were recorded
    // against this artifact" for a bet, a spec and a mission alike.
    expect(DECISION_ORIGIN_RELATION).toBe("decided");
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
