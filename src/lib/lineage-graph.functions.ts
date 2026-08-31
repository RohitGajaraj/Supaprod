/**
 * The lineage walk, with the I/O around it: resolve a focus, read the edges,
 * hydrate every node the walk touched. The walk itself is pure and lives in
 * `lineage-graph.ts`, and this module never re-implements it.
 *
 * WHY THIS IS NOT `getEntityLineage` (audit-lineage.functions.ts). That one
 * resolves an audit tag and follows FK columns on the entity's own row, which
 * is one hop, outward only. It never reads `artifact_lineage`, so it cannot
 * answer "what came after this". This one walks the edge table in both
 * directions and then resolves display data for whatever the walk found.
 *
 * THE CONSTRAINT THAT SHAPES EVERYTHING HERE: the kind strings in
 * `artifact_lineage` belong to no single vocabulary. `ARTIFACT_KINDS`
 * (lineage.functions.ts) says `prd`; `AUDIT_KINDS` (audit-id.ts) says `spec`
 * for the same table. Neither declares `changeset` or `deployment`, and both
 * are in live production data because `flows.functions.ts` inserts edges
 * directly, bypassing `recordLineage`'s zod enum. So this resolver NEVER
 * validates a kind and NEVER drops a node: a kind it cannot name comes back
 * with `resolved: false` and `title: null`, sitting in the right place in the
 * chain. A missing node silently shortens the chain and nobody can tell; an
 * unnamed one is visibly unnamed.
 *
 * Two rules keep it honest and cheap:
 *   - Titles are picked from a CANDIDATE LIST of columns, never a per-kind
 *     switch, so a new entity kind needs one map row and no title code.
 *   - Nodes are grouped by TABLE and read with a single `.in("id", ids)` each.
 *     A 40-node graph is ~8 queries, not 40. Grouping by table rather than by
 *     kind also collapses `prd` and `spec` into one read.
 *
 * RLS scopes every read to the caller. A node the caller cannot see comes back
 * unresolved, exactly like an unnameable kind, and never leaks a title.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { stripAutoPrefix } from "@/components/plan/format";
import {
  AUDIT_KINDS,
  auditShort,
  formatAuditId,
  parseAuditId,
  type AuditKind,
} from "@/lib/audit-id";
import {
  countLineage,
  NO_LINEAGE,
  walkLineage,
  type LineageCounts,
  type LineageEdgeRow,
  type LineageRef,
  type LineageStep,
} from "@/lib/lineage-graph";

/* -------------------------------------------------------------------------- */
/* The DB seam                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The three query shapes this module uses, and nothing else.
 *
 * Deliberately structural rather than `SupabaseClient<Database>`: every table
 * name here is a runtime string (that is the whole point of a vocabulary-
 * agnostic resolver), so the generated per-table types cannot apply anyway.
 * Naming the exact surface keeps the cast at the edge honest and lets the
 * tests hand in a fake that counts queries.
 */
type QueryResult = { data: unknown; error?: unknown };
type Selected = {
  in: (column: string, values: string[]) => PromiseLike<QueryResult>;
  or: (filter: string) => { limit: (n: number) => PromiseLike<QueryResult> };
  limit: (n: number) => PromiseLike<QueryResult>;
};
export type LineageDb = { from: (table: string) => { select: (columns: string) => Selected } };

/* -------------------------------------------------------------------------- */
/* Kind -> table                                                               */
/* -------------------------------------------------------------------------- */

/** Where a node kind's row lives, and the audit tag it can carry (if any). */
export type KindTarget = { table: string; audit: AuditKind | null };

/**
 * Every kind string this resolver can name, from BOTH vocabularies plus the
 * ones that exist only as edge-table strings.
 *
 * Every table and column referenced here was verified against
 * `src/integrations/supabase/types.ts`. That check is not optional: tsc does
 * not typecheck a `.select()` string, so a wrong table or column compiles
 * clean and fails at runtime.
 *
 * Absent on purpose: `roadmap_item`. It has no table. Four other files used to
 * map it to a `roadmap_items` table that has never existed in any migration,
 * and all four were fixed to drop the kind on 2026-07-30; the shared truth now
 * lives in `@/lib/artifact-tables`. Remapping it to `opportunities` was
 * considered and rejected there for a reason worth keeping: `roadmap_bucket` is
 * null on every opportunity in the live workspace, so the remap would have
 * resolved 100% of hits to non-roadmap rows while looking like it worked.
 * A `roadmap_item` node comes back unresolved, which is the truth until that is settled.
 */
