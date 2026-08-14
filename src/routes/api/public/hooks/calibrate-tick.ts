import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRunHttp } from "@/lib/observability";
import { calibrateExpiredInsights } from "@/lib/brain/calibrate-insights.server";
import { auditDueForecasts } from "@/lib/brain/forecast-audit.server";

export const Route = createFileRoute("/api/public/hooks/calibrate-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRunHttp("brain.calibrate-tick", async () => {
          const { data: workspaces, error } = await supabaseAdmin
            .from("workspaces")
            .select("id, owner_id")
            .eq("auto_derive_enabled", true)
            .limit(20);

          if (error) {
            // Thrown, not returned as a 500. Returning a Response RESOLVES,
            // and withJobRun scored any resolved callback as status='ok', so
            // this line wrote a green ledger row for a tick that could not read
            // its own inputs. withJobRunHttp rebuilds the identical JSON 500
            // outside the wrapper, so pg_cron sees exactly what it saw before.
            throw new Error(`workspaces read failed: ${error.message}`);
          }

          let totalScored = 0;
          // FC-01: the forecast pass rides this tick rather than adding a second
          // scheduled job. It shares the per-workspace try/catch below, so a
          // forecast failure narrows to that workspace and never stops the
          // insight calibration that was here first.
          let totalForecastsDrafted = 0;
          let totalForecastsAutoSettled = 0;
          const results: Array<{ workspace_id: string; scored?: number; error?: string }> = [];

          for (const ws of workspaces ?? []) {
            try {
              if (!ws.owner_id) {
                results.push({ workspace_id: ws.id, error: "no owner" });
                continue;
              }
              const r = await calibrateExpiredInsights(supabaseAdmin, ws.owner_id, ws.id);
              totalScored += r.scored;
              const f = await auditDueForecasts(supabaseAdmin, ws.owner_id, ws.id);
              totalForecastsDrafted += f.drafted;
              totalForecastsAutoSettled += f.autoSettled;
              results.push({ workspace_id: ws.id, scored: r.scored });
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
            scored: totalScored,
            forecastsDrafted: totalForecastsDrafted,
            forecastsAutoSettled: totalForecastsAutoSettled,
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
