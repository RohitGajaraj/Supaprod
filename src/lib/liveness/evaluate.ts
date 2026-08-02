/**
 * Feature liveness: the classifier.
 *
 * WHY THIS FILE EXISTS. In one session on 2026-08-02 five separately shipped
 * features were found to be doing nothing in production. Every one of them
 * passed typecheck, passed tests, and had a plausible commit message. Nothing in
 * the product could tell the difference between a feature that runs and a
 * feature that has never executed once. Health told us the machine was ticking.
 * It could not tell us the machine was ticking over nothing.
 *
 * This file holds the part that must not lie, so it is pure. It takes an
 * observation (a count, a last-seen timestamp, and whether the read itself
 * worked) and returns a verdict. It touches no database, no clock, and no
 * network: `now` is passed in. That is what makes it testable, and this is the
 * one piece of the system whose correctness cannot be checked by looking at a
 * screen, because a screen showing "healthy" is exactly what a wrong answer
 * looks like.
 *
 * THREE VERDICTS AND ONE REFUSAL.
 *   healthy  ran inside its own window
 *   quiet    has not run lately, and that may be fine
 *   dead     never ran at all, or has not run in several of its own cadences
 *   unknown  the read failed, so we do not know
 *
 * `unknown` is not a fourth state for tidiness. A failed read that renders as
 * healthy is the same class of bug this whole system exists to catch, so a probe
 * that could not complete says so and never borrows another verdict's clothes.
 */

/** How often a capability is expected to execute when it is working. */
export type Cadence = "continuous" | "daily" | "weekly" | "on_demand";

export type LivenessVerdict = "healthy" | "quiet" | "dead" | "unknown";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * The expected gap between two executions, per cadence.
 *
 * `continuous` is deliberately one hour rather than one minute. The tightest
 * real cadence in the product is a minutely cron, but a capability is not the
 * cron: a minutely tick that finds nothing to do writes nothing, and calling
 * that dead would make the loudest signal in the system the one nobody trusts.
 * One hour is the coarsest gap at which continuous still means continuous.
 */
const CADENCE_INTERVAL_MS: Record<Cadence, number | null> = {
  continuous: 1 * HOUR,
  daily: 1 * DAY,
  weekly: 7 * DAY,
  // On demand means a human or an agent decides when. There is no schedule to
  // miss, so age alone can never make it dead. Never having executed still can.
  on_demand: null,
};

/**
 * How many of its own cadences a capability may miss before each verdict.
 *
 * Loose on purpose, the same reasoning as the cron watchdog's staleness budget:
 * a verdict here should be a real finding, not scheduler jitter. Three missed
 * cycles is worth a look. Seven is a feature that stopped.
 */
const QUIET_AFTER_CADENCES = 3;
const DEAD_AFTER_CADENCES = 7;

/** What a probe found. Produced by the runner, consumed only by this file. */
export type CapabilityObservation = {
  /** Executions counted inside the report window. */
  countInWindow: number;
  /** The most recent execution ever seen, or null when there has never been one. */
  lastAt: string | null;
  /** True when the read itself failed. Forces `unknown`. */
  probeFailed?: boolean;
  /** Why the read failed, carried through so the surface can say it. */
  probeError?: string | null;
};

/** The per-capability knobs the classifier reads. Supplied by the registry. */
export type CapabilityExpectation = {
  cadence: Cadence;
  /**
   * Override the cadence interval for a capability whose real rhythm does not
   * fit one of the four words. Milliseconds between two expected executions.
   */
  expectedIntervalMs?: number;
  /**
   * The lowest execution count inside the window that still counts as normal.
   * A capability can be recent and still abnormal: one row in a window that
   * should hold hundreds is a feature that is mostly failing, not a healthy one.
   * Falling below this caps the verdict at `quiet`; it never produces `dead`,
   * because a low count is a suspicion and an absent one is a fact.
   */
  minExpectedInWindow?: number;
};

export type LivenessAssessment = {
  verdict: LivenessVerdict;
  /** Milliseconds since the last execution, null when it has never executed. */
  ageMs: number | null;
  /** The gap at which this capability starts reading as quiet, null for on demand. */
  quietAfterMs: number | null;
  /** The gap at which this capability reads as dead, null for on demand. */
  deadAfterMs: number | null;
  /** True when nothing has ever executed. The founder's five cases all had this. */
  neverExecuted: boolean;
  /** One plain sentence naming the finding. Rendered as is. */
  reason: string;
};

