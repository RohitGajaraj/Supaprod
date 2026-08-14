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
import { z } from "zod";
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
import { holdLine } from "@/lib/spine/driver";
import {
  ARTIFACT_SOURCE,
  buildChain,
  describeChain,
  wordFor,
  type Chain,
  type ChainMember,
  type MemberRow,
} from "@/lib/spine/chain";
import { recordStageEvent } from "@/lib/stage-events.server";
import type { SupabaseClient } from "@supabase/supabase-js";
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
  /** When the driver last touched it. Null means it has never been driven. */
  drivenAt: string | null;
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
  driven_at: string | null;
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
    drivenAt: r.driven_at ?? null,
  };
}

const SELECT =
  "id,user_id,workspace_id,title,origin,entry_station,station,status,path,waived,updated_at,last_hold,driven_at";

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
        workspace_id: data.workspaceId ?? null,
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
      return { track: null, problems: [error?.message ?? "The track could not be started."] };
    }
    const track = rowToTrack(row as unknown as TrackRow);
    if (data.themeId) await attachOriginTheme(supabase, track.id, data.themeId);
    return { track, problems: [] };
  } catch (e) {
    return { track: null, problems: [(e as Error).message] };
  }
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
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ track: Track | null; problems: string[] }> => {
    return startTrackCore(context.supabase, context.userId, {
      title: data.title,
      shape: data.shape as WorkShape,
      origin: data.origin,
      productId: data.productId ?? null,
      projectId: data.projectId ?? null,
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
      if (error || !data) return [];
      return (data as unknown as TrackRow[]).map(rowToTrack);
    } catch {
      return [];
    }
  });

export const getTrack = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<Track | null> => {
    const { supabase } = context;
    try {
      const { data: row } = await supabase
        .from("spine_tracks" as never)
        .select(SELECT)
        .eq("id", data.trackId)
        .maybeSingle();
      return row ? rowToTrack(row as unknown as TrackRow) : null;
    } catch {
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
    }): Promise<{ track: Track | null; arrivedAt: string | null; refused: string | null }> => {
      const { supabase } = context;
      try {
        const { data: row } = await supabase
          .from("spine_tracks" as never)
          .select(SELECT)
          .eq("id", data.trackId)
          .maybeSingle();
        if (!row) {
          return { track: null, arrivedAt: null, refused: "That work could not be found." };
        }

        const raw = row as unknown as TrackRow;
        const track = rowToTrack(raw);

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
            };
          }
        }

        const next = nextStation(track.route, track.station);
        const now = new Date().toISOString();

        const { data: updated, error: upErr } = await supabase
          .from("spine_tracks" as never)
          .update(
            (next
              ? { station: next, attempts: 0, last_hold: null, updated_at: now }
              : { status: "done", attempts: 0, last_hold: null, updated_at: now }) as never,
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
          };
        }

        await recordStageEvent(supabase, {
          entityType: "spine_track",
          entityId: track.id,
          from: track.station,
          to: next ?? track.station,
          actor: "human",
          workspaceId: raw.workspace_id,
          userId: raw.user_id,
        });

        return {
          track: rowToTrack(updated as unknown as TrackRow),
          arrivedAt: next,
          refused: null,
        };
      } catch (e) {
        console.error("advanceTrack failed:", e);
        return {
          track: null,
          arrivedAt: null,
          refused: "The move failed. Nothing on screen can be trusted until this list reloads.",
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
  .handler(
    async ({ context, data }): Promise<{ track: Track | null; refused: string | null }> => {
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
        const { data: updated, error } = await supabase
          .from("spine_tracks" as never)
          .update({ attempts: 0, last_hold: null, driven_at: now, updated_at: now } as never)
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
    },
  );

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
export const getTrackActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ turns: Turn[] }> => {
    const { supabase } = context;
    try {
      const [runsRes, membersRes] = await Promise.all([
        supabase
          .from("agent_runs")
          .select("id,agent_slug,agent_name,status,output,created_at,spend_used_usd")
          .eq("track_id", data.trackId)
          .order("created_at", { ascending: true })
          .limit(200),
        supabase
          .from("spine_track_members" as never)
          .select("artifact_kind,artifact_id,station,created_at")
          .eq("track_id", data.trackId)
          .order("created_at", { ascending: true }),
      ]);

      return {
        turns: buildActivity({
          runs: (runsRes.data ?? []) as unknown as RunRow[],
          members: (membersRes.data ?? []) as unknown as ActivityMemberRow[],
        }),
      };
    } catch {
      return { turns: [] };
    }
  });
