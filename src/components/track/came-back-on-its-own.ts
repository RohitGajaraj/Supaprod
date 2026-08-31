/**
 * WORK THAT CAME BACK FROM A MISSED FORECAST SAYS SO, AND ITS ORIGIN IS NOT CLAMPED.
 *
 * ── WHY THIS ONE TRACK MATTERS MORE THAN THE OTHER 106 ────────────────────
 * S0 shipped the return edge (gap #4, Tier 0.4) on 2026-08-31:
 * `src/lib/spine/return-edge.ts` plus two migrations. Its own header states
 * what it is, and it is not a nice-to-have:
 *
 *   *"Measured 2026-08-31: of 20 tracks ever driven, 18 were pressed as their
 *   first drive, the soonest 2.133 seconds after creation, because submitting
 *   the composer at `/start` creates a track and presses it in the same breath.
 *   The acceptance query excludes any track carrying a press, so every piece of
 *   work born through the product's own front door is disqualified at birth. A
 *   track created by this edge carries NO PRESS. So this is not merely Tier
 *   0.4 — it is the first path by which work can enter and complete with nobody
 *   touching it, which is what R-18 actually asks for."*
 *
 * **So the one track this edge produces is the acceptance path itself, and
 * measured 2026-08-31 nothing on any surface said a track came from it** —
 * `grep -rl 'return-edge\|returnEdge' src/components src/routes` returned zero.
 *
 * ── THE DEFECT THIS FIXES IS A CLAMP, WHICH IS THE UNGLAMOROUS HALF ───────
 * The origin DOES reach the run header already, through `originLine`. But the
 * header clamps it to two lines — a deliberate, well-argued choice for the
 * ordinary case, where an origin is a clustered brief with counts and an
 * unbounded block would compete with the status for first read.
 *
 * **For returned work that clamp truncates the moat.** `returnedWorkOrigin`
 * composes five parts — why it came back, what we expected, by when, how we
 * said we would know, and what actually happened — and carries the forecast
 * **verbatim rather than by reference**, for the same reason `verdict.md` does
 * (`SPEC-STATION-MODEL-AND-ARTIFACTS.md` §2.5): a claim rendered by lookup can
 * be read after the source row changed. Two lines shows the first sentence and
 * cuts the evidence.
 *
 * ── AND WHY IT IS A MARK AND NOT A BADGE ──────────────────────────────────
 * The returning track is **ordinary, refusable work** — that is the whole shape
 * the edge adopted, and `returnedWorkOrigin` ends by saying so in as many
 * words. A badge would make it special, and a person cannot decline a thing the
 * product has dressed as an alert. So it gets one sentence in the run's own
 * voice and the same controls as anything else.
 *
 * ── WHAT I COULD NOT DO, STATED RATHER THAN GLOSSED ───────────────────────
 * **Zero tracks carry `from_learning_id` today, so this is not browser-driven
 * in the positive case.** Measured: 26 learnings carry verdict `missed` and
 * **only 2 of them are real** (the rest sit on sample workspaces) — and S2's
 * F-158 showed those two are the SAME miss, written 26 seconds apart by two
 * agents against one decision, which `missesStillOwedWork` dedupes on
 * `decisionId`. **So the entire real record owes exactly one returning track,
 * and the edge has not yet produced it.** Told to S0 rather than filed, because
 * F-156 means a request on this branch would not reach them.
 */

/** What the run says about work that returned from a miss. Null for everything else. */
export function cameBackOnItsOwn(fromLearningId: string | null | undefined): string | null {
  if (!fromLearningId) return null;
  /*
   * Deliberately NOT a restatement of the origin, which is rendered directly
   * beneath this and already carries the forecast, the horizon and the outcome.
   * This says the one thing the origin cannot say about itself: that nobody
   * asked for it. `run-status.ts`'s own header records what three copies of one
   * fact on one screen cost, so this adds the fact and not the paragraph.
   */
  return "Nobody started this. It came back on its own because a forecast did not hold.";
}

/**
 * Whether the origin may run past the header's two-line clamp.
 *
 * True ONLY for returned work, and that narrowness is the point: the clamp is
 * right for the ordinary case and this is not asking to remove it. A returned
 * origin is the forecast travelling verbatim with the work, and truncating
 * evidence is the one thing this surface may not do to it.
 */
export function originRunsFull(fromLearningId: string | null | undefined): boolean {
  return Boolean(fromLearningId);
}
