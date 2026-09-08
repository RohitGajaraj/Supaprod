/**
 * SANDBOX (Build / execution spine) — the `ExecProvider` seam.
 *
 * One swappable abstraction for "where a build's checks run, and whether the
 * result clears it to merge / preview". Today there is no Supaprod execution
 * sandbox (see `ai/studio-ci.ts`): checks run in the connected repo's GitHub
 * Actions CI, which is the $0 native floor and is ALWAYS available. A paid
 * microVM backend — Cloudflare Sandbox SDK first, with E2B / Vercel one swap
 * away for untrusted code — plugs in behind this same interface once the founder
 * confirms the compute spend (sourcing-map founder call #4). Until then the
 * floor holds and the paid backends are reserved ids that resolve back to the
 * floor, so a misconfiguration can never strand a build with no way to run.
 *
 * The floor reuses `studio-ci.ts`, so an `ExecProvider` verdict and the
 * `studio.pr.merge` gate can never disagree on what "green" means.
 *
 * Doctrine: this is the un-gated prep the sourcing-map authorizes — scaffold the
 * seam + ship the $0 floor; do NOT provision a paid account, add a secret, or
 * turn on metered compute (those are founder-only).
 */
import {
  overallFromChecks,
  mergeReadinessFromCi,
  type CiCheckLite,
  type CiOverall,
} from "@/lib/ai/studio-ci";

// Re-exported so callers building an ExecVerdict have one import surface for the
// seam and the check shape it consumes.
export type { CiCheckLite, CiOverall } from "@/lib/ai/studio-ci";

/** Every execution backend we know about. Only `github-actions` is wired today. */
export type ExecProviderId = "github-actions" | "cloudflare-sandbox" | "e2b" | "vercel";

/** A backend's verdict on one build's checks. */
export interface ExecVerdict {
  provider: ExecProviderId;
  overall: CiOverall;
  /** True when the checks clear this build to merge / preview. */
  mayProceed: boolean;
  reason: string;
}

// ── The RUN contract (SBX-1) ───────────────────────────────────────────────────
//
// Everything above this line judges checks that ALREADY RAN somewhere else. The
// types below let a backend run them itself, which is the whole point of adding a
// sandbox: today an agent can read a verdict and cannot produce one, so every check
// costs a push and a CI wait and the agent cannot iterate at all.
//
// These are pure types plus two pure mappers. The network adapter is server-only
// (`e2b.server.ts`), because this file is imported by a CLIENT component
// (`components/studio/PreviewPanel.tsx`) and an SDK import here would break the
// build. Same split the `delegate/` seam uses.

/** One check to run, named so a failure can be reported as "typecheck", not "step 2". */
export interface ExecCommandSpec {
  name: string;
  run: string;
  /**
   * Environment for THIS command only, merged over the run-wide `envs`.
   *
   * This exists for exactly one reason and it is a security one: a credential must
   * be scoped to the single command that needs it. The sandbox runs UNTRUSTED code
   * (a repo's postinstall scripts, its test files), so anything present in the
   * environment of `bun install` or `bun test` is readable by an attacker who
   * controls the repo. Put a token here, on the clone step, never in the run-wide
   * `envs` and never interpolated into `run`.
   */
  envs?: Record<string, string>;
}

export interface ExecCommandResult {
  name: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  /** True when the command never produced an exit code (killed by the wall clock). */
  timedOut?: boolean;
}

export interface ExecRunSpec {
  /** Commands whose exit codes decide the verdict. Order is preserved. */
  commands: ExecCommandSpec[];
  /**
   * Commands run BEFORE the checks (clone, install, toolchain). A non-zero exit
   * here aborts the run as an infrastructure failure rather than a red check: a
   * checkout that failed tells you nothing about the code.
   */
  setup?: ExecCommandSpec[];
  /** Hard ceiling for the whole run. The sandbox is killed when it elapses. */
  timeoutMs?: number;
  /**
   * Environment for EVERY command, including the ones running untrusted repo code.
   * Never put a credential here; use {@link ExecCommandSpec.envs} on the one step
   * that needs it.
   */
  envs?: Record<string, string>;
  /**
   * Literal secret values to redact from every captured stream and from any error
   * this run reports. Belt to the braces: even when a token is never placed in a
   * command string, `git` will happily echo a remote URL into stderr on failure,
   * and that stderr flows to the model, into the run record, and back into a prompt.
   */
  secrets?: string[];
}

export interface ExecRunOutcome {
  provider: ExecProviderId;
  results: ExecCommandResult[];
  /** Non-null when the SANDBOX failed, as opposed to the code failing. */
  infraError: string | null;
  verdict: ExecVerdict;
}

/**
 * PURE: map command results onto the check shape the merge gate already reads, so a
 * sandbox verdict and a `studio.pr.merge` verdict cannot mean different things by
 * "green". A non-zero exit is a `failure` conclusion; a timeout is `timed_out`,
 * which `overallFromChecks` already treats as failing.
 */
export function checksFromResults(results: ExecCommandResult[]): CiCheckLite[] {
  return results.map((r) => ({
    status: "completed",
    conclusion: r.timedOut ? "timed_out" : r.exitCode === 0 ? "success" : "failure",
  }));
}

