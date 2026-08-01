import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { markRoutineRun } from "@/lib/routines.server";
import { clusterSignalsCore } from "@/lib/ai/cluster.server";
import { withJobRun } from "@/lib/observability";
import { promoteClustersOnce } from "@/lib/spine/promote.server";

// workspace_routine_prefs (PC-08, migration 20260710220000) predates the
// last generated Supabase types.
const routinesDb = supabaseAdmin as unknown as SupabaseClient;

/**
 * F3 cluster-tick: re-cluster the owner's unclustered signals for every
 * workspace that has opted in (auto_cluster_enabled = true), so SENSE stays
 * fresh without a human poke. This is the "the loop keeps working while you are
 * away" half of F3.
 *
 * Off by default and bounded: no workspace is enrolled until its owner toggles
 * it on, the pg_cron schedule that drives this is a founder activation step (it
 * commits recurring AI spend), and each tick processes at most 5 workspaces,
 * oldest-run-first, to cap per-invocation cost. Spend is also governed by the
 * existing kill-switch and budget caps (clusterSignalsCore passes workspaceId).
 */
export const Route = createFileRoute("/api/public/hooks/cluster-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("cron.cluster-tick", async () => {
          const { data: workspaces, error } = await supabaseAdmin
            .from("workspaces")
            .select("id, owner_id, last_auto_cluster_at")
            .eq("auto_cluster_enabled", true)
            .order("last_auto_cluster_at", { ascending: true, nullsFirst: true })
            .limit(5);

          if (error) {
            // Pre-migration tolerance: auto_cluster_enabled may not exist yet.
            const code = (error as { code?: string }).code;
            if (code === "42703" || code === "PGRST204") {
              return json({ ok: true, processed: 0, note: "auto_cluster not migrated yet" });
            }
            return json({ ok: false, error: error.message }, 500);
          }

          // PC-08: the "Signal clustering" routine's per-workspace off switch.
          const candidateIds = (workspaces ?? []).map((w) => w.id);
          let disabledWorkspaceIds = new Set<string>();
          if (candidateIds.length > 0) {
            const { data: prefs } = await routinesDb
              .from("workspace_routine_prefs")
              .select("workspace_id,enabled")
              .eq("routine_id", "signal-clustering")
              .eq("enabled", false)
              .in("workspace_id", candidateIds);
            disabledWorkspaceIds = new Set((prefs ?? []).map((p) => p.workspace_id as string));
          }

          const results: Array<{
            workspace_id: string;
            themes?: number;
            started?: number;
            error?: string;
          }> = [];
          for (const ws of workspaces ?? []) {
            try {
              if (!ws.owner_id) {
                results.push({ workspace_id: ws.id, error: "no owner" });
                continue;
              }
              if (disabledWorkspaceIds.has(ws.id)) {
                results.push({ workspace_id: ws.id, error: "routine disabled" });
                continue;
              }
              // PC-08: this routine scanned the workspace this tick -- leave a receipt.
              markRoutineRun(routinesDb, ws.id, "signal-clustering");
              const r = await clusterSignalsCore(supabaseAdmin, ws.owner_id, ws.id, null);
              await supabaseAdmin
                .from("workspaces")
                .update({ last_auto_cluster_at: new Date().toISOString() })
                .eq("id", ws.id);
              // AND THEN THE FRONT DOOR OPENS. Clustering that never becomes
              // work is the loop's entrance shut: measured live on 2026-08-01,
              // 307 of 308 signals were clustered into 181 themes and exactly
              // ONE track existed, because `startTrack` had a single caller and
              // it was a button. Promotion runs HERE rather than in its own tick
              // so a cluster and the decision to act on it stay adjacent, and a
              // workspace that has switched clustering off gets neither.
              //
              // Bounded, idempotent and refusable: at most a couple per sweep,
              // never a theme a person already settled, and the unique index on
              // spine_tracks.theme_id makes a double promotion impossible even
              // if two ticks overlap.
              let started = 0;
              try {
                const promoted = await promoteClustersOnce(supabaseAdmin, ws.owner_id);
                started = promoted.filter((p) => p.trackId).length;
              } catch (e) {
                // Promotion failing must never lose the clustering that just
                // succeeded, so it is caught separately and reported alongside.
                console.error(`cluster-tick: promotion failed for ${ws.id}:`, e);
              }
              results.push({ workspace_id: ws.id, themes: r.themes, started });
            } catch (e) {
              results.push({
                workspace_id: ws.id,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          return json({ ok: true, processed: workspaces?.length ?? 0, results });
        });
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
