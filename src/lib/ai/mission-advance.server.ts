/**
 * Deterministic mission advance (v6 Phase 1 — "the loop runs itself").
 *
 * Once the orchestrator has planned a mission's DAG (mission.plan) and dispatched
 * its first wave, the rest of the mission no longer needs the orchestrator model:
 * advancing is mechanical. This module is that engine —
 *   reflect child-run outcomes onto steps (+ bounded retry)
 *     → claim & dispatch every newly-ready step (threading memory into the hop)
 *       → finalize when the whole DAG is terminal.
 * It is:
 *   - model-free (no callModel) → cheap, deterministic, and safe to run every tick,
 *   - admin-client compatible → called by the resume-runs sweeper (admin client)
 *     AND by the advanceMission server fn (user client),
 *   - concurrency-safe on dispatch → claim-first CAS, so overlapping sweeper
 *     ticks can never double-enqueue the same step.
 *
 * The orchestrator model still owns the INITIAL plan + wave-0 dispatch; from
 * there this carries the mission to completion unattended (Appendix B: this is
 * the "mid-loop hops need the orchestrator re-invoked" gap, closed).
 *
 * Pre-migration tolerant: the retry columns (attempts/max_attempts/next_retry_at)
 * land on the next Lovable sync. Until then `hasRetryColumns` probes false and the
 * engine degrades to the prior behavior (no retry — a failed hop terminalizes),
 * while auto-advance + memory threading still work. No deploy-order dependency.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  enqueueHandoff,
  maybeCompleteMission,
  // Re-added 2026-07-11: the batched-resolution perf pass (7b3dcc20) removed
  // this import while advanceMissionCore still resolves the orchestrator
  // sender through it (single lookup outside the batched dispatch loop).
  resolveAgent,
  type HandoffPayload,
} from "./handoff.server";
import { recallMemoryRefs } from "./memory.server";
import { DEFAULT_MAX_ATTEMPTS, nextRetryAtIso, shouldRetryStep } from "./retry";
import {
  classifyRunOutcome,
  findPlaybook,
  verdictForPlaybookAttempt,
  type PlaybookAttemptOutcome,
} from "@/lib/playbooks/registry";

export type MissionLite = {
  id: string;
  user_id: string;
  workspace_id: string;
  goal: string;
  status: string;
};

type MissionStepRow = {
  id: string;
  idx: number;
  agent_slug: string;
  sub_goal: string;
  depends_on: number[];
  status: string;
  run_id: string | null;
  rationale: string | null;
  dispatched_at: string | null;
  workspace_id: string;
  user_id: string;
  /** Retry-tracking columns — absent until the P1 migration applies. */
  attempts?: number | null;
  max_attempts?: number | null;
  /** RF-05: the playbook mission.plan bound to this step, if its station has one. */
  playbook_id?: string | null;
};

/** A step claimed (status='dispatched') but left with no run_id this long is
 *  treated as a lost dispatch (worker eviction between claim and enqueue). */
const DISPATCH_LOST_MS = 3 * 60 * 1000;

/**
 * The child-run statuses that mean the run is STILL IN FLIGHT — i.e. the only
 * statuses that may leave a step sitting in 'dispatched'/'running'. Every other
 * status is terminal, and the last branch of the reflector terminalizes the step
 * once the run has carried it longer than UNKNOWN_STATUS_LOST_MS.
 *
 * THIS LIST IS THE THING A FUTURE WRITER MUST UPDATE when a status is added to
 * the agent_runs lifecycle. Forgetting to add a genuinely in-flight status here
 * now costs one bounded retry and a step error that names the status. Forgetting
 * the other way is what this file did before: it had no branch at all for
 * `completed_with_failures` — so every mission whose step ran into one sat at
 * 'Running' for weeks, with no error and nothing to click.
 *
 * WHAT THAT STATUS ACTUALLY IS, measured 2026-08-06 over all 1135 agent_runs:
 * `completed` 541, `completed_with_failures` 452, `failed` 126, `halted` 7,
 * `waiting_approval` 7, `complete` 2. An earlier version of this comment called
 * completed_with_failures "the single most common terminal status", which is
 * wrong — `completed` is, by 541 to 452. The point the sentence was making
 * survives the correction and is why the count is quoted at all: at 40% of every
 * run ever recorded, and more than three times as many as `failed`, it is an
 * ORDINARY outcome. A reflector with no branch for it was not missing an edge
 * case; it was missing the second most common thing that happens.
 *
 * Why each member is in it:
 *  - `queued`           enqueued, not yet picked up by the loop. (Past the
 *                       dispatch window `isLostQueuedRun` terminalizes it first,
 *                       so this membership only protects a FRESH queued run.)
 *  - `dispatched`       claimed for execution but not yet promoted to 'running';
 *                       counted as live by maybeCompleteMission
 *                       (handoff.server.ts) and by cancelMission's RUN_IN_FLIGHT.
 *  - `running`          the agent loop is executing it right now.
 *  - `waiting_approval` PAUSED ON A HUMAN, legitimately for days — production
 *                       runs have sat here 17 days against a genuinely pending
 *                       agent_approvals row. This member is load-bearing: the
 *                       stuck-run sweeper exempts the same status in two
 *                       independent places, and terminalizing it here would kill
 *                       work a person is still deciding on.
 */
const RUN_IN_FLIGHT_STATUSES = new Set(["queued", "dispatched", "running", "waiting_approval"]);

