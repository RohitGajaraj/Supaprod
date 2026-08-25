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
 *
 * ---
 *
 * F-31, 2026-08-25 — WHY A LESSON HAS A SHELF LIFE NOW.
 *
 * This mechanism spent three weeks teaching one workspace to refuse work.
 *
 * The chain is short and every link is doing its job. Workspace `0b792d52`
 * has **no ingestion source and never has** — `scout_targets` is 0 rows — so
 * an agent asked to justify a piece of work correctly reports that no
 * primary evidence exists. It declines. The run **completes**, because
 * declining is a clean outcome and not a halt, so this function fires and
 * distils the decline into a lesson written in the second person. What comes
 * back is not "the workspace had no sources today". It is:
 *
 *   "You must decline workstreams when primary evidence is absent and
 *    telemetry infrastructure is broken."
 *
 * That sentence is then recalled on the next run, and the next.
 *
 *   SELECT count(*), count(*) FILTER (WHERE content ILIKE 'you must not%'
 *                                        OR content ILIKE 'you must decline%')
 *     FROM agent_memory WHERE workspace_id = '0b792d52-...';
 *   -- 308 | 53
 *
 * **53 standing prohibitions, and the loop was reading them back.** At
 * 03:10:01 the `strategist` recalled four memories before it ran, three of
 * which ordered it to decline; it declined, and wrote a fifth. The `critic`
 * did the same 26 seconds later. `memory_recall_log` joined to `agent_memory`
 * has both. The prohibitions had also **crossed subjects** — a track about
 * notification settings was declined using lessons written about dark mode
 * and EU timezones, because recall is semantic and "no evidence" matches
 * everything.
 *
 * So the product's central claim — that it learns and then guides the next
 * call — was working exactly as designed, and what it had learned from a
 * workspace where nothing ever finished was to refuse.
 *
 * TWO THINGS WERE WRONG AND ONLY ONE OF THEM IS HERE:
 *
 *  1. `agent_memory.expires_at` already existed, and `match_agent_memory`
 *     already honoured it. `recent_agent_reflections` — the path that selects
 *     `kind='reflection'`, i.e. exactly these rows — did not. **The memories
 *     with the shortest shelf life were the only ones exempt from shelf
 *     life.** Fixed in migration `20260825033000`.
 *  2. Nothing ever set the column. That is the code below.
 *
 * The 37 of 53 prohibitions that cite the transient state were retired by
 * setting `expires_at = now()`, which is reversible — the rows survive and
 * carry `metadata.retired_reason`.
 *
 * THE RULE THIS LEAVES BEHIND: a condition an agent met once is a fact about
 * that day. It becomes a rule only by continuing to be true, which a
 * seven-day shelf life tests and a permanent memory never does.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "./runtime.server";
import { embedOne } from "@/lib/rag/embed.server";
import { resolveToolAccess } from "@/lib/ai/tools/defaults";
import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";

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
  /** MA-2: model used for this run's reflection. When provided, uses this model. */
  model?: string;
};

export type ReflectionRow = {
  id: string;
  content: string;
  importance: number;
};

/**
 * Does this lesson name a condition that is true TODAY rather than always?
 *
 * ── WHY THE MODEL'S OWN ANSWER IS NOT ENOUGH ────────────────────────────
 *
 * The `depends_on_current_state` flag was added the same day and measured the
 * same hour. In the first FIVE reflections written after it shipped, the model
 * answered `false` — durable — **every single time**, including twice for
 * lessons that exist only because GitHub was returning 401 that afternoon:
 *
 *   "You must halt immediately and report GitHub authentication failure..."
 *   "You must verify authentication and repository access before..."
 *
 * Those readings are defensible as method, which is exactly the problem: asked
 * "is this about how you work?", a model will nearly always say yes, because
 * almost any lesson can be phrased that way. **A self-report that is never
 * negative is not a classifier.**
 *
 * So the flag is kept and no longer trusted alone. If the TEXT names a specific
 * system, integration or outage, the lesson gets a shelf life whatever the flag
 * said. This preserves the one-sided failure the file already commits to: a
 * lesson wrongly expired is re-learned on the next run, and a transient one
 * wrongly kept is what F-31 was.
 *
 * Deliberately about NAMED THINGS, not about sentiment. "verify your inputs" is
 * durable and stays; "verify GitHub access" names a system and expires.
 */
const CURRENT_CONDITION = new RegExp(
  [
    // Named integrations and the surfaces that break.
    "github",
    "firecrawl",
    "supabase",
    "stripe",
    "lovable",
    "canny",
    "slack",
    // Words that only appear when something is down right now.
    "telemetry",
    "ingestion",
    "scout",
    "\\b401\\b",
    "\\b403\\b",
    "unauthori[sz]ed",
    // Bare rather than "authentication failed": the live miss was "verify
    // authentication AND REPOSITORY ACCESS before...", which names the same
    // outage in a sentence that reads like method. Expiring an occasional
    // genuine auth-design lesson is the cheap side of this trade.
    "authentication",
    "repository access",
    "credential",
    "not configured",
    "is not set",
    "unavailable",
    "is broken",
    "is down",
    "outage",
  ].join("|"),
  "i",
);

