/**
 * Audit-ID system — P2: the lineage retrieval (founder ruling 2026-07-13).
 *
 * Given an audit tag a user typed (or clicked) — "MIS·7E7D59", "OPP·005C82",
 * "LRN·..." — resolve it to its real row in the right table and compose a
 * lineage walk: what it is, when it entered the record, its status, who acted,
 * and the connected entities up/down the loop. RLS scopes every read to the
 * caller's own workspaces, so a foreign id simply returns not-found.
 *
 * Generic over all AUDIT_KINDS: it never assumes a column exists (selects *,
 * normalizes title/status/who/timestamps from a candidate list), so a new
 * traceable entity kind works the moment it is added to audit-id.ts.
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

export type AuditLineage = {
  found: boolean;
  /** The canonical tag, e.g. "OPP·005C82" (echoes the input even when not found). */
  ref: string;
  kind: AuditKind | null;
  /** The full entity id (uuid) when resolved — lets the client fetch richer,
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

export const getEntityLineage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ ref: z.string().min(2).max(80) }).parse(i))
  .handler(async ({ context, data }): Promise<AuditLineage> => {
    const db = context.supabase as unknown as SupabaseClient;

    let parsed = parseAuditId(data.ref);
    // Not a tag. It may still be a reference: a uuid is what a person has when
    // they copied it out of a URL rather than off a card.
    let exactId: string | null = null;
    if (!parsed) {
      const uuid = data.ref.trim().toLowerCase();
      if (!BARE_UUID.test(uuid)) return emptyLineage(data.ref.trim());
      const found = await kindForUuid(db, uuid);
      if (!found) return emptyLineage(data.ref.trim());
      exactId = uuid;
      parsed = { kind: found.kind, meta: found, short: auditShort(uuid) };
    }

    const { meta, short } = parsed;
    const canonical = `${meta.prefix}·${short}`;

    // RLS-scoped, no column assumptions: pull a bounded recent window and match
    // by the same short trace the tag shows. (A future computed-column index
    // can make this an exact server-side prefix match; the tag→row contract is
    // identical either way.)
    //
    // A UUID SKIPS THE WINDOW AND THE SHORT ENTIRELY, and that is not an
    // optimisation. Six hex characters collide (every seeded opportunity in the
    // demo workspace shares `600000`), so matching a pasted uuid by its short
    // would hand back a SIBLING ROW while looking perfectly correct. Someone
    // who gave an exact id gets exactly that row or nothing.
    const res = exactId
      ? await db.from(meta.table).select("*").eq("id", exactId).limit(1)
      : await db.from(meta.table).select("*").limit(2000);
    const rows = (res.data ?? []) as Array<Record<string, unknown>>;
    const row = exactId
      ? rows[0]
      : rows.find((r) => typeof r.id === "string" && auditShort(r.id as string) === short);
    if (!row) {
      return { ...emptyLineage(canonical), kind: meta.kind, label: meta.label, stage: meta.stage };
    }

    const id = row.id as string;
    const title = pick(row, TITLE_KEYS) ?? formatAuditId(meta.kind, id);
    const status = pick(row, STATUS_KEYS);
    const createdAt = pick(row, CREATED_KEYS);
    const updatedAt = pick(row, UPDATED_KEYS);
    const whoRaw = pick(row, WHO_KEYS);
    // Never show a raw uuid as an actor — a name or nothing, not an id.
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
  });
