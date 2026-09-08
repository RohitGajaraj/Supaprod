/**
 * WM-S1: Explore workspace seeder.
 *
 * Seeds a freshly created workspace with lightweight starter content so every
 * new signup lands in a populated space. Gated by ONBOARDING_SEED_ENABLED=1.
 * This is NOT the rich demo seed (that is WM-S5, last).
 *
 * RLS note: inserts use the admin client but set workspace_id and user_id to
 * the actual new user and workspace. The seeded rows are therefore correctly
 * owned and are visible through all normal RLS policies.
 *
 * Never throws to the caller. Insert errors are logged and swallowed so a
 * seeding failure never blocks the workspace creation success path.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Narrow interface that covers the admin client operations we need. Keeps
// _performSeed decoupled from the real Supabase type so tests can pass a stub.
export interface SeedClient {
  from(table: string): {
    insert(rows: Record<string, unknown>[]): Promise<{ error: { message: string } | null }>;
  };
}

// ---------------------------------------------------------------------------
// Sample content
// ---------------------------------------------------------------------------

function samplePrds(workspaceId: string, userId: string): Record<string, unknown>[] {
  return [
    {
      title: "Onboarding: first-run checklist for new members",
      body_md: [
        "## Context",
        "",
        "New members arrive with zero context. The first five minutes determine retention.",
        "",
        "## Goal",
        "",
        "Surface a focused checklist on first login: connect a source, create a mission, review a sample brief.",
        "",
        "## Success criteria",
        "",
        "- 70% of new users complete all three steps within 24 hours.",
        "- Drop-off at each step is visible in the analytics dashboard.",
        "",
        "## Out of scope",
        "",
        "Rich in-app tutorials and video walkthroughs are deferred to a later milestone.",
      ].join("\n"),
      status: "draft",
      user_id: userId,
      workspace_id: workspaceId,
    },
    {
      title: "AI brief supaprod: configurable delivery schedule",
      body_md: [
        "## Context",
        "",
        "The morning brief runs on a fixed schedule. Teams in different time zones want it at a different hour.",
        "",
        "## Goal",
        "",
        "Let each workspace set a preferred brief delivery time: hour, day of week, or off.",
        "",
        "## Success criteria",
        "",
        "- Workspace owner can change the schedule in Settings with zero engineer involvement.",
        "- The brief fires within 5 minutes of the configured time.",
        "",
        "## Out of scope",
        "",
        "Per-member schedule overrides are a follow-on once the workspace-level setting ships.",
      ].join("\n"),
      status: "draft",
      user_id: userId,
      workspace_id: workspaceId,
    },
  ];
}

function sampleDecisions(workspaceId: string, userId: string): Record<string, unknown>[] {
  return [
    {
      title: "Use Supabase as the primary data layer",
      rationale:
        "Postgres with Row-Level Security gives strong multi-tenant isolation out of the box. The hosted offering removes ops overhead at this stage of the company.",
      status: "approved",
      source_kind: "manual",
      user_id: userId,
      workspace_id: workspaceId,
    },
    {
      title: "Ship the AI brief before the full agent loop",
      rationale:
        "The brief delivers visible daily value with a single AI call. It builds trust in the platform before users are asked to grant autonomous action to agents.",
      status: "approved",
      source_kind: "manual",
      user_id: userId,
      workspace_id: workspaceId,
    },
  ];
}

function sampleMemories(workspaceId: string, userId: string): Record<string, unknown>[] {
  return [
    {
      content:
        "This workspace was created by the founding team. The core focus is shipping the AI brief and the decision record before expanding to full agentic execution.",
      kind: "fact",
      scope: "workspace",
      importance: 6,
      metadata: { seed: true, version: 1 },
      user_id: userId,
      workspace_id: workspaceId,
    },
    {
      content:
        "Product decisions in this workspace follow a decision-first process: write the rationale before coding. Every shipped item should have a linked decision row.",
      kind: "preference",
      scope: "workspace",
      importance: 5,
      metadata: { seed: true, version: 1 },
      user_id: userId,
      workspace_id: workspaceId,
    },
  ];
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Internal: performs all inserts against the supplied client. Exported so
 * tests can pass a stub without needing to mock the admin client module.
 * Does NOT check the env gate. Throws on any insert error.
 */
