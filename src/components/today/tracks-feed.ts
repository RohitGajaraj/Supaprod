import type { Track } from "@/lib/spine/track.functions";
import { TERMINAL_HOLDS } from "@/lib/spine/correction";
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
 *   waiting on you   `holdReason === "waiting-on-a-person"`, the loop stopped
 *                    for a call, the same need the replies section serves for
 *                    mission runs. AND every `TERMINAL_HOLDS` reason, because
 *                    the sweep will never revisit those and one human press is
 *                    the only exit that exists. Both need a person; only one
 *                    of them used to say so.
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
  /**
   * THE FULL REASON, WHICH DOES NOT BELONG IN A ROW'S SCAN BAND.
   *
   * The driver writes real sentences and they are good ones, but they run to
   * 250 characters ("This station has been run many times over and the work has
   * not moved on once. That is the loop rather than any single run, so nothing
   * further will be spent on it until you look."). A row gives its state a
   * fixed slot beside a truncating title, so a paragraph there squeezes the
   * title away and breaks the row.
   *
   * So the row says the short fact and this carries the sentence to the line
   * UNDER it, which is exactly where `HandoverNote` already puts the thing a
   * row cannot hold. Nothing is shortened or reworded on the way: the driver's
   * copy is the product's voice and this file is not entitled to edit it.
   */
  reason: string | null;
  /** The track's own watchable address. */
  trackId: string;
};

const PERSON_HOLD = "waiting-on-a-person";

/**
 * PARKED WORK GOES TO THE PERSON, BECAUSE A PERSON IS THE ONLY EXIT.
 *
 * `TERMINAL_HOLDS` is the sweep's own list, imported rather than restated:
 * `track-tick` excludes these from selection and `decideDrive` refuses them
 * again, so a track holding one WILL NOT be driven, ever, without a human
 * press. Restating the list here would let the surface and the sweep drift
 * into disagreeing about what "cannot move" means, which is the failure
 * `parked-work-must-be-visible.test.ts` pins on the server half.
 *
 * Until now every one of them landed in RUNNING, because the only branch above
 * tested for `waiting-on-a-person`. So a track held on `given-up` sat in the
 * lane whose sentence is "waiting on an agent, not on you", when no agent was
 * ever coming. S4 measured eight of the nine real open tracks in that state on
 * 2026-08-27, one of them across 316 drives.
 *
 * That is the silence `getParkedWork` was written to end, arriving on the
 * board from the other direction: not a missing count, a row in the wrong lane.
 */
function cannotMove(holdReason: string | null | undefined): boolean {
  return !!holdReason && (TERMINAL_HOLDS as readonly string[]).includes(holdReason);
}

/**
 * A track parked at Learn because its forecast is not due yet.
 *
 * **Both halves are required.** `needs-evidence` anywhere else is a real stop —
 * `way-out.ts` answers it with *"Connect a source, or file the missing input by
 * hand"* — and only at `learn` does it mean the horizon has not arrived. S1's
 * `TrackStart.tsx` tests exactly this pair for the same reason.
 */
