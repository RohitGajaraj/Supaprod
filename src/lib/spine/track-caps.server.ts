/**
 * The ceiling on one piece of work, end to end.
 *
 * WHY A THIRD CEILING EXISTS. `checkMissionCaps` already stops a run, and its
 * own header records why it had to be widened once before:
 *
 *   "`mission_spend_cap_usd` sits on agent_runs and record_mission_usage credits
 *    one run, so a ten hop mission got ten separate ceilings and could spend ten
 *    times the cap with every individual check passing. The column was a per-run
 *    ceiling wearing a mission name."
 *
 * That is now true one level up. The unit of UNATTENDED work is no longer a run
 * or a mission, it is a track: the driver walks one track through seven stations
 * with nobody watching, each station runs a crew of two or three agents, and
 * every station may be attempted up to `MAX_STATION_ATTEMPTS` times. Only Build
 * opens a mission, so six of the seven stations dispatch with `missionId = null`
 * and each of their runs carries its OWN independent ceiling that nothing sums.
 *
 * Measured on the live database on 2026-08-01: of fourteen driver runs, six had
 * a mission and eight did not. A single track pass is roughly sixteen runs, so
 * the effective headroom was sixteen times the per-run cap with every individual
 * check passing, and the tick drives five tracks at a time. Real spend is about
 * three cents a run, so nothing has actually run away; the point is that nothing
 * was stopping it, and the crew change tripled the rate behind that gap.
 *
 * SO THE CEILING SITS WHERE THE AUTONOMY SITS. A person starts a track and walks
 * away; the thing they need bounded is the track. This is the layer that makes
 * the autonomy story sayable, exactly as the mission cap was for missions:
 * GOVERNANCE-PRINCIPLE.md is explicit that arguing for more autonomy without a
 * ceiling is the one version a risk officer refuses.
 *
 * THE FAIL DIRECTION IS THE WHOLE DESIGN, and it is copied deliberately from
 * mission-caps.server.ts so the two behave alike. An unreadable workspace gets
 * the conservative built-in number, never `null`: `null` means "no ceiling", so
 * failing to `null` would let a database hiccup silently remove the limit.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Dollars one track may spend across every station, seat and retry.
 *
 * Sized from measurement, not from feel. A full pass is about sixteen runs at
 * roughly three cents, so about fifty cents; with every station retried to the
 * attempt ceiling it is nearer a dollar fifty. Five dollars is several times the
 * worst honest case, which is the right shape for a runaway guard: it should
 * stop a loop that has lost its mind and never interrupt real work.
 *
 * It is also a default the user never chose, which by the governance canon's
 * fourth floor makes it our decision rather than their policy, so it is visible
 * and changeable rather than quietly correct.
 */
export const DEFAULT_TRACK_SPEND_CAP_USD = 5.0;

/**
 * What a run that cannot be priced is charged.
 *
 * A run whose cost read fails must not be free, or an unreadable cost becomes
 * the way past the ceiling. It is charged generously instead: roughly eight
 * times an observed run, so a broken meter spends the budget quickly and the
 * track stops, rather than billing forever while the counter says zero.
 */
export const UNMEASURED_RUN_USD = 0.25;

/**
 * The spend ceiling for a track, resolved once per tick.
 *
 * Mirrors `resolveMissionSpendCap`: an explicit value wins, including an
 * explicit `null` meaning "no ceiling on this one", which is why the parameter
 * distinguishes `undefined` (nobody said) from `null` (somebody said none).
 */
export async function resolveTrackSpendCap(
  supabase: SupabaseClient,
  workspaceId: string | null | undefined,
  explicit: number | null | undefined,
): Promise<number | null> {
  if (explicit !== undefined) return explicit;
  if (!workspaceId) return DEFAULT_TRACK_SPEND_CAP_USD;

  try {
    const { data, error } = await supabase
      .from("workspaces")
      .select("default_track_spend_cap_usd")
      .eq("id", workspaceId)
      .maybeSingle();

    if (error || !data) return DEFAULT_TRACK_SPEND_CAP_USD;

    const raw = (data as { default_track_spend_cap_usd: number | string | null })
      .default_track_spend_cap_usd;

    // A workspace that deliberately cleared its ceiling gets none. That is a
    // human decision on the record, not an accident, so it is obeyed.
    if (raw === null) return null;

    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_TRACK_SPEND_CAP_USD;
  } catch {
    return DEFAULT_TRACK_SPEND_CAP_USD;
  }
}

