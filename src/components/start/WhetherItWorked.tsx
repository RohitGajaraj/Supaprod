/**
 * The entry's one piece of evidence. See `whether-it-worked.ts` for the
 * argument; this file decides only how it is drawn.
 *
 * ── WHY IT IS A REGION AND NOT A LINE ─────────────────────────────────────
 * `HomeAnswers` above it is deliberately three plain sentences, and that ruling
 * still holds: what ARRIVED is a delta, read in three seconds and forgotten.
 * This is not a delta. It is the only thing on the entry that says the loop
 * closed, and a person is meant to stop on it, so it gets a bounded region and
 * three lines instead of one.
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
      className={`rounded-mrd-card border border-mrd-line-soft px-mrd-5 py-mrd-4 ${className}`}
    >
      <Eyebrow>Whether it worked</Eyebrow>

      <div className="mt-mrd-3 flex flex-wrap items-baseline gap-x-mrd-3 gap-y-mrd-2">
        {/* The subject leads. A verdict with no subject is a mood. */}
        {it.subject ? (
          <span className="text-mrd-base leading-mrd-snug text-mrd-ink">{it.subject}</span>
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
         * ONE DOOR, TO THE SURFACE THAT HOLDS THE REST. Outcomes is where the
         * other eleven are, and the answer above this region already points
         * there, so the two agree rather than offering a person two addresses
         * for one thing.
         */}
        <Link
          to="/outcomes"
          className="mrd-focus rounded-mrd-chip text-mrd-small text-mrd-body underline decoration-mrd-line-soft underline-offset-4 hover:text-mrd-ink"
        >
          Read it
        </Link>
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
