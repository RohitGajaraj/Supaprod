/**
 * Today surface server functions (F-V5-RITUAL).
 *
 * Backs the "Needs you" Calls queue on the Today page: the operator's
 * pending approval gates, specs awaiting their call, Critic-challenged
 * opportunities, and today's AI spend. One query, one card list — the
 * daily ritual reads from here.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isSideEffectingTool } from "@/lib/tool-consequences";
import type { CriticReview } from "@/lib/discovery.functions";
import { entitlementsFor, normalizePlanTier, type PlanTier } from "@/lib/entitlements";
import { assessMemoryExpiry, type MemoryExpiryState } from "@/lib/plg-memory-expiry";
import {
  type CompoundingLearning,
  type CompoundingSummary,
  type Rescore,
  rescoresOf,
  summarizeCompounding,
} from "@/lib/moat-vis";

export type NeedsYou = {
  /** LIVE tool gates only (pending, not past their window, not snoozed).
   *  Expired gates leave the live queue and land in `expiredApprovals`
   *  (R2-ATTENTION #2); snoozed gates return when their window passes. */
  approvals: {
    id: string;
    agent_slug: string;
    tool_name: string;
    rationale: string | null;
    escalation_state: string;
    expires_at: string | null;
    created_at: string;
    /** The agent run trace behind the gate (for cost/model + Open). */
    trace_id: string | null;
    /** The mission the gate rose from, when the loop recorded one — the
     *  specific provenance target (/build/$missionId) over the generic /build. */
    missionId: string | null;
    /** When the operator last hit Later; live rows are past (or never) snoozed. */
    snoozed_until: string | null;
    /** Model the gated call ran on (Appendix D), or null if no spend recorded. */
    model: string | null;
    /** Spend on this call so far in USD (Appendix D), or null if none recorded. */
    est_cost_usd: number | null;
  }[];
  /** Gates that expired before anyone answered. Out of the live count and the
   *  hero slot; rendered as the quiet "Expired · N" group at the queue's end. */
  expiredApprovals: {
    id: string;
    agent_slug: string;
    tool_name: string;
    expires_at: string | null;
    created_at: string;
  }[];
  prdCalls: {
    id: string;
    title: string;
    status: string;
    critic_review: CriticReview | null;
    updated_at: string;
  }[];
  oppCalls: {
    id: string;
    title: string;
    critic_review: CriticReview | null;
    created_at: string;
  }[];
  /** FS-02: open assumption-supersession challenges — a signal or learning
   *  that appears to contradict a standing assumption behind a past decision. */
  assumptionCalls: {
    id: string;
    decisionTitle: string;
    assumptionStatement: string;
    rationale: string;
    evidenceText: string | null;
    created_at: string;
  }[];
  /** SW-3 (mission 3.8b): proposed playbooks from the compounding pass - 3+
   *  same-shaped learnings waiting for the human to adopt or dismiss. */
  playbookCalls: {
    id: string;
    title: string;
    body: string;
    created_at: string;
    sourceCount: number;
  }[];
  /** SW-7 (mission 3.4): specs whose design mockup gate is undecided, on a
   *  workspace with the design stage on. The design station has no queue
   *  page of its own (it lives on the spec) - this is what makes a pending
   *  design decision discoverable without a new sidebar destination. */
  designGateCalls: {
    id: string;
    title: string;
    updated_at: string;
  }[];
  /** The workspace's first undecided Critic teardown, ANY verdict. The old
   *  revise/kill filter silently dropped 'ship' verdicts, so a clean first
   *  teardown never surfaced. Pinned at the top of the judgment lane with
   *  Keep / Share until the human answers it. */
  firstTeardown: {
    id: string;
    title: string;
    verdict: CriticReview["verdict"];
    summary: string;
    topRisk: string | null;
    confidence: number | null;
    created_at: string;
  } | null;
  spendTodayUsd: number;
  /** Median minutes from gate raised to human decision, last 7 days.
   *  Null until at least one gate has been decided. Backs the Today
   *  throughput panel ("Gate response · your median"). */
  gateMedianMinutes: number | null;
  /** THE needs-you truth (R2-ATTENTION #1): uncapped server-side counts.
   *  Every surface that shows an attention figure (the Today hero, the rail
   *  badge, the Build loop-health banner) reads these, never an array length,
   *  so the counts can never disagree when a display cap bites. */
  counts: NeedsYouCounts;
};

