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
import { HOLD_LINE, type HoldReason } from "@/lib/spine/driver";

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
    hold: r.last_hold ? (HOLD_LINE[r.last_hold as HoldReason] ?? null) : null,
    drivenAt: r.driven_at ?? null,
  };
}

const SELECT =
  "id,title,origin,entry_station,station,status,path,waived,updated_at,last_hold,driven_at";

/**
 * Start a piece of work and give it a route.
 *
 * The route is a PROPOSAL derived from the shape, and every station it waives
 * carries a reason and a condition that brings it back. `origin` is required
 * whenever the work enters below Discover, which `validateRoute` enforces:
 * work that skipped discovery has no evidence behind it, so without a stated
 * reason Learn would have nothing to grade the outcome against.
 */
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
    const { supabase, userId } = context;
    const origin = data.origin?.trim() || null;
    const route = suggestRoute(data.shape as WorkShape, origin);

    // Refuse before writing, and say why in the words the rule uses. A track
    // with no stated reason that entered at Plan is the exact record Learn
    // cannot use later, so it is better rejected here than stored broken.
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
        } as never)
        .select(SELECT)
        .single();
      if (error || !row) {
        return { track: null, problems: [error?.message ?? "The track could not be started."] };
      }
      return { track: rowToTrack(row as unknown as TrackRow), problems: [] };
    } catch (e) {
      return { track: null, problems: [(e as Error).message] };
    }
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
 * A track at the end of its route is marked done rather than left open, since
 * the last station on every route is `learn` and work that has been graded is
 * finished.
 */
export const advanceTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(
    async ({ context, data }): Promise<{ track: Track | null; arrivedAt: string | null }> => {
      const { supabase } = context;
      try {
        const { data: row } = await supabase
          .from("spine_tracks" as never)
          .select(SELECT)
          .eq("id", data.trackId)
          .maybeSingle();
        if (!row) return { track: null, arrivedAt: null };

        const track = rowToTrack(row as unknown as TrackRow);
        const next = nextStation(track.route, track.station);

        const { data: updated } = await supabase
          .from("spine_tracks" as never)
          .update(
            next
              ? ({ station: next, updated_at: new Date().toISOString() } as never)
              : ({ status: "done", updated_at: new Date().toISOString() } as never),
          )
          .eq("id", data.trackId)
          .select(SELECT)
          .single();

        return {
          track: updated ? rowToTrack(updated as unknown as TrackRow) : track,
          arrivedAt: next,
        };
      } catch (e) {
        console.error("advanceTrack failed:", e);
        return { track: null, arrivedAt: null };
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
