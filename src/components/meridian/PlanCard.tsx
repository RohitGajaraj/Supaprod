import * as React from "react";

import { agentDisplayName } from "@/lib/agent-vocabulary";
import { REVERSIBILITY_LABEL, type Reversibility } from "@/lib/tool-consequences";

import { ReasonField } from "./forms";
import { StatusChip } from "./StatusChip";
import {
  RUN_LINE,
  RUN_ROW,
  RUN_STACK,
  RunClockEmpty,
  RunMeta,
  RunNote,
  RunRail,
  RunSubject,
} from "./run-rows";
import { STATION_GLYPHS, type StationGlyphKind } from "./station-glyphs";
import { Action, Actions, Approve } from "./surface-parts";

/*
 * THE PLAN: what an agent commits to BEFORE it acts.
 *
 * ── WHY THIS EXISTS, AND WHY IT IS NOT A VARIANT OF ANYTHING ─────────────
 * Every step display in this system is RETROSPECTIVE. `Thinking` variant Steps
 * shows what happened. `TaskRows` shows units of work in flight or settled.
 * `RunTimeline` is a record of events that already occurred. None of them can
 * draw a step that has NOT STARTED, and that is not a gap in their styling, it is
 * a gap in their vocabulary: `TaskStatus` is `running | done | failed | blocked`,
 * with no `pending` and no `skipped`, and `taskStatus()` collapses every value it
 * does not recognise to `blocked`. So a step nobody has begun renders as a step
 * that is STUCK, which is the opposite fact, and it renders that way for a reader
 * who is about to decide whether to approve the plan.
 *
 * DO NOT EXTEND `TaskStatus` TO FIX THAT. Conflating the two is what produced the
 * `blocked` bug. A task is a thing being done; a plan step is a thing PROMISED.
 *
 * ── WHY A PLAN IS WORTH A COMPONENT AT ALL ──────────────────────────────
 * It is the governance doctrine's shape. Policy is set in advance and does not
 * block; permission is asked in the moment and does. A plan is the surface where
 * a person can set the boundary ONCE, at the top, instead of being asked fourteen
 * times on the way down. Instrumented sessions put roughly 70% of a person's
 * decisions at PLANNING and 20% at execution, and 93% of in-the-moment permission
 * prompts are approved, which is a queue nobody is reading.
 *
 * ── THE RHYTHM IS NOT THIS FILE'S TO CHOOSE ─────────────────────────────
 * Row height, gutter, glyph size and every type stop come from `run-rows.tsx`.
 * This card, `RunTimeline` and `ToolStream` are three views of one run and they
 * shipped in three rhythms: 18px marks against 13px, a 10px gutter against 6 and
 * 8, a 13px subject against 12.5. Every value was defensible alone and none was
 * chosen against its neighbours.
 *
 * The subject came DOWN from 13px to 12.5, which needs saying because the ratchet
 * law forbids shrinking type. The floor that law protects is Meridian and
 * beautifului.dev, never a number I picked two hours earlier: 12.5 is `Thinking`'s
 * dense-trace row and this is a dense trace. The card's TITLE stays at 13, which
 * is the ladder's "a card's subject", a different role.
 *
 * ── THE CLOCK COLUMN IS DELIBERATELY EMPTY HERE ─────────────────────────
 * A plan is forward-looking, so no step has a time yet. The column is HELD OPEN
 * rather than removed, because the whole point of a shared grid is that the body
 * text of all three views starts on the same pixel. Closing it up would put this
 * card's subjects 54px left of the timeline's, which is the misalignment this
 * rework exists to remove, reintroduced from the other direction.
 *
 * ── THE EIGHT STATES, AND WHAT EACH IS ALLOWED TO WEAR ──────────────────
 *
 *   pending         no chip, hollow mark. Promised, not started. NOT blocked.
 *   active          agent chip. A machine is working on this one, now.
 *   done            pass chip. This step of the promise was kept.
 *   skipped         no chip, struck through, WITH ITS REASON.
 *   failed          fail chip. An outcome, and the only thing red may mean.
 *   needs-approval  you chip. A person is required before this one moves.
 *   held            hold chip. Stopped, and NOT on a person: a condition has to
 *                   change, and eleven of them change outside this product.
 *   here            no chip, inked mark. Where the work stands, and nothing is
 *                   moving it. A POSITION rather than a status, which is why it
 *                   wears no hue and no chip. (Both joined 2026-08-25.)
 *
 * The status colour is a CHIP rather than coloured text, which is not a style
 * change: on paper the five status hues collapse into 5.06 to 6.00 against the
 * ground and stop reading as colour at all, and no value fixes it because the
 * sRGB gamut has no chroma at the lightness the contrast floor forces. The
 * argument and the measurements are in meridian.css.
 *
 * `pending` and `skipped` carry NO chip, and that is the same restraint the
 * timeline applies to `done`: a chip on every row makes the rows that need one
 * invisible. Both are said by the MARK and, for a skip, by its reason.
 *
 * ── A SKIPPED STEP CARRIES ITS REASON, AND THAT IS A RULING ─────────────
 * Founder ruling: a skipped station is a DECISION ON THE RECORD with a reason,
 * not an absence. So a skipped step with nothing in `why` renders a visible
 * admission that nobody said, rather than rendering as though skipping needed no
 * argument.
 */