/**
 * The child-run statuses that mean the run FINISHED CLEANLY. The other half of
 * the closed world, and the half that is dangerous to under-fill: an in-flight
 * status left out of the set above costs one bounded retry, but a SUCCESS status
 * left out of this one is read as a failure — the defensive terminalizer at the
 * end of the reflector marks the step 'failed' with "unrecognised status", records
 * a playbook loss-shaped attempt, and skip-cascades every dependent. A delivered
 * job is then filed as a break, which is the one reading this engine must never
 * produce. So this is a named set rather than an inline `||` chain, for the same
 * reason RUN_IN_FLIGHT_STATUSES is: it is a list a future writer must find.
 *
 * Why each member is in it:
 *  - `completed` the agent loop's own clean finish (loop.server.ts:732, :1661).
 *  - `complete`  the single-agent path's spelling of the same thing
 *                (agents.functions.ts:210). crew.functions.ts normalizes it the
 *                same way and for the same reason. No mission step's run is
 *                written by that path today — both live 'complete' runs carry a
 *                null mission_id and no mission_steps row points at either
 *                (measured 2026-08-06) — so accepting it here is defence, and
 *                required defence, for the same reason `done` is.
 *  - `done`      written to agent_runs by the delegate fold on a SUCCESSFUL
 *                external job (src/lib/delegate/poll.server.ts:130 + :153-156),
 *                and documented as part of the agent_runs vocabulary in
 *                src/components/runs/run-state.ts:22, where :41 maps it to the
 *                same "done" reading as `completed`. This member was missing when
 *                the branch was an inline `||` chain, which is exactly the failure
 *                this doc block now exists to prevent.
 *
 * ON `done`'s LIVE EXPOSURE, so the next reader does not over- or under-read it:
 * zero agent_runs carry 'done' today (measured 2026-08-06 over all 1135 rows) —
 * the delegate path is dormant behind DELEGATE_OUTBOUND_ENABLED
 * (delegate/openhands.server.ts:28-31). And when it is switched on, foldDelegateResult
 * updates mission_steps to 'done' BEFORE it writes agent_runs, so the reflector
 * usually never sees the step at all. But that step write checks only `error` and
 * not whether it matched a row (poll.server.ts:139-151), so a fold that silently
 * matched zero rows leaves a live step against a 'done' run and lands here. Narrow
 * is not zero, and the cost of being wrong is a delivered job filed as a failure.
 */
const RUN_SUCCESS_STATUSES = new Set(["completed", "complete", "done"]);

/** How long a child run must have carried a status this module does not
 *  recognise before the reflector treats it as terminal. Deliberately longer
 *  than DISPATCH_LOST_MS: an unrecognised status is as likely to be a new
 *  in-flight state as a new terminal one, and being fifteen minutes late to
 *  terminalize costs a tick, while stealing a live step costs duplicated work. */
const UNKNOWN_STATUS_LOST_MS = 15 * 60 * 1000;

/** KI-15: an inbound handoff left unconsumed this long is treated as stale (its
 *  receiver run was never started, e.g. a non-orchestrated single mission whose
 *  one handoff was dropped). Past this window the message no longer blocks
 *  completion, so the mission can finalize instead of sitting 'running' forever.
 *  Conservative on purpose: a recently-unconsumed message still blocks (the
 *  receiver may simply not have picked it up yet). */
const UNCONSUMED_STALE_MS = 15 * 60 * 1000;

/** KI-16b: per-mission per-tick dispatch cap. `dispatchReadySteps` enqueues at
 *  most this many ready steps per advance, so a wide or runaway DAG degrades to
 *  bounded backpressure (the uncapped remainder stays 'planned' and is returned
 *  again on the next tick) instead of an unbounded enqueue burst in a single
 *  Worker tick. This bounds per-tick WORK (resolveAgent + memory recall + enqueue
 *  per step) under the Cloudflare Workers execution budget; the running-concurrency
 *  cap (MAX_RUNNING_PER_WORKSPACE in loop.server.ts) separately bounds how many
 *  run at once. Env-tunable; sane default 10 (2x the running cap, enough to keep
 *  the pipeline fed without a large per-tick burst). */
const DISPATCH_CAP = Math.max(1, Number(process.env.MISSION_STEP_DISPATCH_CAP) || 10);

type SenderCtx = {
  agentId: string | null;
  agentSlug: string | null;
  runId: string | null;
  traceId: string | null;
};

// Per-isolate cache of whether the retry columns exist yet (cheap, self-healing:
// a worker that probed false before the migration is recycled and re-probes).
let retryColsCache: boolean | null = null;

async function hasRetryColumns(supabase: SupabaseClient): Promise<boolean> {
  if (retryColsCache !== null) return retryColsCache;
  const { error } = await supabase.from("mission_steps").select("max_attempts").limit(1);
  if (!error) {
    retryColsCache = true;
    return true;
  }
  // Cache `false` ONLY for a genuine missing-column error (pre-migration). A
  // transient error (network/permission) degrades to no-retry for THIS call but
  // stays uncached, so a later call re-probes once the column lands — otherwise
  // one blip would disable retry for the whole isolate lifetime.
  const code = (error as { code?: string }).code;
  const missingColumn =
    code === "42703" ||
    code === "PGRST204" ||
    /max_attempts|column .* does not exist/i.test(error.message ?? "");
  if (missingColumn) retryColsCache = false;
  return false;
}

/**
 * RF-05 (verdict stamping — this is the mechanism the old comment on the
 * 'completed' branch called "separate, not-yet-wired"). Record ONE application
 * of a playbook, WITH the verdict it earned, at the instant the step that
 * applied it reaches a terminal state.
 *
 * Why the verdict is written on the INSERT rather than stamped later at mission
 * finalization: `playbook_runs` carries no mission_id and no step_id (see
 * 20260624060000_playbook_runs.sql — id, user_id, workspace_id, playbook_id,
 * playbook_version, station, decision_id, verdict, created_at, resolved_at). A
 * later UPDATE therefore has nothing to key on, and any "most recent row for
 * this workspace + playbook" guess would attribute one mission's outcome to
 * another mission's row. Inventing that correlation is exactly the kind of
 * fabricated number this table exists to avoid. The step's terminal transition
 * is the only moment the row's identity is known — and it is already CAS-won by
 * exactly one caller, which is what makes this write exactly-once under
 * overlapping sweeper/user ticks.
 *
 * Why this does not call `recordPlaybookRunInternal`: that helper takes no
 * verdict and lives in a module this change does not own. It stays the manual /
 * user-client path; this is the deterministic engine's path, and it writes the
 * same row shape plus the verdict and its resolution time.
 *
 * Never throws: a best-effort learning write must not break the mission loop.
 */
