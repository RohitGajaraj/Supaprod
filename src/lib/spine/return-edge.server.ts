import type { SupabaseClient } from "@supabase/supabase-js";

import {
  missesStillOwedWork,
  returnedWorkOrigin,
  returnedWorkTitle,
  type MissedForecast,
} from "@/lib/spine/return-edge";

/**
 * THE PASS THAT MAKES A MISSED FORECAST COME BACK — gap #4.
 *
 * The rules and the words are in `return-edge.ts`, which needs no database. This
 * is the half that reads and writes, and it is deliberately thin: everything a
 * test would want to assert lives on the other side of that line.
 *
 * ── WHAT IT REFUSES TO DO, WHICH IS MOST OF THE DESIGN ────────────────────
 * It does not notify, escalate, badge, or raise anything. A missed forecast
 * becomes **a track at Discover that a person can decline**, because Stage 6's
 * whole shape is that a breach re-enters as ordinary work rather than as a
 * special object. Anything louder than that is a different feature and needs its
 * own argument.
 */
export interface ReturnEdgeResult {
  /** Misses considered this pass. */
  scanned: number;
  /** Tracks created. */
  returned: number;
  /** Misses skipped because this miss, or its decision, already came back. */
  alreadyReturned: number;
  /** Misses that could not be turned into work, with the reason. */
  skipped: string[];
}

/** How many misses one pass will turn into work. A tick is not a backfill. */
const MAX_RETURNS_PER_PASS = 5;

export async function runReturnEdgePass(db: SupabaseClient): Promise<ReturnEdgeResult> {
  const result: ReturnEdgeResult = { scanned: 0, returned: 0, alreadyReturned: 0, skipped: [] };

  /*
   * SAMPLE WORKSPACES ARE EXCLUDED, and F-90 is the reason rather than tidiness:
   * `is_sample` means "a demo fixture, and NO tick may spend on it", and
   * `track-tick.ts` skips those workspaces entirely. A track created there would
   * never be driven, so the edge would be manufacturing work that provably
   * cannot move -- which is F-155's shape, created on purpose.
   */
  const { data: missRows, error: missErr } = await db
    .from("learnings")
    .select("id, decision_id, summary, workspace_id, user_id")
    .eq("verdict", "missed")
    .eq("is_sample", false)
    .order("created_at", { ascending: true })
    .limit(50);

  /*
   * A FAILED READ IS NOT "NO MISSES" (F-76). Returning a clean zero here would
   * report the return edge as having nothing to do, which is the single most
   * misleading thing this pass can say -- it is the exact claim F-51 has been
   * making for months. So it raises and the tick records a tool_error.
   */
  if (missErr) throw new Error(`return edge could not read misses: ${missErr.message}`);

  const misses = (missRows ?? []) as Array<{
    id: string;
    decision_id: string | null;
    summary: string | null;
    workspace_id: string;
    user_id: string;
  }>;
  result.scanned = misses.length;
  if (misses.length === 0) return result;

  // What has already come back. Read once for the whole pass rather than per
  // miss: the question is about the table, not about a row.
  const { data: existingRows, error: existingErr } = await db
    .from("spine_tracks")
    .select("from_learning_id")
    .not("from_learning_id", "is", null);
  if (existingErr) {
    throw new Error(`return edge could not read what already came back: ${existingErr.message}`);
  }
  const returnedLearningIds = new Set(
    ((existingRows ?? []) as Array<{ from_learning_id?: string | null }>)
      .map((r) => r.from_learning_id)
      .filter((v): v is string => typeof v === "string"),
  );

  // The decisions those returned learnings belong to, so F-158's duplicate pair
  // cannot come back twice under two learning ids.
  const returnedDecisionIds = new Set<string>();
  if (returnedLearningIds.size > 0) {
    const { data: priorRows } = await db
      .from("learnings")
      .select("decision_id")
      .in("id", [...returnedLearningIds]);
    for (const r of (priorRows ?? []) as Array<{ decision_id?: string | null }>) {
      if (r.decision_id) returnedDecisionIds.add(r.decision_id);
    }
  }

  // The forecast each miss failed, so the returning work can carry it verbatim.
  const decisionIds = misses.map((m) => m.decision_id).filter((d): d is string => !!d);
  const forecastByDecision = new Map<
    string,
    { title: string | null; claim: string | null; how: string | null; horizon: string | null }
  >();
  if (decisionIds.length > 0) {
    const { data: decRows } = await db
      .from("decisions")
      .select("id, title, forecast_claim, forecast_how_we_will_know, forecast_horizon_date")
      .in("id", decisionIds);
    for (const d of (decRows ?? []) as Array<{
      id: string;
      title?: string | null;
      forecast_claim?: string | null;
      forecast_how_we_will_know?: string | null;
      forecast_horizon_date?: string | null;
    }>) {
      forecastByDecision.set(d.id, {
        title: d.title ?? null,
        claim: d.forecast_claim ?? null,
        how: d.forecast_how_we_will_know ?? null,
        horizon: d.forecast_horizon_date ?? null,
      });
    }
  }

  const shaped: Array<MissedForecast & { workspaceId: string; userId: string }> = misses.map(
    (m) => {
      const f = m.decision_id ? forecastByDecision.get(m.decision_id) : undefined;
      return {
        learningId: m.id,
        decisionId: m.decision_id,
        decisionTitle: f?.title ?? null,
        forecastClaim: f?.claim ?? null,
        howWeWillKnow: f?.how ?? null,
        horizonDate: f?.horizon ?? null,
        summary: m.summary,
        workspaceId: m.workspace_id,
        userId: m.user_id,
      };
    },
  );

  const owed = missesStillOwedWork(shaped, {
    learningIds: returnedLearningIds,
    decisionIds: returnedDecisionIds,
  });
  result.alreadyReturned = shaped.length - owed.length;

  for (const m of owed.slice(0, MAX_RETURNS_PER_PASS)) {
    /*
     * NO PRESS, AND THAT IS THE POINT (F-164). The insert names only what work
     * needs; `entry_station`, `path`, `waived`, `station` and `driven_at` all
     * take their column defaults, so this track enters at Discover with nothing
     * waived and nothing driven. 18 of 20 tracks ever driven were PRESSED as
     * their first drive, within seconds, by the composer -- and the acceptance
     * query excludes any track carrying one. This edge is the first path that
     * does not.
     */
    const { error: insErr } = await db.from("spine_tracks").insert({
      user_id: m.userId,
      workspace_id: m.workspaceId,
      title: returnedWorkTitle(m),
      origin: returnedWorkOrigin(m),
      from_learning_id: m.learningId,
    } as never);

    if (insErr) {
      /*
       * 23505 is the unique index doing its job: another tick got there first.
       * That is the designed outcome of a race, not a failure, so it is counted
       * as already-returned rather than reported as an error -- reporting it
       * would make a healthy concurrent pass look broken.
       */
      const code = (insErr as { code?: string }).code;
      if (code === "23505") {
        result.alreadyReturned += 1;
        continue;
      }
      result.skipped.push(`${m.learningId.slice(0, 8)}: ${insErr.message}`);
      continue;
    }
    result.returned += 1;
  }

  return result;
}
