import { Fragment, useEffect, useRef, useState } from "react";

import { formatDuration } from "@/components/studio/run-return";
import { agentDisplayName } from "@/lib/agent-vocabulary";

import { edgeMask } from "./SidebarNav";
import { StatusChip, type StatusWord } from "./StatusChip";
import {
  RUN_ROW,
  RUN_STACK,
  RunClock,
  RunClockEmpty,
  RunGlyph,
  RunMeta,
  RunNote,
  RunRail,
  RunRailBreak,
  RunSubject,
  RunTook,
  formatElapsed,
  type RunGlyphKind,
} from "./run-rows";
import { useElapsed } from "./use-elapsed";
import type { StationGlyphKind } from "./station-glyphs";

/*
 * THE RUN TIMELINE: what happened, when, and what the silences were.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 * Meridian had no time axis. `TaskRows` is a flat list of units of work with no
 * clock on it; `Thinking` is a step list that reports order and not hour. Both
 * answer "what did it do". Neither answers the question a product lead actually
 * opens the app with, which is a question about a MOMENT:
 *
 *   "what happened at 03:12, and what was it waiting on until 03:40?"
 *
 * THE GAPS ARE THE INFORMATION. A run that WORKED for 28 minutes and a run that
 * IDLED for 28 minutes waiting on a person produce the same list of steps and
 * mean opposite things. A list cannot tell them apart because a list has no space
 * between its rows. This one does: a silence past the floor below gets its own
 * row, its own duration, and a word for what was being waited on.
 *
 * ── THE RHYTHM IS NOT THIS FILE'S TO CHOOSE ─────────────────────────────
 * Every column, gutter, glyph size and type stop comes from `run-rows.tsx`, which
 * reads them off `Thinking`, the ported dense trace. This file decides WHAT goes
 * in each column and nothing about where the columns are.
 *
 * That is a correction. The first version of this component chose its own 38px
 * clock, its own 6px gutter and its own 13px glyph, and then put a silence row's
 * duration INLINE IN THE BODY while every event row put its time in the clock
 * column. Two number columns, one component, and no gate in this repo could see
 * it: it typechecked, it passed its tests, it cleared the ratchet.
 *
 * ── THE AXIS IS LITERAL IN ITS LABELS AND ORDINAL IN ITS SPACE ───────────
 * Every row prints its own wall clock, so the axis is readable to the minute.
 * What the rows do NOT do is take vertical space in proportion to elapsed time.
 * A proportional axis sounds more honest and is less so at both ends: a run with
 * a 40-minute wait and 200 tool calls two seconds apart would spend its whole
 * height on the wait and compress every event into a few pixels, so the detail a
 * reader came for becomes unreadable in order to draw a gap they can be told
 * about in four characters.
 *
 * ── NO PROGRESS BAR, EVER ───────────────────────────────────────────────
 * Live mode ticks an elapsed counter and nothing here implies a percentage. A
 * coding agent cannot know how long it will take.
 */

/**
 * HOW IT IS GOING. Six words onto the five status chips plus one silence.
 *
 * `done` carries NO chip, and that is the load-bearing decision. Most rows of a
 * healthy run are done, and a column of chips saying so would make the four rows
 * that mean something invisible. A finished step is stated by its subject and its
 * duration; a chip is for a state a reader has to do something about or wait on.
 *
 *   working  agent chip   a machine is working. Ambient, never urgent.
 *   gate     you chip     a person is required. Touch it and it moves.
 *   held     hold chip    stopped, and NOT on you: a condition has to change.
 *   failed   fail chip    an outcome, and the only thing red may mean here.
 *   passed   pass chip    an outcome that is provable. Rare on purpose.
 *   done     no chip      it finished and there is nothing left to say.
 */
export type TimelineState = "working" | "gate" | "held" | "failed" | "passed" | "done";

const CHIP: Partial<Record<TimelineState, StatusWord>> = {
  working: "agent",
  gate: "you",
  held: "hold",
  failed: "fail",
  passed: "pass",
};

/** The word each state wears, so the timeline and the tail cannot disagree. */
const WORD: Partial<Record<TimelineState, string>> = {
  working: "Running",
  gate: "Waiting on you",
  held: "On hold",
  failed: "Failed",
  passed: "Passed",
};

