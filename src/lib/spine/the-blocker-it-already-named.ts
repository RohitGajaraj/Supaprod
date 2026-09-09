/**
 * A RUN THAT CANNOT PROCEED USUALLY SAYS WHY, AT A STATION THAT IS NOT WHERE IT
 * STOPS, AND THE SCREEN DIAGNOSES THE PLACE IT STOPPED.
 *
 * ── THE MEASUREMENT, READ LIVE ON 2026-09-09 ────────────────────────────────
 * Track `6cc7a010` on Helio Labs. `agent_runs`, in order:
 *
 *   02:30  builder  completed_with_failures  "No repository is connected for
 *                                             this workspace..."
 *   02:30  qa       completed_with_failures  "No repository is connected..."
 *   02:40  builder  completed_with_failures  "No repository is connected..."
 *   03:00  qa       completed_with_failures  "No repository is connected..."
 *   03:10  builder  completed_with_failures  "No repository is connected..."
 *   03:10  qa       completed_with_failures  "No repository is connected..."
 *   ...then the loop sent the work BACKWARDS, to Plan and then to Design...
 *   03:40  ux-architect  halted  "AI credits exhausted..."   x12
 *
 * `spine_tracks.last_hold` is `going-in-circles` and `last_hold_because` is
 * null, so the run screen drew the generic template:
 *
 *   *"Design has been run many times over and the work has not moved on once.
 *    That is the loop rather than any single run, so nothing further will be
 *    spent on it until you look."*
 *
 * and offered, as the way out: **"Send it back a step so it starts from
 * different ground."**
 *
 * Sending it back a step is what already happened three times, and it is what
 * produced the loop. **The one act that changes the outcome -- connect a
 * repository -- was stated in plain English six times, by two different agents,
 * across forty minutes, and reached no surface.** Top up the credit and it will
 * spend the new credit re-running Design, which still cannot reach Build, which
 * still has no repository.
 *
 * ── WHY `whatItKeepsSaying` COULD NOT FIND IT, BY DESIGN ────────────────────
 * That function anchors on the NEWEST turn and walks backwards, because it
 * answers "what is it saying NOW". On this run the tail is twelve credit halts
 * at Design, so it correctly reported *"Design said this 12 times, and filed
 * nothing on any of them"* -- which is true, and is the symptom.
 *
 * The cause is six turns and two stations earlier. So this is a different
 * question with a different shape: **not the tail, the whole run**, and it is a
 * separate function rather than a flag on that one.
 *
 * ── THE TWO RANKING RULES, AND WHY NEITHER IS A JUDGEMENT ABOUT PROSE ───────
 * When more than one station keeps saying something, one of them has to be the
 * one a person is shown. Both rules read a column, never the words:
 *
 *   1. A REFUSAL OUTRANKS A HALT. `halted` is the platform stopping the work
 *      (credit, timeout) and tells you about your account.
 *      `completed_with_failures` is the agent having RUN, tried, and reported
 *      what it could not get past -- which tells you about your system, and is
 *      the only one of the two whose sentence names a thing you can go and fix.
 *
 *   2. THEN THE EARLIEST WINS. A later blocker on the same run is usually
 *      downstream of an earlier one, because the loop's response to a blocker
 *      is to send the work back and try again from further up. The first
 *      station to get stuck is the one that put the loop in motion.
 *
 * The limit of rule 2, stated because it is real: on a run with two genuinely
 * independent blockers, this shows the older one and stays silent about the
 * other. That is the right failure -- fixing the first is a prerequisite for
 * reaching the second anyway -- but it is a failure, and a person reading only
 * this sentence will not know a second one is behind it.
 *
 * ── AND IT CLASSIFIES NOTHING ───────────────────────────────────────────────
 * There is no attempt here to decide whether a blocker is "a missing
 * connection" or "a credential" or "a permission". That would be a classifier
 * over prose, which is a second thing to be wrong, and it is unnecessary: the
 * agent already wrote the sentence, in the words of somebody who had just tried
 * and failed. The job is to find it and put it where a person looks. The
 * sentence speaks for itself, which is the whole point -- it was always going
 * to be better than anything the machinery could say about it.
 */