/**
 * PURE: the verdict for one sandbox run.
 *
 * THE TRAP THIS EXISTS TO AVOID, and it is a false GREEN, which is the worst kind.
 * `overallFromChecks([])` returns "neutral" and `mergeReadinessFromCi("neutral")`
 * ALLOWS the merge, because an empty check list legitimately means "this repo has no
 * CI configured, so there is nothing to gate on". That reading is correct for the
 * GitHub Actions floor and catastrophic here: a sandbox that failed to boot, or a
 * clone that never ran, also produces zero results, and it would read as permission
 * to merge unreviewed code.
 *
 * So an infrastructure failure, and an empty result set, are both mapped to an
 * explicit failing check. A sandbox that could not run must never be mistaken for a
 * repo that had nothing to run.
 */
export function execVerdictFromRun(
  provider: ExecProviderId,
  results: ExecCommandResult[],
  infraError: string | null,
): ExecVerdict {
  if (infraError) {
    return {
      provider,
      overall: "failure",
      mayProceed: false,
      reason: `The checks could not be run: ${infraError}. Nothing was verified, so this is not clear to merge.`,
    };
  }
  if (results.length === 0) {
    return {
      provider,
      overall: "failure",
      mayProceed: false,
      reason: "No checks ran, so nothing was verified. Add at least one check before merging.",
    };
  }
  const checks = checksFromResults(results);
  const overall = overallFromChecks(checks);
  const { allowed, reason } = mergeReadinessFromCi(overall);
  const failed = results.filter((r) => r.timedOut || r.exitCode !== 0).map((r) => r.name);
  return {
    provider,
    overall,
    mayProceed: allowed,
    reason: failed.length ? `${reason} Failing: ${failed.join(", ")}.` : reason,
  };
}

export interface ExecProvider {
  readonly id: ExecProviderId;
  /**
   * Human-facing name for this backend — engine-room doctrine: name the place a
   * build's checks ran, never leak the raw mechanism id to the surface. A future
   * paid backend brings its own label, so provenance is owned with the provider.
   */
  readonly label: string;
  /** Whether this backend is wired AND permitted to run right now. */
  readonly available: boolean;
  /**
   * Whether this backend can serve a LIVE preview of a full build. A microVM
   * backend (Cloudflare Sandbox SDK) can; the GitHub Actions check floor cannot
   * — it only runs checks. The Build "Preview" pane reads this to choose between
   * the $0 self-contained sandboxed iframe (today) and a live preview (when a
   * sandbox backend is wired).
   */
  readonly previewsBuilds: boolean;
  /**
   * Whether this backend can RUN checks itself, rather than only judging results
   * something else produced. False for the GitHub Actions floor, which reads a
   * verdict after a push. The executor is server-only, so this flag is how a client
   * surface asks the question without importing it.
   */
  readonly executes: boolean;
  /** Derive a merge / preview verdict from this backend's check results. */
  verdictFromChecks(checks: CiCheckLite[]): ExecVerdict;
}

/**
 * The $0 native floor: the connected repo's GitHub Actions CI. Always available,
 * never metered. Delegates the "what is green" decision to `studio-ci.ts` so the
 * two readers cannot drift.
 */
export const githubActionsProvider: ExecProvider = {
  id: "github-actions",
  label: "GitHub Actions",
  available: true,
  // The check floor runs CI; it does not serve a live build preview.
  previewsBuilds: false,
  // It reads results after a push. It cannot run anything on request.
  executes: false,
  verdictFromChecks(checks: CiCheckLite[]): ExecVerdict {
    const overall = overallFromChecks(checks);
    const { allowed, reason } = mergeReadinessFromCi(overall);
    return { provider: "github-actions", overall, mayProceed: allowed, reason };
  },
};

/**
 * Paid microVM backends reserved behind the seam but not yet wired (founder
 * spend gate, sourcing-map call #4). Named here so the resolver and the docs
 * stay the single source of "what can plug in", with nobody hard-coding a
 * provider id elsewhere.
 */
export const RESERVED_PROVIDER_IDS: readonly ExecProviderId[] = [
  "cloudflare-sandbox",
  "e2b",
  "vercel",
];

/** Registry of the backends that are actually wired + selectable today. */
const WIRED_PROVIDERS: readonly ExecProvider[] = [githubActionsProvider];

/**
 * Resolve the active `ExecProvider`. The GitHub Actions $0 floor is the default
 * and currently the only wired, available backend; a `preferred` id that has no
 * live adapter (e.g. a reserved paid backend selected via an `EXEC_PROVIDER`
 * value before its adapter ships) falls back to the floor rather than failing.
 * When a paid adapter lands it is added to {@link WIRED_PROVIDERS} with its
 * `available` gated on the founder's spend confirmation, and this resolver picks
 * it up with no call-site change.
 */
export function resolveExecProvider(preferred?: string | null): ExecProvider {
  const match = preferred
    ? WIRED_PROVIDERS.find((p) => p.id === preferred && p.available)
    : undefined;
  return match ?? githubActionsProvider;
}
