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
import { AGENT_STATION_ORDER, AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import {
  CLAIMED_PATH_HOLD,
  pathFromWaitingSentence,
} from "@/lib/spine/a-claimed-path-is-a-wait-not-an-unstage";
import { playbookFilesForTrack, type PlaybookFiles } from "@/lib/spine/playbook-files.server";
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
import {
  EMPTY_RESULT,
  runStateWord,
  searchWords,
  searchDoors,
  type FindAnythingResult,
  type FoundArtifact,
  type FoundPerson,
  type SearchKind,
} from "@/lib/spine/find-anything";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";
import { appendServerTiming } from "@/lib/server-timing.server";
import { claimApprovalDecision, executeApproval } from "@/lib/ai/loop.server";
import { recordGateSignalCore } from "@/lib/gate-signals.functions";
import { expiryDefaultFor } from "@/lib/ai/approval-expiry";
import { MAX_BULK_DECISIONS } from "@/lib/approvals-queue.functions";
import { recordStageEvent } from "@/lib/stage-events.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TERMINAL_HOLDS } from "./correction";
import { HOLD_LINE } from "./driver";
import {
  countLines,
  type ChangedFile,
  type MergeGateEvidence,
  type ReleaseEvidence,
} from "@/lib/spine/what-the-merge-gate-shows";
import { parseDesignCriticReview } from "@/lib/ai/design-critic";
import { findingIsAgainstThePremise } from "@/lib/spine/a-design-verdict-against-the-premise-holds";
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
  /**
   * The product this run belongs to, when the composer set one
   * (`_authenticated.start.tsx`'s `productId: activeProductId`). Null for a
   * run started before a product was chosen, or from a path that never sets
   * one (a promoted theme carries `project_id` instead, a distinct column --
   * see `listProductRepos`'s own comment on why there is no single column).
   *
   * P-44 (A-QUEUE.md): this is what lets a door leaving the run land on the
   * binding surface already pointed at THIS run's product, rather than at
   * whatever the workspace switcher happens to be on.
   */
  productId: string | null;
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
  product_id?: string | null;
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
    productId: r.product_id ?? null,
  };
}

const SELECT =
  "id,user_id,workspace_id,title,origin,entry_station,station,status,path,waived,updated_at,last_hold,last_hold_because,driven_at,attempts,product_id," +
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

/**
 * File the person's own call as what Decide produced.
 *
 * Without this the decision exists in `decisions` and the track's record shows
 * Decide filing nothing -- so the map says the station did nothing, and
 * `STATION_NEEDS` has no artifact to hand Define. The row IS Decide's output;
 * the only unusual thing about it is who wrote it.
 *
 * Best-effort, on the same contract as `attachOriginTheme` above: losing the
 * index row is recoverable, refusing a person's recorded answer because the
 * index write failed is not.
 */
async function attachPersonsDecision(
  supabase: SupabaseClient,
  trackId: string,
  decisionId: string,
): Promise<void> {
  try {
    const { error } = await supabase.from("spine_track_members" as never).upsert(
      {
        track_id: trackId,
        artifact_kind: "decision",
        artifact_id: decisionId,
        station: "decide",
      } as never,
      { onConflict: "track_id,artifact_kind,artifact_id" },
    );
    if (error) {
      console.error(
        `[spine] track ${trackId} recorded the person's call ${decisionId} but did not file it: ${error.message}`,
      );
    }
  } catch (e) {
    console.error(
      `[spine] filing the person's call for track ${trackId} threw: ${e instanceof Error ? e.message : String(e)}`,
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
 *
 * P-65: AN OWNER WITHOUT A MEMBER ROW IS STILL THE OWNER. Live 00:35 IST
 * 09-04: a workspace whose owner had no `workspace_members` row (created
 * by SQL, per `arrival-2026-09.md`'s own record of how the probe workspace
 * came to exist) hit the membership-only check below, and the refusal
 * THROWN was "Forbidden: not a member of this workspace" -- machine copy
 * by `error-copy.ts`'s own `MACHINE` list ("forbidden" is on it), so
 * `messageForPerson` dropped it and Start read "Nothing was started ...
 * nothing was filed" with no reason at all. Migration `20260909030000`
 * (P-39) already lets an owner manage their workspace at the RLS layer
 * without a member row ("ws owner manages own regardless of membership");
 * this was the one place that guarantee stopped short of. `spine_tracks`'s
 * own write policy is `auth.uid() = user_id` (checked against the live
 * schema), not workspace membership at all, so once this gate admits the
 * owner the actual insert needs nothing further.
 *
 * A DISCRIMINATED RETURN, NOT A THROW, per this packet's own rule: a
 * refusal is a fact this surface already knows how to say
 * (`problems`, rendered by `Receipt`); a thrown error is reserved for the
 * session ending and the server failing, which this is neither of.
 */
async function resolveStartWorkspace(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  explicit: string | null | undefined,
): Promise<{ ok: true; workspaceId: string | null } | { ok: false; problem: string }> {
  if (!explicit) return { ok: true, workspaceId: null };
  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", explicit)
    .limit(1)
    .maybeSingle();
  if (member) return { ok: true, workspaceId: explicit };

  const { data: owned } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", explicit)
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  if (owned) return { ok: true, workspaceId: explicit };

  return {
    ok: false,
    problem: "You are not a member of this workspace; ask its owner to add you.",
  };
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
    const resolved = await resolveStartWorkspace(
      context.supabase,
      context.userId,
      data.workspaceId ?? null,
    );
    if (!resolved.ok) return { track: null, problems: [resolved.problem] };
    return startTrackCore(context.supabase, context.userId, {
      title: data.title,
      shape: data.shape as WorkShape,
      origin: data.origin,
      productId: data.productId ?? null,
      projectId: data.projectId ?? null,
      workspaceId: resolved.workspaceId,
    });
  });

/** Open tracks, most recently touched first. Empty, never thrown, pre-migration. */
/** The three shell reads share one input shape, so a fourth cannot invent its
 *  own name for the same field. Optional: the resolver falls back to the
 *  person's default workspace, and an unresolved one stays unfiltered. */
const ShellScope = z.object({ workspaceId: z.string().uuid().nullable().optional() });

/*
 * ── THE SHELL READS THE WORKSPACE IT IS STANDING IN (P-66) ────────────────
 *
 * Read live 00:37 IST 2026-09-04 in an EMPTY probe workspace: the header said
 * "1 decision is ready for you - What we expected did not happen: Decline
 * shipping ...". Both facts belonged to Helio Labs. These three reads filtered
 * `status = open` and named no workspace, so the shell showed every open track
 * the person could see anywhere, under the name of the one they were in.
 *
 * Since migration 20260907010000 a person can hold two workspaces, which is
 * what turned a latent defect into a visible one. P-60's rail badge would have
 * inherited it.
 *
 * SAME DEFECT AS `listRunsForStart`, `listTopOpportunities` and the Discover
 * source count, in a fourth place. RLS answers "may they see this"; it has
 * never answered "whose desk is this".
 *
 * UNRESOLVED STAYS UNFILTERED, the same rule those three settled on: a caller
 * whose workspace cannot be resolved gets what it always got, because narrowing
 * to a workspace we cannot name would turn a failed lookup into "nothing is
 * running", and that is a claim.
 */
export const listTracks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ShellScope.parse(i ?? {}))
  .handler(async ({ context, data }): Promise<Track[]> => {
    const { supabase } = context;
    const workspaceId = await resolveStartWorkspaceId(supabase, data?.workspaceId ?? null);
    try {
      let q = supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("status", "open");
      if (workspaceId) q = q.eq("workspace_id", workspaceId);
      const { data, error } = await q.order("updated_at", { ascending: false }).limit(50);
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

/*
 * TIMED, NOT GUESSED (P-32, A-QUEUE.md, second pass). A1's live measurement
 * found `listRunsForStart` the 2.7-second outlier among seven readers
 * answering in 465-612ms apiece, and asked for it to be named on the server
 * rather than inferred again from the client. `withStartReaderTiming` wraps
 * all three `/start`-adjacent readers below (this one, `listGatesOnTracks`,
 * `listRunsForStart`), so the NEXT measurement reads the answer off the
 * server log instead of guessing from the Performance API which of several
 * concurrent calls was the slow one -- and, if the fix above did not fully
 * close the gap, names whichever one still is.
 *
 * A WRAPPER, NOT A CALL INSIDE EACH HANDLER, ON PURPOSE.
 * `the-bar-counts-gates-on-open-tracks.test.ts` pins `listGatesOnTracks`'s own
 * body against `Date.now()` verbatim -- P-18a's own lesson, that a QUERY-LEVEL
 * time window is how "89 missions waiting" once read as "quiet". Timing this
 * function's WALL CLOCK is a different fact from filtering its ROWS by time,
 * but a literal string scan cannot tell the two apart, so the clock reads
 * stay out of the scanned body entirely: this wraps the handler from the
 * OUTSIDE instead of calling `Date.now()` from inside it.
 */
function withStartReaderTiming<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const started = timeSourceMs();
  return fn().finally(() => {
    const ms = timeSourceMs() - started;
    console.log(`[perf] ${name}: ${ms}ms`);
    // P-58b: the same number, also on a header a person can `curl -sI` for
    // instead of needing `wrangler tail` to read the Worker's own log.
    appendServerTiming(name, ms);
  });
}
/** Isolated so `Date.now()` appears exactly once, never inside a reader body. */
function timeSourceMs(): number {
  return Date.now();
}

export type MovingTrack = { id: string; station: AgentStation };

/**
 * P-18 (A-QUEUE.md). Which open tracks have a SEAT LITERALLY IN FLIGHT right
 * now, for the shell top bar's "N runs are moving".
 *
 * THE DEFECT THIS REPLACES. The shell used to call this "moving" when
 * `spine_tracks.driven_at` fell inside the last five minutes -- a proxy for
 * recent activity, not a claim that anything is running THIS INSTANT. A track
 * the driver touched and then handed back (a dispatch that finished in under a
 * second, a tick that held it) reads exactly like one an agent is mid-way
 * through, so the header could say "3 runs are moving" over zero live seats --
 * this packet's own reproduction. `listRunsForStart` already answers the
 * precise question correctly (`workingByTrack`, `agent_runs.status IN
 * ('running','queued','in_progress')` joined by `track_id`, never inferred
 * from elapsed time -- its own header states the same refusal `activity.ts`
 * makes). This is that same query, factored out rather than duplicated a
 * second time with its own chance to drift, and kept separate from
 * `listRunsForStart` itself so the shell's poll does not also pay for gates,
 * pins and produced-counts it never reads.
 */
export const listMovingTracks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ShellScope.parse(i ?? {}))
  .handler(({ context, data }): Promise<MovingTrack[]> =>
    withStartReaderTiming("listMovingTracks", async () => {
      const { supabase } = context;
      // P-66. See the note above `listTracks`.
      const workspaceId = await resolveStartWorkspaceId(supabase, data?.workspaceId ?? null);
      try {
        let q = supabase
          .from("spine_tracks" as never)
          .select("id, station")
          .eq("status", "open");
        if (workspaceId) q = q.eq("workspace_id", workspaceId);
        const { data: openRows, error } = await q
          .order("updated_at", { ascending: false })
          .limit(50);
        if (error) failSoftOrThrow(error, "The work in flight");
        const open = (openRows ?? []) as unknown as MovingTrack[];
        if (open.length === 0) return [];

        const { data: runRows } = await supabase
          .from("agent_runs")
          .select("track_id")
          .in(
            "track_id",
            open.map((t) => t.id),
          )
          .in("status", ["running", "queued", "in_progress"]);
        const moving = new Set(
          ((runRows ?? []) as Array<{ track_id: string | null }>)
            .map((r) => r.track_id)
            .filter((id): id is string => Boolean(id)),
        );
        return open.filter((t) => moving.has(t.id));
      } catch (e) {
        if (e instanceof Error && e.message.includes("could not be read")) throw e;
        return [];
      }
    }),
  );

export type ProductGoal = { productId: string; northStar: string };

/**
 * A PRODUCT'S OWN STATED GOAL (P-85, A-QUEUE.md). `projects.north_star` --
 * the physical table backing `Product` in `use-workspace.tsx` is `projects`,
 * that file's own comment records the rename ("represents products") -- is
 * the one place a product says what it is FOR, in its own words, rather than
 * in its name alone. `ExampleJobs`' three static sentences read as a
 * checkout product's homework on a workspace with a payroll product and no
 * arrivals yet; this is what lets Start shape its examples from THIS
 * product's stated goal instead.
 *
 * A small, dedicated read rather than widening `Product`'s own shape in
 * `use-workspace.tsx`: that context is read on every authenticated page,
 * and a goal sentence is wanted by exactly one -- Start, only once a
 * workspace has a product and no arrivals yet.
 */
export const listProductGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string | null } | undefined) =>
    z.object({ workspaceId: z.string().uuid().nullable().optional() }).parse(d ?? {}),
  )
  .handler(({ context, data }): Promise<ProductGoal[]> =>
    withStartReaderTiming("listProductGoals", async () => {
      const { supabase } = context;
      const workspaceId = await resolveStartWorkspaceId(supabase, data?.workspaceId ?? null);
      if (!workspaceId) return [];
      try {
        const { data: rows, error } = await supabase
          .from("projects")
          .select("id,north_star")
          .eq("workspace_id", workspaceId)
          .not("north_star", "is", null);
        if (error) failSoftOrThrow(error, "The products' stated goals");
        return ((rows ?? []) as Array<{ id: string; north_star: string | null }>)
          .filter((r): r is { id: string; north_star: string } => Boolean(r.north_star?.trim()))
          .map((r) => ({ productId: r.id, northStar: r.north_star }));
      } catch (e) {
        if (e instanceof Error && e.message.includes("could not be read")) throw e;
        return [];
      }
    }),
  );

