import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { withJobRun } from "@/lib/observability";
import { driveTrackOnce, DRIVE_SELECT, type DriveRow } from "@/lib/spine/driver.server";
import { notInList, sampleWorkspaceIds } from "@/lib/ticks/real-workspaces.server";

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
 *
 * NOT ON DEMO FIXTURES (2026-08-21). This tick was the single remaining path
 * spending real money on sample workspaces after the fourteen-hook `is_sample`
 * fix, and it was by far the largest. Measured in production in the two hours
 * after that fix deployed: **every** agent run carried a `track_id` -- 23 of 23,
 * none from any other tick -- at 114 `agent` model calls and **$0.21 in two
 * hours**, which annualises past the whole spend the first fix was written to
 * stop.
 *
 * The fix could not have reached it, and the shape is the lesson: `spine_tracks`
 * is a WORKSPACE-SCOPED table, so it carries `workspace_id` and no `is_sample`
 * at all, and a filter on the `workspaces` table never touches it. The exclusion
 * has to travel by id -- see `lib/ticks/real-workspaces.server.ts`.
 *
 * **`researcher-tick` was never a second instance of this. It was this one, seen
 * twice.** Its `researcher` runs were read as proof its own fix had failed. They
 * all carried a `track_id`: this tick was driving a track through a research
 * station, and that fix had worked all along. A run records which AGENT ran,
 * never which TICK started it, so the agent slug is the wrong end of the
 * question and `track_id` is the right one.
 *
 * At the time of writing there were **52 open tracks and every one was on a
 * sample workspace**, none on a real one, so this tick was doing no useful work
 * whatsoever: a demo fixture driving itself in a circle.
 */

const MAX_TRACKS_PER_TICK = 5;

export const Route = createFileRoute("/api/public/hooks/track-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("spine.track-tick", async () => {
          // Excluded BY ID, because spine_tracks carries workspace_id and not
          // is_sample. An empty exclusion list means nothing to exclude, which is
          // right for a fresh database and is also what a failed read returns: a
          // tick that cannot reach the list should still drive real work rather
          // than stop silently.
          const excluded = notInList(await sampleWorkspaceIds(supabaseAdmin as never));
          let trackQuery = supabaseAdmin
            .from("spine_tracks" as never)
            .select(DRIVE_SELECT)
            .eq("status", "open");
          if (excluded) trackQuery = trackQuery.not("workspace_id", "in", excluded) as never;
          const { data: tracks, error } = await trackQuery
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
          // One clock for the whole sweep. The Worker's request budget is spent
          // by every track together, so the deadline has to be shared rather
          // than restarted per track.
          const tickStartedAt = Date.now();
          const client = supabaseAdmin as unknown as SupabaseClient;
          const outcomes: string[] = [];

          // Sequential, not parallel. Each drive dispatches a real agent that
          // spends real money against a shared cap, and five concurrent loops
          // would race the cap check rather than respect it.
          for (const row of rows) {
            try {
              const outcome = await driveTrackOnce(client, row, tickStartedAt);
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
