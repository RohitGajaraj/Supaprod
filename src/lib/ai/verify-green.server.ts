/**
 * PC-07 — goal-until-verified missions ("verify_until_green").
 *
 * The design (decided, launch-sprint-specs.md §PC-07): a mission whose PRD
 * carries a compiled Outcome Contract does not complete just because its DAG
 * went terminal. A SEPARATE verifier pass — a distinct agent_run,
 * agent_slug='verifier' — evaluates the oracle checklist (JNY-03's
 * loadMissionTestPlan: eval results, CI gate, UAT checkboxes). On green the
 * mission completes; on anything else the verifier turns the unmet clauses
 * into structured feedback and dispatches ONE corrective cycle through the
 * ordinary handoff machinery (so the trust ramp, approval gates, and step
 * ceilings all apply to the new cycle untouched).
 *
 * HARD CAPS (the spec's non-negotiables):
 *   - max 3 corrective cycles per mission (missions.verify_cycles),
 *   - a per-mission verify spend ceiling (existing agent_runs spend, summed),
 *   - each cycle's runs keep every existing per-run/step ceiling.
 * On a cap the mission completes as 'completed_with_failures' — honest, never
 * an infinite loop, never a silent green.
 *
 * The verifier's judgment is deterministic-first: the checklist verdict comes
 * from real oracle rows, not a model. The model (surface 'judge', precise
 * instruction, JSON output) only WRITES the corrective feedback; if that call
 * fails, a deterministic fallback composes feedback from the clause texts, so
 * the cycle never silently dies on a model error.
 *
 * Kill switch: VERIFY_UNTIL_GREEN=off restores the pre-PC-07 completion path.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { humanizeText } from "@/lib/ai/humanize";
import {
  computeVerdict,
  loadMissionTestPlan,
  type MissionTestPlan,
  type TestPlanVerdict,
} from "@/lib/test-station.functions";
import { callModel } from "@/lib/ai/runtime.server";
import { recordStageEvent } from "@/lib/stage-events.server";

export const MAX_VERIFY_CYCLES = 3;

/** Per-mission spend ceiling for dispatching ANOTHER corrective cycle. */
const VERIFY_SPEND_CAP_USD = Math.max(0.5, Number(process.env.MISSION_VERIFY_SPEND_CAP_USD) || 5);

export type VerifyOutcome =
  /** No compiled contract (or switch off) — complete as before. */
  | "not_applicable"
  /** Oracle checklist is green — complete, verified. */
  | "green"
  /** A corrective cycle was dispatched — the mission keeps running. */
  | "cycle_dispatched"
  /** Cap hit with the checklist still not green — complete with failures. */
  | "caps_exhausted"
  /** Checklist not green AND the corrective dispatch failed — complete with
   *  failures (honest: never a silent green on a broken dispatch). */
  | "dispatch_failed";

/**
 * PURE — the verify decision, unit-tested. Given the checklist verdict and
 * the caps state, what should happen to a mission that just went terminal?
 */
export function decideVerifyAction(input: {
  killSwitchOff: boolean;
  planAvailable: boolean;
  verdict: "passing" | "blocked" | "pending" | null;
  verifyCycles: number;
  missionSpendUsd: number;
  spendCapUsd?: number;
}): VerifyOutcome {
  if (input.killSwitchOff) return "not_applicable";
  if (!input.planAvailable) return "not_applicable";
  if (input.verdict === "passing") return "green";
  if (input.verifyCycles >= MAX_VERIFY_CYCLES) return "caps_exhausted";
  if (input.missionSpendUsd >= (input.spendCapUsd ?? VERIFY_SPEND_CAP_USD)) {
    return "caps_exhausted";
  }
  return "cycle_dispatched";
}

/**
 * PURE — the verdict on the AGENT-FIXABLE scope of the checklist.
 *
 * Two clause kinds are deliberately outside the corrective loop:
 *   - ci: the gate reads the MISSION's own status, which is still 'running'
 *     at verify time (the completion update happens after this pass). We are
 *     only invoked when every step succeeded — exactly the fact the ci
 *     oracle checks — so ci counts as satisfied here, never as a gap for a
 *     corrective cycle to "fix".
 *   - uat: a human acceptance checkbox. No agent cycle can satisfy it;
 *     dispatching cycles at it would burn the whole verify budget on
 *     something only the founder can click. UAT items stay visible on the
 *     test station and in the verifier's note.
 */
