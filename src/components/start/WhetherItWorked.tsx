/**
 * The entry's one piece of evidence. See `whether-it-worked.ts` for the
 * argument; this file decides only how it is drawn.
 *
 * ── WHY IT IS A REGION AND NOT A LINE ─────────────────────────────────────
 * `HomeAnswers` above it is deliberately three plain sentences, and that ruling
 * still holds: what ARRIVED is a delta, read in three seconds and forgotten.
 * This is not a delta. It is the only thing on the entry that says the loop
 * closed, and a person is meant to stop on it, so it gets three lines and its
 * own eyebrow instead of one sentence.
 *
 * ── AND WHY IT HAS NO BORDER, WHICH IT DID FOR ONE DEPLOY ─────────────────
 * The first version drew a hairline card. Looking at the served page settled
 * it: this sits directly above the road, which IS a bordered card, so the
 * column read composer-box, plain lines, THIS box, road box. Meridian's own
 * note on the section seam says it: a divider between sections of one page is
 * quieter than the edge of a card, or every page turns into a stack of boxes.
 *
 * PRESENCE WITHOUT A RULE. The worry a border answers is that this becomes
 * another run of text and nobody stops on it. It does not, because the verdict
 * chip is the only status colour in this column and the eye goes to it before
 * it reads a word. That is the anchor, and it is the system's own: colour
 * carries status, and a rule around the outside would be decoration doing a job
 * colour is already doing. Every other movement on this page is separated by
 * the spacing ramp, and so is this one.
 *
 * ── AND WHY IT IS STILL NOT A CARD WITH A NUMBER IN IT ────────────────────
 * No metric in display type, no tile, no chart. The verdict is one word and the
 * evidence is one sentence, because the founder's complaint was that the
 * product reads as a dump of data and content, and the cure for that is not a
 * smaller dump. The largest thing here is the subject: what the machine
 * decided. The number, when there is one, is inside a sentence with a verb.
 *
 * ── THE ORDER: SUBJECT, VERDICT, EVIDENCE, CONSEQUENCE ────────────────────
 * A reader needs to know what this is about before they are told how it went,
 * so the decision leads and the verdict sits beside it rather than above it.
 * The grader's sentence follows as the evidence for that word, and the re-score
 * last, because it is what the product DID about the answer and is the only
 * line here that is about the machine rather than the work.
 */
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Eyebrow } from "@/components/meridian/surface-parts";
import { StatusChip } from "@/components/meridian/StatusChip";
import { relativeTime } from "@/lib/memory-view";
import type { WhetherItWorked as Shape } from "@/components/start/whether-it-worked";

export function WhetherItWorked({
  it,
  nowMs,
  className = "",
}: {
  it: Shape | null;
  /** Milliseconds, passed in rather than read here so the region is pure at
   *  render. `relativeTime` takes a number for the same reason. */
  nowMs?: number;
  className?: string;
}) {
  if (!it) return null;
  const when = relativeTime(new Date(it.at).toISOString(), nowMs ?? Date.now());

  return (
    <section
      data-mrd=""
      data-whether-it-worked=""
      aria-label="Whether it worked"
      className={`flex flex-col ${className}`}
    >
      <Eyebrow>Whether it worked</Eyebrow>

      <div className="mt-mrd-3 flex flex-wrap items-baseline gap-x-mrd-3 gap-y-mrd-2">
        {/*
         * THE SUBJECT LEADS, AND THE SUBJECT IS THE DOOR. A verdict with no
         * subject is a mood.
         *
         * It carried a trailing "Read it" for one deploy. Seen on the served
         * page: the answer 90px above this region already offers the same
         * destination under a different word ("Read them"), so one address wore
         * two labels within a glance, which is F-215's shape. And a door parked
         * next to a timestamp reads as part of the timestamp.
         *
         * The thing a person wants to open is the outcome, so the outcome's own
         * name opens it. One door, on the noun, and no second word for it.
         */}
        {it.subject ? (
          <Link
            to="/outcomes"
            className="mrd-focus rounded-mrd-chip text-mrd-base leading-mrd-snug text-mrd-ink underline decoration-mrd-line-soft underline-offset-4 hover:decoration-mrd-line"
          >
            {it.subject}
          </Link>
        ) : null}
        {/*
         * The chip does not pulse. `StatusChip`'s own contract says only `agent`
         * and `you` should ever breathe, because those are ongoing and an
         * outcome has already happened. This is the case that rule was for.
         */}
        <StatusChip status={it.status}>{it.word}</StatusChip>
      </div>

      {/* The grader's own sentence, on the reading measure, verbatim. */}
      <p className="mt-mrd-3 max-w-[var(--mrd-measure-region)] text-mrd-base leading-mrd-prose text-mrd-mute">
        {it.summary}
      </p>

      <div className="mt-mrd-3 flex flex-wrap items-baseline gap-x-mrd-3 gap-y-mrd-1">
        {it.rescored ? (
          <span className="text-mrd-small leading-mrd-snug text-mrd-body">{it.rescored}</span>
        ) : null}
        {when ? <span className="mrd-meta">{when}</span> : null}
        {/*
         * SAID, NOT STYLED. A sample row drawn in a quieter colour would still
         * read as the founder's own result to anyone who does not know the
         * convention, and this repo has already paid for that: three metrics
         * proving the product worked were all seed data and nobody could tell.
         * So it is a word, in the same register as the rest of the line.
         */}
        {it.isSample ? <span className="mrd-meta">From the sample workspace</span> : null}
      </div>
    </section>
  );
}