export type NeedsYouCounts = {
  /** Live tool gates (pending, not past their window). */
  approvals: number;
  /** Specs in review awaiting the human's call. */
  specs: number;
  /** Critic-challenged opportunities still in backlog. */
  opportunities: number;
  /** Open assumption-supersession challenges. */
  assumptions: number;
  /** SW-3 (mission 3.8b): proposed playbooks from the compounding pass,
   *  awaiting the human's adopt/dismiss. */
  playbooks: number;
  /** SW-7 (mission 3.4): specs with an undecided design gate. */
  designGates: number;
  /** Pushed Brain insights sitting in the judgment lane (today's pushes plus
   *  the open scored judgment kinds — the family queryLane1 renders from). */
  insights: number;
  /** PC-12: ready fan-out review batches waiting on the human. */
  fanouts: number;
  /** Gates that expired unanswered. NOT part of liveCalls. */
  expired: number;
  /** THE one number every "needs you" surface shows (hero, DECIDE pill, lane
   *  header, shell badge): live calls + pushed insights + ready fan-out
   *  batches. Computed here, once, server-side — never re-derived client-side. */
  liveCalls: number;
};

/* SEAM (sync-doors, 2026-07-11): sync-conflict Calls are NOT injected yet.
 * The three-honest-doors IA wants an open sync conflict to surface as a Call
 * on Today, deep-linking /sync?conflict=<id> (the /sync route already accepts
 * and highlights that param). There is no cheap generic hook here: every call
 * kind is a typed array + a count + a Today card renderer in lockstep
 * (_authenticated.today.tsx), so a server-side count alone would inflate
 * counts.liveCalls with no visible card, which the honesty law forbids.
 * To wire it: (1) add syncConflicts to NeedsYouCounts via a head count on
 * sync_mappings where conflict=true, include it in liveCalls; (2) add a
 * syncConflictCalls array ({ id, provider, external_id }) to NeedsYou in
 * getNeedsYou; (3) render the card in the Today queue linking to
 * /sync?conflict=<id>. All three land together or not at all. */

/** Tolerant critic_review reader: jsonb object or a stringified copy. */
function parseCriticReview(raw: unknown): CriticReview | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as CriticReview;
    } catch {
      return null;
    }
  }
  return raw as CriticReview;
}

/** Top-level OR predicate: a gate is LIVE while pending and inside its window. */
const liveGateOr = (nowIso: string) => `expires_at.is.null,expires_at.gt.${nowIso}`;
/** Top-level OR predicate: expired state, or pending but past its window
 *  (the sweeper may not have flipped the row yet — honesty over lag). */
const expiredGateOr = (nowIso: string) =>
  `escalation_state.eq.expired,and(escalation_state.eq.pending,expires_at.lte.${nowIso})`;
/** Top-level OR predicate: the operator never hit Later, or the snooze window
 *  has passed (stage-events foundations, 20260707190000). Chained after
 *  liveGateOr — PostgREST ANDs separate .or() filters. */
const notSnoozedOr = (nowIso: string) => `snoozed_until.is.null,snoozed_until.lt.${nowIso}`;

/**
 * The ONE server-side derivation of the needs-you counts (R2-ATTENTION #1).
 * getNeedsYou (Today + rail) and getLoopHealth (the Build banner) both call
 * this, so "calls waiting on you" is a single truth everywhere. Cheap head
 * counts, RLS-scoped. Pass workspaceId when the caller already resolved it;
 * leave it undefined to have it looked up here.
 */
