/**
 * SW-4 / mission 3.10 GOAL MODE: standing objectives the swarm keeps working.
 *
 * A goal is a first-class outcome statement ("grow activation 15% this
 * quarter"). The swarm works it two ways: an inline first pass on creation
 * (so the goal demonstrably starts working without a human start button),
 * then the goal-tick cron re-plans on a cadence. Every proposal lands in
 * Decide as a normal opportunity linked via opportunities.goal_id; the
 * existing human gates are untouched.
 *
 * The generated Database types lag the new `goals` table until the next
 * regeneration, so the client is cast once per handler (the stage-events /
 * seed-workspace precedent) and the query shapes stay explicit.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recordStageEvent } from "@/lib/stage-events.server";
import { runGoalWorkPass, type GoalPassResult, type GoalRow } from "@/lib/goals.server";

export type GoalStatus = "active" | "paused" | "achieved" | "archived";

export interface GoalListItem extends GoalRow {
  /** Opportunities this goal has proposed into Decide (all statuses). */
  opportunity_count: number;
  /** Up to three most recent linked opportunity titles, newest first. */
  recent_opportunities: Array<{ id: string; title: string; status: string | null }>;
}

const GOAL_STATUSES = ["active", "paused", "achieved", "archived"] as const;

export const listGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GoalListItem[]> => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: goals, error } = await db
      .from("goals")
      .select("id, user_id, workspace_id, title, description, target_metric, target_date, status, last_worked_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      // Table not migrated yet: render the honest empty state, not a crash.
      if (error.code === "42P01" || error.code === "PGRST205") return [];
      throw new Error(error.message);
    }
    const rows = (goals ?? []) as GoalRow[];
    if (rows.length === 0) return [];

    const { data: opps } = await db
      .from("opportunities")
      .select("id, title, status, goal_id, created_at")
      .in("goal_id", rows.map((g) => g.id))
      .order("created_at", { ascending: false })
      .limit(200);

    const byGoal = new Map<string, Array<{ id: string; title: string; status: string | null }>>();
    for (const o of (opps ?? []) as Array<{ id: string; title: string; status: string | null; goal_id: string }>) {
      const list = byGoal.get(o.goal_id) ?? [];
      list.push({ id: o.id, title: o.title, status: o.status });
      byGoal.set(o.goal_id, list);
    }

    return rows.map((g) => {
      const linked = byGoal.get(g.id) ?? [];
      return { ...g, opportunity_count: linked.length, recent_opportunities: linked.slice(0, 3) };
    });
  });

export const createGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        title: z.string().trim().min(3).max(200),
        description: z.string().trim().max(2000).optional(),
        target_metric: z.string().trim().max(200).optional(),
        target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }): Promise<{ goal: GoalRow; firstPass: GoalPassResult | null }> => {
    const db = context.supabase as unknown as SupabaseClient;
    // Finding 22 (SW-7 terminal walkthrough): a double submission (e.g. a
    // double-click or a retried request) created two identical ACTIVE goals.
    // Dedupe on the normalized title among this user's active goals before
    // inserting a new one. A paused/achieved/archived goal with the same
    // title is a deliberate restart, not a duplicate, so it doesn't block.
    const normalizedTitle = data.title.trim().toLowerCase();
    const { data: existingActive } = await db
      .from("goals")
      .select("id, user_id, workspace_id, title, description, target_metric, target_date, status, last_worked_at")
      .eq("user_id", context.userId)
      .eq("status", "active")
      .ilike("title", normalizedTitle)
      .limit(1)
      .maybeSingle();
    if (existingActive) {
      return { goal: existingActive as GoalRow, firstPass: null };
    }
    const { data: goal, error } = await db
      .from("goals")
      .insert({
        user_id: context.userId,
        title: data.title,
        description: data.description ?? null,
        target_metric: data.target_metric ?? null,
        target_date: data.target_date ?? null,
      })
      .select("id, user_id, workspace_id, title, description, target_metric, target_date, status, last_worked_at")
      .single();
    if (error || !goal) throw new Error(error?.message ?? "Could not create the goal");
    const row = goal as GoalRow;

    await recordStageEvent(db, {
      entityType: "goal",
      entityId: row.id,
      from: null,
      to: "active",
      actor: "human",
      workspaceId: row.workspace_id,
      userId: context.userId,
    });

    // The swarm starts working immediately: one inline pass, best-effort.
    // Failure here is honest and non-fatal (no AI key in local dev, model
    // hiccup); the goal-tick cron picks the goal up on its next sweep.
    let firstPass: GoalPassResult | null = null;
    try {
      firstPass = await runGoalWorkPass(db, row);
    } catch (e) {
      console.error(`[goals] first work pass failed for ${row.id}:`, e instanceof Error ? e.message : e);
    }

    return { goal: row, firstPass };
  });

export const setGoalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ goalId: z.string().uuid(), status: z.enum(GOAL_STATUSES) }).parse(i),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: prior, error: readErr } = await db
      .from("goals")
      .select("id, status, workspace_id")
      .eq("id", data.goalId)
      .single();
    if (readErr || !prior) throw new Error(readErr?.message ?? "Goal not found");

    const { error } = await db
      .from("goals")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.goalId);
    if (error) throw new Error(error.message);

    await recordStageEvent(db, {
      entityType: "goal",
      entityId: data.goalId,
      from: (prior as { status: string }).status,
      to: data.status,
      actor: "human",
      workspaceId: (prior as { workspace_id: string }).workspace_id,
      userId: context.userId,
    });
    return { ok: true };
  });
