// Pure presentation logic for the Incidents panel (design-anatomy dim 17). No
// React, so the trace-ref derivation and the severity tone mapping are
// unit-tested without a DOM. Incidents are engine-only objects, so they carry a
// local INC trace prefix (the kindTracePrefix pattern), not a shared-registry
// one.
import { traceRef } from "@/components/discover/format";
import type { IncidentKind } from "@/lib/incidents.functions";

/** Engine-only local trace prefix for an incident (design-anatomy §4). */
export const INCIDENT_PREFIX = "INC";

/**
 * An incident id is namespaced by source (`exec:<uuid>`, `cost:<uuid>`,
 * `guard:<uuid>`, ...). The trace ref reads the underlying record id, not the
 * namespace, so `INC\u00b7A1B2C3` is stable and readable.
 */
export function incidentRealId(id: string): string {
  const i = id.indexOf(":");
  return i >= 0 ? id.slice(i + 1) : id;
}

export function incidentTraceRef(id: string): string {
  return `${INCIDENT_PREFIX}\u00b7${traceRef(incidentRealId(id))}`;
}

/** Severity tone per incident kind, as a semantic role token. A failed run,
 * spinning mission, or pipeline error reads in the alert role (madder); a
 * guardrail block is the machine correctly stopping something — a category
 * tag, not a live/running status, so it reads neutral gray per the Tempo
 * v5 glacier narrowing (2026-07-11); a cost breach is caution (marigold); a
 * manual note is quiet. The "glacier" tone name is kept as the internal tag
 * for this category (see KIND_TONE below); only its CSS value changed. */
export type IncidentTone = "madder" | "glacier" | "marigold" | "muted";

const KIND_TONE: Record<IncidentKind, IncidentTone> = {
  execution: "madder",
  pipeline: "madder",
  runaway: "madder",
  guardrail: "glacier",
  cost: "marigold",
  manual: "muted",
};

export function incidentTone(kind: IncidentKind): IncidentTone {
  return KIND_TONE[kind] ?? "muted";
}

export const INCIDENT_TONE_VAR: Record<IncidentTone, string> = {
  madder: "var(--madder)",
  glacier: "var(--text-subtle)",
  marigold: "var(--marigold)",
  muted: "var(--text-muted)",
};
