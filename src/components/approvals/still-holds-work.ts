/**
 * WHETHER ANSWERING THIS CALL STILL RELEASES ANYTHING.
 *
 * ── WHAT A PERSON SEES, AND WHAT IS TRUE ──────────────────────────────────
 * /approvals says "52 decisions are ready for you", lists them oldest first,
 * and puts this under the one in front:
 *
 *     Approve · unblocks Build for this spec
 *
 * Measured across the 29 rows in `agent_approvals` with status pending: every
 * one is at least 33 days old, and none is past an expiry that would clear it.
 *
 * TWO DIFFERENT COUNTS, AND THE SECOND IS THE ONE THIS FUNCTION SEES. Joined
 * through `run_id`, 22 of the 29 gate a run that has finished. Joined the way
 * `gatesLiveWork` actually resolves -- `mission_id` to that mission's newest
 * run -- the answer today is 0 finished, 14 live and 15 with no mission at all.
 * I reported the first number before checking which link the field uses, which
 * is a measurement of a different thing wearing the same words.
 *
 * So this branch renders nowhere right now, and it is not dead: a gate whose
 * mission is live becomes finished the moment that run completes unanswered,
 * which is the ordinary end of all 14 of them.
 *
 * A promise the data does not support, on the surface whose entire job is
 * telling a person what needs them. That is the founder's own line: never a
 * moment where the screen implies work that is not real.
 *
 * ── THE THREE STATES ARE S0'S AND THE NULL IS THE IMPORTANT ONE ───────────
 * `gatesLiveWork` is `true` when the run is still going, `false` when we looked
 * and it has finished, and `null` when we cannot say -- no mission on the gate,
 * no run for that mission, or the lookup failed.
 *
 * Null must NOT read as "the work has finished". The seven `memory.promote`
 * rows are exactly that case, and saying their work ended would invent a
 * history for something that never started. Null says nothing at all, which is
 * what we know.
 *
 * `halted` and `waiting_approval` count as LIVE, which is the one that is easy
 * to get backwards: a run halted at a gate is precisely the run the approval
 * exists to release.
 */

/**
 * The line to add under a call, or null when there is nothing honest to add.
 *
 * It never contradicts the consequence beside it; it replaces the reason to
 * believe it. A caller renders this INSTEAD of the approve consequence when it
 * is non-null, because "approving unblocks Build" and "the work this held has
 * finished" cannot both be on the screen.
 */
export function stillHoldsWork(gatesLiveWork: boolean | null | undefined): string | null {
  // Live, or unknowable. Either way there is nothing extra to say: the call's
  // own consequence is the best available account.
  if (gatesLiveWork !== false) return null;

  /*
   * Two facts and no instruction. The first is what changed while they were
   * away, the second is what answering now would and would not do. No verb is
   * offered because the controls beside it already are, and because what to do
   * with a stranded call -- clear it, leave it, answer it for the record -- is
   * a judgement this sentence has no business making for them.
   */
  return "The work this was holding has already finished, so answering it now releases nothing.";
}
