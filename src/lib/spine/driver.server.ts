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
import { trackGoalSentence } from "@/lib/track-origin";
import {
  claimedPathFrom,
  refusalIsAboutTheWork,
  refusalIsAClaimedPath,
} from "@/lib/spine/refusal-kind";
import {
  CLAIMED_PATH_HOLD,
  waitingOnAnotherRun,
} from "@/lib/spine/a-claimed-path-is-a-wait-not-an-unstage";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runAgentLoop } from "@/lib/ai/loop.server";
import { createMission } from "@/lib/ai/handoff.server";
import { recordStageEvent } from "@/lib/stage-events.server";
import { recordSelfCheck, recordTrackDrive } from "@/lib/spine/track-drives.server";
import { recordLineage } from "@/lib/lineage.functions";
import { applyTrigger, nextStation, waive, waiverFor, type SpineRoute } from "@/lib/spine/route";
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
  STOPPED_BY_YOU,
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
  producedNothingNote,
  selfCheckNote,
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
import { refusalHappened } from "@/lib/spine/a-call-on-your-sentence-is-yours-to-make";
import {
  designVerdictHolds,
  designHoldLine,
} from "@/lib/spine/a-design-verdict-against-the-premise-holds";
import { parseDesignCriticReview, type DesignCriticReview } from "@/lib/ai/design-critic";
import {
  shipStopFrom,
  shipStopWaitsOnAPerson,
} from "@/lib/hosting/a-ship-that-cannot-deploy-names-the-provider";

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
  /**
   * The product this work is bound to, and therefore the repository Build will
   * see. NULL is legal and common — `requireGithub` falls back to the
   * workspace's default connection — which is exactly why F-186 needs to read
   * it: a Build that filed nothing against the wrong repo is not a Build that
   * failed, and nothing on the record used to say which repo it was.
   */
  product_id: string | null;
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

/**
 * Has a person asked this run to stop?
 *
 * ── WHY A COLUMN AND NOT THE CONTROL THAT ALREADY EXISTED ─────────────────
 * `TrackRun`'s Stop set a React state to zero. That cancels the automatic legs
 * one browser tab would have bought next, and nothing else: the sweep picks the
 * same track up ten minutes later and drives it, because nothing on the record
 * ever said a person asked it to stop. Closing the tab did exactly as much.
 * `driveTrackOnce` is the single door both the press and the sweep go through,
 * so a column read here is the only stop that binds both.
 *
 * ── IT FAILS OPEN, WHICH IS THE OPPOSITE OF `isPaused` ABOVE, ON PURPOSE ──
 * The kill switch fails CLOSED because an unreadable "stop everything" must
 * stop everything. This one must not, and the reason is deployment order: the
 * column arrives in its own migration, and a build carrying this code against a
 * database that has not taken it yet would read an error on every track and
 * freeze the entire product. So a read that cannot answer is treated as "nobody
 * asked", and the cost of that is bounded and small: the sweep asks again on its
 * next tick, so a transient failure delays a stop by one tick rather than
 * dropping it, and the person's own tab has already cancelled its legs.
 *
 * Exported for its test, which drives it with a client that can be told to fail.
 */
export async function stopRequestedAt(
  supabase: SupabaseClient,
  trackId: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("spine_tracks" as never)
      .select("stop_requested_at")
      .eq("id", trackId)
      .maybeSingle();
    if (error) return null;
    return (data as { stop_requested_at?: string | null } | null)?.stop_requested_at ?? null;
  } catch {
    return null;
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
): Promise<{ filed: Attachment[]; stillOpen: number; keep: PendingGate[] }> {
  const pending = (Array.isArray(row.pending_gates) ? row.pending_gates : []) as PendingGate[];
  if (pending.length === 0) return { filed: [], stillOpen: 0, keep: [] };

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
    if (error) return { filed: [], stillOpen: pending.length, keep: pending };

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
    return { filed, stillOpen: keep.length, keep };
  } catch (e) {
    console.error(
      `spine gate harvest threw for track ${row.id}: ${e instanceof Error ? e.message : String(e)}`,
    );
    return { filed: [], stillOpen: pending.length, keep: pending };
  }
}

/**
 * Remember the gates this run just opened, so their output is not lost.
 *
 * -- A CANCELLED GATE CAME BACK, AND THIS LINE IS WHY ----------------------
 *
 * Walked on `2fdf93b6`, 2026-09-03: `pending_gates` went from one entry to TWO
 * across a single drive. `a220388d` had been cancelled at 19:35 and harvested
 * out correctly at the top of the run -- and then reappeared, sitting beside the
 * new gate the same drive had just opened.
 *
 * The harvest was never the bug. This merge read `row.pending_gates`, and `row`
 * is the snapshot taken at drive START, before the harvest shrank the list. So
 * the write here was `[everything that was pending an hour ago, ...opened]`,
 * which restored every gate the harvest had just removed and appended the new
 * one on top. The list could only ever grow.
 *
 * It takes the SURVIVING list as an argument now. Not re-read from the database
 * -- a second read would be a second race, and the harvest already knows the
 * answer it just wrote. Passing it makes the ordering a fact of the signature
 * rather than something a future reader has to notice.
 */
