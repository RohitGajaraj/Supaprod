/**
 * The lineage walk: where a thing came from, and what it caused. Pure, no I/O.
 *
 * FOUNDER RULING 2026-07-30: "if I give the ID it should also show me the
 * connected lineages. If I'm typing something about the build it should say
 * that it has come from this design spec, from this PRD, and this originated
 * from this signal. And past that, if a learning and memory is already shipped
 * out, it should show what happened after this build, so that it stays like an
 * interconnected knowledge graph."
 *
 * WHAT EXISTS ALREADY, AND WHY IT IS NOT ENOUGH. `getEntityLineage`
 * (audit-lineage.functions.ts) resolves an audit tag and follows FOREIGN-KEY
 * COLUMNS ON THE ENTITY'S OWN ROW: `signal_id`, `prd_id`, `mission_id` and so
 * on. That is one hop, outward only, and only where a FK column happens to
 * exist. It never reads `artifact_lineage`, which is the actual edge table.
 * So it structurally cannot answer "what came after this", which is the half
 * the founder cares about and the half that proves the record compounds.
 *
 * THE EDGES ARE REAL AND ALREADY RECORDED. A read of the founder's own
 * workspace found 43 edges spanning the whole loop, including it closing back
 * on itself:
 *
 *   theme -> opportunity -> decision -> prd -> mission -> changeset
 *                                                            |
 *                    learning <- deployment <----------------+
 *                       |
 *                       +--> decision      (the loop closing)
 *                       +--> opportunity
 *
 * THE TRAP, and it decides the whole design. The kind strings in that table
 * belong to NO single vocabulary. `ARTIFACT_KINDS` (lineage.functions.ts)
 * declares thirteen and calls a spec `prd`; `AUDIT_KINDS` (audit-id.ts)
 * declares twelve and calls the same thing `spec`. Neither contains
 * `changeset` or `deployment`, and both appear in live data, because
 * `flows.functions.ts:163` and friends insert into `artifact_lineage`
 * directly, bypassing `recordLineage`'s zod enum.
 *
 * A walk validated against either vocabulary would therefore silently drop
 * `mission -> changeset -> deployment -> learning`, which is the ENTIRE
 * forward chain. So this module is deliberately vocabulary-agnostic: it walks
 * whatever kinds the table holds, resolves the ones it can name, and reports
 * the ones it cannot as unresolved rather than deleting them from the graph.
 * An unnamed node in the right place beats a missing node every time, because
 * a missing node silently shortens the chain and nobody can tell.
 */

/** One edge as the table stores it, narrowed to what a walk needs. */
export type LineageEdgeRow = {
  parent_kind: string;
  parent_id: string;
  child_kind: string;
  child_id: string;
  relation: string | null;
  rationale: string | null;
  created_by_agent: string | null;
  /** Set when the edge was superseded. A closed edge is history, not lineage. */
  valid_to: string | null;
  invalidated_by: string | null;
};

export type LineageRef = { kind: string; id: string };

export type LineageStep = {
  from: LineageRef;
  to: LineageRef;
  relation: string | null;
  rationale: string | null;
  byAgent: string | null;
  /** Hops from the focus. 1 is adjacent. */
  distance: number;
};

export type LineageWalk = {
  /** Toward the origin: what this came from. Nearest first. */
  upstream: LineageStep[];
  /** Toward the outcome: what this caused. Nearest first. */
  downstream: LineageStep[];
  /** Every distinct node touched, excluding the focus. */
  nodes: LineageRef[];
  /** True when the walk hit its own limits and the graph continues past it. */
  truncated: boolean;
};

/** `kind:id`, the identity of a node inside one walk. */
export function nodeKey(ref: LineageRef): string {
  return `${ref.kind}:${ref.id}`;
}

