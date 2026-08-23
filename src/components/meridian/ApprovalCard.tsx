import { useState } from "react";

/*
 * APPROVAL CARD, the question an agent stops to ask before it acts.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Approval Card"
 *                 (their file: components/ApprovalCard.tsx), MIT licensed,
 *                 read on 2026-08-14 from the exact string that page's own
 *                 "View code" panel renders.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * /approvals, Today's "Ready for your review" lane and the Decide gate all
 * read the same queue and give it three different keyboards, so one blocked
 * run looks like three unrelated chores. This is the single card, and it
 * carries the fact those three surfaces keep dropping: a machine has stopped,
 * and it will not start again until a person answers.
 *
 * ── WHERE THE ACCENT GOES, AND WHY NOWHERE ELSE ─────────────────────────
 * `--mrd-you` means a person is required. On this card that fact has exactly
 * one referent, so it gets exactly one colour: the standing "waiting on you"
 * marker, and the primary control once it is armed. Those two are the same
 * fact stated and offered. Everything else stays neutral, because a ticked
 * checkbox is not a second thing asking for a person, and a pager is not
 * asking for anything at all. Once answered the accent is gone and
 * `--mrd-pass` reports the outcome. Those are the only two colours here.
 *
 * ── WHAT IS DELIBERATELY NOT COPIED ─────────────────────────────────────
 * The reference auto-advances 480ms after a single-choice pick. On a survey
 * that is a nicety; on a control that releases an agent it turns the page
 * before the reader can change their mind. Paging here is always a click.
 *
 * The reference calls its close control "Dismiss". Nothing is dismissed here:
 * the work stays blocked whether or not the card is on screen. So the control
 * collapses, and the collapsed pill keeps saying it is still waiting.
 *
 * The reference paints its confirm control with a flat brand fill. Under
 * Meridian the primary face is a neutral stop on the ladder, so the fill is
 * `--mrd-solid` until the control is armed and `--mrd-you` once it is.
 */

export type ApprovalQuestion = {
  /** Stable key. Answers are keyed by this, never by list position. */
  id: string;
  /** What a person is being asked, in their words. */
  ask: string;
  /** "one" accepts a single option, "many" accepts any number. */
  pick: "one" | "many";
  options: string[];
  /** Offer a typed answer that is not on the list. */
  allowOther?: boolean;
};

export type ApprovalAnswer = { options: string[]; other?: string };
export type ApprovalAnswers = Record<string, ApprovalAnswer>;

const CheckPath = <path d="M20 6L9 17l-5-5" />;

