/**
 * Agent-to-Agent (A2A) handoff (Bundle 4 / E1–E5).
 *
 * A `mission` groups multiple `agent_runs` rows under one operator intent.
 * Each hop is recorded as an `agent_messages` row with a STRUCTURED payload
 * (never prompt-stuffed). When the receiver run starts, the loop calls
 * `consumeInboundHandoff` to fetch the latest unconsumed message and
 * `renderHandoffBlock` to inject the payload into the receiver's system
 * prompt — same pattern as the workspace brief block.
 *
 * Failure policy (MVP): on hop failure the mission stops at the failed run.
 * The operator sees it in /traces (and the mission page) and can re-dispatch.
 * No automatic retry — matches "agents do, humans govern at decision points".
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { track } from "@/lib/observability";
import { recordStageEvent } from "@/lib/stage-events.server";
import { extractRejectedAlternatives } from "@/lib/ai/decision-alternatives";
import { decideDecisionReview, DECISION_RECORD_EFFECT } from "@/lib/decision-gate";
import { recordAutoApproval } from "@/lib/decision-gate.server";
import type { ConfidenceTier } from "@/lib/confidence";
import { resolveMissionSpendCap } from "@/lib/ai/mission-caps.server";
import { runAttemptColumnsPresent } from "@/lib/ai/run-attempt.server";
import { callModel } from "@/lib/ai/runtime.server";
import { recordDecisionOrigins } from "@/lib/lineage.functions";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type HandoffPayload = {
  /** Short headline the receiver should solve next. */
  task: string;
  /** Structured context the sender already gathered (free-form jsonb). */
  context?: Record<string, unknown>;
  /** Stable IDs the receiver can read with its own tools (PRDs, themes, opps…). */
  artifacts?: { kind: string; id: string; title?: string }[];
  /** What the sender explicitly leaves to the receiver's judgement. */
  open_questions?: string[];
  /** Hard constraints the receiver must respect. */
  constraints?: string[];
  /**
   * Memory the sender relied on — `agent_memory` ids plus a short human note.
   * The A2A contract field added in v6 Phase 0 (W5): it lets the receiver (and
   * the trace) see what informed the handoff, and is the seam through which
   * compounding memory threads across hops. Preserved through the payload
   * round-trip (stored whole in `agent_messages.payload`); populated where the
   * sender's recalled-memory context is available — claim never outruns wiring,
   * so it stays optional until the loop fills it.
   */
  memory_refs?: { id: string; summary?: string }[];
  /**
   * Evidence backing the handoff's claims — the typed A2A contract's load-bearing
   * field (v4 Law: "a handoff without evidence is rejected by the runtime"). Each
   * entry points at a concrete source the receiver (and the audit trail) can read:
   * a signal/theme/opportunity/prd/doc/decision row, an `agent_memory` id, a trace,
   * or a URL — `kind` names the source class, `id` is the row id / url, `note` is an
   * optional one-liner on why it matters. The runtime gate (`validateHandoff` +
   * `enqueueHandoff`) treats a handoff that asserts `artifacts` but carries neither
   * `evidence_ids` nor `memory_refs` as an unsupported claim. This is what turns the
   * typed handoff from prompt-guidance into a runtime invariant: the seam through
   * which "agents govern their own seams" stops being a slogan.
   */
  evidence_ids?: { kind: string; id: string; note?: string }[];
};

/**
 * Thrown by {@link enqueueHandoff} when the evidence gate is ENFORCED and a
 * handoff fails {@link validateHandoff}. Surfaced to the sending agent as a tool
 * error so it can correct (cite evidence) and retry — the hop is NOT written
 * (no `agent_messages` row, no queued child run) when this throws.
 */
export class HandoffRejectedError extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(`Handoff rejected: ${reason}`);
    this.name = "HandoffRejectedError";
    this.reason = reason;
  }
}

/**
 * Evidence-gate enforcement flag. Mirrors `supersessionEnabled()` /
 * `costRoutingEnabled()`: OFF by default so the live loop is byte-identical until
 * the founder opts in. When unset/`warn`/`off`, `enqueueHandoff` still computes the
 * verdict but proceeds (the `evidence_ids` field travels regardless); when
 * `enforce`/`1`/`true`, an evidence-free claim is rejected at the runtime seam.
 *
 * Default-OFF is deliberate: no handoff in the live loop carries `evidence_ids`
 * today, and artifact-bearing handoffs are common, so enforcing by default would
 * reject legitimate live hops. The founder flips this once agents are reliably
 * citing evidence (the tool now prompts for it, and `memory_refs` already counts).
 */
