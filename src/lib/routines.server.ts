// PC-08: shared "last run" receipt writer for the productized routines.
//
// Each catalog routine's tick handler calls this once its per-workspace
// enabled-check passes, so the RoutinesPanel row flips from "not yet tracked"
// to a live "last run" time. It records that the routine SCANNED the workspace
// this tick -- not that it produced output -- so a healthy, quiet workspace
// still shows a real last-run instead of "not yet tracked" forever.
//
// Best-effort / fire-and-forget: a missing pref row (the routine was never
// toggled) or an RLS quirk must never break a tick, so the upsert is voided
// and both promise arms swallow. This mirrors the receipt block sense-tick.ts
// has shipped since PC-08 landed; the 7 other tick handlers deduplicate onto it.
//
// workspace_routine_prefs (migration 20260710220000) has the
// (workspace_id, routine_id) UNIQUE the onConflict targets plus last_run_at;
// enabled is NOT NULL DEFAULT true, so an insert-path receipt for a
// never-toggled routine leaves it enabled (never silently turns it off).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoutineId } from "@/lib/routines-catalog";

export function markRoutineRun(
  db: SupabaseClient,
  workspaceId: string,
  routineId: RoutineId,
): void {
  void db
    .from("workspace_routine_prefs")
    .upsert(
      {
        workspace_id: workspaceId,
        routine_id: routineId,
        last_run_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,routine_id" },
    )
    .then(
      () => {},
      () => {},
    );
}
