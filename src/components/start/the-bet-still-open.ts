/**
 * ── WHAT THE ENTRY SAYS BEFORE ANYTHING HAS COME BACK ─────────────────────
 *
 * `WhetherItWorked` answers the founder's *"I cannot feel the value"* with the
 * newest closed loop, and that was the right answer to the right complaint. It
 * has one problem, measured on the live database 2026-09-09:
 *
 *   Every workspace holding a graded outcome is a seed or a sample.
 *   The founder's two own workspaces hold 16 runs between them and ZERO.
 *   Of those 16, two reached Learn and are waiting on a forecast date;
 *   the other fourteen stopped at a hold.
 *
 * Lane 2's funnel over all 121 tracks the product has ever made says the same
 * thing from the other side: one has ever shipped, two have ever reached a
 * learning, and 82 are standing at station one. **The region built to answer
 * the complaint cannot draw for the person who made it**, and will not until
 * a loop closes on his own work.
 *
 * ── SO THE ENTRY HAD NOTHING TO SAY ABOUT VALUE AT ALL ────────────────────
 * On both his workspaces the home is a debt count, a composer, a road and a
 * list. Every one of those is about what is owed or what exists. None of them
 * is about whether any of it is worth anything, which is the thing he said was
 * missing.
 *
 * ── AND THIS IS NOT A CONSOLATION PRIZE ───────────────────────────────────
 * A forecast is the strongest claim this product makes about itself. It is a
 * falsifiable statement, written by the machine, on his own work, BEFORE the
 * answer was known, with the date he finds out -- and the record locks all
 * three the moment they are set. "To know if you were right" is the
 * positioning; this is that positioning in the state before knowing, which is
 * the state almost every real workspace is actually in.
 *
 * Measured, it draws where it is needed: 10 open bets on "My workspace" with
 * the soonest due in three days, 6 on "A1 delete probe" with the soonest in
 * two.
 *
 * ── THE CLOSED LOOP STILL WINS WHEN THERE IS ONE ──────────────────────────
 * A result outranks a promise, always. This is what the region says when there
 * is no result yet, never a second region competing with one.
 */
import type { OpenBet } from "@/lib/start/home-answers.functions";
import { daysBetweenInZone, monthDayInZone } from "@/lib/time-of-day";

/** What the entry draws, or null when it must draw nothing. */
export type BetStillOpen = {
  /** What was decided, which is the subject the bet is about. */
  subject: string | null;
  /** The machine's claim, verbatim from the record. */
  claim: string;
  /** How it will be known, verbatim, or null when the record has none. */
  howWeWillKnow: string | null;
  /** "Due Thu, Sep 11", already worded. */
  due: string;
  /** How long from now, as a plain phrase, or null when it cannot be told. */
  inWords: string | null;
  isSample: boolean;
  /**
   * EARLIER BETS THAT CAME DUE AND WERE NEVER GRADED. Zero draws nothing.
   *
   * Measured 2026-09-10: two of the three real workspaces were showing this
   * region's promise while ten and five earlier bets had quietly lapsed. A
   * promise shown alone, in that state, tells a reader the grading works.
   * See `home-answers.functions.ts` for the counts and the query.
   */
  lapsed: number;
};

/**
 * The lapsed line, or null. Said as a fact and never as a cause: "nothing has
 * graded them" is true and stays true, whereas naming WHY (grading is a manual
 * action today, with no agent behind it) is a sentence that becomes false the
 * moment that is automated -- the exact defect of a qualifier outliving the
 * read it was written for.
 */
export function lapsedLine(lapsed: number): string | null {
  if (lapsed <= 0) return null;
  return lapsed === 1
    ? "One earlier bet came due and nothing has graded it."
    : `${lapsed} earlier bets came due and nothing has graded them.`;
}

/**
 * The date as the entry says it, and how far off it is.
 *
 * TWO FACTS AND NOT ONE, deliberately. The date alone makes a reader do
 * arithmetic against today before they can feel anything, and "in 3 days"
 * alone is unpinnable and cannot be put in a calendar. `stopped-for.ts` made
 * the same call for the queue and its reasoning holds here: the phrase is what
 * changes what you do, the date is what you act on.
 */
export function dueIn(
  horizonIso: string,
  nowIso: string,
  zone: string,
): { due: string; inWords: string | null } {
  if (Number.isNaN(Date.parse(horizonIso))) return { due: "", inWords: null };
  /*
   * READ IN THE PERSON'S ZONE, and a repo guard caught the first version of
   * this doing otherwise. A horizon is stored at midnight UTC and this box is
   * five and a half hours behind that, so `toLocaleDateString` with no zone
   * can print the day before the one the record commits to. `monthDayInZone`
   * exists for exactly this and says so: "a horizon is a date, not a moment".
   */
  const due = monthDayInZone(horizonIso, zone);
  const days = daysBetweenInZone(nowIso, horizonIso, zone);
  if (days < 0) return { due, inWords: null };
  if (days === 0) return { due, inWords: "today" };
  if (days === 1) return { due, inWords: "tomorrow" };
  /*
   * Weeks past a fortnight, because "in 43 days" is a number a reader converts
   * and "in about 6 weeks" is one they feel. Not months: a forecast horizon is
   * a commitment and rounding it to a month loses the week it was set for.
   */
  if (days <= 14) return { due, inWords: `in ${days} days` };
  return { due, inWords: `in about ${Math.round(days / 7)} weeks` };
}

/**
 * The entry's pending evidence, or null when there is none to give.
 *
 * NOTHING IS COMPOSED FROM A TEMPLATE. `claim` and `howWeWillKnow` are the
 * record's own words, on the same rule `ClosedLoop.summary` holds to: a second
 * surface rewriting one promise is how two screens come to disagree about what
 * was promised.
 */
export function theBetStillOpen(input: {
  openBet: OpenBet | null;
  /** The closed loop, when there is one. A result outranks a promise. */
  closed: unknown | null;
  /** Now, as an instant, so the distance is computed rather than assumed. */
  nowIso: string;
  /** The person's own zone (P-130), never the browser's by default. */
  zone: string;
}): BetStillOpen | null {
  if (input.closed) return null;
  const b = input.openBet;
  if (!b) return null;
  const claim = b.claim.trim();
  if (!claim) return null;
  const { due, inWords } = dueIn(b.horizon, input.nowIso, input.zone);
  /* A bet whose date cannot be read cannot say when you will know, and "you
     will find out" with no date is the reassurance this file exists to avoid. */
  if (!due) return null;
  return {
    subject: b.decisionTitle?.trim() || null,
    claim,
    howWeWillKnow: b.howWeWillKnow?.trim() || null,
    due,
    inWords,
    isSample: b.isSample,
    lapsed: Math.max(0, b.lapsed ?? 0),
  };
}
