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
  deferUntil,
  DRIVES_BEFORE_BACKOFF,
  stuckBackoffMinutes,
  type DriveEntry,
} from "@/lib/spine/three-tries-and-nothing-changed";
import {
  HOLDS_THAT_WAIT_ON_A_DATE,
  pickDrivable,
  scheduledAwayIds,
  unchangedSinceLastDrive,
} from "@/lib/spine/waiting-on-a-date-is-not-waiting-in-a-queue";
import {
  dueDatesFor,
  tracksAReadingBringsForward,
} from "@/lib/spine/waiting-on-a-date-is-not-waiting-in-a-queue.server";

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
           * -- P-03a. WAITING ON A DATE DOES NOT MEAN HOLDING THE FRONT ------
           *
           * F-183 stopped the sweep SPENDING a drive on a track whose forecast
           * horizon has not arrived. It did not make the track give up its
           * PLACE: nothing stamped it, so it sorted first by `driven_at ASC`
           * every tick, was fetched, and was filtered out again -- consuming one
           * of the fifteen rows to prove the same thing forever.
           *
           * That is the failure the comment on the ordering below already warns
           * about, arriving through the fix for a different one. Two such tracks
           * sat ahead of the live acceptance candidate on 2026-09-03, and the
           * evening this was found the sweep had 5 slots and 5 tracks ahead.
           *
           * `deferred_until` is written when the filter below schedules a track
           * away and cleared on every drive, so the skip happens in SQL and the
           * row is never fetched at all. `driven_at` was the cheaper place to
           * put this and is the wrong one: the Start list reads it to say when a
           * run last moved, and stamping it every ten minutes would make a track
           * deliberately asleep until October look busy on the one screen a
           * person actually reads.
           */
          const deferrable = `deferred_until.is.null,deferred_until.lte.${new Date().toISOString()}`;
          const withoutDeferred = trackQuery.or(deferrable) as never;

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
          const ordered = (q: typeof trackQuery) =>
            q
              .order("pinned_at", { ascending: true, nullsFirst: false })
              .order("driven_at", { ascending: true, nullsFirst: true })
              .limit(MAX_TRACKS_PER_TICK * 3);

          let { data: tracks, error } = await ordered(withoutDeferred);
          /*
           * BOTH NEW COLUMNS DEGRADE THE SAME WAY, AND SEPARATELY.
           *
           * A database that has not taken `pinned_at` or `deferred_until` fails
           * the whole select on an unknown column, so each falls back to the
           * query that does not name it. `deferred_until` missing means the
           * sweep behaves exactly as it did before P-03a -- fetching the
           * scheduled-away tracks and filtering them below -- which is the
           * correct degradation: one behaviour lost, never the sweep.
           */
          const missingColumn = (e: typeof error, name: string) =>
            Boolean(
              e &&
              ((e as { code?: string }).code === "42703" || new RegExp(name).test(e.message ?? "")),
            );
          if (missingColumn(error, "deferred_until")) {
            ({ data: tracks, error } = await ordered(trackQuery));
          }
          if (missingColumn(error, "pinned_at")) {
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
          /*
           * ── P-144 SCOPE 3. A RECORDED NUMBER SETTLES THE WAIT EARLY ───────
           *
           * The forecast's due date is the LATEST Learn returns, not the
           * earliest. Where a person has recorded a number the forecast's band
           * can settle, the wait is over and the track goes back in the queue
           * today.
           *
           * DROPPED FROM THE MAP rather than added to a second skip set,
           * because `scheduledAwayIds` already holds the law this needs: a
           * candidate with no entry is never scheduled away. Expressing the lift
           * as "this track is no longer waiting on a date" reuses that rule
           * instead of adding a parallel one that could disagree with it.
           *
           * Nothing lifts today: 133 specs carry 0 readings between them
           * (measured 2026-09-04), so this is the reader that makes the first
           * recorded number matter rather than a behaviour already running.
           */
          const lifted = waiting.length
            ? await tracksAReadingBringsForward(
                supabaseAdmin as unknown as SupabaseClient,
                waiting.map((r) => r.id),
              )
            : new Set<string>();
          for (const id of lifted) dueByTrack.delete(id);
          /*
           * -- P-03b. NOTHING HAS CHANGED, SO THERE IS NOTHING TO LOOK AT ----
           *
           * The date half of this is `deferred_until` above. This is the person
           * half: a track held on something only a person can do, whose row has
           * not moved since the last drive, has nothing new for this tick to
           * read. `6199f3df` was driven six times in an hour that way while the
           * acceptance candidate sat behind it.
           *
           * Filtered HERE rather than in SQL, deliberately and unlike
           * `deferred_until`. The comparison is between two columns and the gate
           * check reads a JSON array, which PostgREST cannot express without a
           * view or an RPC; and the population is one page, so the cost is a
           * comparison per row rather than a query. `pickDrivable` already takes
           * a skip set, so this needs no new shape.
           */
          const unchanged = new Set(
            fetched
              .filter((r) =>
                unchangedSinceLastDrive(
                  r as unknown as Parameters<typeof unchangedSinceLastDrive>[0],
                ),
              )
              .map((r) => r.id),
          );

          const scheduledAway = scheduledAwayIds(
            fetched as unknown as Array<{ id: string; last_hold?: string | null }>,
            dueByTrack,
            new Date(),
          );
          /*
           * WRITE THE DATE DOWN SO THE NEXT TICK DOES NOT HAVE TO WORK IT OUT.
           *
           * One write per newly-deferred track, and only for tracks this tick
           * actually scheduled away, so a steady state costs nothing: once the
           * column is set the SQL above stops fetching the row and this loop
           * never sees it again until the date passes.
           *
           * Fail-safe by the same contract the drive log keeps: a failed write
           * means the track is fetched and filtered again next tick, which is
           * exactly today's behaviour. Losing this write costs a slot; letting
           * it throw would cost the whole sweep.
           */
          if (scheduledAway.size > 0) {
            const until = [...scheduledAway]
              .map((id) => ({ id, due: dueByTrack.get(id) ?? null }))
              .filter((x): x is { id: string; due: string } => Boolean(x.due));
            for (const { id, due } of until) {
              const { error: deferErr } = await supabaseAdmin
                .from("spine_tracks" as never)
                .update({ deferred_until: due } as never)
                .eq("id", id);
              if (deferErr) {
                console.error(`[track-tick] could not defer ${id}: ${deferErr.message}`);
                // One report is enough. The rest of this tick's work matters
                // more than a second identical line per track.
                break;
              }
            }
          }

          /*
           * ── THREE INTO THE SAME WALL DO NOT EARN A FOURTH (P-113) ────────
           *
           * See `three-tries-and-nothing-changed`. Here rather than at
           * the end of a drive because `driveTrackOnce` has fourteen exits and
           * this repo has already paid for chasing writers one at a time --
           * eligibility is one place and it is where a slot is actually spent.
           *
           * Two batched reads for the whole page of candidates rather than two
           * per track: the drives that have happened, and the newest artifact
           * each has filed. A track that filed something among those drives is
           * moving and is left alone.
           */
          const stuckAway = new Set<string>();
          const candidateIds = (fetched as unknown as Array<{ id: string }>)
            .map((r) => r.id)
            .filter((id) => !scheduledAway.has(id) && !unchanged.has(id));
          if (candidateIds.length > 0) {
            const { data: driveRows, error: drivesErr } = await supabaseAdmin
              .from("track_drives")
              .select("track_id,entry_hold,at")
              .in("track_id", candidateIds)
              .order("at", { ascending: false })
              .limit(candidateIds.length * DRIVES_BEFORE_BACKOFF * 3);
            const { data: memberRows } = await supabaseAdmin
              .from("spine_track_members")
              .select("track_id,created_at")
              .in("track_id", candidateIds)
              .order("created_at", { ascending: false });

            /* A READ THAT FAILED DEFERS NOBODY. Holding a track back on
               evidence we could not gather is the one direction this rule must
               not fail in: it would cost the work rather than the money. */
            if (!drivesErr) {
              const byTrack = new Map<string, DriveEntry[]>();
              for (const d of (driveRows ?? []) as Array<{
                track_id: string | null;
                entry_hold: string | null;
                at: string | null;
              }>) {
                if (!d.track_id || !d.at) continue;
                const list = byTrack.get(d.track_id) ?? [];
                if (list.length < DRIVES_BEFORE_BACKOFF * 2) {
                  list.push({ hold: d.entry_hold, at: d.at });
                  byTrack.set(d.track_id, list);
                }
              }
              const newestArtifact = new Map<string, string>();
              for (const m of (memberRows ?? []) as Array<{
                track_id: string | null;
                created_at: string | null;
              }>) {
                if (!m.track_id || !m.created_at) continue;
                if (!newestArtifact.has(m.track_id)) newestArtifact.set(m.track_id, m.created_at);
              }

              const backoffNow = new Date();
              /* What each candidate was last priced at, from the rows already
                 fetched: no extra read, and `backed_off_at` is in DRIVE_SELECT. */
              const backedOffAt = new Map<string, string | null>(
                (fetched as unknown as Array<{ id: string; backed_off_at?: string | null }>).map(
                  (r) => [r.id, r.backed_off_at ?? null],
                ),
              );
              for (const id of candidateIds) {
                const minutes = stuckBackoffMinutes({
                  recent: byTrack.get(id) ?? [],
                  newestArtifactAt: newestArtifact.get(id) ?? null,
                  /* One history earns one deferral: a run of held drives that
                     has already been priced does not get priced again, or the
                     deferral prevents the very drive that would change it. */
                  backedOffAt: backedOffAt.get(id) ?? null,
                });
                if (minutes === null) continue;
                const { error: backErr } = await supabaseAdmin
                  .from("spine_tracks" as never)
                  .update({
                    deferred_until: deferUntil(minutes, backoffNow),
                    /* Stamped WITH the deferral, so the history that bought it
                       cannot buy another one. */
                    backed_off_at: backoffNow.toISOString(),
                  } as never)
                  .eq("id", id);
                if (backErr) {
                  /* The deferral above's contract: a failed write means the
                     track is driven this tick, which is today's behaviour.
                     Losing it costs money once; throwing costs the sweep. */
                  console.error(`[track-tick] could not back off ${id}: ${backErr.message}`);
                  break;
                }
                stuckAway.add(id);
              }
            }
          }

          const rows = pickDrivable(
            fetched as unknown as Array<{ id: string; last_hold?: string | null }>,
            new Set([...scheduledAway, ...unchanged, ...stuckAway]),
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
