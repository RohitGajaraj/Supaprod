/**
 * WHAT THE RUN HEADER'S CHIP SAYS, as a function with no React in it.
 *
 * Extracted from the route (RUN-60) for the same reason `footer-mode.ts` was:
 * this decides the FIRST thing a person reads about a run, it has seven
 * branches, and nothing was testing any of them. It sat private in a route
 * file, so the only way to check a branch was to find a track in that state and
 * look.
 *
 * The properties worth pinning are in the test beside this file. The one that
 * cost a screen: no hold ever returns a second sentence, because the reason is
 * already on the map's stop and in "Why it stopped".
 */
import { holdTone, STOPPED_BY_YOU } from "@/lib/spine/driver";
import { waitingOnTime } from "@/components/track/a-calendar-wait-is-not-a-stoppage";
import { nothingIsComing } from "@/components/track/nothing-is-coming";
import type { Track } from "@/lib/spine/track.functions";

/**
 * The status chip's three inputs, derived once so the header cannot drift from
 * the driver's own vocabulary. `Finished` overrides StatusChip's default word
 * for pass because reaching the end of a route is a completion, not a graded
 * outcome -- the product has never graded a forecast, and "Passed" would claim
 * one.
 *
 * `liveNow` is RUN-18's input: work in motion outranks a hold row written
 * between automatic legs. An out-of-time hold lands mid-press by design; while
 * the next leg is already walking, the truthful headline is Running, and the
 * hold sentence returns the moment the walk hands control back.
 */
