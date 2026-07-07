// SW-4 / mission 3.10 LOOP MODE: the work pass a governed recurring loop runs.
//
// A loop promotes a pass the platform already runs as a hidden cron into a
// user-owned recurring mission: visible, workspace-scoped, cadence-controlled,
// pausable, with run history and cost per run (loop_runs). The loop never
// invents new machinery; each kind dispatches to the existing pass:
//   competitor_sweep  -> runStrategyBriefPass (JNY-01 strategy head)
//   signal_recluster  -> clusterSignalsCore (F3 auto-cluster)
//   outcome_review    -> runOutcomeReviews (mission 3.8a), workspace-scoped
//
// Cost per run is summed from ai_events over the run's window for this
// (user, workspace). The passes bill against the loop owner, so the window
// sum is the honest receipt; concurrent spend from another automation in the
// same window would inflate it slightly, never hide it.
//
// The pure seam (kind registry, cadence math, row types) lives in
// loops.shared.ts so the LoopsPanel can import it client-side.

import type { SupabaseClient } from "@supabase/supabase-js";
import { clusterSignalsCore } from "@/lib/ai/cluster.server";
import { runOutcomeReviews } from "@/lib/ai/outcome-review.server";
import { runStrategyBriefPass } from "@/lib/scout/strategy-brief.server";
import { nextRunAt, type LoopRow } from "@/lib/loops.shared";

export type { LoopRow };

export interface LoopPassResult {
  ok: boolean;
  summary: string;
  costUsd: number;
  tokens: number;
  runId: string | null;
}

/**
 * One pass for one loop: open a loop_runs receipt, dispatch to the wrapped
 * pass, sum the window's AI spend, close the receipt, and advance the
 * schedule. Always advances next_run_at (even on error) so a broken loop
 * retries on its cadence instead of hot-looping every tick.
 */
export async function runLoopPass(client: SupabaseClient, loop: LoopRow): Promise<LoopPassResult> {
  const startedAt = new Date();
  let runId: string | null = null;
  {
    const { data: run } = await client
      .from("loop_runs")
      .insert({
        loop_id: loop.id,
        user_id: loop.user_id,
        workspace_id: loop.workspace_id,
        status: "running",
        started_at: startedAt.toISOString(),
      } as never)
      .select("id")
      .single();
    runId = (run as { id?: string } | null)?.id ?? null;
  }

  let ok = true;
  let summary = "";
  try {
    if (loop.kind === "competitor_sweep") {
      const r = await runStrategyBriefPass(client, loop.user_id, loop.workspace_id);
      const briefs = Number(r.competitor.briefWritten) + Number(r.tech_shift.briefWritten);
      const raw = r.competitor.raw + r.tech_shift.raw;
      summary =
        raw === 0
          ? "No new scout signals this window; nothing to brief."
          : `${briefs} brief${briefs === 1 ? "" : "s"} written from ${raw} scout signal${raw === 1 ? "" : "s"}.`;
    } else if (loop.kind === "signal_recluster") {
      const r = await clusterSignalsCore(client, loop.user_id, loop.workspace_id, null);
      summary = r.message || `${r.themes} theme${r.themes === 1 ? "" : "s"} refreshed.`;
    } else if (loop.kind === "outcome_review") {
      const r = await runOutcomeReviews(client, new Date(), loop.workspace_id);
      summary =
        r.reviewed === 0
          ? "No outcome windows due for review."
          : `${r.reviewed} outcome${r.reviewed === 1 ? "" : "s"} reviewed, ${r.drafted} drafted.`;
    } else {
      ok = false;
      summary = `Unknown loop kind: ${loop.kind}`;
    }
  } catch (e) {
    ok = false;
    summary = e instanceof Error ? e.message : String(e);
  }

  const finishedAt = new Date();

  // The run's receipt: AI spend inside the window for this owner+workspace.
  let costUsd = 0;
  let tokens = 0;
  try {
    const { data: events } = await client
      .from("ai_events")
      .select("est_cost_usd, total_tokens")
      .eq("user_id", loop.user_id)
      .eq("workspace_id", loop.workspace_id)
      .gte("created_at", startedAt.toISOString())
      .lte("created_at", finishedAt.toISOString());
    for (const ev of (events ?? []) as Array<{
      est_cost_usd: number | null;
      total_tokens: number | null;
    }>) {
      costUsd += Number(ev.est_cost_usd ?? 0);
      tokens += Number(ev.total_tokens ?? 0);
    }
  } catch {
    // Cost is a receipt, not a gate: a failed sum never fails the run.
  }

  if (runId) {
    await client
      .from("loop_runs")
      .update({
        status: ok ? "ok" : "error",
        finished_at: finishedAt.toISOString(),
        summary: ok ? summary : null,
        error_message: ok ? null : summary,
        cost_usd: Math.round(costUsd * 1e6) / 1e6,
        tokens,
      } as never)
      .eq("id", runId);
  }

  await client
    .from("loops")
    .update({
      last_run_at: finishedAt.toISOString(),
      next_run_at: nextRunAt(loop.cadence, finishedAt),
      updated_at: finishedAt.toISOString(),
    } as never)
    .eq("id", loop.id);

  return { ok, summary, costUsd, tokens, runId };
}
