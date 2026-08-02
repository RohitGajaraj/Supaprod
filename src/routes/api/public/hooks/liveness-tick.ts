import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun, captureError } from "@/lib/observability";
import { buildLivenessReport, summariseReport } from "@/lib/liveness/report";
import type { LivenessClient } from "@/lib/liveness/probe";

/**
 * Feature liveness, evaluated on a schedule instead of when someone remembers
 * to open a page.
 *
 * WHY THIS EXISTS AND NOT JUST THE ADMIN SURFACE. The five features found dead
 * on 2026-08-02 had been dead for weeks, and the only reason anyone learned
 * about them was that somebody went looking. A report you have to remember to
 * read is a report with the same failure mode as the features it watches. This
 * tick reads it for you.
 *
 * WHERE THE ALARM GOES, AND WHY THERE IS NO NEW TABLE. Every finding is written
 * to `error_events` through the existing capture façade, which is always on,
 * needs no vendor key, and is already readable by an admin. So a dead capability
 * becomes an error the founder already has a place to see, and it reaches Sentry
 * too once that key is set. No new store, no new surface, no migration for a
 * results table that would itself need watching.
 *
 * IT DOES NOT THROW. A dead feature is not a failed job: throwing would mark
 * this run as an error in `job_runs` and every later reader would have to guess
 * whether the tick broke or the product did. The run succeeds and reports.
 *
 * NOT YET SCHEDULED. This route has no pg_cron registration in this change,
 * because migrations are the founder's to write. Until it is registered the
 * `liveness-tick` entry in the registry will report itself as never executed,
 * in the same words it uses for everything else, which is the correct behaviour
 * for a feature that has shipped and does nothing. See LIVENESS-NEEDS-MIGRATION.md.
 */
export const Route = createFileRoute("/api/public/hooks/liveness-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("cron.liveness-tick", async () => {
          const started = Date.now();
          const report = await buildLivenessReport(supabaseAdmin as unknown as LivenessClient);
          const headline = summariseReport(report);

          // One error event per finding, per run. The tick is meant to run daily,
          // so a finding that stays broken produces one row a day: enough to be
          // impossible to miss, few enough to never become noise.
          const findings: Array<{ surface: string; message: string }> = [
            ...report.capabilities
              .filter((c) => c.verdict === "dead")
              .map((c) => ({
                surface: `liveness:${c.id}`,
                message: `${c.title} is doing nothing. ${c.reason} Proof it would leave: ${c.proof}.`,
              })),
            ...report.integrity
              .filter((c) => c.verdict === "broken")
              .map((c) => ({
                surface: `liveness:${c.id}`,
                message: `${c.title}. ${c.reason} Read by ${c.readBy}.`,
              })),
            ...report.vocabulary
              .filter((c) => c.verdict === "drifted")
              .map((c) => ({
                surface: `liveness:${c.id}`,
                message: `${c.title}. ${c.reason} Declared in ${c.declaredBy}.`,
              })),
          ];

          for (const f of findings) {
            const err = new Error(f.message);
            err.name = "FeatureLiveness";
            await captureError(err, { surface: f.surface, failure_kind: "feature_dead" });
          }

          return new Response(
            JSON.stringify({
              ok: true,
              headline,
              windowDays: report.windowDays,
              counts: report.counts,
              findings: findings.map((f) => f.surface),
              ms: Date.now() - started,
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        });
      },
    },
  },
});
