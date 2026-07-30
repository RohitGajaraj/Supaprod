/**
 * Audit-ID system, P2: the lineage retrieval (founder ruling 2026-07-13).
 *
 * Given an audit tag a user typed (or clicked), "MIS·7E7D59", "OPP·005C82",
 * "LRN·...", resolve it to its real row in the right table and compose a
 * lineage walk: what it is, when it entered the record, its status, who acted,
 * and the connected entities up/down the loop. RLS scopes every read to the
 * caller's own workspaces, so a foreign id simply returns not-found.
 *
 * Generic over all AUDIT_KINDS: it never assumes a column exists (selects *,
 * normalizes title/status/who/timestamps from a candidate list), so a new
 * traceable entity kind works the moment it is added to audit-id.ts.
 *
 * HOW A TAG FINDS ITS ROW, and why the answer used to be wrong. The first
 * version pulled `select("*").limit(2000)` from the table and looked for a row
 * whose `auditShort(id)` matched. Three faults, escalating: it moved every
 * column of two thousand rows into the Worker to find one; past two thousand
 * rows it silently stopped finding entities that exist; and, worst,
 * SIX HEX CHARACTERS COLLIDE. Every seeded opportunity in the demo workspace
 * shorts to `600000`, so `OPP·600000` returned whichever row PostgREST happened
 * to hand back first, confidently and wrongly. A provenance feature that
 * quietly names the wrong record is worse than one that errors.
 *
 * Both halves are fixed here. The lookup is now a PREFIX RANGE on the primary
 * key (`shortToUuidRange`), which is index-friendly, exact, and has no row cap.
 * And a collision is reported rather than resolved: more than one row in the
 * range comes back as `ambiguous` with its candidates, because several rows are
 * not an answer and picking one is a lie.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AUDIT_KINDS,
  parseAuditId,
  auditShort,
  formatAuditId,
  type AuditKind,
  type AuditKindMeta,
} from "@/lib/audit-id";

export type AuditLineageStep = {
  label: string;
  detail: string;
  /** ISO timestamp, when the step carries one. */
  at: string | null;
  /** A canonical audit tag this step points at (a connected entity), if any. */
  ref: string | null;
};

/** One of several rows a colliding tag could mean. The uuid is the only thing
 *  that separates them, and it is what resolves exactly. */
export type AuditLineageCandidate = {
  /** The full uuid. Hand this back to `getEntityLineage` to pick this one:
   *  the uuid path is an `.eq` on the primary key, so it cannot collide. */
  entityId: string;
  title: string;
  status: string | null;
  createdAt: string | null;
};

export type AuditLineage = {
  found: boolean;
  /**
   * The tag matched MORE THAN ONE row, so there is no single answer.
   *
   * `found` stays false on purpose: every existing consumer already renders a
   * safe empty state for that, which is the correct fallback until it learns
   * the ambiguous case. A caller that wants to do better reads `candidates`.
   */
  ambiguous: boolean;
  /** The colliding rows, capped at CANDIDATE_CAP. Empty unless `ambiguous`. */
  candidates: AuditLineageCandidate[];
  /** How many rows the tag really matched. Can exceed `candidates.length` when
   *  the collision is bigger than the cap. 1 when a single row resolved. */
  candidateCount: number;
  /** The canonical tag, e.g. "OPP·005C82" (echoes the input even when not found). */
  ref: string;
  kind: AuditKind | null;
  /** The full entity id (uuid) when resolved, which lets the client fetch richer,
   *  kind-specific lineage (e.g. a mission's trust chain). */
  entityId: string | null;
  label: string;
  stage: string;
  title: string;
  status: string | null;
  createdAt: string | null;
  who: string | null;
  steps: AuditLineageStep[];
};

