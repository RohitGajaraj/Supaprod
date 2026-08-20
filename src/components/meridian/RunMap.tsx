import * as React from "react";

import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import { holdLine } from "@/lib/spine/driver";

import { Flowchart, flowFromSteps } from "./Flowchart";
import { Field, Input } from "./forms";
import type { PlanStep, PlanStepState } from "./PlanCard";
import { GLYPH_FOR_STATION, StationGlyph } from "./station-glyphs";
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
 * private six-value enum here is how "skipped" comes to mean two things.
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
};

/** Only for the states with no chip, so a screen reader still gets the word. */
const SPOKEN: Partial<Record<PlanStepState, string>> = {
  pending: "Not started",
  done: "Done",
  skipped: "Off the route",
};

/**
 * The mark's own ink, and there are only three values it may take.
 *
 * NOT A PER-STATION RAMP. `--mrd-agent` says a machine is working, `--mrd-fail`
 * says an outcome, and everything else is ink or faint by how settled it is.
 * Which station it is comes entirely from the drawing.
 */
function markTone(state: PlanStepState): string {
  if (state === "active") return "text-mrd-agent";
  if (state === "failed") return "text-mrd-fail";
  if (state === "done") return "text-mrd-ink";
  return "text-mrd-faint";
}

/**
 * Taking a station off the route, which cannot be completed without a reason.
 *
 * SAME MECHANIC AS `PlanCard`'s SKIP, AND THAT IS A DUPLICATION I AM NAMING
 * RATHER THAN HIDING: Enter submits, Escape cancels, the commit is guarded on a
 * trimmed non-empty value, and the submit is dead until then. Two copies of one
 * mechanic will drift, and the right fix is a `ReasonField` in `forms.tsx` that
 * both call. That is a third file this item does not own, so it is recorded in
 * the build log instead of done quietly here.
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
  const [reason, setReason] = React.useState("");
  const inputId = `run-map-waive-${station}`;
  const ready = reason.trim().length > 0;
  const commit = () => {
    if (ready) onCommit(reason.trim());
  };

  return (
    <div className="mt-mrd-3 flex flex-col gap-mrd-3">
      <Field
        label={`Why is ${AGENT_STATIONS[station].name} coming off the route?`}
        hint="It stays on the record beside the route, so the next reader can see the call rather than a gap."
        htmlFor={inputId}
      >
        <Input
          id={inputId}
          value={reason}
          autoFocus
          placeholder="The notice reuses a shipped component, so there is nothing new to draw"
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
        />
      </Field>
      <Actions>
        {/*
         * QUIET, NOT `destructive`. Taking a station off a route that has not
         * started removes nothing that exists: no work has run there and none is
         * lost. What makes it safe is that it cannot be done without a reason,
         * which is a different guard from volume. `destructive` is for a click
         * that stops or removes something real.
         */}
        <Action variant="quiet" onClick={commit} disabled={!ready}>
          Take it off the route
        </Action>
        <Action variant="quiet" onClick={onCancel}>
          Keep it
        </Action>
      </Actions>
    </div>
  );
}

/** One station on the spine. */
function Stop({
  stop,
  mode,
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

  return (
    <li className="flex min-w-0 shrink-0 flex-col" style={{ width: 168 }}>
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
          className={`mrd-focus-inset flex w-full items-start gap-2 rounded-mrd-ctl px-2 py-2 text-left transition-colors duration-100 hover:bg-mrd-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]`}
        >
          <StopFace stop={stop} meta={meta} chip={chip} waived={waived} hold={hold} />
          <span className="mt-[3px] shrink-0 text-mrd-mute">
            <Chevron open={open} />
          </span>
        </button>
      ) : (
        <div className="flex w-full items-start gap-2 px-2 py-2">
          <StopFace stop={stop} meta={meta} chip={chip} waived={waived} hold={hold} />
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
}: {
  stop: RunMapStation;
  meta: { name: string };
  chip?: { status: StatusWord; word: string };
  waived: boolean;
  hold: string | null;
}) {
  const spoken = SPOKEN[stop.state];
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="flex min-w-0 items-center gap-2">
        <span
          {...(spoken ? { role: "img", "aria-label": `${meta.name}, ${spoken}` } : {})}
          className={`flex size-[18px] shrink-0 items-center justify-center ${markTone(stop.state)}`}
        >
          <StationGlyph kind={GLYPH_FOR_STATION[stop.station]} size={16} />
        </span>
        <span
          className={`min-w-0 truncate text-mrd-label font-medium ${
            waived ? "text-mrd-mute line-through decoration-mrd-line" : "text-mrd-ink"
          }`}
        >
          {meta.name}
        </span>
      </span>

      {chip ? (
        <span className="flex">
          <StatusChip status={chip.status} pulse={chip.status !== "fail"}>
            {chip.word}
          </StatusChip>
        </span>
      ) : null}

      {/*
       * WHAT CAME OF IT, in outcome words. Wraps rather than truncates, because
       * half an outcome is worse than a wrapped one and this is the whole reason
       * the map is read rather than the spine strip in the shell.
       */}
      {stop.outcome ? (
        <span className="text-mrd-data leading-relaxed text-mrd-body">{stop.outcome}</span>
      ) : null}

      {/* K-18's sentence, verbatim from `holdLine`. Never re-worded here: one
          copy of the words, in `driver.ts`, or they drift. */}
      {hold ? <span className="text-mrd-data leading-relaxed text-mrd-mute">{hold}</span> : null}

      {/*
       * A WAIVED STATION CARRIES ITS REASON, AND SAYS SO WHEN IT HAS NONE.
       *
       * The founder ruling is that a skip is a decision with a reason rather than
       * an absence, so a waiver that arrived without one has to admit it rather
       * than render as though skipping needed no argument. Hiding it would let
       * the record look complete when it is not.
       */}
      {waived ? (
        <span className="text-mrd-data leading-relaxed text-mrd-mute">
          {stop.waivedReason ?? "Nobody said why this station came off the route."}
        </span>
      ) : null}
    </span>
  );
}

export function RunMap({
  stops,
  mode = "replay",
  label = "The route this work takes",
  onWaive,
}: {
  /** In route order. An empty route is a real state, drawn below. */
  stops: RunMapStation[];
  mode?: RunMapMode;
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
        <p className="mt-1 max-w-[62ch] text-mrd-small leading-relaxed text-mrd-mute">
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
        className="mrd-fade-scroll flex list-none items-start gap-1 overflow-x-auto pb-1"
      >
        {stops.map((stop) => (
          <Stop
            key={stop.station}
            stop={stop}
            mode={mode}
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
