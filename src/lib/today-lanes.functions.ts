/**
 * SW-5 (mission 3.11) — Today's four-lane content model. This is an
 * INFORMATION-ARCHITECTURE change, not a restyle: Today is re-cut into exactly
 * four lanes, each computed and grouped from REAL rows, answering the founder's
 * verdict that the old surface was "a data dump ... not properly segregated":
 *
 *   Lane 1  Needs your judgment      — pushed Brain insights that want a call.
 *                                       (Approval gates render from getNeedsYou;
 *                                        this lane adds the pushed-insight half.)
 *   Lane 2  What the swarm did       — recent stage transitions grouped by the
 *                                       mission (goal/title) that moved, with cost.
 *   Lane 3  At risk / watch          — open foresight predictions + risks,
 *                                       calibration misses, and live assumption
 *                                       challenges.
 *   Lane 4  Shipped and what it cost — closed outcomes (learnings) with the real
 *                                       per-mission spend and an average.
 *
 * Every query is workspace-scoped through `current_user_default_workspace`
 * (the resolver getInsightRail / getCostPerOutcome use) and degrades calm
 * (empty lanes, never a throw) when there is no workspace yet. Columns added by
 * migration 20260707190000 (stage_events, learnings.mission_id) postdate the
 * generated Supabase types, so we read through an untyped client — the
 * documented precedent in resolve.server.ts / today.functions.ts.
 *
 * The pure mappers (mapVerdict, insightToWatchItem, groupMissionEvents,
 * assembleLane4) are exported and unit-tested in today-lanes.test.ts.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";

// ---------------------------------------------------------------------------
// Public lane shapes (render-ready)
// ---------------------------------------------------------------------------

/** Lane 1: a Brain insight pushed into the judgment lane. */
export type PushedInsight = {
  id: string;
  kind: string;
  headline: string;
  detail: string;
  /**
   * The one-click action. Seam-3 push rows carry push_action
   * {label, kind, targetId} (kinds: open_decision | rerank_bets |
   * review_assumption); older scored insights carry recommended_action
   * {agent_slug, goal}. Both shapes render.
   */
  action: {
    agent_slug?: string;
    goal?: string;
    label?: string;
    kind?: string;
    targetId?: string;
  } | null;
  score: number | null;
};
export type TodayLane1 = { insights: PushedInsight[]; count: number };

/** Lane 2: one group per mission that moved, with the transitions and its spend. */
export type SwarmActivityItem = {
  id: string;
  entity_type: string;
  label: string;
  stage: string;
  at: string;
  /** stage_events.actor: 'human', an agent slug, or 'system'. Carried so the
   * receipts strip can byline WHO moved the thing (PC-32 block 4). */
  actor: string | null;
};
export type SwarmActivityGroup = {
  /** mission id, or "unassigned" for non-mission transitions. */
  key: string;
  goal: string | null;
  title: string;
  count: number;
  cost_usd: number;
  items: SwarmActivityItem[];
};
export type TodayLane2 = {
  /** Hard-capped server-side (PC-32): top missions by recency, never the
   * full 24h group list. */
  groups: SwarmActivityGroup[];
  /** True group count before the cap, so the fold line never understates. */
  groups_total: number;
  /** Total transitions in the window (bounded by the event fetch cap). */
  acts_total: number;
  since_iso: string;
  total_cost_usd: number;
};

/** Lane 3: a thing to watch — a live prediction/risk, a calibration miss, or a
 * challenged assumption. */
export type WatchItem = {
  id: string;
  type: "prediction_risk" | "calibration_miss" | "assumption_challenge";
  title: string;
  description: string;
  recommendation: string | null;
  confidence: number | null;
};
export type TodayLane3 = { items: WatchItem[]; count: number };

