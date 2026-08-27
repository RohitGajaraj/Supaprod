import { useEffect, useState } from "react";

/**
 * WHETHER A READ HAS BEEN GOING LONG ENOUGH TO OWE THE READER A FIGURE.
 *
 * ── THE GAP BETWEEN TWO PRIMITIVES THAT ARE BOTH RIGHT ─────────────────────
 * Meridian already draws both ends of this and they do not disagree:
 *
 *   `Reading`      the plain quiet state, and its header says it is
 *                  "DELIBERATELY NOT `LoadingState`" for ordinary reads.
 *   `LoadingState` the pixel grid with an elapsed figure, and its header says
 *                  "an elapsed timer on a 200ms fetch is noise. Use this only
 *                  where work genuinely takes seconds."
 *
 * Neither covers the case that actually hurts: a read AUTHORED as ordinary that
 * turns out to take seconds. Nobody chooses that at the call site, because the
 * duration is not knowable when the JSX is written. It depends on the row
 * count, the network and the cold start.
 *
 * ── WHAT WAS MEASURED, AND WHERE ───────────────────────────────────────────
 * `/today`, signed in, on the running product on 2026-08-27. The page was the
 * single word "Opening" at 0.5s, 1.5s and still at 3.0s. At 5.0s it drew
 * "Reading what needs you." and "Reading the run record.". At 7.0s a third
 * joined them. **At 10.0s all three were still there, unchanged.** That is a
 * dev server and production is faster, so the DURATION is not the claim here.
 * The claim is the one `LoadingState`'s own header makes: for those ten
 * seconds a slow read and a hung read were the same pixels, and a person had
 * no way to tell whether to keep waiting.
 *
 * ── WHY A THRESHOLD RATHER THAN A CHOICE AT THE CALL SITE ──────────────────
 * Escalating on elapsed time honours both headers instead of picking one. A
 * fast read never crosses the line, so it stays quiet and the "noise on a
 * 200ms fetch" warning is respected exactly. A slow read crosses it and starts
 * reporting, which is the case the grid was built for. The surface stops
 * guessing at authoring time and answers with what actually happened.
 *
 * 2.5s is the boundary because it is past the point where a reader has decided
 * the screen is quick and before the point where they decide it is broken. It
 * is a constant rather than a token: Meridian's duration scale is for
 * animation, and a token there would put this number where the next person
 * looking for a transition would find it.
 *
 * ── WHY IT REPORTS `startedAt` AND DOES NOT LET THE GRID START AT ZERO ─────
 * `useElapsed` takes `startedAt` for exactly this reason, and its header spells
 * out the failure: a timer that restarts on mount "reports the age of the
 * COMPONENT, not the age of the WORK". If the grid appeared at 2.5s and began
 * at 0.0s it would under-report every wait by the length of the threshold, and
 * the figure would be wrong in the one direction that matters, making a long
 * wait look shorter than it was.
 */

/** Past this, a read stops being ordinary and owes the reader a figure. */
export const SLOW_READ_MS = 2500;

/**
 * PAST THIS, A READER HAS RUN OUT OF THINGS TO DO ABOUT IT.
 *
 * The threshold above turns silence into a figure, which answers "is this
 * moving". It does not answer "and what can I do", and after fifteen seconds
 * that is the only question left. Measured on the running board 2026-08-27:
 * "Reading the run record. 22.4s" with no control anywhere near it. The reader
 * knows exactly how long they have been waiting and has no move except
 * reloading the page.
 *
 * FIFTEEN SECONDS, because it is comfortably past any read this product makes
 * when it is working and comfortably short of the point where somebody has
 * already given up. It is a constant rather than a token for the same reason
 * `SLOW_READ_MS` is: Meridian's duration scale is for animation, and a number
 * here would put this where the next person looking for a transition finds it.
 */
export const STUCK_READ_MS = 15_000;

export function useSlowRead(afterMs: number = SLOW_READ_MS): {
  slow: boolean;
  /**
   * Long enough that the reader is owed a way out as well as a figure.
   *
   * A SECOND BOOLEAN RATHER THAN A COMPARISON ON ELAPSED TIME, deliberately.
   * `useElapsed` re-renders ten times a second; deriving this from it would put
   * the whole subtree on that clock to learn one thing that changes once.
   */
  stuck: boolean;
  startedAt: number;
} {
  /* Captured once, on the first render of the read, NOT on the render that
     flips `slow`. This is the instant the elapsed figure has to count from. */
  const [startedAt] = useState(() => Date.now());
  const [slow, setSlow] = useState(afterMs <= 0);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (afterMs <= 0) {
      setSlow(true);
      return;
    }
    const id = setTimeout(() => setSlow(true), afterMs);
    return () => clearTimeout(id);
  }, [afterMs]);

  /* MEASURED FROM THE READ, NOT FROM THE THRESHOLD. `STUCK_READ_MS` is an
     absolute age, so a caller that passes a longer `afterMs` does not push this
     out with it - the reader's patience does not restart because the surface
     chose to stay quiet for longer. */
  useEffect(() => {
    const id = setTimeout(
      () => setStuck(true),
      Math.max(0, STUCK_READ_MS - (Date.now() - startedAt)),
    );
    return () => clearTimeout(id);
  }, [startedAt]);

  return { slow, stuck, startedAt };
}
