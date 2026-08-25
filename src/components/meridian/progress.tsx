import type { CSSProperties, ReactNode } from "react";

/*
 * DETERMINATE PROGRESS: N OF M, WHERE BOTH NUMBERS COME OFF A ROW.
 *
 * ── WHY MERIDIAN HAD NO WORD FOR THIS, AND WHY IT NEEDS ONE ─────────────
 * The system's standing position is that it REFUSES progress bars, and the
 * refusal is right. `RunTimeline` states it in its own header -- "no progress
 * bar, ever ... a coding agent cannot know how long it will take" -- and
 * `TaskRows` draws a closed ring rather than an arc for exactly that reason: an
 * arc is a progress reading and there is no progress to report.
 *
 * `Spend` is the one exception that already shipped, and its header carries the
 * test the exception has to pass: *"Both numbers are known exactly, the
 * denominator does not move, and the proportion is the fact."*
 *
 * A PIECE OF WORK WALKING ITS ROUTE PASSES THAT TEST AND NOTHING ELSE ON THE
 * RUN PAGE DOES. The route is decided before the walk starts and stored in
 * `spine_tracks.path`; the waivers are stored beside it. So "which stop of how
 * many" is not an estimate, it is two integers read off one row, and it stays
 * true whether the next station takes four seconds or four hours.
 *
 * WHAT THIS MUST NEVER BECOME, stated so a later edit has to argue with it:
 *
 *   NOT A PERCENTAGE OF WORK. Seven stations are not seven equal efforts.
 *     Build is not one seventh of anything. The meter counts STOPS, and the
 *     figure beside it says so in the noun the caller passes.
 *   NOT AN ETA. Nothing here interpolates, extrapolates or predicts. There is
 *     no rate, so there is no remaining time, so there is no field for one.
 *   NOT A THING THAT MOVES ON ITS OWN. Only the segment where a machine is
 *     ACTUALLY working carries motion, and it carries it because a row says a
 *     walk is in flight. A bar that creeps while nothing happens is the exact
 *     lie this system spent three components refusing.
 *
 * ── BLOCKS, NOT A CONTINUOUS FILL, AND THAT IS MEASURED ─────────────────
 * `ContextCards` records the founder's own reading of a hairline bar beside a
 * number -- it "does not make sense at all ... when you show it in the form of
 * blocks ... it would understand" -- and the perceptual argument under it: a
 * continuous length asks the eye to judge a length, discrete blocks ask it to
 * COUNT, and counting survives a glance. Seven stations is a counting problem.
 *
 * The rail is 4px, `--mrd-s2`, which is what `Spend`'s meter already draws. One
 * meter thickness in the system rather than two.
 *
 * ── THE NUMBERS ARE TEXT AND THE DRAWING IS `aria-hidden` ───────────────
 * `Spend` settled this and the reasoning carries: `role="meter"` announces as
 * nothing in several screen readers, and a mis-announced meter is worse than no
 * meter. So the figure is real text above the rail, always rendered, and the
 * rail is decoration for the eye. Nothing is only in the drawing.
 */

/**
 * WHERE ONE STOP STANDS. Seven words, and each one is a different row-fact.
 *
 * The four "current" states are separated on purpose and it is the whole reason
 * this component exists rather than a two-state bar. A run standing at Build
 * with an agent inside it and a run standing at Build with nobody driving it
 * are OPPOSITE facts, and 58 of 59 tracks in this product's history are the
 * second one. A meter that painted them the same would be the most expensive
 * lie the surface could tell.
 *
 *   done     behind it. Neutral: an outcome that has happened needs no hue.
 *   working  a machine is inside this stop right now. The only segment that
 *            moves, and `--mrd-agent` means precisely this.
 *   waiting  stopped, and on a PERSON. `--mrd-you`.
 *   held     stopped, on a condition rather than on a person. `--mrd-hold`.
 *   here     where it stands, and nothing is moving it. Neutral and INKED --
 *            the strongest neutral on the rail, because position is a category
 *            rather than a status and Meridian's colour law reserves hue for
 *            status. Painting an idle stop amber would report a hold nothing
 *            holds.
 *   ahead    still to come. The empty rail.
 *   waived   taken off the route, with a reason on the record. Drawn as an
 *            outlined gap: it is neither done nor coming, and a filled segment
 *            in either direction would claim one of those.
 */
export type StepMeterState = "done" | "working" | "waiting" | "held" | "here" | "ahead" | "waived";

export type StepMeterStep = {
  /** Stable across renders, so a stop advancing does not remount the rail. */
  key: string;
  /** This stop's own name. Used for the hover sentence, never drawn as a label. */
  label: string;
  state: StepMeterState;
};

/** The four states that mean "the work is standing HERE", in one place. */
const CURRENT = new Set<StepMeterState>(["working", "waiting", "held", "here"]);

/**
 * The paint, one literal class per state.
 *
 * Written out rather than interpolated for the reason `StatusChip` records:
 * Tailwind scans source text, so `bg-mrd-${state}` generates no utility at all
 * and fails silently. `working` is empty here because it is a gradient set
 * inline -- see below.
 */
const FILL: Record<StepMeterState, string> = {
  done: "bg-mrd-body",
  working: "",
  waiting: "bg-mrd-you",
  held: "bg-mrd-hold",
  here: "bg-mrd-ink",
  ahead: "bg-mrd-sink",
  waived: "",
};

/** The word each state wears in the hover sentence. One copy of the words. */
const WORD: Record<StepMeterState, string> = {
  done: "done",
  working: "running now",
  waiting: "waiting on you",
  held: "on hold",
  here: "where it stands",
  ahead: "still to come",
  waived: "taken off the route",
};

