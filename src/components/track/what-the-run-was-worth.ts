/**
 * THE VERDICT REACHED THE ROAD AND NEVER THE CARD, SO THE ONE RUN THAT
 * FINISHED SAID "IT REACHED THE END OF ITS ROUTE".
 *
 * ── READ ON `d1168015`, THE ONLY COMPLETE RUN IN THIS PRODUCT'S HISTORY ───
 * 121 tracks have been started. One has walked all seven stations. On its
 * screen:
 *
 *   the road, under Learn        missed
 *   the Now card                 [Finished]  It reached the end of its route.
 *   the footer                   This run is finished.
 *
 * That run DECIDED NOT TO DO THE WORK -- "Decline broad onboarding flow
 * improvement without new evidence" -- shipped the decline, and the forecast
 * that justified declining was graded **missed**. The product made a call, put
 * a falsifiable claim behind it, waited, and found out it was wrong. That is
 * the entire argument for the loop existing, and the card described the route.
 *
 * ── AND THE SENTENCES FOR IT WERE WRITTEN AND UNREACHABLE ────────────────
 * `run-now.ts` holds `VERDICT_LINE`, three of them:
 *
 *   held          "It did what you said it would. The evidence is on the right."
 *   missed        "It did not do what you said it would. The evidence is..."
 *   inconclusive  "Whether it did what you said could not be told..."
 *
 * behind `input.verdict ? VERDICT_LINE[input.verdict] : null`, and `TrackRun`
 * passed `verdict: null` as a literal. **Not one of them had ever rendered.**
 *
 * That is the second time today: the Inbox's settled line held ten past-tense
 * sentences behind a `??` on a field that is never null. Same shape, same
 * cause -- somebody wrote the right words, the wire was never connected, and
 * nothing failed. A hard-coded null is worse than a missing argument, because
 * the compiler is satisfied and the reader of the call site sees a decision.
 *
 * ── WHERE IT COMES FROM, AND WHY NOT A NEW READ ──────────────────────────
 * `learning.fields.verdict` on the Learn stop, which the run screen already
 * holds: `run-journey.ts` reads exactly this to put "missed" under the last
 * node, off the same `stops` the story and the artifact pane use. So this is
 * the answer already being on the wire, for the eighth time this week, and it
 * costs no round trip.
 *
 * ── THE RECORD'S OWN WORDS, MAPPED ONCE ──────────────────────────────────
 * The column holds five values and the card speaks three registers, because
 * `confirmed` and `held` are one outcome to a reader and so are `refuted` and
 * `missed`. The mapping lives here rather than in two places: the road folds
 * them too, and a second opinion about what `refuted` means is exactly the
 * drift this repo keeps paying for.
 */

/** What the record writes, and what a person is told. */
const VERDICT: Record<string, "held" | "missed" | "inconclusive"> = {
  held: "held",
  confirmed: "held",
  missed: "missed",
  refuted: "missed",
  inconclusive: "inconclusive",
};

type StopLike = {
  station?: string | null;
  items?: readonly { kind?: string | null; fields?: unknown }[] | null;
};

/**
 * How the forecast was graded, or null when it has not been.
 *
 * NULL IS NOT "inconclusive". A run that has not reached Learn, or reached it
 * and filed no learning, has no verdict -- and `inconclusive` is a real grade
 * meaning the evidence could not settle it. Collapsing them would tell a person
 * their forecast was tested and unclear when nothing was ever tested.
 *
 * The NEWEST learning wins. A track sent back through Learn is graded again,
 * and the current answer is the one a person is looking at.
 */
export function whatTheRunWasWorth(
  stops: readonly StopLike[] | null | undefined,
): "held" | "missed" | "inconclusive" | null {
  if (!stops) return null;
  let answer: "held" | "missed" | "inconclusive" | null = null;
  for (const stop of stops) {
    if (stop.station !== "learn") continue;
    for (const item of stop.items ?? []) {
      if (item.kind !== "learning") continue;
      if (!item.fields || typeof item.fields !== "object") continue;
      const raw = (item.fields as { verdict?: unknown }).verdict;
      if (typeof raw !== "string") continue;
      const mapped = VERDICT[raw];
      /* An unknown value draws nothing rather than a raw column word. The
         column is text, not an enum, so a newer deploy can write a grade this
         build has never heard of, and printing it at a person is the defect
         `tracks-feed.ts` records paying for on `forecast_resolution`. */
      if (mapped) answer = mapped;
    }
  }
  return answer;
}
