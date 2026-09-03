import * as React from "react";

import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import { holdLine } from "@/lib/spine/driver";

import { Flowchart, flowFromSteps } from "./Flowchart";
import { ReasonField } from "./forms";
import type { PlanStep, PlanStepState } from "./PlanCard";
import { GLYPH_FOR_STATION, StationGlyph } from "./station-glyphs";
import { RecordTag } from "./RecordsTable";
import { StatusChip, type StatusWord } from "./StatusChip";
import { Action, Actions, Chevron } from "./surface-parts";

/*
 * THE RUN MAP: a route through the seven stations, and what happened at each.
 *
 * ── WHAT THIS IS FOR, AND THE POLICY IT TURNS INTO A CONTROL ─────────────
 * A founder ruling already requires that a skipped station is A DECISION ON THE
 * RECORD WITH A REASON, never a silent omission. `SpineRoute` has carried the
 * shape of that decision all along -- `waived: StationWaiver[]`, each with a
 * `reason` -- and nothing in the product ever asked anyone for one. A policy
 * with no interaction is not enforced, it is merely written down.
 *
 * On a map, taking a station off the route IS the gesture, so the reason prompt
 * is the next beat rather than a form somebody has to find. That is the whole
 * argument for this component existing: it is the surface where an unenforced
 * policy becomes a control that cannot be completed without the reason.
 *
 * ── THIS IS NOT A WORKFLOW BUILDER, AND THE DISTINCTION IS THE PRODUCT ───
 * No trigger palette. No conditions. No branches. No user-authored automations.
 * A person cannot add a station, cannot reorder the route and cannot draw an
 * edge. The director decides the route; the reader adjusts and approves it.
 *
 * If a user has to draw the graph, the director layer is dead, and every
 * agent-workflow canvas on the market is the proof: they are node editors, so
 * the product's value collapses into "we gave you a diagram tool". The only
 * authoring gesture here is SUBTRACTION, with a reason, which is the one
 * judgement the record actually needs from a person.
 *
 * ── LABELLED BY OUTCOME, NEVER BY TOOL ──────────────────────────────────
 * Engine-Room doctrine: the user meets the OUTPUT of the machine, never the
 * machine. So a node says "read Intercom and PostHog for verify-step drop-off",
 * not `web.search` and not `prd.draft`.
 *
 * This is enforced by ABSENCE rather than by a filter, which is the only way it
 * holds: there is no field on `RunMapStation` that carries a tool name, so no
 * caller can pass one through and no future edit can start rendering one without
 * adding a field and answering for it. `RunTimeline` and `ToolStream` are where
 * tool calls belong, behind their own door.
 *
 * ── STATION IDENTITY IS SHAPE, AND LAW 4 HAS BEEN BROKEN ON THIS THRICE ──
 * Every station is its glyph from `station-glyphs.tsx`. There is no per-station
 * hue anywhere in this file, and that is not a stylistic preference: colour
 * carries STATUS in this system, so seven categorical station hues would spend
 * the whole palette on category and a reader could no longer tell "Design is
 * amber because it is Design" from "Design is amber because something is stuck
 * there". A rainbow of stages is also the exact look the founder rejected.
 *
 * ── ONE VOCABULARY WITH `PlanCard`, NOT A SECOND ONE ────────────────────
 * A station's state is `PlanStepState` and its steps are `PlanStep[]`, imported
 * rather than restated. `PlanCard` is the other forward-looking step display in
 * the system and the two are read minutes apart on the same piece of work; a
 * private enum here is how "skipped" comes to mean two things. When the live
 * route needed `held` and `here` on 2026-08-25 they were added to that shared
 * vocabulary for the same reason, not declared privately in this file.
 *
 * ── AND THE STEP GRAPH IS `Flowchart`, NOT A SECOND GRAPH ───────────────
 * Expanding a station draws its steps through `Flowchart`, which is the ported
 * reference component for exactly this and already solves the hard parts:
 * measured node heights, bezier connectors that meet a consistent anchor,
 * dragging so a reader can untangle a graph they cannot otherwise read. Drawing
 * a second DAG here would be a fourth view of one run in a fifth rhythm.
 */

