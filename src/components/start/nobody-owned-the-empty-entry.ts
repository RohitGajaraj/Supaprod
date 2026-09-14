/**
 * ── THE STATE EVERY REGION REFUSED AND NOBODY OWNED ────────────────────────
 *
 * Founder, 2026-09-14, about the served product: users *"cannot tell what
 * SupaProd is, where to start, why one screen leads to another, what to do
 * next, or what value an agent produced"*, and the app *"feels like
 * disconnected stations and a dump of data"*.
 *
 * The first half of that was reproducible in one screenshot. Signed in as the
 * Harbor account on the workspace the scope menu opens by default, the ENTIRE
 * home screen was:
 *
 *   "Reading your workspace."   (a loading line)
 *   [ an empty text box ]       ("Enter to start · Shift+Enter for a new line")
 *
 * Nothing else. No statement of what the product does, no example of what a
 * useful sentence looks like, nothing to press.
 *
 * ── AND EVERY REGION WAS INDIVIDUALLY RIGHT TO SAY NOTHING ────────────────
 * This is the part worth inheriting, because the bug is not in any of them:
 *
 *   · `Arriving` returns null with no connected source, because "0 findings
 *     this week" over a product nobody has been asked about "is a reproach
 *     rather than a fact". Correct.
 *   · `ExampleJobs` draws only this workspace's own ranked bets, because "the
 *     director cannot direct with no evidence". Correct.
 *   · `TheCallInFront` draws nothing when nothing is waiting. Correct.
 *   · `StarterRuns` needs a product row to read a one-liner off. Correct.
 *   · `whatThisDoesForYou` was written for exactly this gap and then removed
 *     from the route by a later guard, on the grounds that a sentence about
 *     the PRODUCT sits "at the top of the screen a person opens to find out
 *     about THEIR product". Correct -- for somebody who has work on screen.
 *
 * Each refusal is well argued. **Their sum is a blank page**, and no region was
 * responsible for the sum. That is the defect: the entry had no owner for the
 * state where every one of its parts correctly has nothing to say.
 *
 * ── WHAT THIS FUNCTION IS FOR ─────────────────────────────────────────────
 * It answers one question -- *has every region that could speak answered, and
 * has none of them anything to say* -- so exactly one region can own that
 * state and the others keep their refusals unchanged.
 *
 * ── AN UNREAD READ IS NOT AN ABSENCE, AND THAT IS THE WHOLE CARE HERE ─────
 * This repo has paid for the opposite reading repeatedly: a null falling to 0
 * and becoming an all-clear, a failed read wearing an empty state's clothes.
 * So emptiness is asserted ONLY from reads that have answered. While anything
 * is still unread, or refused, this is false and the ordinary regions keep the
 * screen -- including the loading line, which is honest about a read in flight
 * even though it is poor company on its own.
 *
 * The cost of being wrong is asymmetric and points the same way: introducing
 * the product to somebody who has shipped with it is furniture, while leaving a
 * newcomer on a blank box is the founder's actual complaint.
 */

/** Whether the entry's own regions have all answered and all come up empty. */
export function entryHasNothingToSay(input: {
  /**
   * `theCallInFront`'s verdict, or null while the reads behind it are unread.
   * Anything other than "nothing" means a piece of work is on screen.
   */
  lead: "call" | "run" | "nothing" | null;
  /** Open and recent runs, or null when unread or refused. */
  runs: readonly unknown[] | null;
  /** This workspace's ranked bets, or null when unread or refused. */
  bets: readonly unknown[] | null;
  /** The approvals queue's size, or null when unread or refused. */
  waiting: number | null;
  /** Evidence has arrived, so `Arriving` is drawing a line of its own. */
  hasEvidence: boolean | null;
}): boolean {
  // Every one of these must have ANSWERED. A single null means the screen is
  // still resolving and the regions below own it.
  if (input.lead === null) return false;
  if (input.runs === null) return false;
  if (input.bets === null) return false;
  if (input.waiting === null) return false;
  if (input.hasEvidence === null) return false;

  return (
    input.lead === "nothing" &&
    input.runs.length === 0 &&
    input.bets.length === 0 &&
    input.waiting === 0 &&
    input.hasEvidence === false
  );
}

