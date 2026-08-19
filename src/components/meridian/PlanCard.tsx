import { agentDisplayName } from "@/lib/agent-vocabulary";

import { Action, Actions, Approve } from "./surface-parts";

/*
 * THE PLAN: what an agent commits to BEFORE it acts.
 *
 * ── WHY THIS EXISTS, AND WHY IT IS NOT A VARIANT OF ANYTHING ─────────────
 * Every step display in this system is RETROSPECTIVE. `Thinking` variant Steps
 * shows what happened. `TaskRows` shows units of work in flight or settled.
 * `RunTimeline` is a record of events that already occurred. None of them can
 * draw a step that has NOT STARTED, and that is not a gap in their styling, it
 * is a gap in their vocabulary: `TaskStatus` is `running | done | failed |
 * blocked`, with no `pending` and no `skipped`, and `taskStatus()` collapses
 * every value it does not recognise to `blocked`. So a step nobody has begun
 * renders as a step that is STUCK, which is the opposite fact, and it renders
 * that way for a reader who is about to decide whether to approve the plan.
 *
 * DO NOT EXTEND `TaskStatus` TO FIX THAT. Conflating the two is what produced
 * the `blocked` bug in the first place. A task is a thing being done; a plan
 * step is a thing PROMISED. They share four words and differ on the two that
 * matter here.
 *
 * ── WHY A PLAN IS WORTH A COMPONENT AT ALL ──────────────────────────────
 * It is the governance doctrine's shape. Policy is set in advance and does not
 * block; permission is asked in the moment and does. A plan is the surface where
 * a person can set the boundary ONCE, at the top, instead of being asked
 * fourteen times on the way down. The measured case for that is not ours:
 * instrumented sessions put roughly 70% of a person's decisions at PLANNING and
 * 20% at execution, and 93% of in-the-moment permission prompts are approved,
 * which is a queue nobody is reading. A gate at the plan is the one gate that
 * earns its interruption.
 *
 * ── THE SIX STATES, AND WHAT EACH IS ALLOWED TO WEAR ────────────────────
 *
 *   pending         neutral, hollow. Promised, not started. NOT blocked.
 *   active          --mrd-agent. A machine is working on this one, now.
 *   done            --mrd-pass. This step of the promise was kept.
 *   skipped         neutral, struck through, WITH ITS REASON.
 *   failed          --mrd-fail. An outcome, and the only thing red may mean.
 *   needs-approval  --mrd-you. A person is required before this one moves.
 *
 * `--mrd-you` AND `--mrd-agent` APPEAR NOWHERE ELSE IN THIS FILE. Not on the
 * header, not on a count, not on the card's edge. Both are load-bearing here:
 * orchid says a person is required and azure says a machine is working, and a
 * card that also paints its own title in one of them has spent the distinction.
 *
 * `done` IS GREEN HERE AND NEUTRAL IN `RunTimeline`, deliberately. A timeline is
 * a record, where forty green rows assert a success nobody checked. A plan is a
 * CHECKLIST against a commitment, where the whole reason to look is which parts
 * of the promise have been kept. Same token, two contexts, and the difference is
 * whether ticking things off is the surface's purpose.
 *
 * ── A SKIPPED STEP CARRIES ITS REASON, AND THAT IS A RULING ─────────────
 * Founder ruling: a skipped station is a DECISION ON THE RECORD with a reason,
 * not an absence. So `skipped` is the one state whose reason is not optional in
 * spirit, and a skipped step with nothing in `why` renders a visible admission
 * that nobody said, rather than rendering as though skipping needed no argument.
 */

/** Six, and the two the task vocabulary is missing are the reason this exists. */
export type PlanStepState = "pending" | "active" | "done" | "skipped" | "failed" | "needs-approval";

export type PlanStep = {
  id: string;
  /** What the step will do, in a reader's words. Never a tool or a mechanism. */
  label: string;
  state: PlanStepState;
  /** Who will do it. Resolved through `agentDisplayName`, so no slug leaks. */
  agentSlug?: string | null;
  /**
   * Where it happens, as a DISPLAY label the caller has resolved. Not a slug:
   * this repo has no single station-label mapping and a seventh private one
   * inside a component is how four disagreeing status normalisers happened.
   */
  station?: string;
  /**
   * Why this step was skipped, or why it failed. Required in spirit on
   * `skipped`: see the ruling in the header.
   */
  why?: string;
};