/**
 * What one run actually cost, read back from its own row.
 *
 * The loop credits `agent_runs.spend_used_usd` as it goes, so this is the run's
 * own account of what it spent rather than an estimate. A run that cannot be
 * read is charged `UNMEASURED_RUN_USD`; see that constant for why it is not
 * zero.
 */
export async function costOfRun(
  supabase: SupabaseClient,
  runId: string | null | undefined,
): Promise<number> {
  if (!runId) return UNMEASURED_RUN_USD;
  try {
    const { data, error } = await supabase
      .from("agent_runs")
      .select("spend_used_usd")
      .eq("id", runId)
      .maybeSingle();
    if (error || !data) return UNMEASURED_RUN_USD;
    const n = Number((data as { spend_used_usd: number | string | null }).spend_used_usd ?? 0);
    return Number.isFinite(n) && n >= 0 ? n : UNMEASURED_RUN_USD;
  } catch {
    return UNMEASURED_RUN_USD;
  }
}

/** Has this track spent what it was allowed? `null` cap is never over. */
export function isOverTrackBudget(spent: number, cap: number | null): boolean {
  if (cap === null) return false;
  return spent >= cap;
}

/**
 * How long one tick may spend driving, before it stops handing out new seats.
 *
 * WHY IT EXISTS. `spine.track-tick` drives up to five tracks SEQUENTIALLY, and
 * since each station became a crew that is up to three agent dispatches per
 * station rather than one. Cloudflare Workers bound a request's wall clock, so
 * a tick that keeps starting seats eventually gets killed mid-flight. That is
 * not hypothetical: `job_runs` on 2026-08-01 held sense-tick and track-tick rows
 * stuck at `running`, 40 minutes stale, with no error recorded, which is exactly
 * what being killed between two writes looks like.
 *
 * A DEADLINE RATHER THAN A SMALLER CONSTANT. Capping tracks-per-tick lower would
 * trade throughput for safety at a number nobody can pick correctly: a station
 * whose crew is one fast reader and one that thinks for a minute cost wildly
 * different amounts. Checking the clock adapts to whatever the work actually
 * costs, and it degrades the right way, by doing less this tick rather than by
 * being killed halfway through one.
 *
 * Deliberately well under the platform limit. Being killed loses the writes that
 * record what was produced, so the margin is for finishing the bookkeeping of
 * the seat that IS running, not for squeezing in one more.
 */
/*
 * IT BOUNDS THE SWEEP AS WELL AS THE SEATS, since 2026-08-23, and the second
 * reader is the one that was missing.
 *
 * Everything above describes this deadline as a check BETWEEN SEATS inside one
 * track. That is where it was checked, and it left the sweep itself unbounded:
 * `track-tick` started every one of its five tracks whatever the clock said, and
 * `driveTrackOnce` stamps `driven_at` on every path out including the one where
 * it did nothing. So an unserved track had its ordering key rewritten, and the
 * next tick's `ORDER BY driven_at ASC` reproduced the previous order exactly.
 *
 * Stamping a track the tick never served is what froze the rotation. Measured:
 * eighteen consecutive ticks in the same order, one track at zero seats for two
 * hours fifty minutes. The sweep now checks this same predicate before starting
 * a track, so a track it cannot serve is left alone and sorts first next time.
 *
 * This is the file to open when someone asks why 45s does not bound a tick. It
 * still does not: the check happens BEFORE a seat, so the worst case remains
 * this deadline plus the longest single seat that starts just inside it.
 */
export const TICK_DEADLINE_MS = 45_000;

/** Has this tick used the wall clock it was given? */
export function outOfTime(startedAtMs: number, nowMs: number): boolean {
  return nowMs - startedAtMs >= TICK_DEADLINE_MS;
}