export async function countNeedsYouCalls(
  supabase: SupabaseClient,
  userId: string,
  workspaceId?: string | null,
): Promise<NeedsYouCounts> {
  const nowIso = new Date().toISOString();
  let wsId: string | null;
  if (workspaceId === undefined) {
    const { data: member } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    wsId =
      ((member as { workspace_id?: string } | null)?.workspace_id as string | undefined) ?? null;
  } else {
    wsId = workspaceId;
  }

  // SW-7 (mission 3.4): design gates only exist where the workspace turned the
  // design stage on. A separate lookup (not a join) keeps the count query below
  // simple and correct rather than guessing Supabase's embedded-resource name.
  let designStageEnabled = false;
  if (wsId) {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("design_stage_enabled")
      .eq("id", wsId)
      .maybeSingle();
    designStageEnabled = Boolean(
      (ws as { design_stage_enabled?: boolean | null } | null)?.design_stage_enabled,
    );
  }

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayStartIso = dayStart.toISOString();

  const [
    live,
    expired,
    specs,
    opps,
    challenges,
    playbooks,
    designGates,
    firstTd,
    insightRes,
    fanoutRes,
  ] = await Promise.all([
    // A LIVE call is one still awaiting a decision: status='pending'. Bug fix
    // 2026-07-08: escalation_state stays 'pending' even after a gate executes
    // or fails (only the decision-path clears it), so filtering escalation
    // alone counted resolved gates forever and inflated "N calls need you".
    supabase
      .from("agent_approvals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending")
      .or(liveGateOr(nowIso))
      .or(notSnoozedOr(nowIso)),
    supabase
      .from("agent_approvals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending")
      .or(expiredGateOr(nowIso)),
    supabase.from("prds").select("id", { count: "exact", head: true }).eq("status", "review"),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .filter("critic_review->>verdict", "in", '("revise","kill")')
      .eq("status", "backlog"),
    wsId
      ? supabase
          .from("assumption_challenges")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .eq("status", "open")
      : Promise.resolve({ count: 0 }),
    // SW-3 (mission 3.8b): open playbook proposals are Calls (Law 2 - anything
    // needing the human is a Call in the one queue). Pre-migration tolerant:
    // a missing table errors softly and counts 0.
    wsId
      ? supabase
          .from("playbook_proposals")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .eq("status", "proposed")
      : Promise.resolve({ count: 0 }),
    wsId && designStageEnabled
      ? supabase
          .from("prds")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .is("design_gate_status", null)
      : Promise.resolve({ count: 0 }),
    // The pinned first teardown: the earliest undecided opportunity that has
    // a Critic verdict, ANY verdict. Revise/kill rows are already in the
    // opportunities count above; a 'ship' verdict was silently dropped, so
    // it is added back below (the first-teardown filter fix).
    // Workspace-scoped so a multi-workspace owner never sees another
    // workspace's teardown in this one's judgment lane or call count.
    wsId
      ? supabase
          .from("opportunities")
          .select("id,critic_review")
          .eq("workspace_id", wsId)
          .not("critic_review", "is", null)
          .eq("status", "backlog")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    // Pushed Brain insights in the judgment lane: today's pushes plus the
    // open scored judgment kinds (the same predicate family queryLane1
    // renders from). Pre-migration tolerant — handled after the join.
    wsId
      ? supabase
          .from("insights")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .eq("status", "open")
          .or(
            `and(digest.eq.false,pushed_at.gte.${dayStartIso}),kind.in.(next_best_action,hidden_connection)`,
          )
      : Promise.resolve({ count: 0, error: null }),
    // PC-12: ready fan-out review batches are judgment-lane cards too.
    wsId
      ? supabase
          .from("fanout_batches")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .eq("status", "ready")
      : Promise.resolve({ count: 0, error: null }),
  ]);

  // Pre-migration tolerance: pushed_at/digest postdate older DBs. When the OR
  // predicate errors on a missing column, fall back to the scored kinds alone;
  // a missing fanout table simply counts 0.
  let insightCount = (insightRes as { error?: unknown }).error ? 0 : (insightRes.count ?? 0);
  if (wsId && (insightRes as { error?: unknown }).error) {
    const { count } = await supabase
      .from("insights")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wsId)
      .eq("status", "open")
      .in("kind", ["next_best_action", "hidden_connection"]);
    insightCount = count ?? 0;
  }
  const fanoutCount = (fanoutRes as { error?: unknown }).error ? 0 : (fanoutRes.count ?? 0);

  const ftReview = parseCriticReview(
    (firstTd.data as { critic_review?: unknown } | null)?.critic_review,
  );
  const firstTeardownExtra =
    ftReview && ftReview.verdict !== "revise" && ftReview.verdict !== "kill" ? 1 : 0;

  const approvals = live.count ?? 0;
  const specCount = specs.count ?? 0;
  const oppCount = (opps.count ?? 0) + firstTeardownExtra;
  const assumptionCount = challenges.count ?? 0;
  const playbookCount = playbooks.count ?? 0;
  const designGateCount = designGates.count ?? 0;
  return {
    approvals,
    specs: specCount,
    opportunities: oppCount,
    assumptions: assumptionCount,
    playbooks: playbookCount,
    designGates: designGateCount,
    insights: insightCount,
    fanouts: fanoutCount,
    expired: expired.count ?? 0,
    liveCalls:
      approvals +
      specCount +
      oppCount +
      assumptionCount +
      playbookCount +
      designGateCount +
      insightCount +
      fanoutCount,
  };
}