/** First present, non-empty string value among candidate columns. */
function pick(row: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

const TITLE_KEYS = ["title", "name", "summary", "headline", "label", "question", "body", "content"];
const STATUS_KEYS = ["status", "state", "verdict", "decision", "phase", "stage"];
const CREATED_KEYS = ["created_at", "createdAt", "inserted_at", "occurred_at"];
const UPDATED_KEYS = ["updated_at", "updatedAt", "last_acted_at"];
const WHO_KEYS = ["decided_by", "created_by", "author", "actor", "owner", "agent", "user_id"];

// Common foreign-key columns → the audit kind they point at. Best-effort: a
// column only produces a link when it holds a string id.
const LINK_COLS: ReadonlyArray<readonly [string, AuditKind]> = [
  ["signal_id", "signal"],
  ["opportunity_id", "opportunity"],
  ["decision_id", "decision"],
  ["prd_id", "spec"],
  ["goal_id", "goal"],
  ["mission_id", "mission"],
  ["prototype_id", "prototype"],
  ["learning_id", "learning"],
  ["meeting_id", "meeting"],
];

function emptyLineage(ref: string): AuditLineage {
  return {
    found: false,
    ambiguous: false,
    candidates: [],
    candidateCount: 0,
    ref,
    kind: null,
    entityId: null,
    label: "Unknown",
    stage: "",
    title: "",
    status: null,
    createdAt: null,
    who: null,
    steps: [],
  };
}

/** A uuid as it arrives from a URL bar, a log line or a paste. */
const BARE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Exactly what `formatAuditId` prints: the first six hex of a uuid. */
const SIX_HEX = /^[0-9a-f]{6}$/i;

/** How many colliding rows we carry back. The real total rides along in
 *  `candidateCount`, so a bigger collision is reported honestly, not truncated
 *  into a smaller-looking one. */
export const CANDIDATE_CAP = 25;

/**
 * The uuid range a six-hex short covers, as a pair of real uuids.
 *
 * `auditShort` strips non-alphanumerics and takes the first six characters, and
 * a canonical uuid's first group is eight hex, so a short is genuinely the
 * first six hex of the id. Postgres compares uuids bytewise, which is the same
 * order as comparing their canonical hex text, so every id beginning with the
 * short sits between `short + 00-0000-...` and `short + ff-ffff-...` and
 * nothing else does. That makes `.gte / .lte` on the primary key an exact
 * prefix match with no scan and no row cap.
 *
 * Null for anything that is not six hex, which is not pedantry: a short that
 * cannot be a prefix cannot be turned into bounds, and guessing bounds for it
 * would search a range that means nothing.
 */
export function shortToUuidRange(short: string): { lo: string; hi: string } | null {
  const s = short.trim().toLowerCase();
  if (!SIX_HEX.test(s)) return null;
  return {
    lo: `${s}00-0000-0000-0000-000000000000`,
    hi: `${s}ff-ffff-ffff-ffff-ffffffffffff`,
  };
}

/**
 * Which table owns this uuid.
 *
 * A tag carries its own kind in the prefix; a bare uuid carries nothing, so the
 * only way to say what it IS is to ask. Twelve primary-key lookups, issued at
 * once and RLS-scoped like everything else here, which is cheap because each
 * one is an index hit returning at most one row. It runs only when someone
 * pastes a uuid, never on the tag path.
 *
 * Before this existed the pane answered a real, visible, RLS-readable uuid with
 * "no record for it in this workspace ... an id from somewhere else, or a
 * mistyped one", which is not merely unhelpful: it is a false statement about
 * why, and it blames the person holding a correct id.
 */
async function kindForUuid(db: SupabaseClient, id: string): Promise<AuditKindMeta | null> {
  const hits = await Promise.all(
    AUDIT_KINDS.map(async (meta) => {
      const res = await db.from(meta.table).select("id").eq("id", id).limit(1);
      return res.data && res.data.length > 0 ? meta : null;
    }),
  );
  return hits.find((m): m is AuditKindMeta => m !== null) ?? null;
}

/**
 * Resolve a tag or a uuid to its lineage. Exported (and taking the client) so
 * the resolution rules are testable without standing up a server function.
 */
export async function resolveEntityLineage(
  db: SupabaseClient,
  rawRef: string,
): Promise<AuditLineage> {
  const input = rawRef.trim();

  let parsed = parseAuditId(input);
  // Not a tag. It may still be a reference: a uuid is what a person has when
  // they copied it out of a URL rather than off a card.
  let exactId: string | null = null;
  if (!parsed) {
    const uuid = input.toLowerCase();
    if (!BARE_UUID.test(uuid)) return emptyLineage(input);
    const found = await kindForUuid(db, uuid);
    if (!found) return emptyLineage(input);
    exactId = uuid;
    parsed = { kind: found.kind, meta: found, short: auditShort(uuid) };
  }

  const { meta, short } = parsed;
  const canonical = `${meta.prefix}·${short}`;
  const unresolved = (): AuditLineage => ({
    ...emptyLineage(canonical),
    kind: meta.kind,
    label: meta.label,
    stage: meta.stage,
  });

  // `select("*")` is deliberate and now cheap. This resolver is generic over
  // all twelve AUDIT_KINDS, whose tables share almost no columns (`signals` has
  // content, `learnings` has verdict + summary, `prototypes` has name), so a
  // fixed projection would either 400 on the tables missing a column or drop
  // the very fields the normalisers read. What made `*` expensive was the
  // two-thousand-row window, not the star: the range below returns a handful of
  // rows at most, and the uuid branch returns one.
  //
  // A UUID SKIPS THE SHORT ENTIRELY. Someone who gave an exact id gets exactly
  // that row or nothing, never a sibling that happens to share six hex.
  let rows: Array<Record<string, unknown>>;
  let total: number;
  if (exactId) {
    const res = await db.from(meta.table).select("*").eq("id", exactId).limit(1);
    if (res.error) throw new Error(`Could not read the record: ${res.error.message}`);
    rows = (res.data ?? []) as Array<Record<string, unknown>>;
    total = rows.length;
  } else {
    const range = shortToUuidRange(short);
    // A short that is not six hex is not a canonical tag, so it names nothing.
    if (!range) return unresolved();
    const res = await db
      .from(meta.table)
      .select("*", { count: "exact" })
      .gte("id", range.lo)
      .lte("id", range.hi)
      .order("id", { ascending: true })
      .limit(CANDIDATE_CAP);
    if (res.error) throw new Error(`Could not read the record: ${res.error.message}`);
    rows = (res.data ?? []) as Array<Record<string, unknown>>;
    total = res.count ?? rows.length;
  }

  if (rows.length === 0) return unresolved();

  // MORE THAN ONE ROW IS A REAL STATE, not a tie to break. Six hex collide, and
  // the honest answer is to name every row the tag could mean and let the
  // person choose by uuid.
  if (rows.length > 1) {
    return {
      ...unresolved(),
      ambiguous: true,
      candidateCount: total,
      candidates: rows.map((r) => {
        const rid = r.id as string;
        return {
          entityId: rid,
          title: (pick(r, TITLE_KEYS) ?? formatAuditId(meta.kind, rid)).slice(0, 200),
          status: pick(r, STATUS_KEYS),
          createdAt: pick(r, CREATED_KEYS),
        };
      }),
    };
  }

  const row = rows[0];
  const id = row.id as string;
  const title = pick(row, TITLE_KEYS) ?? formatAuditId(meta.kind, id);
  const status = pick(row, STATUS_KEYS);
  const createdAt = pick(row, CREATED_KEYS);
  const updatedAt = pick(row, UPDATED_KEYS);
  const whoRaw = pick(row, WHO_KEYS);
  // Never show a raw uuid as an actor: a name or nothing, not an id.
  const who = whoRaw && !/^[0-9a-f]{8}-?[0-9a-f]{4}/i.test(whoRaw) ? whoRaw : null;

  const steps: AuditLineageStep[] = [];
  steps.push({
    label: `${meta.stage} · entered the record`,
    detail: who ? `Captured by ${who}.` : `This ${meta.label.toLowerCase()} was recorded.`,
    at: createdAt,
    ref: formatAuditId(meta.kind, id),
  });
  for (const [col, linkedKind] of LINK_COLS) {
    const v = row[col];
    if (typeof v === "string" && v) {
      steps.push({
        label: `Connected ${linkedKind}`,
        detail: "linked up the loop",
        at: null,
        ref: formatAuditId(linkedKind, v),
      });
    }
  }
  if (status) {
    steps.push({ label: "Current status", detail: status, at: updatedAt, ref: null });
  }
  if (updatedAt && updatedAt !== createdAt) {
    steps.push({
      label: "Last change",
      detail: "most recent update on the record",
      at: updatedAt,
      ref: null,
    });
  }

  return {
    found: true,
    ambiguous: false,
    candidates: [],
    candidateCount: 1,
    ref: formatAuditId(meta.kind, id),
    kind: meta.kind,
    entityId: id,
    label: meta.label,
    stage: meta.stage,
    title: title.slice(0, 200),
    status,
    createdAt,
    who,
    steps,
  };
}

export const getEntityLineage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ ref: z.string().min(2).max(80) }).parse(i))
  .handler(async ({ context, data }): Promise<AuditLineage> =>
    resolveEntityLineage(context.supabase as unknown as SupabaseClient, data.ref),
  );