export function handoffEvidenceGateEnforced(): boolean {
  const v = process.env.HANDOFF_EVIDENCE_GATE;
  return v === "enforce" || v === "1" || v === "true";
}

/**
 * Normalize a payload's `evidence_ids`: drop malformed/blank entries (a non-string
 * or blank `kind`/`id`), trim, and dedupe by `kind`+`id`. Pure — no DB. Keeps the
 * persisted payload clean and makes the gate's "has evidence?" check honest (a
 * single `{kind:"",id:""}` placeholder must not count as evidence).
 */
export function normalizeEvidence(
  evidence: HandoffPayload["evidence_ids"],
): { kind: string; id: string; note?: string }[] {
  if (!Array.isArray(evidence)) return [];
  const seen = new Set<string>();
  const out: { kind: string; id: string; note?: string }[] = [];
  for (const e of evidence) {
    if (!e || typeof e.kind !== "string" || typeof e.id !== "string") continue;
    const kind = e.kind.trim();
    const id = e.id.trim();
    if (!kind || !id) continue;
    // Separator must be a character that cannot appear in kind/id so distinct
    // pairs can never collide ("a b"+"c" vs "a"+"b c"); NUL, written as an
    // escape so the source file stays text, not a raw byte.
    const key = `${kind}\u0000${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const note = typeof e.note === "string" && e.note.trim() ? e.note.trim() : undefined;
    out.push(note ? { kind, id, note } : { kind, id });
  }
  return out;
}

/**
 * The runtime evidence gate (PURE — no DB, so it is unit-testable in isolation).
 *
 * Rule: a handoff that ASSERTS claims must be backed by evidence. We treat the
 * presence of `artifacts` (the concrete rows the receiver is told to act on) as
 * the claim signal, and `evidence_ids` OR `memory_refs` as the backing. A handoff
 * with artifacts but neither form of evidence is an unsupported claim and fails.
 *
 * Conservative on purpose: pure-planning hops (just a `task` / `constraints` /
 * `open_questions`, no artifacts) need no evidence and always pass, so enforcing
 * the gate never blocks the orchestrator's plan→dispatch control flow. Evidence is
 * normalized first so a blank placeholder cannot satisfy the gate.
 */
export function validateHandoff(
  payload: HandoffPayload,
): { ok: true } | { ok: false; reason: string } {
  // A claim = a REAL artifact entry (non-blank kind + id). A blank/placeholder
  // artifact asserts nothing, so it never triggers the evidence requirement —
  // the gate keys off genuine claims, not array length.
  const asserts = (payload.artifacts ?? []).some(
    (a) => typeof a?.kind === "string" && a.kind.trim() && typeof a?.id === "string" && a.id.trim(),
  );
  if (!asserts) return { ok: true };
  // Evidence = a normalized evidence_id OR a real memory_ref (non-blank id). Both
  // sides are filtered so a blank placeholder on either can never satisfy the gate
  // (the pure validator stays honest even before enqueueHandoff's DB-pruning runs).
  const hasMemory = (payload.memory_refs ?? []).some(
    (r) => typeof r?.id === "string" && r.id.trim().length > 0,
  );
  const hasEvidence = normalizeEvidence(payload.evidence_ids).length > 0 || hasMemory;
  if (hasEvidence) return { ok: true };
  return {
    ok: false,
    reason:
      "this handoff lists artifacts but cites no evidence. Add evidence_ids (the signals/themes/opportunities/PRDs/memory that justify them) so the receiver can verify the claim, not take it on trust.",
  };
}

export type MissionRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  title: string;
  goal: string;
  status: string;
  current_agent_id: string | null;
  hop_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

/**
 * Every caller passes a title that's really just a truncated slice of the raw
 * user prompt (the goal's first line, cut to ~80-200 chars) - readable for a
 * one-liner, unreadable for a multi-sentence brief. Synthesize a short, clear
 * title from the full goal instead; the truncated slice is the fallback on
 * any model failure, so this never blocks mission creation.
 */
async function synthesizeMissionTitle(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  goal: string,
  fallback: string,
): Promise<string> {
  try {
    const result = await callModel(supabase, userId, {
      surface: "agent",
      surface_ref: "mission_title",
      model: "google/gemini-2.5-flash",
      workspaceId,
      messages: [
        {
          role: "system",
          content:
            "Return a single concise title (max 60 chars, sentence case, no quotes, no trailing punctuation) summarizing what this task will do. Only the title, nothing else.",
        },
        { role: "user", content: goal.slice(0, 2000) },
      ],
    });
    const title = (result.output || "")
      .trim()
      .replace(/^["'`]+|["'`]+$/g, "")
      .split("\n")[0]
      .slice(0, 200);
    return title || fallback;
  } catch {
    return fallback;
  }
}