export type ProductRepo = { productId: string; repo: string };

/**
 * WHICH REPOSITORY A PRODUCT ACTUALLY MEANS (P-16b, A-QUEUE.md). There is no
 * standing product-to-repo binding table -- `driver.server.ts`'s own comment
 * on `DriveRow.product_id` records why: a track's product is nullable and
 * `requireGithub` falls back to the workspace's default GitHub connection
 * when it is absent, so "which repo does this product mean" is not a column
 * anywhere, only a pattern in what Build has actually filed against it.
 *
 * So this reads it the same way a person would: the most recent
 * `studio_changesets` row per product, workspace-scoped, `repo` is the
 * `"owner/repo"` string Build itself wrote when it opened that changeset.
 * `created_at DESC` and first-seen-wins is enough -- a product's repo
 * essentially never changes between changesets, and this exists to let a
 * sentence like "the homeowner app" resolve to whichever product's own repo
 * is actually named that, not to audit repo history.
 */
export const listProductRepos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string | null } | undefined) =>
    z.object({ workspaceId: z.string().uuid().nullable().optional() }).parse(d ?? {}),
  )
  .handler(({ context, data }): Promise<ProductRepo[]> =>
    withStartReaderTiming("listProductRepos", async () => {
      const { supabase } = context;
      const workspaceId = await resolveStartWorkspaceId(supabase, data?.workspaceId ?? null);
      if (!workspaceId) return [];
      try {
        const { data: rows, error } = await supabase
          .from("studio_changesets" as never)
          .select("product_id,repo,created_at")
          .eq("workspace_id", workspaceId)
          .not("product_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) failSoftOrThrow(error, "The products' repositories");
        const seen = new Map<string, string>();
        for (const r of (rows ?? []) as Array<{ product_id: string | null; repo: string }>) {
          if (r.product_id && !seen.has(r.product_id)) seen.set(r.product_id, r.repo);
        }
        return [...seen.entries()].map(([productId, repo]) => ({ productId, repo }));
      } catch (e) {
        if (e instanceof Error && e.message.includes("could not be read")) throw e;
        return [];
      }
    }),
  );

export type GatedTrack = { id: string; title: string; updatedAt: string; tool: string };

/**
 * P-18a (A-QUEUE.md). Which open tracks have a boundary call nobody has
 * answered, for the shell top bar's "N decisions are ready for you".
 *
 * THE DEFECT THIS REPLACES. The bar's count came from `getApprovalsQueue`,
 * which federates TEN gate families across the WHOLE WORKSPACE with no
 * regard for whether any of them sits on an open track. Measured live:
 * "65 decisions are ready for you" beside 5 pending approvals (2 on a
 * track), 8 pending decisions, 59 decisions total, 71 backlog bets -- no
 * count in the workspace was 65, and none of the ten federated families is
 * what a bar sitting beside "N runs are moving" actually claims. The only
 * honest count for THIS bar is gates on OPEN TRACKS -- the same rows Start
 * marks "Needs you" (`tracks-feed.ts`'s `kindOf`, `r.needsYou`).
 * `listRunsForStart` already answers this correctly (`gateByTrack`,
 * `pending_gates` on `spine_tracks` resolved against
 * `agent_approvals.status = 'pending'`, a gate attributed only to the track
 * that opened it -- never every pending call a person happens to own). This
 * is that same resolution, factored out rather than duplicated with its own
 * chance to drift, and kept separate from `listRunsForStart` itself for the
 * same reason `listMovingTracks` above is: the shell's poll should not also
 * pay for pins, produced-counts and forecasts it never reads.
 *
 * `title`/`updatedAt` travel with the gate (not just `id`/`tool`) so the
 * bar's preview line can name the actual piece of work waiting, the same
 * pairing Start's own "Needs you" row uses -- never a second, disconnected
 * reader for the sentence beside the count.
 */
export const listGatesOnTracks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ShellScope.parse(i ?? {}))
  .handler(({ context, data }): Promise<GatedTrack[]> =>
    withStartReaderTiming("listGatesOnTracks", async () => {
      const { supabase } = context;
      // P-66. See the note above `listTracks`. This one feeds the rail badge.
      const workspaceId = await resolveStartWorkspaceId(supabase, data?.workspaceId ?? null);
      try {
        let q = supabase
          .from("spine_tracks" as never)
          .select("id, title, updated_at, pending_gates")
          .eq("status", "open");
        if (workspaceId) q = q.eq("workspace_id", workspaceId);
        const { data: openRows, error } = await q
          .order("updated_at", { ascending: false })
          .limit(50);
        if (error) failSoftOrThrow(error, "The calls waiting on you");
        const open = (openRows ?? []) as unknown as Array<{
          id: string;
          title: string;
          updated_at: string;
          pending_gates?: unknown;
        }>;
        if (open.length === 0) return [];

        const gateIds = [
          ...new Set(
            open.flatMap((r) =>
              Array.isArray(r.pending_gates)
                ? r.pending_gates
                    .map((g) => (g as { id?: unknown }).id)
                    .filter((g): g is string => typeof g === "string")
                : [],
            ),
          ),
        ];
        if (gateIds.length === 0) return [];

        const { data: gates } = await supabase
          .from("agent_approvals")
          .select("id, tool_name")
          .in("id", gateIds)
          .eq("status", "pending");
        const byId = new Map(
          ((gates ?? []) as Array<{ id: string; tool_name: string }>).map((g) => [g.id, g]),
        );

        const result: GatedTrack[] = [];
        for (const r of open) {
          if (!Array.isArray(r.pending_gates)) continue;
          for (const g of r.pending_gates) {
            const id = (g as { id?: unknown }).id;
            if (typeof id !== "string") continue;
            const hit = byId.get(id);
            // One gate attributed per track, the same rule `listRunsForStart`'s
            // own `gateByTrack` uses -- a row needs one boundary call marked,
            // not every one it happens to have open.
            if (hit) {
              result.push({
                id: r.id,
                title: r.title,
                updatedAt: r.updated_at,
                tool: hit.tool_name,
              });
              break;
            }
          }
        }
        return result;
      } catch (e) {
        if (e instanceof Error && e.message.includes("could not be read")) throw e;
        return [];
      }
    }),
  );

/**
 * ── WHAT EVERY RUN IS ACTUALLY DOING, FOR THE ROWS ON `/start` (P-05) ─────
 *
 * WHY THIS IS NOT `listTracks`. That one answers "what is open", filters to
 * `status = 'open'`, and feeds the board. Start's rows have to carry finished
 * and abandoned work too -- a person's most recent run is very often the one
 * that just finished, and a list that hides it reads as work disappearing --
 * and each row has to say what the run is DOING, which no column on
 * `spine_tracks` knows. Widening `listTracks` would change what the board reads
 * to serve a different question; this is a second question, so it is a second
 * read.
 *
 * ── THE MIDDLE COLUMN IS THE WHOLE POINT, AND IT COSTS FOUR JOINS ─────────
 * *"Strategist is writing the decision · 0:34"* is four facts from four tables:
 * the seat from `agent_runs`, the verb from the newest `tool_calls` row on its
 * trace, the clock from the run's own `created_at`, and the gate from
 * `agent_approvals`. Every one of them is refused rather than guessed when its
 * row is absent, which is why the type below is nullable almost everywhere: a
 * row that cannot say what a run is doing must say something weaker, not
 * something invented.
 *
 * ── BOUNDED BY CONSTRUCTION ──────────────────────────────────────────────
 * Fifty tracks, and the three follow-up reads are all `in (...)` over that set.
 * The tool-call read is skipped entirely when nothing is running, which is the
 * common case: measured across this database, a workspace has 0 to 3 runs in
 * flight at once and 106 tracks.
 */
export type StartRun = {
  id: string;
  title: string;
  status: "open" | "done" | "abandoned";
  station: AgentStation;
  stationName: string;
  updatedAt: string;
  drivenAt: string | null;
  /** The raw `last_hold`. Never the prose; surfaces branch on this. */
  holdReason: string | null;
  /** The driver's own sentence at the stop, when it wrote one. */
  holdBecause: string | null;
  /** A seat in flight on this track right now, or null. */
  working: { seat: string; since: string; tool: string | null } | null;
  /** A boundary call this track opened and nobody has answered. */
  needsYou: { tool: string } | null;
  /** What it has filed, counted by kind. Empty is a real and common answer. */
  produced: Array<{ kind: string; count: number }>;
  /**
   * The verdict on this run's forecast, once somebody or something has graded
   * it. Null until then, which is the state almost every run is in.
   */
  forecast: { resolution: string; rationale: string | null } | null;
  /**
   * When this track's own work first reached production, or null (P-126,
   * A-QUEUE.md). A track can sit at Learn, still `open`, waiting on a dated
   * forecast for weeks after its release went out -- this is the one fact
   * that scenario's own row was missing: it said only where the track was
   * waiting, never that the thing it built was already live.
   */
  liveSince: string | null;
};

/**
 * The columns a `StartRun` row is actually built from -- NOT `TrackRow`
 * (P-32, A-QUEUE.md). `TrackRow`/`SELECT`/`rowToTrack` build a full `Track`
 * (route, origin, computed hold sentence, entry station, waivers, attempts),
 * because `listTracks` -- the OTHER caller of that trio -- needs the whole
 * thing. `StartRun`'s own closing `.map()` reads none of it: `origin`,
 * `route`, `summary`, `entry`, the computed `hold` line and `attempts` are
 * fetched, built by `rowToTrack`, and thrown away every time. Measured on
 * Helio Labs: the full `SELECT` alone -- before the members embed below --
 * ran 40 KB for 50 tracks, one track's own `origin` field carrying 2,101
 * characters nothing here reads. This is that same "select only the columns
 * the row needs" rule the members embed and `listThemes` were both just
 * given, one level up: a SECOND select, scoped to this reader alone, rather
 * than widening `SELECT` for `listTracks` or narrowing it out from under it.
 */
type StartTrackRow = {
  id: string;
  title: string;
  station: string;
  status: string;
  updated_at: string;
  driven_at: string | null;
  last_hold: string | null;
  last_hold_because?: string | null;
  pending_gates?: unknown;
};

/**
 * The active workspace, or the caller's default when the client did not name
 * one. `current_user_default_workspace()` is the same resolver `startTrack`
 * leans on for its column default, so a read and the write it precedes cannot
 * disagree about which desk they are on.
 */
async function resolveStartWorkspaceId(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  explicit: string | null,
): Promise<string | null> {
  if (explicit) return explicit;
  // P-58b: named separately from the reader's own total, because A1 asked
  // for "the workspace read, the runs read" as two facts and not one -- a
  // returning visitor with a stored workspace id never pays this at all
  // (`explicit` is set, the RPC never fires), so a header that only ever
  // showed the reader's combined total could not tell that visitor's zero
  // apart from a first-time visitor's real round trip.
  const started = performance.now();
  const { data } = await supabase.rpc("current_user_default_workspace");
  appendServerTiming("workspace-read", performance.now() - started);
  return (data as string | null) ?? null;
}