export const getNeedsYou = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NeedsYou> => {
    const { supabase, userId } = context;
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const nowIso = new Date().toISOString();

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: member } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    const workspaceId = (member?.workspace_id as string | undefined) ?? null;

    // mission_id + snoozed_until postdate the generated Supabase types —
    // untyped client + explicit row casts (the listGovernApprovals precedent).
    const db = supabase as unknown as SupabaseClient;

    // SW-7 (mission 3.4): mirrors countNeedsYouCalls's own lookup so the list
    // below only fires when the design stage is genuinely on for this workspace.
    let designStageEnabled = false;
    if (workspaceId) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("design_stage_enabled")
        .eq("id", workspaceId)
        .maybeSingle();
      designStageEnabled = Boolean(
        (ws as { design_stage_enabled?: boolean | null } | null)?.design_stage_enabled,
      );
    }

    // R2-ATTENTION #2: expired gates leave the live queue. The live fetch takes
    // pending-and-inside-window rows only; expired rows (state or window) come
    // back separately for the quiet end-of-queue group. Snoozed rows (Later)
    // stay out of both until their window passes.
    const [
      counts,
      approvals,
      expiredRows,
      prds,
      opps,
      events,
      decided,
      challenges,
      proposals,
      designGatePrds,
      firstTd,
    ] = await Promise.all([
      countNeedsYouCalls(db, userId, workspaceId),
      db
        .from("agent_approvals")
        .select(
          "id,agent_slug,tool_name,rationale,escalation_state,expires_at,created_at,trace_id,mission_id,snoozed_until",
        )
        .eq("user_id", userId)
        .eq("status", "pending")
        .or(liveGateOr(nowIso))
        .or(notSnoozedOr(nowIso))
        .order("expires_at", { ascending: true })
        .limit(10),
      supabase
        .from("agent_approvals")
        .select("id,agent_slug,tool_name,expires_at,created_at")
        .eq("user_id", userId)
        .eq("status", "pending")
        .or(expiredGateOr(nowIso))
        .order("expires_at", { ascending: false })
        .limit(8),
      supabase
        .from("prds")
        .select("id,title,status,critic_review,updated_at")
        .eq("status", "review")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("opportunities")
        .select("id,title,critic_review,created_at")
        .filter("critic_review->>verdict", "in", '("revise","kill")')
        // Loom W2-TODAY: only calls the human has NOT answered yet. Once an
        // opportunity leaves backlog (kept -> now, dropped -> dropped, ...)
        // the call is decided and must not resurface on the next visit.
        .eq("status", "backlog")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("ai_events")
        .select("est_cost_usd")
        .gte("created_at", dayStart.toISOString())
        .limit(1000),
      supabase
        .from("agent_approvals")
        .select("created_at,decided_at")
        .eq("user_id", userId)
        .not("decided_at", "is", null)
        .gte("decided_at", weekAgo)
        .limit(200),
      workspaceId
        ? supabase
            .from("assumption_challenges")
            .select("id,assumption_id,signal_id,learning_id,rationale,created_at")
            .eq("workspace_id", workspaceId)
            .eq("status", "open")
            .order("created_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] as unknown[] }),
      // SW-3 (mission 3.8b): open playbook proposals ride the queue as Calls.
      // playbook_proposals postdates the generated types (db, untyped); a
      // missing table pre-migration errors softly into an empty list.
      workspaceId
        ? db
            .from("playbook_proposals")
            .select("id,title,body,created_at,source_learning_ids")
            .eq("workspace_id", workspaceId)
            .eq("status", "proposed")
            .order("created_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] as unknown[] }),
      // SW-7 (mission 3.4): specs with an undecided design gate, on a
      // workspace with the design stage on.
      workspaceId && designStageEnabled
        ? supabase
            .from("prds")
            .select("id,title,updated_at")
            .eq("workspace_id", workspaceId)
            .is("design_gate_status", null)
            .order("updated_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] as unknown[] }),
      // The pinned first teardown (ANY verdict; the revise/kill filter above
      // dropped 'ship' verdicts from the queue entirely).
      // Workspace-scoped, same reason as countNeedsYouCalls above.
      workspaceId
        ? supabase
            .from("opportunities")
            .select("id,title,critic_review,created_at")
            .eq("workspace_id", workspaceId)
            .not("critic_review", "is", null)
            .eq("status", "backlog")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const spendTodayUsd = (events.data ?? []).reduce(
      (s, e) => s + Number((e as { est_cost_usd: number | null }).est_cost_usd || 0),
      0,
    );

    // Gate response — median raised→decided latency over the last week.
    const latencies = ((decided.data ?? []) as { created_at: string; decided_at: string }[])
      .map((a) => (+new Date(a.decided_at) - +new Date(a.created_at)) / 60_000)
      .filter((m) => Number.isFinite(m) && m >= 0)
      .sort((a, b) => a - b);
    const gateMedianMinutes = latencies.length
      ? Math.round(latencies[Math.floor(latencies.length / 2)])
      : null;

    // Per-call cost + model (Appendix D): join each gate's trace to its
    // ai_events. One batched query; honest nulls when a call has no recorded
    // spend yet. RLS scopes ai_events to the caller.
    const approvalRows = (approvals.data ?? []) as unknown as Array<{
      id: string;
      agent_slug: string;
      tool_name: string;
      rationale: string | null;
      escalation_state: string;
      expires_at: string | null;
      created_at: string;
      trace_id: string | null;
      mission_id: string | null;
      snoozed_until: string | null;
    }>;
    const traceIds = [
      ...new Set(approvalRows.map((a) => a.trace_id).filter((t): t is string => !!t)),
    ];
    const costByTrace = new Map<string, number>();
    const modelByTrace = new Map<string, string>();
    if (traceIds.length > 0) {
      const { data: ev } = await supabase
        .from("ai_events")
        .select("trace_id,model,est_cost_usd")
        .in("trace_id", traceIds)
        .limit(500);
      for (const e of (ev ?? []) as {
        trace_id: string | null;
        model: string;
        est_cost_usd: number | null;
      }[]) {
        if (!e.trace_id) continue;
        costByTrace.set(
          e.trace_id,
          (costByTrace.get(e.trace_id) ?? 0) + Number(e.est_cost_usd || 0),
        );
        if (!modelByTrace.has(e.trace_id)) modelByTrace.set(e.trace_id, e.model);
      }
    }
    const enrichedApprovals: NeedsYou["approvals"] = approvalRows.map(({ mission_id, ...a }) => ({
      ...a,
      missionId: mission_id,
      model: a.trace_id ? (modelByTrace.get(a.trace_id) ?? null) : null,
      est_cost_usd:
        a.trace_id && costByTrace.has(a.trace_id) ? (costByTrace.get(a.trace_id) ?? null) : null,
    }));

    // FS-02: hydrate each open challenge with the assumption's statement, the
    // decision it stands under, and a short line naming the contradicting
    // signal/learning — one batched round trip per kind, best-effort (a
    // challenge that fails to hydrate is dropped, never shown half-blank).
    const challengeRows = (challenges.data ?? []) as {
      id: string;
      assumption_id: string;
      signal_id: string | null;
      learning_id: string | null;
      rationale: string;
      created_at: string;
    }[];
    let assumptionCalls: NeedsYou["assumptionCalls"] = [];
    if (challengeRows.length > 0) {
      const assumptionIds = [...new Set(challengeRows.map((c) => c.assumption_id))];
      const { data: assumptionRows } = await supabase
        .from("assumptions")
        .select("id,statement,decision_id,prd_id")
        .in("id", assumptionIds);
      const assumptionById = new Map(
        (
          (assumptionRows ?? []) as {
            id: string;
            statement: string;
            decision_id: string | null;
            prd_id: string | null;
          }[]
        ).map((a) => [a.id, a]),
      );
      const decisionIds = [
        ...new Set(
          [...assumptionById.values()].map((a) => a.decision_id).filter((x): x is string => !!x),
        ),
      ];
      // CNV-02: an unverifiable spec clause files as an assumption with no
      // decision_id (prd_id instead) — source both so the Today card names
      // the right origin ("A past decision" vs "A spec") instead of guessing.
      const prdIds = [
        ...new Set(
          [...assumptionById.values()].map((a) => a.prd_id).filter((x): x is string => !!x),
        ),
      ];
      const [decisionRows, prdRows] = await Promise.all([
        decisionIds.length
          ? supabase.from("decisions").select("id,title").in("id", decisionIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
        prdIds.length
          ? supabase.from("prds").select("id,title").in("id", prdIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      ]);
      const decisionTitleById = new Map(
        ((decisionRows.data ?? []) as { id: string; title: string }[]).map((d) => [d.id, d.title]),
      );
      const prdTitleById = new Map(
        ((prdRows.data ?? []) as { id: string; title: string }[]).map((p) => [p.id, p.title]),
      );

      const signalIds = [
        ...new Set(challengeRows.map((c) => c.signal_id).filter((x): x is string => !!x)),
      ];
      const learningIds = [
        ...new Set(challengeRows.map((c) => c.learning_id).filter((x): x is string => !!x)),
      ];
      const [signalRows, learningRows] = await Promise.all([
        signalIds.length
          ? supabase.from("signals").select("id,title,content").in("id", signalIds)
          : Promise.resolve({
              data: [] as { id: string; title: string | null; content: string }[],
            }),
        learningIds.length
          ? supabase.from("learnings").select("id,summary").in("id", learningIds)
          : Promise.resolve({ data: [] as { id: string; summary: string }[] }),
      ]);
      const evidenceTextById = new Map<string, string>();
      for (const s of (signalRows.data ?? []) as {
        id: string;
        title: string | null;
        content: string;
      }[]) {
        evidenceTextById.set(s.id, s.title || s.content.slice(0, 140));
      }
      for (const l of (learningRows.data ?? []) as { id: string; summary: string }[]) {
        evidenceTextById.set(l.id, l.summary.slice(0, 140));
      }

      assumptionCalls = challengeRows
        .map((c) => {
          const assumption = assumptionById.get(c.assumption_id);
          if (!assumption) return null;
          const decisionTitle = assumption.decision_id
            ? (decisionTitleById.get(assumption.decision_id) ?? "A past decision")
            : assumption.prd_id
              ? `Spec: ${prdTitleById.get(assumption.prd_id) ?? "a spec"}`
              : "A past decision";
          const evidenceId = c.signal_id ?? c.learning_id;
          return {
            id: c.id,
            decisionTitle,
            assumptionStatement: assumption.statement,
            rationale: c.rationale,
            evidenceText: evidenceId ? (evidenceTextById.get(evidenceId) ?? null) : null,
            created_at: c.created_at,
          };
        })
        .filter((c): c is NeedsYou["assumptionCalls"][number] => c !== null);
    }

    // SW-3 (mission 3.8b): proposal rows -> queue calls, provenance count riding
    // along (the body already quotes the learnings verbatim).
    const playbookCalls: NeedsYou["playbookCalls"] = (
      (proposals.data ?? []) as {
        id: string;
        title: string;
        body: string;
        created_at: string;
        source_learning_ids: string[] | null;
      }[]
    ).map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      created_at: p.created_at,
      sourceCount: p.source_learning_ids?.length ?? 0,
    }));

    // The pinned first teardown: verdict word, top risk, confidence — the
    // judgment lane's anchor card until the human answers it (Keep/Share).
    const ftRow = firstTd.data as {
      id: string;
      title: string;
      critic_review: unknown;
      created_at: string;
    } | null;
    const ftReview = parseCriticReview(ftRow?.critic_review);
    const firstTeardown: NeedsYou["firstTeardown"] =
      ftRow && ftReview
        ? {
            id: ftRow.id,
            title: ftRow.title,
            verdict: ftReview.verdict,
            summary: ftReview.summary ?? "",
            topRisk: ftReview.risks?.[0] ?? null,
            confidence: typeof ftReview.confidence === "number" ? ftReview.confidence : null,
            created_at: ftRow.created_at,
          }
        : null;

    return {
      approvals: enrichedApprovals,
      expiredApprovals: (expiredRows.data ?? []) as NeedsYou["expiredApprovals"],
      prdCalls: (prds.data ?? []) as NeedsYou["prdCalls"],
      oppCalls: (opps.data ?? []) as NeedsYou["oppCalls"],
      assumptionCalls,
      playbookCalls,
      designGateCalls: (designGatePrds.data ?? []) as NeedsYou["designGateCalls"],
      firstTeardown,
      spendTodayUsd,
      gateMedianMinutes,
      counts,
    };
  });

const SnoozeApprovalSchema = z.object({
  approvalId: z.string().uuid(),
  hours: z.number().int().min(1).max(168).default(24),
});

/**
 * The honest "Later" verb on a live gate (stage-events foundations,
 * 20260707190000): set agent_approvals.snoozed_until so the call leaves the
 * needs-you queue for N hours, then returns on its own. Pending gates only,
 * scoped to the caller. The expiry window keeps running — a snooze never
 * extends the gate.
 */
export const snoozeApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SnoozeApprovalSchema>) => SnoozeApprovalSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const snoozedUntil = new Date(Date.now() + data.hours * 60 * 60 * 1000).toISOString();
    // snoozed_until postdates the generated Supabase types (structural cast).
    const { error } = await (supabase as unknown as SupabaseClient)
      .from("agent_approvals")
      .update({ snoozed_until: snoozedUntil })
      .eq("id", data.approvalId)
      .eq("user_id", userId)
      .eq("escalation_state", "pending");
    if (error) throw new Error(error.message);
    return { snoozed_until: snoozedUntil };
  });

