/**
 * The correction loop's hands: read the trail, move the work, write the lesson.
 *
 * The rules are pure and live in ./correction.ts. This file is the half that
 * touches the database, split the same way route.ts / track.functions.ts and
 * driver.ts / driver.server.ts already are, so every branch of the decision is
 * unit-tested without a Supabase client anywhere near it.
 *
 * NO NEW TABLE AND NO NEW COLUMN, deliberately, and it is not a shortcut. The
 * two things a correction loop has to remember are how many corrections a track
 * has spent and what it was corrected FOR, and both are already recorded:
 * `stage_events` holds every transition this product makes, and a correction is
 * a transition BACKWARDS through the spine, which no other mover in the product
 * writes. So the counter is a query over rows that already exist rather than a
 * column that can drift out of step with the trail beside it. The practical
 * consequence matters more than the tidiness: the loop works on the database as
 * it stands today, with nothing to apply first.
 *
 * WHAT IT WRITES, and this is the difference between a correction and a retry.
 * Every correction writes twice. Once to `stage_events`, which is the trail a
 * person audits and the counter this module reads back. Once to `agent_memory`
 * through the same shape `rememberOutcome` uses, which is what puts the lesson
 * into the prompt of every future agent that touches similar work. A loop that
 * goes back and comes forward without writing either is a retry with a longer
 * route.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { embedOne } from "@/lib/rag/embed.server";
import type { DrivenVia } from "@/lib/spine/driver";
import { recordStageEvent } from "@/lib/stage-events.server";
import {
  CORRECTION_MEMORY_IMPORTANCE,
  CORRECTION_MEMORY_KIND,
  correctionFixMemory,
  correctionMemory,
} from "@/lib/spine/correction";

const ORDER = new Map<string, number>(AGENT_STATION_ORDER.map((s, i) => [s, i]));

function isStation(s: string | null | undefined): s is AgentStation {
  return typeof s === "string" && ORDER.has(s);
}

/** One backward transition: the station that could not finish, and where it went. */
export type PastCorrection = { from: AgentStation; to: AgentStation; at: string };

export type CorrectionHistory = {
  /** How many times this track has been sent back. The correction budget. */
  count: number;
  /** The most recent one, which is the only one a brief needs to mention. */
  last: PastCorrection | null;
};

const NO_HISTORY: CorrectionHistory = { count: 0, last: null };

/**
 * How many times this track has been sent back, and what for.
 *
 * READS THE TRAIL RATHER THAN A COUNTER, for one reason that is not aesthetic: a
 * counter column and the trail beside it can disagree, and when they do the
 * counter is what bounds the spending while the trail is what a person reads.
 * One source cannot lie to the other.
 *
 * A BACKWARD MOVE IS THE DEFINITION OF A CORRECTION, and nothing else in the
 * product writes one. `nextStation` only ever returns a station later on the
 * path, `advanceTrack` uses it, and the driver uses it, so every other
 * `spine_track` row in this table runs forwards. The read is therefore exact
 * rather than heuristic.
 *
 * Fails to zero, which is the direction that matters. An unreadable trail must
 * not read as "corrections exhausted" and freeze work that is fine; it reads as
 * "none spent", and the track spend cap in track-caps.server.ts is the backstop
 * that keeps a trail we cannot read from costing more than five dollars.
 */
export async function readCorrections(
  supabase: SupabaseClient,
  trackId: string,
): Promise<CorrectionHistory> {
  try {
    const { data, error } = await supabase
      .from("stage_events")
      .select("from_stage,to_stage,at")
      .eq("entity_type", "spine_track")
      .eq("entity_id", trackId)
      .order("at", { ascending: false })
      .limit(50);
    if (error || !data) return NO_HISTORY;

    const rows = data as unknown as Array<{
      from_stage: string | null;
      to_stage: string | null;
      at: string;
    }>;

    let count = 0;
    let last: PastCorrection | null = null;
    for (const r of rows) {
      if (!isStation(r.from_stage) || !isStation(r.to_stage)) continue;
      if ((ORDER.get(r.from_stage) ?? 0) <= (ORDER.get(r.to_stage) ?? 0)) continue;
      count += 1;
      // Rows arrive newest first, so the first backward one is the latest.
      if (!last) last = { from: r.from_stage, to: r.to_stage, at: r.at };
    }
    return { count, last };
  } catch (e) {
    console.error(
      `spine correction history failed for track ${trackId}: ${e instanceof Error ? e.message : String(e)}`,
    );
    return NO_HISTORY;
  }
}

