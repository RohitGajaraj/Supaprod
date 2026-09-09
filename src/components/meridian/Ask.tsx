/**
 * ── ONE CARD VOCABULARY, AND THE ORDER IS THE DESIGN ──────────────────────
 *
 * P-37. The founder, on the tablet track's run: *the gate card, the messages,
 * the action items, the inside of the card, the text and the information are
 * dumped with no hierarchy; everything is true and nothing is designed.* The
 * second half is the diagnosis. A surface that REPORTS puts everything at one
 * weight and leaves the person to sort it; a surface that COMPOSES decides what
 * matters most and says that first.
 *
 * So this component takes named slots and renders them in a fixed order:
 *
 *   question   what is being asked, alone, at `--mrd-t-lead`
 *   risk       the consequence, in prose, one line
 *   reason     why it is being asked, with its author named inside it
 *   default    what happens if nobody answers, mono, last
 *   answers    two, in two registers
 *
 * THE ORDER IS NOT A PROP, and that is the point of having a component at all.
 * A `children` slot or an array of sections would let the next surface reorder
 * it, and the order IS the design: the question leads because it is the thing
 * being asked; the consequence comes before the reasoning because it is what
 * changes the answer; the clock goes last because a clock above the answers
 * makes a question read as a countdown.
 *
 * ── WHAT IS DELIBERATELY ABSENT ───────────────────────────────────────────
 *
 * There is no slot for the token count, the elapsed timer, the station chip or
 * the trace id. Every one is true and none helps a person answer, and they are
 * all available in that moment's transcript row, which is where somebody goes to
 * audit rather than to decide. A slot that exists gets filled.
 *
 * The seat that asks is named ONCE, by the caller, inside `reason` and in the
 * reason's own register ("Builder ran it twice and the tests pass"). Not a
 * header, not a byline: who is asking matters as provenance for the reason, and
 * provenance belongs in the sentence it qualifies (A1, amendment 2).
 */
import * as React from "react";
import type { AskQuestion } from "./question";

import { Action } from "@/components/meridian/surface-parts";

/**
 * What happens if nobody answers.
 *
 * ── AN IRREVERSIBLE GATE MAY ONLY DECLARE THAT NOTHING RUNS ───────────────
 *
 * The first draft of P-37's mockup wrote this line as *"If nobody answers, this
 * merges at 18:00"*, which describes **a card that merges by silence**. That is
 * not a gate, it is a delay, on the one path in this product that customers see.
 *
 * It was caught as copy (A1, amendment 1) and it is fixed as a TYPE, because a
 * slot that renders whatever default it is handed will eventually be handed that
 * one. `irreversible` cards take no sentence at all: they get the only default
 * they are allowed to have. A reversible card may name a real one, because
 * "this reruns tonight" is a true and useful thing to say about work that can be
 * done again.
 */
export type AskDefault =
  /**
   * `waited` IS A DURATION AND THE NAME NOW SAYS SO. It was called `since`,
   * and the sentence built from it read **"Waiting on you since 5 days"** on
   * the served Inbox, 2026-09-10 -- the preposition wanted an instant and the
   * only caller passes `stoppedFor()`, which returns a span. Neither half was
   * wrong on its own; the field name was the thing that let them disagree.
   *
   * A span is deliberately the right value here, on `stoppedFor`'s own
   * argument: *"Since 18:31 on 10 August" makes a reader do arithmetic before
   * they can feel anything. "3 days" is the fact that changes what they do.*
   * So the value stays and the word around it was corrected.
   */
  | { kind: "irreversible"; waited?: string | null }
  | { kind: "reversible"; waited?: string | null; whatHappens: string };

/**
 * `waited` IS OPTIONAL AND ITS ABSENCE IS A REAL STATE (P-50). The Ask panel's
 * queue items carry no timestamp, so that card cannot say when it started
 * waiting without one being invented. The sentence's load-bearing half is what
 * happens if nobody answers; the clock is an enrichment, and a card that omits
 * it says less rather than something false.
 */
