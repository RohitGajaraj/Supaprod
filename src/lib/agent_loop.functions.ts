import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  runAgentLoop,
  executeApproval,
  claimApprovalDecision,
  type Json,
} from "@/lib/ai/loop.server";
import { recordGateSignalCore } from "@/lib/gate-signals.functions";
import { assertWorkspaceRole, GOVERNED_WRITES } from "@/lib/roles.functions";

const RunSchema = z.object({
  agentSlug: z.string().min(1).max(60),
  goal: z.string().min(1).max(4000),
  model: z.string().min(1).max(120).optional(),
  asMission: z.boolean().optional(),
  missionTitle: z.string().max(200).optional(),
});

export const runAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => RunSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    let missionId: string | null = null;
    if (data.asMission) {
      // Resolve workspace + starting agent, create mission, then run.
      const { data: ws } = await supabase.rpc("current_user_default_workspace");
      const workspaceId = (ws as string | null) ?? null;
      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .eq("user_id", userId)
        .eq("slug", data.agentSlug)
        .maybeSingle();
      if (workspaceId && agent) {
        const { createMission } = await import("@/lib/ai/handoff.server");
        const m = await createMission(supabase, userId, workspaceId, {
          title: data.missionTitle?.trim() || data.goal.slice(0, 80),
          goal: data.goal,
          starting_agent_id: (agent as { id: string }).id,
        });
        missionId = m.id;
      }
    }
    const result = await runAgentLoop(supabase, userId, { ...data, missionId });
    return { ...result, mission_id: missionId };
  });

export const listApprovals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (
      input:
        | { status?: "pending" | "approved" | "rejected" | "executed" | "failed" | "all" }
        | undefined,
    ) => input ?? { status: "pending" as const },
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("agent_approvals")
      .select("id,agent_slug,tool_name,args,rationale,status,created_at,decided_at,result,error")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { approvals: rows ?? [] };
  });

const DecideSchema = z.object({
  approvalId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  execute: z.boolean().optional(),
});

export const decideApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DecideSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Read the prior state first: it gives the agent/tool attribution AND lets
    // the RPT-32 gate signal fire only on a genuine first decision.
    const { data: prior } = await supabase
      .from("agent_approvals")
      .select("status,agent_slug,tool_name,workspace_id")
      .eq("id", data.approvalId)
      .eq("user_id", userId)
      .maybeSingle();
    const priorRow = prior as {
      status?: string | null;
      agent_slug?: string | null;
      tool_name?: string | null;
      workspace_id?: string | null;
    } | null;
    const status = data.decision === "approve" ? "approved" : "rejected";
    /* THE READ ABOVE WAS NEVER A PRECONDITION, ONLY A LABEL.
     *
     * `prior` was read for attribution and for the gate signal below, and the
     * write that followed was filtered by id and user alone. So the status this
     * function had just read was allowed to change underneath it, and two
     * surfaces answering one call (this one and the Govern panel) both wrote a
     * decision and both went on to EXECUTE the tool. That is a second merge
     * commit on a customer's branch, or a second paid delegate.openhands job.
     *
     * The claim carries `.eq("status","pending")` and reads its rows back, so
     * the loser is told cleanly and stops. It is not an error state: answering
     * a call someone else just answered is a normal thing for two people to do. */
    const claim = await claimApprovalDecision(
      supabase,
      userId,
      data.approvalId,
      status as "approved" | "rejected",
    );
    if (!claim.claimed) {
      return { ok: true, executed: false, already_decided: true, result: null as Json | null };
    }
    // RPT-32: log the human at this gate. The claim above is now the guarantee
    // that this is a genuine FIRST decision (it only wins on a pending row), so
    // the prior-status test that used to carry that job is a second reading of
    // the same fact, kept because `priorRow` is also where the attribution
    // comes from, and a null row means there is nothing to attribute to.
    // AWAITED (not fire-and-forget) so the write survives the Cloudflare Workers
    // response teardown; recordGateSignalCore never throws, so awaiting it can
    // never block or break the approve/reject decision.
    if (priorRow?.status === "pending") {
      await recordGateSignalCore(supabase, userId, {
        gateType: data.decision === "approve" ? "approval" : "rejection",
        subjectType: "tool_call",
        subjectRef: data.approvalId,
        agentSlug: priorRow.agent_slug ?? null,
        toolName: priorRow.tool_name ?? null,
        verdict: status,
        // Without this the row lands with workspace_id = NULL, and
        // self-improve's readAgentSignals scopes by workspace_id with no
        // fallback - so the most-decided gate in the product moved no
        // correction rate at all.
        workspaceId: priorRow.workspace_id ?? null,
      });
    }
    if (status === "approved" && data.execute !== false) {
      // executeApproval takes its own claim before calling the tool, so winning
      // the decision above never doubles as permission to run.
      const result = await executeApproval(supabase, userId, data.approvalId);
      return { ok: true, executed: true, already_decided: false, result: result as Json };
    }
    return { ok: true, executed: false, already_decided: false, result: null as Json | null };
  });

