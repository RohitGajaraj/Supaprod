import { holdTone } from "@/lib/spine/driver";

/**
 * THE ONE LIVE FACT WORTH PUTTING IN THE BROWSER TAB.
 *
 * A run a person has stepped away from must still reach them where they are
 * looking, and after they switch tabs the browser tab IS where they look. This
 * derives the word from rows and this pane's own facts only -- never from a
 * timer -- and it answers at most two things, because a tab title is one glance:
 *
 *   "Working"          a leg is in flight from this tab, or the record itself
 *                      carries running/queued seats (`hasLiveVisit`, the same
 *                      source the transcript polls fast on).
 *   "Waiting on you"   `holdTone` says the next move is the person's.
 *
 * Anything else -- finished, stopped on a condition, never driven -- contributes
 * nothing: a quiet title is the honest default and the page behind it already
 * says why. A person being needed outranks busyness, matching the precedence
 * the presence derivation runs.
 */
export function runTabState(input: {
  status: string | null;
  holdReason: string | null;
  /** A drive mutation is in flight from this tab. */
  walking: boolean;
  /** The record says a crew is here right now (queue 71's live fact). */
  crewLive: boolean;
}): "Working" | "Waiting on you" | null {
  // A closed track is not news: both endings are said once, on the page.
  if (input.status === "done" || input.status === "abandoned") return null;
  const tone = input.holdReason ? holdTone(input.holdReason) : null;
  if (tone === "you") return "Waiting on you";
  if (input.walking || input.crewLive) return "Working";
  return null;
}
