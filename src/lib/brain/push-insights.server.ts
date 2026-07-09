// SEAM-3 (mission 3.9): the insight-push detection pass. Piggybacks the
// derive-tick cadence (see src/routes/api/public/hooks/derive-tick.ts): per
// workspace it reads the real decision/lineage/queue/learning/calibration
// state, classifies the three highest-signal Brain events into push candidates
// via the pure module, applies the 3-per-day hard throttle, and persists the
// results to the insights table (pushed_at set for pushed, digest=true for the
// overflow). Deterministic end to end: zero AI spend.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  rankOpportunities,
  outcomeSupportFromCounts,
  type RankableOpportunity,
} from "@/components/discover/ranking";
import { supersedesParentMap } from "@/lib/brain-insights.functions";
import type { LineageEdgeLite } from "@/lib/trust-ledger.functions";
import {
  applyPushThrottle,
  classifyPushCandidates,
  type CalibrationMissInput,
  type LearningInput,
  type PushCandidate,
} from "@/lib/brain/push-insights";

/** Events older than this never become pushes (they are history, not news). */
const LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

type DecisionRow = {
  id: string;
  title: string;
  status: string;
  mission_id: string | null;
  prd_id: string | null;
  meeting_id: string | null;
};

export async function runInsightPush(
  supabase: SupabaseClient,
  ownerId: string,
  workspaceId: string,
): Promise<{ pushed: number; digested: number; note?: string }> {
  const now = new Date();
  const nowIso = now.toISOString();
  const dayStart = `${nowIso.slice(0, 10)}T00:00:00.000Z`;
  const sinceIso = new Date(now.getTime() - LOOKBACK_MS).toISOString();

  const [decisionsRes, lineageRes, oppsRes, themesRes, learningsRes, missesRes] = await Promise.all(
    [
      supabase
        .from("decisions")
        .select("id,title,status,mission_id,prd_id,meeting_id")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("artifact_lineage")
        .select("parent_kind,parent_id,child_kind,child_id,relation,valid_to")
        .eq("workspace_id", workspaceId)
        .limit(2000),
      supabase
        .from("opportunities")
        .select(
          "id,title,status,ice_score,confidence,impact,ease,created_at,theme_id,critic_review",
        )
        .eq("workspace_id", workspaceId)
        .limit(300),
      supabase.from("themes").select("id,frequency").eq("workspace_id", workspaceId).limit(500),
      supabase
        .from("learnings")
        .select("id,opportunity_id,verdict,summary,created_at,opportunity:opportunities(theme_id)")
        .eq("workspace_id", workspaceId)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("insights")
        .select("id,kind,claim,theme_id,resolution,resolved_at,evidence")
        .eq("workspace_id", workspaceId)
        .eq("resolution", "miss")
        .gte("resolved_at", sinceIso)
        .limit(50),
    ],
  );

  // Pre-valid_to lineage schemas: refetch without the column rather than erroring out.
  let edges = (lineageRes.data ?? []) as unknown as LineageEdgeLite[];
  const lineageErr = (lineageRes.error?.message ?? "").toLowerCase();
  if (
    lineageRes.error &&
    lineageErr.includes("does not exist") &&
    lineageErr.includes("valid_to")
  ) {
    const retry = await supabase
      .from("artifact_lineage")
      .select("parent_kind,parent_id,child_kind,child_id,relation")
      .eq("workspace_id", workspaceId)
      .limit(2000);
    edges = (retry.data ?? []) as unknown as LineageEdgeLite[];
  }
  const superseded = supersedesParentMap(edges);

  // Live decisions: pending/approved filtering happens in the pure detector; the
  // full set is fetched so the superseding decision's title is resolvable too.
  const decisionRows = (decisionsRes.data ?? []) as DecisionRow[];
  const titleById = new Map(decisionRows.map((d) => [d.id, d.title]));

  // A decision whose linked PRD already shipped is history, not a live call.
  const prdIds = [...new Set(decisionRows.map((d) => d.prd_id).filter((x): x is string => !!x))];
  const shippedPrds = new Set<string>();
  if (prdIds.length > 0) {
    const { data: prds } = await supabase.from("prds").select("id,status").in("id", prdIds);
    for (const p of (prds ?? []) as Array<{ id: string; status: string | null }>) {
      if ((p.status ?? "") === "shipped") shippedPrds.add(p.id);
    }
  }
  const decisions = decisionRows.map((d) => ({
    ...d,
    prdShipped: !!d.prd_id && shippedPrds.has(d.prd_id),
  }));

  // The best bet is rank 1 of the same deterministic order the Discover queue
  // renders (rankOpportunities + theme-frequency corroboration), computed here
  // server-side because designations are never persisted.
  const oppRows = (oppsRes.data ?? []) as Array<RankableOpportunity & { title?: string | null }>;
  const freqByTheme = new Map(
    ((themesRes.data ?? []) as Array<{ id: string; frequency: number | null }>).map((t) => [
      t.id,
      t.frequency ?? 0,
    ]),
  );
  // The reinforcement seam, server-side twin of the Discover queue's map:
  // decisive recorded outcomes per theme (validated lifts, missed sinks,
  // capped in outcomeSupportFromCounts) so the best bet the judgment lane
  // pushes is informed by what actually happened, not just scores.
  const supportCounts = new Map<string, { validated: number; missed: number }>();
  for (const l of (learningsRes.data ?? []) as Array<{
    verdict: string | null;
    opportunity: { theme_id: string | null } | { theme_id: string | null }[] | null;
  }>) {
    const opp = Array.isArray(l.opportunity) ? l.opportunity[0] : l.opportunity;
    const themeId = opp?.theme_id ?? null;
    if (!themeId) continue;
    if (l.verdict !== "validated" && l.verdict !== "missed") continue;
    const c = supportCounts.get(themeId) ?? { validated: 0, missed: 0 };
    if (l.verdict === "validated") c.validated += 1;
    else c.missed += 1;
    supportCounts.set(themeId, c);
  }
  const supportByTheme = new Map(
    [...supportCounts].map(([themeId, c]) => [
      themeId,
      outcomeSupportFromCounts(c.validated, c.missed),
    ]),
  );

  const ranked = rankOpportunities(
    oppRows,
    (o) => (o.theme_id ? (freqByTheme.get(o.theme_id) ?? 0) : 0),
    (o) => (o.theme_id ? (supportByTheme.get(o.theme_id) ?? 0) : 0),
  );
  const top = ranked[0]?.opp ?? null;
  const bestBet = top ? { id: top.id, title: String(top.title ?? "this bet") } : null;

  const candidates = classifyPushCandidates({
    decisions,
    superseded,
    decisionTitleById: titleById,
    bestBet,
    learnings: (learningsRes.data ?? []) as LearningInput[],
    calibrationRows: (missesRes.data ?? []) as CalibrationMissInput[],
    missesSinceIso: sinceIso,
  });
  if (candidates.length === 0) return { pushed: 0, digested: 0 };

  // Event-scoped dedup: a candidate whose key was ever stored (pushed OR
  // digested) never fires again.
  const keys = candidates.map((c) => c.dedupKey);
  const { data: existing } = await supabase
    .from("insights")
    .select("dedup_key")
    .eq("workspace_id", workspaceId)
    .in("dedup_key", keys);
  const seen = new Set(
    ((existing ?? []) as Array<{ dedup_key: string | null }>).map((r) => r.dedup_key ?? ""),
  );
  const fresh = candidates.filter((c) => !seen.has(c.dedupKey));
  if (fresh.length === 0) return { pushed: 0, digested: 0 };

  // Hard throttle: count what already pushed today, fill the remaining slots.
  const counted = await supabase
    .from("insights")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("digest", false)
    .gte("pushed_at", dayStart);
  if (counted.error) {
    // Push fields not migrated yet: the channel is dormant, not broken.
    return { pushed: 0, digested: 0, note: "push fields not migrated yet" };
  }
  const { push, digest } = applyPushThrottle(fresh, counted.count ?? 0);

  const toRow = (c: PushCandidate, pushedNow: boolean) => ({
    user_id: ownerId,
    workspace_id: workspaceId,
    theme_id: c.themeId,
    kind: c.kind,
    headline: c.title,
    detail: c.body,
    evidence: c.evidence,
    push_action: c.action,
    status: "open",
    dedup_key: c.dedupKey,
    digest: !pushedNow,
    pushed_at: pushedNow ? nowIso : null,
  });
  const rows = [...push.map((c) => toRow(c, true)), ...digest.map((c) => toRow(c, false))];
  const { error: insertError } = await supabase.from("insights").insert(rows);
  if (insertError) return { pushed: 0, digested: 0, note: insertError.message };

  return { pushed: push.length, digested: digest.length };
}
