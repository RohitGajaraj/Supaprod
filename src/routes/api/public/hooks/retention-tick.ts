import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRunHttp, isMissingDatabaseObject } from "@/lib/observability";

/**
 * retention-tick hook (DATA-RETENTION).
 *
 * Purges high-volume AI telemetry (ai_events / prompt_runs / tool_calls) older
 * than the retention window via the `purge_old_telemetry` SQL function. Strict
 * no-op while `data_retention_enabled()` is false (the function self-gates, so
 * this returns `{ skipped: "dormant" }` until the founder flips the flag) and
 * pre-migration tolerant (a missing function is a skip, not an incident).
 * Idempotent - safe to poke on any supaprod; wire it via pg_cron / an external
 * scheduler (founder, on publish). Hook auth is the shared secret in
 * `requireHookCaller`.
 *
 * WHY THE TOLERANCE IS NARROW NOW (2026-08-14): this used to answer ANY error
 * from purge_old_telemetry with `{ ok: true, skipped: "pending-migration" }`.
 * The function is installed, so in practice that branch could only ever be
 * reached by a real failure -- a revoked grant, a statement timeout on a large
 * delete, a lock. The purge would stop happening, telemetry would accumulate
 * past the 180-day window forever, and the job would report success once a day
 * while it did. A retention promise that silently stops being kept is the worst
 * kind of thing to report ok on, so only a genuinely absent function skips now;
 * everything else throws and lands in `job_runs` as an error.
 */
const RETENTION_DAYS = 180;

export const Route = createFileRoute("/api/public/hooks/retention-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;
        const json = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body), {
            status,
            headers: { "Content-Type": "application/json" },
          });
        return withJobRunHttp("cron.retention-tick", async () => {
          // supabase-js RESOLVES a refused call as { data: null, error } instead
          // of throwing, so the error object is the only place the failure shows.
          const { data, error } = await (supabaseAdmin as unknown as SupabaseClient).rpc(
            "purge_old_telemetry",
            { _older_than_days: RETENTION_DAYS },
          );
          if (error) {
            if (isMissingDatabaseObject(error)) {
              // The one honest skip: the migration that creates the function has
              // not run on this supaprod yet, so there is nothing to purge from.
              return json({ ok: true, skipped: "pending-migration", note: error.message });
            }
            // Anything else means the purge did not happen and nobody would know.
            throw new Error(`purge_old_telemetry failed: ${error.message}`);
          }
          return json({ ok: true, result: data });
        });
      },
    },
  },
});
