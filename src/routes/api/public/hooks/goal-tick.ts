import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun } from "@/lib/observability";
import { runGoalWorkPass, type GoalRow } from "@/lib/goals.server";

/**
 * SW-4 / mission 3.10 GOAL MODE goal-tick.
 *
 * The re-planning heartbeat for standing goals: every 20 minutes, sweep
 * active goals oldest-worked-first and run one work pass each. A pass is
 * spend-bounded (one proposal per goal per 24h, checked before any model
 * call) and only ever proposes into Decide; it executes nothing. HITL stays
 * at the existing gates.
 *
 * Bounded: 5 goals per tick. Tolerates the pre-migration window (missing
 * table returns ok/no-op, the trigger-tick precedent).
 */

const MAX_GOALS_PER_TICK = 5;

export const Route = createFileRoute("/api/public/hooks/goal-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("goals.goal-tick", async () => {
          const { data: goals, error } = await supabaseAdmin
            .from("goals" as never)
            .select("id, user_id, workspace_id, title, description, target_metric, target_date, status, last_worked_at")
            .eq("status", "active")
            .order("last_worked_at", { ascending: true, nullsFirst: true })
            .limit(MAX_GOALS_PER_TICK);

          if (error) {
            const code = (error as { code?: string }).code;
            if (code === "42P01" || code === "PGRST205" || code === "42703" || code === "PGRST204") {
              return json({ ok: true, processed: 0, note: "goals not migrated yet" });
            }
            return json({ ok: false, error: error.message }, 500);
          }

          const results: Array<{ goal_id: string; proposed?: number; skipped?: string; error?: string }> = [];
          for (const g of (goals ?? []) as unknown as GoalRow[]) {
            try {
              const res = await runGoalWorkPass(supabaseAdmin as never, g);
              results.push({ goal_id: g.id, proposed: res.proposed, ...(res.proposed === 0 ? { skipped: res.skipped } : {}) });
            } catch (e) {
              results.push({ goal_id: g.id, error: e instanceof Error ? e.message : String(e) });
            }
          }

          return json({ ok: true, processed: (goals ?? []).length, results });
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
