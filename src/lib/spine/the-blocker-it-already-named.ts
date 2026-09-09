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
import { inTurns } from "@/lib/spine/a-turn-is-not-a-filing";
import { whatASeatActuallySaid } from "@/lib/spine/what-a-seat-actually-said";
import { isSlug, type PlatformWall } from "@/lib/spine/the-wall-the-platform-put-up";

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
  /**
   * The PLATFORM's recorded reason for refusing to run this turn, when there
   * was one, as a slug.
   *
   * Structural, so it arrives free from `activity.ts`'s `Turn`. It is here for
   * one job: to say WHICH wall a group of halted turns is, so a wall the
   * account has since fixed can be told apart from one that still stands. See
   * `alsoBehindIt`.
   *
   * `halted_reason` holds two vocabularies and both are live -- the halt path
   * writes slugs, the stall sweeper writes whole sentences -- so this is read
   * through `isSlug` and prose is discarded rather than matched on.
   */
  haltedReason?: string | null;
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
  /**
   * How many OTHER walls this run hit that are not the one being shown.
   *
   * ── MY OWN STATED LIMIT, MET IN THE WILD BY A STRANGER ──────────────────
   * The header below says it plainly: "on a run with two genuinely independent
   * blockers, this shows the older one and stays silent about the other. That
   * is the right failure... and it is still a failure, and a person reading
   * only this sentence will not know a second one is behind it."
   *
   * S1 walked `6cc7a010` cold and that is exactly what happened to them. They
   * read "Connect a repository", believed it was the obstruction, and had no
   * idea the account had been out of credit since the 4th -- twelve
   * `ux-architect` runs, all `halted`, all `out_of_credit`, averaging 612ms.
   * A person who connects the repository walks straight into a thirteenth
   * instant halt.
   *
   * AND OUT OF CREDIT IS THE COMMONEST REAL BLOCKER THIS PRODUCT HAS. Of the
   * six tracks that have ever held a halted run, FIVE halted out of credit --
   * two of them labelled `going-in-circles` with 24 halted runs between them.
   * No top-of-screen surface has ever named it.
   *
   * Ranking rules 1 and 2 are unchanged: the oldest refusal is still what gets
   * quoted, because it is still the one that put the loop in motion. This
   * removes the AMBUSH rather than the ranking, and it is a count rather than a
   * second sentence, so the card does not become a list.
   */
  othersBehind: number;
  /**
   * The platform's slug for each OTHER wall: ONE ENTRY PER GROUP, in order,
   * `null` where the group has no slug.
   *
   * NOT DEDUPED, and that is the whole point. `othersBehind` counts groups, so
   * anything subtracted from it has to count groups too -- a run that hit the
   * same wall twice at two stations has two groups, and a deduped list would
   * subtract one of them and leave the card claiming a wall that is gone.
   * Parallel to `othersBehind` by construction: `othersBehindKinds.length ===
   * othersBehind`, which the test pins.
   *
   * A group of agent REFUSALS has no slug -- the agent ran and reported, so the
   * platform recorded nothing -- and a group whose `halted_reason` is the
   * sweeper's prose has none either. Both are `null` rather than a placeholder,
   * because a wall this cannot name is a wall whose standing it must not claim
   * to know.
   */
  othersBehindKinds: (string | null)[];
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
    /* Every other group that cleared the same bar. Not "everything else that
       went wrong": a group is two or more turns at one station making one
       claim, so this counts WALLS and not bad turns. */
    othersBehind: candidates.length - 1,
    /* The slug of every OTHER group that has one. `isSlug` is the shared test
       from `the-wall-the-platform-put-up.ts` rather than a second opinion about
       what a slug is -- `halted_reason` holds two live vocabularies and only
       one of them is matchable. */
    othersBehindKinds: candidates
      .filter((r) => r !== best)
      .map((r) => r.find((t) => isSlug(t.haltedReason))?.haltedReason ?? null),
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
 * ── "ACROSS", READ ON THE RENDERED CARD ──────────────────────────────────
 * This said "could not start Build, 6 times" until the turn/filing vocabulary
 * split, then "in 6 turns", and that was worse in a way only the served page
 * showed: "could not start Build in 6 turns" reads as a DEADLINE -- it failed
 * to get started within six turns -- which inverts the fact. It tried six
 * times and could not start at all.
 *
 * "Across" carries the repetition without the deadline sense, and without
 * claiming the six were consecutive, which the grouping does not guarantee on a
 * run whose loop bounces work between stations.
 *
 * It deliberately does NOT say what to do. The agent's own sentence, rendered
 * under this, already ends in an instruction more specific than anything this
 * function knows ("Please bind a repository on Connectors"), and a second
 * imperative over the top of it would be the machinery talking over the only
 * voice on the screen that had actually tried.
 */
