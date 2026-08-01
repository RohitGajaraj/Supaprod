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
import { createMission } from "@/lib/ai/handoff.server";
import { recordStageEvent } from "@/lib/stage-events.server";
import { nextStation, type SpineRoute } from "@/lib/spine/route";
import {
  decideDrive,
  HOLD_LINE,
  stationCrew,
  stationGoal,
  type HoldReason,
  type UpstreamArtifact,
} from "@/lib/spine/driver";
import { ARTIFACT_SOURCE } from "@/lib/spine/chain";
import {
  collectAttachments,
  describeAttachments,
  gatesOpenedBy,
  harvestGates,
  type ApprovalRowLike,
  type Attachment,
  type PendingGate,
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
  /** Gates opened by earlier runs of this track, awaiting an answer. */
  pending_gates: unknown;
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
/*
 * REMOVED 2026-08-01: a person-wide pending-approval count.
 *
 * It read `agent_approvals` filtered to user_id and status only, and its result
 * became the "waiting on a person" hold for every track that user owned. One
 * unanswered call anywhere therefore froze all autonomous work indefinitely,
 * which made the gate a global mutex instead of an exception, and meant the
 * busier a workspace got the less its agents were permitted to do.
 *
 * The hold is now computed from the track's own `pending_gates`, in
 * `harvestAnsweredGates` above. Do not reintroduce a user-wide count here: the
 * question the driver needs answered is "is THIS work waiting on someone", and
 * a count of everything the person owes is not an answer to it.
 */

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
  return writeMembers(supabase, trackId, collectAttachments(steps, station));
}

