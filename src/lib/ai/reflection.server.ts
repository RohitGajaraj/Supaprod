/**
 * F-AGENT-2 — agent self-reflection.
 *
 * After a run terminates cleanly (status='completed', not halted by
 * governance), distil a one-paragraph reflection from the trace and persist
 * it to `agent_memory` with `kind='reflection'`. Reflections are later
 * pulled in by `recallMemory()` so the same agent benefits from its own
 * lessons on the next mission.
 *
 * The auto path is invoked from `loop.server.ts` (no LLM tool call
 * required). The `memory.reflect` tool is a thin wrapper around the same
 * helper so an agent can also reflect explicitly mid-run if it wants to.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "./runtime.server";
import { embedOne } from "@/lib/rag/embed.server";

export type ReflectionInput = {
  userId: string;
  agentId: string | null;
  agentSlug: string;
  workspaceId: string | null;
  runId: string | null;
  traceId: string | null;
  goal: string;
  finalMsg: string;
  /** Optional pre-rendered step summary (cheaper than re-querying). */
  stepSummary?: string;
};

export type ReflectionRow = {
  id: string;
  content: string;
  importance: number;
};

function safeJson<T = unknown>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    /* fall through */
  }
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

/**
 * Render a compact summary of tool calls + final answer for the sub-model.
 * We pull tool_calls by trace_id (the only join available on that table) and
 * cap the payload so this stays cheap.
 */
async function renderTrace(
  supabase: SupabaseClient,
  userId: string,
  traceId: string | null,
  goal: string,
  finalMsg: string,
  preRendered?: string,
): Promise<string> {
  if (preRendered && preRendered.length > 0) {
    return `Goal: ${goal}\n\nTrace:\n${preRendered}\n\nFinal: ${finalMsg.slice(0, 1200)}`;
  }
  let toolBlock = "";
  if (traceId) {
    try {
      const { data } = await supabase
        .from("tool_calls")
        .select("tool_name,ok,error,latency_ms")
        .eq("user_id", userId)
        .eq("trace_id", traceId)
        .order("created_at", { ascending: true })
        .limit(20);
      if (data?.length) {
        toolBlock = data
          .map((t) => {
            const tag = t.ok ? "ok" : `err: ${(t.error ?? "").slice(0, 120)}`;
            return `- ${t.tool_name} (${t.latency_ms ?? 0}ms · ${tag})`;
          })
          .join("\n");
      }
    } catch {
      /* non-fatal */
    }
  }
  return [
    `Goal: ${goal}`,
    toolBlock ? `Tool calls:\n${toolBlock}` : "Tool calls: (none recorded)",
    `Final: ${finalMsg.slice(0, 1200)}`,
  ].join("\n\n");
}

/**
 * Persist one reflection. Returns the inserted row, or null if the sub-model
 * returned nothing usable. Never throws — reflection failures must not break
 * the underlying agent run.
 */
