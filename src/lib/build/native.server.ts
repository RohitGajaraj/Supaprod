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
/**
 * THE CEILING TRAVELS WITH THE RUN ROW OR IT DOES NOT EXIST.
 *
 * `checkMissionCaps` (runtime.server.ts) is fail-closed before every model
 * call, and what it reads is `agent_runs.mission_spend_cap_usd` through the
 * `mission_cap_state` RPC. `runAgentLoop` resolves that value on both of its
 * inserts. This adapter did not, so every mission dispatched through the seam
 * queued a run with a NULL ceiling and ran unbounded, while /build's own
 * "boundary" line told the owner their runs halt at a number. That is the worst
 * shape a spend control can take: visible, moved, and enforcing nothing.
 */
import { resolveMissionSpendCap } from "@/lib/ai/mission-caps.server";

/**
 * PURE. Fold the structured `BuildSpec` into the single work-order text the
 * native loop actually reads.
 *
 * THE DEFECT THIS PREVENTS, found 2026-08-06. `dispatch` took `spec.goal` and
 * nothing else. Every other field of the brief — the acceptance criteria above
 * all — was accepted by the signature, type-checked, and then dropped on the
 * floor. `dispatchStudioSession` computes the standing success-metric clauses
 * of the spec's Outcome Contract and passes them as `acceptanceCriteria`
 * precisely so the engine is told the bar it will be judged against; the native
 * adapter is the driver 100% of in-platform builds run on, and it was the one
 * that threw them away.
 *
 * WHAT THAT COST. The mission's `goal` column IS the agent's brief: it becomes
 * the mission goal, the mission title's first line, and the `agent_runs.input`
 * the loop replays. So the builder planned, staged, and opened a PR having
 * never been shown the criteria the Critic and the settle sweep later grade
 * that same PR against. The bar existed in the database and in the reviewer's
 * prompt but never in the builder's, which is the most expensive possible place
 * for a brief to go missing: the work is done, paid for, and reviewed before
 * anyone learns the target was never stated.
 *
 * WHY NOTHING CAUGHT IT. `BuildSpec` marks every field past `goal` optional, so
 * ignoring one is not a type error; the openhands adapter folded them correctly
 * in `buildDelegateTask`, so the seam looked covered; and no test asserted on
 * what the native adapter persists, only on which driver the resolver returns.
 *
 * The shape deliberately matches `buildDelegateTask` (openhands.server.ts)
 * heading for heading, so a criterion reads the same to every engine and a
 * reader comparing two drivers' work orders is comparing like with like. It is
 * NOT imported from there: that module pulls in the delegate provider seam and
 * its env reads, and the native driver must stay dispatchable with delegation
 * switched off.
 */
export function buildNativeGoal(spec: BuildSpec): string {
  const parts = [spec.goal];
  if (spec.acceptanceCriteria?.length) {
    parts.push(
      `Acceptance criteria (every one must hold):\n${spec.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}`,
    );
  }
  if (spec.guardrails?.length) {
    parts.push(
      `Guardrails (hard constraints):\n${spec.guardrails.map((g) => `- ${g}`).join("\n")}`,
    );
  }
  if (spec.designPointers?.length) {
    parts.push(`Design references:\n${spec.designPointers.map((p) => `- ${p}`).join("\n")}`);
  }
  if (spec.targetFiles?.length) {
    parts.push(`Files in scope:\n${spec.targetFiles.map((f) => `- ${f}`).join("\n")}`);
  }
  return parts.join("\n\n");
}

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
    // The whole brief, not just its first field. `buildNativeGoal` prefixes
    // `spec.goal` unchanged, so the derived title is byte-for-byte what it was
    // before the criteria were folded in.
    const goal = buildNativeGoal(spec);
    const title = (ctx.missionTitle ?? goal.split(/\r?\n/)[0]).slice(0, 200);
    const mission = await createMission(ctx.supabase, ctx.userId, ctx.workspaceId, {
      title,
      goal,
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
        // The run's input is what the loop replays on resume; if the criteria
        // rode only on the mission the resumed run would be briefed with less
        // than the first attempt.
        input: goal,
        status: "queued",
        // Enqueued now, promoted by resume-runs later. The trace is minted at
        // insert so the promoted run's tool calls join back to this row.
        trace_id: crypto.randomUUID(),
        workspace_id: ctx.workspaceId,
        mission_id: mission.id,
        // The workspace's ceiling, resolved the way every other writer resolves
        // it. `undefined` from the caller means "nobody said" and picks up the
        // workspace default; an explicit null means a human cleared the ceiling
        // and is obeyed. See the import note above for what a NULL here costs.
        mission_spend_cap_usd: await resolveMissionSpendCap(
          ctx.supabase,
          ctx.workspaceId,
          ctx.missionSpendCapUsd,
        ),
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
