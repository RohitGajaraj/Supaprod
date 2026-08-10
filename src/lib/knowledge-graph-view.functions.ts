// O1 / DBR-1 v1 - the server seam for the knowledge-graph explorer.
//
// Reads the caller's `artifact_lineage` (RLS-scoped) with a bounded both-ways
// walk from a focus artifact, hydrates artifact titles, and hands the rows to
// the pure `projectGraph` core. Fail-safe by contract: any failure returns an
// empty graph, never throws to the UI. Spec: docs/features/knowledge-graph-explorer.md
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { artifactTable } from "@/lib/artifact-tables";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  projectGraph,
  nodeKey,
  pickLineageFocus,
  isOutcomeVerdict,
  DEFAULT_BOUNDS,
  GRAPH_NODE_KINDS,
  type GraphNodeKind,
  type GraphBounds,
  type KnowledgeGraph,
  type OutcomeVerdict,
  type RawLineageEdge,
} from "./knowledge-graph-view";
import { cleanTitle } from "@/components/plan/format";

const KindSchema = z.enum(GRAPH_NODE_KINDS);

/**
 * A FRESH empty graph each call. Never return a shared singleton: on Cloudflare
 * Workers module-level state is shared across requests in an isolate, so a
 * by-reference empty would be mutable shared state.
 */
function emptyGraph(): KnowledgeGraph {
  return {
    nodes: [],
    edges: [],
    focusKey: null,
    stats: { nodeCount: 0, edgeCount: 0, rootSignals: 0, maxRing: 0 },
    truncated: false,
  };
}

/* Kind -> table + title column comes from the one shared map (`@/lib/artifact-tables`),
   the same one lineage.functions.ts reads. A kind with no entry there (today:
   `roadmap_item`, which has no backing table) is skipped, so the node keeps its id-derived
   label on the canvas instead of claiming a title it could not read. */

/**
 * `created_by_agent` joined the base set 2026-08-02. It has always been a column
 * on `artifact_lineage`, it has always been populated, and it was never read: the
 * canvas could draw that two things were connected and had no way to say who
 * said so. A graph with rationale but no author is an anonymous claim, and the
 * whole product argument is that a claim carries its receipt.
 */
const LINEAGE_COLS =
  "id,parent_kind,parent_id,child_kind,child_id,relation,rationale,created_by_agent,created_at";
/**
 * Same row plus the bi-temporal `valid_to` stamp AND the `inference` provenance blob
 * (edge-confidence, DBR-EDGE-CONF). Both columns shipped in the same migration
 * (`20260621030000`), so the single `valid_to` probe below gates both. Used once the
 * migration is live; otherwise the base set is returned and the canvas degrades cleanly.
 */
const LINEAGE_COLS_BITEMPORAL = `${LINEAGE_COLS},valid_to,inference`;

/** A PostgREST "column does not exist" error (42703) - the pre-migration signal for `valid_to`. */
export function isMissingColumnError(
  err: { code?: string; message?: string } | null | undefined,
): boolean {
  if (!err) return false;
  if (err.code === "42703") return true;
  const m = (err.message ?? "").toLowerCase();
  return m.includes("does not exist") && m.includes("valid_to");
}

/**
 * Pick the lineage column set for THIS request: prefer the bi-temporal columns,
 * but fall back to the base set if `valid_to` is not live yet (the DBR-1.5 migration
 * applies on the founder's next publish). One cheap probe keeps the BFS itself simple
 * and means adding `valid_to` here can never 42703 the whole graph to empty.
 */
export async function resolveLineageCols(supabase: SupabaseClient): Promise<string> {
  try {
    const { error } = await supabase.from("artifact_lineage").select("valid_to").limit(1);
    return isMissingColumnError(error) ? LINEAGE_COLS : LINEAGE_COLS_BITEMPORAL;
  } catch {
    return LINEAGE_COLS;
  }
}

/** Batch `.in()` id lists so a PostgREST URL can never run long, even at the node cap. */
const IN_BATCH = 25;
export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

type FocusNode = { kind: GraphNodeKind; id: string };

/** Pick the focus: the explicit one, else the caller's most recent decision / opportunity / prd. */
async function resolveFocus(
  supabase: SupabaseClient,
  ws: string | null,
  focusKind?: GraphNodeKind,
  focusId?: string,
): Promise<FocusNode | null> {
  if (focusKind && focusId) return { kind: focusKind, id: focusId };
  const fallbacks: [GraphNodeKind, string][] = [
    ["decision", "decisions"],
    ["opportunity", "opportunities"],
    ["prd", "prds"],
  ];
  for (const [kind, table] of fallbacks) {
    // Scoped too, and this one matters as much as the edges: the auto-focus
    // picks the caller's most recent artifact across every workspace RLS
    // permits, so an unscoped focus anchors the whole graph on another
    // workspace's newest decision and every edge walked from it is that
    // workspace's.
    let q = supabase.from(table).select("id").order("created_at", { ascending: false }).limit(1);
    if (ws) q = q.eq("workspace_id", ws);
    const { data } = await q;
    const id = (data as { id?: string }[] | null)?.[0]?.id;
    if (id) return { kind, id };
  }
  return null;
}

