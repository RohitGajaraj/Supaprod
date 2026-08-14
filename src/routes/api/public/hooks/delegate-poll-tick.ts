import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRunHttp } from "@/lib/observability";
import { pollDelegateJob, foldDelegateResult } from "@/lib/delegate/poll.server";

/**
 * BLD-04: delegate poll tick — finds agent_runs that have an outstanding
 * external delegate job (external_job_id set, status not yet terminal) and
 * polls OpenHands for each. Folds terminal results (done/failed) back into
 * the mission_steps row so the Build surface reflects the outcome.
 *
 * Idempotent: already-terminal runs are skipped at the status check so
 * repeated ticks are safe. Designed to run every 2–5 minutes via Lovable
 * scheduled hook.
 */
export const Route = createFileRoute("/api/public/hooks/delegate-poll-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;
        // This is the tick whose silent death produced the incident that
        // EXPECTED_JOBS was built for. The catch-all that used to wrap this body
        // answered every failure with a 500 from INSIDE withJobRun, and a
        // returned Response resolves, so the ledger recorded status='ok' anyway
        // and the manifest's recency check stayed satisfied. Failures now travel
        // out as throws; withJobRunHttp turns them back into the same JSON 500.
        return withJobRunHttp("cron.delegate-poll-tick", async () => {
          // Fetch runs that have an external delegate job but are not yet
          // in a terminal state. delegate_meta->>'external_job_id' IS NOT NULL
          // is the signal that submit succeeded and we need to poll.
          const { data: runs, error: fetchErr } = await supabaseAdmin
            .from("agent_runs")
            .select("id, mission_id, delegate_meta")
            .not("delegate_meta->external_job_id", "is", null)
            .not("status", "in", '("done","failed","error","cancelled")');

          if (fetchErr) throw new Error(`agent_runs read failed: ${fetchErr.message}`);

          let polled = 0;
          let folded = 0;
          for (const run of runs ?? []) {
            const meta = run.delegate_meta as {
              provider?: string;
              external_job_id?: string;
            } | null;
            if (!meta?.external_job_id || !run.mission_id) continue;

            const pollResult = await pollDelegateJob(meta.external_job_id);
            polled++;

            if (pollResult.status === "done" || pollResult.status === "failed") {
              await foldDelegateResult({
                runId: run.id,
                missionId: run.mission_id,
                provider: meta.provider ?? "openhands",
                externalJobId: meta.external_job_id,
                pollResult,
                supabase: supabaseAdmin as never,
              });
              folded++;
            }
          }

          return new Response(JSON.stringify({ ok: true, polled, folded }), {
            headers: { "Content-Type": "application/json" },
          });
        });
      },
    },
  },
});
