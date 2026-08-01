/**
 * The autonomous driver: one tick of one track through the loop.
 *
 * FOUNDER RULING 2026-08-01: "seamlessly agent takes care of everything and
 * human just watches. And even if human do not watch, agent should be able to
 * complete entire thing and deliver the outcome to the user."
 *
 * WHAT THIS CLOSES. Every station already worked, and the orchestrator already
 * drove missions autonomously inside Build. What nothing did was carry ONE
 * piece of work from Discover through Learn: `loop-state.functions.ts` reports
 * which stage work is in but never moves it, and a station transition was a
 * `navigate()` call in a component. A navigate call requires a person to click,
 * so the loop stopped the instant nobody was watching. That is the gap.
 *
 * IT DOES NO PRODUCT WORK ITSELF. It decides who acts and whether the track may
 * move; the station's own agent does the work with its own tools under its own
 * boundary. The decision rules are pure and unit-tested in ./driver.ts, which
 * is where the stop conditions live, because a driver that runs when it should
 * not is worse than no driver.
 *
 * THE BOUNDARY IS NOT BYPASSED, and this is the part that makes autonomy
 * defensible rather than reckless. The driver dispatches through `runAgentLoop`,
 * the same pinned chokepoint every other dispatch uses, so `resolveToolMode`,
 * the high-risk floors, the trust arc and the spend cap all still bind exactly
 * as they do for a human-started run. When the agent reaches something its
 * boundary does not let it do alone, the loop queues the call and the driver
 * STOPS, leaving the track where it is. Autonomy here means nobody has to press
 * go, never that policy stopped applying.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { runAgentLoop } from "@/lib/ai/loop.server";
import { recordStageEvent } from "@/lib/stage-events.server";
import { nextStation, type SpineRoute } from "@/lib/spine/route";
import { decideDrive, HOLD_LINE, type HoldReason } from "@/lib/spine/driver";
import {
  collectAttachments,
  describeAttachments,
  type Attachment,
  type ToolStepLike,
} from "@/lib/spine/attach";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

export type DriveOutcome = {
  trackId: string;
  /** The station that ran, or the one the track is held at. */
  station: AgentStation | null;
  moved: boolean;
  /** Where it went, when it moved. */
  arrivedAt: AgentStation | null;
  hold: HoldReason | null;
  /** The sentence a person reads. Always populated, never a bare status. */
  line: string;
  /**
   * What this dispatch produced and filed against the track. Only rows the
   * write actually landed, so a caller reading this is reading the table.
   */
  attached: Attachment[];
};

type DriveRow = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  title: string;
  origin: string | null;
  entry_station: string;
  station: string;
  path: unknown;
  waived: unknown;
  attempts: number | null;
};

/** Is everything switched off for this workspace? Checked first, always. */
async function isPaused(supabase: SupabaseClient, workspaceId: string | null): Promise<boolean> {
  if (!workspaceId) return false;
  try {
    const { data } = await supabase
      .from("kill_switches")
      .select("paused")
      .eq("scope", "workspace")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    return Boolean((data as { paused?: boolean } | null)?.paused);
  } catch {
    // A kill switch that cannot be read is treated as ON. Failing closed on the
    // one control that means "stop everything" is the only safe direction.
    return true;
  }
}

/** Calls already in front of this person. The driver never stacks work on them. */
async function pendingApprovals(supabase: SupabaseClient, userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from("agent_approvals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending");
    return count ?? 0;
  } catch {
    // Unknown means we do not know the person is free, so we assume they are
    // not. Fail closed, same reasoning as the kill switch.
    return 1;
  }
}

/**
 * File what the run reported making against the track.
 *
 * A track with a route and no members is an itinerary with no luggage: the
 * board can say where work is but not what it is made of, and `attachToTrack`
 * shipped with no caller at all, so nothing ever wrote a member row.
 *
 * NON-FATAL BY CONSTRUCTION, and this is the whole contract of the function.
 * Losing the index is recoverable, losing the work is not, so every failure
 * here returns an empty list and the track advances exactly as it would have.
 * The empty return also keeps the reported line honest: if the write did not
 * land, the driver must not go on to say that something joined the track.
 *
 * Pre-migration and permission failures both land in the same place. The table
 * is live, but the same tolerance every other spine handler carries costs
 * nothing and means a schema window can never take a tick down.
 */
async function attachProducts(
  supabase: SupabaseClient,
  trackId: string,
  station: AgentStation,
  steps: readonly ToolStepLike[],
): Promise<Attachment[]> {
  const attachments = collectAttachments(steps, station);
  if (attachments.length === 0) return [];
  try {
    // Idempotent on the primary key, the same upsert `attachToTrack` uses, so a
    // re-drive of the same station files the same rows without duplicating them.
    const { error } = await supabase.from("spine_track_members").upsert(
      attachments.map((a) => ({
        track_id: trackId,
        artifact_kind: a.artifactKind,
        artifact_id: a.artifactId,
        station: a.station,
      })),
      { onConflict: "track_id,artifact_kind,artifact_id" },
    );
    if (error) {
      console.error(`spine attach failed for track ${trackId}: ${error.message}`);
      return [];
    }
    return attachments;
  } catch (e) {
    console.error(
      `spine attach threw for track ${trackId}: ${e instanceof Error ? e.message : String(e)}`,
    );
    return [];
  }
}

