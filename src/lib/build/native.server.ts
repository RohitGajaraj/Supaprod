/**
 * BD-1, the 'native' `BuildDriver` adapter: the home-grown agent loop wrapped
 * behind the seam ("Supaprod Build (native)"). Nothing that works is ripped
 * out: `dispatch` is EXACTLY what `dispatchStudioSession` did after work-order
 * assembly (createMission + a queued `agent_runs` row the resume-runs sweeper
 * promotes), `poll` reads the mission/run rows, `result` summarizes the
 * terminal mission, and `cancel` performs the same writes as the operator's
 * `cancelMission` brake pedal (missions.functions.ts), guarded mission flip,
 * in-flight runs/steps flipped, held file claims released.
 *
 * Server-only: it writes through the caller's RLS-scoped client.
 */
import type {
  BuildDriver,
  BuildDriverContext,
  BuildResult,
  BuildSession,
  BuildSpec,
  BuildStatus,
} from "./driver";
import { createMission } from "@/lib/ai/handoff.server";

const MISSION_DONE = new Set(["completed", "done"]);
const MISSION_FAILED = new Set(["failed", "halted", "cancelled"]);
/** Same lists as cancelMission (missions.functions.ts), keep them in lockstep. */
const MISSION_TERMINAL = ["completed", "done", "failed", "halted", "cancelled"];
const RUN_IN_FLIGHT = ["queued", "running", "dispatched", "waiting_approval"];
const STEP_IN_FLIGHT = ["planned", "queued", "dispatched", "running", "waiting_approval"];

async function pollNative(ctx: BuildDriverContext, session: BuildSession): Promise<BuildStatus> {
  const { data: mission } = await ctx.supabase
    .from("missions")
    .select("id,status")
    .eq("id", session.missionId)
    .maybeSingle();
  if (!mission) return "unknown";
  const missionStatus = (mission as { status: string }).status;
  if (MISSION_DONE.has(missionStatus)) return "done";
  if (MISSION_FAILED.has(missionStatus)) return "failed";

  // Non-terminal mission: the latest run carries the live signal.
  const { data: runs } = await ctx.supabase
    .from("agent_runs")
    .select("status")
    .eq("mission_id", session.missionId)
    .order("created_at", { ascending: false })
    .limit(1);
  const runStatus = (runs?.[0] as { status?: string } | undefined)?.status ?? null;
  if (runStatus === "queued") return "queued";
  if (runStatus === "waiting_approval") return "waiting_approval";
  if (runStatus === "running" || runStatus === "dispatched") return "running";
  if (missionStatus === "proposed") return "queued";
  if (missionStatus === "running" || missionStatus === "in_progress") return "running";
  return "unknown";
}

export const nativeBuildDriver: BuildDriver = {
  id: "native",

  /** The in-house loop ships with the product, always wired. */
  available(): boolean {
    return true;
  },

  async dispatch(ctx: BuildDriverContext, spec: BuildSpec): Promise<BuildSession> {
    const agent = ctx.agent;
    if (!agent) {
      throw new Error(
        "native build driver: ctx.agent (the roster agent that runs the loop) is required",
      );
    }
    const title = (ctx.missionTitle ?? spec.goal.split(/\r?\n/)[0]).slice(0, 200);
    const mission = await createMission(ctx.supabase, ctx.userId, ctx.workspaceId, {
      title,
      goal: spec.goal,
      starting_agent_id: agent.id,
      build_driver: "native",
    });

    // Enqueue (don't block the dispatch on a long session), the resume-runs
    // sweeper promotes queued runs on its next tick. Model rides on the run
    // row so the queued start honors the switcher.
    const { data: run, error: runErr } = await ctx.supabase
      .from("agent_runs")
      .insert({
        user_id: ctx.userId,
        agent_id: agent.id,
        agent_slug: agent.slug,
        agent_name: agent.name,
        input: spec.goal,
        status: "queued",
        workspace_id: ctx.workspaceId,
        mission_id: mission.id,
        model: ctx.model ?? null,
      })
      .select("id")
      .maybeSingle();
    if (runErr) throw new Error(`Session enqueue failed: ${runErr.message}`);

    const runId = (run as { id?: string } | null)?.id;
    return { driver: "native", missionId: mission.id, ...(runId ? { runId } : {}) };
  },

  poll: pollNative,

  async result(ctx: BuildDriverContext, session: BuildSession): Promise<BuildResult> {
    const status = await pollNative(ctx, session);
    const { data: runs } = await ctx.supabase
      .from("agent_runs")
      .select("id,output")
      .eq("mission_id", session.missionId)
      .order("created_at", { ascending: false })
      .limit(1);
    const latest = (runs?.[0] as { id?: string; output?: string | null } | undefined) ?? undefined;
    const summary =
      typeof latest?.output === "string" && latest.output ? latest.output.slice(0, 4000) : null;
    return {
      status,
      summary,
      refs: {
        missionId: session.missionId,
        ...(latest?.id ? { runId: latest.id } : {}),
      },
    };
  },

  async cancel(
    ctx: BuildDriverContext,
    session: BuildSession,
  ): Promise<{ ok: boolean; reason?: string }> {
    const now = new Date().toISOString();
    const { data: mission, error: mErr } = await ctx.supabase
      .from("missions")
      .select("id,status")
      .eq("id", session.missionId)
      .maybeSingle();
    if (mErr) return { ok: false, reason: mErr.message };
    if (!mission) return { ok: false, reason: "mission not found" };
    const priorStatus = (mission as { status: string }).status;
    if (MISSION_TERMINAL.includes(priorStatus)) {
      return { ok: false, reason: `mission is already ${priorStatus}` };
    }

    // Guarded flip (same race protection as cancelMission): never overwrite a
    // mission that reached a terminal status in the read→write window.
    const { data: updated, error: uErr } = await ctx.supabase
      .from("missions")
      .update({ status: "cancelled", completed_at: now })
      .eq("id", session.missionId)
      .not("status", "in", `(${MISSION_TERMINAL.join(",")})`)
      .select("id")
      .maybeSingle();
    if (uErr) return { ok: false, reason: uErr.message };
    if (!updated) return { ok: false, reason: "mission reached a terminal status before cancel" };

    // Stop the resume cron picking up this mission's in-flight child runs.
    await ctx.supabase
      .from("agent_runs")
      .update({ status: "cancelled" })
      .eq("mission_id", session.missionId)
      .in("status", RUN_IN_FLIGHT);

    // Reflect onto the plan so the cockpit shows the steps stopped, not stuck.
    await ctx.supabase
      .from("mission_steps")
      .update({ status: "cancelled" })
      .eq("mission_id", session.missionId)
      .in("status", STEP_IN_FLIGHT);

    // Release held Build file claims (the terminal-run trigger skips
    // 'cancelled', so without this the per-(repo,path) locks orphan).
    await ctx.supabase
      .from("builder_file_claims")
      .update({ status: "released", released_at: now, released_reason: "mission_cancelled" })
      .eq("mission_id", session.missionId)
      .eq("status", "held");

    return { ok: true };
  },
};
