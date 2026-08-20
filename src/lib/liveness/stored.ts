/**
 * Rebuilding the liveness report from the rows the tick wrote.
 *
 * `cron.liveness-tick` checks the least-recently-checked few registry entries per
 * run and upserts `liveness_results`. This turns those rows back into the report
 * shape the admin surface already consumes, so nothing downstream has to know
 * that the report stopped being computed on demand.
 *
 * ── THE REGISTRY IS THE SOURCE OF TRUTH, NOT THE TABLE ──────────────────
 * The shape is driven by the registry and rows are looked up against it, never
 * the other way round. Two consequences, both intended:
 *
 *   * a capability registered five minutes ago appears immediately, as `unknown`,
 *     rather than being invisible until the rotation reaches it;
 *   * a row for an id nobody registers any more is ignored, rather than
 *     resurrecting a capability that was deliberately removed.
 *
 * ── UNKNOWN IS A REAL ANSWER HERE, AND IT IS THE HONEST ONE ─────────────
 * All three verdict unions already carry `unknown`, and this layer already uses
 * it for "the probe could not tell". "Not checked yet" is the same class of
 * statement and gets the same word. Reading it as healthy would be a lie the
 * page cannot recover from, and reading it as dead would raise an alarm about a
 * capability nobody has looked at.
 */
import type { Cadence } from "./evaluate";
import type {
  CapabilityReport,
  IntegrityReport,
  LivenessReport,
  VocabularyReport,
} from "./report";
import type {
  TrackedCapability,
  TrackedIntegrityCheck,
  TrackedVocabularyCheck,
} from "./registry";

/** One row of `liveness_results`, as the surface reads it. */
export type StoredResultRow = {
  capability_id: string;
  kind: string;
  window_days: number;
  verdict: string;
  reason: string;
  detail: Record<string, unknown> | null;
  checked_at: string | null;
};

const NOT_CHECKED = "Not checked yet. The rotation takes the least recently checked first.";

function num(d: Record<string, unknown> | null, k: string): number {
  const v = d?.[k];
  return typeof v === "number" ? v : 0;
}
function str(d: Record<string, unknown> | null, k: string): string | null {
  const v = d?.[k];
  return typeof v === "string" ? v : null;
}
function strList(d: Record<string, unknown> | null, k: string): string[] {
  const v = d?.[k];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export function reportFromStoredRows(
  rows: StoredResultRow[],
  registry: {
    windowDays: number;
    capabilities: readonly TrackedCapability[];
    integrityChecks: readonly TrackedIntegrityCheck[];
    vocabularyChecks: readonly TrackedVocabularyCheck[];
  },
): LivenessReport {
  const byId = new Map<string, StoredResultRow>();
  for (const r of rows) byId.set(r.capability_id, r);

  const capabilities: CapabilityReport[] = registry.capabilities.map((spec) => {
    const row = byId.get(spec.id);
    return {
      id: spec.id,
      title: spec.title,
      proof: spec.proof,
      cadence: spec.cadence as Cadence,
      note: spec.note ?? null,
      verdict: (row?.verdict as CapabilityReport["verdict"]) ?? "unknown",
      reason: row?.reason ?? NOT_CHECKED,
      countInWindow: num(row?.detail ?? null, "countInWindow"),
      lastAt: str(row?.detail ?? null, "lastAt"),
      /*
       * Age is deliberately not carried across. It was computed against the
       * moment the probe ran, and re-serving it later would report an age that
       * stopped moving while the clock did not. `lastAt` is a fact and survives;
       * an age is a reading and does not.
       */
      ageMs: null,
      neverExecuted: row?.detail?.neverExecuted === true,
      checkedAt: row?.checked_at ?? null,
    };
  });

  const integrity: IntegrityReport[] = registry.integrityChecks.map((spec) => {
    const row = byId.get(spec.id);
    return {
      id: spec.id,
      title: spec.title,
      readBy: spec.readBy,
      note: spec.note ?? null,
      verdict: (row?.verdict as IntegrityReport["verdict"]) ?? "unknown",
      reason: row?.reason ?? NOT_CHECKED,
      totalRows: num(row?.detail ?? null, "totalRows"),
      offendingRows: num(row?.detail ?? null, "offendingRows"),
      nullRatio: null,
      deadSegments: strList(row?.detail ?? null, "deadSegments"),
      segments: [],
      checkedAt: row?.checked_at ?? null,
    };
  });

  const vocabulary: VocabularyReport[] = registry.vocabularyChecks.map((spec) => {
    const row = byId.get(spec.id);
    return {
      id: spec.id,
      title: spec.title,
      declaredBy: spec.declaredBy,
      note: spec.note ?? null,
      verdict: (row?.verdict as VocabularyReport["verdict"]) ?? "unknown",
      reason: row?.reason ?? NOT_CHECKED,
      totalRows: num(row?.detail ?? null, "totalRows"),
      undeclaredRows: num(row?.detail ?? null, "undeclaredRows"),
      unusedValues: strList(row?.detail ?? null, "unusedValues"),
      checkedAt: row?.checked_at ?? null,
    };
  });

  return {
    /*
     * When this ANSWER was assembled, which is now. Each entry carries its own
     * `checkedAt`, because with a rotation they are genuinely measured at
     * different times and one timestamp for the whole page would be wrong for
     * every row but one.
     */
    generatedAt: new Date().toISOString(),
    windowDays: registry.windowDays,
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