/**
 * Cold-start gate (v6 Phase 0 / W4). A workspace is "cold" when it has no
 * signals, opportunities, or specs yet — the agents have nothing to work from.
 * This is REAL emptiness, distinct from an all-clear queue (data exists, no
 * pending calls). Today shows the narrated on-ramp only when isCold is true, so
 * the seeded demo workspace never sees it. Cheap head-count queries (no rows
 * fetched); RLS scopes to the caller.
 */
export const getColdStart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isCold: boolean }> => {
    const { supabase, userId } = context;
    const [sig, opp, prd] = await Promise.all([
      supabase.from("signals").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase.from("prds").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);
    const total = (sig.count ?? 0) + (opp.count ?? 0) + (prd.count ?? 0);
    return { isCold: total === 0 };
  });

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// M-A Slice 2: "Executed unattended" Today card.
//
// What the loop ran on its OWN (no human gate). The honest source is tool_calls:
// every tool_calls row is an inline auto-mode execution (gated tools queue an
// agent_approvals row instead), so a SUCCESSFUL (ok=true) SIDE-EFFECTING one is a
// write the agent's trust arc carried without your call. We do NOT read
// agent_approvals(status='executed'): those are calls YOU approved, not
// unattended. Effect, reversibility, and how-to-reverse come from the static
// tool-consequences catalogue (never the model), so the claim never outruns the
// wiring; there is deliberately no "undo" action (no compensating-call flow
// exists yet, and a fake one on an already-done side effect would be dishonest),
// only the honest reverse-path text per tool, surfaced by the card.

