import type { ReactNode } from "react";
import { Fragment, useEffect, useRef, useState } from "react";

import { formatDuration } from "@/components/studio/run-return";
import { agentDisplayName } from "@/lib/agent-vocabulary";

import { edgeMask } from "./SidebarNav";
import { useElapsed } from "./use-elapsed";

/*
 * THE RUN TIMELINE: what happened, when, and what the silences were.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 * Meridian had no time axis at all. `TaskRows` is a flat list of units of work
 * with no clock on it; `Thinking` is a step list that reports order and not
 * hour. Both answer "what did it do". Neither answers the question a product
 * lead actually opens the app with, which is a question about a MOMENT:
 *
 *   "what happened at 03:12, and what was it waiting on until 03:40?"
 *
 * THE GAPS ARE THE INFORMATION, and that is the whole reason this is a separate
 * component rather than a clock bolted onto TaskRows. A run that WORKED for 28
 * minutes and a run that IDLED for 28 minutes waiting on a person produce the
 * same list of steps and mean opposite things. A list cannot tell them apart
 * because a list has no space between its rows. This one does: a silence past
 * the floor below gets its own row, its own duration, and a word for what was
 * being waited on.
 *
 * ── THE AXIS IS LITERAL IN ITS LABELS AND ORDINAL IN ITS SPACE ───────────
 * Every row prints its own wall clock, so the axis is readable to the minute.
 * What the rows do NOT do is take vertical space in proportion to elapsed time,
 * and refusing that is a decision rather than a shortcut.
 *
 * A proportional axis sounds more honest and is less so at both ends. A run
 * with a 40-minute wait and 200 tool calls two seconds apart would spend its
 * whole height on the wait and compress every event into a few pixels, so the
 * detail a reader came for becomes unreadable in order to draw a gap they can
 * simply be told about. The gap row states the duration in words, which is
 * exact, survives greyscale, and costs one row whatever its length.
 *
 * ── NO PROGRESS BAR, EVER ───────────────────────────────────────────────
 * Live mode ticks an elapsed counter and nothing on this surface implies a
 * percentage. A coding agent cannot know how long it will take; a bar that
 * suggests otherwise is a lie a reader catches inside one session, and
 * `run-return.ts` already argues this out for the same figure.
 *
 * ── STATE IS HUE, KIND IS SHAPE ─────────────────────────────────────────
 * Law 4, and it is why `kind` and `state` are two fields rather than one. What
 * KIND of thing happened is drawn: a station opening, a tool call, a handoff, a
 * gate, a person acting. HOW IT IS GOING is coloured, out of the five status
 * words and nothing else.
 *
 * ── WHY NOT `MarkState` ─────────────────────────────────────────────────
 * `marks.tsx` already carries a state vocabulary for a run and the search rule
 * says extend before inventing, so this was the first thing checked. It cannot
 * serve: `MarkState` is `quiet | idle | running | gate | waiting | failed |
 * verified`, which spends both of its "stopped" words on a PERSON (`gate` and
 * `waiting` are `--mrd-you` and `--mrd-you-dim`) and has no amber at all. A
 * timeline's most common silence is the other kind, a hold waiting on a
 * condition rather than on anyone, and that is exactly the state meridian.css
 * admitted `--mrd-hold` for after production was found with 39 of 43 work items
 * standing in it. So the vocabulary here is a superset, and the two agree
 * wherever they overlap.
 */

/**
 * WHAT KIND OF THING HAPPENED. Five, and there is deliberately no catch-all.
 *
 * `ToolChips` states the principle this follows: "four kinds, because a fifth
 * glyph nobody can name is noise." A sixth `note` kind was drafted and cut for
 * that reason. Every event on a run is one of these five, and a caller that
 * cannot say which does not know what it is drawing.
 */
export type TimelineKind = "station" | "tool" | "handoff" | "gate" | "person";

