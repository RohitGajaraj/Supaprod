import type { Track } from "@/lib/spine/track.functions";
import { STALL_MINUTES } from "@/lib/loop-health.functions";
import { formatElapsed } from "@/components/meridian/run-rows";
import { TERMINAL_HOLDS } from "@/lib/spine/correction";
import { waitingOnTime } from "@/components/track/a-calendar-wait-is-not-a-stoppage";
import { stoppedFor } from "@/components/meridian/stopped-for";
import { nothingHasPickedItUp } from "@/components/track/nothing-has-picked-it-up";
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import { holdLine } from "@/lib/spine/driver";
import { FORECAST_SAYS } from "@/components/learn/forecast-words";
import { joinPlainly } from "@/lib/spine/attach";
import { clockInZone } from "@/lib/time-of-day";

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
/* The predicate moved to `track/a-calendar-wait-is-not-a-stoppage`, because the
   run screen needed it too and was saying the same state four different ways
   without it. One writer, two readers. */

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
      /* Same rule on the finished lane: the moment it finished is a state
         change, and `updated_at` is when that happened. `drivenAt` remains the
         fallback only for a row that somehow carries no `updatedAt`. */
      finished.push({ ...base, kind: "finished", lastMoved: formatAgo(t.updatedAt ?? t.drivenAt) });
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

    /*
     * "MOVED" MUST MEAN MOVED, AND THIS READ `drivenAt` UNTIL 2026-09-01.
     *
     * The row renders this as **"· moved 2m ago"**. `driven_at` advances every
     * time the sweep picks the track up **whether or not anything changed**, so
     * that sentence was a freshness claim the data does not support.
     *
     * **Measured, service-role: 58 of 62 open tracks have `driven_at` later
     * than their own `updated_at` — 57 by more than five minutes, and the worst
     * gap is 23.5 DAYS.** A row saying "moved 2m ago" about work that last
     * actually changed three weeks ago is fabricated progress, which §0.6
     * standard #7 and §1's third property both delete a feature over.
     *
     * `updatedAt` is when the state changed. It is NOT bumped by a no-op drive
     * — those 58 rows are the proof — so it is the only one of the two that can
     * carry this word.
     *
     * **The attempt is still worth knowing and is NOT lost:** a track being
     * driven and not moving is exactly what `holdLine` and the driver's own
     * sentence underneath report, and S4-179 measured the same shape from the
     * sweep's side. This line stops claiming the attempt was a change.
     */
    const movedAt = t.updatedAt ? Date.parse(t.updatedAt) : NaN;
    const fresh = Number.isFinite(movedAt) && now - movedAt < TRACK_FRESH_MS;
    running.push({
      ...base,
      kind: "running",
      lastMoved: fresh ? (formatAgo(t.updatedAt) ?? "now") : formatAgo(t.updatedAt),
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

/**
 * ── THE ROWS ON `/start`, AND THE ONE COLUMN THAT DECIDES WHETHER THEY WORK ─
 *
 * A1-REPORT §4: *"your runs as rows: title · Strategist is writing the decision ·
 * 0:34, or Produced spec, prototype, PR #14 · verdict: did what it said, or
 * Needs you: approve the PR."* The middle column is the row. Cursor's task list,
 * which this borrows its shape from, carries a diff stat there because that is
 * the fact that distinguishes one of its rows from another; ours is what the run
 * is doing, because that is what distinguishes ours.
 *
 * ── THE DISCRIMINATOR RULE IS THE ACCEPTANCE, NOT A NICETY ────────────────
 * *"no two rows print an identical middle column unless the fact is identical."*
 * A list of eight rows all reading "At Build" tells a person nothing and reads as
 * a bug in the record, which is the defect the prototype list on the run screen
 * was repaired for two hours ago. So every branch below reaches for the SHARPEST
 * fact it can source, and only falls back when the sharper one has no row:
 *
 *   a gate open        the tool it is waiting on, named
 *   a seat in flight   the seat, its verb, and its own clock
 *   settled            what it filed, counted by kind
 *   held               the driver's own sentence at the stop
 *   none of those      where it stands and when it last moved
 *
 * Nothing here invents. A seat with no tool call yet says "is working" rather
 * than a verb nobody wrote down, and a run that filed nothing says so.
 */
export type StartRowInput = {
  id: string;
  title: string;
  status: "open" | "done" | "abandoned";
  /** The raw station, for `holdLine`'s station substitution. */
  station?: AgentStation | null;
  /** The verdict on this run's bet, once anything has graded it. */
  forecast?: { resolution: string; rationale: string | null } | null;
  stationName: string;
  updatedAt: string;
  drivenAt: string | null;
  holdReason: string | null;
  holdBecause: string | null;
  working: {
    seat: string;
    since: string;
    tool: string | null;
    /** The seat's verb and object in the strip's own words (Lane 3, 4d50df6ac). */
    verb?: string | null;
    objectLabel?: string | null;
    /** When the seat's newest call happened, for the quiet-past-stall line. */
    lastCallAt?: string | null;
  } | null;
  needsYou: { tool: string } | null;
  produced: Array<{ kind: string; count: number }>;
  /** When a person said this one goes first, or null. */
  pinnedAt?: string | null;
  /** When this track's own work first reached production, or null (P-126,
   *  A-QUEUE.md). */
  liveSince?: string | null;
  /** What this run has debited from `credit_ledger`, or null when nothing has
   *  (P-140, A-QUEUE.md). */
  credits?: number | null;
};

export type StartRowKind = "needs-you" | "running" | "finished" | "abandoned" | "waiting";

export type StartRow = {
  id: string;
  title: string;
  kind: StartRowKind;
  /** The one sentence that says what this run is doing or what it got you. */
  middle: string;
  /** The driver's own longer sentence behind `middle`, when there is one. */
  detail: string | null;
  /** Where it stands, for the row's Journey mark. */
  station: AgentStation | null;
  /** When, for the right-hand column. */
  at: number;
  /** A person put this one first. Ordered by when they said it. */
  pinnedAt: number | null;
  /** "1,234 credits", or null when nothing has been debited yet -- a real,
   *  common answer, never a fabricated zero (P-140, A-QUEUE.md). */
  creditsLine: string | null;
};

/** "1,234 credits" / "1 credit", the plural rule already in use everywhere
 *  else this product states a credits figure (settings, payments). */
export function creditsWord(n: number): string {
  return `${n.toLocaleString()} ${n === 1 ? "credit" : "credits"}`;
}

/**
 * The order a person needs, which is not the order the database has.
 *
 * Needs-you first because it is the only kind that is blocked ON THEM; running
 * next because it is the only kind that is changing; then finished, which is
 * what they came to read; then abandoned, which is the only kind that is over
 * and did not arrive anywhere. Within a kind, newest first.
 */
const RANK: Record<StartRowKind, number> = {
  "needs-you": 0,
  running: 1,
  waiting: 2,
  finished: 3,
  abandoned: 4,
};

function kindOf(r: StartRowInput): StartRowKind {
  if (r.needsYou) return "needs-you";
  if (r.working) return "running";
  if (r.status === "done") return "finished";
  if (r.status === "abandoned") return "abandoned";
  return "waiting";
}

/** `mm:ss` for a clock under ten minutes, `Nm` above it. A run's own age. */
/**
 * ONE CLOCK FOR ONE SEAT. This printed mm:ss while the strip and the road,
 * sixty pixels away, printed Meridian's own "9.1s" / "2m 10s" for the same
 * instant (third review, 2026-09-08). Every clock in the product is now the
 * one formatter, `formatElapsed`.
 */
export function runClock(sinceIso: string, now: number): string | null {
  const started = Date.parse(sinceIso);
  if (!Number.isFinite(started) || started > now) return null;
  return formatElapsed((now - started) / 1000);
}

export function startRowMiddle(
  r: StartRowInput,
  now: number,
  /** `KIND_WORD`-style display words, injected so this module stays pure. */
  words: Readonly<Record<string, { one: string; many: string }>>,
  /** A tool name to a plain phrase, injected for the same reason. */
  phraseFor: (tool: string) => string | null,
  /** The person's own zone (P-130), for the "Live since" clock. Defaults to
   *  the browser's when the caller has not resolved one. */
  zone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): string {
  return r.liveSince
    ? `Live since ${clockInZone(r.liveSince, zone)} · ${startRowRest(r, now, words, phraseFor)}`
    : startRowRest(r, now, words, phraseFor);
}

/**
 * Everything `startRowMiddle` said before P-126 gave a shipped track its own
 * lead. Split out rather than inlined so the "Live since" prefix is one
 * `if` at the top instead of five, one per branch below.
 */
function startRowRest(
  r: StartRowInput,
  now: number,
  words: Readonly<Record<string, { one: string; many: string }>>,
  phraseFor: (tool: string) => string | null,
): string {
  if (r.needsYou) {
    /*
     * "BEFORE", AND IT IS WHAT LETS ONE VOCABULARY SERVE BOTH BRANCHES.
     *
     * The product's tool words are present participles -- "merging the pull
     * request", "writing the spec" -- because they were written for a character
     * saying what it is doing. A gate is the other grammar: the call stands
     * BEFORE the tool runs. Rather than a second map of imperatives to keep in
     * step with the first, the sentence says what is actually true: you are
     * needed before this happens. It also states the gate more precisely than
     * "approve the pull request" would, because approving is one of the two
     * answers and refusing is the other.
     */
    const what = phraseFor(r.needsYou.tool);
    return what ? `Needs you before ${what}` : "Needs you: a call is waiting";
  }

  if (r.working) {
    const clock = runClock(r.working.since, now);
    /* ONE VOCABULARY FOR ONE CALL (third review, 2026-09-08). The strip, the
       rail and the header say nowPerTrace's verb and object; the row said a
       different phrase for the same call from its own tool table. The
       server's verb wins; the table stands only for a row the server has
       not yet described. A seat that has called nothing YET is a real state
       and gets its own words: "is working" claims exactly what the row
       supports. */
    const verb = r.working.verb ?? (r.working.tool ? phraseFor(r.working.tool) : null);
    const object = r.working.verb && r.working.objectLabel ? ` ${r.working.objectLabel}` : "";
    const doing = verb ? `${r.working.seat} is ${verb}${object}` : `${r.working.seat} is working`;
    /* Quiet past the stall threshold: the sentence says so instead of a
       clock that keeps counting a seat that has stopped. */
    const last = r.working.lastCallAt ?? r.working.since;
    const quietMs = last ? now - Date.parse(last) : NaN;
    if (Number.isFinite(quietMs) && quietMs > STALL_MINUTES * 60_000) {
      return `${doing} · quiet for ${Math.round(quietMs / 60_000)} min`;
    }
    return clock ? `${doing} · ${clock}` : doing;
  }

  /*
   * -- WHETHER THE BET HELD OUTRANKS WHAT THE RUN PRODUCED (P-04) ----------
   *
   * A finished row said "Produced 2 specs and 1 decision". That is inventory:
   * true, countable, and not the thing anybody came to this list to learn. What
   * this product exists to tell somebody is whether what the work PREDICTED
   * turned out to be true.
   *
   * It was the best sentence available until now only because there was never a
   * verdict to say: `learning.record` read three forecast columns and wrote none
   * of them back, so no run in this product's history had a graded bet. The
   * grader is wired (P-04), so this row can finally lead with the answer.
   *
   * `FORECAST_SAYS` and not a fourth vocabulary. The packet asked for "held /
   * missed / cannot tell"; the product already says "you called it", "it went
   * the other way", "the evidence did not settle it", and `forecast-words.ts`
   * carries an explicit rule that two surfaces must never call one thing two
   * things. A third set of words for the same three states is the drift that
   * file exists to prevent, so the packet's wording is deliberately not used and
   * the reason is written here rather than left to be rediscovered.
   *
   * NOT mapped onto the spec-outcome verdicts either, for the reason
   * `forecast-words.ts` states at length: a forecast can be a hit while the spec
   * outcome is a miss, both correct at once, and a mapping would silently pick a
   * winner.
   */
  if (r.forecast && (r.status === "done" || r.status === "abandoned")) {
    const said = FORECAST_SAYS[r.forecast.resolution as keyof typeof FORECAST_SAYS];
    /* An unknown value degrades to the produced sentence below rather than
       printing a raw slug: `forecast_resolution` is a text column, and a value
       written by a newer deploy must not reach a person as `hit`. */
    if (said) return `The forecast was graded: ${said}.`;
  }

  if (r.produced.length > 0 && (r.status === "done" || r.status === "abandoned")) {
    /*
     * P-18 (A-QUEUE.md): THE SAME COUNT, THE SAME WORD, THE SAME JOIN AS THE
     * RUN SCREEN'S OWN STRIP. This used to drop the leading number for a count
     * of one ("Produced spec" rather than "Produced 1 spec") and join with a
     * bare comma ("2 specs, 1 decision"), while `whatItProduced`
     * (`components/track/what-it-produced.ts`, the run screen's own per-station
     * produced sentence) always states the count and joins with `joinPlainly`
     * ("2 specs and 1 decision") -- the same convention `describeAttachments`
     * (`spine/attach.ts`) and the chain's own whole-run sentence use. Two
     * surfaces counting the same `spine_track_members` rows must not disagree
     * on how many of a kind of thing "1 spec" is worth mentioning by number.
     */
    /*
     * THIS COUNTS FILINGS, AND THE RUN SCREEN COUNTS THINGS. Known, measured,
     * and deliberately left (law 21). On 2026-09-10 the run screen began
     * folding by title -- "4 findings, 67 times" where this row says "Produced
     * 67 findings". They reconcile because the fold KEPT the 67, so a reader
     * who meets this row first meets its number again one click later as the
     * explanation rather than a correction.
     *
     * FOLDING THIS ROW IS NOT CHEAP AND THE CHEAP WAY OUT IS A DIFFERENT
     * QUESTION. Titles live in ten tables under `ARTIFACT_SOURCE`, each with
     * its own title column, so folding costs one `.in()` round trip PER KIND on
     * the home's largest read -- the one already measured at 2.7s and fought
     * over for round trips twice. `superseded_at` was checked as the free
     * version: on two of three measured tracks nothing is superseded while
     * titles repeat seventeen times over, because supersession is lineage
     * replacement and re-filing the same finding supersedes nothing.
     *
     * And this line only draws on a finished or abandoned run with no graded
     * forecast -- the branch above outranks it -- so it is the fallback of a
     * fallback. A round-trip tier on every arrival is the wrong price for it.
     */
    const parts = r.produced.map(({ kind, count }) => {
      const w = words[kind] ?? { one: kind, many: `${kind}s` };
      return `${count} ${count === 1 ? w.one : w.many}`;
    });
    return `Produced ${joinPlainly(parts)}`;
  }

  if (r.status === "done") return "Finished, and filed nothing";
  if (r.status === "abandoned") return "Abandoned";

  /*
   * HELD. A SHORT LINE FIRST, THE DRIVER'S OWN SENTENCE AS THE DETAIL.
   *
   * Lane 1, 2026-09-08. The driver writes a full explanation into
   * `last_hold_because` ("This station has been run many times over and the
   * work has not moved on once. That is the loop rather than any single run,
   * so nothing further will be spent on it until you look."), and the row
   * printed it whole. Five rows of that under a composer is the "dump of
   * text" the founder named. The row's job is one sentence a person can act
   * on; the driver's sentence is kept, verbatim, as the row's detail
   * (`StartRow.detail`, drawn as the tooltip and read by the run screen).
   */
  if (r.holdBecause && r.holdBecause.length <= ROW_LINE_MAX) return r.holdBecause;
  const short = shortHoldLine(r);
  if (short) return short;
  if (r.holdBecause) return r.holdBecause;
  /*
   * ── "STOPPED AT BUILD" TWICE, WALKED ON THE LIVE LIST ───────────────────
   *
   * Two rows printed exactly that, and by the letter of the discriminator rule
   * they were allowed to: both were held at Build with no `last_hold_because`,
   * so the facts really were identical. The rule was satisfied and the list was
   * still worse for it, because the sentence threw away the one fact the record
   * DID have -- WHY each stopped -- and replaced it with where.
   *
   * `HOLD_LINE` is the driver's own words for each reason and it has been on the
   * row all along. `given-up` and `needs-evidence` are different sentences, so
   * two rows that genuinely stopped for different reasons now say so, and two
   * that stopped for the same reason still agree, which is correct.
   *
   * The station is kept as the fallback's fallback: `holdLine` tolerates an
   * unknown string in that column (it is not an enum in the database), and a
   * reason this build has never heard of should degrade to where it stopped
   * rather than print a raw slug at a person.
   */
  if (r.holdReason) {
    return holdLine(r.holdReason, { station: r.station }) ?? `Stopped at ${r.stationName}`;
  }

  /*
   * ── "WAITING" IS A PROMISE, AND IT EXPIRES ────────────────────────────────
   *
   * A run with no hold is one the loop intends to pick up, so "Waiting at
   * Build" is the right sentence for the ten minutes after it was last driven.
   * It is not the right sentence a fortnight later.
   *
   * MEASURED ON THE LIVE DATABASE, 2026-09-09 16:17 UTC. Four open tracks
   * carry no hold at all and were last driven 14 days ago, and they are not
   * fixtures: one has 174 agent runs behind it, another 63, another 23. Every
   * one of them draws "Waiting at ..." on the home today. Nothing is coming,
   * and the row says the opposite of that in the one sentence it gets.
   *
   * This is `nothing-is-coming.ts` and `a-calendar-wait-is-not-a-stoppage.ts`
   * generalised: both exist because a surface called a state a WAIT when no
   * agent and no person was going to resolve it. The hold reasons taught this
   * lesson one at a time; the no-hold case never learned it, because there is
   * no reason string on the row to hang it from. The clock is the only witness
   * it has.
   *
   * ── THE BOUNDARY WAS WRONG FOR ONE DEPLOY, AND LANE 2 MEASURED IT ────────
   *
   * This first shipped on `isOverdue`, StalledWork's 24 hours, and the reason
   * given here was that the sweep re-reads every ten minutes so a day is "far
   * past any argument about cadence". That reasoning was not measured, and it
   * was wrong. Lane 2 scored 1,730 real gaps the loop has actually closed over
   * thirty days: p50 10.4 minutes, p90 99.9 minutes, **p99 about 2.07 days**.
   * A day is INSIDE the ordinary distribution, so the line would have called
   * routine sweep behaviour a stoppage -- a false alarm on the entry, which is
   * the exact class of defect this line exists to remove.
   *
   * `isOverdue`'s day is also a different question. Its docstring says what it
   * is for: *"past a day it has survived a night nobody looked"* -- a PERSON
   * being late. This asks whether the LOOP has stopped coming, a question
   * about a machine's cadence that the machine's own record answers. One
   * number across both would make one of them wrong.
   *
   * So it takes `nothingHasPickedItUp`, which owns that question for the run
   * screen too. Not merely the constant: the predicate also refuses to call a
   * track cold while `deferredUntil` is still in the future, which the inline
   * version here got wrong -- a run waiting on a date BY DESIGN would have
   * been reported as abandoned.
   *
   * IT STILL NAMES THE STATION. Where the work stands has not changed and is
   * still the first thing a reader wants; what is added is the fact that
   * changes what the station means.
   */
  if (!r.drivenAt) return "Not started yet";
  if (nothingHasPickedItUp({ drivenAt: r.drivenAt, nowMs: now })) {
    const drivenAt = Date.parse(r.drivenAt);
    return `Waiting at ${r.stationName}, and nothing has picked it up for ${stoppedFor(drivenAt, now)}.`;
  }
  return `Waiting at ${r.stationName}`;
}

/**
 * A ROW'S LINE IS ONE SENTENCE A PERSON CAN ACT ON, AND IT FITS ON A ROW.
 *
 * The driver's own sentence wins whenever it is short, because it names the
 * thing that has to change. Past this length it is an explanation, and the
 * row keeps it as the detail (tooltip) while printing the one line below.
 */
export const ROW_LINE_MAX = 100;

const HORIZON_DUE = /comes due on (\d{4}-\d{2}-\d{2})/i;

export function shortHoldLine(r: StartRowInput): string | null {
  const s = r.stationName;
  if (r.holdBecause) {
    const due = HORIZON_DUE.exec(r.holdBecause);
    if (due) return `Graded on ${due[1]}. Nothing to do until then.`;
  }
  switch (r.holdReason) {
    case "going-in-circles":
      return `${s} ran again and again without moving on. Look at it before more is spent.`;
    case "given-up":
      return `${s} was sent back for a fix and still cannot finish. It needs you.`;
    case "self-check-failed":
      return `${s} checked its own work and it did not pass.`;
    case "nothing-to-hand-on":
      return `${s} filed something, but not what the next step needs.`;
    case "the-call-is-yours":
      return "Nothing on the record bears on this, so the call is yours.";
    case "waiting-on-another-run":
      return `${s} is waiting on a file another run is writing.`;
    case "out-of-credit":
      return "The workspace is out of credits, so nothing ran.";
    case "tools-refused":
      return `${s} needs a tool it is not allowed to use.`;
    case "needs-a-waived-station":
      /* Seen live on Helio (2026-09-08): "Build cannot proceed without a
         spec or the tasks to build from, and Plan is waived on this route so
         nothing is going to file it. Put Plan back on the route, or file it
         yourself." The driver names the skipped step; the row keeps it as
         the detail and says the way out. `HoldCard` carries the control that
         actually puts it back, and only for THIS reason. */
      return `${s} needs a step this route skips. Put it back, or file it yourself.`;
    case "station-cannot-finish":
      /*
       * ── ITS OWN SENTENCE, BECAUSE IT IS ITS OWN PROBLEM ───────────────────
       *
       * This shared the line above and the advice was FALSE for it. The two
       * holds say different things in the driver's own words:
       *
       *   needs-a-waived-station  "nothing left on this route will move it on"
       *   station-cannot-finish   "another run would land in the same place"
       *
       * The first is a step the route skips, and putting it back is the fix --
       * `HoldCard` mounts that control, gated on that reason alone. The second
       * is a station that has what it needs and keeps finishing empty. No step
       * is missing, there is nothing to put back, and the run screen correctly
       * offers no such door. So the row was telling a person to go and find a
       * control that does not exist and should not.
       *
       * MEASURED: "My workspace" holds 8 runs and FOUR of them are on this
       * reason, so it was half that workspace's list giving the wrong
       * instruction.
       *
       * The replacement is the driver's own two facts, short enough for a row:
       * it keeps finishing with nothing, and retrying lands in the same place.
       * `last_hold_because` carries the fuller sentence with the attempt count
       * and reaches the row as its detail, so nothing is lost by not saying it
       * here -- it is 180 characters and the row's budget is 100.
       */
      return `${s} keeps finishing with nothing, and another run would land in the same place.`;
    case "carried-on-your-sentence":
      return null;
    default:
      return null;
  }
}

export function startRows(
  runs: readonly StartRowInput[],
  now: number,
  words: Readonly<Record<string, { one: string; many: string }>>,
  phraseFor: (tool: string) => string | null,
  /** The person's own zone (P-130). Defaults to the browser's. */
  zone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): StartRow[] {
  return (
    runs
      .map((r) => ({
        id: r.id,
        title: r.title,
        kind: kindOf(r),
        middle: startRowMiddle(r, now, words, phraseFor, zone),
        detail:
          r.holdBecause && r.holdBecause !== startRowRest(r, now, words, phraseFor)
            ? r.holdBecause
            : null,
        station: r.station ?? null,
        at: Date.parse(r.updatedAt) || 0,
        pinnedAt: r.pinnedAt ? Date.parse(r.pinnedAt) || null : null,
        creditsLine: r.credits && r.credits > 0 ? creditsWord(r.credits) : null,
      }))
      /*
       * ── A PIN OUTRANKS THE KIND, AND ONLY WITHIN WHAT IS STILL LIVE ────────
       *
       * The person said "this one first", so it goes first. But a pin on work
       * that is OVER cannot mean that: the sweep will never serve it, and putting
       * a finished run above a run waiting on an answer would make the list argue
       * with itself. So a pin sorts inside the live half of the list and the kinds
       * keep their order around it, which is the same reading the sweep has --
       * `pinned_at asc nulls last` applies to the tracks it can actually drive.
       *
       * Between two pins, the order they were made in, because that is the order
       * the person meant.
       */
      .sort((a, b) => {
        const live = (r: StartRow) => r.kind !== "finished" && r.kind !== "abandoned";
        if (live(a) && live(b) && (a.pinnedAt || b.pinnedAt)) {
          if (a.pinnedAt && b.pinnedAt) return a.pinnedAt - b.pinnedAt;
          return a.pinnedAt ? -1 : 1;
        }
        return RANK[a.kind] - RANK[b.kind] || b.at - a.at;
      })
  );
}

/**
 * ── TEN IDENTICAL ROWS ARE ONE FACT, AND THEY WERE FILLING THE PAGE ───────
 *
 * A1, walking Helio Labs 2026-09-02: ten rows reading *"PHASE 3: Verify visible
 * agency works"*, all Abandoned, all 26 Aug -- an e2e spec that pressed
 * production -- plus a dozen more abandoned rows, together filling the whole
 * page below the fold. The list a person came to read was underneath them.
 *
 * Two rules, and they are different rules for different reasons.
 *
 * ── ABANDONED WORK COLLAPSES, BECAUSE IT IS OVER ──────────────────────────
 * Every other kind on this list is a thing a person might act on. Abandoned work
 * is the one kind that is finished AND arrived nowhere: it is worth being able
 * to find and worth nothing at the top of a page. Closed by default, with the
 * count in the line that opens it, so nothing is hidden and nothing is in the
 * way.
 *
 * ── IDENTICAL TITLES FOLD, BECAUSE TEN OF THEM ARE ONE FACT ───────────────
 * And this is the discriminator rule reaching its limit. `startRowMiddle`
 * already gives two rows different sentences whenever the RECORD has different
 * facts; ten abandoned runs of one e2e spec genuinely have the same facts, so
 * there is no sentence that would tell them apart and inventing one would be the
 * opposite defect. When rows are identical AND over, the honest form is one row
 * that says how many.
 *
 * Folding is confined to the abandoned group on purpose. Live work with a
 * repeated title still gets its own row: a person may need to open the third
 * one specifically, and a count they cannot press is worse than a list.
 */
export type StartGroups = {
  /** Everything a person might act on, in the order they need it. */
  shown: StartRow[];
  /** Over and arrived nowhere. Folded, and closed until asked for. */
  abandoned: StartRow[];
  /** How many runs the abandoned group stands for, before folding. */
  abandonedCount: number;
};

export function groupStartRows(rows: readonly StartRow[]): StartGroups {
  const shown = rows.filter((r) => r.kind !== "abandoned");
  const over = rows.filter((r) => r.kind === "abandoned");

  const byTitle = new Map<string, StartRow & { count: number }>();
  for (const r of over) {
    const key = r.title.trim().toLowerCase();
    const held = byTitle.get(key);
    if (!held) {
      byTitle.set(key, { ...r, count: 1 });
      continue;
    }
    held.count += 1;
    /* The newest one owns the row: its id is what opening it should reach, and
       its time is the one worth printing. */
    if (r.at > held.at) {
      held.id = r.id;
      held.at = r.at;
    }
  }

  const folded = [...byTitle.values()]
    .map((r) => ({
      ...r,
      middle: r.count === 1 ? r.middle : `${r.count} runs, all abandoned`,
    }))
    .sort((a, b) => b.at - a.at);

  return { shown, abandoned: folded, abandonedCount: over.length };
}

/** The line that opens the group, which states what is behind it. */
export function abandonedLine(count: number): string {
  return `${count} abandoned · show ${count === 1 ? "it" : "them"}`;
}
