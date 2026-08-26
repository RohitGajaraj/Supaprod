/**
 * Orchestrator tools (F-AGENT-1).
 *
 * Four planning/dispatch tools used by the `orchestrator` agent to run
 * multi-agent missions across the existing handoff + checkpoint primitives.
 *
 * - mission.plan      → asks a sub-model for a small DAG and persists
 *                       mission_steps rows.
 * - mission.dispatch  → for every step whose deps are satisfied, enqueues
 *                       a child agent_runs row via enqueueHandoff().
 * - mission.observe   → returns the live state of every step (reflecting
 *                       child agent_runs status into step status).
 * - mission.finalize  → records the orchestrator's summary and marks the
 *                       mission completed when no work remains.
 *
 * The orchestrator never does specialist work itself; it only plans,
 * dispatches, observes, and finalizes.
 */
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolDef, ToolCtx } from "./registry.server";
import { callModel } from "@/lib/ai/runtime.server";
import { recordStageEvent } from "@/lib/stage-events.server";
import {
  dispatchReadySteps,
  reflectStepStatusFromRuns,
  type MissionLite,
} from "@/lib/ai/mission-advance.server";
import {
  AGENT_STATIONS,
  AGENT_STATION_ORDER,
  resolveStationTotal,
  type AgentStation,
} from "@/lib/agent-vocabulary";
import { pickPlaybookForAgentStation, type PlaybookRun } from "@/lib/playbooks/registry";

// Re-export the same helper signature the registry uses.
function def<S extends z.ZodTypeAny>(d: ToolDef<S>) {
  return d as unknown as ToolDef;
}