export const listAgentMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { agentSlug?: string } | undefined) => input ?? {})
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("agent_memory")
      .select("id,agent_slug,scope,kind,content,importance,created_at,last_used_at")
      .eq("user_id", userId)
      .order("importance", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.agentSlug) q = q.eq("agent_slug", data.agentSlug);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { memories: rows ?? [] };
  });

const ForgetSchema = z.object({ memoryId: z.string().uuid() });

/**
 * Forget one memory, and record that you did.
 *
 * TWO THINGS WERE WRONG HERE, and the second is the interesting one.
 *
 * 1. THE REFUSAL WAS INVISIBLE. `.delete()` with no `.select()` resolves as
 *    `{ error: null }` when RLS refuses it, because supabase-js RESOLVES a
 *    refused write rather than rejecting. So this returned `{ ok: true }`
 *    having removed nothing, and any surface that mounted it would have shown
 *    the row vanish optimistically and reappear on the next read, with no
 *    error anywhere. The identical trap is documented on
 *    `deleteSignal` in discovery.functions.ts. Fixed the same way: select the
 *    deleted row back and treat an empty set as the refusal it is.
 *
 * 2. THE DELETE WAS SILENT, on a surface whose entire argument is that the
 *    record can be trusted. A memory that can vanish without trace makes the
 *    record a cache. So a forget is now written to `human_gate_events` as an
 *    `override`, which is what it actually is: a human telling the brain that
 *    something it learned was wrong.
 *
 *    That is not bookkeeping. `summarizeGateSignals` counts an override as a
 *    CORRECTION, so forgetting a memory an agent wrote moves that agent's
 *    correction rate, and `loadFlagEvidence` reads the note back verbatim when
 *    it drafts an improvement proposal. A deletion is the strongest possible
 *    statement that a lesson was wrong, and it was the one signal the flywheel
 *    threw away.
 *
 *    The row records WHAT was forgotten in `diff_summary`, clamped, so the
 *    history can say "you corrected this, on this date" without the surface
 *    having to keep the deleted content itself.
 */
export const forgetMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ForgetSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Read BEFORE the delete: after it succeeds there is nothing left to
    // attribute, and an override filed against no agent lands in the
    // "(unattributed)" bucket that readAgentSignals filters out.
    const { data: prior } = await supabase
      .from("agent_memory")
      .select("id,content,agent_slug,workspace_id,kind")
      .eq("id", data.memoryId)
      .eq("user_id", userId)
      .maybeSingle();

    const { data: removed, error } = await supabase
      .from("agent_memory")
      .delete()
      .eq("id", data.memoryId)
      .eq("user_id", userId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!removed || removed.length === 0) {
      throw new Error("That memory was not removed. It may not be yours, or it is already gone.");
    }

    if (prior) {
      const p = prior as {
        content?: string | null;
        agent_slug?: string | null;
        workspace_id?: string | null;
        kind?: string | null;
      };
      await recordGateSignalCore(supabase, userId, {
        gateType: "override",
        subjectType: "agent_memory",
        subjectRef: data.memoryId,
        agentSlug: p.agent_slug ?? null,
        verdict: "forgotten",
        diffSummary: `Forgot a ${p.kind ?? "memory"}: ${(p.content ?? "").slice(0, 300)}`,
        workspaceId: p.workspace_id ?? null,
      });
    }
    return { ok: true };
  });

/**
 * Every tool the platform has, with this account's overrides applied.
 *
 * Built from TOOL_REGISTRY rather than from the account's rows (founder ruling
 * 2026-08-01, the platform-level model). Reading the rows AS the list was what
 * made this screen agree with the runtime while both were wrong: an account with
 * no `prd.draft` row saw no Plan tool and had no way to know one existed.
 *
 * The registry is imported dynamically so this module stays client-safe;
 * `registry.server.ts` pulls in the Supabase client and every connector adapter,
 * and the handler body is the only part of this file that runs on the worker.
 */
