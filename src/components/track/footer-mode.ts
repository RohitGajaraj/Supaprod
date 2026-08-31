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

import { nothingIsComing } from "@/components/track/nothing-is-coming";

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
  /**
   * The raw `spine_tracks.last_hold`, for the one question `tone` cannot
   * answer: whether anything will ever pick this up again. Never the prose,
   * for the same reason `tone` is not: `holdBecause` is a sentence and a
   * sentence is not a state.
   */
  hold: string | null;
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
  if (input.tone === "you") {
    /*
     * ── "WAITING ON YOU" WAS ONE SENTENCE FOR TWO OPPOSITE SITUATIONS, AND
     *    THIS FILE HAS ALREADY PAID FOR THAT SHAPE ONCE ─────────────────────
     *
     * The header above records fixing exactly this for "Working on its own",
     * which read as permission to leave in the one mode where leaving changed
     * what happened. This is the same defect at the other end of the function.
     *
     * `holdTone` returns "you" for `HOLD_NEEDS_PERSON` (`driver.ts:1448`),
     * which is six reasons -- and **four of them are the whole of
     * `TERMINAL_HOLDS`.** So the set that reaches here is not one situation:
     *
     *   waiting-on-a-person      a boundary call is open. A question is
     *                            genuinely pending and answering it releases
     *                            the work. "Waiting on you" is exactly right.
     *
     *   station-cannot-finish    TERMINAL. The loop gave up. `track-tick.ts`
     *   given-up                 removes these from its selection entirely, so
     *   tools-refused            nothing is pending, nothing is coming, and
     *   going-in-circles         the work moves only if the person restarts it.
     *
     * MEASURED 2026-08-31, open tracks reaching this branch:
     *
     *   station-cannot-finish   32   TERMINAL
     *   going-in-circles         2   TERMINAL
     *   tools-refused            1   TERMINAL
     *   given-up                 1   TERMINAL
     *   waiting-on-a-person      1
     *
     * **36 of the 37 runs told "Waiting on you." have nothing waiting for the
     * person to answer.** The sentence reads as a pending question, a person
     * looks for the question, and there is none -- the loop quit. That is a
     * dead end wearing a status line, and `way-out.ts` already says the true
     * thing in the pane while the footer contradicted it.
     *
     * ── HOW I FOUND THIS, BECAUSE THE FIRST VERSION OF THIS UNIT WAS WRONG ──
     * I first put this split under `tone === "hold"`, reasoning from
     * `TERMINAL_HOLDS` alone without reading `HOLD_NEEDS_PERSON`. Every
     * terminal hold is a member of both, so that branch was **unreachable for
     * every row it was written for** -- shipped work with no way in, which is
     * the class this repo named this week. It was caught by opening track
     * `a30238f5` (`given-up`) in a browser and reading "Waiting on you." in
     * the footer, and by nothing else. **A branch argued from one set and
     * gated on another is not a typo; it is the same substitution defect this
     * lane filed twice today.**
     *
     * ── WHAT I DELIBERATELY DID NOT BUILD, AND THE ROW COUNT THAT DECIDED IT
     * S3 raised the `crewLive` branch above -- "You can close this. It carries
     * on without you." -- as the sentence most likely to be untrue, on the
     * grounds that 97 of 106 tracks carry a hold. The concern is right in
     * principle and **zero rows support it today**: no track holding a
     * terminal reason has a run in flight, so the two states cannot co-occur
     * and a guard there would be a second branch nothing can reach. Left
     * alone, on purpose, and recorded so the next reader does not re-derive it.
     *
     *   select count(*) from spine_tracks t where t.status='open'
     *     and t.last_hold in (…TERMINAL_HOLDS…)
     *     and exists (select 1 from agent_runs r where r.track_id=t.id
     *                 and r.status in ('running','queued','in_progress'));   -- 0
     */
    return {
      line: nothingIsComing(input.hold)
        ? "Stopped here. Nothing will pick it up again on its own."
        : "Waiting on you.",
      canStop: false,
      leave: null,
    };
  }

  /*
   * Held for a reason no person is required for: `out-of-time`,
   * `needs-evidence`, `produced-nothing` and the rest. None of these is in
   * `TERMINAL_HOLDS`, so the sweep still takes them and the old sentence is
   * true of every row that reaches here. Nineteen tracks today, and not one
   * of them terminal.
   */
  if (input.tone === "hold") {
    return { line: "Stopped, and not on you.", canStop: false, leave: null };
  }

  return { line: "Nothing is driving it right now.", canStop: false, leave: null };
}
