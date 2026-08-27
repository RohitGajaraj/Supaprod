/**
 * THE FOOTER SAYS WHAT MODE THE WORK IS IN. NEVER WHERE IT IS.
 *
 * ── THE RULING THIS BUILDS, WHICH HAD NEVER BEEN BUILT ────────────────────
 * THE-ONE-SCREEN:21 draws a footer under both panes and :31 states its whole
 * contract: *"The footer carries MODE, not position. 'Working on its own · will
 * ask before it ships' and a Stop that always works. Never 'step 3 of 7'."* The
 * run screen shipped without one.
 *
 * The reason position is banned here is the same reason R-13 refused a progress
 * bar: a route that waives and reopens stations cannot honestly be drawn as a
 * position, and "step 3 of 7" is a position wearing a sentence.
 *
 * ── "IT WILL ASK BEFORE IT SHIPS" IS A CLAIM, SO IT IS CHECKED ────────────
 * That half is not mood, it is R-27: the production deploy is gated on proof,
 * `release.publish` is pinned to `review` and can never graduate, and the
 * ruling explicitly REFUSED the flag that would have let it run unattended. It
 * is a platform-level invariant rather than a per-workspace setting, which is
 * exactly what makes it safe to say on every run rather than only where some
 * row happens to be set.
 *
 * ── AND THE STOP ONLY CLAIMS WHAT IT CAN DO ───────────────────────────────
 * A press in THIS tab buys a number of automatic legs, and cancelling them is
 * something this surface can genuinely do. A run the sweep is driving is not
 * stoppable from here at all. So `canStop` is true for the first and false for
 * the second, and the footer says the mode instead of offering a button that
 * would lie. "A Stop that always works" is a promise about the control's
 * reliability, not a licence to draw one that cannot act.
 */

export type FooterMode = {
  /** The mode, in the product's own voice. */
  line: string;
  /** Whether a Stop pressed right now would genuinely change anything. */
  canStop: boolean;
  /**
   * What closing this page would do, or null when nothing is running.
   *
   * SESSION-1's second unit is "I'm on it, you can leave this page", and its
   * point is that visible agency must not mean mandatory attendance. The mode
   * line above could not carry it, because ONE sentence was covering two
   * opposite answers.
   */
  leave: string | null;
};

export function footerMode(input: {
  status: "open" | "done" | "abandoned";
  /** From `holdTone`, which reads the RAW reason. Never the prose. */
  tone: "you" | "hold" | null;
  /** A press in this tab is walking legs it bought. */
  walking: boolean;
  /** The record says a seat is running, whoever started it. */
  crewLive: boolean;
}): FooterMode {
  if (input.status === "done") {
    return { line: "This run is finished.", canStop: false, leave: null };
  }
  if (input.status === "abandoned") {
    return { line: "This run was abandoned.", canStop: false, leave: null };
  }

  /*
   * ── THE TWO MODES THAT READ THE SAME AND ARE NOT ──────────────────────
   *
   * Both branches below say "Working on its own", and until now that was the
   * whole footer, which made them indistinguishable. They are opposites on the
   * only question a person actually has here.
   *
   * A press in THIS TAB buys a run of automatic legs, and the next leg is
   * fired by a `setTimeout` inside `TrackRun`. Close the page and no further
   * leg is bought. So "Working on its own" was true about the agents and
   * misleading about the page: it reads as permission to leave, in the one
   * mode where leaving changes what happens.
   *
   * What IS provable is the narrow thing, and it is what the line says: the leg
   * already dispatched is a server call and finishes. Whether the sweep later
   * picks the work up is the sweep's business and this footer does not promise
   * it, because a track on a terminal hold is removed from its selection
   * entirely and the footer cannot see which.
   */
  if (input.walking) {
    return {
      line: "Working on its own. It will ask before it ships.",
      canStop: true,
      leave: "This page is buying its next steps. Close it and it finishes the step it is on.",
    };
  }

  /*
   * Someone else's press, or the sweep. Same truthful mode line, and no Stop:
   * nothing this tab can do would halt it, and a control that cannot act is the
   * affordance failure this surface has already paid for once.
   */
  if (input.crewLive) {
    return {
      line: "Working on its own. It will ask before it ships.",
      canStop: false,
      // The loop is driving this, not the page. Nothing here is required, and
      // saying so is the whole of SESSION-1's second unit.
      leave: "You can close this. It carries on without you.",
    };
  }

  /*
   * NOTHING IS RUNNING IN THE THREE BELOW, so there is nothing leaving could
   * interrupt and no sentence to add. Telling a person they may leave a run
   * that is already stopped would read as reassurance about work that is not
   * happening, which is the failure this whole surface is built against.
   */
  if (input.tone === "you") return { line: "Waiting on you.", canStop: false, leave: null };
  if (input.tone === "hold") {
    return { line: "Stopped, and not on you.", canStop: false, leave: null };
  }

  return { line: "Nothing is driving it right now.", canStop: false, leave: null };
}