/**
 * WHEN THIS IS BEING READ, which decides what it offers rather than how it looks.
 *
 *   editable  before the route starts. Stations can come OFF it, with a reason.
 *   live      while it runs. Nothing can be changed; the active station says so.
 *   replay    afterwards. A settled record, and every control is gone.
 *
 * Three modes rather than a pile of booleans, because the states are mutually
 * exclusive and a boolean pair would let a caller ask for a live map that is also
 * editable, which is a route being edited underneath the agent walking it.
 */
export type RunMapMode = "editable" | "live" | "replay";

/**
 * WHICH WAY THE ROUTE RUNS, and it is a fit decision rather than a taste one.
 *
 * ── SPEC-LAYOUT GAP G3, CLOSED 2026-08-25 ───────────────────────────────
 * This component shipped drawing stations horizontally: a `flex` row with
 * `overflow-x-auto` and a fixed 168px per stop. Seven of those plus gaps is
 * about 1176px, and the run page's walking pane is a rail of `clamp(300px, 38%,
 * 440px)`. So the flagship surface for a live route could not mount the live
 * route component at all, and the spec recorded that as the largest gap in it.
 *
 * A SECOND ROUTE RENDERER WAS THE OBVIOUS FIX AND IT IS THE WRONG ONE. This
 * repo keeps finding the same defect in different clothes -- a check watching a
 * table its writer never writes, a component built and mounted nowhere -- and
 * two components drawing one route is that shape: the state vocabulary, the
 * waiver rule, the "no per-station hue" law and the outcome-not-tool rule would
 * all have to be re-derived, and the second copy is the one that drifts.
 *
 * So the route gained a direction and kept everything else.
 *
 *   spine  the original. Stations left to right, each 168px, scrolling INSIDE
 *          its own container. Right for a wide surface reading a whole route.
 *   stack  one stop per row, full width, no horizontal scroll at any width.
 *          Right for a rail, and right for a LIVE route besides: the eye reads
 *          a vertical list in order without being asked to scroll sideways to
 *          find where the work currently is.
 *
 * `spine` stays the default so no existing caller moves.
 */
export type RunMapOrientation = "spine" | "stack";

export type RunMapStation = {
  station: AgentStation;
  /** `PlanCard`'s vocabulary, imported so the two surfaces cannot disagree. */
  state: PlanStepState;
  /**
   * WHAT CAME OF THIS STATION, in outcome words a reader would use.
   *
   * "Read Intercom and PostHog for verify-step drop-off", never `web.search`.
   * There is deliberately no `tool` field beside this one: see the header.
   */
  outcome?: string;
  /**
   * The raw hold reason, when the driver stopped here. A `HoldReason` string.
   *
   * RAW, NOT THE SENTENCE, for the reason K-18 established: `holdLine` rewrites
   * two of the reasons to name their station, so they no longer equal their own
   * entry in `HOLD_LINE` and a surface branching on the prose cannot recognise
   * them. This renders the sentence and classifies off the id.
   */
  hold?: string | null;
  /** Why it came off the route. Present on a waived station, and required there. */
  waivedReason?: string;
  /** The steps this station ran or intends to. Drawn through `Flowchart`. */
  steps?: PlanStep[];
};

/**
 * A CHIP ONLY WHERE SOMETHING IS RUNNING, WAITING OR BROKEN.
 *
 * The same rule `PlanCard`, `RunTimeline` and `ToolStream` all apply. Most
 * stations on a healthy route are `done` or not started, and a chip on every one
 * of seven makes the one that matters invisible.
 */
const CHIP: Partial<Record<PlanStepState, { status: StatusWord; word: string }>> = {
  active: { status: "agent", word: "Running" },
  failed: { status: "fail", word: "Failed" },
  "needs-approval": { status: "you", word: "Needs you" },
  /* SPEC-LAYOUT gap G1, closed 2026-08-25. A held station used to arrive here
     as `active` and wear "Running", which claimed a machine was inside a stop
     the driver had stopped at. Amber and not red: `stalled` reads "it is being
     sent for a fix", and red reports a result that has happened. */
  held: { status: "hold", word: "On hold" },
};