/**
 * Eight, and the two the task vocabulary is missing are the reason this exists.
 *
 * ── `held` AND `here` JOINED 2026-08-25, CLOSING SPEC-LAYOUT GAP G1 ──────
 * `RunMap` renders a live route from this vocabulary, and the spec for the run
 * page found it could not say two things a route says constantly:
 *
 *   held  stopped, and NOT on a person. Eleven of the driver's hold reasons
 *     clear from OUTSIDE the product -- a source connected, an account topped
 *     up, a spec written -- so "stopped on a condition" is a different sentence
 *     from `needs-approval` and from `failed`. It was being drawn as `active`,
 *     which claimed a machine was working on a track that had stopped. The
 *     tokens existed (`--mrd-hold`, `--mrd-hold-chip`) and `StatusChip` already
 *     took `status="hold"`; the STATE was the gap.
 *
 *   here  where the work stands, and nothing is moving it. This is the most
 *     common state in the product's history -- 58 of 59 tracks entered at
 *     Discover and stopped -- and the vocabulary had no way to say it that did
 *     not also claim something. `pending` says "not started yet", which loses
 *     the position; `active` says "a machine is working", which is false. It is
 *     deliberately NOT a status: nothing is wrong, nothing is waiting on
 *     anybody, the work is simply standing there between turns.
 *
 * They are added HERE rather than as a private enum in `RunMap` for the reason
 * that file's own header gives: `PlanCard` and `RunMap` are read minutes apart
 * on the same piece of work, and a private six-value enum is how "skipped"
 * comes to mean two things.
 */
export type PlanStepState =
  "pending" | "active" | "done" | "skipped" | "failed" | "needs-approval" | "held" | "here";

