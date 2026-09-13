import { holdTone } from "@/lib/spine/driver";
import { nothingIsComing } from "@/components/track/nothing-is-coming";

/**
 * THE ONE LIVE FACT WORTH PUTTING IN THE BROWSER TAB.
 *
 * A run a person has stepped away from must still reach them where they are
 * looking, and after they switch tabs the browser tab IS where they look. This
 * derives the word from rows and this pane's own facts only -- never from a
 * timer -- and it answers at most two things, because a tab title is one glance:
 *
 *   "Working"           a leg is in flight from this tab, or the record itself
 *                       carries running/queued seats (`hasLiveVisit`, the same
 *                       source the transcript polls fast on).
 *   "Waiting on you"    a boundary call is open and answering it releases the
 *                       work. ONE open track carries this today.
 *   "Stopped"           the loop gave up and `track-tick.ts` dropped the track
 *                       from its selection, so nothing is coming for it.
 *                       THIRTY SIX open tracks carry this today, and every one
 *                       of them used to read "Waiting on you" here, in the
 *                       header chip, and in the footer -- three surfaces, three
 *                       files, one wrong claim. The word matches `run-status.ts`
 *                       exactly, because a tab and the chip it summarises
 *                       disagreeing is worse than either being terse.
 *                       IT WAS "Needs a restart" UNTIL 2026-09-09, and moved
 *                       with the chip when that stopped naming an act and
 *                       started naming the state, so the coupling this line
 *                       promises is still true. A tab reading "Stopped" is the
 *                       same news to somebody who stepped away; the act is a
 *                       button on the page they come back to.
 *
 * This one earns the tab MORE than the others, not less: it is the only news
 * that will ever reach a person who stepped away. There is no notification kind
 * for a piece of work that stopped (S3, 2026-08-31), and the verdict email has
 * fired zero times in its life.
 *
 * Anything else -- finished, stopped on a condition, never driven -- contributes
 * nothing: a quiet title is the honest default and the page behind it already
 * says why. A person being needed outranks busyness, matching the precedence
 * the presence derivation runs.
 */
export function runTabState(input: {
  status: string | null;
  holdReason: string | null;
  holdBecause?: string | null;
  /** A drive mutation is in flight from this tab. */
  walking: boolean;
  /** The record says a crew is here right now (queue 71's live fact). */
  crewLive: boolean;
}): "Working" | "Waiting on you" | "Stopping" | "Stopped" | null {
  // A closed track is not news: both endings are said once, on the page.
  if (input.status === "done" || input.status === "abandoned") return null;
  if (input.holdReason === "paused" && input.holdBecause === "Stopped by you.") {
    return input.walking || input.crewLive ? "Stopping" : "Stopped";
  }
  const tone = input.holdReason ? holdTone(input.holdReason) : null;
  if (tone === "you") {
    return nothingIsComing(input.holdReason) ? "Stopped" : "Waiting on you";
  }
  if (input.walking || input.crewLive) return "Working";
  return null;
}