async function recordPlaybookAttempt(
  supabase: SupabaseClient,
  step: { user_id: string; workspace_id: string; playbook_id: string },
  outcome: PlaybookAttemptOutcome,
): Promise<void> {
  const def = findPlaybook(step.playbook_id);
  if (!def) return; // unknown/stale playbook id — silently skip, never break the caller
  const verdict = verdictForPlaybookAttempt(outcome);
  try {
    const { error } = await supabase.from("playbook_runs").insert({
      user_id: step.user_id,
      workspace_id: step.workspace_id,
      playbook_id: def.id,
      playbook_version: def.version,
      station: def.station,
      // NULL verdict is the honest record of an attempt that says nothing about
      // the method (stopped, never started, abandoned). rankPlaybooksByOutcome
      // counts it as volume and never as a win or a loss. resolved_at stays null
      // with it: nothing was resolved.
      verdict,
      resolved_at: verdict ? new Date().toISOString() : null,
    });
    // Supabase-js resolves DB-level failures (RLS denial, missing table
    // pre-migration, constraint violation) as {error} rather than throwing, so
    // this check is the load-bearing one, not the catch below.
    if (error) console.error("recordPlaybookAttempt insert failed:", error.message);
  } catch (e) {
    console.error("recordPlaybookAttempt threw:", e);
  }
}

/**
 * When a step's child run failed (or its dispatch threw), decide retry vs. give
 * up. With the retry columns present and attempts under the ceiling, re-queue
 * the step to 'planned' with an exponential backoff (next_retry_at); otherwise
 * terminalize it 'failed'. Returns the chosen outcome.
 *
 * `outcome` is what actually ended this attempt, and it is a REQUIRED argument
 * because the honest verdict depends on it and nothing else here can infer it:
 * a run that failed on its own is evidence against the playbook, while a lost
 * dispatch or a governance halt is evidence about nothing. See
 * verdictForPlaybookAttempt in the registry for the full defence.
 */
async function failOrRequeueStep(
  supabase: SupabaseClient,
  step: MissionStepRow,
  errorMsg: string,
  retryCols: boolean,
  outcome: PlaybookAttemptOutcome,
): Promise<"retry" | "failed"> {
  const attempts = step.attempts ?? 0;
  const maxAttempts = step.max_attempts ?? DEFAULT_MAX_ATTEMPTS;
  const err = errorMsg.slice(0, 2000);
  if (retryCols && shouldRetryStep({ attempts, maxAttempts })) {
    await supabase
      .from("mission_steps")
      .update({
        status: "planned",
        error: err,
        next_retry_at: nextRetryAtIso(Date.now(), attempts),
      })
      .eq("id", step.id);
    return "retry";
  }
  // CAS on the pre-read status — see the "completed" branch above for why:
  // only the caller that actually wins this transition may record the run.
  const { data: won } = await supabase
    .from("mission_steps")
    .update({ status: "failed", error: err, completed_at: new Date().toISOString() })
    .eq("id", step.id)
    .eq("status", step.status)
    .select("id");
  // RF-05: the step is now terminal, so record the attempt WITH the verdict it
  // earned. Only `work_failed` becomes a loss; a lost dispatch or a governance
  // halt records the run with a NULL verdict, which counts as neither a win nor
  // a loss. (The retry branch above returned already: a step that will run
  // again has not finished its attempt, so nothing is recorded for it yet.)
  //
  // This corrects the claim the old comment here made. It asserted the record
  // was only reached on "a genuine terminal failure, not a lost dispatch", but
  // every caller funnels through this function, so an exhausted lost dispatch
  // WAS being written as if the method had been tried. It is now written as
  // what it is: no evidence.
  if (won?.length && step.playbook_id) {
    await recordPlaybookAttempt(
      supabase,
      { user_id: step.user_id, workspace_id: step.workspace_id, playbook_id: step.playbook_id },
      outcome,
    );
  }
  return "failed";
}

/**
 * A child run still 'queued' past the dispatch window was never promoted to
 * 'running' (e.g. resumeAgentLoop threw before the queued->running CAS), so the
 * reflector would otherwise never act on it and the step would hang 'dispatched'
 * forever. Treat it as a lost dispatch. Exported for unit testing.
 */
export function isLostQueuedRun(
  run: { status: string; created_at?: string | null },
  cutoffIso: string,
): boolean {
  return run.status === "queued" && !!run.created_at && run.created_at < cutoffIso;
}

/**
 * Cross-check every in-flight mission_step.run_id against agent_runs.status and
 * reflect the terminal state back onto the step. A failed/halted/partly-failed
 * child triggers the bounded-retry decision. Cheap; shared by the orchestrator
 * tools and the auto-advance sweeper so progress is always fresh without a
 * separate reactor.
 *
 * This is the ONLY writer of mission_steps.status on the advance path, which is
 * why it is closed rather than open: a status it does not branch on leaves the
 * step in flight, and a step in flight pins the whole mission (the ready-RPC
 * never releases its dependents, the skip-cascade only cascades from 'failed',
 * and maybeCompleteMission never sees an all-terminal DAG). So it now ends with
 * a defensive branch keyed on RUN_IN_FLIGHT_STATUSES instead of falling through
 * silently — see that constant for the list to keep current.
 */
