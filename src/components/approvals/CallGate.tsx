import type { ReactNode } from "react";

import { isOverdue, stoppedFor } from "@/components/meridian/stopped-for";

/*
 * THE CALL IN FRONT OF YOU, drawn in Meridian.
 *
 * ── WHAT IT REPLACES ────────────────────────────────────────────────────
 * The `Gate` primitive from src/components/shell/primitives.tsx, which drew
 * this surface until 2026-08-14. Everything that primitive's header insists on
 * is kept here, because those rules were written after real defects:
 *
 *   ONE QUESTION, THEN THE FACTS, THEN THE ACTIONS, in that order. A change on
 *   2026-08-05 lifted the reasons OUT of the gate and placed them after it,
 *   which put the evidence BELOW the Approve button and asked a person to
 *   decide above the reasons for deciding. Anything that argues for the answer
 *   sits between the question and the controls, and nowhere else.
 *
 *   ONE PRIMARY, AND ONLY ONE. The queue behind this gate carries no commit
 *   control of its own for the same reason: twenty approve buttons is twenty
 *   primary actions and nothing to look at first.
 *
 * ── WHAT IS NEW, AND WHY ────────────────────────────────────────────────
 * The age. Measured in production on 2026-08-14: twelve gates pending, ages in
 * hours 86, 83, 83, 83, 80, 74, 68, 67, 66, 55, 52, 51, the oldest entered at
 * 18:31 on 10 August. Nothing anywhere in the product told anyone, so the loop
 * sat for three and a half days waiting on a click.
 *
 * The diagnosis was not that the queue looked bad. It was that A PENDING
 * APPROVAL IS A ROW IN A LIST, NOT A STALLED PIECE OF WORK WITH A COST. The
 * queue below now carries that through StalledWork; this is the same fact for
 * the one call being asked, and it is stated beside the question rather than
 * exiled to a corner as metadata, because it is the reason to answer now.
 *
 * ── WHERE THE ACCENT GOES ───────────────────────────────────────────────
 * Twice, and both times it means the same thing: a person is required. Once on
 * the standing marker that says so, and once on the control that releases the
 * agent, which is that fact offered rather than stated. This follows
 * ApprovalCard, whose header sets the same rule for the same control: the
 * neutral primary face is right for chrome, and wrong for the one control on
 * the surface that is itself the pending human action. The age joins them only
 * once it is overdue, which is the same boundary StalledWork's rows use.
 *
 * Nothing else here carries colour. There is no warn hue in this system and no
 * token for one: a call that has waited too long is drawn with weight and with
 * a raised ground, never with amber.
 *
 * ── WHAT LEFT THIS FILE ON 2026-08-15 ───────────────────────────────────
 * `GateAction`, `ReadFailed` and `FOCUS_RING`, into
 * `components/meridian/surface-parts.tsx`, where the same three ideas from the
 * other four ported surfaces now live once. `GateAction` split in two on the
 * way, because it was two controls: the orchid one that RELEASES the run is
 * `Approve`, and everything else is `Action`. The gate keeps only the thing no
 * other surface has, which is the question, its age and its evidence.
 */
export function CallGate({
  question,
  subject,
  since,
  now,
  lines,
  hiddenLineCount = 0,
  consequence,
  consequenceTitle,
  children,
}: {
  /** What is being asked, in plain words. Never a mechanism word. */
  question: string;
  /** The mission or project this sits in front of, when there is one. */
  subject?: string | null;
  /** Epoch ms this started waiting. Null when nothing recorded it. */
  since: number | null;
  /** Injectable so this renders deterministically in a test or a screenshot. */
  now: number;
  /** The facts that answer the question. One fact per line. */
  lines: string[];
  /** How many further lines exist and are not drawn. Printed, never silent. */
  hiddenLineCount?: number;
  /** What settling it in the affirmative causes. */
  consequence?: string;
  /**
   * The exact record behind the consequence sentence, on hover only -- the
   * same rule the age line follows: the phrase is what changes behaviour,
   * the precise instant rides along for anyone who needs it.
   */
  consequenceTitle?: string;
  /** The controls. One primary, and only one. */
  children?: ReactNode;
}) {
  const overdue = since !== null && isOverdue(since, now);

  return (
    <section
      data-mrd=""
      className="rounded-mrd-pane border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-6 shadow-mrd-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-mrd-4">
        <span className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-mrd-you" />
          <span className="shrink-0 text-mrd-tiny font-medium text-mrd-you">Waiting on you</span>
          {subject ? (
            <span className="min-w-0 truncate text-mrd-tiny text-mrd-mute">{subject}</span>
          ) : null}
        </span>

        {/*
         * Tabular figures and mono, so the number reads as a measurement rather
         * than as a word, and so it does not jitter when it ticks over. The
         * exact instant rides along as a title for anyone who needs it; the
         * phrase is what changes behaviour.
         */}
        {since !== null ? (
          <span
            title={new Date(since).toLocaleString()}
            className={`font-mrd-mono shrink-0 text-mrd-small tabular-nums ${
              overdue ? "font-semibold text-mrd-you" : "font-medium text-mrd-mute"
            }`}
          >
            Stopped for {stoppedFor(since, now)}
          </span>
        ) : (
          <span className="shrink-0 text-mrd-small text-mrd-faint">
            How long this has been waiting is not known.
          </span>
        )}
      </div>

      <h2 className="mt-mrd-4 text-mrd-h3 leading-mrd-tight font-medium text-mrd-ink">
        {question}
      </h2>

      {lines.length > 0 || consequence ? (
        /*
         * A recess, not a second card. The standard caps a region at one
         * bordered container; the evidence reads as part of the question by
         * sitting BELOW the ground rather than on top of it.
         */
        <div className="mt-mrd-5 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
          <ul className="flex flex-col gap-mrd-3">
            {lines.map((line, i) => (
              <li key={i} className="leading-mrd-prose text-mrd-prose text-mrd-body">
                {line}
              </li>
            ))}
          </ul>

          {/*
           * A CAP PRINTS ITS REAL NUMBER. This surface has always shown three
           * lines and silently dropped the rest, which is the one thing a list
           * may not do: a reader cannot know they are missing something. No
           * door is drawn to the remainder because there is nowhere to send
           * them, and an arrow to nowhere is worse than none.
           */}
          {hiddenLineCount > 0 ? (
            <p className="font-mrd-mono mt-mrd-3 text-mrd-small tabular-nums text-mrd-faint">
              {hiddenLineCount} further {hiddenLineCount === 1 ? "line" : "lines"} not shown here.
            </p>
          ) : null}

          {consequence ? (
            <p
              title={consequenceTitle}
              className="mt-mrd-4 border-t border-mrd-line-soft pt-mrd-4 leading-mrd-prose text-mrd-prose text-mrd-body"
            >
              {consequence}
            </p>
          ) : null}
        </div>
      ) : null}

      {children ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-3">{children}</div> : null}
    </section>
  );
}

export default CallGate;