/**
 * HOW MANY THINGS PRODUCED THIS, AND HOW MANY IT FED. One line per row on a
 * board, without one graph walk per row.
 *
 * ── WHY A COUNT RATHER THAN A WALK ──────────────────────────────────────────
 * `getLineageGraph` resolves ONE entity per call. §0.5 asks for "one line on
 * each, clickable" and S2 shipped the clickable half; the line needs a number on
 * 34 board rows, which through that reader is 34 round trips **on the first
 * paint of the only surface a person lands on** — the same defect S2 filed
 * against `getApprovalsQueue` the same afternoon. This answers the whole board
 * from one read.
 *
 * ── ADJACENT ONLY, AND THAT IS THE HONEST NUMBER FOR A LINE ─────────────────
 * These are direct edges, not reachable-set sizes. A transitive count would make
 * two rows incomparable — a mission three hops from a big cluster would outscore
 * one that genuinely produced five things — and it cannot be checked by eye
 * against the chain the sheet draws when you click. **The line and the sheet
 * must agree**, and the sheet opens on the neighbours.
 *
 * ── FIXTURES ARE EXCLUDED AND THE EXCLUSION IS REPORTED ─────────────────────
 * `artifact_lineage.seeded` marks a demo edge. Measured 2026-08-31: 2,142 edges,
 * **283 seeded**, 1,859 real — 13%, which is more than enough to move a small
 * per-row count. Counting them would put a fixture behind a number a person
 * reads as evidence. **`seededExcluded` is returned rather than dropped**, under
 * the rule adopted the same day: a count of how much is real must say which flag
 * it cleared. A row showing `producedBy: 0, seededExcluded: 4` is a different
 * fact from one showing `0, 0`, and only one of them is a gap in the product.
 */
export type LineageCounts = {
  /** Live, non-seeded edges where this is the CHILD — what produced it. */
  producedBy: number;
  /** Live, non-seeded edges where this is the PARENT — what it fed. */
  fed: number;
  /** Live edges touching this that were left out for being demo fixtures. */
  seededExcluded: number;
};

export const NO_LINEAGE: LineageCounts = { producedBy: 0, fed: 0, seededExcluded: 0 };

export function countLineage(
  refs: readonly LineageRef[],
  edges: readonly (LineageEdgeRow & { seeded?: boolean | null })[],
): Map<string, LineageCounts> {
  const out = new Map<string, LineageCounts>();
  // Every ref asked for gets an entry, so a caller can tell "counted, and it is
  // zero" from "this id was never looked at". Absence would otherwise read as
  // zero at the call site, which is the default-as-data trap one layer up.
  for (const ref of refs) out.set(nodeKey(ref), { ...NO_LINEAGE });

  for (const e of edges) {
    if (!isLiveEdge(e)) continue;
    const parent = out.get(nodeKey({ kind: e.parent_kind, id: e.parent_id }));
    const child = out.get(nodeKey({ kind: e.child_kind, id: e.child_id }));
    if (!parent && !child) continue;
    if (e.seeded) {
      // Counted once per endpoint that was asked about, never twice for a
      // self-edge, which the guards below `if (parent && child)` also cover.
      if (parent) parent.seededExcluded += 1;
      if (child && child !== parent) child.seededExcluded += 1;
      continue;
    }
    if (parent) parent.fed += 1;
    if (child && child !== parent) child.producedBy += 1;
  }
  return out;
}

/**
 * An edge that has been superseded is history, not lineage.
 *
 * `valid_to` and `invalidated_by` exist because a link can be corrected: a
 * spec re-parented, a decision reversed. Walking a closed edge would show a
 * provenance the record has explicitly retracted, which is worse than showing
 * none, because it is a confident wrong answer.
 */
export function isLiveEdge(e: LineageEdgeRow): boolean {
  return e.valid_to === null && e.invalidated_by === null;
}

