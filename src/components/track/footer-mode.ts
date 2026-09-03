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
import { STOPPED_BY_YOU } from "@/lib/spine/driver";

/**
 * THE ONE HALF OF THE FOOTER SENTENCE THAT IS TRUE REGARDLESS OF STATE.
 *
 * "Working on its own" describes a run in progress and is false the moment
 * nothing is running. This clause is different: it is R-27 (see the header
 * above), a platform floor rather than a per-run fact, so it holds whether or
 * not any track is walking and whatever the workspace's arc is set to. That is
 * what makes it safe to state on a surface with no single run to report on --
 * Settings > Autonomy imports this constant rather than a copy, so the two
 * places can never say something different from the one this file proves.
 */
export const WILL_ASK_BEFORE_IT_SHIPS = "It will ask before it ships.";

/**
 * Did a PERSON stop this run, as opposed to the workspace kill switch?
 *
 * Both hold as `paused`, because the hold vocabulary is closed and a new member
 * would have to be taught to six readers before it could be shown honestly
 * anywhere. `last_hold_because` is the column that separates them and
 * `STOPPED_BY_YOU` is the sentinel the driver writes there, with one writer and
 * no model near it. See its own header in `driver.ts` for why an exact-equality
 * check against a shared constant is not the prose-parsing this file bans.
 */
export function stoppedByYou(hold: string | null, because: string | null): boolean {
  return hold === "paused" && because === STOPPED_BY_YOU;
}

export type FooterMode = {
  /** The mode, in the product's own voice. */
  line: string;
  /** Whether a Stop pressed right now would genuinely change anything. */
  canStop: boolean;
  /**
   * Whether there is anything to start.
   *
   * ── WHY THE RUN CONTROL IS DOWN HERE NOW ────────────────────────────────
   * It lived in a boxed `Run it` region halfway up the left pane, which meant
   * stopping a run and starting one were in two different places, and the one
   * you needed was whichever was off screen. THE-ONE-SCREEN:21 puts the control
   * in the footer; this is the other half of that ruling, and the two are one
   * control in one place rather than two controls in two.
   *
   * `canRun` and `canStop` are never both true: a run is either moving or it is
   * not. They are two fields rather than one enum because a settled run is
   * neither, and a tri-state spelled as a boolean is how the third case gets
   * forgotten.
   */
  canRun: boolean;
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
  /**
   * `spine_tracks.last_hold_because`, for the ONE question the raw reason cannot
   * answer: whether `paused` means the workspace kill switch or a person
   * pressing Stop on this run. Compared against a shared constant with a single
   * writer, never read as prose; see `stoppedByYou` above.
   */
  because: string | null;
  /** A press in this tab is walking legs it bought. */
  walking: boolean;
  /** The record says a seat is running, whoever started it. */
  crewLive: boolean;
}): FooterMode {
  if (input.status === "done") {
    return { line: "This run is finished.", canStop: false, canRun: false, leave: null };
  }
  if (input.status === "abandoned") {
    return { line: "This run was abandoned.", canStop: false, canRun: false, leave: null };
  }

  /*
   * ── A PERSON STOPPED IT, WHICH IS NOT THE WORKSPACE BEING PAUSED ────────
   *
   * Checked FIRST among the open cases, and before `walking`, because the two
   * co-occur for exactly as long as the leg already dispatched takes to finish:
   * the stop is on the record, the seat in flight is still running, and the
   * honest headline in that window is that it is stopping rather than that it is
   * working on its own.
   *
   * Without this branch the footer would fall through to `tone === "hold"` and
   * say "Stopped, and not on you." about a stop that was entirely on you, while
   * the pane above it printed "Stopped by you." Two sentences about one moment,
   * disagreeing, which is the defect this file was written to end.
   */
  if (stoppedByYou(input.hold, input.because)) {
    return {
      line: "You stopped this. It will not start another step until you run it.",
      canStop: false,
      canRun: true,
      leave: null,
    };
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
      line: `Working on its own. ${WILL_ASK_BEFORE_IT_SHIPS}`,
      canStop: true,
      canRun: false,
      leave: "This page is buying its next steps. Close it and it finishes the step it is on.",
    };
  }

  /*
   * Someone else's press, or the sweep.
   *
   * ── THE STOP WORKS HERE NOW, AND THAT IS A CHANGE OF FACT ───────────────
   * This branch used to return `canStop: false`, and the reason it gave was
   * correct at the time: "nothing this tab can do would halt it, and a control
   * that cannot act is the affordance failure this surface has already paid for
   * once." Stop was a number in this browser tab -- `setLegsLeft(0)` -- so it
   * genuinely could not reach a run the sweep was driving.
   *
   * `spine_tracks.stop_requested_at` changed what Stop IS. It is a row now, and
   * `driveTrackOnce` reads it before dispatching any seat, so it binds the sweep
   * and this tab alike. The control can act, so it is drawn.
   *
   * The `leave` sentence is unchanged and still true: the loop drives this, not
   * the page.
   */
  if (input.crewLive) {
    return {
      line: `Working on its own. ${WILL_ASK_BEFORE_IT_SHIPS}`,
      canStop: true,
      // The loop is driving this, not the page. Nothing here is required, and
      // saying so is the whole of SESSION-1's second unit.
      leave: "You can close this. It carries on without you.",
      canRun: false,
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
    /*
     * P-43 (A-QUEUE.md): "Run it now" beside "Waiting on you." was two verbs
     * for one state. `nothingIsComing` already splits this branch's LINE on
     * exactly the distinction the button needs: a terminal hold has no open
     * question, and the run control genuinely IS the way out (the comment
     * just above already said so); `waiting-on-a-person` has a real, open
     * gate, and the way out is answering IT, not a second control here
     * claiming to be one. `canRun` now follows the same split the line
     * already draws instead of being true across both.
     */
    const terminal = nothingIsComing(input.hold);
    return {
      line: terminal
        ? "Stopped here. Nothing will pick it up again on its own."
        : "Waiting on you.",
      canStop: false,
      canRun: terminal,
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
    return { line: "Stopped, and not on you.", canStop: false, canRun: true, leave: null };
  }

  return { line: "Nothing is driving it right now.", canStop: false, canRun: true, leave: null };
}
