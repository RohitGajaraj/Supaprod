/**
 * Feature liveness: assembling the report.
 *
 * Reads every registry entry, judges each with the pure classifier, and returns
 * one object sorted worst first. The client is a parameter so this runs against
 * the admin Supabase client in production and against a fake in a test.
 *
 * Nothing here decides anything. Every verdict comes from `evaluate.ts` and
 * every query shape comes from `probe.ts`. This file is the wiring.
 *
 * ONE BUDGET TO RESPECT. The whole report runs inside a single Cloudflare
 * Worker invocation, which has a hard ceiling on outbound subrequests. Every
 * capability costs two queries, every integrity check two plus two per declared
 * segment, and every vocabulary check two. `report.test.ts` pins the total. When
 * a new entry pushes it over, make the probe cheaper rather than raising the
 * number: a liveness page that trips the ceiling reports nothing at all, which
 * is the exact failure this system was built to catch.
 */

import {
  assessCapability,
  assessIntegrity,
  assessVocabulary,
  LIVENESS_SEVERITY,
  INTEGRITY_SEVERITY,
  VOCABULARY_SEVERITY,
  type Cadence,
  type IntegrityVerdict,
  type LivenessVerdict,
  type VocabularyVerdict,
} from "./evaluate";
import { readIntegrity, readProbe, readVocabulary, type LivenessClient } from "./probe";
import {
  TRACKED_CAPABILITIES,
  TRACKED_INTEGRITY_CHECKS,
  TRACKED_VOCABULARY_CHECKS,
  type TrackedCapability,
  type TrackedIntegrityCheck,
  type TrackedVocabularyCheck,
} from "./registry";

export const DEFAULT_WINDOW_DAYS = 7;

export type CapabilityReport = {
  id: string;
  title: string;
  proof: string;
  cadence: Cadence;
  note: string | null;
  verdict: LivenessVerdict;
  reason: string;
  countInWindow: number;
  lastAt: string | null;
  ageMs: number | null;
  neverExecuted: boolean;
  /** When the stored verdict was taken. Null when computed live just now. */
  checkedAt?: string | null;
};

export type IntegrityReport = {
  id: string;
  title: string;
  readBy: string;
  note: string | null;
  verdict: IntegrityVerdict;
  reason: string;
  totalRows: number;
  offendingRows: number;
  nullRatio: number | null;
  deadSegments: string[];
  segments: Array<{ segment: string; totalRows: number; offendingRows: number }>;
  /** When the stored verdict was taken. Null when computed live just now. */
  checkedAt?: string | null;
};

export type VocabularyReport = {
  id: string;
  title: string;
  declaredBy: string;
  note: string | null;
  verdict: VocabularyVerdict;
  reason: string;
  totalRows: number;
  undeclaredRows: number;
  unusedValues: string[];
  /** When the stored verdict was taken. Null when computed live just now. */
  checkedAt?: string | null;
};

export type LivenessReport = {
  generatedAt: string;
  windowDays: number;
  capabilities: CapabilityReport[];
  integrity: IntegrityReport[];
  vocabulary: VocabularyReport[];
  counts: {
    dead: number;
    quiet: number;
    healthy: number;
    unknown: number;
    broken: number;
    degraded: number;
    drifted: number;
  };
};

