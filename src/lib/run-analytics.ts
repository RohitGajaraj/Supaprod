/**
 * INSTRUMENT: what every agent run reports, rolled up per station.
 *
 * The brief names five signals: outcome, retries, abandonment, time to first
 * result, and station. This module is the pure half of answering that, so the
 * same rollup drives the server read, any surface, and the tests.
 *
 * THE FIFTH IS NOW MEASURED WHERE A DISPATCHER COUNTED, AND ONLY THERE.
 * `retriesNotMeasured` used to be a hardcoded `true` here, because `agent_runs`
 * carried no attempt counter at all. It now carries `attempt`, and this rollup
 * computes the flag from the data instead of asserting it: it is true exactly
 * when no run in the window carried a countable attempt. That keeps the original
 * protection — a surface must never draw a zero that means "nobody counted" —
 * while letting a real retry, when one happens, be reported as one.
 *
 * WHY THE COVERAGE IS PARTIAL AND SAYS SO. Only a dispatcher that genuinely
 * counts attempts writes the column: the reactor (`event_queue.attempt_count`,
 * 10 rows retried on production) and an orchestrated hop
 * (`mission_steps.attempts`). A person re-asking the same goal in chat produces
 * a run that no one counted, and it stays NULL rather than being called attempt
 * 1. So `retries` is always read against `runsWithKnownAttempt`, never alone.
 *
 * RESUMES ARE REPORTED SEPARATELY AND ARE NOT RETRIES. A resume continues the
 * SAME run from its checkpoint; a retry is a new run at the same work. 1,117 of
 * 1,232 runs have checkpoints, so resumption is the common path, and folding the
 * sweeper's ordinary rescue work into a retry count would make the agents look
 * like they fail constantly.
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
  /**
   * 1-based attempt ordinal, written only by a dispatcher that counts. OPTIONAL
   * on this type rather than required, because the server read omits both new
   * columns from its `select` until the migration applies — naming an absent
   * column fails the whole query in PostgREST, and an analytics panel that
   * vanishes tells a person "nothing happened".
   */
  attempt?: number | null;
  /** Times a worker picked this run back up after it had already begun. */
  resume_count?: number | null;
};

/**
 * What happened to a run, collapsed to the four states a person cares about.
 *
 * `completed`, `complete` and `done` are ALL mapped to succeeded. They are one
 * state written by three code paths (the loop writes the plural,
 * agents.functions.ts writes the singular, delegate/poll.server.ts folds an
 * external job's `done` straight onto the row), and 2 of 245 real successful
 * runs carry the singular. Any surface that grouped by the raw column silently
 * split them and showed a two-run category nobody could explain.
 */
export type RunOutcome = "succeeded" | "succeeded_with_failures" | "failed" | "abandoned";