/**
 * Classify one capability. Pure: same inputs, same answer, forever.
 *
 * `now` is a parameter and not `Date.now()` so a test can stand a year away from
 * a timestamp without waiting a year.
 */
export function assessCapability(
  observation: CapabilityObservation,
  expectation: CapabilityExpectation,
  now: number,
): LivenessAssessment {
  const intervalMs =
    expectation.expectedIntervalMs ?? CADENCE_INTERVAL_MS[expectation.cadence] ?? null;
  const quietAfterMs = intervalMs === null ? null : intervalMs * QUIET_AFTER_CADENCES;
  const deadAfterMs = intervalMs === null ? null : intervalMs * DEAD_AFTER_CADENCES;

  if (observation.probeFailed) {
    return {
      verdict: "unknown",
      ageMs: null,
      quietAfterMs,
      deadAfterMs,
      neverExecuted: false,
      reason: observation.probeError
        ? `The check could not run: ${observation.probeError}`
        : "The check could not run, so nothing here can be read as clear.",
    };
  }

  const lastMs = parseTimestamp(observation.lastAt);

  // Never executed. This is the shape all five of the 2026-08-02 findings had,
  // and it is the one verdict that does not depend on a cadence at all: a
  // feature that has never run once is dead whether it was meant to run hourly
  // or only when someone asks.
  if (lastMs === null) {
    return {
      verdict: "dead",
      ageMs: null,
      quietAfterMs,
      deadAfterMs,
      neverExecuted: true,
      reason: "Has never executed. Not once, ever.",
    };
  }

  const ageMs = Math.max(0, now - lastMs);
  const base = {
    ageMs,
    quietAfterMs,
    deadAfterMs,
    neverExecuted: false,
  };

  if (deadAfterMs !== null && ageMs > deadAfterMs) {
    return {
      ...base,
      verdict: "dead",
      reason: `Last executed ${describeGap(ageMs)} ago, past ${DEAD_AFTER_CADENCES} of its own cycles.`,
    };
  }

  if (quietAfterMs !== null && ageMs > quietAfterMs) {
    return {
      ...base,
      verdict: "quiet",
      reason: `Last executed ${describeGap(ageMs)} ago, past ${QUIET_AFTER_CADENCES} of its own cycles.`,
    };
  }

  // Recent, but is the volume normal? A capability can be running and still be
  // mostly broken. This caps at quiet and never reaches dead.
  const floor = expectation.minExpectedInWindow;
  if (floor !== undefined && observation.countInWindow < floor) {
    return {
      ...base,
      verdict: "quiet",
      reason: `Ran ${observation.countInWindow} time${observation.countInWindow === 1 ? "" : "s"} in the window, below the ${floor} expected.`,
    };
  }

  if (observation.countInWindow === 0) {
    // Recent enough by age, but nothing landed inside the reporting window.
    // Worth saying out loud rather than painting green.
    return {
      ...base,
      verdict: "quiet",
      reason: `Nothing in the window, though it last ran ${describeGap(ageMs)} ago.`,
    };
  }

  return {
    ...base,
    verdict: "healthy",
    reason: `Ran ${observation.countInWindow} time${observation.countInWindow === 1 ? "" : "s"}, last ${describeGap(ageMs)} ago.`,
  };
}

/* ------------------------------------------------------------------ *
 * Data integrity: the column that exists, is read, and is never written
 * ------------------------------------------------------------------ */

/**
 * The failure that bit us three times in one day.
 *
 * `signals.embedding`, `themes.embedding` and `agent_memory.embedding` all had
 * the same shape: a column the schema declares, a query that filters on it being
 * present, and no write path that ever fills it. Every read returned zero rows
 * and every read was correct. There was no error to see anywhere.
 *
 * Expressed here as "rows where X is null but should not be", so a fourth
 * instance is caught by the same mechanism rather than by a fourth outage.
 */
export type IntegritySegmentObservation = {
  /** The value of the segmenting column, for example the memory kind `note`. */
  segment: string;
  totalRows: number;
  offendingRows: number;
};

export type IntegrityObservation = {
  totalRows: number;
  /** Rows where the column is null and the contract says it must not be. */
  offendingRows: number;
  /**
   * Optional breakdown. Whole-table ratios hide the worst version of this bug:
   * on 2026-08-02 `agent_memory` was 59 percent unembedded overall, which looks
   * like a backlog, while `note` and `precedent` were 100 percent unembedded,
   * which is a write path that has never once run.
   */
  segments?: IntegritySegmentObservation[];
  probeFailed?: boolean;
  probeError?: string | null;
};