import { claimOf, containment, MIN_CONTAINMENT } from "@/lib/spine/what-it-keeps-saying";
import { whatASeatActuallySaid } from "@/lib/spine/what-a-seat-actually-said";

/** One turn, as `getTrackActivity` already returns it. */
export type BlockedTurn = {
  runId: string;
  /**
   * The station key, which is the identity two turns are grouped on.
   *
   * Null on a turn the record cannot attribute to a station, and a null NEVER
   * groups: "this station cannot start" is a claim about a station, so a turn
   * we cannot place is not evidence for it. Dropped rather than pooled into an
   * unnamed group, which would invent a station out of the rows that have none.
   */
  station: string | null;
  /** Its display name, which is what the sentence says. */
  stationName: string;
  agentName: string;
  at: string;
  /** `activity.ts`'s OUTCOME map: `partly` is completed_with_failures. */
  outcome: "working" | "done" | "partly" | "stopped" | "waiting";
  made: readonly unknown[];
  said: string | null;
};

export type Blocker = {
  station: string;
  stationName: string;
  /** The seats that said it, in the order they first did. */
  seats: string[];
  /** How many turns said it. */
  turns: number;
  /** The sentence itself, from the FIRST turn that said it. */
  said: string;
  /** The oldest and newest turn that said it. */
  from: string;
  to: string;
  /** True when the platform stopped it rather than the agent reporting it. */
  halt: boolean;
};

/**
 * TWO, NOT THREE.
 *
 * `whatItKeepsSaying` requires three, and its docstring gives the reason: two
 * consecutive seats agreeing is the ordinary healthy shape of this product, so
 * two is not yet a refrain.
 *
 * That reasoning does not carry here, because this only ever looks at turns
 * that FILED NOTHING and reported a failure. Two seats running, both failing,
 * both filing nothing, and both saying the same thing is not a healthy shape in
 * any reading -- it is a station that cannot start. On the measured run that is
 * exactly what Build's first pass was: builder at 02:30, qa at 02:30, one
 * sentence, nothing filed.
 *
 * Raising it to three would have hidden the blocker until the loop had already
 * bounced the work backwards once, which is the moment the run became hard to
 * read.
 */
export const MIN_BLOCKED_TURNS = 2;

/**
 * The seat's words, as prose.
 *
 * Some output is a sentence and some is the loop's preamble with the model's
 * raw JSON step pasted after it. Normalised HERE, at the front, so the claim
 * matching below and the quote at the end read the same thing -- otherwise the
 * grouping scores punctuation and the card prints it. See
 * `what-a-seat-actually-said.ts` for the run this was read off.
 */
const prose = (t: BlockedTurn): string | null => whatASeatActuallySaid(t.said);

/** Failed, and filed nothing. A turn that filed is not blocked. */
function blocked(t: BlockedTurn): boolean {
  if (!t.station) return false;
  if (t.outcome !== "partly" && t.outcome !== "stopped") return false;
  if (t.made.length > 0) return false;
  return claimOf(prose(t)) !== null;
}

/**
 * The blocker this run already named, or null when it named none.
 *
 * `turns` arrives oldest-first, the order `getTrackActivity` returns.
 */
