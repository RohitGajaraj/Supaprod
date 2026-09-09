/**
 * ── THE ENTRY'S ONE SENTENCE ABOUT ITSELF ─────────────────────────────────
 *
 * The founder's complaint about this page, in his words: *"a user lands on
 * home and it is not appealing, carries no message, shows no journey."*
 *
 * **Carries no message** was literally true. Every region on the entry
 * answered a question about the person's own work -- what is waiting, what
 * came back, what is running, what they have -- and nothing said what the
 * machine DOES. A returning operator does not need telling. Everybody else
 * arrives at a work queue with no frame around it, including the founder, who
 * is the one person who has to be able to feel what he has built.
 *
 * ── IT IS A MECHANISM, NOT A PITCH ────────────────────────────────────────
 * The rule this repo already holds for outward copy applies harder in-product:
 * lead with a verifiable mechanism, never with a category word or a volume
 * claim. So the sentence names the seven stations, the one thing a person
 * puts in, and the thing that comes back out -- all three of which are drawn
 * on the same screen, directly underneath it, in the road.
 *
 * **It says nothing the page cannot show.** That is the test it had to pass:
 * every clause points at something visible.
 *
 * ── AND IT RETIRES ITSELF ─────────────────────────────────────────────────
 * A line that explains the product to somebody who has watched it work is
 * furniture, and by the third visit it is worse than furniture -- it is the
 * product still introducing itself to a person who has shipped with it.
 *
 * So it draws only until a loop has CLOSED. The moment this workspace holds a
 * graded outcome, `WhetherItWorked` says the same thing far better, with that
 * workspace's own evidence in it, and this stands down for good.
 *
 * That is the founder's fourth territory -- anticipate, do not interrogate --
 * applied to the product's own voice: say it while it helps, then stop.
 */

/** What the entry says about itself, or null once it has been shown to work. */
export function whatThisDoesForYou(input: {
  /** A graded outcome exists in this workspace. */
  hasClosedLoop: boolean;
  /** The read that would know has not answered yet. */
  unknown?: boolean;
}): string | null {
  /*
   * AN UNANSWERED READ IS NOT "NO CLOSED LOOP". Drawing the introduction to
   * somebody who HAS shipped, for the second it takes a query to land, is the
   * flash this page has been repaired for twice. Silence costs nothing.
   */
  if (input.unknown) return null;
  if (input.hasClosedLoop) return null;
  return "Say what should change. Seven stations take it from evidence to shipped, and grade whether it worked.";
}