export type IntegrityVerdict = "clean" | "degraded" | "broken" | "unknown";

export type IntegrityExpectation = {
  /**
   * The share of null rows that is normal. Embedding sweeps run behind writes,
   * so a small tail is a queue rather than a defect.
   */
  toleratedNullRatio?: number;
  /** At or above this share, the column is not lagging, it is unwritten. */
  brokenNullRatio?: number;
  /**
   * The smallest segment worth judging on its own. Below this a segment is too
   * small for "100 percent null" to mean anything.
   */
  segmentMinRows?: number;
};

export type IntegrityAssessment = {
  verdict: IntegrityVerdict;
  totalRows: number;
  offendingRows: number;
  /** Null share of the table, 0 to 1. Null when there are no rows to judge. */
  nullRatio: number | null;
  /** Segments that are entirely unwritten. The sharpest form of this finding. */
  deadSegments: string[];
  reason: string;
};

const DEFAULT_TOLERATED_NULL_RATIO = 0.02;
const DEFAULT_BROKEN_NULL_RATIO = 0.5;
const DEFAULT_SEGMENT_MIN_ROWS = 5;

export function assessIntegrity(
  observation: IntegrityObservation,
  expectation: IntegrityExpectation = {},
): IntegrityAssessment {
  const tolerated = expectation.toleratedNullRatio ?? DEFAULT_TOLERATED_NULL_RATIO;
  const broken = expectation.brokenNullRatio ?? DEFAULT_BROKEN_NULL_RATIO;
  const segmentMinRows = expectation.segmentMinRows ?? DEFAULT_SEGMENT_MIN_ROWS;

  if (observation.probeFailed) {
    return {
      verdict: "unknown",
      totalRows: observation.totalRows,
      offendingRows: observation.offendingRows,
      nullRatio: null,
      deadSegments: [],
      reason: observation.probeError
        ? `The check could not run: ${observation.probeError}`
        : "The check could not run, so nothing here can be read as clear.",
    };
  }

  if (observation.totalRows === 0) {
    return {
      verdict: "clean",
      totalRows: 0,
      offendingRows: 0,
      nullRatio: null,
      deadSegments: [],
      reason: "No rows to check yet.",
    };
  }

  const nullRatio = observation.offendingRows / observation.totalRows;

  // A segment that is entirely unwritten outranks the table ratio, always. This
  // is the check that would have caught `note` and `precedent` on a table whose
  // overall number looked like an ordinary backlog.
  const deadSegments = (observation.segments ?? [])
    .filter((s) => s.totalRows >= segmentMinRows && s.offendingRows === s.totalRows)
    .map((s) => s.segment);

  if (deadSegments.length > 0) {
    return {
      verdict: "broken",
      totalRows: observation.totalRows,
      offendingRows: observation.offendingRows,
      nullRatio,
      deadSegments,
      reason: `${deadSegments.join(", ")} ${deadSegments.length === 1 ? "is" : "are"} entirely unwritten. Nothing has ever filled this column for ${deadSegments.length === 1 ? "that kind" : "those kinds"}.`,
    };
  }

  if (observation.offendingRows === 0) {
    return {
      verdict: "clean",
      totalRows: observation.totalRows,
      offendingRows: 0,
      nullRatio: 0,
      deadSegments: [],
      reason: `All ${observation.totalRows} rows carry a value.`,
    };
  }

  if (nullRatio >= broken) {
    return {
      verdict: "broken",
      totalRows: observation.totalRows,
      offendingRows: observation.offendingRows,
      nullRatio,
      deadSegments: [],
      reason: `${observation.offendingRows} of ${observation.totalRows} rows are empty here, ${percent(nullRatio)}. Anything reading this column is missing most of the table.`,
    };
  }

  if (nullRatio > tolerated) {
    return {
      verdict: "degraded",
      totalRows: observation.totalRows,
      offendingRows: observation.offendingRows,
      nullRatio,
      deadSegments: [],
      reason: `${observation.offendingRows} of ${observation.totalRows} rows are empty here, ${percent(nullRatio)}. Reads against this column are incomplete.`,
    };
  }

  return {
    verdict: "clean",
    totalRows: observation.totalRows,
    offendingRows: observation.offendingRows,
    nullRatio,
    deadSegments: [],
    reason: `${observation.offendingRows} of ${observation.totalRows} rows still empty, inside the normal sweep lag.`,
  };
}

/* ------------------------------------------------------------------ *
 * Vocabulary drift: the values the database holds and the code does not know
 * ------------------------------------------------------------------ */

