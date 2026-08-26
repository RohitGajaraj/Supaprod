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
import { recordTrackDrive } from "@/lib/spine/track-drives.server";
import { recordLineage } from "@/lib/lineage.functions";
import { nextStation, waiverFor, type SpineRoute } from "@/lib/spine/route";
import {
  decideDrive,
  holdLine,
  HOLD_LINE,
  didStationProduce,
  refusedTool,
  resumeSeatFrom,
  newestSpecId,
  stationCrew,
  stationGoal,
  type HoldReason,
  type UpstreamArtifact,
  type DrivenVia,
} from "@/lib/spine/driver";
import {
  CORRECTABLE_HOLDS,
  correctionNote,
  decideCorrection,
  holdForCorrection,
  holdForHalt,
  isEnvironmentFailure,
  needIsMet,
  STATION_NEEDS,
} from "@/lib/spine/correction";
import {
  applyCorrection,
  readCorrections,
  rememberCorrectionFix,
} from "@/lib/spine/correction.server";
import { ARTIFACT_SOURCE } from "@/lib/spine/chain";
import {
  costOfRun,
  isOverTrackBudget,
  outOfTime,
  resolveTrackSpendCap,
} from "@/lib/spine/track-caps.server";
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
  /**
   * Why the driver last declined to move this track.
   *
   * READ, not only written, since the correction loop landed. When the loop
   * escalated for one specific thing and that thing has since arrived, this is
   * what tells the rule the ask was answered, so the work resumes without
   * anybody having to unstick it by hand. See `RESUMABLE_HOLDS` in ./correction.
   */
  last_hold: string | null;
  /** Gates opened by earlier runs of this track, awaiting an answer. */
  pending_gates: unknown;
  /** Dollars this track has spent across every station, seat and retry. */
  spend_used_usd: number | null;
  /** Its own ceiling, when one was set for this track specifically. */
  spend_cap_usd: number | null;
  /**
   * When the driver last looked at this track.
   *
   * READ, not only written, since `externalEvidence` started asking whether
   * anything NEW has arrived rather than whether the workspace has ever held a
   * signal. Every path out of `driveTrackOnce` stamps it, so it is the last
   * moment this track is known to have been considered, which is exactly the
   * watermark "has evidence landed since we last tried" needs.
   *
   * Null on a track that has never been driven, which is read as "look at the
   * workspace as it stands" rather than as "nothing has arrived".
   */
  driven_at: string | null;
  /**
   * Which crew seat the current station still owes, when the tick deadline cut
   * the crew short.
   *
   * Zero on every ordinary track. It is set only by the `out-of-time` exit and
   * cleared by every other one, so a non-zero value means precisely "this
   * station was interrupted mid-crew and the seats before this index are already
   * paid for". Absent or null reads as zero, which is the behaviour that shipped
   * before the column existed.
   */
  seat_cursor?: number | null;
  /**
   * When this track was opened. Read on one path only: a crew resumed mid-station
   * needs to know when it ARRIVED at that station, and a track that has never
   * left the station it was created at has no `stage_events` row to say so.
   */
  created_at?: string | null;
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

/** Report a broken link without letting the report become a second failure. */
async function reportLinkFailure(
  row: DriveRow,
  failureKind: string,
  message: string,
): Promise<void> {
  try {
    // Dynamic import, the same idiom recordLineage uses, so the observability
    // module never enters this file's import-time graph.
    const { recordErrorEvent } = await import("@/lib/observability/errors");
    await recordErrorEvent(new Error(message), {
      surface: "spine.driver.missionForTrack",
      user_id: row.user_id,
      workspace_id: row.workspace_id ?? undefined,
      failure_kind: failureKind,
    });
  } catch {
    // Recording a missing link must not cost the track its tick.
  }
}

/**
 * Is this exact prd -> mission "dispatched" edge on the record?
 *
 * `true` yes, `false` definitely not, `null` nobody could tell. The three-way
 * answer is the point: an unreadable table must not be reported as a missing
 * edge. A false alarm on the one signal that says "the grading chain is
 * severed" would make the signal worth ignoring.
 *
 * USED ONLY AS THE READ-BACK AFTER THE WRITE. What decides whether to write at
 * all is `missionHasSpecParent` below, which asks a deliberately wider question;
 * the two are not interchangeable and the reason is on that function.
 */
async function dispatchEdgeExists(
  supabase: SupabaseClient,
  prdId: string,
  missionId: string,
): Promise<boolean | null> {
  try {
    const { data, error } = await supabase
      .from("artifact_lineage")
      .select("id")
      .eq("parent_kind", "prd")
      .eq("parent_id", prdId)
      .eq("child_kind", "mission")
      .eq("child_id", missionId)
      .eq("relation", "dispatched")
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return Boolean((data as { id?: string } | null)?.id);
  } catch {
    return null;
  }
}

/**
 * Does this mission ALREADY have a spec behind it, from any door?
 *
 * NO RELATION FILTER AND NO PRD FILTER, and that is the whole point of having a
 * second function rather than reusing the one above. It asks the same question
 * the READER asks. `resolvePrdForMission` (src/lib/ai/tools/registry.server.ts)
 * is what stamps `studio_changesets.prd_id`, and it takes the OLDEST
 * `prd -> mission` edge for the mission ordered `created_at` ascending, with no
 * relation filter at all. So "this mission has a spec" is a fact about the whole
 * edge set, not about the one row this driver would write.
 *
 * `true` yes, `false` definitely not, `null` nobody could tell — same contract
 * as `dispatchEdgeExists`, for the same reason.
 */
async function missionHasSpecParent(
  supabase: SupabaseClient,
  missionId: string,
): Promise<boolean | null> {
  try {
    const { data, error } = await supabase
      .from("artifact_lineage")
      .select("id")
      .eq("parent_kind", "prd")
      .eq("child_kind", "mission")
      .eq("child_id", missionId)
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return Boolean((data as { id?: string } | null)?.id);
  } catch {
    return null;
  }
}

/**
 * THE EDGE THAT MAKES AN AUTONOMOUS BUILD GRADEABLE.
 *
 * A mission carries no prd column, so the `prd -> mission` "dispatched" edge in
 * `artifact_lineage` IS the only link between a spec and the mission built from
 * it. `resolvePrdForMission` (src/lib/ai/tools/registry.server.ts) reads exactly
 * that edge to stamp `studio_changesets.prd_id` when the agent opens a
 * changeset, and `decideStudioMergeShipStamp` refuses to stamp a merge shipped
 * when that id is null.
 *
 * Both human dispatch paths write it — src/lib/build.functions.ts (relation
 * "dispatched", rationale "Sent to Build") and src/lib/studio.functions.ts
 * ("Sent to Studio"). The driver did not, so an agent that built and merged with
 * nobody watching produced a changeset with `prd_id` null, no spec was ever
 * stamped shipped, Learn had nothing to grade, and the 30-day outcome window
 * never opened. Live on 2026-08-06: both tracks that own a mission have zero
 * prd -> mission edges, and 23 of 44 changesets carry a null `prd_id`.
 *
 * SAME SHAPE AND RELATION AS THE HUMAN PATHS, deliberately, so the three
 * dispatch doors write ONE kind of edge and every reader downstream stays
 * single-path.
 *
 * IT RUNS ON THE REUSE PATH TOO, not only at creation. The mission is made once
 * and then looked up on every later Build tick; if the edge were written only
 * beside `createMission`, a transient refusal would be permanent, because the
 * next tick takes the early return and never looks again. Running it every tick
 * is what lets a tick that failed yesterday repair itself today.
 *
 * IT WRITES AT MOST ONE EDGE PER MISSION, though, and that bound is deliberate
 * rather than incidental. `recordLineage` is idempotent on the UNIQUE KEY only:
 * on conflict it still updates `rationale`, `created_by_agent` and
 * `ai_event_id`, so a repeat is a restamp, not a no-op. The guard inside is
 * therefore "does this mission have a spec parent at all", which both keeps the
 * driver from contradicting an edge a human wrote and keeps the mission to one
 * spec parent — the only shape `resolvePrdForMission`'s oldest-first read can
 * answer unambiguously.
 *
 * WHAT IT DOES NOT DO. The human paths also write a spec-level `stage_events`
 * row (entity "spec", to "build"). This does not; the driver records its own
 * `spine_track` transition in `driveTrackOnce` and the spec timeline still shows
 * no autonomous dispatch. Only the lineage edge — the link the grading chain
 * reads — is closed here.
 *
 * NEVER THROWS, and the outer catch is load-bearing rather than defensive. This
 * runs on the reuse path, so a transport error escaping it would send
 * `missionForTrack` down its own catch and return null for a mission that
 * exists; `studio.stage` then refuses, the station fails, and the track burns an
 * attempt. Losing the link is bad. Losing the build over the link is worse.
 */
