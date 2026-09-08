/**
 * Mission Control Spine (front-end reimagining) - the per-stage loop state.
 *
 * getLoopState answers one question for the Spine: for each of the seven
 * stages (01 Discover .. 07 Learn), what is true RIGHT NOW in this
 * workspace? The answer is one of five states:
 *
 *   gate     - a pending human gate lives at this stage (ember, your move).
 *   active   - the machine is working there now (machine blue, pulse).
 *   done     - the stage completed with a real artifact; carries a one-line
 *              past-tense receipt with an honest timestamp.
 *   inferred - no direct rows for this stage inside the read window, but a
 *              LATER stage has evidence, so this one plainly happened. No
 *              receipt is fabricated for it (believable-timestamps rule).
 *   quiet    - nothing at all. Dim but present; the loop is always whole.
 *
 * Composition, not new queries (journey-catalog Part C.8): ember state comes
 * from the approvals queue (getApprovalsQueue - one count, one source, the
 * 2026-07-18 ruling), completion and working evidence from stage_events
 * (the SEAM-1 write path today-lanes already reads), in-flight work from
 * agent_runs, and 07 Learn's receipt from outcome learnings (the lane-4
 * read). stage_events postdates the generated Supabase types, so the reads
 * go through an untyped client - the documented today-lanes precedent.
 *
 * `productId` scopes the gate counts only: queue items attributed to a
 * DIFFERENT project are dropped, while workspace-wide gates (memory, trust,
 * tool calls - projectId null) stay visible everywhere, because hiding a
 * pending gate is worse than over-showing it. stage_events carries no
 * project column, so completion/working evidence stays workspace-scoped.
 *
 * The derivation itself (deriveLoopState) is pure and unit-tested without a
 * DB in loop-state.test.ts.
 */

import { createServerFn } from "@tanstack/react-start";
import { zoneForUser } from "@/lib/profile-zone.server";
import { monthDayInZone } from "@/lib/time-of-day";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  readApprovalsQueue,
  type ApprovalsQueueResult,
  type ApprovalKind,
} from "@/lib/approvals-queue.functions";

// ---------------------------------------------------------------------------
// Public shapes
// ---------------------------------------------------------------------------

/** The seven Spine stages, in loop order (design-language-spec section 6.6). */
export const LOOP_STAGES = [
  "discover",
  "decide",
  "plan",
  "design",
  "build",
  "ship",
  "learn",
] as const;

export type LoopStageId = (typeof LOOP_STAGES)[number];

export type LoopStageState = "done" | "active" | "gate" | "quiet" | "inferred";

export type LoopStageNode = {
  stage: LoopStageId;
  state: LoopStageState;
  /** One line, past tense, honest timestamp. Only on done. */
  receipt?: string;
  /** Present-progressive working verb for the strip. Only on active. */
  liveVerb?: string;
  /** Pending gates at this stage. Only on gate. */
  gateCount?: number;
};

export type LoopStateResult = { stages: LoopStageNode[] };

// ---------------------------------------------------------------------------
// Pure derivation (unit-tested, no DB)
// ---------------------------------------------------------------------------

/** A stage_events row, as the derivation needs it. */
export type LoopStageEvent = {
  entity_type: string;
  to_stage: string;
  /** 'human', an agent slug, or 'system'. */
  actor: string | null;
  at: string;
};

export type LoopStateInput = {
  /** Pending gate counts keyed by stage (from the approvals queue). */
  gateCountByStage: Partial<Record<LoopStageId, number>>;
  /** Recent stage_events for the workspace, any order. */
  events: LoopStageEvent[];
  /** agent_runs currently running or queued in the workspace. */
  inFlightRuns: number;
  /** The latest outcome learning (07 Learn's completion evidence), or null. */
  lastLearningAt: string | null;
  /** Injectable clock for tests. */
  now?: Date;
  /** The reader's zone (profiles.timezone), which every "on Sep 8" reads in. */
  zone: string;
};

/** An event by a non-human actor inside this window reads as live work. */
const ACTIVE_WINDOW_MINUTES = 30;

/** Which stage a gate family's ember belongs to on the Spine. Every
 *  ApprovalKind maps somewhere so a pending gate can never go dark. */
const GATE_STAGE: Record<ApprovalKind, LoopStageId> = {
  // Worth building / worth re-examining calls are the Decide stage's gates.
  decision: "decide",
  opportunity: "decide",
  assumption_challenge: "decide",
  // A spec in review is the Plan stage's gate.
  spec: "plan",
  design_gate: "design",
  // Tool-call confirms and autonomy graduation guard live agent execution.
  tool_call: "build",
  trust_graduation: "build",
  // Memory graduation and playbook adoption close the loop.
  memory_candidate: "learn",
  house_rule: "learn",
  playbook_proposal: "learn",
};

