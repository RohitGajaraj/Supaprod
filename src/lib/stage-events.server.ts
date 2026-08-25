// SEAM-1 FOUNDATIONS: the one write path for per-transition stage history.
// Every lifecycle entity (spec, mission, opportunity, theme, decision, goal,
// loop) records a stage_events row on every stage change, so timelines and
// the Trust Ledger chain read from real rows instead of created_at/updated_at.
//
// Fail-safe by contract: recording history must never break the main write,
// so this helper swallows and logs its own failures (the recordOutcome /
// inferDirectEdge convention). It also skips no-op transitions (from === to)
// so callers can pass prior status without pre-checking.

export type StageEntityType =
  | "spec"
  | "mission"
  | "opportunity"
  | "theme"
  | "decision"
  | "goal"
  | "loop"
  // SW-5 deliverable C: a sensed signal writes a trail row (migration
  // 20260708120000 widened the DB CHECK to allow 'signal').
  | "signal"
  // The spine track moving between stations, written by the autonomous driver
  // (migration 20260801150000 widened the DB CHECK the same way). It goes in
  // the same trail as every other artifact rather than a private log, because
  // "who moved this work and when" is the same question for a track as for a
  // spec, and one trail is what makes it answerable in one place.
  | "spine_track";

export interface StageEventInput {
  entityType: StageEntityType;
  entityId: string;
  /** Prior stage; null/undefined means the entity was created into `to`. */
  from?: string | null;
  to: string;
  /** 'human', an agent slug, or 'system' (cron). Defaults to 'system'. */
  actor?: string;
  /**
   * F-55. WAS ANYONE WATCHING when this transition happened?
   *
   * `actor` answers WHO DID THIS — production holds agent slugs, `human` and
   * `system` across 2,000+ rows. It does not answer whether a person was there,
   * and those are different questions: `driveTrackOnce` stamps `actor: 'system'`
   * whether the cron called it or somebody pressed the control on a watched run.
   *
   * That gap is acceptance criterion 2 in its entirety — *"no human intervention
   * mid-run"* — and it was found by a session confidently reporting a hand-driven
   * walk as unattended, having read `actor` and got a true answer to the
   * neighbouring question.
   *
   * `'sweep'` is the unattended cron. `'press'` is a person acting on a watched
   * run; `'continuation'` is the client walking on from a window-closed leg of
   * that press (queue 64 split the old `'foreground'`, which now appears only
   * in rows written before the split and means "watched, origin unrecorded").
   * **Absent means the writer does not know**, and it stays absent rather than
   * defaulting, because a default would answer for callers that never asked —
   * which is the R-22 hazard pointing the other way round: here the UNSAFE
   * reading is the one that claims autonomy.
   */
  drivenVia?: "sweep" | "press" | "continuation" | null;
  workspaceId?: string | null;
  userId?: string | null;
}

// The generated Database types lag new tables until the next regeneration,
// so the client is cast once here (the seed-workspace SeedClient precedent)
// and call sites stay clean.
interface StageEventsClient {
  from(table: string): {
    insert(values: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
  };
}

export async function recordStageEvent(client: unknown, ev: StageEventInput): Promise<void> {
  if (ev.from != null && ev.from === ev.to) return;
  try {
    const { error } = await (client as StageEventsClient).from("stage_events").insert({
      entity_type: ev.entityType,
      entity_id: ev.entityId,
      from_stage: ev.from ?? null,
      to_stage: ev.to,
      actor: ev.actor ?? "system",
      // Written only when the caller knows. `undefined` is dropped by
      // PostgREST, so a caller that cannot say leaves the column NULL rather
      // than asserting either answer.
      driven_via: ev.drivenVia ?? null,
      workspace_id: ev.workspaceId ?? null,
      user_id: ev.userId ?? null,
    });
    if (error) {
      console.error(
        `stage_events write failed (${ev.entityType} ${ev.entityId}): ${error.message}`,
      );
    }
  } catch (e) {
    console.error(
      `stage_events write threw (${ev.entityType} ${ev.entityId}): ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