export function defaultLine(d: AskDefault): string {
  /*
   * Not a template a caller can slip past. The irreversible sentence is written
   * here, once, and there is no argument that produces a different one.
   */
  const waited = d.waited ? `Waiting on you for ${d.waited}. ` : "";
  return d.kind === "irreversible"
    ? `${waited}Nothing runs until you answer.`
    : `${waited}${d.whatHappens}`;
}

export function Ask({
  question,
  risk,
  reason,
  fallback,
  answer,
  decline,
  fallbackAction,
}: {
  /** The whole ask, in one sentence. Leads, alone, at `--mrd-t-lead`. */
  question: AskQuestion;
  /**
   * The consequence, in PROSE and never a badge. A red HIGH RISK chip is a
   * category the reader has to know the taxonomy for; "this is irreversible and
   * customers see it" is the actual consequence, and the consequence is what
   * changes the answer. Absent when there is genuinely no consequence worth
   * naming, rather than filled with a reassurance.
   */
  risk?: string | null;
  /** Why it is being asked, with the asking seat named inside it. */
  reason?: string | null;
  fallback: AskDefault;
  /** The one thing pressing this does, in the person's own words. */
  answer: { label: string; onPress: () => void; busy?: boolean };
  /** Declining is an answer too, and it is quiet rather than absent. */
  decline: { label: string; onPress: () => void };
  /**
   * ── THE DEFAULT MADE PRESSABLE, AND WHY IT IS NOT A THIRD ANSWER ────────
   *
   * P-50. The Ask panel's gate cards carry THREE genuine verdicts, not two and
   * a decoration: approve, reject and snooze are different things a person can
   * do and none is a duplicate. So "the card takes two answers" is not on its
   * own an argument for where the third goes.
   *
   * The argument is that **two of them answer the question and one declines
   * to.** "Not now" writes a snooze, and a snooze is the DECLARED DEFAULT
   * ARRIVING EARLY: the line directly above already says what happens if nobody
   * answers, and pressing it is choosing that outcome deliberately rather than
   * by walking away.
   *
   * So it belongs to the default line, and it renders there. As a third button
   * it put a non-answer in the row where the answers are, which is why a person
   * reading that card had to decide between three things when only two of them
   * were decisions.
   *
   * THERE IS DELIBERATELY NO FOURTH ANSWER SLOT. This is the whole reason the
   * rule lives in the component rather than in the panel: a slot that exists
   * gets filled, and the next surface with a third verdict would have put it
   * beside the answers exactly as this one did.
   */
  fallbackAction?: { label: string; onPress: () => void; busy?: boolean };
}) {
  return (
    <section
      data-mrd=""
      className="flex flex-col gap-mrd-4 rounded-mrd-card border border-mrd-line bg-mrd-sheet p-mrd-5 font-mrd"
      aria-label={question}
    >
      <p className="text-mrd-lead leading-mrd-tight text-mrd-ink">{question}</p>

      {risk ? <p className="text-mrd-base text-mrd-ink">{risk}</p> : null}

      {reason ? <p className="text-mrd-small text-mrd-mute">{reason}</p> : null}

      {/* Mono, because it is a fact about a clock and the data face is where
          this system puts those. Last, because above the answers it would read
          as a countdown. The action rides ON this line rather than below it:
          it is this sentence's own verb, not a third answer. */}
      <div className="flex flex-wrap items-baseline gap-mrd-3">
        <p className="text-mrd-data text-mrd-mute">{defaultLine(fallback)}</p>
        {fallbackAction ? (
          <Action variant="quiet" busy={fallbackAction.busy} onClick={fallbackAction.onPress}>
            {fallbackAction.label}
          </Action>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-mrd-3">
        <Action variant="primary" busy={answer.busy} onClick={answer.onPress}>
          {answer.label}
        </Action>
        <Action variant="quiet" onClick={decline.onPress}>
          {decline.label}
        </Action>
      </div>
    </section>
  );
}

export default Ask;