export type ExecutedUnattended = {
  tool_name: string;
  /** Display name of the agent that ran it, or null if not resolvable. */
  agent_name: string | null;
  created_at: string;
  latency_ms: number | null;
};

export const getRecentExecutedUnattended = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ runs: ExecutedUnattended[] }> => {
    const { supabase, userId } = context;
    const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await supabase
      .from("tool_calls")
      .select("tool_name,agent_id,created_at,latency_ms")
      .eq("user_id", userId)
      .eq("ok", true) // successful inline executions only (a failed attempt did not carry the work)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    // Side-effecting only = the writes the loop carried unattended (read tools run
    // inline too but are not delegation).
    //
    // For three days this card was wrong and said nothing about it. Between
    // 2026-08-19 and 2026-08-22 `isSideEffectingTool` was catalogue membership,
    // the catalogue covered all 59 registry tools, and so every read the loop had
    // run — a repo.read, a web.search — was rendered here as work carried
    // unattended. The predicate now answers from the registry's `category`, so
    // the six rows below are writes again.
    const sideEffecting = (
      (rows ?? []) as {
        tool_name: string;
        agent_id: string | null;
        created_at: string;
        latency_ms: number | null;
      }[]
    )
      .filter((r) => isSideEffectingTool(r.tool_name))
      .slice(0, 6);

    // Batched agent-name lookup; best-effort (degrade to null, never block the card).
    const agentIds = [
      ...new Set(sideEffecting.map((r) => r.agent_id).filter((x): x is string => !!x)),
    ];
    const nameById = new Map<string, string>();
    if (agentIds.length > 0) {
      const { data: agents } = await supabase
        .from("agents")
        .select("id,name")
        .in("id", agentIds)
        .limit(50);
      for (const a of (agents ?? []) as { id: string; name: string }[]) nameById.set(a.id, a.name);
    }

    return {
      runs: sideEffecting.map((r) => ({
        tool_name: r.tool_name,
        agent_name: r.agent_id ? (nameById.get(r.agent_id) ?? null) : null,
        created_at: r.created_at,
        latency_ms: r.latency_ms,
      })),
    };
  });