async function linkSpecToMission(
  supabase: SupabaseClient,
  row: DriveRow,
  missionId: string,
  agentSlug: string,
): Promise<void> {
  try {
    await linkSpecToMissionOrThrow(supabase, row, missionId, agentSlug);
  } catch (e) {
    await reportLinkFailure(
      row,
      "prd->mission:dispatched:threw",
      `Track ${row.id}: linking mission ${missionId} to its spec threw: ` +
        `${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

async function linkSpecToMissionOrThrow(
  supabase: SupabaseClient,
  row: DriveRow,
  missionId: string,
  agentSlug: string,
): Promise<void> {
  const { data: spec, error: specErr } = await supabase
    .from("spine_track_members")
    .select("artifact_id")
    .eq("track_id", row.id)
    .eq("artifact_kind", "prd")
    // NEWEST, and this ordering is only safe because of the `missionHasSpecParent`
    // guard below. On its own it does NOT do what it used to claim.
    //
    // The claim was: "a track sent back to Define for a rewrite files a second
    // spec and the mission is being built from the one that came back." The
    // reader inverts that. `resolvePrdForMission` takes the OLDEST prd -> mission
    // edge, ignoring relation, so once an edge for spec A exists, writing a
    // second one for spec B changes nothing about what the changeset is stamped
    // with — it only gives the mission two parents and two stories.
    //
    // So the write is now once-per-mission: newest spec AT THE MOMENT THE MISSION
    // FIRST GETS ONE, and never contradicted afterwards. That makes this pick and
    // the reader's pick the same row, which is the only property that matters
    // here. What it costs is stated plainly: a rewrite AFTER the edge exists
    // leaves the mission pointed at the superseded spec. Nothing in this file can
    // fix that, because the reader's oldest-first rule is in another module and
    // an edge cannot be given an earlier timestamp than one already written.
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // A READ THAT FAILED IS NOT A SPEC THAT IS MISSING, and conflating the two is
  // how this repo has shipped three bugs this week. Destructuring only `data`
  // here would turn a transport blip or a PostgREST error into `prdId ===
  // undefined`, drop into the branch below, and file an error event asserting as
  // fact that the Define station filed nothing — a definite claim about a table
  // nobody read. It is reported under its own kind so the two are never confused
  // in `error_events`, and the write is skipped rather than guessed at; the reuse
  // path re-runs on every Build tick, so a readable table repairs this.
  if (specErr) {
    await reportLinkFailure(
      row,
      "prd->mission:dispatched:spec-read-failed",
      `Track ${row.id}: could not read the track's spec members, so mission ${missionId} ` +
        `was left unlinked this tick and it is NOT known whether a spec was filed: ${specErr.message}`,
    );
    return;
  }

  const prdId = (spec as { artifact_id?: string } | null)?.artifact_id;

  if (!prdId) {
    // A DELIBERATE FORK, because skipping quietly is how the missing edge got
    // here in the first place. Two different situations wear one shape:
    //
    // Define WAIVED (incident-fix enters at Build, "the fix is the spec"). There
    // is no spec and there never will be. The founder's ruling is that such a
    // skip is supported, not reported as a fault, so nothing is written and
    // nothing is reported. The cost is real and is not this function's to fix:
    // that changeset still reaches Ship with no spec behind it.
    //
    // Define ON THE PATH and no spec filed. That is a genuine break — the
    // station that owes a spec did not file one, and Build is about to produce a
    // changeset Ship cannot stamp and Learn cannot grade. It is recorded, so the
    // hole is findable in `error_events` rather than inferred weeks later from an
    // empty Learn desk.
    //
    // HOW OFTEN IT FIRES TODAY: on nothing, re-measured live on 2026-08-06. An
    // earlier version of this comment said "this is the state of BOTH tracks that
    // own a mission", which overstated it. Two tracks own a mission member;
    // 3fbf73c9 is `status='done'` and the tick selects `status='open'` only
    // (src/routes/api/public/hooks/track-tick.ts), and ef50b26a is open but sits
    // at `define`, while this function is only reached when the station is
    // `build`. Zero open tracks are at Build. It becomes real as the 42 open
    // tracks that carry `define` on their path arrive there, at roughly one event
    // per ten-minute tick per track.
    //
    // The cause named here has also moved on: `prd.draft` no longer refuses a
    // track with no opportunity — it takes `opportunity_id` OR `brief` — so a
    // Define station that files nothing is now a station that did not file, not a
    // tool that could not be called.
    //
    // The mission is returned either way by the caller. Refusing to build
    // because the grading link is missing would trade a broken record for no
    // work at all, which is a worse trade.
    if (!waiverFor(routeOf(row), "define")) {
      await reportLinkFailure(
        row,
        "prd->mission:dispatched:no-spec-filed",
        `Track ${row.id} reached Build with Define on its route and no spec filed, ` +
          `so mission ${missionId} has no spec behind it and nothing it builds can be graded.`,
      );
    }
    return;
  }

  // WRITE ONCE PER MISSION, AND ONLY WHEN WE COULD READ. Two separate reasons,
  // both of which the previous version of this guard got wrong.
  //
  // (1) It asked whether THIS prd's dispatched edge existed. A rewrite therefore
  // added a second parent that the reader ignores — `resolvePrdForMission` takes
  // the oldest edge regardless of relation — so the driver reported linking spec
  // B while the changeset went on being stamped with spec A. Asking whether the
  // mission has ANY spec parent makes the write agree with the read: the mission
  // ends with one spec parent and one story. It also means the driver defers to
  // an edge a human already wrote (build.functions.ts writes the same relation)
  // rather than restamping it, which is the right way round.
  //
  // (2) An unreadable table no longer falls through to the write. `recordLineage`
  // is NOT idempotent, which is what the old comment claimed: its upsert
  // (src/lib/lineage.functions.ts) lists `rationale`, `created_by_agent` and
  // `ai_event_id` in the row, so a conflict UPDATES them. Writing blind on a
  // failed read could therefore overwrite a human-authored edge's provenance with
  // "Dispatched by the autonomous driver" and this agent's slug — and lineage
  // surfaces in this product show `created_by_agent`. Skipping costs one tick;
  // the reuse path runs again on the next one.
  const already = await missionHasSpecParent(supabase, missionId);
  if (already === true) return;
  if (already === null) {
    await reportLinkFailure(
      row,
      "prd->mission:dispatched:edge-read-failed",
      `Track ${row.id}: could not read the lineage edges for mission ${missionId}, so the ` +
        `link to spec ${prdId} was not written this tick rather than written over whatever is there.`,
    );
    return;
  }

  await recordLineage(supabase, row.user_id, {
    parent_kind: "prd",
    parent_id: prdId,
    child_kind: "mission",
    child_id: missionId,
    relation: "dispatched",
    rationale: "Dispatched by the autonomous driver",
    created_by_agent: agentSlug,
  });

  // CONFIRM IT LANDED. supabase-js RESOLVES a refused write rather than
  // rejecting it, and `recordLineage` returns void, so an awaited call that came
  // back cleanly is not evidence of a row. Read it back and report only a
  // definite absence.
  if ((await dispatchEdgeExists(supabase, prdId, missionId)) === false) {
    await reportLinkFailure(
      row,
      "prd->mission:dispatched:write-did-not-land",
      `Track ${row.id}: the prd -> mission edge from spec ${prdId} to mission ${missionId} ` +
        `is still absent after the write, so this build cannot be graded.`,
    );
  }
}

/**
 * The branch this track's work is on, or null. F-54.
 *
 * MEASURED LIVE ON `48eee889` AT 09:32:44 UTC, which is the only reason this
 * exists. `builder` committed 449 lines to `studio/01306607-acd0f5b0c46f` and
 * opened PR #3. `qa` then ran `repo.tree` and `repo.search` and reported:
 *
 *   "No notification digest implementation was found in the repository. The repo
 *    tree shows only checkout-related files in the src directory."
 *
 * True about the branch it read; false about the work. `repo.tree`'s `ref` is
 * optional and falls back to `getDefaultBranch(repo, headers)` — right for "what
 * is in this project", wrong for "check what was just built" — and nothing told
 * the seat a branch existed. **The checking seat has never once been able to see
 * the work it exists to check.**
 *
 * READ THROUGH THE MISSION, because that is the link that exists. `studio.stage`
 * writes the changeset against `mission_id`, and the driver already holds that id
 * at Build. Newest first, since `studio.commit` may append to a changeset across
 * several ticks and the branch is the same either way — but a superseded
 * changeset on the same mission would carry an older one.
 *
 * NULL IS THE ORDINARY CASE, not a failure: on the first Build tick nothing has
 * been staged yet, so there is no branch to name and the brief simply does not
 * mention one. Only when a branch exists does the instruction appear.
 */
async function openBranchForTrack(
  supabase: SupabaseClient,
  missionId: string | null,
): Promise<string | null> {
  if (!missionId) return null;
  try {
    const { data } = await supabase
      .from("studio_changesets")
      .select("branch")
      .eq("mission_id", missionId)
      .not("branch", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as { branch?: string | null } | null)?.branch ?? null;
  } catch (e) {
    // Reported, never guessed. A missing branch costs the seat the ref and it
    // reads the default — today's behaviour — rather than being handed a wrong one.
    console.error(
      `spine branch for mission ${missionId} failed: ${e instanceof Error ? e.message : String(e)}`,
    );
    return null;
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
 * THE MISSION IS ALSO TIED TO ITS SPEC HERE, on both the creation and the reuse
 * path, via `linkSpecToMission` — see its header for why that edge is the only
 * thing that makes an unwatched build gradeable.
 *
 * Returns null rather than throwing on any failure. A Build station that cannot
 * get a mission is the state we were already in, so it degrades to exactly the
 * old behaviour instead of costing the track its tick. A missing spec link never
 * reaches that branch: `linkSpecToMission` swallows its own failures precisely so
 * the mission survives them.
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
    if (found) {
      // On the reuse path too, so a refused edge repairs itself on the next
      // tick instead of being lost the moment the mission exists.
      await linkSpecToMission(supabase, row, found, agentSlug);
      return found;
    }

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
    // The spec -> mission link, written here as well as on the reuse path above
    // so a mission created this tick is gradeable from its first changeset.
    await linkSpecToMission(supabase, row, mission.id, agentSlug);
    return mission.id;
  } catch (e) {
    console.error(
      `spine mission for track ${row.id} failed: ${e instanceof Error ? e.message : String(e)}`,
    );
    return null;
  }
}

/**
 * The row's route, as the route module understands it.
 *
 * THE EMPTY-PATH DEFAULT IS THE SCHEMA'S OWN, not a guess this function makes,
 * and that is worth stating because `linkSpecToMission` now reads it to decide
 * whether to assert "Define was on this track's route and filed nothing".
 * Checked live on 2026-08-06: `spine_tracks.path` is `jsonb NOT NULL DEFAULT
 * '["sense","decide","define","design","build","ship","learn"]'`, so a track
 * whose route was never chosen IS a full-path track by the database's own rule,
 * and falling back to `AGENT_STATION_ORDER` reproduces that rule rather than
 * inventing one. Zero of the 43 live tracks have an empty or absent path.
 *
 * The only row this could misread is one written with an explicit `[]`, which
 * `validateRoute` rejects as `empty-path` and which nothing in the product
 * writes. If such a row ever appears, the fallback reads it as full-path and the
 * spec report above will fire on it; that is the known edge and it is cheaper to
 * name here than to guard against a state the schema forbids.
 */
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

/**
 * What has THIS station filed since the track arrived at it?
 *
 * THE QUESTION `attached` CANNOT ANSWER, and the gap between the two killed the
 * first end-to-end run this product ever attempted.
 *
 * `attached` is what the seats that ran IN THIS TICK filed. That is the same
 * thing as "what this station produced" only while a crew fits inside one tick.
 * When the Worker's clock cuts a crew short, `seat_cursor` parks the remaining
 * seats and the next tick resumes at one of them -- so the producing seat and
 * the checking seat land in DIFFERENT ticks, and the tick that finishes the crew
 * sees `attached.length === 0` while the station's artifact is sitting on the
 * record, filed by this station, during this same attempt.
 *
 * MEASURED 2026-08-24 on `f9e41393` in workspace `0b792d52`, at Decide, whose
 * crew is `strategist` then `critic`:
 *
 *   20:40:31  strategist  53.7s  -> decision eec7780d filed 20:41:28
 *   20:50:35  critic      21.0s  -> attached 0, held `produced-nothing`, attempt 1
 *   21:00:31  strategist  42.7s  -> decision e67ae002 filed 21:01:18
 *   21:10:01  critic      15.6s  -> attached 0, held `produced-nothing`, attempt 2
 *   21:20:01  strategist  41.6s  -> decision 7b43fd8e filed 21:20:46
 *   21:30:04  critic      18.9s  -> attached 0, held `produced-nothing`, attempt 3
 *   21:40     attempts >= MAX_STATION_ATTEMPTS -> `given-up`
 *
 * The station did its job three times, filed three decisions, and the driver
 * called it empty three times and gave up on it. Every strategist run exceeded
 * the 45s deadline on its own, so this track could NEVER have advanced: the
 * split was not bad luck, it was structural for any crew with a slow first seat.
 *
 * Scoped to the arrival rather than to the whole record on purpose. `filed`
 * already answers "what does this track hold", and using it here would let a
 * station advance on the strength of an artifact a PREVIOUS visit produced --
 * which is precisely the "reporting progress the work did not buy" that the
 * `produced-nothing` rule exists to prevent. The arrival timestamp is read from
 * the track's own `stage_events` trail, and a track that has never left the
 * station it was created at has no such row, so creation is the fallback.
 *
 * Costs one query and is asked ONLY on the resumed path, which is the only path
 * where the two questions can disagree.
 */
async function stationFiledSinceArrival(
  supabase: SupabaseClient,
  trackId: string,
  station: AgentStation,
  createdAt: string | null,
): Promise<boolean> {
  const { data: arrival } = await supabase
    .from("stage_events" as never)
    .select("at")
    .eq("entity_type", "spine_track")
    .eq("entity_id", trackId)
    .eq("to_stage", station)
    .order("at", { ascending: false })
    .limit(1);

  const since =
    (arrival as unknown as Array<{ at: string }> | null)?.[0]?.at ??
    createdAt ??
    // Unreadable trail and no creation stamp: fall back to answering "no", which
    // leaves the old behaviour in place. A guard that cannot read its evidence
    // must not be the thing that advances work.
    null;
  if (!since) return false;

  const { data: members } = await supabase
    .from("spine_track_members" as never)
    .select("artifact_id")
    .eq("track_id", trackId)
    .eq("station", station)
    .gte("created_at", since)
    .limit(1);

  return ((members as unknown as Array<unknown> | null)?.length ?? 0) > 0;
}

/**
 * Is the one precondition the loop cannot produce for itself satisfied?
 *
 * Only Discover has one: evidence has to enter the workspace from outside before
 * there is anything to gather. The answer changes the ESCALATION rather than the
 * spending, and the difference matters to whoever reads it. "There is nothing in
 * this workspace to gather, connect a source" is a job a person can do in a
 * minute. "There is evidence sitting there and Discover still files nothing" is
 * a broken station, and telling somebody to connect a source when one is already
 * connected wastes their time and their trust.
 *
 * Never a reason to run anything. It is read on the escalation path only, and
 * `null` (nobody could check) is read as not satisfied, so an unreadable table
 * can only ever make the loop more cautious.
 */
async function externalEvidence(
  supabase: SupabaseClient,
  workspaceId: string | null,
  /**
   * When this track was last considered. Anything that arrived after it is
   * evidence the station has never had a chance to read.
   *
   * Null means the track has never been driven, and then the question is simply
   * whether the workspace holds anything at all, because none of it has been
   * offered to this track yet.
   */
  since: string | null,
): Promise<boolean | null> {
  if (!workspaceId) return null;
  try {
    let q = supabase
      .from("signals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);
    // NEW EVIDENCE, NOT ANY EVIDENCE, and the difference decides whether the
    // loop keeps spending.
    //
    // This used to be an all-time workspace-wide count, which had two costs. It
    // made `needs-evidence` unreachable after the workspace's first signal ever,
    // so a starved Discover was always diagnosed as a broken one. And because
    // `needs-evidence` is resumable, a workspace holding any signal at all
    // resumed the moment it escalated: the ask was "answered" by a row that had
    // been sitting there for weeks, the station ran, filed nothing, spent three
    // more dispatches, escalated, and resumed again. A five-tick cycle billing a
    // full crew each lap, for a question nobody had answered.
    //
    // Measured against `driven_at`, the resume fires only when something has
    // actually landed since the loop last looked, which is what the escalation
    // asked for in the first place.
    if (since) q = q.gt("created_at", since);
    const { count, error } = await q;
    if (error) return null;
    return (count ?? 0) > 0;
  } catch {
    return null;
  }
}

/** What a correction did, in the shape driveTrackOnce returns. */
type CorrectionOutcome = {
  trackId: string;
  station: AgentStation;
  moved: boolean;
  arrivedAt: AgentStation | null;
  hold: HoldReason | null;
  line: string;
};

/**
 * Decide what to do about a station that could not finish, and do it.
 *
 * The rule is pure and lives in ./correction.ts, so everything here is the two
 * reads it needs and the write its answer implies. Returns null when the rule
 * says there is nothing to correct, which leaves the caller to report the hold
 * exactly as it did before.
 *
 * A GO-BACK THAT DOES NOT COMMIT RETURNS NULL, so the caller reports the
 * original hold. Announcing a correction the table did not take would be the
 * same class of lie `advanceTrack` was repaired for: a surface reporting
 * progress the work did not buy.
 */
async function correctIfPossible(
  supabase: SupabaseClient,
  row: DriveRow,
  at: {
    hold: HoldReason;
    station: AgentStation;
    route: SpineRoute;
    corrections: number;
    filed: string[];
  },
  /** F-55. Forwarded, not re-derived: a send-back was driven by whoever drove this tick. */
  via: DrivenVia,
): Promise<CorrectionOutcome | null> {
  if (!CORRECTABLE_HOLDS.has(at.hold)) return null;

  const need = STATION_NEEDS[at.station];
  // Read only when the station's precondition is one no station can file, which
  // today is Discover alone. Every other station is answered entirely from the
  // track's own record and costs no extra query.
  const externalMet =
    need.from === null ? await externalEvidence(supabase, row.workspace_id, row.driven_at) : null;

  const decision = decideCorrection({
    hold: at.hold,
    station: at.station,
    route: at.route,
    attempts: row.attempts ?? 0,
    corrections: at.corrections,
    filed: at.filed,
    externalMet,
    priorHold: (row.last_hold as HoldReason | null) ?? null,
  });

  if (decision.action === "retry") {
    if (!decision.resume) return null;
    // THE ASK WAS ANSWERED. Clearing the ceiling is the whole write: the station
    // is left exactly where it is, and the next tick drives it normally. Doing
    // it here rather than dispatching immediately keeps "one tick, one attempt
    // at one station" true, which is what `MAX_STATION_ATTEMPTS` counts.
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("spine_tracks" as never)
      .update({ attempts: 0, last_hold: null, driven_at: now, updated_at: now } as never)
      .eq("id", row.id);
    if (error) return null;
    return {
      trackId: row.id,
      station: at.station,
      moved: false,
      arrivedAt: null,
      hold: null,
      line: decision.because,
    };
  }

  if (decision.action === "go-back") {
    const moved = await applyCorrection(
      supabase,
      {
        id: row.id,
        title: row.title,
        user_id: row.user_id,
        workspace_id: row.workspace_id,
      },
      {
        from: at.station,
        to: decision.station,
        missing: decision.missing,
        kind: decision.kind,
      },
      via,
    );
    if (!moved) return null;
    return {
      trackId: row.id,
      station: at.station,
      // A correction is a move, and calling it one is what keeps the tick's own
      // account of the sweep honest. It is not FORWARD, which is why `arrivedAt`
      // names the earlier station and the line says "back".
      moved: true,
      arrivedAt: decision.station,
      hold: null,
      line: `${row.title} went back to ${decision.station} for a fix. ${decision.because}`,
    };
  }

  // ESCALATE AND GIVE-UP BOTH STOP, and they record a reason rather than a
  // status word. The persisted `last_hold` is the coarse shape so the surface
  // that lists work can render a sentence; the specific one, naming both
  // stations and the missing thing, is the line returned here and it is what the
  // tick's own record of the sweep carries.
  const hold = holdForCorrection(decision);
  await supabase
    .from("spine_tracks" as never)
    .update({ last_hold: hold, driven_at: new Date().toISOString() } as never)
    .eq("id", row.id);
  return {
    trackId: row.id,
    station: at.station,
    moved: false,
    arrivedAt: null,
    hold,
    line: decision.because,
  };
}

/**
 * When the forecast this track is graded against comes due, or null when the
 * track carries none. Reads the track's own decision member — the forecast is
 * written at Decide and nowhere else (F-61's lesson: a route that waived
 * Decide has nothing here, and this returns null rather than inventing a
 * date, so a forecastless track never gets the honest wait and falls through
 * to `produced-nothing`, which is the true reading of its state).
 *
 * Fail-soft to null on any read error: an unreachable table must degrade to
 * today's behaviour, never invent a wait.
 */
async function forecastDueDate(supabase: SupabaseClient, trackId: string): Promise<string | null> {
  try {
    const { data: member } = await supabase
      .from("spine_track_members" as never)
      .select("artifact_id")
      .eq("track_id", trackId)
      .eq("artifact_kind", "decision")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const decisionId = (member as { artifact_id?: string } | null)?.artifact_id;
    if (!decisionId) return null;
    const { data: decision } = await supabase
      .from("decisions" as never)
      .select("forecast_horizon_date")
      .eq("id", decisionId)
      .maybeSingle();
    const iso = (decision as { forecast_horizon_date?: string | null } | null)
      ?.forecast_horizon_date;
    return iso ?? null;
  } catch {
    return null;
  }
}

/**
 * S0-001: SELF-VERIFYING SPINE — Check if a station's output meets quality before advancing.
 *
 * Applied AFTER the crew completes and files output. Returns whether the output
 * quality is good enough to hand to the next station. If not, the track is held
 * at "self-check-failed" and re-driven on the next tick.
 *
 * This implements Devin's pattern: do the work, reread the output, verify it
 * against the task, and if it fails, retry with the failure in context. The
 * verification is done here; retries happen by re-dispatching the station.
 */
async function verifyStationOutput(
  supabase: SupabaseClient,
  station: AgentStation,
  attached: Attachment[],
): Promise<{ passed: boolean; reason?: string }> {
  // If no output was produced, the existing `produced-nothing` hold is sufficient
  if (attached.length === 0) {
    return { passed: true }; // No output, so no verification needed
  }

  // Group attached artifacts by kind
  const byKind = new Map<string, string[]>();
  for (const att of attached) {
    if (!byKind.has(att.artifactKind)) {
      byKind.set(att.artifactKind, []);
    }
    byKind.get(att.artifactKind)!.push(att.artifactId);
  }

  // Station-specific quality checks. Each check verifies that:
  // 1. The right KIND of artifact was produced
  // 2. The artifact has the right STRUCTURE (not empty, has required fields)
  //
  // The checks are lenient: they verify the bare minimum to know the work was
  // actually done, not that it was done well. A signal that exists but is
  // vague is still a signal; a decision with a forecast is still a decision.

  if (station === "sense") {
    // Sense must file signals
    const signalIds = byKind.get("signal") ?? [];
    if (signalIds.length === 0) {
      return { passed: false, reason: "No signals were filed" };
    }
    // Check that signals have content (not empty strings)
    const { data: signals } = await supabase
      .from("signals" as never)
      .select("id, title")
      .in("id", signalIds);
    const hasContent = (signals ?? []).some(
      (s: { title?: string }) => s.title && s.title.trim().length > 0,
    );
    if (!hasContent) {
      return { passed: false, reason: "Signals were filed but have no content" };
    }
    return { passed: true };
  }

  if (station === "decide") {
    // Decide must file decisions
    const decisionIds = byKind.get("decision") ?? [];
    if (decisionIds.length === 0) {
      return { passed: false, reason: "No decision was recorded" };
    }
    // Check that decisions have a forecast (the key output of Decide)
    const { data: decisions } = await supabase
      .from("decisions" as never)
      .select("id, forecast_text, forecast_horizon_date")
      .in("id", decisionIds);
    const hasForecast = (decisions ?? []).some(
      (d: { forecast_text?: string; forecast_horizon_date?: string }) =>
        (d.forecast_text && d.forecast_text.trim().length > 0) ||
        d.forecast_horizon_date,
    );
    if (!hasForecast) {
      return { passed: false, reason: "Decision was recorded but has no forecast" };
    }
    return { passed: true };
  }

  if (station === "define") {
    // Define must file specs (prds)
    const specIds = byKind.get("prd") ?? [];
    if (specIds.length === 0) {
      return { passed: false, reason: "No spec was drafted" };
    }
    // Check that specs have content
    const { data: specs } = await supabase
      .from("prds" as never)
      .select("id, title, brief")
      .in("id", specIds);
    const hasContent = (specs ?? []).some(
      (p: { title?: string; brief?: string }) =>
        (p.title && p.title.trim().length > 0) ||
        (p.brief && p.brief.trim().length > 0),
    );
    if (!hasContent) {
      return { passed: false, reason: "Spec was drafted but has no content" };
    }
    return { passed: true };
  }

  if (station === "design") {
    // Design must file design artifacts
    const designIds = byKind.get("design_memory") ?? [];
    if (designIds.length === 0) {
      return { passed: false, reason: "No design was drafted" };
    }
    return { passed: true };
  }

  if (station === "build") {
    // Build must file missions or stages (changes made to code)
    const hasMission = (byKind.get("mission") ?? []).length > 0;
    if (!hasMission) {
      return { passed: false, reason: "No changes were staged for commit" };
    }
    return { passed: true };
  }

  if (station === "ship") {
    // Ship must file deployments
    const deploymentIds = byKind.get("deployment") ?? [];
    if (deploymentIds.length === 0) {
      return { passed: false, reason: "No deployment was recorded" };
    }
    return { passed: true };
  }

  if (station === "learn") {
    // Learn must file verdicts (verification results)
    const verdictIds = byKind.get("verdict") ?? [];
    if (verdictIds.length === 0) {
      return { passed: false, reason: "No verdict was recorded" };
    }
    return { passed: true };
  }

  // Unknown station, default to pass (no verification rule)
  return { passed: true };
}

export async function driveTrackOnce(
  supabase: SupabaseClient,
  row: DriveRow,
  /**
   * F-55. WHO ASKED FOR THIS DRIVE — the sweep, or a person pressing the control.
   *
   * REQUIRED, AND THAT IS THE WHOLE POINT. It sits before the optional deadline
   * so every caller has to state it; a defaulted version would silently answer
   * for a caller that never considered the question, and the answer it invented
   * would be the one that CLAIMS autonomy. A required parameter cannot be
   * forgotten. There are exactly two callers and both now say which they are.
   *
   * WHAT IT COSTS TO NOT HAVE IT, measured: on 2026-08-25 a session read
   * `SELECT from_stage, to_stage, actor, at FROM stage_events`, saw `system` on
   * every row of track `48eee889`'s walk, and reported it as unattended. Another
   * session had driven it by hand. `actor` was correct and answers a
   * neighbouring question — **`driveTrackOnce` stamps `system` either way** — so
   * acceptance criterion 2 was, until this parameter, not provable by anything.
   */
  via: DrivenVia,
  /**
   * When the TICK started, not when this track did.
   *
   * The deadline is the sweep's, shared across every track it drives, because
   * the thing being protected is the Worker's request budget and that is spent
   * by all of them together. Defaults to now, so a caller driving one track by
   * hand gets the full window.
   */
  tickStartedAtMs: number = Date.now(),
): Promise<DriveOutcome> {
  const route = routeOf(row);
  const station = row.station as AgentStation;

  /*
   * F-55. STAMPED ON ENTRY, ONCE, RATHER THAN ON EACH WAY OUT.
   *
   * `driven_at` is written on eight different exit paths, and adding a ninth
   * field to all eight is how two columns that must agree drift apart. This one
   * is known before anything happens and cannot change during the drive, so it
   * is written once, here.
   *
   * ON ENTRY SPECIFICALLY, because the case that matters most produces no exit
   * row worth reading. **A person pressing "run" on a track that then holds is
   * exactly the "unsticking" acceptance criterion 2 forbids** — and it writes no
   * `stage_events` row at all, because nothing moved. A field recorded only on
   * transitions would miss every one of those, which is the half of criterion 2
   * that is about intervention rather than about progress.
   *
   * Unchecked on purpose: a failed write leaves NULL, which reads as "does not
   * know" and can never be counted as evidence of an unattended run. The
   * expensive direction is a false claim of autonomy, and this fails away from it.
   *
   * ── F-62. THE SLOT IS NOT ENOUGH, AND THE LOG GOES FIRST ──────────────────
   *
   * Everything above is true and it is still one column, last-write-wins. A
   * person presses run on a stalled track at 10:05, the sweep drives it at
   * 10:15, and this column now reads `sweep`: **the next tick erases the
   * evidence of the intervention it should disqualify.** Measured, that is the
   * common case rather than the corner — 2,199 `agent_runs` carry a `track_id`
   * against 127 `spine_track` transitions, so ~94% of drives never write a
   * transition row and this slot is all they ever had.
   *
   * `track_drives` is the same fact APPENDED. The log is written BEFORE the
   * slot, deliberately: if only one of the two survives a crash between them,
   * the one worth keeping is the one that cannot be overwritten.
   *
   * THE SLOT STAYS, and is not being replaced. A missing log row reads as "no
   * drive happened", which is the unsafe direction, so the column beside it is
   * the second witness: disagree with the newest `track_drives` row and the log
   * lost something, and the run is not provable.
   */
  await recordTrackDrive(supabase, {
    trackId: row.id,
    station,
    via,
    // Known here and nowhere later. A press against a non-null hold is a person
    // reaching for a stalled track, which is the sentence criterion 2 forbids.
    entryHold: (row.last_hold ?? null) as HoldReason | null,
  });

  await supabase
    .from("spine_tracks" as never)
    .update({ last_driven_via: via } as never)
    .eq("id", row.id);

  // Catch the record up on gates answered since the last tick BEFORE deciding
  // anything. A person may have approved a call while the workspace was paused
  // or while this track was held, and the artifact that produced belongs to the
  // track whether or not this tick is allowed to run anything.
  const gates = await harvestAnsweredGates(supabase, row);
  const harvested = gates.filed;

  // Read AFTER the harvest, so a spec approved through a gate since the last
  // tick is in the brief of the station that runs now rather than one tick late.
  const upstream = await loadUpstream(supabase, row.id);

  // WHAT THIS TRACK HAS ALREADY BEEN SENT BACK FOR (founder ruling 2026-08-02).
  // Read once and used three times: the correction rule needs the count as its
  // budget, the crew about to run needs to be told what it is being asked to
  // fix, and a station that finally finishes after a correction needs to know
  // that so the lesson can be written as confirmed rather than as a guess.
  const history = await readCorrections(supabase, row.id);
  /** The artifact kinds on this track's record, which is what a station HAS. */
  const filed = upstream.map((a) => a.kind);

  const decision = decideDrive({
    upstream,
    stationDrives: (row as { station_drives?: number | null }).station_drives ?? 0,
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
    // So the ceiling can tell a station that failed from an account that could
    // not pay. Without it a track frozen while the account was empty stays
    // frozen after it is topped up, which is how 26 tracks came to be sitting at
    // `station-cannot-finish` behind a balance of zero.
    lastHold: (row.last_hold ?? null) as HoldReason | null,
  });

  if (!decision.act) {
    // THE CORRECTION LOOP (founder ruling 2026-08-02: "if something is moving
    // forward, something messed up, an agent should automatically learn, go
    // back, correct it, and come back... across all seven stages").
    //
    // THIS IS WHERE THE WORK USED TO FREEZE. `stalled` was terminal by omission:
    // `decideDrive` returned it at the attempt ceiling and nothing anywhere read
    // it back, so the track sat here forever having its hold rewritten every ten
    // minutes. Nine live tracks were in exactly that state on 2026-08-02.
    //
    // IT RUNS ON THE HELD PATH RATHER THAN AT THE MOMENT OF FAILURE, and that is
    // the reason the tracks already frozen get a way out. A correction decided
    // where the failure happens would only ever apply to failures that happen
    // after this ships; deciding it where the track is HELD means every track
    // sitting at the ceiling today is corrected on the next tick, with no
    // backfill and nothing to run by hand. It also spends nothing extra: this
    // path already runs, and the decision itself is two small reads.
    const corrected = await correctIfPossible(
      supabase,
      row,
      {
        hold: decision.hold,
        station,
        route,
        corrections: history.count,
        filed,
      },
      via,
    );
    if (corrected) {
      return {
        ...corrected,
        attached: harvested,
        line: harvested.length
          ? `${describeAttachments(harvested)} ${corrected.line}`
          : corrected.line,
      };
    }

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

  /*
   * LEARN'S HONEST WAIT (ruled by A, concurred by B, 2026-08-25). A learn
   * crew whose forecast is not yet due cannot file a verdict without
   * guessing — `learning.record`'s own description forbids the call — so a
   * track already holding `needs-evidence` here is waiting on TIME, and
   * re-dispatching its crew every tick until the horizon would spend money
   * asking a question whose answer is a date. The FIRST learn visit still
   * dispatches (the crew says what is already observable, on the record, in
   * its own words); every pass after that returns the same dated hold for
   * free until the forecast comes due, and the sweep picks it up the tick
   * after.
   */
  if (station === "learn" && row.last_hold === "needs-evidence") {
    const dueIso = await forecastDueDate(supabase, row.id);
    if (dueIso && Date.parse(dueIso) > Date.now()) {
      await supabase
        .from("spine_tracks" as never)
        .update({ driven_at: new Date().toISOString() } as never)
        .eq("id", row.id);
      return {
        trackId: row.id,
        station,
        moved: false,
        arrivedAt: null,
        hold: "needs-evidence",
        line: `The forecast this work is graded against comes due on ${dueIso.slice(0, 10)}. Learn returns when it does; nothing here is waiting on a person.`,
        attached: harvested,
      };
    }
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
  /*
   * F-43 — COUNT THE DISPATCH BEFORE IT HAPPENS, not after it succeeds.
   *
   * Written here rather than on the way out because every path out of this
   * function is a path this station was dispatched on, and the two most
   * expensive ones — `out-of-time` and a thrown seat — are exactly the paths
   * that used to leave no trace. A counter incremented only on the tidy exits
   * would have missed all 316 of the dispatches that prompted this.
   *
   * Best-effort: a counter that fails to write must never stop real work. It
   * costs one small update on a path that is about to spend dollars on model
   * calls.
   */
  try {
    await supabase
      .from("spine_tracks" as never)
      .update({
        station_drives: ((row as { station_drives?: number | null }).station_drives ?? 0) + 1,
      } as never)
      .eq("id", row.id);
  } catch {
    /* a missed count is cheaper than a refused dispatch */
  }

  let failed: string | null = null;
  /** The thrown value, kept so its code survives the reduction to a message. */
  let failedError: unknown = null;
  let steps: ToolStepLike[] = [];
  // F-41. The trace is how a refusal is PROVED rather than inferred: it is the
  // join key on `tool_calls`, where a failed tool records the message the
  // provider actually returned. `refusedTool(steps)` reads the in-memory account
  // of the same run and is tried first because it is free; this is the fallback
  // that does not depend on step plumbing surviving the dispatch.
  const traceIds: string[] = [];
  const crew = stationCrew(station);
  const brief = [...upstream];

  // WHY THIS STATION IS RUNNING AGAIN, when the work was sent back to it.
  //
  // THE DETERMINISTIC HALF OF THE LEARNING, and without it the correction loop
  // is an expensive retry. A station handed corrected work with no idea what
  // went wrong files the same thing it filed the first time, the station ahead
  // fails on it again, and the only thing the round trip bought was another
  // three dispatches. The sentence is rebuilt from the track's own recorded
  // transition rather than stored, so it costs no model call and cannot go
  // stale; `rememberCorrection` is the compounding half that reaches every
  // future track.
  //
  // The kind is recomputed rather than remembered because it is a function of
  // what is on the record right now: if the thing the failing station needed is
  // present, the problem is that it was not good enough, and telling the station
  // "it is missing" when it is sitting there would be wrong by the time it read
  // it.
  const backNote =
    history.last && history.last.to === station
      ? correctionNote(
          history.last.from,
          station,
          needIsMet(STATION_NEEDS[history.last.from], filed) ? "not-enough" : "absent",
        )
      : null;
  const cap = await resolveTrackSpendCap(
    supabase,
    row.workspace_id,
    row.spend_cap_usd ?? undefined,
  );
  let spent = Number(row.spend_used_usd ?? 0);
  let overBudget = false;
  let ranLong = false;
  /** The seat the clock stopped us before reaching, so the next tick starts there. */
  let ranLongAtSeat = 0;
  /**
   * The seat this tick began at. Non-zero means the previous tick's clock cut
   * this same station's crew short and the seats before this index already ran,
   * in this same attempt, with whatever they filed already on the record.
   * Hoisted out of the loop because the verdict below has to know it.
   */
  let startSeat = 0;
  /**
   * The hold a halted seat asks for, or null if no seat halted.
   *
   * A halt is a boundary stopping the work, never the station failing at it, so
   * every hold this can carry is one the driver declines to count as an attempt.
   * See `HALT_HOLD`.
   */
  let haltedAs: HoldReason | null = null;
  /**
   * F-68 — the first seat this tick that reported an outcome its own calls
   * refuse to support, or null when every seat's account holds up.
   *
   * Declared beside `haltedAs` and outside the try for the same reason: every
   * path out of this function below the crew loop has to be able to say it.
   * First one only. A second sentence about the same tick adds nothing a person
   * can act on, and the fix for one is the fix for both.
   */
  let overclaim: Overclaim | null = null;
  /** What the crew filed, accumulated seat by seat as each one runs. */
  const made: Attachment[] = [];
  try {
    // Build is the one station whose tool refuses without a mission, so the
    // driver opens one for it. Every other station is dispatched exactly as
    // before, because a mission they never use would be a noun with no referent
    // cluttering the record.
    //
    // ONE CONSEQUENCE IS LOAD-BEARING AT LEARN, and it is named here because a
    // reader arriving at this line is the one who needs it: `missionId` is null
    // at Learn, so `learning.record`'s mission -> decision -> spec recovery
    // cannot fire on this route. Hoisting the mission out of this ternary is NOT
    // the fix — it revives the first hop and the second stays dead, because
    // `decisions.prd_id` is null by construction at Decide.
    //
    // THE FIX IS NO LONGER `specId` BELOW, and that correction matters because the
    // old one was a contract enforced by prose: it handed the analyst the id and
    // asked it to pass `prd_id`, which works when the model complies and silently
    // produces an orphan verdict when it does not. `learning.record` now reads the
    // spec off `spine_track_members` using `ToolCtx.trackId`, which this loop
    // already passes. `specId` stays in the brief because telling the agent which
    // spec it is grading is worth doing on its own.
    const missionId =
      station === "build" ? await missionForTrack(supabase, row, decision.agentSlug) : null;

    /*
     * WHERE THIS CREW STARTS, which until 2026-08-22 was always the first seat.
     *
     * The deadline this loop checks belongs to the TICK, shared by every track
     * the sweep drives, and a station is up to three agent dispatches. So a
     * station that does not fit in the window left to it paid for its first seat,
     * broke on the clock, and then began again at that same seat on the next
     * tick, forever. Measured: four tracks, every one holding `out-of-time` with
     * `attempts` still 0 and real dollars on the clock, while ten consecutive
     * ticks ran 46s to 107s against a 45s deadline.
     *
     * Clamped rather than trusted. A crew that got shorter between deploys would
     * otherwise leave a cursor past its own end and skip the station's work
     * entirely, which is the one outcome worse than repeating it, so an
     * out-of-range cursor restarts the crew.
     */
    startSeat = resumeSeatFrom(row.seat_cursor, crew.length);
    for (let seatIndex = startSeat; seatIndex < crew.length; seatIndex++) {
      const seat = crew[seatIndex];
      // THE CEILING WHERE THE AUTONOMY IS. Checked before each seat rather than
      // once per tick, because a crew is two or three dispatches and a budget
      // checked only at the top would be overrun by the rest of the crew before
      // anything looked again.
      if (isOverTrackBudget(spent, cap)) {
        overBudget = true;
        break;
      }

      // The Worker's clock, checked in the same place as the money. A crew is
      // several dispatches and this sweep drives up to five tracks, so a tick
      // that keeps starting seats is eventually killed between two writes and
      // loses the record of what it produced. Stopping cleanly here leaves the
      // track exactly where it is for the next tick to pick up.
      if (outOfTime(tickStartedAtMs, Date.now())) {
        ranLong = true;
        // Checked BEFORE this seat runs, so this index is the seat still owed
        // rather than the last one paid for. Resuming here repeats nothing.
        ranLongAtSeat = seatIndex;
        break;
      }

      // THE SPEC LEARN GRADES AGAINST, named in the brief because nothing else
      // can supply it on this route.
      //
      // `learning.record` resolves a missing `prd_id` through
      // mission -> decision -> spec. That recovery is unreachable here and
      // hoisting the mission out of the Build ternary above would not revive it:
      // it would revive the first hop only, because `decision.record` at Decide
      // has no spec to name and `decisions.prd_id` is null by construction on
      // this route. Live: the one track that completed the loop autonomously
      // recorded two verdicts with prd_id, opportunity_id and mission_id all null.
      //
      // WHAT THIS LINE IS AND IS NOT. It tells the agent which spec it is looking
      // at, which is worth doing. It is NOT what guarantees the verdict attaches:
      // that was the old claim here, and it rested on the model choosing to copy
      // the id into a tool argument. `learning.record` now reads the spec off the
      // track through `ToolCtx.trackId`, so the link holds whether or not the
      // agent cooperates.
      //
      // Read off `brief`, not with a query. It is the same list the agent is
      // being shown, so the brief can never name a spec the agent was not given,
      // and it grows as the crew files.
      const specId = newestSpecId(brief);
      // F-54. Only Build reads a repo tree, so only Build is asked.
      const workBranch = station === "build" ? await openBranchForTrack(supabase, missionId) : null;

      const result = await runAgentLoop(supabase, row.user_id, {
        agentSlug: seat.slug,
        goal: stationGoal(
          station,
          { title: row.title, origin: row.origin },
          brief,
          seat,
          backNote,
          specId,
          workBranch,
        ),
        workspaceId: row.workspace_id,
        missionId,
        // So every run is attributable to the work it was doing. This is what
        // lets a person see who acted on their behalf at which station and what
        // came of it; without it six of seven stations produce runs no surface
        // can tie back to anything.
        trackId: row.id,
      });
      // The run's own account of what it did. This is the only channel that ties
      // an artifact to THIS track rather than to whatever happened to be created
      // around the same time; the full argument is in the header of ./attach.ts.
      steps = [...steps, ...(result.steps ?? [])];
      if (result.trace_id) traceIds.push(result.trace_id);
      queued += result.approvals_queued ?? 0;

      /*
       * F-68 — CHECK THE SEAT'S ACCOUNT AGAINST THE SEAT'S OWN CALLS.
       *
       * Here, inside the loop, because this is the only point where one seat's
       * sentence and one seat's trace are both in hand. Out at the verdict the
       * steps are already merged across the crew and the seat that spoke can no
       * longer be told from the seat that acted, which would turn a provable
       * contradiction into an inference about which agent meant what.
       *
       * Costs nothing on the ordinary path: `outcomeClaims` is a regular
       * expression over one string and returns empty for every seat that did
       * not claim a commit, a merge or a pull request, and the query never runs.
       */
      if (!overclaim) {
        overclaim = await overclaimedBySeat(supabase, seat.slug, result);
        if (overclaim) {
          // Loud, and once. The sentence added below travels only as far as
          // whoever reads this drive, and a run nobody watched still wrote the
          // claim, so it has to reach the Worker log too.
          console.warn(`[driver] ${row.id} ${station}: ${overclaimLine(overclaim)}`);
        }
      }

      /*
       * A RUN THE LOOP HALTED IS NOT A STATION THAT FAILED.
       *
       * The `if (failed)` branch below has the right rule for an empty account
       * and can no longer reach it: it fires on a THROWN dispatch, and
       * `executeLoop` stopped throwing. `CreditExhaustedError` is caught in
       * there, the run is marked `halted` and refunded, and the call RETURNS
       * normally carrying `halted: { kind: "out_of_credit" }` -- on purpose, so
       * a wallet event stays out of the failure counts. From out here that is
       * indistinguishable from a clean run that filed nothing, so it recorded
       * `produced-nothing` and spent one of the station's three attempts.
       *
       * MEASURED 2026-08-25 00:00 UTC: all three Discover seats halted on
       * "balance (13) is below the projected cost (16)" and the live track went
       * from attempts 1 to attempts 2 for it. Three of those is `given-up`,
       * which is the 2026-08-02 freeze this driver already fixed once.
       *
       * Breaks the CREW, not just the seat: the seats after this one are briefed
       * on what it filed, and an account that cannot pay for seat one cannot pay
       * for seat two either.
       */
      if (result.halted) {
        haltedAs = holdForHalt(result.halted.kind);
        if (haltedAs) break;
      }

      // Charged from the run's OWN row, not estimated. Accrued before the gate
      // check below, because a seat that spent real money and then stopped at a
      // boundary still spent it.
      spent += await costOfRun(supabase, result.run_id);

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
    // THE ERROR ITSELF, not only its sentence. isEnvironmentFailure decides
    // whether this cost the track an attempt, and the runtime's credit errors
    // carry a readonly `code` that says so exactly. Reducing them to a message
    // first threw that away and left a substring test standing in for a fact.
    failedError = e;
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
  /**
   * F-68 — every sentence about this tick says so when a seat overclaimed.
   *
   * Wrapped around the line rather than folded into one hold, because the
   * contradiction is orthogonal to why the track stopped: a station can
   * overclaim and then move, or overclaim and then run out of time, and a
   * person reading either one needs the same warning. It NEVER replaces the
   * reason and never changes the hold.
   */
  const flagged = (line: string) => (overclaim ? `${line} ${overclaimLine(overclaim)}` : line);
  const say = (line: string) => {
    const made = describeAttachments(attached);
    return flagged(made ? `${line} ${made}` : line);
  };

  // Remember every gate this run opened, so whatever the person approves is
  // filed against this track when it eventually runs. Without this the work
  // produced through a boundary is the only work with no record of membership,
  // which is exactly backwards for a product whose claim is that the crossings
  // are on the record.
  const opened = gatesOpenedBy(steps, station);
  await rememberGates(supabase, row, opened);

  // THE METER IS PERSISTED ON EVERY PATH OUT, before any branch below returns.
  // A tick that spent money and then held at a gate, stalled, or ran out of
  // budget has still spent it, and a counter that only advances on the happy
  // path is a budget that resets itself every time work gets interesting.
  //
  // THE SEAT CURSOR RIDES THE SAME WRITE, so it can never disagree with the
  // money. Set only when the clock cut the crew short, and cleared to zero on
  // every other way out of this function. A crew stopped by a human gate, a
  // budget ceiling, a failure, or simply finishing is NOT a crew part way
  // through its seats, and resuming one of those would skip work rather than
  // repeat it, which is the worse of the two mistakes.
  await supabase
    .from("spine_tracks" as never)
    .update({ spend_used_usd: spent, seat_cursor: ranLong ? ranLongAtSeat : 0 } as never)
    .eq("id", row.id);

  // Out of TIME, ours rather than the station's, so it is reported before the
  // budget hold and never counts as an attempt. The work is fine and the money
  // is fine; the Worker driving it has a duration limit.
  if (ranLong) {
    await supabase
      .from("spine_tracks" as never)
      .update({ last_hold: "out-of-time", driven_at: new Date().toISOString() } as never)
      .eq("id", row.id);
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      hold: "out-of-time",
      line: say(HOLD_LINE["out-of-time"]),
      attached,
    };
  }

  /*
   * A BOUNDARY STOPPED THE RUN. Reported, never counted as an attempt.
   *
   * Sits here, beside `out-of-time` and `over-budget`, because it is the same
   * kind of fact: the station was never given its chance, so spending one of its
   * three attempts on this would be counting our problem against its record.
   * `HALT_HOLD` carries the whole argument and the measurement behind it.
   *
   * Before the `failed` branch on purpose: a halted run did not throw, so that
   * branch would not fire, and if it ever did it would record `stalled` and
   * count an attempt for a run that never started.
   */
  if (haltedAs) {
    await supabase
      .from("spine_tracks" as never)
      .update({ last_hold: haltedAs, driven_at: new Date().toISOString() } as never)
      .eq("id", row.id);
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      hold: haltedAs,
      line: flagged(holdLine(haltedAs, { station }) ?? HOLD_LINE[haltedAs]),
      attached,
    };
  }

  // Out of budget. Not a failure and not a refusal: the work is fine, the money
  // is finished. It deliberately does NOT count as an attempt, because attempts
  // exist to stop a station that cannot do its job, and this one was never given
  // the chance. Raising the ceiling resumes exactly where it stopped.
  if (overBudget) {
    await supabase
      .from("spine_tracks" as never)
      .update({ last_hold: "over-budget", driven_at: new Date().toISOString() } as never)
      .eq("id", row.id);
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      hold: "over-budget",
      line: say(HOLD_LINE["over-budget"]),
      attached,
    };
  }

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
  //
  // UNLESS THE STATION NEVER GOT TO RUN, which is a live defect this now closes.
  // `assertCredits` throws before a single token is spent, so an empty account
  // produced a "failure" that was not the station's, counted an attempt, and
  // froze the track after three ticks having never once dispatched it. Three of
  // the nine tracks frozen on 2026-08-02 were exactly that: `spend_used_usd = 0`
  // and nothing behind them but credit refusals. It is the same shape as
  // `out-of-time` one line above, so it is treated the same way: reported, never
  // counted, resumed by topping the account up.
  if (failed) {
    const outside = isEnvironmentFailure(failedError ?? failed);
    const hold: HoldReason = outside ? "out-of-credit" : "stalled";
    await supabase
      .from("spine_tracks" as never)
      .update({
        ...(outside ? {} : { attempts: (row.attempts ?? 0) + 1 }),
        last_hold: hold,
        driven_at: new Date().toISOString(),
      } as never)
      .eq("id", row.id);
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      hold,
      line: flagged(
        outside
          ? (holdLine(hold, { station }) ?? HOLD_LINE[hold])
          : `${station} did not complete: ${failed}`,
      ),
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
  //
  // UNLESS THE CLOCK SPLIT THE CREW, which is a different sentence wearing the
  // same clothes. `attached` is this TICK's output; on a resumed crew the seats
  // that produced ran in the previous tick and their rows are already on the
  // record. Asking the record directly is the only way to tell "the station
  // filed nothing" from "the station filed something and then we came back for
  // the rest of its crew". See `stationFiledSinceArrival` for the six live ticks
  // that made this necessary. Asked only when resumed, so the ordinary path
  // costs nothing and behaves exactly as it did.
  const producedThisVisit = didStationProduce({
    attachedCount: attached.length,
    startSeat,
    filedAtStationSinceArrival:
      attached.length === 0 && startSeat > 0
        ? await stationFiledSinceArrival(supabase, row.id, station, row.created_at ?? null)
        : null,
  });

  /*
   * F-41 — A STATION THAT WAS REFUSED IS NOT A STATION THAT FAILED.
   *
   * Same rule as the halt branch above, one level out. A run whose TOOL was
   * refused filed nothing for a reason that has nothing to do with the work,
   * and the two must not share a hold: `produced-nothing` counts an attempt,
   * and three of those hand the work to `decideCorrection`, which sends it
   * upstream to be rewritten. On 2026-08-25 that took a correct spec, six good
   * tasks and a real prototype and threw them back at Plan because GitHub
   * returned 401 three times.
   *
   * So: no attempt is counted, no correction is triggered, and the hold NAMES
   * the tool and the refusal — which is what R-16 asks for and what
   * "this station filed nothing" could never give.
   */
  const refusal = producedThisVisit
    ? null
    : (refusedTool(steps) ?? (await refusedToolInTraces(supabase, traceIds)));

  if (refusal) {
    await supabase
      .from("spine_tracks" as never)
      .update({
        // attempts deliberately UNCHANGED.
        last_hold: "tools-refused",
        driven_at: new Date().toISOString(),
      } as never)
      .eq("id", row.id);
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      hold: "tools-refused",
      line: flagged(
        `${holdLine("tools-refused", { station }) ?? HOLD_LINE["tools-refused"]} It was ${refusal.tool}, which said: ${refusal.error}`,
      ),
      attached,
    };
  }

  /*
   * S0-001 — A STATION PRODUCED OUTPUT BUT IT FAILED SELF-VERIFICATION.
   *
   * If the crew filed artifacts and nothing else stopped it (no refusal, no
   * timeout), verify that the output quality is good enough to hand to the next
   * station. If verification fails, hold at "self-check-failed" without counting
   * an attempt, so the station can retry and improve the work on the next tick.
   *
   * This is NOT a failure condition: the work exists and the crew ran cleanly.
   * It is a quality gate the station applies to itself before advancing, using
   * Devin's pattern (check, reread, retry if fails).
   */
  if (producedThisVisit && !failed && !haltedAs && !overBudget && !ranLong) {
    const verification = await verifyStationOutput(supabase, station, attached);
    if (!verification.passed) {
      await supabase
        .from("spine_tracks" as never)
        .update({
          // attempts deliberately UNCHANGED: quality check is not a failure.
          last_hold: "self-check-failed",
          driven_at: new Date().toISOString(),
        } as never)
        .eq("id", row.id);
      return {
        trackId: row.id,
        station,
        moved: false,
        arrivedAt: null,
        hold: "self-check-failed",
        line: say(
          `${holdLine("self-check-failed", { station }) ?? HOLD_LINE["self-check-failed"]}` +
            (verification.reason ? ` (${verification.reason})` : ""),
        ),
        attached,
      };
    }
  }

  /*
   * LEARN THAT FILED NOTHING BEFORE ITS HORIZON IS WAITING, NOT FAILING.
   * `learning.record` is Learn's only arrival path and its own description
   * forbids a pre-horizon verdict, so an honest crew here files nothing by
   * DESIGN. Counting that as `produced-nothing` burned three attempts on
   * obedience and handed the track to the correction loop for doing the right
   * thing. `needs-evidence` is the product's own word for it — resumable, no
   * attempt — and the line carries the date so a person reading a stalled
   * board can tell "waiting on time" from "waiting on me" without opening
   * anything. Past the horizon this branch declines and the ordinary
   * `produced-nothing` below applies in full: evidence in, nothing filed IS a
   * failure then.
   */
  if (!producedThisVisit && station === "learn") {
    const dueIso = await forecastDueDate(supabase, row.id);
    if (dueIso && Date.parse(dueIso) > Date.now()) {
      await supabase
        .from("spine_tracks" as never)
        .update({
          // attempts deliberately UNCHANGED: honesty must not cost the station.
          last_hold: "needs-evidence",
          driven_at: new Date().toISOString(),
        } as never)
        .eq("id", row.id);
      return {
        trackId: row.id,
        station,
        moved: false,
        arrivedAt: null,
        hold: "needs-evidence",
        line: say(
          `The forecast this work is graded against comes due on ${dueIso.slice(0, 10)}. Learn returns when it does; nothing here is waiting on a person.`,
        ),
        attached,
      };
    }
  }

  if (!producedThisVisit) {
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
      line: flagged(HOLD_LINE["produced-nothing"]),
      attached,
    };
  }

  const arrivedAt = nextStation(route, station);

  /**
   * THE STATION FILED SOMETHING, AND NOT WHAT COMES NEXT NEEDS.
   *
   * The check above asks "did this station file anything". That is not the same
   * question as "can the next station work from what is now on the record", and
   * they come apart exactly when a station does the wrong job well.
   *
   * The live shape: Plan's crew is two seats, `prd-writer` filing a spec and
   * `sprint-planner` filing tasks. If the spec never lands and a task does,
   * `attached` is non-empty, the old rule advanced, and Design was handed nothing
   * to design against. Build then reported -- correctly -- that it had been given
   * nothing to build. That is the same "seven strangers" failure the handoff was
   * built to end, arriving through the one door still open to it.
   *
   * WHY THE PREDICATE IS THE NEXT STATION'S OWN NEED, and not this station's
   * expected artifact. `STATION_ARTIFACT` says what a station is FOR, and its own
   * header forbids using it as a filter, for a good reason: Discover legitimately
   * produces signals OR themes, and a clustering pass that files only themes has
   * done real work. Asking `STATION_NEEDS[next]` instead is both looser and more
   * honest -- it accepts any artifact the next station can actually use, and it is
   * the same rule the correction loop already applies, so a track cannot be
   * advanced into a station that the correction loop would immediately declare
   * starved.
   *
   * IT COUNTS AN ATTEMPT, like produced-nothing, so a station doing the wrong job
   * repeatedly reaches a person the same day rather than looping. And it is a
   * SEPARATE hold, because "filed nothing" and "filed the wrong thing" have
   * different causes and different fixes, and a record that flattens them hands a
   * person a word instead of an answer.
   *
   * Nothing to check when the route is finished: there is no next station to be
   * short of anything.
   */
  if (arrivedAt) {
    // What the record holds NOW, which is what it held plus what this tick filed.
    // `filed` was computed before the crew ran, so using it alone would judge the
    // station on the state it inherited.
    const filedNow = [...filed, ...attached.map((a) => a.artifactKind)];

    /*
     * F-72. A STAGED CHANGESET IS NOT A BUILT CHANGE, AND SHIP CANNOT WORK FROM ONE.
     *
     * MEASURED ON THE LIVE RUN, 2026-08-25 16:40. Build's visit made three
     * `studio.stage` calls, **no `studio.commit` and no `studio.pr.open`** — and
     * `build -> ship` fired **four seconds after the last stage**:
     *
     *   16:40:40 studio.stage ok · 16:40:55 studio.stage ok · 16:41:16 studio.stage ok
     *   16:41:21 build -> ship   (sweep)
     *   16:50    ship: github.ci.read FALSE — no PR exists, produced-nothing
     *
     * WHY THE EXISTING GATES BOTH PASS IT, which is the whole defect.
     * `STATION_ARTIFACT.build` is `createdBy: "studio.stage"`, so **staging alone
     * files Build's artifact** and `producedThisVisit` is true.
     * `STATION_NEEDS.ship` asks for a `changeset`, and a staged row **is** a
     * changeset, so `needIsMet` is true. Both checks ask whether a thing of the
     * right KIND exists. Neither asks whether it is FINISHED.
     *
     * The cost is not a wrong row, it is a cycle: Ship arrives, finds no pull
     * request and no CI to read, files nothing, burns its attempts, and
     * `decideCorrection` sends the work back to Build — the 13:21 and 14:50
     * bounces, repeating, at roughly ninety seconds of real crew work each.
     *
     * `staged` is the only status that means "nothing left the platform".
     * `committed`, `pr_open` and `merged` all mean a branch exists that Ship can
     * point at. So this refuses on exactly one value rather than allow-listing
     * the others, which keeps a future status working by default instead of
     * silently blocking.
     *
     * Read fresh rather than from `attached`: the crew may have staged and then
     * committed within the same visit, and judging it on the row it created
     * first would hold work that is genuinely finished.
     */
    if (station === "build") {
      const { data: csRows } = await supabase
        .from("studio_changesets")
        .select("id,status")
        .eq("track_id", row.id)
        .order("created_at", { ascending: false })
        .limit(1);
      const csStatus = (csRows?.[0] as { status?: string } | undefined)?.status ?? null;
      if (csStatus === "staged") {
        await supabase
          .from("spine_tracks" as never)
          .update({
            attempts: (row.attempts ?? 0) + 1,
            last_hold: "nothing-to-hand-on",
            driven_at: new Date().toISOString(),
          } as never)
          .eq("id", row.id);
        return {
          trackId: row.id,
          station,
          moved: false,
          arrivedAt: null,
          hold: "nothing-to-hand-on",
          line: flagged(
            "The change is staged but not committed, so there is no branch for Ship to point at. Call studio.commit, then studio.pr.open.",
          ),
          attached,
        };
      }
    }

    if (!needIsMet(STATION_NEEDS[arrivedAt], filedNow)) {
      await supabase
        .from("spine_tracks" as never)
        .update({
          attempts: (row.attempts ?? 0) + 1,
          last_hold: "nothing-to-hand-on",
          driven_at: new Date().toISOString(),
        } as never)
        .eq("id", row.id);
      return {
        trackId: row.id,
        station,
        moved: false,
        arrivedAt: null,
        hold: "nothing-to-hand-on",
        // Says what the NEXT station is short of, because that is the thing a
        // person can act on. The stray artifact is not the problem.
        line: flagged(
          `${station} filed something, but ${arrivedAt} still has no ${STATION_NEEDS[arrivedAt].missing}.`,
        ),
        attached,
      };
    }
  }

  // attempts resets on every move, in the same write, so a counter can never
  // leak across stations and strand work that was making progress.
  const moveResult = await supabase
    .from("spine_tracks" as never)
    .update(
      (arrivedAt
        ? {
            station: arrivedAt,
            attempts: 0,
            // F-43: the work moved, so the convergence counter starts again.
            station_drives: 0,
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
    .eq("id", row.id)
    /*
     * F-60. COMPARE-AND-SWAP, because this product now has TWO drivers and
     * nothing else coordinates them.
     *
     * Until 2026-08-25 `driveTrackOnce` had one caller and concurrency was
     * structurally impossible. `driveTrackNow` and item 34's auto-continuation
     * landed the same day, and there is no lock, no lease and no claim column on
     * `spine_tracks`. MEASURED on Round 7 at 11:20: the cron sweep started at
     * 11:20:01 and ran 49.6s while the watched walk was mid-station; both read
     * `station = 'sense'`, both dispatched `researcher` 276ms apart, and both
     * wrote `sense -> decide` — 11:20:50.935 and 11:21:25.245. **Six trail rows
     * for five moves, and two paid dispatches for one seat.**
     *
     * `.eq("station", station)` makes the write conditional on the row still
     * being where this drive found it. The loser updates nothing, so it cannot
     * write a duplicate trail row below, and — the sharper risk — **cannot roll
     * the station BACKWARDS while resetting `attempts`, `station_drives` and
     * `last_hold` from its stale snapshot.**
     *
     * THE HAZARD THIS REALLY CLOSES IS IN THE CORRECTION COUNTER.
     * `readCorrections` counts backward transitions and `MAX_TRACK_CORRECTIONS`
     * is 2, so **one duplicated correction spends the entire budget in a single
     * move**, `decideDrive` returns `corrections-spent`, and the track halts
     * asking for a person. That is acceptance criterion 2 failing from a
     * bookkeeping artefact rather than from anything the loop did.
     *
     * Not a lease: a lease also stops the wasted dispatch, but it must be
     * released on all eight paths that write `driven_at` or a killed Worker
     * strands the track until the TTL expires. This is the safe half — it cannot
     * strand anything, because a lost race simply writes nothing.
     */
    .eq("station", station)
    .select("id");

  // The trail row is written ONLY by the driver that actually moved the row.
  // A loser that wrote one would be claiming a transition the table did not
  // take — which is the same rule `applyCorrection` states for itself.
  if (!moveResult.data?.length) {
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      // Not a hold: nothing is wrong and nobody needs to look. The other driver
      // moved the work, so this drive simply has nothing left to do.
      hold: null,
      attached: harvested,
      line: flagged(
        "Another driver moved this work while this run was mid-station, so this run stopped rather than moving it twice.",
      ),
    };
  }

  await recordStageEvent(supabase, {
    entityType: "spine_track",
    entityId: row.id,
    from: station,
    to: arrivedAt ?? "learn",
    // UNCHANGED, and deliberately. `actor` means "who did this" and the answer
    // is still the system: agents did the work on both paths. `drivenVia`
    // carries the different question — whether anybody was there.
    actor: "system",
    drivenVia: via,
    workspaceId: row.workspace_id,
    userId: row.user_id,
  });

  // WHAT ACTUALLY FIXED IT, written only once it is known.
  //
  // At correction time the loop knows what failed and where it sent the work,
  // which is a HYPOTHESIS. Writing only that would teach every future agent a
  // guess. This is the station that could not finish, finishing, after the work
  // went back and came forward again, which is the moment the hypothesis becomes
  // a fact. It replaces the earlier row rather than sitting beside it, so recall
  // meets the confirmed lesson and not both versions of it.
  if (history.last?.from === station) {
    await rememberCorrectionFix(supabase, {
      userId: row.user_id,
      workspaceId: row.workspace_id,
      trackId: row.id,
      title: row.title,
      from: history.last.from,
      to: history.last.to,
      missing: STATION_NEEDS[history.last.from].missing,
    });
  }

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
  "id,user_id,workspace_id,title,origin,entry_station,station,path,waived,attempts,last_hold," +
  // F-43: the counter that catches a station which never converges.
  "station_drives," +
  "pending_gates," +
  // The watermark `externalEvidence` measures new arrivals against. Absent, it
  // reads as null, which makes the check fall back to "has this workspace ever
  // held a signal" -- the very behaviour that made a starved Discover
  // indistinguishable from a broken one. It belongs in the shared constant for
  // the same reason the budget columns do.
  "driven_at," +
  // When the track was opened. The fallback arrival stamp for a crew resumed at
  // a station the track has never left, which has no `stage_events` row to read.
  "created_at," +
  // The budget columns. A DriveRow missing these reads them as null, which
  // resolves to "spent nothing" and silently removes the ceiling, so they
  // belong in the shared constant rather than in whichever caller remembers.
  "spend_used_usd,spend_cap_usd," +
  // Where the crew got to when the tick deadline cut it short. Missing, it reads
  // as zero and the station restarts its crew, which is the defect this column
  // exists to end, so it belongs in the shared constant for the same reason the
  // budget columns do.
  "seat_cursor";

export type { DriveRow };

/**
 * F-41 — read the refusal off the RECORD rather than off the run's own account.
 *
 * WHY THIS EXISTS AND `refusedTool(steps)` WAS NOT ENOUGH. The first version of
 * this fix read only the in-memory `LoopStep[]` the dispatch returned, shipped,
 * deployed, and then did not fire on a live 401 — twice, at 05:10 and 05:20 on
 * track `8391835f`, while `tool_calls` held the proof both times:
 *
 *   repo.tree | ok=false | "GitHub 401 on /repos/RohitGajaraj/Test-Project-Cadence:
 *                           {\"message\": \"Bad credentials\"}"
 *
 * The step plumbing between the dispatch and this verdict is not something this
 * function can see, and a fix that depends on it is a fix that cannot be checked.
 * `tool_calls` is written by the tool layer itself, so it is the same evidence a
 * person would use. `trace_id` is the only join key the two tables share —
 * `agent_runs` has no `trace_id` column, which is why the ids are carried down
 * from each `runAgentLoop` result rather than looked up.
 *
 * Costs one query, and only on the path where a station already filed nothing.
 */
async function refusedToolInTraces(
  supabase: SupabaseClient,
  traceIds: string[],
): Promise<{ tool: string; error: string } | null> {
  if (!traceIds.length) return null;
  try {
    const { data, error } = await supabase
      .from("tool_calls")
      .select("tool_name,error,created_at")
      .in("trace_id", traceIds)
      .eq("ok", false)
      .order("created_at", { ascending: true })
      .limit(50);
    // A read that failed proves nothing, so it claims nothing — the same rule
    // `getTrackArtifacts` follows for `missing`.
    if (error || !data) return null;
    return refusedTool(
      data.map((r) => ({
        kind: "tool_call",
        name: (r as { tool_name?: string }).tool_name ?? "a tool",
        status: "error",
        error: (r as { error?: string | null }).error ?? null,
      })),
    );
  } catch {
    return null;
  }
}

/**
 * F-68 — A STATION THAT SAYS "COMMITTED" OVER ITS OWN `ok: false`.
 *
 * ── WHAT HAPPENED, MEASURED 2026-08-25 AT 15:00:03 ─────────────────────
 * Build's builder seat filed this, verbatim, into `agent_runs.output`:
 *
 *   "These changes were staged and committed to a pull request (#5) at
 *    https://github.com/RohitGajaraj/relay-homeowner-app/pull/5."
 *
 * Its own calls, same run, in order:
 *
 *   studio.stage    ok: true
 *   studio.stage    ok: true
 *   studio.commit   ok: FALSE   (refused by F-63's secret floor)
 *   studio.pr.open  ok: true
 *
 * Staged is true. Committed is false, and the seat was told so in the same
 * turn. The fault splits and only half of it is the agent's: the PR URL was
 * handed over by a tool that answered `ok: true`, so it was repeated rather
 * than invented. "Committed" was asserted over a visible refusal, and that is
 * the thing this driver has spent a week building guards against.
 *
 * ── WHY THIS IS CHECKABLE WITHOUT UNDERSTANDING A WORD OF PROSE ────────
 * The contradiction is between two records the driver already holds: the
 * seat's own sentence (`LoopResult.final`, which is what `finalize` writes to
 * `agent_runs.output`) and the seat's own calls. It needs no judgement about
 * what the seat meant, only whether the tool it names came back refused.
 *
 * ── THE JOIN, AND WHY IT IS RELIABLE HERE AND NOWHERE ELSE ─────────────
 * `agent_runs` has NO `trace_id` and `tool_calls` has NO `run_id`, so the two
 * TABLES cannot be joined at all — an audit run later over the record would
 * have nothing but timestamp proximity, which is a guess and is not used here.
 * The driver does not have that problem: `runAgentLoop` mints one `traceId` per
 * dispatch and stamps it on every `tool_calls` row that run writes, and returns
 * it as `LoopResult.trace_id` beside `final`. So claim and calls are joined
 * exactly, per seat, in memory, at the only moment both are in one hand. This
 * is the same key F-41's `refusedToolInTraces` already relies on.
 *
 * ── WHAT IT DOES ON A HIT, AND WHAT IT DELIBERATELY DOES NOT DO ────────
 * It adds a sentence. It does not downgrade the run, it does not withhold
 * `producedThisVisit`, and it does not stop the track.
 *
 *   Downgrading the run buys NOTHING: `anyToolStepFailed` in loop.server.ts
 *   already wrote `completed_with_failures` on this exact run, because the
 *   commit threw. The status was already honest. The sentence was not.
 *
 *   Withholding `producedThisVisit` would DESTROY REAL WORK. That run genuinely
 *   staged two files and genuinely holds a PR row; `producedThisVisit` is
 *   computed from rows that actually landed, and discarding them because a
 *   sentence matched a regular expression is the one outcome worse than a
 *   missed overclaim.
 *
 *   And the blast radius of the overclaim is a PERSON, not the machine: a
 *   seat's prose never reaches the next station. The brief is rebuilt from
 *   `loadUpstream`, which reads filed artifacts, so nothing downstream has ever
 *   read this sentence. The only reader who can be misled by it is the one
 *   reading the run, which is exactly where the note goes.
 */

/** One call, reduced to the two facts this check needs. */
export type ToolOutcomeLike = { tool: string; ok: boolean };

/** A seat's claim that the seat's own call contradicts. */
export type Overclaim = {
  /** The agent that said it. */
  seat: string;
  /** What it said it had done, in the words this check recognises. */
  claimed: string;
  /** The call that was refused while it said so. */
  tool: string;
};

/**
 * THE WHOLE VOCABULARY OF THE CHECK, and it is deliberately three entries long.
 *
 * Each row is a claim about a WRITE THAT REACHES A REAL REPOSITORY and the
 * tools that are the only way to make it. Nothing here tries to understand a
 * sentence: it matches a past-participle claim and then asks the record whether
 * the corresponding call came back refused. A claim with no matching call is
 * NOT flagged — "it never tried" is a different fault with a different fix, and
 * flagging it would need judgement this check does not have.
 *
 * Present tense and infinitives are excluded on purpose. "I will commit" and
 * "the next step is to commit" are plans, not claims, and a rule that fired on
 * them would flag a seat for describing its own intentions correctly.
 */
const OUTCOME_CLAIMS: readonly {
  /** The words a seat uses when it says it did the thing. */
  claim: RegExp;
  /** How the note reads it back. */
  said: string;
  /** Every tool that can actually do it. */
  tools: readonly string[];
}[] = [
  {
    claim: /\bcommitt?ed\b/i,
    said: "committed",
    tools: ["studio.commit", "studio.fix.commit", "github.commit.append"],
  },
  {
    claim: /\bmerged\b/i,
    said: "merged",
    tools: ["studio.pr.merge"],
  },
  {
    // The verb is required. A bare "pull request" is a noun a seat may name for
    // a dozen honest reasons, including reading one it did not open. Both
    // voices, because "I opened a PR" and "PR #18 was created" are the same
    // claim and a rule that only read the active one would miss half of them —
    // measured against the record, where the passive form is the commoner.
    claim:
      /\b(?:opened|raised|created|submitted)\b[^.]{0,40}?\b(?:pull requests?|PR)\b|\b(?:pull requests?|PR)\b[^.]{0,40}?\b(?:was|were|is|are|has|have)\s+(?:been\s+)?(?:opened|raised|created|submitted)\b/i,
    said: "opened a pull request",
    tools: ["studio.pr.open", "github.pr.open"],
  },
];

/**
 * EVERY WORD THAT TURNS A CLAIM INTO AN HONEST REPORT OF FAILURE.
 *
 * Generous on purpose, and the asymmetry is the safety property: a negator can
 * only ever SUPPRESS a flag, never cause one. A seat writing "the commit was
 * refused, so nothing was committed" is doing exactly what the brief asks of
 * it, and must never be marked for saying so.
 */
const CLAIM_NEGATORS =
  /\b(?:not|never|cannot|can't|couldn't|won't|wasn't|weren't|isn't|aren't|hasn't|haven't|didn't|don't|doesn't|unable|fail(?:ed|s|ing|ure)?|refus\w*|reject\w*|block\w*|denied|declin\w*|error|unsuccessful|abort\w*|revert\w*|skip\w*|halt\w*|pending|attempted|tried|would|should|must|need|no|nothing|none|neither|nor|without|yet)\b/i;

/**
 * The sentence-ish chunks a claim is judged within.
 *
 * Scoped to one clause rather than the whole answer because a seat that says
 * "the commit was refused" in its first line and "committed" in its fourth is
 * two different statements, and judging the whole text at once would let either
 * one hide the other. Chunking on terminal punctuation and line breaks costs
 * nothing and does not need a parser.
 */
function claimClauses(text: string): string[] {
  return (text.match(/[^.!?;\n\r]+/g) ?? []).map((s) => s.trim()).filter(Boolean);
}

/**
 * Which outcomes this text ASSERTS, negations removed. Pure, and free — this is
 * what keeps the query below off every run that never claimed anything.
 */
export function outcomeClaims(final: string | null | undefined): readonly string[] {
  const text = (final ?? "").trim();
  if (!text) return [];
  const clauses = claimClauses(text);
  const said: string[] = [];
  for (const rule of OUTCOME_CLAIMS) {
    const asserted = clauses.some((c) => rule.claim.test(c) && !CLAIM_NEGATORS.test(c));
    if (asserted) said.push(rule.said);
  }
  return said;
}

/**
 * The claim the record contradicts, or null when every claim stands.
 *
 * THE TWO CONJUNCTS ARE WHAT MAKE THIS SAFE TO SHIP.
 *
 *   The seat must have CALLED the tool. Silence is not evidence: a station
 *   resumed mid-crew, a claim about work an earlier tick did, or a seat
 *   summarising the brief it was given all look like this, and none of them is
 *   a lie the driver can prove.
 *
 *   And NO call to that tool may have succeeded. A seat that was refused once,
 *   fixed the file and committed on the second try DID commit, and saying so is
 *   the truth. Only "tried, was told no, and said yes anyway" is flagged.
 */
export function contradictedClaim(
  seat: string,
  claimed: readonly string[],
  calls: readonly ToolOutcomeLike[],
): Overclaim | null {
  for (const rule of OUTCOME_CLAIMS) {
    if (!claimed.includes(rule.said)) continue;
    const mine = calls.filter((c) => rule.tools.includes(c.tool));
    if (!mine.length) continue;
    if (mine.some((c) => c.ok)) continue;
    return { seat, claimed: rule.said, tool: mine[0].tool };
  }
  return null;
}

/** What a person reads beside the station's own account of the tick. */
export function overclaimLine(o: Overclaim): string {
  return `${o.seat} reported that it ${o.claimed}, and its own ${o.tool} call was refused in the same turn. Read the repository rather than that summary.`;
}

/**
 * The seat's calls as the run itself accounted for them. Free, and incomplete
 * often enough that it is never trusted alone — see `refusedToolInTraces` for
 * the two live ticks where this account came back empty and the record did not.
 *
 * `queued` and `denied` are neither a success nor a refusal and are dropped. A
 * call waiting on a person has not happened, and a person declining one is the
 * boundary working; counting either as a refusal would flag a seat for a
 * decision that was never its to make.
 */
function toolOutcomesInSteps(steps: readonly ToolStepLike[]): ToolOutcomeLike[] {
  const out: ToolOutcomeLike[] = [];
  for (const s of steps) {
    if (s.kind !== "tool_call" || !s.name) continue;
    if (s.status === "executed") out.push({ tool: s.name, ok: true });
    else if (s.status === "error") out.push({ tool: s.name, ok: false });
  }
  return out;
}

/**
 * The seat's calls as the TOOL LAYER wrote them, joined on the run's own trace.
 *
 * Costs one small indexed query, and only for a seat that actually claimed one
 * of three outcomes, which is why it is gated behind `outcomeClaims` at the
 * call site rather than run on every dispatch.
 *
 * A read that failed proves nothing, so it claims nothing: an empty list means
 * no contradiction can be shown, which is the direction this check must fail in.
 */
async function toolOutcomesInTrace(
  supabase: SupabaseClient,
  traceId: string | null | undefined,
): Promise<ToolOutcomeLike[]> {
  if (!traceId) return [];
  try {
    const { data, error } = await supabase
      .from("tool_calls")
      .select("tool_name,ok")
      .eq("trace_id", traceId)
      .limit(200);
    if (error || !data) return [];
    return (data as { tool_name?: string | null; ok?: boolean | null }[])
      .filter((r) => !!r.tool_name)
      .map((r) => ({ tool: r.tool_name as string, ok: r.ok === true }));
  } catch {
    return [];
  }
}

/**
 * Did this seat report an outcome its own calls refuse to support?
 *
 * Both sources are UNIONED rather than one chosen, and the direction matters: a
 * success seen in either account clears the claim, so the wider the view the
 * fewer the flags. The record is the authority for what failed; the run's own
 * account can only ever exonerate.
 */
async function overclaimedBySeat(
  supabase: SupabaseClient,
  seat: string,
  result: { final?: string | null; trace_id?: string | null; steps?: ToolStepLike[] },
): Promise<Overclaim | null> {
  const claimed = outcomeClaims(result.final);
  if (!claimed.length) return null;
  const calls = [
    ...toolOutcomesInSteps(result.steps ?? []),
    ...(await toolOutcomesInTrace(supabase, result.trace_id)),
  ];
  return contradictedClaim(seat, claimed, calls);
}