/** Only for the states with no chip, so a screen reader still gets the word. */
const SPOKEN: Partial<Record<PlanStepState, string>> = {
  pending: "Not started",
  done: "Done",
  skipped: "Off the route",
  /* `here` is absent on purpose: it wears a visible TAG instead, and the word
     is in it. Announcing it here as well would say it twice, which is the rule
     this pair exists to keep. */
};

/**
 * WHERE THE WORK IS STANDING, AND WHY IT IS A TAG RATHER THAN A CHIP.
 *
 * `here` means the work is at this stop and nothing is moving it. That is a
 * POSITION, not a status, and this system already has two shapes for exactly
 * that split: *"A pill is round and carries status; a tag is square and carries
 * a category."*
 *
 * IT IS NOT DECORATION, IT IS THE FIX FOR A DEFECT THIS ADDITION CREATED. The
 * mark on every stop is the station's own glyph, and `markTone` paints both
 * `done` and `here` with `--mrd-ink` -- so on a stacked route a reader could
 * not tell the stop the work is AT from the four behind it. The alternative was
 * to mute the done glyphs, which would have made a shipped surface quieter to
 * make room for a new state, and the ratchet law forbids that in those words.
 *
 * COLOURLESS, and that is the colour law rather than a taste: hue in this
 * system carries status, and painting an idle stop amber would report a hold
 * nothing is holding.
 */
function HereTag() {
  return <RecordTag label="Here" />;
}

/**
 * The mark's own ink, and there are only three values it may take.
 *
 * NOT A PER-STATION RAMP. `--mrd-agent` says a machine is working, `--mrd-fail`
 * says an outcome, and everything else is ink or faint by how settled it is.
 * Which station it is comes entirely from the drawing.
 */
function markTone(state: PlanStepState): string {
  if (state === "active") return "text-mrd-agent";
  if (state === "held") return "text-mrd-hold";
  /* Corrected 2026-08-25 alongside G1. A station waiting on a PERSON was
     falling through to `text-mrd-faint`, so the one stop on the route that
     needs somebody was the quietest mark on it. `PlanCard`'s own hue map has
     always painted this state `--mrd-you`; this file had simply never listed
     it. */
  if (state === "needs-approval") return "text-mrd-you";
  if (state === "failed") return "text-mrd-fail";
  if (state === "done" || state === "here") return "text-mrd-ink";
  return "text-mrd-faint";
}

/**
 * Taking a station off the route, which cannot be completed without a reason.
 *
 * ── THE DUPLICATION THIS COMMENT NAMED IS CLOSED, 2026-08-20 ────────────
 * It used to say: *"SAME MECHANIC AS `PlanCard`'s SKIP, AND THAT IS A
 * DUPLICATION I AM NAMING RATHER THAN HIDING... the right fix is a `ReasonField`
 * in `forms.tsx` that both call. That is a third file this item does not own, so
 * it is recorded in the build log instead of done quietly here."*
 *
 * `PlanGate` became the third caller, which is the trigger the note was waiting
 * for, so the mechanic now lives in `forms.tsx` and all three call it. **Both
 * copies went, not just this one**: a shared primitive standing beside two
 * survivors would have looked like the fix and left the drift exactly where it
 * was.
 *
 * What stays here is the wording, which is the part that is really this route's:
 * the question names the station, because "why is this coming off" in a list of
 * seven is a pronoun with no referent.
 */
function WaiveReason({
  station,
  onCommit,
  onCancel,
}: {
  station: AgentStation;
  onCommit: (reason: string) => void;
  onCancel: () => void;
}) {
  return (
    <ReasonField
      id={`run-map-waive-${station}`}
      label={`Why is ${AGENT_STATIONS[station].name} coming off the route?`}
      hint="It stays on the record beside the route, so the next reader can see the call rather than a gap."
      placeholder="The notice reuses a shipped component, so there is nothing new to draw"
      commitLabel="Take it off the route"
      onCommit={onCommit}
      onCancel={onCancel}
    />
  );
}