// MOAT-VIS — make the compounding visible. The outcome loop (recordOutcome) writes
// a `learnings` row carrying prior_ice/new_ice + the verdict that moved the score.
// This is the canonical rescore-cause read that both Today's "what changed" card and
// the Brain's Learnings tab consume, so the compounding story has one source of truth
// (the pure summarizer in moat-vis.ts). RLS-scoped via the authed client; fail-safe.

export type CompoundingResult = {
  /** Newest-first, capped; each rescore carries its cause (verdict + summary). */
  rescores: Rescore[];
  summary: CompoundingSummary;
  /**
   * How many of these learnings came from a SEEDED bet rather than the user's
   * own work, and the total they are counted against.
   *
   * Workspace scoping stops one workspace's outcomes appearing under another's
   * heading, but it cannot help here: onboarding seeds artifacts into the
   * user's REAL workspace, so a young real workspace legitimately contains
   * sample-derived learnings. A compounding claim built on those is the
   * `the-brain-does-not-rank-fiction` defect wearing a different hat.
   *
   * DERIVED, NOT STORED. `learnings` carries no `is_sample` column, but every
   * learning points at an opportunity and `opportunities.is_sample` exists. So
   * this is read through the link rather than invented, and a learning whose
   * opportunity cannot be read counts as NOT sample, which is the conservative
   * direction: it under-reports the warning rather than labelling a user's own
   * outcome an example.
   *
   * `agent_memory` deliberately has no equivalent. It carries neither an
   * `is_sample` column nor any artifact reference, so there is nothing to
   * derive from and inventing one would be a guess presented as provenance.
   */
  sampleDerived: number;
  total: number;
};

/**
 * CROSS-WORKSPACE LEAK ON THE ONE SURFACE THAT CARRIES THE MOAT CLAIM.
 *
 * This read took no workspace argument at all. `learnings` RLS is
 * `user_id = auth.uid() OR is_workspace_member(workspace_id)`, which is
 * MEMBERSHIP and not the ACTIVE workspace, so it returned learnings from every
 * workspace the caller belongs to and Brain's headline counted all of them.
 *
 * Measured 2026-08-10: 5 users belong to more than one workspace and 4 of
 * those are members of a seeded Helio demo workspace. One real account sees 21
 * learnings of which 5 are demo, so "Real outcomes have re-scored N calls" was
 * inflated by roughly a quarter with fiction, rendered directly above a
 * sub-line whose counts ARE workspace-scoped. Two scopes in one paragraph,
 * with nothing marking which was which.
 *
 * That is worse than an empty state and worse than a wrong number: it is a
 * specific, believable claim about compounding that the user cannot audit.
 *
 * `workspaceId` is OPTIONAL so the existing unscoped call keeps working, but
 * every caller on a workspace-scoped surface must pass it. Zero rows in
 * `learnings` carry a null workspace, so the filter hides nothing when given.
 */
