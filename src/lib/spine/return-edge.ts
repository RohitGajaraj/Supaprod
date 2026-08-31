/**
 * A MISSED FORECAST COMES BACK AS ORDINARY WORK — gap #4, the return edge.
 *
 * ── WHAT THIS IS, AND WHY IT IS NOT A SPECIAL OBJECT ──────────────────────
 * `Learn -> Discover` is the edge that closes the loop, and it has processed
 * **zero workspaces in its life** (F-51). Anthropic's Stage 6 turns a breach
 * into a **normal, refusable piece of work re-entering at Stage 1**, and that
 * shape is the whole adoption: a missed forecast does not become an alert, a
 * banner, or a queue item. It becomes a track, at Discover, that a person can
 * decline like any other.
 *
 * ── AND IT IS THE ACCEPTANCE PATH, WHICH WAS NOT VISIBLE UNTIL F-164 ──────
 * Measured 2026-08-31: of 20 tracks ever driven, **18 were pressed as their
 * first drive**, the soonest 2.133 seconds after creation, because submitting
 * the composer at `/start` creates a track and presses it in the same breath.
 * The acceptance query excludes any track carrying a press, so **every piece of
 * work born through the product's own front door is disqualified at birth.**
 *
 * A track created by this edge carries **no press**. So this is not merely
 * Tier 0.4 — it is the first path by which work can enter and complete with
 * nobody touching it, which is what R-18 actually asks for.
 *
 * ── THE PURE HALF LIVES HERE ──────────────────────────────────────────────
 * Composing what the returning work SAYS needs no database, so it is testable
 * without one. The pass that writes it is in `return-edge.server.ts`.
 */

/** The missed forecast, as much of it as the edge needs to speak. */
export interface MissedForecast {
  learningId: string;
  /** The decision whose forecast this graded. Null when the row cannot say. */
  decisionId: string | null;
  /** What was predicted, in the decision's own words. */
  forecastClaim: string | null;
  /** How the outcome was to be read. */
  howWeWillKnow: string | null;
  /** The horizon the forecast named. */
  horizonDate: string | null;
  /** What the grader actually found. */
  summary: string | null;
  /** The decision's title, which is what a person recognises it by. */
  decisionTitle: string | null;
}

/**
 * The title of the work that comes back.
 *
 * **It states the gap, not the failure.** "Forecast missed" is a status; a
 * person cannot act on it and would not have written it. What returns is the
 * question the miss opens — and because the track is refusable, the title has
 * to be something a person can say no to on sight.
 *
 * Falls back through decision title, then the claim, then a plainly honest last
 * resort — never a placeholder that reads like a real title.
 */
export function returnedWorkTitle(m: MissedForecast): string {
  const subject = (m.decisionTitle ?? "").trim() || (m.forecastClaim ?? "").trim();
  if (!subject) {
    return "A forecast was missed and the record cannot say which decision it belonged to";
  }
  const trimmed = subject.length > 120 ? `${subject.slice(0, 117)}...` : subject;
  return `What we expected did not happen: ${trimmed}`;
}

/**
 * Why this work exists, in the person's words, carrying the forecast it failed.
 *
 * **The forecast travels with it verbatim rather than by reference.** A verdict
 * that renders its prediction by lookup can be read after the source row
 * changed — the same reason `verdict.md` copies its forecast rather than
 * linking it (`SPEC-STATION-MODEL-AND-ARTIFACTS.md` §2.5). Work that came back
 * from a miss must carry what the miss WAS, or the next station is deciding
 * against a claim it cannot see.
 */
export function returnedWorkOrigin(m: MissedForecast): string {
  const parts: string[] = [
    "This came back on its own because a forecast we recorded did not hold.",
  ];
  if (m.forecastClaim?.trim()) parts.push(`What we expected: ${m.forecastClaim.trim()}`);
  if (m.horizonDate) parts.push(`By: ${m.horizonDate}`);
  if (m.howWeWillKnow?.trim()) parts.push(`How we said we would know: ${m.howWeWillKnow.trim()}`);
  if (m.summary?.trim()) parts.push(`What actually happened: ${m.summary.trim()}`);
  parts.push(
    "Nothing here is decided. This is ordinary work and it can be declined like any other, which is the point: a missed forecast is a question rather than an instruction.",
  );
  return parts.join(" ");
}

/**
 * Which misses still owe a piece of work.
 *
 * **Two dedupes, and the second is not obvious.** A learning that already
 * produced a track is skipped — that one is also enforced by a unique index, so
 * a racing tick cannot double-write. But a DECISION that already produced one is
 * skipped too, and F-158 is why: the only two real learnings this product has
 * ever recorded are **the same learning, written by two different agents 26
 * seconds apart** against one decision. Deduping on the learning alone would
 * turn that one miss into two identical pieces of work — the duplicate-output
 * defect propagating one layer further, into the backlog a person reads.
 */
export function missesStillOwedWork<T extends MissedForecast>(
  misses: readonly T[],
  alreadyReturned: { learningIds: ReadonlySet<string>; decisionIds: ReadonlySet<string> },
): T[] {
  const claimedDecisions = new Set(alreadyReturned.decisionIds);
  const out: T[] = [];
  for (const m of misses) {
    if (alreadyReturned.learningIds.has(m.learningId)) continue;
    if (m.decisionId && claimedDecisions.has(m.decisionId)) continue;
    out.push(m);
    // Claim it within this pass too, so two learnings for one decision arriving
    // in the SAME batch do not both get through. The database index cannot catch
    // this one: they carry different `from_learning_id` values.
    if (m.decisionId) claimedDecisions.add(m.decisionId);
  }
  return out;
}