/**
 * -- YOUR RUNS ARE THIS WORKSPACE'S RUNS (P-33, walked on production) -------
 *
 * This read filtered on `status` and nothing else, and leaned on RLS for the
 * rest. RLS scopes to every workspace a person BELONGS TO, which is the right
 * answer to "may they see this" and the wrong answer to "whose desk is this".
 * So Start listed every open run the person could see, from every workspace,
 * under whichever workspace name the switcher happened to be showing.
 *
 * Nobody could hit it, because until 2026-09-03 no account could hold two
 * workspaces at all: `workspaces` had no INSERT policy and every attempt to
 * make a second one was refused (20260907010000, 20260908010000). Fixing that
 * wall is what exposed this: the first workspace ever created on production
 * opened showing another workspace's runs as its own.
 *
 * `workspaceId` is optional and resolves to the caller's default, so the
 * zero-configuration path is unchanged.
 */
export const listRunsForStart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string | null } | undefined) =>
    z.object({ workspaceId: z.string().uuid().nullable().optional() }).parse(d ?? {}),
  )
  .handler(({ context, data }): Promise<StartRun[]> =>
    withStartReaderTiming("listRunsForStart", async () => {
      const { supabase } = context;
      const workspaceId = await resolveStartWorkspaceId(supabase, data?.workspaceId ?? null);
      try {
        /*
         * `spine_track_members` EMBEDDED IN THE BASE READ, KIND ONLY (P-32).
         * `spine_track_members.track_id -> spine_tracks.id` is a real foreign
         * key (checked against the live schema, not assumed), so PostgREST
         * returns each track's own members nested under it in the SAME
         * response -- one fewer round trip than a separate query. `artifact_id`
         * is deliberately NOT embedded here: `producedByTrack` below only ever
         * counts kinds, and on Helio Labs 413 members over 50 tracks meant 413
         * repeated uuids nobody read, the same "select only the columns the
         * row needs" defect A1 caught in `listThemes`. The one place an id IS
         * needed -- resolving each track's decision, for the forecast lookup
         * below -- reads it through its own small, kind-filtered query
         * instead, inside that same concurrent branch. No `superseded_at`
         * filter here, matching what this read has always counted:
         * `producedByTrack` is a straight count of what a station filed, not
         * the "still standing" question `superseded_at` answers for
         * lineage-adjacent reads elsewhere in this file.
         */
        let tracksQuery = supabase
          .from("spine_tracks" as never)
          .select(
            "id,title,station,status,updated_at,driven_at,last_hold,last_hold_because,pending_gates,spine_track_members(artifact_kind)",
          );
        /*
         * ONLY WHEN IT IS KNOWN. A caller whose default workspace cannot be
         * resolved gets what RLS allows, which is what this read did for its
         * whole life -- narrowing to a workspace we could not name would turn
         * an unresolved id into an empty desk, and an empty desk is a claim.
         *
         * `workspace_id` is filtered on without being selected, which is fine
         * and deliberate: this row type is the narrow P-32 one and nothing
         * below reads the column.
         */
        if (workspaceId) tracksQuery = tracksQuery.eq("workspace_id", workspaceId);
        const { data, error } = await tracksQuery
          .order("updated_at", { ascending: false })
          .limit(50);
        if (error) failSoftOrThrow(error, "Your runs");
        const rows = (data ?? []) as unknown as Array<
          StartTrackRow & { spine_track_members?: Array<{ artifact_kind: string }> }
        >;
        if (rows.length === 0) return [];

        const ids = rows.map((r) => r.id);

        /* WHAT EVERY TRACK FILED, read off the embed above -- no round trip of
         its own. Counted by kind, the same unit `GotYou` counts, so the row
         and the run screen cannot disagree about what a run produced. */
        const producedByTrack = new Map<string, Map<string, number>>();
        for (const r of rows) {
          const members = Array.isArray(r.spine_track_members) ? r.spine_track_members : [];
          for (const m of members) {
            const book = producedByTrack.get(r.id) ?? new Map<string, number>();
            book.set(m.artifact_kind, (book.get(m.artifact_kind) ?? 0) + 1);
            producedByTrack.set(r.id, book);
          }
        }

        /*
         * THE GATE THIS TRACK ITSELF OPENED, not every pending row the person
         * owns. `pending_gates` records the calls THIS track's own runs opened,
         * with the station that opened them, which is what makes "needs you"
         * causal rather than correlational -- the same correction the driver's own
         * approval count was given on 2026-08-01, when one unanswered call
         * anywhere froze every track a person owned.
         */
        const gateIds = [
          ...new Set(
            rows.flatMap((r) => {
              const gates = (r as unknown as { pending_gates?: unknown }).pending_gates;
              return Array.isArray(gates)
                ? gates
                    .map((g) => (g as { id?: unknown }).id)
                    .filter((g): g is string => typeof g === "string")
                : [];
            }),
          ),
        ];
        /*
         * FOUR INDEPENDENT READS, CONCURRENT (P-32, A-QUEUE.md). Each block
         * below depends only on `rows`/`ids`/`gateIds` computed above -- none
         * of them reads another block's result -- so what began as seven
         * sequential round trips now takes ONE round trip for the base read
         * (which the `spine_track_members` embed folded a second round trip
         * into) plus the SLOWEST of these four branches, not the sum of all
         * of them.
         *
         * WHY THIS STILL WASN'T ENOUGH, MEASURED, NOT GUESSED A SECOND TIME.
         * A1's live measurement after the first pass: seven readers start
         * together at 1.38s, six answer in 465-612ms, and this one took 2.7s --
         * five times its own siblings, and `EXPLAIN ANALYZE` already ruled out
         * slow SQL (every query here executes in under a millisecond server-
         * side). At roughly 500-600ms of fixed round-trip overhead per call --
         * the SAME cost every other reader pays for exactly ONE round trip --
         * three round trips on this function's own worst-case path (base, then
         * running-seats-then-that-seat's-verb, a genuine two-hop chain with no
         * FK to embed away) does the arithmetic: ~3 x 600-900ms lands right on
         * 2.7s. Folding `spine_track_members` into the base read removes a
         * round trip from EVERY load; it does not by itself shorten the
         * worst-case chain when a seat actually is running, which is the state
         * A1's own live measurement was almost certainly in.
         */
        const [gateByTrack, { workingByTrack, toolByTrace }, pinnedByTrack, forecastByTrack, liveByTrack] =
          await Promise.all([
            (async () => {
              const byTrack = new Map<string, { tool: string }>();
              if (gateIds.length === 0) return byTrack;
              const { data: gates } = await supabase
                .from("agent_approvals")
                .select("id, tool_name, status, run_id")
                .in("id", gateIds)
                .eq("status", "pending");
              const pending = (gates ?? []) as Array<{
                id: string;
                tool_name: string;
                run_id: string | null;
              }>;
              /* Back to the track through the row that opened it. A gate whose
               run cannot be resolved is dropped rather than attributed to a
               guess. */
              const byId = new Map(pending.map((g) => [g.id, g]));
              for (const r of rows) {
                const gates2 = (r as unknown as { pending_gates?: unknown }).pending_gates;
                if (!Array.isArray(gates2)) continue;
                for (const g of gates2) {
                  const id = (g as { id?: unknown }).id;
                  if (typeof id !== "string") continue;
                  const hit = byId.get(id);
                  if (hit && !byTrack.has((r as unknown as { id: string }).id)) {
                    byTrack.set((r as unknown as { id: string }).id, { tool: hit.tool_name });
                  }
                }
              }
              return byTrack;
            })(),
            (async () => {
              /* A SEAT IN FLIGHT, said only when a row literally says so. Never
               inferred from elapsed time or from a missing row, which is the
               rule `activity.ts` states and this read is the same claim one
               level up. */
              const { data: runRows } = await supabase
                .from("agent_runs")
                .select("track_id, agent_name, created_at, trace_id, status")
                .in("track_id", ids)
                .in("status", ["running", "queued", "in_progress"])
                .order("created_at", { ascending: false });
              const running = (runRows ?? []) as Array<{
                track_id: string | null;
                agent_name: string;
                created_at: string;
                trace_id: string | null;
              }>;
              const workingByTrack = new Map<
                string,
                { seat: string; since: string; trace: string | null }
              >();
              for (const r of running) {
                if (!r.track_id || workingByTrack.has(r.track_id)) continue;
                workingByTrack.set(r.track_id, {
                  seat: r.agent_name,
                  since: r.created_at,
                  trace: r.trace_id,
                });
              }

              /* THE VERB, from the newest call on that seat's own trace. Skipped
               entirely when nothing is running, which is the common case. */
              const toolByTrace = new Map<string, string>();
              const traces = [...workingByTrack.values()]
                .map((w) => w.trace)
                .filter((t): t is string => !!t);
              if (traces.length > 0) {
                const { data: calls } = await supabase
                  .from("tool_calls")
                  .select("trace_id, tool_name, created_at")
                  .in("trace_id", traces)
                  .order("created_at", { ascending: false })
                  .limit(200);
                for (const c of (calls ?? []) as Array<{ trace_id: string; tool_name: string }>) {
                  if (!toolByTrace.has(c.trace_id)) toolByTrace.set(c.trace_id, c.tool_name);
                }
              }
              return { workingByTrack, toolByTrace };
            })(),
            (async () => {
              /*
               * THE PINS, IN THEIR OWN TOLERANT READ. Not in `SELECT`, because
               * naming a column there fails the whole query on a database that
               * has not taken the migration, and this read is the front door's
               * only content. A read that cannot answer leaves every row
               * unpinned, which is the state the product had yesterday: a
               * degraded ordering, never a blank page.
               */
              const byTrack = new Map<string, string>();
              try {
                const { data: pins } = await supabase
                  .from("spine_tracks" as never)
                  .select("id, pinned_at")
                  .in("id", ids);
                for (const p of (pins ?? []) as unknown as Array<{
                  id: string;
                  pinned_at: string | null;
                }>) {
                  if (p.pinned_at) byTrack.set(p.id, p.pinned_at);
                }
              } catch {
                /* Unpinned everywhere. See above. */
              }
              return byTrack;
            })(),
            (async () => {
              /*
               * -- WHETHER THE BET HELD, WHICH IS THE FACT A FINISHED RUN IS FOR -
               *
               * A finished row said "Produced 2 specs and 1 decision". That is
               * inventory. The thing this product exists to tell somebody is
               * whether what the work PREDICTED turned out to be true, and until
               * the grader was wired (P-04) there was never a verdict to say --
               * so the count was the best sentence available and is no longer.
               *
               * ITS OWN SMALL, KIND-FILTERED READ, not the full members embed
               * above -- that embed deliberately carries kind only (P-32), so
               * the one id this branch needs is read here, scoped to
               * `artifact_kind = "decision"` alone: on Helio Labs that is 28
               * rows against the 413 the unfiltered read would have carried.
               * Still concurrent with the other three branches; this and the
               * `decisions` read below are this branch's own two-hop chain,
               * exactly as `running seats -> that seat's verb` is its own.
               * Failing soft throughout: a track with no decision, a bet
               * nobody has graded, or a read that did not answer all mean "no
               * verdict to report", and the row falls back to what it said
               * before. Nothing here may turn a missing verdict into a
               * claimed one.
               */
              const byTrack = new Map<string, { resolution: string; rationale: string | null }>();
              const { data: memberRows } = await supabase
                .from("spine_track_members" as never)
                .select("track_id,artifact_id")
                .eq("artifact_kind", "decision")
                .in("track_id", ids);
              const decisionByTrack = new Map<string, string>();
              for (const m of (memberRows ?? []) as unknown as Array<{
                track_id: string;
                artifact_id: string | null;
              }>) {
                if (m.artifact_id && !decisionByTrack.has(m.track_id)) {
                  decisionByTrack.set(m.track_id, m.artifact_id);
                }
              }
              const decisionIds = [...new Set(decisionByTrack.values())];
              if (decisionIds.length === 0) return byTrack;
              const { data: betRows, error: betErr } = await supabase
                .from("decisions")
                .select("id, forecast_resolution, forecast_resolution_rationale")
                .in("id", decisionIds)
                .not("forecast_resolution", "is", null);
              if (betErr) {
                console.error(`[listRunsForStart] could not read verdicts: ${betErr.message}`);
                return byTrack;
              }
              const byDecision = new Map(
                (
                  (betRows ?? []) as unknown as Array<{
                    id: string;
                    forecast_resolution: string | null;
                    forecast_resolution_rationale: string | null;
                  }>
                ).map((d) => [d.id, d]),
              );
              for (const [trackId, decisionId] of decisionByTrack) {
                const bet = byDecision.get(decisionId);
                if (bet?.forecast_resolution) {
                  byTrack.set(trackId, {
                    resolution: bet.forecast_resolution,
                    rationale: bet.forecast_resolution_rationale,
                  });
                }
              }
              return byTrack;
            })(),
            (async () => {
              /*
               * WHEN THIS TRACK'S OWN WORK WENT LIVE (P-126). Reverse of
               * `trackIdByChangeset` (changelog.ts): there, changeset ->
               * mission -> track; here, track -> mission -> changeset ->
               * production deployment. `spine_track_members` is read the
               * same way `promoteChangesetToProductionCore`'s own decision
               * lookup reads it one hop further along
               * (deployments.functions.ts) -- `artifact_kind = "mission"`,
               * scoped to this page's own track ids.
               *
               * SCOPED TO THE HAND-BUILT MERGE PATH ONLY. A deployment
               * `submitStationByHand` files carries no `changeset_id` and no
               * `environment`/`status: "success"` (P-104, A-QUEUE.md flags
               * this same gap for Ship's own exit read) -- reading that
               * shape too belongs to the packet that fixes it for every
               * reader at once, not to this row growing its own second,
               * inconsistent copy of the same join.
               */
              const byTrack = new Map<string, string>();
              const { data: missionMembers } = await supabase
                .from("spine_track_members" as never)
                .select("track_id,artifact_id")
                .eq("artifact_kind", "mission")
                .in("track_id", ids);
              const missionIds = [
                ...new Set(
                  ((missionMembers ?? []) as unknown as Array<{
                    track_id: string;
                    artifact_id: string | null;
                  }>)
                    .map((m) => m.artifact_id)
                    .filter((m): m is string => !!m),
                ),
              ];
              if (missionIds.length === 0) return byTrack;
              const trackByMission = new Map<string, string>();
              for (const m of (missionMembers ?? []) as unknown as Array<{
                track_id: string;
                artifact_id: string | null;
              }>) {
                if (m.artifact_id) trackByMission.set(m.artifact_id, m.track_id);
              }
              const { data: changesets } = await supabase
                .from("studio_changesets" as never)
                .select("id,mission_id")
                .in("mission_id", missionIds);
              const missionByChangeset = new Map<string, string>();
              for (const c of (changesets ?? []) as unknown as Array<{
                id: string;
                mission_id: string | null;
              }>) {
                if (c.mission_id) missionByChangeset.set(c.id, c.mission_id);
              }
              const changesetIds = [...missionByChangeset.keys()];
              if (changesetIds.length === 0) return byTrack;
              const { data: deploys } = await supabase
                .from("deployments" as never)
                .select("changeset_id,deployed_at,created_at")
                .eq("environment", "production")
                .eq("status", "success")
                .in("changeset_id", changesetIds);
              for (const d of (deploys ?? []) as unknown as Array<{
                changeset_id: string | null;
                deployed_at: string | null;
                created_at: string;
              }>) {
                if (!d.changeset_id) continue;
                const missionId = missionByChangeset.get(d.changeset_id);
                const trackId = missionId ? trackByMission.get(missionId) : null;
                if (!trackId) continue;
                const at = d.deployed_at ?? d.created_at;
                // Earliest wins: "live since" is when it FIRST reached
                // production, not the most recent redeploy of the same track.
                const existing = byTrack.get(trackId);
                if (!existing || at < existing) byTrack.set(trackId, at);
              }
              return byTrack;
            })(),
          ]);

        return rows.map((r) => {
          const w = workingByTrack.get(r.id) ?? null;
          const station = r.station as AgentStation;
          return {
            id: r.id,
            title: r.title,
            status: (r.status as StartRun["status"]) ?? "open",
            station,
            stationName: AGENT_STATIONS[station]?.name ?? station,
            updatedAt: r.updated_at,
            drivenAt: r.driven_at ?? null,
            holdReason: r.last_hold,
            holdBecause: r.last_hold_because ?? null,
            working: w
              ? {
                  seat: w.seat,
                  since: w.since,
                  tool: w.trace ? (toolByTrace.get(w.trace) ?? null) : null,
                }
              : null,
            needsYou: gateByTrack.get(r.id) ?? null,
            produced: [...(producedByTrack.get(r.id) ?? new Map()).entries()].map(
              ([kind, count]) => ({
                kind,
                count,
              }),
            ),
            pinnedAt: pinnedByTrack.get(r.id) ?? null,
            forecast: forecastByTrack.get(r.id) ?? null,
            liveSince: liveByTrack.get(r.id) ?? null,
          };
        });
      } catch (e) {
        if (e instanceof Error && e.message.includes("could not be read")) throw e;
        return [];
      }
    }),
  );

