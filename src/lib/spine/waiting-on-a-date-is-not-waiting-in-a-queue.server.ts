import type { SupabaseClient } from "@supabase/supabase-js";
import { aReadingCanBringLearnForward } from "./a-reading-can-bring-learn-forward";
import type { ForecastBand } from "./forecast-band";

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

/**
 * The newest unsuperseded artifact of one kind per track. Shared by both
 * readers below so "newest member" is resolved once and identically -- the same
 * reason `dueDatesFor` copies the driver's rule rather than inventing one.
 */
async function newestArtifactByTrack(
  db: SupabaseClient,
  trackIds: readonly string[],
  kind: "decision" | "prd",
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const { data, error } = await db
    .from("spine_track_members")
    .select("track_id,artifact_id,created_at")
    .in("track_id", trackIds as string[])
    .eq("artifact_kind", kind)
    .is("superseded_at", null)
    .order("created_at", { ascending: false });
  if (error || !data) return out;
  for (const m of data as Array<{ track_id: string; artifact_id: string }>) {
    if (!out.has(m.track_id)) out.set(m.track_id, m.artifact_id);
  }
  return out;
}

/**
 * ── P-144 SCOPE 3. A RECORDED NUMBER CAN BRING LEARN BACK BEFORE ITS DATE ──
 *
 * The tracks whose wait a reading has settled, so the sweep stops holding them.
 * The rule itself is `aReadingCanBringLearnForward` and is NOT restated here:
 * this function only fetches what that predicate needs.
 *
 * ── WHY THIS IS NOT THE ONLY HALF, AND THE OTHER HALF IS THE IMPORTANT ONE ──
 * Filtering here is necessary and would have been useless alone. The sweep's
 * own SQL carries `deferred_until.is.null,deferred_until.lte.now`, so a track
 * already deferred to October is **never fetched**, never reaches this
 * function, and a number recorded today would sit unread until the horizon it
 * was supposed to bring forward. So `recordMetricReading` clears
 * `deferred_until` when the reading lifts, and this makes the sweep agree once
 * the row comes back. A lift written in only one of the two places is a lift
 * that never happens.
 *
 * ── THE FAILED-READ DIRECTION IS THE OPPOSITE OF `dueDatesFor`'s, ON PURPOSE ──
 * An empty map from `dueDatesFor` drives everything, which is safe because
 * driving a track costs a slot. An empty set HERE holds everything to its date,
 * which is safe for the same reason read the other way: a failed read must
 * never manufacture an early grade. Both directions refuse to act on a read
 * they did not get.
 */
export async function tracksAReadingBringsForward(
  db: SupabaseClient,
  trackIds: readonly string[],
): Promise<Set<string>> {
  const out = new Set<string>();
  if (trackIds.length === 0) return out;

  const [decisionByTrack, prdByTrack] = await Promise.all([
    newestArtifactByTrack(db, trackIds, "decision"),
    newestArtifactByTrack(db, trackIds, "prd"),
  ]);
  // A track needs both a spec to carry the reading and a decision to carry the
  // band. Missing either is not a lift and is not an error.
  const live = [...prdByTrack.keys()].filter((t) => decisionByTrack.has(t));
  if (live.length === 0) return out;

  const [{ data: prds }, { data: decisions }] = await Promise.all([
    db
      .from("prds")
      .select("id,contract")
      .in(
        "id",
        live.map((t) => prdByTrack.get(t)!),
      ),
    db
      .from("decisions")
      .select(
        "id,forecast_direction,forecast_band_drifting_at,forecast_band_missed_at,forecast_observations",
      )
      .in(
        "id",
        live.map((t) => decisionByTrack.get(t)!),
      ),
  ]);
  if (!prds || !decisions) return out;

  const contractById = new Map<string, unknown>(
    (prds as Array<{ id: string; contract: unknown }>).map((r) => [r.id, r.contract]),
  );
  const bandById = new Map<string, ForecastBand>();
  for (const d of decisions as Array<Record<string, unknown>>) {
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    const dir = d.forecast_direction;
    bandById.set(String(d.id), {
      direction: dir === "higher-is-better" || dir === "lower-is-better" ? dir : null,
      driftingAt: num(d.forecast_band_drifting_at),
      missedAt: num(d.forecast_band_missed_at),
      observations: num(d.forecast_observations),
    });
  }

  for (const trackId of live) {
    const contract = contractById.get(prdByTrack.get(trackId)!);
    const band = bandById.get(decisionByTrack.get(trackId)!) ?? null;
    if (aReadingCanBringLearnForward(contract, band).lift) out.add(trackId);
  }
  return out;
}
