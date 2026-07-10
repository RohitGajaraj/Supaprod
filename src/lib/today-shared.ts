/**
 * Pure logic extracted from today.functions.ts.
 *
 * Shared helper functions for gate filtering, cost aggregation, latency
 * calculation, and evidence text extraction. Separated to enable unit testing
 * without Supabase mocking.
 */

/**
 * PostgREST OR filter for LIVE gates: pending status AND inside the expiry window
 * (expires_at is null OR expires_at > now). Used by countNeedsYouCalls and getNeedsYou.
 */
export function liveGateOr(nowIso: string): string {
  return `expires_at.is.null,expires_at.gt.${nowIso}`;
}

/**
 * PostgREST OR filter for EXPIRED gates: either marked expired OR pending-but-past-window
 * (the sweeper may lag; report honest state). Used by countNeedsYouCalls and getNeedsYou.
 */
export function expiredGateOr(nowIso: string): string {
  return `escalation_state.eq.expired,and(escalation_state.eq.pending,expires_at.lte.${nowIso})`;
}

/**
 * PostgREST OR filter for NOT SNOOZED: either never snoozed (snoozed_until is null)
 * or snooze window has passed. Chained after liveGateOr in the query. Used by
 * countNeedsYouCalls and getNeedsYou.
 */
export function notSnoozedOr(nowIso: string): string {
  return `snoozed_until.is.null,snoozed_until.lt.${nowIso}`;
}

/**
 * Compute median time in minutes from created_at to decided_at for a list of
 * agent approval records. Returns null if the list is empty or has no valid
 * latencies. Used to power "Gate response · your median" metric.
 *
 * @param records Array of { created_at: string; decided_at: string }
 * @returns Median latency in minutes, or null if no valid data
 */
export function computeGateMedianMinutes(
  records: { created_at: string; decided_at: string }[],
): number | null {
  const latencies = records
    .map((a) => (+new Date(a.decided_at) - +new Date(a.created_at)) / 60_000)
    .filter((m) => Number.isFinite(m) && m >= 0)
    .sort((a, b) => a - b);
  return latencies.length ? Math.round(latencies[Math.floor(latencies.length / 2)]) : null;
}

/**
 * Accumulate cost and model by trace ID from ai_events rows. Returns two maps:
 * one for aggregate cost per trace, one for the first model seen per trace.
 * Skips rows with null trace_id.
 */
export function accumulateCostAndModelByTrace(
  events: { trace_id: string | null; model: string; est_cost_usd: number | null }[],
): { costByTrace: Map<string, number>; modelByTrace: Map<string, string> } {
  const costByTrace = new Map<string, number>();
  const modelByTrace = new Map<string, string>();

  for (const e of events) {
    if (!e.trace_id) continue;
    costByTrace.set(e.trace_id, (costByTrace.get(e.trace_id) ?? 0) + Number(e.est_cost_usd || 0));
    if (!modelByTrace.has(e.trace_id)) {
      modelByTrace.set(e.trace_id, e.model);
    }
  }

  return { costByTrace, modelByTrace };
}

/**
 * Aggregate total spend from ai_events rows (est_cost_usd column, summed).
 * Gracefully handles null costs (treats as 0).
 */
export function aggregateDailySpend(events: { est_cost_usd: number | null }[]): number {
  return events.reduce((s, e) => s + Number(e.est_cost_usd || 0), 0);
}

/**
 * Extract display text from a signal (prefer title, fallback to first 140 chars
 * of content) or learning (first 140 chars of summary). Returns empty string
 * if neither field is available.
 */
export function extractEvidenceText(
  evidenceRow:
    | { type: "signal"; title: string | null; content: string }
    | { type: "learning"; summary: string },
): string {
  if (evidenceRow.type === "signal") {
    return evidenceRow.title || evidenceRow.content.slice(0, 140);
  }
  return evidenceRow.summary.slice(0, 140);
}
