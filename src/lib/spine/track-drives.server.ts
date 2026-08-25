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
    insert(values: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
  };
}

export async function recordTrackDrive(client: unknown, drive: TrackDriveInput): Promise<void> {
  try {
    const { error } = await (client as TrackDrivesClient).from("track_drives").insert({
      track_id: drive.trackId,
      station: drive.station,
      driven_via: drive.via,
      entry_hold: drive.entryHold ?? null,
    });
    if (error) {
      // Loud on purpose. A silent logging fault would leave the drive log
      // quietly short, and a short log reads as an unattended run.
      console.error(`track_drives write failed (track ${drive.trackId}): ${error.message}`);
    }
  } catch (e) {
    console.error(
      `track_drives write threw (track ${drive.trackId}): ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
