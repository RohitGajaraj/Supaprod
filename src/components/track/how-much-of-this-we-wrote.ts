/**
 * HOW MANY OF THESE SIGNALS THE LOOP WROTE ITSELF.
 *
 * ── THE MEASUREMENT, AND IT IS WHY A COUNT ALONE IS NOT HONEST ────────────
 * S4-183 established this on the evidence door and S0 shipped it there
 * (`2265d8873`). **It applies unchanged to this pane, which is already live and
 * has never said it.** Measured 2026-09-01 across the whole table:
 *
 * | | |
 * | --- | --- |
 * | `signals` | **1,499** |
 * | `source = 'agent'` — written by the loop | **940** |
 * | share of the entire evidence base | **62.7%** |
 *
 * And on real, non-sample tracks this pane renders **today**:
 *
 * | track | signals shown | the loop wrote |
 * | --- | --- | --- |
 * | `47dcbf3c` | 67 | **67 — every one** |
 * | `3a652670` | 80 | 78 |
 * | `1361f487` | 62 | 61 |
 * | `6ff86b03` | 148 | 138 |
 * | `425e6887` | 125 | 28 |
 *
 * The pane says *"67 signals"* and a person reads sixty-seven things the world
 * said. **S4's sentence is the whole argument:** *"57 things mention this, and 38
 * of them we wrote"* is a materially different sentence from *"57 things mention
 * this"*, **and only the first one lets a person judge the number.**
 *
 * ── WHY THIS IS NOT AN ACCUSATION, AND MUST NOT READ AS ONE ───────────────
 * S0's finding on the door: the inflow already flipped on 2026-08-25 (before:
 * 920 agent against 518 external; since: 20 against 41) **and nothing drained
 * the pool.** So a self-authored majority is a BACKLOG, not a failure happening
 * now — *"accurate about what it sees and wrong about the tense."* This module
 * states a proportion and draws no conclusion, for the same reason
 * `an-empty-list-is-not-a-clean-bill.ts` refuses to say a station "did not look".
 */

/** The one field this needs. `fields.source` already reaches the pane. */
export type SignalOrigin = {
  /**
   * `signals.source`. **`null` or absent means we could not tell** — 75 distinct
   * source values exist, and a missing one is not evidence of anything.
   */
  source?: string | null;
};

/** The loop's own name in `signals.source`, and the only value that counts. */
const OURS = "agent";

/**
 * How many the loop wrote, or **null when the record cannot say**.
 *
 * NULL WHEN NO SIGNAL CARRIES A SOURCE AT ALL, and that is the day's law a
 * fourth time: an absence is not a zero. Reporting "0 we wrote" for a set whose
 * origin we never read would be the most flattering possible reading of missing
 * data, on the exact number this exists to keep honest.
 */
export function weWrote(signals: readonly SignalOrigin[]): number | null {
  if (signals.length === 0) return null;
  const known = signals.filter((s) => typeof s.source === "string" && s.source.trim() !== "");
  if (known.length === 0) return null;
  return known.filter((s) => s.source === OURS).length;
}

/**
 * The line, or null when there is nothing worth adding.
 *
 * ── SILENT ON ZERO, AND THAT IS A JUDGEMENT WORTH STATING ─────────────────
 * A group the loop wrote none of needs no sentence: the count already means what
 * a reader thinks it means. Saying *"0 of these we wrote"* on every clean group
 * would be noise on the common case to flag the uncommon one — the opposite of
 * `said-once-not-four-times.ts`'s call, and right for the opposite reason: there
 * the repetition WAS the finding, here the absence of self-authorship is the
 * expected state.
 *
 * NULL ALSO WHEN WE CANNOT TELL. A pane that says "we could not tell who wrote
 * these" beside every group would be true and useless; the count itself is not
 * wrong, it is merely unqualified, and `sourceLine` already owns the case where
 * the workspace has nothing to read from.
 */
export function whoWroteLine(total: number, ours: number | null): string | null {
  if (ours === null || ours <= 0 || total <= 0) return null;
  /*
   * THE ALL CASE GETS ITS OWN SENTENCE, because it is a different fact. "67 of
   * 67" is a set with no outside evidence in it at all, and a reader skimming
   * "67 · 67" would have to do the comparison themselves. Four real tracks are
   * at or above 93% today and one is at 100%.
   */
  if (ours >= total) {
    return total === 1
      ? "We wrote this one ourselves."
      : `We wrote all ${total} of these ourselves.`;
  }
  return `${ours} of these ${total} we wrote ourselves.`;
}