export async function _performSeed(
  db: SeedClient,
  workspaceId: string,
  userId: string,
): Promise<void> {
  // SEAM-1: ids are pre-assigned client-side so the stage_events creation rows
  // below can reference the seeded entities without the insert needing to
  // return rows (SeedClient stays a plain insert interface for the test stubs).
  const prdRows = samplePrds(workspaceId, userId).map((row) => ({
    id: crypto.randomUUID(),
    ...row,
  }));
  const decisionRows = sampleDecisions(workspaceId, userId).map((row) => ({
    id: crypto.randomUUID(),
    ...row,
  }));

  const prdResult = await db.from("prds").insert(prdRows);
  if (prdResult.error) throw new Error(`seed prds: ${prdResult.error.message}`);

  const decisionResult = await db.from("decisions").insert(decisionRows);
  if (decisionResult.error) throw new Error(`seed decisions: ${decisionResult.error.message}`);

  const memoryResult = await db.from("agent_memory").insert(sampleMemories(workspaceId, userId));
  if (memoryResult.error) throw new Error(`seed agent_memory: ${memoryResult.error.message}`);

  // SEAM-1: creation stage events for the seeded specs + decisions, one bulk
  // insert for efficiency. Fail-safe by the stage-events contract: recording
  // history must never break the main write, so errors are logged, not thrown.
  const stageEventRows = [
    ...prdRows.map((p) => ({
      entity_type: "spec",
      entity_id: p.id,
      from_stage: null,
      to_stage: "draft",
      actor: "system",
      workspace_id: workspaceId,
      user_id: userId,
    })),
    ...decisionRows.map((d) => ({
      entity_type: "decision",
      entity_id: d.id,
      from_stage: null,
      to_stage: "approved",
      actor: "system",
      workspace_id: workspaceId,
      user_id: userId,
    })),
  ];
  const stageResult = await db.from("stage_events").insert(stageEventRows);
  if (stageResult.error) {
    console.error(`[WM-S1] seed stage_events failed: ${stageResult.error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Layer A (rich sample workspace) · SAMPLE-SEED
// ---------------------------------------------------------------------------

/** Minimal shape of the admin client's rpc() we call, to avoid depending on
 *  regenerated DB types for the new function (types are Lovable-managed). */
interface RpcClient {
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  // Minimal shape for the is_sample flag write, to avoid depending on the
  // regenerated Database type for the new column (types are Lovable-managed).
  from(table: string): {
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): Promise<{ error: { message: string } | null }>;
    };
  };
}

/**
 * Layer A: give a new signup their own clearly-labelled, fully-populated
 * "Explore workspace" (the two-product Prism + Trellis showcase) so they see the
 * whole product on real data in their first session, alongside their own empty
 * workspace. Delegates to the idempotent, SECURITY DEFINER DB function
 * `seed_sample_workspace(_user_id)` (migration 20260705120000).
 *
 * Dormant by design: no-op unless SAMPLE_WORKSPACE_ENABLED=1, so wiring it in
 * changes nothing until the founder flips the flag in Lovable. The DB function
 * has its own idempotency guard (the 'sample-workspace-v1' sentinel), so a
 * double call is safe. Errors are logged and swallowed so a seeding failure
 * never blocks the signup / first-run path. The sample workspace is not billed
 * (it is seeded data, not user AI usage).
 */
export async function seedSampleWorkspace(userId: string): Promise<string | null> {
  if (process.env.SAMPLE_WORKSPACE_ENABLED !== "1") return null;
  try {
    const { data, error } = await (supabaseAdmin as unknown as RpcClient).rpc(
      "seed_sample_workspace",
      { _user_id: userId },
    );
    if (error) throw new Error(error.message);
    // The DB function RETURNS the sample workspace uuid so the caller can switch
    // the user straight into it.
    const workspaceId = typeof data === "string" ? data : null;

    // SAMPLE-SEED v2 (Mission Control augment): additive + idempotent, adds the
    // review-status spec so the reimagined Approvals tray + Send back + the
    // signature moment are experienceable on the sample data. Guarded: a failure
    // here never undoes the v1 seed or blocks signup.
    try {
      const { error: v2Error } = await (supabaseAdmin as unknown as RpcClient).rpc(
        "seed_sample_workspace_v2",
        { _user_id: userId },
      );
      if (v2Error) console.error("[SAMPLE-SEED] v2 augment failed:", v2Error.message);
    } catch (v2Err) {
      console.error("[SAMPLE-SEED] v2 augment threw:", v2Err);
    }

    // Flag it as sample data so the shell labels it (banner + badge). Keyed on
    // the exact workspace the seed created/returned, not its name, so it is
    // drift-proof and never mis-flags a real workspace. Service-role write;
    // idempotent, so the idempotent re-seed path re-affirms the flag harmlessly.
    if (workspaceId) {
      const { error: flagError } = await (supabaseAdmin as unknown as RpcClient)
        .from("workspaces")
        .update({ is_sample: true })
        .eq("id", workspaceId);
      if (flagError) console.error("[SAMPLE-SEED] is_sample flag failed:", flagError.message);
    }
    return workspaceId;
  } catch (err) {
    console.error("[SAMPLE-SEED] seedSampleWorkspace failed:", err);
    return null;
  }
}
