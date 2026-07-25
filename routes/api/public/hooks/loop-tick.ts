import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun } from "@/lib/observability";
import { runLoopPass, type LoopRow } from "@/lib/loops.server";

/**
 * SW-4 / mission 3.10 LOOP MODE loop-tick.
 *
 * The scheduler for user-owned recurring loops: every 10 minutes, sweep
 * active loops whose next_run_at has arrived, oldest-due-first, and run one
 * pass each. A pass wraps an existing platform pass (strategy brief,
 * re-cluster, outcome review), writes a loop_runs receipt with its cost, and
 * always advances next_run_at so a broken loop retries on its supaprod
 * instead of hot-looping.
 *
 * Bounded: 5 loops per tick. Tolerates the pre-migration window (missing
 * table returns ok/no-op, the goal-tick precedent).
 */

const MAX_LOOPS_PER_TICK = 5;

export const Route = createFileRoute("/api/public/hooks/loop-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("loops.loop-tick", async () => {
          const nowIso = new Date().toISOString();
          const { data: loops, error } = await supabaseAdmin
            .from("loops" as never)
            .select(
              "id, user_id, workspace_id, kind, title, supaprod, status, last_run_at, next_run_at",
            )
            .eq("status", "active")
            .lte("next_run_at", nowIso)
            .order("next_run_at", { ascending: true })
            .limit(MAX_LOOPS_PER_TICK);

          if (error) {
            const code = (error as { code?: string }).code;
            if (
              code === "42P01" ||
              code === "PGRST205" ||
              code === "42703" ||
              code === "PGRST204"
            ) {
              return json({ ok: true, processed: 0, note: "loops not migrated yet" });
            }
            return json({ ok: false, error: error.message }, 500);
          }

          const results: Array<{
            loop_id: string;
            ok?: boolean;
            summary?: string;
            error?: string;
          }> = [];
          for (const l of (loops ?? []) as unknown as LoopRow[]) {
            try {
              const res = await runLoopPass(supabaseAdmin as never, l);
              results.push({ loop_id: l.id, ok: res.ok, summary: res.summary });
            } catch (e) {
              results.push({ loop_id: l.id, error: e instanceof Error ? e.message : String(e) });
            }
          }

          return json({ ok: true, processed: (loops ?? []).length, results });
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
