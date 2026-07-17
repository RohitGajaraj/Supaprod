/**
 * App-level health (APP-HEALTH, considerations.md SRE lens P0).
 *
 * The platform's own liveness/readiness signal for external uptime monitors and load
 * balancers - distinct from `health.functions.ts`, which checks migration DRIFT for the app's
 * own flows. This module is the PURE assembly: given the dependency-check results it returns the
 * response body + the right HTTP status (200 healthy / 503 degraded), so a monitor reacts on the
 * status code without parsing the body. Pure (the timestamp is injected), so it is fully
 * unit-tested in app-health.test.ts; the live DB probe lives in the route.
 *
 * Deliberately leaks NOTHING: only `ok`/`error` per-check states, never an error message,
 * connection string, or stack trace (the endpoint is public + unauthenticated).
 */

export type CheckState = "ok" | "error";

export type HealthChecks = {
  /** Whether the database answered a cheap probe. */
  database: CheckState;
  /** Whether the cron pulse job has ticked recently (SW-6 failure floor). */
  crons: CheckState;
};

export type HealthBody = {
  status: "ok" | "degraded";
  service: "supaprod";
  /** ISO timestamp, injected by the caller so this stays pure. */
  time: string;
  /**
   * SW-6 build stamp: the deployment/version id when the runtime exposes one
   * (CF_VERSION_METADATA_ID), else null. Makes "the published URL serves the
   * current build" a one-request check. Safe to expose: the platform already
   * sends the deployment id on every response as the x-deployment-id header.
   */
  release: string | null;
  checks: {
    /** Implicitly ok: if this code ran, the worker is alive and serving. */
    worker: "ok";
    database: CheckState;
    crons: CheckState;
  };
};

/**
 * SW-6: the cron heartbeat policy, pure so it is unit-testable. The pulse job
 * (`cron.resume-runs`) ticks every minute in production; if its latest
 * `job_runs` row is older than the threshold (or missing entirely, the
 * "crons were never registered" incident class), the scheduler is dead even
 * though the worker still serves traffic. 10 minutes = 10 missed ticks,
 * comfortably past scheduling jitter.
 */
export const CRON_PULSE_JOB = "cron.resume-runs";
export const CRON_STALE_AFTER_MS = 10 * 60_000;

export function evaluateCronPulse(
  latestRunIso: string | null,
  nowMs: number,
  staleAfterMs: number = CRON_STALE_AFTER_MS,
): CheckState {
  if (!latestRunIso) return "error";
  const latest = Date.parse(latestRunIso);
  if (Number.isNaN(latest)) return "error";
  return nowMs - latest > staleAfterMs ? "error" : "ok";
}

/**
 * Assemble the health response. Overall status is `degraded` (HTTP 503) if ANY dependency check
 * is not `ok`, else `ok` (HTTP 200). Worker liveness is implicit - reaching this code means the
 * worker is serving. Pure + deterministic.
 */
export function assembleHealth(
  checks: HealthChecks,
  nowIso: string,
  release: string | null = null,
): { body: HealthBody; httpStatus: number } {
  const degraded = checks.database !== "ok" || checks.crons !== "ok";
  return {
    body: {
      status: degraded ? "degraded" : "ok",
      service: "supaprod",
      time: nowIso,
      release,
      checks: { worker: "ok", database: checks.database, crons: checks.crons },
    },
    httpStatus: degraded ? 503 : 200,
  };
}
