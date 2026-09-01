import * as React from "react";

import { ReasonField } from "./forms";
import { PlanCard, type PlanStep } from "./PlanCard";
import { RunMap, type RunMapStation } from "./RunMap";
import { Spend } from "./Spend";
import { StatusChip } from "./StatusChip";

/*
 * THE PLAN GATE: one decision, three answers, and the answer is the forecast.
 *
 * ── WHY A STEP-LEVEL GATE CANNOT BE RESCUED BY BETTER DESIGN ─────────────
 * Anthropic's instrumented sessions: people make about 70% of PLANNING decisions
 * and about 20% of EXECUTION decisions, while one prompt triggers roughly ten
 * agent actions. And 93% of permission prompts are approved, which they name
 * approval fatigue. **A gate that gets clicked through is worse than no gate,
 * because it manufactures the appearance of review while producing none of it.**
 *
 * Our own record agrees and is worse: six agents at a 100% approval rate, and
 * eleven tools asked 130 times and answered zero times. So the fix is not a
 * better-looking confirm on each step. It is to move the whole decision to the
 * one moment a person genuinely wants it, before anything runs, and then to let
 * the run alone.
 *
 * That is the governance doctrine as a component: policy is set in advance and
 * does not block; permission is asked in the moment and does. **This is the
 * policy surface, so it is the one place a long queue is allowed to be replaced
 * by a single answer.**
 *
 * ── THE ANSWER IS A FORECAST, AND THAT IS THE MOAT, NOT A FEATURE ────────
 * Choosing how much rope a run gets, BEFORE the outcome is known, is a recorded
 * belief about that work. It is the one thing about a decision that cannot be
 * reconstructed afterwards: causes survive in artifacts, forecasts do not. So the
 * forecast stops needing a form of its own and becomes the by-product of a gate
 * that has to exist anyway.
 *
 * **It is never presented as one.** No score, no confidence, no scoreboard, and
 * no language about prediction anywhere a person reads. A pitch that leads with
 * the forecast sells accountability to the person who would be held accountable,
 * and a SURFACE that does it is worse, because they have to look at it daily.
 * What the reader sees is three plain answers about how much rope to give.
 *
 * ── THE INFORMATION MODEL IS PORTED, NOT INVENTED ───────────────────────
 * The reference is Claude Code's own permission prompt, which is the most-used
 * agent gate in this market and has the shape this component needs: a numbered
 * list of two or three answers, each a full sentence, one keystroke each, and
 * **no accent on any of them**. Its third answer is the one worth copying most
 * exactly, "No, and tell Claude what to do differently": refusing and redirecting
 * are the same act, so they are one answer rather than a rejection followed by a
 * separate instruction.
 *
 * WHY NOTHING HERE IS `Approve`, which looks like an omission and is not.
 * `Approve` means the control that unblocks something, and orchid is spent on it.
 * All three answers here release the gate, so either all three wear it, which is
 * three accents and not a decision, or none does. **None does, and the card says
 * a person is required with a chip instead.** Status is a chip and never an
 * accent on a control; a house favourite among the three would also be the
 * product making the call it is asking the reader to make.
 *
 * ── IT WRITES NOTHING ───────────────────────────────────────────────────
 * Every edit is local state and the decision leaves as a value. No fetch, no
 * mutation, no persistence: the caller owns what a decision means, because
 * `agent_autonomy` and the decision record are a schema question and this is a
 * component.
 */

/**
 * How much rope the run gets. Three, and there is no fourth.
 *
 * A fourth would be a dial, and a dial is the thing this component exists
 * instead of: the whole point is that one answer replaces a queue, and a
 * continuum cannot be answered with one keystroke.
 */
export type Autonomy = "run-it" | "check-writes" | "keep-planning";

export type PlanGateDecision = {
  autonomy: Autonomy;
  /**
   * The plan as it stands at the moment of the answer, which is not necessarily
   * the plan that was proposed. A gate you cannot redirect is a speed bump.
   */
  editedPlan: { steps: PlanStep[]; stops: RunMapStation[] };
  /**
   * Present on `keep-planning` and absent otherwise, and that asymmetry is
   * deliberate rather than an oversight. Sending work back with no note is the
   * same shrug that a skip with no reason is: the crew replans from the same
   * brief and files the same thing, and the round trip bought nothing. The other
   * two answers start the work as shown, so there is nothing to say.
   */
  reason?: string;
};

