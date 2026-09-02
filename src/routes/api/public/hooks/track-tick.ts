import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { withJobRun } from "@/lib/observability";
import { driveTrackOnce, DRIVE_SELECT, type DriveRow } from "@/lib/spine/driver.server";
import { TERMINAL_HOLDS } from "@/lib/spine/correction";
import { notInList, sampleWorkspaceIds } from "@/lib/ticks/real-workspaces.server";
// The sweep and the driver now stop on the SAME clock. Sharing the predicate
// rather than re-deriving one is what keeps them from drifting apart.
import { outOfTime } from "@/lib/spine/track-caps.server";
import {
  HOLDS_THAT_WAIT_ON_A_DATE,
  pickDrivable,
  scheduledAwayIds,
} from "@/lib/spine/waiting-on-a-date-is-not-waiting-in-a-queue";
import { dueDatesFor } from "@/lib/spine/waiting-on-a-date-is-not-waiting-in-a-queue.server";

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
 * 20260801150000, NULLS FIRST), so a newly started track begins promptly.
 *
 * THE ORDERING IS RIGHT AND IT WAS NOT ENOUGH. This sentence used to end "and
 * one busy track can never starve the rest", which was the one thing it could
 * not do. `driveTrackOnce` stamps `driven_at` on every path out, including the
 * out-of-time path where it did nothing, so an unserved track had its ordering
 * key rewritten too and the next tick reproduced this tick's order exactly.
 * Measured before the fix: eighteen consecutive ticks in identical order, and a
 * track sat two hours fifty minutes at zero seats, zero spend, zero attempts.
 * The sweep now stops at the shared deadline instead of starting a track it
 * cannot serve, so an unreached track keeps its older timestamp and goes first
 * next time. See the loop below.
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

          /*
           * WORK THAT CAN NEVER MOVE DOES NOT GET A SLOT.
           *
           * `given-up` and `station-cannot-finish` are the two holds no code path
           * clears; `RESUMABLE_HOLDS` excludes them for the same reason, because
           * "neither asked for anything, so nothing can arrive that would make a
           * retry justified." `decideDrive` refuses them every time, so every
           * slot one occupies is a slot spent proving that again.
           *
           * MEASURED 2026-08-24 23:50 UTC: the live workspace held five
           * `given-up` tracks and one live one. All five slots went to the dead
           * work, the live track sorted sixth and was not driven, and the tick
           * reported `ok` in 500ms. A refused track is still stamped so it sorts
           * to the back and the live one comes round next time, which makes this
           * a HALVING of throughput rather than a freeze -- and an invisible one.
           *
           * THE NULL BRANCH IS LOAD-BEARING AND IS NOT DEFENSIVE PADDING. A
           * healthy track carries `last_hold = NULL`, and in SQL `NULL <> 'x'`
           * is NULL, not true -- so a bare `not.eq` or `not.in` filter drops
           * every healthy track from the sweep and leaves it driving only work
           * that has already failed once. Written the plain way first, and it
           * had exactly that bug. The `is.null` arm is what keeps normal work in.
           */
          const notTerminal = TERMINAL_HOLDS.map((h) => `last_hold.neq.${h}`).join(",");
          trackQuery = trackQuery.or(`last_hold.is.null,and(${notTerminal})`) as never;

          /*
           * OVER-FETCHED ON PURPOSE (F-183). A track waiting on a forecast
           * horizon is filtered out below, and the freed slot has to go to the
           * next track rather than being lost — which it would be if the SQL
           * limit were still the final count.
           *
           * Bounded at 3x rather than unbounded: the filter only ever removes
           * `needs-evidence` tracks with a future date, and a workspace with ten
           * of those and nothing live has a different problem than a page size.
           */
          /*
           * ── A PERSON CAN SAY WHICH ONE FIRST, AND NOTHING ELSE CHANGES ────
           *
           * Founder, 2026-09-02: *"when various signals are queued, bucketed and
           * themed, how do I decide which one to hack on?"* Round robin by
           * `driven_at` is deliberately fair and deliberately opinionless -- the
           * run that moved longest ago goes next -- and between the promotion
           * bar and this ordering there was no way for the person who owns the
           * work to say "this one".
           *
           * `pinned_at` FIRST, `nulls last`, so the pins are served in the order
           * they were made and every unpinned run keeps exactly the round robin
           * it had. Nothing is starved: a pin is a position in the queue, not a
           * lock, and each tick still takes the next few and moves on.
           *
           * The pin column arrives in its own migration, and a database that has
           * not taken it yet would fail this whole select on an unknown column.
           * `orderSafely` runs the ordered query and falls back to the
           * unordered-by-pin one on 42703, which is the same deployment-order
           * refusal `stopRequestedAt` makes in the driver: a missing column
           * degrades one behaviour, never the sweep.
           */
          const byPinThenAge = async () =>
            await trackQuery
              .order("pinned_at", { ascending: true, nullsFirst: false })
              .order("driven_at", { ascending: true, nullsFirst: true })
              .limit(MAX_TRACKS_PER_TICK * 3);

          let { data: tracks, error } = await byPinThenAge();
          if (
            error &&
            ((error as { code?: string }).code === "42703" || /pinned_at/.test(error.message ?? ""))
          ) {
            ({ data: tracks, error } = await trackQuery
              .order("driven_at", { ascending: true, nullsFirst: true })
              .limit(MAX_TRACKS_PER_TICK * 3));
          }

          if (error) {
            const code = (error as { code?: string }).code;
            // 42P01 = undefined_table. The migration has not been applied yet,
            // which is a state to wait out rather than an error to raise.
            if (code === "42P01")
              return json({ ok: true, driven: 0, note: "no spine_tracks table" });
            throw new Error(error.message);
          }

          const fetched = (tracks ?? []) as unknown as DriveRow[];

          /*
           * ── WAITING ON A DATE IS NOT WAITING IN A QUEUE (F-183, from S4-179) ──
           *
           * Measured 2026-08-31, drives since 18:00 UTC across four live tracks:
           * 6 / 5 / 5 / 2. **Ten of eighteen went to two tracks that could not
           * progress**, and the live acceptance candidate got two. Drives are
           * sequential against one shared 45-second deadline, so a slot spent on
           * a track that will hold is a slot the working one does not get.
           *
           * `d2263583` is not stuck and nothing is wrong with it: it is
           * correctly waiting for a 2026-10-15 forecast horizon. **Work with a
           * known return date does not need to be called terminal — it needs to
           * be told "not before then".** Adding it to `TERMINAL_HOLDS` would
           * delete the only signal the track exists, which S4 refused before
           * proposing this and which the block above already warns about.
           *
           * ONE EXTRA READ PER TICK, and only when a candidate actually holds
           * `needs-evidence`. A failed read schedules nothing away.
           */
          const waiting = fetched.filter((r) =>
            HOLDS_THAT_WAIT_ON_A_DATE.includes(
              ((r as { last_hold?: string | null }).last_hold ?? "") as never,
            ),
          );
          const dueByTrack = waiting.length
            ? await dueDatesFor(
                supabaseAdmin as unknown as SupabaseClient,
                waiting.map((r) => r.id),
              )
            : new Map<string, string | null>();
          const scheduledAway = scheduledAwayIds(
            fetched as unknown as Array<{ id: string; last_hold?: string | null }>,
            dueByTrack,
            new Date(),
          );
          const rows = pickDrivable(
            fetched as unknown as Array<{ id: string; last_hold?: string | null }>,
            scheduledAway,
            MAX_TRACKS_PER_TICK,
          ) as unknown as DriveRow[];
          // One clock for the whole sweep. The Worker's request budget is spent
          // by every track together, so the deadline has to be shared rather
          // than restarted per track.
          const tickStartedAt = Date.now();
          const client = supabaseAdmin as unknown as SupabaseClient;
          const outcomes: string[] = [];

          // Sequential, not parallel. Each drive dispatches a real agent that
          // spends real money against a shared cap, and five concurrent loops
          // would race the cap check rather than respect it.
          /*
           * THE SWEEP STOPS AT THE SAME DEADLINE THE DRIVER CHECKS, and until
           * 2026-08-23 it did not, which is what froze the rotation.
           *
           * `driveTrackOnce` stamps `driven_at` on EVERY path out of it,
           * including the out-of-time one where it did no work at all. So a
           * track the tick could not serve still had the ordering key rewritten,
           * and `ORDER BY driven_at ASC` on the next tick reproduced this tick's
           * order exactly. Position in the queue was set by whatever order the
           * tracks first entered the batch and nothing could ever change it.
           *
           * Measured in production: eighteen consecutive ticks in the same
           * order, one track holding zero seats for two hours fifty minutes with
           * `spend_used_usd` 0 and `attempts` 0, and the order identical across
           * two snapshots taken an hour apart. The header above claimed "one busy
           * track can never starve the rest"; it was the one thing the sweep
           * could not do.
           *
           * NOT STAMPING IS THE WHOLE FIX. An unreached track keeps its older
           * `driven_at`, so it sorts to the head of the next tick and the frozen
           * order becomes a strict round robin. Nothing needs to remember whose
           * turn it is, because the timestamp already does.
           *
           * `break` rather than `continue`: the rows are ordered and every one
           * after this is equally out of time, so continuing would pay each
           * track's read prologue to reach the same conclusion.
           */
          // Counted, not derived from `outcomes.length`, because `outcomes` also
          // carries the skip line below and a throw still counts as a track this
          // tick looked at and stamped.
          let driven = 0;
          let skipped = 0;
          for (const row of rows) {
            if (outOfTime(tickStartedAt, Date.now())) {
              skipped = rows.length - driven;
              outcomes.push(
                `The loop ran long, so ${skipped} ${skipped === 1 ? "piece" : "pieces"} of work were not looked at this time. They go first next time.`,
              );
              break;
            }
            driven += 1;
            try {
              // F-55. `"sweep"` — nobody is watching this one. These are the
              // transitions acceptance criterion 2 is about, and the only ones a
              // query proving an untouched run may count.
              const outcome = await driveTrackOnce(client, row, "sweep", tickStartedAt);
              outcomes.push(outcome.line);
            } catch (e) {
              // One track that throws must never stop the sweep, or a single
              // bad row freezes every other piece of work in the workspace.
              const why = e instanceof Error ? e.message : String(e);
              console.error(`track-tick: ${row.id} threw: ${why}`);
              outcomes.push(`${row.title} could not be driven: ${why}`);
            }
          }

          // `driven` was `rows.length`, which counted a track the sweep stamped
          // and never served. SOURCE-OF-TRUTH quotes this field as production
          // evidence, so it has to mean what it says.
          return json({ ok: true, driven, skipped, outcomes });
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