function routeOf(row: DriveRow): SpineRoute {
  const path = (Array.isArray(row.path) ? row.path : []) as AgentStation[];
  return {
    entry: row.entry_station as AgentStation,
    path: path.length > 0 ? path : [...AGENT_STATION_ORDER],
    waived: (Array.isArray(row.waived) ? row.waived : []) as SpineRoute["waived"],
    origin: row.origin,
  };
}

/**
 * Drive one track by one station.
 *
 * Returns what happened in words, because this runs with nobody watching and
 * the record of what it did is the only thing a person will ever see of it.
 */
export async function driveTrackOnce(
  supabase: SupabaseClient,
  row: DriveRow,
): Promise<DriveOutcome> {
  const route = routeOf(row);
  const station = row.station as AgentStation;

  const decision = decideDrive({
    paused: await isPaused(supabase, row.workspace_id),
    station,
    title: row.title,
    origin: row.origin,
    pendingApprovals: await pendingApprovals(supabase, row.user_id),
    attempts: row.attempts ?? 0,
  });

  if (!decision.act) {
    await supabase
      .from("spine_tracks" as never)
      .update({ last_hold: decision.hold, driven_at: new Date().toISOString() } as never)
      .eq("id", row.id);
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      hold: decision.hold,
      line: HOLD_LINE[decision.hold],
      attached: [],
    };
  }

  // The station's own agent, through the pinned chokepoint. Every guardrail,
  // floor, trust arc and spend cap applies here exactly as it would to a run a
  // person started by hand.
  let queued = 0;
  let failed: string | null = null;
  let steps: ToolStepLike[] = [];
  try {
    const result = await runAgentLoop(supabase, row.user_id, {
      agentSlug: decision.agentSlug,
      goal: decision.goal,
      workspaceId: row.workspace_id,
    });
    queued = result.approvals_queued ?? 0;
    // The run's own account of what it did. This is the only channel that ties
    // an artifact to THIS track rather than to whatever happened to be created
    // around the same time; the full argument is in the header of ./attach.ts.
    steps = result.steps ?? [];
  } catch (e) {
    failed = e instanceof Error ? e.message : String(e);
  }

  // Filed before the branches below, not after them, because a run that hit its
  // boundary on step three may well have drafted a spec on step one. That spec
  // exists and belongs to this work whether or not the track gets to move, and
  // dropping it would lose the record of the only thing the station achieved.
  const attached = await attachProducts(supabase, row.id, station, steps);
  const say = (line: string) => {
    const made = describeAttachments(attached);
    return made ? `${line} ${made}` : line;
  };

  // The agent hit its boundary. That is the boundary working, not a failure,
  // and the track waits exactly where it is until the person decides. The
  // declined ledger on /boundary already records what it asked for and why.
  if (queued > 0) {
    await supabase
      .from("spine_tracks" as never)
      .update({
        last_hold: "waiting-on-a-person",
        driven_at: new Date().toISOString(),
      } as never)
      .eq("id", row.id);
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      hold: "waiting-on-a-person",
      line: say(HOLD_LINE["waiting-on-a-person"]),
      attached,
    };
  }

  // A failed dispatch counts as an attempt rather than advancing the track. It
  // must not move work forward on the strength of a station that threw.
  if (failed) {
    await supabase
      .from("spine_tracks" as never)
      .update({
        attempts: (row.attempts ?? 0) + 1,
        last_hold: "stalled",
        driven_at: new Date().toISOString(),
      } as never)
      .eq("id", row.id);
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      hold: "stalled",
      line: `${station} did not complete: ${failed}`,
      // A dispatch that threw returned no steps, so there is nothing to file.
      // Kept explicit rather than inlined so the invariant is visible.
      attached,
    };
  }

  const arrivedAt = nextStation(route, station);

  // attempts resets on every move, in the same write, so a counter can never
  // leak across stations and strand work that was making progress.
  await supabase
    .from("spine_tracks" as never)
    .update(
      (arrivedAt
        ? {
            station: arrivedAt,
            attempts: 0,
            last_hold: null,
            driven_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            status: "done",
            attempts: 0,
            last_hold: null,
            driven_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }) as never,
    )
    .eq("id", row.id);

  await recordStageEvent(supabase, {
    entityType: "spine_track",
    entityId: row.id,
    from: station,
    to: arrivedAt ?? "learn",
    actor: "system",
    workspaceId: row.workspace_id,
    userId: row.user_id,
  });

  return {
    trackId: row.id,
    station,
    moved: true,
    arrivedAt,
    hold: null,
    line: say(
      arrivedAt
        ? `${row.title} moved from ${station} to ${arrivedAt}.`
        : `${row.title} reached the end of its route and has been graded.`,
    ),
    attached,
  };
}

/** The columns driveTrackOnce needs. Exported so the tick and the driver agree. */
export const DRIVE_SELECT =
  "id,user_id,workspace_id,title,origin,entry_station,station,path,waived,attempts";

export type { DriveRow };
