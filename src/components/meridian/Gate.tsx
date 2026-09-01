import { isOverdue, stoppedFor } from "@/components/meridian/stopped-for";
import * as React from "react";

/**
 * THE GATE: one question, the facts that answer it, then the actions.
 *
 * ── THE ORDER IS THE COMPONENT ──────────────────────────────────────────
 * `primitives.Gate` carries a regression note from 2026-08-05 that is the
 * reason this shape is fixed rather than arranged by the caller. A change meant
 * to make agent reasoning "visibly obvious" lifted the evidence OUT of the Gate
 * into a titled block placed after it. Because the actions render last, that
 * put the reasoning BELOW the Approve button: a person was asked to decide,
 * with a keyboard shortcut, above the reasons for deciding.
 *
 * So evidence cannot be pulled out of a Gate. Anything that argues for the
 * answer belongs between the question and the buttons, and `linesLabel` exists
 * so attribution can be added without moving the lines somewhere else. That
 * prop is the whole fix, and the first Meridian draft of this file dropped it.
 *
 * ── WHAT THE FIRST DRAFT GOT WRONG, KEPT HERE SO IT IS NOT REPEATED ─────
 * The version committed earlier on 2026-08-18 imported `Surface` from
 * `@/components/shell/primitives`, the retired Cadence/ink layer, so a
 * component whose whole purpose is to replace that layer was built out of it.
 * The ratchet failed it under rule 1: a new file must be born clean.
 *
 * It was also the wrong `Surface`. That one is the ROUTE-LEVEL page container
 * which owns the main and context columns and the page scroller, so every Gate
 * nested a page shell inside a page.
 *
 * And every styling class in it was inert: `space-y-mrd-s3`, `text-mrd-t-body`,
 * `font-mrd-w-600`. Meridian bridges spacing to Tailwind as `--spacing-mrd-3`
 * (no `s`) and does not bridge the type or weight scales at all, so those names
 * matched nothing, generated no rule, and the "premium styling" rendered at
 * browser defaults. That is the same shape as the `FOCUS_RING` constant that
 * sat inert in six files for months.
 * `src/styles/__tests__/every-meridian-utility-paints.test.ts` now fails on the
 * whole class of defect rather than on these three instances of it.
 *
 * `title`, `sub` and `marks` are gone because no caller ever passed them. An
 * unused prop on a system component is a second way to say something, and the
 * two ways drift.
 *
 * ── THE ANATOMY IS `approvals/CallGate.tsx`, NOT A NEW ONE ──────────────
 * That file is the shipped Meridian gate, and this one matches its stops
 * deliberately: pane radius on the sheet ground, the 20px question, and the
 * evidence recessed onto `--mrd-sink` so the facts read as a quoted block
 * rather than as more of the question. Two gates that disagree about their own
 * shape is how a design system stops being one.
 *
 * Colour is `--mrd-you` and nothing else. A Gate is the definition of "a person
 * is required", which is the one thing that token is allowed to mean.
 */
