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
 * always advances next_run_at so a broken loop retries on its cadence
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
              "id, user_id, workspace_id, kind, title, cadence, status, last_run_at, next_run_at",
            )
            .eq("status", "active")
            .lte("next_run_at", nowIso)
            .order("next_run_at", { ascending: true })
            .limit(MAX_LOOPS_PER_TICK);

          if (error) {
            const code = (error as { code?: string }).code;
            /*
             * A MISSING TABLE AND A MISSING COLUMN ARE NOT THE SAME FACT, AND
             * TREATING THEM AS ONE COST THIS FEATURE FIVE WEEKS.
             *
             * A missing TABLE (42P01 / PGRST205) really is pre-migration
             * tolerance: the code shipped ahead of its schema, which is normal
             * here because a Lovable publish does not run `supabase/migrations`.
             * Reporting ok and doing nothing is the right answer, once.
             *
             * A missing COLUMN on a table that EXISTS is the opposite. It means
             * the code and the schema disagree about a table both of them have,
             * and that is a defect, not a lag -- it cannot fix itself by waiting.
             *
             * What it cost: commit c5d479fd6 ("Rename product Cadence ->
             * Supaprod") replaced the word `cadence` INSIDE this select string,
             * so it asked for a column named `supaprod` that has never existed.
             * PostgREST answered 42703, this branch swallowed it, and the tick
             * returned `{ok: true, processed: 0}` **144 times a day since
             * 2026-07-16**. Measured 2026-08-22: 28 active loops, all 28 overdue,
             * 29 of 29 having run exactly once -- inline at creation -- and
             * ZERO tick errors recorded in seven days. A dead scheduler
             * reporting green is worse than one that is visibly broken.
             *
             * So 42703 now fails loudly like any other error. `tsc` cannot catch
             * this class: Supabase select strings are loosely typed, which is a
             * trap `AGENTS.md` already records.
             */
            if (code === "42P01" || code === "PGRST205") {
              return json({ ok: true, processed: 0, note: "loops table not migrated yet" });
            }
            if (code === "42703" || code === "PGRST204") {
              console.error(`loop-tick: schema disagreement, loops is missing a column: ${error.message}`);
              return json(
                { ok: false, error: `loops schema disagreement: ${error.message}` },
                500,
              );
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