/**
 * Send the work back to the station that can fix it.
 *
 * THE SAME FOUR WRITES A FORWARD MOVE MAKES, and that symmetry is the point. The
 * driver's forward move sets the station, resets `attempts`, clears `last_hold`
 * and records a stage event; `advanceTrack` had to be repaired once for doing
 * only the first of those, and the repair note in track.functions.ts spells out
 * what each omission cost. A backward move is a move, so it does all four, plus
 * the lesson.
 *
 * `attempts` RESETS, and it has to. The station being returned to is going to
 * work, and it is being asked to do something specific and different from what
 * it did the first time. Carrying the failing station's counter into it would
 * hold it at the ceiling before it ran once, which is exactly the defect
 * `advanceTrack` shipped with.
 *
 * Returns false when the move did not come back confirmed, so the caller reports
 * the hold it already had rather than announcing a correction that may not have
 * landed.
 */
export async function applyCorrection(
  supabase: SupabaseClient,
  track: {
    id: string;
    title: string;
    user_id: string;
    workspace_id: string | null;
  },
  move: {
    from: AgentStation;
    to: AgentStation;
    missing: string;
    kind: "absent" | "not-enough";
  },
  /**
   * F-55 / queue 63, COMPLETED HERE — this path was missed and the miss was mine.
   *
   * Queue 63 stamped `driveTrackOnce`'s forward arrival and stopped there. A
   * correction is a transition like any other: it writes a real `stage_events`
   * row, it moves the work, and **it is exactly the kind of move criterion 2
   * cares about** — a station that could not finish sending work backwards.
   * Leaving it unstamped meant every corrected track wrote `driven_via NULL`,
   * and NULL by queue 63's own rule can never be counted as unattended. **So a
   * track that took one correction was permanently unprovable**, which is worse
   * than not having the column: it looks like evidence and is not.
   *
   * Caught on 2026-08-25 at 12:10 by Round 7 taking a `build -> define`
   * correction and writing a NULL row, four hours after I shipped the column.
   *
   * REQUIRED, not defaulted, for the reason queue 63 gave and this omission
   * proves: a default answers for a caller that never considered the question.
   */
  via: DrivenVia,
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const { data: moved, error } = await supabase
      .from("spine_tracks" as never)
      .update({
        station: move.to,
        attempts: 0,
        last_hold: null,
        driven_at: now,
        updated_at: now,
      } as never)
      .eq("id", track.id)
      /*
       * F-60. The same compare-and-swap the driver's forward move now carries,
       * and this is the site where the race is EXPENSIVE rather than merely
       * untidy.
       *
       * This module's own comment two lines below says a row must never "claim
       * a transition the table did not take". That was true of ordering and
       * false of concurrency: two drivers reading the same `station` both wrote
       * their move, and `readCorrections` counts BACKWARD transitions.
       * `MAX_TRACK_CORRECTIONS` is 2, so **a single duplicated correction spends
       * the whole budget in one move**, `decideDrive` answers
       * `corrections-spent`, and the track stops and asks for a person — from a
       * double-counted row rather than from anything that happened.
       *
       * `.eq("station", move.from)` means only the driver that found the track
       * where it thought it was may move it. The loser matches nothing, returns
       * false, and writes no trail row.
       */
      .eq("station", move.from)
      .select("id");
    if (error) {
      console.error(`spine correction move failed for track ${track.id}: ${error.message}`);
      return false;
    }
    // Lost the race: another driver already moved this track. Not an error and
    // not a correction — nothing happened, so nothing is recorded.
    if (!moved?.length) return false;
  } catch (e) {
    console.error(
      `spine correction move threw for track ${track.id}: ${e instanceof Error ? e.message : String(e)}`,
    );
    return false;
  }

  // The trail, which is also the counter this module reads back. Written after
  // the move so a row can never claim a transition the table did not take.
  await recordStageEvent(supabase, {
    entityType: "spine_track",
    entityId: track.id,
    from: move.from,
    to: move.to,
    actor: "system",
    drivenVia: via,
    workspaceId: track.workspace_id,
    userId: track.user_id,
  });

  await rememberCorrection(supabase, {
    userId: track.user_id,
    workspaceId: track.workspace_id,
    trackId: track.id,
    title: track.title,
    from: move.from,
    to: move.to,
    missing: move.missing,
    kind: move.kind,
  });

  return true;
}