/**
 * Walk both directions from a focus node.
 *
 * Breadth-first, so `distance` is the true shortest hop count and the nearest
 * cause is reported before a remoter one. Cycles are real in this graph, by
 * design: a learning can re-open the decision that produced it, which is the
 * loop closing and the single most valuable edge in the product. So the walk
 * tracks visited nodes rather than assuming a tree, and a cycle terminates
 * instead of hanging.
 *
 * `maxNodes` bounds the result and `truncated` reports when it bit. A silently
 * truncated graph reads as a complete one, which would let the surface claim a
 * chain ends where it merely stopped looking.
 */
export function walkLineage(
  focus: LineageRef,
  edges: LineageEdgeRow[],
  opts: { maxDepth?: number; maxNodes?: number } = {},
): LineageWalk {
  const maxDepth = opts.maxDepth ?? 6;
  const maxNodes = opts.maxNodes ?? 60;
  const live = edges.filter(isLiveEdge);

  // Adjacency in both directions, built once.
  const parentsOf = new Map<string, LineageEdgeRow[]>();
  const childrenOf = new Map<string, LineageEdgeRow[]>();
  for (const e of live) {
    const childKey = nodeKey({ kind: e.child_kind, id: e.child_id });
    const parentKey = nodeKey({ kind: e.parent_kind, id: e.parent_id });
    parentsOf.set(childKey, [...(parentsOf.get(childKey) ?? []), e]);
    childrenOf.set(parentKey, [...(childrenOf.get(parentKey) ?? []), e]);
  }

  let truncated = false;
  /* Every node either walk reaches, for the caller's node list. Kept SEPARATE
   * from each walk's own visited set, see below. */
  const touched = new Set<string>();

  function bfs(direction: "up" | "down"): LineageStep[] {
    /* EACH DIRECTION GETS ITS OWN VISITED SET, and sharing one was a real bug
     * this module's cycle test caught. With a shared set, the upstream walk ran
     * first, consumed every node in a cyclic graph into `seen`, and the
     * downstream walk then found every neighbour already visited and returned
     * NOTHING: a decision that caused a spec, a mission and a learning reported
     * no consequences at all.
     *
     * The deeper problem was that the answer depended on which direction ran
     * first, which is never acceptable. A node is legitimately both an ancestor
     * and a descendant when the loop closes, and the loop closing is the most
     * valuable edge in this product. */
    const seen = new Set<string>([nodeKey(focus)]);
    const out: LineageStep[] = [];
    let frontier: LineageRef[] = [focus];
    for (let distance = 1; distance <= maxDepth && frontier.length; distance += 1) {
      const next: LineageRef[] = [];
      for (const node of frontier) {
        const adjacency = direction === "up" ? parentsOf : childrenOf;
        for (const e of adjacency.get(nodeKey(node)) ?? []) {
          const other: LineageRef =
            direction === "up"
              ? { kind: e.parent_kind, id: e.parent_id }
              : { kind: e.child_kind, id: e.child_id };
          const key = nodeKey(other);
          if (seen.has(key)) continue;
          if (touched.size >= maxNodes) {
            truncated = true;
            continue;
          }
          seen.add(key);
          if (key !== nodeKey(focus)) touched.add(key);
          next.push(other);
          out.push({
            // The step always reads in the direction of causation, whichever
            // way we are walking: parent caused child. Flipping it for the
            // upstream walk would render "the spec came from the mission".
            from: { kind: e.parent_kind, id: e.parent_id },
            to: { kind: e.child_kind, id: e.child_id },
            relation: e.relation,
            rationale: e.rationale,
            byAgent: e.created_by_agent,
            distance,
          });
        }
      }
      if (next.length && distance === maxDepth) truncated = true;
      frontier = next;
    }
    return out;
  }

  const upstream = bfs("up");
  const downstream = bfs("down");
  const nodes = [...touched].map((k) => {
    // Split on the FIRST colon only: a uuid contains none, but a kind never
    // will either, and splitting on all of them would corrupt any id format
    // that does.
    const i = k.indexOf(":");
    return { kind: k.slice(0, i), id: k.slice(i + 1) };
  });

  return { upstream, downstream, nodes, truncated };
}