/** Lane 4: a shipped outcome with its real cost. */
export type ShippedOutcome = {
  id: string;
  title: string;
  verdict: "achieved" | "partial" | "missed";
  spent_usd: number;
  metric_label: string | null;
  metric_value: number | null;
  at: string;
};
export type TodayLane4 = {
  items: ShippedOutcome[];
  shipped_count: number;
  avg_cost_per_outcome_usd: number;
  week_spend_usd: number;
};

export type TodayLanes = {
  lane1: TodayLane1;
  lane2: TodayLane2;
  lane3: TodayLane3;
  lane4: TodayLane4;
};

export const EMPTY_TODAY_LANES: TodayLanes = {
  lane1: { insights: [], count: 0 },
  lane2: {
    groups: [],
    groups_total: 0,
    acts_total: 0,
    since_iso: new Date(0).toISOString(),
    total_cost_usd: 0,
  },
  lane3: { items: [], count: 0 },
  lane4: { items: [], shipped_count: 0, avg_cost_per_outcome_usd: 0, week_spend_usd: 0 },
};

// ---------------------------------------------------------------------------
// Pure mappers (unit-tested, no DB) — the "functional, not fabricated" core
// ---------------------------------------------------------------------------

/** learnings.verdict is validated | missed | mixed (the real enum, NOT the MVP's
 * achieved/partial/missed). Map it to the outcome the user reads. */
export function mapVerdict(verdict: string | null | undefined): ShippedOutcome["verdict"] {
  switch (verdict) {
    case "validated":
      return "achieved";
    case "missed":
      return "missed";
    case "mixed":
    default:
      return "partial";
  }
}

type InsightRow = {
  id: string;
  kind: string | null;
  headline: string | null;
  detail: string | null;
  claim: string | null;
  recommended_action: unknown;
  score: number | null;
  confidence: number | null;
  resolution: string | null;
};

/** An open prediction/risk insight → a Lane-3 watch item. */
export function insightToWatchItem(row: InsightRow): WatchItem {
  const action = row.recommended_action as { goal?: string } | null;
  return {
    id: row.id,
    type: row.resolution === "miss" ? "calibration_miss" : "prediction_risk",
    title: row.headline ?? row.claim ?? "Untitled signal",
    description: row.detail ?? row.claim ?? "",
    recommendation: action?.goal ?? null,
    confidence: row.confidence ?? row.score ?? null,
  };
}

type StageEventRow = {
  entity_type: string;
  entity_id: string;
  to_stage: string;
  at: string;
  actor?: string | null;
};

/** Group mission transitions under the mission that moved, folding every
 * non-mission transition under a single "Other activity" group. Titles/goals
 * are supplied by `missionMeta` (batch-loaded); cost by `missionCost`. PURE. */
export function groupMissionEvents(
  events: StageEventRow[],
  missionMeta: Map<string, { goal: string | null; title: string | null }>,
  missionCost: Map<string, number>,
): SwarmActivityGroup[] {
  const groups = new Map<string, SwarmActivityGroup>();
  const ensure = (key: string, goal: string | null, title: string): SwarmActivityGroup => {
    let g = groups.get(key);
    if (!g) {
      g = { key, goal, title, count: 0, cost_usd: missionCost.get(key) ?? 0, items: [] };
      groups.set(key, g);
    }
    return g;
  };

  for (const e of events) {
    const isMission = e.entity_type === "mission";
    const meta = isMission ? missionMeta.get(e.entity_id) : undefined;
    const key = isMission ? e.entity_id : "unassigned";
    const title = isMission ? (meta?.title ?? "Untitled mission") : "Other activity";
    const goal = isMission ? (meta?.goal ?? null) : null;
    const g = ensure(key, goal, title);
    g.count += 1;
    // Cap the visible transitions per group; the count carries the full total.
    if (g.items.length < 5) {
      g.items.push({
        id: `${e.entity_type}/${e.entity_id}/${e.at}`,
        entity_type: e.entity_type,
        label: isMission ? (meta?.title ?? "mission") : e.entity_type,
        stage: e.to_stage,
        at: e.at,
        actor: e.actor ?? null,
      });
    }
  }
  // Missions first (real work), "Other activity" last; each by recency.
  return Array.from(groups.values()).sort((a, b) => {
    if (a.key === "unassigned") return 1;
    if (b.key === "unassigned") return -1;
    const at = a.items[0]?.at ?? "";
    const bt = b.items[0]?.at ?? "";
    return bt.localeCompare(at);
  });
}