/** One station on the spine. */
function Stop({
  stop,
  mode,
  orientation,
  open,
  asking,
  onToggle,
  onAsk,
  onWaive,
  onCancelAsk,
  canWaive,
}: {
  stop: RunMapStation;
  mode: RunMapMode;
  orientation: RunMapOrientation;
  open: boolean;
  asking: boolean;
  onToggle: () => void;
  onAsk: () => void;
  onWaive: (reason: string) => void;
  onCancelAsk: () => void;
  /**
   * Whether the caller can actually take a station off the route.
   *
   * ADDED AFTER A TEST CAUGHT THE DEFECT. `editable` mode drew "Take it off" on
   * every station whether or not `onWaive` existed, so a caller who asked for an
   * editable map without wiring the handler got seven buttons that did nothing.
   * That is the affordance failure this file's own header names, committed in the
   * file that names it.
   */
  canWaive: boolean;
}) {
  const meta = AGENT_STATIONS[stop.station];
  const chip = CHIP[stop.state];
  const waived = stop.state === "skipped";
  /* The sentence, built from the raw id. Live only: a hold on a finished route
     is history and the replay reads it off the state instead. */
  const hold = mode === "live" ? holdLine(stop.hold, { station: stop.station }) : null;
  const hasSteps = (stop.steps?.length ?? 0) > 0;
  const stack = orientation === "stack";

  return (
    /*
     * The fixed 168px is the SPINE's geometry and only the spine's. A stacked
     * stop takes the rail's full width, which is what stops a seven-station
     * route needing a horizontal scrollbar inside a 300px pane.
     */
    <li
      className={`flex min-w-0 flex-col ${stack ? "w-full" : "shrink-0"}`}
      style={stack ? undefined : { width: 168 }}
    >
      {/*
       * The whole stop is one control when it has steps to open, and a plain
       * fact when it does not. A card that looks pressable and does nothing is
       * the affordance failure this system keeps finding.
       */}
      {hasSteps ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className={`mrd-focus-inset flex w-full items-start gap-2 rounded-mrd-ctl px-2 py-2 text-left transition-colors duration-[var(--mrd-d-press)] hover:bg-mrd-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]`}
        >
          <StopFace stop={stop} meta={meta} chip={chip} waived={waived} hold={hold} stack={stack} />
          <span className="mt-[3px] shrink-0 text-mrd-mute">
            <Chevron open={open} />
          </span>
        </button>
      ) : (
        <div className="flex w-full items-start gap-2 px-2 py-2">
          <StopFace stop={stop} meta={meta} chip={chip} waived={waived} hold={hold} stack={stack} />
        </div>
      )}

      {/*
       * THE ONLY AUTHORING GESTURE, and only before anything has run. A live
       * route cannot be edited under the agent walking it, and a replay is a
       * record rather than a draft.
       */}
      {mode === "editable" && canWaive && !waived ? (
        asking ? (
          <WaiveReason station={stop.station} onCommit={onWaive} onCancel={onCancelAsk} />
        ) : (
          <Actions className="mt-mrd-2 px-2">
            <Action variant="quiet" onClick={onAsk}>
              Take it off
            </Action>
          </Actions>
        )
      ) : null}
    </li>
  );
}

