/**
 * Orchestrator server functions (F-AGENT-1).
 *
 * Two entrypoints the UI can call:
 *  - ensureOrchestrator: idempotently seeds the `orchestrator` agent + the
 *    four mission.* tools for the current user.
 *  - startOrchestratedMission: bootstrap the orchestrator if needed, then
 *    spawn a mission running the orchestrator with the given goal.
 *  - listMissionSteps: read the mission_steps for a mission (for the
 *    Swarm HUD / mission detail page).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import pLimit from "p-limit";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAgentLoop } from "@/lib/ai/loop.server";
import { createMission } from "@/lib/ai/handoff.server";
import { recordStageEvent } from "@/lib/stage-events.server";
import { advanceMissionCore, type MissionLite } from "@/lib/ai/mission-advance.server";
import { providerIsReachable } from "@/lib/connectors/gateway-era.server";
import {
  validateDispatch,
  findDanglingDeps,
  topologicalOrder,
  toLinearPriority,
  type DispatchableTask,
  type DispatchResult,
} from "@/lib/orchestrator";

export const ensureOrchestrator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.rpc("seed_orchestrator_agent", { p_user_id: userId });
    if (error) throw new Error(error.message);
    return { ok: true, agent_id: data as string };
  });

const StartSchema = z.object({
  goal: z.string().min(4).max(4000),
  title: z.string().max(200).optional(),
  model: z.string().max(120).optional(),
  // D4-REPLAY: when this start is a replay of an existing mission, the parent's
  // id, recorded on the new mission as the branch link.
  replayedFrom: z.string().uuid().optional(),
  // Where this mission was spawned from. The Decide sheet's hand-off passes its
  // bet here, so Brain's graph and Build can walk provenance backward to it.
  origin: z
    .object({ kind: z.literal("opportunity"), id: z.string().uuid() })
    .optional(),
});

export const startOrchestratedMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => StartSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // 1. Ensure the orchestrator exists (idempotent).
    const { error: seedErr } = await supabase.rpc("seed_orchestrator_agent", { p_user_id: userId });
    if (seedErr) throw new Error(`seed orchestrator failed: ${seedErr.message}`);

    // 2. Resolve workspace + orchestrator agent.
    const { data: ws } = await supabase.rpc("current_user_default_workspace");
    const workspaceId = (ws as string | null) ?? null;
    if (!workspaceId) throw new Error("No default workspace found for user");
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", "orchestrator")
      .maybeSingle();
    if (!agent) throw new Error("Orchestrator agent not found after seeding");

    // 3. Pre-flight roster check: confirm at least one specialist exists.
    const { count: specialists } = await supabase
      .from("agents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("enabled", true)
      .neq("slug", "orchestrator");
    if ((specialists ?? 0) === 0) {
      throw new Error(
        "No specialist agents enabled. Create at least one specialist (e.g. discovery, strategist, builder) before starting an orchestrated mission.",
      );
    }

    // 4. Create the mission row.
    const mission = await createMission(supabase, userId, workspaceId, {
      title: data.title?.trim() || data.goal.slice(0, 80),
      goal: data.goal,
      starting_agent_id: (agent as { id: string }).id,
    });

    // D4-REPLAY: record the branch link separately from createMission so chat's
    // mission path stays untouched. Pre-migration tolerant: if the column is not
    // there yet, the update errors and we skip it (the replay still runs; only
    // the parent link is absent until the migration applies).
    if (data.replayedFrom) {
      const { error: linkErr } = await supabase
        .from("missions")
        .update({ replayed_from_mission_id: data.replayedFrom } as never)
        .eq("id", mission.id);
      if (linkErr) console.warn("[startOrchestratedMission] replay link skipped:", linkErr.message);
    }

    // Record what this mission was spawned by, as the same artifact_lineage edge
    // every other door writes (cluster.server.ts's upsert shape, relation
    // "dispatched" like the prd -> mission edges). Non-fatal: the run is real
    // whether or not the edge landed.
    if (data.origin) {
      try {
        await supabase.from("artifact_lineage").upsert(
          [
            {
              user_id: userId,
              parent_kind: data.origin.kind,
              parent_id: data.origin.id,
              child_kind: "mission",
              child_id: mission.id,
              relation: "dispatched",
              rationale: "Handed off from Decide",
            },
          ],
          {
            onConflict: "user_id,parent_kind,parent_id,child_kind,child_id,relation",
          },
        );
      } catch {
        // Best-effort: the mission runs whether or not the edge landed.
      }
    }

    // 5. Run the orchestrator loop. It will plan + dispatch on this call;
    //    specialists run async via the resume-runs sweeper. The operator can
    //    re-invoke advanceMission to push the next round of dispatches.
    //    If the launch itself throws, mark the mission 'halted' before
    //    re-throwing: the UI retry is gated on failed/halted missions, so a
    //    failed launch must not be left 'running' (which strands it). The
    //    missions table has no halted_reason/error column, so we record only
    //    status + updated_at, matching the loop's own mission halt-mark.
    let result;
    try {
      result = await runAgentLoop(supabase, userId, {
        agentSlug: "orchestrator",
        goal: data.goal,
        model: data.model,
        missionId: mission.id,
        workspaceId,
      });
    } catch (e) {
      try {
        await supabase
          .from("missions")
          .update({ status: "halted", updated_at: new Date().toISOString() })
          .eq("id", mission.id);
        // SEAM-1: the launch failure halted the mission (created 'running' above).
        await recordStageEvent(supabase, {
          entityType: "mission",
          entityId: mission.id,
          from: "running",
          to: "halted",
          actor: "system",
          workspaceId,
          userId,
        });
      } catch (markErr) {
        console.error("mission halt-mark failed (launch):", markErr);
      }
      throw e;
    }

    return { mission_id: mission.id, ...result };
  });

const AdvanceSchema = z.object({
  missionId: z.string().uuid(),
  model: z.string().max(120).optional(),
});

/**
 * Advance an existing mission: dispatch newly-ready steps (deps just completed)
 * and finalize a terminal DAG. As of v6 Phase 1 this is the manual lever for the
 * SAME deterministic, model-free engine the resume-runs sweeper now fires
 * automatically every tick (`advanceMissionCore`) — so a mission progresses
 * unattended, and this fn is just an operator "push it now" affordance.
 */