/**
 * The one segment that moves, and it moves only while a machine is inside it.
 *
 * `mrd-shimmer` rather than `mrd-attention`, which is the opposite of the call
 * `StatusChip` made, and the difference is what the element carries. A chip
 * carries a WORD, so dimming it to 0.32 and back is legible throughout. A 4px
 * segment carries no word, so the same envelope reads as a fault light
 * flickering. A highlight travelling THROUGH the segment reads as work moving
 * through the stop, which is what is actually happening.
 *
 * `--mrd-d-alive` is the token for exactly this and it already exists: "the
 * period of the highlight that travels through a label to say the work behind
 * it has not stopped". Five callers earned it on 2026-08-22; this is the sixth
 * and the first that is not a label.
 *
 * DECLARED INLINE, not as a class, because meridian.css's reduced-motion block
 * matches on the style attribute. An animation in a utility keeps moving for
 * somebody who asked it not to, which is a defect this repo has paid for in six
 * files. Under reduced motion the block parks `background-position` at `50% 0`,
 * which centres the bright stop in the segment: the agent colour stays, the
 * travel stops, and the fact that a machine is working is still on the screen.
 */
const WORKING_STYLE: CSSProperties = {
  background:
    "linear-gradient(90deg, var(--mrd-agent-dim) 30%, var(--mrd-agent) 50%, var(--mrd-agent-dim) 70%)",
  backgroundSize: "200% 100%",
  animation: "mrd-shimmer var(--mrd-d-alive) linear infinite",
};

/**
 * A gap in the rail with an edge around it. Neither filled nor empty, because
 * a waiver is neither done nor coming: it is a decision somebody made, and the
 * reason for it lives on the route beside this.
 */
const WAIVED_STYLE: CSSProperties = {
  boxShadow: "inset 0 0 0 1px var(--mrd-line)",
};

/**
 * The settled segments ease when the work advances rather than snapping.
 *
 * `--mrd-d-move` is the token for "something changing position or size", which
 * is what a stop turning from ahead to done is. Nothing pulses: `Spend`'s meter
 * makes the same call and gives the reason -- a meter that throbbed as it
 * filled would be the surface arguing with a reader about a number they can
 * already see.
 */
const SETTLED_STYLE: CSSProperties = {
  transition: "background-color var(--mrd-d-move) var(--mrd-ease)",
};

export function StepMeter({
  steps,
  noun = "Step",
  note,
  className = "",
}: {
  /** In route order. Empty is a real state and draws nothing -- see below. */
  steps: StepMeterStep[];
  /**
   * What one of these is called, for the figure. "Station" on a run, "Step" on
   * a plan. A prop rather than a constant because the meter does not know what
   * it is counting, and a component that guessed would be wrong on its second
   * caller.
   */
  noun?: string;
  /**
   * One fact that belongs on the same line as the figure, hard right. The run
   * header puts its clock here, which is the pairing the mission asks for: how
   * far through, and how long, read in one movement of the eye.
   */
  note?: ReactNode;
  className?: string;
}) {
  /*
   * NOTHING TO DRAW IS THE CALLER'S EMPTY STATE, NOT THIS COMPONENT'S.
   *
   * A piece of work with no route yet is a real and normal first second, and
   * `RunMap` already composes a full answer for it ("This work has no route
   * yet", and what will appear once it has one). A second empty state stacked
   * above that one would be two answers to a single question, so this renders
   * nothing and lets the route own it. There is no early-return chrome here to
   * carry `data-mrd`, because there is no chrome.
   */
  if (steps.length === 0) return null;

  const total = steps.length;
  const at = steps.findIndex((s) => CURRENT.has(s.state));
  const done = steps.filter((s) => s.state === "done").length;

  /*
   * TWO SENTENCES, AND THE SECOND ONE IS NOT A FALLBACK.
   *
   * While the work is standing somewhere, the useful figure is WHERE: "Station
   * 5 of 7". Once it is not standing anywhere -- the route finished, or the
   * work was abandoned -- there is no current stop, and printing "7 of 7" would
   * assert a position it no longer has. So the figure changes to what is
   * actually known: how many stops are behind it.
   */
  const figure = at >= 0 ? `${noun} ${at + 1} of ${total}` : `${done} of ${total} done`;

  return (
    <div data-mrd="" className={`w-full font-mrd ${className}`}>
      {/*
       * The figure left, the note hard right, on one baseline. `tabular-nums`
       * holds each digit to one width so a stop advancing does not shift the
       * line, which is `Spend`'s rule and matters more here: this figure sits
       * beside a clock that changes every tenth of a second.
       */}
      <div className="flex items-baseline justify-between gap-mrd-4">
        <span className="font-mrd-mono text-mrd-data tabular-nums text-mrd-ink">{figure}</span>
        {note ? <span className="min-w-0 shrink-0 text-mrd-data text-mrd-mute">{note}</span> : null}
      </div>

      <div
        aria-hidden
        className="mt-mrd-3 flex w-full items-stretch gap-mrd-1"
        /* A mouse gets the whole route in one string. Everything in it is also
           available as text: the figure above, and the named route below. */
        title={steps.map((s) => `${s.label}: ${WORD[s.state]}`).join(" · ")}
      >
        {steps.map((s) => (
          <span
            key={s.key}
            className={`h-mrd-2 min-w-0 flex-1 rounded-mrd-xs ${FILL[s.state]}`}
            style={
              s.state === "working"
                ? WORKING_STYLE
                : s.state === "waived"
                  ? WAIVED_STYLE
                  : SETTLED_STYLE
            }
          />
        ))}
      </div>
    </div>
  );
}

export default StepMeter;