export async function autoReflect(
  supabase: SupabaseClient,
  input: ReflectionInput,
): Promise<ReflectionRow | null> {
  try {
    const trace = await renderTrace(
      supabase,
      input.userId,
      input.traceId,
      input.goal,
      input.finalMsg,
      input.stepSummary,
    );

    // Respect the user's active model preference; fall back to Gemini if not set.
    const { data: prof } = await supabase
      .from("profiles")
      .select("default_model")
      .eq("id", input.userId)
      .maybeSingle();
    const agenticModel =
      (prof as { default_model?: string | null } | null)?.default_model?.trim() ||
      "google/gemini-2.5-flash";

    const res = await callModel(supabase, input.userId, {
      surface: "agent",
      surface_ref: `reflect:${input.agentSlug}`,
      model: agenticModel,
      responseFormat: "json_object",
      runId: input.runId,
      workspaceId: input.workspaceId,
      messages: [
        {
          role: "system",
          content:
            "You distil a one-paragraph LESSON the agent should remember for next time. " +
            'Return strict JSON: {"lesson":string, "what_worked":string, "what_to_change":string, "importance":1|2|3|4|5}. ' +
            'lesson <= 240 chars, written in second person ("You"). importance: 1 = trivial, 5 = pivotal. ' +
            "Skip vague platitudes — if there is nothing specific, set importance=1.",
        },
        { role: "user", content: trace },
      ],
    });

    const parsed = safeJson<{
      lesson?: string;
      what_worked?: string;
      what_to_change?: string;
      importance?: number;
    }>(res.output);
    const lesson = parsed?.lesson?.trim();
    if (!lesson) return null;

    const importance = Math.max(1, Math.min(5, Math.round(parsed?.importance ?? 3)));

    let emb: number[] | null = null;
    try {
      // EMBED-CHOKEPOINT: thread context so this reflection embedding logs + BYO-routes.
      emb = await embedOne(lesson, { supabase, userId: input.userId, surfaceRef: "reflection" });
    } catch {
      /* embedding is optional */
    }

    const { data, error } = await supabase
      .from("agent_memory")
      .insert({
        user_id: input.userId,
        agent_id: input.agentId,
        agent_slug: input.agentSlug,
        scope: "agent",
        kind: "reflection",
        content: lesson,
        importance,
        embedding: emb as unknown as string | null,
        metadata: {
          run_id: input.runId,
          trace_id: input.traceId,
          what_worked: parsed?.what_worked ?? null,
          what_to_change: parsed?.what_to_change ?? null,
          goal: input.goal.slice(0, 400),
        },
      })
      .select("id,content,importance")
      .single();

    if (error) {
      console.error("autoReflect insert failed:", error);
      return null;
    }
    // WM-F1: tag the reflection with its workspace so recall scopes to the active
    // workspace (reflections are the highest-volume recalled memory kind). Done as
    // a separate, error-tolerant update so it stays pre-migration safe: before the
    // column exists the update no-ops, and an untagged row recalls as global.
    if (input.workspaceId && (data as { id?: string } | null)?.id) {
      try {
        await supabase
          .from("agent_memory")
          .update({ workspace_id: input.workspaceId })
          .eq("id", (data as { id: string }).id);
      } catch {
        /* column not present yet (pre-migration) — non-fatal */
      }
    }
    return data as ReflectionRow;
  } catch (e) {
    console.error("autoReflect failed:", e);
    return null;
  }
}

/**
 * Trigger the autonomy auto-advance RPC. Wrapped here so call sites don't
 * have to know the RPC name + error shape. Idempotent and safe to call on
 * every completion.
 *
 * SW-4 (mission 3.10): when the agent slug is provided, the same post-run
 * moment also runs the trust-ramp proposal check, the per-(agent, tool)
 * graduation that, unlike this arc RPC, NEVER flips anything silently.
 */
export async function maybeAutoAdvanceArc(
  supabase: SupabaseClient,
  userId: string,
  agentId: string | null,
  agentSlug?: string | null,
): Promise<void> {
  if (!agentId) return;
  try {
    await supabase.rpc("auto_advance_agent_arc", {
      p_user_id: userId,
      p_agent_id: agentId,
    });
  } catch (e) {
    console.error("auto_advance_agent_arc failed:", e);
  }
  if (agentSlug) {
    try {
      await maybeProposeTrustGraduations(supabase, userId, agentSlug);
    } catch (e) {
      console.error("trust-ramp proposal check failed:", e);
    }
  }
}

/**
 * SW-4 / mission 3.10 TRUST RAMP generator. For each tool this agent has a
 * clean-approval streak of TRUST_RAMP_CLEAN_N on, write ONE pending
 * trust_graduation_proposals row (review -> confirm -> auto, honoring the
 * high-risk ceilings). Guards, fail-closed:
 *   - RF-06: any 'missed' outcome attributed to this agent inside the
 *     window blocks every proposal.
 *   - An existing pending proposal for the (agent, tool) pair blocks a
 *     duplicate (also DB-enforced by the partial unique index).
 * Tolerates the pre-migration window (missing tables = no-op).
 */