export const advanceMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AdvanceSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: mission, error: mErr } = await supabase
      .from("missions")
      .select("id,user_id,workspace_id,goal,status")
      .eq("id", data.missionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    if (!mission) throw new Error("Mission not found");
    if (mission.status !== "running" && mission.status !== "in_progress") {
      return { skipped: true, reason: `mission already ${mission.status}` };
    }

    const result = await advanceMissionCore(supabase, mission as MissionLite);
    return { mission_id: data.missionId, ...result };
  });

const ListStepsSchema = z.object({ missionId: z.string().uuid() });

export const listMissionSteps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ListStepsSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("mission_steps")
      .select(
        "id,idx,agent_slug,sub_goal,depends_on,status,run_id,error,result,rationale,dispatched_at,completed_at,created_at",
      )
      .eq("mission_id", data.missionId)
      .order("idx");
    if (error) throw new Error(error.message);
    return { steps: rows ?? [] };
  });

// ─── Linear dispatch (ORCH-DELEGATE) ────────────────────────────────────────

const LINEAR_GATEWAY = "https://connector-gateway.lovable.dev/linear/graphql";

async function linearGql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
  if (!LOVABLE_API_KEY || !LINEAR_API_KEY)
    throw new Error("Linear isn't connected. Link it from Settings → Integrations.");
  const res = await fetch(LINEAR_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": LINEAR_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Linear API failed [${res.status}]: ${body.slice(0, 200)}`);
  const parsed = JSON.parse(body) as { data?: T; errors?: unknown[] };
  if (parsed.errors?.length)
    throw new Error(`Linear error: ${JSON.stringify(parsed.errors).slice(0, 200)}`);
  return parsed.data as T;
}

/**
 * Dispatch a PRD's task graph to Linear as issues, governed.
 *
 * Requires the task graph to exist (run generateTaskGraph first).
 * Idempotent: tasks already in sync_mappings are skipped — re-dispatch is safe.
 * The external coding-agent half (BLD-04) is founder-gated and separate.
 */
