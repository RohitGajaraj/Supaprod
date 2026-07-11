/**
 * Stakeholder status update server function (PM-STATUS-UPDATE).
 *
 * Gathers a snapshot of live product state in one batched, RLS-scoped round-trip and composes
 * it (via the pure buildStakeholderUpdate) into a paste-ready update. Read-only + fail-safe:
 * any single read that errors degrades to its empty/neutral value rather than failing the whole
 * update. Scope mirrors the Today surface (user-scoped via RLS); the workspace name is passed
 * from the client purely for the headline.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildStakeholderUpdate,
  type StakeholderUpdateResult,
  type OutcomeReceiptSnapshot,
} from "./stakeholder-update";

const InputSchema = z.object({ workspaceName: z.string().nullable().optional() });

/** acceptance window (days) -- matches gauntlet.getAcceptanceRate so the figure never diverges. */
const ACCEPTANCE_DAYS = 14;
/** outcome-accuracy window (days) -- matches gauntlet.getOutcomeAccuracy. */
const ACCURACY_DAYS = 90;
/** the period the Shipped / spend figures cover. */
const PERIOD_DAYS = 7;

const pct = (num: number, den: number): number | null =>
  den > 0 ? Math.round((num / den) * 100) : null;

type TaskLite = { is_deep_work: boolean | null; status: string | null };
type LatestOutcomeRow = {
  verdict: string | null;
  opportunity: { title: string | null } | { title: string | null }[] | null;
};

// PURE row -> figure derivations, shared by getStakeholderUpdate (session/RLS path) and
// loadOutcomeReceiptSnapshot (admin-client cron path) so the two never diverge on how a raw
// row becomes a receipt figure.

/** Deep-work tasks that reached done (the "shipped" figure). */
function deriveShipped(tasks: TaskLite[]): number {
  return tasks.filter((t) => t.is_deep_work && t.status === "done").length;
}

/** The newest reviewed outcome as { title, verdict }, tolerant of the join's to-one/array shapes. */
function deriveLatestOutcome(rows: LatestOutcomeRow[]): { title: string; verdict: string } | null {
  const latestRow = rows[0];
  if (!latestRow) return null;
  const opp = latestRow.opportunity;
  const title = (Array.isArray(opp) ? opp[0]?.title : opp?.title)?.trim();
  if (title && latestRow.verdict) return { title, verdict: latestRow.verdict };
  return null;
}

/** Validated share of reviewed bets (0..100), or null when there are none. */
function deriveOutcomeAccuracy(rows: { verdict: string | null }[]): number | null {
  const validated = rows.filter((l) => l.verdict === "validated").length;
  return pct(validated, rows.length);
}

/**
 * RPT-49: admin-safe loader for the outcome-receipt figures that LEAD the ambient stakeholder
 * digest. Mirrors the figures getStakeholderUpdate composes, but with EXPLICIT workspace_id /
 * user_id filters because it runs under the digest cron's service-role admin client, where
 * auth.uid() is null and RLS cannot scope on its own (the same service-role-vs-session-context
 * class of bug already fixed for ai_events). Same helper shape as loadNewestDecisionBrief.
 *
 * Scoping mirrors getStakeholderUpdate's live semantics: tasks + learnings are workspace-membership
 * RLS-keyed, so they are scoped by workspace_id here; decisions (agent_approvals) are user-scoped in
 * the per-user email path (userId set) and workspace-scoped for the shared Slack channel (userId
 * null). Every read is fail-safe: an errored query degrades to its empty/neutral figure, never
 * throwing, so a quiet or misconfigured workspace can never break the digest cron.
 */
export async function loadOutcomeReceiptSnapshot(
  supabase: SupabaseClient,
  userId: string | null,
  workspaceId: string,
): Promise<OutcomeReceiptSnapshot> {
  const now = Date.now();
  const sevenAgo = new Date(now - PERIOD_DAYS * 86_400_000).toISOString();
  const ninetyAgo = new Date(now - ACCURACY_DAYS * 86_400_000).toISOString();

  let decidedQuery = supabase
    .from("agent_approvals")
    .select("id")
    .eq("workspace_id", workspaceId)
    .not("decided_at", "is", null)
    .gte("decided_at", sevenAgo)
    .limit(1000);
  if (userId) decidedQuery = decidedQuery.eq("user_id", userId);

  const [tasksRes, decidedRes, latestRes, accuracyRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("is_deep_work,status")
      .eq("workspace_id", workspaceId)
      .gte("created_at", sevenAgo)
      .limit(1000),
    decidedQuery,
    supabase
      .from("learnings")
      .select("verdict,created_at,opportunity:opportunities(title)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("learnings")
      .select("verdict")
      .eq("workspace_id", workspaceId)
      .in("verdict", ["validated", "missed", "mixed"])
      .gte("created_at", ninetyAgo)
      .limit(2000),
  ]);

  return {
    shipped: deriveShipped((tasksRes.data ?? []) as TaskLite[]),
    decisions: (decidedRes.data ?? []).length,
    latestOutcome: deriveLatestOutcome((latestRes.data ?? []) as LatestOutcomeRow[]),
    outcomeAccuracyPct: deriveOutcomeAccuracy(
      (accuracyRes.data ?? []) as { verdict: string | null }[],
    ),
  };
}