export const getCompounding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ workspaceId: z.string().uuid().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data: input }): Promise<CompoundingResult> => {
    const db = context.supabase as unknown as SupabaseClient;
    let q = db
      .from("learnings")
      .select(
        "id, verdict, summary, prior_ice, new_ice, created_at, opportunity:opportunities(title,is_sample)",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (input.workspaceId) q = q.eq("workspace_id", input.workspaceId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);

    // Flatten the to-one opportunity embed (PostgREST may widen it to an array),
    // mirroring listLearnings so the wire shape stays flat + back-compatible.
    type Wire = {
      id: string;
      verdict: "validated" | "missed" | "mixed";
      summary: string;
      prior_ice: number | string | null;
      new_ice: number | string | null;
      created_at: string;
      opportunity:
        | { title: string | null; is_sample?: boolean | null }
        | { title: string | null; is_sample?: boolean | null }[]
        | null;
    };
    let sampleDerived = 0;
    const learnings: CompoundingLearning[] = ((data ?? []) as Wire[]).map(
      ({ opportunity, ...rest }) => {
        const opp = Array.isArray(opportunity) ? opportunity[0] : opportunity;
        // `=== true` on purpose: a null or unreadable opportunity counts as NOT
        // a sample. That under-reports the warning rather than labelling a
        // user's own outcome an example, which is the error worth avoiding.
        if (opp?.is_sample === true) sampleDerived++;
        return { ...rest, opportunity_title: opp?.title ?? null };
      },
    );

    // One pure path feeds both halves so the feed and the summary never drift: the
    // query is created_at desc, so rescoresOf preserves newest-first ordering.
    const rescores = rescoresOf(learnings);
    const summary = summarizeCompounding(learnings);
    return { rescores, summary, sampleDerived, total: learnings.length };
  });

// ─────────────────────────────────────────────────────────────────────────────
// PLG Phase 3 — memory-retention upgrade nudge (getMemoryExpiry).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a workspace's plan tier: the account's plan wins, falling back to the
 * workspace `plan_tier` shim, then free. Pre-migration tolerant. (A minimal, read-
 * only mirror of limits.functions.ts' private resolver — duplicated rather than
 * exported across a server-fn boundary to keep each module self-contained.)
 */
async function resolveTier(supabase: SupabaseClient, workspaceId: string): Promise<PlanTier> {
  let tier: PlanTier = "free";
  let accountId: string | null = null;
  try {
    const { data: ws, error } = await supabase
      .from("workspaces")
      .select("plan_tier,account_id")
      .eq("id", workspaceId)
      .maybeSingle();
    if (error) throw error;
    const w = (ws ?? {}) as { plan_tier?: string | null; account_id?: string | null };
    tier = normalizePlanTier(w.plan_tier);
    accountId = w.account_id ?? null;
  } catch {
    try {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("plan_tier")
        .eq("id", workspaceId)
        .maybeSingle();
      tier = normalizePlanTier((ws as { plan_tier?: string | null } | null)?.plan_tier);
    } catch (e) {
      // Both reads failed: a real DB error, so the tier is unknown, not free.
      // Log and rethrow — getMemoryExpiry's outer catch returns the non-showing
      // state, so a paid account never sees a false upgrade nudge (LOOM W4).
      console.error("today/resolveTier: workspace tier read failed", e);
      throw e;
    }
  }
  if (accountId) {
    try {
      const { data: acct } = await supabase
        .from("accounts")
        .select("plan_tier")
        .eq("id", accountId)
        .maybeSingle();
      const a = (acct ?? {}) as { plan_tier?: string | null };
      if (a.plan_tier != null) tier = normalizePlanTier(a.plan_tier);
    } catch (e) {
      // account row not readable yet; keep the workspace/free tier (logged so
      // a real read failure is visible instead of silent).
      console.warn("today/resolveTier: account tier read failed, using workspace shim", e);
    }
  }
  return tier;
}

/**
 * PLG: the memory-retention nudge state for the active workspace. Free plans keep
 * decision memory on a rolling window then it fades; this surfaces the upgrade
 * value when the workspace's own memory nears that window. Paid plans always read
 * `show:false`. RLS-scoped (the authed client only sees the caller's memory) and
 * fail-safe — any error returns a non-showing state so it can never break Today.
 */
export const getMemoryExpiry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(i ?? {}))
  .handler(async ({ context, data }): Promise<MemoryExpiryState> => {
    const supabase = context.supabase as unknown as SupabaseClient;
    try {
      const tier = await resolveTier(supabase, data.workspaceId);
      const retentionDays = entitlementsFor(tier).memoryRetentionDays;
      // Paid: short-circuit before any memory read (memory never fades).
      if (retentionDays === null) {
        return { show: false, total: 0, retentionDays: null, expiringCount: 0, soonestDays: null };
      }
      const { data: rows } = await supabase
        .from("agent_memory")
        .select("created_at,expires_at")
        .eq("workspace_id", data.workspaceId)
        .limit(2000);
      return assessMemoryExpiry({
        memories: (rows ?? []) as { created_at: string | null; expires_at: string | null }[],
        retentionDays,
        nowMs: Date.now(),
      });
    } catch {
      return { show: false, total: 0, retentionDays: null, expiringCount: 0, soonestDays: null };
    }
  });