export type TimelineEvent = {
  id: string;
  /** Wall clock, ms since epoch. Printed, so it must be a real instant. */
  at: number;
  /**
   * WHAT KIND OF THING HAPPENED, and it decides the mark. Every one wears the
   * mark of the thing it names: a pull request the source host's, a fetch a
   * globe, a gate the person mark. See `run-rows.tsx` for the set.
   */
  kind: RunGlyphKind;
  /** Which station, when `kind` is "station". Drawn, never written as text. */
  station?: StationGlyphKind;
  /** What happened, in a reader's words. Never a mechanism name or an enum. */
  label: string;
  /** The qualifier under it: a file, a reason, an argument. Wraps. */
  detail?: string;
  /** Who did it. Resolved through `agentDisplayName`, so no raw slug leaks. */
  agentSlug?: string | null;
  /** How long this one event took. Omit rather than estimate. */
  durationMs?: number;
  state: TimelineState;
};

/**
 * THE SILENCE FLOOR: how long nothing may happen before it becomes a row.
 *
 * Three minutes, and it is a constant rather than a prop because the figure is a
 * claim about human attention rather than about a surface. Under about three
 * minutes a reader reads consecutive rows as one continuous stretch of work and a
 * break there would be noise on every run. Past it they start asking what
 * happened, which is the question this row answers.
 */
const SILENCE_FLOOR_MS = 3 * 60_000;

/**
 * What a silence was, in the words of the event BEFORE it.
 *
 * The record cannot say more than this and must not pretend to. If the last thing
 * filed was a gate, the wait was on a person. If it was a hold, a condition. If a
 * machine was working and then said nothing for half an hour, the only honest
 * sentence is that nothing was reported, and it is deliberately not called a
 * stall: the agent may well have been working the whole time, and asserting a
 * stall would be reporting an outcome the record does not carry.
 *
 * ── ONE SHAPE FOR ALL FOUR, AND IT IS NOT THE CHIP'S ────────────────────
 * Every one of these is past tense and every one is "nothing or nobody, then a
 * verb". That is deliberate: a chip states the state work is IN, and a silence
 * states what did not HAPPEN, so they must not share a phrase. The first draft
 * had a silence reading "waiting on you" while the chip beside it read "Waiting
 * on you", which is one idea in two formats separated only by a capital letter.
 */
function silenceWord(before: TimelineState): string {
  switch (before) {
    case "gate":
      return "nobody answered";
    case "held":
      return "nothing changed";
    case "working":
      return "nothing was reported";
    default:
      return "nothing happened";
  }
}

/**
 * A silence, drawn as a break in the rail rather than as blank space.
 *
 * ── THE CLOCK COLUMN IS EMPTY HERE, AND THAT IS THE CORRECTION ───────────
 * This row used to put its duration in the clock column, on the argument that a
 * duration is a number about time. Founder review 2026-08-20 named the flaw: that
 * column answers WHEN and a duration answers HOW LONG, which is a what. And a
 * duration cannot fit it anyway, measured: `6h 11m 00s` is 69px against a 40px
 * column, `28m 0s` is 41.4px, and the shortest honest format still overflows. See
 * the note where `RunFigure` used to be.
 *
 * A silence has no `when` of its own to print. It begins at the instant printed
 * one row above and ends at the instant printed one row below, so a clock here
 * would restate a fact already on screen. The column stays open, because closing
 * it would move this row's words 48px left of every other row's.
 *
 * ── IT IS NOW THE SAME SHAPE AS AN EVENT ROW ─────────────────────────────
 * Subject, then how long it took in `RunTook`, which is the identical treatment
 * every event row gives its own duration. The phrase stays quieter than an event's
 * subject, because an absence is not an event and should not compete with one, but
 * the FIGURE looks the same everywhere it appears. One idea, one format.
 *
 * ── ONE FORMATTER, NOT TWO ──────────────────────────────────────────────
 * `formatElapsed` rather than `formatDuration`, and that is the second half of the
 * founder's note: seconds are noise at six hours. `formatDuration` is exact to the
 * second, which is right for "worked for 18m 06s" on a settled step and wrong for
 * a gap. It also makes this figure and the live tail's, which is the same kind of
 * fact, come out of the same function instead of two.
 */
