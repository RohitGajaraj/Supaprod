import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun } from "@/lib/observability";
import { recordErrorEvent } from "@/lib/observability/errors";

/**
 * SW-6 (mission 3.12): the uptime ping half of the failure-detection floor.
 *
 * Every tick fetches the app's own PUBLIC health endpoint through its public
 * origin, so the probe exercises the full serving path (DNS, CDN, worker,
 * database, cron pulse) exactly the way a user request would, and the result
 * lands in the job_runs ledger the founder already reads. A degraded or
 * unreachable health check additionally writes an error_events row, so
 * downtime is visible in the same store as server errors.
 *
 * Also piggybacks the error_events retention sweep (30 days) so the floor
 * cannot grow unbounded, without needing a separate cron registration.
 */
const HEALTH_FETCH_TIMEOUT_MS = 8_000;
const ERROR_EVENTS_RETENTION_DAYS = 30;

interface PurgeClient {
  from(table: string): {
    delete(): {
      lt(column: string, value: string): PromiseLike<{ error: { message: string } | null }>;
    };
  };
}

export const Route = createFileRoute("/api/public/hooks/uptime-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("cron.uptime-tick", async () => {
          const origin = new URL(request.url).origin;
          const healthUrl = `${origin}/api/public/health`;

          let healthStatus = 0;
          let healthBody = "";
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), HEALTH_FETCH_TIMEOUT_MS);
            const res = await fetch(healthUrl, {
              signal: controller.signal,
              headers: { accept: "application/json" },
            });
            clearTimeout(timer);
            healthStatus = res.status;
            healthBody = (await res.text()).slice(0, 500);
          } catch (err) {
            await recordErrorEvent(err, {
              surface: "uptime",
              failure_kind: "health_unreachable",
              request_path: "/api/public/health",
            });
            healthStatus = 0;
          }

          if (healthStatus !== 0 && healthStatus !== 200) {
            await recordErrorEvent(new Error(`health degraded: HTTP ${healthStatus}`), {
              surface: "uptime",
              failure_kind: "health_degraded",
              request_path: "/api/public/health",
              extras: { body: healthBody },
            });
          }

          // Retention sweep: indexed delete, no-op most ticks.
          const cutoff = new Date(
            Date.now() - ERROR_EVENTS_RETENTION_DAYS * 86_400_000,
          ).toISOString();
          let purged = true;
          try {
            const { error } = await (supabaseAdmin as unknown as PurgeClient)
              .from("error_events")
              .delete()
              .lt("occurred_at", cutoff);
            purged = !error;
          } catch {
            purged = false;
          }

          return new Response(
            JSON.stringify({ ok: true, health: healthStatus === 200 ? "ok" : "degraded", healthStatus, purged }),
            { headers: { "Content-Type": "application/json" } },
          );
        });
      },
    },
  },
});
