import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { markRoutineRun } from "@/lib/routines.server";
import { withJobRun } from "@/lib/observability";
import { deriveAllInsights } from "@/lib/brain/derive-insights.server";
import { runInsightPush } from "@/lib/brain/push-insights.server";

// workspace_routine_prefs (PC-08, migration 20260710220000) predates the
// last generated Supabase types.
const routinesDb = supabaseAdmin as unknown as SupabaseClient;

export const Route = createFileRoute("/api/public/hooks/derive-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("brain.derive-tick", async () => {
          const { data: workspaces, error } = await supabaseAdmin
            .from("workspaces")
            .select("id, owner_id, last_auto_sense_at")
            .eq("is_sample", false)
            .eq("auto_sense_enabled", true)
            .order("last_auto_sense_at", { ascending: true, nullsFirst: true })
            .limit(3);

          if (error) {
            const code = (error as { code?: string }).code;
            if (code === "42703" || code === "PGRST204") {
              return json({ ok: true, processed: 0, note: "auto_derive not migrated yet" });
            }
            return json({ ok: false, error: error.message }, 500);
          }

          // PC-08: the "Learnings synthesis" routine's per-workspace off switch.
          const candidateIds = (workspaces ?? []).map((w) => w.id);
          let disabledWorkspaceIds = new Set<string>();
          if (candidateIds.length > 0) {
            const { data: prefs } = await routinesDb
              .from("workspace_routine_prefs")
              .select("workspace_id,enabled")
              .eq("routine_id", "learnings-synthesis")
              .eq("enabled", false)
              .in("workspace_id", candidateIds);
            disabledWorkspaceIds = new Set((prefs ?? []).map((p) => p.workspace_id as string));
          }

          let totalDerived = 0;
          let totalPushed = 0;
          const results: Array<{
            workspace_id: string;
            insights?: number;
            pushed?: number;
            error?: string;
            note?: string;
          }> = [];

          const today = new Date().toISOString().slice(0, 10);
          const DAILY_DERIVE_CAP = 20;

          for (const ws of workspaces ?? []) {
            try {
              if (!ws.owner_id) {
                results.push({ workspace_id: ws.id, error: "no owner" });
                continue;
              }
              if (disabledWorkspaceIds.has(ws.id)) {
                results.push({
                  workspace_id: ws.id,
                  insights: 0,
                  pushed: 0,
                  note: "routine disabled",
                });
                continue;
              }
              // PC-08: this routine scanned the workspace this tick -- leave a receipt.
              markRoutineRun(routinesDb, ws.id, "learnings-synthesis");
              // SEAM-3 (mission 3.9): deterministic push detection rides the
              // derive supaprod. Runs before the derive cap check because it has
              // its own hard cap (3 pushes/workspace/day) and zero AI spend; a
              // push failure never blocks the derive pass.
              let pushed = 0;
              let pushError: string | undefined;
              try {
                const p = await runInsightPush(supabaseAdmin, ws.owner_id, ws.id);
                pushed = p.pushed;
                totalPushed += p.pushed;
              } catch (e) {
                // STILL BEST-EFFORT, NO LONGER SILENT. A push failure must not
                // block the derive pass -- that part was right, and is unchanged.
                // But an empty `catch {}` made "the push is working and has
                // nothing to say" and "the push has thrown on every tick for a
                // week" produce byte-identical output, so the difference was
                // unknowable from outside.
                //
                // That mattered on 2026-08-06: the lane had been quiet for three
                // days and answering "is this broken?" took a database session
                // and a reading of the detector, when the tick itself could have
                // said so. (It was honest quiet -- zero learnings and zero
                // settled outcomes in the window, and the detectors key off
                // settled outcomes.)
                //
                // Recorded per workspace rather than thrown: one workspace's bad
                // data must not hide the other nineteen results.
                pushError = e instanceof Error ? e.message : String(e);
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: todayRows } = await (supabaseAdmin as any)
                .from("insights")
                .select("id")
                .eq("workspace_id", ws.id)
                .neq("kind", "next_best_action")
                .gte("created_at", `${today}T00:00:00Z`);
              const todayCount: number = (todayRows as unknown[])?.length ?? 0;
              if (todayCount >= DAILY_DERIVE_CAP) {
                results.push({
                  workspace_id: ws.id,
                  insights: 0,
                  pushed,
                  note: pushError
                    ? `daily cap reached; push failed: ${pushError}`
                    : "daily cap reached",
                });
                continue;
              }
              const r = await deriveAllInsights(supabaseAdmin, ws.owner_id, ws.id);
              await supabaseAdmin
                .from("workspaces")
                .update({ last_auto_sense_at: new Date().toISOString() })
                .eq("id", ws.id);
              const count = r?.length ?? 0;
              totalDerived += count;
              results.push({
                workspace_id: ws.id,
                insights: count,
                pushed,
                ...(pushError ? { note: `push failed: ${pushError}` } : {}),
              });
            } catch (e) {
              results.push({
                workspace_id: ws.id,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          return json({
            ok: true,
            processed: workspaces?.length ?? 0,
            insights: totalDerived,
            pushed: totalPushed,
          });
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
