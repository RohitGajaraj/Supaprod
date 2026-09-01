/**
 * The spine track: the one object that walks all seven stations.
 *
 * WHY THIS EXISTS (the full argument is in the migration,
 * supabase/migrations/20260801130000_spine_tracks.sql). Until now nothing
 * carried an identity across the loop. A person's work was eight different
 * nouns depending on which page they were on, and a station transition was a
 * client-side navigate call. Worse, the single most common case for any real
 * customer, "add SSO to the product we already run", had NO representation at
 * all: it has no signal and no theme behind it, so there is no lineage root to
 * walk from and nothing to name the work.
 *
 * WHAT A TRACK OWNS, and it is deliberately almost nothing:
 *   IDENTITY  this is one piece of work, and here is its address
 *   INTENT    why it exists (origin), which Learn needs to grade anything that
 *             entered below Discover
 *   THE ROUTE which stations it visits, which are waived, and why
 * `artifact_lineage` remains the sole truth for what-came-from-what. Lineage is
 * a fact about the past; a route is a plan about the future. Different
 * lifetimes, different tables, and so they cannot drift.
 *
 * PRE-MIGRATION TOLERANCE. `spine_tracks` is committed but is applied by
 * Lovable on publish, so until then the table is absent. Every handler here
 * degrades to "no tracks" rather than throwing, using the same `as never`
 * idiom trust.functions.ts and design-memory.functions.ts already use for the
 * same window. A missing table must never take a station's page down.
 */
import { createServerFn } from "@tanstack/react-start";
import { isForecastCheckable } from "./metric-probe.server";
import { z } from "zod";

import { failSoftOrThrow } from "@/lib/read-failure";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import {
  describeRoute,
  nextStation,
  reopen,
  suggestRoute,
  validateRoute,
  waive,
  type SpineRoute,
  type StationWaiver,
  type WorkShape,
} from "@/lib/spine/route";
import { holdLine, type HoldReason } from "@/lib/spine/driver";
import { driveTrackOnce, DRIVE_SELECT } from "@/lib/spine/driver.server";
import { recordTrackDrive } from "@/lib/spine/track-drives.server";
import { readPasteBack, pasteBackLine } from "@/lib/spine/paste-back";
import {
  ARTIFACT_SOURCE,
  buildChain,
  describeChain,
  wordFor,
  type Chain,
  type ChainMember,
  type MemberRow,
  type StopState,
} from "@/lib/spine/chain";
import { KIND_WORD, STATION_ARTIFACT, type PendingGate } from "@/lib/spine/attach";
import { claimApprovalDecision, executeApproval } from "@/lib/ai/loop.server";
import { recordGateSignalCore } from "@/lib/gate-signals.functions";
import { expiryDefaultFor } from "@/lib/ai/approval-expiry";
import { MAX_BULK_DECISIONS } from "@/lib/approvals-queue.functions";
import { recordStageEvent } from "@/lib/stage-events.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TERMINAL_HOLDS } from "./correction";
import { HOLD_LINE } from "./driver";
import {
  buildActivity,
  type MemberRow as ActivityMemberRow,
  type RunRow,
  type Turn,
} from "@/lib/spine/activity";

const STATION = z.enum(AGENT_STATION_ORDER as unknown as [AgentStation, ...AgentStation[]]);
const SHAPE = z.enum([
  "new-capability",
  "existing-feature",
  "interface-change",
  "under-the-hood",
  "incident-fix",
]);

export type Track = {
  id: string;
  title: string;
  origin: string | null;
  entry: AgentStation;
  station: AgentStation;
  status: "open" | "done" | "abandoned";
  route: SpineRoute;
  /** The route said as one sentence, so a surface never re-derives the words. */
  summary: string;
  updatedAt: string;
  /**
   * Why the autonomous driver last declined to move this track, in the words a
   * person reads. Null when it is moving normally.
   *
   * This is the whole difference between a loop that runs unattended and one a
   * person cannot trust. Someone who was not watching must arrive at an answer,
   * not at silence: work that stopped because a call is waiting on them, or
   * because a kill switch is on, looks identical to work that is simply slow
   * unless the reason is carried out to the surface.
   */
  hold: string | null;
  /**
   * THE RAW REASON, beside the sentence built from it.
   *
   * `hold` above is prose, and prose is not a state. A surface that has to
   * DECIDE something from the hold -- which status word it wears, whether a
   * control belongs on the row -- has to read this instead, because `holdLine`
   * rewrites two of the reasons to name their station and they no longer equal
   * their own entry in `HOLD_LINE`. Added 2026-08-20, when `TrackStart` was
   * found painting every hold amber by testing the sentence.
   */
  holdReason: string | null;
  /**
   * The DRIVER'S OWN SENTENCE for why this stopped, stored verbatim.
   *
   * `holdReason` is the coarse kind ('given-up', 'tools-refused'), which is what
   * a list needs. This is the specific one, naming the stations and the missing
   * thing, which is what a person needs before they can do anything about it.
   * Null means the track stopped before the column existed, or is not stopped.
   */
  holdBecause: string | null;
  /** When the driver last touched it. Null means it has never been driven. */
  drivenAt: string | null;
  /**
   * Real failures the current station has burned against
   * `MAX_STATION_ATTEMPTS` (3). Queue 66: a held track on its last try looked
   * identical to one on its first, and the difference is whether the person
   * reading it should expect the loop to recover or to give up next tick.
   */
  attempts: number;
};

type TrackRow = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  title: string;
  origin: string | null;
  entry_station: string;
  station: string;
  status: string;
  path: unknown;
  waived: unknown;
  updated_at: string;
  last_hold: string | null;
  last_hold_because?: string | null;
  driven_at: string | null;
  attempts: number | null;
};

/** Rebuild the route from its two stored columns, tolerating anything odd in them. */
function rowToTrack(r: TrackRow): Track {
  const path = (Array.isArray(r.path) ? r.path : []) as AgentStation[];
  const waived = (Array.isArray(r.waived) ? r.waived : []) as StationWaiver[];
  const route: SpineRoute = {
    entry: r.entry_station as AgentStation,
    // A stored path that somehow lost every station falls back to the full
    // spine rather than to an empty route, because a track that visits nothing
    // is unusable and the full loop is the safe reading of "unknown".
    path: path.length > 0 ? path : [...AGENT_STATION_ORDER],
    waived,
    origin: r.origin,
  };
  return {
    id: r.id,
    title: r.title,
    origin: r.origin,
    entry: route.entry,
    station: r.station as AgentStation,
    status: (r.status as Track["status"]) ?? "open",
    route,
    summary: describeRoute(route),
    updatedAt: r.updated_at,
    // NAMED, not "this station". The correction loop's holds are true of one
    // station rather than of the whole track, and "this station has nothing to
    // work from" in a list of five pieces of work is a pronoun with no referent.
    // `holdLine` substitutes the station's own display name and leaves every
    // other reason exactly as written, so there is no second copy of the words.
    hold: holdLine(r.last_hold, { station: r.station as AgentStation }),
    holdReason: r.last_hold,
    holdBecause: r.last_hold_because ?? null,
    drivenAt: r.driven_at ?? null,
    attempts: r.attempts ?? 0,
  };
}

const SELECT =
  "id,user_id,workspace_id,title,origin,entry_station,station,status,path,waived,updated_at,last_hold,last_hold_because,driven_at,attempts," +
  // The ONLY edge from a track to the questions it is waiting on.
  // `agent_approvals` has no track back-reference — see SPEC-CONSENT §1.1 and
  // the migration that created this column, which rejects every correlational
  // alternative by name. Absent from this select, `getTrack` could not serve
  // the hold check and the consent card had nothing to read.
  "pending_gates";

/**
 * Start a piece of work and give it a route.
 *
 * The route is a PROPOSAL derived from the shape, and every station it waives
 * carries a reason and a condition that brings it back. `origin` is required
 * whenever the work enters below Discover, which `validateRoute` enforces:
 * work that skipped discovery has no evidence behind it, so without a stated
 * reason Learn would have nothing to grade the outcome against.
 */
/**
 * Start a piece of work, callable server to server.
 *
 * Extracted from the `startTrack` server function so the promotion sweep can
 * reach it: a `createServerFn` handler needs a request, and a cron tick has
 * none. The server function below is now a thin wrapper, so a track a person
 * starts and a track the platform starts go through exactly the same
 * validation, the same route model and the same refusals. Two entrances to one
 * table is how the two drift.
 */
/**
 * File the cluster this work came from as the first thing on its record.
 *
 * THE HANDOFF AT THE ENTRY TO THE SPINE, and its absence was the defect that
 * froze the autonomous half of the loop.
 *
 * `promoteClustersOnce` turns a qualifying cluster into work and writes
 * `spine_tracks.theme_id`, which is a link nothing on the drive path reads. The
 * driver briefs each station from `spine_track_members` through `loadUpstream`,
 * so a promoted track arrived at Discover carrying no members at all: the crew
 * whose job is to gather evidence for a cluster was told the cluster's TITLE and
 * nothing else. Not its summary, not the frequency and severity that cleared the
 * bar, not the signals underneath it. The station then reported, correctly, that
 * it could find nothing, and the driver read a clean run that filed nothing as a
 * station worth retrying. Three attempts later the work was frozen.
 *
 * That is the driver's own "seven strangers given the same sentence" defect,
 * fixed between stations in the attachment pass and still live at the door.
 *
 * THE THEME AND NOT ITS SIGNALS, deliberately. A cluster's `summary` is the
 * distilled form of the evidence underneath it, which is the whole reason
 * clustering exists; and `HANDOFF_BODIES` inlines the two newest bodies only, so
 * a dozen signal rows would push the summary out of the brief and arrive as a
 * list of bare ids. The chain a person reads stays legible for the same reason.
 * Discover's own crew is what goes and gets the rest.
 *
 * BEST-EFFORT, on the contract every other member write in the spine carries:
 * losing the index is recoverable, losing the work is not. A promotion that
 * succeeded must never be reported as refused because its first member row did
 * not land, so this returns rather than throws and the track stands either way.
 */
