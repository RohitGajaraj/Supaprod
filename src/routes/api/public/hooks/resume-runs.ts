import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resumeAgentLoop, runAgentLoop, type LoopResult } from "@/lib/ai/loop.server";
import { advanceMissionCore, type MissionLite } from "@/lib/ai/mission-advance.server";
import { classifyMissionGate } from "@/lib/reliability/gate-state";
import { withJobRun } from "@/lib/observability";
import { recordStageEvent } from "@/lib/stage-events.server";
import { driveTrackOnce, DRIVE_SELECT, type DriveRow } from "@/lib/spine/driver.server";
import { claimStarterRuns, keepStarterRuns } from "@/lib/onboarding.functions";
import { STARTER_RUNS_CLAIM_MS } from "@/lib/starter-runs";
import { DEFAULT_STUCK_MS, isRunStuck, stuckReason } from "@/lib/reliability/stuck-runs";

// agent_approvals.run_id is new in the f_studio_engine migration — not in the
// generated types until they regenerate post-apply (F-V5 untyped-cast pattern).
const admin = supabaseAdmin as unknown as SupabaseClient;

/**
 * Resume-runs sweeper.
 *
 * THE STATUSES BELOW ARE agent_runs STATUSES, NOT MISSION STATUSES, and the two
 * vocabularies share their words. Reading this list as missions is what let a
 * mission stranded at missions.status='queued' look swept: the first bullet is
 * `agent_runs.status='queued'` (see the select on agent_runs further down) and
 * nothing here selected a mission by that status at all until the adoption pass
 * added below. The runs this picks up to resume:
 *   - status='queued' (backpressure-enqueued + Studio async dispatch)
 *   - status='running' with a stale last_checkpoint_at (worker eviction)
 *   - status='running' with NO last_checkpoint_at and a stale created_at
 *     (KI-02: evicted before the first checkpoint stamp — `lt` on a NULL
 *     column never matches, so these were invisible to the sweeper)
 *   - status='waiting_approval' whose gates are all decided AND executed
 *     (F-STUDIO: the loop pauses on shipping gates; this re-enters it)
 *   - status='running' with 0 mission_steps and 0 active agent_runs
 *     (KI-17: chat.ts fires runAgentLoop fire-and-forget; Worker may
 *     terminate before orchestrator planning completes — re-plan here)
 * Plus, on MISSIONS: adoption of missions.status='queued' into 'running' (the
 * dead-label pass below), and BLD-GATE-SYNC status reconciliation
 * (deterministic, no AI):
 *   - un-block missions whose human gate is now decided (status 'blocked'
 *     → 'running'), BEFORE the resume pass so a resuming/completing run sees
 *     a 'running' mission (maybeCompleteMission only finalizes running ones)
 *   - block missions fully parked on a pending human gate ('running' →
 *     'blocked'), AFTER advancing, so the operator sees them in Needs-You
 *     instead of a perpetual 'running' (the "why is the loop idle?" bug)
 * Called by pg_cron every minute. Idempotent: resumeAgentLoop is safe to
 * call multiple times — checkpoint + tool idempotency keys dedup, and it
 * skips waiting_approval runs that still have undecided gates.
 */
const STALE_MS = 2 * 60 * 1000; // 2 minutes since last checkpoint = likely evicted
import { GATE_STILL_HOLDS } from "@/lib/ai/a-decided-gate-releases-its-run";

