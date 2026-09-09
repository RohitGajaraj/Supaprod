import { createServerFn } from "@tanstack/react-start";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";
import { humanizeText } from "@/lib/ai/humanize";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callModel } from "@/lib/ai/runtime.server";
import { stepLabel } from "@/lib/agent-vocabulary";
import { countNeedsYouCalls } from "@/lib/today.functions";
import { classifyFailureCode } from "@/lib/observability/gates";

const DEFAULT_MODEL = "google/gemini-2.5-flash";

export const listAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { agents: data ?? [] };
  });

export const listAgentRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("agent_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return { runs: data ?? [] };
  });

/**
 * Live-state counts for the sidebar status line (DESIGN.md "Status
 * placement" contract). A dedicated tiny select rather than counting from
 * listAgentRuns — its 20-row window can drop a long-running run, and the
 * sidebar must never under-report live work. RLS scopes to the caller.
 */
export const getLiveRunCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("agent_runs")
      .select("status")
      .in("status", ["running", "queued"]);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const running = rows.filter((r) => r.status === "running").length;
    // The cooking banner names what's running (DESIGN.md banner contract) —
    // ride the newest running mission's title along with the counts. Null
    // falls back to count-only copy; never an invented name.
    let runningMissionTitle: string | null = null;
    if (running > 0) {
      const { data: m } = await context.supabase
        .from("missions")
        .select("title")
        .eq("status", "running")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      runningMissionTitle = m?.title ?? null;
    }
    return {
      running,
      queued: rows.filter((r) => r.status === "queued").length,
      runningMissionTitle,
    };
  });

/** The live-activity read: what the machine is doing / whether it needs you. */
export type LiveActivity = {
  /** working = a run is active; waiting = it needs you; idle = nothing. */
  state: "working" | "waiting" | "idle";
  /** The primary run's mission, for click-through (working only). */
  missionId: string | null;
  /** The SHORT action verb, e.g. "Drafting changes", or "Waiting on you".
   *  Never the mission title (founder ruling 2026-07-08). Empty when idle. */
  action: string;
};

/**
 * AI-PULSE (founder ruling 2026-07-08, v3.2): THE platform-wide "what is going
 * on right now" read, in ONE place (the top bar). Priority:
 *   1. a run is actively RUNNING -> ember shimmer + the ACTION verb;
 *   2. else a GENUINE pending action waits on you -> "Waiting on you" (glacier,
 *      still) - gated on the SAME live-calls truth the Today badge uses, which
 *      already excludes expired/stale gates, so a resolved queue goes idle
 *      (founder ruling: show waiting only when something really needs you);
 *   3. else idle (renders nothing).
 * Never the mission title. Cheap: one runs query (+ the running run's latest
 * checkpoint); the needs-you count only runs when nothing is actively running.
 */
/*
 * ── AND IT ANSWERS FOR ONE WORKSPACE (P-75) ──────────────────────────────
 *
 * A1 walked the EMPTY probe workspace and read "One just came in. Refresh to
 * see it." Nothing had. Every run and every pending call this read could see
 * belonged to Helio Labs, and the sentence is the one a person reads when their
 * queue is otherwise empty -- so it fires exactly when it is most likely to be
 * another desk's, and says the most alarming thing it can.
 *
 * Unresolved stays unfiltered, the rule the earlier instances settled on.
 */
export const getLiveActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ workspaceId: z.string().uuid().nullable().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data: input }): Promise<LiveActivity> => {
    let wid = input?.workspaceId ?? null;
    if (!wid) {
      const { data: ws } = await context.supabase.rpc("current_user_default_workspace");
      wid = defaultWorkspaceId(ws);
    }
    let runsQ = context.supabase
      .from("agent_runs")
      .select("id,mission_id,status,created_at")
      .in("status", ["running", "queued"]);
    if (wid) runsQ = runsQ.eq("workspace_id", wid);
    const { data, error } = await runsQ.order("created_at", { ascending: false }).limit(8);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Array<{
      id: string;
      mission_id: string | null;
      status: string;
      created_at: string;
    }>;

    // 1. Actively running work -> the ember action verb.
    const running = rows.find((r) => r.status === "running");
    if (running) {
      let action = "Working";
      const { data: cp } = await context.supabase
        .from("agent_run_checkpoints")
        .select("steps:state->steps")
        .eq("run_id", running.id)
        .order("step_index", { ascending: false })
        .limit(1)
        .maybeSingle();
      const steps = (cp as { steps?: Array<{ kind: string; name?: string }> } | null)?.steps;
      if (Array.isArray(steps) && steps.length > 0) {
        const raw = stepLabel(steps[steps.length - 1]);
        action = raw.charAt(0).toUpperCase() + raw.slice(1);
      }
      return { state: "working", missionId: running.mission_id, action };
    }
    // A just-queued run is about to work.
    if (rows.length > 0) {
      return { state: "working", missionId: rows[0].mission_id, action: "Starting up" };
    }

    // 2. Nothing running: is a GENUINE action pending on the human? (Same live
    // count the Today badge shows; expired/stale gates are already excluded.)
    /* The same workspace the runs above were read for, or the two halves of
       this one sentence describe two different desks. */
    const counts = await countNeedsYouCalls(
      context.supabase as SupabaseClient,
      context.userId,
      wid,
    );
    if (counts.liveCalls > 0) {
      return { state: "waiting", missionId: null, action: "Waiting on you" };
    }

    // 3. Idle.
    return { state: "idle", missionId: null, action: "" };
  });