/**
 * Lineage-anchored focus: the child of the caller's most recent `artifact_lineage`
 * edge (RLS-scoped). Used only as a FALLBACK when the decision-centric focus has no
 * lineage of its own - so a workspace that HAS edges never renders the empty state
 * just because its newest decision happens to be disconnected from the graph.
 */
async function resolveLineageFocus(
  supabase: SupabaseClient,
  ws: string | null,
  cols: string,
): Promise<FocusNode | null> {
  let q = supabase
    .from("artifact_lineage")
    .select(cols)
    .order("created_at", { ascending: false })
    .limit(1);
  if (ws) q = q.eq("workspace_id", ws);
  const { data } = await q;
  // Same dynamic-`cols` cast the BFS uses (defeats the client's row-type inference).
  return pickLineageFocus((data ?? []) as unknown as RawLineageEdge[]);
}

/** Bounded both-directions BFS over artifact_lineage. Collects edges + visited node ids. */
async function fetchSubgraph(
  supabase: SupabaseClient,
  ws: string | null,
  focus: FocusNode,
  bounds: GraphBounds,
  cols: string,
): Promise<{ edges: RawLineageEdge[]; nodes: Map<string, FocusNode> }> {
  const nodes = new Map<string, FocusNode>([[nodeKey(focus.kind, focus.id), focus]]);
  const edges: RawLineageEdge[] = [];
  const edgeIds = new Set<string>();
  let frontier: FocusNode[] = [focus];
  let depth = 0;

  while (frontier.length && depth < bounds.maxDepth && nodes.size < bounds.maxNodes) {
    depth++;
    const byKind = new Map<GraphNodeKind, string[]>();
    for (const n of frontier) {
      const arr = byKind.get(n.kind) ?? [];
      arr.push(n.id);
      byKind.set(n.kind, arr);
    }
    const next: FocusNode[] = [];
    for (const [kind, ids] of byKind) {
      for (const batch of chunk(ids, IN_BATCH)) {
        // Parallelize the two independent queries: parents (up) and children (down).
        // Both queries on the same batch can run concurrently instead of serially.
        // BOTH directions carry the workspace filter. Scoping one and not the
        // other would walk out of the workspace on every second hop and pull
        // the neighbourhood back in with it, which is harder to notice than no
        // scoping at all because the graph would look mostly right.
        let upQ = supabase
          .from("artifact_lineage")
          .select(cols)
          .eq("child_kind", kind)
          .in("child_id", batch);
        let downQ = supabase
          .from("artifact_lineage")
          .select(cols)
          .eq("parent_kind", kind)
          .in("parent_id", batch);
        if (ws) {
          upQ = upQ.eq("workspace_id", ws);
          downQ = downQ.eq("workspace_id", ws);
        }
        const [{ data: up }, { data: down }] = await Promise.all([upQ, downQ]);
        // The dynamic `cols` string defeats the client's row-type inference (it
        // returns GenericStringError[]); cast through unknown, the same escape hatch
        // hydrateTitles uses for its dynamic table name.
        const rows = [
          ...((up ?? []) as unknown as RawLineageEdge[]),
          ...((down ?? []) as unknown as RawLineageEdge[]),
        ];
        for (const e of rows) {
          if (!edgeIds.has(e.id)) {
            edgeIds.add(e.id);
            edges.push(e);
          }
          const ends: FocusNode[] = [
            { kind: e.parent_kind, id: e.parent_id },
            { kind: e.child_kind, id: e.child_id },
          ];
          for (const end of ends) {
            const key = nodeKey(end.kind, end.id);
            if (!nodes.has(key) && nodes.size < bounds.maxNodes) {
              nodes.set(key, end);
              next.push(end);
            }
          }
        }
      }
    }
    frontier = next;
  }
  return { edges, nodes };
}

/** Hydrate titles for every visited node, grouped by table. */
async function hydrateTitles(
  supabase: SupabaseClient,
  nodes: Map<string, FocusNode>,
): Promise<Map<string, string>> {
  const byKind = new Map<GraphNodeKind, string[]>();
  for (const { kind, id } of nodes.values()) {
    const arr = byKind.get(kind) ?? [];
    arr.push(id);
    byKind.set(kind, arr);
  }
  const titleMap = new Map<string, string>();
  for (const [kind, ids] of byKind) {
    const spec = artifactTable(kind);
    if (!spec) continue;
    // Dynamic table name needs a cast (the typed client can't infer it), the
    // same pattern lineage.functions.ts uses for title hydration.
    const { data } = await (
      supabase as unknown as {
        from: (t: string) => {
          select: (s: string) => { in: (c: string, v: string[]) => Promise<{ data: unknown }> };
        };
      }
    )
      .from(spec.table)
      .select(`id, ${spec.titleCol}`)
      .in("id", ids);
    for (const row of (data as Array<Record<string, unknown>> | null) ?? []) {
      const id = row.id as string | undefined;
      const title = row[spec.titleCol];
      // Cleaned here because this map feeds the WHOLE graph surface: the
      // record regions, the node story, the force canvas, the node actions and
      // the tree view. lineage-graph.functions.ts got this strip when the leak
      // was first reported and the OTHER TWO graph pipelines were missed, which
      // is the recurring shape of this bug: a fix lands on one sibling.
      if (id) titleMap.set(nodeKey(kind, id), typeof title === "string" ? cleanTitle(title) : "");
    }
  }
  return titleMap;
}