async function writeMembers(
  supabase: SupabaseClient,
  trackId: string,
  attachments: Attachment[],
): Promise<Attachment[]> {
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

/**
 * File what this track's ANSWERED gates produced, and forget the ones that are
 * settled for good.
 *
 * WHY IT RUNS BEFORE THE DRIVE DECISION, not after. A gate may have been
 * answered at any point since the last tick, including while the workspace was
 * paused or while the track was held. Harvesting first means the record catches
 * up even on a tick where nothing is allowed to run, and it means the
 * pending-approval count `decideDrive` reads is not stale by one tick.
 *
 * NON-FATAL, on the same reasoning as attachProducts: losing the index is
 * recoverable, losing the work is not.
 */
async function harvestAnsweredGates(
  supabase: SupabaseClient,
  row: DriveRow,
): Promise<{ filed: Attachment[]; stillOpen: number }> {
  const pending = (Array.isArray(row.pending_gates) ? row.pending_gates : []) as PendingGate[];
  if (pending.length === 0) return { filed: [], stillOpen: 0 };

  try {
    const { data, error } = await supabase
      .from("agent_approvals")
      .select("id,tool_name,status,result")
      .in(
        "id",
        pending.map((g) => g.id),
      );
    // Fails closed on both branches below: a count we could not read must not
    // report the person as free, the same direction the kill switch takes.
    if (error) return { filed: [], stillOpen: pending.length };

    const { attachments, stillPending } = harvestGates(pending, data as ApprovalRowLike[]);
    const filed = await writeMembers(supabase, row.id, attachments);

    // Shrink the list only when the write landed. A gate dropped after a failed
    // attach would lose the artifact permanently, since nothing else in the
    // product reads agent_approvals.result back.
    const keep = filed.length === attachments.length ? stillPending : pending;
    if (keep.length !== pending.length) {
      await supabase
        .from("spine_tracks" as never)
        .update({ pending_gates: keep } as never)
        .eq("id", row.id);
    }
    return { filed, stillOpen: keep.length };
  } catch (e) {
    console.error(
      `spine gate harvest threw for track ${row.id}: ${e instanceof Error ? e.message : String(e)}`,
    );
    return { filed: [], stillOpen: pending.length };
  }
}

/** Remember the gates this run just opened, so their output is not lost. */
async function rememberGates(
  supabase: SupabaseClient,
  row: DriveRow,
  opened: PendingGate[],
): Promise<void> {
  if (opened.length === 0) return;
  const existing = (Array.isArray(row.pending_gates) ? row.pending_gates : []) as PendingGate[];
  const seen = new Set(existing.map((g) => g.id));
  const merged = [...existing, ...opened.filter((g) => !seen.has(g.id))];
  if (merged.length === existing.length) return;
  try {
    await supabase
      .from("spine_tracks" as never)
      .update({ pending_gates: merged } as never)
      .eq("id", row.id);
  } catch (e) {
    console.error(
      `spine gate record threw for track ${row.id}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

/**
 * The mission this track builds under, created once and then reused.
 *
 * WHY BUILD NEEDS ONE AT ALL. `studio.stage` is the only registered tool that
 * writes a changeset, and its first line is `if (!missionId) throw`. The driver
 * dispatched with no mission, so every Build step errored, nothing was ever
 * attached, and the module's own gap table recorded Build as fine. Adversarial
 * review caught the table lying; this makes the table true instead of merely
 * accurate about a broken state.
 *
 * WHY THE MISSION IS A TRACK MEMBER RATHER THAN A NEW COLUMN. A mission IS part
 * of this piece of work, which is exactly what `spine_track_members` records, so
 * storing it there needs no migration and puts it where a reader would look for
 * it. Reusing it matters: without a lookup, every Build tick would open a fresh
 * mission and the changesets of one piece of work would scatter across several.
 *
 * Returns null rather than throwing on any failure. A Build station that cannot
 * get a mission is the state we were already in, so it degrades to exactly the
 * old behaviour instead of costing the track its tick.
 */
async function missionForTrack(
  supabase: SupabaseClient,
  row: DriveRow,
  agentSlug: string,
): Promise<string | null> {
  try {
    const { data: existing } = await supabase
      .from("spine_track_members")
      .select("artifact_id")
      .eq("track_id", row.id)
      .eq("artifact_kind", "mission")
      .limit(1)
      .maybeSingle();
    const found = (existing as { artifact_id?: string } | null)?.artifact_id;
    if (found) return found;

    if (!row.workspace_id) return null;
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", row.user_id)
      .eq("slug", agentSlug)
      .maybeSingle();
    const agentId = (agent as { id?: string } | null)?.id;
    if (!agentId) return null;

    const mission = await createMission(supabase, row.user_id, row.workspace_id, {
      title: row.title,
      goal: row.origin ? `${row.title}. ${row.origin}` : row.title,
      starting_agent_id: agentId,
    });
    if (!mission?.id) return null;

    await writeMembers(supabase, row.id, [
      { artifactKind: "mission", artifactId: mission.id, station: "build" },
    ]);
    return mission.id;
  } catch (e) {
    console.error(
      `spine mission for track ${row.id} failed: ${e instanceof Error ? e.message : String(e)}`,
    );
    return null;
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
/**
 * What earlier stations on this track already filed, oldest first.
 *
 * THE HANDOFF. Reads `spine_track_members` (the causal record of what this
 * track's own runs produced, never a time window) and fetches each artifact's
 * title and body so the next station is briefed on real work rather than on the
 * track's one-line title. The full argument for why this had to exist is on
 * `describeUpstream` in ./driver.ts.
 *
 * `ARTIFACT_SOURCE` is shared with the chain panel deliberately: the handoff and
 * the thing a person reads on screen must name the same rows from the same
 * columns, or the brief an agent got and the record a person audits are two
 * different stories about one piece of work.
 *
 * Fails SOFT, by design. A track whose artifact table cannot be read still
 * drives; it simply drives with a thinner brief, which is worse than a full
 * handoff and much better than a station that will not run at all. The
 * produced-nothing hold is what catches the consequence if the thin brief means
 * the station cannot do its job.
 */
async function loadUpstream(
  supabase: SupabaseClient,
  trackId: string,
): Promise<UpstreamArtifact[]> {
  const { data: members, error } = await supabase
    .from("spine_track_members" as never)
    .select("artifact_kind, artifact_id, created_at")
    .eq("track_id", trackId)
    .order("created_at", { ascending: true });
  if (error || !members) return [];

  const rows = members as unknown as Array<{
    artifact_kind: string;
    artifact_id: string;
  }>;

  // One query per kind rather than one per row, so a track with a dozen tasks
  // costs the same as a track with one.
  const byKind = new Map<string, string[]>();
  for (const m of rows) {
    if (!ARTIFACT_SOURCE[m.artifact_kind]) continue;
    byKind.set(m.artifact_kind, [...(byKind.get(m.artifact_kind) ?? []), m.artifact_id]);
  }

  const found = new Map<string, { title: string; body: string | null }>();
  await Promise.all(
    [...byKind.entries()].map(async ([kind, ids]) => {
      const source = ARTIFACT_SOURCE[kind];
      const cols = ["id", `title:${source.title}`];
      if (source.body) cols.push(`body:${source.body}`);
      const { data } = await supabase
        .from(source.table as never)
        .select(cols.join(","))
        .in("id", ids);
      for (const r of (data ?? []) as unknown as Array<{
        id: string;
        title: string | null;
        body?: string | null;
      }>) {
        found.set(`${kind}:${r.id}`, { title: r.title ?? "untitled", body: r.body ?? null });
      }
    }),
  );

  // A member whose artifact row is gone is dropped here rather than named as a
  // ghost. The chain panel keeps it and marks it missing, because a person
  // auditing the record needs to see the hole; an agent being briefed does not
  // benefit from being told about a row it cannot read.
  return rows.flatMap((m) => {
    const hit = found.get(`${m.artifact_kind}:${m.artifact_id}`);
    return hit
      ? [{ kind: m.artifact_kind, id: m.artifact_id, title: hit.title, body: hit.body }]
      : [];
  });
}

export async function driveTrackOnce(
  supabase: SupabaseClient,
  row: DriveRow,
): Promise<DriveOutcome> {
  const route = routeOf(row);
  const station = row.station as AgentStation;

  // Catch the record up on gates answered since the last tick BEFORE deciding
  // anything. A person may have approved a call while the workspace was paused
  // or while this track was held, and the artifact that produced belongs to the
  // track whether or not this tick is allowed to run anything.
  const gates = await harvestAnsweredGates(supabase, row);
  const harvested = gates.filed;

  // Read AFTER the harvest, so a spec approved through a gate since the last
  // tick is in the brief of the station that runs now rather than one tick late.
  const upstream = await loadUpstream(supabase, row.id);

  const decision = decideDrive({
    upstream,
    paused: await isPaused(supabase, row.workspace_id),
    station,
    title: row.title,
    origin: row.origin,
    // THIS TRACK'S OWN OPEN CALLS, not the person's (fixed 2026-08-01, found by
    // watching the live loop sit still).
    //
    // This used to count every pending row in `agent_approvals` for the user,
    // scoped to nothing else: not the track, not the workspace, not the mission.
    // So a single unanswered call anywhere froze EVERY track that person owned,
    // permanently, and a workspace holding a normal backlog of approvals had an
    // autonomous loop that could never run at all. The demo workspace has 23,
    // and the loop was parked behind them.
    //
    // That is the governance principle exactly inverted. The gate is meant to be
    // the exception; a person-wide count makes it a global mutex on all
    // autonomous work, so the busier the queue gets the less the agents are
    // allowed to do, which is backwards from every direction you read it.
    //
    // `pending_gates` already records the calls THIS track's own run opened,
    // with the station that opened them, which makes the hold causal rather than
    // correlational: this track waits because this track asked something.
    pendingApprovals: gates.stillOpen,
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
      // A held tick that nonetheless filed something says both, because "your
      // spec arrived" and "nothing is running" are separate facts and a person
      // reading only the second would think the approval they gave did nothing.
      line: harvested.length
        ? `${describeAttachments(harvested)} ${HOLD_LINE[decision.hold]}`
        : HOLD_LINE[decision.hold],
      attached: harvested,
    };
  }

  // THE STATION'S WHOLE CREW, in order, through the pinned chokepoint. Every
  // guardrail, floor, trust arc and spend cap applies to each seat exactly as it
  // would to a run a person started by hand.
  //
  // The crew runs WITHIN one tick rather than one seat per tick, so "one tick =
  // one attempt at one station" stays true and `MAX_STATION_ATTEMPTS` keeps
  // meaning what it says. The alternative, a seat index persisted on the track,
  // needed a schema column and made every stop condition ask "which seat" before
  // it could ask anything else.
  //
  // EACH SEAT IS BRIEFED WITH WHAT THE PREVIOUS SEAT FILED. `upstream` grows as
  // the crew works, so Plan's sprint-planner reads the spec prd-writer just
  // wrote, and Design's critic reads the design it is being asked to check. This
  // is the same handoff that runs between stations, applied within one.
  let queued = 0;
  let failed: string | null = null;
  let steps: ToolStepLike[] = [];
  const crew = stationCrew(station);
  const brief = [...upstream];
  /** What the crew filed, accumulated seat by seat as each one runs. */
  const made: Attachment[] = [];
  try {
    // Build is the one station whose tool refuses without a mission, so the
    // driver opens one for it. Every other station is dispatched exactly as
    // before, because a mission they never use would be a noun with no referent
    // cluttering the record.
    const missionId =
      station === "build" ? await missionForTrack(supabase, row, decision.agentSlug) : null;

    for (const seat of crew) {
      const result = await runAgentLoop(supabase, row.user_id, {
        agentSlug: seat.slug,
        goal: stationGoal(station, { title: row.title, origin: row.origin }, brief, seat),
        workspaceId: row.workspace_id,
        missionId,
      });
      // The run's own account of what it did. This is the only channel that ties
      // an artifact to THIS track rather than to whatever happened to be created
      // around the same time; the full argument is in the header of ./attach.ts.
      steps = [...steps, ...(result.steps ?? [])];
      queued += result.approvals_queued ?? 0;

      // A seat that put a call in front of a person stops the CREW, not just
      // itself. The seats after it are briefed on what it filed, and it has not
      // filed yet; running them now would have them review work that does not
      // exist and then advance the station on the strength of it.
      if (queued > 0) break;

      // Re-read rather than guessing from the steps, so the next seat is briefed
      // on rows that are actually on the record. A tool that reported an id it
      // did not write would otherwise put a phantom artifact in the next brief.
      const filed = await attachProducts(supabase, row.id, station, result.steps ?? []);
      made.push(...filed);
      brief.push(
        ...(await loadUpstream(supabase, row.id)).filter(
          (a) => !brief.some((b) => b.id === a.id) && filed.some((f) => f.artifactId === a.id),
        ),
      );
    }
  } catch (e) {
    failed = e instanceof Error ? e.message : String(e);
  }

  // Collected as the crew ran, not re-derived from the accumulated steps here.
  // Re-attaching would write every member a second time, and the seats had to
  // file as they went anyway so each one could brief the next.
  //
  // Kept ahead of the branches below, because a crew that hit its boundary on
  // the second seat may well have drafted a spec on the first. That spec exists
  // and belongs to this work whether or not the track gets to move, and dropping
  // it would lose the record of the only thing the station achieved.
  const attached = [...harvested, ...made];
  const say = (line: string) => {
    const made = describeAttachments(attached);
    return made ? `${line} ${made}` : line;
  };

  // Remember every gate this run opened, so whatever the person approves is
  // filed against this track when it eventually runs. Without this the work
  // produced through a boundary is the only work with no record of membership,
  // which is exactly backwards for a product whose claim is that the crossings
  // are on the record.
  const opened = gatesOpenedBy(steps, station);
  await rememberGates(supabase, row, opened);

  // The agent hit its boundary. That is the boundary working, not a failure,
  // and the track waits exactly where it is until the person decides. The
  // declined ledger on /boundary already records what it asked for and why.
  if (queued > 0) {
    // THE ONE WAY THIS COULD RUN AWAY, bounded rather than assumed away.
    //
    // Hitting a gate is not a failure, so it deliberately does not count as an
    // attempt. That was safe while a person-wide approval count blocked every
    // track; now that the hold is scoped to this track's own recorded gates, a
    // run that queued a call we could NOT record would read as "not waiting" on
    // the next tick, redispatch the station, and queue the same call again every
    // ten minutes forever, spending real money each time.
    //
    // `gatesOpenedBy` now records every queued call rather than only the ones
    // that yield an artifact, so this should not happen. Should is not a
    // guarantee: a queued step carrying no usable approval_id would still land
    // here. When it does, the tick counts as an attempt so the existing stall
    // ceiling stops it after a few rounds and says so, instead of billing
    // forever in silence.
    const untracked = opened.length === 0;
    await supabase
      .from("spine_tracks" as never)
      .update({
        last_hold: "waiting-on-a-person",
        ...(untracked ? { attempts: (row.attempts ?? 0) + 1 } : {}),
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

  // THE STATION RAN CLEANLY AND FILED NOTHING, so it does not move.
  //
  // Added 2026-08-01 after watching a live track walk Plan -> Design -> Build ->
  // Ship having produced one prototype and no spec at all. Plan's agent wrote a
  // complete, genuinely good spec into its final answer and never called
  // `prd.draft`, because `prd.draft` had no row in that user's `agent_tools` and
  // therefore never appeared in its prompt. The driver could not tell that from
  // success, advanced, and Build then reported -- correctly -- that it had been
  // given nothing to build. The loop ran end to end and delivered nothing.
  //
  // A station's output is the row it wrote. No row means there is nothing to
  // hand to the next station, so advancing would be reporting progress the work
  // did not buy. It counts as an attempt so `MAX_STATION_ATTEMPTS` still bounds
  // the retries and a genuinely stuck station reaches a person the same day.
  //
  // NOT a failure, and named separately from `stalled` for that reason: the run
  // worked, its output went nowhere. That distinction is the whole diagnosis, so
  // the record keeps it rather than flattening both into "stalled".
  if (attached.length === 0) {
    await supabase
      .from("spine_tracks" as never)
      .update({
        attempts: (row.attempts ?? 0) + 1,
        last_hold: "produced-nothing",
        driven_at: new Date().toISOString(),
      } as never)
      .eq("id", row.id);
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      hold: "produced-nothing",
      line: HOLD_LINE["produced-nothing"],
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
  "id,user_id,workspace_id,title,origin,entry_station,station,path,waived,attempts,pending_gates";

export type { DriveRow };
