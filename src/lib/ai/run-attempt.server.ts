/**
 * INSTRUMENT: the two things a run row could never say about itself — which
 * ATTEMPT at the work it is, and how many times a worker had to pick it back up.
 *
 * WHY THIS MODULE EXISTS AT ALL, RATHER THAN THREE COPIES OF THE SAME GUARD.
 * `agent_runs.attempt` and `agent_runs.resume_count` are added by
 * `20260810200000_a_rerun_was_indistinguishable_from_a_first_attempt.sql`, which
 * is NOT applied yet. PostgREST does not ignore an unknown column: naming one in
 * a `select` or an `insert` fails the whole statement (42703). Three code paths
 * write runs and one reads them, and every one of them treats its own failure as
 * fatal — `runAgentLoop` throws on an insert error by design, `enqueueHandoff`
 * throws on its child-run insert, and the analytics read returns an empty rollup.
 * So an ungated reference to either column would not degrade; it would stop
 * dispatch entirely until the migration landed. Every touch goes through the
 * probe below.
 *
 * The probe mirrors `hasRetryColumns` in mission-advance.server.ts, which exists
 * for exactly this reason on `mission_steps`, down to its cache discipline: a
 * MISSING column is cached (it will not appear mid-isolate), a transient error is
 * NOT (one network blip must not disable instrumentation for the isolate's life).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Does this Postgres error mean "that column is not there"?
 *
 * Pure and exported so the classification is testable without a database. Code
 * `42703` is `undefined_column` and is the reliable signal; the message match is
 * a fallback for gateways that drop the code, and it is deliberately narrow — a
 * broad match would swallow a permissions or constraint error and silently
 * conclude "no columns", turning a real fault into permanent silence.
 */
export function isMissingColumnError(
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  return /column .* does not exist|could not find the '(attempt|resume_count)' column/i.test(
    error.message ?? "",
  );
}

// Per-isolate memo of whether the migration has applied. Null = not yet asked.
let columnsPresent: boolean | null = null;

/** Test seam: forget what the probe learned. Never called by product code. */
export function resetRunColumnProbe(): void {
  columnsPresent = null;
}

/**
 * True when `agent_runs` carries the instrumentation columns.
 *
 * Fails CLOSED (returns false) on anything it cannot interpret, including a
 * thrown client error. False costs a NULL where a number could have been, and a
 * NULL reads as "not measured", which is the honest answer when we could not
 * establish that the column exists. True on a bad guess would take dispatch down.
 */
export async function runAttemptColumnsPresent(supabase: SupabaseClient): Promise<boolean> {
  if (columnsPresent !== null) return columnsPresent;
  try {
    const { error } = await supabase.from("agent_runs").select("attempt,resume_count").limit(1);
    if (!error) {
      columnsPresent = true;
      return true;
    }
    // Cache only a definite absence. A transient failure degrades this ONE call
    // and leaves the next one free to re-ask.
    if (isMissingColumnError(error)) columnsPresent = false;
    return false;
  } catch {
    return false;
  }
}

/**
 * Was this pickup a RESUMPTION of work already begun, or the FIRST start of a
 * run that had only ever been queued?
 *
 * The distinction is the whole point of the counter. `resumeAgentLoop` is the
 * entry point for both: the sweeper calls it to rescue a run whose worker was
 * evicted mid-step, AND to start a queued child run for the very first time.
 * Measured on production 2026-08-10: 99 of 99 handoff messages had been consumed,
 * meaning every orchestrated child run reached the loop through this path. If a
 * first start counted, every one of those runs would report a resume it never
 * had, and "how often does work have to be picked up again" would read as ~100%.
 *
 * Evidence that work had begun, either of which is sufficient:
 *   - status 'running' — only a run that started carries it, so a resumer seeing
 *     it is taking over from a worker that stopped without finishing.
 *   - a checkpoint exists — steps were completed and persisted.
 *
 * A 'waiting_approval' run with no checkpoint is NOT counted: it paused at a
 * human gate before writing anything, and a human's think time is not friction
 * the loop should report as a retry-shaped signal.
 */
export function countsAsResumption(input: { status: string; hasCheckpoint: boolean }): boolean {
  return input.status === "running" || input.hasCheckpoint;
}

/**
 * The next value for `resume_count`, or null to leave the column alone.
 *
 * NULL IN, NULL OUT, and that is the load-bearing rule. A row whose count is
 * null was created by a path that does not initialise it (or predates the
 * migration entirely — all 1,232 rows live on 2026-08-10 do). Writing 1 onto it
 * would publish a complete-looking count that is really a lower bound of unknown
 * depth: that run may have been resumed five times before anyone was counting.
 * Every non-null value this function can produce is a count kept from the row's
 * birth, so a reader never has to ask which kind it is holding.
 *
 * This is the same discipline `run-analytics.ts` applies to `duration_ms`, where
 * a hardcoded 0 sat unnoticed across 441 of 471 runs and dragged every median.
 */
export function nextResumeCount(current: number | null | undefined): number | null {
  if (typeof current !== "number" || !Number.isFinite(current) || current < 0) return null;
  return current + 1;
}
