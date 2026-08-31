import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The horizon each track is waiting on, for a batch of tracks, read the SAME WAY
 * the driver reads it for one (F-183).
 *
 * ── THE SELECTION RULE IS COPIED DELIBERATELY, NOT REINVENTED ────────────────
 * `forecastDueDate` in `driver.server.ts` takes the LATEST unsuperseded decision
 * member and reads its horizon. **It does not take the minimum**, and that
 * distinction cost three lanes a round on 2026-09-01: S4 published the fuse on
 * `d2263583` as 2026-09-07 by taking `min()` of fourteen horizons, S1 caught it,
 * and the driver's own answer is 2026-10-15. **If this function used a different
 * rule, the sweep would hold a track past a date the driver had already cleared,
 * or drive one the driver still considers waiting.** Two readers of one fact
 * must agree, so this mirrors it exactly: order members by `created_at` DESC,
 * unsuperseded only, newest per track.
 */
export async function dueDatesFor(
  db: SupabaseClient,
  trackIds: readonly string[],
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  if (trackIds.length === 0) return out;

  const { data: members, error: memberErr } = await db
    .from("spine_track_members")
    .select("track_id,artifact_id,created_at")
    .in("track_id", trackIds as string[])
    .eq("artifact_kind", "decision")
    .is("superseded_at", null)
    .order("created_at", { ascending: false });
  // A FAILED READ MUST NOT SCHEDULE ANYTHING AWAY. An empty map means "no track
  // is waiting on a date", which drives everything — the safe direction. The
  // unsafe one would be holding live work out of the sweep because a read blipped.
  if (memberErr || !members) return out;

  const newestByTrack = new Map<string, string>();
  for (const m of members as Array<{ track_id: string; artifact_id: string }>) {
    // Rows arrive newest-first, so the first one seen per track is the newest.
    if (!newestByTrack.has(m.track_id)) newestByTrack.set(m.track_id, m.artifact_id);
  }
  if (newestByTrack.size === 0) return out;

  const { data: decisions, error: decisionErr } = await db
    .from("decisions")
    .select("id,forecast_horizon_date")
    .in("id", [...newestByTrack.values()]);
  if (decisionErr || !decisions) return out;

  const horizonById = new Map<string, string | null>();
  for (const d of decisions as Array<{ id: string; forecast_horizon_date: string | null }>) {
    horizonById.set(d.id, d.forecast_horizon_date ?? null);
  }
  for (const [trackId, decisionId] of newestByTrack) {
    out.set(trackId, horizonById.get(decisionId) ?? null);
  }
  return out;
}
