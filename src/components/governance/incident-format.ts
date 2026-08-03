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

/** Hex characters of a uuid, hyphens removed. A short is a prefix of this. */
function hexOf(id: string): string {
  return incidentRealId(id)
    .replace(/[^0-9a-fA-F]/g, "")
    .toLowerCase();
}

/**
 * Trace refs for a LIST of incidents, each extended until it is unique.
 *
 * WHY. Walking the live product on 2026-08-03, all seven incidents in the
 * Engine room rendered the identical tag `INC.600000`. `traceRef` takes the
 * first six alphanumerics of the id, and every seeded row begins `60000000-`,
 * so the reference that exists to tell records apart told a human nothing. In a
 * ledger sold as tamper-evident, seven identical labels is not a cosmetic
 * problem: it is the audit trail failing at its one job.
 *
 * WHY NOT A HASH, which is the obvious first idea. `audit-lineage.functions.ts`
 * resolves a tag by PREFIX RANGE on the primary key (`shortToUuidRange`), which
 * is what makes lookup an indexed range scan with no row cap. A hashed short is
 * not a prefix of anything, so it would break every lookup in the product to fix
 * a label. The short must stay a real prefix.
 *
 * SO: git's answer. Abbreviate to six, and extend only the ones that collide,
 * one character at a time, until each is unique within what is on screen. Rows
 * that never collided keep the exact tag they have always had, and a collision
 * costs one extra character rather than a new scheme.
 *
 * Scoped to the list in view ON PURPOSE. Uniqueness across the whole table is
 * neither achievable client-side nor what the reader needs: they are comparing
 * the rows in front of them. A tag that is ambiguous table-wide still resolves
 * honestly, because the resolver reports `ambiguous` with candidates rather than
 * guessing.
 */
export function incidentTraceRefs(ids: string[]): Map<string, string> {
  const out = new Map<string, string>();
  // Group by the six-char short. Anything alone in its group is already unique.
  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const key = traceRef(incidentRealId(id));
    groups.set(key, [...(groups.get(key) ?? []), id]);
  }

  for (const [, members] of groups) {
    if (members.length === 1) {
      out.set(members[0], incidentTraceRef(members[0]));
      continue;
    }
    // Grow the prefix until every member of this group differs, or until the
    // uuids are exhausted (identical ids, which the caller should not have
    // passed twice, and which we render identically rather than looping).
    let len = 6;
    while (len < 32) {
      const seen = new Set(members.map((m) => hexOf(m).slice(0, len)));
      if (seen.size === members.length) break;
      len += 1;
    }
    for (const m of members) {
      out.set(m, `${INCIDENT_PREFIX}\u00b7${hexOf(m).slice(0, len).toUpperCase()}`);
    }
  }
  return out;
}

/** Severity tone per incident kind, as a semantic role token. A failed run,
 * spinning mission, or pipeline error reads in the alert role (madder); a
 * guardrail block is the machine correctly stopping something, a category
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

/**
 * The tone as the `Value` primitive speaks it (src/components/shell/primitives.tsx).
 *
 * PORTED 2026-07-29: this used to be `INCIDENT_TONE_VAR`, a map of raw CSS
 * variables from the retired palette, which is how a panel ends up drawing its
 * own colour. The stylesheet owns every mix now, so a panel asks for a tone and
 * never for a hue.
 */
export const INCIDENT_VALUE_TONE: Record<IncidentTone, "quiet" | "pass" | "warn" | "fail"> = {
  madder: "fail",
  glacier: "quiet",
  marigold: "warn",
  muted: "quiet",
};