/**
 * P-25 (A-QUEUE.md, "the entry point for a person who does not remember the
 * run is search, not a page"). Runs, and every artifact kind a track can
 * hold, matched by title, workspace-scoped through RLS the same way every
 * other read in this file is -- `context.supabase` is the session's own
 * client, so a row outside the caller's workspace never reaches the query in
 * the first place.
 *
 * SIX READS IN PARALLEL, THEN A SECOND ROUND TO NAME EACH ARTIFACT'S RUN. One
 * `.ilike()` per query word against the one table `ARTIFACT_SOURCE` already
 * names for that kind (ANDed, so every word must be present, in any order) --
 * the same map `getChainForTrack` reads elsewhere in this file, so there is
 * still exactly one place that says which table holds which kind. A hit with
 * no live `spine_track_members` row (superseded, or never attached) is
 * dropped rather than returned with nowhere to open: this packet's own scope
 * is that every result opens something, and a result that cannot is the dead
 * end `way-out.ts` was written to stop the run screen from showing.
 *
 * BOTH HELPERS BELOW ARE CLOSURES OVER `supabase`, NOT FUNCTIONS THAT TAKE IT
 * AS A PARAMETER, so each keeps the exact type TanStack's middleware infers
 * for `context.supabase` rather than this file inventing and maintaining a
 * second, parallel type for the same client.
 */