/** One answer: what it is called, and what it actually does. */
const ANSWERS: ReadonlyArray<{ id: Autonomy; label: string; consequence: string }> = [
  {
    id: "run-it",
    label: "Start it, and let it run",
    /*
     * "within the boundaries you set" and never "autonomously". The reader is not
     * granting a blanket freedom, they are declining to be asked again inside
     * limits that already exist, and the four floors no boundary may lower still
     * apply whatever is answered here.
     */
    consequence:
      "It runs to the end inside the boundaries you have already set, and tells you when it is done.",
  },
  {
    id: "check-writes",
    label: "Start it, check with me on writes",
    /*
     * NAMES THE WRITES, and that is the whole difference between this answer and
     * the first one being a real choice. "Confirm on external writes" is a
     * category; a pull request, an email and a ticket are things a person can
     * picture and decide about.
     */
    consequence:
      "It stops and asks before anything leaves this workspace: a pull request, an email, a ticket.",
  },
  {
    id: "keep-planning",
    label: "Keep planning",
    /*
     * SAYS THE PRICE OF THIS ANSWER IS ZERO, because that is the fact that makes
     * it safe to take and the reason the gate sits before any spend rather than
     * after the first step.
     */
    consequence:
      "Nothing runs and nothing is charged. Say what to change and the crew comes back with a new plan.",
  },
];

/** The three keys, in answer order, so the accelerator cannot drift from the list. */
const KEYS = ANSWERS.map((_, i) => String(i + 1));