export function agentScopeVerdict(
  plan: Extract<MissionTestPlan, { available: true }>,
): TestPlanVerdict {
  return computeVerdict({
    evalItems: plan.eval,
    ci: plan.ci,
    ciStatus: "satisfied",
    uatItems: [],
  });
}

/** The agent-fixable unmet clauses, flattened for corrective feedback (PURE). */
export function unmetClauses(
  plan: Extract<MissionTestPlan, { available: true }>,
): { clauseId: string; text: string; why: string }[] {
  const out: { clauseId: string; text: string; why: string }[] = [];
  for (const e of plan.eval) {
    if (e.result !== "passed") {
      out.push({
        clauseId: e.clauseId,
        text: e.text,
        why:
          e.result === "failed"
            ? "its eval case failed on the last run"
            : "its eval case has not run yet",
      });
    }
  }
  return out;
}

/** PURE — the human-lane leftovers noted (never cycled) on a green pass. */
export function uatLeftovers(plan: Extract<MissionTestPlan, { available: true }>): string[] {
  return plan.uat.filter((u) => !u.checked).map((u) => u.text);
}

const VERIFIER_SYSTEM = `You are the Supaprod verifier. A mission finished its work but its Outcome Contract checklist is not green. Write precise corrective feedback for the agent team.
Rules:
- Be exact and mechanical; no motivation, no hedging, no praise.
- For each unmet clause, say what evidence would satisfy it.
- Give at most 5 next actions, most load-bearing first.
- No em dashes, no en dashes, no AI cliches.
- Output ONLY valid JSON: {"summary": "...", "actions": ["...", "..."]}`;

type MissionRowLite = {
  id: string;
  user_id: string;
  workspace_id: string;
  title: string;
  goal: string;
  status: string;
  verify_cycles?: number | null;
};

async function missionSpendUsd(supabase: SupabaseClient, missionId: string): Promise<number> {
  const { data } = await supabase
    .from("agent_runs")
    .select("spend_used_usd")
    .eq("mission_id", missionId);
  return ((data ?? []) as { spend_used_usd: number | null }[]).reduce(
    (s, r) => s + Number(r.spend_used_usd ?? 0),
    0,
  );
}

/**
 * The verifier pass. Called by maybeCompleteMission at the exact moment a
 * mission would complete cleanly. Returns what completion should do.
 * Every path that does NOT return 'not_applicable' leaves a verifier
 * agent_run on the trace, so actor/verifier separation is visible.
 */