/**
 * The clause that stops a reader being ambushed, or null when nothing is behind.
 *
 * A COUNT, NOT A LIST, and not a diagnosis of what the others are. Naming the
 * second wall would double the card and re-open the ranking argument rules 1
 * and 2 exist to settle; saying one is there costs a clause and removes the
 * surprise, which is the whole of what went wrong for the stranger who read it.
 *
 * ── PAST TENSE, AND THAT IS THE WHOLE OF THE CORRECTION ──────────────────
 * It read *"One more wall is behind this one"*, which is a claim about NOW, and
 * the record cannot support one. Read live on `6cc7a010`, 2026-09-10:
 *
 *   the wall shown     Build, no repository    `connection_bindings` = 0  STILL THERE
 *   the wall counted   Design, out_of_credit   `balance_credits` = 5,240  GONE
 *
 * The account was topped up on 2026-09-09, five days after the halt. So the
 * card was telling a person to expect a second obstruction that no longer
 * existed -- and the only reason its DOOR was right is that the repository
 * happened to be the wall that persisted. That was luck, not design, and it is
 * worth writing down because the ranking rules above take credit for it.
 *
 * WHAT IT WOULD TAKE TO SAY "is": the account's balance, which is two chained
 * reads from this workspace -- workspace to account, account to balance. Lane 1
 * built exactly that read for the home's row on 2026-09-10 and WITHDREW it the
 * same evening: the composite hung on it and the served entry stopped
 * answering (`3e6d17dba`). So the live claim is not merely unbuilt here, it is
 * a claim whose read has already cost a production surface once.
 *
 * The count is the same count. Only the tense changed, and the tense is the
 * half the record can actually vouch for: this run HIT another wall. Whether it
 * is still standing is a question this screen cannot answer, so it stops
 * answering it.
 */
export function alsoBehindIt(b: Blocker, wall?: PlatformWall | null): string | null {
  /*
   * A WALL THE ACCOUNT HAS SINCE FIXED IS NOT BEHIND ANYTHING.
   *
   * Only subtract on `gone`, and only from the groups whose slug MATCHES the
   * wall that went. `standing` and `unknown` both count, which is the safe
   * direction: the failure this removes is a card promising an obstruction that
   * is not there, and the failure it must not introduce is a card hiding one
   * that is.
   *
   * Matching on the slug rather than on "there is a gone wall" is the condition
   * that keeps a track holding two different walls honest -- a credit halt that
   * lifted cannot answer for a repository refusal that did not. Measured
   * 2026-09-10: all 34 slug halts in the product are `out_of_credit` across six
   * tracks, one kind each, so nothing exercises the two-kind case today. It is
   * written for it anyway, because the column is open text and the day it holds
   * a second slug is not a day anybody will re-derive this.
   */
  const lifted =
    wall?.now === "gone" ? b.othersBehindKinds.filter((k) => k === wall.kind).length : 0;
  const behind = b.othersBehind - lifted;
  if (behind < 1) return null;
  return behind === 1
    ? "It hit one more wall after this one."
    : `It hit ${behind} more walls after this one.`;
}

export function blockerLead(b: Blocker): string {
  const who =
    b.seats.length === 1
      ? b.seats[0]
      : b.seats.length === 2
        ? `${b.seats[0]} and ${b.seats[1]}`
        : `${b.seats.length} seats`;
  return b.turns === 1
    ? `${who} could not start ${b.stationName}.`
    : `${who} could not start ${b.stationName}, across ${inTurns(b.turns)}.`;
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