export function namesACurrentCondition(lesson: string): boolean {
  return CURRENT_CONDITION.test(lesson);
}

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

    // MA-2: use the model passed from the run (already resolved + persisted),
    // or read agentic_model from profiles, or fall back to default_model, or Gemini.
    let agenticModel = input.model?.trim();
    if (!agenticModel) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("agentic_model, default_model")
        .eq("id", input.userId)
        .maybeSingle();
      agenticModel =
        (
          prof as { agentic_model?: string | null; default_model?: string | null } | null
        )?.agentic_model?.trim() ||
        (
          prof as { agentic_model?: string | null; default_model?: string | null } | null
        )?.default_model?.trim() ||
        "google/gemini-2.5-flash";
    }

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
            'Return strict JSON: {"lesson":string, "what_worked":string, "what_to_change":string, ' +
            '"importance":1|2|3|4|5, "depends_on_current_state":boolean}. ' +
            'lesson <= 240 chars, written in second person ("You"). importance: 1 = trivial, 5 = pivotal. ' +
            "Skip vague platitudes — if there is nothing specific, set importance=1. " +
            // A lesson is about HOW YOU WORK. The run that prompted it happened
            // in a workspace with a particular thing broken or missing that
            // day, and that condition will be repaired while the lesson keeps
            // being recalled. See the file header for what this cost.
            "A lesson is about HOW YOU WORK, not about what this workspace currently contains. " +
            "If it only holds while some present condition holds — an integration that is down, a " +
            "table that is empty, a source nobody has configured yet — set depends_on_current_state " +
            "true and it will be given a shelf life. " +
            "Never write a standing prohibition on work you may not do: a condition you met today " +
            "is a fact about today, and stating it as a rule makes it outlive the thing it described.",
        },
        { role: "user", content: trace },
      ],
    });

    const parsed = safeJson<{
      lesson?: string;
      what_worked?: string;
      what_to_change?: string;
      importance?: number;
      depends_on_current_state?: boolean;
    }>(res.output);
    const lesson = parsed?.lesson?.trim();
    if (!lesson) return null;

    const importance = Math.max(1, Math.min(5, Math.round(parsed?.importance ?? 3)));

    /**
     * A lesson that only holds while the workspace is in its present condition
     * gets a shelf life; one about method does not.
     *
     * SEVEN DAYS is deliberately short. This is not an archival policy — it is
     * how long a broken integration is allowed to keep speaking for the
     * product. If the condition is still true in a week the agent will meet it
     * again and write it again, which is the correct way for a fact to persist:
     * by continuing to be true, not by having been said once.
     *
     * The model's own claim is trusted here because it is the only thing that
     * read the trace, but the FAILURE IS ONE-SIDED ON PURPOSE — a missing or
     * malformed flag expires the lesson rather than keeping it forever. A
     * lesson wrongly expired is re-learned on the next run; a transient one
     * wrongly kept is what this whole file's header is about.
     */
    const expiresAt =
      parsed?.depends_on_current_state === false && !namesACurrentCondition(lesson)
        ? null
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

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
        expires_at: expiresAt,
        embedding: emb as unknown as string | null,
        metadata: {
          run_id: input.runId,
          trace_id: input.traceId,
          what_worked: parsed?.what_worked ?? null,
          what_to_change: parsed?.what_to_change ?? null,
          depends_on_current_state: parsed?.depends_on_current_state ?? null,
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
    // Overrides only. The baseline a graduation proposal is measured against is
    // the EFFECTIVE mode (platform default, then this account's override), not
    // whatever rows happen to exist; under the platform model most tools have
    // none, and reading rows alone would compute every proposal from a missing
    // baseline and propose graduating tools nobody had ever loosened.
    supabase.from("agent_tools").select("tool_name, mode, enabled").eq("user_id", userId),
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

  // Platform default, then this account's override. Named `seededMode` still
  // because that is what the graduation logic below calls the baseline; nothing
  // is seeded any more.
  const seededMode = new Map(
    resolveToolAccess(
      Object.keys(TOOL_REGISTRY),
      (seeded ?? []) as Array<{ tool_name: string; mode: string | null; enabled: boolean | null }>,
    ).map((t) => [t.tool_name, t.mode as string]),
  );
  const overrideMode = new Map(
    ((overridesRes.data ?? []) as unknown as Array<{ tool_name: string; mode: string }>).map(
      (t) => [t.tool_name, t.mode],
    ),
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
      console.error(
        `trust-ramp proposal insert failed (${agentSlug}/${toolName}): ${insErr.message}`,
      );
    }
  }
}