async function rememberGates(
  supabase: SupabaseClient,
  row: DriveRow,
  opened: PendingGate[],
  /** What survived the harvest this drive. NOT `row.pending_gates`, which is
   *  the pre-harvest snapshot and is what resurrected a cancelled gate. */
  existing: PendingGate[],
): Promise<void> {
  if (opened.length === 0) return;
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
    .is("superseded_at", null)
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
/**
 * THE NEWEST CHANGESET ON A TRACK -- AND `studio_changesets.track_id` DOES NOT EXIST.
 *
 * ── THE DEFECT, FOUND 2026-09-03 BY ASKING THE DATABASE ───────────────────
 * Three gates in this file read `studio_changesets` with `.eq("track_id", ...)`:
 * F-72's "staged is not built" gate, P-02's acceptance gate, and P-03's Build
 * done rule. The column has never existed. `information_schema` lists twenty-two
 * columns on that table and the link to a track is `mission_id`.
 *
 * PostgREST answers an unknown column with 42703 and no rows, and two of the
 * three did not read `error` at all -- so the gates did not fail loudly, they
 * evaluated to "no changeset" and quietly did nothing. **F-72's gate has never
 * fired since it was written.** A1 caught it on the live run: track `6817e386`
 * sat at `pr_open` and the builder crew ran again anyway, which was read at
 * first as a deploy that had not carried the fix.
 *
 * ── THE REAL JOIN, AND WHY IT IS THIS ONE ─────────────────────────────────
 * A track's missions are its `spine_track_members` rows of kind `mission`, and a
 * changeset carries `mission_id`. `openBranchForTrack` above has always used
 * `mission_id` and has always worked, which is the shape that should have been
 * copied.
 *
 * ONE READER, because three copies of a join is how one gets fixed and the
 * others do not -- which is exactly what happened here, three times over, to a
 * query that was wrong from the first copy.
 *
 * Returns null when the track has no mission, no changeset, or the read failed,
 * and the CALLER decides what that means. It is not the same answer in all three
 * places: F-72 and the done rule treat "unknown" as "carry on", the acceptance
 * gate treats it as "nothing to check".
 */
async function newestChangesetForTrack(
  supabase: SupabaseClient,
  trackId: string,
  columns: string,
): Promise<Record<string, unknown> | null> {
  const { data: missionRows, error: mErr } = await supabase
    .from("spine_track_members")
    .select("artifact_id")
    .eq("track_id", trackId)
    .eq("artifact_kind", "mission");
  if (mErr) {
    console.error(`[driver] could not read missions for track ${trackId}: ${mErr.message}`);
    return null;
  }
  const missionIds = ((missionRows ?? []) as Array<{ artifact_id?: string | null }>)
    .map((r) => r.artifact_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  if (missionIds.length === 0) return null;

  const { data, error } = await supabase
    .from("studio_changesets")
    .select(columns)
    .in("mission_id", missionIds)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) {
    console.error(`[driver] could not read the changeset for track ${trackId}: ${error.message}`);
    return null;
  }
  /* `as unknown` first: with a runtime-built column list the generated types
     cannot narrow the row, and PostgREST's error shape is in the union. */
  return (((data ?? []) as unknown[])[0] as Record<string, unknown> | undefined) ?? null;
}

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
      // A mission raised from a spec that has since been undone describes work
      // nobody asked for any more.
      .is("superseded_at", null)
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
      /*
       * F-121 (S1 -> S0). This was `${row.title}. ${row.origin}`, which renders
       * the sentence twice when a track's origin IS its title. Live on
       * `6199f3df`, and stored that way in `missions.goal` rather than doubled
       * at render time, so it is a bad row and not a bad render.
       *
       * It will grow rather than shrink: the sentence a person types at /start
       * becomes BOTH the title and the origin, so exact-match is the natural
       * result of the newest way to start work. `trackGoalSentence` returns the
       * title plus only what the origin actually adds, and returns an origin
       * that carries its own fact untouched.
       */
      goal: trackGoalSentence(row.title, row.origin),
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
 * R-36 / P-40. The one hold that travels WITH a move rather than instead of one.
 * Named as a constant so the driver, the run screen and the Decide brief cannot
 * spell it three ways.
 */
const CARRIED_ON_YOUR_SENTENCE = "carried-on-your-sentence" as const;

/** Said once, in one place, so the transcript and the hold pane agree. */
const NOTHING_SPEAKS_TO_THIS =
  "Nothing in the workspace speaks to this. Carrying on from your sentence alone; add a source or say what you know to change that.";

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
/** Plain words for the extra columns a brief carries. See `ArtifactSource.also`. */
const LABEL_FOR: Record<string, string> = {
  forecast_claim: "What we expected",
  forecast_how_we_will_know: "How we would know",
  forecast_horizon_date: "Expected by",
};

async function loadUpstream(
  supabase: SupabaseClient,
  trackId: string,
): Promise<UpstreamArtifact[]> {
  const { data: members, error } = await supabase
    .from("spine_track_members" as never)
    .select("artifact_kind, artifact_id, created_at")
    .eq("track_id", trackId)
    // Undone work is not context. A brief built from a superseded spec would
    // ask the station to redo the work by describing the wrong version of it.
    .is("superseded_at", null)
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
      // Extra columns that belong in the brief but are not the row's own text.
      // Today only a decision has any: its forecast, which Learn must grade
      // against and which reached no station until 2026-08-27.
      for (const extra of source.also ?? []) cols.push(extra);
      const { data } = await supabase
        .from(source.table as never)
        .select(cols.join(","))
        .in("id", ids);
      for (const r of (data ?? []) as unknown as Array<
        {
          id: string;
          title: string | null;
          body?: string | null;
        } & Record<string, unknown>
      >) {
        /*
         * Appended and LABELLED, so the reading station knows what it is looking
         * at. An unlabelled date under a rationale is noise; "Expected by:" is
         * the difference between carrying a value and communicating it.
         *
         * Absent columns are skipped rather than printed empty: a decision with
         * no horizon must not read as one due on nothing.
         */
        const extras = (source.also ?? [])
          .map((c) => {
            const v = r[c];
            return v == null || v === "" ? null : `${LABEL_FOR[c] ?? c}: ${String(v)}`;
          })
          .filter(Boolean);
        const body = [r.body ?? null, ...extras].filter(Boolean).join("\n") || null;
        found.set(`${kind}:${r.id}`, { title: r.title ?? "untitled", body });
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

  /*
   * -- A TRACK HELD ON ANOTHER RUN'S FILE IS NOT CORRECTED ----------------
   *
   * This runs BEFORE the crew, so the general claim rule in `driveTrackOnce`
   * cannot cover it: that one reads this drive's steps, and there are none yet.
   * The claim it must respect is the one already ON THE ROW from a previous
   * drive.
   *
   * `at.hold` is `decideDrive`'s COMPUTED hold, which at the attempts ceiling is
   * `stalled` and correctable -- the same substitution that sent `2fdf93b6` back
   * to Define four times under P-03c. So the stored hold is read directly here
   * rather than inferred from the computed one.
   *
   * Correcting a claim-held track sends a change back to be rewritten against a
   * wall that is about to come down. Nothing about the work is wrong; another
   * run holds a file it needs, and that clears on its own.
   */
  if ((row.last_hold as string | null) === CLAIMED_PATH_HOLD) return null;
  /*
   * R-36 / P-40. A track carrying this hold has just MOVED: Sense reported an
   * empty workspace, correctly, and the work went on from the person's sentence.
   * There is no failure to reroute. Correcting it would send a track backwards
   * for having answered the question it was asked.
   */
  if ((row.last_hold as string | null) === CARRIED_ON_YOUR_SENTENCE) return null;

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
    /*
     * STATION-SCOPED, because track-wide `filed` cannot answer the question the
     * hold sentence asserts. A track that filed at Discover and stalled at
     * Design has a non-empty `filed` either way, which is how 20 of 32 held
     * tracks came to carry a sentence saying the station "finished empty" while
     * that station held its work (S4, 2026-08-27).
     *
     * `filedAtStation` already exists and already excludes superseded rows, so
     * this costs one read that the self-check on the same tick also makes.
     */
    filedAtThisStation: (await filedAtStation(supabase, row.id, at.station)).map(
      (a) => a.artifactKind,
    ),
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
      /*
       * F-127: cleared with the hold, always. A track that has been released and
       * still carries the sentence explaining why it stopped is the exact defect
       * this file already records at :521 — "`last_hold` was not cleared, so the
       * row went on rendering the PREVIOUS reason" — and a stale reason reads as
       * a current one.
       */
      .update({
        attempts: 0,
        last_hold: null,
        last_hold_because: null,
        driven_at: now,
        updated_at: now,
      } as never)
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
  /*
   * ── F-127: THE SENTENCE WAS COMPUTED AND THROWN AWAY ───────────────────
   *
   * The comment directly above already describes this without naming it as a
   * defect: the coarse kind is persisted "so the surface that lists work can
   * render a sentence", while "the specific one, naming both stations and the
   * missing thing, is the line returned here and it is what the tick's own
   * record of the sweep carries."
   *
   * So the reason exists. It goes into a job record and never onto the track. A
   * person opening the work an hour later reads "Nothing more will be tried here
   * on its own" and has no route to the sentence that would tell them what to do.
   *
   * Measured on `a30238f5`: finding out why it stopped at ship meant joining
   * `agent_runs` and reading a seat's output, and the answer turned out to be a
   * defect in the loop rather than a fact about the work (F-115). None of that
   * was reachable from the screen this product tells people to watch, and R-18's
   * acceptance is precisely that a person can watch it happen.
   *
   * `decision.because` is the driver's own words, stored verbatim rather than
   * re-derived, so the screen and the record cannot say different things.
   */
  await supabase
    .from("spine_tracks" as never)
    .update({
      last_hold: hold,
      last_hold_because: decision.because,
      driven_at: new Date().toISOString(),
    } as never)
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
      .is("superseded_at", null)
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
 * against the task, and if it fails, retry. The verification is done here;
 * retries happen by re-dispatching the station.
 *
 * S0-002 — CORRECTED. FIVE OF THE SEVEN CHECKS COULD NEVER PASS, AND THE
 * SIXTH CLAIM ABOVE WAS NOT TRUE EITHER.
 *
 * As first written this asked the database for columns and artifact kinds that
 * do not exist, measured 2026-08-26 against the live schema and all 1,516
 * `spine_track_members` rows:
 *
 *   decide  `decisions.forecast_text`  -> the column is `forecast_claim`
 *   define  `prds.brief`               -> the column is `body_md`
 *   design  kind `design_memory`       -> design files `prototype` (19 rows)
 *   ship    kind `deployment`          -> never filed once, and that is F-36
 *   learn   kind `verdict`             -> learn files `learning` (4 rows)
 *
 * Only `sense` and `build` named anything real. PostgREST rejects a select
 * naming a column that does not exist, so `data` came back null, `data ?? []`
 * turned that into an empty list, and "the query failed" was read as "the work
 * is empty". A decision carrying a real claim with a 2026-09-15 horizon failed
 * the forecast check.
 *
 * 17 unit tests passed throughout, because they mock the same assumptions the
 * function makes. Nothing asked the schema.
 *
 * THE RULE THAT FOLLOWS, and it is why each check below is shaped this way:
 * **a check that could not be COMPUTED must pass.** Only a positive reading of
 * missing or empty output may fail a station. A quality gate is an optimisation;
 * a quality gate that stalls the loop on its own bug is a defect with a budget.
 * The `error` is now read rather than discarded, and it is logged loudly.
 *
 * The retry also carries no feedback: `reason` is never persisted, only the
 * coarse `self-check-failed` hold, and `priorHold` reaches `correction.ts`
 * alone rather than the station brief. So a retry re-runs identical inputs. That
 * is why the caller now counts an attempt — see the call site.
 */
/**
 * Everything this station has filed on this track, not just this visit's harvest.
 *
 * F-77. `verifyStationOutput` judges what it is handed, and it used to be handed
 * `attached` — the artifacts harvested on THIS visit. A crew whose seats span the
 * tick deadline files its work in an earlier seat and leaves the next visit's
 * harvest empty, which is the whole reason
 * `a-crew-split-by-the-clock-still-filed-its-work` exists. Judging a station on
 * one visit is the same blind spot one layer up: a station that filed a `prd` in
 * seat 1 and nothing in seat 2 would be refused for filing nothing.
 *
 * It is also what makes F-78 possible without a migration — the reason a station
 * failed its own check can be RECOMPUTED at brief time from the record, so
 * nothing has to be stored and nothing can go stale.
 *
 * A read failure returns an empty list rather than throwing: the caller unions
 * this with the live harvest, so the worst case is the behaviour that was there
 * before this function existed.
 */
async function filedAtStation(
  supabase: SupabaseClient,
  trackId: string,
  station: AgentStation,
): Promise<Attachment[]> {
  try {
    const { data, error } = await supabase
      .from("spine_track_members" as never)
      .select("artifact_kind, artifact_id")
      .eq("track_id", trackId)
      .eq("station", station)
      // STANDING WORK ONLY. A rewind supersedes what it undid; counting those
      // rows here would let the station it sent back pass its self-check on the
      // very output that was rejected.
      .is("superseded_at", null);
    if (error) {
      console.error(`[driver] could not read what ${station} filed: ${error.message}`);
      return [];
    }
    return ((data ?? []) as Array<{ artifact_kind?: string; artifact_id?: string }>)
      .filter((r) => r.artifact_kind && r.artifact_id)
      .map((r) => ({
        artifactKind: r.artifact_kind!,
        artifactId: r.artifact_id!,
        station,
      })) as Attachment[];
  } catch (e) {
    console.error(`[driver] could not read what ${station} filed: ${String(e)}`);
    return [];
  }
}

/** The live harvest plus the record, deduped by artifact id. */
function unionFiled(attached: Attachment[], onRecord: Attachment[]): Attachment[] {
  const seen = new Set(attached.map((a) => a.artifactId));
  return [...attached, ...onRecord.filter((a) => !seen.has(a.artifactId))];
}

/**
 * ONE THING A STATION'S OWN CHECK COMPARED, AND WHETHER IT HELD.
 *
 * `what` is written for the person reading the run, not for the developer: it
 * says what was looked for, so a reader can tell whether the check was worth
 * anything. `why` is only meaningful when it did not hold.
 */
export type SelfCheck = { what: string; held: boolean; why?: string };

/**
 * THE ACCEPTANCE LINES THE REVIEWER SAID DID NOT HOLD.
 *
 * `code_review` is a `Json` column and arrives as an object through PostgREST
 * and as a STRING through at least one path that stringifies before writing.
 * Both are read, anything else is no lines -- which passes the gate, because
 * "the column is unreadable" is not evidence that the change is wrong.
 *
 * The same reading `verdict-reading.ts` does for the screen, deliberately kept
 * to the same rules: a line with no text is dropped rather than counted, and a
 * missing `held` is not a pass. It is not IMPORTED from there because that file
 * is a client module and this is the driver; the shared thing is the shape of
 * the column, and both files state the same three rules about it.
 */
function missedAcceptanceLines(raw: unknown): string[] {
  let review: unknown = raw;
  if (typeof review === "string") {
    try {
      review = JSON.parse(review);
    } catch {
      return [];
    }
  }
  if (!review || typeof review !== "object" || Array.isArray(review)) return [];
  const compared = (review as { compared?: unknown }).compared;
  if (!Array.isArray(compared)) return [];
  return compared
    .filter((c): c is { line: string; held?: unknown } => {
      if (!c || typeof c !== "object") return false;
      const line = (c as { line?: unknown }).line;
      return typeof line === "string" && line.trim().length > 0;
    })
    .filter((c) => c.held !== true)
    .map((c) => c.line.trim());
}

/**
 * How many of them to NAME in a hold reason a person reads.
 *
 * The list is bounded and the COUNT is not, and keeping those separate is the
 * whole point: the first draft sliced before counting, so nine failing lines
 * reported as five. A truncated list is a readable sentence; a truncated count
 * is a wrong number, and this file exists to stop those.
 */
const NAME_AT_MOST = 5;

export async function verifyStationOutput(
  supabase: SupabaseClient,
  station: AgentStation,
  attached: Attachment[],
  /**
   * The track, so Build can read whether its checks actually RAN (F-148).
   *
   * Optional because two of the three call sites only want the reason string for
   * a note, and a note does not need to re-run a gate. **Absent means Build's
   * check degrades to the filing check it was**, which is stated here rather
   * than discovered: a caller that wants the gate must pass this.
   */
  trackId?: string,
): Promise<{ passed: boolean; reason?: string; checks: SelfCheck[] }> {
  /*
   * -- WHAT THIS STATION COMPARED, AND HOW IT WENT -------------------------
   *
   * The self-check used to return a bare boolean, and when it PASSED it wrote
   * nothing at all: `last_hold_because` is only set on a failure. So the check
   * that runs on every drive of every station was invisible for the case that
   * happens almost every time, and the product could not say a station had
   * checked its own work because nothing on the record said so.
   *
   * Each comparison is now named as it is made. `no` ends the check, `ok`
   * records one that held and carries on, and the control flow below is
   * otherwise unchanged -- deliberately, because rewriting the branches and
   * making them legible in one pass is how a behaviour change hides inside a
   * visibility change.
   *
   * A branch that returns early because it could not READ something records
   * nothing for that comparison. It did not make it, so counting it either way
   * would be a number nobody looked up.
   */
  const checks: SelfCheck[] = [];
  const ok = (what: string) => {
    checks.push({ what, held: true });
  };
  const no = (what: string, why: string) => {
    checks.push({ what, held: false, why });
    return { passed: false, reason: why, checks };
  };
  /** Every comparison this station makes has been made, and all of them held. */
  const done = () => ({ passed: true, checks });
  // Group attached artifacts by kind
  const byKind = new Map<string, string[]>();
  for (const att of attached) {
    if (!byKind.has(att.artifactKind)) {
      byKind.set(att.artifactKind, []);
    }
    byKind.get(att.artifactKind)!.push(att.artifactId);
  }

  /*
   * NOTHING TO READ IS NOT A VERDICT — AND THIS IS NOT THE BANNED PREDICATE.
   *
   * `a-crew-split-by-the-clock-still-filed-its-work` forbids deciding
   * PRODUCED-NOTHING from the raw harvest count, because a crew split by the
   * clock files its work in an earlier seat and leaves this visit's harvest
   * empty. S0-001 reintroduced `attached.length === 0` here and tripped that
   * guard, which had predicted in its own comment that "a reader fixing
   * something nearby" would do exactly this.
   *
   * Nothing here decides produced-nothing: the caller settles that through
   * `didStationProduce` and only calls this when the station DID produce. With
   * no artifacts grouped there is simply no verdict to compute, and an
   * uncomputable check passes rather than stranding the work.
   */
  if (byKind.size === 0) return { passed: true, checks };

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
      return no("Something was filed to look into", "No signals were filed");
    }
    // Check that signals have content (not empty strings)
    const { data: signals, error: signalsError } = await supabase
      .from("signals" as never)
      .select("id, title")
      .in("id", signalIds);
    if (signalsError) {
      console.error(`[driver] sense self-check could not read signals: ${signalsError.message}`);
      ok("Something was filed to look into");
      return { passed: true, checks };
    }
    const hasContent = (signals ?? []).some(
      (s: { title?: string | null }) => s.title && s.title.trim().length > 0,
    );
    if (!hasContent) {
      return no("Each signal says what it is", "Signals were filed but have no content");
    }
    ok("Something was filed to look into");
    ok("Each signal says what it is");
    return done();
  }

  if (station === "decide") {
    // Decide must file decisions
    const decisionIds = byKind.get("decision") ?? [];
    if (decisionIds.length === 0) {
      return no("A call was recorded", "No decision was recorded");
    }
    // Check that decisions have a forecast (the key output of Decide, and the
    // one thing the product claims). The column is `forecast_claim` — 82 call
    // sites and the generated types agree, and `forecast_text` has never existed.
    const { data: decisions, error: decisionsError } = await supabase
      .from("decisions" as never)
      .select("id, forecast_claim, forecast_horizon_date")
      .in("id", decisionIds);
    if (decisionsError) {
      console.error(
        `[driver] decide self-check could not read forecasts: ${decisionsError.message}`,
      );
      // The kind check above was made and held. The forecast check was not made
      // at all, so it is not recorded either way.
      ok("A call was recorded");
      return { passed: true, checks };
    }
    const hasForecast = (decisions ?? []).some(
      (d: { forecast_claim?: string | null; forecast_horizon_date?: string | null }) =>
        (d.forecast_claim && d.forecast_claim.trim().length > 0) ||
        Boolean(d.forecast_horizon_date),
    );
    if (!hasForecast) {
      return no(
        "The call carries a forecast, which is the thing Learn grades",
        "Decision was recorded but has no forecast",
      );
    }
    ok("A call was recorded");
    ok("The call carries a forecast, which is the thing Learn grades");
    return done();
  }

  if (station === "define") {
    // Define must file specs (prds)
    const specIds = byKind.get("prd") ?? [];
    if (specIds.length === 0) {
      return no("A spec was written", "No spec was drafted");
    }
    // Check that specs have content. The body column is `body_md`; `brief` has
    // never existed on `prds`.
    const { data: specs, error: specsError } = await supabase
      .from("prds" as never)
      .select("id, title, body_md")
      .in("id", specIds);
    if (specsError) {
      console.error(`[driver] define self-check could not read specs: ${specsError.message}`);
      ok("A spec was written");
      return { passed: true, checks };
    }
    const hasContent = (specs ?? []).some(
      (p: { title?: string | null; body_md?: string | null }) =>
        (p.title && p.title.trim().length > 0) || (p.body_md && p.body_md.trim().length > 0),
    );
    if (!hasContent) {
      return no("The spec says something", "Spec was drafted but has no content");
    }
    ok("A spec was written");
    ok("The spec says something");
    return done();
  }

  if (station === "design") {
    // Design files `prototype` — 19 rows across the whole history. The kind
    // `design_memory` has never been filed by anything, so asking for it failed
    // every design that ever ran.
    const designIds = byKind.get("prototype") ?? [];
    if (designIds.length === 0) {
      return no("A design was filed", "No design was drafted");
    }
    ok("A design was filed");
    return done();
  }

  if (station === "build") {
    // Build must file missions or stages (changes made to code)
    const hasMission = (byKind.get("mission") ?? []).length > 0;
    if (!hasMission) {
      return no("A change was staged", "No changes were staged for commit");
    }

    /*
     * ── THE TEST GATE (F-148). BUILD'S SELF-CHECK COULD NOT FAIL. ───────────
     *
     * The `mission` kind above is written by the DRIVER ITSELF, at
     * `driver.server.ts:773`, BEFORE any seat runs. So the only thing this
     * branch asked for was already true every time it was asked, and Build's
     * self-check has never once refused a hand-on. `SPEC-AI-NATIVE-SDLC.md` §2
     * puts it plainly: what shipped as F-76 is a FILING check, not a
     * verification check -- it compiles nothing and runs nothing.
     *
     * Real execution has existed the whole time at `studio.checks.run`, which
     * clones the branch into a sandbox and takes real exit codes from `tsc`,
     * `bun test` and `lint`. It was **one skippable instruction with no gate
     * behind it**, and measured 2026-08-31 it had run **ONCE in the product's
     * life** -- against 48 `studio.commit`, 9 `studio.pr.open` and 7
     * `studio.pr.merge`. Seven merges went in with the checks tool having run a
     * single time, ever.
     *
     * So the gate is: Build may not hand on until its checks have RUN and said
     * it may proceed. `may_proceed` is the tool's own word, and it is false both
     * when a check fails AND when the sandbox could not run -- the tool
     * "never reports green for checks that did not run", which is exactly the
     * distinction this gate needs and the reason it is read rather than
     * recomputed here.
     *
     * NOT an eighth station: the spine, the acceptance query and R-01 all key on
     * seven. This is their Test stage adopted as substance, at the Build->Ship
     * seam where it belongs.
     */
    if (!trackId) {
      // The caller only wanted the reason string for a note. The filing check
      // above is all that was made, so it is all that is reported.
      ok("A change was staged");
      return { passed: true, checks };
    }

    const { data: runRows, error: runErr } = await supabase
      .from("agent_runs" as never)
      .select("trace_id")
      .eq("track_id", trackId)
      .not("trace_id", "is", null);
    /*
     * A FAILED READ PASSES, AND THIS IS THE ONE BRANCH WHERE THAT COSTS
     * SOMETHING REAL -- so it is a decision rather than a default.
     *
     * Failing CLOSED here would park every Build on this track permanently the
     * moment a query broke, in the hold that counts an attempt, and no operator
     * action clears a gate that is wrong about itself. Failing open loses one
     * gate on one drive and the next drive re-asks. The same choice the decide
     * and define branches above make, for the same reason, and the console line
     * is what makes it visible rather than silent.
     */
    if (runErr) {
      console.error(`[driver] build test-gate could not read runs: ${runErr.message}`);
      ok("A change was staged");
      return { passed: true, checks };
    }
    const traceIds = ((runRows ?? []) as Array<{ trace_id?: string | null }>)
      .map((r) => r.trace_id)
      .filter((t): t is string => typeof t === "string" && t.length > 0);
    // No trace is not a red verdict. An untraced run is unknowable rather than
    // failing, and F-76's rule is that those are different things.
    if (traceIds.length === 0) {
      ok("A change was staged");
      return { passed: true, checks };
    }

    const { data: checkCalls, error: checkErr } = await supabase
      .from("tool_calls" as never)
      .select("result, created_at")
      .eq("tool_name", "studio.checks.run")
      .in("trace_id", traceIds)
      .order("created_at", { ascending: false })
      .limit(1);
    if (checkErr) {
      console.error(`[driver] build test-gate could not read checks: ${checkErr.message}`);
      ok("A change was staged");
      return { passed: true, checks };
    }

    const newest = (checkCalls ?? [])[0] as { result?: unknown } | undefined;
    if (!newest) {
      ok("A change was staged");
      return no(
        "The checks ran and cleared this change",
        "The checks were never run on this change. Call studio.checks.run and read its verdict before handing this on.",
      );
    }
    const result = (newest.result ?? {}) as { may_proceed?: boolean; reason?: string };
    if (result.may_proceed !== true) {
      ok("A change was staged");
      return no(
        "The checks ran and cleared this change",
        result.reason && result.reason.trim().length > 0
          ? `The checks did not pass: ${result.reason}`
          : "The checks ran and did not clear this change to proceed.",
      );
    }
    ok("A change was staged");
    ok("The checks ran and cleared this change");

    /*
     * -- AND DOES IT DO WHAT WAS ASKED FOR ------------------------------------
     *
     * The last of the three, and the only one about the WORK rather than about
     * the machinery around it. The other two ask whether something was staged
     * and whether CI went green; a change can pass both and build the wrong
     * thing, which is the failure Build has no other way to catch.
     *
     * The reviewer already judged this. `studio.review` is given the spec's
     * acceptance lines and returns a verdict per line, so this reads a
     * conclusion somebody else reached rather than forming one -- the same
     * relationship the test gate above has with `studio.checks.run`, and for the
     * same reason: a gate that recomputes its own evidence can disagree with the
     * tool that produced it, and then neither can be trusted.
     *
     * WHAT IT REFUSES, AND WHAT IT DELIBERATELY DOES NOT. Only a line the
     * reviewer explicitly judged as not met. No review, no lines on the review,
     * or a spec that stated no acceptance criteria all pass here -- 117 of 119
     * specs carry no contract, so a gate that demanded lines would park almost
     * every track in the product on its first Build.
     *
     * THIS IS THE SEND-BACK. A refusal here sets `self-check-failed`, which
     * counts an attempt and re-runs Build with `selfCheckNote` telling it what
     * its own check refused. So a missed acceptance line returns the work to the
     * builder once, bounded by `attempts` like every other self-check, rather
     * than being a sentence on a screen nobody acts on.
     */
    /* Through the mission, because `studio_changesets.track_id` does not exist.
       See `newestChangesetForTrack`: this gate was one of three reading a column
       that has never been on the table. A null answer means we could not read a
       review, which is not evidence that the change is wrong, so it passes. */
    const cs = await newestChangesetForTrack(supabase, trackId, "code_review");
    const missedLines = missedAcceptanceLines(cs?.code_review);
    if (missedLines.length > 0) {
      const named = missedLines.slice(0, NAME_AT_MOST);
      const rest = missedLines.length - named.length;
      return no(
        "The change meets what the spec asked for",
        `${missedLines.length} ${missedLines.length === 1 ? "line" : "lines"} of what was asked for did not hold: ${named.join("; ")}${
          rest > 0 ? `, and ${rest} more` : ""
        }`,
      );
    }
    return done();
  }

  if (station === "ship") {
    /*
     * SHIP GETS NO KIND CHECK HERE, DELIBERATELY, AND F-36 IS THE REASON.
     *
     * A `deployment` artifact kind has never been filed — not once in 1,516
     * member rows — while `deployments` holds 42 successful rows. That gap IS
     * F-36: ship has never written a track-member row. Demanding the kind here
     * would fail every ship that has ever run, and it would do it in the hold
     * that does not count an attempt, so the work would never move again.
     *
     * Ship's real proof is a `deployments` row with `status = 'success'`, and it
     * is enforced where it belongs, at `release.publish` under R-27. A quality
     * self-check must not quietly become a second production gate that the loop
     * cannot satisfy.
     */
    /*
     * AND SO IT RECORDS NOTHING, WHICH IS THE HONEST NUMBER.
     *
     * An `ok("Something was released")` here would read well and be a lie: this
     * branch compares nothing, so a check it claims to have made is the constant
     * the count exists to avoid. Ship's run says "checked nothing of its own",
     * and that is a true sentence a reader can act on -- it points them at
     * `release.publish`, which is where Ship's real proof lives.
     */
    return done();
  }

  if (station === "learn") {
    // Learn files `learning` — the only kind it has ever filed. The kind
    // `verdict` has never existed, so this failed the one station that closes
    // the loop, on the one track that has ever reached it.
    const learningIds = byKind.get("learning") ?? [];
    if (learningIds.length === 0) {
      return no("The forecast was graded", "No verdict was recorded");
    }
    ok("The forecast was graded");
    return done();
  }

  // Unknown station, default to pass (no verification rule). Nothing was
  // compared, and the empty list says exactly that rather than claiming a pass.
  return { passed: true, checks };
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
  const driveId = await recordTrackDrive(supabase, {
    trackId: row.id,
    station,
    via,
    // Known here and nowhere later. A press against a non-null hold is a person
    // reaching for a stalled track, which is the sentence criterion 2 forbids.
    entryHold: (row.last_hold ?? null) as HoldReason | null,
  });

  /*
   * -- AND THE DEFERRAL IS CLEARED HERE, ONCE, RATHER THAN AT EVERY EXIT ----
   *
   * `deferred_until` (P-03a) is the sweep's note that this track is asleep until
   * a date. If we are driving it, that note is spent -- whoever drove it, and
   * whatever the drive goes on to decide.
   *
   * Cleared in this write rather than beside each of the fourteen places that
   * stamp `driven_at` on the way out. One of those would eventually be added
   * without it and the track would stay invisible to the sweep with nothing
   * saying why, which is the worst shape this column could fail in. Here it
   * cannot be missed: every path through this function passes this line.
   *
   * Set again by the sweep, on the next tick, if the horizon still has not
   * arrived. A stale value can never outlive the reason for it.
   */
  await supabase
    .from("spine_tracks" as never)
    .update({ last_driven_via: via, deferred_until: null } as never)
    .eq("id", row.id);

  // Catch the record up on gates answered since the last tick BEFORE deciding
  // anything. A person may have approved a call while the workspace was paused
  // or while this track was held, and the artifact that produced belongs to the
  // track whether or not this tick is allowed to run anything.
  const gates = await harvestAnsweredGates(supabase, row);
  const harvested = gates.filed;

  /*
   * ── A PERSON ASKED THIS TO STOP, SO NOTHING NEW IS DISPATCHED ────────────
   *
   * AFTER THE HARVEST AND BEFORE EVERY DECISION, and both halves of that
   * placement are the design. The harvest above is bookkeeping about work that
   * has already happened -- an artifact produced through a gate belongs to this
   * track whether or not this tick is allowed to run anything, which is the rule
   * the block above it states -- so a stop must not swallow it. Everything below
   * this point either reads a brief for a seat or dispatches one, and a stop
   * means exactly "start no more seats".
   *
   * IT HOLDS `paused` RATHER THAN INVENTING A REASON. The hold vocabulary is
   * closed and every reader in the product branches on it; a new member would
   * mean editing `holdTone`, `nothingIsComing`, `wayOut`, `footerMode` and the
   * sweep's own selection before this could be shown honestly anywhere. `paused`
   * already means "a person switched this off", and the sentence that separates
   * a kill switch from a person pressing Stop rides in `last_hold_because`,
   * which is the column built for exactly that distinction and which every
   * surface already prints ABOVE the coarse reason.
   *
   * THE WAY OUT IS THE CONTROL THAT MADE IT. `driveTrackNow` clears the column
   * on a `press`, so "Run it now" is the undo and there is no second control to
   * find. The sweep never clears it, because a loop that un-stopped work a
   * person stopped is the failure this whole column exists to prevent.
   */
  const stoppedAt = await stopRequestedAt(supabase, row.id);
  if (stoppedAt) {
    await supabase
      .from("spine_tracks" as never)
      .update({
        last_hold: "paused",
        last_hold_because: STOPPED_BY_YOU,
        driven_at: new Date().toISOString(),
      } as never)
      .eq("id", row.id);
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      hold: "paused",
      // What the gates harvested above still produced is reported, because it is
      // work that happened and a stop is not a reason to hide it.
      line: harvested.length
        ? `${describeAttachments(harvested)} ${STOPPED_BY_YOU}`
        : STOPPED_BY_YOU,
      attached: harvested,
    };
  }

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
      /*
       * ── F-127: NO `last_hold_because` HERE, AND THAT IS THE POINT ────────
       *
       * I tried to write one and the typechecker refused, which turned out to be
       * a design error rather than a syntax one. This branch's line is
       * `HOLD_LINE[decision.hold]`: a STATIC MAP from kind to sentence. Storing
       * it would duplicate exactly what `holdLine()` already derives from
       * `last_hold` when the row is read, while LOOKING like a specific reason
       * in a column whose whole purpose is that it carries one.
       *
       * A generic sentence in a field meant for specifics is worse than a null,
       * because null is readable as "no more was said" and a generic line is
       * not. Only the correction path above has words of its own.
       */
      .update({
        last_hold: decision.hold,
        /*
         * CLEARED, NOT LEFT. A hold with no sentence of its own must not inherit
         * the last one's -- A1 watched `6817e386` hold on a merge gate while
         * `last_hold_because` still read "Stopped by you." from a stop that had
         * been cleared eight minutes earlier.
         *
         * The block above is right that a GENERIC sentence here would be worse
         * than null. It does not follow that a sentence about a different hold
         * should survive: null reads as "no more was said", and a stale line
         * reads as an explanation of a hold it has nothing to do with.
         */
        last_hold_because: null,
        driven_at: new Date().toISOString(),
      } as never)
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

  /*
   * ── THE CALL IS ASKED BEFORE A SEAT RUNS, NOT AFTER IT ANSWERS (P-71e) ──
   *
   * A1's fourth probe sentence. Decide entered on the carried footing at 01:40
   * and on that FIRST pass the seat recorded "Reschedule installer visit from
   * order page" approved -- a build, with a forecast it wrote itself -- and the
   * track walked on to Define with no Choice and no person involved.
   *
   * Every earlier fix was downstream of a seat that had already decided.
   * P-71 refused a NO on the person's sentence; P-71d refused either answer
   * WHILE the Choice stood. Neither helps on the first pass, because nothing
   * had been raised yet and the seat said YES.
   *
   * So the question is put before the crew is dispatched. On a carried track
   * arriving at Decide there is nothing for a strategist to weigh -- Sense has
   * already reported that the workspace holds nothing bearing on the sentence --
   * and dispatching one spends money to have it invent a forecast. It holds
   * instead, with no seat run and no spend, and the person answers.
   *
   * THE FOOTING IS READ FROM THE RECORD, not from `last_hold`, for the reason
   * P-71c paid for: the hold is transient and this question is not.
   */
  if (station === "decide") {
    const carried = await carriedFootingForTrack(supabase, row.id);
    if (carried) {
      await supabase
        .from("spine_tracks" as never)
        .update({
          last_hold: "the-call-is-yours",
          /* F-127: the hold word carries the meaning. */
          last_hold_because: null,
          driven_at: new Date().toISOString(),
        } as never)
        .eq("id", row.id);
      return {
        trackId: row.id,
        station,
        moved: false,
        arrivedAt: null,
        hold: "the-call-is-yours",
        /* `say` is declared below this point; the line is the hold's own and
           needs no decoration, so it is used directly. */
        line: HOLD_LINE["the-call-is-yours"],
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
  const correctionBack =
    history.last && history.last.to === station
      ? correctionNote(
          history.last.from,
          station,
          needIsMet(STATION_NEEDS[history.last.from], filed) ? "not-enough" : "absent",
        )
      : null;

  /*
   * F-78 — WHY THIS STATION IS RUNNING AGAIN WHEN NOBODY SENT IT BACK.
   *
   * The paragraph above applies word for word to the self-check, and until now it
   * did not reach it. A station held at `self-check-failed` was re-dispatched with
   * the same inputs it had the first time: `verification.reason` went into the
   * human-readable line and nowhere else, and `priorHold` is read by correction.ts
   * rather than by the brief. So the crew re-ran, filed the same thing, and failed
   * the same check — which is why F-76 had to bound the retry with an attempt
   * instead of leaving it free. This is the half that makes it Devin's loop
   * rather than a repetition.
   *
   * The reason is RECOMPUTED here from what is on the record, never stored — the
   * same choice `correctionNote` makes, for the same two reasons: no model call,
   * and it cannot go stale. If a later seat of the previous visit already fixed
   * the problem, the recomputed check passes, the reason is absent, and the
   * station is told nothing rather than being sent after a fault it no longer has.
   *
   * A correction outranks it: work sent back from a later station is the more
   * informative failure, and a station should hear that first rather than about
   * its own earlier refusal.
   */
  /*
   * The other half of the same loop. `selfCheckBack` speaks to a station that
   * filed something bad; this speaks to one that filed nothing, which is the
   * more common and until now the more silent failure.
   */
  const producedNothingBack =
    !correctionBack && row.last_hold === "produced-nothing"
      ? producedNothingNote(station, await lastAnswerOnTrack(supabase, row.id))
      : null;

  const selfCheckBack =
    !correctionBack && row.last_hold === "self-check-failed"
      ? selfCheckNote(
          station,
          (
            await verifyStationOutput(
              supabase,
              station,
              await filedAtStation(supabase, row.id, station),
            )
          ).reason ?? null,
        )
      : null;

  const backNote = correctionBack ?? selfCheckBack ?? producedNothingBack;
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
   * The halt's OWN sentence, which names the thing that stopped the run.
   *
   * ── F-134 (S1 -> S0): the true sentence existed and never reached a screen ──
   * `result.halted` carries `{ kind, reason }` and only the kind was kept. The
   * reason for an `agent-disabled` halt is *"<slug> is switched off, so this run
   * was cancelled instead of resumed"* — it NAMES THE AGENT, which is exactly
   * what `last_hold_because` exists to carry.
   *
   * My F-127 note argues that branch should write nothing, and it is right about
   * what it was looking at: `HOLD_LINE[kind]` is a static map the reader already
   * derives. This is not that. A generic line in a column meant for specifics is
   * worse than a null; a specific one is the whole point of the column.
   */
  let haltedBecause: string | null = null;
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
  /**
   * True when Build's changeset has already reached a pull request, so its crew
   * is skipped. Declared out here because the skip is decided beside the crew and
   * read again where the station's output is judged.
   */
  let buildAlreadyHandedOn = false;
  /** What Build's own check refused, when the crew is being re-run to fix it. */
  let fixNote: string | null = null;
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
     * -- BUILD HAD ALREADY FINISHED, AND THE SWEEP RAN IT AGAIN EVERY TICK ----
     *
     * MEASURED ON THE LIVE RUN, 2026-09-02. Track `6817e386` reached Build at
     * 20:50 UTC, staged, committed and opened pull request #4 on the bound
     * customer repository. The sweep came round at 21:00 and ran Build AGAIN:
     * six stage-commit-checks cycles in the first visit and another set in the
     * second, all onto the same branch. `studio.pr.open` correctly returned the
     * existing PR rather than opening a second, so the damage is not a duplicate
     * PR -- it is that THE BRANCH GROWS A COMMIT EVERY TEN MINUTES and the diff
     * the reviewer judged is not the diff that is there a tick later.
     *
     * WHY NOTHING STOPPED IT. Every gate in this function that could have asks a
     * question about the ARTIFACT: `producedThisVisit` asks whether anything was
     * filed, `STATION_NEEDS.ship` asks whether a changeset exists, and the F-72
     * gate below asks whether it is still merely `staged`. Not one of them asks
     * whether Build's work is OVER, and a changeset sitting at `pr_open` answers
     * yes to every question they do ask -- so the station looked incomplete
     * forever and was re-dispatched forever.
     *
     * `pr_open` and `merged` both mean the change has LEFT this station: there
     * is a branch and a pull request, which is precisely what Ship needs to point
     * at. Refusing on those two rather than allow-listing the rest keeps a future
     * status working by default, the same shape the F-72 gate below uses for the
     * same reason.
     *
     * IT SKIPS THE CREW, IT DOES NOT SKIP THE STATION. The self-check still runs,
     * the acceptance gate still reads the reviewer's verdict, and the advance
     * still goes through the ordinary path -- so a change that opened a PR and
     * does not meet the spec is still sent back. What is removed is only the
     * re-dispatch of seats whose work is already on the record.
     */
    if (station === "build") {
      /* Through the mission. This read said `.eq("track_id", row.id)` when it
         first shipped and that column does not exist, so the rule evaluated to
         "no changeset" and never fired -- which A1 caught on the live run when
         `6817e386` rebuilt at `pr_open` anyway. See `newestChangesetForTrack`.

         A null answer still means RUN the crew, which is the pre-P-03 behaviour:
         a read we could not make is not evidence that Build is finished, and
         skipping a station on it would strand work that genuinely needs it. */
      const done = await newestChangesetForTrack(supabase, row.id, "status");
      const st = typeof done?.status === "string" ? done.status : null;
      if (st === "pr_open" || st === "merged") {
        /*
         * -- AND IT IS ONLY FINISHED IF ITS OWN CHECK SAYS SO ----------------
         *
         * MEASURED ON THE LIVE RUN, 23:20 and 23:30 UTC 2026-09-02, and this is
         * a defect in the rule immediately above rather than a new case.
         * `2fdf93b6` went from 0 attempts to 2 with NO agent_runs row and no
         * tool call: its changeset was `pr_open` with red CI, so the rule
         * skipped the crew, the self-check afterwards re-read the same red CI,
         * counted an attempt, and parked. At 3 it would have given up.
         *
         * The send-back had nobody to send to. The crew that would stage the fix
         * is exactly the crew the rule was skipping, so the loop was refusing to
         * run the only thing that could clear the refusal -- forever, and with
         * an attempt burned each time.
         *
         * So the changeset's status is half the question and the station's own
         * check is the other half:
         *
         *   pr_open, check holds       finished. Skip the crew, as before.
         *   pr_open, check did not     NOT finished. Run the crew, which is what
         *                              `studio.fix.commit` exists for: append the
         *                              fix to the same branch and the same PR.
         *
         * Asked BEFORE the crew rather than after, which is the whole shape of
         * the fix. The enforcing check further down runs after seats have
         * spent money; this one is a read, and its only job is deciding whether
         * there is anything for them to do.
         */
        const alreadyRight = await verifyStationOutput(
          supabase,
          station,
          unionFiled([], await filedAtStation(supabase, row.id, station)),
          row.id,
        );
        buildAlreadyHandedOn = alreadyRight.passed;
        if (!alreadyRight.passed) {
          /* The crew runs, and it runs KNOWING what its own check refused --
             the failing acceptance lines or the red checks, in the words the
             check used. Without this it would re-stage blind against a branch
             that is already wrong, which is the loop the seat cannot see. */
          fixNote = selfCheckNote(station, alreadyRight.reason ?? null);
        }
      }
    }

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
    for (
      let seatIndex = startSeat;
      // The crew is skipped whole rather than seat by seat: a changeset at
      // `pr_open` is finished for the builder AND for the reviewer, and running
      // half a crew over work that is already on a pull request is the same
      // defect at half the cost.
      !buildAlreadyHandedOn && seatIndex < crew.length;
      seatIndex++
    ) {
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
          /* The fix note wins where there is one. It is the more specific of the
             two and it is about THIS branch: `backNote` says a station could not
             finish, while this says the pull request that already exists does
             not hold and names what refused it. */
          fixNote ?? backNote,
          specId,
          workBranch,
          /* R-36 / P-40. The hold Sense wrote when it carried this track here on
             the sentence alone. The driver is the one place that reads it, so
             `stationGoal` stays a total function of its arguments. */
          (row.last_hold as string | null) === CARRIED_ON_YOUR_SENTENCE,
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
        // F-134. Captured BEFORE the kind is mapped, because this is the only
        // place the halt's own words are in scope and the write is 100 lines
        // below. Set unconditionally and read only when `haltedAs` is truthy,
        // so an unmapped halt kind can leave a value nothing ever uses.
        //
        // Written flat rather than inside a second guarded block on the same
        // variable: my first version added one, and the sibling guard in
        // `a-halted-run-is-not-a-station-that-failed` finds the halt branch by
        // searching for that opening line. A second occurrence made it slice the
        // wrong block. The test was right and the edit was ambiguous.
        //
        // The phrasing here is deliberate too. My first comment QUOTED the line
        // the guard searches for, so the search found this comment instead of
        // the code -- a guard matching its own documentation, which is the
        // fourth time that shape has cost me tonight and the first time I did it
        // to somebody else's guard. Their test reads raw source; mine strips
        // comments, which is exactly why only theirs caught it.
        haltedBecause = result.halted.reason?.trim() || null;
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
  await rememberGates(supabase, row, opened, gates.keep);

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

  /*
   * ══ THE WALL IS THE FACT. EVERYTHING AFTER IT IS A CONSEQUENCE. ═════════
   *
   * A claim refusal seen during this drive ends the drive, here, before any
   * other writer runs. Not out-of-time, not the self-check, not the refusal
   * path, not the correction loop.
   *
   * ── WHY THIS IS ONE RETURN AND NOT A CHECK IN EACH OF THEM ─────────────
   * It was two checks in two branches, added one live tick apart, and both were
   * right about their own branch and wrong about the shape:
   *
   *   23:50 UTC  the claim lost to `out-of-time`. Fixed in the deadline branch.
   *   00:50 UTC  the claim lost to `self-check-failed`, which runs after the
   *              crew and so after that fix. Same defect, next writer along.
   *
   * There are seven writers downstream of this point and patching them in the
   * order a live run happens to reach them is a losing game -- the eighth is
   * written by somebody who never reads this comment. The claim is established
   * ONCE, where the crew's steps first exist, and the function returns. A writer
   * that cannot run cannot overwrite.
   *
   * Everything those writers would have said is TRUE and none of it is the
   * point. The drive did run long; the checks are red; the station did file
   * nothing new. All of that is downstream of a file this run may not write, and
   * a person told "the checks are red" goes and looks at the checks instead of
   * at the run that is holding the file.
   *
   * NO ATTEMPT, for the reason the hold itself carries: nothing this station did
   * was wrong and there is nothing to do differently until the other run merges.
   * The spend above is still recorded, because the money was still spent.
   */
  {
    const claimRefusal = refusedTool(steps);
    if (claimRefusal && refusalIsAClaimedPath(claimRefusal.tool, claimRefusal.error)) {
      const held = claimedPathFrom(claimRefusal.error);
      const because = waitingOnAnotherRun({
        path: held.path ?? "a file",
        missionTitle: held.missionTitle,
        prNumber: null,
      });
      await supabase
        .from("spine_tracks" as never)
        .update({
          last_hold: CLAIMED_PATH_HOLD,
          last_hold_because: because,
          driven_at: new Date().toISOString(),
        } as never)
        .eq("id", row.id);
      return {
        trackId: row.id,
        station,
        moved: false,
        arrivedAt: null,
        hold: CLAIMED_PATH_HOLD,
        line: flagged(because),
        attached,
      };
    }
  }

  // Out of TIME, ours rather than the station's, so it is reported before the
  // budget hold and never counts as an attempt. The work is fine and the money
  // is fine; the Worker driving it has a duration limit.
  if (ranLong) {
    await supabase
      .from("spine_tracks" as never)
      .update({
        last_hold: "out-of-time",
        // Cleared for the reason at the `decision.hold` write above: this hold
        // has no sentence of its own and must not wear the last one's.
        last_hold_because: null,
        driven_at: new Date().toISOString(),
      } as never)
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
      .update({
        last_hold: haltedAs,
        last_hold_because: haltedBecause,
        driven_at: new Date().toISOString(),
      } as never)
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

  /*
   * ── R-39: THE CALL WENT BACK TO THE PERSON (P-71b) ─────────────────────
   *
   * P-71 put the refusal in the decision writer: a `do-not-build` resting on
   * absence, on a track carried from the person's own sentence, cannot be
   * recorded. That stops the wrong row being written and leaves the track with
   * nowhere to go, which is only half an answer -- the person still typed a
   * sentence and is owed one.
   *
   * So the refusal becomes a QUESTION. The track holds `waiting-on-a-person`
   * and the run screen draws `CARRIED_CHOICE`: build it on your word, or point
   * a source first. No spend: nothing is dispatched again until they answer.
   *
   * KEYED ON THE REFUSAL HAVING HAPPENED, not on the state it leaves behind. A
   * strategist that simply produced nothing lands in the same state, and so
   * does a run that failed; only the refusal means a no was ATTEMPTED on the
   * person's own sentence, which is the one thing worth asking about.
   *
   * IT DOES NOT COUNT AS AN ATTEMPT, for the reason the boundary hold gives
   * just below: the station did its job and handed a real question to a person.
   * Counting it would spend the track's stall ceiling on the person's thinking
   * time.
   */
  if (station === "decide" && traceIds.length > 0) {
    /* Scoped, under P-67: `tool_calls` is the most revealing row this product
       holds. The trace ids already come from this track's runs, so this is
       defence, and it costs nothing. Unresolved stays unfiltered. */
    let refusalsQ = supabase.from("tool_calls").select("error");
    if (row.workspace_id) refusalsQ = refusalsQ.eq("workspace_id", row.workspace_id);
    const { data: refusals } = await refusalsQ.in("trace_id", traceIds).eq("ok", false).limit(50);
    const errors = ((refusals ?? []) as Array<{ error: string | null }>).map((r) => r.error);
    if (refusalHappened(errors)) {
      await supabase
        .from("spine_tracks" as never)
        .update({
          last_hold: "the-call-is-yours",
          /*
           * NULL, and the hold WORD carries the meaning -- F-127's invariant,
           * which `a-hold-must-say-why.test.ts` holds for every hold whose line
           * is derived on read. The first draft of this stored the question
           * here and broke it: a sentence in this column is for a cause the
           * word cannot express, and this word expresses exactly one thing.
           */
          last_hold_because: null,
          driven_at: new Date().toISOString(),
        } as never)
        .eq("id", row.id);
      return {
        trackId: row.id,
        station,
        moved: false,
        arrivedAt: null,
        hold: "the-call-is-yours",
        line: say(HOLD_LINE["the-call-is-yours"]),
        attached,
      };
    }
  }

  /*
   * ── R-40: A DESIGN VERDICT AGAINST THE PREMISE HOLDS HERE (P-72) ───────
   *
   * On the tablet track the critic said the spec's premise contradicts the
   * brief, the track recorded that as a note and walked on to Build, and what
   * reached a customer's repository was 90 lines of CSS for a component that
   * does not exist.
   *
   * A critic that says the work is aimed at the wrong thing has not found a
   * detail to improve. It has found that the next station should not run, and a
   * note is not a control.
   *
   * `waiting-on-a-person` rather than `self-check-failed`: nothing malfunctioned
   * and retrying changes nothing. The spec and the drawing disagree about what
   * the work is, and only a person can settle which one is wrong.
   *
   * A CRITIC THAT DID NOT RUN IS NOT A VERDICT AGAINST. A missing or unreadable
   * review leaves the track exactly as it was, for the reason every evidence
   * check here gives: absence is not evidence.
   */
  if (station === "design") {
    const verdict = await designVerdictForTrack(supabase, row.id);
    if (designVerdictHolds(verdict)) {
      const because = designHoldLine(verdict);
      await supabase
        .from("spine_tracks" as never)
        .update({
          last_hold: "waiting-on-a-person",
          /*
           * F-127 requires this hold to clear its sentence, because the GATE is
           * normally the reason. There is no gate row here and the critic's own
           * words ARE the reason, so they are carried in the returned line
           * instead of the column, and the column is cleared as the invariant
           * demands. The run screen reads the verdict from the record.
           */
          last_hold_because: null,
          driven_at: new Date().toISOString(),
        } as never)
        .eq("id", row.id);
      return {
        trackId: row.id,
        station,
        moved: false,
        arrivedAt: null,
        hold: "waiting-on-a-person",
        line: flagged(because),
        attached,
      };
    }
  }

  // Out of budget. Not a failure and not a refusal: the work is fine, the money
  // is finished. It deliberately does NOT count as an attempt, because attempts
  // exist to stop a station that cannot do its job, and this one was never given
  // the chance. Raising the ceiling resumes exactly where it stopped.
  if (overBudget) {
    await supabase
      .from("spine_tracks" as never)
      .update({
        last_hold: "over-budget",
        last_hold_because: null,
        driven_at: new Date().toISOString(),
      } as never)
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
        // The gate is the reason, and the gate is on the record. A sentence from
        // a previous hold left beside it would name the wrong cause entirely.
        last_hold_because: null,
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
    /*
     * F-175. THE ONE SENTENCE THAT NAMES THE FAILURE, WRITTEN DOWN.
     * `failed` is the thrown message and exists nowhere else once this tick
     * ends. `outside` is null on purpose: that arm's line is `HOLD_LINE[hold]`,
     * which the reader already derives, and F-127 is right that storing a
     * generic line in a column meant for specifics is worse than a null.
     */
    const because = outside ? null : `${station} did not complete: ${failed}`;
    await supabase
      .from("spine_tracks" as never)
      .update({
        ...(outside ? {} : { attempts: (row.attempts ?? 0) + 1 }),
        last_hold: hold,
        last_hold_because: because,
        driven_at: new Date().toISOString(),
      } as never)
      .eq("id", row.id);
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      hold,
      // Built FROM `because` rather than beside it, so the column and the
      // screen cannot drift into saying two different things.
      line: flagged(because ?? holdLine(hold, { station }) ?? HOLD_LINE[hold]),
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
  const producedThisVisit =
    /*
     * A BUILD THAT ALREADY OPENED A PULL REQUEST HAS PRODUCED, whatever this
     * visit harvested.
     *
     * Stated here rather than by faking an attachment, because the two facts are
     * different and only one of them is true: nothing was filed on THIS visit,
     * and the station's work is nonetheless done. Without this the skip above
     * would fall into `produced-nothing`, count an attempt, and hand a finished
     * Build to the correction loop -- which is a worse failure than the
     * re-dispatch it replaces.
     */
    buildAlreadyHandedOn ||
    didStationProduce({
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
  const refusalFound = producedThisVisit
    ? null
    : (refusedTool(steps) ?? (await refusedToolInTraces(supabase, traceIds)));

  /*
   * ── F-130: A MERGE CONFLICT IS NOT A LOCKED DOOR ───────────────────────
   *
   * F-41's premise above is that a refused tool failed "for a reason that has
   * nothing to do with the work". True of the 401 it was written against, and
   * **false of a merge conflict**, which is entirely about the work. The
   * terminality argument fails for it too: `correction.ts` makes
   * `tools-refused` terminal because "there is no cheap way to test whether
   * the ask has been met", and a conflict is answered by a plain GET.
   *
   * So the most ordinary and most fixable thing in software was permanently
   * ending a piece of work. S4 measured every real merge failure in this
   * product's life: eight, of which FIVE are conflicts.
   *
   * A refusal that is about the work takes the ORDINARY path instead — the
   * attempt counts, and three of them hand it to `decideCorrection`, which
   * sends it back to be redone. That is the right answer here because
   * `studio.commit` branches off the CURRENT default-branch head, so
   * rebuilding resolves the conflict with nobody rebasing anything.
   *
   * Everything else still takes F-41's path, because for everything else its
   * premise holds.
   */
  const refusal =
    refusalFound && refusalIsAboutTheWork(refusalFound.tool, refusalFound.error)
      ? null
      : refusalFound;

  if (refusal) {
    await supabase
      .from("spine_tracks" as never)
      .update({
        // attempts deliberately UNCHANGED.
        last_hold: "tools-refused",
        /*
         * ── F-127, AND THIS IS THE INSTANCE THAT MATTERS MOST ─────────────
         *
         * The specific sentence is built four lines below and returned, and it
         * is the only one on this path that names a real external cause: the
         * tool, and what that tool actually said.
         *
         * S4 measured the real merge failures across the product's life: EIGHT,
         * of which FIVE are *"GitHub merge 405: Pull Request has merge
         * conflicts"*. A conflict is not something a deploy or a prompt fixes,
         * and under F-75 auto-merge the loop will meet it again with no person
         * in the run. Without this the track would say only "this station could
         * not use a tool it needed", and the one fact that tells a person what
         * to do — that the branch will not merge — would sit in a run output.
         *
         * Stored WITHOUT the `holdLine` prefix, deliberately: that half is
         * derived from `last_hold` on read, and storing it too would put the
         * same sentence on screen twice.
         */
        last_hold_because: `It was ${refusal.tool}, which said: ${refusal.error}`,
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
   * station. If verification fails, hold at "self-check-failed" and count an
   * attempt, so the station retries a bounded number of times and then routes to
   * `decideCorrection` like every other station that cannot finish.
   *
   * S0-002 — IT COUNTS AN ATTEMPT NOW, AND IT DID NOT BEFORE.
   *
   * The original left `attempts` unchanged, reasoning that a quality check is
   * not a failure. The reasoning is fair and the effect was not: `attempts` is
   * the ONLY thing that bounds a station. Leaving it at 0 meant
   * `MAX_STATION_ATTEMPTS` never tripped, `given-up` never fired,
   * `decideCorrection` was never reached, and every stuck-work alarm keyed on
   * the counter stayed silent — while each tick re-ran the full crew at real
   * cost. Spend rising while a counter stays 0 is the exact shape this repo has
   * already paid for once.
   *
   * A free retry would also buy nothing here. `reason` is not persisted and
   * `priorHold` reaches `correction.ts` rather than the station brief, so the
   * retry re-runs identical inputs and produces an identical result. An
   * unbounded retry that cannot learn is strictly worse than a bounded one.
   * Feeding the reason back into the brief is the follow-up that makes this
   * Devin's loop in full; until then, bounded is the honest shape.
   *
   * `needs-evidence` below still leaves `attempts` alone and is right to: it
   * waits on a CLOCK, which resolves itself and costs nothing to wait for. This
   * one waits on a crew, which does not and does.
   */
  if (producedThisVisit && !failed && !haltedAs && !overBudget && !ranLong) {
    // F-77: judged on everything this station has filed, not just this visit's
    // harvest, so a crew split by the clock is not refused for its earlier seat's
    // work being invisible here.
    const verification = await verifyStationOutput(
      supabase,
      station,
      unionFiled(attached, await filedAtStation(supabase, row.id, station)),
      // F-148: the track, so Build's gate can read whether its checks RAN. Only
      // this call site enforces; the note-building one above wants a reason.
      row.id,
    );
    /*
     * -- WRITTEN WHETHER IT PASSED OR NOT, WHICH IS THE POINT ----------------
     *
     * Before this, the check's result reached the database only through
     * `last_hold_because` -- written ONLY on a failure, and overwritten by the
     * next drive. So the check that runs on almost every drive was invisible for
     * the case that happens almost every time, and there was no number anywhere
     * that could answer "how many times did this run check itself".
     *
     * Placed BEFORE the failure branch below, because that branch returns. A
     * write after it would record only the passes, which is the same blindness
     * pointing the other way.
     */
    await recordSelfCheck(supabase, driveId, verification.checks);
    if (!verification.passed) {
      await supabase
        .from("spine_tracks" as never)
        .update({
          /*
           * Counted: `attempts` is the only thing that bounds a station, and the
           * only thing any stuck-work alarm reads. See the block above.
           *
           * -- UNLESS NO CREW RAN, 2026-09-02 -------------------------------
           * `2fdf93b6` went from 0 attempts to 2 across two ticks with NO
           * `agent_runs` row and no tool call. Its changeset was `pr_open` with
           * red CI, so the done rule skipped the crew and this line counted an
           * attempt anyway -- three of those and the work is given up, having
           * never dispatched a seat.
           *
           * An attempt is a try. A drive that ran nobody did not try, so it does
           * not spend one. The gate above now runs the crew in fix mode when the
           * check does not hold, so a genuine repeated failure still counts and
           * still reaches a person; what is removed is the count on a drive that
           * did no work.
           */
          attempts: buildAlreadyHandedOn ? (row.attempts ?? 0) : (row.attempts ?? 0) + 1,
          last_hold: "self-check-failed",
          // F-175: the verifier's own reason. Null when it gave none, rather
          // than the derivable half of the line.
          last_hold_because: verification.reason ?? null,
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
      // F-175: hoisted so the row and the screen carry one sentence, not two
      // copies of it. The DATE is the part no reader can derive from the word.
      const because = `The forecast this work is graded against comes due on ${dueIso.slice(0, 10)}. Learn returns when it does; nothing here is waiting on a person.`;
      await supabase
        .from("spine_tracks" as never)
        .update({
          // attempts deliberately UNCHANGED: honesty must not cost the station.
          last_hold: "needs-evidence",
          last_hold_because: because,
          driven_at: new Date().toISOString(),
        } as never)
        .eq("id", row.id);
      return {
        trackId: row.id,
        station,
        moved: false,
        arrivedAt: null,
        hold: "needs-evidence",
        line: say(because),
        attached,
      };
    }
  }

  /*
   * ── A SENTENCE WITH NO EVIDENCE IS CARRIED, NOT CIRCLED (R-36, P-40) ─────
   *
   * On the founder's own run (`870b70d3`, pressed 14:12 IST) three seats at
   * Sense searched the workspace, found nothing bearing on his sentence, and
   * said so. The driver could not tell that from a seat that simply did nothing,
   * so it counted `produced-nothing` three times and the track was one tick from
   * *Needs a restart* with nothing built. **His sentence WAS the evidence and
   * the loop treated it as a failed search.**
   *
   * TYPED, NOT MATCHED. The seat now calls `sense.found_nothing`, so this reads
   * a tool call rather than grepping prose. That is the instrument the
   * `produced-nothing` block below asked for in its own words: telling a
   * reasoned refusal from an empty visit "deserves a better instrument than a
   * substring".
   *
   * WHY IT DOES NOT SPEND AN ATTEMPT. Attempts exist to stop a station that
   * cannot finish from looping for ever. This station DID finish: it answered
   * the question it was asked, and the answer was "nothing here". Retrying it
   * cannot change that answer, so charging for it converts a correct, complete
   * outcome into a countdown to giving up.
   *
   * ONLY SENSE, AND ONLY THIS REASON. A halt, a throw or a credit refusal keeps
   * the existing rule: those did not answer anything, and their branches are
   * above this one. `attempts` is left untouched rather than reset, because
   * nothing about the earlier attempts became untrue.
   */
  if (station === "sense" && !producedThisVisit) {
    const saidNothingHere = steps.some(
      (st) => st.name === "sense.found_nothing" && st.ok !== false && st.kind !== "queued",
    );
    if (saidNothingHere) {
      const carriedTo = nextStation(routeOf(row), station);
      const because = NOTHING_SPEAKS_TO_THIS;
      await supabase
        .from("spine_tracks" as never)
        .update(
          (carriedTo
            ? {
                station: carriedTo,
                /* NOT reset to 0. A move normally resets attempts because the
                   work advanced on its merits; here it advanced because there
                   was nothing to find, and an earlier station's spent attempts
                   remain true. */
                station_drives: 0,
                last_hold: CARRIED_ON_YOUR_SENTENCE,
                last_hold_because: because,
                driven_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : {
                last_hold: CARRIED_ON_YOUR_SENTENCE,
                last_hold_because: because,
                driven_at: new Date().toISOString(),
              }) as never,
        )
        .eq("id", row.id);
      return {
        trackId: row.id,
        station,
        moved: Boolean(carriedTo),
        arrivedAt: carriedTo,
        /* The hold is carried WITH the move, which is unusual and deliberate:
           it is not stopping the work, it is the footing the next station and
           the reader both need. Decide's brief reads it to mark the decision. */
        hold: CARRIED_ON_YOUR_SENTENCE,
        line: flagged(because),
        attached,
      };
    }
  }

  /*
   * ── A SHIP THAT CANNOT DEPLOY BECAUSE A SECRET IS MISSING IS NOT A FAILED
   * CREW (P-59b, A-QUEUE.md) ─────────────────────────────────────────────
   *
   * P-59 gave the hold CARD the right sentence: *"Ship has no preview host. Set
   * DENO_DEPLOY_TOKEN and DENO_DEPLOY_ORG on the Lovable project, then press Try
   * again."* The RECORD still fell into `produced-nothing` below, which counts
   * an attempt against the crew and reads as "the crew tried and produced
   * nothing" — the exact wrong attribution for a station that ran, reached the
   * host, and was correctly turned away for a secret nobody on this run could
   * set. `shipStopFrom` is P-59's own classifier, read here from the newest
   * deployment this track's changeset produced, so the card and the record
   * agree about the one question that decides whose move it is.
   *
   * ONLY `missing-provider` HOLDS AS `waiting-on-a-person`. `other` and
   * `unknown` fall straight through to the ordinary `produced-nothing` below —
   * a deploy that failed for a reason we cannot act on, or said nothing at all,
   * is not yet known to be a person's problem rather than the crew's.
   */
  if (!producedThisVisit && station === "ship") {
    const cs = await newestChangesetForTrack(supabase, row.id, "id");
    const changesetId = (cs?.id as string | undefined) ?? null;
    if (changesetId) {
      const { data: deploys, error: depErr } = await supabase
        .from("deployments")
        .select("failure_reason")
        .eq("changeset_id", changesetId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (depErr) {
        console.error(
          `[driver] could not read the newest deployment for track ${row.id}: ${depErr.message}`,
        );
      }
      const newest = ((deploys ?? []) as Array<{ failure_reason: string | null }>)[0] ?? null;
      const stop = shipStopFrom(newest?.failure_reason ?? null);
      if (shipStopWaitsOnAPerson(stop)) {
        const because =
          "DENO_DEPLOY_TOKEN and DENO_DEPLOY_ORG are not set, so Ship has no preview host to deploy to.";
        await supabase
          .from("spine_tracks" as never)
          .update({
            // attempts deliberately UNCHANGED: the crew did nothing wrong, so
            // this must not spend one of the station's three tries.
            last_hold: "waiting-on-a-person",
            last_hold_because: because,
            driven_at: new Date().toISOString(),
          } as never)
          .eq("id", row.id);
        return {
          trackId: row.id,
          station,
          moved: false,
          arrivedAt: null,
          hold: "waiting-on-a-person",
          line: say(because),
          attached,
        };
      }
    }
  }

  if (!producedThisVisit) {
    // F-87: read before the write, so the line can name what actually stopped it.
    // One query, only on the path where the station already filed nothing.
    const lastFailure = await lastFailingTool(supabase, traceIds);
    // F-175: the tool and its error, which is the whole of what F-87 went and
    // fetched. Null when nothing failed, because `HOLD_LINE["produced-nothing"]`
    // on its own is what the reader already derives from the word.
    /*
     * ── AT BUILD, SAY WHAT IT WAS LOOKING AT (F-186, found by S4 as S4-188) ───
     *
     * `produced-nothing` means *the station ran, completed cleanly, and filed
     * nothing*, and its own comment says that is "nearly always a tool the agent
     * could not reach or a brief it satisfied in prose". **There is a third
     * cause and it reads identically: the seat was handed the WRONG REPOSITORY
     * and said so.**
     *
     * Measured on `ce846e9b`, the closest this product has come to the
     * acceptance — five stations, zero presses, seventy minutes unattended. Its
     * Build seat reported, twice and then a third time: *"The repository
     * contains only checkout-related files (src/checkout/) and no notification
     * system components. The repo.tree shows 16 files total … This work belongs
     * in the main Relay app repository."* **It read the tree, searched four
     * relevant terms, found nothing, and named where the work belongs. That is
     * the seat being right**, and three of those is the give-up ceiling.
     *
     * `requireGithub` resolves a product from the CHANGESET and falls back to
     * the workspace's default connection, so **a track with no product binding
     * still reaches a repository — just not necessarily the right one**, and
     * nothing on the record said which. A reader seeing three identical
     * `produced-nothing` holds had to open `agent_runs.output` to find out the
     * repo was never the issue the retries were testing.
     *
     * This does not reclassify the hold and does not stop the retry: doing
     * either needs a way to tell a reasoned refusal from an empty visit that is
     * more than prose-matching, and R-26's *"a refused station is not a failed
     * station"* deserves a better instrument than a substring. **It makes the
     * missing fact visible**, which is F-175's law on the station where it cost
     * the most.
     */
    const noBinding = station === "build" && !row.product_id;
    const because = lastFailure
      ? `The last thing it tried was ${lastFailure.tool}, which said: ${lastFailure.error}`
      : noBinding
        ? "This track has no product binding, so Build worked against the workspace's default repository. If that is the wrong repo, the station is not stuck: the binding is."
        : null;
    await supabase
      .from("spine_tracks" as never)
      .update({
        attempts: (row.attempts ?? 0) + 1,
        last_hold: "produced-nothing",
        last_hold_because: because,
        driven_at: new Date().toISOString(),
      } as never)
      .eq("id", row.id);
    return {
      trackId: row.id,
      station,
      moved: false,
      arrivedAt: null,
      hold: "produced-nothing",
      /*
       * F-87. The generic line alone told track `7977dc06` "it will try again"
       * while its real obstacle was an unmerged PR no retry could fix. Naming the
       * last thing that did not work costs one query on a path where the station
       * already filed nothing, and it is the difference between a person waiting
       * and a person merging.
       */
      line: flagged(HOLD_LINE["produced-nothing"] + (because ? ` ${because}` : "")),
      attached,
    };
  }

  /*
   * ── A DECISION NOT TO BUILD MUST STOP THE BUILDING ────────────────────────
   *
   * The Decide brief tells the crew *"A 'no' is a decision and you file it the
   * same way as a yes"*, and on 2026-08-26 a strategist did exactly that:
   * *"Do not implement address reuse until post-fix abandonment evidence
   * emerges"*, with a forecast behind it, on track `a30238f5`.
   *
   * The spine walked it on to Define regardless, because `decisions.status`
   * had no value meaning no and the row was stored `approved`. Four stations of
   * agents were about to specify, design and build the thing the one station
   * whose job is stopping work had just refused. **That is the most expensive
   * defect this loop can have: Decide exists to prevent spend, and it could not.**
   *
   * WHY WAIVE RATHER THAN CLOSE THE TRACK. A refusal is not the end of the
   * work, it is an answer with a bet attached: that decision's forecast comes
   * due 2026-10-15 and is genuinely checkable. Closing the track would throw the
   * bet away and the loop would never learn whether the "no" was right. So the
   * four building stations are waived and the track walks Decide -> Learn, which
   * is the route the spine already knows how to express.
   *
   * `outcome-contested` is the reopen trigger, so if the verdict later shows the
   * refusal was wrong, the stations come back rather than needing a person to
   * remember this happened.
   */
  let onwardRoute = route;

  /*
   * Asked at LEARN, because that is the only station whose output can contest a
   * refusal. Checked before the onward step so a reopened station is the next
   * stop rather than something a later tick discovers.
   */
  if (station === "learn") onwardRoute = await reopenIfOutcomeContested(supabase, row, onwardRoute);

  /**
   * Did this route's call turn out to be "do not build"? Hoisted out of the
   * block below because the ADVANCE CHECK needs it too — see F-174 at the
   * `needIsMet` call further down.
   */
  let routeDeclined = false;

  if (station === "decide") {
    const declined = await decisionWasRefusal(supabase, row.id);
    routeDeclined = declined;
    if (declined) {
      for (const skipped of ["define", "design", "build", "ship"] as AgentStation[]) {
        onwardRoute = waive(onwardRoute, skipped, {
          by: "policy",
          reason: "The call was not to build, so there is nothing to specify or ship.",
          reopensWhen: "outcome-contested",
        });
      }
    }
  }

  const arrivedAt = nextStation(onwardRoute, station);

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
      /* -- F-72 HAS NEVER FIRED, AND THIS IS WHY (found 2026-09-03) ---------
         This read said `.eq("track_id", row.id)`. `studio_changesets` has no
         such column and never has: PostgREST answers 42703 with no rows, the
         error was not read, and `csStatus` was null on every track ever driven.
         So the gate written to stop a staged changeset reaching Ship evaluated
         to "no changeset" and did nothing, for as long as it has existed.
         See `newestChangesetForTrack` for the join that works. */
      const cs = await newestChangesetForTrack(supabase, row.id, "id,status");
      const csStatus = typeof cs?.status === "string" ? cs.status : null;
      if (csStatus === "staged") {
        // F-175: names the two calls that would clear it, which the hold word
        // cannot. `nothing-to-hand-on` has two causes and this is one of them.
        const because =
          "The change is staged but not committed, so there is no branch for Ship to point at. Call studio.commit, then studio.pr.open.";
        await supabase
          .from("spine_tracks" as never)
          .update({
            attempts: (row.attempts ?? 0) + 1,
            last_hold: "nothing-to-hand-on",
            last_hold_because: because,
            driven_at: new Date().toISOString(),
          } as never)
          .eq("id", row.id);
        return {
          trackId: row.id,
          station,
          moved: false,
          arrivedAt: null,
          hold: "nothing-to-hand-on",
          line: flagged(because),
          attached,
        };
      }
    }

    /*
     * ── A "DO NOT BUILD" MUST BE ABLE TO FINISH ITS ROUTE (F-174) ──────────
     *
     * The decline path could not complete, and the mechanism is the block
     * above meeting this one. When the call is "do not build", the driver
     * waives `define`, `design`, `build` and `ship` — correctly, because there
     * is nothing to specify or ship. `nextStation` therefore returns `learn`.
     * And `STATION_NEEDS.learn` wants `prd`, `changeset` or `deployment` —
     * **none of which a track that was correctly never built can ever hold,
     * because not building them IS the decision.** So the advance was refused
     * `nothing-to-hand-on`, an attempt was counted, and the crew re-decided the
     * same question every sweep because the route would not let it leave.
     *
     * Measured 2026-08-31 on the first track ever to reach this point: ten live
     * decision members, the FIRST approved and every one after DECLINED, filed
     * in pairs about a minute apart, twice per sweep. Exactly one track in the
     * database has a declined newest decision — so this is not a widespread
     * stall, it is the decline path dead-ending the first time it is walked.
     *
     * `decision.record`'s own comment records the previous half of this: a "no"
     * used to be stored `status: "approved"`, so the spine walked on and built
     * the thing the decision had just refused — *"the one station whose job is
     * to stop work could not."* That fix made the refusal EXPRESSIBLE. This one
     * lets it COMPLETE.
     *
     * WHY THE DECISION IS THE RIGHT PRECONDITION, AND WHY NOT JUST WAIVE LEARN.
     * Waiving Learn as well would close the route silently and lose the record,
     * which is the one option worth naming in order to refuse: **a forecast
     * attached to a NO is still a forecast**, and grading it is the whole moat.
     * A decline that reaches Learn can be graded as "we said no, and here is
     * what happened instead" — which is a verdict this product should want more
     * than most.
     *
     * Scoped to `routeDeclined` so it cannot loosen the ordinary path: a track
     * that WAS built still has to arrive at Learn with something built.
     */
    const need =
      routeDeclined && arrivedAt === "learn"
        ? {
            kinds: ["decision"],
            from: "decide" as AgentStation,
            missing: "the decision whose forecast Learn would grade",
            fix: "Record the call at Decide. A 'no' is a decision and Learn grades its forecast the same way it grades a yes.",
          }
        : STATION_NEEDS[arrivedAt];

    if (!needIsMet(need, filedNow)) {
      /*
       * F-175 AND IT IS THE SITE THAT COST ME THE MOST TODAY.
       *
       * Track `d2263583` held here four times in a row while `last_hold_because`
       * stayed NULL, and having no recorded reason I read this template out of
       * the source and reported it as though the record had said it. That was a
       * fabrication and I retracted it. **A hold that cannot say why invites the
       * reader to invent a reason, and the reader did.**
       *
       * `need.missing` and `arrivedAt` are computed here and nowhere else, so
       * this sentence dies with the tick unless it is written down. Measured
       * before the fix: 97 held tracks, ONE carrying a `last_hold_because`.
       */
      const because = `${station} filed something, but ${arrivedAt} still has no ${need.missing}. ${need.fix}`;
      await supabase
        .from("spine_tracks" as never)
        .update({
          attempts: (row.attempts ?? 0) + 1,
          last_hold: "nothing-to-hand-on",
          last_hold_because: because,
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
        line: flagged(because),
        attached,
      };
    }
  }

  /*
   * ── THE ROUTE CHANGED THIS TICK AND THE ROW HAS NEVER BEEN TOLD (F-178) ────
   *
   * `onwardRoute` is built above by `waive()` on a decline and by
   * `reopenIfOutcomeContested()` at Learn, and **neither result was ever
   * written.** It was recomputed from scratch every tick, which made the loop
   * behave correctly and left the RECORD saying nothing happened. Two things
   * followed, and the second is worse than the first.
   *
   * **THE ACCEPTANCE QUERY WENT BLIND.** Measured on `d2263583`, the live
   * candidate, 2026-08-31 17:31: it walked `sense -> decide -> learn`, was
   * DRIVEN AT TWO STATIONS ONLY, and its `waived` column read `[]`. That clause
   * exists in R-18's query for exactly one purpose — to guarantee the work went
   * through all seven — and it cannot see four stations skipped at runtime. The
   * track satisfies every structural clause of the acceptance while having
   * visited two of seven stations.
   *
   * **AND I OPENED THAT HOLE MYSELF, HOURS EARLIER.** Before F-174 a declined
   * track stuck at Decide and never reached Learn, so no such row could exist to
   * be miscounted. Unblocking the decline path made it reachable. *A fix that
   * unblocks a path can invalidate a measurement that only held while the path
   * was blocked* — and the measurement here is the one the whole project is
   * judged by.
   *
   * **THE SECOND CONSEQUENCE: THE DOCUMENTED REOPEN HAS NEVER BEEN ABLE TO
   * FIRE.** The waiver block above promises that if the verdict later shows the
   * refusal was wrong, *"the stations come back rather than needing a person to
   * remember this happened"*. `reopenIfOutcomeContested` opens with
   * `if (!route.waived.some(w => w.reopensWhen === "outcome-contested")) return`
   * — and `route.waived` is read from `row.waived`, which was always `[]`. The
   * trigger could never match, so the promise could never be kept.
   *
   * Written only when it CHANGED, so an ordinary tick still writes the same
   * columns it always did.
   */
  const routeChanged = JSON.stringify(onwardRoute.waived) !== JSON.stringify(route.waived);
  const waivedPatch = routeChanged ? { waived: onwardRoute.waived as never } : {};

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
            last_hold_because: null,
            ...waivedPatch,
            driven_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            ...waivedPatch,
            status: "done",
            attempts: 0,
            last_hold: null,
            last_hold_because: null,
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
  "id,user_id,workspace_id,product_id,title,origin,entry_station,station,path,waived,attempts,last_hold," +
  // F-43: the counter that catches a station which never converges.
  "station_drives," +
  /*
   * P-03b. The sweep compares this against `driven_at` to tell a track that has
   * genuinely changed from one that is being re-read every ten minutes for
   * nothing. Without it the comparison reads `undefined`, the filter answers
   * "cannot say", and the skip silently never fires -- which is the same
   * shape as the dead-column defects `a-query-cannot-name-a-column-that-does-
   * not-exist` was written for: correct-looking code that quietly does nothing.
   */
  "updated_at," +
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
 * F-87 — THE NEWEST FAILING TOOL, WHETHER OR NOT IT REFUSED.
 *
 * `refusedToolInTraces` above answers a narrower question: did a tool refuse for
 * a CREDENTIAL reason (401, 403, not configured, token expired). That set is
 * deliberately narrow and should stay narrow — it decides a terminal hold.
 *
 * This one answers "what was the last thing that did not work", and it decides
 * nothing. It only supplies a SENTENCE.
 *
 * ── WHY IT EXISTS, MEASURED LIVE 2026-08-26 13:20 UTC ──────────────────────
 * Track `7977dc06` sat at `ship`, one attempt from terminal, entry `sense` and
 * `waived = '[]'` — **two stations from the first acceptance this product has
 * ever had.** Its ship crew worked correctly: `ship.list_releases`,
 * `ship.in_production`, `build.changeset_history`, `build.list_sessions` all
 * `ok: true`. Then:
 *
 *   github.ci.read   ok:false  "GitHub get-pr 404: Not Found"
 *   release.publish  ok:false  "Only a merged changeset can promote. Merge the PR first."
 *
 * Neither carries a credential signature, so neither is a refusal, and both fall
 * to `produced-nothing`, whose line reads *"This station ran but filed nothing…
 * It will try again."*
 *
 * **That sentence is false in the way that matters.** Ship did not fail to
 * produce; it declined to publish an unmerged changeset, which is it working. No
 * retry can fix an unmerged PR, so "it will try again" points a person at
 * patience when what is needed is a merge. A board that says this is a dead end
 * wearing a progress bar, and R-20 §5 forbids exactly that.
 *
 * The hold stays `produced-nothing` — nothing WAS filed, and that is the honest
 * classification. Only the line changes, to name the obstacle.
 */
/**
 * THE LAST THING THIS TRACK'S CREW ACTUALLY SAID.
 *
 * Read for the `produced-nothing` retry, so a station is not re-dispatched with
 * no memory of the conclusion it reached ten minutes ago. One row, newest first.
 *
 * Fail-soft to null: a station told nothing gets the weaker note rather than no
 * run, because an unreadable transcript is a reason to be less specific, never a
 * reason to stop the work.
 */
async function lastAnswerOnTrack(
  supabase: SupabaseClient,
  trackId: string,
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("agent_runs")
      .select("output")
      .eq("track_id", trackId)
      .not("output", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as { output?: string | null } | null)?.output ?? null;
  } catch {
    return null;
  }
}

async function lastFailingTool(
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
      .order("created_at", { ascending: false })
      .limit(1);
    // A read that failed proves nothing, so it claims nothing.
    if (error || !data?.length) return null;
    const row = data[0] as { tool_name?: string; error?: string | null };
    const err = (row.error ?? "").trim();
    if (!err) return null;
    return { tool: row.tool_name ?? "a tool", error: err.slice(0, 200) };
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

/**
 * DID THIS TRACK'S DECIDE SAY NO?
 *
 * Reads the newest decision filed against this track and asks one question of
 * it. `declined` is written by `decision.record` when the crew passes
 * `call: "do-not-build"`, and it is the only status that means the answer was no
 * — `approved`, `pending`, `standing` and `superseded` all mean the work stands.
 *
 * Fail-soft to false, deliberately: a track that cannot be read must keep its
 * ordinary route. Guessing "refused" on an unreadable row would silently cancel
 * four stations of real work, which is the more expensive way to be wrong.
 */
/**
 * A REFUSAL THAT THE OUTCOME CONTESTS MUST BE ABLE TO COME BACK.
 *
 * When Decide says no, `driveTrackOnce` waives Define, Design, Build and Ship
 * with `reopensWhen: "outcome-contested"` and the track walks straight to Learn.
 * That comment promised the stations return if the verdict later disagrees.
 *
 * **Nothing implemented it.** `route.ts` says so in three places: *"Nothing
 * reads `reopensWhen`"*, *"`applyTrigger` is the evaluator and it has no
 * caller"*, *"a waiver is a one-way door today"*. So the promise I wrote into
 * that waiver was a claim outrunning its wiring, which is the exact defect this
 * repo names, committed in the fix that named it.
 *
 * This is the evaluator's first caller, and it fires on the one condition that
 * can honestly contest a refusal: **Learn graded the bet and the bet did not
 * hold.** A `missed` or `mixed` verdict against the decision that said no is
 * evidence the no was wrong, and the four stations it skipped come back.
 *
 * A `validated` verdict changes nothing: the refusal was right, and reopening on
 * agreement would make the trigger meaningless.
 *
 * `never` waivers are untouched by `applyTrigger` itself, so a human's
 * deliberate skip is not undone by a machine reading an outcome.
 */
async function reopenIfOutcomeContested(
  supabase: SupabaseClient,
  row: DriveRow,
  route: SpineRoute,
): Promise<SpineRoute> {
  // Cheap exit: no waiver carries this trigger, so nothing can fire.
  if (!route.waived.some((w) => w.reopensWhen === "outcome-contested")) return route;
  try {
    /*
     * Through the track's own members rather than a mission id, because a
     * driver-run track need not have one and the member row is the link the
     * spine actually keeps. Superseded rows are excluded: a verdict that a
     * rewind undid must not reopen anything.
     */
    const { data: member } = await supabase
      .from("spine_track_members" as never)
      .select("artifact_id")
      .eq("track_id", row.id)
      .eq("artifact_kind", "learning")
      .is("superseded_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const learningId = (member as { artifact_id?: string } | null)?.artifact_id;
    if (!learningId) return route;
    const { data } = await supabase
      .from("learnings")
      .select("verdict")
      .eq("id", learningId)
      .maybeSingle();
    const verdict = (data as { verdict?: string } | null)?.verdict;
    if (verdict !== "missed" && verdict !== "mixed") return route;
    return applyTrigger(route, "outcome-contested");
  } catch {
    // An unreadable verdict leaves the route alone. Reopening four stations on a
    // read error would spend real money on a guess.
    return route;
  }
}

/**
 * The newest design critic review on this track, or null.
 *
 * `prd_scaffolds.critic_review` is where it lands (design-scaffold.functions.ts
 * records the move off `prds.critic_review`), reached through the track's own
 * prototype member so this can never read another track's verdict.
 *
 * NULL ON ANY FAILURE, and that is the safe direction here: a review that
 * cannot be read is not a verdict against the work, and holding on one would
 * stop every track whose critic failed for its own reasons.
 */
async function designVerdictForTrack(
  supabase: SupabaseClient,
  trackId: string,
): Promise<DesignCriticReview | null> {
  try {
    const { data: member } = await supabase
      .from("spine_track_members" as never)
      .select("artifact_id")
      .eq("track_id", trackId)
      .eq("artifact_kind", "prototype")
      .is("superseded_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const id = (member as { artifact_id?: string } | null)?.artifact_id;
    if (!id) return null;
    const { data } = await supabase
      .from("prd_scaffolds")
      .select("critic_review")
      .eq("id", id)
      .maybeSingle();
    const raw = (data as { critic_review?: unknown } | null)?.critic_review;
    if (!raw) return null;
    return parseDesignCriticReview(raw);
  } catch {
    return null;
  }
}

/**
 * Is this track carried on the person's sentence, and still unanswered?
 *
 * The same two durable records `carriedEvidenceFor` reads in the tool registry
 * (P-71c): a drive that entered on the carried hold, or the `sense.found_nothing`
 * call the seat made. Read here too rather than shared across the module
 * boundary because the driver holds a service-role client and the registry holds
 * the caller's, and one helper taking either would hide which one asked.
 *
 * FALSE ON ANY FAILED READ, and false once a decision exists: a track that has
 * been decided is not waiting on this question, and re-raising it would ask
 * something already answered.
 */
async function carriedFootingForTrack(supabase: SupabaseClient, trackId: string): Promise<boolean> {
  try {
    const decided = await supabase
      .from("spine_track_members" as never)
      .select("artifact_id")
      .eq("track_id", trackId)
      .eq("artifact_kind", "decision")
      .is("superseded_at", null)
      .limit(1);
    if (decided.error) return false;
    if (((decided.data ?? []) as unknown[]).length > 0) return false;

    /* A signal on the track means the workspace is no longer empty for this
       sentence, so the footing has lifted and the strategist's call is its own
       again. Same rule as `footingIsCarried`. */
    const signals = await supabase
      .from("spine_track_members" as never)
      .select("artifact_id")
      .eq("track_id", trackId)
      .eq("artifact_kind", "signal")
      .is("superseded_at", null)
      .limit(1);
    if (signals.error) return false;
    if (((signals.data ?? []) as unknown[]).length > 0) return false;

    const drives = await supabase
      .from("track_drives")
      .select("entry_hold")
      .eq("track_id", trackId)
      .in("entry_hold", [CARRIED_ON_YOUR_SENTENCE, "the-call-is-yours"])
      .limit(1);
    if (drives.error) return false;
    return ((drives.data ?? []) as unknown[]).length > 0;
  } catch {
    return false;
  }
}

async function decisionWasRefusal(supabase: SupabaseClient, trackId: string): Promise<boolean> {
  try {
    const { data: member } = await supabase
      .from("spine_track_members" as never)
      .select("artifact_id")
      .eq("track_id", trackId)
      .eq("artifact_kind", "decision")
      .is("superseded_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const id = (member as { artifact_id?: string } | null)?.artifact_id;
    if (!id) return false;
    const { data } = await supabase.from("decisions").select("status").eq("id", id).maybeSingle();
    return (data as { status?: string } | null)?.status === "declined";
  } catch {
    return false;
  }
}