/**
 * What the product does, in one sentence.
 *
 * ── EVERY CLAUSE IS DRAWN ON THE RUN SCREEN, WHICH IS THE TEST IT PASSES ──
 * Read off a finished run on the served product (`/track/d1168015…`), the road
 * carried: 2 findings from Discover, a recorded call and its forecast, a spec,
 * a prototype, "PR #1" from Build, a release, and a verdict of `missed` against
 * the spec's own threshold. So each clause below names something a person can
 * click through to and see. Nothing here is a capability claim the product
 * cannot show.
 *
 * ── IT DOES NOT SAY "STATION", AND THAT IS AN INSTRUCTION, NOT A PREFERENCE ─
 * Founder: treat station names and orchestration concepts as internal unless
 * showing them helps the user. The sentence this replaces opened *"Seven
 * stations take one sentence from evidence to shipped"*, which asks a stranger
 * to learn this product's own machine vocabulary in the first thing they read.
 * The work is described by what it produces instead.
 *
 * ── AND IT IS NOT A PITCH ─────────────────────────────────────────────────
 * No category word, no volume claim, no adjective about quality. It is a
 * mechanism, stated flatly, because the person is about to watch it run and any
 * gap between the sentence and the run is the trust this product lives on.
 */
export const WHAT_IT_DOES =
  "Say what you want in one sentence. A crew of agents takes it from evidence " +
  "to a decision, a spec, a design, working code and a release, then grades " +
  "whether it did what you expected. It stops for you only where the call is " +
  "yours.";

/**
 * Three sentences that show the SHAPE of a useful one.
 *
 * ── WHY INVENTED EXAMPLES ARE RIGHT HERE AND WERE WRONG WHERE THEY WERE ───
 * Three invented example sentences used to stand on this entry unconditionally
 * and were removed with a good reason: *"an example about a checkout the person
 * does not have taught nothing"*, next to `ExampleJobs`, which draws the
 * workspace's OWN ranked bets. Where real work exists, invented work is noise
 * and worse than noise, because a reader cannot tell which is which.
 *
 * That argument does not reach this state. Here there is no real work to be
 * confused with -- `entryHasNothingToSay` has established that every region
 * came up empty -- and the alternative on the screen is not the workspace's own
 * bets, it is an empty box. An example's job is not to be the person's work. It
 * is to teach what a sentence this product can act on looks like, which is the
 * one thing a first-time visitor cannot know and cannot guess.
 *
 * ── THEY FILL THE BOX. THEY NEVER START A RUN ─────────────────────────────
 * The same consent rule `StarterRuns` and `ExampleJobs` hold for a suggestion:
 * a press puts the sentence in the composer and focuses it, and the person's
 * own Enter is what spends money. Nothing invented ever becomes a row without
 * somebody choosing it.
 *
 * ── ONE PER SHAPE, DELIBERATELY ───────────────────────────────────────────
 * The composer's route picker offers five shapes and defaults to the one that
 * walks the whole road. These three cover the three a person actually arrives
 * with -- something is broken, something should be better, something is unknown
 * -- and each carries the shape it should enter on, so pressing one does not
 * silently send a bug report through discovery.
 */
export const EXAMPLE_SENTENCES: ReadonlyArray<{
  sentence: string;
  /** What kind of work this is, so it enters the road at the right place. */
  shape: "new-capability" | "interface-change" | "incident-fix";
  /** Why a person would say this, in their own terms. */
  why: string;
}> = [
  {
    sentence: "Cut the sign-up form from nine fields to four",
    shape: "interface-change",
    why: "A change to something people see. Names the outcome, not the ticket.",
  },
  {
    sentence: "Find out why people stop using us after the first week",
    shape: "new-capability",
    why: "A question rather than an instruction. The crew gathers the evidence first.",
  },
  {
    sentence: "Password reset emails are going to spam",
    shape: "incident-fix",
    why: "Something is broken now, so it goes straight to the fix.",
  },
];