/** The Spine stage a gate family lights. Exported for the tray/Spine pairing. */
export function stageForGate(kind: ApprovalKind): LoopStageId {
  return GATE_STAGE[kind];
}

/** Which Spine stage a stage_events row belongs to, or null when the row is
 *  not loop-stage evidence (goals, loops, unknown entity types). */
export function stageForEvent(
  ev: Pick<LoopStageEvent, "entity_type" | "to_stage">,
): LoopStageId | null {
  switch (ev.entity_type) {
    case "signal":
    case "opportunity":
    case "theme":
      return "discover";
    case "decision":
      return "decide";
    case "spec": {
      if (ev.to_stage.startsWith("design_")) return "design";
      if (ev.to_stage === "build") return "build";
      if (ev.to_stage === "shipped") return "ship";
      return "plan";
    }
    case "mission": {
      if (ev.to_stage === "shipped") return "ship";
      return "build";
    }
    default:
      return null;
  }
}

/** Completion transitions per stage: the ones that mean "the stage produced
 *  its artifact", never just "the stage was touched". A spec moving to draft
 *  is activity; a spec moving to approved is a receipt. */
export function isCompletionEvent(
  stage: LoopStageId,
  ev: Pick<LoopStageEvent, "entity_type" | "to_stage">,
): boolean {
  switch (stage) {
    case "discover":
      // Any sensed signal or ranked opportunity is produced evidence.
      return true;
    case "decide":
      // A decision recorded either way; a resolved opportunity call.
      return (
        (ev.entity_type === "decision" && ev.to_stage !== "pending") ||
        (ev.entity_type === "opportunity" && ev.to_stage === "now")
      );
    case "plan":
      return ev.entity_type === "spec" && ev.to_stage === "approved";
    case "design":
      return ev.entity_type === "spec" && ev.to_stage === "design_approved";
    case "build":
      return (
        ev.entity_type === "mission" &&
        ["done", "complete", "completed", "succeeded"].includes(ev.to_stage)
      );
    case "ship":
      return ev.to_stage === "shipped";
    case "learn":
      // Learn's completion comes from learnings rows, not stage_events.
      return false;
  }
}

/** Honest relative time for receipts. Never fakes precision. */
export function relativePast(atIso: string, now: Date, zone: string): string {
  const at = new Date(atIso);
  const ms = now.getTime() - at.getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return `on ${monthDayInZone(atIso, zone)}`;
}

/** Past-tense receipt line per stage (ReceiptLine tone: artifact + honest time). */
function receiptLine(stage: LoopStageId, ev: LoopStageEvent, now: Date, zone: string): string {
  const when = relativePast(ev.at, now, zone);
  switch (stage) {
    case "discover":
      return ev.entity_type === "signal"
        ? `New signals came in ${when}`
        : `Opportunities ranked ${when}`;
    case "decide":
      return `Decision recorded ${when}`;
    case "plan":
      return `Spec approved ${when}`;
    case "design":
      return `Design approved ${when}`;
    case "build":
      return `Build finished ${when}`;
    case "ship":
      return `Shipped ${when}`;
    case "learn":
      return `Outcome recorded ${when}`;
  }
}

/** The strip's present-progressive verb per stage (PulseLine register:
 *  lowercase predicate; the full per-stage decks live with the component). */
const LIVE_VERB: Record<LoopStageId, string> = {
  discover: "reading signals",
  decide: "weighing the case",
  plan: "drafting the spec",
  design: "shaping the prototype",
  build: "writing the change",
  ship: "staging the release",
  learn: "reading the results",
};

/**
 * Derive the seven Spine nodes from raw inputs. PURE.
 *
 * Precedence per stage: gate > active > done > inferred > quiet.
 * - gate: pending gates always win (ember is your move; the machine may also
 *   be working there, but the call on you is the state that matters).
 * - active: an in-flight agent run (attributed to Build, the stage agent
 *   runs execute in) or a machine-authored stage event inside the last
 *   ACTIVE_WINDOW_MINUTES.
 * - done: the newest completion event for the stage (learn: the latest
 *   outcome learning), with its receipt.
 * - inferred: no direct evidence, but a later stage is gate/active/done.
 * - quiet: nothing.
 */
