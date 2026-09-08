/**
 * A STOP CANCELS THE QUESTIONS THE RUN WAS STILL ASKING.
 *
 * F-205. A person's Stop stamps `spine_tracks.stop_requested_at` (R-32) and the
 * driver halts on the next tick. Nothing on that path touched
 * `agent_approvals`, so a gate the stopped run had raised stayed `pending` on
 * Waiting for a person to answer, on behalf of work that will never use the
 * answer. `cancelMission` used to do this for a mission and lost its door with
 * Board.tsx; this is the one place now, and both stop paths call it: the press
 * (through the caller's own client, so RLS decides what they may cancel) and
 * the driver's stop branch (through the sweep's client, for the rest).
 *
 * Idempotent: only `pending` rows are touched, so a second call finds nothing.
 * A failed read or write is returned as a refusal, never swallowed: a stop that
 * left a question open should say so rather than report a clean stop.
 */

type ApprovalsClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => PromiseLike<{
        data: Array<{ id: string }> | null;
        error: { message: string } | null;
      }>;
    };
    update: (patch: Record<string, unknown>) => {
      in: (
        col: string,
        vals: string[],
      ) => {
        eq: (
          col: string,
          val: string,
        ) => {
          select: (cols: string) => PromiseLike<{
            data: Array<{ id: string }> | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

export type StopCancelResult =
  { ok: true; cancelled: number } | { ok: false; cancelled: 0; refused: string };

export async function cancelPendingApprovalsForTrack(
  client: ApprovalsClient,
  trackId: string,
  by: { userId: string | null; reason: string },
  nowIso: string = new Date().toISOString(),
): Promise<StopCancelResult> {
  const { data: runs, error: runsErr } = await client
    .from("agent_runs")
    .select("id")
    .eq("track_id", trackId);
  if (runsErr) {
    return {
      ok: false,
      cancelled: 0,
      refused: `its open questions could not be read: ${runsErr.message}`,
    };
  }
  const runIds = (runs ?? []).map((r) => r.id);
  if (runIds.length === 0) return { ok: true, cancelled: 0 };

  const { data: cancelled, error } = await client
    .from("agent_approvals")
    .update({
      status: "cancelled",
      decided_at: nowIso,
      decided_by: by.userId,
      decision_reason: by.reason,
    })
    .in("run_id", runIds)
    .eq("status", "pending")
    .select("id");
  if (error) {
    return {
      ok: false,
      cancelled: 0,
      refused: `its open questions could not be cancelled: ${error.message}`,
    };
  }
  return { ok: true, cancelled: (cancelled ?? []).length };
}
