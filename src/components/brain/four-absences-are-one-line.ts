/**
 * FOUR CONSECUTIVE SENTENCES SAYING NOTHING HAS HAPPENED.
 *
 * ── WHAT `/outcomes` DREW, READ SIGNED IN ON 2026-09-10 ───────────────────
 *
 *   What the record has changed so far
 *     118 of 137 lessons on the record have gone back into a later run.
 *       Each one is written into the agent's prompt before it acts, not
 *       looked up afterwards.
 *     None of that has been rated yet.
 *       Rate one run and every lesson it leaned on moves up or down in what
 *       the crew reads next.
 *     No outcome has moved a decision's priority yet.
 *       Record what a shipped bet actually did, and the ranking it came from
 *       moves with it.
 *     No forecast has been graded yet.
 *       When a forecast on the record passes its date, the outcome marks it
 *       true or false, and the score starts here.
 *
 *   What the record now tells your agents
 *     Nothing standing yet. ...
 *
 * One thing had happened and roughly three hundred and eighty characters
 * were spent saying that three more had not, immediately followed by a
 * fourth region whose entire content was a fifth absence.
 *
 * ── WHY IT IS NOT A BUG IN ANY ONE OF THEM ───────────────────────────────
 * Each line is correct, each is guarded so it is never drawn before the thing
 * is KNOWN to be absent, and each names the act that ends it. That last rule
 * is the good one and this file keeps it: a "not yet" that does not say what
 * turns it on reads as broken rather than as young. Four independent
 * mechanisms simply report their floor at the same time, because a workspace
 * that has settled nothing cannot have rated a run, moved a priority or
 * graded a call.
 *
 * ── SO THE FOLD KEEPS EVERY FACT AND EVERY ACT, AND SPENDS ONE LINE ──────
 * The nouns become one sentence. The acts become one sentence. Nothing is
 * hidden, nothing is softened, and the reader learns the shape once instead
 * of discovering it three times running.
 *
 * TWO OR MORE, NEVER ONE. A single admission is not a stack, and folding it
 * would replace a specific sentence with a general one, which is the trade
 * this fold exists to make in the other direction.
 *
 * The acts kept here are SHORT versions of the full subs, because three full
 * subs joined is the same length as the thing being fixed. The full sentence
 * survives wherever the mechanism has actually started, which is the only
 * place a reader needs the mechanics.
 */

/** What a line is admitting has not happened, and the act that ends it. */
export type Absence = {
  /** The past participle, in the record's own words: "rated", "graded". */
  noun: string;
  /** One short sentence. Ends with a full stop. */
  act: string;
};

/**
 * "Nothing has been rated, re-ranked or graded yet."
 *
 * `Nothing has been` rather than a count, because a count of absent
 * mechanisms is a fact about this product's architecture and the reader is
 * asking about their own record.
 */
export function absencesLead(nouns: readonly string[]): string {
  const list =
    nouns.length === 1
      ? nouns[0]!
      : `${nouns.slice(0, -1).join(", ")} or ${nouns[nouns.length - 1]!}`;
  return `Nothing has been ${list} yet.`;
}

/** The acts, in the order their mechanisms appear, as one sentence. */
export function absencesSub(acts: readonly string[]): string {
  return acts.join(" ");
}

/**
 * Fold a run of admissions into one, in place, keeping order.
 *
 * Generic over the line shape so it stays testable without React and cannot
 * reach for anything but `absent`. Returns a NEW array; the input is not
 * touched. The folded entry is built by the caller from the lead and sub
 * above, because only the caller knows what a line of its own kind looks
 * like.
 */
export function foldAbsences<T extends { key: string; absent?: Absence }>(
  lines: readonly T[],
  make: (lead: string, sub: string, folded: readonly T[]) => T,
): T[] {
  const absent = lines.filter((l) => l.absent);
  if (absent.length < 2) return [...lines];
  const kept = lines.filter((l) => !l.absent);
  return [
    ...kept,
    make(
      absencesLead(absent.map((l) => l.absent!.noun)),
      absencesSub(absent.map((l) => l.absent!.act)),
      absent,
    ),
  ];
}
