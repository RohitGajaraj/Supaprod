/**
 * P-38 (A-QUEUE.md). Every tick's original 2026-06/07 migration hardcodes the
 * preview host (`project--<id>.lovable.app`); the live `cron.job` table reads
 * `supaprod.ai` only because a later, DYNAMIC rebuild migration
 * (`20260806031833`) rewrote whatever existed at apply time. Nothing before
 * this packet's own migration DEFINES a job by name against the right host,
 * so a migration written today that touches one tick job has nowhere correct
 * to copy the `cron.schedule(...)` call from.
 *
 * This guard reads the migration text (no database, no credentials -- it has
 * to run in CI) and asserts every job it defines targets `supaprod.ai`, never
 * the preview host, and carries an explicit `timeout_milliseconds`. The
 * live-versus-migration text comparison itself (`cron.job` on production
 * equals this file's own commands) is a human/A1 check against a live
 * database, which this file cannot perform and does not claim to.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION = join(
  import.meta.dir,
  "..",
  "..",
  "supabase",
  "migrations",
  "20260909050000_the_cron_jobs_are_defined_where_a_replay_would_find_them.sql",
);

const EXPECTED_JOBS = [
  "admin-expiry-tick",
  "approvals-tick",
  "assumption-watch-tick",
  "cadence-drift-tick",
  "cadence-eval-suite-tick",
  "cadence-eval-tick",
  "cadence-indexer-tick",
  "calibrate-tick",
  "ci-poll-tick",
  "cluster-tick",
  "competitor-tick",
  "credit-tick",
  "delegate-poll-tick",
  "derive-tick",
  "digest-tick",
  "embed-tick",
  "event-reactor-tick",
  "fanout-reconcile-tick",
  "goal-tick",
  "house-rules-tick",
  "liveness-tick",
  "loop-tick",
  "memory-tick-daily",
  "outcome-tick",
  "prompt-optimize-tick",
  "reap-stuck-job-runs",
  "researcher-tick",
  "resume-runs",
  "retention-tick",
  "retro-tick",
  "scout-tick",
  "self-improve-tick",
  "sense-tick",
  "steward-tick",
  "track-tick",
  "trigger-tick",
  "uptime-tick",
];

/** Strips `-- ...` line comments so a comment EXPLAINING the ban does not
 *  itself trip the guard checking for it. */
function code(sql: string): string {
  return sql.replace(/--.*$/gm, "");
}

describe("the cron migration's host matches the deployed one", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("defines every live tick job by name", () => {
    for (const job of EXPECTED_JOBS) {
      expect(sql).toContain(`'${job}'`);
    }
  });

  it("never schedules a job against the preview host", () => {
    // The migration's own after-the-fact guard legitimately SEARCHES for
    // "lovable.app" (LIKE '%lovable.app%') to prove none remain -- that is
    // the one allowed occurrence. Any other mention would be an actual
    // scheduling target, which is the real thing this test bans.
    const withoutTheGuardSearch = code(sql).replace(/LIKE '%lovable\.app%'/g, "");
    expect(withoutTheGuardSearch).not.toContain("lovable.app");
  });

  it("builds every http job's URL from the production host, via one shared template", () => {
    // The 36 http jobs share one format() call inside a VALUES-driven loop
    // (DRY, not 36 repeated literals) -- so the production host is checked
    // once, in the template every row is built from.
    expect(sql).toContain("'https://supaprod.ai/api/public/hooks/' || j.hook");
  });

  it("carries an explicit timeout value for every http job's own row", () => {
    // Each VALUES row ends in its own timeout_ms; count the rows that carry
    // one (the 36 http jobs, not reap-stuck-job-runs, which has no such
    // column at all).
    const matches = sql.match(/,\s*\d{4,6}\)\s*,?\s*$/gm) ?? [];
    expect(matches.length).toBe(EXPECTED_JOBS.length - 1);
  });

  it("carries the guard that fails loudly on a bad apply, not silently", () => {
    expect(sql).toContain("RAISE EXCEPTION");
    expect(sql).toContain("still call the preview host");
  });
});