export function Gate({
  question,
  sub,
  since,
  now,
  lines,
  linesLabel,
  children,
}: {
  /** A question, in plain words. Never a mechanism word. */
  question: React.ReactNode;
  /**
   * What answering it changes, or what not answering it costs. Prose, under the
   * question.
   *
   * ── WHY THIS EXISTS: A SENTENCE WAS BEING SET IN A CAPTION (2026-09-02) ──
   * `linesLabel` below says what it is for in its own docstring -- "naming
   * where they came from" -- and it paints at 10px, weight 650, letter-spaced,
   * UPPERCASE. Plan was passing it two sentences and 96 characters:
   * "COMMITTED, WITH NO OUTCOME AND NO MEASURE. NOTHING CAN TELL YOU LATER
   * WHETHER IT WORKED." Capitals have no ascenders or descenders to give a word
   * its shape, so a sentence set in them is read letter by letter; at 10px,
   * wrapping to two full-width lines, it outweighed the bet names it was a
   * caption for.
   *
   * That call site had ALREADY been cut once, from 132 characters, by an author
   * whose comment says "the fix is the sentence, not the slot". Half right: the
   * sentence was too long AND the slot was wrong, and shortening alone just
   * makes a smaller paragraph in a label. A Gate that states a consequence
   * needs somewhere prose can live, so it has one.
   */
  sub?: React.ReactNode;
  /**
   * WHEN THIS CALL STARTED WAITING, in epoch ms. THREE STATES, NOT TWO.
   *
   *   undefined  this gate has no age to speak of. Nothing is drawn, which is
   *              every caller that existed before 2026-08-27.
   *   null       it HAS an age and we could not read it. Said out loud, because
   *              a missing time on a call a person is about to settle may never
   *              be dressed as a fresh one.
   *   a number   measured, and printed.
   *
   * Absence and unknown are different facts and this product has paid for
   * conflating them before.
   */
  since?: number | null;
  /**
   * The clock, so the phrase is deterministic and testable. Defaults to now.
   * Passing it is how a caller that already holds a tick keeps every age on the
   * surface computed against ONE instant rather than several.
   */
  now?: number;
  /** What it actually does. One fact per line, never four ways of saying one. */
  lines?: React.ReactNode[];
  /** Optional caption over the lines, naming where they came from. Read the
   *  header before removing it: it exists to prevent a shipped regression. */
  linesLabel?: React.ReactNode;
  /** The actions. One primary, and only one. */
  children?: React.ReactNode;
}) {
  return (
    <section
      data-mrd=""
      className="rounded-mrd-pane border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-6 shadow-mrd-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-mrd-4">
        <span className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-mrd-you" />
          <span className="shrink-0 text-mrd-tiny font-medium text-mrd-you">Waiting on you</span>
        </span>

        {/*
         * HOW LONG IT HAS WAITED, ON THE CALL ITSELF.
         *
         * The list rows under this gate have always carried an age and the gate
         * never did, so the one call a person was about to settle was the only
         * one on the surface that would not say how old it was. Measured on the
         * rendered board 2026-08-27: the call in the gate had been waiting 49
         * days and said nothing about it, while the row beneath it read "42d".
         *
         * Mono and tabular so the number reads as a measurement rather than a
         * word, and so it does not jitter as it ticks over. The exact instant
         * rides along as a title for anyone who needs it; the phrase is what
         * changes behaviour. Past a day it takes the accent, which is the same
         * boundary `isOverdue` gives every other surface, so the loudest row and
         * the call in front of you can never disagree about what is overdue.
         */}
        {since === undefined ? null : since === null ? (
          <span className="shrink-0 text-mrd-small text-mrd-faint">
            How long this has been waiting is not known.
          </span>
        ) : (
          <span
            title={new Date(since).toLocaleString()}
            className={`font-mrd-mono shrink-0 text-mrd-small tabular-nums ${
              isOverdue(since, now ?? Date.now())
                ? "font-semibold text-mrd-you"
                : "font-medium text-mrd-mute"
            }`}
          >
            Waiting {stoppedFor(since, now ?? Date.now())}
          </span>
        )}
      </div>

      <h2 className="mt-mrd-4 mrd-title">{question}</h2>
      {sub ? <p className="mt-mrd-2 mrd-copy text-mrd-mute">{sub}</p> : null}

      {lines?.length ? (
        <div className="mt-mrd-5 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
          {linesLabel ? (
            <p className="mb-mrd-3 text-mrd-nano font-[650] tracking-mrd-label text-mrd-mute uppercase">
              {linesLabel}
            </p>
          ) : null}
          <ul className="flex flex-col gap-mrd-3">
            {lines.map((line, i) => (
              <li key={i} className="mrd-copy">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {children ? (
        <div className="mt-mrd-5 flex flex-wrap items-center gap-mrd-3">{children}</div>
      ) : null}
    </section>
  );
}