/**
 * Write the lesson where the next piece of work will actually meet it.
 *
 * SCOPE 'global' AND NO AGENT SLUG, the same shape `rememberOutcome` uses and
 * for the same reason: the lesson is not one agent's. A correction between Plan
 * and Build is guidance for whoever writes the next spec, whoever builds from
 * it, and the Critic weighing a similar call, and pinning it to the slug that
 * happened to fail would keep it from all three. `visibility` defaults to
 * 'workspace' on the column, so the lesson is the team's rather than the
 * author's.
 *
 * NO EMBEDDING MEANS NO WRITE, copied deliberately from `rememberOutcome`:
 * `match_agent_memory` hard-filters `embedding IS NOT NULL` and there is no
 * re-embed sweep, so an unembedded row is a memory nothing can ever recall. An
 * unrecallable row is worse than none because it looks like the loop learned.
 *
 * Idempotent per track and per failing station: a track corrected twice at Build
 * replaces its own earlier lesson instead of stacking near-identical rows that
 * would crowd every future recall.
 *
 * Best-effort throughout. A lesson that cannot be written must never cost the
 * correction itself, which is the same contract every other write in the spine
 * carries: losing the index is recoverable, losing the work is not.
 */
export async function rememberCorrection(
  supabase: SupabaseClient,
  args: {
    userId: string;
    workspaceId: string | null;
    trackId: string;
    title: string;
    from: AgentStation;
    to: AgentStation;
    missing: string;
    kind: "absent" | "not-enough";
  },
): Promise<{ id: string } | null> {
  const content = correctionMemory({
    title: args.title,
    from: args.from,
    to: args.to,
    missing: args.missing,
    kind: args.kind,
  });
  return writeCorrectionMemory(supabase, args, content);
}

/**
 * The other half of the lesson: what actually fixed it.
 *
 * WHY IT IS A SECOND WRITE. At correction time the system knows what failed and
 * where it sent the work, which is a hypothesis. It does not yet know whether
 * the hypothesis was right. Writing only the first half would teach every future
 * agent a guess; writing this one when the corrected station finally finishes is
 * what makes the record say "this fix worked", which is the difference between a
 * log and something worth recalling.
 *
 * Replaces the hypothesis row rather than sitting beside it, so recall meets the
 * confirmed lesson and not both versions of it.
 */
export async function rememberCorrectionFix(
  supabase: SupabaseClient,
  args: {
    userId: string;
    workspaceId: string | null;
    trackId: string;
    title: string;
    from: AgentStation;
    to: AgentStation;
    missing: string;
  },
): Promise<{ id: string } | null> {
  const content = correctionFixMemory({
    title: args.title,
    from: args.from,
    to: args.to,
    missing: args.missing,
  });
  return writeCorrectionMemory(supabase, args, content);
}

async function writeCorrectionMemory(
  supabase: SupabaseClient,
  args: {
    userId: string;
    workspaceId: string | null;
    trackId: string;
    from: AgentStation;
    to: AgentStation;
    missing: string;
  },
  content: string,
): Promise<{ id: string } | null> {
  try {
    let emb: number[] | null = null;
    try {
      const v = await embedOne(content, {
        supabase,
        userId: args.userId,
        surfaceRef: "correction-memory",
      });
      emb = Array.isArray(v) && v.length > 0 ? v : null;
    } catch {
      emb = null;
    }
    if (!emb) return null;

    // Repo jsonb-filter convention, the same one rememberOutcome uses.
    await supabase
      .from("agent_memory")
      .delete()
      .eq("user_id", args.userId)
      .filter("metadata->>source", "eq", "spine-correction")
      .filter("metadata->>track_id", "eq", args.trackId)
      .filter("metadata->>from_station", "eq", args.from);

    const { data, error } = await supabase
      .from("agent_memory")
      .insert({
        user_id: args.userId,
        agent_id: null,
        agent_slug: null,
        scope: "global",
        kind: CORRECTION_MEMORY_KIND,
        content,
        importance: CORRECTION_MEMORY_IMPORTANCE,
        metadata: {
          source: "spine-correction",
          workspace_id: args.workspaceId,
          track_id: args.trackId,
          from_station: args.from,
          to_station: args.to,
          missing: args.missing,
        },
        embedding: emb as unknown as string,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Tagged separately and error-tolerantly, the rememberOutcome precedent: the
    // column is nullable with no DEFAULT bridge, and a null workspace_id recalls
    // as global rather than as nothing.
    if (args.workspaceId && (data as { id?: string } | null)?.id) {
      try {
        await supabase
          .from("agent_memory")
          .update({ workspace_id: args.workspaceId })
          .eq("id", (data as { id: string }).id);
      } catch {
        /* column not present yet, non-fatal */
      }
    }
    return data as { id: string };
  } catch (e) {
    console.error("rememberCorrection failed:", e);
    return null;
  }
}