const BATCH = 5;
// KI-16: per-tick fairness cap on running missions advanced (oldest-updated
// first, so no mission starves). Env-tunable for high scale; sane default 50.
// Each advance is a cheap no-op when the mission has no ready work.
const MISSION_BATCH = Math.max(1, Number(process.env.MISSION_ADVANCE_BATCH) || 50);
// Cap on unplanned mission re-planning per tick. Each call triggers an
// orchestrator AI loop (expensive); 2 is intentionally conservative.
const REPLAN_BATCH = 2;
// Starvation guard: an unplanned mission (no steps, no active run) that has been
// LAUNCHED for longer than this — measured from updated_at, see the give-up test
// below — has failed to plan on every re-plan retry for too long. It is marked
// 'halted' so it can never permanently monopolize the fixed REPLAN_BATCH slots
// and starve fresh dispatches behind it. Env-tunable; 20 minutes by default.
const ABANDON_MS = Math.max(60_000, Number(process.env.REPLAN_ABANDON_MS) || 20 * 60 * 1000);
/**
 * The ceiling on a RUN that claims to be in flight and shows no sign of life.
 *
 * ABANDON_MS above is not this, and the difference is the founder's 2026-07-30
 * finding: it only fires when `stepCount === 0 && activeRuns === 0`, so it
 * gives up on missions that never PLANNED and has nothing to say about a
 * planned mission whose worker died mid-step. That shape had no ceiling at all,
 * which is how a run sat at status='running' for fifteen days on his own
 * workspace while the header reported it as live.
 *
 * Floored well above STALE_MS so resume gets roughly sixty attempts to rescue a
 * run before anything is given up on. See lib/reliability/stuck-runs.ts for the
 * rule, and in particular for why waiting_approval is never swept.
 */
const STUCK_MS = Math.max(10 * 60_000, Number(process.env.RUN_STUCK_MS) || DEFAULT_STUCK_MS);
/** Bounded per tick, so a bad day cannot turn one cron pass into a mass halt. */
const STUCK_BATCH = 20;

/**
 * Give up on missions whose planning never landed.
 *
 * THE ONE MISSION WRITE IN THIS FILE THAT CARRIED NO PRECONDITION. Compare the
 * un-block pass, the adoption pass and the block pass: each names the status it
 * was read at and reads its rows back. This one halted by id alone, and the id
 * list is assembled from reads taken earlier in the same tick, behind a resume
 * pass and an advance pass that each take seconds. A mission that planned,
 * dispatched and moved on in that window was halted anyway, and `halted` is
 * terminal, so the tick killed live work and reported a clean sweep.
 *
 * The status filter is the same one that selected the candidates, so a mission
 * that has since finished, been blocked on a gate, or been cancelled by a
 * person is simply not matched. The returned ids are the rows the database
 * confirms it wrote, not the ids we hoped to write.
 */
export async function haltAbandonedMissions(
  db: SupabaseClient,
  missionIds: string[],
  nowIso: string,
): Promise<{ halted: string[] }> {
  if (!missionIds.length) return { halted: [] };
  const { data } = await db
    .from("missions")
    .update({ status: "halted", updated_at: nowIso })
    .in("id", missionIds)
    .in("status", ["running", "in_progress"])
    .select("id");
  return { halted: ((data ?? []) as { id: string }[]).map((m) => m.id) };
}

/**
 * Resume each run in turn, separating what ran from what was already held.
 *
 * resumeAgentLoop now refuses to replay a run another worker has leased and
 * says so with `claim_lost`. Counting that as a resume would report fifteen
 * resumes on a tick that did one, the same class of untruth as the write that
 * could not tell a refusal from a success, one layer up.
 */
