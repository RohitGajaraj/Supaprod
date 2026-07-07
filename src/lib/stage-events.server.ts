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
  | "signal";

export interface StageEventInput {
  entityType: StageEntityType;
  entityId: string;
  /** Prior stage; null/undefined means the entity was created into `to`. */
  from?: string | null;
  to: string;
  /** 'human', an agent slug, or 'system' (cron). Defaults to 'system'. */
  actor?: string;
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