export async function createMission(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  // BD-1: `build_driver` stamps which engine runs this mission's build (the
  // seam in src/lib/build/driver.ts) so engine choice is data, not prompt
  // text. Optional + additive: callers that don't build (orchestrator goal
  // missions) omit it and the column default ('native') applies.
  input: { title: string; goal: string; starting_agent_id: string; build_driver?: string },
): Promise<MissionRow> {
  const title = await synthesizeMissionTitle(
    supabase,
    userId,
    workspaceId,
    input.goal,
    input.title.slice(0, 200),
  );
  const { data, error } = await supabase
    .from("missions")
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      title,
      goal: input.goal,
      current_agent_id: input.starting_agent_id,
      status: "running",
      // missions.build_driver is NEW (migration 20260707210000); the insert
      // goes through the untyped SupabaseClient, so no cast is needed here.
      ...(input.build_driver ? { build_driver: input.build_driver } : {}),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  void track("mission_started", userId, { workspace_id: workspaceId });
  // PC-06: the funnel's "first mission dispatched" step. Idempotent
  // (funnel_milestones UNIQUE(workspace_id, user_id, stage)) and best-effort
  // - a tracking failure must never block a real mission from being created.
  void (supabaseAdmin as unknown as SupabaseClient)
    .from("funnel_milestones")
    .upsert(
      { workspace_id: workspaceId, user_id: userId, stage: "first_mission" },
      { onConflict: "workspace_id,user_id,stage", ignoreDuplicates: true },
    )
    .then(
      () => {},
      () => {},
    );
  const mission = data as MissionRow;
  // SEAM-1: creation event (from null). The starting agent is only an id here
  // (slug would cost a lookup), so the actor is 'system'.
  await recordStageEvent(supabase, {
    entityType: "mission",
    entityId: mission.id,
    to: mission.status,
    actor: "system",
    workspaceId,
    userId,
  });
  return mission;
}

/**
 * Resolve a target agent by slug (preferred) or id, scoped to the user's roster.
 * Returns { id, slug, name } for downstream insertion.
 *
 * KI-19: only resolves ENABLED agents (`enabled = true`). A disabled or
 * off-roster agent must never be dispatched a child run, so we filter here at
 * the single resolution chokepoint (the `agent.handoff` tool and the mission
 * dispatcher both route through this) and throw a clear, slug-named error when
 * nothing enabled matches. Callers in the dispatch path catch this per-step.
 */
export async function resolveAgent(
  supabase: SupabaseClient,
  userId: string,
  ref: { agent_slug?: string; agent_id?: string },
): Promise<{ id: string; slug: string; name: string }> {
  let q = supabase
    .from("agents")
    .select("id,slug,name")
    .eq("user_id", userId)
    .eq("enabled", true)
    .limit(1);
  if (ref.agent_id) q = q.eq("id", ref.agent_id);
  else if (ref.agent_slug) q = q.eq("slug", ref.agent_slug);
  else throw new Error("resolveAgent: pass agent_slug or agent_id");
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data)
    throw new Error(
      `Target agent '${ref.agent_slug ?? ref.agent_id}' is disabled or not in the roster.`,
    );
  return data as { id: string; slug: string; name: string };
}

/**
 * Record a handoff message AND enqueue a child `agent_runs` row for the receiver.
 * The resume-runs sweeper picks the queued run up on its next tick (or another
 * call site can resume it immediately). Returns ids for both rows.
 */