export async function resumeRuns(
  ids: string[],
  resume: (id: string) => Promise<LoopResult>,
): Promise<{ resumed: string[]; skipped: string[]; failed: { id: string; error: string }[] }> {
  const resumed: string[] = [];
  const skipped: string[] = [];
  const failed: { id: string; error: string }[] = [];
  for (const id of ids) {
    try {
      const res = await resume(id);
      if (res?.claim_lost) skipped.push(id);
      else resumed.push(id);
    } catch (e) {
      failed.push({ id, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return { resumed, skipped, failed };
}

export const Route = createFileRoute("/api/public/hooks/resume-runs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;
        return withJobRun("cron.resume-runs", async () => {
          try {
            const cutoff = new Date(Date.now() - STALE_MS).toISOString();

            // BLD-GATE-SYNC batch helpers: fetch all runs + pending gates once per pass,
            // then classify in memory via Maps. Perf fix: avoids ~200 sequential queries.
            const buildGateMaps = async (missionIds: string[]) => {
              if (!missionIds.length)
                return { runsByMission: new Map(), pendingByMission: new Map() };
              const { data: allRuns } = await admin
                .from("agent_runs")
                .select("mission_id,status")
                .in("mission_id", missionIds);
              const runsByMission = new Map<string, string[]>();
              for (const r of (allRuns ?? []) as { mission_id: string; status: string }[]) {
                const key = r.mission_id;
                runsByMission.set(key, [...(runsByMission.get(key) ?? []), r.status]);
              }

              const { data: allGates } = await admin
                .from("agent_approvals")
                .select("mission_id")
                .in("mission_id", missionIds)
                .eq("status", "pending");
              const pendingByMission = new Map<string, number>();
              for (const g of (allGates ?? []) as { mission_id: string }[]) {
                const key = g.mission_id;
                pendingByMission.set(key, (pendingByMission.get(key) ?? 0) + 1);
              }
              return { runsByMission, pendingByMission };
            };

            /* ---- THE STUCK-RUN CEILING ----
             * Runs at running/queued that have shown no sign of life past the
             * ceiling. Nothing is coming back for these: resume has had ~60
             * attempts by now, and one of them either never reached a model or
             * lost its worker mid-flight.
             *
             * The halt is written with a REASON in plain words, which serves
             * two readers. A person sees it on the stopped run. The next agent
             * sees it too, because advanceMissionCore copies halted_reason onto
             * the failed step, so the mission's own plan carries the cause
             * forward instead of a bare "failed" and the DAG can terminalize
             * rather than waiting on a worker that is gone.
             *
             * Best-effort throughout: this is a janitor, and a janitor that
             * throws takes the whole sweep down with it. */
            const halted: string[] = [];
            try {
              const stuckCutoff = new Date(Date.now() - STUCK_MS).toISOString();
              const { data: candidates } = await admin
                .from("agent_runs")
                .select("id,mission_id,status,agent_slug,created_at,last_checkpoint_at,user_id")
                // waiting_approval is deliberately absent: it is waiting on a
                // HUMAN and never expires. stuck-runs.ts refuses it again in
                // the pure rule, so the exclusion survives an edit here.
                .in("status", ["running", "queued"])
                // A cheap pre-filter only. A run that checkpointed recently is
                // still excluded by the rule below, whatever created_at says.
                .lt("created_at", stuckCutoff)
                .order("created_at", { ascending: true })
                .limit(STUCK_BATCH * 4);

              const now = Date.now();
              const dead = (
                (candidates ?? []) as Array<{
                  id: string;
                  mission_id: string | null;
                  status: string;
                  agent_slug: string | null;
                  created_at: string;
                  last_checkpoint_at: string | null;
                  user_id: string | null;
                }>
              )
                .filter((r) => isRunStuck(r, now, STUCK_MS))
                .slice(0, STUCK_BATCH);

              for (const r of dead) {
                const reason = stuckReason(r, now);
                // Guarded on status so a run that woke up between the read and
                // this write is not halted out from under itself.
                const { error } = await admin
                  .from("agent_runs")
                  .update({ status: "halted", halted_reason: reason })
                  .eq("id", r.id)
                  .in("status", ["running", "queued"]);
                if (error) continue;
                halted.push(r.id);

                // The step that was waiting on it, so the mission can move.
                await admin
                  .from("mission_steps")
                  .update({ status: "failed", error: reason })
                  // The real vocabulary: planned | dispatched | running | done
                  // | failed | skipped. A `planned` step is deliberately left
                  // alone, because it never started and is not what died.
                  .eq("run_id", r.id)
                  .in("status", ["running", "dispatched"]);

                /* NO STAGE EVENT HERE, and that is a decision rather than an
                 * omission. `stage_events.entity_type` is a closed vocabulary
                 * with a DB CHECK behind it and no member for a run, and the
                 * nearest one, `mission`, would have to be written as
                 * to:"halted", claiming the MISSION halted when only one of its
                 * runs did. The run's halted_reason and the step's error are
                 * already the record, both are read by the UI, and
                 * advanceMissionCore carries the reason onto the plan. A third
                 * copy is not worth distorting a typed vocabulary for. */
              }
              if (halted.length) {
                console.warn(
                  `[resume-runs] halted ${halted.length} run(s) with no sign of life past ${Math.round(STUCK_MS / 60000)}m`,
                );
              }
            } catch (e) {
              console.error("[resume-runs] stuck-run sweep failed (degrading):", e);
            }

            // BLD-GATE-SYNC un-block pass — run FIRST so a mission whose gate was just decided is
            // back to 'running' before its run resumes/completes below (maybeCompleteMission only
            // finalizes running/in_progress). Idempotent; the guarded update no-ops on a race.
            const unblocked: string[] = [];
            const { data: blockedMissions } = await admin
              .from("missions")
              .select("id,workspace_id,user_id")
              .eq("status", "blocked")
              .order("updated_at", { ascending: true })
              .limit(MISSION_BATCH);
            if (blockedMissions && blockedMissions.length > 0) {
              const blockedIds = (blockedMissions as { id: string }[]).map((m) => m.id);
              const { runsByMission, pendingByMission } = await buildGateMaps(blockedIds);
              for (const bm of (blockedMissions ?? []) as {
                id: string;
                workspace_id: string | null;
                user_id: string | null;
              }[]) {
                const runStatuses = runsByMission.get(bm.id) ?? [];
                const pendingGateCount = pendingByMission.get(bm.id) ?? 0;
                if (
                  classifyMissionGate({ status: "blocked", runStatuses, pendingGateCount }) ===
                  "unblock"
                ) {
                  const { data: upd } = await admin
                    .from("missions")
                    .update({ status: "running", updated_at: new Date().toISOString() })
                    .eq("id", bm.id)
                    .eq("status", "blocked")
                    .select("id");
                  if (upd && upd.length) {
                    unblocked.push(bm.id);
                    await recordStageEvent(admin, {
                      entityType: "mission",
                      entityId: bm.id,
                      from: "blocked",
                      to: "running",
                      actor: "system",
                      workspaceId: bm.workspace_id,
                      userId: bm.user_id,
                    });
                  }
                }
              }
            }

            /* ---- MISSIONS WEARING THE DEAD 'queued' LABEL ----
             *
             * A mission at status='queued' is stopped, permanently, and looks
             * live while it is: the advance pass below selects running/in_progress,
             * maybeCompleteMission finalizes running/in_progress, and the mission
             * page read 'queued' as already-running. Eight rows sat there — six
             * written by the trigger-tick's auto-promote, two by the old human
             * launch button, the oldest from 2026-07-05. Both writers now launch
             * into 'running' instead, so this pass is the safety net rather than
             * the fix: it exists so that a 'queued' mission from a restored backup,
             * or from a writer added later, is moved within a minute instead of
             * disappearing.
             *
             * ADOPTION, NOT A SECOND EXECUTION PATH. It only relabels the mission
             * to the one status the whole engine keys on. The existing passes then
             * treat it exactly like any other running mission: advance dispatches
             * its ready steps, and the KI-17 re-plan below plans it if it never
             * got a DAG.
             *
             * WHY NOT SIMPLY ADD 'queued' TO THE RE-PLAN SELECT BELOW, which is
             * the narrower change: re-planning a mission that is still labelled
             * 'queued' plans it and dispatches wave 0, and then nothing advances it
             * to wave 1 (the advance pass would still not select it) and nothing
             * can ever complete it. That trades a visible dead end for a quieter
             * one, which is the worse bug.
             *
             * PAIRED WITH THE STALENESS TEST at the re-plan pass below, and the two
             * must stay paired. This write stamps updated_at, and the give-up test
             * there now measures from updated_at rather than created_at — so an
             * adopted mission gets the full ABANDON_MS to be planned. Measured
             * against created_at, every one of those eight (weeks old) would have
             * been halted on the same tick that rescued it. */
            const adopted: string[] = [];
            const { data: strandedQueued, error: strandedErr } = await admin
              .from("missions")
              .select("id,workspace_id,user_id")
              .eq("status", "queued")
              .order("updated_at", { ascending: true })
              .limit(MISSION_BATCH);
            if (strandedErr) {
              // An unread error is not evidence of absence: say the read failed
              // rather than let an empty list read as "nothing was stranded".
              console.error(
                "[resume-runs] queued-mission read failed, adoption skipped this tick:",
                strandedErr.message,
              );
            }
            for (const qm of (strandedQueued ?? []) as {
              id: string;
              workspace_id: string | null;
              user_id: string | null;
            }[]) {
              // Guarded on the status we read, and read back: supabase-js resolves
              // a refused write, so error null + zero rows is the refusal case and
              // must not be counted as an adoption.
              const { data: upd, error: adoptErr } = await admin
                .from("missions")
                .update({ status: "running", updated_at: new Date().toISOString() })
                .eq("id", qm.id)
                .eq("status", "queued")
                .select("id");
              if (adoptErr) {
                console.error(
                  `[resume-runs] adopting queued mission ${qm.id} failed:`,
                  adoptErr.message,
                );
                continue;
              }
              if (!upd || upd.length === 0) continue; // something else moved it first
              adopted.push(qm.id);
              // Best-effort, and it can legitimately be refused: stage_events
              // .workspace_id is a foreign key, so a mission whose workspace has
              // since been deleted gets no trail row. recordStageEvent logs that
              // and never throws, and the mission is still adopted either way.
              await recordStageEvent(admin, {
                entityType: "mission",
                entityId: qm.id,
                from: "queued",
                to: "running",
                actor: "system",
                workspaceId: qm.workspace_id,
                userId: qm.user_id,
              });
            }

            const { data: queued } = await supabaseAdmin
              .from("agent_runs")
              .select("id")
              .eq("status", "queued")
              .order("created_at", { ascending: true })
              .limit(BATCH);
            const { data: stale } = await supabaseAdmin
              .from("agent_runs")
              .select("id")
              .eq("status", "running")
              .or(
                `last_checkpoint_at.lt.${cutoff},and(last_checkpoint_at.is.null,created_at.lt.${cutoff})`,
              )
              .order("created_at", { ascending: true })
              .limit(BATCH);

            // F-STUDIO: paused-on-gate runs whose approvals are all resolved.
            // (pending = undecided; approved = decided but tool not yet executed
            //  — both still block. resumeAgentLoop re-checks before resuming.)
            const { data: waiting } = await supabaseAdmin
              .from("agent_runs")
              .select("id")
              .eq("status", "waiting_approval")
              .order("created_at", { ascending: true })
              .limit(BATCH * 4);
            const resumable: { id: string }[] = [];
            if (waiting && waiting.length > 0) {
              // PERF: Batch-fetch all pending/approved approvals in one query
              // instead of N+1 per waiting run.
              const waitingIds = (waiting as { id: string }[]).map((w) => w.id);
              const { data: blockedApprovals, error: blockedErr } = await admin
                .from("agent_approvals")
                .select("run_id,status")
                .in("run_id", waitingIds)
                .in("status", [...GATE_STILL_HOLDS]);
              const blockedByRun = new Set<string>();
              /* A READ THAT FAILED BLOCKS EVERYTHING. Treating an unreadable
                 approvals table as "nothing is pending" would resume every
                 paused run straight into tool calls nobody answered. Same rule
                 `gateHasBeenAnswered` states for the single-run case. */
              if (blockedErr) for (const id of waitingIds) blockedByRun.add(id);
              for (const a of (blockedApprovals ?? []) as { run_id: string }[]) {
                blockedByRun.add(a.run_id);
              }
              for (const w of waiting) {
                if (resumable.length >= BATCH) break;
                if (!blockedByRun.has(w.id)) resumable.push(w);
              }
            }

            const ids = [...(queued ?? []), ...(stale ?? []), ...resumable].map((r) => r.id);
            /* THE 'running' ROWS ABOVE ARE THE DANGEROUS ONES. They are runs
             * whose worker probably died, and until the lease inside
             * resumeAgentLoop they had no claim of any kind: this tick runs
             * every 60 seconds, STALE_MS is 2 minutes, and one tick resumes up
             * to fifteen runs in sequence, so overlapping ticks replayed the
             * same checkpoint in parallel. The lease lives in resumeAgentLoop
             * so every caller gets it; what belongs here is telling the truth
             * about which of these ids actually ran. */
            const sweep = await resumeRuns(ids, (id) => resumeAgentLoop(supabaseAdmin, id));
            const resumed = sweep.resumed;
            const skipped = sweep.skipped;
            const failed = sweep.failed;

            // v6 Phase 1 — "the loop runs itself": auto-advance every running
            // mission. The deterministic, model-free reflector dispatches
            // newly-ready steps + finalizes terminal DAGs, so a multi-hop mission
            // progresses without the operator re-invoking the orchestrator
            // (Appendix B: the mid-loop-handoff gap). Cheap no-op when nothing is
            // ready; claim-first dispatch makes it safe under overlapping ticks.
            const { data: runningMissions } = await admin
              .from("missions")
              .select("id,user_id,workspace_id,goal,status")
              .in("status", ["running", "in_progress"])
              .order("updated_at", { ascending: true })
              .limit(MISSION_BATCH);
            const advanced: {
              id: string;
              dispatched: number;
              failed: number;
              finalized: boolean;
            }[] = [];
            for (const m of (runningMissions ?? []) as MissionLite[]) {
              try {
                const res = await advanceMissionCore(admin, m);
                if (res.dispatched || res.failed || res.finalized)
                  advanced.push({ id: m.id, ...res });
              } catch (e) {
                failed.push({ id: m.id, error: e instanceof Error ? e.message : String(e) });
              }
            }

            // KI-17: recover missions that have no mission_steps and no active
            // orchestrator run. This happens when chat.ts fires runAgentLoop
            // as fire-and-forget and the Cloudflare Worker terminates before
            // the orchestrator completes its planning call.
            // KI-17 + STARVATION FIX: recover missions with no plan and no
            // active run (orchestrator planning was evicted before it persisted
            // anything). Two changes fix the starvation where old broken missions
            // monopolized the two re-plan slots forever:
            //  (1) order NEWEST-FIRST, so a fresh dispatch is re-planned on the
            //      very next tick instead of waiting behind ancient stuck ones;
            //  (2) any unplanned mission that has been launched longer than
            //      ABANDON_MS is marked 'halted' (planning has failed every retry
            //      for too long), so it leaves the running set and can never clog
            //      the queue again. "Launched" is updated_at, not created_at —
            //      see the test itself for why the difference matters.
            const abandonCutoff = new Date(Date.now() - ABANDON_MS).toISOString();
            const { data: unplannedCandidates } = await admin
              .from("missions")
              // updated_at is selected for the give-up test below, which measures
              // how long this mission has been LAUNCHED and unplanned, not how
              // long ago it was first proposed.
              .select("id,user_id,workspace_id,goal,status,created_at,updated_at")
              .in("status", ["running", "in_progress"])
              .lt("created_at", cutoff)
              .order("created_at", { ascending: false })
              .limit(REPLAN_BATCH * 8);

            // Batch fetch counts for all candidates instead of per-candidate queries (N+1 fix)
            const missionIds = ((unplannedCandidates ?? []) as { id: string }[]).map((m) => m.id);
            const { data: allSteps } = await admin
              .from("mission_steps")
              .select("mission_id")
              .in("mission_id", missionIds);
            const stepCountByMission = new Map<string, number>();
            for (const step of (allSteps ?? []) as { mission_id: string }[]) {
              const key = step.mission_id;
              stepCountByMission.set(key, (stepCountByMission.get(key) ?? 0) + 1);
            }

            const { data: allActiveRuns } = await admin
              .from("agent_runs")
              .select("mission_id")
              .in("mission_id", missionIds)
              .in("status", ["queued", "running", "waiting_approval"]);
            const activeRunCountByMission = new Map<string, number>();
            for (const run of (allActiveRuns ?? []) as { mission_id: string }[]) {
              const key = run.mission_id;
              activeRunCountByMission.set(key, (activeRunCountByMission.get(key) ?? 0) + 1);
            }

            const toReplan: MissionLite[] = [];
            const toAbandon: string[] = [];
            for (const m of (unplannedCandidates ?? []) as (MissionLite & {
              created_at: string;
              updated_at: string | null;
            })[]) {
              const stepCount = stepCountByMission.get(m.id) ?? 0;
              if (stepCount > 0) continue;
              const activeRuns = activeRunCountByMission.get(m.id) ?? 0;
              if (activeRuns > 0) continue;
              /* Genuinely unplanned. Abandon it if it has been stuck past the
               * threshold; otherwise re-plan it (newest first, up to the cap).
               *
               * MEASURED FROM updated_at, WHICH IS WHEN IT WAS LAUNCHED, not from
               * created_at, which is when it was first proposed. Those are the same
               * instant only for a mission created straight into 'running'. For
               * every other door they are far apart, and created_at silently gave
               * up on work that had just started:
               *   - a proposal that sat for days before a person pressed launch
               *     (promoteMission) was already past the cutoff at the moment of
               *     the click, so its first sweep halted it;
               *   - the same for a mission the adoption pass above just rescued —
               *     all eight were weeks old, so this test would have halted every
               *     one of them on the tick that adopted it.
               * Falls back to created_at when updated_at is null, so a row written
               * before that column was populated behaves exactly as it does today. */
              const launchedAt = m.updated_at ?? m.created_at;
              if (launchedAt < abandonCutoff) {
                toAbandon.push(m.id);
              } else if (toReplan.length < REPLAN_BATCH) {
                toReplan.push(m);
              }
            }
            // Give up on missions whose planning never landed; keeps the queue
            // clear. Best-effort: a failure here just retries next tick.
            const abandoned = await haltAbandonedMissions(
              admin,
              toAbandon,
              new Date().toISOString(),
            );
            const planned: { id: string; run_id?: string; error?: string }[] = [];
            for (const m of toReplan) {
              try {
                // Self-healing: seed_default_agents seeds 'orchestrator' at
                // signup, but this call must never trust that alone. An
                // account created before this was added, restored from an
                // older backup, or otherwise missing its roster would
                // otherwise fail here forever with "Unknown agent:
                // orchestrator" and (worse) permanently occupy one of the
                // fixed REPLAN_BATCH slots every tick, starving every other
                // tenant's re-plan sweep behind it. Idempotent; cheap.
                await admin.rpc("seed_orchestrator_agent", { p_user_id: m.user_id });
                const res = await runAgentLoop(admin, m.user_id, {
                  agentSlug: "orchestrator",
                  goal: m.goal,
                  missionId: m.id,
                  workspaceId: m.workspace_id,
                });
                planned.push({ id: m.id, run_id: (res as { run_id?: string })?.run_id });
              } catch (e) {
                planned.push({ id: m.id, error: e instanceof Error ? e.message : String(e) });
                failed.push({ id: m.id, error: e instanceof Error ? e.message : String(e) });
              }
            }

            // BLD-GATE-SYNC block pass — run LAST (after resume + advance) so we never block a
            // mission that progressed this tick. Surfaces missions fully parked on a pending human
            // gate as 'blocked' (Needs-You lane). The guarded update no-ops if the advance loop
            // already finalized the mission.
            const blocked: string[] = [];
            const { data: blockCandidates } = await admin
              .from("missions")
              .select("id,status,workspace_id,user_id")
              .in("status", ["running", "in_progress"])
              .order("updated_at", { ascending: true })
              .limit(MISSION_BATCH);
            if (blockCandidates && blockCandidates.length > 0) {
              const blockIds = (blockCandidates as { id: string }[]).map((m) => m.id);
              const { runsByMission, pendingByMission } = await buildGateMaps(blockIds);
              for (const cm of (blockCandidates ?? []) as {
                id: string;
                status: string;
                workspace_id: string | null;
                user_id: string | null;
              }[]) {
                const runStatuses = runsByMission.get(cm.id) ?? [];
                if (!runStatuses.includes("waiting_approval")) continue; // cheap short-circuit
                const pendingGateCount = pendingByMission.get(cm.id) ?? 0;
                if (
                  classifyMissionGate({ status: cm.status, runStatuses, pendingGateCount }) ===
                  "block"
                ) {
                  const { data: upd } = await admin
                    .from("missions")
                    .update({ status: "blocked", updated_at: new Date().toISOString() })
                    .eq("id", cm.id)
                    .in("status", ["running", "in_progress"])
                    .select("id");
                  if (upd && upd.length) {
                    blocked.push(cm.id);
                    await recordStageEvent(admin, {
                      entityType: "mission",
                      entityId: cm.id,
                      from: cm.status,
                      to: "blocked",
                      actor: "system",
                      workspaceId: cm.workspace_id,
                      userId: cm.user_id,
                    });
                  }
                }
              }
            }

            /*
             * A START IS DRIVEN WITHIN THE MINUTE, WHEREVER IT WAS PRESSED.
             *
             * Lane 2, 2026-09-08, probe run b830828a: a run started from the
             * home's composer was not driven unless its run screen stayed
             * mounted. The screen's `?start=true` effect makes the first
             * drive, so a person who pressed Start and came straight back to
             * the home left a track with driven_at null and no seat for
             * ninety seconds, until track-tick's ten-minute pass. The start
             * belongs to the server: this sweep runs every minute, so a fresh
             * open track nobody has driven yet is driven here, once, as the
             * sweep's own work (via "sweep", F-55: nobody is watching it).
             * Bounded to three per pass and to tracks under fifteen minutes
             * old, so a backlog of abandoned starts cannot take the minute;
             * older ones stay track-tick's, whose ordering already puts a
             * never-driven track first. A track that asked to stop is left
             * alone, and one that throws must not stop the pass.
             */
            const freshTracks: string[] = [];
            const freshFailed: string[] = [];
            try {
              const freshSince = new Date(Date.now() - 15 * 60 * 1000).toISOString();
              const { data: fresh } = await admin
                .from("spine_tracks" as never)
                .select(DRIVE_SELECT)
                .eq("status", "open")
                .is("driven_at", null)
                .is("stop_requested_at", null)
                .gte("created_at", freshSince)
                .order("created_at", { ascending: true })
                .limit(3);
              const sweepStartedAt = Date.now();
              for (const row of (fresh ?? []) as unknown as DriveRow[]) {
                try {
                  await driveTrackOnce(
                    admin as unknown as SupabaseClient,
                    row,
                    "sweep",
                    sweepStartedAt,
                  );
                  freshTracks.push(row.id);
                } catch (e) {
                  freshFailed.push(`${row.id}: ${e instanceof Error ? e.message : String(e)}`);
                }
              }
            } catch (e) {
              freshFailed.push(`read: ${e instanceof Error ? e.message : String(e)}`);
            }

            /*
             * THE STARTER RUNS A CANCELLED WORKER DROPPED. completeOnboarding
             * and the home's read start a product's starter-run generation
             * behind their response and answer at once (Lane 1, 2026-09-08:
             * nobody is held on a disabled button while the machine writes).
             * A Worker may cancel that promise once the response is out, so
             * this sweep is the guarantee: a product from the last day with
             * nothing stored and no live claim is generated here, two per
             * pass, under the product's own user for the model call.
             */
            const starterRunsWritten: string[] = [];
            const starterRunsFailed: string[] = [];
            try {
              const sweepNow = Date.now();
              const staleIso = new Date(sweepNow - STARTER_RUNS_CLAIM_MS).toISOString();
              const recentIso = new Date(sweepNow - 24 * 60 * 60 * 1000).toISOString();
              const { data: waiting } = await admin
                .from("projects")
                .select("id,user_id")
                .is("starter_runs", null)
                .is("archived_at", null)
                .gte("created_at", recentIso)
                .or(`starter_runs_at.is.null,starter_runs_at.lt.${staleIso}`)
                .order("created_at", { ascending: true })
                .limit(2);
              for (const p of (waiting ?? []) as Array<{ id: string; user_id: string | null }>) {
                if (!p.user_id) continue;
                const claimed = await claimStarterRuns(
                  admin as unknown as SupabaseClient,
                  p.id,
                  new Date().toISOString(),
                );
                if (!claimed) continue;
                const runs = await keepStarterRuns(
                  admin as unknown as SupabaseClient,
                  p.user_id,
                  p.id,
                );
                (runs ? starterRunsWritten : starterRunsFailed).push(p.id);
              }
            } catch (e) {
              starterRunsFailed.push(`read: ${e instanceof Error ? e.message : String(e)}`);
            }

            return new Response(
              JSON.stringify({
                ok: true,
                resumed,
                // Fresh open tracks nobody had driven, started here (F-55 sweep).
                freshTracksDriven: freshTracks,
                freshTracksFailed: freshFailed,
                // Starter runs a cancelled Worker dropped, generated here.
                starterRunsWritten,
                starterRunsFailed,
                // Runs another worker already held. Reported, never counted as
                // work this tick did.
                skipped,
                failed,
                advanced,
                planned,
                unblocked,
                blocked,
                adopted,
                abandoned: abandoned.halted,
              }),
              {
                headers: { "Content-Type": "application/json" },
              },
            );
          } catch (e) {
            return new Response(
              JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }
        });
      },
    },
  },
});
