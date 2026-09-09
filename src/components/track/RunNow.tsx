/**
 * THE NOW CARD: one card at the top of the work, saying what is happening in
 * the register the state decides. `run-now.ts` decides; this draws.
 *
 * ── WHAT IT REPLACES ─────────────────────────────────────────────────────
 * The character's sentence, the drive-result rows, the "You stopped this run"
 * row, the "Why it stopped" region and the "Learning to come" region: five
 * blocks on one pane, each saying what was happening in its own words. One
 * card now, and the facts that used to be rows inside those regions (the hold
 * detail, the way out, the door to Settings) ride as `children`, so a hold
 * still carries everything it carried, under one headline instead of a title
 * that called every state a stoppage.
 *
 * ── THE QUIET CHIP ───────────────────────────────────────────────────────
 * `status: "quiet"` is Meridian's sixth chip (Lane 1, 2026-09-08, on this
 * screen's measurement): mute ink on the sink fill, no status hue. It is the
 * founder's ruling for a wait the machine has in hand, a run live in
 * production waiting for the date its forecast is graded on: nothing is wrong
 * and nobody is needed, so it wears no colour.
 *
 * ── AND ITS CHIP GIVES WAY TO THE HEADER'S ───────────────────────────────
 * The run header draws a status chip that never scrolls away; this card drew a
 * second one 200px under it, saying the same word. S1 measured both at every
 * scroll position before either of us cut anything. The rule, and the two cases
 * where this card KEEPS its chip, are in `the-header-already-said-it.ts`.
 */
import * as React from "react";
import { StatusChip } from "@/components/meridian/StatusChip";
import type { Now } from "@/components/track/run-now";
import { theCardStillNeedsItsChip } from "@/components/track/the-header-already-said-it";

export function RunNow({
  now,
  headerSays,
  children,
}: {
  now: Now;
  /**
   * The word the run header's chip is already showing, or null when it is
   * showing none. When it matches this card's word, this card's chip is the
   * second of two chips saying one thing 200px apart, and goes -- see
   * `the-header-already-said-it.ts` for the scroll measurement that settled it.
   */
  headerSays?: string | null;
  /** The facts and the one control that belong to this state. */
  children?: React.ReactNode;
}) {
  const ownChip = theCardStillNeedsItsChip(headerSays, now);
  return (
    <section
      data-mrd=""
      data-register={now.register}
      aria-label="What is happening now"
      className="flex flex-col gap-mrd-3 rounded-mrd-card border border-mrd-line bg-mrd-lift px-mrd-5 py-mrd-4"
    >
      <div role="status" aria-live="polite" className="flex flex-col gap-mrd-1">
        <div className="flex flex-wrap items-center gap-mrd-3">
          {ownChip ? (
            <StatusChip status={now.status} pulse={now.pulse}>
              {now.word}
            </StatusChip>
          ) : null}
          {/* Nothing beside the chip when the chip has said the whole fact:
              three of the twelve registers now do that deliberately, and a
              headline restating the word an inch to its left was the defect
              (see `run-now.ts`'s `headline`). The chip is then the only thing
              on the row, and it reads as calm rather than as a hole. */}
          {now.headline ? (
            <span className="min-w-0 text-mrd-base font-medium leading-mrd-snug text-mrd-ink">
              {now.headline}
            </span>
          ) : null}
        </div>
        {now.line ? (
          <p className="max-w-[var(--mrd-measure-prose)] text-mrd-small leading-mrd-prose text-mrd-mute">
            {now.line}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex flex-col gap-mrd-3">{children}</div> : null}
    </section>
  );
}

/**
 * A fact inside the Now card: a whole sentence, never truncated. `Row` clips
 * its lead to one line, which is right for a list and wrong for the one
 * sentence that says why the work stopped; the first live walk of the card
 * showed "Trying again changes nothing. Send it back a st…".
 */
export function HoldFact({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="max-w-[var(--mrd-measure-prose)] text-mrd-small leading-mrd-prose text-mrd-body">
        {children}
      </p>
      {sub ? (
        <p className="max-w-[var(--mrd-measure-prose)] text-mrd-small leading-mrd-prose text-mrd-mute">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

export default RunNow;
