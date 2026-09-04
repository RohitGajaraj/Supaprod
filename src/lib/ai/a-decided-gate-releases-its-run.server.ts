/**
 * The write side of `a-decided-gate-releases-its-run`.
 *
 * The resume sweep is the backstop and it is enough on its own -- it asks the
 * same question every 60 seconds. This exists because a person who has just
 * pressed a button is WATCHING, and "your answer is recorded, the run picks it
 * up within a minute" is a worse product than the run moving while they look at
 * it. The sweep still runs; this only removes the wait on the one path where
 * somebody is there to notice it.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { gateHasBeenAnswered } from "@/lib/ai/a-decided-gate-releases-its-run";

/**
 * Let a run go of its gate, if this decision was the last thing holding it.
 *
 * `queued` and not `running`: this function does not resume anything, it makes
 * the run resumable. `resumeAgentLoop` owns resumption, takes its own lease and
 * promotes `queued` to `running` on a compare-and-swap, and duplicating any of
 * that here would be a second resumer racing the sweep -- which is precisely
 * the defect that lease was added to stop.
 *
 * BEST-EFFORT AND SILENT ON FAILURE. The decision itself is already recorded
 * and must stand; a run that does not get released here is released by the
 * sweep on its next pass. Throwing would turn a latency improvement into a way
 * to lose somebody's answer.
 */
export async function releaseRunIfGateAnswered(
  supabase: SupabaseClient,
  approvalId: string,
): Promise<{ released: boolean }> {
  try {
    const { data: appr, error: apprErr } = await supabase
      .from("agent_approvals")
      .select("run_id")
      .eq("id", approvalId)
      .maybeSingle();
    if (apprErr) return { released: false };
    const runId = (appr as { run_id?: string | null } | null)?.run_id ?? null;
    if (!runId) return { released: false };

    const { data: runRow, error: runErr } = await supabase
      .from("agent_runs")
      .select("status")
      .eq("id", runId)
      .maybeSingle();
    if (runErr || !runRow) return { released: false };

    const { data: siblings, error: sibErr } = await supabase
      .from("agent_approvals")
      .select("status")
      .eq("run_id", runId);

    const answered = gateHasBeenAnswered({
      runStatus: (runRow as { status?: string | null }).status,
      approvalStatuses: ((siblings ?? []) as Array<{ status: string | null }>).map((r) => r.status),
      /* A failed read is not evidence that nothing is pending. */
      known: !sibErr && !!siblings,
    });
    if (!answered) return { released: false };

    /* The precondition is IN the statement, not around it: another resumer may
       have moved this row between the read and the write, and a run that is
       already running must not be dragged back to `queued`. */
    const { data: moved } = await supabase
      .from("agent_runs")
      .update({ status: "queued" })
      .eq("id", runId)
      .eq("status", "waiting_approval")
      .select("id");
    return { released: !!moved?.length };
  } catch {
    return { released: false };
  }
}
