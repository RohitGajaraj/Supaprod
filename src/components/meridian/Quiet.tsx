/**
 * ── AN EMPTY QUEUE IS A STATE, NOT A QUESTION ─────────────────────────────
 *
 * P-52. Four call sites drew an empty queue as a card that ASKS, complete with
 * a question mark on a sentence that is a report: *"Nothing is waiting on a
 * call."*, *"Nothing needs your verdict."*, *"What will come here to ship?"*
 *
 * An empty queue is good news and the ordinary state of a healthy workspace.
 * Drawing it as a card makes an absence of work look like an item of work, and
 * a column of such cards reads as a backlog of nothing.
 *
 * ── THE THREE REFUSALS, EACH BECAUSE A SURFACE HAS DONE IT ────────────────
 *
 *   no border    a bordered container is what this product uses for something
 *                that needs answering. There is no `Region`, no card chrome.
 *   no question  it is not asking. A question mark on a report is what turned
 *                these into gates in the first place.
 *   no action    by default. See `action` below for the one case that earns
 *                an exception.
 *
 * ── AND THE ONE CASE `action` EXISTS FOR (P-63) ────────────────────────────
 *
 * "No action" above was written for an empty QUEUE: nothing waiting is good
 * news and there is genuinely nothing to do about it. A first-visit surface
 * is a different fact wearing the same "nothing here yet" sentence -- the
 * workspace has no sources, no runs, no decisions, and there IS exactly one
 * act that starts it (point a source, start a sentence, invite a person).
 * Leaving that door off is the same defect this file's header opens with:
 * an absence of work drawn as if it were the finished state.
 *
 * `NeedsSetup`'s own header draws the line this crosses on purpose: NeedsSetup
 * is for a missing PRECONDITION ("fix that first, then the surface can even
 * ask its question"); this is for a working surface with nothing in it yet
 * ("do the first thing"). `action` is optional and defaults to none, so
 * every existing empty-queue call site is unchanged -- a caller opts in only
 * when there truly is a next step, never invents one to fill the slot.
 *
 * ── IT SAYS WHAT WILL APPEAR, NOT THAT NOTHING HAS ────────────────────────
 *
 * That is the difference between a zero state and an apology, and it is the
 * rule `docs/design/arrival-2026-09.md` settled for an empty workspace: "0
 * findings this week" over a product nobody has given anything to read is a
 * reproach rather than a fact. `whatWillAppear` is REQUIRED for that reason.
 *
 * ── AND IT REFUSES A STATE THAT IS ACTUALLY A HOLD (A1, amendment 2) ──────
 *
 * A queue that is empty BECAUSE nothing is pointed at a source is not quiet: it
 * is held, and the arrival document already has its sentence and its one door.
 * Calming that state is the worst thing this component could do, because it
 * would make a workspace that cannot work look like one with nothing to do, and
 * the person would never learn why.
 *
 * So it is refused rather than styled: `heldBecause` renders NOTHING and says
 * why in the console, and the guard proves a no-source state cannot arrive
 * here. A component that quietly did the wrong thing for that input would be
 * the same substitution this repo keeps paying for.
 */
import * as React from "react";

export function Quiet({
  says,
  whatWillAppear,
  heldBecause = null,
  action = null,
}: {
  /** The state, as a statement. No question mark; a period. */
  says: string;
  /**
   * What WILL appear here, and what it will mean. Required: a zero state that
   * only reports an absence is an apology.
   */
  whatWillAppear: string;
  /**
   * Set when the queue is empty because something is BLOCKING it rather than
   * because there is nothing to do. This component refuses to render then, so a
   * hold cannot be dressed as calm.
   */
  heldBecause?: string | null;
  /**
   * The one act that starts this surface. Leave unset for an ordinary empty
   * queue, where there is genuinely nothing to do; set it for a first-visit
   * zero state, where there is exactly one thing that changes it. See the
   * header above ("AND THE ONE CASE `action` EXISTS FOR").
   */
  action?: React.ReactNode | null;
}) {
  if (heldBecause) {
    /*
     * Loud in the log and silent on the screen, deliberately. The caller has a
     * hold to draw and this is not it; rendering a calm sentence over a blocked
     * queue is the failure this refusal exists for, and rendering an error
     * would put OUR bug in front of a customer instead of their state.
     */
    console.error(
      `[Quiet] refused: this queue is held, not quiet (${heldBecause}). Draw the hold and its one door instead.`,
    );
    return null;
  }

  return (
    <div data-mrd="" className="flex flex-col gap-mrd-1 font-mrd">
      {/* `t-base` and mute, NOT `t-lead`: this is not the loudest thing on a
          screen, because nothing here needs doing. */}
      <p className="text-mrd-base text-mrd-mute">{says}</p>
      <p className="text-mrd-small text-mrd-faint">{whatWillAppear}</p>
      {action ? <div className="mt-mrd-3 flex flex-wrap gap-mrd-3">{action}</div> : null}
    </div>
  );
}

export default Quiet;