export async function runVerifyCycleIfNeeded(
  supabase: SupabaseClient,
  missionId: string,
): Promise<VerifyOutcome> {
  if (process.env.VERIFY_UNTIL_GREEN === "off") return "not_applicable";

  // The mission row (verify_cycles is post-types migration → read untyped).
  const { data: missionRow } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .maybeSingle();
  const mission = missionRow as unknown as MissionRowLite | null;
  if (!mission) return "not_applicable";
  // Idempotency: maybeCompleteMission fires on EVERY terminal hop, and its
  // own completion update is guarded further down. The verifier's side
  // effects (runs, cycles) must carry the same guard, or a call against an
  // already-completed mission would insert phantom verifier runs.
  if (mission.status !== "running" && mission.status !== "in_progress") {
    return "not_applicable";
  }

  let plan: MissionTestPlan;
  try {
    plan = await loadMissionTestPlan(supabase, missionId);
  } catch (e) {
    // A broken checklist read must never strand a finished mission.
    console.error("verify-green: test plan load failed (completing normally):", e);
    return "not_applicable";
  }
  if (!plan.available) return "not_applicable";

  const spend = await missionSpendUsd(supabase, missionId);
  const cycles = Number(mission.verify_cycles ?? 0);
  // The corrective loop keys on the AGENT-FIXABLE verdict (evals), never on
  // ci (still 'running' here by construction) or uat (the human's lane).
  const verdict = agentScopeVerdict(plan);
  const action = decideVerifyAction({
    killSwitchOff: false,
    planAvailable: true,
    verdict,
    verifyCycles: cycles,
    missionSpendUsd: spend,
  });

  if (action === "green") {
    const leftovers = uatLeftovers(plan);
    await recordVerifierRun(supabase, mission, {
      status: "completed",
      input: verifierInput(plan),
      output:
        leftovers.length === 0
          ? `Outcome contract green: every compiled clause is satisfied (cycle ${cycles} of ${MAX_VERIFY_CYCLES}).`
          : `Outcome contract green on the agent side (cycle ${cycles} of ${MAX_VERIFY_CYCLES}). ${leftovers.length} human acceptance ${leftovers.length === 1 ? "item stays" : "items stay"} on the test station: ${leftovers.join(" · ").slice(0, 600)}`,
    });
    await recordVerifyStage(supabase, mission, "verify_green");
    return "green";
  }

  if (action === "caps_exhausted") {
    await recordVerifierRun(supabase, mission, {
      status: "completed",
      input: verifierInput(plan),
      output: `Verify budget exhausted (${cycles} cycles, $${spend.toFixed(2)} spent) with the checklist still ${verdict}. Completing with failures; the unmet clauses stay on the test station.`,
    });
    await recordVerifyStage(supabase, mission, "verify_exhausted");
    return "caps_exhausted";
  }

  // --- Dispatch one corrective cycle -----------------------------------
  // Claim the cycle FIRST with a compare-and-swap on verify_cycles, so the
  // sweeper and a direct completion path arriving together can never
  // double-dispatch the same corrective cycle (the house claim-first rule,
  // same hazard mission-advance guards against). The loser sees zero rows
  // and simply defers — the winner's queued run keeps the mission alive.
  //
  // Pre-migration tolerant (the mission-advance hasRetryColumns posture):
  // until 20260711003000 lands, verify_cycles does not exist and this update
  // ERRORS. That must complete the mission normally — treating it as a lost
  // claim would defer completion forever on a live DB without the column.
  const { data: claimed, error: claimError } = await supabase
    .from("missions")
    .update({ verify_cycles: cycles + 1, updated_at: new Date().toISOString() } as never)
    .eq("id", mission.id)
    .eq("verify_cycles", cycles)
    .in("status", ["running", "in_progress"])
    .select("id");
  if (claimError) {
    console.error(
      "verify-green: cycle claim failed (pre-migration or transient). Completing normally:",
      claimError.message,
    );
    return "not_applicable";
  }
  if (!claimed || claimed.length === 0) return "cycle_dispatched";

  const unmet = unmetClauses(plan);

  // The verifier's own run: the distinct actor on the trace.
  const verifierRunId = await recordVerifierRun(supabase, mission, {
    status: "running",
    input: verifierInput(plan),
    output: null,
  });

  // Model writes the corrective feedback; deterministic fallback if it fails.
  let summary = `The outcome contract for "${mission.title}" is ${verdict}.`;
  let actions = unmet.slice(0, 5).map((u) => `Satisfy: ${u.text} (${u.why}).`);
  try {
    const res = await callModel(supabase as never, mission.user_id, {
      surface: "judge",
      surface_ref: "verify_until_green",
      model: "google/gemini-2.5-flash",
      workspaceId: mission.workspace_id,
      runId: verifierRunId,
      responseFormat: "json_object",
      messages: [
        { role: "system", content: VERIFIER_SYSTEM },
        {
          role: "user",
          content: `MISSION GOAL: ${mission.goal.slice(0, 800)}\nUNMET CLAUSES:\n${unmet
            .map((u) => `- ${u.text} [${u.why}]`)
            .join("\n")
            .slice(0, 3000)}\n\nWrite the corrective feedback.`,
        },
      ],
    });
    const j = (res.json ?? {}) as { summary?: unknown; actions?: unknown };
    if (typeof j.summary === "string" && j.summary.trim()) summary = j.summary.trim();
    if (Array.isArray(j.actions)) {
      const a = j.actions.filter((x): x is string => typeof x === "string" && !!x.trim());
      if (a.length) actions = a.slice(0, 5);
    }
  } catch (e) {
    console.error("verify-green: feedback model call failed, using deterministic fallback:", e);
  }

  // Structured feedback becomes the next cycle's input, through the ordinary
  // handoff machinery (approvals, budgets, and step ceilings all apply).
  // A dispatch failure must NEVER leave the verifier run 'running' — a live
  // run blocks maybeCompleteMission's liveRuns guard and would strand the
  // mission; fail the run and complete normally instead.
  try {
    const { enqueueHandoff, resolveAgent } = await import("./handoff.server");
    const orchestrator = await resolveAgent(supabase, mission.user_id, {
      agent_slug: "orchestrator",
    });
    await enqueueHandoff(supabase, mission.user_id, {
      mission_id: mission.id,
      workspace_id: mission.workspace_id,
      from_agent_id: null,
      from_agent_slug: "verifier",
      to: orchestrator,
      payload: {
        task: `Verification cycle ${cycles + 1} of ${MAX_VERIFY_CYCLES}: the outcome contract is not green yet. Close the gaps, then the verifier re-checks.`,
        context: {
          verify_feedback: { summary, actions, unmet },
          verify_cycle: cycles + 1,
        },
        artifacts: [{ kind: "prd", id: plan.prdId, title: plan.prdTitle }],
        constraints: [
          "Address ONLY the unmet contract clauses; do not redo satisfied work.",
          `This is corrective cycle ${cycles + 1} of a hard maximum ${MAX_VERIFY_CYCLES}.`,
        ],
      },
      source_run_id: verifierRunId,
      source_trace_id: null,
    });
  } catch (e) {
    console.error("verify-green: corrective dispatch failed (completing with failures):", e);
    if (verifierRunId) {
      await supabase
        .from("agent_runs")
        .update({
          status: "failed",
          output: `Checklist ${verdict}, but the corrective dispatch failed: ${e instanceof Error ? e.message : "unknown error"}`,
          last_checkpoint_at: new Date().toISOString(),
        })
        .eq("id", verifierRunId);
    }
    await recordVerifyStage(supabase, mission, "verify_dispatch_failed");
    return "dispatch_failed";
  }

  if (verifierRunId) {
    await supabase
      .from("agent_runs")
      .update({
        status: "completed",
        output: `Checklist ${verdict}; dispatched corrective cycle ${cycles + 1} of ${MAX_VERIFY_CYCLES}. ${summary}`,
        last_checkpoint_at: new Date().toISOString(),
      })
      .eq("id", verifierRunId);
  }
  await recordVerifyStage(supabase, mission, `verify_cycle_${cycles + 1}`);

  return "cycle_dispatched";
}

