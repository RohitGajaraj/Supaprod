/**
 * Audit-ID system — P1: the pure id-resolver (founder ruling 2026-07-13).
 *
 * Every core entity already renders a verifiable trace tag on its card
 * (`OPP·005C82`, `MIS·7E7D59`, ...): a stage prefix + the first six
 * alphanumerics of its uuid (see `traceRef` in discover/format.ts). This
 * module is the inverse + the vocabulary: it maps a stage prefix to its entity
 * kind + DB table, formats a canonical tag, parses a user-typed token, and
 * finds ids inside free text (so Ask can spot "MIS-0674" in a question). PURE:
 * no server import, no DB — unit-tested in audit-id.test.ts.
 */

export type AuditKind =
  | "signal"
  | "opportunity"
  | "decision"
  | "spec"
  | "mission"
  | "learning"
  | "memory"
  | "meeting"
  | "goal"
  | "doc"
  | "release"
  | "prototype";

export type AuditKindMeta = {
  kind: AuditKind;
  /** Uppercase stage prefix shown on the tag (SIG · OPP · DEC · ...). */
  prefix: string;
  /** The Supabase table the entity lives in. */
  table: string;
  /** Human label for the lineage header. */
  label: string;
  /** The loop stage this entity belongs to (for the graph + narration). */
  stage: string;
};

// Every core entity in the platform is traceable (founder ruling 2026-07-13:
// "everything should have a traceable audit id generated out of this
// platform"). Prefix = the uppercase tag stage code; table = the real
// Supabase table (all verified present). Extend here to make a new entity
// kind traceable + Ask-fetchable in one place.
export const AUDIT_KINDS: readonly AuditKindMeta[] = [
  { kind: "signal", prefix: "SIG", table: "signals", label: "Signal", stage: "Discover" },
  { kind: "opportunity", prefix: "OPP", table: "opportunities", label: "Opportunity", stage: "Decide" },
  { kind: "decision", prefix: "DEC", table: "decisions", label: "Decision", stage: "Decide" },
  { kind: "spec", prefix: "PRD", table: "prds", label: "Spec", stage: "Plan" },
  { kind: "goal", prefix: "GOL", table: "goals", label: "Goal", stage: "Plan" },
  { kind: "prototype", prefix: "PRO", table: "prototypes", label: "Prototype", stage: "Design" },
  { kind: "mission", prefix: "MIS", table: "missions", label: "Mission", stage: "Build" },
  { kind: "release", prefix: "REL", table: "changelog_entries", label: "Release", stage: "Ship" },
  { kind: "learning", prefix: "LRN", table: "learnings", label: "Learning", stage: "Learn" },
  { kind: "meeting", prefix: "MTG", table: "meetings", label: "Meeting", stage: "Today" },
  { kind: "memory", prefix: "MEM", table: "agent_memory", label: "Memory", stage: "Brain" },
  { kind: "doc", prefix: "DOC", table: "docs", label: "Doc", stage: "Brain" },
];

const BY_PREFIX = new Map(AUDIT_KINDS.map((k) => [k.prefix, k] as const));
const BY_KIND = new Map(AUDIT_KINDS.map((k) => [k.kind, k] as const));

/** The short trace ref shown on a tag: first six alphanumerics, uppercased.
 *  Deliberately mirrors `traceRef` (discover/format.ts) so a tag and a lookup
 *  always agree. */
export function auditShort(id: string): string {
  return id
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase();
}

/** The canonical display tag for an entity, e.g. `OPP·005C82`. */
export function formatAuditId(kind: AuditKind, id: string): string {
  return `${BY_KIND.get(kind)?.prefix ?? "REF"}·${auditShort(id)}`;
}

export function auditKindMeta(kind: AuditKind): AuditKindMeta | null {
  return BY_KIND.get(kind) ?? null;
}

export type ParsedAuditId = { kind: AuditKind; meta: AuditKindMeta; short: string };

/**
 * Parse a single user-typed token (`OPP·005C82`, `opp-005c82`, `MIS 7E7D59`,
 * `dec_8976c0`) into { kind, short }. Separators: ·, -, :, _, /, or spaces.
 * Case-insensitive. Returns null for an unknown prefix or empty short part.
 */
export function parseAuditId(token: string): ParsedAuditId | null {
  const m = token.trim().match(/^([A-Za-z]{2,4})[\s·:_/-]+([A-Za-z0-9]{2,})$/);
  if (!m) return null;
  const meta = BY_PREFIX.get(m[1].toUpperCase());
  if (!meta) return null;
  const short = m[2].replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return short ? { kind: meta.kind, meta, short } : null;
}

/**
 * Find every audit id embedded in free text (e.g. an Ask question). Requires a
 * real separator between the prefix and the ref so ordinary prose does not
 * false-match; only known stage prefixes count. De-duplicates.
 */
export function findAuditIds(text: string): ParsedAuditId[] {
  const seen = new Set<string>();
  const out: ParsedAuditId[] = [];
  const re = /\b([A-Za-z]{2,4})[·:_/-]([A-Za-z0-9]{2,})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const meta = BY_PREFIX.get(m[1].toUpperCase());
    if (!meta) continue;
    const short = m[2].toUpperCase();
    const key = `${meta.kind}:${short}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: meta.kind, meta, short });
  }
  return out;
}