const HUE: Record<PlanStepState, string> = {
  pending: "text-mrd-faint",
  active: "text-mrd-agent",
  done: "text-mrd-pass",
  skipped: "text-mrd-mute",
  failed: "text-mrd-fail",
  "needs-approval": "text-mrd-you",
};

/**
 * The state as a WORD, on every step that carries one.
 *
 * This is the greyscale rule paid for in markup rather than only in ink, and it
 * is also the accessibility half: a person who cannot separate orchid from
 * amber and a person listening rather than looking both get the state. `pending`
 * says nothing, because most steps of a fresh plan are pending and a column of
 * the word would be the loudest thing on a card whose subject is the work.
 */
const STATE_WORD: Record<PlanStepState, string> = {
  pending: "",
  active: "running now",
  done: "done",
  skipped: "skipped",
  failed: "failed",
  "needs-approval": "needs you",
};

/**
 * SIX MARKS, SIX SHAPES. The states must be tellable apart with the colour
 * removed, so the shape carries the whole distinction and the hue only confirms
 * it.
 *
 *   pending         a thin hollow ring. Present, and nothing has happened in it.
 *   active          an arc, and the only thing on the card that moves.
 *   done            a filled disc with a check. Settled, so it is solid.
 *   failed          a filled disc with a cross. Settled the other way.
 *   skipped         a hollow ring struck through. Deliberately passed over.
 *   needs-approval  a hollow ring with a solid centre: something is IN it,
 *                   waiting, and the ring has not closed.
 *
 * All six are 18px, so a step changing state never reflows the list.
 */
