// BUILD verification: the dependency vulnerability audit, pure half.
//
// THE HONEST SHAPE OF THIS ONE. "Audit dependencies" usually means running
// `npm audit` / `bun audit`, and there is nowhere here to run it: the only
// wired ExecProvider is the GitHub Actions floor (`src/lib/exec/provider.ts`),
// which runs in the customer's repo after a push, not on demand before one. So
// rather than fake a runner, this reads the audit GitHub has ALREADY performed:
// Dependabot alerts, which GitHub computes for every repo from the committed
// manifests and lockfiles against the GitHub Advisory Database, and exposes over
// the ordinary REST API. That is a real read of real data through the same
// credential chain every other Build tool uses, and it needs no sandbox.
//
// It also means the audit can be UNAVAILABLE for honest reasons (the repo has
// Dependabot alerts switched off, or the installed token lacks the
// `security_events` scope), and an unavailable audit must never be reported as
// a clean one. `DepsAuditReport.available` is the three-state honesty layer:
// "clean", "found these", and "could not look" are three different facts.
//
// THE GATE IS SCOPED TO THE CHANGESET, deliberately. A repo carrying twelve
// pre-existing advisories would otherwise block every build forever, for
// something this changeset did not do and its agent cannot fix inside a work
// order. So pre-existing alerts are reported as advisory context, and only a
// changeset that ITSELF touches a dependency manifest is gated on them.
//
// Pure, client-safe, no I/O. The server half lives in the registry tool.

export type DepSeverity = "critical" | "high" | "medium" | "low" | "unknown";

/** Ordered so a numeric compare answers "is this at least as bad as X". */
export const DEP_SEVERITY_RANK: Record<DepSeverity, number> = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export interface DepAlert {
  package: string;
  ecosystem: string;
  severity: DepSeverity;
  summary: string;
  /** The manifest the vulnerable dependency is declared in, e.g. "package.json". */
  manifest: string | null;
  /** The first version that carries the fix, when the advisory names one. */
  patched_version: string | null;
  /** The advisory identifier (GHSA / CVE), for a human to look up. */
  advisory_id: string | null;
}

/**
 * Dependency manifests a change to which means this changeset is altering the
 * dependency graph. Lockfiles are listed because a changeset can never contain
 * one (they are in STUDIO_FORBIDDEN_PREFIXES), which is itself worth reporting.
 */
const MANIFEST_NAMES = new Set([
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "Gemfile",
  "go.mod",
  "Cargo.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "composer.json",
]);

/** True when a path is a dependency manifest, at the root or in a workspace. */
export function isDependencyManifest(path: string): boolean {
  const base = path.slice(path.lastIndexOf("/") + 1);
  return MANIFEST_NAMES.has(base);
}

/**
 * Normalise one GitHub Dependabot alert into the shape this reports.
 *
 * Returns null for anything that is not a usable alert object, so a shape change
 * upstream degrades to "we saw fewer alerts" rather than throwing the whole
 * audit away. Totally defined: never throws on malformed input.
 */
export function normalizeDependabotAlert(raw: unknown): DepAlert | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const alert = raw as Record<string, unknown>;
  const advisory = (alert.security_advisory ?? {}) as Record<string, unknown>;
  const vuln = (alert.security_vulnerability ?? {}) as Record<string, unknown>;
  const pkg = (vuln.package ?? {}) as Record<string, unknown>;
  const dep = (alert.dependency ?? {}) as Record<string, unknown>;
  const firstPatched = (vuln.first_patched_version ?? null) as Record<string, unknown> | null;

  const name = typeof pkg.name === "string" ? pkg.name : null;
  if (!name) return null;

  return {
    package: name,
    ecosystem: typeof pkg.ecosystem === "string" ? pkg.ecosystem : "unknown",
    severity: normalizeSeverity(vuln.severity ?? advisory.severity),
    summary: typeof advisory.summary === "string" ? advisory.summary.slice(0, 240) : "",
    manifest: typeof dep.manifest_path === "string" ? dep.manifest_path : null,
    patched_version:
      firstPatched && typeof firstPatched.identifier === "string" ? firstPatched.identifier : null,
    advisory_id: typeof advisory.ghsa_id === "string" ? advisory.ghsa_id : null,
  };
}