export function deriveLoopState(input: LoopStateInput): LoopStageNode[] {
  const now = input.now ?? new Date();
  const activeCutoff = now.getTime() - ACTIVE_WINDOW_MINUTES * 60 * 1000;

  const lastCompletion = new Map<LoopStageId, LoopStageEvent>();
  const activeStages = new Set<LoopStageId>();

  for (const ev of input.events) {
    const stage = stageForEvent(ev);
    if (!stage) continue;
    if (isCompletionEvent(stage, ev)) {
      const prev = lastCompletion.get(stage);
      if (!prev || ev.at.localeCompare(prev.at) > 0) lastCompletion.set(stage, ev);
    }
    const isMachine = ev.actor != null && ev.actor !== "human";
    if (isMachine && new Date(ev.at).getTime() >= activeCutoff) {
      activeStages.add(stage);
    }
  }

  // Agent runs execute missions: their live locus is the Build stage.
  if (input.inFlightRuns > 0) activeStages.add("build");

  const nodes: LoopStageNode[] = LOOP_STAGES.map((stage) => {
    const gateCount = input.gateCountByStage[stage] ?? 0;
    if (gateCount > 0) return { stage, state: "gate", gateCount };
    if (activeStages.has(stage)) return { stage, state: "active", liveVerb: LIVE_VERB[stage] };
    if (stage === "learn") {
      if (input.lastLearningAt) {
        return {
          stage,
          state: "done",
          receipt: `Outcome recorded ${relativePast(input.lastLearningAt, now, input.zone)}`,
        };
      }
      return { stage, state: "quiet" };
    }
    const completion = lastCompletion.get(stage);
    if (completion) {
      return { stage, state: "done", receipt: receiptLine(stage, completion, now, input.zone) };
    }
    return { stage, state: "quiet" };
  });

  // Second pass: a quiet stage BEFORE the furthest stage with real evidence
  // plainly happened; mark it inferred (no receipt is invented for it).
  // A gate at Learn is NOT upstream evidence: its families (memory, house
  // rules, playbooks) can arise from chat alone, so it must never make an
  // untouched loop pretend six stages ran.
  let furthest = -1;
  nodes.forEach((n, i) => {
    if (n.state === "quiet") return;
    if (n.state === "gate" && n.stage === "learn") return;
    furthest = i;
  });
  for (let i = 0; i < furthest; i++) {
    if (nodes[i].state === "quiet") nodes[i] = { stage: nodes[i].stage, state: "inferred" };
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// The server function (composition over existing reads)
// ---------------------------------------------------------------------------

/** Events read window: matches lane 4's 30-day outcome horizon so a receipt
 *  can survive a quiet week without pretending to be forever. */
const EVENT_WINDOW_DAYS = 30;

const GetLoopStateSchema = z.object({
  workspaceId: z.string().uuid(),
  productId: z.string().uuid().optional(),
});

export const getLoopState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof GetLoopStateSchema>) => GetLoopStateSchema.parse(d))
  .handler(async ({ context, data }): Promise<LoopStateResult> => {
    const { supabase } = context;
    // stage_events postdates the generated types (today-lanes precedent).
    const db = supabase as unknown as SupabaseClient;
    const sinceIso = new Date(Date.now() - EVENT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const [queue, eventsRes, runsRes, learningRes] = await Promise.all([
      // One count, one source: the same queue the tray and rail badge read.
      readApprovalsQueue(context.supabase, context.userId, data.workspaceId).catch(() => ({
        items: [] as ApprovalsQueueResult["items"],
      })),
      db
        .from("stage_events")
        .select("entity_type,to_stage,actor,at")
        .eq("workspace_id", data.workspaceId)
        .gte("at", sinceIso)
        .order("at", { ascending: false })
        .limit(400),
      db
        .from("agent_runs")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", data.workspaceId)
        .in("status", ["running", "queued"]),
      db
        .from("learnings")
        .select("created_at")
        .eq("workspace_id", data.workspaceId)
        .not("verdict", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const gateCountByStage: Partial<Record<LoopStageId, number>> = {};
    for (const item of queue.items) {
      // Product scoping drops gates attributed to a DIFFERENT project only;
      // workspace-wide gates (projectId null) stay visible everywhere.
      if (data.productId && item.projectId && item.projectId !== data.productId) continue;
      const stage = stageForGate(item.kindKey);
      gateCountByStage[stage] = (gateCountByStage[stage] ?? 0) + 1;
    }

    const stages = deriveLoopState({
      zone: await zoneForUser(context.supabase as never, context.userId),
      gateCountByStage,
      events: (eventsRes.data ?? []) as LoopStageEvent[],
      inFlightRuns: runsRes.count ?? 0,
      lastLearningAt: (learningRes.data as { created_at?: string } | null)?.created_at ?? null,
    });

    return { stages };
  });
