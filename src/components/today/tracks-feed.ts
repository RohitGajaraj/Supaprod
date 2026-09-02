import type { Track } from "@/lib/spine/track.functions";
import { TERMINAL_HOLDS } from "@/lib/spine/correction";
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import { holdLine } from "@/lib/spine/driver";
import { joinPlainly } from "@/lib/spine/attach";

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
  stationName: string;
  updatedAt: string;
  drivenAt: string | null;
  holdReason: string | null;
  holdBecause: string | null;
  working: { seat: string; since: string; tool: string | null } | null;
  needsYou: { tool: string } | null;
  produced: Array<{ kind: string; count: number }>;
  /** When a person said this one goes first, or null. */
  pinnedAt?: string | null;
};

export type StartRowKind = "needs-you" | "running" | "finished" | "abandoned" | "waiting";

export type StartRow = {
  id: string;
  title: string;
  kind: StartRowKind;
  /** The one sentence that says what this run is doing or what it got you. */
  middle: string;
  /** When, for the right-hand column. */
  at: number;
  /** A person put this one first. Ordered by when they said it. */
  pinnedAt: number | null;
};

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
export function runClock(sinceIso: string, now: number): string | null {
  const started = Date.parse(sinceIso);
  if (!Number.isFinite(started) || started > now) return null;
  const secs = Math.floor((now - started) / 1000);
  if (secs < 600) return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  const mins = Math.floor(secs / 60);
  return mins < 120 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function startRowMiddle(
  r: StartRowInput,
  now: number,
  /** `KIND_WORD`-style display words, injected so this module stays pure. */
  words: Readonly<Record<string, { one: string; many: string }>>,
  /** A tool name to a plain phrase, injected for the same reason. */
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
    const verb = r.working.tool ? phraseFor(r.working.tool) : null;
    /* A seat that has called nothing YET is a real state and gets its own
       words. "is working" claims exactly what the row supports. */
    const doing = verb ? `${r.working.seat} is ${verb}` : `${r.working.seat} is working`;
    return clock ? `${doing} · ${clock}` : doing;
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
    const parts = r.produced.map(({ kind, count }) => {
      const w = words[kind] ?? { one: kind, many: `${kind}s` };
      return `${count} ${count === 1 ? w.one : w.many}`;
    });
    return `Produced ${joinPlainly(parts)}`;
  }

  if (r.status === "done") return "Finished, and filed nothing";
  if (r.status === "abandoned") return "Abandoned";

  /* HELD. The driver's own sentence when it wrote one, because it names the
     thing that has to change; the coarse reason cannot. */
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

  return r.drivenAt ? `Waiting at ${r.stationName}` : "Not started yet";
}

export function startRows(
  runs: readonly StartRowInput[],
  now: number,
  words: Readonly<Record<string, { one: string; many: string }>>,
  phraseFor: (tool: string) => string | null,
): StartRow[] {
  return (
    runs
      .map((r) => ({
        id: r.id,
        title: r.title,
        kind: kindOf(r),
        middle: startRowMiddle(r, now, words, phraseFor),
        at: Date.parse(r.updatedAt) || 0,
        pinnedAt: r.pinnedAt ? Date.parse(r.pinnedAt) || null : null,
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
