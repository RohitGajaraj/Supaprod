import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { withJobRun } from "@/lib/observability";
import { driveTrackOnce, DRIVE_SELECT, type DriveRow } from "@/lib/spine/driver.server";

/**
 * The heartbeat that makes the loop run when nobody is watching.
 *
 * FOUNDER RULING 2026-08-01: "even if human do not watch, agent should be able
 * to complete entire thing and deliver the outcome to the user. End to end
 * product lifecycle needs to be taken care."
 *
 * This is the piece that was missing. Every station worked and the orchestrator
 * already drove missions autonomously inside Build, but carrying one piece of
 * work from Discover to Learn required a person to click through a `navigate()`
 * call at each transition. So the loop ran exactly as long as someone was
 * watching it, which is the opposite of the claim the product makes.
 *
 * ONE STATION PER TRACK PER TICK, deliberately. A tick that drove a track all
 * the way to Learn would spend an unbounded amount of money in one request and
 * would give a person no window in which to look at it, change a boundary or
 * stop it. One station at a time means the whole loop still completes without
 * anyone present, just visibly and interruptibly.
 *
 * LEAST RECENTLY DRIVEN FIRST (the partial index added by migration
 * 20260801150000, NULLS FIRST), so a newly started track begins promptly and
 * one busy track can never starve the rest.
 *
 * Bounded at 5 tracks. Tolerates the pre-migration window by returning ok and
 * doing nothing, the goal-tick precedent.
 */

const MAX_TRACKS_PER_TICK = 5;

export const Route = createFileRoute("/api/public/hooks/track-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("spine.track-tick", async () => {
          const { data: tracks, error } = await supabaseAdmin
            .from("spine_tracks" as never)
            .select(DRIVE_SELECT)
            .eq("status", "open")
            .order("driven_at", { ascending: true, nullsFirst: true })
            .limit(MAX_TRACKS_PER_TICK);

          if (error) {
            const code = (error as { code?: string }).code;
            // 42P01 = undefined_table. The migration has not been applied yet,
            // which is a state to wait out rather than an error to raise.
            if (code === "42P01")
              return json({ ok: true, driven: 0, note: "no spine_tracks table" });
            throw new Error(error.message);
          }

          const rows = (tracks ?? []) as unknown as DriveRow[];
          const client = supabaseAdmin as unknown as SupabaseClient;
          const outcomes: string[] = [];

          // Sequential, not parallel. Each drive dispatches a real agent that
          // spends real money against a shared cap, and five concurrent loops
          // would race the cap check rather than respect it.
          for (const row of rows) {
            try {
              const outcome = await driveTrackOnce(client, row);
              outcomes.push(outcome.line);
            } catch (e) {
              // One track that throws must never stop the sweep, or a single
              // bad row freezes every other piece of work in the workspace.
              const why = e instanceof Error ? e.message : String(e);
              console.error(`track-tick: ${row.id} threw: ${why}`);
              outcomes.push(`${row.title} could not be driven: ${why}`);
            }
          }

          return json({ ok: true, driven: rows.length, outcomes });
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