export type PlanStep = {
  id: string;
  /** What the step will do, in a reader's words. Never a tool or a mechanism. */
  label: string;
  state: PlanStepState;
  /** Who will do it. Resolved through `agentDisplayName`, so no slug leaks. */
  agentSlug?: string | null;
  /**
   * Which station this step happens at. DRAWN, never written: law 4, identity is
   * shape. It is one of the seven, so a drawing is guaranteed to exist, which is
   * what makes it safe to spend the mark slot on.
   */
  station?: StationGlyphKind;
  /**
   * Why this step was skipped, or why it failed. Required in spirit on `skipped`:
   * see the ruling in the header.
   */
  why?: string;
  /**
   * WHAT THIS STEP WILL ACT ON. A branch, a path, an artifact title, a recipient.
   *
   * Founder review 2026-08-20: *"There should be a little context."* The label is
   * the intent and it is not enough to decide on: "open the pull request" does not
   * say against which branch, and a person approving a plan is deciding about the
   * object, not the verb. Set in mono, because every value of it is an identifier
   * somebody could copy.
   *
   * Optional, and absent is the honest default rather than a gap to fill: a step
   * whose object the planner does not know yet must not have one invented for it.
   */
  touches?: string;
  /**
   * WHETHER IT CAN BE UNDONE, and it is the other half of the context.
   *
   * `Reversibility` from `tool-consequences.ts` rather than a boolean of my own,
   * for two reasons. It is the vocabulary the rest of the product already decides
   * with (the approvals queue prints `REVERSIBILITY_LABEL`, `approval-policy.ts`
   * gates on it), so a step and a gate cannot describe the same fact two ways. And
   * it is three-valued: `partial` is most of the catalogue, and a boolean would
   * have had to round it to one of the ends.
   *
   * DRAWN ONLY WHEN IT IS NOT `reversible`. "This can be undone" is the assumption
   * a reader already holds, so stating it spends a line to say nothing; the two
   * values that change a decision are the two that are shown.
   */
  reversible?: Reversibility;
};

/**
 * SIX MARKS, SIX SHAPES, one 24-grid.
 *
 * The states must be tellable apart with the colour removed, so the shape carries
 * the whole distinction and the chip only confirms it.
 *
 *   pending         a thin hollow ring. Present, nothing has happened in it.
 *   active          an arc, and the only thing on the card that moves.
 *   done            a filled disc with a check. Settled, so it is solid.
 *   failed          a filled disc with a cross. Settled the other way.
 *   skipped         a hollow ring struck through. Deliberately passed over.
 *   needs-approval  a hollow ring with a solid centre: something is IN it,
 *                   waiting, and the ring has not closed.
 *   held            a hollow ring with two upright bars. Stopped, and it can
 *                   start again: the one mark in the set that reads as PAUSED
 *                   rather than as finished, passed over or broken.
 *   here            a ring inside a ring. A position marker, and it is the only
 *                   mark whose meaning is WHERE rather than HOW IT WENT, which
 *                   is why it draws a target rather than a state.
 *
 * A STEP WITH A STATION DRAWS THE STATION INSTEAD, because that is the more
 * useful identity: which station a step belongs to is what a reader is deciding
 * about, and its state is already on the chip beside it. The ring set is what a
 * step with no station wears.
 */
const MARK_HUE: Record<PlanStepState, string> = {
  pending: "text-mrd-faint",
  active: "text-mrd-agent",
  done: "text-mrd-pass",
  skipped: "text-mrd-mute",
  failed: "text-mrd-fail",
  "needs-approval": "text-mrd-you",
  held: "text-mrd-hold",
  /* Neutral, and it is the colour law rather than a taste. `here` is a
     POSITION, and hue in this system carries status; the strongest neutral says
     "this one" without claiming anything has gone right or wrong. */
  here: "text-mrd-ink",
};

