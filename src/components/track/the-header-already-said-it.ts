/**
 * TWO CHIPS SAYING "Stopped", 200 PIXELS APART, AND NEITHER KNEW THE OTHER WAS
 * THERE.
 *
 * ── MEASURED ON A RENDERED PAGE, NOT ARGUED ──────────────────────────────
 * S1 walked `6cc7a010` cold and found four "Stopped" chips on one screen. Two
 * of them are always visible together:
 *
 *   top 97    the run header's chip          `run-status.ts`
 *   top 295   the "What is happening now" card   `run-now.ts`
 *
 * My objection was that cutting the card's chip costs a scrolled reader the
 * only state marker on the screen. S1 measured it instead of arguing it, which
 * is the right answer to a disagreement about a rendered page:
 *
 *   window maxScroll ...... 0    (the page itself does not scroll)
 *   scroll containers ..... 2    (the columns scroll inside themselves)
 *   header chip ........... top 97, on screen at EVERY scroll position
 *   card chip ............. top 295 at rest, gone at -180 once scrolled
 *
 * The marker a scrolled reader loses is the CARD's. The one that stays is the
 * header's. So there is no reader who ever sees only the lower chip, and my
 * objection was about a reader who does not exist.
 *
 * ── SO WHY NOT JUST DELETE IT ────────────────────────────────────────────
 * Because the card's chip is not always redundant, and one register renders
 * **the chip alone**. `run-now.ts`'s `headline` is null on three of its twelve
 * registers by deliberate ruling -- "the chip is then the only thing on the
 * row, and it reads as calm rather than as a hole". Delete the chip there and
 * the card renders an empty row.
 *
 * And the header's chip is itself optional: `runStatus` returns null when
 * there is nothing to report, and the route draws nothing at all in that case.
 * A blanket cut would then leave the screen with no state word anywhere.
 *
 * ── THE RULE, WHICH TAKES BOTH FACTS ─────────────────────────────────────
 * The chip goes when the header is already saying the same word AND the card
 * still has a sentence of its own. Both halves are load-bearing:
 *
 *   header silent          -> keep it, or the screen says nothing
 *   header says something else -> keep it, they are not the same claim
 *   card has no sentence   -> keep it, it is the card's only content
 *
 * ── AND IT COMPARES THE WORD, NOT THE STATE ──────────────────────────────
 * `runStatus` and `runNow` are separate deciders with separate branch sets --
 * seven and twelve -- and they agree on this screen by construction rather than
 * by contract. Comparing their two `register`/`status` values would be
 * comparing two vocabularies and inventing a mapping between them, which is a
 * third thing to be wrong.
 *
 * What a reader sees is the WORD. Two chips reading "Stopped" are a repetition
 * whatever the two functions believed they were describing, and two chips
 * reading "Stopped" and "Waiting on you" are not one, even if some mapping said
 * they were the same state. So the word is the comparison, and it is the same
 * thing the eye does.
 *
 * Both callers pass the same `track` and the same `crewLive` into `runStatus`,
 * so the header's word and the word compared here are one call's answer, not
 * two that have to be kept in step.
 */

/** What the card would draw, which is all this needs of `Now`. */
export type CardChip = {
  word: string;
  headline: string | null;
  line: string | null;
};

/**
 * Should the Now card draw its own status chip?
 *
 * `headerSays` is the header chip's word, or null when the header is drawing no
 * chip at all -- which is a real case (`runStatus` returns null when there is
 * nothing to report) and NOT the same as the header saying something different.
 */
export function theCardStillNeedsItsChip(
  headerSays: string | null | undefined,
  now: CardChip,
): boolean {
  /* The header is silent, so this chip is the only state word on the screen. */
  if (!headerSays) return true;
  /* Different words are different claims, and both belong. */
  if (headerSays !== now.word) return true;
  /*
   * Same word, and the card has nothing else. Three of the twelve registers
   * are deliberately the chip alone; cutting it there leaves an empty row where
   * a person was told the state.
   */
  return !now.headline && !now.line;
}
