/**
 * PC-08: Routines, productized. Merges the code-constant catalog
 * (routines-catalog.ts) with each workspace's own toggle + a light run
 * receipt (workspace_routine_prefs, migration 20260710220000).
 *
 * workspace_routine_prefs predates the last generated Supabase types; same
 * untyped-client pattern as activation.functions.ts / funnel.functions.ts.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ROUTINES_CATALOG, nextRunAt, type RoutineId } from "@/lib/routines-catalog";

const db = supabaseAdmin as unknown as SupabaseClient;
const ROUTINE_IDS = ROUTINES_CATALOG.map((r) => r.id) as [RoutineId, ...RoutineId[]];

export type RoutineRow = {
  id: RoutineId;
  name: string;
  whatItDoes: string;
  castOwner: string;
  enabled: boolean;
  nextRunAt: string;
  lastRunAt: string | null;
};

export const listRoutines = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RoutineRow[]> => {
    const { supabase } = context;
    const { data: workspaceId } = await supabase.rpc("current_user_default_workspace");

    let prefs: { routine_id: string; enabled: boolean; last_run_at: string | null }[] = [];
    if (workspaceId) {
      const { data } = await db
        .from("workspace_routine_prefs")
        .select("routine_id,enabled,last_run_at")
        .eq("workspace_id", workspaceId);
      prefs = data ?? [];
    }
    const byId = new Map(prefs.map((p) => [p.routine_id, p]));

    const now = new Date();
    return ROUTINES_CATALOG.map((r) => {
      const pref = byId.get(r.id);
      return {
        id: r.id,
        name: r.name,
        whatItDoes: r.whatItDoes,
        castOwner: r.castOwner,
        enabled: pref ? pref.enabled : true,
        nextRunAt: nextRunAt(r.cronSchedule, now).toISOString(),
        lastRunAt: pref?.last_run_at ?? null,
      };
    });
  });

export const toggleRoutine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ routineId: z.enum(ROUTINE_IDS), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabase } = context;
    const { data: workspaceId } = await supabase.rpc("current_user_default_workspace");
    if (!workspaceId) throw new Error("No active workspace.");

    // Members can write their own workspace's prefs directly (RLS), so this
    // uses the caller's own RLS-scoped client, not the admin client -- a
    // toggle is a real user action, not telemetry.
    const memberClient = supabase as unknown as SupabaseClient;
    await memberClient
      .from("workspace_routine_prefs")
      .upsert(
        { workspace_id: workspaceId, routine_id: data.routineId, enabled: data.enabled },
        { onConflict: "workspace_id,routine_id" },
      );
    return { ok: true };
  });