export async function maybeProposeTrustGraduations(
  supabase: SupabaseClient,
  userId: string,
  agentSlug: string,
): Promise<void> {
  const {
    TRUST_RAMP_CLEAN_N,
    TRUST_RAMP_OUTCOME_WINDOW_MS,
    computeCleanStreaks,
    shouldProposeGraduation,
  } = await import("./trust-ramp");

  // 1. Decided approvals for this (user, agent), newest first, bounded.
  const { data: approvals, error: apprErr } = await supabase
    .from("agent_approvals")
    .select("tool_name, status, decided_at")
    .eq("user_id", userId)
    .eq("agent_slug", agentSlug)
    .not("decided_at", "is", null)
    .order("decided_at", { ascending: false })
    .limit(300);
  if (apprErr || !approvals || approvals.length === 0) return;

  const streaks = computeCleanStreaks(approvals as never);
  const candidates = Array.from(streaks.entries()).filter(([, n]) => n >= TRUST_RAMP_CLEAN_N);
  if (candidates.length === 0) return;

  // 2. RF-06 guard: a recent 'missed' outcome for this agent blocks the ramp.
  const windowStart = new Date(Date.now() - TRUST_RAMP_OUTCOME_WINDOW_MS).toISOString();
  const { data: agentDecisions } = await supabase
    .from("decisions")
    .select("prd_id")
    .eq("user_id", userId)
    .eq("decided_by_agent_slug", agentSlug)
    .not("prd_id", "is", null)
    .limit(200);
  const prdIds = Array.from(
    new Set(
      ((agentDecisions ?? []) as Array<{ prd_id: string | null }>)
        .map((d) => d.prd_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  if (prdIds.length > 0) {
    const { count: missedCount } = await supabase
      .from("learnings")
      .select("id", { count: "exact", head: true })
      .eq("verdict", "missed")
      .in("prd_id", prdIds)
      .gte("created_at", windowStart);
    if ((missedCount ?? 0) > 0) return;
  }

  // 3. Current stored modes: the seeded (user, tool) mode + any prior
  //    graduation override for this (agent, tool).
  const toolNames = candidates.map(([t]) => t);
  const [{ data: seeded }, overridesRes, pendingRes] = await Promise.all([
    supabase
      .from("agent_tools")
      .select("tool_name, mode")
      .eq("user_id", userId)
      .in("tool_name", toolNames),
    supabase
      .from("agent_tool_modes" as never)
      .select("tool_name, mode")
      .eq("user_id", userId)
      .eq("agent_slug", agentSlug)
      .in("tool_name", toolNames),
    supabase
      .from("trust_graduation_proposals" as never)
      .select("tool_name")
      .eq("user_id", userId)
      .eq("agent_slug", agentSlug)
      .eq("status", "pending"),
  ]);
  // Pre-migration: the ramp tables are absent, stand down quietly.
  if (overridesRes.error || pendingRes.error) return;

  const seededMode = new Map(
    ((seeded ?? []) as Array<{ tool_name: string; mode: string }>).map((t) => [t.tool_name, t.mode]),
  );
  const overrideMode = new Map(
    ((overridesRes.data ?? []) as unknown as Array<{ tool_name: string; mode: string }>).map((t) => [
      t.tool_name,
      t.mode,
    ]),
  );
  const pendingTools = new Set(
    ((pendingRes.data ?? []) as unknown as Array<{ tool_name: string }>).map((t) => t.tool_name),
  );

  for (const [toolName, streak] of candidates) {
    const current = overrideMode.get(toolName) ?? seededMode.get(toolName);
    if (current !== "auto" && current !== "confirm" && current !== "review") continue;
    const proposal = shouldProposeGraduation({
      toolName,
      streak,
      currentMode: current,
      hasPendingProposal: pendingTools.has(toolName),
      outcomeBlocked: false, // checked above for the whole agent, fail-closed
    });
    if (!proposal) continue;
    const { error: insErr } = await supabase.from("trust_graduation_proposals" as never).insert({
      user_id: userId,
      agent_slug: agentSlug,
      tool_name: toolName,
      from_mode: proposal.from,
      to_mode: proposal.to,
      clean_streak: streak,
      rationale: `${streak} clean approvals in a row for ${toolName}, no rejected calls since, no missed outcomes in the last 30 days.`,
    } as never);
    // Unique-violation on the pending index = a concurrent run already
    // proposed it; anything else is worth a log line.
    if (insErr && insErr.code !== "23505") {
      console.error(`trust-ramp proposal insert failed (${agentSlug}/${toolName}): ${insErr.message}`);
    }
  }
}