export function theBlockerItAlreadyNamed(turns: readonly BlockedTurn[]): Blocker | null {
  /* Grouped by STATION rather than by seat: Build's refusal was written by
     `builder` and by `qa`, and one station that cannot start is one fact, not
     two. Seats are kept so the sentence can say who. */
  const runs: BlockedTurn[][] = [];
  for (const t of turns) {
    if (!blocked(t)) continue;
    const open = runs[runs.length - 1];
    const claim = claimOf(prose(t));
    const openClaim = open ? claimOf(prose(open[0]!)) : null;
    if (
      open &&
      open[0]!.station === t.station &&
      openClaim &&
      claim &&
      containment(openClaim, claim) >= MIN_CONTAINMENT
    ) {
      open.push(t);
    } else {
      runs.push([t]);
    }
  }

  const candidates = runs.filter((r) => r.length >= MIN_BLOCKED_TURNS);
  if (candidates.length === 0) return null;

  /* Rule 1 then rule 2. `find` on the already-oldest-first list IS rule 2, so
     there is no comparator to get backwards. */
  const best = candidates.find((r) => r.some((t) => t.outcome === "partly")) ?? candidates[0]!;

  const seats: string[] = [];
  for (const t of best) if (!seats.includes(t.agentName)) seats.push(t.agentName);

  return {
    station: best[0]!.station!,
    stationName: best[0]!.stationName,
    seats,
    turns: best.length,
    /*
     * ── THE REPRESENTATIVE TURN IS THE LAST, AND IT WAS THE FIRST FOR A DAY ────
     * The argument for the first was: every later turn is the same seat
     * re-reporting the same wall, so the first telling is the one written before
     * any of the re-trying coloured it. That is true of a STATIC wall. It is false
     * of a wall that is changing, and S1 read the difference on the served build
     * within an hour:
     *
     *   before  09:30  "3 times, 09:10 to 09:30"  ...account credit balance (15)
     *           11:00  "9 times, 09:40 to 11:00"  ...account credit balance (1)
     *   after   11:00  "12 times, 09:10 to 11:00" ...account credit balance (15)
     *
     * **Stamped at the END of the span and quoting the START of it**, over a hold
     * card still quoting (1), so one page carried one event with two balances and
     * the card's number matched no row below it. And 15 draining to 1 is the only
     * thing those twelve turns actually recorded happening -- the run spent the
     * account while failing -- so quoting the first is the single choice that hides
     * the only news in the group.
     *
     * The last is right on three counts and loses nothing on the fourth: it matches
     * the stamp a reader is looking at, it is the current state where the text
     * varies, it agrees with every other surface quoting the same group, and where
     * the text does not vary it is the same sentence.
     *
     * Here the card carries no stamp, so only the last two counts apply -- and
     * the third is the one that matters most: this card sits above a transcript
     * whose folded row quotes the same group, and a page that quotes one event
     * two ways is worse than either way alone.
     */
    said: prose(best[best.length - 1]!)!.trim(),
    from: best[0]!.at,
    to: best[best.length - 1]!.at,
    halt: !best.some((t) => t.outcome === "partly"),
  };
}

/**
 * The one line above the sentence, naming who hit the wall and how often.
 *
 * It deliberately does NOT say what to do. The agent's own sentence, rendered
 * under this, already ends in an instruction more specific than anything this
 * function knows ("Please bind a repository on Connectors"), and a second
 * imperative over the top of it would be the machinery talking over the only
 * voice on the screen that had actually tried.
 */
export function blockerLead(b: Blocker): string {
  const who =
    b.seats.length === 1
      ? b.seats[0]
      : b.seats.length === 2
        ? `${b.seats[0]} and ${b.seats[1]}`
        : `${b.seats.length} seats`;
  return b.turns === 1
    ? `${who} could not start ${b.stationName}.`
    : `${who} could not start ${b.stationName}, ${b.turns} times.`;
}

/**
 * DOES THE REFRAIN STILL SAY SOMETHING, WITH THE BLOCKER ALREADY ON SCREEN?
 *
 * The two answer different questions -- where it first hit a wall, and what it
 * is saying now -- and on the measured run they land on different stations and
 * different facts, both of which a person needs: it cannot start Build, AND it
 * is out of credit at Design. Suppressing the second would hide a real thing.
 *
 * What is suppressed is the case where they are the SAME station. There the
 * refrain is the blocker again in fewer words, and its count is already in the
 * lead above it, so it is the second sighting with nothing added -- the
 * discriminator rule, applied to two sentences instead of two chips.
 *
 * Extracted from the JSX so the rule can be read and scored on its own. It was
 * one inline condition, which is exactly the shape of thing that gets rewritten
 * by somebody who cannot see why it was there.
 */
export function refrainStillSaysSomething(
  blocker: Blocker | null,
  standingAt: string | null | undefined,
): boolean {
  if (!blocker) return true;
  return blocker.station !== standingAt;
}