/**
 * How each recorded outcome in the subgraph turned out.
 *
 * A SECOND, NARROW READ rather than a widened title contract. `artifactTable`
 * gives one table and one title column per kind, which is all the other three
 * hydration paths need; teaching it about a second column for one kind would
 * change a shared map to serve one caller. `learnings.verdict` is the one field
 * that makes the outcome a first-class thing to explore rather than a node with
 * a sentence on it, so it gets its own bounded query, batched like every other
 * `.in()` here.
 *
 * FAIL-SAFE AND NEVER GUESSED. A verdict that does not load stays absent, and an
 * absent verdict renders as an unknown outcome rather than a win. A read surface
 * that defaults unknown outcomes to "validated" is the exact failure this whole
 * surface exists to prevent.
 */
async function hydrateOutcomes(
  supabase: SupabaseClient,
  nodes: Map<string, FocusNode>,
): Promise<Map<string, OutcomeVerdict>> {
  const ids: string[] = [];
  for (const { kind, id } of nodes.values()) if (kind === "learning") ids.push(id);
  const out = new Map<string, OutcomeVerdict>();
  if (ids.length === 0) return out;
  try {
    for (const batch of chunk(ids, IN_BATCH)) {
      const { data } = await supabase.from("learnings").select("id,verdict").in("id", batch);
      for (const row of (data as Array<{ id?: string; verdict?: unknown }> | null) ?? []) {
        if (row?.id && isOutcomeVerdict(row.verdict)) {
          out.set(nodeKey("learning", row.id), row.verdict);
        }
      }
    }
  } catch {
    // An unreadable verdict column is "we do not know", which is what an empty
    // map already says. Never let it take the whole graph down.
  }
  return out;
}

/**
 * O1: the typed knowledge-graph around a focus artifact. RLS-scoped, bounded,
 * fail-safe. With no focus, centres on the caller's most recent decision.
 */
export const getKnowledgeGraph = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        focusKind: KindSchema.optional(),
        focusId: z.string().uuid().optional(),
        /**
         * The workspace whose graph this is. OPTIONAL for back-compatibility;
         * every workspace-scoped surface must pass it.
         *
         * `artifact_lineage` has carried a `workspace_id` since migration
         * 20260625094923 and this read never used it. Its RLS is
         * `auth.uid() = user_id`, so membership was the only gate and the
         * graph spanned every workspace the caller had ever written in.
         * Measured 2026-08-10: 4 of the 5 multi-workspace users belong to a
         * seeded demo workspace, so "N pieces of work and the M links between
         * them" was drawn over a mixture.
         *
         * Zero rows in artifact_lineage carry a null workspace, so filtering
         * hides nothing.
         */
        workspaceId: z.string().uuid().optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }): Promise<KnowledgeGraph> => {
    const { supabase } = context;
    const ws = data.workspaceId ?? null;
    try {
      const cols = await resolveLineageCols(supabase);
      let focus = await resolveFocus(supabase, ws, data.focusKind, data.focusId);
      let sub = focus ? await fetchSubgraph(supabase, ws, focus, DEFAULT_BOUNDS, cols) : null;
      // Lineage-anchored fallback: when the auto-focus (most recent decision) is
      // disconnected from the workspace's lineage, re-anchor on a node that actually
      // participates in an edge so the canvas never shows the empty state while edges
      // exist. Only for the auto-focus path - an explicit focus the user clicked is
      // always respected, even when it stands alone.
      if (!data.focusId && (!focus || !sub || sub.edges.length === 0)) {
        const lineageFocus = await resolveLineageFocus(supabase, ws, cols);
        if (lineageFocus) {
          focus = lineageFocus;
          sub = await fetchSubgraph(supabase, ws, lineageFocus, DEFAULT_BOUNDS, cols);
        }
      }
      if (!focus || !sub) return emptyGraph();
      const focusKey = nodeKey(focus.kind, focus.id);
      const [titleMap, outcomes] = await Promise.all([
        hydrateTitles(supabase, sub.nodes),
        hydrateOutcomes(supabase, sub.nodes),
      ]);
      return projectGraph(sub.edges, titleMap, focusKey, DEFAULT_BOUNDS, outcomes);
    } catch {
      return emptyGraph();
    }
  });
