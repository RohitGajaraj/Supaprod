import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resumeAgentLoop, runAgentLoop } from "@/lib/ai/loop.server";
import { advanceMissionCore, type MissionLite } from "@/lib/ai/mission-advance.server";
import { classifyMissionGate } from "@/lib/reliability/gate-state";
import { withJobRun } from "@/lib/observability";
import { recordStageEvent } from "@/lib/stage-events.server";

// agent_approvals.run_id is new in the f_studio_engine migration — not in the
// generated types until they regenerate post-apply (F-V5 untyped-cast pattern).
const admin = supabaseAdmin as unknown as SupabaseClient;

/**
 * Resume-runs sweeper — picks up missions that need to advance:
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
 * Plus BLD-GATE-SYNC mission-status reconciliation (deterministic, no AI):
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
const BATCH = 5;
// KI-16: per-tick fairness cap on running missions advanced (oldest-updated
// first, so no mission starves). Env-tunable for high scale; sane default 50.
// Each advance is a cheap no-op when the mission has no ready work.
const MISSION_BATCH = Math.max(1, Number(process.env.MISSION_ADVANCE_BATCH) || 50);
// Cap on unplanned mission re-planning per tick. Each call triggers an
// orchestrator AI loop (expensive); 2 is intentionally conservative.
const REPLAN_BATCH = 2;
// Starvation guard: an unplanned mission (no steps, no active run) older than
// this has failed to plan on every re-plan retry for too long. It is marked
// 'halted' so it can never permanently monopolize the fixed REPLAN_BATCH slots
// and starve fresh dispatches behind it. Env-tunable; 20 minutes by default.
const ABANDON_MS = Math.max(60_000, Number(process.env.REPLAN_ABANDON_MS) || 20 * 60 * 1000);

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
              const { data: blockedApprovals } = await admin
                .from("agent_approvals")
                .select("run_id")
                .in("run_id", waitingIds)
                .in("status", ["pending", "approved"]);
              const blockedByRun = new Set<string>();
              for (const a of (blockedApprovals ?? []) as { run_id: string }[]) {
                blockedByRun.add(a.run_id);
              }
              for (const w of waiting) {
                if (resumable.length >= BATCH) break;
                if (!blockedByRun.has(w.id)) resumable.push(w);
              }
            }

            const ids = [...(queued ?? []), ...(stale ?? []), ...resumable].map((r) => r.id);
            const resumed: string[] = [];
            const failed: { id: string; error: string }[] = [];
            for (const id of ids) {
              try {
                await resumeAgentLoop(supabaseAdmin, id);
                resumed.push(id);
              } catch (e) {
                failed.push({ id, error: e instanceof Error ? e.message : String(e) });
              }
            }

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
            //  (2) any unplanned mission older than ABANDON_MS is marked 'halted'
            //      (planning has failed every retry for too long), so it leaves
            //      the running set and can never clog the queue again.
            const abandonCutoff = new Date(Date.now() - ABANDON_MS).toISOString();
            const { data: unplannedCandidates } = await admin
              .from("missions")
              .select("id,user_id,workspace_id,goal,status,created_at")
              .in("status", ["running", "in_progress"])
              .lt("created_at", cutoff)
              .order("created_at", { ascending: false })
              .limit(REPLAN_BATCH * 8);

            // Batch fetch counts for all candidates instead of per-candidate queries (N+1 fix)
            const missionIds = (unplannedCandidates ?? []).map((m: any) => m.id);
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
            })[]) {
              const stepCount = stepCountByMission.get(m.id) ?? 0;
              if (stepCount > 0) continue;
              const activeRuns = activeRunCountByMission.get(m.id) ?? 0;
              if (activeRuns > 0) continue;
              // Genuinely unplanned. Abandon it if it has been stuck past the
              // threshold; otherwise re-plan it (newest first, up to the cap).
              if (m.created_at < abandonCutoff) {
                toAbandon.push(m.id);
              } else if (toReplan.length < REPLAN_BATCH) {
                toReplan.push(m);
              }
            }
            if (toAbandon.length) {
              // Give up on missions whose planning never landed; keeps the queue
              // clear. Best-effort: a failure here just retries next tick.
              await admin
                .from("missions")
                .update({ status: "halted", updated_at: new Date().toISOString() })
                .in("id", toAbandon);
            }
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

            return new Response(
              JSON.stringify({ ok: true, resumed, failed, advanced, planned, unblocked, blocked }),
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