function Silence({ ms, before }: { ms: number; before: TimelineState }) {
  return (
    <li className={RUN_ROW}>
      <RunClockEmpty />
      <span className="flex flex-col items-center self-stretch">
        <RunRailBreak />
      </span>
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 pb-1">
        <span className="text-mrd-data text-mrd-mute">{silenceWord(before)}</span>
        <RunTook>{formatElapsed(ms / 1000)}</RunTook>
      </span>
    </li>
  );
}

/** One thing that happened. */
function Event({ event, last }: { event: TimelineEvent; last: boolean }) {
  const chip = CHIP[event.state];
  const took = event.durationMs === undefined ? null : formatDuration(event.durationMs);
  const who = event.agentSlug ? agentDisplayName(event.agentSlug) : null;

  return (
    <li className={RUN_ROW}>
      <RunClock at={event.at} />

      <span className="flex flex-col items-center self-stretch">
        <RunGlyph kind={event.kind} station={event.station} />
        {last ? null : <RunRail />}
      </span>

      <span className="min-w-0 pb-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <RunSubject>{event.label}</RunSubject>
          {chip ? (
            <StatusChip status={chip} pulse={event.state === "working" || event.state === "gate"}>
              {WORD[event.state]}
            </StatusChip>
          ) : null}
          {took ? <RunTook>{took}</RunTook> : null}
        </span>

        {event.detail ? <RunNote>{event.detail}</RunNote> : null}
        {who ? <RunMeta>{who}</RunMeta> : null}
      </span>
    </li>
  );
}