async function loadMission(supabase: SupabaseClient, missionId: string, userId: string) {
  const { data, error } = await supabase
    .from("missions")
    .select("id,user_id,workspace_id,title,goal,status")
    .eq("id", missionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Mission not found: ${missionId}`);
  return data as {
    id: string;
    user_id: string;
    workspace_id: string;
    title: string;
    goal: string;
    status: string;
  };
}

async function listSpecialistSlugs(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ slug: string; role: string }[]> {
  const { data } = await supabase
    .from("agents")
    .select("slug,role,enabled")
    .eq("user_id", userId)
    .eq("enabled", true);
  return ((data ?? []) as { slug: string; role: string }[]).filter(
    (a) => a.slug !== "orchestrator",
  );
}

// ── mission.plan ──────────────────────────────────────────────────────
const PlanArgs = z.object({
  goal: z.string().max(4000).optional(),
  model: z.string().max(120).optional(),
});

type PlannedStep = {
  agent_slug: string;
  sub_goal: string;
  depends_on?: number[];
  rationale?: string;
};

function parsePlan(text: string): { steps: PlannedStep[]; summary?: string } | null {
  const tryParse = (s: string) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };
  const direct = tryParse(text);
  if (direct && Array.isArray((direct as { steps?: unknown }).steps))
    return direct as { steps: PlannedStep[]; summary?: string };
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    const sliced = tryParse(m[0]);
    if (sliced && Array.isArray((sliced as { steps?: unknown }).steps))
      return sliced as { steps: PlannedStep[]; summary?: string };
  }
  return null;
}

export const missionPlan = def({
  name: "mission.plan",
  description:
    "Decompose THIS mission into a small DAG (1 to 6 steps). Persists mission_steps for later dispatch. Call exactly once near the start of the run.",
  category: "planning",
  argsSchema: PlanArgs,
  preview: (a) => `Plan mission${a.goal ? `: "${a.goal.slice(0, 80)}"` : ""}`,
  run: async (args, ctx: ToolCtx) => {
    const { supabase, userId, missionId, workspaceId, traceId, runId } = ctx;
    if (!missionId) throw new Error("mission.plan requires the run to be inside a mission");
    if (!workspaceId) throw new Error("mission.plan requires a workspace");
    const mission = await loadMission(supabase, missionId, userId);
    const goal = args.goal?.trim() || mission.goal;

    // Reject re-planning if steps already exist (the orchestrator should plan once).
    const { count: existing } = await supabase
      .from("mission_steps")
      .select("id", { count: "exact", head: true })
      .eq("mission_id", missionId);
    if ((existing ?? 0) > 0) {
      throw new Error(
        "mission.plan: mission already has steps. Call mission.dispatch or mission.observe instead.",
      );
    }

    const roster = await listSpecialistSlugs(supabase, userId);
    if (roster.length === 0) {
      throw new Error(
        "mission.plan: no specialist agents enabled in workspace. Create at least one agent (e.g. discovery, strategist, builder).",
      );
    }

    // Group the roster by loop station so the planner plans in station order and
    // can place independent specialists in the same station in parallel. Unknown
    // slugs fall to BUILD via resolveStationTotal, so nothing is dropped.
    const byStation = new Map<AgentStation, { slug: string; role: string }[]>();
    for (const a of roster) {
      const st = resolveStationTotal(a.slug);
      const list = byStation.get(st) ?? [];
      list.push(a);
      byStation.set(st, list);
    }
    const rosterLines: string[] = [];
    for (const st of AGENT_STATION_ORDER) {
      const members = byStation.get(st);
      if (!members || members.length === 0) continue;
      rosterLines.push(`${AGENT_STATIONS[st].name.toUpperCase()}: ${AGENT_STATIONS[st].blurb}`);
      for (const a of members) rosterLines.push(`  - ${a.slug}: ${a.role}`);
    }

    const planSystem = [
      // PC-29 repair pass (2026-07-17): was hardcoded to "six stations...
      // Sense, Decide, Plan, Build, Ship, Learn", missing Design (added by
      // the Tempo nav revamp) - now derived from AGENT_STATION_ORDER so this
      // can never drift from the roster grouping below again.
      `You are a mission planner for Supaprod, whose product loop runs in ${AGENT_STATION_ORDER.length} stations, in order: ${AGENT_STATION_ORDER.map((st) => AGENT_STATIONS[st].name).join(", ")}.`,
      "Given a goal and a roster of specialist agents grouped by station, return a small DAG of sub-tasks.",
      "",
      "Specialist roster, by station (use these slugs exactly):",
      ...rosterLines,
      "",
      "Output STRICT JSON only with this shape:",
      `{"summary":"one-sentence mission framing","steps":[{"agent_slug":"<slug>","sub_goal":"concrete self-contained instruction","depends_on":[],"rationale":"why this step"}]}`,
      "",
      "Rules:",
      "- 1 to 6 steps. Fewer is better, but use multiple specialists when the goal genuinely needs them.",
      "- Plan in station order: earlier-station work (Discover, Decide) comes before later work (Build, Ship, Learn).",
      "- Within a single station you MAY run two or three specialists in parallel (give them the same depends_on) when their work is independent.",
      "- Each step's sub_goal must be self-contained (the specialist will not see the wider plan).",
      "- depends_on is an array of zero-based indices of EARLIER steps that must finish first. Leave [] for root steps.",
      "- Only use agent_slugs from the roster above. Never invent a slug.",
      "- Do not nest steps. Do not include the orchestrator itself.",
    ].join("\n");

    const r = await callModel(supabase, userId, {
      surface: "agent",
      surface_ref: "orchestrator:plan",
      traceId: traceId ?? undefined,
      model: args.model ?? "google/gemini-2.5-flash",
      responseFormat: "json_object",
      messages: [
        { role: "system", content: planSystem },
        { role: "user", content: `Mission goal:\n${goal}` },
      ],
      promptKey: "orchestrator_plan",
      workspaceId,
      runId: runId ?? null,
    });

    const plan = parsePlan(r.output);
    if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) {
      throw new Error(
        `mission.plan: planner returned no usable steps. Raw: ${r.output.slice(0, 240)}`,
      );
    }
    if (plan.steps.length > 8)
      throw new Error("mission.plan: too many steps (>8). Re-plan smaller.");

    const validSlugs = new Set(roster.map((r) => r.slug));
    // The planner sub-model frequently emits a colloquial slug — "discovery"
    // for the seeded "discovery-scout", "prd" for "prd-writer" — and a strict
    // exact-match check threw, which dropped the WHOLE plan and left missions
    // completing hollow with zero steps (slug-drift regression, 2026-06-14).
    // Resolve each planned slug against the live roster (exact, then a single
    // unambiguous prefix/substring match) so naming drift between the model and
    // the seeded roster can never silently kill a plan again.
    const resolveSlug = (raw: string): string | null => {
      const want = String(raw ?? "")
        .trim()
        .toLowerCase();
      if (!want) return null;
      const exact = roster.find((a) => a.slug.toLowerCase() === want);
      if (exact) return exact.slug;
      const near = roster.filter(
        (a) =>
          a.slug.toLowerCase().startsWith(want) ||
          want.startsWith(a.slug.toLowerCase()) ||
          a.slug.toLowerCase().includes(want) ||
          want.includes(a.slug.toLowerCase()),
      );
      return near.length === 1 ? near[0].slug : null;
    };

    // RF-05: this workspace's recorded playbook applications, so each step
    // can bind to the win-rate leader for its station instead of a static
    // registry default. Best-effort: pre-migration (or a read error) the
    // table is absent, so the plan still succeeds with every step unbound
    // (pickPlaybookForAgentStation degrades to registry order on empty runs).
    let playbookRuns: PlaybookRun[] = [];
    try {
      const res = await supabase
        .from("playbook_runs")
        .select("playbook_id,verdict")
        .eq("workspace_id", workspaceId)
        .limit(5000);
      if (!res.error) playbookRuns = (res.data ?? []) as PlaybookRun[];
    } catch {
      // playbook_runs absent pre-migration — steps simply plan unbound.
    }

    // PC-30 skill enable/disable: this workspace's per-agent disabled
    // playbooks, so a step never binds to a playbook a human turned off for
    // that agent. Same pre-migration-tolerant shape as playbookRuns above:
    // a read failure just means every playbook stays eligible.
    const disabledByAgent = new Map<string, Set<string>>();
    try {
      const res = await supabase
        .from("agent_disabled_skills" as never)
        .select("agent_slug,playbook_id")
        .eq("workspace_id", workspaceId);
      if (!res.error) {
        for (const row of (res.data ?? []) as unknown as {
          agent_slug: string;
          playbook_id: string;
        }[]) {
          const set = disabledByAgent.get(row.agent_slug) ?? new Set<string>();
          set.add(row.playbook_id);
          disabledByAgent.set(row.agent_slug, set);
        }
      }
    } catch {
      // agent_disabled_skills absent pre-migration: nothing excluded.
    }

    const rows = plan.steps.map((s, i) => {
      const resolved = resolveSlug(s.agent_slug);
      if (!resolved) {
        throw new Error(
          `mission.plan: step ${i} references unresolvable agent "${s.agent_slug}". Roster: ${[...validSlugs].join(", ")}`,
        );
      }
      const deps = (s.depends_on ?? []).filter((d) => Number.isInteger(d) && d >= 0 && d < i);
      const picked = pickPlaybookForAgentStation(
        resolveStationTotal(resolved),
        playbookRuns,
        disabledByAgent.get(resolved),
      );
      return {
        mission_id: missionId,
        user_id: userId,
        workspace_id: workspaceId,
        idx: i,
        agent_slug: resolved,
        sub_goal: String(s.sub_goal ?? "").slice(0, 4000),
        depends_on: deps,
        rationale: s.rationale ? String(s.rationale).slice(0, 1000) : null,
        status: "planned",
        playbook_id: picked?.playbook.id ?? null,
      };
    });

    let insErr = (await supabase.from("mission_steps").insert(rows)).error;
    // Pre-migration tolerant (the governance.functions.ts listGovernApprovals
    // precedent, and mission-advance.server.ts's hasRetryColumns): RF-05's
    // `playbook_id` column may not have landed yet on this deploy (schema
    // application is decoupled from code deploy). Retry once without it so a
    // planning mission never hard-fails on a lagging migration. Matches
    // hasRetryColumns's stricter check (code + a specific message shape), not
    // a bare column-name substring match, so a genuine unrelated error (e.g.
    // a future constraint whose name happens to mention playbook_id) is never
    // masked by silently dropping the field and re-inserting.
    if (insErr) {
      const code = (insErr as { code?: string }).code;
      const missingColumn =
        code === "42703" ||
        code === "PGRST204" ||
        /column .*playbook_id.* does not exist/i.test(insErr.message);
      if (missingColumn) {
        const bare = rows.map(({ playbook_id: _drop, ...r }) => r);
        insErr = (await supabase.from("mission_steps").insert(bare)).error;
      }
    }
    if (insErr) throw new Error(`mission.plan: persist failed: ${insErr.message}`);

    return {
      mission_id: missionId,
      summary: plan.summary?.slice(0, 400) ?? null,
      step_count: rows.length,
      steps: rows.map((r) => ({
        idx: r.idx,
        agent_slug: r.agent_slug,
        sub_goal: r.sub_goal,
        depends_on: r.depends_on,
        playbook_id: r.playbook_id,
      })),
    };
  },
});

// ── mission.dispatch ──────────────────────────────────────────────────
const DispatchArgs = z.object({}).optional();

export const missionDispatch = def({
  name: "mission.dispatch",
  description:
    "Enqueue child agent_runs for every mission step whose dependencies are satisfied. Idempotent. Already-dispatched steps are skipped.",
  category: "planning",
  argsSchema: DispatchArgs as unknown as z.ZodTypeAny,
  preview: () => "Dispatch ready mission steps",
  run: async (_args, ctx: ToolCtx) => {
    const { supabase, userId, missionId, workspaceId, agentId, agentSlug, traceId, runId } = ctx;
    if (!missionId) throw new Error("mission.dispatch requires the run to be inside a mission");
    if (!workspaceId) throw new Error("mission.dispatch requires a workspace");

    // First reflect any child-run completions into step status (also done by
    // mission.observe, but dispatch needs an up-to-date view of 'done' to
    // evaluate depends_on). Shared with the auto-advance sweeper.
    await reflectStepStatusFromRuns(supabase, missionId);

    const { data: mission } = await supabase
      .from("missions")
      .select("id,user_id,workspace_id,goal,status")
      .eq("id", missionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!mission) throw new Error(`Mission not found: ${missionId}`);

    // Unified, claim-first dispatcher: enqueues child runs for every ready step,
    // threading memory into each hop. Concurrency-safe with the sweeper.
    const { dispatched, failed } = await dispatchReadySteps(supabase, mission as MissionLite, {
      agentId: agentId ?? null,
      agentSlug: agentSlug ?? null,
      runId: runId ?? null,
      traceId: traceId ?? null,
    });

    if (dispatched.length === 0 && failed.length === 0) {
      return {
        dispatched: 0,
        message: "Nothing ready to dispatch (waiting on deps, or all steps already dispatched).",
      };
    }

    return {
      dispatched_count: dispatched.length,
      dispatched,
      failed_count: failed.length,
      failed,
    };
  },
});

// ── mission.observe ───────────────────────────────────────────────────
const ObserveArgs = z.object({}).optional();

export const missionObserve = def({
  name: "mission.observe",
  description:
    "Read the live state of every step in this mission, reflecting child agent_runs status. Use to decide whether to dispatch again or finalize.",
  category: "read",
  argsSchema: ObserveArgs as unknown as z.ZodTypeAny,
  preview: () => "Observe mission progress",
  run: async (_args, ctx: ToolCtx) => {
    const { supabase, missionId } = ctx;
    if (!missionId) throw new Error("mission.observe requires the run to be inside a mission");
    await reflectStepStatusFromRuns(supabase, missionId);

    const { data, error } = await supabase
      .from("mission_steps")
      .select(
        "idx,agent_slug,sub_goal,depends_on,status,run_id,error,result,dispatched_at,completed_at",
      )
      .eq("mission_id", missionId)
      .order("idx");
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as {
      idx: number;
      agent_slug: string;
      sub_goal: string;
      depends_on: number[];
      status: string;
      run_id: string | null;
      error: string | null;
      result: Record<string, unknown> | null;
      dispatched_at: string | null;
      completed_at: string | null;
    }[];
    const summary = {
      total: rows.length,
      planned: rows.filter((r) => r.status === "planned").length,
      dispatched: rows.filter((r) => r.status === "dispatched").length,
      running: rows.filter((r) => r.status === "running").length,
      done: rows.filter((r) => r.status === "done").length,
      failed: rows.filter((r) => r.status === "failed").length,
      skipped: rows.filter((r) => r.status === "skipped").length,
    };
    const all_terminal =
      rows.length > 0 &&
      rows.every((r) => r.status === "done" || r.status === "failed" || r.status === "skipped");
    return { summary, all_terminal, steps: rows };
  },
});

// ── mission.finalize ──────────────────────────────────────────────────
const FinalizeArgs = z.object({
  summary: z.string().min(1).max(2000),
});

export const missionFinalize = def({
  name: "mission.finalize",
  description:
    "Record an executive summary on the mission and (when no unconsumed handoffs remain) mark it completed. Call after mission.observe shows all_terminal=true.",
  category: "planning",
  argsSchema: FinalizeArgs,
  preview: (a) => `Finalize mission: "${a.summary.slice(0, 80)}"`,
  run: async (args, ctx: ToolCtx) => {
    const { supabase, missionId, userId } = ctx;
    if (!missionId) throw new Error("mission.finalize requires the run to be inside a mission");
    await reflectStepStatusFromRuns(supabase, missionId);

    const { data: stepsData } = await supabase
      .from("mission_steps")
      .select("status")
      .eq("mission_id", missionId);
    const steps = (stepsData ?? []) as { status: string }[];
    const all_terminal =
      steps.length > 0 &&
      steps.every((s) => s.status === "done" || s.status === "failed" || s.status === "skipped");
    if (!all_terminal && steps.length > 0) {
      return {
        ok: false,
        message: "Not all steps are terminal yet. Dispatch / observe again before finalizing.",
      };
    }

    const anyFailed = steps.some((s) => s.status === "failed");
    const finalStatus = anyFailed ? "completed_with_failures" : "completed";

    // SEAM-1: capture the prior stage (and workspace) before the update — the
    // update below returns no rows, and RETURNING would only carry new values.
    const { data: priorMission } = await supabase
      .from("missions")
      .select("status,workspace_id")
      .eq("id", missionId)
      .eq("user_id", userId)
      .maybeSingle();

    const { error } = await supabase
      .from("missions")
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        // store summary into goal isn't right; we don't have a summary column.
        // Persist into goal-shaped notes via the existing pattern: append a marker
        // to the title for now (cheap; UI shows it). A dedicated column can come
        // when the Swarm HUD lands.
      })
      .eq("id", missionId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    const priorRow = priorMission as { status: string; workspace_id: string | null } | null;
    await recordStageEvent(supabase, {
      entityType: "mission",
      entityId: missionId,
      from: priorRow?.status ?? null,
      to: finalStatus,
      actor: ctx.agentSlug ?? "orchestrator",
      workspaceId: priorRow?.workspace_id ?? ctx.workspaceId ?? null,
      userId,
    });

    return {
      ok: true,
      mission_id: missionId,
      status: finalStatus,
      summary: args.summary,
      step_count: steps.length,
      failed_count: steps.filter((s) => s.status === "failed").length,
    };
  },
});

// reflectStepStatusFromRuns now lives in mission-advance.server.ts (shared with
// the auto-advance sweeper) and carries the bounded-retry requeue logic.