function waitingOnTime(t: { station: string; holdReason: string | null | undefined }): boolean {
  return t.holdReason === "needs-evidence" && t.station === "learn";
}

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
      reason: null as string | null,
    };

    if (t.status === "done") {
      finished.push({ ...base, kind: "finished", lastMoved: formatAgo(t.drivenAt ?? t.updatedAt) });
      continue;
    }
    if (t.status !== "open") continue;

    if (t.holdReason === PERSON_HOLD || cannotMove(t.holdReason)) {
      /*
       * PARKED WORK SAYS "NEEDS A RESTART". RULED, NOT CHOSEN (A10).
       *
       * Both halves of this line matter and they say different things:
       *   answerable  -> "waiting on your answer"  (a gate; there IS a thing to press)
       *   parked      -> "needs a restart"         (nothing was asked; the loop
       *                                             ran out of road and will not
       *                                             try again on its own)
       *
       * THE WORD CHANGED FROM "stopped, needs you" ON 2026-08-31, and the
       * reason is §12 rather than taste. The rename map already spends
       * **"Waiting for you"** on Approvals — a queue of ANSWERABLE items — so
       * any parked row wearing a waiting-on-you phrase sends a person who has
       * learned this product's vocabulary hunting for something to answer.
       * There is nothing there: S1 measured **36 of 37** tracks carrying that
       * chip as terminal holds, exactly one as `waiting-on-a-person`.
       *
       * I argued the other side and it lost to a COLLISION rather than to being
       * wrong — a person genuinely is the only exit on all 36, which is why
       * parked work stays in the person's lane here. S4 measured eight of nine
       * real open tracks filed under "waiting on an agent" when no agent was
       * ever coming, and that is not being undone.
       *
       * The exact string matches `run-tab.ts`'s chip, lowercased for this slot,
       * because a state named two ways on two surfaces is §12's own stated
       * failure: a word renamed in one place and left stale in another.
       */
      waiting.push({
        ...base,
        kind: "waiting-on-you",
        holdLine: cannotMove(t.holdReason) ? "needs a restart" : "waiting on your answer",
        reason: t.hold ?? null,
      });
      continue;
    }

    const movedAt = t.drivenAt ? Date.parse(t.drivenAt) : NaN;
    const fresh = Number.isFinite(movedAt) && now - movedAt < TRACK_FRESH_MS;
    running.push({
      ...base,
      kind: "running",
      lastMoved: fresh ? (formatAgo(t.drivenAt) ?? "now") : formatAgo(t.drivenAt),
      /* A hold that is NOT on the person means the work stopped for its own
         reason, and carrying that reason keeps a stopped track from reading as
         a merely slow one, which is the confusion the hold field exists to
         prevent (spine_tracks.last_hold).
         SPLIT THE SAME WAY THE WAITING ROWS ARE. The reason is a full sentence
         from the driver and runs past 200 characters; the row's state slot is a
         few words wide and truncates. "held" keeps the fact in the scan band
         and the sentence goes underneath, in full, which beats the same
         sentence clipped mid-word. */
      /*
       * A CALENDAR WAIT IS NOT A STOPPAGE, AND IT IS NOT AN AGENT EITHER.
       *
       * This row sits in the lane headed *"Waiting on an agent, not on you."*
       * For a track parked at Learn on an undated forecast, **no agent is
       * coming** — and the hold's own sentence says so in as many words:
       * *"The forecast this work is graded against comes due on 2026-10-15.
       * Learn returns when it does; nothing here is waiting on a person."*
       * A row reading "held" under that header contradicts the sentence drawn
       * directly beneath it.
       *
       * IT IS THE SAME DEFECT AS S4-043 AND A10, ONE STATION FURTHER ON: work
       * filed under "waiting on an agent" when nothing is on its way. The
       * difference is that this one cannot go to the person's lane either —
       * a person cannot grade a forecast whose horizon has not arrived. It is
       * a third thing, and it is waiting on the calendar.
       *
       * THE WORD IS S1'S AND IS REUSED RATHER THAN INVENTED. `TrackStart.tsx`
       * already ruled it (queue 67): *"a learn hold whose reason is an undated
       * forecast is a calendar wait, not a stoppage"* → **"Waiting on time"**.
       * Lowercased for this slot, exactly as A10's "needs a restart" matches
       * `run-tab.ts`'s chip — a state named two ways on two surfaces is §12's
       * own stated failure.
       *
       * THE DATE DID NOT COME FREE, AND DRIVING IS WHAT TOLD ME. I wrote here
       * that `reason` already carried the horizon. **It did not.** On the live
       * board this row's second line read *"Learn has nothing to work from…
       * Connect a source, or file the missing input by hand"* — `way-out.ts`'s
       * generic `needs-evidence` answer — **telling a person to act, directly
       * under a line saying nothing is waiting on a person.** The date appeared
       * zero times.
       *
       * The cause is one field. `hold` is *"prose… a sentence built from"* the
       * reason; **`holdBecause` is "the DRIVER'S OWN SENTENCE … stored
       * verbatim"**, and since F-175 that is the one naming the horizon. This
       * lane drew `hold` for every state. For THIS state it draws `holdBecause`
       * when there is one, because the generic sentence does not merely fail to
       * add the date — it contradicts the row above it.
       *
       * **Scoped deliberately to this state.** `hold` stays the sentence for
       * every other hold, where it is the reader-facing one and no
       * contradiction exists; swapping it everywhere is a wider change than the
       * evidence supports.
       *
       * MEASURED 2026-08-31, and it is not hypothetical: `d2263583` reached
       * `learn` at 17:31:31 under sweep — the FIRST track ever to walk there
       * with zero presses — and its forecast is due in **45 days**. Before this
       * line it read "held" for all forty-five of them.
       */
      holdLine: waitingOnTime(t) ? "waiting on time" : t.holdReason ? "held" : null,
      reason: waitingOnTime(t)
        ? (t.holdBecause ?? t.hold ?? null)
        : t.holdReason
          ? (t.hold ?? null)
          : null,
    });
  }

  const newest = (a: TrackBoardRow, b: TrackBoardRow) => b.at - a.at;
  return {
    waiting: waiting.sort(newest),
    running: running.sort(newest),
    finished: finished.sort(newest),
  };
}