export const KIND_TARGETS: Readonly<Record<string, KindTarget>> = {
  // The audit vocabulary, by its own names (signal, opportunity, decision,
  // spec, goal, prototype, mission, release, learning, meeting, memory, doc).
  ...Object.fromEntries(
    AUDIT_KINDS.map((k) => [k.kind, { table: k.table, audit: k.kind } as KindTarget]),
  ),
  // The lineage vocabulary's own name for a spec. Same table, so grouping by
  // table collapses the two into a single read.
  prd: { table: "prds", audit: "spec" },
  theme: { table: "themes", audit: null },
  task: { table: "tasks", audit: null },
  house_rule: { table: "house_rules", audit: null },
  design_memory: { table: "design_memory", audit: null },
  capability_change: { table: "capability_changes", audit: null },
  // The forward chain. In NEITHER vocabulary, and in live data: dropping these
  // would delete `mission -> changeset -> deployment -> learning` entirely.
  changeset: { table: "studio_changesets", audit: null },
  deployment: { table: "deployments", audit: null },
};

/* -------------------------------------------------------------------------- */
/* Generic column resolution                                                   */
/* -------------------------------------------------------------------------- */

/** First present, non-empty string value among candidate columns. */
function pick(row: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Candidate columns, most title-like first. Mirrors the approach in
 * `audit-lineage.functions.ts` so the two resolvers agree on what a title is,
 * extended for the tables only this module reaches: `deployments` has no title
 * at all (hence `environment`) and `capability_changes` carries `description`.
 * A candidate list, not a per-kind switch, so a new entity kind gets a title for
 * free the moment its map row exists.
 */
const TITLE_KEYS = [
  "title",
  "name",
  "summary",
  "headline",
  "label",
  "question",
  "goal",
  "problem",
  "rule_text",
  "description",
  "content",
  "body",
  "environment",
] as const;
const STATUS_KEYS = ["status", "state", "verdict", "phase", "stage"] as const;
const CREATED_KEYS = [
  "created_at",
  "createdAt",
  "inserted_at",
  "occurred_at",
  "deployed_at",
  "released_at",
] as const;

/* -------------------------------------------------------------------------- */
/* Result shape                                                                */
/* -------------------------------------------------------------------------- */

export type LineageNodeView = {
  kind: string;
  id: string;
  /**
   * Null when the kind maps to no table, or the row is not readable under the
   * caller's RLS, or the row genuinely has no title-like column. Never a reason
   * to omit the node.
   */
  title: string | null;
  status: string | null;
  /** ISO timestamp when the row carries one. */
  at: string | null;
  /** Canonical audit tag (`MIS·7E7D59`) for kinds that have a stage prefix. */
  ref: string | null;
  /** True only when a row was actually read. Distinguishes "no title column" from "not found". */
  resolved: boolean;
};

export type LineageGraphResult = {
  /** False when the input named nothing we could locate. The walk is then empty. */
  found: boolean;
  focus: LineageNodeView;
  upstream: LineageStep[];
  downstream: LineageStep[];
  nodes: LineageNodeView[];
  truncated: boolean;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Bounded read of the edge table. 43 edges in the founder's live workspace. */
const EDGE_LIMIT = 4000;
/** Bounded scan when turning a six-character audit short back into a uuid. */
const SHORT_SCAN_LIMIT = 2000;

const EDGE_COLS =
  "parent_kind,parent_id,child_kind,child_id,relation,rationale,created_by_agent,valid_to,invalidated_by";

/* -------------------------------------------------------------------------- */
/* Node resolution                                                             */
/* -------------------------------------------------------------------------- */

function unresolvedView(ref: LineageRef): LineageNodeView {
  const target = KIND_TARGETS[ref.kind];
  return {
    kind: ref.kind,
    id: ref.id,
    title: null,
    status: null,
    at: null,
    // The tag derives from the id alone, so it is knowable even when the row is
    // not. Showing it beats showing nothing.
    ref: target?.audit ? formatAuditId(target.audit, ref.id) : null,
    resolved: false,
  };
}

/**
 * Hydrate display data for a set of nodes: ONE query per distinct table.
 *
 * Grouping is by table, not by kind, so `prd` and `spec` share a single read.
 * A table that errors (missing relation, RLS refusal) leaves its nodes
 * unresolved rather than failing the whole graph: one unreadable entity type
 * must never blank the chain around it.
 */
export async function resolveNodeViews(
  db: LineageDb,
  refs: readonly LineageRef[],
): Promise<Map<string, LineageNodeView>> {
  const out = new Map<string, LineageNodeView>();
  const idsByTable = new Map<string, Set<string>>();

  for (const ref of refs) {
    const key = `${ref.kind}:${ref.id}`;
    if (out.has(key)) continue;
    out.set(key, unresolvedView(ref));
    const table = KIND_TARGETS[ref.kind]?.table;
    if (!table) continue;
    const bucket = idsByTable.get(table) ?? new Set<string>();
    bucket.add(ref.id);
    idsByTable.set(table, bucket);
  }

  const rowsByTable = new Map<string, Map<string, Record<string, unknown>>>();
  await Promise.all(
    [...idsByTable].map(async ([table, ids]) => {
      let rows: Array<Record<string, unknown>> = [];
      try {
        const res = await db
          .from(table)
          .select("*")
          .in("id", [...ids]);
        if (res.error) return;
        rows = (res.data ?? []) as Array<Record<string, unknown>>;
      } catch {
        return; // Unreadable table -> unresolved nodes, never a dropped node.
      }
      const byId = new Map<string, Record<string, unknown>>();
      for (const row of rows) if (typeof row.id === "string") byId.set(row.id, row);
      rowsByTable.set(table, byId);
    }),
  );

  for (const [key, view] of out) {
    const table = KIND_TARGETS[view.kind]?.table;
    const row = table ? rowsByTable.get(table)?.get(view.id) : undefined;
    if (!row) continue;
    const rawTitle = pick(row, TITLE_KEYS);
    // `[auto]` is a dedup marker from the trigger pipeline. It must never reach
    // a user, on any surface, so it is stripped here rather than at render.
    const title = rawTitle ? stripAutoPrefix(rawTitle) : null;
    out.set(key, {
      ...view,
      title: title ? title.slice(0, 200) : null,
      status: pick(row, STATUS_KEYS),
      at: pick(row, CREATED_KEYS),
      resolved: true,
    });
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/* Focus resolution                                                            */
/* -------------------------------------------------------------------------- */

/** The kind string the EDGE TABLE uses for this id, the only authority on it. */
export async function kindFromEdges(db: LineageDb, id: string): Promise<string | null> {
  // The uuid gate is load-bearing: `.or()` takes a raw PostgREST filter string,
  // so an unvalidated id would be an injection point.
  if (!UUID_RE.test(id)) return null;
  try {
    const res = await db
      .from("artifact_lineage")
      .select("parent_kind,parent_id,child_kind,child_id")
      .or(`parent_id.eq.${id},child_id.eq.${id}`)
      .limit(1);
    if (res.error) return null;
    const row = ((res.data ?? []) as Array<Record<string, unknown>>)[0];
    if (!row) return null;
    if (row.parent_id === id && typeof row.parent_kind === "string") return row.parent_kind;
    if (row.child_id === id && typeof row.child_kind === "string") return row.child_kind;
    return null;
  } catch {
    return null;
  }
}

/** Turn a six-character audit short (`7E7D59`) back into the full uuid. */
async function idFromShort(db: LineageDb, table: string, short: string): Promise<string | null> {
  try {
    const res = await db.from(table).select("id").limit(SHORT_SCAN_LIMIT);
    if (res.error) return null;
    const rows = (res.data ?? []) as Array<Record<string, unknown>>;
    const hit = rows.find((r) => typeof r.id === "string" && auditShort(r.id) === short);
    return (hit?.id as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * Work out which node the caller means, from any of the three input shapes.
 *
 * The kind attached to the focus always comes from the edge table when the edge
 * table knows it. That matters: an audit tag resolves to the kind `spec`, but
 * no edge in the table says `spec`, they all say `prd`. Focusing on the audit
 * vocabulary's word would walk from a node that exists nowhere and return an
 * empty graph for a spec with a full chain.
 */
export async function resolveFocus(
  db: LineageDb,
  input: { kind?: string; id?: string; ref?: string },
): Promise<LineageRef | null> {
  const kind = input.kind?.trim();
  const rawId = input.id?.trim();
  const rawRef = input.ref?.trim();

  // 1. An explicit kind. The id is normally a uuid; tolerate an audit short so
  //    a caller passing { kind: "mission", id: "7E7D59" } is not silently given
  //    an empty graph.
  if (kind && rawId) {
    if (UUID_RE.test(rawId)) return { kind, id: rawId };
    const table = KIND_TARGETS[kind]?.table;
    if (!table) return null;
    const id = await idFromShort(db, table, auditShort(rawId));
    return id ? { kind, id } : null;
  }

  const token = rawRef ?? rawId;
  if (!token) return null;

  // 2. An audit tag: MIS·7E7D59, opp-005c82, dec_8976c0.
  const parsed = parseAuditId(token);
  if (parsed) {
    const id = await idFromShort(db, parsed.meta.table, parsed.short);
    if (!id) return null;
    return { kind: (await kindFromEdges(db, id)) ?? parsed.kind, id };
  }

  // 3. A bare uuid: ask the edge table what kind it is.
  if (UUID_RE.test(token)) {
    const kindFromTable = await kindFromEdges(db, token);
    return kindFromTable ? { kind: kindFromTable, id: token } : null;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* The server function                                                         */
/* -------------------------------------------------------------------------- */

function emptyResult(kind: string, id: string): LineageGraphResult {
  return {
    found: false,
    focus: unresolvedView({ kind, id }),
    upstream: [],
    downstream: [],
    nodes: [],
    truncated: false,
  };
}

const InputSchema = z
  .object({
    kind: z.string().trim().min(1).max(60).optional(),
    id: z.string().trim().min(1).max(80).optional(),
    ref: z.string().trim().min(2).max(80).optional(),
    maxDepth: z.number().int().min(1).max(12).optional(),
    maxNodes: z.number().int().min(1).max(200).optional(),
  })
  .refine((v) => Boolean(v.id ?? v.ref), { message: "Give an id or a ref." });

export const getLineageGraph = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => InputSchema.parse(i))
  .handler(async ({ context, data }): Promise<LineageGraphResult> => {
    // Cast at the edge, once: every table name below is a runtime string, so
    // the generated per-table types cannot narrow anything here.
    const db = context.supabase as unknown as LineageDb;

    const focus = await resolveFocus(db, data);
    if (!focus) return emptyResult(data.kind ?? "unknown", data.id ?? data.ref ?? "");

    let edges: LineageEdgeRow[] = [];
    const res = await db.from("artifact_lineage").select(EDGE_COLS).limit(EDGE_LIMIT);
    if (!res.error) edges = (res.data ?? []) as LineageEdgeRow[];

    // Superseded edges are filtered inside walkLineage by `isLiveEdge`, which
    // stays the single gate for that decision.
    const walk = walkLineage(focus, edges, { maxDepth: data.maxDepth, maxNodes: data.maxNodes });
    const views = await resolveNodeViews(db, [focus, ...walk.nodes]);
    const view = (ref: LineageRef) => views.get(`${ref.kind}:${ref.id}`) ?? unresolvedView(ref);

    return {
      found: true,
      focus: view(focus),
      upstream: walk.upstream,
      downstream: walk.downstream,
      nodes: walk.nodes.map(view),
      truncated: walk.truncated,
    };
  });

/* -------------------------------------------------------------------------- */
/* One read that answers a whole board (S2's half of §0.5)                     */
/* -------------------------------------------------------------------------- */

/**
 * `getLineageGraph` resolves ONE entity per call, which is right for the sheet
 * and wrong for a list. S2's board draws 34 rows and §0.5 asks for "one line on
 * each, clickable"; they shipped the clickable half and stopped, because through
 * that reader the line is **34 round trips on the first paint of the only
 * surface a person lands on** — the same defect they filed against
 * `getApprovalsQueue` the same afternoon. This takes the ids and returns counts.
 *
 * Scoped by the caller's RLS client exactly like `getLineageGraph`: nothing here
 * reaches `supabaseAdmin`, so a board can only count edges its owner can read.
 */
const CountsInput = z.object({
  kind: z.string().trim().min(1).max(60),
  ids: z.array(z.string().trim().regex(UUID_RE)).min(1).max(200),
});

export type LineageCountsResult = {
  /** `null` means THE READ FAILED — never a board with no lineage (F-76). */
  counts: Record<string, LineageCounts> | null;
};

export const getLineageCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CountsInput.parse(i))
  .handler(async ({ context, data }): Promise<LineageCountsResult> => {
    const db = context.supabase as unknown as LineageDb;

    // Both directions in one read. `.or` takes a RAW PostgREST filter string, so
    // the uuid check in the validator is load-bearing here exactly as it is in
    // `kindFromEdges` — an unvalidated id would be an injection point.
    const list = data.ids.join(",");
    const res = await db
      .from("artifact_lineage")
      .select(`${EDGE_COLS},seeded`)
      .or(`parent_id.in.(${list}),child_id.in.(${list})`)
      .limit(EDGE_LIMIT);
    // A FAILED READ IS NOT A BOARD WITH NO LINEAGE. Returning zeroes would draw
    // "nothing produced any of this" out of a database error, on the one surface
    // whose whole claim is that the loop connects things up.
    if (res.error) return { counts: null };

    const counted = countLineage(
      data.ids.map((id) => ({ kind: data.kind, id })),
      (res.data ?? []) as Array<LineageEdgeRow & { seeded?: boolean | null }>,
    );
    const counts: Record<string, LineageCounts> = {};
    for (const id of data.ids) counts[id] = counted.get(`${data.kind}:${id}`) ?? { ...NO_LINEAGE };
    return { counts };
  });