export const dispatchPRDToLinear = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        prdId: z.string().uuid(),
        teamId: z.string().min(1),
      })
      .parse(i),
  )
  .handler(async ({ context, data }): Promise<DispatchResult> => {
    const { supabase, userId } = context;

    // ASKS WHETHER THIS PERSON CAN REACH LINEAR, not whether an admin set a key.
    // The env-only predicate this replaces answered the second question while
    // every caller read it as the first, which is how a user who had completed
    // the OAuth flow was told to go and connect Linear.
    if (!(await providerIsReachable({ provider: "linear", userClient: supabase, userId }))) {
      throw new Error("Linear is not connected. Connect it in Settings, Connections.");
    }

    // Load PRD
    const { data: prd, error: pErr } = await supabase
      .from("prds")
      .select("id,title,workspace_id")
      .eq("id", data.prdId)
      .eq("user_id", userId)
      .single();
    if (pErr || !prd) throw new Error("Spec not found");

    // Load generated task graph (seq-bearing tasks only)
    const { data: rawTasks, error: tErr } = await supabase
      .from("tasks")
      .select("id,seq,title,priority,depends_on")
      .eq("prd_id", data.prdId)
      .eq("user_id", userId)
      .not("seq", "is", null)
      .order("seq");
    if (tErr) throw new Error(tErr.message);

    const tasks = (rawTasks ?? []) as DispatchableTask[];
    const validation = validateDispatch(tasks);
    if (!validation.ok) throw new Error(validation.reason);

    // Idempotency: skip tasks already dispatched to Linear
    const { data: existing } = await supabase
      .from("sync_mappings")
      .select("local_id")
      .eq("user_id", userId)
      .eq("provider", "linear")
      .eq("local_kind", "task")
      .in(
        "local_id",
        tasks.map((t) => t.id),
      );
    const alreadyDispatched = new Set<string>((existing ?? []).map((e) => e.local_id as string));

    // Exclude tasks with dangling depends_on references — they cannot be safely ordered
    const dangling = findDanglingDeps(tasks);
    const danglingIds = new Set(dangling.map((t) => t.id));
    const safeTasks = tasks.filter((t) => !danglingIds.has(t.id));

    const toDispatch = topologicalOrder(safeTasks).filter((t) => !alreadyDispatched.has(t.id));

    const dispatched: DispatchResult["dispatched"] = [];
    const skipped: string[] = [...dangling.map((t) => t.id)];
    const syncMappingsToInsert: Array<{
      user_id: string;
      provider: string;
      local_kind: string;
      local_id: string;
      external_id: string;
      external_url: string;
      last_pushed_at: string;
      version_local: number;
    }> = [];

    // Parallelize Linear API calls with concurrency limit of 4
    const limit = pLimit(4);
    const dispatchPromises = toDispatch.map((t) =>
      limit(async () => {
        try {
          const r = await linearGql<{
            issueCreate: { success: boolean; issue: { id: string; url: string } };
          }>(
            `mutation($input: IssueCreateInput!) {
              issueCreate(input: $input) { success issue { id url } }
            }`,
            {
              input: {
                teamId: data.teamId,
                title: t.title,
                priority: toLinearPriority(t.priority),
              },
            },
          );

          if (r.issueCreate.success) {
            syncMappingsToInsert.push({
              user_id: userId,
              provider: "linear",
              local_kind: "task",
              local_id: t.id,
              external_id: r.issueCreate.issue.id,
              external_url: r.issueCreate.issue.url,
              last_pushed_at: new Date().toISOString(),
              version_local: 1,
            });
            dispatched.push({
              taskId: t.id,
              issueId: r.issueCreate.issue.id,
              url: r.issueCreate.issue.url,
              title: t.title,
            });
          } else {
            skipped.push(t.id);
          }
        } catch (e) {
          // One issue failing must not abort the rest; caller sees skipped list
          console.error(`[dispatchPRDToLinear] Task ${t.id} dispatch failed:`, e);
          skipped.push(t.id);
        }
      }),
    );

    // Wait for all parallel Linear API calls to complete
    await Promise.all(dispatchPromises);

    // Batch insert all sync_mappings records at once
    if (syncMappingsToInsert.length > 0) {
      const { error: batchErr } = await supabase
        .from("sync_mappings")
        .insert(syncMappingsToInsert as never);
      if (batchErr) {
        // Batch insert failed; remove those tasks from dispatched list
        console.error("[dispatchPRDToLinear] Batch sync_mappings insert failed:", batchErr.message);
        const failedIds = new Set(syncMappingsToInsert.map((m) => m.local_id));
        const stillDispatched = dispatched.filter((d) => !failedIds.has(d.taskId));
        const newlySkipped = dispatched.filter((d) => failedIds.has(d.taskId)).map((d) => d.taskId);
        dispatched.length = 0;
        dispatched.push(...stillDispatched);
        skipped.push(...newlySkipped);
      }
    }

    return {
      dispatched,
      skipped,
      alreadyDispatched: [...alreadyDispatched],
      totalTasks: tasks.length,
    };
  });