function Icon({
  children,
  size = 14,
  width = 2.2,
}: {
  children: React.ReactNode;
  size?: number;
  width?: number;
}) {
  return (
    /*
     * Hidden from assistive technology at the source. Every glyph in this file
     * sits either inside a button that already carries an aria-label or beside
     * type that says the same thing, so an exposed graphic would only make a
     * screen reader announce the label twice.
     */
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/*
 * The standing marker. It is the one place the card says out loud that it is
 * a person's turn, so it is the one place that carries the accent while the
 * card is unanswered.
 */
function WaitingMarker({ subject }: { subject?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-mrd-you" />
      <span className="shrink-0 text-mrd-tiny font-medium text-mrd-you">Waiting on you</span>
      {subject ? (
        <span className="min-w-0 truncate text-mrd-tiny text-mrd-mute">{subject}</span>
      ) : null}
    </span>
  );
}

export function ApprovalCard({
  questions,
  subject,
  confirmLabel = "Approve",
  onApprove,
}: {
  /** The queue for this one blocked run. An empty list is the normal case. */
  questions: ApprovalQuestion[];
  /** What is blocked, named the way a person would name it. */
  subject?: string;
  /**
   * "Approve" is correct only because answering this card UNBLOCKS the run.
   * If a caller uses this card somewhere it merely records a preference and
   * releases nothing, pass the verb that is actually true there instead.
   */
  confirmLabel?: string;
  onApprove?: (answers: ApprovalAnswers) => void;
}) {
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<ApprovalAnswers>({});
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(true);

  /*
   * THE ZERO CASE, composed first rather than last. An empty approvals queue
   * is what this workspace looks like most of the time, and it is good news:
   * nothing is blocked. So it gets no accent, because nothing is asking for a
   * person, and it says what would appear here rather than apologising.
   */
  if (questions.length === 0) {
    return (
      /*
       * `data-mrd` belongs on this root as much as on the main one. An early
       * return is how a component root quietly loses it, and this particular
       * root is the one the approvals surface renders in production, so the
       * omission put the ONE state a person actually meets outside the system's
       * focus treatment and outside its legacy alias neutralisation.
       */
      <div
        data-mrd=""
        className="w-full max-w-80 rounded-mrd-card border border-mrd-line bg-mrd-sheet px-4 py-4 font-mrd"
      >
        <p className="text-mrd-base font-medium text-mrd-body">Nothing is waiting on you.</p>
        <p className="mt-1 mrd-meta">
          When an agent stops to ask something, the question arrives here and the run holds until
          you answer it.
        </p>
      </div>
    );
  }

  const question = questions[qi];
  const answer = answers[question.id] ?? { options: [], other: "" };
  const last = qi === questions.length - 1;
  const hasAnswer = answer.options.length > 0 || Boolean(answer.other?.trim());

  const toggle = (option: string) => {
    setAnswers((current) => {
      const picked = current[question.id]?.options ?? [];
      const next =
        question.pick === "one"
          ? [option]
          : picked.includes(option)
            ? picked.filter((item) => item !== option)
            : [...picked, option];
      // Picking from the list clears a typed answer, so only one reading survives.
      return { ...current, [question.id]: { options: next, other: "" } };
    });
  };

  const setOther = (value: string) => {
    setAnswers((current) => ({
      ...current,
      [question.id]: {
        options: question.pick === "one" ? [] : (current[question.id]?.options ?? []),
        other: value,
      },
    }));
  };

  const approve = () => {
    setSent(true);
    onApprove?.(answers);
  };

  /*
   * Collapsed, and still blocked. The pill keeps the accent because the fact
   * it reports has not changed: folding the card away did not answer it.
   */
  if (!open) {
    return (
      <button
        type="button"
        data-mrd=""
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-mrd-ctl border border-mrd-line bg-mrd-sheet px-3 py-2 font-mrd text-mrd-label font-medium text-mrd-ink transition-colors duration-100 hover:bg-mrd-hover"
      >
        <span aria-hidden className="size-1.5 rounded-full bg-mrd-you" />
        Still waiting on you
      </button>
    );
  }

  return (
    /*
     * The 196px floor is the reference's, and the case for it here is stronger
     * than in a demo: consecutive questions carry different numbers of options,
     * so paging forward re-heights the card and everything under it steps up or
     * down between one question and the next. With the floor the pager moves and
     * nothing else does, which is what makes it read as one card with a queue in
     * it rather than as a card being rebuilt each time.
     */
    <div data-mrd="" className="flex min-h-[196px] w-full max-w-80 flex-col items-stretch font-mrd">
      <div
        className="overflow-hidden rounded-mrd-card bg-mrd-sheet"
        style={{ boxShadow: "var(--mrd-shadow-card)" }}
      >
        {sent ? (
          <div
            className="flex min-h-[148px] flex-col items-center justify-center gap-2 px-4"
            role="status"
            aria-live="polite"
          >
            <span
              className="flex size-6 items-center justify-center rounded-full bg-mrd-pass text-mrd-bg"
              style={{ animation: "mrd-fade-up 300ms var(--mrd-ease) both" }}
            >
              <Icon size={12} width={3}>
                {CheckPath}
              </Icon>
            </span>
            <span
              className="text-mrd-base font-medium text-mrd-ink"
              style={{ animation: "mrd-fade-up 350ms var(--mrd-ease) 100ms both" }}
            >
              Approved
            </span>
            <span className="text-center mrd-meta">
              The run picks up from here.
            </span>
          </div>
        ) : (
          <div
            key={question.id}
            className="px-4 pt-3.5 pb-3"
            style={{ animation: "mrd-fade-up 350ms var(--mrd-ease) both" }}
          >
            <div className="flex items-start justify-between gap-3">
              <WaitingMarker subject={subject} />
              <button
                type="button"
                aria-label="Collapse this question"
                onClick={() => setOpen(false)}
                className="-mr-1 -mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-mrd-xs text-mrd-mute transition-colors duration-100 hover:bg-mrd-hover hover:text-mrd-ink"
              >
                <Icon>
                  <path d="M18 6L6 18M6 6l12 12" />
                </Icon>
              </button>
            </div>

            <p className="mt-2 text-mrd-base font-medium text-mrd-ink">{question.ask}</p>

            <div className="mt-2 flex flex-col gap-0.5">
              {question.options.map((option) => {
                const on = answer.options.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(option)}
                    className="-mx-1.5 flex items-center gap-2 rounded-mrd-ctl px-1.5 py-1 text-left transition-colors duration-100 hover:bg-mrd-hover"
                  >
                    {/*
                     * Neutral on purpose. A chosen option is a reading of the
                     * question, not a second thing demanding a person, so it
                     * must not borrow the accent that says one is required.
                     */}
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center transition-colors duration-200 ${
                        question.pick === "one" ? "rounded-full" : "rounded-[5px]"
                      } ${on ? "bg-mrd-ink text-mrd-bg" : "text-transparent"}`}
                      style={on ? undefined : { boxShadow: "inset 0 0 0 1.5px var(--mrd-edge)" }}
                    >
                      {question.pick === "one" ? (
                        <span
                          className="size-1.5 rounded-full bg-mrd-bg transition-transform duration-200"
                          style={{ transform: on ? "scale(1)" : "scale(0)" }}
                        />
                      ) : (
                        <Icon size={12} width={3}>
                          {CheckPath}
                        </Icon>
                      )}
                    </span>
                    <span
                      className={`text-mrd-base transition-colors duration-200 ${on ? "text-mrd-ink" : "text-mrd-body"}`}
                    >
                      {option}
                    </span>
                  </button>
                );
              })}

              {question.allowOther ? (
                <label className="-mx-1.5 flex items-center gap-2 rounded-mrd-ctl px-1.5 py-1 transition-colors duration-100 focus-within:bg-mrd-hover hover:bg-mrd-hover">
                  <span aria-hidden className="size-4 shrink-0" />
                  <input
                    value={answer.other ?? ""}
                    onChange={(event) => setOther(event.target.value)}
                    placeholder="Answer in your own words"
                    aria-label="Answer in your own words"
                    className="min-w-0 flex-1 bg-transparent text-mrd-base text-mrd-ink outline-none placeholder:text-mrd-mute"
                  />
                </label>
              ) : null}
            </div>
          </div>
        )}

        {/* Pager and the one control that releases the run. */}
        <div className="flex items-center justify-between border-t border-mrd-line-soft bg-mrd-sink px-3 py-2">
          <span className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous question"
              disabled={qi === 0 || sent}
              onClick={() => setQi((current) => Math.max(0, current - 1))}
              className="flex size-6 items-center justify-center rounded-mrd-xs text-mrd-mute transition-colors duration-100 enabled:hover:bg-mrd-hover enabled:hover:text-mrd-prose text-mrd-body disabled:opacity-35"
            >
              <Icon>
                <path d="M15 18l-6-6 6-6" />
              </Icon>
            </button>

            {/*
             * One dot per question, filled once answered. With a single
             * question there is nothing to page through, so the row is not
             * drawn at all rather than drawn as a lone dot that cannot move.
             */}
            {questions.length > 1 ? (
              <span className="flex items-center gap-1">
                {questions.map((q, i) => {
                  const done = Boolean(
                    answers[q.id]?.options.length || answers[q.id]?.other?.trim(),
                  );
                  const here = i === qi && !sent;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      aria-label={`Go to question ${i + 1}`}
                      aria-current={here ? "step" : undefined}
                      disabled={sent}
                      onClick={() => setQi(i)}
                      className="rounded-full transition-all duration-300 disabled:cursor-default"
                      style={
                        here
                          ? { width: 9, height: 9, border: "2.5px solid var(--mrd-ink)" }
                          : sent || done
                            ? { width: 7, height: 7, background: "var(--mrd-mute)" }
                            : { width: 7, height: 7, border: "1.5px solid var(--mrd-mute)" }
                      }
                    />
                  );
                })}
              </span>
            ) : null}

            <button
              type="button"
              aria-label="Next question"
              disabled={last || sent}
              onClick={() => setQi((current) => Math.min(questions.length - 1, current + 1))}
              className="flex size-6 items-center justify-center rounded-mrd-xs text-mrd-mute transition-colors duration-100 enabled:hover:bg-mrd-hover enabled:hover:text-mrd-prose text-mrd-body disabled:opacity-35"
            >
              <Icon>
                <path d="M9 6l6 6-6 6" />
              </Icon>
            </button>
          </span>

          {!sent ? (
            <button
              type="button"
              disabled={!hasAnswer}
              onClick={() => (last ? approve() : setQi((current) => current + 1))}
              className="flex h-7 items-center gap-1.5 rounded-mrd-ctl px-3 text-mrd-label font-medium transition-[background-color,color,box-shadow,transform] duration-200 enabled:active:scale-[0.96] disabled:cursor-default"
              style={{
                /*
                 * THREE FACES, and each one states a different fact.
                 *
                 * Dead, because nothing has been answered yet: a RECESSED face,
                 * the same step a field sits on, with muted type. It used to be
                 * the full primary face at opacity 0.4, and that is the failure
                 * this system keeps catching — an alpha knocked back until the
                 * control is a smudge nobody can name, which on the dark ground
                 * left it hovering between "disabled" and "not drawn". A control
                 * that cannot act should look like a different KIND of object,
                 * not like a faded version of the one that can.
                 *
                 * Armed but not last: the neutral primary face, because moving
                 * to the next question is not the act a person is here for.
                 *
                 * Armed and last: `--mrd-you`, because at that moment this
                 * control IS the pending human action, and pressing it is what
                 * releases the run.
                 *
                 * `--mrd-on-solid` and NOT `--mrd-ink`. This label was written
                 * as ink, which inverts with the ground while `--mrd-solid` does
                 * not: on paper the face is a dark slab and ink is dark type,
                 * measured at 1.19 to 1 in the note meridian.css keeps on this
                 * exact defect. It is the one token that is light on both
                 * grounds and it exists for precisely this control.
                 */
                background: !hasAnswer
                  ? "var(--mrd-lift)"
                  : last
                    ? "var(--mrd-you)"
                    : "var(--mrd-solid)",
                color: !hasAnswer
                  ? "var(--mrd-mute)"
                  : last
                    ? "var(--mrd-bg)"
                    : "var(--mrd-on-solid)",
                /*
                 * The armed face takes a one-pixel specular top edge, which is
                 * what stops a filled control reading as a flat rectangle of
                 * colour. Mixed from `--mrd-on-solid` rather than written as a
                 * literal white, so it stays a warm paper-white on the paper
                 * ground instead of a hole punched in the slab. The dead face
                 * gets the card shadow instead: it is sitting IN the footer,
                 * not standing on it.
                 */
                boxShadow: hasAnswer ? "inset 0 1px 0 var(--mrd-sheen)" : "var(--mrd-shadow-card)",
              }}
            >
              {last ? confirmLabel : "Next"}
              {/*
               * The reference puts a glyph on this control and ours had dropped
               * it. It is not decoration: the button changes JOB between
               * questions and the word alone carries that quietly, while a
               * chevron that becomes a check says "this one moves you along"
               * and then "this one is the act" without being read.
               */}
              <Icon size={13} width={2.6}>
                {last ? CheckPath : <path d="M9 6l6 6-6 6" />}
              </Icon>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ApprovalCard;