function Ring({ state }: { state: PlanStepState }) {
  const r = 6.5;
  const c = 2 * Math.PI * r;
  const solid = state === "done" || state === "failed";

  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      /*
       * Inline, so meridian.css's reduced-motion block catches it. An animation
       * declared in a utility class keeps turning for somebody who asked it not
       * to, which is a defect this repo has already paid for in six files.
       */
      style={state === "active" ? { animation: "mrd-spin 1.1s linear infinite" } : undefined}
    >
      {solid ? (
        <circle cx="12" cy="12" r={r + 1.4} fill="currentColor" />
      ) : (
        <circle
          cx="12"
          cy="12"
          r={r + 1.4}
          fill="none"
          stroke={state === "pending" ? "var(--mrd-line)" : "currentColor"}
          strokeWidth="1.7"
          /* A fixed 28% of the circumference, turning. It says a machine holds
             this and claims nothing about how far in it is. */
          strokeDasharray={state === "active" ? `${c * 0.28} ${c * 0.72}` : undefined}
          strokeLinecap={state === "active" ? "round" : undefined}
        />
      )}

      {state === "done" ? (
        <path
          d="M8.4 12.2l2.3 2.3 4.9-5.2"
          fill="none"
          stroke="var(--mrd-bg)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {state === "failed" ? (
        <path
          d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6"
          fill="none"
          stroke="var(--mrd-bg)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : null}

      {state === "skipped" ? (
        <path
          d="M6.6 12h10.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      ) : null}

      {state === "needs-approval" ? <circle cx="12" cy="12" r="3.6" fill="currentColor" /> : null}

      {/* PAUSED, not broken and not passed over. Two upright bars is the one
          gesture a reader already reads as "it can start again", which is
          exactly what a hold is: eleven of the driver's reasons clear from
          outside the product and the work resumes where it stood. */}
      {state === "held" ? (
        <path
          d="M10.2 9.2v5.6M13.8 9.2v5.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      ) : null}

      {/* A TARGET: a ring inside the ring. Every other mark in this set reports
          how a step WENT; this one reports where the work IS, so it says "this
          one" and nothing about an outcome. Hollow throughout on purpose --
          anything filled would read as settled. */}
      {state === "here" ? (
        <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.9" />
      ) : null}
    </svg>
  );
}

function StepMark({ step }: { step: PlanStep }) {
  /*
   * The mark carries the state's WORD for anyone who is listening rather than
   * looking, and only where no chip already says it. Announcing it twice is the
   * defect `AgentMark` and `ProviderMark` both avoid by staying `aria-hidden`
   * wherever their subject is named in text beside them.
   */
  const spoken = MARK_LABEL[step.state];
  return (
    <span
      {...(spoken ? { role: "img", "aria-label": spoken } : {})}
      className={`mt-[4px] flex size-[14px] shrink-0 items-center justify-center ${MARK_HUE[step.state]}`}
    >
      {step.station ? (
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {STATION_GLYPHS[step.station]}
        </svg>
      ) : (
        <Ring state={step.state} />
      )}
    </span>
  );
}

/**
 * A CHIP ONLY WHERE SOMETHING IS RUNNING, WAITING OR BROKEN. One rule, and it is
 * the same rule `RunTimeline` and `ToolStream` apply.
 *
 * `done` had a chip and lost it, which is a correction rather than a trim. A plan
 * of five steps with three finished would have carried four chips on five rows,
 * and at that density a chip stops meaning "look here" and starts meaning
 * "row". The finished step is already stated twice over by its mark, a filled
 * disc with a tick, and by the fact that the rows after it have moved on.
 *
 * `pending` and `skipped` carry none for the same reason. Their word reaches a
 * screen reader through the mark's accessible name instead, because those two are
 * the states with no chip to say it.
 */
const CHIP: Partial<
  Record<PlanStepState, { status: "agent" | "fail" | "you" | "hold"; word: string }>
> = {
  active: { status: "agent", word: "Running" },
  failed: { status: "fail", word: "Failed" },
  "needs-approval": { status: "you", word: "Needs you" },
  /* `held` earns one on the rule above: it is a step a reader has to WAIT on,
     and what clears it is usually outside this screen. `hold` is the amber that
     means "stopped, and not on you", which is the whole of it. */
  held: { status: "hold", word: "On hold" },
};

/**
 * Only for the states with no chip. Everything else says it in text already.
 *
 * `here` is in this list rather than in `CHIP` on purpose. A chip is for a state
 * a reader has to act on or wait on, and standing at a step is neither -- it is
 * where the work IS. Giving it one would put a fifth chip on a plan and make the
 * three that mean something invisible, which is the rule this pair records.
 */
const MARK_LABEL: Partial<Record<PlanStepState, string>> = {
  pending: "Not started",
  skipped: "Skipped",
  done: "Done",
  here: "Where it stands",
};

/**
 * WHICH STEPS OFFER A CONTROL, AND WHY IT IS NOT ALL OF THEM.
 *
 * There is a real tension in the item that asked for these, and it has to be
 * settled rather than split. Its own first paragraph argues the gate belongs at
 * the PLAN and not at the steps, citing the 70/20 finding: people take roughly
 * 70% of their decisions at planning and 20% at execution, and 93% of
 * in-the-moment prompts are approved, which is a queue nobody reads. Then it asks
 * for a per-step approve and skip. Drawn on every row, those two controls ARE the
 * queue the same paragraph rejects: fourteen prompts on the way down, with the
 * plan-level Approve reduced to a shortcut for pressing them all.
 *
 * So:
 *
 *   SKIP is offered on any step that has not run yet, because it is the only way
 *   to dissent from ONE step without rejecting the whole plan. That is a thing a
 *   reader wants and had no way to say: the choice was approve everything or
 *   change everything.
 *
 *   APPROVE is offered ONLY on a step whose state is `needs-approval`, where the
 *   step itself is what is being asked about. On a `pending` step it would be a
 *   second button for the click the plan-level Approve already makes, and two
 *   controls for one decision is how a person learns to stop reading either.
 *
 * That is the governance doctrine's own shape: policy set once at the top, and a
 * permission asked in the moment only where something genuinely crosses it.
 */
function offersSkip(state: PlanStepState): boolean {
  return state === "pending" || state === "needs-approval";
}

/**
 * THE REASON IS THE POINT, so the control cannot complete without one.
 *
 * A skip with no recorded why is a decision that leaves no trace, in a product
 * whose whole claim is that its record can be trusted. Reason optional makes it a
 * shrug; reason required makes it evidence. The card already draws a visible
 * admission on a skipped step that arrived with no reason, which is what this
 * stops being necessary for skips taken here.
 *
 * ── THE MECHANIC MOVED TO `forms.tsx` ON 2026-08-20 ─────────────────────
 * The body of this used to be here, and `RunMap`'s waive carried a second copy
 * of the same twenty lines: Enter submits, Escape cancels, commit guarded on a
 * trimmed non-empty value. `RunMap`'s own comment named the duplication and said
 * the fix was a `ReasonField` both called, deferred because `forms.tsx` was a
 * file it did not own. `PlanGate` became the third caller, so the extraction
 * happened then. What is left here is the WORDS, which are the part that is
 * genuinely this card's: the question a person is being asked and the example
 * under it. The behaviour is one copy now.
 */
function SkipReason({
  stepId,
  busy,
  onCommit,
  onCancel,
}: {
  stepId: string;
  busy: boolean;
  onCommit: (reason: string) => void;
  onCancel: () => void;
}) {
  return (
    <ReasonField
      id={`plan-skip-reason-${stepId}`}
      label="Why skip this?"
      hint="It goes on the record beside the step, so the next reader can see the call that was made."
      placeholder="The branch was already merged by hand"
      commitLabel="Skip this step"
      busy={busy}
      onCommit={onCommit}
      onCancel={onCancel}
    />
  );
}

function Step({
  step,
  last,
  busy,
  onApproveStep,
  onSkipStep,
}: {
  step: PlanStep;
  last: boolean;
  busy: boolean;
  onApproveStep?: (id: string) => void;
  onSkipStep?: (id: string, reason: string) => void;
}) {
  const chip = CHIP[step.state];
  const who = step.agentSlug ? agentDisplayName(step.agentSlug) : null;
  const skipped = step.state === "skipped";
  const [asking, setAsking] = React.useState(false);

  const canApprove = !!onApproveStep && step.state === "needs-approval";
  const canSkip = !!onSkipStep && offersSkip(step.state);
  /* Not `reversible`, and not absent. See the field's own note for why the third
     value is the one that never draws. */
  const undo =
    step.reversible && step.reversible !== "reversible"
      ? REVERSIBILITY_LABEL[step.reversible]
      : null;

  return (
    <li className={RUN_ROW}>
      {/* Held open, not removed. See the header: closing it would put this card's
          subjects 54px left of the timeline's. */}
      <RunClockEmpty />

      <span className="flex flex-col items-center self-stretch">
        <StepMark step={step} />
        {last ? null : <RunRail />}
      </span>

      <span className="min-w-0 pb-1">
        <span className={RUN_LINE}>
          {skipped ? (
            /* Struck through AND dimmed. Either alone is ambiguous: a strike at
               full ink reads as an edit, and a dim label with no strike reads as
               pending, which is the state it must not be confused with. */
            <span className="text-mrd-label font-medium text-mrd-mute line-through decoration-mrd-line">
              {step.label}
            </span>
          ) : (
            <RunSubject>{step.label}</RunSubject>
          )}
          {chip ? (
            <StatusChip status={chip.status} pulse={chip.status !== "fail"}>
              {chip.word}
            </StatusChip>
          ) : null}
        </span>

        {/*
         * THE REASON, and the missing case is drawn rather than hidden. A skipped
         * station is a decision on the record with a reason, so a skipped step
         * carrying no reason has to say that out loud: hiding it would let the
         * record look complete when it is not.
         */}
        {/*
         * THE CONTEXT, on one line, in the order a decision needs it: WHAT it
         * touches, then whether it can be taken back. Both sit under the subject
         * rather than beside it, so a long branch name cannot widen the row and
         * push the chip off the end of it.
         *
         * The object is mono because every value of it is an identifier somebody
         * could copy. The undo fact is prose and carries NO colour: irreversible
         * is not one of the five status words, and painting it in `fail` would
         * report an outcome for a step that has not run.
         */}
        {step.touches || undo ? (
          <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {step.touches ? (
              <span className="font-mrd-mono min-w-0 text-mrd-data break-all text-mrd-mute">
                {step.touches}
              </span>
            ) : null}
            {undo ? <span className="text-mrd-data text-mrd-faint">{undo}</span> : null}
          </span>
        ) : null}

        {step.why ? (
          <RunNote>{step.why}</RunNote>
        ) : skipped ? (
          <span className="mt-0.5 block text-mrd-data leading-mrd-prose text-mrd-mute">
            Nobody said why this was skipped.
          </span>
        ) : null}

        {who ? <RunMeta>{who}</RunMeta> : null}

        {/*
         * THE CONTROLS COME LAST, after every fact the decision rests on. A
         * control above its own context asks a person to answer before they have
         * read, which is how a queue of 93%-approved prompts happens.
         *
         * The form REPLACES them while it is open rather than appearing beneath
         * them, so there is never a live Skip button next to a Skip-this-step
         * button competing for the same press.
         */}
        {asking && onSkipStep ? (
          <SkipReason
            stepId={step.id}
            busy={busy}
            onCommit={(reason) => {
              onSkipStep(step.id, reason);
              setAsking(false);
            }}
            onCancel={() => setAsking(false)}
          />
        ) : canApprove || canSkip ? (
          <Actions className="mt-mrd-3">
            {/*
             * QUIET, NOT `Approve`, AND THAT IS A CORRECTION MADE BY LOOKING.
             *
             * It was `Approve` first, which is the component for a click that
             * unblocks and is exactly what this click does. Rendered, it was
             * wrong: a 32px orchid slab inside a step row read as the card's
             * primary action and outshouted "Approve the plan" in the footer,
             * which inverts the whole governance argument the per-step control
             * exists inside. The plan is the gate; the step is the exception.
             *
             * The row already carries the orchid `Needs you` chip two lines
             * above, so the accent is not lost, it is said once instead of
             * twice. meridian.css spends `--mrd-you` on one meaning and warns
             * that an accent firing on chrome stops meaning anything; two
             * orchid controls on one card is that failure inside one component.
             */}
            {canApprove ? (
              <Action variant="quiet" onClick={() => onApproveStep?.(step.id)} busy={busy}>
                Approve this step
              </Action>
            ) : null}
            {canSkip ? (
              <Action variant="quiet" onClick={() => setAsking(true)} busy={busy}>
                Skip it
              </Action>
            ) : null}
          </Actions>
        ) : null}
      </span>
    </li>
  );
}

export function PlanCard({
  steps,
  title = "The plan",
  approveLabel = "Approve the plan",
  onApprove,
  onRevise,
  reviseLabel = "Change it",
  busy = false,
  onApproveStep,
  onSkipStep,
}: {
  /** In the order the agent intends to run them. Empty is a real state. */
  steps: PlanStep[];
  title?: string;
  approveLabel?: string;
  /**
   * THE GATE AT THE TOP, which is the entire point of showing a plan rather than
   * reporting one. Omitted, the card is a read-only statement of intent and draws
   * no control at all: a plausible-looking button on a plan nobody can approve is
   * the affordance failure this system keeps finding.
   */
  onApprove?: () => void;
  /** The way to disagree without rejecting. Drawn only when it exists. */
  onRevise?: () => void;
  reviseLabel?: string;
  /** True while a decision is in flight. Both controls go dead, not hidden. */
  busy?: boolean;
  /**
   * APPROVE ONE STEP. Drawn only on a step whose state is `needs-approval`; see
   * `offersSkip`'s note for why it is not offered on every row.
   *
   * Omitted, no step draws it, which is the same rule `onApprove` follows: a
   * plausible-looking control on a plan nobody can act on is the affordance
   * failure this system keeps finding.
   */
  onApproveStep?: (id: string) => void;
  /**
   * SKIP ONE STEP, WITH ITS REASON. The reason is not optional and the signature
   * is why: there is no overload that omits it, so a caller cannot record a skip
   * with nothing attached even by accident.
   */
  onSkipStep?: (id: string, reason: string) => void;
}) {
  const asking = steps.filter((s) => s.state === "needs-approval").length;

  /*
   * THE ZERO CASE. A plan with no steps is not an error and must not read as one:
   * an agent that has been asked for a plan and has not filed one yet is the
   * normal first second of a run.
   *
   * `data-mrd` on the early return as well. This is exactly how a component loses
   * the attribute, because the eye reads the main return as the root and stops.
   */
  if (steps.length === 0) {
    return (
      <div
        data-mrd=""
        className="w-full max-w-[520px] rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-5 font-mrd"
      >
        <p className="text-mrd-base font-medium text-mrd-body">No plan has been filed yet.</p>
        <p className="mt-1 max-w-[62ch] text-mrd-small leading-mrd-prose text-mrd-mute">
          When the crew commits to one, every step it intends to take appears here first, with who
          is taking it and where, so the whole thing can be approved once instead of a step at a
          time.
        </p>
      </div>
    );
  }

  return (
    <div
      data-mrd=""
      className="w-full max-w-[520px] rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-5 font-mrd"
      style={{ boxShadow: "var(--mrd-shadow-card)" }}
    >
      {/*
       * The header counts the steps and, separately, how many are waiting on a
       * person. It carries NO status colour: the chips on the steps are where that
       * meaning lives, and a title painted in one of them takes the meaning off
       * the thing that has it.
       */}
      <header className="mb-mrd-5">
        <h3 className="mrd-subtitle">{title}</h3>
        <p className="mt-0.5 text-mrd-data text-mrd-mute">
          <span className="tabular-nums">{steps.length}</span>
          {steps.length === 1 ? " step" : " steps"}
          {asking > 0 ? (
            <>
              {", "}
              <span className="tabular-nums">{asking}</span> waiting on you
            </>
          ) : null}
        </p>
      </header>

      <ol className={RUN_STACK}>
        {steps.map((step, i) => (
          <Step
            key={step.id}
            step={step}
            last={i === steps.length - 1}
            busy={busy}
            onApproveStep={onApproveStep}
            onSkipStep={onSkipStep}
          />
        ))}
      </ol>

      {onApprove || onRevise ? (
        <Actions className="mt-mrd-5">
          {onApprove ? (
            <Approve onClick={onApprove} busy={busy}>
              {approveLabel}
            </Approve>
          ) : null}
          {onRevise ? (
            <Action variant="quiet" onClick={onRevise} busy={busy}>
              {reviseLabel}
            </Action>
          ) : null}
        </Actions>
      ) : null}
    </div>
  );
}

export default PlanCard;