function Mark({ state }: { state: PlanStepState }) {
  const size = 18;
  const stroke = 1.8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  const solid = state === "done" || state === "failed";

  return (
    <span
      className={`relative mt-[1px] flex shrink-0 items-center justify-center ${HUE[state]}`}
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        /*
         * Inline, so meridian.css's reduced-motion block catches it. An
         * animation declared in a utility class keeps turning for somebody who
         * asked it not to, which is a defect this repo has already paid for.
         */
        style={state === "active" ? { animation: "mrd-spin 1.1s linear infinite" } : undefined}
      >
        {solid ? (
          <circle cx={mid} cy={mid} r={r} fill="currentColor" />
        ) : (
          <circle
            cx={mid}
            cy={mid}
            r={r}
            fill="none"
            stroke={state === "pending" ? "var(--mrd-line)" : "currentColor"}
            strokeWidth={stroke}
            /* The arc is the only incomplete ring. It is not a progress
               reading: it is a fixed 28% of the circumference, turning, which
               says a machine holds this and claims nothing about how far in it
               is. */
            strokeDasharray={state === "active" ? `${c * 0.28} ${c * 0.72}` : undefined}
            strokeLinecap={state === "active" ? "round" : undefined}
          />
        )}

        {state === "done" ? (
          <path
            d="M5.2 9.2l2.6 2.6 5-5.4"
            fill="none"
            stroke="var(--mrd-bg)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {state === "failed" ? (
          <path
            d="M6.2 6.2l5.6 5.6M11.8 6.2l-5.6 5.6"
            fill="none"
            stroke="var(--mrd-bg)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : null}

        {state === "skipped" ? (
          <path
            d="M4.6 9h8.8"
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        ) : null}

        {state === "needs-approval" ? <circle cx={mid} cy={mid} r={3.2} fill="currentColor" /> : null}
      </svg>
    </span>
  );
}

function Step({ step, last }: { step: PlanStep; last: boolean }) {
  const hue = HUE[step.state];
  const word = STATE_WORD[step.state];
  const who = step.agentSlug ? agentDisplayName(step.agentSlug) : null;
  const meta = [who, step.station].filter(Boolean).join(" · ");
  const skipped = step.state === "skipped";

  return (
    <li className="flex gap-mrd-4">
      {/* The rail joins the steps into one plan and stops at the last mark,
          because a line continuing past the final step promises a step that
          was never promised. */}
      <span className="flex flex-col items-center">
        <Mark state={step.state} />
        {last ? null : <span aria-hidden className="w-px flex-1 bg-mrd-line" />}
      </span>

      <span className="min-w-0 flex-1 pb-mrd-4">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={`text-[13px] font-medium ${
              /* Struck through AND dimmed. Either alone is ambiguous: a strike
                 with full ink reads as an edit, and a dim label with no strike
                 reads as pending. Both, and it reads as passed over. */
              skipped ? "text-mrd-mute line-through decoration-mrd-line" : "text-mrd-ink"
            }`}
          >
            {step.label}
          </span>
          {word ? <span className={`text-[11px] ${hue}`}>{word}</span> : null}
        </span>

        {meta ? <span className="mt-0.5 block text-[11px] text-mrd-mute">{meta}</span> : null}

        {/*
         * THE REASON, and the missing case is drawn rather than hidden. A
         * skipped station is a decision on the record with a reason, so a
         * skipped step carrying no reason has to say that out loud: hiding it
         * would let the record look complete when it is not.
         */}
        {step.why ? (
          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-mrd-body">
            {step.why}
          </span>
        ) : skipped ? (
          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-mrd-mute">
            Nobody said why this was skipped.
          </span>
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
}: {
  /** In the order the agent intends to run them. Empty is a real state. */
  steps: PlanStep[];
  title?: string;
  approveLabel?: string;
  /**
   * THE GATE AT THE TOP, which is the entire point of showing a plan rather
   * than reporting one. Omitted, the card is a read-only statement of intent
   * and draws no control at all: a plausible-looking button on a plan nobody
   * can approve is the affordance failure this system keeps finding.
   */
  onApprove?: () => void;
  /** The way to disagree without rejecting. Drawn only when it exists. */
  onRevise?: () => void;
  reviseLabel?: string;
  /** True while a decision is in flight. Both controls go dead, not hidden. */
  busy?: boolean;
}) {
  const asking = steps.filter((s) => s.state === "needs-approval").length;

  /*
   * THE ZERO CASE. A plan with no steps is not an error and must not read as
   * one: an agent that has been asked for a plan and has not filed one yet is
   * the normal first second of a run.
   *
   * `data-mrd` on the early return as well. This is exactly how a component
   * loses the attribute, because the eye reads the main return as the root and
   * stops, and without it the box keeps the legacy focus ring.
   */
  if (steps.length === 0) {
    return (
      <div
        data-mrd=""
        className="w-full max-w-[460px] rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-5 font-mrd"
      >
        <p className="text-[13px] font-medium text-mrd-body">No plan has been filed yet.</p>
        <p className="mt-1 max-w-[62ch] text-[12px] leading-relaxed text-mrd-mute">
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
      className="w-full max-w-[460px] rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-5 font-mrd"
      style={{ boxShadow: "var(--mrd-shadow-card)" }}
    >
      {/*
       * The header counts the steps and, separately, how many are waiting on a
       * person. It carries NO hue: orchid and azure are spent on the steps
       * themselves, and a title painted in one of them takes the meaning off
       * the thing that has it.
       */}
      <header className="mb-mrd-5">
        <h3 className="text-[13px] font-medium text-mrd-ink">{title}</h3>
        <p className="mt-0.5 text-[11.5px] text-mrd-mute">
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

      <ol className="flex flex-col">
        {steps.map((step, i) => (
          <Step key={step.id} step={step} last={i === steps.length - 1} />
        ))}
      </ol>

      {onApprove || onRevise ? (
        <Actions className="mt-mrd-4">
          {onApprove ? (
            <Approve onClick={onApprove} disabled={busy}>
              {approveLabel}
            </Approve>
          ) : null}
          {onRevise ? (
            <Action variant="quiet" onClick={onRevise} disabled={busy}>
              {reviseLabel}
            </Action>
          ) : null}
        </Actions>
      ) : null}
    </div>
  );
}

export default PlanCard;
