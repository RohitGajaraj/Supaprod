import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun } from "@/lib/observability";

/**
 * RF-08 (v12 audit §2.4, defect 3): per-agent cron scheduling is a dead
 * feature, not a partially-built one. This stub never enqueues a run — it
 * only stamps `last_scheduled_run_at` — and the one function that could ever
 * set `agents.cron_schedule` (`updateAgentSchedule`) had zero callers (no
 * Agents-page UI ever wired it), so it was removed as dead code. With no
 * writer left, `cron_schedule` can never be non-null, so this handler's
 * query always returns zero rows. Left unregistered in any cron migration
 * (it always was) rather than scheduling a job that can only ever no-op.
 * Kept as inert scaffold for a real per-agent scheduling feature if one is
 * ever built; do not wire a cron to it without first restoring a way to set
 * `cron_schedule`.
 */
export const Route = createFileRoute("/api/public/hooks/agent-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;
        return withJobRun("cron.agent-tick", async () => {
          try {
            const { data: agents } = await supabaseAdmin
              .from("agents")
              .select("id,cron_schedule,last_scheduled_run_at,enabled")
              .eq("enabled", true)
              .not("cron_schedule", "is", null);
            // Lightweight: stamp last_scheduled_run_at when over 1h since last
            let touched = 0;
            const cutoff = Date.now() - 60 * 60 * 1000;
            for (const a of agents ?? []) {
              const last = a.last_scheduled_run_at
                ? new Date(a.last_scheduled_run_at).getTime()
                : 0;
              if (last < cutoff) {
                await supabaseAdmin
                  .from("agents")
                  .update({ last_scheduled_run_at: new Date().toISOString() })
                  .eq("id", a.id);
                touched++;
              }
            }
            return new Response(JSON.stringify({ ok: true, touched }), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (e) {
            return new Response(
              JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }
        });
      },
    },
  },
});
