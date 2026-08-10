/**
 * INSTRUMENT: what every agent run reports, rolled up per station.
 *
 * The brief names five signals: outcome, retries, abandonment, time to first
 * result, and station. This module is the pure half of answering that, so the
 * same rollup drives the server read, any surface, and the tests.
 *
 * FOUR OF THE FIVE ARE REAL. The fifth is named as absent rather than faked,
 * because a zero in a dashboard reads as "no retries happened", and the honest
 * statement is that nothing counts them.
 *
 * WHY THIS EXISTS AT ALL. Before 2026-08-10 the underlying columns were
 * unusable: `duration_ms` was a hardcoded 0 in both finalize paths (441 of 471
 * real runs carried no elapsed time), and `halted_reason`/`halted_at` were read
 * by three surfaces and written by none. A rollup over those columns would have
 * been arithmetic on placeholders. They are written now, so this reads real
 * data going forward and reports honestly on the runs that predate the fix.
 */
import { agentStation } from "@/lib/agent-vocabulary";
import type { AgentStation } from "@/lib/agent-vocabulary";

/** One `agent_runs` row, as much of it as this rollup needs. */
export type RunRow = {
  agent_slug: string | null;
  status: string | null;
  duration_ms: number | null;
  failure_kind: string | null;
  halted_reason: string | null;
};

/**
 * What happened to a run, collapsed to the four states a person cares about.
 *
 * `completed` and `complete` are BOTH mapped to succeeded. They are the same
 * state written by two code paths (agents.functions.ts writes the singular,
 * the loop writes the plural), and 2 of 245 real successful runs carry the
 * singular. Any surface that grouped by the raw column silently split them and
 * showed a two-run category nobody could explain.
 */
export type RunOutcome = "succeeded" | "succeeded_with_failures" | "failed" | "abandoned";

export function classifyRunOutcome(status: string | null | undefined): RunOutcome | null {
  switch ((status ?? "").trim()) {
    case "complete":
    case "completed":
      return "succeeded";
    case "completed_with_failures":
      return "succeeded_with_failures";
    case "failed":
      return "failed";
    case "halted":
      return "abandoned";
    default:
      // running / waiting_approval / anything unrecognised is IN FLIGHT, not a
      // silent success. Returning null keeps it out of every rate below rather
      // than inflating the denominator with runs that have not finished.
      return null;
  }
}

export type StationStats = {
  station: AgentStation | "(unattributed)";
  runs: number;
  succeeded: number;
  succeededWithFailures: number;
  failed: number;
  abandoned: number;
  /** succeeded / finished. 0 when nothing has finished. */
  successRate: number;
  /** Median rather than mean: one 40-minute outlier should not move the number
   *  a person reads as "how long this usually takes". */
  medianDurationMs: number | null;
  /** How many finished runs carried no usable duration. Reported rather than
   *  hidden, because the median above is computed only over the rest and its
   *  trustworthiness depends on this. */
  runsMissingDuration: number;
  /** Top failure classifications, most frequent first. */
  topFailureKinds: Array<{ kind: string; count: number }>;
  /** Why runs were abandoned, most frequent first. */
  haltReasons: Array<{ reason: string; count: number }>;
};

export type RunAnalytics = {
  byStation: StationStats[];
  overall: StationStats;
  /**
   * TRUE when the product cannot answer "how often does an agent retry".
   *
   * Nothing in the schema counts retries: `agent_runs` carries no attempt
   * column and no parent-run reference, so a re-run is indistinguishable from
   * a first attempt. This flag exists so a surface says "not measured" instead
   * of drawing a zero, which would read as "retries do not happen".
   */
  retriesNotMeasured: true;
};

function emptyStats(station: StationStats["station"]): StationStats {
  return {
    station,
    runs: 0,
    succeeded: 0,
    succeededWithFailures: 0,
    failed: 0,
    abandoned: 0,
    successRate: 0,
    medianDurationMs: null,
    runsMissingDuration: 0,
    topFailureKinds: [],
    haltReasons: [],
  };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? Math.round((s[mid - 1] + s[mid]) / 2) : s[mid];
}

