/**
 * WHAT ONE STATION LEFT UNSETTLED FOR THE NEXT, READ BACK (S1's #29).
 *
 * `SPEC-STATION-MODEL-AND-ARTIFACTS.md` §2.1 gives a handoff five fields. S1
 * shipped three in RUN-124. The other two — `open_questions` and `constraints` —
 * are written on every hop into `agent_messages.payload` and **read by nothing**:
 * the four files that touch that table select `source_trace_id` and `mission_id`
 * and never the payload. §4.3 makes the open question *the primary human
 * touchpoint of the product*, and it has never reached a screen.
 *
 * ── THE COLUMN BUILT FOR THIS JOIN IS NEVER WRITTEN, AND THAT IS THE FINDING ──
 * `agent_messages.track_id` exists. Measured 2026-08-31: **NULL on all 143
 * handoffs**, because `enqueueHandoff`'s insert never set it. A reader filtering
 * on it would have returned zero rows for every track, for ever, and looked
 * exactly like "no station has handed anything on" — a false negative with no
 * symptom. The writer now fills it (`handoff.server.ts`), so this reads the
 * direct edge; the mission fallback below is what makes the 143 rows already on
 * the record legible at all.
 *
 * ── WHAT THIS WILL SHOW TODAY, SAID PLAINLY BEFORE ANYONE BUILDS ON IT ───────
 * Through the mission join, measured across the whole table:
 *
 *   handoffs ...................................... 143
 *   reachable from any track ......................  25
 *   TRACKS with any handoff at all ................   8  (of 108)
 *   TRACKS whose handoff carries either field .....   0
 *
 * **So this returns rows for eight tracks and content for none.** That is not a
 * reason to skip the reader — it is the measurement the producer half needs, and
 * a surface that says "the station filed none" honestly is worth more than one
 * that cannot say anything. It IS a reason not to conclude anything from an
 * empty pane yet.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { narrowHandoff, type HandoffRow, type TrackHandoff } from "@/lib/handoff-fields";

const SELECT = "id,created_at,from_agent_slug,to_agent_slug,payload,consumed_by_run_id";

export type TrackHandoffsResult = {
  /** `null` means THE READ FAILED. `[]` means the track has no handoffs (F-76). */
  handoffs: TrackHandoff[] | null;
  /**
   * True when every row came through the mission fallback rather than the direct
   * edge — i.e. these predate the writer fix. Surfaced rather than hidden so a
   * reader can tell "the loop recorded this against the track" from "we inferred
   * it from a shared mission", which are different confidences.
   */
  inferredFromMission: boolean;
};

export const getTrackHandoffs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<TrackHandoffsResult> => {
    // `track_id` postdates the generated types, the documented precedent in
    // resolve.server.ts / today.functions.ts.
    const db = context.supabase as unknown as SupabaseClient;

    const direct = await db
      .from("agent_messages")
      .select(SELECT)
      .eq("kind", "handoff")
      .eq("track_id", data.trackId)
      .order("created_at", { ascending: true });
    // A FAILED READ IS NOT AN EMPTY TRACK (F-76). Returning `[]` here would draw
    // "no station handed anything on" out of a database error, which is the
    // exact sentence this whole finding is about.
    if (direct.error) return { handoffs: null, inferredFromMission: false };
    if ((direct.data ?? []).length > 0) {
      return {
        handoffs: (direct.data as HandoffRow[]).map(narrowHandoff),
        inferredFromMission: false,
      };
    }

    // FALLBACK for every row written before the writer carried the track. The
    // 143 handoffs on the record today are all in this branch.
    const runs = await db
      .from("agent_runs")
      .select("mission_id")
      .eq("track_id", data.trackId)
      .not("mission_id", "is", null);
    if (runs.error) return { handoffs: null, inferredFromMission: false };
    const missionIds = [
      ...new Set((runs.data as { mission_id: string }[]).map((r) => r.mission_id)),
    ];
    if (missionIds.length === 0) return { handoffs: [], inferredFromMission: false };

    const viaMission = await db
      .from("agent_messages")
      .select(SELECT)
      .eq("kind", "handoff")
      .in("mission_id", missionIds)
      .order("created_at", { ascending: true });
    if (viaMission.error) return { handoffs: null, inferredFromMission: false };
    const rows = (viaMission.data ?? []) as HandoffRow[];
    return {
      handoffs: rows.map(narrowHandoff),
      // Only claim inference when there is something to have inferred.
      inferredFromMission: rows.length > 0,
    };
  });