export function RunTimeline({
  events,
  now,
  label = "What happened on this run",
  maxHeight = 420,
}: {
  /** In the order it happened. An empty list is a real state, drawn below. */
  events: TimelineEvent[];
  /**
   * The instant the axis ends. Passing it puts the timeline in LIVE mode: a tail
   * row appears under the last event and its elapsed figure ticks.
   *
   * A number rather than a boolean because it is also the reference for the
   * trailing silence on a run that has already settled: "it finished 40 minutes
   * ago and nothing has happened since" is a fact a caller holds and the
   * browser's clock does not, on a surface that may have been rendered on a
   * server.
   */
  now?: number;
  label?: string;
  /**
   * Where the column starts scrolling and dissolving at its edges. A run detail
   * pane and a card on a dashboard want different figures, which is the only
   * reason this is a prop.
   */
  maxHeight?: number;
}) {
  const lastEvent = events.length > 0 ? events[events.length - 1] : undefined;
  const open =
    lastEvent !== undefined &&
    (lastEvent.state === "working" || lastEvent.state === "gate" || lastEvent.state === "held");
  const live = now !== undefined;

  /*
   * The ticking figure. `useElapsed` is the product's one clock and it is used
   * here rather than re-derived, for the reason its own header gives: two copies
   * of one clock is how two indicators on one screen come to disagree about the
   * same instant. `active` is false unless the run is both live and open, so a
   * settled timeline does not pay for a 100ms interval it never renders.
   */
  const elapsed = useElapsed(lastEvent?.at, live && open);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<{ top: boolean; bottom: boolean }>({
    top: false,
    bottom: false,
  });

  /*
   * Which edges have content past them, measured rather than assumed, so the fade
   * means "there is more this way" and never appears where there is not.
   *
   * SECOND COPY OF THIS EFFECT IN MERIDIAN, and it should not stay that way:
   * `SidebarNav` has the same lines inside its component body. `edgeMask` is
   * imported rather than re-derived because it is exported; the measurement is
   * not, and pulling it into a shared hook means editing `SidebarNav.tsx`.
   *
   * The 1px tolerance is not cosmetic: fractional layout puts `scrollTop` at the
   * true bottom a hair under the arithmetic, so an exact comparison leaves a
   * permanent bottom fade on a column scrolled all the way down.
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const read = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const overflowing = scrollHeight - clientHeight > 1;
      setEdges({
        top: overflowing && scrollTop > 1,
        bottom: overflowing && scrollTop + clientHeight < scrollHeight - 1,
      });
    };

    read();
    el.addEventListener("scroll", read, { passive: true });

    /* Guarded because happy-dom and jsdom do not implement ResizeObserver, and a
       component that throws on mount in a test environment is one nobody can
       write a test against. The scroll listener still works there. */
    const Observer = typeof ResizeObserver === "undefined" ? null : ResizeObserver;
    const observer = Observer ? new Observer(read) : null;
    observer?.observe(el);

    return () => {
      el.removeEventListener("scroll", read);
      observer?.disconnect();
    };
  }, [events.length, live]);

  /*
   * THE ZERO CASE, and it is the case. A workspace whose runs have never landed
   * sees this before it sees anything else, so it says what will appear here and
   * what the reader will be able to read off it.
   *
   * `data-mrd` belongs on THIS root too. An early return is exactly how a
   * component loses the attribute, because the eye reads the main return as the
   * root and stops, and without it this box falls back to the legacy focus ring.
   */
  if (events.length === 0) {
    return (
      <div
        data-mrd=""
        className="w-full max-w-[520px] rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-5 font-mrd"
      >
        <p className="text-mrd-base font-medium text-mrd-body">Nothing has happened here yet.</p>
        <p className="mt-1 max-w-[62ch] text-mrd-small leading-relaxed text-mrd-mute">
          Once a run starts, every step lands here against the clock it happened on, and any stretch
          where nothing moved gets its own line saying what it was waiting on.
        </p>
      </div>
    );
  }

  /*
   * The trailing silence, drawn only on a run that has SETTLED. While a run is
   * open the live tail below already reports how long the current state has held,
   * and drawing both would state the same duration twice in two different voices.
   */
  const trailing = now !== undefined && lastEvent !== undefined && !open ? now - lastEvent.at : 0;

  return (
    <div data-mrd="" className="flex w-full max-w-[520px] flex-col font-mrd">
      <div
        ref={scrollRef}
        className="mrd-fade-scroll min-h-0 overflow-y-auto"
        style={{
          maxHeight,
          maskImage: edgeMask(edges),
          WebkitMaskImage: edgeMask(edges),
          transition: "mask-image var(--mrd-d-move) var(--mrd-ease)",
        }}
      >
        {/* Nothing in a row may be wider than the row, so 200 events cannot push
            the page sideways. The grid's third column is `1fr` and its contents
            are `min-w-0`. */}
        <ol aria-label={label} className={RUN_STACK}>
          {events.map((event, i) => {
            const previous = i > 0 ? events[i - 1] : undefined;
            const silence = previous ? event.at - previous.at : 0;
            return (
              <Fragment key={event.id}>
                {previous && silence > SILENCE_FLOOR_MS ? (
                  <Silence ms={silence} before={previous.state} />
                ) : null}
                <Event event={event} last={i === events.length - 1 && !open && trailing <= 0} />
              </Fragment>
            );
          })}

          {trailing > SILENCE_FLOOR_MS && lastEvent ? (
            <Silence ms={trailing} before={lastEvent.state} />
          ) : null}

          {/*
           * THE LIVE TAIL. One row, one figure, and the figure is an elapsed count
           * rather than any kind of proportion. It sits in the same three columns
           * as everything above it: the count in the clock column, the state in
           * the body.
           */}
          {live && open && lastEvent ? (
            <li className={RUN_ROW}>
              {/* Empty, for the same reason the silence row's is: this row reports
                  how long, not when, and the clock column takes a clock only. */}
              <RunClockEmpty />
              {/* A plain dot, and it does NOT animate: the chip beside it already
                  breathes, and two things moving on one row to report one fact is
                  the motion budget spent twice. */}
              <span className="mt-[3px] flex size-[14px] shrink-0 items-center justify-center text-mrd-mute">
                <span aria-hidden className="size-1.5 rounded-full bg-current" />
              </span>
              <span
                role="status"
                aria-live="polite"
                className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 pb-1"
              >
                <StatusChip status={CHIP[lastEvent.state] ?? "agent"} pulse>
                  {WORD[lastEvent.state]}
                </StatusChip>
                {/* The figure, then the word that makes it a sentence: "Running
                    6h 11m so far". It reads in that order and the number is the
                    part a reader came for, so it goes next to the chip. */}
                <RunTook>{elapsed}</RunTook>
                <span className="text-mrd-data text-mrd-mute">so far</span>
              </span>
            </li>
          ) : null}
        </ol>
      </div>
    </div>
  );
}

export default RunTimeline;