/**
 * HOW IT IS GOING. Six words onto the five status hues plus one neutral.
 *
 *   working  --mrd-agent  a machine is working. Ambient, never urgent.
 *   gate     --mrd-you    a person is required. Touch it and it moves.
 *   held     --mrd-hold   stopped, and NOT on you: a condition has to change.
 *   failed   --mrd-fail   an outcome, and the only thing red may mean here.
 *   passed   --mrd-pass   an outcome that is provable. See the note below.
 *   done     neutral      it finished and there is nothing left to say.
 *
 * `done` AND `passed` ARE BOTH HERE ON PURPOSE, and `done` is the common one.
 * `run-parts.tsx` settled this for the run mark and the argument carries: a
 * finished step is not a verified one, and painting forty ordinary completions
 * green is the product asserting a success nobody checked. `passed` is for the
 * one event that settles a run well, with something behind it. Most rows in a
 * healthy run are `done`.
 */
export type TimelineState = "working" | "gate" | "held" | "failed" | "passed" | "done";

export type TimelineEvent = {
  id: string;
  /** Wall clock, ms since epoch. Printed, so it must be a real instant. */
  at: number;
  kind: TimelineKind;
  /** What happened, in a reader's words. Never a mechanism name or an enum. */
  label: string;
  /** The qualifier under it: a file, a reason, an argument. Wraps, never truncates. */
  detail?: string;
  /** Who did it. Resolved through `agentDisplayName`, so a raw slug never leaks. */
  agentSlug?: string | null;
  /**
   * Where it happened, as a DISPLAY label the caller has already resolved. Not a
   * slug: this repo has no single station-label mapping and adding a seventh
   * private one inside a component is how the four disagreeing status
   * normalisers happened.
   */
  station?: string;
  /** How long this one event took. Omit rather than estimate. */
  durationMs?: number;
  state: TimelineState;
};

/**
 * THE SILENCE FLOOR: how long nothing may happen before it becomes a row.
 *
 * Three minutes, and it is a constant rather than a prop because the figure is
 * a claim about human attention rather than about a surface. Under about three
 * minutes a reader reads consecutive rows as one continuous stretch of work and
 * a break there would be noise on every run. Past it they start asking what
 * happened, which is the question this row answers.
 *
 * The number a caller would want to tune is not this one, it is which events
 * they pass in.
 */
const SILENCE_FLOOR_MS = 3 * 60_000;

/** Status hue, and only from the five words. `done` carries none. */
const HUE: Record<TimelineState, string> = {
  working: "text-mrd-agent",
  gate: "text-mrd-you",
  held: "text-mrd-hold",
  failed: "text-mrd-fail",
  passed: "text-mrd-pass",
  done: "text-mrd-mute",
};

/**
 * What a reader is told the state means, in the accessible name.
 *
 * Every row's hue is repeated here as a word, which is the greyscale rule paid
 * for in markup rather than only in ink: a person who cannot separate orchid
 * from amber, and a person listening rather than looking, both get the state.
 */
const STATE_WORD: Record<TimelineState, string> = {
  working: "a machine is working",
  gate: "waiting on you",
  held: "on hold",
  failed: "failed",
  passed: "passed",
  done: "done",
};

/**
 * Monoline, 12px, one stroke weight, round caps: the vocabulary
 * `station-glyphs.tsx` established, at the size a dense column can carry.
 *
 * Only `person` is filled, and that is the distinction `YouMark` already draws:
 * agents are outlined, a person is solid. Two objects of different kinds rather
 * than two colours of one.
 */
const GLYPH: Record<TimelineKind, ReactNode> = {
  station: <path d="M4 12h9M13 7l5 5-5 5" />,
  tool: <path d="M9 5H5v14h4M15 5h4v14h-4" />,
  handoff: <path d="M4 9h12M12 5l4 4-4 4M20 15H8M12 19l-4-4 4-4" />,
  gate: <path d="M6 4v16M18 4v16M9 12h6" />,
  person: (
    <>
      <circle cx="12" cy="8" r="3.4" fill="currentColor" stroke="none" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </>
  ),
};

function KindGlyph({ kind }: { kind: TimelineKind }) {
  return (
    <svg
      aria-hidden
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {GLYPH[kind]}
    </svg>
  );
}

