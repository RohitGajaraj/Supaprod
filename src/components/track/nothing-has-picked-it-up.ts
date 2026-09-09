/**
 * A PROMISE THAT SOMETHING WILL HAPPEN IS A CLAIM, AND THE RECORD CAN CHECK IT.
 *
 * ── THE SENTENCE, AND WHAT IS TRUE BEHIND IT ──────────────────────────────
 * The run screen's default register for an open track is `between`, and it said:
 *
 *     Waiting for its next turn at Build.
 *     It last moved 14 days ago. The loop picks it up on its own. Run it now to
 *     skip the wait.
 *
 * "The loop picks it up on its own" is a PREDICTION, and the fact that
 * contradicts it -- "it last moved 14 days ago" -- was in the same line, one
 * clause earlier. The screen printed the evidence against its own claim and did
 * not read it.
 *
 * ── THE NUMBER, CORRECTED, BECAUSE THE FIRST ONE WAS TOO STRONG ───────────
 * S1 first read 60 of 74 open tracks untouched for 8 to 19 days and called the
 * sweep close to stopped. They corrected it before I could ship the number, and
 * checking it myself against `spine_tracks`:
 *
 *     62 open tracks are cold past 48 hours with no deferral ahead of them,
 *     and 51 of those are correctly stale -- 41 hold a reason the sweep
 *     refuses to act on by design (station-cannot-finish 32, going-in-circles
 *     4, given-up 3, tools-refused 1, needs-a-waived-station 1) and 11 are
 *     calendar waits at Learn.
 *
 * The real number where a "something will happen" promise is live and false is
 * ELEVEN: seven holding `out-of-time`, whose `HOLD_LINE` says *"the rest of the
 * work carries on next time"* with `station_drives` at 0, and four with no hold
 * at all, which are the runs this register speaks for.
 *
 * Eleven, not sixty, and it is worth saying plainly that the smaller number is
 * the one that survives checking. The four are real work rather than fixtures
 * -- one carries 174 agent runs, another 63 -- and they stopped moving a
 * fortnight ago under a sentence promising they had not.
 *
 * ── WHY IT IS STILL WORTH THE CODE AT ELEVEN ──────────────────────────────
 * Because `between` is the default register for every healthy open track, so
 * this sentence is on the screen of every run that is simply between steps, and
 * it becomes false for all of them the next time the sweep stalls. The defect
 * is not that eleven runs are stale; it is that the surface cannot tell.
 *
 * And it is the founder's complaint from the other side. He said the agent does
 * real work and the user sees almost none of it; here the agent does no work
 * and the user is told it is coming, which is worse, because a person who
 * believes the sentence waits instead of pressing the button beside it.
 *
 * ── THE THRESHOLD IS MEASURED, NOT CHOSEN ─────────────────────────────────
 * Gaps between consecutive runs on one track, all 1,730 of them over 30 days:
 *
 *     p50    10.4 minutes      the sweep's own tick
 *     p90    99.9 minutes
 *     p99    2,980 minutes     about 2.07 days
 *     max    29,004 minutes    about 20 days
 *
 * So a working loop returns to a track every ten minutes, and nine in ten gaps
 * are under two hours. **48 hours** sits just past p99: fewer than one percent
 * of gaps the loop has ever actually closed are longer than that, so a track
 * quiet for two days is outside what a running loop does, and the 60 cold ones
 * are at four to nine times that.
 *
 * ── AND IT REPLACES A PREDICTION WITH A FACT ──────────────────────────────
 * This does not predict that nothing will happen. It stops the surface
 * predicting that something will, and says what the record holds instead: when
 * it last moved, and that nothing has come since. A person can then decide,
 * which is the whole difference between a screen that is waiting with them and
 * one that is waiting for them.
 */

/**
 * Past p99 of every gap the loop has actually closed. See the note above.
 *
 * ── NOT `isOverdue`'S DAY, AND THE DIFFERENCE IS THE QUESTION ─────────────
 * `stopped-for.ts` has a 24-hour boundary and its docstring says exactly what
 * it is for: *"past a day it has survived a night nobody looked."* That is a
 * question about a PERSON being late, and the Inbox's rows and its gate share
 * it so the loudest row and the call in front of you cannot disagree.
 *
 * This asks whether the LOOP has stopped coming, which is a question about a
 * machine's cadence, and the machine's own record answers it. Sharing one
 * number across both would make one of them wrong -- a run quiet for thirty
 * hours is overdue for a person and entirely ordinary for the sweep.
 *
 * Where the two DO ask one question -- S1's home row now says "nothing has
 * picked it up for 15 days", which is this question -- they should share this
 * constant rather than the day, and I have said so rather than diverging
 * quietly.
 */
export const COLD_AFTER_MS = 48 * 60 * 60 * 1000;

/**
 * Has anything picked this up lately?
 *
 * `deferredUntil` in the future is NOT cold: the track is waiting on a date by
 * design and the `scheduled` register is already telling the truth about it.
 * A null `drivenAt` on a track that has never run is not cold either -- it has
 * not been waiting, it has not started, and calling that abandonment would
 * invent a history.
 */
export function nothingHasPickedItUp(t: {
  drivenAt: string | null | undefined;
  deferredUntil?: string | null;
  nowMs: number;
}): boolean {
  if (!t.drivenAt) return false;
  if (t.deferredUntil) {
    const until = Date.parse(t.deferredUntil);
    if (!Number.isNaN(until) && until > t.nowMs) return false;
  }
  const at = Date.parse(t.drivenAt);
  if (Number.isNaN(at)) return false;
  return t.nowMs - at >= COLD_AFTER_MS;
}