export async function enqueueHandoff(
  supabase: SupabaseClient,
  userId: string,
  args: {
    mission_id: string;
    workspace_id: string;
    from_agent_id: string | null;
    from_agent_slug: string | null;
    to: { id: string; slug: string; name: string };
    payload: HandoffPayload;
    source_run_id: string | null;
    source_trace_id: string | null;
    mission_spend_cap_usd?: number | null;
    mission_token_cap?: number | null;
    /**
     * INSTRUMENT: which attempt at this hop the child run is, 1-based.
     *
     * `dispatchReadySteps` has computed this number since the P1 retry migration
     * and has been putting it in `payload.context.attempt` — 75 of 99 handoff
     * messages on production carry it. It reached the receiver's PROMPT and
     * never its ROW, so "how often does a hop get retried" was answerable only
     * by parsing JSON out of a message table. Passing it here puts the same
     * number where analytics can group by it. Undefined leaves the column NULL,
     * which reads as "not measured" rather than "first attempt".
     */
    attempt?: number | null;
  },
): Promise<{ message_id: string; queued_run_id: string }> {
  // A2A hardening (v6 Phase 2 / W3): drop phantom memory_refs before they reach
  // the receiver's prompt. The ids must be real agent_memory rows the user owns;
  // a bug or a hand-crafted handoff could otherwise make the receiver cite
  // memories that don't exist. Best-effort — on a transient query error we keep
  // the refs as-is rather than silently strip valid ones.
  let payload = args.payload;
  if (payload.memory_refs?.length) {
    try {
      const ids = payload.memory_refs.map((r) => r.id);
      const { data: existing, error } = await supabase
        .from("agent_memory")
        .select("id")
        .eq("user_id", userId)
        .in("id", ids);
      if (!error && existing) {
        const valid = new Set((existing as { id: string }[]).map((e) => e.id));
        const kept = payload.memory_refs.filter((r) => valid.has(r.id));
        if (kept.length !== payload.memory_refs.length) {
          payload = { ...payload, memory_refs: kept.length ? kept : undefined };
        }
      }
    } catch {
      /* non-fatal — keep refs as-is on a transient error */
    }
  }

  // A2A evidence gate (the typed contract's load-bearing rule). First normalize
  // the evidence list (strip blanks/dupes) so it travels clean and an empty
  // placeholder can't masquerade as evidence; then validate. When the gate is
  // ENFORCED, reject an unsupported claim HERE, before any row is written, so the
  // sender's tool call fails and it can correct (cite evidence) and retry. When
  // unenforced (default) nothing is blocked; the evidence_ids still travel.
  //
  // Scope note (v1): we validate evidence_ids by SHAPE only. Ownership/existence
  // validation (resolving each {kind,id} to a real row the user owns, the way
  // memory_refs is pruned just above) is a deferred follow-up. It is safe to defer
  // because the gate is default-OFF and the runtime NEVER dereferences evidence_ids
  // (it only prints them for the receiver to read with its own RLS-scoped tools, so
  // a phantom id simply fails to resolve there, never a cross-tenant read). Harden
  // to a kind-dispatched ownership check before flipping the gate to enforce.
  if (payload.evidence_ids?.length) {
    const ev = normalizeEvidence(payload.evidence_ids);
    payload = { ...payload, evidence_ids: ev.length ? ev : undefined };
  }
  const verdict = validateHandoff(payload);
  if (!verdict.ok && handoffEvidenceGateEnforced()) {
    throw new HandoffRejectedError(verdict.reason);
  }

  const { data: msg, error: mErr } = await supabase
    .from("agent_messages")
    .insert({
      user_id: userId,
      workspace_id: args.workspace_id,
      mission_id: args.mission_id,
      from_agent_id: args.from_agent_id,
      from_agent_slug: args.from_agent_slug,
      to_agent_id: args.to.id,
      to_agent_slug: args.to.slug,
      kind: "handoff",
      payload: payload as unknown as Record<string, unknown>,
      source_run_id: args.source_run_id,
      source_trace_id: args.source_trace_id,
    })
    .select("id")
    .single();
  if (mErr) throw new Error(mErr.message);

  // Compose the receiver's goal from the structured payload so even fallback
  // (no inbound-handoff load) still gives them something to work on.
  const composedGoal = [
    args.payload.task,
    args.payload.constraints?.length
      ? `Constraints:\n- ${args.payload.constraints.join("\n- ")}`
      : "",
    args.payload.open_questions?.length
      ? `Open questions:\n- ${args.payload.open_questions.join("\n- ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const { data: run, error: rErr } = await supabase
    .from("agent_runs")
    .insert({
      user_id: userId,
      agent_id: args.to.id,
      agent_slug: args.to.slug,
      agent_name: args.to.name,
      input: composedGoal || args.payload.task,
      status: "queued",
      workspace_id: args.workspace_id,
      mission_id: args.mission_id,
      mission_spend_cap_usd: await resolveMissionSpendCap(
        supabase,
        args.workspace_id,
        args.mission_spend_cap_usd,
      ),
      mission_token_cap: args.mission_token_cap ?? null,
      // Gated: the migration adding these is not applied, and PostgREST fails
      // the whole insert on an unknown column — which the throw below would turn
      // into a dead hop. `resume_count: 0` is honest here for the same reason it
      // is in runAgentLoop: the row is being created, so it has been resumed
      // zero times, and every later resume continues a count that started at
      // birth rather than a lower bound picked up mid-life.
      ...((await runAttemptColumnsPresent(supabase))
        ? { attempt: args.attempt ?? null, resume_count: 0 }
        : {}),
    })
    .select("id")
    .single();
  if (rErr) throw new Error(rErr.message);

  return { message_id: (msg as { id: string }).id, queued_run_id: (run as { id: string }).id };
}

/**
 * Fetch the latest unconsumed handoff addressed to this agent within a mission,
 * and mark it consumed by `runId`. Returns null when there's nothing inbound
 * (e.g. the first hop of a mission, started directly by the operator).
 */
export async function consumeInboundHandoff(
  supabase: SupabaseClient,
  args: { mission_id: string; to_agent_id: string; run_id: string },
): Promise<{ from_agent_slug: string | null; payload: HandoffPayload } | null> {
  // The orchestrator routinely plans DAGs with two+ steps on the SAME agent slug,
  // and dispatchReadySteps enqueues a distinct message + queued run per step, all
  // addressed to that agent — so two receiver runs can select the same unconsumed
  // message. Claim it with a compare-and-set (UPDATE ... WHERE consumed_by_run_id
  // IS NULL): only one run wins. On a lost claim we do NOT return the (now another
  // run's) payload; we loop and try the next unconsumed message addressed to us,
  // so each run gets its own and none is double-consumed. Bounded to avoid
  // spinning under heavy same-agent fan-out.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data } = await supabase
      .from("agent_messages")
      .select("id,from_agent_slug,payload,consumed_by_run_id")
      .eq("mission_id", args.mission_id)
      .eq("to_agent_id", args.to_agent_id)
      // F-STUDIO: 'steer' messages are consumed by the loop mid-session — they
      // must never be swallowed here as a handoff payload.
      .eq("kind", "handoff")
      .is("consumed_by_run_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null; // nothing inbound (e.g. the operator-started first hop)
    const msg = data as { id: string; from_agent_slug: string | null; payload: HandoffPayload };
    const { data: claimed } = await supabase
      .from("agent_messages")
      .update({ consumed_by_run_id: args.run_id, consumed_at: new Date().toISOString() })
      .eq("id", msg.id)
      .is("consumed_by_run_id", null) // CAS: only claim if still unconsumed
      .select("id");
    if (claimed?.length) {
      return { from_agent_slug: msg.from_agent_slug, payload: msg.payload };
    }
    // Lost the claim to a concurrent run — try the next unconsumed message.
  }
  return null;
}

/**
 * Render an inbound handoff as a labelled plain-text block, suitable for
 * injection into the receiver's system prompt right after the workspace brief.
 * Mirrors `renderBriefBlock` style so the receiver knows the source.
 */
export function renderHandoffBlock(
  inbound: { from_agent_slug: string | null; payload: HandoffPayload } | null,
): string {
  if (!inbound) return "";
  const p = inbound.payload;
  const from = inbound.from_agent_slug ?? "operator";
  const sections: string[] = [];
  sections.push(`Task to solve next:\n${p.task}`);
  if (p.context && Object.keys(p.context).length) {
    sections.push(`Context (structured):\n${JSON.stringify(p.context, null, 2)}`);
  }
  if (p.artifacts?.length) {
    sections.push(
      "Artifacts you can read with your tools:\n" +
        p.artifacts.map((a) => `- ${a.kind} ${a.id}${a.title ? `: ${a.title}` : ""}`).join("\n"),
    );
  }
  if (p.constraints?.length) {
    sections.push("Constraints (hard):\n- " + p.constraints.join("\n- "));
  }
  if (p.open_questions?.length) {
    sections.push("Open questions left for you:\n- " + p.open_questions.join("\n- "));
  }
  if (p.memory_refs?.length) {
    sections.push(
      "Memory the sender relied on (read with your memory tool to go deeper):\n- " +
        p.memory_refs.map((m) => (m.summary ? `${m.summary} (${m.id})` : m.id)).join("\n- "),
    );
  }
  if (p.evidence_ids?.length) {
    sections.push(
      "Evidence backing this handoff (verify before you act, do not take it on trust):\n- " +
        p.evidence_ids.map((e) => `${e.kind} ${e.id}${e.note ? ` (${e.note})` : ""}`).join("\n- "),
    );
  }
  return `\n--- Handoff from ${from} (mission context, authoritative) ---\n${sections.join("\n\n")}\n--- End handoff ---\n`;
}

/**
 * Mark a mission completed when its tail run ends successfully and no further
 * handoff was emitted. Called by the loop on `final`.
 */
export async function maybeCompleteMission(
  supabase: SupabaseClient,
  missionId: string,
): Promise<void> {
  // If there's still an unconsumed inbound message, the mission is still moving.
  const { count } = await supabase
    .from("agent_messages")
    .select("id", { count: "exact", head: true })
    .eq("mission_id", missionId)
    .is("consumed_by_run_id", null);
  if ((count ?? 0) > 0) return;

  // Fan-out / parallel-handoff safety: do NOT complete while ANY mission run is still
  // live (queued / dispatched / running / waiting_approval). Spawned children
  // (agent.spawn) create runs with NO mission_steps, so without this guard a child that
  // has CLAIMED its inbound message (no longer unconsumed) but is still running would be
  // invisible to the step/orchestrator gates below, and a sibling finishing could close
  // the mission out from under it. The finishing run is marked terminal BEFORE this is
  // called, so it is never counted here. Conservative: this only ever DEFERS completion
  // (the resume sweeper fail-marks genuinely-stale runs, and this is re-checked every
  // tick), so it can never deadlock a mission.
  const { count: liveRuns } = await supabase
    .from("agent_runs")
    .select("id", { count: "exact", head: true })
    .eq("mission_id", missionId)
    .in("status", ["queued", "dispatched", "running", "waiting_approval"]);
  if ((liveRuns ?? 0) > 0) return;

  // Orchestrated missions are governed by their step DAG, not just the message
  // queue: never complete while a planned/dispatched/running step remains
  // (otherwise a wave-0 child finishing would prematurely close a multi-wave
  // mission before later steps are even dispatched — v6 Phase 1). When steps
  // exist, the completion status reflects whether any of them failed.
  let finalStatus = "completed";
  const { data: stepRows } = await supabase
    .from("mission_steps")
    .select("status")
    .eq("mission_id", missionId);
  const steps = (stepRows ?? []) as { status: string }[];
  if (steps.length > 0) {
    const allTerminal = steps.every(
      (s) => s.status === "done" || s.status === "failed" || s.status === "skipped",
    );
    if (!allTerminal) return; // still moving — the advance reflector will carry it
    if (steps.some((s) => s.status === "failed")) finalStatus = "completed_with_failures";
  } else {
    // Zero steps: do NOT silently complete a never-planned mission (the cron
    // calls this on every terminal hop). Only complete when an orchestrator run
    // actually reached a terminal state and genuinely produced no plan. If
    // there is no orchestrator run at all, or one is still queued/running/
    // waiting_approval, the mission has not finished planning, so return and
    // let it run (or, if the launch threw, fix (b) leaves it 'halted', which is
    // retryable, never permanently stranded at 'running').
    const { data: orchRuns } = await supabase
      .from("agent_runs")
      .select("status,last_checkpoint_at,created_at")
      .eq("mission_id", missionId)
      .eq("agent_slug", "orchestrator")
      .order("last_checkpoint_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    const runs = (orchRuns ?? []) as { status: string }[];
    const hasTerminalOrchRun = runs.some(
      (r) => r.status === "completed" || r.status === "failed" || r.status === "halted",
    );
    if (!hasTerminalOrchRun) return;
    // A terminal orchestrator run with ZERO persisted steps usually means
    // planning produced no executable DAG (e.g. the planner could not resolve
    // a single agent slug) — a genuine failure. But an orchestrator can also
    // legitimately skip DAG planning and act directly (e.g. a single
    // `delegate.openhands` call for a well-bounded task), in which case its
    // OWN run completes normally even though it never wrote a mission_steps
    // row. The most recent run's own status is the honest signal; a blanket
    // "zero steps = failed" mislabeled a successful direct delegation as
    // failed (found 2026-07-01 against the live DB — two accepted OpenHands
    // jobs, mission still closed out as 'failed').
    finalStatus = runs[0]?.status === "completed" ? "completed" : "failed";
  }

  // PC-07 (goal-until-verified): a CLEAN completion must pass the outcome
  // contract's oracle checklist first. The verifier either agrees (green),
  // dispatches one corrective cycle (mission keeps running — return), or
  // reports the caps exhausted (honest completed_with_failures). Missions
  // without a compiled contract are untouched. Dynamic import avoids a
  // module cycle (verify-green uses enqueueHandoff/resolveAgent from here).
  if (finalStatus === "completed") {
    try {
      const { runVerifyCycleIfNeeded } = await import("./verify-green.server");
      const verify = await runVerifyCycleIfNeeded(supabase, missionId);
      if (verify === "cycle_dispatched") return;
      // Both cap exhaustion AND a failed corrective dispatch complete with
      // failures — an unmet contract may never read as a clean success.
      if (verify === "caps_exhausted" || verify === "dispatch_failed") {
        finalStatus = "completed_with_failures";
      }
    } catch (e) {
      // The verifier must never strand a finished mission.
      console.error("verify-green pass failed (completing normally):", e);
    }
  }

  // SEAM-1: capture the prior stage before the guarded update (RETURNING only
  // yields the new values).
  const { data: prior } = await supabase
    .from("missions")
    .select("status")
    .eq("id", missionId)
    .maybeSingle();

  const { data: updated } = await supabase
    .from("missions")
    .update({ status: finalStatus, completed_at: new Date().toISOString() })
    .eq("id", missionId)
    .in("status", ["running", "in_progress"])
    .select("id,user_id,workspace_id,title,goal")
    .maybeSingle();

  if (updated) {
    // Pull the run that actually FINISHED LAST, not the one ENQUEUED last: for a
    // wide DAG several runs are enqueued in the same tick (often the same
    // millisecond), so created_at DESC could attribute the decision to the wrong
    // agent/output. Restrict to completed runs and order by their last activity
    // (last_checkpoint_at ≈ completion time; agent_runs has no completed_at
    // column). Also the honest actor for the stage event.
    const { data: lastRun } = await supabase
      .from("agent_runs")
      .select("output,agent_slug")
      .eq("mission_id", updated.id)
      .eq("status", "completed")
      // PC-07: the verifier's run always finishes last on contract-bearing
      // missions; excluding it keeps the decision rationale and the actor
      // pointing at the agent that did the WORK, not the checker.
      .neq("agent_slug", "verifier")
      .order("last_checkpoint_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    const actor = lastRun?.agent_slug ?? "system";

    await recordStageEvent(supabase, {
      entityType: "mission",
      entityId: missionId,
      from: (prior as { status: string } | null)?.status ?? null,
      to: finalStatus,
      actor,
      workspaceId: updated.workspace_id,
      userId: updated.user_id,
    });

    // F-DECISIONS-CAPTURE: a mission completing is a captured decision.
    // Idempotent: skip if a row already exists for this mission. A mission that
    // failed to plan (finalStatus 'failed') is not a decision — skip capture.
    if (finalStatus !== "failed") {
      /* WHY THE STATUS IS NOW DECIDED RATHER THAN ASSERTED.
       *
       * This line used to read `status: "approved"` with no test of any kind:
       * every mission receipt was auto-approved, unconditionally, and nothing
       * anywhere recorded why. That is the failure mode the gate exists to
       * remove — not "too many approvals" but an approval with no reason
       * attached, which cannot be audited and cannot be overturned by anyone
       * who does not already know it happened.
       *
       * THE CONFIDENCE SIGNAL IS `finalStatus`, and it is the only one this
       * writer honestly has. confidence.ts's header says to map a signal we
       * already hold onto the shared vocabulary rather than invent one, so:
       *   completed                → medium. Every step reached a terminal
       *                              state, none failed, and where an outcome
       *                              contract exists the verifier agreed. Not
       *                              "high": without a contract nothing checked
       *                              the work, and the convention is explicit
       *                              that a writer with no strong signal says
       *                              medium rather than fabricating high.
       *   completed_with_failures  → low. The row this writer is about to store
       *                              is titled "Mission completed", and on a
       *                              mission with failed steps that title is
       *                              already generous. A record we half-believe
       *                              is exactly the one a person should read,
       *                              so it goes to the queue and stays there. */
      const confidence: ConfidenceTier = finalStatus === "completed" ? "medium" : "low";
      const gate = decideDecisionReview({
        sourceKind: "mission",
        agentSlug: lastRun?.agent_slug ?? null,
        confidence,
        // Landing this row records a decision and nothing else; the work it
        // describes has already happened, under its own per-tool approvals.
        effect: DECISION_RECORD_EFFECT,
        /* False, and it is checkable rather than hopeful: `updateDecision`
         * (decisions.functions.ts) and `routeDecision`
         * (approvals-queue.functions.ts) are the only two paths that resolve a
         * decision, and both do exactly one thing — flip `status` and write a
         * stage event. The mission is already terminal by the time this runs.
         * If a future change makes approving a decision DO something, this
         * argument is the line that has to change with it. */
        commitsBeyondTheRecord: false,
      });
      const { count: existing } = await supabase
        .from("decisions")
        .select("id", { count: "exact", head: true })
        .eq("mission_id", updated.id);
      if ((existing ?? 0) === 0) {
        const rationale = (lastRun?.output ?? updated.goal ?? "").slice(0, 2000);
        // SW-3 mission 3.2: carry the paths the run's own output explicitly
        // rejected. Honest by construction: extractRejectedAlternatives only
        // yields rows where the text literally names a rejected path, so a
        // run that named none stores nothing.
        const alternatives = extractRejectedAlternatives(
          typeof lastRun?.output === "string" ? lastRun.output : null,
        );
        const { data: decision } = await supabase
          .from("decisions")
          .insert({
            user_id: updated.user_id,
            workspace_id: updated.workspace_id,
            title: `Mission completed: ${(updated.title ?? "Untitled").slice(0, 240)}`,
            rationale,
            status: gate.status,
            mission_id: updated.id,
            source_kind: "mission",
            decided_by_agent_slug: lastRun?.agent_slug ?? null,
            /* The loop raised this, not a person. The column exists precisely so
             * provenance stops living in the title (migration 20260805120000),
             * and it is what makes an auto-approved receipt FINDABLE on the
             * surface a human already reads — DecisionDetail prints "raised by
             * the crew" off it. An auto-approval the human cannot find is the
             * half of "attributable and reversible" that is easy to miss. */
            auto_origin: true,
            ...(alternatives.length ? { alternatives_considered: alternatives } : {}),
          })
          .select("id")
          .maybeSingle();
        if (decision) {
          const decisionId = (decision as { id: string }).id;
          await recordStageEvent(supabase, {
            entityType: "decision",
            entityId: decisionId,
            to: gate.status,
            actor,
            workspaceId: updated.workspace_id,
            userId: updated.user_id,
          });
          /**
           * THE EDGE THE 84 AUTO-ORIGIN RECEIPTS NEVER LEFT.
           *
           * This branch is the single largest producer of decisions in the
           * product: 84 of the 105 real `source_kind='mission'` rows measured
           * on 2026-08-10 were written here, and not one of them put anything
           * in `artifact_lineage`. The `mission_id` column above says which
           * mission; the graph did not, so the chain audit read Decide as fed
           * mostly by Learn when its real largest inbound was Build.
           *
           * It goes AFTER the insert rather than beside it because
           * supabase-js RESOLVES a refused write with no error and no row:
           * this whole block is already inside `if (decision)`, so the row is
           * confirmed before its provenance is stamped. An edge pointing at a
           * row that was refused is worse than a missing edge.
           *
           * `updated.workspace_id` is the MISSION'S workspace, read from the
           * missions table above and already used for the decision insert — not
           * the caller's default. This loop runs under whichever client the
           * mission loop holds, so the default would be the wrong workspace
           * more often here than anywhere else in the product.
           */
          await recordDecisionOrigins(supabase, updated.user_id, {
            decisionId,
            missionId: updated.id,
            workspaceId: updated.workspace_id,
            createdByAgent: lastRun?.agent_slug ?? null,
            rationale: "The mission this completion record was filed against",
          });
          if (gate.action === "auto_approve") {
            /* supabaseAdmin rather than the caller's client on purpose:
             * `workspace_audit_log` has a members-read policy and NO insert
             * policy, so only the service role can append. This function is
             * called with whichever client the loop holds, and a user-scoped one
             * would have its write silently refused — an audit gap that looks
             * exactly like success. */
            await recordAutoApproval(supabaseAdmin, {
              decisionId,
              workspaceId: updated.workspace_id,
              userId: updated.user_id,
              agentSlug: lastRun?.agent_slug ?? null,
              missionId: updated.id,
              sourceKind: "mission",
              writtenBy: "maybeCompleteMission (lib/ai/handoff.server.ts)",
              decision: gate,
            });
          }
        }
      }
    }
  }
}