export const getStakeholderUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => InputSchema.parse(i ?? {}))
  .handler(async ({ context, data }): Promise<StakeholderUpdateResult> => {
    const { supabase, userId } = context;
    const now = Date.now();
    const sevenAgo = new Date(now - PERIOD_DAYS * 86_400_000).toISOString();
    const fourteenAgo = new Date(now - ACCEPTANCE_DAYS * 86_400_000).toISOString();
    const ninetyAgo = new Date(now - ACCURACY_DAYS * 86_400_000).toISOString();

    const [
      tasksRes,
      decidedRes,
      validatedRes,
      latestRes,
      missionsRes,
      nextRes,
      apprPendingRes,
      prdReviewRes,
      oppCallRes,
      spendRes,
      acceptRes,
      accuracyRes,
      profileRes,
    ] = await Promise.all([
      supabase
        .from("tasks")
        .select("is_deep_work,status,created_at")
        .gte("created_at", sevenAgo)
        .limit(1000),
      supabase
        .from("agent_approvals")
        .select("id")
        .eq("user_id", userId)
        .not("decided_at", "is", null)
        .gte("decided_at", sevenAgo)
        .limit(1000),
      supabase
        .from("learnings")
        .select("id")
        .eq("verdict", "validated")
        .gte("created_at", sevenAgo)
        .limit(1000),
      supabase
        .from("learnings")
        .select("verdict,created_at,opportunity:opportunities(title)")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("missions")
        .select("title,status,updated_at")
        .in("status", ["running", "in_progress"])
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("opportunities")
        .select("title,ice_score,roadmap_bucket,status")
        .in("roadmap_bucket", ["now", "next"])
        .not("status", "in", "(shipped,dropped)")
        .order("ice_score", { ascending: false })
        .limit(5),
      supabase
        .from("agent_approvals")
        .select("id")
        .eq("user_id", userId)
        .in("escalation_state", ["pending", "expired"])
        .limit(1000),
      supabase.from("prds").select("id").eq("status", "review").limit(1000),
      supabase
        .from("opportunities")
        .select("id")
        .filter("critic_review->>verdict", "in", '("revise","kill")')
        .limit(1000),
      supabase.from("ai_events").select("est_cost_usd").gte("created_at", sevenAgo).limit(5000),
      supabase
        .from("agent_approvals")
        .select("status")
        .eq("user_id", userId)
        .not("decided_at", "is", null)
        .gte("decided_at", fourteenAgo)
        .limit(2000),
      supabase
        .from("learnings")
        .select("verdict")
        .in("verdict", ["validated", "missed", "mixed"])
        .gte("created_at", ninetyAgo)
        .limit(2000),
      // The author byline (headline + closing line), own-row RLS -- same precedent as the
      // Today brief's greeting (copilot.functions.ts).
      supabase.from("profiles").select("display_name,full_name").maybeSingle(),
    ]);

    const shipped = deriveShipped((tasksRes.data ?? []) as TaskLite[]);
    const decisions = (decidedRes.data ?? []).length;
    const validated = (validatedRes.data ?? []).length;

    // Latest reviewed outcome (best-effort; the join is to-one, shapes vary so handle both).
    const latestOutcome = deriveLatestOutcome((latestRes.data ?? []) as LatestOutcomeRow[]);

    const activeMissions = ((missionsRes.data ?? []) as { title: string | null }[])
      .map((m) => m.title?.trim())
      .filter((t): t is string => !!t);
    const upNext = ((nextRes.data ?? []) as { title: string | null; ice_score: number | null }[])
      .map((o) => ({ title: o.title?.trim() ?? "", iceScore: o.ice_score ?? null }))
      .filter((o) => o.title.length > 0);

    const needsYou =
      (apprPendingRes.data ?? []).length +
      (prdReviewRes.data ?? []).length +
      (oppCallRes.data ?? []).length;

    const spendUsd = ((spendRes.data ?? []) as { est_cost_usd: number | null }[]).reduce(
      (s, e) => s + Number(e.est_cost_usd || 0),
      0,
    );

    const profile = profileRes.data as {
      display_name: string | null;
      full_name: string | null;
    } | null;
    const authorName = profile?.display_name?.trim() || profile?.full_name?.trim() || null;

    // Acceptance (14d): approved/executed/failed are yes-decisions; rejected is the no.
    // Reads `status` (the terminal decision), matching gauntlet.getAcceptanceRate exactly so
    // the figure never diverges -- escalation_state holds pending/expired/escalated/resolved.
    const decidedStates = ((acceptRes.data ?? []) as { status: string | null }[]).map(
      (a) => a.status,
    );
    const approved = decidedStates.filter(
      (s) => s === "approved" || s === "executed" || s === "failed",
    ).length;
    const rejected = decidedStates.filter((s) => s === "rejected").length;
    const acceptancePct = pct(approved, approved + rejected);

    // Outcome accuracy (90d): validated share of reviewed bets.
    const outcomeAccuracyPct = deriveOutcomeAccuracy(
      (accuracyRes.data ?? []) as { verdict: string | null }[],
    );

    return buildStakeholderUpdate({
      periodLabel: "the last 7 days",
      workspaceName: data.workspaceName ?? null,
      authorName,
      shipped,
      decisions,
      validated,
      activeMissions,
      upNext,
      needsYou,
      // autonomy is deferred (its tool_calls side-effect classification is non-trivial); the
      // composer omits a null metric, so Health shows acceptance + accuracy + spend in v1.
      metrics: { acceptancePct, autonomyPct: null, outcomeAccuracyPct },
      spendUsd: Math.round(spendUsd * 100) / 100,
      latestOutcome,
    });
  });
