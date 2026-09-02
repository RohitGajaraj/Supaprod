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
          /*
           * -- TWO PASSES RIDE THIS TICK AND THEY DO NOT SHARE A SCOPE ------
           *
           * `auto_derive_enabled` means "derive themes for me automatically". It
           * is a real preference with a real switch (`workspace-automation.
           * functions.ts` writes it from Settings), it defaults false, and every
           * workspace on the database has it false.
           *
           * The insight calibration below is derivation and is correctly gated
           * by it. GRADING A FORECAST WHOSE HORIZON HAS PASSED IS NOT: it is the
           * loop closing on a promise the customer's own team made, and nobody
           * opting out of automatic theme derivation was asking for their bets
           * to go ungraded forever. Riding one flag was an accident of the
           * forecast pass being added to a tick that already existed (FC-01's
           * own comment says as much), and the cost is measured: the forecast
           * auditor has never run, on any workspace, once.
           *
           * A1 ruled the flag "removed or defaulted true, your call on which is
           * smaller and safer". Neither, and the third option is smaller than
           * both: SCOPE EACH PASS TO ITS OWN QUESTION. Defaulting the flag true
           * would switch on automatic theme derivation for every workspace,
           * which is a customer-facing behaviour change nobody asked for and a
           * far bigger blast radius than the horizon verdict needs; removing it
           * would take away a control a person can actually set today. The
           * premise that nothing can set it is stale -- `forecast-audit.
           * server.ts:97` still says so and the Settings writer landed
           * 2026-08-14.
           *
           * So: every non-sample workspace is read, the derive pass keeps its
           * flag in the loop below, and the forecast pass no longer asks.
           */
          const { data: workspaces, error } = await supabaseAdmin
            .from("workspaces")
            .select("id, owner_id, auto_derive_enabled")
            .eq("is_sample", false)
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
              // Derivation stays behind the preference it belongs to.
              const scored = ws.auto_derive_enabled
                ? (await calibrateExpiredInsights(supabaseAdmin, ws.owner_id, ws.id)).scored
                : 0;
              totalScored += scored;
              // The horizon does not ask permission. See the block above.
              const f = await auditDueForecasts(supabaseAdmin, ws.owner_id, ws.id);
              totalForecastsDrafted += f.drafted;
              totalForecastsAutoSettled += f.autoSettled;
              results.push({ workspace_id: ws.id, scored });
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