/** The face of a stop: mark, name, and what came of it. */
function StopFace({
  stop,
  meta,
  chip,
  waived,
  hold,
  stack,
}: {
  stop: RunMapStation;
  meta: { name: string };
  chip?: { status: StatusWord; word: string };
  waived: boolean;
  hold: string | null;
  /** Vertical rail. The chip moves onto the name's line; nothing else changes. */
  stack: boolean;
}) {
  const spoken = SPOKEN[stop.state];
  const chipEl = chip ? (
    <StatusChip status={chip.status} pulse={chip.status === "agent" || chip.status === "you"}>
      {chip.word}
    </StatusChip>
  ) : stop.state === "here" ? (
    <HereTag />
  ) : null;
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="flex min-w-0 items-center gap-2">
        <span
          {...(spoken ? { role: "img", "aria-label": `${meta.name}, ${spoken}` } : {})}
          className={`flex size-[18px] shrink-0 items-center justify-center ${markTone(stop.state)}`}
        >
          <StationGlyph kind={GLYPH_FOR_STATION[stop.station]} size={16} />
        </span>
        {/*
         * A STATION THE WORK NEVER REACHED MUST NOT READ AS LOUD AS ONE IT
         * FINISHED (S1 -> S0, 2026-08-27, found against six real agent-run
         * surfaces).
         *
         * `markTone` already dims a `pending` glyph to `--mrd-faint`. The NAME
         * stayed full ink, and the name carries the weight in this row, so on an
         * abandoned track at Ship the route drew seven identical-looking stops
         * while the meter above said "6 of 7 done". The glyph was telling the
         * truth and the label was talking over it.
         *
         * THIS IS NOT THE RATCHET. The law above records that muting the DONE
         * glyphs was refused, because that quietens a shipped surface to make
         * room for a new state. Nothing here dims a state that HAPPENED: pending
         * is the absence of one, and it is being aligned with the tone its own
         * glyph already takes. No existing weight moves.
         *
         * `mute` rather than `faint`: a label needs to stay readable, and
         * `faint` is the glyph's weight, not a word's. Waived keeps its rule and
         * its strike, because "deliberately skipped" and "not reached" are
         * different facts and the strike is what separates them.
         */}
        <span
          className={`min-w-0 truncate text-mrd-label font-medium ${
            waived
              ? "text-mrd-mute line-through decoration-mrd-line"
              : stop.state === "pending"
                ? "text-mrd-mute"
                : "text-mrd-ink"
          }`}
        >
          {meta.name}
        </span>
        {/*
         * ON A RAIL THE CHIP RIDES THE NAME'S LINE. A 168px spine column has no
         * room beside the name, so the chip drops below it; a full-width row
         * has room to spare and stacking it there would spend a whole line of a
         * seven-row list on a word that fits in the slack.
         */}
        {stack && chipEl ? <span className="ml-auto shrink-0">{chipEl}</span> : null}
      </span>

      {!stack && chipEl ? <span className="flex">{chipEl}</span> : null}

      {/*
       * WHAT CAME OF IT, in outcome words. Wraps rather than truncates, because
       * half an outcome is worse than a wrapped one and this is the whole reason
       * the map is read rather than the spine strip in the shell.
       */}
      {stop.outcome ? (
        <span className="text-mrd-data leading-mrd-prose text-mrd-body">{stop.outcome}</span>
      ) : null}

      {/* K-18's sentence, verbatim from `holdLine`. Never re-worded here: one
          copy of the words, in `driver.ts`, or they drift. */}
      {hold ? <span className="text-mrd-data leading-mrd-prose text-mrd-mute">{hold}</span> : null}

      {/*
       * A WAIVED STATION CARRIES ITS REASON, AND SAYS SO WHEN IT HAS NONE.
       *
       * The founder ruling is that a skip is a decision with a reason rather than
       * an absence, so a waiver that arrived without one has to admit it rather
       * than render as though skipping needed no argument. Hiding it would let
       * the record look complete when it is not.
       */}
      {waived ? (
        <span className="text-mrd-data leading-mrd-prose text-mrd-mute">
          {stop.waivedReason ?? "Nobody said why this station came off the route."}
        </span>
      ) : null}
    </span>
  );
}

