import { TERMINAL_HOLDS } from "@/lib/spine/correction";

/**
 * IS ANYTHING STILL COMING FOR THIS WORK? ONE ANSWER, FOR EVERY SURFACE.
 *
 * ── WHY THIS IS A FILE AND NOT FOUR `new Set(TERMINAL_HOLDS)` LINES ───────
 * Five places on the run screen answer this question and they must not answer
 * it separately: the header chip (`run-status.ts`), the browser tab
 * (`run-tab.ts`), the footer (`footer-mode.ts`), the sentence under the
 * heading (`TrackRun.tsx`) and the way out (`way-out.ts`). On 2026-08-31 four
 * of the five said a question was waiting for the person when none was, and
 * the fifth said the true thing directly beneath them.
 *
 * A private `Set` in each file is the shape that produced that: five readers
 * of one constant, each free to drift, none failing when they disagree.
 *
 * ── AND IT CARRIES THE COUPLING THE FIRST FIX GOT WRONG ───────────────────
 * `TERMINAL_HOLDS` is not the set a surface branches on by itself, and
 * assuming it was cost this lane a shipped-and-unreachable branch. The set
 * that reaches a surface is `holdTone`'s, and **every terminal reason is also
 * in `HOLD_NEEDS_PERSON`**, so a terminal hold arrives as tone `"you"` and
 * never as tone `"hold"`. A branch written under `"hold"` typechecks, passes,
 * and cannot be reached by a single row. The guard for that lives in
 * `footer-mode.test.ts`; this docblock is the other half of it, where the next
 * person will actually be reading.
 *
 * ── WHAT "TERMINAL" MEANS, CONCRETELY ─────────────────────────────────────
 * `track-tick.ts` removes a track holding one of these reasons from its
 * selection entirely. Nothing will drive it again. The only exit is a person
 * pressing something, which is exactly what `way-out.ts` tells them in the
 * pane. Measured 2026-08-31: **36 of the 56 open held tracks are here**, and
 * 32 of those carry `station-cannot-finish` alone.
 */
const TERMINAL: ReadonlySet<string> = new Set<string>(TERMINAL_HOLDS);

/**
 * True when the loop has stopped for good and only a person restarts it.
 *
 * Tolerant of an unknown string, and it resolves FALSE for one — the same call
 * `way-out.ts` and `holdTone` make, for the same reason. `last_hold` is a text
 * column, so a value written by a newer deploy arrives here as a word this
 * build does not know. **The wrong direction to guess is the one that tells a
 * person the loop has quit on work it was going to pick up anyway**, because
 * that sends them to do by hand something already in hand.
 */
export function nothingIsComing(hold: string | null | undefined): boolean {
  return TERMINAL.has(hold ?? "");
}
