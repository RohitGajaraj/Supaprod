/**
 * PC-06: the authenticated half of the activation funnel, on top of PC-06's
 * own foundation (funnel_milestones, commit 39f6779a: signup -> connected ->
 * first_teardown -> first_mission -> week_2_return, one row per
 * (workspace_id, user_id, stage), signup already auto-tracked by a DB
 * trigger on workspace creation). trackFunnelMilestone is the write path for
 * the remaining four; getFunnelSnapshot is the read path for the Engine Room
 * funnel view and the weekly digest line.
 *
 * Anonymous, pre-signup events (demo_viewed, demo_to_signup) are a separate
 * table (activation_events, activation.functions.ts) - a visitor here has no
 * workspace_id/user_id yet, so this table cannot hold them.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// funnel_milestones (39f6779a) predates the last generated Supabase types;
// same untyped-client pattern as activation.functions.ts.
const db = supabaseAdmin as unknown as SupabaseClient;

export const FUNNEL_STAGES = [
  "signup",
  "connected",
  "first_teardown",
  "first_mission",
  "week_2_return",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

const FUNNEL_LABELS: Record<FunnelStage, string> = {
  signup: "Signed up",
  connected: "Connected a source",
  first_teardown: "Viewed a teardown",
  first_mission: "Dispatched a mission",
  week_2_return: "Returned in week 2",
};

export const trackFunnelMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        stage: z.enum(FUNNEL_STAGES),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    try {
      const { data: workspaceId } = await supabase.rpc("current_user_default_workspace");
      if (!workspaceId) return { ok: true };
      // Idempotent via UNIQUE(workspace_id, user_id, stage): a second
      // "first_mission" for the same user is a silent no-op, matching
      // "first" in the event name.
      await db.from("funnel_milestones").upsert(
        {
          workspace_id: workspaceId,
          user_id: userId,
          stage: data.stage,
          metadata: data.metadata ?? {},
        },
        { onConflict: "workspace_id,user_id,stage", ignoreDuplicates: true },
      );
    } catch (err) {
      console.error("[trackFunnelMilestone] write failed", err);
    }
    return { ok: true };
  });

export type FunnelStepSnapshot = {
  stage: FunnelStage;
  label: string;
  count: number;
  conversionFromPrev: number | null;
};

export type FunnelSnapshot = {
  windowDays: 7 | 30;
  steps: FunnelStepSnapshot[];
};

export const getFunnelSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ windowDays: z.union([z.literal(7), z.literal(30)]) }).parse(d),
  )
  .handler(async ({ data }): Promise<FunnelSnapshot> => {
    const since = new Date(Date.now() - data.windowDays * 24 * 60 * 60 * 1000).toISOString();

    const counts = await Promise.all(
      FUNNEL_STAGES.map(async (stage) => {
        const { count } = await db
          .from("funnel_milestones")
          .select("id", { count: "exact", head: true })
          .eq("stage", stage)
          .gte("completed_at", since);
        return { stage, count: count ?? 0 };
      }),
    );

    const signupCount = counts.find((c) => c.stage === "signup")?.count ?? 0;
    const steps: FunnelStepSnapshot[] = counts.map((c, i) => ({
      stage: c.stage,
      label: FUNNEL_LABELS[c.stage],
      count: c.count,
      conversionFromPrev:
        i === 0 ? null : signupCount > 0 ? Math.round((c.count / signupCount) * 1000) / 10 : null,
    }));

    return { windowDays: data.windowDays, steps };
  });
