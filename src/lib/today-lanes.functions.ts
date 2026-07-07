/**
 * SW-5: Today's four-lane re-architecture (Platform Truth mission)
 *
 * Four distinct content lanes, each addressing a user need:
 * 1. Needs your judgment — decisions awaiting human input (approvals + insights)
 * 2. What the swarm did — recent activity grouped by goal/mission
 * 3. At risk / watch — foresight signals + calibration misses
 * 4. Shipped and what it cost — outcomes + cost-per-outcome
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TodayLane1 = {
  /** Decisions needing human judgment (approval gates, spec calls, insights) */
  items: Array<{
    id: string;
    type: "approval" | "spec" | "opportunity" | "insight";
    title: string;
    urgency: "high" | "medium" | "low";
    age_minutes: number;
    action: string; // button label: "Approve", "Decide", etc.
  }>;
  count: number;
};

export type TodayLane2 = {
  /** Recent swarm activity, grouped by active goal */
  groups: Array<{
    goal_id?: string;
    goal_title?: string;
    recent_count: number;
    items: Array<{
      id: string;
      entity_type: "mission" | "decision" | "opportunity";
      title: string;
      stage: string;
      timestamp: string;
      cost_usd?: number;
    }>;
  }>;
};

export type TodayLane3 = {
  /** Signals at risk or requiring attention */
  items: Array<{
    id: string;
    type: "prediction_risk" | "calibration_miss" | "assumption_challenge";
    title: string;
    description: string;
    recommendation: string;
    confidence?: number;
  }>;
  count: number;
};

export type TodayLane4 = {
  /** Shipped outcomes + cost metrics */
  items: Array<{
    id: string;
    title: string;
    outcome_verdict: "achieved" | "partial" | "missed";
    spent_usd: number;
    cost_per_unit?: number;
    time_to_deploy_days: number;
  }>;
  total_shipped_count: number;
  avg_cost_per_outcome: number;
};

export type TodayLanes = {
  lane1: TodayLane1;
  lane2: TodayLane2;
  lane3: TodayLane3;
  lane4: TodayLane4;
};

async function queryLane1(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<TodayLane1> {
  // STUB: Needs integration with existing getNeedsYou + pushed insights
  // For now, return empty lane; the actual data is in today.functions.ts
  return {
    items: [],
    count: 0,
  };
}

async function queryLane2(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<TodayLane2> {
  // Query recent stage_events (from SW-1 foundations) grouped by goal
  const { data: events } = await supabase
    .from("stage_events")
    .select("entity_type, entity_id, to_stage, at")
    .eq("workspace_id", workspaceId)
    .gte("at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("at", { ascending: false });

  return {
    groups: [
      {
        goal_title: "Ungrouped recent activity",
        recent_count: events?.length || 0,
        items: (events || [])
          .slice(0, 10)
          .map((e) => ({
            id: `${e.entity_type}/${e.entity_id}`,
            entity_type: (e.entity_type as "mission" | "decision" | "opportunity") || "mission",
            title: `${e.to_stage}`,
            stage: e.to_stage,
            timestamp: e.at,
          })),
      },
    ],
  };
}

async function queryLane3(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<TodayLane3> {
  // Query foresight predictions + assumption challenges
  // STUB: Needs integration with FS (foresight) tables + assumptions
  return {
    items: [],
    count: 0,
  };
}

async function queryLane4(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<TodayLane4> {
  // Query recent learnings with outcomes + spend metrics
  const { data: learnings } = await supabase
    .from("learnings")
    .select("id, subject, verdict")
    .eq("workspace_id", workspaceId)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(20);

  const achieved = learnings?.filter((l) => l.verdict === "achieved").length || 0;
  const total = learnings?.length || 0;

  return {
    items: (learnings || []).map((l) => ({
      id: l.id,
      title: l.subject || "Unnamed outcome",
      outcome_verdict: (l.verdict as "achieved" | "partial" | "missed") || "partial",
      spent_usd: 0, // TODO: join with ai_events cost
      time_to_deploy_days: 0, // TODO: calculate from created_at to shipped_at
    })),
    total_shipped_count: total,
    avg_cost_per_outcome: 0, // TODO: compute
  };
}

export const getTodayLanes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<TodayLanes> => {
      const { supabase, userId } = context;

      // Get user's workspace
      const { data: profile } = await supabase
        .from("profiles")
        .select("default_workspace_id")
        .eq("id", userId)
        .single();

      const workspaceId = profile?.default_workspace_id;
      if (!workspaceId) throw new Error("No workspace");

      const [lane1, lane2, lane3, lane4] = await Promise.all([
        queryLane1(supabase, workspaceId),
        queryLane2(supabase, workspaceId),
        queryLane3(supabase, workspaceId),
        queryLane4(supabase, workspaceId),
      ]);

      return { lane1, lane2, lane3, lane4 };
    }
  );
