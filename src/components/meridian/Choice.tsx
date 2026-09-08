/**
 * ── ONE QUESTION, N NAMED OPTIONS, AND NOTHING PRE-SELECTED ───────────────
 *
 * P-52. Found under `Gate` rather than designed: five call sites were asking a
 * person to pick among several things through a component built for a binary
 * ask ("Which source should it read first?", "Which bet does this belong to?",
 * "Which copy of X wins?").
 *
 * ── WHY THIS IS NOT `Ask` WITH MORE BUTTONS ───────────────────────────────
 *
 * `Ask` has exactly one answer and one decline, and that constraint is the
 * point of it: it has a PRIMARY because one answer is the expected one and the
 * card can say so honestly. Forcing a four-way choice through it would either
 * lose options or put a fourth control beside the answers, which is the exact
 * defect P-50 closed on the Ask panel.
 *
 * **So nothing here is pre-selected and no option is primary.** In a choice the
 * product does not know which is right; that is why it is asking. A
 * pre-selected option is the product pretending it does, and a person
 * confirming a pick they did not make reads as consent.
 *
 * ── EVERY OPTION CARRIES THE ONE FACT THAT DECIDES BETWEEN THEM ───────────
 *
 * The same fact for every option, and it is required rather than optional. A
 * list of names with nothing to choose between them is a MENU: the person picks
 * the first, or the one they recognise, which is the product deciding by
 * ordering while appearing to ask.
 *
 * WHEN THE CHOICE HAS NO MEASUREMENT (2026-09-08), the thing to choose between
 * is a consequence in words ("Build it on your word" against "Point a source
 * at it first"), and that is `sub`, under the label. Then `fact` is omitted
 * and no datum slot is drawn; the type refuses an option with neither. `null`
 * keeps its meaning: a datum this choice measures and could not read.
 *
 * WHEN THE FACT IS UNKNOWN FOR ONE OPTION IT SAYS SO (A1, amendment 1). A blank
 * beside three numbers is the product deciding by ordering again, more quietly:
 * the reader takes the blank for zero, or for irrelevant, and picks one of the
 * three that answered. "Unknown" is a fact about our reading and it is the one
 * the person needs to weigh the row honestly.
 */
import * as React from "react";

export type ChoiceOption = {
  /** Stable key. The answer is this, never the row's position. */
  id: string;
  /** What the option is, in the person's own words. */
  label: string;
} & (
  | {
      /**
       * THE ONE FACT THAT DECIDES BETWEEN THE OPTIONS, the same fact on every
       * row. `null` renders as "unknown" rather than as a blank: see the header.
       */
      fact: string | null;
      /**
       * A SENTENCE UNDER THE LABEL, when an option needs a clause the label
       * cannot carry. Prose, in the body face; the fact slot stays a datum.
       */
      sub?: string | null;
    }
  | {
      /** No measurement on this choice: the consequence in `sub` is what
       *  the person chooses between, and no datum slot is drawn. */
      fact?: undefined;
      sub: string;
    }
);

export function Choice({
  question,
  why,
  options,
  onPick,
  busyId = null,
  after,
}: {
  /** What is being chosen, in one sentence. */
  question: string;
  /** Why the choice matters, when that is not obvious from the question. */
  why?: string | null;
  options: readonly ChoiceOption[];
  onPick: (id: string) => void;
  /** The row being written, so it can say so without the others moving. */
  busyId?: string | null;
  /**
   * One thing that belongs to an answer rather than to the question.
   *
   * ── WHY IT IS AFTER THE OPTIONS AND NOT A SLOT ABOVE THEM (P-71e) ──────
   *
   * R-39's Choice needed a field for "what would settle it", which qualifies
   * exactly one of the two answers. Above the options it reads as something to
   * fill in BEFORE choosing, which is the opposite of this component's rule
   * that nothing is chosen until you pick one.
   *
   * Deliberately singular and deliberately last. A component that grows a
   * general slot for arbitrary content stops being a Choice and becomes a
   * layout, which is how the fourth dialect appeared the last time.
   */
  after?: React.ReactNode;
}) {
  return (
    <section
      data-mrd=""
      className="flex flex-col gap-mrd-4 font-mrd"
      aria-label={question}
      role="group"
    >
      <p className="text-mrd-lead leading-mrd-tight text-mrd-ink">{question}</p>
      {why ? <p className="text-mrd-small text-mrd-mute">{why}</p> : null}

      <ul className="flex flex-col overflow-hidden rounded-mrd-card border border-mrd-line">
        {options.map((o, i) => (
          <li key={o.id} className={i > 0 ? "border-t border-mrd-line" : undefined}>
            {/*
             * THE WHOLE ROW IS THE TARGET, as `FoldingRow`'s is, and there is no
             * radio (A1, amendment 1). A radio is a control that reports a
             * selection which does not exist yet, and it asks a person to hit a
             * 12px circle on a tablet, which is the device these defects keep
             * being found on.
             */}
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => onPick(o.id)}
              className="flex w-full items-baseline justify-between gap-mrd-4 px-mrd-4 py-mrd-3 text-left transition-colors hover:bg-mrd-hover disabled:opacity-60"
            >
              {/* THE LABEL KEEPS ITS WIDTH AND THE FACT KEEPS ITS SHARE.
                  Seen live on the run screen's "Build this on your word"
                  choice: a sentence-length fact was `shrink-0`, so it took
                  the row and the label folded to one word per line. The
                  first fix made the label `shrink-0` instead, which on a
                  narrow pane pushes the fact off the row. So: the label
                  column grows and wraps (`flex-1 min-w-0`), the fact may
                  wrap on the right but never claims more than two fifths.
                  A sentence belongs in `sub`, under the label, not in the
                  datum slot. */}
              <span className="flex min-w-0 flex-1 flex-col gap-mrd-1">
                <span className="text-mrd-base text-mrd-ink">{o.label}</span>
                {o.sub ? <span className="text-mrd-small text-mrd-mute">{o.sub}</span> : null}
              </span>
              {/* Mono, because it is the row's measurement and the eye compares
                  these down the column rather than reading them. */}
              {o.fact !== undefined || busyId === o.id ? (
                <span className="min-w-0 max-w-[40%] shrink text-right font-mrd-mono text-mrd-data tabular-nums text-mrd-mute">
                  {busyId === o.id ? "picking" : (o.fact ?? "unknown")}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      {/*
       * A CHOICE NEVER RESOLVES ITSELF. There is no declared-default slot and
       * no timer: a choice that times out is a delay with extra steps, and it
       * is the defect §1's gate card was corrected for one surface over. The
       * sentence is fixed here rather than passed, for the same reason `Ask`
       * writes its irreversible default itself.
       */}
      {/* Between the options and the closing line: it qualifies an answer, and
          the closing line is about the whole card. */}
      {after ?? null}
      <p className="text-mrd-data text-mrd-mute">Nothing is chosen until you pick one.</p>
    </section>
  );
}

export default Choice;
