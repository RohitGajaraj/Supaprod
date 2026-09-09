/**
 * WHAT THIS WORKSPACE HAS CONNECTED, SO A STATION THAT FOUND NOTHING CAN SAY
 * WHETHER THERE WAS ANYWHERE TO LOOK.
 *
 * ── WHY IT EXISTS, MEASURED ───────────────────────────────────────────────
 * 23 workspaces on production. **0 scout targets, of any kind, enabled or
 * not**, and 124 of 124 `sources.status` calls in the product's history
 * returned `{"active_scout_targets": 0}`. Three workspaces of the 23 have a
 * repository bound; the rest have none.
 *
 * ── AND THE FIRST VERSION COUNTED THE WRONG THING ─────────────────────────
 * I read those zeros and had this count SCOUT TARGETS. S1 measured the rest an
 * hour later: **1,524 signals exist**, written by agent runs rather than
 * ingested by a configured source. A workspace can therefore hold no scout
 * target and 334 signals, and a surface saying "there was nowhere to look"
 * would be false on every one of them.
 *
 * So it counts EVIDENCE. A scout target is one way evidence arrives; what
 * Discover needs is some. The door still points at Sources, because that is how
 * a person deliberately adds evidence, and the sentence names evidence rather
 * than the feature, because they are not the same thing.
 *
 * On the run screen that reads as "Discover: nothing found" and "Build filed
 * nothing" -- true sentences that sound like findings about the work, when they
 * are facts about the setup. `nowhere-to-look-yet.ts` holds the decision and
 * refuses to speak without these facts, on purpose: workspaces DO hold signals
 * (1,524 of them, arriving by routes other than a scout), so "found nothing"
 * genuinely means "searched and found nothing" on some of them, and a surface
 * that guessed would be lying half the time.
 *
 * ── ASK THE WORKSPACE, NOT THE AGENT ──────────────────────────────────────
 * The alternative was to read the blocker out of the agent's prose -- "No
 * repository is connected for this workspace" is right there in
 * `agent_runs.output`. S1 named why that is a trap and they are right: pattern
 * matching an English sentence gives a door that vanishes the moment a model
 * rewords it, and an absent door looks exactly like a run that did not need
 * one. An invisible failure is the worst kind to ship.
 *
 * State cannot reword itself. And it generalises past the one case: the shape
 * is "the station is blocked and the thing that station needs is not
 * configured", which is Discover and a source, Build and a repository, Ship and
 * somewhere to release to.
 *
 * ── ONE ROUND OF HOPS ─────────────────────────────────────────────────────
 * Three `head: true` counts in one `Promise.all`, so this is one round trip's
 * latency rather than three. On this Worker a slow function is sequential hops
 * and never the query itself -- the repo has paid for that lesson repeatedly --
 * so the shape matters more than the tables.
 *
 * ── AND EVERY FIELD CAN BE NULL, WHICH IS NOT "NO" ────────────────────────
 * A read that failed and a workspace with nothing connected are different
 * answers, and the surface draws only on the second. `null` here means the
 * count did not come back, so `nowhere-to-look-yet` stays silent rather than
 * telling a person to connect something when we could not tell whether they
 * had. That is the rule `gatesLiveWork`'s docstring spends a paragraph on, and
 * this is the second place it has mattered this week.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { WorkspaceSetup } from "@/components/track/nowhere-to-look-yet";
import { wallsByTrack } from "@/lib/spine/the-wall-the-platform-put-up";

/**
 * `connection_bindings.resource_kind` for a bound code repository.
 *
 * Read off the column rather than assumed: production holds `repo` (3 rows,
 * 3 workspaces), `channel` and `digest_channel`, so this is the word the
 * writers actually use.
 */
const REPO_KIND = "repo";

/** No deployment-target binding kind exists yet, so the answer is "we cannot say". */
const DEPLOY_TARGET_KIND: string | null = null;