export function RunMap({
  stops,
  mode = "replay",
  orientation = "spine",
  label = "The route this work takes",
  onWaive,
}: {
  /** In route order. An empty route is a real state, drawn below. */
  stops: RunMapStation[];
  mode?: RunMapMode;
  /** Which way the route runs. See `RunMapOrientation`; `spine` is unchanged. */
  orientation?: RunMapOrientation;
  label?: string;
  /**
   * Take a station off the route, with the reason a person gave.
   *
   * The reason is not optional and the signature is why: there is no overload
   * without it, so a caller cannot record a waiver with nothing attached even by
   * accident. Omit the handler and `editable` mode draws no control at all,
   * which is the same rule `PlanCard` follows for its own gate.
   */
  onWaive?: (station: AgentStation, reason: string) => void;
}) {
  const [openStop, setOpenStop] = React.useState<AgentStation | null>(null);
  const [asking, setAsking] = React.useState<AgentStation | null>(null);

  /*
   * THE ZERO CASE. A piece of work with no route yet is the normal first second
   * of a run, not an error. `data-mrd` on the early return as well: this is
   * exactly how a component loses the attribute, because the eye reads the main
   * return as the root and stops.
   */
  if (stops.length === 0) {
    return (
      <div
        data-mrd=""
        className="w-full rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-5 font-mrd"
      >
        <p className="text-mrd-base font-medium text-mrd-body">This work has no route yet.</p>
        <p className="mt-1 max-w-[62ch] text-mrd-small leading-mrd-prose text-mrd-mute">
          Once it has one, every station it will visit appears here in order, with the ones it skips
          and the reason each was left out.
        </p>
      </div>
    );
  }

  const open = stops.find((s) => s.station === openStop) ?? null;
  const openSteps = open?.steps ?? [];

  return (
    <div data-mrd="" className="w-full font-mrd">
      {/*
       * ── THE SPINE SCROLLS, THE PAGE NEVER DOES ──────────────────────────
       * `overflow-x-auto` on this element and a fixed width on each stop, so a
       * seven-station route on a narrow pane scrolls INSIDE its own container.
       * The failure this avoids is the one that has no gate: a horizontal
       * overflow on the body, which moves the whole layout sideways and is
       * invisible on a wide development display.
       */}
      <ol
        aria-label={label}
        className={
          orientation === "stack"
            ? /* No `overflow-x` at all, which is the point of this direction:
                 nothing can scroll sideways because nothing is wider than the
                 rail. The page's own scroll carries a long route. */
              "flex list-none flex-col items-stretch"
            : "mrd-fade-scroll flex list-none items-start gap-1 overflow-x-auto pb-1"
        }
      >
        {stops.map((stop) => (
          <Stop
            key={stop.station}
            stop={stop}
            mode={mode}
            orientation={orientation}
            open={openStop === stop.station}
            asking={asking === stop.station}
            onToggle={() => setOpenStop(openStop === stop.station ? null : stop.station)}
            onAsk={() => setAsking(stop.station)}
            onCancelAsk={() => setAsking(null)}
            canWaive={!!onWaive}
            onWaive={(reason) => {
              onWaive?.(stop.station, reason);
              setAsking(null);
            }}
          />
        ))}
      </ol>

      {/*
       * ── THE STEP GRAPH, ONE STATION AT A TIME ───────────────────────────
       * One open at a time, and it opens BELOW the spine rather than inline: a
       * graph unfolding inside a horizontal row would push every station after
       * it sideways, and the reader loses the route they were reading.
       *
       * Drawn by `Flowchart`, which is the ported reference graph and already
       * answers measured heights, anchored connectors and dragging. `Flowchart`
       * takes `StationGlyphKind`, so the steps inherit this station's own mark
       * unless a step names its own.
       */}
      {open && openSteps.length > 0 ? (
        <div className="mt-mrd-4">
          <p className="mb-mrd-3 text-mrd-data text-mrd-mute">
            {`What ${AGENT_STATIONS[open.station].name} `}
            {open.state === "pending" ? "intends to do" : "did"}
          </p>
          <Flowchart
            label={`The steps at ${AGENT_STATIONS[open.station].name}`}
            {...flowFromSteps(
              openSteps.map((step) => ({
                id: step.id,
                title: step.label,
                caption: step.why,
                station: GLYPH_FOR_STATION[open.station],
              })),
            )}
          />
        </div>
      ) : null}
    </div>
  );
}

export default RunMap;