type LearningRow = {
  id: string;
  summary: string | null;
  verdict: string | null;
  metric_label: string | null;
  metric_value: number | null;
  mission_id: string | null;
  created_at: string;
};

/** Assemble Lane 4 from outcome learnings + a per-mission spend map. PURE.
 * `weekSpendUsd` is the workspace aggregate (getCostPerOutcome). The average is
 * computed from real per-mission spend where a mission is attributed; it never
 * fabricates a number, and falls back to the week aggregate only when no
 * per-mission cost is resolvable. */
export function assembleLane4(
  learnings: LearningRow[],
  missionCost: Map<string, number>,
  weekSpendUsd: number,
): TodayLane4 {
  const items: ShippedOutcome[] = learnings.map((l) => ({
    id: l.id,
    title: l.summary ?? "Unnamed outcome",
    verdict: mapVerdict(l.verdict),
    spent_usd: l.mission_id ? (missionCost.get(l.mission_id) ?? 0) : 0,
    metric_label: l.metric_label,
    metric_value: l.metric_value,
    at: l.created_at,
  }));
  const costed = items.filter((i) => i.spent_usd > 0);
  const avg =
    costed.length > 0
      ? costed.reduce((s, i) => s + i.spent_usd, 0) / costed.length
      : items.length > 0 && weekSpendUsd > 0
        ? weekSpendUsd / items.length
        : 0;
  return {
    items,
    shipped_count: items.length,
    avg_cost_per_outcome_usd: Math.round(avg * 100) / 100,
    week_spend_usd: Math.round(weekSpendUsd * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Lane queries (real data)
// ---------------------------------------------------------------------------

/** Sum agent_runs.spend_used_usd per mission_id for a set of missions. One
 * query, folded into a Map keyed by mission id. */
async function loadMissionCost(
  db: SupabaseClient,
  workspaceId: string,
  missionIds: string[],
): Promise<Map<string, number>> {
  const cost = new Map<string, number>();
  if (missionIds.length === 0) return cost;
  const { data } = await db
    .from("agent_runs")
    .select("mission_id, spend_used_usd")
    .eq("workspace_id", workspaceId)
    .in("mission_id", missionIds);
  for (const r of (data ?? []) as { mission_id: string | null; spend_used_usd: number | null }[]) {
    if (!r.mission_id) continue;
    cost.set(r.mission_id, (cost.get(r.mission_id) ?? 0) + Number(r.spend_used_usd ?? 0));
  }
  return cost;
}

/** Lane 1 — pushed Brain insights (the judgment-worthy ones: a recommended
 * next action). The gate half (approvals/specs/opps/challenges) renders from
 * getNeedsYou; this is the additive pushed-insight half. */
async function queryLane1(db: SupabaseClient, workspaceId: string): Promise<TodayLane1> {
  // SEAM-3 push channel first: rows the Brain actively pushed today
  // (pushed_at stamped, not held for the digest). These carry a one-click
  // push_action and are the mission's "pushed insight in the judgment lane".
  // Pre-migration tolerant: if 20260708091000 is not applied yet the select
  // errors on the missing column and we fall through to the scored kinds.
  const pushed: PushedInsight[] = [];
  try {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const { data: pushedRows, error } = await db
      .from("insights")
      .select("id, kind, headline, detail, push_action, score")
      .eq("workspace_id", workspaceId)
      .eq("status", "open")
      .eq("digest", false)
      .not("pushed_at", "is", null)
      .gte("pushed_at", dayStart.toISOString())
      .order("pushed_at", { ascending: false })
      .limit(3);
    if (!error) {
      for (const r of (pushedRows ?? []) as Array<{
        id: string;
        kind: string | null;
        headline: string | null;
        detail: string | null;
        push_action: unknown;
        score: number | null;
      }>) {
        pushed.push({
          id: r.id,
          kind: r.kind ?? "insight",
          headline: r.headline ?? "New insight",
          detail: r.detail ?? "",
          action:
            (r.push_action as { label?: string; kind?: string; targetId?: string } | null) ?? null,
          score: r.score,
        });
      }
    }
  } catch {
    // fall through to the scored kinds below
  }

  const remaining = Math.max(0, 4 - pushed.length);
  if (remaining === 0) return { insights: pushed, count: pushed.length };

  const { data } = await db
    .from("insights")
    .select("id, kind, headline, detail, recommended_action, score")
    .eq("workspace_id", workspaceId)
    .eq("status", "open")
    .in("kind", ["next_best_action", "hidden_connection"])
    .order("score", { ascending: false, nullsFirst: false })
    .limit(remaining);
  const rows = (data ?? []) as Array<{
    id: string;
    kind: string | null;
    headline: string | null;
    detail: string | null;
    recommended_action: unknown;
    score: number | null;
  }>;
  const insights: PushedInsight[] = [
    ...pushed,
    ...rows.map((r) => ({
      id: r.id,
      kind: r.kind ?? "insight",
      headline: r.headline ?? "New insight",
      detail: r.detail ?? "",
      action: (r.recommended_action as { agent_slug?: string; goal?: string } | null) ?? null,
      score: r.score,
    })),
  ];
  return { insights, count: insights.length };
}

/** Lane 2 — recent transitions grouped by the mission that moved, with spend. */
async function queryLane2(
  db: SupabaseClient,
  workspaceId: string,
  sinceIso: string,
): Promise<TodayLane2> {
  const { data } = await db
    .from("stage_events")
    .select("entity_type, entity_id, to_stage, at, actor")
    .eq("workspace_id", workspaceId)
    .gte("at", sinceIso)
    .order("at", { ascending: false })
    .limit(120);
  const events = (data ?? []) as StageEventRow[];

  const missionIds = Array.from(
    new Set(events.filter((e) => e.entity_type === "mission").map((e) => e.entity_id)),
  );
  const missionMeta = new Map<string, { goal: string | null; title: string | null }>();
  if (missionIds.length > 0) {
    const { data: missions } = await db
      .from("missions")
      .select("id, goal, title")
      .in("id", missionIds);
    for (const m of (missions ?? []) as {
      id: string;
      goal: string | null;
      title: string | null;
    }[]) {
      missionMeta.set(m.id, { goal: m.goal, title: m.title });
    }
  }
  const missionCost = await loadMissionCost(db, workspaceId, missionIds);
  const allGroups = groupMissionEvents(events, missionMeta, missionCost);
  // PC-32: the group list is hard-capped server-side — top missions by
  // recency (groupMissionEvents already sorts that way). The audit's
  // unbounded path was the GROUP count, not the event fetch: 120 events
  // across 40 missions rendered 40 cards. The receipts strip shows 5;
  // one spare group keeps the fold honest without over-fetching.
  const groups = allGroups.slice(0, 6);
  const total = Array.from(missionCost.values()).reduce((s, c) => s + c, 0);
  return {
    groups,
    groups_total: allGroups.length,
    acts_total: events.length,
    since_iso: sinceIso,
    total_cost_usd: Math.round(total * 100) / 100,
  };
}

/** Lane 3 — foresight (open predictions/risks), calibration misses, and live
 * assumption challenges. The insights table is the single foresight source
 * (there is no separate foresight table); assumption_challenges add the
 * "watched assumption is being contradicted" half. */
async function queryLane3(db: SupabaseClient, workspaceId: string): Promise<TodayLane3> {
  const [foresightRes, missesRes, challengeRes] = await Promise.all([
    db
      .from("insights")
      .select(
        "id, kind, headline, detail, claim, recommended_action, score, confidence, resolution",
      )
      .eq("workspace_id", workspaceId)
      .eq("status", "open")
      .in("kind", ["prediction", "risk", "cost_of_inaction"])
      .is("resolution", null)
      .order("score", { ascending: false, nullsFirst: false })
      .limit(6),
    db
      .from("insights")
      .select(
        "id, kind, headline, detail, claim, recommended_action, score, confidence, resolution",
      )
      .eq("workspace_id", workspaceId)
      .eq("resolution", "miss")
      .order("resolved_at", { ascending: false, nullsFirst: false })
      .limit(3),
    db
      .from("assumption_challenges")
      .select("id, rationale, status, created_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const foresight = ((foresightRes.data ?? []) as InsightRow[]).map(insightToWatchItem);
  const misses = ((missesRes.data ?? []) as InsightRow[]).map(insightToWatchItem);
  const challenges: WatchItem[] = (
    (challengeRes.data ?? []) as Array<{ id: string; rationale: string | null }>
  ).map((c) => ({
    id: c.id,
    type: "assumption_challenge" as const,
    title: "An assumption is being challenged",
    description: c.rationale ?? "New evidence contradicts a recorded assumption.",
    recommendation: "Re-examine the decision this assumption supports.",
    confidence: null,
  }));

  const items = [...foresight, ...misses, ...challenges];
  return { items, count: items.length };
}

/** Lane 4 — closed outcomes with real per-mission cost. */
async function queryLane4(
  db: SupabaseClient,
  workspaceId: string,
  weekSpendUsd: number,
): Promise<TodayLane4> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await db
    .from("learnings")
    .select("id, summary, verdict, metric_label, metric_value, mission_id, created_at")
    .eq("workspace_id", workspaceId)
    .not("verdict", "is", null)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(20);
  const learnings = (data ?? []) as LearningRow[];
  const missionIds = Array.from(
    new Set(learnings.map((l) => l.mission_id).filter((id): id is string => !!id)),
  );
  const missionCost = await loadMissionCost(db, workspaceId, missionIds);
  return assembleLane4(learnings, missionCost, weekSpendUsd);
}

/** The workspace week spend (agent_runs), mirroring getCostPerOutcome so Lane 4
 * and the Engine-Room cost card can never disagree. */
async function loadWeekSpend(db: SupabaseClient, workspaceId: string): Promise<number> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await db
    .from("agent_runs")
    .select("spend_used_usd")
    .eq("workspace_id", workspaceId)
    .gte("created_at", weekAgo);
  return (data ?? []).reduce(
    (s, r) => s + Number((r as { spend_used_usd: number | null }).spend_used_usd ?? 0),
    0,
  );
}

export const getTodayLanes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TodayLanes> => {
    const { supabase } = context;
    // The resolver getInsightRail / getForecastCalibration / getCostPerOutcome
    // all use; returns the caller's default workspace id (or null).
    const { data: ws } = await supabase.rpc("current_user_default_workspace");
    const workspaceId = defaultWorkspaceId(ws);
    if (!workspaceId) return EMPTY_TODAY_LANES;

    // stage_events + learnings.mission_id postdate the generated types.
    const db = supabase as unknown as SupabaseClient;

    // Lane 2 window: the honest last-24h view. (ritual_sessions.workspace_id is
    // deliberately NULL — untrusted client id — so a true per-workspace
    // "since you last looked" boundary has no reliable source yet; the surface
    // labels this "in the last 24 hours" rather than claiming last-seen.)
    const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const weekSpendUsd = await loadWeekSpend(db, workspaceId);

    const [lane1, lane2, lane3, lane4] = await Promise.all([
      queryLane1(db, workspaceId),
      queryLane2(db, workspaceId, sinceIso),
      queryLane3(db, workspaceId),
      queryLane4(db, workspaceId, weekSpendUsd),
    ]);

    return { lane1, lane2, lane3, lane4 };
  });
