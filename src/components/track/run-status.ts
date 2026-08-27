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
import { holdTone } from "@/lib/spine/driver";
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
): {
  status: "you" | "agent" | "pass" | "hold";
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
    return { status: "you", word: "Waiting on you", pulse: true, second: undefined };
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

/**
 * WHERE THIS CAME FROM, with the title not said twice.
 *
 * ── WHAT WAS ON SCREEN ────────────────────────────────────────────────────
 * The run header prints the title, then prints `track.origin` under it. On
 * `6199f3df` at 1440 those were the same sentence, so the flagship screen
 * opened by saying the same thing twice, one line apart, before anything else.
 *
 * ── AND IT IS NOT A ONE-OFF, WHICH IS WHY THIS IS A FUNCTION ──────────────
 * Measured across all 106 tracks: 68 carry an origin, 1 is character-identical
 * to its title, and 3 more BEGIN with the title and then add to it. So 3 of 68
 * make a person read the title twice before reaching a word they have not
 * already read. That share will grow rather than shrink: the sentence a person
 * types at /start becomes both the title and the origin, so the exact-match
 * case is the natural result of the newest way to start work.
 *
 * ── WHAT IT DOES NOT DO, and this is the important half ───────────────────
 * It does not hide origins. The origin is often the best line on the page --
 * "This became work on its own because 9 signals say it, severity 4, and the
 * cluster is 78% confident these belong together" is a fact nothing else on the
 * screen carries. So the rule removes only the REPEATED prefix, and keeps every
 * word the title did not already say. Silence is reserved for the case where
 * there is genuinely nothing left.
 */
export function originLine(title: string, origin: string | null | undefined): string | null {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ");
  const t = norm(title ?? "");
  const o = norm(origin ?? "");
  if (!o) return null;
  if (!t) return o;

  if (o.toLowerCase() === t.toLowerCase()) return null;

  if (o.toLowerCase().startsWith(t.toLowerCase())) {
    // Drop the repeated opening and whatever punctuation joined it on.
    const rest = o.slice(t.length).replace(/^[\s.,;:\-–—]+/, "");
    // A handful of characters left over is a fragment, not a fact. Below this
    // the honest render is nothing at all rather than a dangling clause.
    return rest.length >= 15 ? rest : null;
  }

  return o;
}