/**
 * The third shape of the same disease.
 *
 * The knowledge graph could not name or focus a `learning` node, which was the
 * second most common kind in `artifact_lineage`, because three separate
 * TypeScript vocabularies each listed ten kinds while the table held thirteen.
 * Nothing failed. The kind was simply invisible, and stayed invisible because a
 * missing list entry produces no error anywhere: not at compile time, since the
 * data is strings from a database, and not at run time, since every lookup fell
 * through to a sensible default.
 *
 * The check is a subtraction. Count the rows. Count the rows carrying any value
 * the code declares. If the second is smaller than the first, the difference is
 * rows the product wrote and the product cannot read. Two counts, no group-by,
 * and therefore no new database function and no migration.
 */
export type VocabularyObservation = {
  totalRows: number;
  /** Rows carrying one of the declared values. */
  declaredRows: number;
  /**
   * Optional per-value breakdown. Costs one query per value, so the default
   * probe does not ask for it: the drift finding needs only the subtraction,
   * and a page that spends thirty subrequests proving a nicety is a page that
   * eventually trips the Worker's subrequest ceiling and reports nothing.
   */
  declaredCounts?: Array<{ value: string; rows: number }>;
  probeFailed?: boolean;
  probeError?: string | null;
};

export type VocabularyVerdict = "aligned" | "drifted" | "unknown";

export type VocabularyAssessment = {
  verdict: VocabularyVerdict;
  totalRows: number;
  /** Rows carrying a value no vocabulary declares. The blind spot, in rows. */
  undeclaredRows: number;
  /** Declared values that no row uses. Dead entries, worth pruning, not urgent. */
  unusedValues: string[];
  reason: string;
};

export function assessVocabulary(observation: VocabularyObservation): VocabularyAssessment {
  if (observation.probeFailed) {
    return {
      verdict: "unknown",
      totalRows: observation.totalRows,
      undeclaredRows: 0,
      unusedValues: [],
      reason: observation.probeError
        ? `The check could not run: ${observation.probeError}`
        : "The check could not run, so nothing here can be read as clear.",
    };
  }

  const undeclaredRows = Math.max(0, observation.totalRows - observation.declaredRows);
  const unusedValues = (observation.declaredCounts ?? [])
    .filter((d) => d.rows === 0)
    .map((d) => d.value);

  if (observation.totalRows === 0) {
    return {
      verdict: "aligned",
      totalRows: 0,
      undeclaredRows: 0,
      unusedValues,
      reason: "No rows to check yet.",
    };
  }

  if (undeclaredRows > 0) {
    return {
      verdict: "drifted",
      totalRows: observation.totalRows,
      undeclaredRows,
      unusedValues,
      reason: `${undeclaredRows} of ${observation.totalRows} rows carry a value the code does not declare. Those rows are written and cannot be read back.`,
    };
  }

  return {
    verdict: "aligned",
    totalRows: observation.totalRows,
    undeclaredRows: 0,
    unusedValues,
    reason:
      unusedValues.length > 0
        ? `Every row is a value the code knows. ${unusedValues.length} declared value${unusedValues.length === 1 ? "" : "s"} nothing writes: ${unusedValues.join(", ")}.`
        : `Every one of ${observation.totalRows} rows is a value the code knows.`,
  };
}

export const VOCABULARY_SEVERITY: Record<VocabularyVerdict, number> = {
  drifted: 0,
  unknown: 1,
  aligned: 2,
};

/* ------------------------------------------------------------------ *
 * Rollup
 * ------------------------------------------------------------------ */

/** Verdict order, worst first. Used to sort a report so the finding leads. */
export const LIVENESS_SEVERITY: Record<LivenessVerdict, number> = {
  dead: 0,
  unknown: 1,
  quiet: 2,
  healthy: 3,
};

export const INTEGRITY_SEVERITY: Record<IntegrityVerdict, number> = {
  broken: 0,
  unknown: 1,
  degraded: 2,
  clean: 3,
};

/* ------------------------------------------------------------------ *
 * Local helpers
 * ------------------------------------------------------------------ */

function parseTimestamp(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/** The coarsest unit that is still true. Matches the Health page's `ago`. */
export function describeGap(ms: number): string {
  const minutes = Math.round(ms / MINUTE);
  if (minutes < 2) return "a moment";
  if (minutes < 90) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days} d`;
  return `${Math.round(days / 30)} months`;
}

function percent(ratio: number): string {
  return `${Math.round(ratio * 100)} percent`;
}
