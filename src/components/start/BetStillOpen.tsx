/**
 * The entry's pending evidence. See `the-bet-still-open.ts` for the argument;
 * this file decides only how it is drawn.
 *
 * ── IT IS `WhetherItWorked`'S SIBLING AND WEARS ITS SHAPE ─────────────────
 * Same eyebrow rung, same measure, same borderless region, same order:
 * subject, then the claim, then when you will know. A reader who has seen one
 * recognises the other, and the two never appear together -- a result outranks
 * a promise, so this draws only when nothing has come back yet.
 *
 * Deliberately NOT a card, a countdown or a progress bar. The founder's
 * complaint was that the product reads as a dump of data, and a date with a
 * ring around it is a dump with a ring around it. The largest thing here is
 * what the machine believes; the date is the last line, in the meta rung,
 * because it is the fact you act on and not the fact that matters.
 *
 * ── NO STATUS COLOUR, AND THAT IS THE DIFFERENCE FROM ITS SIBLING ─────────
 * `WhetherItWorked` carries the one status chip in that column because a
 * verdict is a status. A bet has no verdict yet. Painting it amber for
 * "pending" would be the product inventing a state the record does not hold,
 * and Meridian's own rule is that colour carries status and never decorates.
 * The eyebrow does the work of saying what this is.
 */
import { Link } from "@tanstack/react-router";
import { Eyebrow } from "@/components/meridian/surface-parts";
import { lapsedLine, type BetStillOpen as Shape } from "@/components/start/the-bet-still-open";

export function BetStillOpen({ it, className = "" }: { it: Shape | null; className?: string }) {
  if (!it) return null;

  return (
    <section
      data-mrd=""
      data-bet-still-open=""
      aria-label="What it is betting on"
      className={`flex flex-col ${className}`}
    >
      <Eyebrow>What it is betting on</Eyebrow>

      {/*
       * THE SUBJECT LEADS AND IS THE DOOR, exactly as it does one region up
       * when there is a result. `/outcomes` is where a forecast lives, is
       * settled, and is listed with the others, so it is the same destination
       * its sibling opens and there is no second address for one idea.
       */}
      {it.subject ? (
        <div className="mt-mrd-3">
          <Link
            to="/outcomes"
            className="mrd-focus rounded-mrd-chip text-mrd-base leading-mrd-snug text-mrd-ink underline decoration-mrd-line-soft underline-offset-4 hover:decoration-mrd-line"
          >
            {it.subject}
          </Link>
        </div>
      ) : null}

      {/* The machine's own claim, on the reading measure, verbatim. */}
      <p className="mt-mrd-3 max-w-[var(--mrd-measure-region)] text-mrd-base leading-mrd-prose text-mrd-mute">
        {it.claim}
      </p>

      {/*
       * HOW IT WILL BE KNOWN, when the record has it. This is the half that
       * makes the claim falsifiable rather than an opinion, and it is the one
       * thing a person can check for themselves before the date arrives.
       */}
      {it.howWeWillKnow ? (
        <p className="mt-mrd-2 max-w-[var(--mrd-measure-region)] text-mrd-small leading-mrd-prose text-mrd-body">
          {it.howWeWillKnow}
        </p>
      ) : null}

      <div className="mt-mrd-3 flex flex-wrap items-baseline gap-x-mrd-3 gap-y-mrd-1">
        {/*
         * THE DATE AND THE DISTANCE, in one line. "Due Thu, Sep 11" is what
         * goes in a calendar; "in 2 days" is what changes whether you wait.
         * Neither on its own does both jobs.
         */}
        <span className="mrd-meta">
          {it.inWords ? `You will know ${it.inWords} · ${it.due}` : `You will know on ${it.due}`}
        </span>
        {/* SAID, NOT STYLED, on the same rule as its sibling: a sample drawn
            more quietly still reads as the founder's own bet to anyone who does
            not know the convention. */}
        {it.isSample ? <span className="mrd-meta">From the sample workspace</span> : null}
      </div>

      {/*
       * WHAT LAPSED, WHEN ANYTHING HAS. Drawn under the date because it is
       * about the same idea -- when you find out -- and a reader who has just
       * been told "you will know in 2 days" needs to know in the same breath
       * that ten earlier answers never arrived.
       *
       * NO SECOND DOOR. The subject at the top of this region already opens
       * `/outcomes`, which is where a lapsed forecast is listed and settled.
       * A link here would be two doors onto one question on one screen, which
       * `one-door-per-sentence.test.ts` exists to catch.
       *
       * NO STATUS COLOUR, on this region's own standing rule: a lapse is not a
       * verdict, and painting it would be the product inventing a state the
       * record does not hold.
       */}
      {lapsedLine(it.lapsed) ? (
        <p className="mrd-meta mt-mrd-2 max-w-[var(--mrd-measure-region)]">
          {lapsedLine(it.lapsed)}
        </p>
      ) : null}
    </section>
  );
}