export function PlanGate({
  steps,
  stops = [],
  spend,
  title = "This is the plan",
  busy = false,
  onDecide,
}: {
  /** The plan, in the order the crew intends to run it. */
  steps: PlanStep[];
  /** The route, when the work has one. Empty means no route yet and draws none. */
  stops?: RunMapStation[];
  /**
   * THE CEILING, AND IT IS SHOWN BEFORE THE CHOICE RATHER THAN AFTER.
   *
   * A person deciding how much rope to give is deciding how much money to spend
   * without being asked again, so the amount belongs above the answers. Reporting
   * it afterwards is reporting it too late to be a decision.
   */
  spend: {
    label: string;
    spent: number;
    cap: number | null;
    currency?: string;
    alertAt?: number;
    /** What happens at the ceiling, in the caller's words. See `Spend`. */
    note?: React.ReactNode;
  };
  title?: string;
  /** True while a decision is in flight. The answers go dead and editing stops. */
  busy?: boolean;
  onDecide: (decision: PlanGateDecision) => void;
}) {
  /*
   * THE EDITS ARE LOCAL AND SEEDED ONCE. `useState` initialisers rather than an
   * effect syncing from props: a gate whose plan is replaced under the reader
   * mid-decision would discard the edits they had just made, and the caller
   * remounting it with a new plan is the honest way to replace one.
   */
  const [plan, setPlan] = React.useState(steps);
  const [route, setRoute] = React.useState(stops);
  const [asking, setAsking] = React.useState(false);

  const editable = !busy;

  const take = React.useCallback(
    (id: Autonomy) => {
      if (busy) return;
      /* The third answer needs its note first, so the key opens the ask rather
         than committing. It is the one answer that is not one keystroke, and it
         is the one where a keystroke alone would record nothing. */
      if (id === "keep-planning") {
        setAsking(true);
        return;
      }
      onDecide({ autonomy: id, editedPlan: { steps: plan, stops: route } });
    },
    [busy, onDecide, plan, route],
  );

  /*
   * A PLAN WITH NO STEPS IS NOT A GATE. There is nothing to decide about, so the
   * card says that rather than drawing three answers about an empty plan, which
   * would be a decision a person could take and that would mean nothing.
   *
   * `data-mrd` on the early return too: this is exactly how a component loses the
   * attribute and its focus ring, because the eye reads the main return as the
   * root and stops.
   */
  if (plan.length === 0) {
    return (
      <div
        data-mrd=""
        className="w-full max-w-[520px] rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-5 font-mrd"
      >
        <p className="text-mrd-base font-medium text-mrd-body">
          There is no plan to decide on yet.
        </p>
        <p className="mt-1 max-w-[62ch] text-mrd-small leading-mrd-prose text-mrd-mute">
          The crew files one before it starts, and this is where you say how much of it can run
          without you. Nothing is charged while it is being written.
        </p>
      </div>
    );
  }

  return (
    <div
      data-mrd=""
      className="flex w-full max-w-[520px] flex-col gap-mrd-5 font-mrd"
      /*
       * THE ACCELERATORS LIVE ON THE CARD, not on each button, so a key works
       * wherever focus happens to be inside the gate. Guarded twice: not while
       * the reason field is open, and never when focus is in a text control,
       * because typing "1" into a reason must type a 1.
       */
      onKeyDown={(event) => {
        if (asking || busy) return;
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        const el = event.target as HTMLElement | null;
        const tag = el?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;
        const at = KEYS.indexOf(event.key);
        if (at === -1) return;
        event.preventDefault();
        take(ANSWERS[at]!.id);
      }}
    >
      <header>
        <div className="flex flex-wrap items-center gap-mrd-3">
          <h3 className="mrd-subtitle">{title}</h3>
          {/* The status is a chip and the answers carry no colour at all. */}
          <StatusChip status="you">Needs you</StatusChip>
        </div>
        <p className="mt-0.5 max-w-[62ch] text-mrd-data leading-mrd-prose text-mrd-mute">
          Change anything you disagree with first. You are answering once, and the answer decides
          how much of the rest happens without you.
        </p>
      </header>

      {/*
       * NO GATE ON THE PLAN CARD ITSELF. `onApprove` is deliberately not passed:
       * two approve controls on one screen is two decisions, and the whole claim
       * of this component is that there is one. What the card keeps is its EDITS,
       * which is what makes the single decision honest.
       */}
      <PlanCard
        steps={plan}
        title="What it will do"
        busy={busy}
        onSkipStep={
          editable
            ? (id, why) =>
                setPlan((prev) =>
                  prev.map((s) => (s.id === id ? { ...s, state: "skipped", why } : s)),
                )
            : undefined
        }
      />

      {route.length > 0 ? (
        <section className="flex flex-col gap-mrd-3">
          {/*
           * A VISIBLE HEADING, because `RunMap`'s own `label` is an `aria-label`
           * on its list and nothing else. Standing alone in the gallery under a
           * panel title that says what it is, that is fine. Here it arrived as
           * three station names and three "Take it off" controls floating between
           * the plan and the ceiling, with nothing saying they were a route. Same
           * scale as the plan card's own title, so the two read as two sections of
           * one decision rather than two components that happen to be stacked.
           */}
          <h4 className="mrd-subtitle">Where it goes</h4>
          <RunMap
            stops={route}
            mode="editable"
            label="Where it goes"
            onWaive={
              editable
                ? (station, waivedReason) =>
                    setRoute((prev) =>
                      prev.map((s) =>
                        s.station === station ? { ...s, state: "skipped", waivedReason } : s,
                      ),
                    )
                : undefined
            }
          />
        </section>
      ) : null}

      {/*
       * THE MEASURE IS THE COLUMN'S, not the component's own 320px default, and
       * that is a correction made by looking. At 320 the two amounts landed in the
       * middle of a 520 column with nothing aligned to them, while the plan above
       * and the answers below both ended at 520. Rule 4: siblings share a rhythm
       * or they are not a set.
       */}
      <Spend
        label={spend.label}
        spent={spend.spent}
        cap={spend.cap}
        currency={spend.currency}
        alertAt={spend.alertAt}
        note={spend.note}
        measure="max-w-[520px]"
      />

      {asking ? (
        <ReasonField
          id="plan-gate-keep-planning"
          label="What should change?"
          hint="It goes to the crew as the brief for the next plan, and stays on the record beside this one."
          placeholder="Ship behind a flag first, and leave the migration out of this pass"
          commitLabel="Send it back"
          cancelLabel="Back to the answers"
          busy={busy}
          onCommit={(reason) => {
            setAsking(false);
            onDecide({
              autonomy: "keep-planning",
              editedPlan: { steps: plan, stops: route },
              reason,
            });
          }}
          onCancel={() => setAsking(false)}
        />
      ) : (
        /*
         * A GROUP, NOT A RADIO GROUP. These are three commit controls and
         * arrowing onto one must not take it, so `role="radiogroup"` would be a
         * lie about what moving the highlight does. Tab reaches each, Enter and
         * Space activate the focused one, and the number keys above take any of
         * them from anywhere in the gate.
         */
        <div
          role="group"
          aria-label="How much of this can run without you"
          className="flex flex-col gap-mrd-3"
        >
          {ANSWERS.map((answer, i) => (
            <button
              key={answer.id}
              type="button"
              data-mrd=""
              data-answer={answer.id}
              disabled={busy}
              onClick={() => take(answer.id)}
              /*
               * NO BORDER AND NO SLAB, which is a correction made by looking and
               * is also the reference's own shape.
               *
               * They were bordered cards first. Rendered, that put FOUR bordered
               * containers in one region: the plan card plus three answers, where
               * the anti-slop standard allows one. It also made the three answers
               * heavier than the plan they are about, which inverts what the
               * reader should look at first. Claude Code's prompt has no borders
               * either: it is a numbered list where the row under the pointer
               * lights up, and the digit is the affordance.
               *
               * So the row carries a hover wash and its own focus ring. The ring
               * is explicit because a borderless row has nothing else to say
               * where the keyboard is, and it is inset so it does not overlap the
               * row above.
               */
              className="flex w-full items-start gap-mrd-3 rounded-mrd-ctl px-mrd-4 py-mrd-3 text-left transition-colors enabled:hover:bg-mrd-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)] disabled:cursor-default disabled:opacity-45"
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              {/*
               * The number is the shortcut, shown rather than described. A keycap
               * would say "this is a key" twice, and the reference numbers its
               * answers for the same reason: the digit IS the affordance.
               */}
              <span className="font-mrd-mono mt-px shrink-0 text-mrd-data tabular-nums text-mrd-faint">
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-mrd-small font-medium text-mrd-ink">{answer.label}</span>
                <span className="max-w-[62ch] text-mrd-data leading-mrd-prose text-mrd-mute">
                  {answer.consequence}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlanGate;