function topCounts(counts: Map<string, number>, key: "kind" | "reason") {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([k, count]) => ({ [key]: k, count })) as never;
}

/**
 * Roll runs up per station.
 *
 * A run whose agent maps to no station lands in "(unattributed)" rather than
 * being dropped, so the per-station totals always reconcile against the
 * overall total. Silently discarding them would make the station breakdown
 * disagree with the run count on the same screen, which is the class of bug
 * that makes a person stop trusting a dashboard.
 */
export function rollUpRuns(rows: readonly RunRow[]): RunAnalytics {
  const byStation = new Map<string, StationStats>();
  const durations = new Map<string, number[]>();
  const failures = new Map<string, Map<string, number>>();
  const halts = new Map<string, Map<string, number>>();

  const overall = emptyStats("(unattributed)");
  const overallDurations: number[] = [];
  const overallFailures = new Map<string, number>();
  const overallHalts = new Map<string, number>();

  for (const r of rows) {
    const outcome = classifyRunOutcome(r.status);
    if (!outcome) continue; // in flight: not yet a result

    const key = agentStation(r.agent_slug) ?? "(unattributed)";
    const stats = byStation.get(key) ?? emptyStats(key as StationStats["station"]);

    stats.runs += 1;
    overall.runs += 1;
    if (outcome === "succeeded") {
      stats.succeeded += 1;
      overall.succeeded += 1;
    } else if (outcome === "succeeded_with_failures") {
      stats.succeededWithFailures += 1;
      overall.succeededWithFailures += 1;
    } else if (outcome === "failed") {
      stats.failed += 1;
      overall.failed += 1;
    } else {
      stats.abandoned += 1;
      overall.abandoned += 1;
    }

    // A zero duration is treated as MISSING, not as an instantaneous run.
    // Every run written before 2026-08-10 carries a hardcoded 0, and counting
    // those as real would drag every median toward zero and make the slowest
    // stations look the fastest.
    if (typeof r.duration_ms === "number" && r.duration_ms > 0) {
      const list = durations.get(key) ?? [];
      list.push(r.duration_ms);
      durations.set(key, list);
      overallDurations.push(r.duration_ms);
    } else {
      stats.runsMissingDuration += 1;
      overall.runsMissingDuration += 1;
    }

    if (r.failure_kind) {
      const m = failures.get(key) ?? new Map<string, number>();
      m.set(r.failure_kind, (m.get(r.failure_kind) ?? 0) + 1);
      failures.set(key, m);
      overallFailures.set(r.failure_kind, (overallFailures.get(r.failure_kind) ?? 0) + 1);
    }
    if (r.halted_reason) {
      const m = halts.get(key) ?? new Map<string, number>();
      m.set(r.halted_reason, (m.get(r.halted_reason) ?? 0) + 1);
      halts.set(key, m);
      overallHalts.set(r.halted_reason, (overallHalts.get(r.halted_reason) ?? 0) + 1);
    }

    byStation.set(key, stats);
  }

  for (const [key, stats] of byStation) {
    stats.medianDurationMs = median(durations.get(key) ?? []);
    stats.successRate = stats.runs === 0 ? 0 : stats.succeeded / stats.runs;
    stats.topFailureKinds = topCounts(failures.get(key) ?? new Map(), "kind");
    stats.haltReasons = topCounts(halts.get(key) ?? new Map(), "reason");
  }
  overall.medianDurationMs = median(overallDurations);
  overall.successRate = overall.runs === 0 ? 0 : overall.succeeded / overall.runs;
  overall.topFailureKinds = topCounts(overallFailures, "kind");
  overall.haltReasons = topCounts(overallHalts, "reason");

  return {
    byStation: [...byStation.values()].sort((a, b) => b.runs - a.runs),
    overall,
    retriesNotMeasured: true,
  };
}