export const getWorkspaceSetup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        /* The station whose peers to count, and the run to leave out of the
           count because the reader is looking at it. Both optional: a caller
           that only wants the connection facts pays for no extra count. */
        station: z.string().max(32).optional(),
        exceptTrackId: z.string().uuid().optional(),
        /* The run whose recorded wall to read, when the caller wants one. Kept
           separate from `exceptTrackId` even though the run screen passes the
           same id for both: one means "leave this out of the peer count" and
           the other means "tell me about this run", and collapsing them would
           make a caller that wanted one silently ask for the other. */
        trackId: z.string().uuid().optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }): Promise<WorkspaceSetup> => {
    const db = context.supabase as unknown as SupabaseClient;
    const w = data.workspaceId;

    /*
     * ── HOW MANY OTHER RUNS ARE STANDING IN THE SAME PLACE ────────────────
     *
     * Measured all time: of 121 tracks this product has ever made, **82 are
     * standing at Discover** and 37 of those were abandoned there. One shipped.
     * Two reached Learn. The seven-station loop completes about 1.7% of the
     * time, and two thirds of everything is stuck at station one.
     *
     * Per workspace the shape is sharper still: in the four where it bites,
     * EVERY open run at Discover has nothing filed -- 5 of 5, 5 of 5, 4 of 4,
     * 3 of 3.
     *
     * That number is the difference between a nuisance and a setting. One run
     * stuck is something a person shrugs at; five runs stuck on one missing
     * connection is a reason to go and fix it, and the run screen could not say
     * which of the two it was looking at.
     *
     * It rides in the same `Promise.all`, so it costs no extra round trip.
     */
    const [evidence, repos, deploy, peers, walls] = await Promise.all([
      /*
       * SIGNALS, NOT SCOUT TARGETS, AND THE FIRST VERSION COUNTED THE WRONG
       * THING. 0 of 23 workspaces hold an enabled `scout_target` and that
       * number is real -- but 1,524 signals exist, written by agent runs rather
       * than ingested by a configured source (S1's measurement, an hour after
       * mine). So a workspace can have no scout target and 334 signals, and
       * "there was nowhere to look" would be false on every one of them.
       *
       * A scout target is ONE way evidence arrives. Discover needs evidence.
       */
      db.from("signals").select("id", { count: "exact", head: true }).eq("workspace_id", w),
      db
        .from("connection_bindings")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", w)
        .eq("resource_kind", REPO_KIND),
      DEPLOY_TARGET_KIND === null
        ? Promise.resolve({ count: null, error: null })
        : db
            .from("connection_bindings")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", w)
            .eq("resource_kind", DEPLOY_TARGET_KIND),
      data.station
        ? db
            .from("spine_tracks")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", w)
            .eq("station", data.station)
            .eq("status", "open")
            .neq("id", data.exceptTrackId ?? "00000000-0000-0000-0000-000000000000")
        : Promise.resolve({ count: null, error: null }),
      /*
       * ── THE PLATFORM'S OWN WALL, IN THE SAME ROUND ───────────────────────
       * One read for the halts, and the two balance hops only when a wallet
       * wall is actually found -- so a run that never halted pays one query and
       * a run halted on anything else pays nothing further. It rides here
       * rather than in its own server function because the hold card already
       * awaits this one, and on this Worker a second function is a second round
       * trip whatever it queries.
       *
       * `wallsByTrack` takes a list because the home reads fifty at once. One
       * is a list of one.
       */
      data.trackId
        ? wallsByTrack(db, [{ id: data.trackId, workspaceId: w }])
        : Promise.resolve(null),
    ]);

    /*
     * FAIL SOFT, PER FIELD. One count refusing must not take the other two
     * down: a person whose sources read failed can still be told their
     * repository is missing, and the field that failed goes null, which the
     * surface reads as "we did not look" and stays quiet about.
     *
     * `count` can also be null on a successful head request, which is the same
     * answer for this purpose -- we did not get a number -- so both paths
     * collapse to null rather than to `false`, which would be a claim.
     */
    const answer = (r: { count: number | null; error: unknown }): boolean | null =>
      r.error ? null : r.count === null ? null : r.count > 0;

    return {
      evidence: answer(evidence),
      repository: answer(repos),
      deployTarget: answer(deploy),
      /* A COUNT, not a boolean, and null when we did not ask or could not
         read. Zero is a real answer -- this run is the only one there -- and
         the surface says nothing on a zero rather than "0 other runs". */
      othersAtThisStation: peers.error ? null : peers.count,
      /* Absent when nobody asked, and null when they did and the record holds
         no slug halt for this run. Both read the same downstream -- no wall to
         speak of -- and neither is a claim that one lifted. */
      wall: data.trackId && walls ? (walls.get(data.trackId) ?? null) : null,
    };
  });
