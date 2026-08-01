import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAgentLoop, executeApproval, type Json } from "@/lib/ai/loop.server";
import { recordGateSignalCore } from "@/lib/gate-signals.functions";

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
      .select("status,agent_slug,tool_name")
      .eq("id", data.approvalId)
      .eq("user_id", userId)
      .maybeSingle();
    const priorRow = prior as {
      status?: string | null;
      agent_slug?: string | null;
      tool_name?: string | null;
    } | null;
    const status = data.decision === "approve" ? "approved" : "rejected";
    const { error } = await supabase
      .from("agent_approvals")
      .update({
        status,
        decided_at: new Date().toISOString(),
        decided_by: userId,
      })
      .eq("id", data.approvalId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    // RPT-32: log the human at this gate. Recorded ONLY when this is a real
    // first decision on an existing pending approval, so a missing/foreign
    // approvalId (no prior row) or a re-decide (prior already approved/rejected)
    // never injects a phantom or duplicate signal that would skew the per-agent
    // correction rate. AWAITED (not fire-and-forget) so the write survives the
    // Cloudflare Workers response teardown; recordGateSignalCore never throws,
    // so awaiting it can never block or break the approve/reject decision.
    if (priorRow?.status === "pending") {
      await recordGateSignalCore(supabase, userId, {
        gateType: data.decision === "approve" ? "approval" : "rejection",
        subjectType: "tool_call",
        subjectRef: data.approvalId,
        agentSlug: priorRow.agent_slug ?? null,
        toolName: priorRow.tool_name ?? null,
        verdict: status,
      });
    }
    if (status === "approved" && data.execute !== false) {
      const result = await executeApproval(supabase, userId, data.approvalId);
      return { ok: true, executed: true, result: result as Json };
    }
    return { ok: true, executed: false };
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
export const forgetMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ForgetSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("agent_memory")
      .delete()
      .eq("id", data.memoryId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
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
    if (!TOOL_REGISTRY[data.toolName]) throw new Error(`Unknown tool: ${data.toolName}`);

    const patch: { mode?: string; enabled?: boolean } = {};
    if (data.mode) patch.mode = data.mode;
    if (typeof data.enabled === "boolean") patch.enabled = data.enabled;
    if (!Object.keys(patch).length) return { ok: true };

    // UPSERT, because the row is created the moment this account first deviates
    // from the platform default and not before. `agent_tools_user_id_tool_name_key`
    // is the conflict target.
    const { error } = await supabase.from("agent_tools").upsert(
      {
        user_id: userId,
        tool_name: data.toolName,
        built_in: true,
        enabled: true,
        ...patch,
      },
      { onConflict: "user_id,tool_name" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