async function attachOriginTheme(
  supabase: SupabaseClient,
  trackId: string,
  themeId: string,
): Promise<void> {
  try {
    const { error } = await supabase.from("spine_track_members" as never).upsert(
      {
        track_id: trackId,
        artifact_kind: "theme",
        artifact_id: themeId,
        station: "sense",
      } as never,
      { onConflict: "track_id,artifact_kind,artifact_id" },
    );
    if (error) {
      console.error(
        `[spine] track ${trackId} started but its origin cluster ${themeId} was not filed: ${error.message}`,
      );
    }
  } catch (e) {
    console.error(
      `[spine] filing the origin cluster for track ${trackId} threw: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

export async function startTrackCore(
  supabase: SupabaseClient,
  userId: string,
  data: {
    title: string;
    shape: WorkShape;
    origin?: string;
    productId?: string | null;
    projectId?: string | null;
    workspaceId?: string | null;
    /** The cluster this came from, when the platform started it. */
    themeId?: string | null;
  },
): Promise<{ track: Track | null; problems: string[] }> {
  const origin = data.origin?.trim() || null;
  const route = suggestRoute(data.shape, origin);

  const problems = validateRoute(route);
  if (problems.length > 0) return { track: null, problems: problems.map((p) => p.message) };

  try {
    const { data: row, error } = await supabase
      .from("spine_tracks" as never)
      .insert({
        user_id: userId,
        title: data.title.trim(),
        origin,
        entry_station: route.entry,
        station: route.entry,
        path: route.path,
        waived: route.waived,
        product_id: data.productId ?? null,
        project_id: data.projectId ?? null,
        /*
         * OMITTED WHEN UNKNOWN, NEVER SENT AS NULL, and the difference is the
         * whole reason no track has ever been started from the product.
         *
         * `spine_tracks.workspace_id` is NOT NULL with default
         * `current_user_default_workspace()`. A default fires only when the
         * column is ABSENT from the insert. This wrote `?? null`, PostgREST sent
         * `"workspace_id": null`, and Postgres refused the row outright -- so
         * `startTrack` did not create a track with the wrong workspace, it
         * created no track at all.
         *
         * MEASURED 2026-08-24 on the live database: 58 of 59 tracks carry a
         * `theme_id`, which only the promotion sweep sets, and the 59th is the
         * 2026-08-01 seed row in workspace `60000000-...`. **Not one track in
         * this product's history came through this function.** There are no
         * triggers on the table, so the column default is the only filler and
         * omission is the only way to reach it.
         *
         * Worth stating because the earlier reading of this line (F-05) was that
         * a null-workspace track would be silently dropped from every sweep by
         * `NULL NOT IN (...)`. That consequence is real in the abstract and
         * could never happen here: the constraint refuses the row first. The
         * defect was one layer earlier and one order of magnitude worse.
         */
        ...(data.workspaceId ? { workspace_id: data.workspaceId } : {}),
        theme_id: data.themeId ?? null,
      } as never)
      .select(SELECT)
      .single();
    if (error || !row) {
      // 23505 is the unique index on theme_id: another tick promoted this
      // cluster first. Not an error, just a race this design expects to lose
      // sometimes, so it is reported as a plain refusal rather than thrown.
      const code = (error as { code?: string } | null)?.code;
      if (code === "23505") return { track: null, problems: ["already promoted"] };
      /*
       * 23502 is the NOT NULL on `workspace_id`, and it reaches here by exactly
       * one route now that the key is omitted rather than nulled: the column
       * default `current_user_default_workspace()` itself returned null, which
       * means this account belongs to no workspace. That is a setup gap a person
       * can close in one action, and the raw Postgres sentence names a column
       * instead of naming it. R-16: a failure has to say what failed.
       */
      if (code === "23502") {
        return {
          track: null,
          problems: [
            "This account is not in a workspace yet, so there is nowhere to put the work. Create or join a workspace and start it again.",
          ],
        };
      }
      return { track: null, problems: [error?.message ?? "The track could not be started."] };
    }
    const track = rowToTrack(row as unknown as TrackRow);
    if (data.themeId) await attachOriginTheme(supabase, track.id, data.themeId);
    return { track, problems: [] };
  } catch (e) {
    return { track: null, problems: [(e as Error).message] };
  }
}

/**
 * Which workspace this track belongs to, proven rather than trusted.
 *
 * THE GATE IS HERE AND NOT IN `startTrackCore`, deliberately. Core is also
 * called by the promotion sweep with a SERVICE-ROLE client, where a membership
 * read returns nothing and would refuse every promoted track. This runs on the
 * caller's RLS-scoped client, which can only see the caller's own membership
 * rows, so the read itself IS the proof. Same shape as `audio.functions.ts:78`.
 *
 * Null means "let the column default decide", which is the zero-configuration
 * path and the one the on-ramp uses: a person types a sentence and does not pick
 * a workspace.
 */
async function resolveStartWorkspace(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  explicit: string | null | undefined,
): Promise<string | null> {
  if (!explicit) return null;
  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", explicit)
    .limit(1)
    .maybeSingle();
  if (!member) throw new Error("Forbidden: not a member of this workspace");
  return explicit;
}

export const startTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().trim().min(1).max(200),
        shape: SHAPE,
        origin: z.string().trim().max(2000).optional(),
        productId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
        /**
         * Optional, and gated. A caller that names a workspace must be a member
         * of it; a caller that names none gets their default. Neither path can
         * reach another tenant's data.
         */
        workspaceId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ track: Track | null; problems: string[] }> => {
    const workspaceId = await resolveStartWorkspace(context.supabase, data.workspaceId ?? null);
    return startTrackCore(context.supabase, context.userId, {
      title: data.title,
      shape: data.shape as WorkShape,
      origin: data.origin,
      productId: data.productId ?? null,
      projectId: data.projectId ?? null,
      workspaceId,
    });
  });

/** Open tracks, most recently touched first. Empty, never thrown, pre-migration. */
export const listTracks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Track[]> => {
    const { supabase } = context;
    try {
      const { data, error } = await supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("status", "open")
        .order("updated_at", { ascending: false })
        .limit(50);
      /*
       * ── F-126: "NOTHING IS IN FLIGHT" WAS ALSO WHAT A FAILED READ SAID ────
       *
       * This was `if (error || !data) return []`, so a PostgREST error, an RLS
       * refusal and an empty workspace produced the same answer, and no caller
       * could tell them apart. S1 found the consequence on the surface: the
       * shell's live-work strip and `TrackStart` both render that empty array as
       * **"Nothing is in flight"**, beside work that may be moving.
       *
       * S1 could not reproduce it and said so, which is the right way to hand
       * over a defect found by inspection. It is real by inspection anyway: the
       * two states are indistinguishable in the return type, whether or not the
       * auth middleware currently catches most of the ways to get there.
       *
       * The split is F-120's, now shared rather than copied: a missing column is
       * a deployment-ordering fact and falls soft; anything else is a runtime
       * fact and is raised, so `useQuery` can set `isError` and a surface can
       * say "this did not load" instead of "there is nothing here".
       */
      if (error) failSoftOrThrow(error, "The work in flight");
      return ((data ?? []) as unknown as TrackRow[]).map(rowToTrack);
    } catch (e) {
      /*
       * The bare `catch { return [] }` swallowed the throw above along with
       * everything else, which would have made the whole fix invisible. A thrown
       * read failure is re-raised; anything genuinely unexpected still returns an
       * empty board rather than breaking every surface that reads it.
       */
      if (e instanceof Error && e.message.includes("could not be read")) throw e;
      return [];
    }
  });

export const getTrack = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<Track | null> => {
    const { supabase } = context;
    try {
      /*
       * ── F-126, THE WORSE HALF ────────────────────────────────────────────
       *
       * This did not destructure `error` AT ALL. It read only `row`, so a
       * refused or failed read produced `undefined`, returned null, and the run
       * screen rendered **"this piece of work does not exist"** about a track
       * that does. `listTracks` at least conflated a failure with an empty
       * board; this one conflates it with a track that was never there.
       *
       * Reading only `data` is precisely the F-76 shape, and this is the
       * highest-stakes instance of it found so far: it is the read behind the
       * screen a person opens to watch one piece of work move.
       */
      const { data: row, error } = await supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("id", data.trackId)
        .maybeSingle();
      if (error) failSoftOrThrow(error, "This piece of work");
      return row ? rowToTrack(row as unknown as TrackRow) : null;
    } catch (e) {
      // Re-raised for the same reason as above: a bare catch here would swallow
      // the distinction this change exists to draw.
      if (e instanceof Error && e.message.includes("could not be read")) throw e;
      return null;
    }
  });

/**
 * Move the work to the station its own route says comes next.
 *
 * THIS IS THE POINT OF THE WHOLE OBJECT. Before it, "move to the next station"
 * was a `navigate()` call in a component, which meant the next station was
 * whatever the page happened to link to and a waived station could still be
 * walked into. Now the route answers it, so a track that waived Design goes
 * from Plan to Build without anyone having to remember that it should.
 *
 * A MOVE IS A MOVE, WHOEVER MAKES IT (repaired 2026-08-01 after adversarial
 * review). This handler used to write `station` and nothing else, which was
 * harmless only while it had no caller. The moment a person could press it,
 * three defects became reachable, and all three had the same shape: the driver
 * does four things on a move and this did one.
 *
 *   - `attempts` was not reset, so unsticking a `stalled` track walked it to
 *     the next station with the counter intact. `decideDrive` refuses at the
 *     ceiling BEFORE it looks at the station, so the next tick held instantly.
 *     A person could walk a track through its entire remaining route without a
 *     single station ever running, while the surface reported progress. That is
 *     the precise thing this codebase keeps deleting: a claim the work does not
 *     support.
 *   - `last_hold` was not cleared, so the row went on rendering the PREVIOUS
 *     station's failure as a fact about the new one. HOLD_LINE's sentences are
 *     worded about "this station", so every one of them became false on the
 *     move.
 *   - No `stage_events` row was written. Migration 20260801150000 widened that
 *     table's CHECK for `spine_track` on the argument that "who moved this work
 *     and when" is one question with one answer. The driver writes `system`;
 *     this now writes `human`, so the trail can tell them apart.
 *
 * IT REFUSES WHILE THE WORKSPACE IS PAUSED. A kill switch outranks every other
 * consideration in the product, and the driver fails closed even on a read
 * error. Offering a control beside a row that reads "everything is paused" and
 * having it write anyway would make the switch a suggestion.
 *
 * IT DOES NOT REFUSE ON A WAITING APPROVAL, deliberately. Moving a track does
 * not approve anything: the queued call stays queued and the boundary still
 * binds. A person choosing to carry their own work forward past a station that
 * asked them something is a decision they are allowed to make, and the record
 * shows both facts side by side.
 */
export const advanceTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      track: Track | null;
      arrivedAt: string | null;
      refused: string | null;
      /**
       * The station just left, when it filed nothing.
       *
       * WHY THIS IS REPORTED RATHER THAN REFUSED. `advanceTrack` consults the
       * kill switch and nothing else: not `last_hold`, not `attempts`, and not
       * whether the station produced anything. So a person could walk a track
       * through its whole remaining route with an empty member list, and the
       * board would report a completed lap that never happened. That is the one
       * claim this product must never make about itself.
       *
       * Refusing would be the wrong correction. The governance canon is explicit
       * that a person carrying their own work forward past a station is a
       * decision they are allowed to make, and this handler's own header already
       * argues that for the case of an open gate. What was wrong was not the
       * permission, it was the SILENCE: the move happened and nothing said the
       * station had handed nothing on.
       *
       * So the write is unchanged and the answer gained a fact. Null means the
       * station filed something, or that we could not tell, which are reported
       * the same way here on purpose: a member read that failed must not be
       * turned into an accusation that a station produced nothing.
       */
      emptyStation: string | null;
    }> => {
      const { supabase } = context;
      try {
        const { data: row } = await supabase
          .from("spine_tracks" as never)
          .select(SELECT)
          .eq("id", data.trackId)
          .maybeSingle();
        if (!row) {
          return {
            track: null,
            arrivedAt: null,
            refused: "That work could not be found.",
            emptyStation: null,
          };
        }

        const raw = row as unknown as TrackRow;
        const track = rowToTrack(raw);

        /*
         * F-62. A HAND-ADVANCE IS A DRIVE, AND IT NEVER TOUCHES `driveTrackOnce`.
         *
         * This handler moves a station by itself, so nothing in `track_drives`
         * would know about it — and a criterion-2 query over that table alone
         * would then miss the most literal *re-drive by hand* the product has.
         * A log with a hole in it is worse than no log, because it reads clean.
         *
         * LOGGED AS SOON AS THE TRACK IS KNOWN TO EXIST, which is
         * `driveTrackOnce`'s entry rule and for its reason: the press happened
         * whether or not the kill switch, the route or the write let it land,
         * and a record that only keeps successful interventions is a record that
         * hides the ones that were stopped. Earlier is not possible — the row is
         * a foreign key.
         *
         * `entry_hold` is the hold this press is moving PAST. A hand-advance off
         * a non-null hold is unsticking, in one column, with no join.
         */
        await recordTrackDrive(supabase, {
          trackId: track.id,
          station: track.station,
          via: "press",
          entryHold: (raw.last_hold ?? null) as HoldReason | null,
        });

        // Fails closed: a kill switch that cannot be read counts as on, the same
        // direction driver.server.ts chose for the same control.
        if (raw.workspace_id) {
          let paused = true;
          try {
            const { data: sw } = await supabase
              .from("kill_switches")
              .select("paused")
              .eq("scope", "workspace")
              .eq("workspace_id", raw.workspace_id)
              .maybeSingle();
            paused = Boolean((sw as { paused?: boolean } | null)?.paused);
          } catch {
            paused = true;
          }
          if (paused) {
            return {
              track,
              arrivedAt: null,
              refused: "Everything is paused for this workspace, so nothing moved.",
              emptyStation: null,
            };
          }
        }

        const next = nextStation(track.route, track.station);

        /**
         * Did the station being left actually file anything?
         *
         * Read BEFORE the move, because after it the row says the work is
         * somewhere else and this question is about where it has been. Scoped to
         * the station rather than the whole track: a track carrying a spec from
         * Plan has members, and that says nothing about whether Design drew
         * anything.
         *
         * A FAILED READ IS NOT AN EMPTY STATION. `count` is null when the read
         * errored, and that resolves to null below rather than to zero, so an
         * unreadable table can never make this report a station produced nothing.
         * This repo has turned a failed read into a confident zero often enough
         * to name it as a class.
         */
        let emptyStation: string | null = null;
        try {
          const { count, error: memberErr } = await supabase
            .from("spine_track_members" as never)
            .select("artifact_id", { count: "exact", head: true })
            .eq("track_id", data.trackId)
            .eq("station", track.station);
          if (!memberErr && (count ?? null) === 0) emptyStation = track.station;
        } catch {
          // Same direction: we do not know, so we claim nothing.
        }

        const now = new Date().toISOString();

        const { data: updated, error: upErr } = await supabase
          .from("spine_tracks" as never)
          .update(
            /*
             * F-55. `last_driven_via: "press"` GOES IN THIS WRITE, not a second one.
             *
             * THE BUG THIS CLOSES IS A STALE POSITIVE CLAIM, WHICH IS WORSE THAN
             * A NULL. `driveTrackOnce` stamps `last_driven_via` on entry, and
             * this handler never touched it — so a track the sweep drove at
             * 10:00 and a PERSON hand-advanced at 10:05 still read `'sweep'`.
             * Not "does not know": a surviving assertion that the unattended
             * loop was the last thing to move work a human moved by hand. The
             * column's own comment says "how this track was last driven", and
             * for this path it was not.
             *
             * Same write as the station move, for queue 63's reason: two columns
             * that must agree, written in two places, is how they disagree.
             */
            (next
              ? {
                  station: next,
                  attempts: 0,
                  last_hold: null,
                  last_hold_because: null,
                  last_driven_via: "press",
                  updated_at: now,
                }
              : {
                  status: "done",
                  attempts: 0,
                  last_hold: null,
                  last_hold_because: null,
                  last_driven_via: "press",
                  updated_at: now,
                }) as never,
          )
          .eq("id", data.trackId)
          .select(SELECT)
          .single();

        // An UPDATE that returned nothing did not necessarily fail to commit, so
        // this reports what it knows and refuses to narrate a cause. The old
        // code fell back to the pre-write row with arrivedAt still set, which
        // announced an arrival that may never have happened.
        if (upErr || !updated) {
          return {
            track,
            arrivedAt: null,
            refused: "The move did not come back confirmed, so nothing here is certain.",
            emptyStation: null,
          };
        }

        await recordStageEvent(supabase, {
          entityType: "spine_track",
          entityId: track.id,
          from: track.station,
          to: next ?? track.station,
          actor: "human",
          /*
           * F-55. `"press"` and NOT threaded from a caller, deliberately.
           *
           * Queue 64 made `via` a required parameter on `driveTrackOnce` because
           * it has two callers with two different honest answers. This handler
           * has exactly one caller — a person clicking "hand it on" in
           * `TrackStart.tsx` — so there is no second answer to get wrong, and a
           * parameter would be ceremony around a constant.
           *
           * WITHOUT THIS, criterion 2 was only provable by a three-way
           * disjunction nobody would remember to write: this path recorded
           * `actor: "human"` with `driven_via` NULL, while `driveTrackOnce`
           * records `actor: "system"` with `driven_via: 'press'` even when a
           * person pressed it. So a query on `driven_via` alone missed every
           * hand-advance, and a query on `actor` alone is the exact read that
           * produced the false "unattended" report on track 48eee889.
           *
           * `press` may eventually be too coarse: a person nudging the loop and
           * a person doing the station's job by hand are different acts, and
           * both disqualify a run. A fourth value would need a CHECK migration,
           * so it is a deliberate choice rather than an accident of this fix.
           */
          drivenVia: "press",
          workspaceId: raw.workspace_id,
          userId: raw.user_id,
        });

        return {
          track: rowToTrack(updated as unknown as TrackRow),
          arrivedAt: next,
          refused: null,
          emptyStation,
        };
      } catch (e) {
        console.error("advanceTrack failed:", e);
        return {
          track: null,
          arrivedAt: null,
          refused: "The move failed. Nothing on screen can be trusted until this list reloads.",
          emptyStation: null,
        };
      }
    },
  );

/**
 * Waive a station, or bring one back.
 *
 * A waiver is never a silent skip. `waive` in the pure module requires a reason
 * and records who gave it, and `reopen` is always available, which is the
 * difference between a route and a checklist. The safety of the whole model
 * rests on a waiver being reversible and attributed.
 */
/**
 * Let the station that stopped try again, where it stands.
 *
 * THE GAP THIS CLOSES. A held track had exactly two controls: hand it to the
 * next station, or call it finished. Neither is "try again". So a track holding
 * `station-cannot-finish` or `given-up`, both of which no code path clears, was
 * dead to its owner: the only ways forward were to SKIP the station that could
 * not finish, which advances work the station never did, or to close the piece of
 * work entirely. A person who fixed the actual cause outside the product, by
 * connecting a source or topping up an account or writing the missing spec, had
 * no way to say so.
 *
 * IT DOES NOT MOVE THE STATION, and that is the whole difference from
 * `advanceTrack`. It writes the same three columns the driver's own resume branch
 * writes when an answered escalation clears itself: `attempts` back to zero,
 * `last_hold` cleared, `driven_at` touched. The next tick then drives the station
 * normally, so "one tick, one attempt at one station" stays true and nothing here
 * dispatches anything or spends anything.
 *
 * WHY IT REFUSES ON A TRACK THAT IS NOT HELD. A clear on a running track would
 * reset an attempt counter mid-flight and hand the station three fresh tries it
 * had not earned, which turns a repair control into a way to buy retries. There
 * is nothing to retry on a track the driver has not stopped, so the honest answer
 * is a refusal with a reason rather than a write that looks like it helped.
 *
 * IT REFUSES WHILE PAUSED, failing closed on an unreadable switch, for the reason
 * `advanceTrack` states: a kill switch outranks every other consideration, and a
 * control that wrote anyway beside a row reading "everything is paused" would
 * make the switch a suggestion.
 *
 * THE TRAIL SAYS A PERSON DID IT. `stage_events` gets a row with `actor: 'human'`
 * and the station as both ends, because the work did not move and a trail that
 * claimed a transition would be the false stage event `advanceTrack` was repaired
 * for. What it records is that somebody released this station to run again.
 */
export const retryStation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ track: Track | null; refused: string | null }> => {
    const { supabase } = context;
    try {
      const { data: row } = await supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("id", data.trackId)
        .maybeSingle();
      if (!row) return { track: null, refused: "That work could not be found." };

      const raw = row as unknown as TrackRow;
      const track = rowToTrack(raw);

      /*
       * F-62. THIS CONTROL IS THE WORD "UNSTICKING", AND IT RECORDED NOTHING.
       *
       * `retryStation` clears `last_hold` and resets `attempts` so a stalled
       * station runs again. That is acceptance criterion 2's forbidden act
       * stated literally — *no unsticking* — and until this line the only thing
       * it wrote about the person was the `recordStageEvent` call below, **which
       * never inserts**: it passes the same station as both `from` and `to`, and
       * `recordStageEvent` opens with `if (ev.from != null && ev.from === ev.to)
       * return;`. The comment there says "THE TRAIL SAYS A PERSON DID IT". The
       * guard drops it on the floor, silently, and has since the control
       * shipped. (Left in place rather than removed: whether that guard or that
       * call site is the thing to change is the session owner's call, not this
       * fix's.)
       *
       * It is also the standing proof that a same-station `stage_events` row is
       * not the cheap answer it looks like — a call site already tried it.
       *
       * `entry_hold` here is the hold being CLEARED, which is the whole event:
       * "somebody released `station-cannot-finish` at build" is one row.
       */
      await recordTrackDrive(supabase, {
        trackId: track.id,
        station: track.station,
        via: "press",
        entryHold: (raw.last_hold ?? null) as HoldReason | null,
      });

      if (raw.status !== "open") {
        return { track, refused: "This work is closed, so there is no station to run." };
      }

      // Fails closed, the same direction driver.server.ts takes for the same
      // control.
      if (raw.workspace_id) {
        let paused = true;
        try {
          const { data: sw } = await supabase
            .from("kill_switches")
            .select("paused")
            .eq("scope", "workspace")
            .eq("workspace_id", raw.workspace_id)
            .maybeSingle();
          paused = Boolean((sw as { paused?: boolean } | null)?.paused);
        } catch {
          paused = true;
        }
        if (paused) {
          return {
            track,
            refused: "Everything is paused for this workspace, so nothing was released.",
          };
        }
      }

      // Nothing to retry on work the driver has not stopped. Read off the raw
      // column rather than the rendered sentence, because `rowToTrack` maps
      // `last_hold` through `holdLine` into prose for the surface and prose is
      // not a state.
      if (!raw.last_hold) {
        return {
          track,
          refused: "This work is not held, so there is nothing waiting to be released.",
        };
      }

      const now = new Date().toISOString();
      /*
       * `station_drives` IS RESET HERE, AND WITHOUT IT THIS CONTROL CANNOT WORK.
       *
       * F-43 added a second ceiling: `MAX_STATION_DRIVES = 12` counts every
       * dispatch, so a station that never fails and never produces stops being
       * dispatched forever. It is the right net. It had no door.
       *
       * This control reset `attempts` and left `station_drives` alone, so a
       * released track cleared its hold, was driven once, tripped the F-43
       * ceiling and re-held as `going-in-circles` — terminal — within one tick.
       * MEASURED 2026-08-26: two tracks released by hand at 40 and 29 drives
       * both re-held inside ten minutes, spending nothing, and every open track
       * on a real workspace was already past 12 (81, 63, 53, 42, 40, 29). The
       * button cleared a hold, the board showed the work moving, and it was
       * terminal again before anyone looked twice.
       *
       * Reset only where a PERSON acted. The automatic resume in
       * `driver.server.ts` deliberately does NOT do this: clearing the ceiling
       * on a machine path would let escalate → resume → escalate run forever,
       * which is the billing cycle F-43 exists to stop. A press is different
       * because somebody chose it and the press is on the record.
       *
       * The cost is real and is the point: those two tracks re-held for free,
       * and after this they will dispatch a crew and spend. That is a person
       * deciding to spend, which is the only kind of spend this should buy.
       */
      const { data: updated, error } = await supabase
        .from("spine_tracks" as never)
        .update({
          attempts: 0,
          station_drives: 0,
          last_hold: null,
          last_hold_because: null,
          driven_at: now,
          updated_at: now,
        } as never)
        .eq("id", data.trackId)
        .select(SELECT)
        .single();

      // An UPDATE that came back unconfirmed did not necessarily fail to
      // commit, so this reports what it knows and refuses to narrate a cause.
      if (error || !updated) {
        return {
          track,
          refused: "The release did not come back confirmed, so nothing here is certain.",
        };
      }

      await recordStageEvent(supabase, {
        entityType: "spine_track",
        entityId: track.id,
        // Both ends are the same station on purpose: the work did not move.
        from: track.station,
        to: track.station,
        actor: "human",
        workspaceId: raw.workspace_id,
        userId: raw.user_id,
      });

      return { track: rowToTrack(updated as unknown as TrackRow), refused: null };
    } catch (e) {
      console.error("retryStation failed:", e);
      return {
        track: null,
        refused: "The release failed. Nothing on screen can be trusted until this list reloads.",
      };
    }
  });

export const setStationWaiver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        trackId: z.string().uuid(),
        station: STATION,
        waived: z.boolean(),
        reason: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ track: Track | null; problems: string[] }> => {
    const { supabase } = context;
    try {
      const { data: row } = await supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("id", data.trackId)
        .maybeSingle();
      if (!row) return { track: null, problems: ["That track could not be found."] };

      const track = rowToTrack(row as unknown as TrackRow);
      const reason = data.reason?.trim();
      if (data.waived && !reason) {
        return { track, problems: ["A station is only waived with a reason."] };
      }

      const nextRoute = data.waived
        ? waive(track.route, data.station as AgentStation, {
            reason: reason as string,
            by: "human",
            // A human waiver states no automatic condition to come back. The
            // person who waived it is the one who reopens it, and inventing a
            // trigger they did not choose would be the product deciding policy
            // it was not given.
            reopensWhen: "never",
          })
        : reopen(track.route, data.station as AgentStation);

      const problems = validateRoute(nextRoute);
      if (problems.length > 0) return { track, problems: problems.map((p) => p.message) };

      const { data: updated } = await supabase
        .from("spine_tracks" as never)
        .update({
          path: nextRoute.path,
          waived: nextRoute.waived,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", data.trackId)
        .select(SELECT)
        .single();

      return {
        track: updated ? rowToTrack(updated as unknown as TrackRow) : track,
        problems: [],
      };
    } catch (e) {
      return { track: null, problems: [(e as Error).message] };
    }
  });

/**
 * Record that an artifact belongs to this track.
 *
 * An INDEX, not a second lineage. Lineage answers what came from what, which it
 * cannot do for a track that entered mid-loop and has no root; this answers
 * what is part of this one piece of work. Idempotent on its primary key so a
 * surface may call it every time it saves without checking first.
 */
export const attachToTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        trackId: z.string().uuid(),
        artifactKind: z.string().trim().min(1).max(64),
        artifactId: z.string().uuid(),
        station: STATION,
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean }> => {
    const { supabase } = context;
    try {
      const { error } = await supabase.from("spine_track_members" as never).upsert(
        {
          track_id: data.trackId,
          artifact_kind: data.artifactKind,
          artifact_id: data.artifactId,
          station: data.station,
        } as never,
        { onConflict: "track_id,artifact_kind,artifact_id" },
      );
      return { ok: !error };
    } catch {
      return { ok: false };
    }
  });

/**
 * The whole record of one piece of work: its route, and what each station made.
 *
 * THE DOOR THAT WAS MISSING. `spine_track_members` has been written correctly
 * since the attachment pass, and nothing read it as membership. The only read
 * in the product was `missionForTrack`, which filters to `artifact_kind =
 * 'mission'` and takes one row so Build reuses its mission instead of opening a
 * new one every tick. Everything else that was filed had no reader at all.
 *
 * ONE QUERY PER KIND, NOT PER MEMBER. Members are grouped and each kind's
 * table is asked once with an `in` list, all of them in parallel. A track that
 * ran a full loop can hold a few dozen members and a per-row lookup would put
 * that many round trips behind one page.
 *
 * A FAILED LOOKUP IS NOT A MISSING ARTIFACT, and the difference is the only
 * subtle thing in here. `missing` means the lookup SUCCEEDED and the row was
 * not in it, so the product can honestly say the artifact is gone. A query that
 * errored, or a kind with no table mapped, leaves `missing` false and the title
 * null: we did not look, so we claim nothing. Collapsing the two would let a
 * transient error or a pre-migration table report a shelf of healthy artifacts
 * as destroyed, which is a far worse lie than showing a row with no title.
 *
 * Degrades to an empty chain rather than throwing, the same pre-migration
 * tolerance every other handler in this module uses.
 */
/**
 * What each station of this track actually PRODUCED, with the thing itself.
 *
 * ── WHY THIS IS NOT `getTrackChain` ───────────────────────────────────────
 *
 * `getTrackChain` answers *what was filed*: a stop per station, and per member a
 * kind, an id, a title and whether it still resolves. That is the right shape
 * for a trail somebody scans, and `ChainMember` deliberately carries **no body**.
 *
 * The artifact pane asks a different question: *show me the thing*. A pane
 * rendering `prd (id 5568…)` has told the reader nothing the chain did not, and
 * the acceptance this repo is built around says a person watching a run sees
 * **what each station produced**, not a list of nouns.
 *
 * ── THE SHAPE IS `SPEC-ARTIFACTS.md` §1 VERBATIM, AND THAT IS A CORRECTION ──
 *
 * A first version of this returned a flat `TrackArtifact[]` with a single `body`
 * string. It was written before its own spec was read, which is the mistake
 * `SPEC-ARTIFACTS` exists to prevent: §1 names the exact return type LANE 0 is
 * building `ArtifactPane.tsx` against, and a server function that is *nearly*
 * the contract is worse than one that is missing, because it typechecks.
 *
 * So: `{ stops: StationArtifactView[] }`, ordering and state from `buildChain`
 * so this can never disagree with the chain panel about where the work is, and
 * the per-kind columns widened to what each station's card actually renders.
 *
 * ── THE COLUMN NAMES ARE PER KIND AND THEY ARE NOT GUESSABLE ───────────────
 *
 * Three of the seven tables have no `title` at all: a prototype has `name`, a
 * learning has `summary`, a deployment has no human name whatsoever. **A wrong
 * column inside a `.select()` string typechecks clean and throws at runtime**,
 * which is why `ARTIFACT_SOURCE` is reused for the title and body rather than
 * re-derived, and why `FIELDS` below is written per kind rather than as one list.
 *
 * ── THE FAIL DIRECTION IS COPIED FROM `getTrackChain` ON PURPOSE ───────────
 *
 * `missing` means the lookup SUCCEEDED and the row was not in it. A query that
 * errored leaves `missing` false and `fields` empty: we did not look, so we
 * claim nothing. Collapsing the two would let one transient error report a shelf
 * of healthy artifacts as destroyed.
 */
/**
 * A JSON value, spelled out rather than `unknown`.
 *
 * `SPEC-ARTIFACTS` §1 writes `fields: Record<string, unknown>`, and `unknown`
 * does not survive the server-function boundary: TanStack validates the return
 * type as serializable and rejects it. This is the same contract with the
 * serialisable half named, which is what the spec meant — every one of these
 * columns is a Postgres scalar or a `Json`.
 */
export type FieldValue =
  string | number | boolean | null | FieldValue[] | { [k: string]: FieldValue };

export type ArtifactView = {
  kind: string;
  /** The plain word for the kind, from the one vocabulary the driver uses. */
  word: string;
  artifactId: string;
  createdAt: string;
  title: string | null;
  /** True only when the lookup ran and the row was not there. */
  missing: boolean;
  /** The exact per-kind columns the station's card renders. */
  fields: Record<string, FieldValue>;
};

export type StationArtifactView = {
  station: AgentStation;
  label: string;
  state: StopState;
  waivedReason: string | null;
  expects: { kind: string; word: string };
  everDriven: boolean;
  hold: string | null;
  holdReason: string | null;
  items: ArtifactView[];
};

/**
 * The columns each kind's card actually renders, beyond title and body.
 *
 * Written per kind and checked against `SPEC-ARTIFACTS` §3-§9 rather than
 * generated, because these tables do not share a shape and a plausible-looking
 * column name is a runtime error rather than a compile one.
 */
const FIELDS: Readonly<Record<string, readonly string[]>> = {
  signal: ["content", "source", "source_kind", "url", "tags", "sentiment", "theme_id"],
  theme: ["summary", "status", "status_reason", "frequency", "severity", "confidence"],
  decision: [
    "rationale",
    "status",
    "alternatives_considered",
    "decided_by_agent_slug",
    "prd_id",
    "forecast_claim",
    "forecast_how_we_will_know",
    "forecast_horizon_date",
    "forecast_resolution",
    "forecast_resolution_rationale",
    "forecast_resolved_at",
    "forecast_resolved_by_agent_slug",
    "forecast_next_check_at",
    "forecast_deferred_count",
    "forecast_deferred_at",
  ],
  prd: ["body_md", "status", "design_gate_status", "github_issue_url", "shipped_at"],
  // Widened for the pane's step list: `seq`/`depends_on` give the plan its
  // order, `estimate_hours` and `risk` are what a person scans a breakdown for.
  task: ["detail", "status", "priority", "seq", "depends_on", "estimate_hours", "risk"],
  // `name` is the title column here; there is no `title` and no body worth a card.
  prototype: ["description", "entry_path", "share_slug", "prd_id"],
  // `code_review` carries `studio.review`'s verdict — approve / revise / block
  // with per-line findings — and it was fetched by nothing. Queue item 23 is
  // "the review verdict is filed where nobody looks", and this is the half that
  // makes it readable: the column has existed since migration
  // `20260802180000_changeset_code_review.sql` and 0 of 45 changesets carry one,
  // because the tool that writes it has never successfully run. **The empty
  // state is the honest state and the pane must say so rather than hide the
  // field** — same rule as the Learn verdict card.
  changeset: [
    "summary",
    "status",
    "repo",
    "branch",
    "pr_url",
    "pr_number",
    "prd_id",
    "code_review",
  ],
  // The machine the Build crew runs: its goal, how many hops it took, and
  // whether the verify loop ever cycled — the card that answers "what did the
  // crew actually set out to do" instead of a bare title line.
  mission: ["goal", "status", "hop_count", "build_driver", "verify_cycles", "completed_at"],
  deployment: ["commit_sha", "deploy_url", "environment", "provider", "status", "deployed_at"],
  learning: [
    "summary",
    "verdict",
    "decision_id",
    "prd_id",
    "metric_label",
    "metric_value",
    "recorded_by_agent_slug",
  ],
};

export const getTrackArtifacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ stops: StationArtifactView[] }> => {
    const { supabase } = context;
    try {
      const { data: trackRow } = await supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("id", data.trackId)
        .maybeSingle();
      if (!trackRow) return { stops: [] };
      const track = rowToTrack(trackRow as unknown as TrackRow);

      const { data: rows, error } = await supabase
        .from("spine_track_members" as never)
        .select("artifact_kind, artifact_id, station, created_at")
        .eq("track_id", data.trackId)
        .order("created_at", { ascending: true });
      const members = (error || !rows ? [] : rows) as unknown as Array<{
        artifact_kind: string;
        artifact_id: string;
        station: string;
        created_at: string;
      }>;

      const byKind = new Map<string, string[]>();
      for (const m of members) {
        if (!ARTIFACT_SOURCE[m.artifact_kind]) continue;
        byKind.set(m.artifact_kind, [...(byKind.get(m.artifact_kind) ?? []), m.artifact_id]);
      }

      const found = new Map<string, { title: string | null; fields: Record<string, FieldValue> }>();
      /** Kinds whose lookup ran cleanly. Only these may report `missing`. */
      const looked = new Set<string>();

      await Promise.all(
        [...byKind.entries()].map(async ([kind, ids]) => {
          const source = ARTIFACT_SOURCE[kind];
          // `title:` is aliased per kind because three tables have no `title`.
          const cols = new Set<string>(["id", `title:${source.title}`]);
          for (const c of FIELDS[kind] ?? []) cols.add(c);
          const { data: got, error: readErr } = await supabase
            .from(source.table)
            .select([...cols].join(","))
            .in("id", ids);
          // WE DID NOT LOOK, SO WE CLAIM NOTHING.
          if (readErr) return;
          looked.add(kind);
          for (const r of (got ?? []) as unknown as Array<Record<string, FieldValue>>) {
            const id = String(r.id);
            const fields: Record<string, FieldValue> = {};
            for (const c of FIELDS[kind] ?? []) fields[c] = r[c] ?? null;
            found.set(`${kind}:${id}`, {
              title: (r.title as string | null) ?? null,
              fields,
            });
          }
        }),
      );

      /*
       * ── F-129: A SIGNAL KNOWS ITS PATTERN AND COULD ONLY SAY "clustered" ──
       *
       * The run's Discover pane ended a signal's line with the bare word
       * "clustered". `SESSION-1` asks that pane to show signals "visibly
       * grouping into themes as clustering runs" and calls it the most
       * convincing thing in the product. **A state word is not a pattern.** The
       * pattern has a name, and `theme_id` was already on the row.
       *
       * RESOLVED FROM `signals.theme_id -> themes.id`, WHICH IS THE PLATFORM
       * TRUTH. S1 shipped a first version that read the title from the theme's
       * MEMBERSHIP of the track and the founder corrected the approach: 1,133
       * signals carry a `theme_id` and only 315 of those themes are attached to
       * the same track, so designing around the other 818 fits the product to a
       * gap in bookkeeping and bakes today's mess in. **Membership is
       * bookkeeping; the foreign key is the fact.** It holds whether or not
       * anything remembered to attach the theme.
       *
       * ONE QUERY FOR THE WHOLE PANE, and no cap. S1 rejected doing this from
       * the client with `listThemes` for the right reason: it is a second read
       * of the same fact and it stops at the 300 newest, so a signal whose
       * cluster is older would silently lose its name. A limit fitted to today's
       * row count is the same mistake one layer down.
       *
       * WE DID NOT LOOK, SO WE CLAIM NOTHING: a failed theme read leaves
       * `theme_title` absent rather than null-and-present, the same fail
       * direction as the artifact loop above, so "this signal has no name for
       * its cluster" and "we could not read the names" stay apart.
       */
      const themeIds = [
        ...new Set(
          [...found.entries()]
            .filter(([key]) => key.startsWith("signal:"))
            .map(([, v]) => v.fields.theme_id)
            .filter((t): t is string => typeof t === "string" && t.length > 0),
        ),
      ];
      if (themeIds.length > 0) {
        const { data: themeRows, error: themeErr } = await supabase
          .from("themes")
          .select("id,title")
          .in("id", themeIds);
        if (!themeErr) {
          const titleById = new Map(
            ((themeRows ?? []) as Array<{ id: string; title: string | null }>).map((t) => [
              t.id,
              t.title ?? null,
            ]),
          );
          for (const [key, v] of found.entries()) {
            if (!key.startsWith("signal:")) continue;
            const tid = v.fields.theme_id;
            if (typeof tid !== "string" || !tid) continue;
            // `?? null` and not `?? undefined`: the theme id exists and we read
            // the table successfully, so a miss means that theme row is gone,
            // which is a fact worth carrying rather than a silence.
            v.fields.theme_title = titleById.get(tid) ?? null;
          }
        }
      }

      const chain = buildChain({
        route: track.route,
        station: track.station,
        status: track.status,
        members: members.map((m) => ({
          kind: m.artifact_kind,
          word: KIND_WORD[m.artifact_kind]?.one ?? m.artifact_kind,
          artifactId: m.artifact_id,
          station: m.station,
          createdAt: m.created_at,
          title: found.get(`${m.artifact_kind}:${m.artifact_id}`)?.title ?? null,
          missing: !found.has(`${m.artifact_kind}:${m.artifact_id}`) && looked.has(m.artifact_kind),
        })),
      });

      return {
        stops: chain.stops.map((stop) => ({
          station: stop.station,
          label: stop.label,
          state: stop.state,
          waivedReason: stop.waivedReason,
          expects: {
            kind: STATION_ARTIFACT[stop.station]?.kind ?? "",
            word: KIND_WORD[STATION_ARTIFACT[stop.station]?.kind ?? ""]?.one ?? "",
          },
          everDriven: track.drivenAt !== null,
          hold: track.hold,
          holdReason: track.holdReason,
          items: stop.members.map((m) => {
            const hit = found.get(`${m.kind}:${m.artifactId}`);
            return {
              kind: m.kind,
              word: m.word,
              artifactId: m.artifactId,
              createdAt: m.createdAt,
              title: hit?.title ?? null,
              missing: m.missing,
              fields: hit?.fields ?? {},
            };
          }),
        })),
      };
    } catch {
      return { stops: [] };
    }
  });

/**
 * `spine_tracks.pending_gates`, read defensively.
 *
 * A jsonb column reaches here as whatever was written. `rememberGates` writes
 * `[{id, station}]`, and a row that predates it, or one a future deploy shapes
 * differently, must degrade to "no gates" rather than throw inside a read a
 * surface polls every few seconds.
 */
function readPendingGates(raw: unknown): PendingGate[] {
  if (!Array.isArray(raw)) return [];
  const out: PendingGate[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const id = (item as { id?: unknown }).id;
    const station = (item as { station?: unknown }).station;
    if (typeof id !== "string" || typeof station !== "string") continue;
    if (!AGENT_STATION_ORDER.includes(station as AgentStation)) continue;
    out.push({ id, station: station as AgentStation });
  }
  return out;
}

/* ------------------------------------------------------------------------- *
 * THE GATES INSIDE ONE RUN (SPEC-CONSENT §1.3, §5.2, §3.3)
 * ------------------------------------------------------------------------- */

/**
 * One question waiting inside one run.
 *
 * THE LINK IS ONE-WAY AND THAT IS THE WHOLE DESIGN. `agent_approvals` carries
 * `user_id`, `run_id`, `mission_id` and `workspace_id`, and **none of those
 * identifies a spine track**. The migration that created `pending_gates` rejects
 * every correlational alternative in its own words: matching on user and time
 * "would be the same time-window guess the attachment pass already rejected for
 * lying". So `spine_tracks.pending_gates` is the membership statement, and a
 * pending approval absent from it belongs to some other run.
 */
export type TrackGate = {
  approvalId: string;
  /** From `pending_gates`, NOT re-derived: the station that actually asked. */
  station: AgentStation;
  /** Keys the consequence catalogue only. NEVER rendered — SPEC-CONSENT §2.4. */
  toolName: string | null;
  agentSlug: string | null;
  /** The agent's own words for why it asked. */
  rationale: string | null;
  status: "pending" | "approved" | "executed" | "rejected" | "failed" | "cancelled" | "expired";
  askedAtMs: number;
  expiresAtMs: number | null;
  /** NULL means the row predates the column, not that the default is unknown. */
  expiryDefault: "proceed" | "cancel" | null;
  /** A snoozed gate still holds the run. */
  snoozedUntilMs: number | null;
  /**
   * How many OTHER pending gates in this workspace share this `tool_name`.
   * **Server-counted, never client-inferred**: it is printed on a button that
   * states its own reach, and a count a client guessed would be a claim about
   * rows the client cannot see.
   */
  classPendingElsewhere: number;
};

export type TrackGatesResult = {
  /** Answerable now. Only `pending` rows. */
  open: TrackGate[];
  /** Answered or expired, newest first — what happened, not what is waiting. */
  settled: TrackGate[];
  /** The track's own hold sentence, so the card can say why the run stopped. */
  holdReason: string | null;
  /**
   * True when the approvals read FAILED. Distinct from "no gates": a card that
   * renders "nothing is waiting on you" over an unreadable table is telling a
   * person their run is fine when nobody looked.
   */
  unreadable: boolean;
};

const GATE_STATUSES = [
  "pending",
  "approved",
  "executed",
  "rejected",
  "failed",
  "cancelled",
  "expired",
] as const;

function gateStatus(raw: unknown): TrackGate["status"] {
  const v = String(raw ?? "").toLowerCase();
  return (GATE_STATUSES as readonly string[]).includes(v) ? (v as TrackGate["status"]) : "pending";
}

function epochOrNull(v: unknown): number | null {
  if (!v) return null;
  const n = Date.parse(String(v));
  return Number.isFinite(n) ? n : null;
}

/**
 * The questions this run is waiting on, and the ones it already answered.
 *
 * Its own read with its own cadence rather than a field on `Track`: a gate
 * changes when a person answers it, and the track changes when the driver moves
 * it. Putting them on one query would make the cheaper one wait for the dearer.
 */
export const getTrackGates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<TrackGatesResult> => {
    const { supabase, userId } = context;
    const empty: TrackGatesResult = {
      open: [],
      settled: [],
      holdReason: null,
      unreadable: false,
    };
    try {
      const { data: row } = await supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("id", data.trackId)
        .maybeSingle();
      if (!row) return empty;
      const track = rowToTrack(row as unknown as TrackRow);
      const workspaceId = (row as unknown as TrackRow).workspace_id ?? null;

      const listed = readPendingGates(
        (row as unknown as { pending_gates?: unknown }).pending_gates,
      );
      if (listed.length === 0) return { ...empty, holdReason: track.holdReason };

      const { data: rows, error } = await supabase
        .from("agent_approvals")
        .select(
          "id,tool_name,agent_slug,rationale,status,created_at,expires_at,expiry_default,snoozed_until",
        )
        .in(
          "id",
          listed.map((g) => g.id),
        )
        .eq("user_id", userId);

      // WE DID NOT LOOK, SO WE CLAIM NOTHING. An unreadable approvals table must
      // not render as "nothing is waiting on you".
      if (error) return { ...empty, holdReason: track.holdReason, unreadable: true };

      const byId = new Map(
        ((rows ?? []) as unknown as Array<Record<string, unknown>>).map((r) => [String(r.id), r]),
      );

      /*
       * THE CLASS COUNT IS ONE QUERY, NOT ONE PER GATE. It answers "how many
       * OTHER pending calls in this workspace share this tool", which is what
       * the Decide-all button prints. Scoped to workspace AND caller, because a
       * count that crossed either boundary would be a number about rows this
       * person may not act on.
       */
      const classCount = new Map<string, number>();
      const tools = [
        ...new Set(
          listed
            .map((g) => (byId.get(g.id)?.tool_name as string | null) ?? null)
            .filter((t): t is string => !!t),
        ),
      ];
      if (tools.length > 0 && workspaceId) {
        const { data: peers } = await supabase
          .from("agent_approvals")
          .select("id,tool_name")
          .eq("user_id", userId)
          .eq("workspace_id", workspaceId)
          .eq("status", "pending")
          .in("tool_name", tools);
        for (const p of (peers ?? []) as unknown as Array<{ id: string; tool_name: string }>) {
          classCount.set(p.tool_name, (classCount.get(p.tool_name) ?? 0) + 1);
        }
      }

      const gates: TrackGate[] = listed.map((g) => {
        const r = byId.get(g.id);
        const toolName = (r?.tool_name as string | null) ?? null;
        // This gate excluded from its own class count.
        const peers = toolName ? Math.max(0, (classCount.get(toolName) ?? 0) - 1) : 0;
        return {
          approvalId: g.id,
          station: g.station,
          toolName,
          agentSlug: (r?.agent_slug as string | null) ?? null,
          rationale: (r?.rationale as string | null) ?? null,
          status: gateStatus(r?.status),
          askedAtMs: epochOrNull(r?.created_at) ?? 0,
          expiresAtMs: epochOrNull(r?.expires_at),
          expiryDefault: ((r?.expiry_default as string | null) ?? null) as
            "proceed" | "cancel" | null,
          snoozedUntilMs: epochOrNull(r?.snoozed_until),
          classPendingElsewhere: peers,
        };
      });

      return {
        open: gates.filter((g) => g.status === "pending"),
        settled: gates
          .filter((g) => g.status !== "pending")
          .sort((a, b) => b.askedAtMs - a.askedAtMs),
        holdReason: track.holdReason,
        // A gate this track lists whose approval row did not come back is not
        // "settled" and not "open": we could not read it. Same rule as above.
        unreadable: gates.some((g) => !byId.has(g.approvalId)),
      };
    } catch {
      return { ...empty, unreadable: true };
    }
  });

/**
 * Answer ONE question inside one run, in a single call.
 *
 * ── WHY THIS IS ONE FUNCTION AND NOT THREE CALLS FROM THE CARD ─────────────
 *
 * Three doors existed and each one lost something (SPEC-CONSENT §5.2):
 * `decideApprovalItem` writes the gate signal and **loses the reason**;
 * `resolveApproval` writes the reason and **writes no gate signal**;
 * `sendBackApprovalItem` writes both and **refuses `tool_call` outright**.
 *
 * A card that called two of them in sequence could half-write — reason stored,
 * signal missing, or the reverse — and a half-written decision is worse than a
 * refused one, because it looks complete. So the four writes happen here and
 * **each is reported independently**: a partial write is reported as partial.
 *
 * ── THE OWNERSHIP CHECK IS THE FIRST THING AND IT IS NOT A FORMALITY ───────
 *
 * `approvalId` must be in THIS track's `pending_gates`. Without it this becomes
 * an unscoped write door onto every approval the caller holds, reachable from a
 * run page by changing one id in a request. `pending_gates` is the only edge
 * that exists (§1.1), so it is also the only honest scope.
 *
 * ── A REJECT WITH NO REASON IS REFUSED BY THE SERVER, NOT BY THE FORM ──────
 *
 * `sendBackApprovalItem` set the precedent: *"a note-less send-back is a
 * decline."* Here the entire point of the item is that declining records a
 * reason, so the floor belongs on the server where a second client cannot skip
 * it.
 */
export type DecideTrackGateResult = {
  ok: boolean;
  /** What the row actually holds afterwards, read back rather than assumed. */
  status: string;
  /** Somebody else answered first. Ordinary, never an error. */
  alreadyDecided: boolean;
  reasonRecorded: boolean;
  signalRecorded: boolean;
  steered: boolean;
  problems: string[];
};

const DecideGateSchema = z
  .object({
    trackId: z.string().uuid(),
    approvalId: z.string().uuid(),
    verdict: z.enum(["approve", "reject"]),
    reason: z.string().trim().max(2000).optional(),
    steer: z.boolean().optional(),
  })
  .refine((d) => d.verdict !== "reject" || !!d.reason?.trim(), {
    message: "Declining records why. Say what was wrong with it.",
    path: ["reason"],
  });

export const decideTrackGate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DecideGateSchema.parse(d))
  .handler(async ({ context, data }): Promise<DecideTrackGateResult> => {
    const { supabase, userId } = context;
    const out: DecideTrackGateResult = {
      ok: false,
      status: "unknown",
      alreadyDecided: false,
      reasonRecorded: false,
      signalRecorded: false,
      steered: false,
      problems: [],
    };
    try {
      const { data: row } = await supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("id", data.trackId)
        .maybeSingle();
      if (!row) return { ...out, problems: ["That track could not be found."] };
      const raw = row as unknown as TrackRow;

      // THE SCOPE. See the header: this is the only edge, so it is the only gate.
      const listed = readPendingGates(
        (row as unknown as { pending_gates?: unknown }).pending_gates,
      );
      if (!listed.some((g) => g.id === data.approvalId)) {
        return {
          ...out,
          problems: ["That question does not belong to this run, so it was not answered here."],
        };
      }

      const { data: before } = await supabase
        .from("agent_approvals")
        .select("id,tool_name,agent_slug,status")
        .eq("id", data.approvalId)
        .eq("user_id", userId)
        .maybeSingle();
      const toolName = (before as { tool_name?: string | null } | null)?.tool_name ?? null;
      const agentSlug = (before as { agent_slug?: string | null } | null)?.agent_slug ?? null;

      const decision = data.verdict === "approve" ? "approved" : "rejected";
      const reason = data.reason?.trim() ?? "";

      // 1. THE CLAIM. Losing this race is ordinary: two tabs answering the same
      //    call must not run the tool twice.
      const claim = await claimApprovalDecision(supabase, userId, data.approvalId, decision);
      if (!claim.claimed) {
        const { data: now } = await supabase
          .from("agent_approvals")
          .select("status")
          .eq("id", data.approvalId)
          .maybeSingle();
        return {
          ...out,
          ok: true,
          alreadyDecided: true,
          status: String((now as { status?: string } | null)?.status ?? "unknown"),
          problems: ["That call had already been answered."],
        };
      }

      // 2. THE REASON LANDS BEFORE ANYTHING ELSE MOVES. Provenance first, the
      //    same order `decideOneApprovalItem` uses.
      if (reason) {
        try {
          const { error } = await supabase
            .from("agent_approvals")
            .update({ decision_reason: reason.slice(0, 2000) } as never)
            .eq("id", data.approvalId)
            .eq("user_id", userId);
          out.reasonRecorded = !error;
          if (error) out.problems.push("The decision stands; your note was not stored.");
        } catch {
          out.problems.push("The decision stands; your note was not stored.");
        }
      }

      // 3. THE GATE SIGNAL. Best-effort by contract: telemetry must never break
      //    the gate it observes.
      const signal = await recordGateSignalCore(supabase, userId, {
        gateType: data.verdict === "approve" ? "approval" : "rejection",
        subjectType: "tool_call",
        subjectRef: data.approvalId,
        agentSlug,
        toolName,
        verdict: decision,
        diffSummary: reason || null,
        workspaceId: raw.workspace_id ?? null,
      });
      out.signalRecorded = signal.ok;

      // 4. APPROVING ALSO EXECUTES, which is the semantics every other approval
      //    surface has. An approve that does not execute leaves the run paused
      //    forever waiting for a status it will never reach.
      if (data.verdict === "approve") {
        try {
          await executeApproval(supabase, userId, data.approvalId);
        } catch (e) {
          out.problems.push(
            `The approval is recorded and the tool did not run: ${e instanceof Error ? e.message : "it failed"}`,
          );
        }
      }

      // 5. THE OPTIONAL STEER, so a decline can tell the run what to do instead.
      if (data.steer && reason) {
        try {
          const { error } = await supabase.from("agent_messages").insert({
            user_id: userId,
            workspace_id: raw.workspace_id ?? null,
            track_id: data.trackId,
            kind: "steer",
            payload: { message: reason },
          });
          out.steered = !error;
          if (error) out.problems.push("Your note was not passed on to the run.");
        } catch {
          out.problems.push("Your note was not passed on to the run.");
        }
      }

      const { data: after } = await supabase
        .from("agent_approvals")
        .select("status")
        .eq("id", data.approvalId)
        .maybeSingle();

      return {
        ...out,
        ok: true,
        status: String((after as { status?: string } | null)?.status ?? decision),
      };
    } catch (e) {
      return { ...out, problems: [e instanceof Error ? e.message : String(e)] };
    }
  });

/**
 * Answer every pending question of this KIND in this workspace.
 *
 * ── THE CONTROL THE WHOLE ITEM EXISTS FOR ─────────────────────────────────
 *
 * 90 `cluster.trigger` approvals were raised since July: 42 cancelled, 38
 * expired, 10 pending, **zero ever approved**. They are not ninety questions.
 * They are one question asked ninety times, and a queue that can only be
 * answered one row at a time is how a person ends up answering none of them.
 *
 * ── THE CLASS KEY IS `tool_name` AND NOTHING ELSE ─────────────────────────
 *
 * Not `args` — the ninety differ only by workspace and time. Not `agent_slug` —
 * the same tool is raised by more than one seat.
 *
 * ── APPROVE-ALL IS OFFERED ONLY WHERE SILENCE WOULD ALREADY SAY YES ────────
 *
 * `expiryDefaultFor(toolName) === "proceed"` means the call is reversible AND
 * internal, so its declared outcome on silence is already "run it". Saying yes
 * to all of them at once therefore grants **nothing that waiting would not**.
 * Where the declared default is `cancel` — anything irreversible or external —
 * approve-all is refused, and `studio.pr.merge` never merges five PRs on one
 * click. **Decline-all is always allowed**: declining N calls can never be worse
 * than each of them expiring.
 */
export type DecideClassResult = {
  decided: Array<{ approvalId: string }>;
  refused: Array<{ approvalId: string; reason: string }>;
  /** Pending members the cap left untouched. Never silently dropped. */
  remaining: number;
  /** The caller asked to approve a class whose declared default is `cancel`. */
  refusedAsUnsafeClass: boolean;
};

const DecideClassSchema = z
  .object({
    trackId: z.string().uuid(),
    toolName: z.string().min(1).max(100),
    verdict: z.enum(["approve", "reject"]),
    reason: z.string().trim().max(2000).optional(),
  })
  .refine((d) => d.verdict !== "reject" || !!d.reason?.trim(), {
    message: "Declining records why. Say what was wrong with them.",
    path: ["reason"],
  });

export const decideTrackGateClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DecideClassSchema.parse(d))
  .handler(async ({ context, data }): Promise<DecideClassResult> => {
    const { supabase, userId } = context;
    const out: DecideClassResult = {
      decided: [],
      refused: [],
      remaining: 0,
      refusedAsUnsafeClass: false,
    };
    try {
      // APPROVE-ALL IS GATED ON THE CALL'S OWN DECLARED DEFAULT, before any read.
      if (data.verdict === "approve" && expiryDefaultFor(data.toolName) !== "proceed") {
        return { ...out, refusedAsUnsafeClass: true };
      }

      const { data: row } = await supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("id", data.trackId)
        .maybeSingle();
      if (!row) return out;
      const workspaceId = (row as unknown as TrackRow).workspace_id ?? null;
      // No workspace, no class: the scope printed on the button is the scope
      // enforced here, and an unscoped bulk write is never the safe default.
      if (!workspaceId) return out;

      const { data: peers, error } = await supabase
        .from("agent_approvals")
        .select("id")
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .eq("status", "pending")
        .eq("tool_name", data.toolName)
        .order("created_at", { ascending: true });
      if (error) return out;

      const all = ((peers ?? []) as unknown as Array<{ id: string }>).map((r) => r.id);
      const batch = all.slice(0, MAX_BULK_DECISIONS);
      // NEVER A SILENT CAP. What was not attempted is counted and returned.
      out.remaining = Math.max(0, all.length - batch.length);

      const decision = data.verdict === "approve" ? "approved" : "rejected";
      const reason = data.reason?.trim() ?? "";

      for (const approvalId of batch) {
        const claim = await claimApprovalDecision(supabase, userId, approvalId, decision);
        if (!claim.claimed) {
          out.refused.push({ approvalId, reason: "It had already been answered." });
          continue;
        }
        if (reason) {
          try {
            await supabase
              .from("agent_approvals")
              .update({ decision_reason: reason.slice(0, 2000) } as never)
              .eq("id", approvalId)
              .eq("user_id", userId);
          } catch {
            // The decision stands without the note; reported per-item would be
            // noise at this scale, and the note is not what gates the run.
          }
        }
        await recordGateSignalCore(supabase, userId, {
          gateType: data.verdict === "approve" ? "approval" : "rejection",
          subjectType: "tool_call",
          subjectRef: approvalId,
          agentSlug: null,
          toolName: data.toolName,
          verdict: decision,
          diffSummary: reason || null,
          workspaceId,
        });
        if (data.verdict === "approve") {
          try {
            await executeApproval(supabase, userId, approvalId);
          } catch (e) {
            out.refused.push({
              approvalId,
              reason: `Approved, and it did not run: ${e instanceof Error ? e.message : "failed"}`,
            });
            continue;
          }
        }
        out.decided.push({ approvalId });
      }
      return out;
    } catch {
      return out;
    }
  });

export const getTrackChain = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(
    async ({ context, data }): Promise<{ track: Track | null; chain: Chain; summary: string }> => {
      const { supabase } = context;
      const empty: Chain = { stops: [], orphans: [], total: 0 };

      try {
        const { data: row } = await supabase
          .from("spine_tracks" as never)
          .select(SELECT)
          .eq("id", data.trackId)
          .maybeSingle();
        if (!row) return { track: null, chain: empty, summary: "" };

        const track = rowToTrack(row as unknown as TrackRow);
        const shape = {
          route: track.route,
          station: track.station,
          status: track.status,
        };

        const { data: memberRows } = await supabase
          .from("spine_track_members" as never)
          .select("artifact_kind,artifact_id,station,created_at")
          .eq("track_id", data.trackId);

        const rows = (memberRows ?? []) as unknown as MemberRow[];
        if (rows.length === 0) {
          // Still built, never short-circuited to a blank: the route and its
          // waivers are most of what this answers, and a track that has
          // produced nothing yet is exactly the one worth showing a route for.
          const chain = buildChain({ ...shape, members: [] });
          return { track, chain, summary: describeChain(chain) };
        }

        const byKind = new Map<string, string[]>();
        for (const r of rows) {
          const ids = byKind.get(r.artifact_kind) ?? [];
          ids.push(r.artifact_id);
          byKind.set(r.artifact_kind, ids);
        }

        const titles = new Map<string, string | null>();
        /** Kinds whose table answered. Only these may have a row called gone. */
        const answered = new Set<string>();

        await Promise.all(
          [...byKind].map(async ([kind, ids]) => {
            const source = ARTIFACT_SOURCE[kind];
            if (!source) return;
            try {
              // The title column is named per kind: a prototype has `name`, a
              // learning has `summary`, a deployment has only its URL. Aliasing
              // to `title` keeps one shape here without pretending every table
              // spells it the same way. A kind with a `parent` also pulls the
              // parent's name, which is the only readable name a release has.
              const select = source.parent
                ? `id,title:${source.title},${source.parent.table}(${source.parent.column})`
                : `id,title:${source.title}`;
              const { data: found, error } = await supabase
                .from(source.table as never)
                .select(select)
                .in("id", ids);
              if (error || !found) return;
              answered.add(kind);
              for (const f of found as unknown as Record<string, unknown>[]) {
                const own = typeof f.title === "string" ? f.title.trim() : "";
                // The parent's name wins when it has one. A release named by the
                // change it shipped is recognisable; one named by its hostname
                // is not. Supabase returns an embed as an object or an array
                // depending on the relationship, so both are read.
                let borrowed = "";
                if (source.parent) {
                  const embed = f[source.parent.table];
                  const row = (Array.isArray(embed) ? embed[0] : embed) as
                    Record<string, unknown> | null | undefined;
                  const v = row?.[source.parent.column];
                  if (typeof v === "string") borrowed = v.trim();
                }
                titles.set(`${kind}:${f.id as string}`, borrowed || own || null);
              }
            } catch {
              // Left unanswered on purpose. See the header: no claim either way.
            }
          }),
        );

        const members: ChainMember[] = rows.map((r) => {
          const key = `${r.artifact_kind}:${r.artifact_id}`;
          return {
            kind: r.artifact_kind,
            word: wordFor(r.artifact_kind),
            artifactId: r.artifact_id,
            station: r.station,
            createdAt: r.created_at,
            title: titles.get(key) ?? null,
            missing: answered.has(r.artifact_kind) && !titles.has(key),
          };
        });

        const chain = buildChain({ ...shape, members });
        return { track, chain, summary: describeChain(chain) };
      } catch {
        return { track: null, chain: empty, summary: "" };
      }
    },
  );

/**
 * Who acted on this piece of work, in order, and what came of it.
 *
 * Reads only rows the runs wrote themselves: `agent_runs` for who acted and how
 * it ended, `spine_track_members` for what was filed. Nothing is inferred from
 * timing or from a missing row; see the header of ./activity.ts for why a status
 * display that guesses is worse than none.
 *
 * Fails to an empty stream rather than an error page. This is a view onto work,
 * and a track whose activity cannot be read still has a chain, a route and a
 * position worth showing.
 */
/**
 * One station-to-station move, with WHO ASKED FOR IT carried to the surface.
 *
 * Queue 65's server half. `drivenVia` is the F-55/queue-64 record: `sweep` is
 * the loop moving on its own, `press` is a person acting, `continuation` is the
 * client walking on from a window-closed leg. `foreground` appears only on rows
 * written before the split and NULL on rows older than the question — a surface
 * must claim nothing about a person for either.
 */
export type TrackTransition = {
  from: string | null;
  to: string;
  at: string;
  drivenVia: "sweep" | "press" | "continuation" | "foreground" | null;
};

export const getTrackActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(
    async ({ context, data }): Promise<{ turns: Turn[]; transitions: TrackTransition[] }> => {
      const { supabase } = context;
      try {
        const [runsRes, membersRes, eventsRes] = await Promise.all([
          supabase
            .from("agent_runs")
            /*
             * THE FOUR EXTRA COLUMNS ARE THE TURN'S ROLLUP, and each one is a
             * real column rather than something the transcript works out:
             * `duration_ms` is how long the seat worked, `tokens_used` is what
             * it burned, and `halted_reason`/`failure_kind` are the only place
             * on the record where the PLATFORM, rather than the agent's own
             * prose, says why a turn stopped. `activity.ts` refuses every one of
             * them when the value is a zero or a blank; see `Turn.tookMs` for
             * the counts that force that.
             */
            .select(
              "id,agent_slug,agent_name,status,output,created_at,spend_used_usd,duration_ms,tokens_used,halted_reason,failure_kind",
            )
            .eq("track_id", data.trackId)
            .order("created_at", { ascending: true })
            .limit(200),
          supabase
            .from("spine_track_members" as never)
            .select("artifact_kind,artifact_id,station,created_at")
            .eq("track_id", data.trackId)
            .order("created_at", { ascending: true }),
          supabase
            .from("stage_events" as never)
            .select("from_stage,to_stage,at,driven_via")
            .eq("entity_type", "spine_track")
            .eq("entity_id", data.trackId)
            .order("at", { ascending: true })
            .limit(200),
        ]);

        return {
          turns: buildActivity({
            runs: (runsRes.data ?? []) as unknown as RunRow[],
            members: (membersRes.data ?? []) as unknown as ActivityMemberRow[],
          }),
          transitions: (
            (eventsRes.data ?? []) as unknown as Array<{
              from_stage: string | null;
              to_stage: string;
              at: string;
              driven_via: TrackTransition["drivenVia"];
            }>
          ).map((e) => ({
            from: e.from_stage,
            to: e.to_stage,
            at: e.at,
            drivenVia: e.driven_via ?? null,
          })),
        };
      } catch {
        return { turns: [], transitions: [] };
      }
    },
  );

/**
 * ── STEER A TRACK ─────────────────────────────────────────────────────────────
 *
 * Mid-run guidance for the six stations that never open a mission.
 *
 * `steerStudioSession` (`studio.functions.ts:1167`) already does this for Build:
 * it takes a `missionId`, hardcodes `to_agent_slug: "builder"`, and refuses
 * without a mission. That is correct for Build and useless everywhere else,
 * because the driver opens a mission for exactly one station
 * (`driver.server.ts:1189`). §10 criterion 11 measures the gap: stations that
 * accept a steer, 1 of 7.
 *
 * A TRACK IS THE ADDRESS, NOT AN AGENT. No `to_agent_id`, no `to_agent_slug`.
 * The loop matches on `track_id` and `kind`, so the steer reaches whoever is
 * working the track when it is read, which is the only correct target: the
 * station changes as the work moves, and naming an agent would address the
 * message to whoever happened to hold it when the person started typing.
 *
 * THE READ IS THE AUTHORIZATION, and it is deliberate rather than incidental.
 * The track is fetched through the caller's own client, so RLS decides. A track
 * the caller cannot see does not exist to them, and this returns the same
 * "could not be found" it would for an id that is genuinely absent. It leaks
 * nothing about whether the id exists.
 *
 * 2000 CHARACTERS BECAUSE THAT IS WHAT THE LOOP INJECTS. `loop.server.ts` slices
 * the message to 2000 before appending it as operator guidance. Accepting more
 * here would take text the product silently discards, and a person whose last
 * sentence vanished has been lied to by a form.
 *
 * THIS PUTS A PERSON'S WORDS INTO A RUNNING AGENT'S CONVERSATION, WHICH IS THE
 * FEATURE. Three things bound it, and they are worth naming together because no
 * one of them is sufficient: the caller is authenticated, RLS has already agreed
 * they may see this track, and the loop appends the text under an explicit
 * "Operator steering" label as a `user` turn rather than blending it into the
 * system prompt. What it is NOT is a way to reach a track you cannot otherwise
 * read.
 */
export const steerTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        trackId: z.string().uuid(),
        message: z.string().trim().min(1).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ steered: boolean; problems: string[] }> => {
    const { supabase, userId } = context;
    try {
      const { data: row } = await supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("id", data.trackId)
        .maybeSingle();
      if (!row) return { steered: false, problems: ["That track could not be found."] };

      const raw = row as unknown as TrackRow;

      /*
       * A finished track cannot be steered, and saying so beats writing a row
       * nobody will ever read. An unconsumed steer on a track that has stopped
       * is not harmful, it is just permanently pending, and a person who typed
       * it is entitled to know it landed nowhere.
       */
      if (raw.status === "done" || raw.status === "abandoned") {
        return {
          steered: false,
          problems: [`This track is ${raw.status}, so there is nothing running to steer.`],
        };
      }

      const { error } = await supabase.from("agent_messages").insert({
        user_id: userId,
        workspace_id: raw.workspace_id ?? null,
        track_id: data.trackId,
        kind: "steer",
        payload: { message: data.message },
      });
      if (error) return { steered: false, problems: [error.message] };

      return { steered: true, problems: [] };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { steered: false, problems: [msg] };
    }
  });

/* ------------------------------------------------------------------------- */

/**
 * WALK ONE TRACK NOW, IN THE FOREGROUND, WHILE A PERSON WATCHES.
 *
 * WHY THIS EXISTS, measured 2026-08-25 against production. `driveTrackOnce` had
 * exactly one caller in the whole product: the background cron in
 * `routes/api/public/hooks/track-tick.ts`. That sweep serves up to five tracks
 * under ONE shared 45s deadline at up to three seats a station, and it is right
 * to: it is protecting the Worker's request budget across every track at once.
 *
 * The consequence is that nothing a person does can make their own work move.
 * 59 tracks have existed, 58 entered at `sense`, and NOT ONE has ever reached
 * `learn`. The sweep drove five tracks in twenty-four hours; a seven-station
 * route is roughly twenty-one seats. At that rate one journey takes weeks,
 * which for somebody watching is the same as never.
 *
 * THE WHOLE FIX IS THE THIRD ARGUMENT, and the driver already anticipated it:
 *
 *     tickStartedAtMs: number = Date.now(),
 *     // "Defaults to now, so a caller driving one track by hand gets the full
 *     //  window."
 *
 * Passing a FRESH `Date.now()` on every seat gives each seat the full window
 * instead of a shrinking slice of one shared one. Passing the loop's start time
 * instead — which is the obvious-looking thing to do, and which a draft of this
 * endpoint did on 2026-08-25 — reproduces the exact starvation this exists to
 * escape, while looking correct.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO. It does not touch the tick, and it must
 * not: the sweep's shared deadline is load-bearing for every track it serves.
 * This is a second door onto the same driver, not a change to the first.
 *
 * IT STOPS ON STRUCTURE, NEVER ON PROSE. `DriveOutcome` carries `moved`,
 * `hold` and `arrivedAt`, so the loop reads state. A draft of this decided when
 * to stop with `outcome.line.includes("gate")`, which is a guard on a sentence:
 * it breaks the day the copy improves and passes the day the meaning breaks.
 *
 * IT IS BOUNDED TWICE, and reports which bound it hit. A Worker request cannot
 * run forever, so a walk that is still going when the window closes returns
 * `more: true` and the caller drives again. That is honest, and it keeps a long
 * route from being silently truncated into something that looks finished.
 */
export type DriveStep = {
  /** The station that ran, or the one the track is held at. */
  station: AgentStation | null;
  moved: boolean;
  arrivedAt: AgentStation | null;
  hold: string | null;
  /** The sentence a person reads. Always populated. */
  line: string;
  /** How many artifacts this seat actually filed. Rows that landed, not intent. */
  produced: number;
};

export type DriveNowResult = {
  track: Track | null;
  steps: DriveStep[];
  /**
   * Why the walk stopped. `finished` means the route has no next station, which
   * is the only one of these that means the journey is complete.
   */
  stopped: "finished" | "held" | "stalled" | "out-of-window" | "not-found";
  /** The route has more to walk; call again to continue it. */
  more: boolean;
};

/** Seats one foreground call will spend. Seven stations at three seats, plus slack. */
const FOREGROUND_MAX_SEATS = 24;

/**
 * How long one foreground call may run before handing control back.
 *
 * Under the platform's request ceiling on purpose: a walk that is cut here
 * returns `more: true` and loses nothing, whereas one killed by the runtime
 * returns nothing at all and looks like a crash.
 */
const FOREGROUND_WINDOW_MS = 50_000;

export const driveTrackNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    /*
     * `origin` IS REQUIRED FOR THE SAME REASON `via` IS on `driveTrackOnce`
     * (queue 64, same argument as F-55): a defaulted origin would answer for a
     * call site that never considered whether it is a person acting or the
     * client continuing, and the answer it invented would be the one the record
     * later has to distrust. One press that walks a whole route and ten manual
     * nudges wrote identical rows until this parameter existed.
     */
    (d: { trackId: string; origin: "press" | "continuation" }) =>
      z.object({ trackId: z.string().uuid(), origin: z.enum(["press", "continuation"]) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<DriveNowResult> => {
    const { supabase, userId } = context;
    const steps: DriveStep[] = [];
    const startedAt = Date.now();

    /*
     * OWNERSHIP IS FILTERED HERE AND NOT LEFT TO RLS ALONE, and the reason is
     * not that RLS is missing. `spine_tracks` carries
     * `FOR ALL USING (auth.uid() = user_id)`, and every read below goes through
     * the caller's own token, so today a stranger's track simply does not come
     * back and this walk answers `not-found`.
     *
     * The filter is here because `driveTrackOnce` ENFORCES NOTHING ITSELF. Its
     * other caller, the sweep in `routes/api/public/hooks/track-tick.ts`, hands
     * it `supabaseAdmin`, which is correct there and which means the driver has
     * never had to care who owns a row. So the ONLY thing standing between this
     * endpoint and driving somebody else's work is which client fetched the
     * row, and this endpoint SPENDS MONEY on every seat it drives.
     *
     * A future refactor that swaps this client for the admin one to fix some
     * unrelated permission error would remove that gate silently and leave no
     * failing test behind. Naming the owner in the query costs nothing and
     * changes no behaviour today, because RLS already returns the same set.
     */
    const readTrack = async (): Promise<Track | null> => {
      const { data: row } = await supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("id", data.trackId)
        .eq("user_id", userId)
        .maybeSingle();
      return row ? rowToTrack(row as unknown as TrackRow) : null;
    };

    const opening = await readTrack();
    if (!opening) return { track: null, steps, stopped: "not-found", more: false };

    let stopped: DriveNowResult["stopped"] = "stalled";

    for (let seat = 0; seat < FOREGROUND_MAX_SEATS; seat += 1) {
      if (Date.now() - startedAt > FOREGROUND_WINDOW_MS) {
        stopped = "out-of-window";
        break;
      }

      const { data: driveRow } = await supabase
        .from("spine_tracks" as never)
        .select(DRIVE_SELECT)
        .eq("id", data.trackId)
        .eq("user_id", userId)
        .maybeSingle();
      // Re-checked on EVERY seat, not only on the way in. A walk can span a
      // minute, and a row that stops being readable partway through must stop
      // the walk rather than let the loop carry on against a stale copy.
      if (!driveRow) {
        stopped = "not-found";
        break;
      }

      // A FRESH CLOCK PER SEAT. This single argument is what separates a watched
      // run from the sweep's rationed one. See the header.
      // F-55 / queue 64. The caller's own `origin` — `press` when a person
      // acted, `continuation` when the client is walking on from a closed
      // window — because somebody is looking at this either way. Every
      // transition it writes stays disqualified from being evidence of an
      // unattended run, and the record now also says whether a HUMAN caused
      // this specific leg, which is the half of criterion 2 about touching a
      // run mid-flight rather than about watching it.
      const outcome = await driveTrackOnce(supabase, driveRow as never, data.origin, Date.now());

      steps.push({
        station: outcome.station,
        moved: outcome.moved,
        arrivedAt: outcome.arrivedAt,
        hold: outcome.hold,
        line: outcome.line,
        produced: outcome.attached.length,
      });

      /*
       * `out-of-time` IS THIS LOOP'S OWN CLOCK, NOT A HOLD (F-46, REQ-027).
       *
       * Two bounds look like one. `FOREGROUND_WINDOW_MS` (50s) belongs to the
       * watched walk; `TICK_DEADLINE_MS` (45s) belongs INSIDE `driveTrackOnce`
       * and stops the crew between seats. A crew that exceeds 45s returns
       * `hold: "out-of-time"` — and nothing is waiting on anybody. **The loop
       * ran out of its own turn.**
       *
       * Treating it as a hold broke the watched path outright: `stopped` became
       * `"held"`, `more` computed `false`, and item 34's auto-continue never
       * fired, because the driver never emitted the one value it waits for.
       *
       * AND IT IS NOT AN EDGE CASE. Measured over 167 track-attached runs in
       * 48h (mean seat 25.4s, max 89.3s, 9.6% over 45s), the per-crew sums are
       * sense **69.6s**, decide **73.3s**, plan **56.3s** — against design 40.0s
       * and build 28.0s. **Three of the five populated stations structurally
       * cannot finish a crew inside the inner deadline**, so `out-of-window` was
       * close to unreachable on the watched path and the continue was dead code.
       *
       * `holdTone("out-of-time")` returns `"hold"`, so the surface still says
       * something honest if this ever reaches it; what it must not do is stop
       * the walk and claim a person is needed.
       */
      if (outcome.hold === "out-of-time") {
        stopped = "out-of-window";
        break;
      }

      // Every OTHER hold is a real answer, not a failure to report. Something is
      // waiting on a person or on evidence, and the surface has to be able to
      // say which.
      if (outcome.hold) {
        stopped = "held";
        break;
      }

      if (!outcome.moved) {
        stopped = "stalled";
        break;
      }

      if (outcome.arrivedAt && nextStation(opening.route, outcome.arrivedAt) === null) {
        stopped = "finished";
        break;
      }
    }

    const track = await readTrack();
    const more =
      stopped === "out-of-window" ||
      (stopped === "stalled" && steps.length === FOREGROUND_MAX_SEATS);

    return { track, steps, stopped, more };
  });

/**
 * TAKE A STEP OVER BY HAND AND HAND IT BACK (gap #6 + gap #12's first mechanism).
 *
 * ── THE TWO GAPS THIS CLOSES, WHICH ARE THE SAME SHAPE ─────────────────────
 * Gap #6: *"You cannot take a step over by hand and hand it back."* The operating
 * model calls the 40-point spread between the ~60% of work people use AI for and
 * the 0-20% they fully delegate **exactly this**, and says it is what we sell into.
 * Gap #12: when somebody else's builder made the change, nothing brings the
 * outcome back.
 *
 * Both are one person supplying what a station could not produce. So one function.
 *
 * ── THE RULE THAT MATTERS MORE THAN THE FEATURE ────────────────────────────
 * **A handback must never write `deployments.status = 'success'`.**
 *
 * `release.publish` requires exactly such a row, and R-27 gates the production
 * deploy on **proof rather than a click**. A pasted URL is a person's claim; it
 * proves nothing merged, deployed or passed a check. Writing `success` from one
 * would MANUFACTURE the evidence R-27 exists to demand — the single most
 * expensive thing this function could do, and it would look like a feature.
 *
 * So it writes `status: 'claimed'`, which cannot satisfy `release.publish`. **That
 * is the design, not a limitation.** F-36's missing member row gets written; the
 * proof does not.
 *
 * ── AND IT COSTS THE TRACK ITS UNATTENDED CLAIM, ON PURPOSE ────────────────
 * `recordTrackDrive(..., via: "press")` runs FIRST, before anything else can
 * fail. R-18 forbids counting a run a person touched as unattended, and this is
 * a person touching it. F-79 caught a false acceptance that survived because a
 * human act left no trace; this one leaves the trace before it does the work.
 */
export const submitStationByHand = createServerFn({ method: "POST" })
  .inputValidator((d: { trackId: string; url: string }) =>
    z.object({ trackId: z.string().uuid(), url: z.string().min(1) }).parse(d),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }): Promise<{ ok: boolean; line: string }> => {
    const { supabase, userId } = context;

    const paste = readPasteBack(data.url);
    if (!paste.ok) return { ok: false, line: paste.reason };

    const { data: row } = await supabase
      .from("spine_tracks" as never)
      .select(SELECT)
      .eq("id", data.trackId)
      .maybeSingle();
    if (!row) return { ok: false, line: "That work could not be found." };
    const raw = row as unknown as TrackRow;

    if (raw.status !== "open") {
      return { ok: false, line: "This work is closed, so there is no station to hand back to." };
    }

    /*
     * THE TRACE FIRST. If the writes below fail, the record still says a person
     * reached in — which is the safe direction to be wrong in. The reverse order
     * could leave a track that was touched and does not say so.
     */
    await recordTrackDrive(supabase, {
      trackId: raw.id,
      station: raw.station as AgentStation,
      via: "press",
      entryHold: (raw.last_hold ?? null) as HoldReason | null,
    });

    const station = raw.station as AgentStation;
    if (station !== "build" && station !== "ship") {
      // Honest refusal rather than a note filed nowhere. The other five stations
      // produce artifacts a link cannot stand in for, and pretending otherwise
      // would put an empty row where a spec or a decision should be.
      return {
        ok: false,
        line: `A pasted link can stand in for Build or Ship. ${station} produces something a link cannot, so hand that station its own work instead.`,
      };
    }

    if (station === "ship") {
      const { data: dep, error } = await supabase
        .from("deployments" as never)
        .insert({
          user_id: userId,
          workspace_id: raw.workspace_id,
          deploy_url: paste.value.url,
          // NOT 'success'. See the header: 'success' is what release.publish
          // demands as proof, and a claim is not proof.
          status: "claimed",
          triggered_by: "handback",
        } as never)
        .select("id")
        .single();
      if (error || !dep) {
        return { ok: false, line: "That did not save. Nothing was recorded against the work." };
      }
      /*
       * ONLY THE FIVE COLUMNS THIS TABLE HAS. `spine_track_members` is
       * `track_id, artifact_kind, artifact_id, station, created_at` — no
       * `workspace_id`, no `user_id`. My first version passed both, and `as never`
       * hid it from the typechecker exactly as F-76's phantom columns did.
       * The error is READ, not discarded: a member row that fails to write leaves
       * the artifact orphaned and the station still looking empty, which is the
       * silent half of the same defect.
       */
      const { error: memberErr } = await supabase.from("spine_track_members" as never).insert({
        track_id: raw.id,
        station,
        artifact_kind: "deployment",
        artifact_id: (dep as { id: string }).id,
      } as never);
      if (memberErr) {
        return {
          ok: false,
          line: "The deploy was recorded but could not be attached to this work. Nothing has moved.",
        };
      }
    } else {
      const { data: cs, error } = await supabase
        .from("studio_changesets" as never)
        .insert({
          user_id: userId,
          workspace_id: raw.workspace_id,
          repo: paste.value.target,
          pr_url: paste.value.url,
          // `pr_open`, never `merged`. We were told a PR exists; nobody checked
          // whether it landed, and `merged` is what promotion reads.
          status: "pr_open",
          title: "Handed back by a person",
        } as never)
        .select("id")
        .single();
      if (error || !cs) {
        return { ok: false, line: "That did not save. Nothing was recorded against the work." };
      }
      // Same five columns, same reason. See the note above.
      const { error: memberErr } = await supabase.from("spine_track_members" as never).insert({
        track_id: raw.id,
        station,
        artifact_kind: "changeset",
        artifact_id: (cs as { id: string }).id,
      } as never);
      if (memberErr) {
        return {
          ok: false,
          line: "The pull request was recorded but could not be attached to this work. Nothing has moved.",
        };
      }
    }

    // Released so the sweep picks it up again, the same clearing `retryStation`
    // does. The press above is what keeps the record honest about why it moved.
    const now = new Date().toISOString();
    // Same reset, same reason as `retryStation` above: a handback is a person
    // acting, and without `station_drives` the release is a no-op on any track
    // that has already reached the F-43 ceiling.
    await supabase
      .from("spine_tracks" as never)
      .update({
        attempts: 0,
        station_drives: 0,
        last_hold: null,
        last_hold_because: null,
        driven_at: now,
        updated_at: now,
      } as never)
      .eq("id", raw.id);

    return { ok: true, line: pasteBackLine(paste.value) };
  });

/**
 * UNDO A STEP, NOT THE RUN (gap #5, S1's request of 2026-08-26).
 *
 * ── WHAT THIS IS FOR ───────────────────────────────────────────────────────
 * `retryStation` only clears a hold on the station the track is ALREADY on.
 * There was no way to re-run a station that PASSED, which is what "undo a step"
 * means when Plan wrote a wrong spec and Build has already consumed it.
 *
 * ── THE ONE THING IT MUST NOT DO ───────────────────────────────────────────
 * Delete the work it is undoing. The obvious implementation removes the
 * artifacts so the station looks fresh, and that is exactly wrong here: the
 * record of what happened is the product, and a history edited to look tidy
 * cannot support a verdict measured against a forecast. **Supersession is a
 * stamp.** The row stays, the artifact stays, `superseded_at` says when it was
 * undone, and every read that gates progression asks for what is standing.
 *
 * ── AND IT COSTS THE TRACK ITS CLAIM ───────────────────────────────────────
 * A rewind is a person reaching into a run, so the press is recorded BEFORE
 * anything else can fail — R-18, and F-79's false acceptance, which survived
 * precisely because a human act left no trace. If the writes below fail, the
 * record still says somebody reached in, which is the safe direction.
 *
 * The drive ceiling is cleared for the same reason `retryStation` clears it
 * (F-99): arriving at a station the track has already burned twelve drives on
 * would re-hold `going-in-circles` on the next tick, and the undo would be a
 * button whose visible effect is real and whose actual effect is nothing.
 */
export const rewindTrackTo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string; station: AgentStation }) =>
    z
      .object({
        trackId: z.string().uuid(),
        station: z.enum(AGENT_STATION_ORDER as unknown as [string, ...string[]]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ track: Track | null; refused: string | null }> => {
    const { supabase } = context;
    try {
      const { data: row } = await supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("id", data.trackId)
        .maybeSingle();
      if (!row) return { track: null, refused: "That work could not be found." };

      const raw = row as unknown as TrackRow;
      const track = rowToTrack(raw);
      const target = data.station as AgentStation;
      const current = raw.station as AgentStation;

      const targetIdx = AGENT_STATION_ORDER.indexOf(target);
      const currentIdx = AGENT_STATION_ORDER.indexOf(current);

      /*
       * FORWARD IS NOT AN UNDO. Sending a track to a station it has not reached
       * would skip the stations between, and every one of them is a precondition
       * for what follows -- the forecast is written at Decide and nowhere else,
       * so a track moved forward past it can never show the one thing the
       * product claims. Refused rather than clamped: a clamp would do something
       * other than what was asked without saying so.
       */
      if (targetIdx < 0 || currentIdx < 0) {
        return { track, refused: "That is not a station on this route." };
      }
      if (targetIdx >= currentIdx) {
        return {
          track,
          refused:
            target === current
              ? "This work is already at that step. Use release if it is stuck."
              : "That step is ahead of this work, and undo only goes back.",
        };
      }

      const path = Array.isArray(raw.path) ? (raw.path as unknown as string[]) : [];
      if (path.length > 0 && !path.includes(target)) {
        return {
          track,
          refused: "That step is not on this route, so there is nothing to go back to.",
        };
      }

      // THE PRESS GOES FIRST. See the header: a failed write below must not be
      // able to leave a rewind that nothing recorded.
      await recordTrackDrive(supabase, {
        trackId: raw.id,
        station: current,
        via: "press",
        entryHold: (raw.last_hold ?? null) as HoldReason | null,
      });

      /*
       * Superseded: the target station's own output AND everything after it,
       * because re-walking from Design means Design's prototype is being
       * redone and the mission Build raised from it no longer describes the
       * work. Stations BEFORE the target are untouched and still stand.
       *
       * Already-superseded rows are left alone so a second rewind does not
       * rewrite the first one's timestamp and lose when the work was undone.
       */
      const undone = AGENT_STATION_ORDER.slice(targetIdx);
      const { error: supErr } = await supabase
        .from("spine_track_members" as never)
        .update({ superseded_at: new Date().toISOString() } as never)
        .eq("track_id", raw.id)
        .in("station", undone as unknown as string[])
        .is("superseded_at", null);
      if (supErr) {
        return {
          track,
          refused:
            "The earlier work could not be marked as undone, so nothing was moved. Nothing has changed.",
        };
      }

      const now = new Date().toISOString();
      const { data: updated, error } = await supabase
        .from("spine_tracks" as never)
        .update({
          station: target,
          attempts: 0,
          // F-99: a station the track has already burned its drives on would
          // re-hold `going-in-circles` on the very next tick.
          station_drives: 0,
          last_hold: null,
          last_hold_because: null,
          driven_at: now,
          updated_at: now,
        } as never)
        .eq("id", raw.id)
        .select(SELECT)
        .single();
      if (error || !updated) {
        return {
          track,
          refused: "The earlier work was marked as undone but the step did not move. Try again.",
        };
      }

      // from !== to here, so unlike the `retryStation` call this one actually
      // inserts. See F-62: that guard silently dropped every same-station event.
      await recordStageEvent(supabase, {
        entityType: "spine_track",
        entityId: raw.id,
        from: current,
        to: target,
        actor: "person",
        drivenVia: "press",
      });

      return { track: rowToTrack(updated as unknown as TrackRow), refused: null };
    } catch {
      return { track: null, refused: "That work could not be moved back." };
    }
  });

/**
 * IS WHAT YOU JUST PROMISED CHECKABLE? ASKED AT THE MOMENT OF THE PROMISE.
 *
 * `metric-probe.server.ts` has answered this since the day it shipped and
 * NOTHING HAS EVER ASKED IT. Repo-wide, its only importer was its own test, so
 * the module ranked first in `SPEC-BUILD-PATHS` §2 was dead code.
 *
 * ── WHY THIS IS THE FIRST OF THE FIVE RUNNABLES ────────────────────────────
 * Without it the verdict can never land, and the failure is silent and late: a
 * forecast is captured, the horizon arrives weeks later, and only THEN does
 * anyone discover the observable was never readable. There is no verdict to
 * measure against the forecast, which is the one thing the product claims. The
 * probe answers at the moment of the call, which is the only moment it is cheap.
 *
 * ── IT TAKES THE WORDS, NOT AN ID, AND THAT IS THE POINT ───────────────────
 * `howWeWillKnow` is the forecast's own sentence, so this is askable at Decide
 * **before the row exists**. Narrowing it to a `decisionId` would move the
 * answer to after the promise was written, which is exactly the timing that
 * makes it useless.
 *
 * A pure passthrough. `because` is returned verbatim, because it already names
 * the next action where there is one, and a second copy of that sentence on a
 * surface is how one message comes to disagree with itself.
 */
export const checkForecastObservable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { howWeWillKnow: string; workspaceId: string }) =>
    z.object({ howWeWillKnow: z.string().max(500), workspaceId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ checkable: boolean; because: string }> =>
    isForecastCheckable(context.supabase, data.howWeWillKnow, data.workspaceId),
  );

/**
 * WORK THAT IS PARKED, AND THE PRODUCT HAS NEVER SAID SO.
 *
 * ── THE MEASUREMENT THAT FORCED THIS ───────────────────────────────────────
 * S4, 2026-08-27: **eight of the nine real open tracks are held on a reason the
 * sweep will never revisit.** `track-tick` excludes `TERMINAL_HOLDS` from
 * selection, and `decideDrive` refuses them again, so those eight have not been
 * driven since 2026-08-25 while live tracks were driven seconds before the
 * measurement. One human press each is the only exit that exists.
 *
 * **Nothing on any surface says they are waiting.** They sit at `status = open`,
 * so every open-work count in the product includes eight pieces of work that
 * cannot move, and a person reading "nine open" is told nine things are in
 * flight when one is.
 *
 * ── WHY THIS, AND NOT A BULK RELEASE OR AN ABANDON ─────────────────────────
 * A bulk release spends a full crew on each of eight tracks that have already
 * failed three or more attempts apiece, one of them across 316 drives, with
 * **no new information since the last failure**. That is the "spending to learn
 * nothing" the correction budget exists to prevent, and it would be spending a
 * person's money to find out what the record already says.
 *
 * Abandoning them closes real filed work to make a count look tidy, which makes
 * the number right by deleting the problem it measures.
 *
 * The defect is the SILENCE. So this says the true thing, and leaves the choice
 * where it belongs: with the person, one track at a time, each with the reason
 * it stopped and the one action that clears it.
 *
 * Reader only. It moves nothing, and deliberately: a surface that reports parked
 * work must not also be the thing that unparks it without being asked.
 */
/** Appends the specific refusal to a generic hold line, when the record has one. */
function withRefusal(line: string, refusal: { tool: string; error: string } | null): string {
  return refusal ? `${line} It was ${refusal.tool}, which said: ${refusal.error}` : line;
}

/**
 * The newest failed tool call per track, for the tracks that need one.
 *
 * One query for the whole page rather than one per row: a board with twelve
 * parked items must not make twelve round trips to explain them.
 *
 * A failed read returns an empty map, so every line falls back to the generic
 * sentence. Losing the detail is a worse board; inventing it would be a lie.
 */
async function refusalsFor(
  supabase: SupabaseClient,
  trackIds: string[],
): Promise<Map<string, { tool: string; error: string }>> {
  const out = new Map<string, { tool: string; error: string }>();
  if (!trackIds.length) return out;
  try {
    const { data: runs } = await supabase
      .from("agent_runs")
      .select("track_id,trace_id")
      .in("track_id", trackIds)
      .not("trace_id", "is", null);
    const traceToTrack = new Map<string, string>();
    for (const r of (runs ?? []) as Array<{ track_id?: string; trace_id?: string }>) {
      if (r.trace_id && r.track_id) traceToTrack.set(r.trace_id, r.track_id);
    }
    if (traceToTrack.size === 0) return out;

    const { data: calls } = await supabase
      .from("tool_calls")
      .select("trace_id,tool_name,error,created_at")
      .in("trace_id", [...traceToTrack.keys()])
      .eq("ok", false)
      .order("created_at", { ascending: false });
    for (const c of (calls ?? []) as Array<{
      trace_id?: string;
      tool_name?: string;
      error?: string | null;
    }>) {
      const track = c.trace_id ? traceToTrack.get(c.trace_id) : undefined;
      const err = (c.error ?? "").trim();
      // Newest first, so the first one seen per track is the one to keep.
      if (track && err && !out.has(track)) {
        out.set(track, { tool: c.tool_name ?? "a tool", error: err.slice(0, 200) });
      }
    }
  } catch {
    return out;
  }
  return out;
}

export const getParkedWork = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) =>
    z.object({ workspaceId: z.string().uuid() }).parse(d),
  )
  .handler(
    async ({
      context,
      data,
    }): Promise<
      | {
          ok: true;
          parked: Array<{
            trackId: string;
            title: string;
            station: string;
            hold: string;
            line: string;
            stoppedAt: string | null;
            drives: number;
          }>;
          openTotal: number;
        }
      | { ok: false; because: string }
    > => {
      const { supabase } = context;
      const { data: rows, error } = await supabase
        .from("spine_tracks" as never)
        .select("id,title,station,last_hold,driven_at,station_drives")
        .eq("workspace_id", data.workspaceId)
        .eq("status", "open");

      /*
       * A FAILED READ IS NOT AN EMPTY BOARD, AND NOT A SENTINEL EITHER.
       *
       * F-76 in one line: returning an empty list here would tell a person
       * nothing is stuck at the exact moment the product cannot see, and a zero
       * total would make that silence look like good news.
       *
       * The first version answered with a negative total, which is the same defect
       * one layer up from the one this function exists to fix: `parked: []`
       * would tell a person nothing is stuck at the exact moment the product
       * cannot see, and `-1` is a number that eventually reaches a screen and
       * reads as "-1 open".
       *
       * A caller cannot forget to check `ok`. It can very easily forget that a
       * negative total means "do not believe this". Fixed before the function
       * had its first caller, which is the only cheap moment to fix it.
       */
      if (error || !rows) {
        return {
          ok: false,
          because: "The work list could not be read, so this is not a count of nothing.",
        };
      }

      const open = rows as unknown as Array<{
        id: string;
        title: string | null;
        station: string;
        last_hold: string | null;
        driven_at: string | null;
        station_drives: number | null;
      }>;

      const terminal = new Set<string>(TERMINAL_HOLDS as readonly string[]);

      /*
       * THE SPECIFIC REASON, NOT ONLY THE GENERIC ONE.
       *
       * `HOLD_LINE["tools-refused"]` says "this station could not use a tool it
       * needs". True, and it does not tell a person WHICH tool or WHY, so the
       * one sentence they need to act on is missing from the one place they go
       * to read it.
       *
       * The driver already composes the specific sentence at drive time and
       * then DISCARDS it: the hold is stored, the reason is not. So it is
       * re-derived here from the record, the same choice `selfCheckBack` makes,
       * for the same reason: no model call, and it cannot go stale.
       *
       * Measured 2026-08-27: the only tools-refused track in the product is
       * held on a GitHub 401, and a person reading the board is told a tool
       * failed without being told it is a credential they can rotate in one
       * step (F-106).
       */
      const refusals = await refusalsFor(
        supabase,
        open.filter((t) => t.last_hold === "tools-refused").map((t) => t.id),
      );
      const parked = open
        .filter((t) => t.last_hold && terminal.has(t.last_hold))
        .map((t) => ({
          trackId: t.id,
          title: t.title ?? "Untitled work",
          station: t.station,
          hold: t.last_hold!,
          // The product's own sentence for this hold, not a new one invented
          // here. Two wordings for one state is how a surface starts disagreeing
          // with the record it reads from.
          line: withRefusal(
            holdLine(t.last_hold as HoldReason, { station: t.station as AgentStation }) ??
              HOLD_LINE[t.last_hold as HoldReason],
            refusals.get(t.id) ?? null,
          ),
          stoppedAt: t.driven_at,
          drives: t.station_drives ?? 0,
        }))
        // Longest-parked first: the one that has been waiting since Monday is
        // the one a person most needs to see, and it is the one a newest-first
        // list buries.
        .sort((x, y) => (x.stoppedAt ?? "").localeCompare(y.stoppedAt ?? ""));

      return { ok: true, parked, openTotal: open.length };
    },
  );

/**
 * ── WHAT THE AGENTS ON THIS TRACK ACTUALLY DID, CALL BY CALL ──────────────
 *
 * THE REQUIREMENT THIS ANSWERS, in the founder's words: *"Being truly agentic
 * is not only about the agent doing the work. It is about the user seeing it
 * happen ... what it is doing right now, what it just finished, what it is
 * about to do."*
 *
 * ── THE JOIN, AND WHY IT COULD NOT BE MADE UNTIL A WEEK AGO ───────────────
 * `tool_calls` is the record of every tool an agent invoked -- name, whether it
 * worked, how long it took. `agent_runs` is the record of a seat's turn at a
 * station. The only key they share is `trace_id`, and `agent_runs` HAD NO SUCH
 * COLUMN: `driver.server.ts` still carries the comment saying the ids "are
 * carried down from each `runAgentLoop` result rather than looked up", because
 * looking them up was impossible. The link between a run and what it did
 * existed only in memory, for the life of that run (F-93).
 *
 * The column landed 2026-08-26. Measured against production 2026-09-01:
 *
 *   tool_calls              2,714 rows, 2,713 carrying a trace_id
 *   agent_runs since 08-31  108 of 108 carrying one -- 100%
 *   agent_runs before that  0% (the column did not exist; old rows stay NULL
 *                           on purpose, because a backfilled default would
 *                           fabricate a correlation nobody can check)
 *
 * So this read is complete for every run from 2026-08-31 onward and empty for
 * everything older. That is not a bug and the surface must not present it as
 * one: this returns the COVERAGE -- how many of the track's runs carry a trace
 * id at all -- so the UI can say "this run predates the record" rather than
 * "it called nothing", which are opposite claims about the same empty list.
 *
 * ── COVERAGE IS A FRACTION, AND IT USED TO BE A BOOLEAN ───────────────────
 * `traced: boolean` was true the moment ONE run on the track carried a trace
 * id. A track that started before 2026-08-31 and has been driven since is the
 * common shape of that: 25 runs the record cannot see and one it can, reported
 * as a fully traced run, so five tool calls were presented as the whole record
 * of a 26-turn walk. `tracedRuns` against `runs` is the honest pair, and the
 * surface says which fraction of the walk it is actually showing.
 *
 * ── A FAILED READ IS NOT AN EMPTY ONE, AND IT USED TO BE ──────────────────
 * Both errors and the outer catch returned `{ calls: [], traced: false, runs:
 * 0 }`, which `LiveWork` renders as "No agent has taken a turn on this work
 * yet." So a dropped connection made the product assert the agents had done
 * nothing, on the one surface whose whole claim is that you can watch them.
 * These throw now: react-query sets `isError` and the pane says the read
 * failed and that the run itself is untouched.
 *
 * ── WHY THE TRACK'S OWN RUNS RATHER THAN THE WORKSPACE'S ──────────────────
 * A workspace filter was used twice as a stand-in for this join while it did
 * not exist, and both times returned a DIFFERENT track's crew -- once almost
 * publishing the finding "the release agent makes zero tool calls", when it
 * makes seven. The trace ids come from THIS track's runs and nothing else.
 */
export type TrackToolCall = {
  id: string;
  tool: string;
  ok: boolean;
  latencyMs: number;
  at: string;
  error: string | null;
};

export const getTrackToolCalls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(
    async ({
      context,
      data,
    }): Promise<{ calls: TrackToolCall[]; runs: number; tracedRuns: number }> => {
      const { supabase } = context;
      /*
       * RLS DOES THE TENANCY, which is why this reads through the caller's
       * own client and never the admin one. A tool call is the most
       * revealing row this product holds -- it names what another company's
       * agents looked at -- so the one place it must not be reachable from
       * is a query that forgot a workspace filter.
       */
      const { data: runRows, error: runErr } = await supabase
        .from("agent_runs")
        .select("trace_id")
        .eq("track_id", data.trackId);
      // Thrown, not swallowed: an empty list means the agents called nothing,
      // and this is the case where nobody could look.
      if (runErr) throw new Error(`The turns on this run could not be read: ${runErr.message}`);

      const rows = (runRows ?? []) as Array<{ trace_id: string | null }>;
      const tracedRuns = rows.filter((r) => !!r.trace_id).length;
      const traceIds = [...new Set(rows.map((r) => r.trace_id).filter((t): t is string => !!t))];

      /*
       * NO TRACE IDS IS NOT NO CALLS. A track whose runs all predate the
       * column joins to nothing, and reporting that as an empty tool list
       * would tell a person their agents did nothing when the truth is that
       * nobody wrote down what they did. `tracedRuns: 0` is the honest answer
       * and the surface renders a different sentence for it.
       */
      if (traceIds.length === 0) return { calls: [], runs: rows.length, tracedRuns };

      const { data: callRows, error: callErr } = await supabase
        .from("tool_calls")
        .select("id, tool_name, ok, latency_ms, created_at, error")
        .in("trace_id", traceIds)
        /* Newest first for the cap, reversed below: ToolStream takes arrival
           order, oldest first, and follows the tail. Ordering ascending here
           and capping would return the FIRST 200 calls of a long run, which
           is the opposite of what someone watching wants. */
        .order("created_at", { ascending: false })
        .limit(200);
      if (callErr) throw new Error(`What the agents called could not be read: ${callErr.message}`);

      const calls = (
        (callRows ?? []) as Array<{
          id: string;
          tool_name: string;
          ok: boolean;
          latency_ms: number;
          created_at: string;
          error: string | null;
        }>
      )
        .map((c) => ({
          id: c.id,
          tool: c.tool_name,
          ok: c.ok,
          latencyMs: c.latency_ms,
          at: c.created_at,
          error: c.error,
        }))
        .reverse();

      return { calls, runs: rows.length, tracedRuns };
    },
  );
