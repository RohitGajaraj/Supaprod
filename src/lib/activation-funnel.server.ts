/**
 * Server-side funnel tracking and computation (PC-06).
 * Writes milestone events; computes cohort-based funnels for the Engine Room view.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { FunnelStage, FunnelMilestone, FunnelCohort, FunnelSnapshot } from "./activation-funnel.types";

/**
 * Record a funnel milestone (signup, connected, first_teardown, etc.).
 * Idempotent: repeated calls with the same stage+user are no-ops.
 */
export async function trackFunnelMilestone(
  workspaceId: string,
  userId: string,
  stage: FunnelStage,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  const db = supabaseAdmin as any; // Table not in generated types yet (post-migration)

  try {
    // Check if this milestone already exists.
    const { data: existing } = await db
      .from("funnel_milestones")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("stage", stage)
      .limit(1);

    if (existing && existing.length > 0) {
      return false; // Already recorded, idempotent no-op
    }

    // Insert the milestone.
    const { error } = await db.from("funnel_milestones").insert({
      workspace_id: workspaceId,
      user_id: userId,
      stage,
      completed_at: new Date().toISOString(),
      metadata: metadata || {},
    });

    return !error;
  } catch (e) {
    console.error("[PC-06] trackFunnelMilestone failed:", e);
    return false;
  }
}

/**
 * Get the funnel snapshot for the specified date range.
 * Computes cohort-based conversion percentages.
 */
export async function getFunnelSnapshot(
  workspaceId: string,
  asOfDate: string, // YYYY-MM-DD
  daysBack = 30,
): Promise<FunnelSnapshot | null> {
  const db = supabaseAdmin as any; // Table not in generated types yet (post-migration)

  try {
    // Query funnel milestones for this workspace over the last N days.
    const startDate = new Date(asOfDate);
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split("T")[0];

    const { data: milestones, error } = await db
      .from("funnel_milestones")
      .select("user_id,stage,completed_at")
      .eq("workspace_id", workspaceId)
      .gte("completed_at", `${startDateStr}T00:00:00Z`)
      .lte("completed_at", `${asOfDate}T23:59:59Z`)
      .order("completed_at", { ascending: true });

    if (error) {
      console.error("[PC-06] getFunnelSnapshot query failed:", error);
      return null;
    }

    if (!milestones || milestones.length === 0) {
      return { asOfDate, cohorts: [], totalSignups: 0, conversionToConnected: 0, conversionToFirstTeardown: 0, conversionToFirstMission: 0, conversionToWeek2Return: 0 };
    }

    // Build cohorts by signup date.
    const cohortMap = new Map<string, Map<string, Set<string>>>();

    for (const m of milestones as Array<{ user_id: string; stage: string; completed_at: string }>) {
      const signupDate = m.completed_at.split("T")[0];

      if (!cohortMap.has(signupDate)) {
        cohortMap.set(signupDate, new Map());
      }

      const cohort = cohortMap.get(signupDate)!;
      if (!cohort.has(m.stage)) {
        cohort.set(m.stage, new Set());
      }

      cohort.get(m.stage)!.add(m.user_id);
    }

    // Compute stage progression per cohort.
    const cohorts: FunnelCohort[] = [];
    for (const [cohortDate, stageMap] of cohortMap) {
      const signups = stageMap.get("signup")?.size || 0;
      const connected = stageMap.get("connected")?.size || 0;
      const firstTeardown = stageMap.get("first_teardown")?.size || 0;
      const firstMission = stageMap.get("first_mission")?.size || 0;
      const week2Return = stageMap.get("week_2_return")?.size || 0;

      cohorts.push({
        cohortDate,
        signups,
        connected,
        firstTeardown,
        firstMission,
        week2Return,
      });
    }

    // Aggregate: compute overall conversion rates.
    const totalSignups = cohorts.reduce((sum, c) => sum + c.signups, 0);
    const totalConnected = cohorts.reduce((sum, c) => sum + c.connected, 0);
    const totalFirstTeardown = cohorts.reduce((sum, c) => sum + c.firstTeardown, 0);
    const totalFirstMission = cohorts.reduce((sum, c) => sum + c.firstMission, 0);
    const totalWeek2Return = cohorts.reduce((sum, c) => sum + c.week2Return, 0);

    return {
      asOfDate,
      cohorts,
      totalSignups,
      conversionToConnected: totalSignups > 0 ? Math.round((totalConnected / totalSignups) * 100) : 0,
      conversionToFirstTeardown: totalConnected > 0 ? Math.round((totalFirstTeardown / totalConnected) * 100) : 0,
      conversionToFirstMission: totalFirstTeardown > 0 ? Math.round((totalFirstMission / totalFirstTeardown) * 100) : 0,
      conversionToWeek2Return: totalFirstMission > 0 ? Math.round((totalWeek2Return / totalFirstMission) * 100) : 0,
    };
  } catch (e) {
    console.error("[PC-06] getFunnelSnapshot failed:", e);
    return null;
  }
}