export async function reflectStepStatusFromRuns(
  supabase: SupabaseClient,
  missionId: string,
): Promise<void> {
  const { data: pending } = await supabase
    .from("mission_steps")
    .select("*")
    .eq("mission_id", missionId)
    .in("status", ["dispatched", "running"]);
  const rows = (pending ?? []) as MissionStepRow[];
  if (rows.length === 0) return;

  const retryCols = await hasRetryColumns(supabase);

  // Recover steps stranded in 'dispatched' with no run_id: the claim flipped
  // planned→dispatched but the worker died before enqueue created the child run.
  // After a staleness window, requeue (bounded) or fail so the mission can't
  // hang. Their attempt was already counted at claim time. Done before the
  // run_id early-return below so an all-stranded mission still recovers.
  const lostCutoff = new Date(Date.now() - DISPATCH_LOST_MS).toISOString();
  for (const row of rows) {
    if (
      !row.run_id &&
      row.status === "dispatched" &&
      row.dispatched_at &&
      row.dispatched_at < lostCutoff
    ) {
      await failOrRequeueStep(
        supabase,
        row,
        "dispatch lost before a child run was created (worker eviction)",
        retryCols,
        // The agent never ran, so the playbook bound to this step was never
        // applied. Infrastructure, not method: no verdict either way.
        "never_started",
      );
    }
  }

  const runIds = rows.map((r) => r.run_id).filter((x): x is string => !!x);
  if (runIds.length === 0) return;

  const { data: runs } = await supabase
    .from("agent_runs")
    .select("id,status,output,halted_reason,created_at")
    .in("id", runIds);
  type RunRow = {
    id: string;
    status: string;
    output: string | null;
    halted_reason: string | null;
    created_at: string | null;
  };
  const byRun = new Map<string, RunRow>((runs ?? []).map((r) => [(r as RunRow).id, r as RunRow]));

  for (const row of rows) {
    if (!row.run_id) continue;
    const run = byRun.get(row.run_id);
    if (!run) continue;
    if (run.status === "running" && row.status !== "running") {
      await supabase.from("mission_steps").update({ status: "running" }).eq("id", row.id);
    } else if (RUN_SUCCESS_STATUSES.has(run.status)) {
      // Every spelling of a clean finish, kept in ONE named set (see
      // RUN_SUCCESS_STATUSES above for why each member is in it, and for the
      // measured exposure of each). This used to be an inline
      // `completed || complete` chain, and it was missing `done` — the status the
      // delegate fold writes for a SUCCESSFUL external job — so a delivered job
      // fell through to the defensive terminalizer at the end of this loop and was
      // filed as a failure. The old comment here made exactly the right argument
      // for admitting `complete` ("without it the unknown-status branch at the end
      // of this loop would read a clean finish as a failure") and then left the
      // identical case one status over. Whoever adds the next success spelling adds
      // it to the set, not to a condition, which is the whole point of the move.
      // CAS on the pre-read status: this function is documented as callable
      // from both the admin-client sweeper and a user-client `advanceMission`,
      // so overlapping calls on the same mission are a designed-for scenario.
      // Before RF-05 a duplicate concurrent UPDATE here was harmless (same
      // terminal values); RF-05 attaches a non-idempotent playbook_runs INSERT
      // to this transition, so only the call that actually WINS the status
      // flip (0 rows if another caller already flipped it) may record it.
      const { data: won } = await supabase
        .from("mission_steps")
        .update({
          status: "done",
          result: run.output ? { output: run.output } : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .eq("status", row.status)
        .select("id");
      // RF-05: auto-record the station run, now WITH the verdict it earned, so
      // rankPlaybooksByOutcome has a decisive track record to rank against
      // instead of a column of nulls. The run completed, so the method was
      // applied end to end and the work it guided passed: `delivered`.
      if (won?.length && row.playbook_id) {
        await recordPlaybookAttempt(
          supabase,
          { user_id: row.user_id, workspace_id: row.workspace_id, playbook_id: row.playbook_id },
          // Normalize EVERY success spelling to "completed" before classifying:
          // classifyRunOutcome (playbooks/registry.ts:221-240) has a case for
          // "completed" and nothing else that means success, so letting "complete"
          // or "done" fall to its default records a clean delivery as no-evidence
          // and under-reports the win. Reaching this line already proves the status
          // is in RUN_SUCCESS_STATUSES, so normalizing the whole set is exact, not
          // a guess — and it cannot go stale when a fourth spelling is added.
          classifyRunOutcome("completed"),
        );
      }
    } else if (
      run.status === "halted" ||
      run.status === "failed" ||
      run.status === "completed_with_failures"
    ) {
      // WHY THESE THREE ARE TERMINAL, and why only two of them get the retry.
      //
      // 'failed' is a durable failure of the work this method guided (bounded
      // retries are spent by the time the step terminalizes) => a loss.
      // 'halted' is a governance stop or the stuck-run sweeper killing a run
      // that stopped checkpointing => the attempt was interrupted, never
      // judged, so it earns no verdict.
      // 'completed_with_failures' is the loop's own verdict on a run that
      // reached an answer with at least one tool step failed
      // (anyToolStepFailed, loop.server.ts:238-242, applied at :730 and :1659).
      // It is terminal everywhere else in this repo (run-state.ts,
      // ask-blocks.server.ts, credit-policy.ts, build-status.ts) and it belongs
      // on this side of the line rather than with 'completed', matching
      // maybeCompleteMission, which reads a single failed STEP as a mission that
      // completed_with_failures.
      //
      // THE RETRY IS WITHHELD FROM 'completed_with_failures' ONLY, and this is a
      // decision taken deliberately rather than a default. An earlier version of
      // this code gave all three the bounded retry and this comment said so,
      // naming the switch to reverse it ("pass `false` for retryCols on THIS
      // branch only"). That switch is now taken. What it buys, measured through
      // the Lovable MCP on 2026-08-06:
      //   - 10 mission_steps sit in flight under a running/in_progress mission.
      //     ALL TEN are attempts=1 / max_attempts=2 and ALL TEN are against a
      //     completed_with_failures run, dispatched between 2026-07-09 and
      //     2026-08-04. With the retry on, the first sweep after this deploys
      //     re-dispatches ten agents whose predecessors already reached an answer
      //     and committed real side effects (specs written, PRs opened), a month
      //     of context out of date, and then fails those steps anyway. With it
      //     off, all ten terminalize on the first reflection, their dependents
      //     skip-cascade, and their missions finalize as completed_with_failures
      //     — which is what actually happened to them.
      //   - Steady state, not just deploy day: at 452 of 1135 runs this is the
      //     second most common status in the database, so the retry it was being
      //     given was not an edge-case retry. And a retry cannot fix it. The run
      //     did not crash mid-flight (that is 'failed'); it finished, having hit
      //     a tool error the model saw and chose to finalize around. Re-running
      //     the same sub_goal with the same agent re-does the work it already
      //     did — the tools here are inserts, not upserts — and usually meets the
      //     same deterministic tool failure, ending in the same status. Double
      //     spend, duplicated artifacts, identical outcome.
      // 'failed' and 'halted' keep the retry: a run that threw is often transient
      // and its side effects are partial, which is the case retrying is for.
      //
      // WHAT THIS IS NOT: it does not change whether a partly-failed step poisons
      // its dependents. The skip-cascade still runs, so one such step still ends
      // the wave below it. Whether a 40%-base-rate status should poison a DAG at
      // all is a product call above this function and it is NOT closed here.
      //
      // On the verdict: classifyRunOutcome does not know this status, so it
      // classifies 'interrupted' and the attempt is recorded with a NULL
      // verdict — volume, neither a win nor a loss. That is deliberately
      // conservative and NOT a claim that the method was judged; a decisive
      // reading of a partly-failed run belongs in classifyRunOutcome
      // (src/lib/playbooks/registry.ts), which this change does not own.
      await failOrRequeueStep(
        supabase,
        row,
        run.halted_reason ?? run.output ?? `child run ${run.status}`,
        retryCols && run.status !== "completed_with_failures",
        classifyRunOutcome(run.status),
      );
    } else if (isLostQueuedRun(run, lostCutoff)) {
      // A child run still 'queued' past the dispatch window was never promoted to
      // 'running' (e.g. resumeAgentLoop threw before the queued->running CAS). The
      // reflector ignores 'queued' runs, so the step would hang 'dispatched'
      // forever and pin the mission. CAS the dead run to 'failed' (only while
      // still 'queued', so we never clobber one that just got promoted), which
      // also stops the resume sweeper from re-picking it and prevents the step
      // from ever running twice; then route the step through retry/terminalize.
      const { data: killed } = await supabase
        .from("agent_runs")
        .update({
          status: "failed",
          halted_reason: "queued past the dispatch window (worker eviction before promotion)",
        })
        .eq("id", row.run_id)
        .eq("status", "queued")
        .select("id");
      if (killed?.length) {
        await failOrRequeueStep(
          supabase,
          row,
          "child run stuck queued past the dispatch window",
          retryCols,
          // We just marked this run 'failed' OURSELVES because it never got
          // promoted out of 'queued'. Reading that self-inflicted status back
          // through classifyRunOutcome would score it as a loss for the
          // playbook, which would be a fabricated one: the agent never started.
          "never_started",
        );
      }
    } else if (!RUN_IN_FLIGHT_STATUSES.has(run.status)) {
      // DEFENSIVE TERMINALIZER. Every branch above names a status explicitly, so
      // reaching here means the run carries a status this module has never seen.
      // Before this branch existed the step simply stayed in flight and pinned
      // the mission at 'Running' forever with no error anywhere — which is
      // exactly what `completed_with_failures` did to every running mission in
      // production. Unknown is therefore treated as TERMINAL, not as in-flight:
      // the in-flight set is the closed list (RUN_IN_FLIGHT_STATUSES), and a
      // status outside it gets the same bounded retry-or-fail as any other
      // terminal outcome.
      //
      // Bounded on time as well as attempts: we wait UNKNOWN_STATUS_LOST_MS from
      // the RUN'S CREATION (falling back to the step's dispatch time), so a young
      // run that moves into a new in-flight status is not stolen the instant that
      // status appears.
      //
      // BE PRECISE ABOUT WHAT THAT DOES AND DOES NOT PROTECT, because the earlier
      // wording here claimed the whole thing. The clock is the run's AGE, not the
      // age of the status. A run created more than fifteen minutes ago that moves
      // into an unregistered in-flight status is already past the cutoff, so it is
      // terminalized on the very next tick with no grace at all — and a long agent
      // loop is routinely older than fifteen minutes by the time it changes state.
      // The window is therefore real cover for a status that appears EARLY in a
      // run and none for one that appears LATE. It is measured this way because
      // there is nothing better to measure: agent_runs has no updated_at and no
      // status_changed_at column (verified against the live schema 2026-08-06;
      // `last_checkpoint_at` is a liveness heartbeat the loop writes, not a record
      // of when the status was set), so the moment a status was set is not a fact
      // this table stores. Closing the gap properly needs that column, not a
      // different constant here.
      //
      // The real protection is not the clock, it is the two closed sets. If the
      // status means the run is still working, add it to RUN_IN_FLIGHT_STATUSES;
      // if it means the run finished cleanly, add it to RUN_SUCCESS_STATUSES —
      // adding a success status to the in-flight set would hang the step forever
      // instead. The step error below names the status precisely so whoever reads
      // it knows what to add and where.
      const sinceIso = run.created_at ?? row.dispatched_at;
      const unknownCutoff = new Date(Date.now() - UNKNOWN_STATUS_LOST_MS).toISOString();
      if (sinceIso && sinceIso < unknownCutoff) {
        await failOrRequeueStep(
          supabase,
          row,
          `child run reported the unrecognised status '${run.status}', which this ` +
            `mission reflector has no branch for; treated as terminal so the mission ` +
            `can finish. If that status means the run is still working, add it to ` +
            `RUN_IN_FLIGHT_STATUSES in src/lib/ai/mission-advance.server.ts; if it ` +
            `means the run finished cleanly, add it to RUN_SUCCESS_STATUSES in the ` +
            `same file instead, putting a success status in the in-flight set ` +
            `would pin this step forever rather than fix it.`,
          retryCols,
          // A status we cannot read is no evidence about the method. This is what
          // classifyRunOutcome's documented default ("a terminal status this code
          // does not recognise" => 'interrupted') is for, so the verdict comes out
          // NULL rather than invented.
          classifyRunOutcome(run.status),
        );
      }
    }
  }
}

/**
 * Fetch a mission's ready steps (dependencies satisfied + retry backoff elapsed,
 * enforced by next_ready_mission_steps) and apply the KI-16b per-tick dispatch
 * cap: return at most `cap` rows, preserving the RPC's order so the cap is
 * deterministic and no step starves (the uncapped remainder is still 'planned'
 * and is returned again on the next tick). Throws on RPC error.
 */
export async function selectDispatchBatch(
  supabase: SupabaseClient,
  missionId: string,
  cap: number = DISPATCH_CAP,
): Promise<MissionStepRow[]> {
  const { data: ready, error } = await supabase.rpc("next_ready_mission_steps", {
    p_mission_id: missionId,
  });
  if (error) throw new Error(error.message);
  const rows = (ready ?? []) as MissionStepRow[];
  return rows.slice(0, Math.max(1, cap));
}

/**
 * Dispatch the mission steps whose dependencies are satisfied (and whose retry
 * backoff, if any, has elapsed — enforced by next_ready_mission_steps), up to the
 * KI-16b per-tick cap. Each dispatch is claim-first (CAS planned→dispatched) so
 * concurrent ticks can't double-enqueue, and threads memory relevant to the hop
 * into the handoff payload (memory_refs + last_used_at). Idempotent.
 */
export async function dispatchReadySteps(
  supabase: SupabaseClient,
  mission: MissionLite,
  from: SenderCtx,
): Promise<{
  dispatched: { idx: number; agent_slug: string; run_id: string }[];
  failed: { idx: number; agent_slug: string; error: string }[];
}> {
  const retryCols = await hasRetryColumns(supabase);
  // KI-16b: bound how many ready steps this mission dispatches this tick.
  const readyRows = await selectDispatchBatch(supabase, mission.id, DISPATCH_CAP);

  const dispatched: { idx: number; agent_slug: string; run_id: string }[] = [];
  const failed: { idx: number; agent_slug: string; error: string }[] = [];

  // Batch-resolve all agents upfront instead of one per step (N+1 fix).
  // Collect unique slugs, query once with .in(), and build a Map for per-step lookup.
  const uniqueSlugs = [...new Set(readyRows.map((r) => r.agent_slug))];
  const { data: agentRows } = await supabase
    .from("agents")
    .select("id,slug,name")
    .eq("user_id", mission.user_id)
    .eq("enabled", true)
    .in("slug", uniqueSlugs);
  const agentBySlug = new Map(
    (agentRows ?? []).map((a: { id: string; slug: string; name: string }) => [a.slug, a]),
  );

  for (const step of readyRows) {
    const attemptNo = (step.attempts ?? 0) + 1;
    // CAS claim: only the caller that flips planned→dispatched proceeds to
    // enqueue. The loser matches zero rows and skips — no double dispatch.
    //
    // KNOWN, UNFIXED, AND DELIBERATELY LEFT: between this claim and the run_id
    // write further down, a RE-DISPATCHED step sits at 'dispatched' still holding
    // the PREVIOUS attempt's run_id (nothing clears it on the requeue path, and
    // nothing clears it here). An overlapping tick's reflector reads steps in
    // ('dispatched','running'), finds that stale terminal run, and can terminalize
    // the step against it while its new child run is being created. The window is
    // the enqueue latency, a few hundred milliseconds, and it exists only for a
    // step on its second attempt — a first dispatch has run_id null and the
    // reflector skips it.
    // Why it is not fixed in this change: it is pre-existing, and this change makes
    // it RARER rather than more likely. Routing 'completed_with_failures' away from
    // the retry (see the reflector's terminal branch) means the only steps that ever
    // reach a second attempt are the ones behind 'failed' and 'halted' runs — 133 of
    // 1135 runs measured 2026-08-06, versus the 585 it would have been with that
    // status retried too. The two candidate fixes both cost more than the bug during
    // launch week: adding `run_id: null` to this claim closes the window but drops a
    // failed retry's pointer to the attempt before it, and skipping runs created
    // before `dispatched_at` closes it too but hangs the step permanently under any
    // clock skew between the Worker and Postgres — a hang being the exact failure
    // this module exists to end. `run_id: null` here is the one to take afterwards.
    const claim: Record<string, unknown> = {
      status: "dispatched",
      dispatched_at: new Date().toISOString(),
    };
    if (retryCols) claim.attempts = attemptNo;
    const { data: claimed } = await supabase
      .from("mission_steps")
      .update(claim)
      .eq("id", step.id)
      .eq("status", "planned")
      .select("id");
    if (!claimed?.length) continue;

    try {
      const to = agentBySlug.get(step.agent_slug);
      if (!to) {
        throw new Error(`Target agent '${step.agent_slug}' is disabled or not in the roster.`);
      }

      // Thread memory relevant to THIS hop into the handoff + mark it used.
      let memoryRefs: { id: string; summary?: string }[] | undefined;
      try {
        const recalled = await recallMemoryRefs(
          supabase,
          mission.user_id,
          step.agent_slug,
          step.sub_goal,
          mission.workspace_id ?? null,
          { touch: true, maxItems: 4 },
        );
        memoryRefs = recalled.refs.length ? recalled.refs : undefined;
      } catch {
        /* recall failure is non-fatal — dispatch proceeds without refs */
      }

      // No `artifacts` here BY DESIGN: an orchestrated dispatch is a pure-planning
      // hop, so the A2A evidence gate (validateHandoff) is a guaranteed no-op for
      // it even when HANDOFF_EVIDENCE_GATE=enforce. If you ever add `artifacts` to
      // this payload, also thread `evidence_ids` (or `memory_refs`) or an enforced
      // gate will reject the hop and burn this step's retries down to 'failed'.
      const payload: HandoffPayload = {
        task: step.sub_goal,
        context: {
          mission_step_idx: step.idx,
          orchestrator_run_id: from.runId ?? null,
          orchestrator_trace_id: from.traceId ?? null,
          rationale: step.rationale ?? undefined,
          attempt: retryCols ? attemptNo : undefined,
        },
        ...(memoryRefs ? { memory_refs: memoryRefs } : {}),
      };

      const handoffRes = await enqueueHandoff(supabase, mission.user_id, {
        mission_id: mission.id,
        workspace_id: mission.workspace_id,
        from_agent_id: from.agentId,
        from_agent_slug: from.agentSlug,
        to,
        payload,
        source_run_id: from.runId,
        source_trace_id: from.traceId,
        // INSTRUMENT: the same number the payload above carries, persisted onto
        // the child run so retries are a column to group by rather than JSON to
        // parse. Gated on `retryCols` for the identical reason the payload field
        // is: without the mission_steps retry columns, `attemptNo` is derived
        // from a default rather than a counter, and a derived 1 is a guess.
        attempt: retryCols ? attemptNo : undefined,
      });

      await supabase
        .from("mission_steps")
        .update({ run_id: handoffRes.queued_run_id, message_id: handoffRes.message_id })
        .eq("id", step.id);

      dispatched.push({
        idx: step.idx,
        agent_slug: step.agent_slug,
        run_id: handoffRes.queued_run_id,
      });
    } catch (e) {
      // Enqueue threw AFTER the claim — don't leave the step hung in
      // 'dispatched' with no run; retry it (bounded) or terminalize.
      const msg = e instanceof Error ? e.message : String(e);
      // enqueue threw, so no child run exists and the agent never started. The
      // playbook was never applied: no verdict either way.
      await failOrRequeueStep(
        supabase,
        { ...step, attempts: attemptNo },
        msg,
        retryCols,
        "never_started",
      );
      failed.push({ idx: step.idx, agent_slug: step.agent_slug, error: msg });
    }
  }

  return { dispatched, failed };
}

/**
 * KI-15: clear the completion block left by an orphaned handoff. maybeCompleteMission
 * refuses to finalize while ANY agent_messages row is unconsumed, so a single
 * non-orchestrated mission whose only handoff was never picked up sits 'running'
 * forever. Here we mark messages older than UNCONSUMED_STALE_MS consumed, attributing
 * them to the mission's tail run (the run that effectively absorbed the orphan) so the
 * UI's message-to-run mapping stays honest and consumeInboundHandoff can no longer
 * re-serve them. Recently-unconsumed messages are left alone and still block as today.
 * Returns true when at least one stale message was cleared.
 *
 * Live-receiver guard (correctness): enqueueHandoff always creates a queued
 * receiver run alongside the message, and that run is what consumeInboundHandoff
 * later marks the message consumed by. So a message is only TRULY orphaned once
 * no live run (queued / running / waiting_approval) remains to pick it up. Under
 * backlog or BATCH starvation the receiver run can simply be late, and stealing
 * its message would make it resume WITHOUT its handoff payload (lost task
 * context). While any live run exists the mission is still moving and would not
 * complete anyway, so we leave every message untouched and retry next tick.
 */
async function sweepStaleUnconsumedMessages(
  supabase: SupabaseClient,
  missionId: string,
): Promise<boolean> {
  // If any run is still live, an inbound message may yet be consumed by it, so
  // do not steal it. (Also: a live run keeps the mission from completing, so
  // there is nothing to unblock here yet.)
  const { count: liveRuns } = await supabase
    .from("agent_runs")
    .select("id", { count: "exact", head: true })
    .eq("mission_id", missionId)
    .in("status", ["queued", "running", "waiting_approval"]);
  if ((liveRuns ?? 0) > 0) return false;

  const staleCutoff = new Date(Date.now() - UNCONSUMED_STALE_MS).toISOString();
  const { data: staleRows } = await supabase
    .from("agent_messages")
    .select("id")
    .eq("mission_id", missionId)
    .is("consumed_by_run_id", null)
    .lt("created_at", staleCutoff);
  const ids = (staleRows ?? []).map((r) => (r as { id: string }).id);
  if (ids.length === 0) return false;

  // Attribute the orphan to the mission's most recent run (best-effort). A
  // running mission realistically always has one; in the rare case it does not,
  // leave the message untouched (stay conservative) and retry next tick once a
  // run exists, since the completion guard keys on consumed_by_run_id.
  const { data: tailRun } = await supabase
    .from("agent_runs")
    .select("id")
    .eq("mission_id", missionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const tailRunId = (tailRun as { id: string } | null)?.id ?? null;
  if (!tailRunId) return false;

  await supabase
    .from("agent_messages")
    .update({ consumed_by_run_id: tailRunId, consumed_at: new Date().toISOString() })
    .in("id", ids)
    .is("consumed_by_run_id", null);
  return true;
}

/**
 * Pure DAG analysis for the skip-cascade: given the mission's steps (idx, status,
 * depends_on), return a map of idx -> the failed/skipped upstream dep idx for
 * every still-pending step that can never become ready because it (transitively)
 * depends on a 'failed' step. Iterates to a fixpoint so a poisoned step also
 * poisons ITS dependents. Only 'planned'/'dispatched' steps are candidates;
 * terminal ('done'/'failed'/'skipped') and in-flight ('running') steps are left
 * untouched. Exported for unit testing.
 */
export function computePoisonedSteps(
  steps: { idx: number; status: string; depends_on: number[] | null }[],
): Map<number, number> {
  const statusByIdx = new Map(steps.map((s) => [s.idx, s.status]));
  const poisonedBy = new Map<number, number>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of steps) {
      if (poisonedBy.has(s.idx)) continue;
      if (s.status !== "planned" && s.status !== "dispatched") continue;
      for (const dep of s.depends_on ?? []) {
        if (statusByIdx.get(dep) === "failed" || poisonedBy.has(dep)) {
          poisonedBy.set(s.idx, dep);
          changed = true;
          break;
        }
      }
    }
  }
  return poisonedBy;
}

/**
 * Skip-cascade writer: terminalize the pending dependents of any 'failed' step as
 * 'skipped' so the DAG can finalize. Without this, next_ready_mission_steps never
 * returns a step with a failed dependency (it requires every dep 'done') and
 * maybeCompleteMission never sees an all-terminal DAG, so the mission hangs
 * 'running' forever. Idempotent and concurrency-safe: each write CAS-guards on the
 * pending statuses, so a re-run (or an overlapping tick) is a no-op and never
 * clobbers a step that legitimately progressed. Returns the count newly skipped.
 */
export async function cascadeSkipFailedDependents(
  supabase: SupabaseClient,
  missionId: string,
): Promise<number> {
  const { data: rows } = await supabase
    .from("mission_steps")
    .select("id,idx,status,depends_on")
    .eq("mission_id", missionId);
  const steps = (rows ?? []) as {
    id: string;
    idx: number;
    status: string;
    depends_on: number[] | null;
  }[];
  if (steps.length === 0) return 0;

  const poisonedBy = computePoisonedSteps(steps);
  if (poisonedBy.size === 0) return 0;

  const now = new Date().toISOString();
  let skipped = 0;
  for (const s of steps) {
    const depIdx = poisonedBy.get(s.idx);
    if (depIdx === undefined) continue;
    const { data: updated } = await supabase
      .from("mission_steps")
      .update({
        status: "skipped",
        error: `Skipped: upstream step #${depIdx} failed`,
        completed_at: now,
      })
      .eq("id", s.id)
      .in("status", ["planned", "dispatched"])
      .select("id");
    if (updated?.length) skipped += updated.length;
  }
  return skipped;
}

/**
 * Advance a single mission one tick, deterministically and model-free:
 * reflect → dispatch ready → skip-cascade failed dependents → finalize. Safe to
 * call repeatedly and concurrently; a no-op for missions with no ready work or no
 * DAG. Returns a small summary.
 */
export async function advanceMissionCore(
  supabase: SupabaseClient,
  mission: MissionLite,
): Promise<{ dispatched: number; failed: number; finalized: boolean }> {
  if (mission.status !== "running" && mission.status !== "in_progress") {
    return { dispatched: 0, failed: 0, finalized: false };
  }

  // 1. Reflect child outcomes onto steps (+ bounded retry requeue).
  await reflectStepStatusFromRuns(supabase, mission.id);

  // 2. Resolve the orchestrator as the conceptual sender (best-effort — the
  //    handoff contract allows a null sender).
  let from: SenderCtx = { agentId: null, agentSlug: null, runId: null, traceId: null };
  try {
    const orch = await resolveAgent(supabase, mission.user_id, { agent_slug: "orchestrator" });
    from = { agentId: orch.id, agentSlug: orch.slug, runId: null, traceId: null };
  } catch {
    /* non-fatal */
  }

  // 3. Dispatch every newly-ready step.
  const { dispatched, failed } = await dispatchReadySteps(supabase, mission, from);

  // 3b. KI-15: release an orphaned-handoff completion block (stale unconsumed
  //     message) so a dropped single hop can't pin the mission 'running' forever.
  await sweepStaleUnconsumedMessages(supabase, mission.id);

  // 3c. Skip-cascade: a failed step's dependents can never become ready (the
  //     ready-RPC requires every dependency 'done'), so without this they sit
  //     'planned' forever and the mission can never reach an all-terminal state
  //     for maybeCompleteMission to finalize — it would hang 'running' for good.
  //     Mark them 'skipped' so the DAG terminalizes (as completed_with_failures).
  await cascadeSkipFailedDependents(supabase, mission.id);

  // 4. Finalize when the DAG is fully terminal (failure-aware + idempotent).
  await maybeCompleteMission(supabase, mission.id);
  const { data: m } = await supabase
    .from("missions")
    .select("status")
    .eq("id", mission.id)
    .maybeSingle();
  const finalized = m ? m.status !== "running" && m.status !== "in_progress" : false;

  return { dispatched: dispatched.length, failed: failed.length, finalized };
}
