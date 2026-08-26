import type { Track } from "@/lib/spine/track.functions";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";

/**
 * SPINE WORK AS BOARD ROWS, so the board shows every piece of work in flight.
 *
 * THE HOLE THIS CLOSES, verified in the code before anything was written:
 * `/start` creates a `spine_tracks` row and NO mission (`startTrackCore`
 * inserts into `spine_tracks` only). Every read the board fed on —
 * `listMissions`, the studio sessions — never sees that work again. A person
 * who handed three things over at the product's own front door could see two
 * of them vanish from the very surface that answers "what is happening".
 * The founder's failure bar names this exactly: having to open each thing to
 * learn whether any of it needs you.
 *
 * WHERE THE DATA COMES FROM. `listTracks` — the same read the shell's live
 * line and rail presence already poll under the shared
 * `["shell","open-tracks"]` key. Mounting this costs no new request while the
 * shell is up, and the shell drives its cadence.
 *
 * THE MERGE RULE, and why it is subtraction-first: a mission that knows its
 * track (`MissionListRow.trackId`) is ALREADY a row here; its track must not
 * become a second row saying the same thing twice. Known ids are removed
 * before any grouping.
 *
 * THREE DESTINATIONS, MATCHING THE FEED'S OWN SECTIONS so a reader merges
 * nothing in their head:
 *
 *   waiting on you   `holdReason === "waiting-on-a-person"` — the loop
 *                    stopped for a call, the same need the replies section
 *                    serves for mission runs.
 *   running          open and driven inside the freshness window the rest of
 *                    the product already uses (`IDLE_AFTER_MS`, ten minutes,
 *                    derived from the spine tick). An open track driven
 *                    longer ago than that still shows here — honestly stale,
 *                    carrying how long since it last moved — because "stopped
 *                    for a reason nobody named" is a live fact about work,
 *                    and dropping it would repeat the quiet-graveyard defect.
 *   finished         status "done". "abandoned" draws nowhere: dead work is
 *                    the run page's history, not this surface's scan band.
 */

/** Ten minutes, the same idle boundary AgentInbox derives from the spine tick. */
export const TRACK_FRESH_MS = 10 * 60_000;

export type TrackRowKind = "waiting-on-you" | "running" | "finished";

export type TrackBoardRow = {
  id: string;
  /** Spine work fronts the one character; no seat name is carried or invented. */
  kind: TrackRowKind;
  title: string;
  /** Where the work stands, in the station's own plain word. */
  stationWord: string;
  /** Raw epoch ms of the last time anything touched it; 0 when never. */
  at: number;
  /** How long since it last moved, already formatted; null when never driven. */
  lastMoved: string | null;
  /** The stop reason verbatim, when the track is held on something else. */
  holdLine: string | null;
  /** The track's own watchable address. */
  trackId: string;
};

const PERSON_HOLD = "waiting-on-a-person";

export function trackToBoardRows(
  tracks: readonly Track[] | undefined,
  knownTrackIds: ReadonlySet<string>,
  formatAgo: (iso: string | null | undefined) => string | null,
): { waiting: TrackBoardRow[]; running: TrackBoardRow[]; finished: TrackBoardRow[] } {
  const waiting: TrackBoardRow[] = [];
  const running: TrackBoardRow[] = [];
  const finished: TrackBoardRow[] = [];
  if (!tracks) return { waiting, running, finished };

  const now = Date.now();
  for (const t of tracks) {
    // Already on the board through its mission: never twice.
    if (knownTrackIds.has(t.id)) continue;

    const base = {
      id: t.id,
      title: t.title,
      // The station's own plain name from the one catalog, so a board row and
      // the strip spell a station identically rather than each re-deriving it.
      stationWord: AGENT_STATIONS[t.station]?.name ?? t.station,
      at: Date.parse(t.updatedAt) || 0,
      trackId: t.id,
      lastMoved: null as string | null,
      holdLine: null as string | null,
    };

    if (t.status === "done") {
      finished.push({ ...base, kind: "finished", lastMoved: formatAgo(t.drivenAt ?? t.updatedAt) });
      continue;
    }
    if (t.status !== "open") continue;

    if (t.holdReason === PERSON_HOLD) {
      waiting.push({ ...base, kind: "waiting-on-you", holdLine: t.hold });
      continue;
    }

    const movedAt = t.drivenAt ? Date.parse(t.drivenAt) : NaN;
    const fresh = Number.isFinite(movedAt) && now - movedAt < TRACK_FRESH_MS;
    running.push({
      ...base,
      kind: "running",
      lastMoved: fresh ? (formatAgo(t.drivenAt) ?? "now") : formatAgo(t.drivenAt),
      // A hold that is NOT on the person means the work has stopped for its own
      // reason; carrying the reason keeps a stopped track from reading as a
      // merely slow one, which is the exact confusion the hold field exists to
      // prevent (spine_tracks.last_hold).
      holdLine: t.holdReason ? (t.hold ?? null) : null,
    });
  }

  const newest = (a: TrackBoardRow, b: TrackBoardRow) => b.at - a.at;
  return {
    waiting: waiting.sort(newest),
    running: running.sort(newest),
    finished: finished.sort(newest),
  };
}
