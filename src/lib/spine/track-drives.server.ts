/**
 * F-62. THE ONE WRITE PATH FOR "SOMEBODY ASKED FOR THIS DRIVE".
 *
 * `stage_events` records TRANSITIONS. This records DRIVES, and they are not the
 * same population: measured on 2026-08-25, 2,199 `agent_runs` carry a `track_id`
 * against 127 `stage_events` rows of `entity_type='spine_track'`, so **roughly
 * 94% of drives move no station and leave no transition row**.
 *
 * `spine_tracks.last_driven_via` was added to catch that 94% and it is ONE SLOT.
 * A person presses run on a stalled track at 10:05; the unattended sweep drives
 * it at 10:15; the column reads `sweep`. The next tick erases the evidence of
 * the intervention it should disqualify, and what is left is not "does not know"
 * but a surviving claim of autonomy — the direction F-55 exists to fail away
 * from. Intervention was stored in a slot, and it needs a log.
 *
 * WHY NOT A SAME-STATION `stage_events` ROW, which is the cheap answer: it
 * breaks four readers, and two of them silently. `readCorrections` reads the
 * newest 50 spine_track rows, so at 144 drives a day a real correction falls out
 * of the window inside six hours and `MAX_TRACK_CORRECTIONS` stops being
 * reachable; `rememberCorrectionFix` stops firing with it. `stationFiledSinceArrival`
 * reads the newest row with `to_stage = station` as the ARRIVAL time, so an entry
 * row makes arrival "now" and every resumed station reads `produced-nothing` on
 * its way to `given-up` — a stall, caused by the fix for criterion 2's proof.
 * And the transcript draws every transition as a station move. Full reasoning is
 * in migration `20260825130000`.
 *
 * FAIL-SAFE BY CONTRACT, on `recordStageEvent`'s convention: recording a drive
 * must never break the drive, so this swallows and logs its own failures.
 *
 * THE COST OF THAT, AND IT IS REAL. A failed write leaves NO ROW, and a missing
 * row reads as "no drive happened" — the unsafe direction, where `stage_events`
 * fails to a NULL that reads as "does not know". So this log is a witness, not
 * an oracle: `spine_tracks.last_driven_via` is deliberately still written beside
 * it and still means "how this track was last driven", and if it disagrees with
 * the newest row here then the log lost something and the run is not provable.
 * Two records that must agree is the check; one record that cannot be wrong is
 * not available at this price.
 */

import type { DrivenVia, HoldReason } from "@/lib/spine/driver";

export interface TrackDriveInput {
  trackId: string;
  /** Where the drive FOUND the work. A drive that moves nothing has no destination. */
  station: string;
  /**
   * REQUIRED, for the reason `driveTrackOnce`'s own `via` parameter is required:
   * a default answers for a caller that never considered the question, and the
   * answer it invents is the one that claims autonomy.
   */
  via: DrivenVia;
  /**
   * The hold the track was sitting on when this drive arrived, or null when it
   * was not held. This is what makes an intervention legible AS one — a `press`
   * against a non-null hold is a person reaching for a stalled track, which is
   * the sentence acceptance criterion 2 forbids.
   */
  entryHold?: HoldReason | null;
}

// The generated Database types lag new tables until the next regeneration, so
// the client is cast once here and the call site stays clean —
// `stage-events.server.ts`'s precedent, for the same reason.
interface TrackDrivesClient {
  from(table: string): {
    insert(values: Record<string, unknown>): {
      select(cols: string): {
        maybeSingle(): PromiseLike<{
          data: { id?: string } | null;
          error: { message: string } | null;
        }>;
      };
    } & PromiseLike<{ error: { message: string } | null }>;
    update(values: Record<string, unknown>): {
      eq(col: string, val: string): PromiseLike<{ error: { message: string } | null }>;
    };
  };
}

/**
 * Returns the row's id, or null when the write did not land.
 *
 * The id exists so the drive can be COMPLETED later -- `recordSelfCheck` below
 * writes what the station's own check compared, which is not known until the
 * drive is over. Returning null rather than throwing keeps the fail-safe
 * contract in the header: a caller that cannot log the second half must still
 * not break the drive.
 */
export async function recordTrackDrive(
  client: unknown,
  drive: TrackDriveInput,
): Promise<string | null> {
  try {
    const { data, error } = await (client as TrackDrivesClient)
      .from("track_drives")
      .insert({
        track_id: drive.trackId,
        station: drive.station,
        driven_via: drive.via,
        entry_hold: drive.entryHold ?? null,
      })
      .select("id")
      .maybeSingle();
    if (error) {
      // Loud on purpose. A silent logging fault would leave the drive log
      // quietly short, and a short log reads as an unattended run.
      console.error(`track_drives write failed (track ${drive.trackId}): ${error.message}`);
      return null;
    }
    return data?.id ?? null;
  } catch (e) {
    console.error(
      `track_drives write threw (track ${drive.trackId}): ${e instanceof Error ? e.message : String(e)}`,
    );
    return null;
  }
}

/**
 * WHAT THIS STATION'S OWN CHECK COMPARED, WRITTEN ONTO THE DRIVE IT BELONGS TO.
 *
 * Separate from `recordTrackDrive` because of WHEN each is known. The drive row
 * is written at the START, before anything can fail, which is what makes it
 * evidence that a drive was attempted at all. The self-check runs at the END. A
 * single write would have to wait for the second, and then a crash mid-drive
 * would leave no row and the run would read as never having happened -- which is
 * the exact failure the header calls the unsafe direction.
 *
 * So: two writes, and the second is allowed to be missing. A drive row with a
 * NULL `self_check` means the check's result did not reach the record, and that
 * is a weaker claim than "it compared nothing" (`[]`) on purpose.
 */
export async function recordSelfCheck(
  client: unknown,
  driveId: string | null,
  checks: ReadonlyArray<{ what: string; held: boolean; why?: string }>,
): Promise<void> {
  if (!driveId) return;
  try {
    const { error } = await (client as TrackDrivesClient)
      .from("track_drives")
      .update({ self_check: checks })
      .eq("id", driveId);
    if (error) {
      console.error(`track_drives self_check write failed (drive ${driveId}): ${error.message}`);
    }
  } catch (e) {
    console.error(
      `track_drives self_check write threw (drive ${driveId}): ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