export function runStatus(
  track: Track,
  liveNow = false,
  /**
   * The forecast's horizon, when the caller has read one. P-37: a track at
   * Learn whose horizon is ahead is waiting on the CALENDAR, and this header
   * called it "On hold" beside a footer saying "Learn returns Sat, Oct 3" and a
   * pane saying the same. Three surfaces, one state, two words.
   *
   * Optional, so every caller that has not plumbed the date keeps the behaviour
   * it had rather than being told a date it does not know.
   */
  horizon: string | null = null,
): {
  status: "you" | "agent" | "pass" | "hold" | "quiet";
  word: string;
  pulse: boolean;
  second: string | undefined;
} | null {
  if (track.status === "done") {
    return {
      status: "pass",
      word: "Finished",
      pulse: false,
      second: "It reached the end of its route.",
    };
  }
  if (track.status === "abandoned") {
    return { status: "hold", word: "Abandoned", pulse: false, second: undefined };
  }
  /* A stop may arrive while the dispatched seat is still finishing. Keep the
     header aligned with the footer's person-owned stop during that window. */
  if (track.holdReason === "paused" && track.holdBecause === STOPPED_BY_YOU) {
    return liveNow
      ? { status: "you", word: "Stopping", pulse: false, second: undefined }
      : { status: "you", word: "Stopped", pulse: false, second: undefined };
  }
  /*
   * ── A CALENDAR WAIT GETS THE BOARD'S OWN WORD (P-37) ────────────────────
   *
   * BEFORE the live check and before both hold arms, because a calendar wait is
   * neither running nor stopped and both of those would claim it.
   *
   * "Waiting on time" is `tracks-feed`'s word, reused rather than invented:
   * §12's stated failure is one state named two ways on two surfaces, and this
   * state is already on the board under that name. The header, the board, the
   * footer and the pane now say one thing.
   *
   * QUIET, not `hold` (founder, 2026-09-08): a calendar wait the machine has
   * in hand carries no status hue. Seen live on 433da23d: the Now card said
   * "Verdict Mon, Sep 21" in the quiet chip while this chip, on the same
   * screen, wore the hold sand for the same fact. One state, one hue.
   */
  if (waitingOnTime({ station: track.station, holdReason: track.holdReason, horizon })) {
    return { status: "quiet", word: "Waiting on time", pulse: false, second: undefined };
  }

  const tone = holdTone(track.holdReason);
  if (tone !== "you" && liveNow) {
    return { status: "agent", word: "Running", pulse: true, second: undefined };
  }
  /*
   * NO SENTENCE UNDER EITHER HOLD CHIP, AND THIS IS THE THIRD COPY GOING.
   *
   * Photographed at 1440 on a live held track, the reason -- "This run of the
   * loop ran long, so the rest of the work carries on next time." -- was on the
   * screen THREE TIMES: here, on the map's own stop, and as the lead of "Why it
   * stopped". The fact that it was held was stated five times counting the two
   * short forms. Fifteen words, right-aligned in a 36ch column beside the
   * title, was the heaviest of the three and carried the least.
   *
   * TrackRun's heading already applies exactly this rule to itself and says so:
   * it prints WHICH KIND of stop it is and leaves the reason "to the two places
   * that can act on it". That reasoning was sound and simply never knew about
   * this header, which sits in a different file one level up. So this is the
   * same rule finally applied to the copy it was written to exclude.
   *
   * WHY THIS COPY AND NOT ANOTHER, checked rather than assumed. `RunMap` draws
   * `holdLine(stop.hold)` on the held stop whenever `mode === "live"`, which is
   * every live route, so the reason cannot vanish by dropping it here. "Why it
   * stopped" is gated three ways (`held && !walkingMidRoute && !isCalmHold`) and
   * is therefore NOT the safe one to remove -- and it is also the only place
   * that carries the control that clears it, which is where a reason belongs.
   *
   * The chip stays, in both tones, because two words at a glance is what a
   * header is for.
   */
  if (tone === "you") {
    /*
     * ── THE CHIP AND THE TAB SAID THE SAME FALSE THING AS THE FOOTER ───────
     *
     * `footer-mode.ts` splits this exact set and argues it in full: `holdTone`
     * returns "you" for `HOLD_NEEDS_PERSON`, and **four of those six reasons
     * are the whole of `TERMINAL_HOLDS`**. Measured 2026-08-31, of the 37 open
     * tracks reaching here, **36 have nothing pending for the person** -- the
     * loop gave up and `track-tick.ts` dropped them from its selection.
     *
     * Fixing the footer alone would have been the worse outcome, not a smaller
     * one. `TrackRun.tsx:763` writes this word into `document.title`, so the
     * browser tab said "Waiting on you" over a footer saying nothing was
     * coming. Operating model §12 is explicit that a word corrected in one
     * place and left stale in another has made the problem worse, and this is
     * the same claim on three surfaces from two files.
     *
     * ── AND IT SAYS "Stopped", WHICH REVERSES THE PARAGRAPH THAT WAS HERE ──
     *
     * It read "Needs a restart", argued as: the chip's job is the state at a
     * glance AND this state is still the person's, so it names the act that
     * clears it. The second half is what went wrong -- a chip that names an ACT
     * is not a status, and this one ended up being the only surface that
     * thought so.
     *
     * COUNTED RATHER THAN ARGUED. Five surfaces describe this state and, before
     * this change, three already called it stopped: the road's node state is
     * literally `stopped` (`run-journey.ts`), the Now card's chip says
     * "Stopped", and the footer speaks of the stop. Only this chip and the
     * browser tab said "Needs a restart" -- and the founder photographed the
     * consequence, "Needs a restart" in the header beside "Stopped" on the
     * card, 400px apart, both in the `you` hue, one state wearing two words.
     *
     * Lane 1's ruling and the reason it is right: a status chip names the
     * STATE, and the remedy already has a home in the footer's press. Nothing
     * is lost by not naming the act here, because the act is a button eight
     * inches below and `way-out.ts` names it in the pane as well.
     *
     * THE TAB MOVES WITH IT, because the paragraph above this one is still
     * true: a word corrected in one place and left stale in another has made
     * the problem worse. See `run-tab.ts`, which says in as many words that its
     * word matches this file exactly.
     *
     * PULSE GOES OFF, and that is not styling. A pulse is motion, and it is
     * true of `Running` and of a live boundary call. Nothing is moving on a
     * track the sweep has dropped, and drawing motion over a dead feed is the
     * staged state SPEC-PRESENCE forbids outright.
     */
    return nothingIsComing(track.holdReason)
      ? { status: "you", word: "Stopped", pulse: false, second: undefined }
      : { status: "you", word: "Waiting on you", pulse: true, second: undefined };
  }
  if (tone === "hold") {
    return { status: "hold", word: "On hold", pulse: false, second: undefined };
  }
  /*
   * NO CHIP, AND THIS IS THE HONESTY FIX RATHER THAN A GAP.
   *
   * The fallback used to return "Running" for any open track with no hold. That
   * is every track sitting between sweeps, which is most of them: caught at
   * 1024px on a real run where the header said Running while the pane directly
   * beneath it said "Nothing is driving it right now" and the character said
   * "Ready when you are." Three statements about one run, and the loudest was
   * the false one.
   *
   * Nothing is running here, nothing is holding it, and nobody is waiting on
   * anybody. This system already has a word for that and it is silence: the
   * spec chip follows the same rule, "quiet in this system means nothing to
   * report, and a chip that says nothing is noise". So the chip is absent and
   * the two honest sentences below it carry the state.
   */
  return null;
}

/*
 * `originLine` USED TO LIVE HERE AND THERE WERE TWO OF IT.
 *
 * The canonical one is `src/lib/track-origin.ts`, whose own header states the
 * unification that had not happened: "the server composes the goal with it, the
 * run header renders with it, and both say the same thing about the same pair
 * of strings." The server did. This file carried a second, behaviourally
 * identical copy, and the run header used that one.
 *
 * Identical is the dangerous case rather than the safe one. Two copies that
 * agree today are one edit from disagreeing, and the disagreement would show up
 * as a mission goal and the header above it describing the same track
 * differently, which is the exact defect `track-origin.ts` was written to end.
 * It also names its 15-character floor (`ORIGIN_REMAINDER_MIN`) where this one
 * inlined the number, so the judgement was arguable there and invisible here.
 *
 * The route now imports it straight from the library. No re-export shim: a
 * shim would keep the second name alive and the next person would not know
 * which of the two they were calling.
 */