export const listTools = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { loadAccountTools } = await import("@/lib/ai/tools/access.server");
    const tools = await loadAccountTools(supabase, userId);
    return { tools };
  });

const ToolModeSchema = z.object({
  // Keyed by NAME, not by row id. A tool this account has never changed has no
  // row at all under the override model, so there is no id to send.
  toolName: z.string().min(1).max(100),
  mode: z.enum(["auto", "confirm", "review", "off"]).optional(),
  enabled: z.boolean().optional(),
  /**
   * The workspace this override belongs to. Optional for compatibility, but a
   * caller that knows the active workspace must pass it: resolving a default
   * server-side files the override under whichever workspace happens to be
   * first, which is the same defect the spend policy has, and it would mean the
   * boundary you moved is not the boundary that binds the run.
   */
  workspaceId: z.string().uuid().optional(),
});
export const updateToolMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ToolModeSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { TOOL_REGISTRY } = await import("@/lib/ai/tools/registry.server");
    // Only a real tool may get a row. Without this a typo would write an
    // override for a tool that does not exist, which the runtime ignores and the
    // settings screen would then never show, leaving an invisible orphan.
    const tool = TOOL_REGISTRY[data.toolName];
    if (!tool) throw new Error(`Unknown tool: ${data.toolName}`);

    const patch: { mode?: string; enabled?: boolean } = {};
    if (data.mode) patch.mode = data.mode;
    if (typeof data.enabled === "boolean") patch.enabled = data.enabled;
    if (!Object.keys(patch).length) return { ok: true };

    /**
     * THE BOUNDARY COULD NOT MOVE AT ALL, and said so in Postgres.
     *
     * This upsert wrote five columns. `agent_tools.display_name` and
     * `.description` are both NOT NULL with NO DEFAULT (verified live
     * 2026-08-05), and neither was supplied. That did not matter while every
     * account carried a seeded row for every tool, because the upsert always
     * took the UPDATE branch. Migration 20260801234500 deleted all 864 seeded
     * rows and moved to a pure override model, where a row exists ONLY as a
     * deviation. Live count afterwards: 7 rows across 2 users, against ~55
     * tools. So since that migration the first move of any tool's boundary
     * takes the INSERT branch and dies on a not-null violation.
     *
     * `workspace_id` is the third missing column and the one that would have
     * broken it again a day later. The role-aware write policies applied
     * 2026-08-05 gate this table on `can_manage_workspace(workspace_id)`, which
     * is `has_workspace_role(ws, [owner, admin])`, and that returns FALSE for a
     * null workspace (checked against the live function). An insert without it
     * would satisfy the not-null constraint and then be refused by RLS instead.
     *
     * All three are denormalized copies of registry metadata: the runtime reads
     * only tool_name, mode and enabled (ai/tools/access.server.ts). They are
     * filled from TOOL_REGISTRY rather than from the caller so the row can never
     * disagree with the tool it describes.
     */
    let workspaceId = data.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await supabase.rpc("current_user_default_workspace");
      workspaceId = (ws as string | null) ?? null;
    }
    if (!workspaceId) throw new Error("No workspace. Create or join one first.");

    // The same role the RLS policy enforces, asserted here so a refusal is a
    // sentence a person can act on rather than a policy violation they cannot
    // read. Defence in depth: the policy remains the thing that binds.
    await assertWorkspaceRole(
      supabase,
      workspaceId,
      userId,
      [...GOVERNED_WRITES.agent_tools],
      "move a tool boundary",
    );

    // UPSERT, because the row is created the moment this account first deviates
    // from the platform default and not before. `agent_tools_user_id_tool_name_key`
    // is the conflict target.
    //
    // `.select("id")` is not decoration. A write refused by RLS RESOLVES rather
    // than throwing, so without it a viewer's move returned ok:true having
    // changed nothing, and the screen reported a boundary that had not moved.
    const { data: written, error } = await supabase
      .from("agent_tools")
      .upsert(
        {
          user_id: userId,
          workspace_id: workspaceId,
          tool_name: data.toolName,
          display_name: data.toolName,
          description: tool.description,
          category: tool.category,
          built_in: true,
          enabled: true,
          ...patch,
        },
        { onConflict: "user_id,tool_name" },
      )
      .select("id");
    if (error) throw new Error(error.message);
    if (!written || written.length === 0) {
      throw new Error(
        "That boundary is still where it was: this workspace did not accept the change.",
      );
    }
    return { ok: true };
  });
