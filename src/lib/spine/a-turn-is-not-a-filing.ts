/**
 * ONE SCREEN SAID DESIGN DID IT "3 TIMES" AND "12 TIMES", AND BOTH WERE TRUE.
 *
 * ── WHAT A STRANGER READ, COLD ────────────────────────────────────────────
 * S1 walked `6cc7a010` knowing nothing about it and could not reconcile these,
 * 300px apart and both above the fold:
 *
 *   the road      Design    1 prototype, 3 times
 *   the hold card Design    said this 12 times, and filed nothing on any of them
 *
 * They assumed one was broken. Neither was. The run holds TWO Design passes:
 *
 *   07:50   2 turns   filed 3 prototypes across them, of 1 distinct title
 *   09:10   12 turns  filed nothing, every one halted out of credit
 *
 * So "3" counts FILINGS of a drawing and "12" counts TURNS that produced none.
 * Two different units, one word, no way for a reader to know which was which --
 * and worse, the card's sentence says Design "filed nothing" while the road
 * says Design filed a prototype. On its face that is a contradiction, and the
 * only thing separating them is a unit neither sentence names.
 *
 * ── THE SCREEN ALREADY HAD THE RIGHT WORDS AND WAS NOT USING THEM ─────────
 * This is not a vocabulary that had to be invented. Both halves were already
 * on the same page, in the story directly underneath:
 *
 *   "Design · Design, Critique · 2 turns · 1m 32s"
 *   "Stopped · Design · 12 turns · 7.3s"
 *   "prototype · 3 versions, 1 the same"
 *
 * TURNS for passes, and the artifact pane counts VERSIONS for filings. The road
 * and the card were the two surfaces not using them -- four sentences reaching
 * for "times" for whichever of the two they meant.
 *
 * ── SO THE UNITS SPLIT, AND THE NUMBER STAYS WHERE IT WAS ─────────────────
 * Law 21: a summary keeps the number it summarised, so the claim stays
 * checkable by a person holding both screens. Nothing here changes a count.
 * What changes is that each count now names its unit, and the unit matches the
 * word the story below already uses for the same rows -- so "12 turns" on the
 * card has a visible referent eight hundred pixels down, and "3 times" on the
 * road is the only remaining sense of "times" on the screen.
 *
 * ── WHY A MODULE AND NOT THREE STRING EDITS ───────────────────────────────
 * Because three string edits are how it drifts back. The words lived as
 * literals in `what-it-keeps-saying.ts`, `the-blocker-it-already-named.ts` and
 * `TrackActivity.tsx`, none of which import each other, and every one of them
 * was individually defensible. That is law 14 exactly: the defect existed only
 * BETWEEN them, so no test of any one file could see it, and the next person
 * writing a fourth sentence about a station's passes had nothing to copy from.
 * Now they have this.
 */

/**
 * How many passes a station made. The unit for AGENT TURNS, never for filings.
 *
 * "Turn" is the story's own word, printed on every section header of the
 * transcript this sits above ("Design · 12 turns · 7.3s"), so a count in turns
 * can be checked against the rows it summarises without the reader converting
 * anything.
 */
export function inTurns(n: number): string {
  return n === 1 ? "1 turn" : `${n} turns`;
}

/**
 * How many times a station FILED something. The unit for artefacts, never for
 * turns.
 *
 * This keeps the bare "times", because the road's node is about twelve
 * characters wide and "3 versions" does not fit beside a kind word. It is safe
 * to keep only because the turn counts have stopped competing for it: with
 * `inTurns` in use everywhere else, "times" on this screen now has exactly one
 * meaning.
 *
 * ONE FILING IS NOT WORTH SAYING. A station that filed once says "1 prototype"
 * and stops; "1 prototype, 1 time" is the machinery counting to one out loud.
 * Callers already branch on that, and this returns null so the branch is this
 * module's rather than each caller's.
 */
export function filedTimes(n: number): string | null {
  return n <= 1 ? null : `${n} times`;
}