function verifierInput(plan: Extract<MissionTestPlan, { available: true }>): string {
  const lines = [
    `Oracle checklist for spec "${plan.prdTitle}" (verdict: ${plan.verdict})`,
    ...plan.eval.map((e) => `eval · ${e.text} · ${e.result}`),
    ...plan.ci.map((c) => `ci · ${c.text}`),
    ...plan.uat.map((u) => `uat · ${u.text} · ${u.checked ? "confirmed" : "unconfirmed"}`),
  ];
  return lines.join("\n").slice(0, 4000);
}

/** Insert the verifier's own agent_run (the separate actor on the trace). */
async function recordVerifierRun(
  supabase: SupabaseClient,
  mission: MissionRowLite,
  args: { status: string; input: string; output: string | null },
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("agent_runs")
      .insert({
        user_id: mission.user_id,
        workspace_id: mission.workspace_id,
        mission_id: mission.id,
        agent_slug: "verifier",
        agent_name: "Verifier",
        input: args.input,
        // Same reason as the other seven: this is the last gate before a
        // sentence a person reads in the transcript.
        output: args.output == null ? null : humanizeText(args.output),
        status: args.status,
        // The verifier is its own actor on the trace, so it gets its own id.
        trace_id: crypto.randomUUID(),
        last_checkpoint_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) {
      console.error("verify-green: verifier run insert failed:", error.message);
      return null;
    }
    return (data as { id: string }).id;
  } catch (e) {
    console.error("verify-green: verifier run insert threw:", e);
    return null;
  }
}

async function recordVerifyStage(
  supabase: SupabaseClient,
  mission: MissionRowLite,
  stage: string,
): Promise<void> {
  try {
    await recordStageEvent(supabase, {
      entityType: "mission",
      entityId: mission.id,
      from: "running",
      to: stage,
      actor: "verifier",
      workspaceId: mission.workspace_id,
      userId: mission.user_id,
    });
  } catch (e) {
    console.error("verify-green: stage event failed:", e);
  }
}