/**
 * The clock, as a real `<time>` with a machine-readable instant on it.
 *
 * `toLocaleTimeString` with `hour12: false` rather than a hand-built `HH:MM`,
 * because a hand-built one is wrong in every locale that does not use a colon,
 * and `tabular-nums` keeps the column straight whatever it renders.
 */
function Clock({ at }: { at: number }) {
  const d = new Date(at);
  return (
    <time
      dateTime={d.toISOString()}
      className="w-[38px] shrink-0 pt-[3px] text-right font-mrd-mono text-[11px] text-mrd-faint tabular-nums"
    >
      {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
    </time>
  );
}

/**
 * What a silence was, in the words of the event BEFORE it.
 *
 * The record cannot say more than this and must not pretend to. If the last
 * thing filed was a gate, the wait was on a person. If it was a hold, a
 * condition. If a machine was working and then said nothing for half an hour,
 * the only honest sentence is that nothing was reported, and it is deliberately
 * not called a stall: the agent may well have been working the whole time, and
 * asserting a stall would be reporting an outcome the record does not carry.
 */
function silenceWord(before: TimelineState): string {
  switch (before) {
    case "gate":
      return "waiting on you";
    case "held":
      return "on hold";
    case "working":
      return "with nothing reported";
    default:
      return "before anything else happened";
  }
}

/**
 * A silence, drawn as a break in the rail rather than as blank space.
 *
 * DASHED, AND THAT CARRIES THE FACT WITHOUT COLOUR. The greyscale rule is not
 * satisfied by a hue plus a number: the shape of the rail has to change, so a
 * screenshot in black and white still shows where the run stopped. The hue
 * agrees with what was being waited on and adds nothing the text does not say.
 */
function Silence({ ms, before }: { ms: number; before: TimelineState }) {
  const figure = formatDuration(ms);
  const word = silenceWord(before);
  const hue =
    before === "gate" || before === "held" || before === "working"
      ? HUE[before]
      : "text-mrd-faint";

  return (
    <li className="flex gap-mrd-3">
      <span aria-hidden className="w-[38px] shrink-0" />
      <span className="flex w-[13px] shrink-0 justify-center">
        <span
          aria-hidden
          className={`h-full w-0 border-l border-dashed border-current ${hue}`}
          style={{ minHeight: 20 }}
        />
      </span>
      <span className={`py-mrd-3 text-[11.5px] ${hue}`}>
        <span className="font-mrd-mono tabular-nums">{figure}</span>{" "}
        <span className="text-mrd-mute">{word}</span>
      </span>
    </li>
  );
}

/** One thing that happened. */
function Event({ event, last }: { event: TimelineEvent; last: boolean }) {
  const hue = HUE[event.state];
  const who = event.agentSlug ? agentDisplayName(event.agentSlug) : null;
  const took = event.durationMs === undefined ? null : formatDuration(event.durationMs);
  const meta = [who, event.station].filter(Boolean).join(" · ");

  return (
    <li className="flex gap-mrd-3">
      <Clock at={event.at} />

      {/*
       * The rail is drawn per row and stops short on the last one, so the
       * column does not trail a line into empty space below the final event.
       * A rail that continues past the last thing that happened is a claim that
       * something else is coming.
       */}
      <span className="relative flex w-[13px] shrink-0 flex-col items-center">
        <span className={hue}>
          <KindGlyph kind={event.kind} />
        </span>
        {last ? null : <span aria-hidden className="w-px flex-1 bg-mrd-line" />}
      </span>

      <span className="min-w-0 flex-1 pb-mrd-4">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="min-w-0 text-[12.5px] font-medium text-mrd-ink">{event.label}</span>
          {/*
           * The state as a word, not only as a hue, on every row that carries
           * one. `done` is left silent: a finished step saying "done" beside a
           * label that already reads as finished is noise on most rows of most
           * runs.
           */}
          {event.state === "done" ? null : (
            <span className={`text-[11px] ${hue}`}>{STATE_WORD[event.state]}</span>
          )}
          {took ? (
            <span className="font-mrd-mono text-[11px] text-mrd-faint tabular-nums">{took}</span>
          ) : null}
        </span>

        {/* Wraps rather than truncates. Half a reason is worse than none, and
            the same argument Thinking makes for its Reasoning rows. */}
        {event.detail ? (
          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-mrd-body">
            {event.detail}
          </span>
        ) : null}

        {meta ? <span className="mt-0.5 block text-[11px] text-mrd-mute">{meta}</span> : null}
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
   * The instant the axis ends. Passing it puts the timeline in LIVE mode: a
   * tail row appears under the last event and its elapsed figure ticks.
   *
   * A number rather than a boolean because it is also the reference for the
   * trailing silence on a run that has already settled: "it finished 40 minutes
   * ago and nothing has happened since" is a fact a caller holds and the
   * browser's clock does not, on a surface that may have been rendered on a
   * server.
   */
  now?: number;
  /** The accessible name of the list. */
  label?: string;
  /**
   * Where the column starts scrolling and dissolving at its edges. A run detail
   * pane and a card on a dashboard want different figures, which is the only
   * reason this is a prop.
   */
  maxHeight?: number;
}) {
  const live = now !== undefined;
  const lastEvent = events.length > 0 ? events[events.length - 1] : undefined;
  const open =
    lastEvent !== undefined &&
    (lastEvent.state === "working" || lastEvent.state === "gate" || lastEvent.state === "held");

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
   * Which edges have content past them, measured rather than assumed, so the
   * fade means "there is more this way" and never appears where there is not.
   *
   * THIS IS THE SECOND COPY OF THIS EFFECT IN MERIDIAN and it should not stay
   * that way: `SidebarNav` has the same fifteen lines inside its component
   * body. `edgeMask` is imported rather than re-derived because it is exported;
   * the measurement is not, and pulling it into a shared hook means editing
   * `SidebarNav.tsx`, which this change does not own. Recorded in the build log.
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
   * what the reader will be able to read off it. No control, because there is
   * nothing on this surface that starts a run.
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
        <p className="text-[13px] font-medium text-mrd-body">Nothing has happened here yet.</p>
        <p className="mt-1 max-w-[62ch] text-[12px] leading-relaxed text-mrd-mute">
          Once a run starts, every step lands here against the clock it happened on, and any stretch
          where nothing moved gets its own line saying what it was waiting on.
        </p>
      </div>
    );
  }

  /*
   * The trailing silence, and it is drawn only on a run that has SETTLED. While
   * a run is open the live tail below already reports how long the current state
   * has held, and drawing both would state the same duration twice in two
   * different voices.
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
        {/* `overflow-x` is deliberately not set: nothing in here may be wider
            than the column, so a run of 200 events cannot push the page
            sideways. Labels sit in a `min-w-0` cell and details wrap. */}
        <ol aria-label={label} className="flex flex-col">
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
           * THE LIVE TAIL. One row, one figure, and the figure is an elapsed
           * count rather than any kind of proportion. The label comes from the
           * state the run is actually in, so a run held on a person does not
           * read as a machine still working.
           */}
          {live && open && lastEvent ? (
            <li className="flex gap-mrd-3">
              <span aria-hidden className="w-[38px] shrink-0" />
              <span className="flex w-[13px] shrink-0 justify-center">
                <span
                  aria-hidden
                  className={`size-1.5 self-start rounded-full bg-current ${HUE[lastEvent.state]}`}
                  style={{
                    marginTop: 5,
                    /* Inline, so meridian.css's reduced-motion block catches it.
                       An animation declared in a utility keeps running for
                       someone who asked it not to. */
                    animation:
                      lastEvent.state === "working"
                        ? "mrd-attention 2400ms var(--mrd-ease-soft) infinite"
                        : "mrd-attention 1600ms var(--mrd-ease-soft) infinite",
                  }}
                />
              </span>
              <span
                role="status"
                aria-live="polite"
                className={`text-[11.5px] ${HUE[lastEvent.state]}`}
              >
                {STATE_WORD[lastEvent.state]}
                {", "}
                <span className="font-mrd-mono tabular-nums">{elapsed}</span>
                <span className="text-mrd-mute"> so far</span>
              </span>
            </li>
          ) : null}
        </ol>
      </div>
    </div>
  );
}

export default RunTimeline;