export function classifyRunOutcome(status: string | null | undefined): RunOutcome | null {
  switch ((status ?? "").trim()) {
    case "complete":
    case "completed":
    /*
     * `done` is a THIRD spelling of the same state and it was missing, so an
     * external delegate job that finished was counted as still running.
     * `foldDelegateResult` in `delegate/poll.server.ts` writes one value to both
     * `mission_steps.status` and `agent_runs.status`, and on the happy path that
     * value is the literal "done".
     */
    case "done":
      return "succeeded";
    case "completed_with_failures":
      return "succeeded_with_failures";
    case "failed":
      return "failed";
    /*
     * A STOP IS AN ENDING, AND BOTH OF THESE WERE FALLING THROUGH TO `null`.
     *
     * `null` means in flight, so a cancelled run was dropped from its station's
     * success rate permanently: never counted as finished, never counted as
     * failed, and invisible in the denominator that gives every other number its
     * meaning. `agent-fleet.ts` buckets `cancelled` as failed and `run-state.ts`
     * calls it stopped; only this file thought it was still going.
     *
     * `abandoned` rather than `failed`, for the same reason `halted` is: the work
     * stopped without finishing and no fault was recorded. Reporting a run
     * somebody deliberately stopped as a failure sends a person to look at an
     * agent that did nothing wrong.
     *
     * It matters more from here on than it did behind: production carried zero
     * `cancelled` runs when this was measured on 2026-08-20, because there was no
     * way to stop one. `stopRun` landed the same day.
     */
    case "cancelled":
    case "canceled":
    case "halted":
      return "abandoned";
    default:
      // queued / running / waiting_approval / proposed / blocked / anything
      // unrecognised is IN FLIGHT, not a silent success. Returning null keeps it
      // out of every rate below rather than inflating the denominator with runs
      // that have not finished. Every spelling a writer in this repo produces is
      // now an explicit case above, so this arm sees only the live ones and words
      // nobody writes: `one-run-status-vocabulary.test.ts` holds that line.
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
  /**
   * Finished runs that were a SECOND or later attempt at the same work.
   *
   * MEANINGLESS WITHOUT `runsWithKnownAttempt` BESIDE IT. Zero here with a zero
   * denominator means nobody counted; zero with a denominator of 300 means 300
   * pieces of work each succeeded or failed on the first go. A surface that
   * renders this number alone has reproduced the exact defect the hardcoded
   * `retriesNotMeasured` flag was invented to prevent.
   */
  retries: number;
  /** Finished runs carrying a countable attempt ordinal — the denominator for
   *  `retries`, and the honest statement of how much of the traffic any retry
   *  claim actually covers. */
  runsWithKnownAttempt: number;
  /**
   * Total times work on these runs had to be picked back up mid-flight.
   *
   * NOT retries. See the module header. A resume is the sweeper rescuing a run
   * whose worker died, or a run continuing past an approval it was waiting on.
   */
  resumes: number;
  /** Finished runs carrying a resume count kept from the row's creation — the
   *  denominator for `resumes`. A run instrumented at birth and never resumed
   *  contributes 0 here and still counts toward this total, which is what makes
   *  a zero above readable as "never resumed" rather than "never counted". */
  runsWithKnownResumeCount: number;
};

export type RunAnalytics = {
  byStation: StationStats[];
  overall: StationStats;
  /**
   * TRUE when nothing in this window can answer "how often does an agent retry".
   *
   * COMPUTED NOW, NOT ASSERTED. It was a hardcoded `true` while `agent_runs`
   * carried no attempt column at all; it is now `overall.runsWithKnownAttempt
   * === 0`, so it goes false the moment a dispatcher that counts attempts
   * contributes a run and true again for a window containing none. The contract
   * a surface depends on is unchanged: while this is true, show "not measured"
   * — a drawn zero reads as "retries do not happen".
   *
   * It will stay true for every run written before
   * 20260810200000_a_rerun_was_indistinguishable_from_a_first_attempt.sql
   * applies, which is all 1,232 rows live on 2026-08-10.
   */
  retriesNotMeasured: boolean;
  /**
   * TRUE when no run in this window carried a resume count kept from birth.
   *
   * Same guard, same reason, for the signal that a resume is: 0 resumes over 0
   * counted runs is not "the sweeper never had to rescue anything".
   */
  resumesNotMeasured: boolean;
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
    retries: 0,
    runsWithKnownAttempt: 0,
    resumes: 0,
    runsWithKnownResumeCount: 0,
  };
}

/**
 * A countable attempt ordinal, or null.
 *
 * Attempts are 1-BASED, so 0 and anything negative are not measurements — they
 * are a column that was written by something that did not know what it was
 * writing. Refused for the same reason `duration_ms: 0` is refused below: an
 * out-of-range value silently admitted is how a placeholder becomes a statistic.
 */
function readAttempt(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) return null;
  return value;
}

/**
 * A countable resume count, or null.
 *
 * ZERO IS VALID HERE, and this is the one place in this module where that is
 * true. `duration_ms: 0` means "not measured" because a hardcoded zero was the
 * original defect; `resume_count: 0` means "created instrumented, never
 * resumed", which is a real and common answer. A future reader pattern-matching
 * the duration rule onto this one would throw away every never-resumed run and
 * make resumption look universal.
 */
function readResumeCount(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return value;
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

    // INSTRUMENT: retries and resumes. Both are counted only where the row
    // carries a real number, and both publish their denominator, so a zero on a
    // surface can always be traced to "none happened" or "none were counted"
    // without the reader having to know which paths write which column.
    const attempt = readAttempt(r.attempt);
    if (attempt !== null) {
      stats.runsWithKnownAttempt += 1;
      overall.runsWithKnownAttempt += 1;
      if (attempt > 1) {
        stats.retries += 1;
        overall.retries += 1;
      }
    }
    const resumeCount = readResumeCount(r.resume_count);
    if (resumeCount !== null) {
      stats.runsWithKnownResumeCount += 1;
      overall.runsWithKnownResumeCount += 1;
      stats.resumes += resumeCount;
      overall.resumes += resumeCount;
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
    // Derived from the denominator, never from `retries === 0`. Those two are
    // different sentences and only one of them is about measurement.
    retriesNotMeasured: overall.runsWithKnownAttempt === 0,
    resumesNotMeasured: overall.runsWithKnownResumeCount === 0,
  };
}