function normalizeSeverity(raw: unknown): DepSeverity {
  const s = typeof raw === "string" ? raw.toLowerCase() : "";
  if (s === "critical" || s === "high" || s === "medium" || s === "low") return s;
  // GitHub uses "moderate" where the CVSS bands say "medium".
  if (s === "moderate") return "medium";
  return "unknown";
}

export interface DepAuditSummary {
  total: number;
  by_severity: Record<DepSeverity, number>;
  /** The worst severity present, or null when there are no alerts. */
  worst: DepSeverity | null;
}

export function summarizeDepAlerts(alerts: readonly DepAlert[]): DepAuditSummary {
  const by: Record<DepSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unknown: 0,
  };
  let worst: DepSeverity | null = null;
  for (const a of alerts ?? []) {
    by[a.severity]++;
    if (worst === null || DEP_SEVERITY_RANK[a.severity] > DEP_SEVERITY_RANK[worst]) {
      worst = a.severity;
    }
  }
  return { total: (alerts ?? []).length, by_severity: by, worst };
}

export interface DepAuditGate {
  /** True when this changeset is clear to open a pull request on dependency grounds. */
  mayProceed: boolean;
  reason: string;
}

/**
 * The gate. Only a changeset that itself edits a dependency manifest is held to
 * the alert list; otherwise the alerts are pre-existing repo state, reported but
 * never a blocker for a work order that did not cause them.
 *
 * An UNAVAILABLE audit never blocks either. Blocking on "we could not look"
 * would stop every build in every repo that has Dependabot switched off, which
 * is a policy decision belonging to a human, not a failure of this changeset.
 * The reason says so plainly instead of implying a clean result.
 */
export function depsAuditGate(input: {
  available: boolean;
  unavailableReason?: string | null;
  summary: DepAuditSummary;
  touchesManifest: boolean;
}): DepAuditGate {
  if (!input.available) {
    return {
      mayProceed: true,
      reason: `No dependency audit was available for this repo${input.unavailableReason ? ` (${input.unavailableReason})` : ""}, so nothing was checked. This is not a clean result.`,
    };
  }
  if (input.summary.total === 0) {
    return { mayProceed: true, reason: "GitHub reports no open dependency advisories." };
  }
  if (!input.touchesManifest) {
    return {
      mayProceed: true,
      reason: `${input.summary.total} open dependency advisory(ies) exist on this repo, none of them caused by this changeset (it edits no dependency manifest). Reported, not blocking.`,
    };
  }
  const serious = input.summary.by_severity.critical + input.summary.by_severity.high;
  if (serious > 0) {
    return {
      mayProceed: false,
      reason: `This changeset edits a dependency manifest and the repo has ${serious} critical/high dependency advisory(ies) open. Move to a patched version or drop the dependency before opening the pull request.`,
    };
  }
  return {
    mayProceed: true,
    reason: `This changeset edits a dependency manifest; ${input.summary.total} open advisory(ies) exist, none critical or high.`,
  };
}

/**
 * The lockfile note. Build is forbidden from staging a lockfile
 * (STUDIO_FORBIDDEN_PREFIXES covers bun.lock, package-lock.json, yarn.lock and
 * pnpm-lock.yaml), which is the right boundary and has a consequence worth
 * stating: a changeset that adds or bumps a dependency in package.json ships a
 * manifest its lockfile does not agree with, and a frozen-lockfile CI install
 * will fail on it. Returns "" when no manifest is touched.
 */
export function lockfileDivergenceNote(touchedPaths: readonly string[]): string {
  const manifests = (touchedPaths ?? []).filter(isDependencyManifest);
  if (manifests.length === 0) return "";
  return (
    `This changeset edits ${manifests.join(", ")}, and Build is not allowed to stage a lockfile. ` +
    `The lockfile on the branch will not match the manifest, so a frozen-lockfile CI install can fail. ` +
    `Say so in the pull request body so a human runs the install and commits the lockfile.`
  );
}