export async function buildLivenessReport(
  client: LivenessClient,
  opts: {
    now?: number;
    windowDays?: number;
    capabilities?: TrackedCapability[];
    integrityChecks?: TrackedIntegrityCheck[];
    vocabularyChecks?: TrackedVocabularyCheck[];
  } = {},
): Promise<LivenessReport> {
  const now = opts.now ?? Date.now();
  const windowDays = opts.windowDays ?? DEFAULT_WINDOW_DAYS;
  const windowStartIso = new Date(now - windowDays * 86_400_000).toISOString();

  const capabilitySpecs = opts.capabilities ?? TRACKED_CAPABILITIES;
  const integritySpecs = opts.integrityChecks ?? TRACKED_INTEGRITY_CHECKS;
  const vocabularySpecs = opts.vocabularyChecks ?? TRACKED_VOCABULARY_CHECKS;

  const [capabilities, integrity, vocabulary] = await Promise.all([
    Promise.all(
      capabilitySpecs.map(async (spec): Promise<CapabilityReport> => {
        const reading = await readProbe(client, spec.probe, windowStartIso);
        const assessment = assessCapability(
          reading,
          {
            cadence: spec.cadence,
            expectedIntervalMs: spec.expectedIntervalMs,
            minExpectedInWindow: spec.minExpectedInWindow,
          },
          now,
        );
        return {
          id: spec.id,
          title: spec.title,
          proof: spec.proof,
          cadence: spec.cadence,
          note: spec.note ?? null,
          verdict: assessment.verdict,
          reason: assessment.reason,
          countInWindow: reading.countInWindow,
          lastAt: reading.lastAt,
          ageMs: assessment.ageMs,
          neverExecuted: assessment.neverExecuted,
        };
      }),
    ),
    Promise.all(
      integritySpecs.map(async (spec): Promise<IntegrityReport> => {
        const reading = await readIntegrity(client, spec.probe);
        const assessment = assessIntegrity(reading, {
          toleratedNullRatio: spec.toleratedNullRatio,
          brokenNullRatio: spec.brokenNullRatio,
          segmentMinRows: spec.segmentMinRows,
        });
        return {
          id: spec.id,
          title: spec.title,
          readBy: spec.readBy,
          note: spec.note ?? null,
          verdict: assessment.verdict,
          reason: assessment.reason,
          totalRows: assessment.totalRows,
          offendingRows: assessment.offendingRows,
          nullRatio: assessment.nullRatio,
          deadSegments: assessment.deadSegments,
          segments: reading.segments ?? [],
        };
      }),
    ),
    Promise.all(
      vocabularySpecs.map(async (spec): Promise<VocabularyReport> => {
        const reading = await readVocabulary(client, spec.probe);
        const assessment = assessVocabulary(reading);
        return {
          id: spec.id,
          title: spec.title,
          declaredBy: spec.declaredBy,
          note: spec.note ?? null,
          verdict: assessment.verdict,
          reason: assessment.reason,
          totalRows: assessment.totalRows,
          undeclaredRows: assessment.undeclaredRows,
          unusedValues: assessment.unusedValues,
        };
      }),
    ),
  ]);

  // Worst first, then alphabetical, so the order is stable between runs and the
  // finding is never below the fold.
  capabilities.sort(
    (a, b) =>
      LIVENESS_SEVERITY[a.verdict] - LIVENESS_SEVERITY[b.verdict] || a.title.localeCompare(b.title),
  );
  integrity.sort(
    (a, b) =>
      INTEGRITY_SEVERITY[a.verdict] - INTEGRITY_SEVERITY[b.verdict] ||
      a.title.localeCompare(b.title),
  );
  vocabulary.sort(
    (a, b) =>
      VOCABULARY_SEVERITY[a.verdict] - VOCABULARY_SEVERITY[b.verdict] ||
      a.title.localeCompare(b.title),
  );

  return {
    generatedAt: new Date(now).toISOString(),
    windowDays,
    capabilities,
    integrity,
    vocabulary,
    counts: {
      dead: capabilities.filter((c) => c.verdict === "dead").length,
      quiet: capabilities.filter((c) => c.verdict === "quiet").length,
      healthy: capabilities.filter((c) => c.verdict === "healthy").length,
      unknown:
        capabilities.filter((c) => c.verdict === "unknown").length +
        integrity.filter((c) => c.verdict === "unknown").length +
        vocabulary.filter((c) => c.verdict === "unknown").length,
      broken: integrity.filter((c) => c.verdict === "broken").length,
      degraded: integrity.filter((c) => c.verdict === "degraded").length,
      drifted: vocabulary.filter((c) => c.verdict === "drifted").length,
    },
  };
}

/**
 * The one-sentence verdict for the whole report. Named separately because the
 * tick and the surface must say the same thing, and a sentence built twice is a
 * sentence that eventually disagrees with itself.
 */
export function summariseReport(report: LivenessReport): string {
  const problems: string[] = [];
  if (report.counts.dead > 0) {
    problems.push(
      `${report.counts.dead} tracked capabilit${report.counts.dead === 1 ? "y is" : "ies are"} doing nothing`,
    );
  }
  if (report.counts.broken > 0) {
    problems.push(
      `${report.counts.broken} column${report.counts.broken === 1 ? " is" : "s are"} read and never written`,
    );
  }
  if (report.counts.drifted > 0) {
    problems.push(
      `${report.counts.drifted} vocabular${report.counts.drifted === 1 ? "y disagrees" : "ies disagree"} with the database`,
    );
  }
  if (problems.length > 0) return capitalise(problems.join(", "));

  if (report.counts.unknown > 0) {
    return `${report.counts.unknown} check${report.counts.unknown === 1 ? "" : "s"} could not run, so this is not a clean bill`;
  }
  if (report.counts.degraded > 0 || report.counts.quiet > 0) {
    return "Everything tracked has executed, some of it slowly";
  }
  return "Every tracked capability is executing";
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