export const runAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        agentId: z.string().uuid(),
        input: z.string().min(1).max(4000),
        model: z.string().min(1).max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: agent, error: aerr } = await supabase
      .from("agents")
      .select("*")
      .eq("id", data.agentId)
      .single();
    if (aerr || !agent) throw new Error("Agent not found");
    // Operator-initiated "run now": refuse to run a disabled agent. Enable it
    // first if you want it to run.
    if (agent.enabled === false) {
      throw new Error("This agent is disabled. Enable it before running.");
    }

    // Lightweight grounding context
    const [{ data: tasks }, { data: projects }] = await Promise.all([
      supabase.from("tasks").select("title,status,priority,is_deep_work").limit(30),
      supabase.from("projects").select("name,north_star,status").limit(10),
    ]);
    const ctx = JSON.stringify({ projects, tasks }).slice(0, 4000);

    const t0 = Date.now();
    const { data: runRow } = await supabase
      .from("agent_runs")
      .insert({
        user_id: userId,
        agent_id: agent.id,
        agent_slug: agent.slug,
        agent_name: agent.name,
        input: data.input,
        status: "running",
        // A run names its own tool calls or it is unknowable forever: nothing
        // backfills this, and `getWorkspaceAnchors` excludes an untraced run
        // rather than reporting it as touching nothing. Minted at insert so
        // the run owns its trace from birth; `resumeAgentLoop` honours the
        // row's value rather than minting a second one.
        trace_id: crypto.randomUUID(),
      })
      .select()
      .single();

    try {
      const model = data.model ?? DEFAULT_MODEL;
      const r = await callModel(supabase as never, userId, {
        surface: "agent",
        surface_ref: agent.id,
        model,
        messages: [
          {
            role: "system",
            content: `${agent.system_prompt}\n\nUSER WORKSPACE CONTEXT (JSON):\n${ctx}`,
          },
          { role: "user", content: data.input },
        ],
      });
      const { output, via, provider } = r;
      const duration = Date.now() - t0;
      const tag = via === "byo" ? `\n\n_via your ${provider} key_` : "";
      const { data: updated } = await supabase
        .from("agent_runs")
        // "complete" here wrote the ONLY spelling of a finished run that no reader
        // understands. `run-status.ts` measured the damage: it falls through to
        // `queued` in both `run-state.ts` and `build-status.ts`, so a finished run
        // reads as one waiting to start. Two live rows carry it, both real rather
        // than demo, and this line is their only source.
        /*
         * SANITISED HERE TOO, and this writer is why the column was not closed.
         *
         * `loop.server.ts` routes its seven `output` writes through `runOutput`.
         * This is an eighth, in a different file, and it writes the MODEL'S OWN
         * TEXT. S1 measured the consequence the right way: not the column total,
         * which a backfill makes meaningless, but the count of rows created
         * SINCE the fix — 9 of them, newest 23:30:21 UTC.
         *
         * A column total answers a question about history. Only "rows written
         * after the fix" answers whether the path is open.
         */
        .update({
          output: humanizeText(output + tag),
          status: "completed",
          duration_ms: duration,
        })
        .eq("id", runRow!.id)
        .select()
        .single();
      return { run: updated };
    } catch (e) {
      await supabase
        .from("agent_runs")
        .update({
          status: "failed",
          output: humanizeText(e instanceof Error ? e.message : "Failed"),
          duration_ms: Date.now() - t0,
          // AFD-06: the third writer that marked a run failed and said nothing
          // about why. The observability failure breakdown reads this column
          // and was permanently empty because every path that could set it
          // did not.
          failure_kind: classifyFailureCode(e instanceof Error ? e.message : "Failed"),
        })
        .eq("id", runRow!.id);
      throw e;
    }
  });

// FND-0.5 — set a per-agent blast-radius cap (max_tool_risk). null clears the cap (unrestricted).
// The agent loop drops any enabled tool whose tier exceeds this when dispatching the agent.
const ToolCapSchema = z.object({
  agentId: z.string().uuid(),
  maxToolRisk: z.enum(["low", "medium", "high"]).nullable(),
});

export const setAgentToolCap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ToolCapSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("agents")
      .update({ max_tool_risk: data.maxToolRisk })
      .eq("id", data.agentId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * F-AGENT-2 — Recent reflections for an agent. Reads via the
 * `recent_agent_reflections` SECURITY DEFINER RPC so it can't leak across
 * users (the RPC scopes by `for_user`).
 */
export type ReflectionMetadata = {
  run_id?: string | null;
  trace_id?: string | null;
  what_worked?: string | null;
  what_to_change?: string | null;
  goal?: string | null;
};

export type AgentReflection = {
  id: string;
  content: string;
  importance: number;
  metadata: ReflectionMetadata | null;
  created_at: string;
};

export const listAgentReflections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        agentSlug: z.string().min(1).max(60),
        limit: z.number().int().min(1).max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase.rpc("recent_agent_reflections", {
      for_user: userId,
      for_agent_slug: data.agentSlug,
      match_count: data.limit ?? 5,
    });
    if (error) throw new Error(error.message);
    return { reflections: (rows ?? []) as AgentReflection[] };
  });