export const findAnything = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ query: z.string(), workspaceId: z.string().uuid().nullable().optional() }))
  .handler(async ({ context, data }): Promise<FindAnythingResult> => {
    const words = searchWords(data.query);
    if (words.length === 0) return EMPTY_RESULT;
    const { supabase, userId } = context;
    /*
     * P-64b: THE WORKSPACE IT STANDS IN, NOT ITS DEFAULT. `data.workspaceId`
     * is `useWorkspace()`'s own `activeWorkspaceId` (the P-66 shape every
     * other shell read already takes) -- explicit and client-supplied,
     * unlike `current_user_default_workspace`, which can name a DIFFERENT
     * workspace than the one on screen the moment a person switches. Every
     * table below carries `workspace_id` (checked against the live schema
     * before writing this), so each group is filtered ONLY WHEN it is
     * known -- the same "narrowing to a workspace we could not name would
     * turn an unresolved id into an empty desk" rule `resolveStartWorkspaceId`
     * and `listRunsForStart` already state, not a new one invented here.
     */
    const workspaceId = data.workspaceId ?? null;

    const searchArtifactTable = async (
      table: string,
      titleColumn: string,
      limit: number,
    ): Promise<Array<{ id: string; title: string }>> => {
      let q = supabase.from(table).select(`id, title:${titleColumn}`).limit(limit);
      if (workspaceId) q = q.eq("workspace_id", workspaceId);
      for (const w of words) q = q.ilike(titleColumn, `%${w}%`);
      const { data: rows, error } = await q;
      if (error || !rows) return [];
      return (rows as unknown as Array<{ id: string; title: string | null }>).filter(
        (r): r is { id: string; title: string } =>
          typeof r.title === "string" && r.title.length > 0,
      );
    };

    /** The one live track each artifact id belongs to, keyed by artifact id. */
    const resolveOwningTracks = async (
      hits: ReadonlyArray<{ kind: SearchKind; id: string }>,
    ): Promise<Map<string, { trackId: string; trackTitle: string }>> => {
      const out = new Map<string, { trackId: string; trackTitle: string }>();
      if (hits.length === 0) return out;

      const idsByKind = new Map<SearchKind, string[]>();
      for (const h of hits) idsByKind.set(h.kind, [...(idsByKind.get(h.kind) ?? []), h.id]);

      const memberRows: Array<{ artifact_id: string; track_id: string }> = [];
      await Promise.all(
        [...idsByKind.entries()].map(async ([kind, ids]) => {
          const { data: members } = await supabase
            .from("spine_track_members")
            .select("artifact_id, track_id")
            .eq("artifact_kind", kind)
            .in("artifact_id", ids)
            .is("superseded_at", null);
          for (const m of (members ?? []) as Array<{ artifact_id: string; track_id: string }>) {
            memberRows.push(m);
          }
        }),
      );
      if (memberRows.length === 0) return out;

      const trackIds = [...new Set(memberRows.map((m) => m.track_id))];
      const { data: tracks } = await supabase
        .from("spine_tracks")
        .select("id, title")
        .in("id", trackIds);
      const titleByTrack = new Map(
        ((tracks ?? []) as Array<{ id: string; title: string }>).map((t) => [t.id, t.title]),
      );
      for (const m of memberRows) {
        // First live membership wins; an artifact re-attached elsewhere
        // carries at most one row with `superseded_at is null` in practice,
        // and if two ever existed the earliest scan result is as good a pick
        // as any -- this is a search result's destination, not the chain's
        // own authority on it.
        if (out.has(m.artifact_id)) continue;
        const title = titleByTrack.get(m.track_id);
        if (title === undefined) continue;
        out.set(m.artifact_id, { trackId: m.track_id, trackTitle: title });
      }
      return out;
    };

    const toFoundArtifacts = (
      kind: SearchKind,
      rows: ReadonlyArray<{ id: string; title: string }>,
      tracks: ReadonlyMap<string, { trackId: string; trackTitle: string }>,
    ): FoundArtifact[] =>
      rows.flatMap((r) => {
        const track = tracks.get(r.id);
        // Dropped, not returned with a null destination -- see this
        // function's own header.
        if (!track) return [];
        return [
          { kind, id: r.id, title: r.title, trackId: track.trackId, trackTitle: track.trackTitle },
        ];
      });

    /*
     * P-64: SOURCES, CONVERSATIONS AND PEOPLE, each a shape `FoundArtifact`
     * does not fit -- none of the three belongs to a track, so none can
     * carry a `trackId`/`trackTitle` the way the six reads above do.
     *
     * `sync_mappings` has no per-document title at all (found while building
     * this: each row is a connector mapping, and Sync's own page already
     * displays `providerLabel(m.provider)`, never a document name) -- so
     * this searches the provider's human word, the only one the table holds.
     * RLS is `auth.uid() = user_id` (own rows only), matching
     * `listSyncMappings`'s explicit filter below for the same reason that
     * function states it explicitly rather than trusting RLS silently.
     *
     * `conversations` RLS is `is_workspace_member(workspace_id)`, so a plain
     * select already scopes to every workspace this caller can see -- the
     * same "search everything RLS lets you reach" rule the six reads above
     * already follow, not a narrower "only your current workspace" rule.
     *
     * `workspace_members`' own RLS is "see own membership" (`user_id =
     * auth.uid()`), so a plain select returns only the caller's OWN row per
     * workspace -- never a co-member's. `profiles` RLS is own-row-only for
     * the same reason (`workspaces.functions.ts`'s own comment on
     * `listWorkspaceMembers`), so a co-member's name is reachable only
     * through the membership-gated `workspace_members_with_identity` RPC,
     * one call per workspace the caller belongs to (typically one, rarely
     * more than a handful) -- the same bounded fan-out
     * `resolveOwningTracks` above already does per artifact kind.
     */
    const searchSources = async (): Promise<
      Array<{ id: string; provider: string; label: string }>
    > => {
      let q = supabase.from("sync_mappings").select("id, provider").eq("user_id", userId).limit(8);
      for (const w of words) q = q.ilike("provider", `%${w}%`);
      const { data: rows } = await q;
      return ((rows ?? []) as Array<{ id: string; provider: string }>).map((r) => ({
        id: r.id,
        provider: r.provider,
        label: CONNECTOR_REGISTRY[r.provider as ProviderId]?.label ?? r.provider.replace(/_/g, " "),
      }));
    };

    const searchConversations = async (): Promise<Array<{ id: string; title: string }>> => {
      /*
       * P-67/P-64b: `conversations` and `messages` both carry `workspace_id`,
       * and RLS (`is_workspace_member`) alone would let this search quietly
       * show a person two workspaces' threads under one heading the moment
       * they hold two -- the exact class of defect P-67's header lists four
       * instances of. Filtered on the ACTIVE workspace (the outer
       * `workspaceId`, the P-66 shape), not `current_user_default_workspace`
       * -- a person's default can differ from the one on screen the moment
       * they switch, and P-64b's own live walk found exactly that gap: the
       * probe's own search answering with Helio's runs and decisions too.
       *
       * TITLE ALONE MISSES MOST REAL THREADS. Checked against the live
       * database: most conversations carry the default "New conversation"
       * title forever -- the words a person actually remembers are in the
       * first thing they typed, per this packet's own acceptance line ("a
       * conversation's first line finds it"). So this searches `messages`
       * too and merges the two hit sets, rather than a title-only search
       * that would answer "New conversation" and nothing else for most
       * threads.
       */
      let titleQ = supabase.from("conversations").select("id, title").limit(8);
      if (workspaceId) titleQ = titleQ.eq("workspace_id", workspaceId);
      for (const w of words) titleQ = titleQ.ilike("title", `%${w}%`);

      let messageQ = supabase.from("messages").select("conversation_id").limit(8);
      if (workspaceId) messageQ = messageQ.eq("workspace_id", workspaceId);
      for (const w of words) messageQ = messageQ.ilike("content", `%${w}%`);

      const [{ data: titleRows }, { data: messageRows }] = await Promise.all([titleQ, messageQ]);

      const byMessage = [
        ...new Set(
          ((messageRows ?? []) as Array<{ conversation_id: string }>).map((r) => r.conversation_id),
        ),
      ];
      let fromMessages: Array<{ id: string; title: string }> = [];
      if (byMessage.length > 0) {
        let convQ = supabase.from("conversations").select("id, title").in("id", byMessage);
        if (workspaceId) convQ = convQ.eq("workspace_id", workspaceId);
        const { data } = await convQ;
        fromMessages = (data ?? []) as Array<{ id: string; title: string }>;
      }

      const seen = new Map<string, { id: string; title: string }>();
      for (const r of (titleRows ?? []) as Array<{ id: string; title: string }>) seen.set(r.id, r);
      for (const r of fromMessages) if (!seen.has(r.id)) seen.set(r.id, r);
      return [...seen.values()].slice(0, 8);
    };

    const searchPeople = async (): Promise<FoundPerson[]> => {
      /*
       * P-64b: THE ACTIVE WORKSPACE'S PEOPLE, NOT EVERY WORKSPACE'S. This
       * used to fan out across every workspace membership row -- searching
       * "everything RLS lets you see", the same shape the runs/decisions
       * groups had before this packet. One workspace, one RPC call, matching
       * the rest of this file post-fix; unresolvable stays empty rather than
       * falling back to a broader guess (`resolveStartWorkspaceId`'s own
       * rule: narrowing to a workspace we could not name would turn an
       * unresolved id into an empty desk, which is a claim, but so is
       * guessing wider than the screen a person is standing on).
       */
      if (!workspaceId) return [];
      const { data, error } = await supabase.rpc("workspace_members_with_identity", {
        _workspace_id: workspaceId,
      });
      if (error || !Array.isArray(data)) return [];

      const seen = new Map<string, FoundPerson>();
      for (const r of data as Array<{
        user_id: string;
        display_name: string | null;
        email: string | null;
      }>) {
        if (!seen.has(r.user_id)) {
          seen.set(r.user_id, {
            userId: r.user_id,
            displayName: r.display_name,
            email: r.email,
          });
        }
      }

      return [...seen.values()]
        .filter((p) => {
          const hay = `${p.displayName ?? ""} ${p.email ?? ""}`.toLowerCase();
          return words.every((w) => hay.includes(w));
        })
        .slice(0, 8);
    };

    try {
      const [
        runRows,
        prdRows,
        decisionRows,
        prototypeRows,
        changesetRows,
        signalRows,
        themeRows,
        sourceRows,
        conversationRows,
        peopleRows,
      ] = await Promise.all([
        (async () => {
          let q = supabase.from("spine_tracks").select("id, title, status, last_hold").limit(8);
          if (workspaceId) q = q.eq("workspace_id", workspaceId);
          for (const w of words) q = q.ilike("title", `%${w}%`);
          const { data: rows } = await q;
          return (rows ?? []) as unknown as Array<{
            id: string;
            title: string;
            status: string;
            last_hold: string | null;
          }>;
        })(),
        searchArtifactTable(ARTIFACT_SOURCE.prd.table, ARTIFACT_SOURCE.prd.title, 8),
        searchArtifactTable(ARTIFACT_SOURCE.decision.table, ARTIFACT_SOURCE.decision.title, 8),
        searchArtifactTable(ARTIFACT_SOURCE.prototype.table, ARTIFACT_SOURCE.prototype.title, 8),
        searchArtifactTable(ARTIFACT_SOURCE.changeset.table, ARTIFACT_SOURCE.changeset.title, 8),
        searchArtifactTable(ARTIFACT_SOURCE.signal.table, ARTIFACT_SOURCE.signal.title, 8),
        searchArtifactTable(ARTIFACT_SOURCE.theme.table, ARTIFACT_SOURCE.theme.title, 8),
        searchSources(),
        searchConversations(),
        searchPeople(),
      ]);

      // One group, one combined cap -- "Findings and themes" is a single
      // heading in this packet's own scope, not two eights.
      const findingHits = [
        ...signalRows.map((r) => ({ kind: "signal" as const, ...r })),
        ...themeRows.map((r) => ({ kind: "theme" as const, ...r })),
      ].slice(0, 8);

      const tracks = await resolveOwningTracks([
        ...prdRows.map((r) => ({ kind: "prd" as const, id: r.id })),
        ...decisionRows.map((r) => ({ kind: "decision" as const, id: r.id })),
        ...prototypeRows.map((r) => ({ kind: "prototype" as const, id: r.id })),
        ...changesetRows.map((r) => ({ kind: "changeset" as const, id: r.id })),
        ...findingHits.map((r) => ({ kind: r.kind, id: r.id })),
      ]);

      return {
        doors: searchDoors(words),
        runs: runRows.map((r) => ({
          id: r.id,
          title: r.title,
          state: runStateWord(r.status, r.last_hold),
        })),
        prd: toFoundArtifacts("prd", prdRows, tracks),
        decision: toFoundArtifacts("decision", decisionRows, tracks),
        prototype: toFoundArtifacts("prototype", prototypeRows, tracks),
        changeset: toFoundArtifacts("changeset", changesetRows, tracks),
        findings: findingHits.flatMap((r) => toFoundArtifacts(r.kind, [r], tracks)),
        sources: sourceRows,
        conversations: conversationRows,
        people: peopleRows,
      };
    } catch {
      // A broken search must never take the rail down with it.
      return EMPTY_RESULT;
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
  deployment: [
    "commit_sha",
    "deploy_url",
    "environment",
    "provider",
    "status",
    "deployed_at",
    // P-39 (A-QUEUE.md): the only place a failed preview's reason can reach
    // the run screen -- ReleaseCard (ArtifactPane.tsx) reads it off `item.fields`.
    "failure_reason",
  ],
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

/**
 * The moment this track's bet was settled.
 *
 * `claim` travels with it because a verdict without the thing it judged is not
 * readable: "you called it" in a stream of events has to say what was called.
 */
export type TrackVerdict = {
  at: string;
  resolution: string;
  claim: string | null;
  rationale: string | null;
  /** The agent that graded it, or null when a person did. */
  by: string | null;
};

/** One `track_drives` row, as far as the self-check tally is concerned. */
type SelfCheckRow = {
  station?: string | null;
  at?: string | null;
  entry_hold?: string | null;
  self_check?: unknown;
};

/**
 * ONE DRIVE'S SELF-CHECK, AS THE TRANSCRIPT DRAWS IT.
 *
 * The tally answers "how often"; this answers "when, and what did it look at".
 * Both come off the same rows in one pass, so the strip's count and the rows a
 * person can scroll through cannot disagree about the same run.
 */
export type SelfCheckEntry = {
  at: string;
  station: string;
  held: number;
  missed: number;
  /** True when this drive ran BECAUSE the station's own check had refused. */
  retried: boolean;
  /** What it compared, in the words the check itself used. */
  what: string[];
  /** Why the ones that did not hold did not. Empty when they all held. */
  why: string[];
};

/**
 * HOW OFTEN THIS RUN CHECKED ITS OWN WORK, AND WHAT CAME OF IT.
 *
 * ── COUNTED FROM WHAT WAS COMPARED, NEVER FROM A CONSTANT ─────────────────
 * Every figure here is derived from the `self_check` arrays themselves. There is
 * no "one check per station" assumption anywhere: Ship compares nothing by
 * design and Build compares two things, so a per-station constant would be
 * wrong in both directions on the same run. If the column is empty the tally
 * says zero, which is the honest answer for a run whose drives all predate it.
 *
 * ── A DRIVE THAT MADE NO COMPARISON IS NOT A CHECK ────────────────────────
 * `drives` counts only drives that compared at least one thing. Counting a
 * drive that compared nothing would inflate "checked its own work" with drives
 * where nothing was checked, which is the number this exists to stop being.
 *
 * ── RETRIES ARE READ FROM `entry_hold`, NOT INFERRED ──────────────────────
 * A drive that ARRIVED on `self-check-failed` is a station running again because
 * its own check refused what it filed. That is a fact the log already records at
 * the moment it is true, and it is the only way to count a retry without
 * guessing at the shape of a sequence.
 */
export type SelfCheckTally = {
  /** Drives whose check compared at least one thing. */
  drives: number;
  /** Individual comparisons made across those drives. */
  compared: number;
  held: number;
  missed: number;
  /** Drives that ran again because this station's own check had refused. */
  retries: number;
  /** Set when the drives could not be read, so a zero is not read as a fact. */
  unreadable: string | null;
  /**
   * One per drive that compared something, for the transcript. Newest first,
   * because that is the order the rows are fetched in and the transcript sorts
   * by time itself -- nothing downstream depends on the order here.
   */
  entries: SelfCheckEntry[];
};

export const EMPTY_SELF_CHECKS: SelfCheckTally = {
  drives: 0,
  compared: 0,
  held: 0,
  missed: 0,
  retries: 0,
  unreadable: null,
  entries: [],
};

export function summariseSelfChecks(
  rows: readonly SelfCheckRow[],
  unreadable: string | null,
): SelfCheckTally {
  const t: SelfCheckTally = { ...EMPTY_SELF_CHECKS, unreadable, entries: [] };
  for (const r of rows) {
    const retried = r.entry_hold === "self-check-failed";
    if (retried) t.retries += 1;
    const list = Array.isArray(r.self_check) ? r.self_check : null;
    if (!list || list.length === 0) continue;
    let held = 0;
    let missed = 0;
    const what: string[] = [];
    const why: string[] = [];
    for (const c of list) {
      if (!c || typeof c !== "object") continue;
      const check = c as { what?: unknown; held?: unknown; why?: unknown };
      // A comparison with nothing to show for it cannot be read by a person and
      // is not counted, for the same reason an empty acceptance line is dropped.
      if (typeof check.what !== "string" || !check.what.trim()) continue;
      what.push(check.what.trim());
      if (check.held === true) held += 1;
      else {
        missed += 1;
        if (typeof check.why === "string" && check.why.trim()) why.push(check.why.trim());
      }
    }
    const counted = held + missed;
    if (counted > 0) {
      t.drives += 1;
      t.compared += counted;
      t.held += held;
      t.missed += missed;
      t.entries.push({
        at: r.at ?? "",
        station: r.station ?? "",
        held,
        missed,
        retried,
        what,
        why,
      });
    }
  }
  return t;
}

/**
 * The transcript's sentence for one drive's check.
 *
 * "Checked its own work: 2 held, 1 did not". Written here rather than in the
 * component so the row and any other reader say it identically, and so the
 * counts in it come from the same object the strip's total is summed from.
 */
export function selfCheckSentence(e: SelfCheckEntry): string {
  const held = `${e.held} held`;
  const missed = e.missed > 0 ? `, ${e.missed} did not` : "";
  const retried = e.retried ? " · retried once" : "";
  return `Checked its own work: ${held}${missed}${retried}`;
}

/**
 * The strip's clause, or null when there is nothing true to say.
 *
 * Null rather than "0 self-checks", because `GotYou` is a list of what the run
 * GOT you and a zero is not one of those -- the same refusal the rest of that
 * strip already makes about time and money.
 */
export function selfCheckLine(t: SelfCheckTally | null | undefined): string | null {
  if (!t || t.drives === 0) return null;
  const checks = `${t.drives} self-${t.drives === 1 ? "check" : "checks"}`;
  const lines = `${t.compared} ${t.compared === 1 ? "thing" : "things"} compared`;
  const missed = t.missed > 0 ? `${t.missed} did not hold` : null;
  const retried = t.retries > 0 ? `${t.retries} ${t.retries === 1 ? "retry" : "retries"}` : null;
  return [checks, lines, missed, retried].filter(Boolean).join(" · ");
}

/**
 * WHO IS HOLDING THE FILE THIS RUN IS WAITING FOR.
 *
 * ── WHY THIS IS A LIVE LOOKUP AND NOT A COLUMN ────────────────────────────
 * The hold sentence names the other run and its file, which is enough to READ.
 * A door has to be pressable, and that needs the other run's track id.
 *
 * Storing it on `spine_tracks` at hold time would be a column that goes stale
 * in the one direction that matters: the claim releases the moment the other
 * run's pull request merges, and a stored id would keep offering a door to a
 * run that is no longer holding anything. Read live, the door disappears
 * exactly when it stops being true, which is also the moment this track starts
 * moving again.
 *
 * ── THE JOIN, AND WHY IT GOES THROUGH THE MISSION ─────────────────────────
 * `builder_file_claims` records the holder as a MISSION, and a track's missions
 * are its `spine_track_members` rows of kind `mission`. Same join
 * `newestChangesetForTrack` uses in the driver, and for the same reason:
 * `studio_changesets` and `builder_file_claims` both key on the mission, never
 * on the track.
 *
 * Returns null for everything that is not a live claim on this exact path --
 * no path on the hold, the claim released, the holder is this very track, or a
 * read that did not answer. A door offered on any of those would be worse than
 * no door.
 */
export const whoHoldsThePath = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(
    async ({ context, data }): Promise<{ trackId: string; title: string; path: string } | null> => {
      const { supabase } = context;
      try {
        const { data: me } = await supabase
          .from("spine_tracks" as never)
          .select("last_hold,last_hold_because")
          .eq("id", data.trackId)
          .maybeSingle();
        const row = me as { last_hold?: string | null; last_hold_because?: string | null } | null;
        if (row?.last_hold !== CLAIMED_PATH_HOLD) return null;
        /* The path is read back out of the sentence the driver wrote. It is the
           one fact the hold carries that this lookup cannot re-derive. */
        const path = pathFromWaitingSentence(row.last_hold_because);
        if (!path) return null;

        const { data: claims } = await supabase
          .from("builder_file_claims")
          .select("mission_id, mission_title")
          .eq("path", path)
          .eq("status", "held")
          .limit(4);
        const holders = (
          (claims ?? []) as Array<{
            mission_id: string | null;
            mission_title: string | null;
          }>
        ).filter((c) => c.mission_id);
        if (holders.length === 0) return null;

        const { data: members } = await supabase
          .from("spine_track_members" as never)
          .select("track_id, artifact_id")
          .eq("artifact_kind", "mission")
          .in(
            "artifact_id",
            holders.map((h) => h.mission_id as string),
          );
        const byMission = new Map(
          ((members ?? []) as unknown as Array<{ track_id: string; artifact_id: string }>).map(
            (m) => [m.artifact_id, m.track_id],
          ),
        );
        for (const h of holders) {
          const otherTrack = byMission.get(h.mission_id as string);
          // Not this track. A run cannot be waiting on itself, and offering a
          // door back to the page you are on is the false door in its purest form.
          if (!otherTrack || otherTrack === data.trackId) continue;
          const { data: t } = await supabase
            .from("spine_tracks" as never)
            .select("title")
            .eq("id", otherTrack)
            .maybeSingle();
          return {
            trackId: otherTrack,
            title: (t as { title?: string } | null)?.title ?? h.mission_title ?? "the other run",
            path,
          };
        }
        return null;
      } catch (e) {
        console.error(
          `[whoHoldsThePath] ${data.trackId}: ${e instanceof Error ? e.message : String(e)}`,
        );
        return null;
      }
    },
  );

/**
 * The three playbook files for a track, for the Plan tab to draw.
 *
 * A thin wrapper on `playbookFilesForTrack`, which `studio.stage` also calls
 * when it writes them into the pull request. One composer, two readers: composed
 * twice they drift, and the screen showing one `intent.md` while the repo holds
 * another is the kind of disagreement nobody finds until it matters.
 */
export const getPlaybookFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<PlaybookFiles | null> => {
    const { supabase } = context;
    try {
      const { data: t } = await supabase
        .from("spine_tracks" as never)
        .select("title")
        .eq("id", data.trackId)
        .maybeSingle();
      const title = (t as { title?: string } | null)?.title ?? "Untitled";
      return await playbookFilesForTrack(supabase, data.trackId, title);
    } catch (e) {
      // The pane draws nothing rather than an error: these files are a view of
      // rows that are already on screen in other forms.
      console.error(
        `[getPlaybookFiles] ${data.trackId}: ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
  });

export const getTrackActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      turns: Turn[];
      transitions: TrackTransition[];
      selfChecks: SelfCheckTally;
      verdict: TrackVerdict | null;
    }> => {
      const { supabase } = context;
      try {
        const [runsRes, membersRes, eventsRes, betRes, drivesRes] = await Promise.all([
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
          /*
           * THE BET THIS TRACK MADE, so its verdict can be a row in the stream.
           *
           * Its own query for the same reason the drives are: it is a different
           * table with a different failure, and a track with no decision is the
           * ordinary case rather than an error.
           */
          supabase
            .from("spine_track_members" as never)
            .select("artifact_id")
            .eq("track_id", data.trackId)
            .eq("artifact_kind", "decision")
            .limit(4),
          /*
           * WHAT EACH DRIVE'S OWN CHECK COMPARED.
           *
           * Its own query rather than a column on one of the three above,
           * because `self_check` is new: naming a column the database has not
           * taken yet fails the WHOLE PostgREST query, and a deploy that lands
           * before the migration would have taken the transcript down with it.
           * Alone, the worst case is this array is empty and the run says it
           * cannot see the checks -- which is true, and recoverable on the next
           * poll.
           */
          supabase
            .from("track_drives" as never)
            .select("station,at,entry_hold,self_check")
            .eq("track_id", data.trackId)
            /*
             * -- NEWEST FIRST, AND THE THREE QUERIES ABOVE ARE NOT WRONG ------
             *
             * They read `agent_runs`, `spine_track_members` and `stage_events`
             * oldest-first, and this one copied that without asking whether the
             * populations are the same size. They are not. `2fdf93b6` carries
             * 285 `track_drives` rows against 200 here, so ascending returned
             * the OLDEST 200 and the self-check written at 21:20 -- the only one
             * on the whole track -- fell outside the window and rendered
             * nothing. A1 read the live Build tab and found zero matches in the
             * transcript while the row sat in the database.
             *
             * A drive is the highest-frequency row on a track by a wide margin:
             * every ten minutes, whether or not anything happened. So this is
             * the one of the four that has to take the newest.
             */
            .order("at", { ascending: false })
            .limit(200),
        ]);

        /*
         * -- THE VERDICT AS A MOMENT, NOT AS A FIELD --------------------------
         *
         * The Learn tab shows the verdict as a PROPERTY of the bet, which is
         * right there. The transcript is the other question -- what happened to
         * this work, in order -- and a bet being settled is the single most
         * consequential thing that ever happens to a track: it is the loop
         * closing. Leaving it out meant a person could scroll the whole record
         * of a run and never meet the answer.
         *
         * Read only when the track has a decision, and only when that decision
         * has been graded. A bet nobody has settled is not a moment, and an
         * ungraded row rendered as one would be the transcript claiming an event
         * that has not happened.
         */
        const betIds = ((betRes.data ?? []) as unknown as Array<{ artifact_id?: string | null }>)
          .map((m) => m.artifact_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0);
        let verdict: TrackVerdict | null = null;
        if (betIds.length > 0) {
          const { data: bets, error: betErr } = await supabase
            .from("decisions")
            .select(
              "forecast_claim, forecast_resolution, forecast_resolution_rationale, forecast_resolved_at, forecast_resolved_by_agent_slug",
            )
            .in("id", betIds)
            .not("forecast_resolution", "is", null)
            .order("forecast_resolved_at", { ascending: false })
            .limit(1);
          if (betErr) {
            console.error(`[getTrackActivity] could not read the verdict: ${betErr.message}`);
          } else {
            const b = (bets ?? [])[0] as
              | {
                  forecast_claim?: string | null;
                  forecast_resolution?: string | null;
                  forecast_resolution_rationale?: string | null;
                  forecast_resolved_at?: string | null;
                  forecast_resolved_by_agent_slug?: string | null;
                }
              | undefined;
            /* A verdict with no time cannot be placed in a stream, and a row in
               the wrong place would claim the bet was settled at a moment it was
               not. The same refusal the self-check rows make. */
            if (b?.forecast_resolution && b.forecast_resolved_at) {
              verdict = {
                at: b.forecast_resolved_at,
                resolution: b.forecast_resolution,
                claim: b.forecast_claim ?? null,
                rationale: b.forecast_resolution_rationale ?? null,
                by: b.forecast_resolved_by_agent_slug ?? null,
              };
            }
          }
        }

        return {
          verdict,
          selfChecks: summariseSelfChecks(
            (drivesRes.data ?? []) as unknown as SelfCheckRow[],
            drivesRes.error ? drivesRes.error.message : null,
          ),
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
        return { turns: [], transitions: [], selfChecks: EMPTY_SELF_CHECKS, verdict: null };
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

/**
 * ── STOP THIS RUN, ON THE RECORD (P-01) ───────────────────────────────────
 *
 * WHAT STOP USED TO DO. `TrackRun` held a count of automatic legs and Stop set
 * it to zero. That is a real thing and it is not a stop: it cancels what THIS
 * TAB would have bought next, the leg already dispatched finishes, and the sweep
 * drives the same track again on its next tick because nothing on the record
 * ever said a person asked it to stop. Closing the tab had identical effect,
 * which means the control and doing nothing were indistinguishable ten minutes
 * later.
 *
 * SO IT WRITES A COLUMN THE DRIVER READS. `driveTrackOnce` is the one door both
 * the press and the sweep go through; `stopRequestedAt` is read there before any
 * seat is dispatched, and the track holds `paused` with "Stopped by you." until
 * the next press clears it.
 *
 * IT REFUSES HONESTLY RATHER THAN REPORTING SUCCESS IT CANNOT SEE. A settled run
 * has nothing to stop and says so; a write that does not land says so; the
 * column not yet existing in this database says so in its own words rather than
 * as a generic failure, because that one is a deploy-order fact and not the
 * person's problem.
 *
 * OWNERSHIP IS FILTERED HERE for the same reason `driveTrackNow` filters it: RLS
 * already returns the same set today, and naming the owner costs nothing and
 * cannot be removed by an unrelated refactor without a failing test.
 */
/**
 * ── "THIS ONE FIRST" (P-20) ───────────────────────────────────────────────
 *
 * Founder, 2026-09-02: *"when various signals are queued, bucketed and themed,
 * how do I decide which one to hack on? Is there any prominence for that?"*
 * Between the promotion bar, which decides what BECOMES a run, and the sweep's
 * round robin, which decides which run moves next, there was no place for a
 * person to say "this one".
 *
 * ONE PIN, NOT A PRIORITY NUMBER. A number needs a scale, a scale needs a
 * meaning, and a meaning nobody agreed becomes five runs all set to 1. An
 * instant answers the only question being asked, and orders several pins by when
 * they were made, which is the order a person meant.
 *
 * IT DOES NOT DRIVE ANYTHING. Pinning changes what the sweep takes NEXT; it
 * spends nothing and moves nothing on its own. "Run it now" is still the control
 * that makes work happen immediately, and keeping those apart is what stops a
 * pin becoming a second, quieter way to spend money.
 *
 * REFUSES HONESTLY, including the deploy-order case in its own words: the column
 * arrives in its own migration, and "this database has not taken it yet" is a
 * fact about the deploy rather than about the person's press.
 */
export const pinTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string; pinned: boolean }) =>
    z.object({ trackId: z.string().uuid(), pinned: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; refused: string | null }> => {
    const { supabase, userId } = context;
    try {
      const { error } = await supabase
        .from("spine_tracks" as never)
        .update({ pinned_at: data.pinned ? new Date().toISOString() : null } as never)
        .eq("id", data.trackId)
        .eq("user_id", userId);
      if (error) {
        const missingColumn = error.code === "42703" || /pinned_at/.test(error.message ?? "");
        return {
          ok: false,
          refused: missingColumn
            ? "This database has not taken the pin column yet, so the order is unchanged."
            : `Nothing was pinned: ${error.message}`,
        };
      }
      return { ok: true, refused: null };
    } catch (e) {
      return {
        ok: false,
        refused: e instanceof Error ? `Nothing was pinned: ${e.message}` : "Nothing was pinned.",
      };
    }
  });

export const stopTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: boolean; refused: string | null }> => {
    const { supabase, userId } = context;
    try {
      const { data: row } = await supabase
        .from("spine_tracks" as never)
        .select("id,status")
        .eq("id", data.trackId)
        .eq("user_id", userId)
        .maybeSingle();
      const track = row as { id: string; status: string } | null;
      if (!track) {
        return { ok: false, refused: "This run could not be read, so nothing was stopped." };
      }
      if (track.status !== "open") {
        return {
          ok: false,
          refused:
            track.status === "done"
              ? "This run is already finished, so there is nothing to stop."
              : "This run was already abandoned, so there is nothing to stop.",
        };
      }

      const { error } = await supabase
        .from("spine_tracks" as never)
        .update({ stop_requested_at: new Date().toISOString() } as never)
        .eq("id", data.trackId)
        .eq("user_id", userId);
      if (error) {
        const missingColumn =
          error.code === "42703" || /stop_requested_at/.test(error.message ?? "");
        return {
          ok: false,
          refused: missingColumn
            ? "This database has not taken the stop column yet, so the loop cannot be told. The legs this page had bought are cancelled."
            : `Nothing was stopped: ${error.message}`,
        };
      }
      return { ok: true, refused: null };
    } catch (e) {
      return {
        ok: false,
        refused: e instanceof Error ? `Nothing was stopped: ${e.message}` : "Nothing was stopped.",
      };
    }
  });

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

    /*
     * ── "RUN IT NOW" IS THE UNDO FOR STOP, AND THERE IS NO SECOND CONTROL ───
     *
     * `stop_requested_at` is what makes a Stop bind the sweep as well as this
     * tab (see `stopRequestedAt` in driver.server.ts). Something has to clear
     * it, and the honest candidate is the press itself: the person who stopped
     * the work is the person starting it, and asking them to find a separate
     * "resume" would be a second control for one decision.
     *
     * `press` ONLY. A `continuation` is this client walking on from a leg whose
     * window closed -- nobody pressed anything -- so a continuation that cleared
     * the column would let a run the person stopped restart itself on the very
     * next tick, which is the whole failure the column exists to prevent. The
     * sweep never clears it either, for the same reason and in the driver.
     *
     * Unchecked, and tolerant of the column not being there yet: a failure here
     * leaves the stop standing, and a stop that outlives one press is a
     * conservative wrong answer the person fixes by pressing again. The
     * expensive direction is work restarting itself.
     */
    if (data.origin === "press") {
      try {
        await supabase
          .from("spine_tracks" as never)
          .update({ stop_requested_at: null } as never)
          .eq("id", data.trackId)
          .eq("user_id", userId);
      } catch {
        /* Left standing on purpose; see above. */
      }
    }

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
  /**
   * The `agent_runs` row whose trace this call carried, or null.
   *
   * WHAT IT IS FOR. The transcript draws one entry per seat's turn and now hangs
   * that turn's own calls under it, collapsed. Without this the pane can only
   * say what the WHOLE TRACK called, which is the flat list this read used to
   * return and which cannot be attributed to anyone.
   *
   * NULL IS A REAL ANSWER AND NOT A HOLE: a call whose trace matches no run on
   * this track belongs to no seat the transcript is drawing. It still appears in
   * the run's total, and it hangs under nobody, which is exactly true.
   */
  runId: string | null;
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
        /*
         * ── THE RUN ID RIDES ALONG NOW, AND THE TRANSCRIPT IS WHY ──────────
         *
         * This selected `trace_id` alone, which answers "what did the agents on
         * this track call" and cannot answer "what did THIS SEAT call". The run
         * screen now renders each turn's calls inside that turn's own entry --
         * Devin's collapsed "Worked for 11s" that opens into the work log -- and
         * that grouping is not derivable from a flat list. The join already
         * existed on both sides; only the id was being dropped on the floor.
         */
        .select("id, trace_id")
        .eq("track_id", data.trackId);
      // Thrown, not swallowed: an empty list means the agents called nothing,
      // and this is the case where nobody could look.
      if (runErr) throw new Error(`The turns on this run could not be read: ${runErr.message}`);

      const rows = (runRows ?? []) as Array<{ id: string; trace_id: string | null }>;
      const tracedRuns = rows.filter((r) => !!r.trace_id).length;
      const traceIds = [...new Set(rows.map((r) => r.trace_id).filter((t): t is string => !!t))];
      /*
       * TRACE TO RUN, and the LAST writer wins on purpose. A trace id is a run's
       * own identifier in the loop, so the map is one to one in every row the
       * record has; if two runs ever shared one, attributing the calls to the
       * newer seat is the reading that keeps a live turn's calls under the live
       * turn, which is the case a person is watching.
       */
      const runByTrace = new Map<string, string>();
      for (const r of rows) if (r.trace_id) runByTrace.set(r.trace_id, r.id);

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
        .select("id, tool_name, ok, latency_ms, created_at, error, trace_id")
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
          trace_id: string | null;
        }>
      )
        .map((c) => ({
          id: c.id,
          tool: c.tool_name,
          ok: c.ok,
          latencyMs: c.latency_ms,
          at: c.created_at,
          error: c.error,
          /* Null is a real answer: a call whose trace matches no run on this
             track belongs to no seat the transcript is drawing, and guessing a
             seat for it would put another turn's work under this one. */
          runId: (c.trace_id ? (runByTrace.get(c.trace_id) ?? null) : null) as string | null,
        }))
        .reverse();

      return { calls, runs: rows.length, tracedRuns };
    },
  );

/**
 * ── "BUILD IT ON YOUR WORD" (P-71b, R-39) ────────────────────────────────
 *
 * The person answered the Choice the strategist could not. Their sentence IS
 * the forecast, and the decision is recorded as theirs: `human` in the actor
 * column, their words in `forecast_claim`, and an observable that says plainly
 * that nothing here can grade it yet.
 *
 * ── WHY THE OBSERVABLE IS NOT INVENTED ───────────────────────────────────
 *
 * `forecast_how_we_will_know` is required and the honest value is the awkward
 * one: no connected source can settle this. Writing a plausible-sounding metric
 * instead -- "conversion on the checkout step" in a workspace with no analytics
 * -- is exactly the sentence that produced this whole packet, and it would come
 * back at the horizon as a verdict nobody could reach. So it says what is true,
 * and P-71's Learn rule then holds the track at `needs-evidence` with the
 * point-a-source door rather than counting down to a date.
 *
 * ── THE HORIZON IS THEIRS TOO ────────────────────────────────────────────
 *
 * Thirty days, and it is a real commitment rather than a placeholder: the
 * forecast columns are immutable once written, and Learn will ask about it. A
 * distant date to be safe is the thing the tool's own description warns against.
 */
/**
 * ── THE OTHER ANSWER, WHICH RECORDED NOTHING AT ALL (P-71f) ───────────────
 *
 * "Point a source first" was a `navigate()` to the connections settings and
 * nothing else. The person answered the Choice and the track kept
 * `the-call-is-yours`, so `driven_at > updated_at` held and P-71d's skip took
 * it out of the sweep permanently -- the same dead end `buildOnYourWord` was
 * just fixed for, reached through the door nobody measured because it looked
 * like navigation rather than an answer.
 *
 * Both options on a Choice are answers. This one says "I am going to get you
 * evidence", which is precisely `needs-evidence`: the hold whose whole meaning
 * is that no station can manufacture what this work needs and a person is
 * bringing it. It keeps its sweep slot -- `scheduledAwayIds` skips a
 * `needs-evidence` track only when it carries a FUTURE date, and this one
 * carries none -- so the track is picked up again the moment a source lands.
 *
 * NO DECISION ROW. They did not decide anything; they declined to decide
 * without evidence, which is the opposite. Writing an approval here would be
 * the same invention R-39 exists to refuse.
 */
export const pointASourceFirst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabase } = context;

    const { error } = await supabase
      .from("spine_tracks" as never)
      .update({
        last_hold: "needs-evidence",
        /*
         * The door, in their words rather than the machine's. `needs-evidence`
         * is set by stations too, so the sentence has to say that a PERSON
         * chose this -- otherwise the run screen reports their answer as a
         * station's complaint.
         */
        last_hold_because:
          "You chose to point a source at this first. Nothing connected here can tell us whether " +
          "it worked yet; connect one and this run picks up again.",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", data.trackId);
    if (error) throw new Error(`Your answer could not be recorded: ${error.message}`);

    return { ok: true as const };
  });

export const buildOnYourWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        trackId: z.string().uuid(),
        /*
         * ── THEIRS TO EDIT (P-71e) ─────────────────────────────────────────
         *
         * The observable was written for them and they could not change it.
         * A person building on their own word is the one person who knows what
         * would settle it, and the sentence they are handed says only that
         * nothing here can. Optional: the default stands if they leave it, so
         * nothing breaks for a caller that sends none.
         */
        howWeWillKnow: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true; decisionId: string }> => {
    const { supabase, userId } = context;

    const { data: trackRow, error: trackErr } = await supabase
      .from("spine_tracks" as never)
      .select("id,title,workspace_id,product_id,station,path,entry_station,waived,origin")
      .eq("id", data.trackId)
      .maybeSingle();
    if (trackErr) throw new Error(`This run could not be read: ${trackErr.message}`);
    const track = trackRow as {
      id: string;
      title: string | null;
      workspace_id: string | null;
      product_id: string | null;
      station: string | null;
      path: unknown;
      entry_station: string | null;
      waived: unknown;
      origin: string | null;
    } | null;
    if (!track) throw new Error("This run no longer exists.");

    const claim = (track.title ?? "").trim();
    if (!claim) {
      // Their sentence is the whole forecast. Without it there is nothing to
      // record on their behalf, and inventing one would be the defect again.
      throw new Error("This run carries no sentence, so there is nothing to record as your claim.");
    }

    const horizon = new Date(Date.now() + 30 * 86400000).toISOString();
    const { data: decRows, error: decErr } = await supabase
      .from("decisions")
      .insert({
        user_id: userId,
        workspace_id: track.workspace_id,
        product_id: track.product_id,
        title: claim,
        status: "approved",
        rationale:
          "You chose to build this on your word. Nothing in this workspace bore on it, so the " +
          "call was yours rather than ours.",
        decided_by_agent_slug: null,
        forecast_claim: claim,
        /* Their words when they wrote any, and the honest default when they
           did not. Never a plausible-sounding metric this workspace cannot
           read: that invention is what produced this whole line of packets. */
        forecast_how_we_will_know:
          data.howWeWillKnow && data.howWeWillKnow.length > 0
            ? data.howWeWillKnow
            : "Nothing connected here can settle this yet. Point a source at it and this becomes " +
              "gradable; until then the record says it was your call.",
        forecast_horizon_date: horizon,
      } as never)
      .select("id");
    if (decErr) throw new Error(`Your call could not be recorded: ${decErr.message}`);
    const decisionId = ((decRows ?? []) as Array<{ id: string }>)[0]?.id;
    if (!decisionId) throw new Error("Your call could not be recorded, and nothing was changed.");

    /*
     * ── THE ANSWER IS THE DECIDE ARTIFACT, SO THE TRACK LEAVES DECIDE ───────
     *
     * Clearing the hold was not enough, and A1's fifth probe measured exactly
     * how much:
     *
     *   03:50:25.732  the decision row lands -- their claim, their observable,
     *                 `decided_by_agent_slug` NULL
     *   03:50:25.811  this write clears `the-call-is-yours`
     *   03:50:26.849  a drive runs Decide again
     *   03:50:28.513  R-39 refuses again and re-raises the Choice
     *
     * Two point eight seconds. Then `driven_at > updated_at`, which is P-71d's
     * skip, so the sweep never looks at it again: the person answered and the
     * product asked the same question back, permanently.
     *
     * IT CANNOT BE FIXED BY CLEARING HARDER. The track is `carried` -- Sense
     * searched and found nothing, and P-71c made that a durable fact rather
     * than a hold that can be overwritten. `seatMayDecide` therefore refuses
     * EVERY machine decision on it, correctly and forever. Decide has no
     * machine completion available, so leaving the station at Decide schedules
     * the identical refusal for whenever the track is next driven.
     *
     * The person's decision IS the thing Decide exists to produce. So it is
     * attached as Decide's artifact and the station advances in the same write
     * that clears the hold -- one round trip, no window in which the track sits
     * answered-but-unmoved for a sweep to walk into.
     */
    const route = {
      entry: (track.entry_station ?? "sense") as AgentStation,
      path: (Array.isArray(track.path) && track.path.length > 0
        ? track.path
        : [...AGENT_STATION_ORDER]) as AgentStation[],
      waived: (Array.isArray(track.waived) ? track.waived : []) as SpineRoute["waived"],
      origin: track.origin,
    } as SpineRoute;
    /* Only ever moves a track that is actually standing at Decide. Answering
       the Choice from anywhere else records the call and moves nothing, which
       is the honest reading of a question that is no longer where it was. */
    const here = (track.station ?? "") as AgentStation;
    const movesOn = here === "decide" ? nextStation(route, here) : null;

    await attachPersonsDecision(supabase, data.trackId, decisionId);

    const { error: clearErr } = await supabase
      .from("spine_tracks" as never)
      .update({
        last_hold: null,
        last_hold_because: null,
        ...(movesOn ? { station: movesOn, attempts: 0, station_drives: 0 } : {}),
        /*
         * `updated_at` MOVES, and it is what lets the sweep pick this up again
         * (P-71d). The skip that keeps `the-call-is-yours` out of the sweep is
         * `driven_at > updated_at`, so a hold write alone would leave the track
         * theirs forever. Answering is the person acting, which is exactly the
         * event that column exists to record.
         */
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", data.trackId);
    /*
     * CHECKED, because the first version did not. A silent failure here returns
     * `{ ok: true }` to a person whose answer changed nothing on the row -- the
     * screen says the call is recorded and the track goes on asking. The
     * decision row is real either way, so this reports the half that failed
     * rather than pretending the whole thing did.
     */
    if (clearErr) {
      throw new Error(
        `Your call was recorded, but this run could not be moved on: ${clearErr.message}`,
      );
    }

    return { ok: true as const, decisionId };
  });

/**
 * ── WHAT THE MERGE GATE SHOWS (P-72, R-40) ───────────────────────────────
 *
 * Three facts that all existed in the record when the tablet track's pull
 * request was merged, and none of which was on the card: what the change
 * touches, what the Build seat concluded, what the Design critic said.
 *
 * EACH READ FAILS ON ITS OWN and `known` is false only when the CHANGE itself
 * could not be read. A missing halt and a missing verdict are ordinary -- most
 * builds do not halt and not every track has a critic -- so they are absences
 * rather than failures, and the card simply says less.
 */
export const mergeGateEvidence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<MergeGateEvidence> => {
    const { supabase } = context;
    const empty: MergeGateEvidence = {
      files: [],
      buildHalt: null,
      designVerdict: null,
      known: false,
    };
    try {
      const { data: runRows, error: runErr } = await supabase
        .from("agent_runs")
        .select("mission_id,trace_id")
        .eq("track_id", data.trackId);
      if (runErr) return empty;
      const rows = (runRows ?? []) as Array<{ mission_id: string | null; trace_id: string | null }>;
      const missionIds = [
        ...new Set(rows.map((r) => r.mission_id).filter((m): m is string => !!m)),
      ];
      const traceIds = [...new Set(rows.map((r) => r.trace_id).filter((t): t is string => !!t))];
      if (missionIds.length === 0) return empty;

      const { data: csRows, error: csErr } = await supabase
        .from("studio_changesets")
        .select("id,workspace_id,created_at")
        .in("mission_id", missionIds)
        .order("created_at", { ascending: false })
        .limit(1);
      if (csErr) return empty;
      const cs = ((csRows ?? []) as Array<{ id: string; workspace_id: string | null }>)[0];
      if (!cs) return empty;

      /* The change itself, from the record rather than from GitHub: the content
         is already here, so the card costs no network call and cannot be told a
         different story by a rate limit. */
      const { data: changeRows, error: chErr } = await supabase
        .from("studio_changes")
        .select("path,base_content,new_content")
        .eq("changeset_id", cs.id)
        .limit(200);
      if (chErr) return empty;
      const files = (
        (changeRows ?? []) as Array<{
          path: string;
          base_content: string | null;
          new_content: string | null;
        }>
      ).map((c) => ({ path: c.path, ...countLines(c.base_content, c.new_content) }));

      /* The seat's halt, if it made one. An absence here is ordinary. */
      let buildHalt: string | null = null;
      if (traceIds.length > 0) {
        let haltQ = supabase.from("tool_calls").select("args");
        if (cs.workspace_id) haltQ = haltQ.eq("workspace_id", cs.workspace_id);
        const { data: halts } = await haltQ
          .in("trace_id", traceIds)
          .eq("tool_name", "build.halt")
          .eq("ok", true)
          .order("created_at", { ascending: false })
          .limit(1);
        const args = ((halts ?? []) as Array<{ args: unknown }>)[0]?.args as
          { reason?: unknown } | undefined;
        if (typeof args?.reason === "string") buildHalt = args.reason;
      }

      /* Design's verdict, if a critic ran. Also ordinarily absent. */
      let designVerdict: MergeGateEvidence["designVerdict"] = null;
      const { data: proto } = await supabase
        .from("spine_track_members" as never)
        .select("artifact_id")
        .eq("track_id", data.trackId)
        .eq("artifact_kind", "prototype")
        .is("superseded_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const protoId = (proto as { artifact_id?: string } | null)?.artifact_id;
      if (protoId) {
        const { data: scaffold } = await supabase
          .from("prd_scaffolds")
          .select("critic_review")
          .eq("id", protoId)
          .maybeSingle();
        const raw = (scaffold as { critic_review?: unknown } | null)?.critic_review;
        if (raw) {
          const review = parseDesignCriticReview(raw);
          const against = review.findings.find(
            (f) => findingIsAgainstThePremise(f.issue) || findingIsAgainstThePremise(f.principle),
          );
          designVerdict = {
            verdict: review.verdict,
            finding: against?.issue ?? review.findings[0]?.issue ?? null,
          };
        }
      }

      return { files, buildHalt, designVerdict, known: true };
    } catch {
      return empty;
    }
  });

/**
 * ── THE SAME EVIDENCE, FOR A PAGE OF RELEASES (P-96) ─────────────────────
 *
 * `mergeGateEvidence` answers for ONE track, before the merge. /ship lists
 * releases after it, and its rows are keyed on the changeset -- so this asks the
 * same questions of a set of changesets and returns one answer each.
 *
 * BATCHED ON PURPOSE. A per-row server call over a page of a hundred releases
 * is a hundred round trips for a list that renders at once, and the reads here
 * are all `in (...)` over ids the caller already holds. Bounded at 60 because
 * the page shows far fewer and an unbounded `in` list is how a read becomes a
 * table scan.
 *
 * WHAT `known` MEANS, and it is per-changeset rather than for the batch: a read
 * that failed proves nothing about any row, so a failure returns everything
 * unknown rather than an empty map that reads as "nothing to show".
 */
export const releaseEvidence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        changesetIds: z.array(z.string().uuid()).max(60),
        /* Named so the reads can name it (P-67). Nullable because a caller that
           has not resolved a workspace must not be made to invent one: an
           unfiltered read is a wider question, a read filtered on a workspace
           nobody could name is a wrong answer. */
        workspaceId: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<Record<string, ReleaseEvidence>> => {
    const { supabase } = context;
    const ids: string[] = [...new Set(data.changesetIds as string[])];
    const unknown = (): ReleaseEvidence => ({
      files: [],
      buildHalt: null,
      designVerdict: null,
      known: false,
      deployment: null,
      handRecorded: false,
    });
    const out: Record<string, ReleaseEvidence> = {};
    if (ids.length === 0) return out;
    for (const id of ids) out[id] = unknown();

    try {
      const wid = (data.workspaceId ?? null) as string | null;
      let csQ = supabase
        .from("studio_changesets")
        .select("id,workspace_id,mission_id")
        .in("id", ids);
      if (wid) csQ = csQ.eq("workspace_id", wid);
      const { data: csRows, error: csErr } = await csQ;
      if (csErr) return out;
      const changesets = (csRows ?? []) as Array<{
        id: string;
        workspace_id: string | null;
        mission_id: string | null;
      }>;

      /*
       * THE FILES, in one read for the whole page. A changeset with no rows here
       * is not an error: it is either a change that staged nothing, or a
       * handback, and `releaseSummaryLines` tells those apart by `handRecorded`
       * rather than by the emptiness.
       */
      const { data: changeRows, error: chErr } = await supabase
        .from("studio_changes")
        .select("changeset_id,path,base_content,new_content")
        .in("changeset_id", ids)
        .limit(1000);
      if (chErr) return out;
      const filesByChangeset = new Map<string, ChangedFile[]>();
      for (const c of (changeRows ?? []) as Array<{
        changeset_id: string;
        path: string;
        base_content: string | null;
        new_content: string | null;
      }>) {
        const list = filesByChangeset.get(c.changeset_id) ?? [];
        list.push({ path: c.path, ...countLines(c.base_content, c.new_content) });
        filesByChangeset.set(c.changeset_id, list);
      }

      /* The seat's halt, per mission, for the missions this page actually has. */
      const missionIds = changesets.map((c) => c.mission_id).filter((m): m is string => !!m);
      const haltByMission = new Map<string, string>();
      if (missionIds.length > 0) {
        let runQ = supabase
          .from("agent_runs")
          .select("mission_id,trace_id")
          .in("mission_id", missionIds);
        if (wid) runQ = runQ.eq("workspace_id", wid);
        const { data: runRows } = await runQ;
        const traceToMission = new Map<string, string>();
        for (const r of (runRows ?? []) as Array<{
          mission_id: string | null;
          trace_id: string | null;
        }>) {
          if (r.trace_id && r.mission_id) traceToMission.set(r.trace_id, r.mission_id);
        }
        const traceIds = [...traceToMission.keys()];
        if (traceIds.length > 0) {
          let haltQ = supabase
            .from("tool_calls")
            .select("trace_id,args,created_at")
            .in("trace_id", traceIds)
            .eq("tool_name", "build.halt")
            .eq("ok", true);
          if (wid) haltQ = haltQ.eq("workspace_id", wid);
          const { data: halts } = await haltQ.order("created_at", { ascending: false }).limit(200);
          for (const h of (halts ?? []) as Array<{ trace_id: string | null; args: unknown }>) {
            const mission = h.trace_id ? traceToMission.get(h.trace_id) : null;
            if (!mission || haltByMission.has(mission)) continue;
            const reason = (h.args as { reason?: unknown } | null)?.reason;
            if (typeof reason === "string") haltByMission.set(mission, reason);
          }
        }
      }

      for (const cs of changesets) {
        out[cs.id] = {
          files: filesByChangeset.get(cs.id) ?? [],
          buildHalt: cs.mission_id ? (haltByMission.get(cs.mission_id) ?? null) : null,
          /*
           * Not read here. The critic's verdict hangs off a TRACK's prototype,
           * and a release row knows only its changeset; resolving one to the
           * other is a third join for a fact most releases do not have. The
           * merge gate, which is asked with a track in hand, still shows it --
           * so the summary is the same shape and this surface fills what it can
           * actually see rather than guessing.
           */
          designVerdict: null,
          known: true,
          /* Filled by the caller from `releaseStanding`, which owns the word. */
          deployment: null,
          /*
           * A CHANGESET THE PRODUCT DID NOT BUILD. `submitStationByHand` writes
           * one with no mission behind it -- there was no run, because somebody
           * else's builder made the change. That is the durable structural fact,
           * so it is what this reads, rather than the deploy status, which
           * describes where it went and not who made it.
           */
          handRecorded: !cs.mission_id,
        };
      }
      return out;
    } catch {
      return out;
    }
  });

/**
 * Is R-39's Choice still in front of this person? (P-71d)
 *
 * Read from `track_drives.entry_hold` rather than from the current hold, for
 * the reason P-71c already paid for: a hold is a current fact and a question
 * being unanswered is a historical one. A1's third probe walk overwrote the
 * hold within ten minutes and the run screen fell back to a generic card while
 * the question was still on the record and still unanswered.
 */
export const choiceStillOutstanding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ outstanding: boolean }> => {
    const { supabase } = context;
    try {
      const raised = await supabase
        .from("track_drives")
        .select("entry_hold")
        .eq("track_id", data.trackId)
        .eq("entry_hold", "the-call-is-yours")
        .limit(1);
      if (raised.error) return { outstanding: false };
      if (((raised.data ?? []) as unknown[]).length === 0) return { outstanding: false };

      /*
       * A decision on the track is the answer, whoever recorded it: the person
       * through `buildOnYourWord`, or a station that ran after they chose to
       * point a source. Either way the question is no longer in front of them.
       */
      const decided = await supabase
        .from("spine_track_members" as never)
        .select("artifact_id")
        .eq("track_id", data.trackId)
        .eq("artifact_kind", "decision")
        .is("superseded_at", null)
        .limit(1);
      if (decided.error) return { outstanding: false };
      return { outstanding: ((decided.data ?? []) as unknown[]).length === 0 };
    } catch {
      /* Unread is not outstanding: drawing the Choice over a track that has
         moved on would ask a question that has already been answered. */
      return { outstanding: false };
    }
  });
