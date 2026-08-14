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
import { recordLineage } from "@/lib/lineage.functions";
import { nextStation, waiverFor, type SpineRoute } from "@/lib/spine/route";
import {
  decideDrive,
  holdLine,
  HOLD_LINE,
  newestSpecId,
  stationCrew,
  stationGoal,
  type HoldReason,
  type UpstreamArtifact,
} from "@/lib/spine/driver";
import {
  CORRECTABLE_HOLDS,
  correctionNote,
  decideCorrection,
  holdForCorrection,
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
): Promise<boolean | null> {
  if (!workspaceId) return null;
  try {
    const { count, error } = await supabase
      .from("signals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);
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
): Promise<CorrectionOutcome | null> {
  if (!CORRECTABLE_HOLDS.has(at.hold)) return null;

  const need = STATION_NEEDS[at.station];
  // Read only when the station's precondition is one no station can file, which
  // today is Discover alone. Every other station is answered entirely from the
  // track's own record and costs no extra query.
  const externalMet =
    need.from === null ? await externalEvidence(supabase, row.workspace_id) : null;

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

export async function driveTrackOnce(
  supabase: SupabaseClient,
  row: DriveRow,
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
    const corrected = await correctIfPossible(supabase, row, {
      hold: decision.hold,
      station,
      route,
      corrections: history.count,
      filed,
    });
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
  /** The thrown value, kept so its code survives the reduction to a message. */
  let failedError: unknown = null;
  let steps: ToolStepLike[] = [];
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
    // `decisions.prd_id` is null by construction at Decide. The fix is `specId`
    // in the loop below.
    const missionId =
      station === "build" ? await missionForTrack(supabase, row, decision.agentSlug) : null;

    for (const seat of crew) {
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
      // this route. So the durable fix is the one below — hand the analyst the
      // id and tell it, in `stationGoal`, to pass it. Live: the one track that
      // completed the loop autonomously recorded two verdicts with prd_id,
      // opportunity_id and mission_id all null.
      //
      // Read off `brief`, not with a query. It is the same list the agent is
      // being shown, so the brief can never name a spec the agent was not given,
      // and it grows as the crew files.
      const specId = newestSpecId(brief);

      const result = await runAgentLoop(supabase, row.user_id, {
        agentSlug: seat.slug,
        goal: stationGoal(
          station,
          { title: row.title, origin: row.origin },
          brief,
          seat,
          backNote,
          specId,
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
      queued += result.approvals_queued ?? 0;

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

  // THE METER IS PERSISTED ON EVERY PATH OUT, before any branch below returns.
  // A tick that spent money and then held at a gate, stalled, or ran out of
  // budget has still spent it, and a counter that only advances on the happy
  // path is a budget that resets itself every time work gets interesting.
  await supabase
    .from("spine_tracks" as never)
    .update({ spend_used_usd: spent } as never)
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
      line: outside
        ? (holdLine(hold, { station }) ?? HOLD_LINE[hold])
        : `${station} did not complete: ${failed}`,
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
  "pending_gates," +
  // The budget columns. A DriveRow missing these reads them as null, which
  // resolves to "spent nothing" and silently removes the ceiling, so they
  // belong in the shared constant rather than in whichever caller remembers.
  "spend_used_usd,spend_cap_usd";

export type { DriveRow };
